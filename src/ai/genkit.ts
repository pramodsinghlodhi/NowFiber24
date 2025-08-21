
import { ai } from '@/lib/firebase-admin';

// This file now re-exports the initialized Genkit instance from the central
// firebase-admin file. This ensures a single initialization point for all
// server-side Google Cloud services.

export { ai };
