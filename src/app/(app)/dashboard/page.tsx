
"use client";

import { useEffect, useMemo } from 'react';
import { useRouter }from 'next/navigation';
import { Technician, Task, Alert, Stats, User } from '@/lib/types';
import StatsCard from '@/components/dashboard/stats-card';
import TasksList from '@/components/dashboard/tasks-list';
import AlertsList from '@/components/dashboard/alerts-list';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { Users, Wifi, Siren, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Admin-specific queries
  const techniciansQuery = useMemo(() => user?.role === 'Admin' ? query(collection(db, 'technicians')) : null, [user]);
  const alertsQuery = useMemo(() => user?.role === 'Admin' ? query(collection(db, 'alerts')) : null, [user]);
  const usersQuery = useMemo(() => user?.role === 'Admin' ? query(collection(db, 'users'), where('role', '==', 'Technician')) : null, [user]);

  const { data: technicians, loading: loadingTechs } = useFirestoreQuery<Technician>(techniciansQuery);
  const { data: alerts, loading: loadingAlerts } = useFirestoreQuery<Alert>(alertsQuery);
  const { data: techUsers, loading: loadingTechUsers } = useFirestoreQuery<User>(usersQuery);
  
  // Role-based task query
  const tasksQuery = useMemo(() => {
    if (!user) return null;
    // Admin gets all tasks, Technician gets only their own tasks for efficiency
    return user.role === 'Admin' 
      ? query(collection(db, 'tasks'))
      : query(collection(db, 'tasks'), where('tech_id', '==', user.uid)); // Query by UID
  }, [user]);

  const { data: tasks, loading: loadingTasks } = useFirestoreQuery<Task>(tasksQuery);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const stats: Stats & { myOpenTasks?: number } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = tasks.filter(t => {
        if (t.status === 'Completed' && t.completionTimestamp) {
            const completionDate = t.completionTimestamp.toDate ? t.completionTimestamp.toDate() : new Date(t.completionTimestamp as any);
            return completionDate >= today;
        }
        return false;
    }).length;

    if (user?.role === 'Technician') {
        return {
            techniciansOnDuty: 0,
            activeAlerts: 0,
            onlineDevices: 0,
            tasksCompletedToday: completedToday,
            myOpenTasks: tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length,
        }
    }

    return {
      techniciansOnDuty: technicians.filter(t => t.isActive).length,
      onlineDevices: 0, // This will be static since we removed the devices query for this view
      activeAlerts: alerts.length,
      tasksCompletedToday: completedToday,
    };
  }, [technicians, alerts, tasks, user]);

  const loading = authLoading || loadingTasks || (user?.role === 'Admin' && (loadingTechs || loadingAlerts || loadingTechUsers));
  
  const allTechniciansForAdmin = useMemo(() => {
    if (user?.role !== 'Admin') return [];
    // A simple join of users and technicians data for the admin tasks list
    return techUsers.map(u => {
        const techData = technicians.find(t => t.id === u.id);
        return {
            ...u,
            ...techData,
        } as Technician & User;
    });
  }, [user, techUsers, technicians]);

  if (loading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Loading Dashboard...</p>
        </div>
    );
  }
  
  if (user.role === 'Admin') {
      return (
        <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
            <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Technicians On-duty" value={stats.techniciansOnDuty} icon={Users} />
                <StatsCard title="Active Alerts" value={stats.activeAlerts} icon={Siren} />
                <StatsCard title="Tasks Completed Today" value={stats.tasksCompletedToday} icon={ListChecks} />
            </div>
             <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Recent Tasks</CardTitle>
                        <CardDescription>A summary of recently updated tasks.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TasksList tasks={tasks.slice(0, 5)} technicians={allTechniciansForAdmin} />
                    </CardContent>
                </Card>
                <AlertsList alerts={alerts.filter(a => a.severity === 'Critical' || a.severity === 'High')} />
             </div>
        </main>
      )
  }

  // Technician View
  return (
    <main className="flex-1 space-y-6 p-4 pt-6 md:p-6">
        <h1 className="text-3xl font-bold font-headline">Welcome, {user.name}</h1>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">My Task Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">My Open Tasks</span>
                        <span className="font-bold text-2xl">{stats.myOpenTasks ?? 0}</span>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">My Completed Today</span>
                        <span className="font-bold text-2xl">{stats.tasksCompletedToday}</span>
                    </div>
                </CardContent>
             </Card>
              <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Network Status</CardTitle>
                    <CardDescription>A real-time overview of the network.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <p className="text-sm text-muted-foreground">Please see the Alerts page for details on network status.</p>
                </CardContent>
             </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">My Open Tasks</CardTitle>
                <CardDescription>Your assigned tasks that are pending or in progress.</CardDescription>
            </CardHeader>
            <CardContent>
                <TasksList tasks={tasks.filter(t => t.status !== 'Completed')} technicians={[]} />
            </CardContent>
        </Card>
    </main>
  );
}
