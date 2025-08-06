
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, Technician, Settings } from '@/lib/types'; 

interface AuthContextType {
  user: User | null;
  technician: Technician | null;
  settings: Settings | null;
  firebaseUser: FirebaseAuthUser | null;
  login: (userId: string, password?: string) => Promise<{ success: boolean, message: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Listener for application-wide settings
    const settingsDocRef = doc(db, 'settings', 'live');
    const unsubscribeSettings = onSnapshot(settingsDocRef, (doc) => {
        if (doc.exists()) {
            setSettings(doc.data() as Settings);
        }
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Fetch user profile from Firestore using the UID from Auth 
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'uid'>;
            // Check if user is blocked before setting the state
            if (userData.isBlocked) {
                console.warn(`Blocked user with UID ${fbUser.uid} attempted to sign in.`);
                await signOut(auth); // Force sign out for blocked user
                setUser(null);
                setTechnician(null);
            } else {
                const fullUser = { uid: fbUser.uid, ...userData };
                setUser(fullUser);
                // If user is a technician, set up a real-time listener for their technician data
                if (fullUser.role === 'Technician') {
                    const techDocRef = doc(db, 'technicians', fullUser.id);
                    onSnapshot(techDocRef, (techDoc) => {
                        if (techDoc.exists()) {
                            setTechnician({ id: techDoc.id, ...techDoc.data() } as Technician);
                        } else {
                            setTechnician(null);
                        }
                    });
                } else {
                    setTechnician(null);
                }
            }
        } else {
          console.error(`No user document found for UID: ${fbUser.uid}. Logging out.`);
          await signOut(auth);
          setUser(null);
          setTechnician(null);
        }
      } else {
        setUser(null);
        setTechnician(null);
      }
      setLoading(false);
    });

    return () => {
        unsubscribeAuth();
        unsubscribeSettings();
    }
  }, []);
  
  // This effect handles redirection based on auth state.
  useEffect(() => {
    if (!loading && !user && !['/login', '/'].includes(pathname)) {
        router.push('/login');
    }
  }, [loading, user, pathname, router]);

  const login = async (userId: string, password?: string): Promise<{ success: boolean, message: string }> => {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
        return { success: false, message: 'User ID must be a non-empty string.' };
    }
    
    if (!password) {
        return { success: false, message: 'Password is required for all users.' };
    }
    
    // The email is constructed from the User ID. This must match the email in Firebase Auth.
    const email = `${userId}@fibervision.com`;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        // Verify user is not blocked before proceeding
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data()?.isBlocked) {
            await signOut(auth);
            return { success: false, message: 'Your account has been blocked. Please contact an administrator.' };
        }

        // Get the ID token after successful sign-in
        const idToken = await fbUser.getIdToken();

        // Send the ID token to the session login API route
        await fetch('/api/sessionLogin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
        
        // onAuthStateChanged listener will handle fetching user data,
        // but we can manually redirect here for a faster user experience.
        router.push('/dashboard');
        
        return { success: true, message: 'Welcome back!' };
    } catch (error: any) {
       console.error("Login Error:", error.code, error.message);
       if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
           return { success: false, message: 'Invalid User ID or Password.' };
       }
      if (error.code === 'auth/operation-not-allowed') {
        return { success: false, message: 'Email/Password sign-in is not enabled in your Firebase project.' };
      }
      return { success: false, message: 'An unexpected error occurred. Please try again.' };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    setTechnician(null);
    router.push('/');
  };
  
   if (loading && !['/login', '/'].includes(pathname)) {
    return <div className="flex h-screen w-full items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <AuthContext.Provider value={{ user, technician, settings, firebaseUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
