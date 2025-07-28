
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
import { mockAlerts, mockTasks, mockInfrastructure, mockTechnicians, mockConnections, Technician } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Map as MapIcon, Satellite } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';


const MapView = dynamic(() => import('@/components/dashboard/map-view'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-xl" />,
});


export default function MapPage() {
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-grow flex-shrink flex-basis-0 flex-col h-[calc(100vh-4rem)]">
          <div className="relative h-full w-full">
             <MapView devices={mockInfrastructure} technicians={liveTechnicians} alerts={mockAlerts} connections={mockConnections} mapStyle={mapStyle} />
             <div className="absolute bottom-4 right-4 z-[500]">
                <ToggleGroup type="single" value={mapStyle} onValueChange={(value) => { if(value) setMapStyle(value)}} className="bg-background rounded-lg shadow-md border p-1">
                    <ToggleGroupItem value="map" aria-label="Map view">
                        <MapIcon className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="satellite" aria-label="Satellite view">
                        <Satellite className="h-4 w-4" />
                    </ToggleGroupItem>
                </ToggleGroup>
             </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
