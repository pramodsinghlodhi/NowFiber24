// This script populates the Firestore database with mock data.
// It reads all .json files in the src/lib/data directory and uploads them.

import { readdir, readFile } from 'fs/promises';
import { join }_from 'path';
import { initializeApp as initializeAdminApp, cert, getApps as getAdminApps, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

import { initializeApp, signInWithEmailAndPassword } from 'firebase/app';
import { getAuth as getClientAuth } from 'firebase/auth';

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });


async function main() {
  console.log('> Seeding database...');

  // --- Admin SDK Setup ---
  const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS ? 
      JSON.parse(await readFile(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')) : undefined;

  if (!serviceAccount) {
      console.error('ERROR: GOOGLE_APPLICATION_CREDENTIALS environment variable not set.');
      console.error('Please download your service account key from Firebase and set the path.');
      process.exit(1);
  }
  
  // Ensure we have a clean slate for the admin app instance
  if (getAdminApps().length) {
    await Promise.all(getAdminApps().map(app => deleteApp(app)));
  }

  const adminApp = initializeAdminApp({
    credential: cert(serviceAccount),
  });

  const db = getFirestore(adminApp);
  const adminAuth = getAuth(adminApp);
  
  const adminEmail = process.env.FIREBASE_ADMIN_EMAIL;
  
  if (!adminEmail) {
      console.error('ERROR: FIREBASE_ADMIN_EMAIL is not set in your .env.local file.');
      process.exit(1);
  }

  // --- Set Admin Custom Claim ---
  try {
      console.log('> Setting custom claim for admin user...');
      const adminUserRecord = await adminAuth.getUserByEmail(adminEmail);
      await adminAuth.setCustomUserClaims(adminUserRecord.uid, { isAdmin: true, role: 'Admin', userId: 'admin' });
      console.log(`> Custom claim { isAdmin: true } set for ${adminEmail}.`);
  } catch(error) {
      console.error("ERROR: Could not set custom claim. Ensure the admin user exists in Firebase Auth.", error);
      process.exit(1);
  }


  // --- Client SDK Setup (for getting ID token) ---
  const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
  
  // This step is no longer needed just for seeding, but keeping the structure
  // in case we need client-level operations in the future.

  // --- Data Uploading ---
  const dataDir = join(process.cwd(), 'src', 'lib', 'data');
  try {
    const files = await readdir(dataDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`> Reading files from ${dataDir}...`);

    for (const file of jsonFiles) {
        if (file === 'users.json') continue; // Skip users.json as it's handled by user creation
        
        console.log(`> Uploading ${file}...`);
        const collectionName = file.replace('.json', '');
        const filePath = join(dataDir, file);
        const fileContent = await readFile(filePath, 'utf8');
        const data = JSON.parse(fileContent);

        const collectionRef = db.collection(collectionName);
        const batch = db.batch();

        for (const docId in data) {
            const docRef = collectionRef.doc(docId);
            batch.set(docRef, data[docId]);
        }
        await batch.commit();
    }

    console.log('> Database seeding completed successfully!');
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
