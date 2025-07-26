
"use client";

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Device, Technician, Alert } from "@/lib/data";

// This is a workaround for a common issue with Leaflet and Next.js
// It manually sets the paths for the default marker icons.
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
}


type MapViewProps = {
  devices: Device[];
  technicians: Technician[];
  alerts: Alert[];
};

const getDeviceIcon = (device: Device) => {
  const iconSize: [number, number] = [32, 32];
  const commonClasses = "p-1.5 rounded-full text-white shadow-lg flex items-center justify-center";

  const statusColor = device.status === 'online' ? 'bg-green-500' : 
                      device.status === 'offline' ? 'bg-destructive' : 'bg-yellow-500';

  let iconSvg: string;

  switch (device.type) {
    case 'OLT':
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="14" width="18" height="7" rx="2" ry="2" /><line x1="6" y1="17" x2="6.01" y2="17" /><line x1="10" y1="17" x2="10.01" y2="17" /><path d="M4 14V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6" /></svg>`;
      break;
    case 'Switch':
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12H2m20 0-3-3m3 3-3 3M2 12l3 3M2 12l3-3"/><path d="M17 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-5 10a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>`;
      break;
    case 'Pole':
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M12 2l4 4"/><path d="M12 2l-4 4"/><path d="M12 22l4-4"/><path d="M12 22l-4-4"/></svg>`;
      break;
    case 'ONU':
    default:
       iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-router h-5 w-5"><path d="M2 9.5a2.5 2.5 0 0 1 2.5-2.5h15A2.5 2.5 0 0 1 22 9.5v5a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 14.5Z"/><path d="M6 12h.01"/><path d="M10 12h.01"/><path d="M14 12h.01"/></svg>`
      break;
  }
  
  return L.divIcon({
    html: `<div class="${cn(commonClasses, statusColor)}">${iconSvg}</div>`,
    className: 'bg-transparent border-0',
    iconSize: iconSize,
    iconAnchor: [iconSize[0] / 2, iconSize[1]],
    popupAnchor: [0, -iconSize[1]]
  });
};

const getTechnicianIcon = () => {
    return L.divIcon({
        html: `<div class="p-1.5 rounded-full text-white shadow-lg bg-blue-500 border-2 border-white flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hard-hat h-5 w-5"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a8 8 0 0 1 16 0v3"/></svg></div>`,
        className: 'bg-transparent border-0',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
}

const getAlertIcon = () => {
    return L.divIcon({
        html: `<div class="relative flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-siren h-8 w-8 text-destructive animate-pulse"><path d="M7 18v-6a5 5 0 1 1 10 0v6"/><path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z"/><path d="M21 12h1"/><path d="M18.5 4.5 18 5"/><path d="M2 12h1"/><path d="M12 2v1"/><path d="m4.929 4.929.707.707"/><path d="M12 12v6"/></svg></div>`,
        className: 'bg-transparent border-0',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
}


export default function MapView({ devices, technicians, alerts }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
          center: [34.0522, -118.2437],
          zoom: 13,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);
      layerGroupRef.current = L.layerGroup().addTo(mapInstance.current);
    }
    
    // Cleanup function to destroy the map instance
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount and unmount


  useEffect(() => {
    const lg = layerGroupRef.current;
    if (lg) {
        // Clear existing markers from the layer group
        lg.clearLayers();

        // Add device markers
        devices.forEach(device => {
            L.marker([device.lat, device.lng], { icon: getDeviceIcon(device) })
                .addTo(lg)
                .bindPopup(`<div class="font-sans">
                            <div class="font-bold text-base mb-1">${device.id} (${device.type})</div>
                            <div class="text-sm">Status: <span class="${cn(device.status === 'online' ? 'text-green-600' : device.status === 'offline' ? 'text-red-600' : 'text-yellow-600')} font-semibold">${device.status}</span></div>
                            <p class="text-sm">IP: ${device.ip || 'N/A'}</p>
                           </div>`);
        });

        // Add technician markers
        technicians.forEach(tech => {
            if (tech.onDuty) {
                L.marker([tech.lat, tech.lng], { icon: getTechnicianIcon() })
                    .addTo(lg)
                    .bindPopup(`<div class="font-sans">
                                <div class="font-bold text-base mb-1">${tech.name}</div>
                                <p class="text-sm">Status: <span class="font-semibold text-green-600">On Duty</span></p>
                               </div>`);
            }
        });
        
        // Add alert markers
        alerts.forEach(alert => {
            L.marker([alert.lat, alert.lng], { icon: getAlertIcon(), zIndexOffset: 1000 })
                .addTo(lg)
                .bindTooltip(`<div class="font-sans font-bold">${alert.device_id}: ${alert.issue}</div>`, {
                    permanent: true,
                    direction: 'top',
                    offset: [0, -10],
                    className: "border-destructive bg-destructive/20 text-destructive-foreground"
                });
        });
    }
  }, [devices, technicians, alerts]);

  return (
    <Card className="h-[400px] lg:h-[650px]">
      <CardHeader>
        <CardTitle className="font-headline">GIS Network Visualizer</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px] lg:h-[570px] p-0">
         <div ref={mapRef} className="h-full w-full rounded-b-lg"></div>
      </CardContent>
    </Card>
  );
}
