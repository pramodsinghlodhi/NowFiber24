
import { initializeApp, getApp, getApps, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeApp as initializeAdminApp, getApps as getAdminApps, App as AdminApp, ServiceAccount, credential } from 'firebase-admin/app';
import 'dotenv/config'

const firebaseConfig: FirebaseOptions = {
  "projectId": "fibervision-k710i",
  "appId": "1:172145809929:web:a23916b46c09cdc77b76d8",
  "storageBucket": "fibervision-k710i.firebasestorage.app",
  "apiKey": "AIzaSyDSJptmjeH4scK305Nz_rBqlfNa3MGF-u8",
  "authDomain": "fibervision-k710i.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "172145809929"
};

// Client-side Firebase app initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);


// Server-side Firebase Admin SDK initialization
let adminApp: AdminApp;

if (!getAdminApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string) as ServiceAccount;
        adminApp = initializeAdminApp({
            credential: credential.cert(serviceAccount)
        });
    } else {
        // This will work in managed environments like Cloud Run, App Engine, etc.
        adminApp = initializeAdminApp();
    }
} else {
    adminApp = getAdminApps()[0];
}


export { app, auth, db, adminApp };
