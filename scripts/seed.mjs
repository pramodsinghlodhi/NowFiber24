import {initializeApp, cert} from 'firebase-admin/app';
import {getFirestore, Timestamp} from 'firebase-admin/firestore';
import {getAuth, signInWithEmailAndPassword} from 'firebase/auth';
import {getAuth as getAdminAuth} from 'firebase-admin/auth';
import {readFileSync, readdirSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';
import 'dotenv/config';

// --- IMPORTANT: CONFIGURE YOUR FIREBASE ADMIN SDK ---
// 1. Go to your Firebase Project Settings -> Service Accounts.
// 2. Click "Generate new private key" and download the JSON file.
// 3. Save it in the root of this project as `service-account.json`.
// 4. Ensure `service-account.json` is listed in your `.gitignore` file.
const serviceAccount = JSON.parse(
  readFileSync('./service-account.json', 'utf8')
);

const app = initializeApp({
  credential: cert(serviceAccount),
});

const clientAppConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
};
const clientAuth = getAuth(initializeApp(clientAppConfig, 'client-app'));

const db = getFirestore(app);
const adminAuth = getAdminAuth(app);

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../src/lib/data');

async function setAdminClaim(email) {
  try {
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.setCustomUserClaims(user.uid, {isAdmin: true});
    console.log(`Custom claim { isAdmin: true } set for ${email}.`);
  } catch (error) {
    console.error(`Error setting custom claim for ${email}:`, error);
    throw new Error('Failed to set admin claim. Ensure the admin user exists in Firebase Authentication.');
  }
}

async function seedCollection(fileName) {
  const collectionName = fileName.replace('.json', '');
  
  // The 'users' collection is handled manually and by the API, not by this script.
  if (collectionName === 'users') {
    return;
  }
  
  console.log(`Uploading ${fileName}...`);
  const fileContents = readFileSync(join(dataDir, fileName), 'utf8');
  const data = JSON.parse(fileContents);
  const collectionRef = db.collection(collectionName);
  
  for (const docId in data) {
    if (Object.prototype.hasOwnProperty.call(data, docId)) {
        let docData = data[docId];
        
        // Convert ISO string dates to Firestore Timestamps where applicable
        if (docData.timestamp) {
            docData.timestamp = Timestamp.fromDate(new Date(docData.timestamp));
        }
        if (docData.completionTimestamp) {
            docData.completionTimestamp = Timestamp.fromDate(new Date(docData.completionTimestamp));
        }

        await collectionRef.doc(docId).set(docData);
    }
  }
}

async function main() {
  console.log('> Seeding database...');

  const adminEmail = process.env.FIREBASE_ADMIN_EMAIL;
  const adminPassword = process.env.FIREBASE_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error(
      'Error: FIREBASE_ADMIN_EMAIL and FIREBASE_ADMIN_PASSWORD must be set in your .env.local file.'
    );
    return;
  }

  // Set the admin claim first
  console.log('> Setting custom claim for admin user...');
  await setAdminClaim(adminEmail);

  // Authenticate to get an ID token (though not strictly needed for Admin SDK writes, it confirms credentials work)
  await signInWithEmailAndPassword(clientAuth, adminEmail, adminPassword);
  
  const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));
  console.log(`> Reading files from ${dataDir}...`);

  for (const file of files) {
    await seedCollection(file);
  }

  console.log('> Database seeding completed successfully!');
}

main().catch(console.error);
