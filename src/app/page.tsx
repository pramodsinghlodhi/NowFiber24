
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
import { mockAlerts, mockTasks, mockDevices, mockTechnicians, mockStats, Technician } from '@/lib/data';
import StatsCard from '@/components/dashboard/stats-card';
import AlertsList from '@/components/dashboard/alerts-list';
import TasksList from '@/components/dashboard/tasks-list';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';

const MapView = dynamic(() => import('@/components/dashboard/map-view'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full lg:h-[650px]" />,
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
          if (tech.onDuty) {
            // Simulate slight movement
            const newLat = tech.lat + (Math.random() - 0.5) * 0.001;
            const newLng = tech.lng + (Math.random() - 0.5) * 0.001;
            return { ...tech, lat: newLat, lng: newLng };
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
  const devices = mockDevices;
  const alerts = mockAlerts;
  const tasks = mockTasks.filter(t => t.tech_id === user.id || user.role === 'Admin');

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Online Devices" value={stats.onlineDevices} icon="wifi" />
            <StatsCard title="Active Alerts" value={stats.activeAlerts} icon="siren" variant="destructive" />
            <StatsCard title="Technicians On-Duty" value={stats.techniciansOnDuty} icon="users" />
            <StatsCard title="Tasks Completed" value={stats.tasksCompletedToday} icon="check-circle" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-1 lg:col-span-4">
              <MapView devices={devices} technicians={liveTechnicians} alerts={alerts} />
            </div>
            <div className="col-span-1 flex flex-col gap-4 lg:col-span-3">
                <AlertsList alerts={alerts.slice(0, 5)} />
                <TasksList tasks={tasks.slice(0, 4)} />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
