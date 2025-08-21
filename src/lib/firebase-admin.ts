
import * as admin from 'firebase-admin';
import { App, getApps } from 'firebase-admin/app';
import { Auth } from 'firebase-admin/auth';
import { Firestore } from 'firebase-admin/firestore';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This file is now the single source of truth for all server-side SDK initializations.
// It ensures that Firebase Admin and Genkit are initialized only once.

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

if (!getApps().length) {
    try {
        admin.initializeApp();
        console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
        console.error("CRITICAL: Firebase Admin SDK Initialization Failed.", error);
        // Throwing the error here will prevent the app from starting with a broken config.
        throw new Error("Could not initialize Firebase Admin SDK. Please check your service account credentials.");
    }
}

adminApp = admin.app();
adminAuth = admin.auth();
adminDb = admin.firestore();

// Initialize Genkit in the same central location
export const ai = genkit({
  plugins: [googleAI()],
});


export { adminApp, adminAuth, adminDb };
