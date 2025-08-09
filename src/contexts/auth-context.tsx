
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
      setLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
      } else {
        setFirebaseUser(null);
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
      return;
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, async (userDoc) => {
      if (userDoc.exists() && !userDoc.data().isBlocked) {
        const userData = { uid: userDoc.id, ...userDoc.data() } as User;
        setUser(userData);

        if (userData.role === 'Admin') {
            const settingsDocRef = doc(db, 'settings', 'live');
            const settingsDoc = await getDoc(settingsDocRef);
            if (settingsDoc.exists()) {
                setSettings(settingsDoc.data() as Settings);
            }
            setTechnician(null);
            setLoading(false);
        } else if (userData.role === 'Technician') {
            const techDocRef = doc(db, 'technicians', userData.id);
            const techDoc = await getDoc(techDocRef);
            if (techDoc.exists()) {
                setTechnician({ id: techDoc.id, ...techDoc.data() } as Technician);
            }
            setSettings(null);
            setLoading(false);
        } else {
            // No specific role data to load
            setLoading(false);
        }

      } else {
        if (userDoc.exists() && userDoc.data().isBlocked) {
            console.warn("User is blocked.");
            logout(); // This will trigger the auth state change and cleanup
        } else {
            // User document doesn't exist, treat as logged out
            setUser(null);
            setTechnician(null);
            setSettings(null);
            setLoading(false);
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

  const logout = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener will handle resetting state and loading
      await fetch('/api/sessionLogout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
        console.error("Logout failed:", error);
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
