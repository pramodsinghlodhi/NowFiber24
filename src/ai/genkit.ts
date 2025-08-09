
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebaseConfig} from '@/lib/firebase';

// Initialize Genkit and establish it as the primary authenticator for all
// server-side Google Cloud services by explicitly providing the projectId.
export const ai = genkit({
  plugins: [googleAI({projectId: firebaseConfig.projectId})],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
