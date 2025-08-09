
import { initializeApp, getApp, getApps, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig: FirebaseOptions = {
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

export { app, auth, db };
