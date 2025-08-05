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
    *   `contact`: (string) `+15551234567`
6.  Click **Save**.

---

## 2. Prepare the Environment for the Seeding Script

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

## 3. Run the Automated Seeding Script

Now you are ready to populate the entire database.

1.  Open your terminal in the project's root directory.
2.  Run the following command:
    ```bash
    npm run db:seed
    ```
3.  The script will now execute. You will see output in your terminal as it processes each file and uploads the documents to Firestore. It will look something like this:
    ```
    > Seeding database...
    > Authenticating as admin...
    > Admin authenticated successfully.
    > Reading files from src/lib/data...
    > Found 9 files to process.
    > Processing alerts.json...
    >  - Uploaded 3 documents to alerts collection.
    > Processing assignments.json...
    >  - Uploaded 3 documents to assignments collection.
    > ...and so on for all files.
    > Database seeding completed successfully!
    ```

Once the script finishes, your Firestore database will be fully populated with all the necessary data, and your application will be ready to use.
