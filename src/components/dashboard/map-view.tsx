
"use client";

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
  mapStyle?: string;
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


export default function MapView({ devices, technicians, alerts, mapStyle = 'map' }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const technicianMarkers = useRef<{ [key: string]: { marker: L.Marker; path: L.Polyline | null } }>({});


  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
          center: [34.05, -118.25], // Centered on LA
          zoom: 12,
          zoomControl: false, // Disable default zoom control
      });
      
      // Add custom zoom control to the top right
      L.control.zoom({ position: 'topright' }).addTo(mapInstance.current);

      layerGroupRef.current = L.layerGroup().addTo(mapInstance.current);
    }
  }, []);

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
        
        // Temporarily store layers to avoid re-adding everything
        const layersToRemove: L.Layer[] = [];
        lg.eachLayer(layer => {
            // Keep technician markers and paths for now, clear the rest
            const isTechLayer = Object.values(technicianMarkers.current).some(
                ({ marker, path }) => marker === layer || path === layer
            );
            if (!isTechLayer) {
                layersToRemove.push(layer);
            }
        });
        layersToRemove.forEach(layer => lg.removeLayer(layer));


        // Add device markers
        devices.forEach(device => {
            const marker = L.marker([device.lat, device.lng], { icon: getDeviceIcon(device) })
                .addTo(lg)
                .bindPopup(`
                    <div class="p-2">
                        <h3 class="font-bold">${device.id}</h3>
                        <p>${device.type}</p>
                        <p class="capitalize text-sm ${device.status === 'online' ? 'text-green-600' : 'text-red-600'}">${device.status}</p>
                        ${device.ip ? `<p class="text-xs text-gray-500">${device.ip}</p>` : ''}
                    </div>
                `, { className: 'custom-popup' });
        });

        // Add alert markers with permanent tooltips
        alerts.forEach(alert => {
            const alertMarker = L.marker([alert.lat, alert.lng], { icon: getAlertIcon() })
                .addTo(lg)
                .bindTooltip(`${alert.device_id}: ${alert.issue}`, {
                    permanent: true,
                    direction: 'top',
                    offset: [0, -15],
                    className: 'custom-tooltip'
                });
        });

         // Initialize or update technician markers and paths
        technicians.filter(t => t.onDuty).forEach(tech => {
            const pos: [number, number] = [tech.lat, tech.lng];
            if (technicianMarkers.current[tech.id]) {
                const { marker, path } = technicianMarkers.current[tech.id];
                marker.setLatLng(pos);
                if (path && tech.path) {
                    path.setLatLngs(tech.path);
                }
            } else {
                const marker = L.marker(pos, { icon: getTechnicianIcon() })
                    .addTo(lg)
                    .bindPopup(`
                        <div class="p-2">
                            <h3 class="font-bold">${tech.name}</h3>
                            <p>Status: ${tech.status}</p>
                        </div>
                    `, { className: 'custom-popup' });

                const path = tech.path ? L.polyline(tech.path, { color: 'blue', weight: 3, opacity: 0.7 }).addTo(lg) : null;
                
                technicianMarkers.current[tech.id] = { marker, path };
            }
        });

        // Remove markers and paths for off-duty technicians
        Object.keys(technicianMarkers.current).forEach(techId => {
            if (!technicians.some(t => t.id === techId && t.onDuty)) {
                const { marker, path } = technicianMarkers.current[techId];
                marker.remove();
                if (path) path.remove();
                delete technicianMarkers.current[techId];
            }
        });
    }
  }, [devices, technicians, alerts, mapStyle]);

  return (
    <div className="h-full w-full bg-muted rounded-xl shadow-inner">
         <div ref={mapRef} className="h-full w-full rounded-xl"></div>
    </div>
  );
}
