
'use server';

import {autoFaultDetection} from '@/ai/flows/auto-fault-detection';
import {analyzeMaterialsUsed} from '@/ai/flows/analyze-materials-used';
import {traceRoute, TraceRouteInput} from '@/ai/flows/trace-route-flow';
import { collection, getDocs, query, where, limit, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Technician, Infrastructure, Task, MaterialAssignment } from '@/lib/types';


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
    latitude: parseFloat(String(faultyDevice.lat)),
    longitude: parseFloat(String(faultyDevice.lng)),
    assignedTechs: techniciansWithLocation,
  });

   return [result];
}

export async function analyzeMaterials(photoDataUri: string, taskId: string) {
    const taskDocRef = doc(db, 'tasks', taskId);
    const taskDoc = await getDoc(taskDocRef);
    if (!taskDoc.exists()) {
        throw new Error("Task not found");
    }
    const taskData = taskDoc.data() as Task;

    // This query is now more specific, but for this app, we assume any material issued to a tech could be for any of their tasks.
    // A more complex app might have a direct task-to-assignment link.
    const assignmentsQuery = query(collection(db, 'assignments'), where('technicianId', '==', taskData.tech_id), where('status', '==', 'Issued'));
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const assignments = assignmentsSnapshot.docs.map(doc => doc.data() as MaterialAssignment);

    const materialsIssuedString = assignments
        .map(a => `${a.quantityAssigned}x ${a.materialId}`)
        .join(', ');

    const result = await analyzeMaterialsUsed({
        photoDataUri,
        taskDetails: `Task: ${taskData.title}. Description: ${taskData.description}`,
        materialsIssued: materialsIssuedString || "No materials were formally issued for this task.",
    });

    return result;
}

export async function runTraceRoute(input: TraceRouteInput) {
    const result = await traceRoute(input);
    return result;
}


export async function createTask(taskData: Omit<Task, 'id' | 'completionTimestamp'>) {
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...taskData,
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating task: ", error);
    return { success: false, message: (error as Error).message };
  }
}
