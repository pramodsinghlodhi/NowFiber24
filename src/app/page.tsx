
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Technician, Infrastructure, Connection, Task, Alert, Stats } from '@/lib/types';
import StatsCard from '@/components/dashboard/stats-card';
import TasksList from '@/components/dashboard/tasks-list';
import AlertsList from '@/components/dashboard/alerts-list';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { Users, Wifi, Siren, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const MapView = dynamic(() => import('@/components/dashboard/map-view'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-xl" />,
});

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const { data: technicians, loading: loadingTechs } = useFirestoreQuery<Technician>(collection(db, 'technicians'));
  const { data: devices, loading: loadingDevices } = useFirestoreQuery<Infrastructure>(collection(db, 'infrastructure'));
  const { data: alerts, loading: loadingAlerts } = useFirestoreQuery<Alert>(collection(db, 'alerts'));
  const { data: connections, loading: loadingConnections } = useFirestoreQuery<Connection>(collection(db, 'connections'));
  
  const tasksQuery = useMemo(() => {
    if (!user) return null;
    return user.role === 'Admin' 
      ? collection(db, 'tasks')
      : query(collection(db, 'tasks'), where('tech_id', '==', user.id));
  }, [user]);

  const { data: tasks, loading: loadingTasks } = useFirestoreQuery<Task>(tasksQuery);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const stats: Stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    return {
      techniciansOnDuty: technicians.filter(t => t.isActive).length,
      onlineDevices: devices.filter(d => d.status === 'online').length,
      activeAlerts: alerts.length,
      tasksCompletedToday: tasks.filter(t => {
          if (t.status === 'Completed' && t.completionTimestamp) {
              return t.completionTimestamp >= todayTimestamp;
          }
          return false;
      }).length,
    };
  }, [technicians, devices, alerts, tasks]);


  const loading = authLoading || loadingTechs || loadingDevices || loadingAlerts || loadingConnections || loadingTasks;

  if (loading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Loading Dashboard...</p>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
          <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Technicians On-duty" value={stats.techniciansOnDuty} icon={Users} />
            <StatsCard title="Online Devices" value={stats.onlineDevices} icon={Wifi} />
            <StatsCard title="Active Alerts" value={stats.activeAlerts} icon={Siren} />
            <StatsCard title="Tasks Completed" value={stats.tasksCompletedToday} icon={ListChecks} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 h-[400px] lg:h-[calc(100vh-340px)] w-full flex flex-col p-0 overflow-hidden">
                <div className="flex-grow">
                    <MapView devices={devices} technicians={technicians} alerts={alerts} connections={connections} />
                </div>
            </Card>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">My Tasks</CardTitle>
                        <CardDescription>Tasks assigned to you or your team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TasksList tasks={tasks.filter(t => t.status !== 'Completed').slice(0, 5)} technicians={technicians} />
                    </CardContent>
                </Card>
              <AlertsList alerts={alerts.filter(a => a.severity === 'Critical' || a.severity === 'High')} />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
