import {initializeApp} from 'firebase/app';
import {getAuth, signInWithEmailAndPassword, signOut} from 'firebase/auth';
import {getFirestore, collection, doc, writeBatch} from 'firebase/firestore';
import {initializeApp as initializeAdminApp, getApps, cert} from 'firebase-admin/app';
import {getAuth as getAdminAuth} from 'firebase-admin/auth';
import {getFirestore as getAdminFirestore} from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({path: '.env.local'});

// --- IMPORTANT ---
// Load Firebase config from `src/lib/firebase.ts`
// This is a bit of a hack to avoid duplicating the config.
const firebaseConfigStr = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/firebase.ts'), 'utf8');
const match = firebaseConfigStr.match(/const firebaseConfig = (\{[^;]+\});/);
if (!match) {
  throw new Error('Could not find firebaseConfig in src/lib/firebase.ts');
}
const firebaseConfig = JSON.parse(match[1]);
// --- END HACK ---

// Initialize Firebase client app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Firebase Admin SDK
// The admin SDK is required to set custom claims.
let adminApp;
if (!getApps().length) {
    adminApp = initializeAdminApp();
} else {
    adminApp = getApps()[0];
}
const adminAuth = getAdminAuth(adminApp);


async function main() {
  console.log('> Seeding database...');
  const adminEmail = process.env.FIREBASE_ADMIN_EMAIL;
  const adminPassword = process.env.FIREBASE_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('Error: FIREBASE_ADMIN_EMAIL and FIREBASE_ADMIN_PASSWORD must be set in your .env.local file.');
    return;
  }

  try {
    // Authenticate as the admin user to perform writes
    console.log('> Authenticating as admin...');
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('> Admin authenticated successfully.');
    
    // --- Set Admin Custom Claim ---
    console.log('> Setting custom claim for admin user...');
    const adminUser = await adminAuth.getUserByEmail(adminEmail);
    await adminAuth.setCustomUserClaims(adminUser.uid, { isAdmin: true });
    console.log(`> Custom claim { isAdmin: true } set for ${adminEmail}.`);
    // --- End Custom Claim ---

    const dataDir = path.resolve(process.cwd(), 'src/lib/data');
    console.log(`> Reading files from ${dataDir}...`);
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
    console.log(`> Found ${files.length} files to process.`);

    for (const file of files) {
      if (file === 'users.json') continue; // Skip users.json as it's handled separately
      
      const collectionName = path.basename(file, '.json');
      console.log(`> Processing ${file}...`);
      
      const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
      const data = JSON.parse(content);

      if (Object.keys(data).length === 0) {
        console.log(` - Skipping ${file} as it is empty.`);
        continue;
      }

      const batch = writeBatch(db);
      Object.entries(data).forEach(([docId, docData]) => {
        const docRef = doc(db, collectionName, docId);
        batch.set(docRef, docData);
      });

      await batch.commit();
      console.log(` - Uploaded ${Object.keys(data).length} documents to ${collectionName} collection.`);
    }

    // Now handle users separately to ensure UIDs are managed correctly
    await seedUsers();
    
    await signOut(auth);
    console.log('> Database seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

async function seedUsers() {
    console.log('> Processing users.json...');
    const usersDataPath = path.resolve(process.cwd(), 'src/lib/data/users.json');
    const content = fs.readFileSync(usersDataPath, 'utf8');
    const usersData = JSON.parse(content);

    if (Object.keys(usersData).length === 0) {
        console.log(' - No users found in users.json to seed.');
        return;
    }
    
    // The admin user document is created manually.
    // This script will handle creating auth users for technicians and their corresponding Firestore documents.
    
    for (const techId in usersData) {
        const techInfo = usersData[techId];
        const email = `${techInfo.id}@fibervision.com`;
        const password = techInfo.password || 'password'; // Default password if not provided
        
        try {
            // Check if user already exists in Auth
            let userRecord;
            try {
                userRecord = await adminAuth.getUserByEmail(email);
                console.log(` - Auth user for ${email} already exists. UID: ${userRecord.uid}`);
            } catch (e) {
                // If user does not exist, create them
                if (e.code === 'auth/user-not-found') {
                    console.log(` - Creating auth user for ${email}...`);
                    userRecord = await adminAuth.createUser({
                        email: email,
                        password: password,
                        displayName: techInfo.name,
                    });
                    console.log(` - Created new auth user. UID: ${userRecord.uid}`);
                } else {
                    throw e; // Re-throw other errors
                }
            }

            // Create user document in Firestore with the correct UID
            const userDocRef = doc(db, 'users', userRecord.uid);
            await getAdminFirestore().collection('users').doc(userRecord.uid).set({
                uid: userRecord.uid,
                id: techInfo.id,
                name: techInfo.name,
                role: 'Technician',
                isBlocked: false,
                avatarUrl: `https://i.pravatar.cc/150?u=${techInfo.id}`
            });
            console.log(` - Set Firestore document for user ${techInfo.id}`);

        } catch (error) {
            console.error(` - Failed to process technician ${techId}. Error:`, error.message);
        }
    }
}


main();
