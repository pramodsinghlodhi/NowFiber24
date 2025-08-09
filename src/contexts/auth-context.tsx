
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
      if (currentFbUser) {
        setFirebaseUser(currentFbUser);
      } else {
        // User logged out
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
        return; // Wait for firebaseUser to be set
    }

    // This is the main listener for the user's profile document.
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
      let roleUnsubscribe: Unsubscribe = () => {};

      if (userDoc.exists() && !userDoc.data().isBlocked) {
        const userData = { uid: userDoc.id, ...userDoc.data() } as User;
        setUser(userData);
        
        // Based on the user's role, set up another listener for role-specific data.
        if (userData.role === 'Admin') {
            const settingsDocRef = doc(db, 'settings', 'live');
            roleUnsubscribe = onSnapshot(settingsDocRef, (settingsDoc) => {
                setTechnician(null); // Ensure technician data is cleared for admin
                if (settingsDoc.exists()) {
                    setSettings(settingsDoc.data() as Settings);
                }
                setLoading(false); // Admin data is loaded (or doesn't exist), stop loading.
            });
        } else if (userData.role === 'Technician') {
            const techDocRef = doc(db, 'technicians', userData.id);
            roleUnsubscribe = onSnapshot(techDocRef, (techDoc) => {
                setSettings(null); // Ensure settings data is cleared for technician
                if (techDoc.exists()) {
                    setTechnician({ id: techDoc.id, ...techDoc.data() } as Technician);
                } else {
                    setTechnician(null); // Handle case where technician doc might be missing
                }
                setLoading(false); // Technician data is loaded (or doesn't exist), stop loading.
            });
        } else {
             // If user has no specific role, just stop loading.
             setTechnician(null);
             setSettings(null);
             setLoading(false);
        }
      } else {
        // User doc doesn't exist, or the user is blocked. Log them out.
        if (userDoc.exists() && userDoc.data().isBlocked) {
            console.warn("User is blocked. Logging out.");
        }
        handleLogout();
      }
      
      // Cleanup function for the role-specific listener
      return () => {
          roleUnsubscribe();
      };
    }, (error) => {
      console.error("Error fetching user profile:", error);
      handleLogout();
    });

    return () => unsubscribeUser();
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
