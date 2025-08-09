
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// IMPORTANT: This file is now the single source of truth for server-side
// Google Cloud authentication. The Genkit plugin initializes first, and the
// Firebase Admin SDK relies on the context it establishes.
// It will automatically pick up the credentials from the GOOGLE_APPLICATION_CREDENTIALS
// environment variable, which should be set in your .env file.

export const ai = genkit({
  plugins: [googleAI()],
});
