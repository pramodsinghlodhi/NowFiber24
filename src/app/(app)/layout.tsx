
'use client';

import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MobileNav from '@/components/layout/mobile-nav';


export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <p>Loading...</p>
            </div>
        )
    }

    // Since the middleware handles the redirection for unauthenticated users,
    // this check is now a fallback for edge cases, like a deleted user whose session is still valid.
    if (!user) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <p>No user profile found or user is blocked. Redirecting to login...</p>
            </div>
        )
    }

  return (
     <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="pb-16 md:pb-0">
            {children}
        </div>
        <MobileNav />
      </SidebarInset>
    </SidebarProvider>
  )
}
