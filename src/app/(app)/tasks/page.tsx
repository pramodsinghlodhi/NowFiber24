
"use client";

import { Technician, Task } from '@/lib/types';
import TasksList from '@/components/dashboard/tasks-list';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import CreateTaskForm from '@/components/tasks/create-task-form';
import { createTask } from '../actions';
import { useToast } from '@/hooks/use-toast';

function TaskColumnSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function TasksPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    const tasksQuery = useMemo(() => {
        if (!user) return null;
        const q = user.role === 'Admin' 
            ? collection(db, 'tasks')
            : query(collection(db, 'tasks'), where('tech_id', '==', user.id));
        return query(q, orderBy('status')); // Simple ordering
    }, [user]);
    
    const techniciansQuery = useMemo(() => query(collection(db, 'technicians')), []);

    const { data: tasks, loading: loadingTasks } = useFirestoreQuery<Task>(tasksQuery);
    const { data: technicians, loading: loadingTechs } = useFirestoreQuery<Technician>(techniciansQuery);

    const { inProgressTasks, pendingTasks, completedTasks } = useMemo(() => {
        const inProgress = tasks.filter(task => task.status === 'In Progress');
        const pending = tasks.filter(task => task.status === 'Pending');
        const completed = tasks.filter(task => task.status === 'Completed');
        return { inProgressTasks: inProgress, pendingTasks: pending, completedTasks: completed };
    }, [tasks]);

    const handleSaveTask = async (taskData: Omit<Task, 'id' | 'completionTimestamp'>) => {
        const result = await createTask(taskData);
        if (result.success) {
            toast({ title: 'Task Created', description: `New task has been created with ID: ${result.id}`});
            setIsCreateFormOpen(false);
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    }

    const loading = authLoading || loadingTasks || loadingTechs;

    if (loading || !user) {
        return (
            <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                 <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <TaskColumnSkeleton />
                    <TaskColumnSkeleton />
                    <TaskColumnSkeleton />
                </div>
            </main>
        );
    }

  return (
    <>
    <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
         <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            {user.role === 'Admin' && (
                <Button onClick={() => setIsCreateFormOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Task
                </Button>
            )}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>In Progress</CardTitle>
                    <CardDescription>
                        Tasks that are currently being worked on.
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
                        A queue of upcoming jobs for the team.
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
                        A log of recently completed jobs.
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
    <CreateTaskForm 
        isOpen={isCreateFormOpen}
        onOpenChange={setIsCreateFormOpen}
        onSave={handleSaveTask}
        technicians={technicians}
    />
    </>
  );
}
