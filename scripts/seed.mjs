import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// --- Your Firebase Configuration ---
// This configuration should ideally be loaded from a secure place,
// but for a seeding script, it can be here. Ensure this matches your src/lib/firebase.ts
const firebaseConfig = {
    "projectId": "fibervision-k710i",
    "appId": "1:172145809929:web:a23916b46c09cdc77b76d8",
    "storageBucket": "fibervision-k710i.firebasestorage.app",
    "apiKey": "AIzaSyDSJptmjeH4scK305Nz_rBqlfNa3MGF-u8",
    "authDomain": "fibervision-k710i.firebaseapp.com",
    "measurementId": "",
    "messagingSenderId": "172145809929"
  };

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const dataDir = join(process.cwd(), 'src', 'lib', 'data');

async function seedDatabase() {
    console.log('Seeding database...');
    
    // Authenticate as an admin user to get permissions
    const adminEmail = process.env.FIREBASE_ADMIN_EMAIL;
    const adminPassword = process.env.FIREBASE_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.error('Error: FIREBASE_ADMIN_EMAIL and FIREBASE_ADMIN_PASSWORD must be set in .env.local');
        process.exit(1);
    }
    
    try {
        console.log('Authenticating as admin...');
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log('Admin authenticated successfully.');
    } catch (error) {
        console.error('Failed to authenticate admin user:', error.message);
        console.error('Please ensure the admin user exists in Firebase Authentication and credentials in .env.local are correct.');
        process.exit(1);
    }

    try {
        console.log(`Reading files from ${dataDir}...`);
        const files = await readdir(dataDir);
        const jsonFiles = files.filter(file => file.endsWith('.json') && file !== 'users.json');
        
        // Always process users.json first to create Auth users
        const allFiles = ['users.json', ...jsonFiles];

        console.log(`Found ${allFiles.length} files to process.`);

        for (const file of allFiles) {
            const collectionName = file.replace('.json', '');
            console.log(`\nProcessing ${file}...`);
            
            const filePath = join(dataDir, file);
            const fileContent = await readFile(filePath, 'utf-8');
            const data = JSON.parse(fileContent);

            const batch = writeBatch(db);
            let docCount = 0;

            for (const docId in data) {
                if (Object.prototype.hasOwnProperty.call(data, docId)) {
                    const docData = data[docId];
                    let finalDocId = docId;

                    // Special handling for the 'users' collection to create Auth users
                    if (collectionName === 'users') {
                        const email = `${docData.id}@fibervision.com`;
                        // This part is for demonstration. In a real scenario, you'd want to avoid
                        // creating users if they already exist, but this script assumes a fresh start.
                        // The user document in Firestore itself will be created after this loop using the UID.
                        // For now, we'll just log it. We can't create auth users here without the Admin SDK.
                        // The manual step in README is the source of truth for user creation.
                    } else {
                        // For all other collections, the key from JSON is the document ID
                        const docRef = doc(db, collectionName, finalDocId);
                        batch.set(docRef, docData);
                        docCount++;
                    }
                }
            }

            if (docCount > 0) {
                await batch.commit();
                console.log(` - Uploaded ${docCount} documents to '${collectionName}' collection.`);
            } else if(collectionName !== 'users') {
                 console.log(` - No documents to upload for '${collectionName}'.`);
            } else {
                 console.log(` - 'users.json' is skipped for direct upload. Ensure users are created in Firebase Auth and Firestore manually.`);
            }
        }
        
        console.log('\nDatabase seeding completed successfully!');
    } catch (error) {
        console.error('\nAn error occurred during seeding:', error);
        process.exit(1);
    }
}

seedDatabase();
