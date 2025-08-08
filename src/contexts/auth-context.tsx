
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { getAuth, signOut, onIdTokenChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, Technician, Settings } from '@/lib/types'; 

interface AuthContextType {
  user: User | null;
  technician: Technician | null;
  settings: Settings | null;
  firebaseUser: FirebaseAuthUser | null;
  login: (userId: string, password?: string) => Promise<{ success: boolean, message: string }>; // This can be removed soon
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

  useEffect(() => {
    const unsubscribeAuth = onIdTokenChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      // We no longer fetch user profile here. It will be handled by the layout.
      if (!fbUser) {
        setUser(null);
        setTechnician(null);
        setSettings(null);
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);
  
  // This effect now only fetches supplemental real-time data for an already-authenticated user.
  useEffect(() => {
    let userUnsubscribe: Unsubscribe | undefined;
    let techUnsubscribe: Unsubscribe | undefined;
    let settingsUnsubscribe: Unsubscribe | undefined;

    if (firebaseUser) {
        userUnsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), (userDoc) => {
             if (userDoc.exists() && !userDoc.data().isBlocked) {
                const userData = { uid: firebaseUser.uid, ...userDoc.data() } as User;
                setUser(userData);
             } else {
                 setUser(null);
             }
        });
    }

    if (user) {
        if (user.role === 'Admin') {
            settingsUnsubscribe = onSnapshot(doc(db, 'settings', 'live'), 
                (settingsDoc) => {
                    if (settingsDoc.exists()) setSettings(settingsDoc.data() as Settings);
                },
                (error) => console.error("Error fetching settings:", error.message)
            );
        } else if (user.role === 'Technician') {
            techUnsubscribe = onSnapshot(doc(db, 'technicians', user.id), (techDoc) => {
                if (techDoc.exists()) setTechnician(techDoc.data() as Technician);
            });
        }
    }

    return () => {
        if (userUnsubscribe) userUnsubscribe();
        if (techUnsubscribe) techUnsubscribe();
        if (settingsUnsubscribe) settingsUnsubscribe();
    };
}, [firebaseUser, user?.id, user?.role]);


  const login = async (userId: string, password?: string): Promise<{ success: boolean, message: string }> => {
    // This function is now deprecated in favor of server-side session handling
    // but kept for compatibility during transition.
    console.warn("Client-side login function is deprecated.");
    return { success: false, message: "Please use the login page." };
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    await fetch('/api/sessionLogout', { method: 'POST' }); // Clear the session cookie
    setUser(null);
    setTechnician(null);
    setSettings(null);
    setFirebaseUser(null);
    router.push('/login');
    setLoading(false);
  };
  
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
