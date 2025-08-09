
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { getAuth, signOut, onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
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

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userUnsubscribe = onSnapshot(userDocRef, (userDoc) => {
      if (userDoc.exists() && !userDoc.data().isBlocked) {
        const fullUser = { uid: userDoc.id, ...userDoc.data() } as User;
        setUser(fullUser);
        setLoading(false); // User profile is loaded
      } else {
        if (userDoc.exists() && userDoc.data().isBlocked) {
            console.warn("User is blocked.");
            logout();
        } else {
            // User document doesn't exist, treat as not logged in
            setUser(null);
        }
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setUser(null);
      setLoading(false);
    });

    return () => userUnsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);


  useEffect(() => {
    let techUnsubscribe: Unsubscribe | undefined;
    let settingsUnsubscribe: Unsubscribe | undefined;

    const cleanup = () => {
        if (techUnsubscribe) techUnsubscribe();
        if (settingsUnsubscribe) settingsUnsubscribe();
    };

    if (user) {
        if (user.role === 'Admin') {
            const settingsDocRef = doc(db, 'settings', 'live');
            settingsUnsubscribe = onSnapshot(settingsDocRef, (settingsDoc) => {
                if (settingsDoc.exists()) {
                    setSettings(settingsDoc.data() as Settings);
                }
            }, (error) => {
                console.error("Error fetching admin settings:", error.message);
            });
            setTechnician(null); // Ensure tech profile is cleared for admins
        } else if (user.role === 'Technician') {
            const techDocRef = doc(db, 'technicians', user.id);
            techUnsubscribe = onSnapshot(techDocRef, (techDoc) => {
                if (techDoc.exists()) {
                    setTechnician({ id: techDoc.id, ...techDoc.data() } as Technician);
                } else {
                    setTechnician(null);
                }
            });
            setSettings(null); // Ensure settings are cleared for technicians
        }
    } else {
        cleanup();
    }
    
    return cleanup;

  }, [user]);

  const logout = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener will handle the state cleanup
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
