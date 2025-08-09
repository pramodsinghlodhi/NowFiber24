
'use server';

/**
 * @fileOverview Implements the auto fault detection flow. It pings devices and creates alerts with location and assigned technician information to minimize downtime.
 *
 * - autoFaultDetection - A function that handles the auto fault detection process.
 * - AutoFaultDetectionInput - The input type for the autoFaultDetection function.
 * - AutoFaultDetectionOutput - The return type for the autoFaultDetection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoFaultDetectionInputSchema = z.object({
  deviceId: z.string().describe('The ID of the device to check.'),
  deviceIp: z.string().describe('The IP address of the device.'),
  deviceType: z.string().describe('The type of the device (e.g., ONT, switch).'),
  latitude: z.number().describe('The latitude of the device location.'),
  longitude: z.number().describe('The longitude of the device location.'),
  assignedTechs: z.array(z.object({
    techId: z.string().describe('The ID of the technician.'),
    latitude: z.number().describe('The latitude of the technician location.'),
    longitude: z.number().describe('The longitude of the technician location.'),
  })).describe('List of assigned technicians with their locations.'),
});

export type AutoFaultDetectionInput = z.infer<typeof AutoFaultDetectionInputSchema>;

const AutoFaultDetectionOutputSchema = z.object({
  isReachable: z.boolean().describe('Whether the device is reachable via ping.'),
  alertCreated: z.boolean().describe('Whether an alert was created due to the device being unreachable.'),
  assignedTechId: z.string().optional().describe('The ID of the closest technician assigned to the alert, if any.'),
  issue: z.string().optional().describe('Description of the issue, if there is one.'),
});

export type AutoFaultDetectionOutput = z.infer<typeof AutoFaultDetectionOutputSchema>;

export async function autoFaultDetection(input: AutoFaultDetectionInput): Promise<AutoFaultDetectionOutput> {
  return autoFaultDetectionFlow(input);
}

const pingDevice = ai.defineTool({
  name: 'pingDevice',
  description: 'Pings a device to check its reachability.',
  inputSchema: z.object({
    ipAddress: z.string().describe('The IP address of the device to ping.'),
  }),
  outputSchema: z.boolean(),
}, async (input) => {
  // In a real implementation, this would execute a ping command.
  // For this example, we simulate the ping. Devices with certain IPs are more likely to fail.
  const lastOctet = parseInt(input.ipAddress.split('.')[3], 10);
  // Devices with last octet 102, 104, 105 will be offline
  const isUnreachable = [102, 104, 105].includes(lastOctet);
  const isReachable = !isUnreachable;
  console.log(`Simulated ping to ${input.ipAddress}: ${isReachable ? 'Success' : 'Failure'}`);
  return isReachable;
});

const createAlert = ai.defineTool({
  name: 'createAlert',
  description: 'Creates an alert in the system for an unreachable device.',
  inputSchema: z.object({
    deviceId: z.string().describe('The ID of the unreachable device.'),
    deviceType: z.string().describe('The type of the device.'),
    latitude: z.number().describe('The latitude of the device location.'),
    longitude: z.number().describe('The longitude of the device location.'),
    issue: z.string().describe('The description of the issue (e.g., device unreachable).'),
    assignedTechId: z.string().optional().describe('The ID of the assigned technician, if any.'),
  }),
  outputSchema: z.boolean(),
}, async (input) => {
  // In a real implementation, this would create an alert in the database.
  console.log(`Alert created for device ${input.deviceId} (${input.deviceType}) at ${input.latitude}, ${input.longitude} with issue: ${input.issue}. Assigned to tech: ${input.assignedTechId || 'None'}`);
  return true;
});

const findClosestTechnician = ai.defineTool({
  name: 'findClosestTechnician',
  description: 'Finds the closest available technician to a given location.',
  inputSchema: z.object({
    latitude: z.number().describe('The latitude of the fault location.'),
    longitude: z.number().describe('The longitude of the fault location.'),
    technicians: z.array(z.object({
      techId: z.string().describe('The ID of the technician.'),
      latitude: z.number().describe('The latitude of the technician location.'),
      longitude: z.number().describe('The longitude of the technician location.'),
    })).describe('List of available technicians with their locations.'),
  }),
  outputSchema: z.string().optional().describe('The ID of the closest technician, if any.'),
}, async (input) => {
  if (!input.technicians || input.technicians.length === 0) {
    console.log('No technicians available.');
    return undefined;
  }

  let closestTechId: string | undefined;
  let minDistance = Infinity;

  for (const tech of input.technicians) {
    const distance = calculateDistance(input.latitude, input.longitude, tech.latitude, tech.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      closestTechId = tech.techId;
    }
  }

  console.log(`Closest technician to ${input.latitude}, ${input.longitude} is tech ${closestTechId}`);
  return closestTechId;
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Haversine formula to calculate distance between two coordinates
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

const autoFaultDetectionFlowPrompt = ai.definePrompt({
    name: 'autoFaultDetectionFlowPrompt',
    inputSchema: AutoFaultDetectionInputSchema,
    outputSchema: AutoFaultDetectionOutputSchema,
    tools: [pingDevice, createAlert, findClosestTechnician],
    prompt: `You are a network operations AI. Your task is to detect and report faults in the network.
    You will be given device information and a list of available technicians.

    Your instructions are:
    1.  Use the 'pingDevice' tool with the provided 'deviceIp' to check its reachability.
    2.  If the 'pingDevice' tool returns 'true', it means the device is reachable. In this case, your final output must be:
        - isReachable: true
        - alertCreated: false
        - issue: "Device {{{deviceId}}} is online and reachable."
    3.  If the 'pingDevice' tool returns 'false', it means the device is unreachable. You must then perform the following steps sequentially:
        a. Use the 'findClosestTechnician' tool to find the closest available technician. Pass the device's latitude ('{{{latitude}}}'), longitude ('{{{longitude}}}'), and the list of 'assignedTechs' to this tool.
        b. The 'findClosestTechnician' tool will return a technician ID or be empty if no technicians are available.
        c. Formulate an issue description string based on the result of the previous step.
            - If a technician was found, the issue description must be: "Device {{{deviceId}}} is unreachable. Alert created and assigned to technician {{technicianId}}." (replace {{technicianId}} with the actual ID returned).
            - If no technician was found, the issue description must be: "Device {{{deviceId}}} is unreachable. Alert created. No technicians available to assign."
        d. Use the 'createAlert' tool. You must pass it the 'deviceId', 'deviceType', 'latitude', 'longitude', the exact issue description you just formulated, and the 'assignedTechId' (if one was found).
        e. After the alert is created, formulate your final output, which must be:
            - isReachable: false
            - alertCreated: true
            - assignedTechId: The ID of the assigned technician (or undefined).
            - issue: The issue description you formulated in step 3c.

    Follow these instructions precisely. Do not deviate from this logic. Your final response must be based on the outcomes of the tool calls.
    `,
});

const autoFaultDetectionFlow = ai.defineFlow(
  {
    name: 'autoFaultDetectionFlow',
    inputSchema: AutoFaultDetectionInputSchema,
    outputSchema: AutoFaultDetectionOutputSchema,
  },
  async (input) => {
    const {output} = await autoFaultDetectionFlowPrompt(input);
    return output!;
  }
);
