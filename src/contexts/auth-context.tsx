
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { getAuth, signOut, onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
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

  // Step 1: Listen only for Firebase auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        // Force refresh the token to get the latest custom claims
        await fbUser.getIdToken(true);
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

  // Step 2: Listen for user profile changes, dependent on firebaseUser
  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
      if (userDoc.exists() && !userDoc.data().isBlocked) {
        setUser({ uid: userDoc.id, ...userDoc.data() } as User);
      } else {
        // User profile doesn't exist or is blocked
        setUser(null);
        setTechnician(null);
        setSettings(null);
        if (userDoc.data()?.isBlocked) {
          console.warn("User is blocked.");
          logout();
        }
      }
      // We will set loading to false in the next effect
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setUser(null);
      setLoading(false);
    });

    return () => unsubscribeUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  // Step 3: Fetch role-specific data, dependent on the user profile
  useEffect(() => {
    let techUnsubscribe: Unsubscribe | undefined;
    let settingsUnsubscribe: Unsubscribe | undefined;

    if (user) {
      if (user.role === 'Admin') {
        const settingsDocRef = doc(db, 'settings', 'live');
        settingsUnsubscribe = onSnapshot(settingsDocRef, (settingsDoc) => {
          if (settingsDoc.exists()) {
            setSettings(settingsDoc.data() as Settings);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching admin settings:", error.message);
          setLoading(false);
        });
      } else if (user.role === 'Technician') {
        const techDocRef = doc(db, 'technicians', user.id);
        techUnsubscribe = onSnapshot(techDocRef, (techDoc) => {
          if (techDoc.exists()) {
            setTechnician({ id: techDoc.id, ...techDoc.data() } as Technician);
          } else {
            setTechnician(null);
          }
        });
        // Also fetch settings for technicians
        const settingsDocRef = doc(db, 'settings', 'live');
        settingsUnsubscribe = onSnapshot(settingsDocRef, (settingsDoc) => {
            if (settingsDoc.exists()) {
                setSettings(settingsDoc.data() as Settings);
            }
        }, (error) => {
            console.error("Error fetching settings for technician:", error.message);
        });
        setLoading(false);
      }
    } else if (!firebaseUser) {
        setLoading(false);
    }
    
    return () => {
      if (techUnsubscribe) techUnsubscribe();
      if (settingsUnsubscribe) settingsUnsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setUser(null);
    setTechnician(null);
    setSettings(null);
    setFirebaseUser(null);
    router.push('/login');
    router.refresh();
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
