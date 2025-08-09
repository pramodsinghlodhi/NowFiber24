
import { initializeApp as initializeAdminApp, getApps as getAdminApps, App as AdminApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function initializeAdmin() {
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


const adminApp: AdminApp = getAdminApps().length > 0 ? getAdminApps()[0] : initializeAdmin();

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
