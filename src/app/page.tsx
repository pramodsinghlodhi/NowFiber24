
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { mockAlerts, mockTasks, mockInfrastructure, mockTechnicians, mockStats, mockConnections, Technician, Infrastructure, Connection } from '@/lib/data';
import StatsCard from '@/components/dashboard/stats-card';
import TasksList from '@/components/dashboard/tasks-list';
import AlertsList from '@/components/dashboard/alerts-list';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { Users, Wifi, Siren, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const MapView = dynamic(() => import('@/components/dashboard/map-view'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-xl" />,
});


export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [liveTechnicians, setLiveTechnicians] = useState<Technician[]>(mockTechnicians);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTechnicians(prevTechnicians =>
        prevTechnicians.map(tech => {
          if (tech.isActive) {
            // Simulate slight movement
            const newLat = tech.lat + (Math.random() - 0.5) * 0.001;
            const newLng = tech.lng + (Math.random() - 0.5) * 0.001;
            const newPath = [...(tech.path || []), [newLat, newLng]] as [number, number][];
            return { ...tech, lat: newLat, lng: newLng, path: newPath.slice(-10) }; // Keep last 10 points
          }
          return tech;
        })
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Skeleton className="h-full w-full" />
        </div>
    );
  }

  const stats = mockStats;
  const devices = mockInfrastructure;
  const alerts = mockAlerts;
  const tasks = mockTasks.filter(t => t.tech_id === user.id || user.role === 'Admin');
  const connections = mockConnections;

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
                    <MapView devices={devices} technicians={liveTechnicians} alerts={alerts} connections={connections} />
                </div>
            </Card>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">My Tasks</CardTitle>
                        <CardDescription>Tasks assigned to you or your team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TasksList tasks={tasks.filter(t => t.status !== 'Completed').slice(0, 5)} />
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
