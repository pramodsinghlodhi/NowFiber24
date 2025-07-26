
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { mockUsers, User } from '@/lib/data';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  login: (id: string, password?: string) => { success: boolean, message: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else if (pathname !== '/login') {
            router.push('/login');
        }
    } catch (error) {
        console.error("Could not parse user from localStorage", error);
        localStorage.removeItem('user');
        if (pathname !== '/login') {
            router.push('/login');
        }
    }
  }, [pathname, router]);

  const login = (id: string, password?: string): { success: boolean, message: string } => {
    const foundUser = mockUsers.find(u => u.id === id && u.password === password);
    if (foundUser) {
      if (foundUser.isBlocked) {
        return { success: false, message: 'Your account has been blocked. Please contact an administrator.' };
      }
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
      return { success: true, message: 'Welcome back!' };
    }
    return { success: false, message: 'Invalid credentials. Please try again.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
