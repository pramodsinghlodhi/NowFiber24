
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This configuration is for the CLIENT-SIDE app.
// It is exposed to the browser and is not a secret.
// Security is handled by Firestore Security Rules.
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};


// Client-side Firebase app initialization
let app;
if (!getApps().length) {
    try {
        if (!firebaseConfig.apiKey) {
            throw new Error("Missing Firebase API key for client-side app. Check your NEXT_PUBLIC_FIREBASE_API_KEY environment variable.");
        }
        app = initializeApp(firebaseConfig);
    } catch (e) {
        console.error("CRITICAL: Client-side Firebase initialization failed.", e);
        // We can show a friendly error to the user if Firebase fails to load.
        // For now, we will log the error. In a production app, you might want to
        // render a fallback UI.
    }
} else {
    app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

    