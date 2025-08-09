
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Technician } from '@/lib/types';

type TechnicianStatusUpdate = {
    isActive?: Technician['isActive'];
    status?: Technician['status'];
}

export async function updateTechnicianStatus(techId: string, updates: TechnicianStatusUpdate) {
  if (!techId) {
    return { success: false, message: 'Technician ID is required.' };
  }

  const techDocRef = adminDb.collection('technicians').doc(techId);

  try {
    await techDocRef.update(updates);
    return { success: true };
  } catch (error) {
    console.error(`Failed to update status for technician ${techId}:`, error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown error occurred.' };
  }
}
