
"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Map as MapIcon, Satellite, Filter as FilterIcon, Route, Loader2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { runTraceRoute } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Technician, Infrastructure, Alert, Connection } from '@/lib/types';


const MapView = dynamic(() => import('@/components/dashboard/map-view'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-xl" />,
});

const initialFilters = {
    technicians: true,
    alerts: true,
    connections: true,
    'OLT': true,
    'switch': true,
    'Pole': true,
    'splitter': true,
    'ONU': true,
};

function MapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [mapStyle, setMapStyle] = useState('map');
  const [filters, setFilters] = useState<Record<string, boolean>>(initialFilters);
  const [tracedPath, setTracedPath] = useState<Infrastructure[]>([]);
  const [isTracing, setIsTracing] = useState(false);

  const infraQuery = useMemo(() => collection(db, 'infrastructure'), []);
  const techsQuery = useMemo(() => collection(db, 'technicians'), []);
  const alertsQuery = useMemo(() => collection(db, 'alerts'), []);
  const connectionsQuery = useMemo(() => collection(db, 'connections'), []);

  const { data: allInfrastructure, loading: loadingInfra } = useFirestoreQuery<Infrastructure>(infraQuery);
  const { data: liveTechnicians, loading: loadingTechs } = useFirestoreQuery<Technician>(techsQuery);
  const { data: alerts, loading: loadingAlerts } = useFirestoreQuery<Alert>(alertsQuery);
  const { data: connections, loading: loadingConnections } = useFirestoreQuery<Connection>(connectionsQuery);

  const allDeviceTypes = useMemo(() => Array.from(new Set(allInfrastructure.map(d => d.type))), [allInfrastructure]);

  const pathParam = searchParams.get('path');
  const traceStart = searchParams.get('traceStart');
  const traceEnd = searchParams.get('traceEnd');

  useEffect(() => {
    const handleTrace = async (startDeviceId: string, endDeviceId: string) => {
        setIsTracing(true);
        try {
            const traceResult = await runTraceRoute({ startDeviceId, endDeviceId });
            if (traceResult.path.length > 0) {
                setTracedPath(traceResult.path);
                toast({
                    title: 'Trace Complete!',
                    description: `Path found with ${traceResult.path.length} hops.`,
                });
                const pathData = encodeURIComponent(JSON.stringify(traceResult.path));
                router.replace(`/map?path=${pathData}`, { scroll: false });
            } else {
                toast({
                    title: 'Trace Failed',
                    description: traceResult.notes,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to run trace route.',
                variant: 'destructive',
            });
            console.error(error);
        } finally {
            setIsTracing(false);
        }
    };

    if (pathParam) {
      try {
        const decodedPath = JSON.parse(decodeURIComponent(pathParam));
        setTracedPath(decodedPath);
      } catch (error) {
        console.error("Failed to parse traced path:", error);
        setTracedPath([]);
      }
    } else if (traceStart && traceEnd) {
        handleTrace(traceStart, traceEnd);
    }
     else {
      setTracedPath([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathParam, traceStart, traceEnd, router]);


  const handleFilterChange = (key: string, value: boolean) => {
    setFilters(prev => ({
        ...prev,
        [key]: value
    }));
  }

  const filteredData = useMemo(() => {
    const filteredDevices = allInfrastructure.filter(device => filters[device.type]);
    const filteredTechnicians = filters.technicians ? liveTechnicians : [];
    const filteredAlerts = filters.alerts ? alerts : [];
    const filteredConnections = filters.connections ? connections : [];
    return { filteredDevices, filteredTechnicians, filteredAlerts, filteredConnections };
  }, [filters, liveTechnicians, allInfrastructure, alerts, connections]);

  const loading = loadingInfra || loadingTechs || loadingAlerts || loadingConnections;

  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Skeleton className="h-full w-full" />
        </div>
    );
  }

  return (
    <main className="flex-grow flex-shrink flex-basis-0 flex-col h-[calc(100vh-4rem)]">
        <div className="relative h-full w-full">
            <MapView devices={filteredData.filteredDevices} technicians={filteredData.filteredTechnicians} alerts={filteredData.filteredAlerts} connections={filteredData.filteredConnections} mapStyle={mapStyle} tracedPath={tracedPath}/>
            <div className="absolute top-4 left-4 z-[100] flex gap-2">
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
            {tracedPath.length > 0 && (
                <Button variant="secondary" className="shadow-md" onClick={() => {
                    setTracedPath([]);
                    router.replace('/map', { scroll: false });
                }}>
                    <Route className="mr-2 h-4 w-4" />
                    Clear Trace
                </Button>
            )}
                {isTracing && (
                <Button variant="secondary" disabled className="shadow-md">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tracing...
                </Button>
            )}
            </div>
            <div className="absolute bottom-[30px] right-[30px] z-[100]">
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
  );
}

export default function MapPage() {
    return (
        <Suspense fallback={<Skeleton className="h-screen w-full" />}>
            <MapContent />
        </Suspense>
    );
}
