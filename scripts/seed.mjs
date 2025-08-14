
import {initializeApp} from 'firebase/app';
import {getAuth, signInWithEmailAndPassword} from 'firebase/auth';
import {getFirestore, collection, doc, writeBatch} from 'firebase/firestore';
import {getFiles, time, login, setCustomClaim} from './script-utils.mjs';
import * as dotenv from 'dotenv';
dotenv.config({path: './.env.local'});

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID,
};

// --- DO NOT EDIT BELOW THIS LINE ---

async function seedDatabase() {
  try {
    console.log('> Seeding database...');
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Login as the admin user
    const adminUser = await login(
      auth,
      process.env.FIREBASE_ADMIN_EMAIL,
      process.env.FIREBASE_ADMIN_PASSWORD
    );
    console.log('> Logged in as admin');

    // Set the custom claim for the admin user to ensure rules work
    await setCustomClaim(adminUser.uid);
    console.log('> Admin custom claim set successfully.');

    // Get the list of JSON files
    const files = await getFiles();
    console.log('> Reading files from src/lib/data...');

    // Get the UIDs for the technicians from the users collection
    const techUsers = {
      'tech-001': 'some-uid-placeholder-1',
      'tech-002': 'some-uid-placeholder-2',
      'tech-003': 'some-uid-placeholder-3',
    };

    const userDocs = [];
    for (const file of files) {
      if (file.name === 'users.json') {
        // Handle user seeding first to get UIDs
        for (const [key, value] of Object.entries(file.content)) {
          if (key.startsWith('tech-')) {
            const newId = key;
            const newUser = value;
            techUsers[newId] = newUser.uid;
            userDocs.push({uid: newUser.uid, data: newUser});
          }
        }
        break;
      }
    }

    const batch = writeBatch(db);

    for (const file of files) {
      const collectionName = file.name.replace('.json', '');
      console.log(`> Uploading ${file.name}...`);

      if (collectionName === 'users') {
        // We've handled users already to get UIDs, now add them to the batch
        userDocs.forEach(({uid, data}) => {
          const docRef = doc(db, 'users', uid);
          batch.set(docRef, data);
        });
        // Also add the main admin user, replacing the placeholder doc ID
        const adminData = file.content['admin-uid'];
        const adminDocRef = doc(db, 'users', adminUser.uid);
        batch.set(adminDocRef, adminData);
        continue; // Skip the generic loop below
      }

      for (const [key, value] of Object.entries(file.content)) {
        let data = value;

        // If the collection is 'tasks' or 'referrals', replace the placeholder tech_id with the actual UID
        if (
          (collectionName === 'tasks' || collectionName === 'referrals') &&
          data.tech_id &&
          techUsers[data.tech_id]
        ) {
          data.tech_id = techUsers[data.tech_id];
        }

        const docRef = doc(db, collectionName, key);
        batch.set(docRef, data);
      }
    }

    await batch.commit();
    console.log('> Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('> Error seeding database:', error.message);
    process.exit(1);
  }
}

time(seedDatabase);
