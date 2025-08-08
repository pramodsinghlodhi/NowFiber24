
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

    useEffect(() => {
        // This check is simplified as the server-side session should handle redirection.
        // This is a client-side fallback.
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    if (loading) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <p>Loading...</p>
            </div>
        )
    }

    if (!user) {
        // This state should ideally not be reached if middleware is effective.
        // But it's a good fallback.
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <p>Redirecting to login...</p>
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
