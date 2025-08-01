
'use server';

import {autoFaultDetection} from '@/ai/flows/auto-fault-detection';
import {analyzeMaterialsUsed} from '@/ai/flows/analyze-materials-used';
import {traceRoute, TraceRouteInput} from '@/ai/flows/trace-route-flow';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Technician, Infrastructure } from '@/lib/types';


export async function runAutoFaultDetection() {
  const techniciansCol = collection(db, 'technicians');
  const q = query(techniciansCol, where('isActive', '==', true));
  const techniciansSnapshot = await getDocs(q);
  const techniciansWithLocation = techniciansSnapshot.docs.map(doc => {
      const data = doc.data() as Technician;
      return {
          techId: doc.id,
          latitude: data.lat,
          longitude: data.lng,
      };
  });

  const infrastructureCol = collection(db, 'infrastructure');
  const faultyDeviceQuery = query(infrastructureCol, where('status', '==', 'offline'), limit(1));
  const faultyDeviceSnapshot = await getDocs(faultyDeviceQuery);
  
  if (faultyDeviceSnapshot.empty) {
    return [{isReachable: true, alertCreated: false, issue: 'No offline devices found to test.'}];
  }

  const faultyDeviceDoc = faultyDeviceSnapshot.docs[0];
  const faultyDevice = { id: faultyDeviceDoc.id, ...faultyDeviceDoc.data() } as Infrastructure;

   const result = await autoFaultDetection({
    deviceId: faultyDevice.id,
    deviceIp: faultyDevice.ip || 'N/A',
    deviceType: faultyDevice.type,
    latitude: faultyDevice.lat,
    longitude: faultyDevice.lng,
    assignedTechs: techniciansWithLocation,
  });

   return [result];
}

export async function analyzeMaterials(photoDataUri: string, taskId: string) {
  // In a real app, you would get task details and issued materials from the DB based on the task ID.
  const mockTaskDetails = 'Task: Fix ONU-102 Connectivity. Replace faulty fiber optic cable and connector.';
  const mockMaterialsIssued = '1x SC/APC Connector, 20m Fiber Optic Cable, 1x Splicing Sleeve, 1x Cleaning Kit';

  const result = await analyzeMaterialsUsed({
    photoDataUri,
    taskDetails: mockTaskDetails,
    materialsIssued: mockMaterialsIssued,
  });

  return result;
}

export async function runTraceRoute(input: TraceRouteInput) {
    const result = await traceRoute(input);
    return result;
}
