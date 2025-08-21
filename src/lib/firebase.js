
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    "projectId":"nowfiber24-prod",
    "appId":"1:696733926983:web:9697d0cff33625685c5362",
    "storageBucket":"nowfiber24-prod.firebasestorage.app",
    "apiKey":"AIzaSyCnhdO7XRc03E3E4NlHk-jeSiRyIAosfuE",
    "authDomain":"nowfiber24-prod.firebaseapp.com",
    "messagingSenderId":"696733926983"
};

// Client-side Firebase app initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
