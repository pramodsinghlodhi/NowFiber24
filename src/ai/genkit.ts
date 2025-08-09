
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// IMPORTANT: The Firebase Admin SDK in `src/lib/firebase-admin.ts` now handles its own
// robust authentication via a service account. Genkit should use its default credential
// discovery process to avoid conflicts. It will automatically pick up the same
// credentials if the environment is set up correctly.

export const ai = genkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
