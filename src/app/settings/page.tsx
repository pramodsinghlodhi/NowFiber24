"use client";

import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        if (user.role !== 'Admin') {
            router.push('/');
        }
    }, [user, router]);

    if (!user || user.role !== 'Admin') {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                 <p>Unauthorized. Redirecting...</p>
            </div>
        );
    }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Manage application settings. (Admin only)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                            <p className="text-sm text-muted-foreground">
                                Toggle the application's dark theme.
                            </p>
                        </div>
                        <Switch id="dark-mode" defaultChecked/>
                    </div>
                     <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="notifications" className="text-base">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive email notifications for critical alerts.
                            </p>
                        </div>
                        <Switch id="notifications" />
                    </div>
                    <Button>Save Preferences</Button>
                </CardContent>
            </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
