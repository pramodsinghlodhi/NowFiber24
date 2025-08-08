
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { getAuth, signOut, onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { doc, onSnapshot, getDoc, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, Technician, Settings } from '@/lib/types'; 

interface AuthContextType {
  user: User | null;
  technician: Technician | null;
  settings: Settings | null;
  firebaseUser: FirebaseAuthUser | null;
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
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setTechnician(null);
        setSettings(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    let userUnsubscribe: Unsubscribe | undefined;
    let techUnsubscribe: Unsubscribe | undefined;

    const cleanup = () => {
      if (userUnsubscribe) userUnsubscribe();
      if (techUnsubscribe) techUnsubscribe();
    };

    userUnsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), 
      async (userDoc) => {
        if (userDoc.exists() && !userDoc.data().isBlocked) {
          const fullUser = { uid: userDoc.id, ...userDoc.data() } as User;
          setUser(fullUser);

          // Cleanup previous listeners before setting new ones
          if (techUnsubscribe) techUnsubscribe();
          
          if (fullUser.role === 'Admin') {
            setTechnician(null);
            try {
              // THIS IS THE CRITICAL FIX: Force a token refresh to get custom claims
              await firebaseUser.getIdToken(true);
              const settingsDoc = await getDoc(doc(db, 'settings', 'live'));
              if (settingsDoc.exists()) {
                setSettings(settingsDoc.data() as Settings);
              }
            } catch(error: any) {
               console.error("Error fetching admin settings:", error.message);
            }
          } else if (fullUser.role === 'Technician') {
            setSettings(null);
            techUnsubscribe = onSnapshot(doc(db, 'technicians', fullUser.id), (techDoc) => {
              if (techDoc.exists()) {
                setTechnician({ id: techDoc.id, ...techDoc.data() } as Technician);
              } else {
                setTechnician(null);
              }
            });
          }
        } else {
          setUser(null);
          setTechnician(null);
          setSettings(null);
          if (userDoc.data()?.isBlocked) {
            console.warn("User is blocked.");
            logout();
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching user profile:", error);
        setLoading(false);
      }
    );

    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/sessionLogout', { method: 'POST' });
      await signOut(auth);
    } catch (error) {
        console.error("Logout failed:", error);
    } finally {
        router.push('/login');
        setUser(null);
        setTechnician(null);
        setSettings(null);
        setFirebaseUser(null);
        setLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, technician, settings, firebaseUser, logout, loading }}>
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
