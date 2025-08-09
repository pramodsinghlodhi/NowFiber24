
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { firebaseConfig } from '@/lib/firebase';

// By initializing the googleAI plugin with the project ID, we are establishing
// the authentication context for all Google Cloud services on the server,
// including the Firebase Admin SDK.
export const ai = genkit({
  plugins: [googleAI({
    projectId: firebaseConfig.projectId,
  })],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
