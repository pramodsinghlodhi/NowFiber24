
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

  const handleLogout = async () => {
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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
        setFirebaseUser(fbUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (firebaseUser === undefined) {
      // Still waiting for the initial auth state from onAuthStateChanged
      return;
    }
    
    setLoading(true);

    if (!firebaseUser) {
        setUser(null);
        setTechnician(null);
        setSettings(null);
        setLoading(false);
        return;
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
        if (!userDoc.exists()) {
            // This can happen if the user was deleted from Firestore but not Auth
            handleLogout();
            return;
        }

        const userData = { uid: userDoc.id, ...userDoc.data() } as User;
        setUser(userData);

        let unsubscribeRoleSpecific: Unsubscribe | undefined;

        if (userData.role === 'Admin') {
            const settingsDocRef = doc(db, 'settings', 'live');
            unsubscribeRoleSpecific = onSnapshot(settingsDocRef, (settingsDoc) => {
                setTechnician(null); // Ensure technician data is cleared for admin
                setSettings(settingsDoc.exists() ? (settingsDoc.data() as Settings) : null);
                setLoading(false);
            });
        } else if (userData.role === 'Technician') {
            const techDocRef = doc(db, 'technicians', userData.id);
            unsubscribeRoleSpecific = onSnapshot(techDocRef, (techDoc) => {
                setSettings(null); // Ensure admin settings are cleared for technician
                setTechnician(techDoc.exists() ? ({ id: techDoc.id, ...techDoc.data() } as Technician) : null);
                setLoading(false);
            });
        } else {
            // User with no specific role data to fetch
            setTechnician(null);
            setSettings(null);
            setLoading(false);
        }

        // Return a cleanup function for the role-specific listener
        return () => {
            if (unsubscribeRoleSpecific) {
                unsubscribeRoleSpecific();
            }
        };
    }, (error) => {
        console.error("Error listening to user profile:", error);
        handleLogout();
    });

    // Return a cleanup function for the user listener
    return () => {
        unsubscribeUser();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);
  
  return (
    <AuthContext.Provider value={{ user, technician, settings, firebaseUser, logout: handleLogout, loading }}>
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
