
'use client';

import { useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';

const LOCATION_UPDATE_INTERVAL = 30000; // 30 seconds

export function useLocationTracker(technicianId: string | null, isEnabled: boolean) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!technicianId || !isEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    if (typeof window === 'undefined' || !navigator.geolocation) {
        toast({ title: 'Geolocation not supported', description: 'Your browser does not support location tracking.', variant: 'destructive'});
        return;
    }

    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const techDocRef = doc(db, 'technicians', technicianId);
          try {
            await updateDoc(techDocRef, {
              lat: latitude,
              lng: longitude,
              isActive: true, // Also ensure they are marked as active
            });
            console.log(`Updated location for ${technicianId}: ${latitude}, ${longitude}`);
          } catch (error) {
            console.error('Failed to update location:', error);
            // Don't toast every failure to avoid spamming the user
          }
        },
        (error) => {
          console.error('Error getting location:', error.message);
          toast({ title: 'Location Error', description: `Could not retrieve your location: ${error.message}`, variant: 'destructive' });
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    // Perform initial update immediately
    updateLocation();

    // Set up interval for subsequent updates
    intervalRef.current = setInterval(updateLocation, LOCATION_UPDATE_INTERVAL);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Optionally mark technician as inactive when they navigate away or log out
      // This might be better handled on logout to be more explicit
    };
  }, [technicianId, isEnabled, toast]);
}
