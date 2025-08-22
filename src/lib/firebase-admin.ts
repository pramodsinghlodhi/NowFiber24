import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { User } from './types';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';

// This file is now the single source of truth for all server-side SDK initializations.
// It ensures that Firebase Admin and Genkit are initialized only once.

// Use environment variables for service account credentials
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Replace escaped newlines from environment variable
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

if (!getApps().length) {
  try {
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        throw new Error('Firebase Admin SDK credentials are not set in environment variables. Please check your .env.local file.');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    });

    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("CRITICAL: Firebase Admin SDK Initialization Failed.", error);
    // Throwing the error here will prevent the app from starting with a broken config.
    throw new Error(`Could not initialize Firebase Admin SDK. Please check your service account credentials. Details: ${error.message}`);
  }
}

const adminApp = admin.app();
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);


// Initialize Genkit in the same central location
export const ai = genkit({
  plugins: [googleAI({
    apiKey: process.env.GEMINI_API_KEY,
  })],
});


export { adminApp, adminAuth, adminDb };
