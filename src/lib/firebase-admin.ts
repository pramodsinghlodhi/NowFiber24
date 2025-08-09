
'use server';

import { initializeApp as initializeAdminApp, getApps as getAdminApps, App as AdminApp, ServiceAccount, credential } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

let adminApp: AdminApp;

if (!getAdminApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
        adminApp = initializeAdminApp({
            credential: credential.cert(serviceAccount)
        });
    } else {
        adminApp = initializeAdminApp();
    }
} else {
    adminApp = getAdminApps()[0];
}

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
