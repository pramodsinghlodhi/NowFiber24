'use server';

import {autoFaultDetection} from '@/ai/flows/auto-fault-detection';
import {analyzeMaterialsUsed} from '@/ai/flows/analyze-materials-used';
import {mockDevices, mockTechnicians} from '@/lib/data';

export async function runAutoFaultDetection(allDevices: boolean = false) {
  // In a real application, you would fetch this data from your database.
  const techniciansWithLocation = mockTechnicians.filter(t => t.onDuty).map(t => ({
    techId: t.id,
    latitude: t.lat,
    longitude: t.lng,
  }));

  if (allDevices) {
    const offlineDevices = mockDevices.filter(d => d.status === 'offline');
    if (offlineDevices.length === 0) {
      return [{isReachable: true, alertCreated: false, issue: 'All devices are online.'}];
    }
    const results = [];
    for (const device of offlineDevices) {
      const result = await autoFaultDetection({
        deviceId: device.id,
        deviceIp: device.ip,
        deviceType: device.type,
        latitude: device.lat,
        longitude: device.lng,
        assignedTechs: techniciansWithLocation,
      });
      results.push(result);
    }
    return results;
  } else {
      // Original logic to find a single faulty device for the manual trigger
      const faultyDevice = mockDevices.find(d => d.status === 'offline' && (d.type === 'ONU' || d.type === 'Switch'));
      if (!faultyDevice) {
        return [{isReachable: true, alertCreated: false, issue: 'No offline ONUs or Switches found to test.'}];
      }
       const result = await autoFaultDetection({
        deviceId: faultyDevice.id,
        deviceIp: faultyDevice.ip,
        deviceType: faultyDevice.type,
        latitude: faultyDevice.lat,
        longitude: faultyDevice.lng,
        assignedTechs: techniciansWithLocation,
      });
       return [result];
  }
}

export async function analyzeMaterials(photoDataUri: string) {
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
