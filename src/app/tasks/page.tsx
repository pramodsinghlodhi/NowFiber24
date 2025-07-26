
"use client";

import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { mockTasks } from '@/lib/data';
import TasksList from '@/components/dashboard/tasks-list';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function TasksPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
        router.push('/login');
        }
    }, [user, router]);

    if (!user) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Skeleton className="h-full w-full" />
            </div>
        );
    }
    
    const userTasks = user.role === 'Admin' ? mockTasks : mockTasks.filter(task => task.tech_id === user.id);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Card>
                <CardHeader>
                    <CardTitle>My Tasks</CardTitle>
                    <CardDescription>
                        {user.role === 'Admin' ? 'Viewing all tasks across the network.' : 'Here are your assigned tasks.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TasksList tasks={userTasks} />
                </CardContent>
            </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
