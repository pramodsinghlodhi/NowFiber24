
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {"projectId":"nowfiber24-prod","appId":"1:34851993427:web:9c501f278d655f462a6839","storageBucket":"nowfiber24-prod.appspot.com","apiKey":"AIzaSyApG_44BGH1rU1T-aZfSAnEwrHfYpw2O7I","authDomain":"nowfiber24-prod.firebaseapp.com","messagingSenderId":"34851993427"};

// Client-side Firebase app initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
