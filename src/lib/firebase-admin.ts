
'use server';
import 'dotenv/config'
import { initializeApp as initializeAdminApp, getApps as getAdminApps, App as AdminApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: AdminApp;

const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
}

if (!getAdminApps().length) {
    adminApp = initializeAdminApp({
        credential: cert(serviceAccount)
    });
} else {
    adminApp = getAdminApps()[0];
}

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
