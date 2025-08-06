
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth, signInWithEmailAndPassword, createUser, deleteUser } from 'firebase/auth';
import { getApp, getApps, initializeApp as initClientApp } from 'firebase/app';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// =====================================================================================
// IMPORTANT: Firebase Client SDK Configuration (for authenticating the admin script)
// =====================================================================================
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const clientApp = !getApps().length ? initClientApp(firebaseConfig) : getApp();
const clientAuth = getAuth(clientApp);


// =====================================================================================
// Firebase Admin SDK Configuration (for writing data with admin privileges)
// =====================================================================================
// This assumes you have the GOOGLE_APPLICATION_CREDENTIALS env var set up
// or are running in a GCP environment.
try {
  initializeApp();
} catch (e) {
  if (getApps().length === 0) {
    console.error("Could not initialize Firebase Admin SDK. Ensure you have GOOGLE_APPLICATION_CREDENTIALS set or are running in a GCP environment.");
    process.exit(1);
  }
}

const db = getFirestore();
const adminAuth = getAuth();

const dataDir = path.join(process.cwd(), 'src', 'lib', 'data');

async function seedCollection(collectionName, data) {
  console.log(`> Processing ${collectionName}.json...`);
  const collectionRef = db.collection(collectionName);
  const batch = db.batch();

  for (const docId in data) {
    const docData = data[docId];
    // Convert date strings to Firestore Timestamps where applicable
    if (docData.timestamp) {
      docData.timestamp = Timestamp.fromDate(new Date(docData.timestamp));
    }
    if (docData.completionTimestamp) {
        docData.completionTimestamp = Timestamp.fromDate(new Date(docData.completionTimestamp));
    }
    const docRef = collectionRef.doc(docId);
    batch.set(docRef, docData);
  }
  await batch.commit();
  console.log(`  - Uploaded ${Object.keys(data).length} documents to ${collectionName} collection.`);
}

async function seedTechniciansAndUsers() {
    console.log('> Processing technicians.json to create Auth and Firestore users...');
    const techFilePath = path.join(dataDir, 'technicians.json');
    if (!fs.existsSync(techFilePath)) {
        console.log('  - technicians.json not found, skipping.');
        return;
    }

    const techData = JSON.parse(fs.readFileSync(techFilePath, 'utf8'));
    let createdCount = 0;

    for (const techId in techData) {
        const tech = techData[techId];
        const email = `${tech.id}@fibervision.com`;
        const password = 'password'; // Default password for all seeded techs

        try {
            // 1. Create Firebase Auth user
            const userRecord = await adminAuth.createUser({
                email: email,
                password: password,
                displayName: tech.name,
            });
            console.log(`  - Created auth user for ${email} with UID: ${userRecord.uid}`);
            
            // 2. Create corresponding document in 'users' collection
            const userDocRef = db.collection('users').doc(userRecord.uid);
            await userDocRef.set({
                uid: userRecord.uid,
                id: tech.id,
                name: tech.name,
                role: 'Technician',
                isBlocked: false, // Default to not blocked
                avatarUrl: tech.avatarUrl || `https://i.pravatar.cc/150?u=${tech.id}`,
            });

            // 3. Create document in 'technicians' collection
            const techDocRef = db.collection('technicians').doc(tech.id);
            await techDocRef.set(tech);

            createdCount++;

        } catch (error) {
            if (error.code === 'auth/email-already-exists') {
                console.warn(`  - Auth user for ${email} already exists. Skipping creation for this technician.`);
                // Ensure technician doc still exists if auth user does
                 const techDocRef = db.collection('technicians').doc(tech.id);
                 await techDocRef.set(tech, { merge: true });

            } else {
                console.error(`  - Failed to create technician ${tech.id}:`, error);
            }
        }
    }
     if (createdCount > 0) {
        console.log(`  - Successfully created and linked ${createdCount} new technicians.`);
     }
}

async function main() {
  console.log('> Seeding database...');

  // Authenticate as the admin user using the CLIENT SDK
  console.log('> Authenticating as admin...');
  const adminEmail = process.env.FIREBASE_ADMIN_EMAIL;
  const adminPassword = process.env.FIREBASE_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('FIREBASE_ADMIN_EMAIL and FIREBASE_ADMIN_PASSWORD must be set in .env.local');
    return;
  }
  
  try {
      await signInWithEmailAndPassword(clientAuth, adminEmail, adminPassword);
      console.log('> Admin authenticated successfully.');
  } catch (error) {
      console.error('Failed to authenticate admin user:', error.message);
      console.log('Please ensure the admin user exists in Firebase Auth and credentials in .env.local are correct.');
      return;
  }

  // Seeding process starts here
  console.log(`> Reading files from ${dataDir}...`);
  const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
  console.log(`> Found ${files.length} files to process.`);

  // First, create technicians and their auth/user profiles
  await seedTechniciansAndUsers();
  
  // Then, seed all other collections
  for (const file of files) {
    const collectionName = path.basename(file, '.json');
    // Skip technicians.json because it's handled separately
    // Skip users.json because it's now created dynamically
    if (collectionName === 'technicians' || collectionName === 'users') {
        continue;
    }
    const filePath = path.join(dataDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    await seedCollection(collectionName, data);
  }

  console.log('> Database seeding completed successfully!');
}

main().catch(err => {
  console.error('An error occurred during database seeding:', err);
});
