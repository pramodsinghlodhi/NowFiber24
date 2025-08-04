
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
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
          const userData = { id: userDoc.id, ...userDoc.data() } as User;
          if (userData.isBlocked) {
             console.warn(`Blocked user with UID ${fbUser.uid} attempted to sign in.`);
             await signOut(auth); // Sign out the blocked user
             setUser(null);
          } else {
             setUser(userData);
          }
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
    
    try {
        // 1. Find user in Firestore by their custom ID
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("id", "==", userId), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, message: 'Invalid User ID.' };
        }
        
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as User;

        if (userData.isBlocked) {
            return { success: false, message: 'This account has been blocked by an administrator.' };
        }

        // 2. Construct email and attempt sign-in
        const email = `${userId}@fibervision.com`;
        await signInWithEmailAndPassword(auth, email, password);

        // onAuthStateChanged will handle setting the user state and redirecting
        return { success: true, message: 'Welcome back!' };

    } catch (error: any) {
       console.error("Login Error:", error.code, error.message);
       if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
           return { success: false, message: 'Invalid password. Please try again.' };
       }
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
           return { success: false, message: 'This User ID is not registered in our authentication system.' };
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
