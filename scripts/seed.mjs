// This script is designed to be run from the command line to seed the Firestore database.
// It is not part of the application's runtime code.
// To run: `npm run db:seed`

// Note: This script uses the Firebase CLIENT SDK. It requires that you have a .env.local
// file with credentials for an admin user who has permissions to write to the database.
// This is NOT the Admin SDK.

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

// --- Configuration ---
// Your Firebase project config.
const firebaseConfig = {
  "projectId": "fibervision-k710i",
  "appId": "1:172145809929:web:a23916b46c09cdc77b76d8",
  "storageBucket": "fibervision-k710i.firebasestorage.app",
  "apiKey": "AIzaSyDSJptmjeH4scK305Nz_rBqlfNa3MGF-u8",
  "authDomain": "fibervision-k710i.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "172145809929"
};

// Admin user credentials from environment variables.
const ADMIN_EMAIL = process.env.FIREBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.FIREBASE_ADMIN_PASSWORD;
const DATA_DIR = join(process.cwd(), 'src', 'lib', 'data');


// Helper function to show progress
const showProgress = (count, total, collectionName) => {
    const percentage = ((count / total) * 100).toFixed(0);
    process.stdout.write(`  > Seeding ${collectionName}: ${percentage}% (${count}/${total}) complete\r`);
}


async function main() {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.error('\x1b[31m%s\x1b[0m', 'ERROR: Missing FIREBASE_ADMIN_EMAIL or FIREBASE_ADMIN_PASSWORD in your environment.');
        console.log('Please create a `.env.local` file in the root of your project with these variables.');
        process.exit(1);
    }
    
    console.log('--- Initializing Firebase and Authenticating Admin User ---');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    try {
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('\x1b[32m%s\x1b[0m', 'Admin authentication successful!');
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', `Admin authentication failed: ${error.message}`);
        process.exit(1);
    }

    console.log('\n--- Starting Database Seed Process ---');

    const files = readdirSync(DATA_DIR).filter(file => file.endsWith('.json') && file !== 'users.json');
    // We handle users.json separately because it's linked to auth UIDs.
    console.log('ℹ️  Note: The `users.json` file is skipped by this script.');
    console.log('   User profiles must be created with a corresponding auth account via the app or Firebase Console.');
    console.log('   Please see `src/lib/data/README.md` for instructions.\n');


    for (const file of files) {
        const collectionName = file.replace('.json', '');
        console.log(`\nProcessing collection: \x1b[36m${collectionName}\x1b[0m`);

        try {
            const filePath = join(DATA_DIR, file);
            const fileContent = readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent);
            const documents = Object.entries(data);
            const totalDocs = documents.length;

            if (totalDocs === 0) {
                console.log('  > No documents found. Skipping.');
                continue;
            }

            // Using batched writes for efficiency. Firestore allows up to 500 operations per batch.
            const batchSize = 400;
            for (let i = 0; i < totalDocs; i += batchSize) {
                const batch = writeBatch(db);
                const chunk = documents.slice(i, i + batchSize);
                
                for (const [docId, docData] of chunk) {
                    const docRef = doc(db, collectionName, docId);
                    batch.set(docRef, docData);
                }

                await batch.commit();
                showProgress(Math.min(i + batchSize, totalDocs), totalDocs, collectionName);
            }
             console.log(`\n  \x1b[32m✔ Success:\x1b[0m Collection '${collectionName}' seeded with ${totalDocs} documents.`);

        } catch (error) {
            console.error(`\n\x1b[31m%s\x1b[0m`, `  ✘ Error seeding collection '${collectionName}': ${error.message}`);
        }
    }
    
    console.log('\n--- Database Seed Process Complete ---\n');
    process.exit(0); // Exit successfully
}

main().catch(error => {
  console.error('\nAn unexpected error occurred:', error);
  process.exit(1);
});
