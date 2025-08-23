# NowFiber24 - FTTH Network Management & Field Engineering Platform

NowFiber24 is a comprehensive, AI-powered platform designed for Internet Service Providers (ISPs) to manage their Fiber-to-the-Home (FTTH) network operations and empower their field technicians. The application provides a robust suite of tools for real-time monitoring, task management, inventory control, and advanced network diagnostics, all powered by a live Firebase backend.

## Features

### For Administrators:
- **Centralized Dashboard**: At-a-glance view of key network stats, technician activity, and active alerts.
- **GIS Network Map**: A real-time, interactive map visualizing all network infrastructure, technician locations, and critical alerts.
- **Inventory Management**: Add, edit, and track all network devices and equipment.
- **Technician Management**: Manage your team of field technicians, view their status, and generate performance reports.
- **Task & Alert Management**: Assign tasks, monitor their status, and manage network-wide alerts.
- **Materials Management**: Track stock levels, approve material requests, and manage inventory.
- **AI-Powered Tools**:
    - **AI Fault Detection**: Manually trigger network scans to proactively identify and report device failures.
    - **AI Fiber Trace**: Trace the physical path of a fiber connection between any two points in your network.
- **System Settings**: Configure automated monitoring, SNMP, notification preferences, and more.

### For Technicians:
- **Mobile-First Interface**: A responsive design tailored for use in the field.
- **Task Management**: View and manage assigned tasks, check-in at job sites, and mark tasks as complete.
- **Customer Referrals**: Easily submit new customer leads directly from the field.
- **Material Requests**: Request necessary materials and tools from the warehouse.
- **AI Proof of Work**: Use the AI-powered camera to analyze materials used on a job, verifying correct parts and quantities.
- **Real-time Notifications**: Receive instant alerts for new tasks, system announcements, and material request updates.

## Tech Stack

- **Framework**: Next.js 15 (with App Router & Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & ShadCN UI
- **Backend & Database**: Firebase (Authentication, Firestore, Hosting)
- **Generative AI**: Google Genkit with Gemini
- **Mapping**: Leaflet.js

---

## Production Setup Guide (Step-by-Step)

Follow these steps to set up and run the project on your local machine and prepare it for a production environment. This guide assumes you have a basic understanding of Firebase.

### 1. Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) (or [yarn](https://yarnpkg.com/))
- [Firebase CLI](https://firebase.google.com/docs/cli):
  ```bash
  npm install -g firebase-tools
  ```

### 2. Firebase Project Setup (CRUCIAL)

This application is fully powered by Firebase. **It will not run without a correctly configured Firebase project.**

**A. Create a Firebase Project:**
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"**.
3.  Enter a project name (e.g., "NowFiber24-prod") and click **"Continue"**.
4.  You can choose to enable Google Analytics or not for this project. It is not required for the application to function. Click **"Continue"**.
5.  After a moment, your project will be ready. Click **"Continue"**.

**B. Get your Google AI API Key:**
1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Sign in with your Google account.
3.  Click on the **"Get API key"** button.
4.  Create a new API key in a new or existing Google Cloud project.
5.  **Copy the generated API key.** You will need this for the `GEMINI_API_KEY` environment variable.

**C. Create a Web App and Get Config:**
1.  Inside your new project, click the Web icon (`</>`) to create a new Web App.
2.  Register your app with a nickname (e.g., "NowFiber24 Web"). You do **not** need to set up Firebase Hosting at this stage.
3.  After registering, Firebase will provide you with a `firebaseConfig` object. **You will need these values** for the client-side environment variables.

**D. Enable Firebase Services:**
1.  In the Firebase Console, go to the **Authentication** section in the left-hand menu (under Build).
2.  Click **"Get started"**.
3.  On the Sign-in method tab, select **"Email/Password"** from the list of providers.
4.  **Enable the "Email/Password" provider** and click **"Save"**. This is required for the login to work.
5.  Next, go to the **Firestore Database** section in the left-hand menu.
6.  Click **"Create database"**.
7.  Select **"Start in production mode"**. Click **"Next"**.
8.  Choose a Cloud Firestore location. Select a location closest to your users for the best performance. Click **"Enable"**.

**E. Create a Service Account (CRITICAL FOR SERVER-SIDE FUNCTIONALITY):**
All server-side functionality (AI tools, server actions, etc.) requires a service account for authentication.

1.  In the Firebase Console, click the gear icon next to **Project Overview** and select **Project settings**.
2.  Go to the **Service accounts** tab.
3.  Click the **"Generate new private key"** button. A warning will appear; click **"Generate key"** to confirm.
4.  A JSON file will be downloaded to your computer. **This file contains all the credentials needed for the next step. Keep it safe.**

**F. Set Up Environment Variables (`.env.local` - CRITICAL STEP):**
1. In your project's root directory, create a file named `.env.local`.
2. Open the `.env.local` file and add the following content. You will populate this with the keys and configs from the previous steps.
  ```env
  # .env.local
  
  # === SERVER-SIDE CONFIGURATION ===
  # From the serviceAccountKey.json file you downloaded
  FIREBASE_PROJECT_ID="your-project-id"
  FIREBASE_CLIENT_EMAIL="firebase-adminsdk-.....@your-project-id.iam.gserviceaccount.com"
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"

  # From Google AI Studio
  GEMINI_API_KEY="your_google_ai_studio_api_key"

  # === CLIENT-SIDE CONFIGURATION ===
  # From your Firebase Web App config (Project Settings -> General -> Your Apps -> SDK setup and configuration)
  NEXT_PUBLIC_FIREBASE_API_KEY="your_web_api_key"
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
  NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
  NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

  # === DATABASE SEEDING SCRIPT ===
  # Credentials for the initial admin user that the script will create
  FIREBASE_ADMIN_EMAIL=admin@nowfiber24.com
  FIREBASE_ADMIN_PASSWORD=admin
  ```
3. **IMPORTANT**: For `FIREBASE_PRIVATE_KEY`, you must ensure the newlines (`\n`) are preserved. Copy the entire key, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts.
4. Save the `.env.local` file. It is already in `.gitignore` and will not be committed.


**G. Grant Permissions to Service Account (CRUCIAL STEP):**
The server-side code uses the service account to interact with Firebase. By default, this account may not have the necessary permissions.

1.  In your **Google Cloud Console** (not Firebase), navigate to **IAM & Admin -> IAM**.
2.  Find the service account associated with your Firebase project. It will typically be named `firebase-adminsdk-...@...` or have a name related to your project ID.
3.  Click the **pencil icon** (Edit principal) for that service account.
4.  Click **"+ ADD ANOTHER ROLE"**.
5.  In the "Select a role" dropdown, search for and select the following two roles:
    *   **"Cloud Datastore User"**: This role provides the necessary permissions for creating and deleting documents from server-side scripts.
    *   **"Firebase Authentication Admin"**: This role is required for the seeding script to set custom user claims (e.g., making the admin user an 'Admin').
6.  Click **Save**.

**H. Deploy Security Rules (CRITICAL STEP):**
Your database is currently locked down. You must deploy the included security rules to allow the app to access data.
1.  Open your terminal in the project's root directory.
2.  Log in to Firebase: `firebase login`
3.  Set the active project: `firebase use YOUR_PROJECT_ID` (replace `YOUR_PROJECT_ID` with the ID from your Firebase console).
4.  Deploy the rules:
    ```bash
    firebase deploy --only firestore
    ```
    This command reads the `firestore.rules` file and applies them to your database.

**I. Automate Data Seeding (Required for Login):**
The application will not work without user accounts and initial data. The seeding script will create all necessary users and data from the `.json` files in `src/lib/data`.
1.  The credentials for the seeding script are already in your `.env.local` file from step **2.F**. The script will create the admin user with this email and password.
2.  Run the automated seeding script:
    ```bash
    npm run db:seed
    ```
3.  This command will log you in as the admin and upload all the necessary data for technicians, tasks, inventory, etc. **If the script fails, ensure your security rules are deployed and your service account has the correct IAM roles.**

### 3. Local Development

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:3000](http://localhost:3000).

### 4. Default Login Credentials

Use these credentials to log in after running the `db:seed` script.

-   **Administrator:**
    -   **Email:** `admin@nowfiber24.com`
    -   **Password:** `admin` (or the password you set in `.env.local`)

-   **Technician:**
    -   **Email:** `tech-001@nowfiber24.com`
    -   **Password:** `password` (this is the default set in the seeding script)

### 5. Production Deployment (Firebase Hosting)

This application is configured for easy deployment to Firebase Hosting.

**Step 1: Build the Project**
Create a production-ready build of your Next.js application.
```bash
npm run build
```

**Step 2: Connect a Custom Domain (Optional but Recommended)**
1. In the [Firebase Console](https://console.firebase.google.com/), navigate to the **Hosting** section.
2. Click **"Add custom domain"**.
3. Follow the on-screen instructions to verify your domain ownership. Firebase will provide you with DNS records (usually TXT or CNAME records) to add to your domain registrar's settings.
4. After your domain is verified, Firebase will provide you with IP addresses (A records) for the root domain and any subdomains. **Update your DNS settings at your registrar to point to these Firebase IP addresses.** DNS propagation may take a few hours.

**Step 3: Deploy to Firebase**
Once your project is built and your domain is configured, deploy the application with a single command from your project's root directory:
```bash
firebase deploy --only hosting
```
Firebase will upload your built project and, if configured, automatically provision an SSL certificate for your custom domain. Your site will be live!
