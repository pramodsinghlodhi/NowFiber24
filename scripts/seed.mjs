import {initializeApp} from 'firebase/app';
import {getAuth, signInWithEmailAndPassword} from 'firebase/auth';
import {getFirestore, collection, doc, writeBatch} from 'firebase/firestore';
import {getApps, initializeApp as initializeAdminApp, getApp as getAdminApp} from 'firebase-admin/app';
import {getAuth as getAdminAuth} from 'firebase-admin/auth';
import {credential} from 'firebase-admin';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({path: '.env.local'});

// THIS IS THE CLIENT-SIDE CONFIG FOR THE SEEDER SCRIPT'S ADMIN USER
const firebaseConfig = {
  projectId: 'fibervision-k710i',
  appId: '1:172145809929:web:a23916b46c09cdc77b76d8',
  storageBucket: 'fibervision-k710i.firebasestorage.app',
  apiKey: 'AIzaSyDSJptmjeH4scK305Nz_rBqlfNa3MGF-u8',
  authDomain: 'fibervision-k710i.firebaseapp.com',
  messagingSenderId: '172145809929',
};

// THIS IS THE ADMIN SDK CONFIG FOR CREATING USERS
// Ensure you have the service account key file and GOOGLE_APPLICATION_CREDENTIALS set up
if (!getApps().length) {
  try {
    initializeAdminApp({
      credential: credential.applicationDefault(),
      projectId: 'fibervision-k710i',
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (e) {
    console.error(
      'ERROR: Could not initialize Firebase Admin SDK. \n' +
        'Please ensure your GOOGLE_APPLICATION_CREDENTIALS environment variable is set correctly. \n',
      e
    );
    process.exit(1);
  }
}

const adminAuth = getAdminAuth();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const dataDir = path.join(process.cwd(), 'src', 'lib', 'data');

async function seedDatabase() {
  console.log('> Seeding database...');

  const adminEmail = process.env.FIREBASE_ADMIN_EMAIL;
  const adminPassword = process.env.FIREBASE_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error(
      'ERROR: FIREBASE_ADMIN_EMAIL and FIREBASE_ADMIN_PASSWORD must be set in .env.local'
    );
    return;
  }

  try {
    console.log('> Authenticating as admin...');
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('> Admin authenticated successfully.');
  } catch (error) {
    console.error('ERROR: Failed to authenticate admin user.', error.message);
    console.log(
      'Please ensure the admin user exists in Firebase Auth and the credentials in .env.local are correct.'
    );
    return;
  }

  // --- TECHNICIAN AND USER CREATION ---
  try {
    console.log('> Processing technicians.json to create users...');
    const techniciansPath = path.join(dataDir, 'technicians.json');
    const techniciansContent = await fs.readFile(techniciansPath, 'utf-8');
    const techniciansData = JSON.parse(techniciansContent);

    const batch = writeBatch(db);

    for (const key in techniciansData) {
      const technician = techniciansData[key];
      const techId = technician.id;
      const email = `${techId}@fibervision.com`;
      const password = 'password'; // Default password for all technicians

      let userRecord;
      try {
        // Check if user already exists
        userRecord = await adminAuth.getUserByEmail(email);
        console.log(`- User ${email} already exists with UID: ${userRecord.uid}. Skipping creation.`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create user if not found
          userRecord = await adminAuth.createUser({
            email: email,
            password: password,
            displayName: technician.name,
          });
          console.log(`- Created new user ${email} with UID: ${userRecord.uid}`);
        } else {
          throw error;
        }
      }

      // Add user profile to 'users' collection
      const userDocRef = doc(db, 'users', userRecord.uid);
      const userData = {
        uid: userRecord.uid,
        id: techId,
        name: technician.name,
        role: 'Technician',
        isBlocked: technician.isBlocked || false,
        avatarUrl: technician.avatarUrl,
      };
      batch.set(userDocRef, userData);

      // Add technician profile to 'technicians' collection
      const techDocRef = doc(db, 'technicians', techId);
      batch.set(techDocRef, technician);
    }
    
    await batch.commit();
    console.log('> Successfully created/updated technician auth users and profiles.');

  } catch (error) {
    console.error('ERROR: Failed during technician and user creation phase.', error);
    return;
  }

  // --- GENERIC DATA SEEDING ---
  try {
    console.log('> Reading files from src/lib/data...');
    const files = await fs.readdir(dataDir);
    const jsonFiles = files.filter(
      (file) => file.endsWith('.json') && file !== 'technicians.json' && file !== 'users.json' // Exclude already processed files
    );

    console.log(`> Found ${jsonFiles.length} files to process.`);

    for (const file of jsonFiles) {
      console.log(`> Processing ${file}...`);
      const collectionName = path.basename(file, '.json');
      const filePath = path.join(dataDir, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      const batch = writeBatch(db);
      let count = 0;
      for (const key in data) {
        const docRef = doc(db, collectionName, key);
        batch.set(docRef, data[key]);
        count++;
      }
      await batch.commit();
      console.log(` - Uploaded ${count} documents to ${collectionName} collection.`);
    }
    console.log('> Database seeding completed successfully!');
  } catch (error) {
    console.error('ERROR: Failed during generic data seeding phase.', error);
  }
}

seedDatabase();
