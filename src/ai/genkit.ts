import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { firebaseConfig } from '@/lib/firebase';

export const ai = genkit({
  plugins: [googleAI({
    projectId: firebaseConfig.projectId
  })],
  model: 'googleai/gemini-2.0-flash',
});
