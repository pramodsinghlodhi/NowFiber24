
# Automated Firestore Database Setup Guide

This guide explains how to use the automated seeding script to populate your Cloud Firestore database. This script reads all the `.json` files in this directory and uploads them to your Firebase project, creating the necessary collections and documents.

This automated process is the **recommended way** to set up your database, as it is much faster and less error-prone than manual setup.

---

## 1. Create a Primary Admin User in Firebase

The seeding script requires an administrative user to authenticate with Firebase and get the necessary permissions to write to the database.

### Step 1.1: Create the User in Firebase Authentication

1.  Go to the **Authentication** -> **Users** tab in your Firebase Console.
2.  Click **"Add user"**.
3.  Enter the following credentials. It's important to use these exact credentials as they are referenced by the script's environment file.
    *   **Email**: `admin@fibervision.com`
    *   **Password**: `admin` (or a more secure password of your choice)
4.  Click **"Add user"**.

### Step 1.2: Get the Admin's User UID

1.  After the user is created, you will see them in the user list.
2.  **Copy the User UID** for the `admin@fibervision.com` user. It's a long string of letters and numbers (e.g., `aBcDeFgHiJkLmNoPqRsTuVwXyZ12`).

### Step 1.3: Manually Create the Admin's Profile in Firestore

This is the **only manual step** required. You must create a user profile document in Firestore so the application knows this user is an 'Admin'.

1.  Go to the **Firestore Database** -> **Data** tab in the Firebase Console.
2.  Click **+ Start collection**.
3.  For **Collection ID**, enter `users`. Click **Next**.
4.  Now, you'll create the first document. In the **Document ID** field, **paste the Admin User UID you just copied**. This links the login to the profile.
5.  Add the following fields for the admin's profile:
    *   `id`: (string) `admin`
    *   `name`: (string) `Admin User`
    *   `role`: (string) `Admin`
    *   `isBlocked`: (boolean) `false`
    *   `avatarUrl`: (string) `https://i.pravatar.cc/150?u=admin`
    *   `email`: (string) `admin@fibervision.com`
6.  Click **Save**.

### Step 1.4: Set Admin Custom Claim (CRITICAL)
For the security rules to work correctly, you must set a custom claim on the admin user's account. This is done via the Firebase Admin SDK. The easiest way is to temporarily use a cloud function or a local admin script.

**This project's seeding script handles this for you!** The first time you run `npm run db:seed`, it will attempt to set this custom claim on the admin user. However, for this to work, the service account used by the script needs permission to set custom claims.

1.  In your **Google Cloud Console**, navigate to **IAM & Admin -> IAM**.
2.  Find your service account (`firebase-adminsdk-...`).
3.  Click the pencil icon to edit its roles.
4.  Add the role **"Firebase Admin"** or **"Firebase Authentication Admin"**. This grants the necessary permissions.

---
## 2. Deploy Security Rules (CRITICAL STEP)

Your database is currently locked down by default. You must deploy the included security rules to allow the app to access data.

1.  Open the `firestore.rules` file in the root of your project and review the rules.
2.  Open your terminal in the project's root directory.
3.  If you haven't already, log in to Firebase: `firebase login`
4.  Set the active project: `firebase use YOUR_PROJECT_ID` (replace `YOUR_PROJECT_ID` with the ID from your Firebase console).
5.  Deploy the rules:
    ```bash
    firebase deploy --only firestore
    ```
    This command reads the `firestore.rules` file and applies them to your database. **The application will not work without this step.**

---

## 3. Prepare the Environment for the Seeding Script

The script needs your admin credentials to log in. You will provide these in a local environment file that is safely ignored by Git.

1.  In your project's root directory (the same level as `package.json`), create a new file named `.env.local`.
2.  Add your admin user's credentials to this file. If you used a different password in the step above, make sure to use it here.
    ```env
    # .env.local
    FIREBASE_ADMIN_EMAIL=admin@fibervision.com
    FIREBASE_ADMIN_PASSWORD=admin
    ```
3.  **Save the file.** This file is included in `.gitignore` and will not be committed to your repository.

---

## 4. Run the Automated Seeding Script

Now you are ready to populate the entire database.

1.  Open your terminal in the project's root directory.
2.  Run the following command:
    ```bash
    npm run db:seed
    ```
3.  The script will now execute. You will see output in your terminal as it authenticates and then uploads data to Firestore.
    ```
    > Seeding database...
    > Reading files from src/lib/data...
    > Uploading alerts.json...
    > Uploading assignments.json...
    > ...
    > Database seeding completed successfully!
    ```

Once the script finishes, your database will be populated, and the application will be ready to use without permission errors.
