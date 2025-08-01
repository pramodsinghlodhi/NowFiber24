
"use client";

import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Technician, Task } from '@/lib/types';
import TasksList from '@/components/dashboard/tasks-list';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TasksPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    const tasksQuery = useMemo(() => {
        if (!user) return null;
        return user.role === 'Admin' 
            ? collection(db, 'tasks') 
            : query(collection(db, 'tasks'), where('tech_id', '==', user.id));
    }, [user]);

    const { data: tasks, loading: loadingTasks } = useFirestoreQuery<Task>(tasksQuery!);
    const { data: technicians, loading: loadingTechs } = useFirestoreQuery<Technician>(collection(db, 'technicians'));

    const { inProgressTasks, pendingTasks, completedTasks } = useMemo(() => {
        const inProgress = tasks.filter(task => task.status === 'In Progress');
        const pending = tasks.filter(task => task.status === 'Pending');
        const completed = tasks.filter(task => task.status === 'Completed');
        return { inProgressTasks: inProgress, pendingTasks: pending, completedTasks: completed };
    }, [tasks]);

    const loading = authLoading || loadingTasks || loadingTechs;

    if (loading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Loading Tasks...</p>
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
                            <TasksList tasks={inProgressTasks} technicians={technicians} />
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
                           <TasksList tasks={pendingTasks} technicians={technicians} />
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
                           <TasksList tasks={completedTasks} technicians={technicians} />
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
