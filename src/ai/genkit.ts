
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// By initializing the googleAI plugin, we are establishing the
// authentication context for all Google Cloud services on the server,
// including the Firebase Admin SDK.
// The 'ai' object is exported for use in AI flows.
export const ai = genkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
