
import { initializeApp as initializeAdminApp, getApps as getAdminApps, App as AdminApp, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: AdminApp;
let adminAuth: Auth;
let adminDb: Firestore;

function initializeAdmin() {
    if (getAdminApps().length > 0) {
        return getAdminApps()[0];
    }

    // When running on App Hosting, the FIREBASE_CONFIG env var is automatically set.
    // This is the recommended way to initialize.
    if (process.env.FIREBASE_CONFIG) {
        return initializeAdminApp();
    } 
    
    // For local development, you might use a service account file.
    try {
        const serviceAccount = require('../../serviceAccountKey.json');
        return initializeAdminApp({
            credential: cert(serviceAccount)
        });
    } catch (e: any) {
        // If the service account file is not found, log a warning.
        // This is expected in a deployed environment where FIREBASE_CONFIG should be used.
        if (e.code === 'MODULE_NOT_FOUND') {
            console.warn("serviceAccountKey.json not found. Using default initialization. This is normal for production deployments.");
             return initializeAdminApp();
        }
        // For other errors, re-throw them as they might be critical.
        console.error("Critical error initializing Firebase Admin SDK:", e);
        throw e;
    }
}

function getAdminApp(): AdminApp {
    if (!adminApp) {
        adminApp = initializeAdmin();
    }
    return adminApp;
}

export function getAdminDb(): Firestore {
    if (!adminDb) {
        adminDb = getFirestore(getAdminApp());
    }
    return adminDb;
}

export function getAdminAuth(): Auth {
    if (!adminAuth) {
        adminAuth = getAuth(getAdminApp());
    }
    return adminAuth;
}
