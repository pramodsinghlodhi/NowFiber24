
'use server';

/**
 * @fileOverview This flow traces the physical path of a fiber connection between two network devices.
 *
 * - traceRoute - A function that handles the route tracing process.
 * - TraceRouteInput - The input type for the traceRoute function.
 * - TraceRouteOutput - The return type for the traceRoute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, getDocs } from 'firebase/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { Infrastructure, Connection } from '@/lib/types';


const TraceRouteInputSchema = z.object({
  startDeviceId: z.string().describe('The ID of the starting device (e.g., OLT-01).'),
  endDeviceId: z.string().describe('The ID of the ending device (e.g., ONU-101).'),
});
export type TraceRouteInput = z.infer<typeof TraceRouteInputSchema>;

const TraceRouteOutputSchema = z.object({
  path: z.array(z.object({
    id: z.string(),
    deviceType: z.string(),
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
    status: z.string(),
    attributes: z.any().optional(),
  })).describe('An ordered array of devices representing the path from start to end.'),
  notes: z.string().describe('Notes about the traced path, including any issues found.'),
});
export type TraceRouteOutput = z.infer<typeof TraceRouteOutputSchema>;

export async function traceRoute(input: TraceRouteInput): Promise<TraceRouteOutput> {
  return traceRouteFlow(input);
}

const findPath = async (startId: string, endId: string, infrastructure: Infrastructure[], connections: Connection[]): Promise<Infrastructure[]> => {
    const path: Infrastructure[] = [];
    const visited = new Set<string>();
    const queue: string[][] = [[startId]];
    let foundPath: string[] = [];

    while (queue.length > 0) {
        const currentPath = queue.shift()!;
        const currentId = currentPath[currentPath.length - 1];

        if (currentId === endId) {
            foundPath = currentPath;
            break;
        }

        if (!visited.has(currentId)) {
            visited.add(currentId);

            const neighbors = connections
                .filter(c => c.from === currentId || c.to === currentId)
                .map(c => (c.from === currentId ? c.to : c.from));
            
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    const newPath = [...currentPath, neighbor];
                    queue.push(newPath);
                }
            }
        }
    }

    if (foundPath.length > 0) {
        return foundPath.map(id => infrastructure.find(d => d.id === id)!);
    }
    
    return [];
};


const traceRouteFlow = ai.defineFlow(
  {
    name: 'traceRouteFlow',
    inputSchema: TraceRouteInputSchema,
    outputSchema: TraceRouteOutputSchema,
  },
  async ({ startDeviceId, endDeviceId }) => {
    const adminDb = getAdminDb();
    // Fetch infrastructure and connections from Firestore
    const infraSnapshot = await getDocs(collection(adminDb, 'infrastructure'));
    const mockInfrastructure = infraSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Infrastructure[];

    const connSnapshot = await getDocs(collection(adminDb, 'connections'));
    const mockConnections = connSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Connection[];

    const path = await findPath(startDeviceId, endDeviceId, mockInfrastructure, mockConnections);
    
    if (path.length === 0) {
      return {
        path: [],
        notes: `No direct or indirect physical path could be traced between ${startDeviceId} and ${endDeviceId}. Please check network connection data.`
      };
    }
    
    const pathWithDetails = path.map(device => ({
        id: device.id,
        deviceType: device.type,
        name: device.name,
        lat: device.lat,
        lng: device.lng,
        status: device.status,
        attributes: device.attributes
    }));

    return {
      path: pathWithDetails,
      notes: `Successfully traced path with ${path.length} hops. The connection utilizes ${path[1]?.attributes?.tubeColor} tube and ${path[1]?.attributes?.fiberColor} fiber core.`,
    };
  }
);

