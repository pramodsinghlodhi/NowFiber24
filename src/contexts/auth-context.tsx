
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { getAuth, signOut, onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe, getDoc } from 'firebase/firestore';
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
        setLoading(false);
        setUser(null);
        setTechnician(null);
        setSettings(null);
      } else {
        setLoading(true);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser) {
      return;
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
      if (userDoc.exists() && !userDoc.data().isBlocked) {
        const userData = { uid: userDoc.id, ...userDoc.data() } as User;
        setUser(userData);
      } else {
        // User doc doesn't exist or is blocked, treat as logged out
        setUser(null);
        setTechnician(null);
        setSettings(null);
        setLoading(false);
        if (userDoc.exists() && userDoc.data().isBlocked) {
          console.warn("User is blocked.");
          logout();
        }
      }
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setUser(null);
      setTechnician(null);
      setSettings(null);
      setLoading(false);
    });

    return () => unsubscribeUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  useEffect(() => {
    if (!user) {
        if (!firebaseUser) setLoading(false);
        return;
    }

    let roleUnsubscribe: Unsubscribe = () => {};

    if (user.role === 'Admin') {
        const settingsDocRef = doc(db, 'settings', 'live');
        roleUnsubscribe = onSnapshot(settingsDocRef, (settingsDoc) => {
            if (settingsDoc.exists()) {
                setSettings(settingsDoc.data() as Settings);
            }
            setTechnician(null);
            setLoading(false);
        });
    } else if (user.role === 'Technician') {
        const techDocRef = doc(db, 'technicians', user.id);
        roleUnsubscribe = onSnapshot(techDocRef, (techDoc) => {
            if (techDoc.exists()) {
                setTechnician({ id: techDoc.id, ...techDoc.data() } as Technician);
            } else {
                setTechnician(null);
            }
            setSettings(null);
            setLoading(false);
        });
    } else {
        // No specific role data to load, just stop loading
        setTechnician(null);
        setSettings(null);
        setLoading(false);
    }

    return () => roleUnsubscribe();
  }, [user, firebaseUser]);


  const logout = async () => {
    try {
      await signOut(auth);
      await fetch('/api/sessionLogout', { method: 'POST' });
    } catch (error) {
        console.error("Logout failed:", error);
    } finally {
      // Clear all state immediately
      setFirebaseUser(null);
      setUser(null);
      setTechnician(null);
      setSettings(null);
      setLoading(false);
      router.push('/login');
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
