
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { Users, Wifi, Siren } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MapView = dynamic(() => import('@/components/dashboard/map-view'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full lg:h-[calc(100vh-280px)] rounded-xl" />,
});


export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [liveTechnicians, setLiveTechnicians] = useState<Technician[]>(mockTechnicians);
  const [mapStyle, setMapStyle] = useState('map');

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
        <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
          <h1 className="text-3xl font-bold font-headline">Fiber network manager</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatsCard title="PDO Aggregator" value={stats.techniciansOnDuty} icon={Users} color="bg-yellow-100" iconColor="text-yellow-600" />
            <StatsCard title="App Provider" value={stats.onlineDevices} icon={Wifi} color="bg-green-100" iconColor="text-green-600" />
            <StatsCard title="Wi-Fi Hotspot" value={stats.activeAlerts} icon={Siren} color="bg-purple-100" iconColor="text-purple-600"/>
          </div>
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-headline">Map</h2>
                <div className="flex items-center gap-2 rounded-lg bg-white p-1 shadow-sm">
                    <Button variant={mapStyle === 'map' ? 'secondary' : 'ghost'} size="sm" onClick={() => setMapStyle('map')}>Map</Button>
                    <Button variant={mapStyle === 'satellite' ? 'secondary' : 'ghost'} size="sm" onClick={() => setMapStyle('satellite')}>Satellite</Button>
                </div>
              </div>
              <MapView devices={devices} technicians={liveTechnicians} alerts={alerts} mapStyle={mapStyle}/>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
