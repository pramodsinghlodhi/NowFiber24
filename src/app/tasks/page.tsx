
"use client";

import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { mockTasks, Task } from '@/lib/data';
import TasksList from '@/components/dashboard/tasks-list';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
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

    const { userTasks, inProgressTasks, pendingTasks } = useMemo(() => {
        if (!user) {
            return { userTasks: [], inProgressTasks: [], pendingTasks: [] };
        }
        const tasks = user.role === 'Admin' ? mockTasks : mockTasks.filter(task => task.tech_id === user.id);
        const inProgress = tasks.filter(task => task.status === 'In Progress');
        const pending = tasks.filter(task => task.status === 'Pending');
        return { userTasks: tasks, inProgressTasks: inProgress, pendingTasks: pending };
    }, [user]);

    if (!user) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Skeleton className="h-full w-full" />
            </div>
        );
    }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>In Progress</CardTitle>
                        <CardDescription>
                            Tasks you are currently working on.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {inProgressTasks.length > 0 ? (
                            <TasksList tasks={inProgressTasks} />
                        ) : (
                            <p className="text-muted-foreground">No tasks currently in progress.</p>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Pending Tasks</CardTitle>
                        <CardDescription>
                            Your queue of upcoming jobs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingTasks.length > 0 ? (
                           <TasksList tasks={pendingTasks} />
                        ) : (
                            <p className="text-muted-foreground">No pending tasks.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
