
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
    const unsubscribeAuth = onAuthStateChanged(auth, (currentFbUser) => {
      setLoading(true); // Start loading whenever auth state might change
      if (currentFbUser) {
        setFirebaseUser(currentFbUser);
      } else {
        // User logged out or no user found
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
    let unsubscribeUser: Unsubscribe | undefined;
    let unsubscribeRoleSpecific: Unsubscribe | undefined;

    if (firebaseUser) {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
        if (userDoc.exists() && !userDoc.data().isBlocked) {
          const userData = { uid: userDoc.id, ...userDoc.data() } as User;
          setUser(userData);

          // Clean up previous role listener before creating a new one
          if (unsubscribeRoleSpecific) {
            unsubscribeRoleSpecific();
            setTechnician(null); // Reset role-specific state
            setSettings(null);
          }
          
          if (userData.role === 'Admin') {
            const settingsDocRef = doc(db, 'settings', 'live');
            unsubscribeRoleSpecific = onSnapshot(settingsDocRef, (settingsDoc) => {
                setSettings(settingsDoc.exists() ? (settingsDoc.data() as Settings) : null);
                setLoading(false); // Done loading for Admin
            });
          } else if (userData.role === 'Technician') {
            const techDocRef = doc(db, 'technicians', userData.id);
            unsubscribeRoleSpecific = onSnapshot(techDocRef, (techDoc) => {
                setTechnician(techDoc.exists() ? ({ id: techDoc.id, ...techDoc.data() } as Technician) : null);
                setLoading(false); // Done loading for Technician
            });
          } else {
            // User has a profile but no specific role, stop loading
            setLoading(false);
          }
        } else {
          // User document doesn't exist or user is blocked
          handleLogout();
        }
      }, (error) => {
        console.error("Error fetching user profile:", error);
        handleLogout();
      });
    } else {
      // No firebaseUser, so not loading.
      setLoading(false);
    }
    
    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeRoleSpecific) unsubscribeRoleSpecific();
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
