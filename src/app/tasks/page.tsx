
"use client";

import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { mockTasks, mockTechnicians, Task } from '@/lib/data';
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

    const { userTasks, inProgressTasks, pendingTasks, completedTasks } = useMemo(() => {
        if (!user) {
            return { userTasks: [], inProgressTasks: [], pendingTasks: [], completedTasks: [] };
        }
        const tasks = user.role === 'Admin' ? mockTasks : mockTasks.filter(task => task.tech_id === user.id);
        const inProgress = tasks.filter(task => task.status === 'In Progress');
        const pending = tasks.filter(task => task.status === 'Pending');
        const completed = tasks.filter(task => task.status === 'Completed');
        return { userTasks: tasks, inProgressTasks: inProgress, pendingTasks: pending, completedTasks: completed };
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
        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-1">
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
                            <p className="text-muted-foreground text-sm">No tasks currently in progress.</p>
                        )}
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-1">
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
                            <p className="text-muted-foreground text-sm">No pending tasks.</p>
                        )}
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Completed</CardTitle>
                        <CardDescription>
                            Recently completed jobs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {completedTasks.length > 0 ? (
                           <TasksList tasks={completedTasks} />
                        ) : (
                            <p className="text-muted-foreground text-sm">No tasks completed yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
