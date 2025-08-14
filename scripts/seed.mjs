
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { readdir, readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { firebaseConfig } from '../src/lib/firebase.js';

// This script now relies on custom claims for admin role, set by the server-side setup.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log('> Seeding database...');

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Get admin credentials from environment variables
    const adminEmail = process.env.FIREBASE_ADMIN_EMAIL;
    const adminPassword = process.env.FIREBASE_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.error('Error: FIREBASE_ADMIN_EMAIL and FIREBASE_ADMIN_PASSWORD must be set in your .env.local file.');
        process.exit(1);
    }
    
    try {
        console.log(`> Authenticating as admin (${adminEmail})...`);
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log('> Admin authenticated successfully.');
    } catch (error) {
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('!!! CRITICAL: Admin authentication failed.');
        console.error(`!!! Make sure the admin user (${adminEmail}) exists in Firebase Authentication.`);
        console.error('!!! And that the credentials in your .env.local file are correct.');
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('Error details:', error.message);
        process.exit(1);
    }

    const dataDir = path.join(__dirname, '..', 'src', 'lib', 'data');
    console.log(`> Reading files from ${dataDir}...`);
    
    const files = await readdir(dataDir);
    const jsonFiles = files.filter(file => file.endsWith('.json') && file !== 'users.json' && file !== 'settings.json');
    
    // First, handle special cases like settings.json
    try {
        const settingsPath = path.join(dataDir, 'settings.json');
        const settingsContent = await readFile(settingsPath, 'utf-8');
        const settingsData = JSON.parse(settingsContent);
        if (settingsData.live) {
             console.log('> Uploading settings.json...');
             const settingsDocRef = doc(db, 'settings', 'live');
             await setDoc(settingsDocRef, settingsData.live);
        }

    } catch (error) {
        console.error(`Error processing settings.json: ${error.message}`);
    }


    // Then, process all other JSON files
    for (const file of jsonFiles) {
        try {
            console.log(`> Uploading ${file}...`);
            const filePath = path.join(dataDir, file);
            const fileContent = await readFile(filePath, 'utf-8');
            const data = JSON.parse(fileContent);

            const collectionName = path.basename(file, '.json');
            const batch = writeBatch(db);
            
            Object.keys(data).forEach(docId => {
                const docRef = doc(db, collectionName, docId);
                batch.set(docRef, data[docId]);
            });

            await batch.commit();

        } catch (error) {
            console.error(`Error processing file ${file}: ${error.message}`);
        }
    }
    
    // Special handling for technicians to create auth users
    try {
        console.log('> Creating technician user accounts...');
        const techPath = path.join(dataDir, 'technicians.json');
        const techContent = await readFile(techPath, 'utf-8');
        const techData = JSON.parse(techContent);

        for (const techId in techData) {
            const tech = techData[techId];
            const email = `${tech.id}@fibervision.com`;
            const password = 'password'; // Default password for all techs
            
            try {
                // Check if user already exists
                await signInWithEmailAndPassword(auth, email, password).catch(async (error) => {
                    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                        // User doesn't exist, create them
                        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                        const user = userCredential.user;
                        console.log(`  - Created auth user for ${email}`);

                         // Also create their user profile document
                        const userDocRef = doc(db, 'users', user.uid);
                        await setDoc(userDocRef, {
                            id: tech.id,
                            uid: user.uid,
                            name: tech.name,
                            email: email,
                            role: 'Technician',
                            isBlocked: false,
                            avatarUrl: tech.avatarUrl || ''
                        });
                        console.log(`  - Created user profile for ${tech.id}`);

                    } else {
                        // Other sign-in error
                        console.warn(`  - Could not verify user ${email}: ${error.message}`);
                    }
                });

            } catch (creationError) {
                 console.error(`  - Failed to create user for ${email}: ${creationError.message}`);
            }
        }
         // Sign back in as admin
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

    } catch (error) {
         console.error(`Error processing technicians.json: ${error.message}`);
    }

    console.log('> Database seeding completed successfully!');
    process.exit(0);
}

main().catch(error => {
    console.error('An unexpected error occurred during seeding:', error);
    process.exit(1);
});
