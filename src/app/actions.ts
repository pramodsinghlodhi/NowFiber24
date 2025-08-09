
'use server';

import {autoFaultDetection} from '@/ai/flows/auto-fault-detection';
import {analyzeMaterialsUsed} from '@/ai/flows/analyze-materials-used';
import {traceRoute, TraceRouteInput} from '@/ai/flows/trace-route-flow';
import {returnMaterialsFlow} from '@/ai/flows/return-materials-flow';
import { collection, getDocs, query, where, limit, doc, getDoc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { adminDb } from '@/lib/firebase-admin';
import { Technician, Infrastructure, Task, MaterialAssignment, Notification } from '@/lib/types';
import { createNotification, getTechnicianUserByTechId, createBroadcast as createBroadcastNotification } from '@/lib/notifications';
import * as nodemailer from 'nodemailer';


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

  if (result.alertCreated && result.assignedTechId) {
      const techUser = await getTechnicianUserByTechId(result.assignedTechId);
      if (techUser) {
          await createNotification({
              userId: techUser.uid,
              type: 'New Alert',
              title: `Critical Alert: ${result.issue?.split(' ')[1]} Offline`,
              message: result.issue || 'A device is unreachable.',
              href: '/alerts'
          })
      }
  }

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

export async function returnMaterials(photoDataUri: string) {
    const result = await returnMaterialsFlow({ photoDataUri });
    return result;
}

export async function createTask(taskData: Omit<Task, 'id' | 'completionTimestamp'>) {
  try {
    const docRef = await addDoc(collection(adminDb, 'tasks'), {
      ...taskData,
    });
    
    // Create a notification for the assigned technician
    const techUser = await getTechnicianUserByTechId(taskData.tech_id);
    if (techUser) {
        await createNotification({
            userId: techUser.uid,
            type: 'Task Assigned',
            title: 'New Task Assigned',
            message: `You have been assigned a new task: ${taskData.title}`,
            href: '/tasks'
        });
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating task: ", error);
    return { success: false, message: (error as Error).message };
  }
}

export async function reassignTask(taskId: string, newTechId: string, taskTitle: string) {
    const taskDocRef = doc(adminDb, 'tasks', taskId);
    try {
        await updateDoc(taskDocRef, { tech_id: newTechId });

        const techUser = await getTechnicianUserByTechId(newTechId);
        if (techUser) {
            await createNotification({
                userId: techUser.uid,
                type: 'Task Assigned',
                title: 'Task Re-assigned',
                message: `You have been assigned a new task: ${taskTitle}`,
                href: '/tasks'
            });
        }
        return { success: true };
    } catch (error) {
        console.error("Error re-assigning task:", error);
        return { success: false, message: (error as Error).message };
    }
}

export async function updateTaskStatus(taskId: string, newStatus: Task['status']) {
    const taskDocRef = doc(adminDb, 'tasks', taskId);
    try {
        const updateData: any = { status: newStatus };
        if (newStatus === 'Completed') {
            updateData.completionTimestamp = serverTimestamp();
        }
        await updateDoc(taskDocRef, updateData);
        return { success: true };
    } catch (error) {
        console.error("Error updating task status:", error);
        return { success: false, message: (error as Error).message };
    }
}

export async function updateAssignmentStatus(assignmentId: string, newStatus: MaterialAssignment['status']) {
    const assignmentDocRef = doc(adminDb, 'assignments', assignmentId);
    try {
        await updateDoc(assignmentDocRef, { status: newStatus });

        if (newStatus === 'Issued' || newStatus === 'Rejected') {
            const assignmentDoc = await getDoc(assignmentDocRef);
            const assignment = assignmentDoc.data() as MaterialAssignment;
            const techUser = await getTechnicianUserByTechId(assignment.technicianId);
            
            if (techUser) {
                await createNotification({
                    userId: techUser.uid,
                    type: 'Material Approved', // Using a generic type for both cases
                    title: `Material Request ${newStatus}`,
                    message: `Your request for ${assignment.quantityAssigned}x ${assignment.materialId} has been ${newStatus.toLowerCase()}.`,
                    href: '/materials'
                });
            }
        }
        return { success: true };
    } catch (error) {
        console.error("Error updating assignment status:", error);
        return { success: false, message: (error as Error).message };
    }
}

export async function sendTestEmail(smtpConfig: { host: string, port: number, user: string, pass: string }) {
    if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.user || !smtpConfig.pass) {
        return { success: false, message: 'SMTP configuration is incomplete.' };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.port === 465, // true for 465, false for other ports
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.pass,
            },
        });

        await transporter.verify();

        await transporter.sendMail({
            from: `"NowFiber24" <${smtpConfig.user}>`,
            to: smtpConfig.user,
            subject: 'Test Email from NowFiber24',
            text: 'This is a test email to confirm your SMTP settings are correct.',
            html: '<b>This is a test email to confirm your SMTP settings are correct.</b>',
        });

        return { success: true };
    } catch (error: any) {
        console.error('Email sending error:', error);
        return { success: false, message: `Failed to send email: ${error.message}` };
    }
}

export async function createBroadcast(broadcast: Omit<Notification, 'id' | 'userId'>) {
    try {
        await createBroadcastNotification(broadcast);
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
