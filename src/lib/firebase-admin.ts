
'use server';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { initializeApp as initializeAdminApp, getApps as getAdminApps, App as AdminApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: AdminApp;

const serviceAccount: ServiceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

// Rename keys to match what Firebase expects BEFORE using the object
if (serviceAccount.projectId) {
    serviceAccount.project_id = serviceAccount.projectId;
    delete serviceAccount.projectId;
}
if (serviceAccount.clientEmail) {
    serviceAccount.client_email = serviceAccount.clientEmail;
    delete serviceAccount.clientEmail;
}
if (serviceAccount.privateKey) {
    serviceAccount.private_key = (serviceAccount.privateKey || '').replace(/\\n/g, '\n');
    delete serviceAccount.privateKey;
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
