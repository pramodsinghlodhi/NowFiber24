
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
import { mockAlerts, mockTasks, mockInfrastructure, mockTechnicians, mockConnections, Technician, Infrastructure } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Map as MapIcon, Satellite, Filter as FilterIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';


const MapView = dynamic(() => import('@/components/dashboard/map-view'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-xl" />,
});

const allDeviceTypes = Array.from(new Set(mockInfrastructure.map(d => d.type)));

const initialFilters = {
    technicians: true,
    alerts: true,
    connections: true,
    ...allDeviceTypes.reduce((acc, type) => ({ ...acc, [type]: true }), {})
};

export default function MapPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [liveTechnicians, setLiveTechnicians] = useState<Technician[]>(mockTechnicians);
  const [mapStyle, setMapStyle] = useState('map');
  const [filters, setFilters] = useState<Record<string, boolean>>(initialFilters);


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

  const handleFilterChange = (key: string, value: boolean) => {
    setFilters(prev => ({
        ...prev,
        [key]: value
    }));
  }

  const filteredData = useMemo(() => {
    const filteredDevices = mockInfrastructure.filter(device => filters[device.type]);
    const filteredTechnicians = filters.technicians ? liveTechnicians : [];
    const filteredAlerts = filters.alerts ? mockAlerts : [];
    const filteredConnections = filters.connections ? mockConnections : [];
    return { filteredDevices, filteredTechnicians, filteredAlerts, filteredConnections };
  }, [filters, liveTechnicians]);


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
             <MapView devices={filteredData.filteredDevices} technicians={filteredData.filteredTechnicians} alerts={filteredData.filteredAlerts} connections={filteredData.filteredConnections} mapStyle={mapStyle} />
             <div className="absolute top-4 left-4 z-[500] flex gap-2">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="shadow-md">
                            <FilterIcon className="mr-2 h-4 w-4" />
                            Filter
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Map Layers</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            checked={filters.technicians}
                            onCheckedChange={(value) => handleFilterChange('technicians', !!value)}
                        >
                            Technicians
                        </DropdownMenuCheckboxItem>
                         <DropdownMenuCheckboxItem
                            checked={filters.alerts}
                            onCheckedChange={(value) => handleFilterChange('alerts', !!value)}
                        >
                            Alerts
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={filters.connections}
                            onCheckedChange={(value) => handleFilterChange('connections', !!value)}
                        >
                            Fiber Lines
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Device Types</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allDeviceTypes.map(type => (
                             <DropdownMenuCheckboxItem
                                key={type}
                                checked={!!filters[type]}
                                onCheckedChange={(value) => handleFilterChange(type, !!value)}
                                className="capitalize"
                            >
                                {type.replace(/_/g, ' ')}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
             </div>
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
