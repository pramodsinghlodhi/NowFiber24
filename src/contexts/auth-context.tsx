
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
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
        // Fetch user profile from Firestore
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() } as User);
        } else {
          console.error(`No user document found for UID: ${fbUser.uid}`);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [loading, user, pathname, router]);

  const login = async (userId: string, password?: string): Promise<{ success: boolean, message: string }> => {
    if (!password) {
        return { success: false, message: 'Password is required.' };
    }
    
    // Construct email from userId
    const email = `${userId}@fibervision.com`;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user and redirecting
      return { success: true, message: 'Welcome back!' };
    } catch (error: any) {
       if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email' || error.code === 'auth/wrong-password') {
           return { success: false, message: 'Invalid credentials. Please ensure the user exists in Firebase Authentication and the credentials are correct.' };
       }
      return { success: false, message: 'An unexpected error occurred. Please try again.' };
    }
  };

  const logout = async () => {
    await signOut(auth);
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
