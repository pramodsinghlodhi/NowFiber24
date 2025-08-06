
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { config as dotenvConfig } from 'dotenv';
import { readdir, readFile } from 'fs/promises';
import { resolve, join } from 'path';

// Load environment variables from .env.local
dotenvConfig({ path: resolve(process.cwd(), '.env.local') });

console.log('> Seeding database...');

// Initialize Firebase Admin SDK
try {
  initializeApp({
    credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)),
    storageBucket: `${JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS).project_id}.appspot.com`
  });
  console.log('> Firebase Admin SDK initialized successfully.');
} catch (error) {
  console.error('> Error initializing Firebase Admin SDK:', error.message);
  console.error('> Please ensure your GOOGLE_APPLICATION_CREDENTIALS environment variable is set correctly.');
  process.exit(1);
}

const db = getFirestore();
const auth = getAuth();

async function setAdminClaim() {
    const adminEmail = process.env.FIREBASE_ADMIN_EMAIL;
    if (!adminEmail) {
        console.error('> FIREBASE_ADMIN_EMAIL is not set in .env.local. Skipping admin claim.');
        return;
    }

    console.log('> Setting custom claim for admin user...');
    try {
        const user = await auth.getUserByEmail(adminEmail);
        await auth.setCustomUserClaims(user.uid, { isAdmin: true });
        console.log(`> Custom claim { isAdmin: true } set for ${adminEmail}.`);
    } catch (error) {
        console.error(`> Error setting custom claim for ${adminEmail}:`, error.message);
        console.error('> Please ensure the admin user exists in Firebase Authentication before running this script.');
    }
}

async function seedDatabase() {
  await setAdminClaim();

  const dataDir = resolve(process.cwd(), 'src/lib/data');
  console.log(`> Reading files from ${dataDir}...`);

  try {
    const files = await readdir(dataDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    for (const file of jsonFiles) {
        // The collection name is the filename without the .json extension
        const collectionName = file.replace('.json', '');
        
        // Skip the users.json file as it's handled manually or via API
        if (collectionName === 'users') {
            console.log(`> Skipping ${file} (user profiles should be created via the app).`);
            continue;
        }

        console.log(`> Uploading ${file}...`);

        const filePath = join(dataDir, file);
        const fileContent = await readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        const collectionRef = db.collection(collectionName);
        const batch = db.batch();

        for (const docId in data) {
            if (Object.prototype.hasOwnProperty.call(data, docId)) {
                // The key of the JSON object is the document ID
                const docRef = collectionRef.doc(docId);
                batch.set(docRef, data[docId]);
            }
        }

        await batch.commit();
        console.log(`> Successfully seeded collection: ${collectionName}`);
    }

    console.log('> Database seeding completed successfully!');
  } catch (error) {
    console.error('> Error during database seeding:', error);
    process.exit(1);
  }
}

seedDatabase();
