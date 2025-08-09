
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { firebaseConfig } from '@/lib/firebase';

// IMPORTANT: This file is now the single source of truth for server-side
// Google Cloud authentication. The Genkit plugin initializes first, and the
// Firebase Admin SDK relies on the context it establishes.

export const ai = genkit({
  plugins: [googleAI({ projectId: firebaseConfig.projectId })],
});
