import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyCnhdO7XRc03E3E4NlHk-jeSiRyIAosfuE",
  authDomain: "nowfiber24-prod.firebaseapp.com",
  projectId: "nowfiber24-prod",
  storageBucket: "nowfiber24-prod.appspot.com", // ✅ corrected
  messagingSenderId: "696733926983",
  appId: "1:696733926983:web:9697d0cff33625685c5362",
  measurementId: "G-YY2ZLYV6WH"
};

// Client-side Firebase app initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
