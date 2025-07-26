"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Device, Technician, Alert } from "@/lib/data";
import { Wifi, WifiOff, Wrench, HardHat, Siren, MapPin } from "lucide-react";
import Image from "next/image";

type MapViewProps = {
  devices: Device[];
  technicians: Technician[];
  alerts: Alert[];
};

const getDeviceIcon = (device: Device) => {
  if (device.status === 'offline') return <WifiOff className="h-4 w-4 text-white" />;
  if (device.status === 'maintenance') return <Wrench className="h-4 w-4 text-white" />;
  if (device.type === 'OLT') return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="14" width="18" height="7" rx="2" ry="2" /><line x1="6" y1="17" x2="6.01" y2="17" /><line x1="10" y1="17" x2="10.01" y2="17" /><path d="M4 14V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6" /></svg>;
  if (device.type === 'Switch') return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12H2m20 0-3-3m3 3-3 3M2 12l3 3M2 12l3-3"/><path d="M17 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-5 10a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>;
  if (device.type === 'Pole') return <MapPin className="h-4 w-4 text-white" />;
  return <Wifi className="h-4 w-4 text-white" />;
};

const getDeviceColor = (device: Device) => {
  if (device.status === 'offline') return 'bg-destructive';
  if (device.status === 'maintenance') return 'bg-yellow-500';
  if (device.type === 'OLT' || device.type === 'Switch') return 'bg-purple-600';
  return 'bg-green-500';
}

const normalizeCoords = (lat: number, lng: number, minLat: number, maxLat: number, minLng: number, maxLng: number) => {
  const top = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
  const left = ((lng - minLng) / (maxLng - minLng)) * 100;
  return { top: `${top}%`, left: `${left}%` };
};

export default function MapView({ devices, technicians, alerts }: MapViewProps) {
  // Define map boundaries based on mock data
  const latitudes = [...devices.map(d => d.lat), ...technicians.map(t => t.lat)];
  const longitudes = [...devices.map(d => d.lng), ...technicians.map(t => t.lng)];
  const minLat = Math.min(...latitudes) - 0.005;
  const maxLat = Math.max(...latitudes) + 0.005;
  const minLng = Math.min(...longitudes) - 0.005;
  const maxLng = Math.max(...longitudes) + 0.005;

  return (
    <Card className="h-[400px] lg:h-[650px]">
      <CardHeader>
        <CardTitle className="font-headline">GIS Network Visualizer</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="relative h-[320px] lg:h-[570px] w-full rounded-lg overflow-hidden bg-muted">
            <Image
              src="https://placehold.co/1200x800.png"
              alt="Map of the network"
              layout="fill"
              objectFit="cover"
              className="opacity-20"
              data-ai-hint="city map"
            />

            {devices.map((device) => {
              const { top, left } = normalizeCoords(device.lat, device.lng, minLat, maxLat, minLng, maxLng);
              const isAlert = alerts.some(a => a.device_id === device.id);

              return (
                <Tooltip key={device.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg cursor-pointer",
                        getDeviceColor(device),
                        isAlert && 'animate-ping'
                      )}
                      style={{ top, left }}
                    >
                    </div>
                  </TooltipTrigger>
                   <TooltipContent>
                    <p className="font-bold">{device.id} ({device.type})</p>
                    <p>Status: <span className={cn(device.status === 'online' ? 'text-green-500' : 'text-destructive')}>{device.status}</span></p>
                    <p>IP: {device.ip || 'N/A'}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            
            {alerts.map((alert) => {
              const { top, left } = normalizeCoords(alert.lat, alert.lng, minLat, maxLat, minLng, maxLng);
              return (
                <Tooltip key={`alert-${alert.id}`}>
                    <TooltipTrigger asChild>
                        <div
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center cursor-pointer"
                        style={{ top, left }}
                        >
                        <Siren className="h-6 w-6 text-destructive animate-pulse" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="font-bold text-destructive">ALERT: {alert.issue}</p>
                        <p>Device: {alert.device_id}</p>
                        <p>Severity: {alert.severity}</p>
                    </TooltipContent>
                </Tooltip>
              );
            })}

            {technicians.map((tech) => {
               const { top, left } = normalizeCoords(tech.lat, tech.lng, minLat, maxLat, minLng, maxLng);
               return (
                <Tooltip key={tech.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer bg-blue-500 border-2 border-white"
                      style={{ top, left }}
                    >
                      <HardHat className="h-4 w-4 text-white" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-bold">{tech.name}</p>
                    <p>Status: {tech.onDuty ? 'On Duty' : 'Off Duty'}</p>
                  </TooltipContent>
                </Tooltip>
               )
            })}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
