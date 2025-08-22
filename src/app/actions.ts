
'use server';

import {autoFaultDetection} from '@/ai/flows/auto-fault-detection';
import {analyzeMaterialsUsed} from '@/ai/flows/analyze-materials-used';
import {traceRoute, TraceRouteInput} from '@/ai/flows/trace-route-flow';
import {returnMaterialsFlow} from '@/ai/flows/return-materials-flow';
import { adminDb } from '@/lib/firebase-admin';
import { Technician, Infrastructure, Task, MaterialAssignment, Notification, Connection, User } from '@/lib/types';
import { createNotification, createBroadcast as createBroadcastNotification, getTechnicianUserByTechId } from '@/lib/notifications';
import * as nodemailer from 'nodemailer';


export async function runAutoFaultDetection() {
  const techniciansCol = adminDb.collection('technicians');
  const q = techniciansCol.where('isActive', '==', true);
  const techniciansSnapshot = await q.get();
  const techniciansWithLocation = techniciansSnapshot.docs.map(doc => {
      const data = doc.data() as Technician;
      return {
          techId: doc.id,
          latitude: data.lat,
          longitude: data.lng,
      };
  });

  const infrastructureCol = adminDb.collection('infrastructure');
  const faultyDeviceQuery = infrastructureCol.where('status', '==', 'offline').limit(1);
  const faultyDeviceSnapshot = await faultyDeviceQuery.get();
  
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
    const taskDocRef = adminDb.collection('tasks').doc(taskId);
    const taskDoc = await taskDocRef.get();

    if (!taskDoc.exists) {
        throw new Error("Task not found");
    }
    const taskData = taskDoc.data() as Task;
    
    const result = await analyzeMaterialsUsed({
        photoDataUri,
        taskDetails: `Task: ${taskData.title}. Description: ${taskData.description}`,
        materialsIssued: "Not applicable.",
    });

    const proofOfWorkDoc = {
        technicianId: taskData.tech_id, // This is the UID
        taskId: taskId,
        imageDataUri: photoDataUri,
        analysisResult: result,
        timestamp: new Date(),
    };

    await adminDb.collection('proofOfWork').add(proofOfWorkDoc);

    return result;
}

export async function runTraceRoute(input: Omit<TraceRouteInput, 'infrastructure' | 'connections'>) {
    const infraSnapshot = await adminDb.collection('infrastructure').get();
    const mockInfrastructure = infraSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Infrastructure[];

    const connSnapshot = await adminDb.collection('connections').get();
    const mockConnections = connSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Connection[];
    
    const result = await traceRoute({ ...input, infrastructure: mockInfrastructure, connections: mockConnections });
    return result;
}

export async function returnMaterials(photoDataUri: string) {
    const result = await returnMaterialsFlow({ photoDataUri });
    return result;
}

export async function createTask(taskData: Omit<Task, 'id' | 'completionTimestamp'>) {
  try {
    const techUser = await getTechnicianUserByTechId(taskData.tech_id); // tech_id is custom id from form
    if (!techUser) {
        return { success: false, message: "Technician user not found." };
    }

    const docRef = await adminDb.collection('tasks').add({
      ...taskData,
      tech_id: techUser.uid, // Store the UID in the task document
    });
    
    await createNotification({
        userId: techUser.uid,
        type: 'Task Assigned',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${taskData.title}`,
        href: '/tasks'
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating task: ", error);
    return { success: false, message: (error as Error).message };
  }
}

export async function reassignTask(taskId: string, newTechCustomId: string, taskTitle: string) {
    const taskDocRef = adminDb.collection('tasks').doc(taskId);
    try {
        const techUser = await getTechnicianUserByTechId(newTechCustomId);
        if (!techUser) {
            return { success: false, message: 'Technician to assign not found.' };
        }

        await taskDocRef.update({ tech_id: techUser.uid }); // Update with UID

        await createNotification({
            userId: techUser.uid,
            type: 'Task Assigned',
            title: 'Task Re-assigned',
            message: `You have been assigned a new task: ${taskTitle}`,
            href: '/tasks'
        });
        
        return { success: true };
    } catch (error) {
        console.error("Error re-assigning task:", error);
        return { success: false, message: (error as Error).message };
    }
}

export async function updateTaskStatus(taskId: string, newStatus: Task['status']) {
    const taskDocRef = adminDb.collection('tasks').doc(taskId);
    try {
        const updateData: any = { status: newStatus };
        if (newStatus === 'Completed') {
            updateData.completionTimestamp = new Date();
        }
        await taskDocRef.update(updateData);
        return { success: true };
    } catch (error) {
        console.error("Error updating task status:", error);
        return { success: false, message: (error as Error).message };
    }
}

export async function updateAssignmentStatus(assignmentId: string, newStatus: MaterialAssignment['status']) {
    const assignmentDocRef = adminDb.collection('assignments').doc(assignmentId);
    try {
        await assignmentDocRef.update({ status: newStatus });

        if (newStatus === 'Issued' || newStatus === 'Rejected') {
            const assignmentDoc = await assignmentDocRef.get();
            const assignment = assignmentDoc.data() as MaterialAssignment;
            const techUser = await getTechnicianUserByTechId(assignment.technicianId);
            
            if (techUser) {
                await createNotification({
                    userId: techUser.uid,
                    type: 'Material Approved',
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
            secure: smtpConfig.port === 465, 
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

export async function getTechnician(techId: string): Promise<Technician | null> {
    const techDocRef = adminDb.collection('technicians').doc(techId);
    const techDoc = await techDocRef.get();
    if (techDoc.exists) {
      return { id: techDoc.id, ...techDoc.data() } as Technician;
    }
    return null;
}

export async function sendNoticeToTechnician(technicianId: string, title: string, message: string) {
    try {
      // technicianId for this function is the custom ID (e.g. tech-001)
      const techUser = await getTechnicianUserByTechId(technicianId);
      if (!techUser) {
        return { success: false, message: "Technician not found." };
      }
      
      await createNotification({
        userId: techUser.uid,
        type: 'Notice',
        title: title,
        message: message,
        href: `/proof-of-work`,
      });

      return { success: true };
    } catch (error) {
       return { success: false, message: "Could not send notice." };
    }
}

export async function clearAllNotifications(userId: string) {
    try {
        const notificationsRef = adminDb.collection(`users/${userId}/notifications`);
        const snapshot = await notificationsRef.get();

        if (snapshot.empty) {
            return { success: true, message: 'No notifications to delete.' };
        }

        const batch = adminDb.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        return { success: true, message: 'All notifications cleared.' };

    } catch (error: any) {
        console.error(`Error clearing notifications for user ${userId}:`, error.code, error.message);
        return { success: false, message: `Failed to clear notifications: ${error.message}` };
    }
}
