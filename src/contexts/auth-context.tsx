
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/lib/types'; 

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseAuthUser | null;
  login: (userId: string, password?: string) => Promise<{ success: boolean, message: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
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
          } else {
             setUser({ uid: fbUser.uid, ...userData });
          }
        } else {
          // This case can happen if a user is created in Auth but not in Firestore.
          console.error(`No user document found for UID: ${fbUser.uid}. Logging out.`);
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  // This effect handles redirection based on auth state.
  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
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
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged listener will handle fetching user data and redirecting
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
    router.push('/login');
  };
  
   if (loading) {
    return <div className="flex h-screen w-full items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, logout, loading }}>
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
