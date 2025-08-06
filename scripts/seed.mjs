
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth as getClientAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp as initializeClientApp, getApps as getClientApps } from 'firebase/app';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';


// This needs to match the config in src/lib/firebase.ts for the client SDK.
const firebaseConfig = {
  "projectId": "fibervision-k710i",
  "appId": "1:172145809929:web:a23916b46c09cdc77b76d8",
  "storageBucket": "fibervision-k710i.firebasestorage.app",
  "apiKey": "AIzaSyDSJptmjeH4scK305Nz_rBqlfNa3MGF-u8",
  "authDomain": "fibervision-k710i.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "172145809929"
};

// Initialize Admin SDK
if (!getApps().length) {
    try {
        initializeApp({
            credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS)
        });
        console.log("Firebase Admin SDK initialized with service account.");
    } catch (e) {
        console.warn("Could not initialize Admin SDK with service account, falling back to application default. Make sure you've run 'gcloud auth application-default login'.", e.message);
        initializeApp();
    }
}
const adminAuth = getAuth();
const db = getFirestore();

// Initialize Client SDK
const clientApp = !getClientApps().length ? initializeClientApp(firebaseConfig) : getClientApps()[0];
const clientAuth = getClientAuth(clientApp);


async function main() {
    console.log('Seeding database...');
    
    // Authenticate as Admin to get an ID token with custom claims
    const adminEmail = process.env.FIREBASE_ADMIN_EMAIL;
    const adminPassword = process.env.FIREBASE_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.error('FIREBASE_ADMIN_EMAIL and FIREBASE_ADMIN_PASSWORD must be set in .env.local');
        return;
    }
    
    console.log('Authenticating as admin...');
    try {
        // First, set a custom claim on the admin user to ensure they have permissions
        const adminUserRecord = await adminAuth.getUserByEmail(adminEmail);
        await adminAuth.setCustomUserClaims(adminUserRecord.uid, { isAdmin: true });
        console.log(`Custom claim { isAdmin: true } set for ${adminEmail}.`);

        // Now, sign in as that user to perform Firestore operations
        await signInWithEmailAndPassword(clientAuth, adminEmail, adminPassword);
        console.log('Admin authenticated successfully.');

    } catch (error) {
        console.error('Error during admin authentication or claim setting:', error.message);
        console.log("Please ensure the admin user exists in Firebase Auth and the credentials in .env.local are correct.");
        return;
    }


    const dataDir = path.join(process.cwd(), 'src', 'lib', 'data');
    console.log(`Reading files from ${dataDir}...`);
    
    const files = await fs.readdir(dataDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    for (const file of jsonFiles) {
        const collectionName = path.basename(file, '.json');
        
        // Skip the users file, as it's manually created and managed
        if (collectionName === 'users') {
            console.log("Skipping users.json as it's managed manually.");
            continue;
        }

        const filePath = path.join(dataDir, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContent);

        console.log(`Seeding collection: ${collectionName}`);
        
        const batch = db.batch();
        Object.entries(data).forEach(([docId, docData]) => {
            const docRef = db.collection(collectionName).doc(docId);
            batch.set(docRef, docData);
        });

        try {
            await batch.commit();
            console.log(`Successfully seeded ${Object.keys(data).length} documents into ${collectionName}.`);
        } catch (error) {
            console.error(`Error seeding collection ${collectionName}:`, error.message);
        }
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
