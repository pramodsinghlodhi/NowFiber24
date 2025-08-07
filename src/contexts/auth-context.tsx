
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
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
    let unsubscribeTechnician: Unsubscribe | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (unsubscribeTechnician) unsubscribeTechnician();

      if (fbUser) {
        // Force refresh the token to get custom claims on every auth state change.
        await fbUser.getIdToken(true); 
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'uid'>;

            if (userData.isBlocked) {
                await signOut(auth);
                setUser(null);
                setTechnician(null);
                setSettings(null);
            } else {
                const fullUser = { uid: fbUser.uid, ...userData };
                setUser(fullUser);
                setFirebaseUser(fbUser);

                if (fullUser.role === 'Admin') {
                    // Fetch settings once for admin
                    const settingsDocRef = doc(db, 'settings', 'live');
                    try {
                        const settingsDoc = await getDoc(settingsDocRef);
                        if (settingsDoc.exists()) {
                            setSettings(settingsDoc.data() as Settings);
                        }
                    } catch (error: any) {
                        console.error("Error fetching admin settings:", error.message);
                    }
                } else if (fullUser.role === 'Technician') {
                    // Set up a listener for the technician's profile
                    const techDocRef = doc(db, 'technicians', fullUser.id);
                    unsubscribeTechnician = onSnapshot(techDocRef, (techDoc) => {
                        if (techDoc.exists()) {
                            setTechnician({ id: techDoc.id, ...techDoc.data() } as Technician);
                        } else {
                            setTechnician(null);
                        }
                    });
                }
            }
        } else {
          // No user document found, treat as logged out
          await signOut(auth);
          setUser(null);
          setTechnician(null);
          setSettings(null);
          setFirebaseUser(null);
        }
      } else {
        // User is logged out
        setUser(null);
        setTechnician(null);
        setSettings(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeTechnician) unsubscribeTechnician();
    }
  }, []);
  
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
    
    const email = `${userId}@fibervision.com`;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data()?.isBlocked) {
            await signOut(auth);
            return { success: false, message: 'Your account has been blocked. Please contact an administrator.' };
        }

        const idToken = await fbUser.getIdToken();

        await fetch('/api/sessionLogin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
        
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
