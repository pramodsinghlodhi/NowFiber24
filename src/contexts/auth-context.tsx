
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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        // If user logs out on the client, clear all state
        setUser(null);
        setTechnician(null);
        setSettings(null);
        setLoading(false);
      }
      // The initial user data load is now primarily handled by the session
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let userUnsubscribe: Unsubscribe | undefined;
    let techUnsubscribe: Unsubscribe | undefined;
    let settingsUnsubscribe: Unsubscribe | undefined;
    
    setLoading(true);

    if (firebaseUser) {
        userUnsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), 
            async (userDoc) => {
                if (userDoc.exists() && !userDoc.data().isBlocked) {
                    const fullUser = { uid: userDoc.id, ...userDoc.data() } as User;
                    setUser(fullUser);

                    if (fullUser.role === 'Admin') {
                        // For Admin, fetch settings. Since settings don't change often,
                        // a real-time listener isn't strictly necessary, but we'll use it
                        // for consistency. The key is to only attach it AFTER the user's
                        // role is confirmed to be Admin.
                        try {
                           const refreshedIdToken = await firebaseUser.getIdToken(true);
                           const settingsDocRef = doc(db, 'settings', 'live');
                           settingsUnsubscribe = onSnapshot(settingsDocRef, (settingsDoc) => {
                                if (settingsDoc.exists()) {
                                    setSettings(settingsDoc.data() as Settings);
                                }
                           }, (error) => {
                                console.error("Error fetching settings:", error.message);
                           });
                        } catch (tokenError) {
                            console.error("Error refreshing token for settings fetch:", tokenError);
                        }
                    } else if (fullUser.role === 'Technician') {
                        const techDocRef = doc(db, 'technicians', fullUser.id);
                        techUnsubscribe = onSnapshot(techDocRef, (techDoc) => {
                            if (techDoc.exists()) {
                                setTechnician(techDoc.data() as Technician);
                            }
                        });
                    }
                } else {
                    // User document doesn't exist or is blocked
                    setUser(null);
                    setTechnician(null);
                    setSettings(null);
                }
                setLoading(false);
            }, 
            (error) => {
                console.error("Error fetching user profile:", error);
                setLoading(false);
            }
        );
    } else {
        setLoading(false); // No firebase user, not loading
    }
  
    return () => {
        if (userUnsubscribe) userUnsubscribe();
        if (techUnsubscribe) techUnsubscribe();
        if (settingsUnsubscribe) settingsUnsubscribe();
    };
  }, [firebaseUser]);


  const logout = async () => {
    setLoading(true);
    await signOut(auth); // Sign out from client-side Firebase auth
    await fetch('/api/sessionLogout', { method: 'POST' }); // Clear the server-side session cookie
    setUser(null);
    setTechnician(null);
    setSettings(null);
    setFirebaseUser(null);
    router.push('/login');
    // setLoading is handled by the useEffect hook when firebaseUser becomes null
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
