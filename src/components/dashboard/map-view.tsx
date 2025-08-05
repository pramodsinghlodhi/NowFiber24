
"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { cn } from "@/lib/utils";
import { Infrastructure, Technician, Alert, Connection, Plan } from "@/lib/types";
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  devices: Infrastructure[];
  technicians: Technician[];
  alerts: Alert[];
  connections: Connection[];
  mapStyle?: string;
  tracedPath?: Infrastructure[];
};

const getDeviceIcon = (device: Infrastructure, isTraced: boolean) => {
  const iconSize: [number, number] = isTraced ? [40,40] : [32, 32];
  const commonClasses = "p-1.5 rounded-full text-white shadow-lg flex items-center justify-center";
  const tracedClasses = isTraced ? "border-4 border-yellow-400" : "";


  let statusColor = 'bg-gray-400';
  if (device.status === 'online') statusColor = 'bg-green-500';
  else if (device.status === 'offline') statusColor = 'bg-destructive';
  else if (device.status === 'maintenance') statusColor = 'bg-yellow-500';
  
  // Highlight devices with open ports
  if (device.attributes?.openPorts && device.attributes.openPorts > 0) {
    statusColor = 'bg-blue-500 animate-pulse';
  }


  let iconSvg: string;

  switch (device.type) {
    case 'OLT':
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="14" width="18" height="7" rx="2" ry="2" /><line x1="6" y1="17" x2="6.01" y2="17" /><line x1="10" y1="17" x2="10.01" y2="17" /><path d="M4 14V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6" /></svg>`;
      break;
    case 'switch':
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12H2m20 0-3-3m3 3-3 3M2 12l3 3M2 12l3 3"/><path d="M17 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-5 10a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>`;
      break;
    case 'Pole':
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M12 2l4 4"/><path d="M12 2l-4 4"/><path d="M12 22l4-4"/><path d="M12 22l-4-4"/></svg>`;
      break;
    case 'splitter':
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-git-fork"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/></svg>`;
      break;
    case 'router':
    case 'ONU':
    default:
       iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-router h-5 w-5"><path d="M2 9.5a2.5 2.5 0 0 1 2.5-2.5h15A2.5 2.5 0 0 1 22 9.5v5a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 14.5Z"/><path d="M6 12h.01"/><path d="M10 12h.01"/><path d="M14 12h.01"/></svg>`
      break;
  }
  
  return L.divIcon({
    html: `<div class="${cn(commonClasses, statusColor, tracedClasses)}">${iconSvg}</div>`,
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

const createPopupContent = (device: Infrastructure, isTraced: boolean, plans: Plan[]) => {
    let attributesHtml = '';
    if (device.attributes) {
        attributesHtml = Object.entries(device.attributes)
            .map(([key, value]) => value ? `<p class="text-xs text-muted-foreground capitalize">${key.replace(/([A-Z])/g, ' $1')}: <strong>${value}</strong></p>` : '')
            .join('');
    }

    const plan = plans.find(p => p.assignedONT === device.id);
    const planHtml = plan ? `
        <div class="mt-2 pt-2 border-t">
            <p class="text-xs text-muted-foreground">Customer: <strong>${plan.customerId}</strong></p>
            <p class="text-xs text-muted-foreground">Plan: <strong>${plan.planName}</strong></p>
        </div>
    ` : '';
    
    const connectionInfoHtml = device.connectedBy ? `
        <div class="mt-2 pt-2 border-t">
            <p class="text-xs text-muted-foreground">Connected by: <strong>${device.connectedBy}</strong></p>
            ${device.connectionDate ? `<p class="text-xs text-muted-foreground">Date: <strong>${new Date(device.connectionDate).toLocaleDateString()}</strong></p>` : ''}
        </div>
    ` : '';
    
    const openEndpointHtml = (device.attributes?.openPorts && device.attributes.openPorts > 0) ? `
        <div class="mt-2 pt-2 border-t border-blue-300">
             <p class="text-xs text-blue-600 font-bold">Open for new connection!</p>
             <p class="text-xs text-muted-foreground">Available Ports: <strong>${device.attributes.openPorts}</strong></p>
        </div>
    ` : '';
    
    const traceInfoHtml = isTraced ? `
        <div class="mt-2 pt-2 border-t border-yellow-300 bg-yellow-50 -mx-2 px-2">
             <p class="text-xs text-yellow-700 font-bold">Tube: ${device.attributes?.tubeColor}</p>
             <p class="text-xs text-yellow-700 font-bold">Core: ${device.attributes?.fiberColor}</p>
        </div>
    ` : '';

    const fiberInfoHtml = device.type === 'fiber' ? `
        <div class="mt-2 pt-2 border-t">
            ${device.quantity ? `<p class="text-xs text-muted-foreground">Length: <strong>${device.quantity}m</strong></p>` : ''}
            ${device.attributes?.fiberCapacity ? `<p class="text-xs text-muted-foreground">Capacity: <strong>${device.attributes.fiberCapacity}</strong></p>` : ''}
        </div>
    ` : '';

    return `
        <div class="p-2">
            <h3 class="font-bold">${device.name} (${device.id})</h3>
            <p>${device.type}</p>
            <p class="capitalize text-sm ${device.status === 'online' ? 'text-green-600' : 'text-red-600'}">${device.status}</p>
            ${device.ip ? `<p class="text-xs text-gray-500">${device.ip}</p>` : ''}
            ${attributesHtml ? `<div class="mt-2 pt-2 border-t">${attributesHtml}</div>` : ''}
            ${planHtml}
            ${connectionInfoHtml}
            ${openEndpointHtml}
            ${traceInfoHtml}
            ${fiberInfoHtml}
        </div>
    `;
};


export default function MapView({ devices, technicians, alerts, connections, mapStyle = 'map', tracedPath = [] }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const router = useRouter();
  const plansQuery = useMemo(() => collection(db, 'plans'), []);
  const { data: plans } = useFirestoreQuery<Plan>(plansQuery);


  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
          center: [34.05, -118.25], // Centered on LA
          zoom: 12,
          zoomControl: false,
      });
      
      L.control.zoom({ position: 'topright' }).addTo(mapInstance.current);

      layerGroupRef.current = L.layerGroup().addTo(mapInstance.current);
    }
  }, [mapRef]);

  useEffect(() => {
    if (mapInstance.current) {
        const newUrl = mapStyle === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        const newAttribution = mapStyle === 'satellite'
        ? 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

        if(tileLayerRef.current) {
            tileLayerRef.current.setUrl(newUrl);
            tileLayerRef.current.options.attribution = newAttribution;
        } else {
            tileLayerRef.current = L.tileLayer(newUrl, { attribution: newAttribution }).addTo(mapInstance.current);
        }
    }
  }, [mapStyle]);


  useEffect(() => {
    if (mapInstance.current && layerGroupRef.current) {
        const lg = layerGroupRef.current;
        lg.clearLayers(); // Clear all layers before redrawing

        const tracedDeviceIds = new Set(tracedPath.map(d => d.id));

        // Draw traced path first
        if (tracedPath.length > 1) {
            const latlngs = tracedPath.map(d => [d.lat, d.lng] as [number, number]);
            L.polyline(latlngs, { color: '#FBBF24', weight: 6, opacity: 1 }).addTo(lg);
        }


        // Draw connections
        connections.forEach(connection => {
            const fromDevice = devices.find(d => d.id === connection.from);
            const toDevice = devices.find(d => d.id === connection.to);
            if (fromDevice && toDevice) {
                const isTraced = tracedDeviceIds.has(fromDevice.id) && tracedDeviceIds.has(toDevice.id);
                 if (!isTraced) {
                    const latlngs: [number, number][] = [[fromDevice.lat, fromDevice.lng], [toDevice.lat, toDevice.lng]];
                    const polyline = L.polyline(latlngs, { color: '#009688', weight: 2, opacity: 0.8 }).addTo(lg);
                    
                    polyline.on('click', () => {
                        const traceUrl = `/map?traceStart=${connection.from}&traceEnd=${connection.to}`;
                        const popupContent = `
                            <div class="p-2">
                                <p class="font-bold">Connection</p>
                                <p class="text-xs">From: ${fromDevice.name}</p>
                                <p class="text-xs">To: ${toDevice.name}</p>
                                <a href="${traceUrl}" class="text-primary text-xs font-bold mt-2 block">Trace this fiber</a>
                            </div>
                        `;

                        L.popup()
                            .setLatLng(polyline.getCenter())
                            .setContent(popupContent)
                            .openOn(mapInstance.current!);
                    });
                 }
            }
        });

        devices.forEach(device => {
            const isTraced = tracedDeviceIds.has(device.id);
            if (typeof device.lat === 'number' && typeof device.lng === 'number') {
                L.marker([device.lat, device.lng], { icon: getDeviceIcon(device, isTraced), zIndexOffset: isTraced ? 1000 : 0 })
                    .addTo(lg)
                    .bindPopup(createPopupContent(device, isTraced, plans), { className: 'custom-popup' });
            }
        });

        alerts.forEach(alert => {
             if (typeof alert.lat === 'number' && typeof alert.lng === 'number') {
                L.marker([alert.lat, alert.lng], { icon: getAlertIcon() })
                    .addTo(lg)
                    .bindTooltip(`${alert.device_id}: ${alert.issue}`, {
                        permanent: true,
                        direction: 'top',
                        offset: [0, -15],
                        className: 'custom-tooltip'
                    });
            }
        });

        technicians.filter(t => t.isActive).forEach(tech => {
            if (typeof tech.lat === 'number' && typeof tech.lng === 'number') {
                const pos: [number, number] = [tech.lat, tech.lng];
                const marker = L.marker(pos, { icon: getTechnicianIcon() })
                    .addTo(lg)
                    .bindPopup(`<div class="p-2 font-semibold">${tech.name}</div>`, { className: 'custom-popup' });
                
                if (tech.path && tech.path.length > 1) {
                    L.polyline(tech.path, { color: 'blue', weight: 3, opacity: 0.7, dashArray: '5, 10' }).addTo(lg);
                }
            }
        });

         if (tracedPath.length > 0 && mapInstance.current) {
            const bounds = L.latLngBounds(tracedPath.map(d => [d.lat, d.lng]));
            mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
        }
    }
  }, [devices, technicians, alerts, connections, mapStyle, tracedPath, router, plans]);

  return (
    <div className="h-full w-full bg-card rounded-xl shadow-inner border">
         <div ref={mapRef} className="h-full w-full rounded-xl"></div>
    </div>
  );
}
