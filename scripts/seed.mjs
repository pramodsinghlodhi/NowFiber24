
import {initializeApp} from 'firebase/app';
import {getAuth, signInWithEmailAndPassword, getIdTokenResult} from 'firebase/auth';
import {getFirestore, collection, doc, setDoc, writeBatch, serverTimestamp} from 'firebase/firestore';
import {firebaseConfig} from '../src/lib/firebase.js';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const seedCollection = async (collectionName, data) => {
  const collectionRef = collection(db, collectionName);
  const batch = writeBatch(db);
  let count = 0;

  console.log(`> Uploading ${collectionName}.json...`);

  for (const docId in data) {
    if (Object.prototype.hasOwnProperty.call(data, docId)) {
        const docRef = doc(collectionRef, docId);
        const docData = data[docId];

        // Convert ISO string timestamps to Firestore Timestamps
        if (docData.timestamp) {
            docData.timestamp = new Date(docData.timestamp);
        }
         if (docData.completionTimestamp) {
            docData.completionTimestamp = new Date(docData.completionTimestamp);
        }

        batch.set(docRef, docData);
        count++;
    }
  }

  await batch.commit();
  console.log(`> Uploaded ${count} documents to '${collectionName}' collection.`);
};


const main = async () => {
    console.log('> Seeding database...');

    const adminEmail = process.env.FIREBASE_ADMIN_EMAIL;
    const adminPassword = process.env.FIREBASE_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.error('ERROR: FIREBASE_ADMIN_EMAIL and FIREBASE_ADMIN_PASSWORD must be set in your .env.local file.');
        return;
    }
    
    try {
        // Sign in as the admin user to perform operations
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log(`> Successfully authenticated as ${adminEmail}.`);

        // Read all JSON files from the data directory
        const dataDir = path.join(process.cwd(), 'src', 'lib', 'data');
        const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json') && file !== 'users.json');

        console.log('> Reading files from src/lib/data...');
        
        for (const file of files) {
            const collectionName = path.basename(file, '.json');
            const rawData = fs.readFileSync(path.join(dataDir, file), 'utf-8');
            const data = JSON.parse(rawData);
            await seedCollection(collectionName, data);
        }

        console.log('> Database seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Database seeding failed:', error);
        process.exit(1);
    }
};

main();
