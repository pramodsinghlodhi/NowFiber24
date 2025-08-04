
# Firestore Database Setup Guide

This guide provides step-by-step instructions on how to populate your Cloud Firestore database using the JSON files in this directory. Following these steps is crucial for the application to function correctly.

## Before You Start

- Make sure you have created a Firebase project as described in the main `README.md` file.

---

## Part 1: Enable Firebase Services

1.  **Enable Firestore**:
    *   In the Firebase Console, go to the **Firestore Database** section in the left-hand menu (under Build).
    *   Click **"Create database"**.
    *   Select **"Start in test mode"**. This allows for easy read/write access during setup. You can (and should) secure your database with Security Rules before going to production. Click **"Next"**.
    *   Choose a Cloud Firestore location. Select a location closest to your users for the best performance. Click **"Enable"**.

2.  **Enable Email/Password Authentication**:
    *   Go to the **Authentication** section in the left-hand menu.
    *   Click **"Get started"**.
    *   On the **Sign-in method** tab, select **"Email/Password"** from the list of providers.
    *   **Enable the "Email/Password" provider** and click **"Save"**. This is a critical step for the login to work.

---

## Part 2: Create User Accounts & Link to Firestore

This is the most important part of the setup. You will create a user in Firebase's authentication system and then create a corresponding profile document for them in the Firestore database.

1.  **Create an "Admin" User**:
    *   Go to the **Authentication** -> **Users** tab in your Firebase Console.
    *   Click **"Add user"**.
    *   Enter the following:
        *   **Email**: `admin@fibervision.com`
        *   **Password**: `admin` (or any password of your choice)
    *   Click **"Add user"**.

2.  **Get the Admin User's UID**:
    *   After the user is created, you will see them in the user list. **Copy the User UID** for this user. It's a long string of letters and numbers.

3.  **Create the `users` Collection and Admin Document**:
    *   Go back to the **Firestore Database** -> **Data** tab.
    *   Click **+ Start collection**.
    *   For **Collection ID**, enter `users`.
    *   Now, you'll create the first document. In the **Document ID** field, **paste the Admin User UID you just copied**.
    *   Open the `users.json` file from this directory. Find the object with `"id": "admin"`.
    *   Add each field from that JSON object to your Firestore document:
        - `id`: (string) `admin`
        - `name`: (string) `Admin User`
        - `role`: (string) `Admin`
        - `isBlocked`: (boolean) `false`
        - `avatarUrl`: (string) `https://i.pravatar.cc/150?u=admin`
        - `contact`: (string) `+15551234567`
    *   Click **Save**.

4.  **Repeat for a Technician User**:
    *   Go back to **Authentication** and create another user:
        *   **Email**: `tech-001@fibervision.com`
        *   **Password**: `password`
    *   **Copy the new User UID** for the technician.
    *   Go back to **Firestore**, and in the `users` collection, click **+ Add document**.
    *   **Paste the Technician's UID** as the Document ID.
    *   Add the fields from the `"id": "tech-001"` object in `users.json`.
    *   Click **Save**.

---

## Part 3: Set up Remaining Collections

For the following collections, the Document ID can be copied directly from the JSON files.

### General Process:

1.  In Firestore, click **+ Start collection**.
2.  Enter the correct **Collection ID** (e.g., `technicians`).
3.  Open the corresponding JSON file (e.g., `technicians.json`).
4.  For each top-level key in the JSON file (e.g., `"tech-001"`):
    *   Click **+ Add document**.
    *   Use the key as the **Document ID** (e.g., `tech-001`).
    *   Copy all the fields and values from the JSON object into the Firestore document fields.
    *   **For nested objects** like `attributes` in the `infrastructure.json` file, you will first add a field with the key `attributes`, set its type to `map`, and then add the nested fields and values inside that map.
5.  Click **Save**. Repeat for all entries in the file.

### Collections to Create:

-   `technicians` (from `technicians.json`)
-   `tasks` (from `tasks.json`)
-   `alerts` (from `alerts.json`)
-   `infrastructure` (from `infrastructure.json`)
-   `connections` (from `connections.json`)
-   `materials` (from `materials.json`)
-   `assignments` (from `assignments.json`)
-   `referrals` (from `referrals.json`)
-   `plans` (from `plans.json`)

---

Once you have created all these collections and their documents, your application will be fully populated with the initial data and ready to run.
