
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
- **Backend & Database**: Firebase (Authentication, Firestore)
- **Generative AI**: Google Genkit with Gemini
- **Mapping**: Leaflet.js

---

## Production Setup Guide (Step-by-Step)

Follow these steps to set up and run the project on your local machine and prepare it for deployment. This guide assumes you have a basic understanding of Firebase.

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

**B. Create a Web App:**
1.  Inside your new project, click the Web icon (`</>`) to create a new Web App.
2.  Register your app with a nickname (e.g., "NowFiber24 Web"). You do **not** need to set up Firebase Hosting at this stage.
3.  After registering, Firebase will provide you with a `firebaseConfig` object. **Copy this object.**

**C. Configure the Application:**
1.  In the project's root directory, open the file `src/lib/firebase.ts`.
2.  **Replace the placeholder `firebaseConfig` object with the one you copied** from your Firebase console. The file and line numbers are provided below for clarity.

    - **File:** `src/lib/firebase.ts`
    - **Line to Replace:** Approximately line 6

    ```typescript
    // src/lib/firebase.ts

    import { initializeApp, getApp, getApps } from 'firebase/app';
    import { getAuth } from 'firebase/auth';
    import { getFirestore } from 'firebase/firestore';

    // v-- PASTE YOUR FIREBASE CONFIG OBJECT HERE --v
    const firebaseConfig = {
      apiKey: "AIza...",
      authDomain: "your-project-id.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project-id.appspot.com",
      messagingSenderId: "...",
      appId: "1:...",
      measurementId: "G-..."
    };
    // ^-- PASTE YOUR FIREBASE CONFIG OBJECT HERE --^

    // Initialize Firebase
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    export { app, auth, db };
    ```

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
4.  A JSON file will be downloaded to your computer. **Treat this file like a password; it is highly sensitive.**
5.  Rename this file to `serviceAccountKey.json`.
6.  Move this `serviceAccountKey.json` file to the **root directory** of your project. **This file is already listed in `.gitignore`, so it will NOT be committed to your repository.**
7.  This service account is used by both the server actions and the one-time seeding script.

**F. Deploy Security Rules (CRITICAL STEP):**
Your database is currently locked down. You must deploy the included security rules to allow the app to access data.
1.  Open your terminal in the project's root directory.
2.  Log in to Firebase: `firebase login`
3.  Set the active project: `firebase use YOUR_PROJECT_ID` (replace `YOUR_PROJECT_ID` with the ID from your Firebase console).
4.  Deploy the rules:
    ```bash
    firebase deploy --only firestore
    ```
    This command reads the `firestore.rules` file and applies them to your database.

**G. Create User Accounts & Data (Required for Login):**
The application will not work without user accounts and initial data. A detailed guide on how to create the collections and documents is in **`src/lib/data/README.md`**.

1.  **Create Admin User**: You must create at least one admin user in Firebase Authentication. This user's credentials will be used by the automated seeding script.
    - Go to **Authentication -> Users** and click **"Add user"**.
    - **Email**: `admin@fibervision.com`
    - **Password**: `admin` (or a secure password of your choice)
    - After creating the user, copy their **User UID**.
    - Go to **Firestore Database -> Data** and create the `users` collection.
    - Add a document where the **Document ID is the UID you just copied**.
    - Add the fields for the admin user (e.g., `id: "admin"`, `name: "Admin User"`, `role: "Admin"`). See `src/lib/data/users.json` for the full structure.

2.  **Automate Data Seeding**:
    - In your project's root directory, create a file named `.env.local`.
    - Add your admin user's credentials to this file. **This file is git-ignored and should never be committed.**
      ```env
      # .env.local
      FIREBASE_ADMIN_EMAIL=admin@fibervision.com
      FIREBASE_ADMIN_PASSWORD=your_admin_password
      ```
    - **IMPORTANT**: The seeding script now sets a custom claim on the admin user for proper permissions. You **must run this script** for the admin to have the correct access.
    - Run the automated seeding script:
      ```bash
      npm run db:seed
      ```
    - This command will log you in as the admin, set a custom claim giving you admin rights, and upload all the necessary data for technicians, tasks, inventory, etc.

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

3.  **Set up environment variables:**
    Create a new file named `.env` in the root of your project and add your API keys. This file is for secret keys and should not be committed to version control. Next.js will automatically load this file.
    ```env
    # .env
    
    # Genkit API Key (Client-side)
    # Get your key from Google AI Studio.
    GEMINI_API_KEY=your_google_ai_studio_api_key

    # Path to your Firebase service account key for the Admin SDK.
    # This is used for all server-side operations.
    # The Admin SDK and Genkit will automatically find and use this variable.
    GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
    ```
    
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:3000](http://localhost:3000).

### 4. Default Login Credentials

Use these credentials to log in after setting up the user accounts in Firebase.

-   **Administrator:**
    -   **Email:** `admin@fibervision.com`
    -   **Password:** `admin` (or the password you set)

-   **Technician:**
    -   **Email:** `tech-001@fibervision.com`
    -   **Password:** `password` (or the password you set)

### 5. Deployment to a Virtual Private Server (VPS)

This guide assumes you have a VPS (e.g., from DigitalOcean, Linode, AWS EC2) running a recent version of Linux (like Ubuntu 22.04).

**Step 1: Connect to your VPS**
Connect to your server via SSH:
```bash
ssh your_username@your_vps_ip_address
```

**Step 2: Install Prerequisites**
You'll need `git` to clone the repository and `Node.js` to run the application.
```bash
# Update package lists
sudo apt update

# Install git
sudo apt install git -y

# Install Node.js (v18 or later recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Step 3: Clone Your Project**
Clone your project repository from GitHub (or your preferred Git provider) to the VPS.
```bash
git clone https://your-repository-url.git
cd <repository-name>
```

**Step 4: Install Dependencies**
Install the necessary Node.js packages.
```bash
npm install
```

**Step 5: Set Up Environment Variables on the Server**
You must provide your secret keys to the production application. Instead of using a file, it's more secure to set them as actual environment variables on the server.

1. **Add `serviceAccountKey.json`**:
   Securely transfer your `serviceAccountKey.json` file to the root directory of the project on your VPS. You can use `scp` for this.

2. **Set Environment Variables**:
   Edit your shell's profile script (e.g., `~/.bashrc`, `~/.profile`, or `~/.zshrc`) to export the variables.
   ```bash
   nano ~/.bashrc
   ```
   Add these lines to the end of the file:
   ```bash
   export GEMINI_API_KEY="your_production_google_ai_studio_api_key"
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/project/serviceAccountKey.json" 
   # Make sure this is the FULL, absolute path from the root of the server, e.g., /home/your_user/your_project/serviceAccountKey.json
   ```
   Save the file (`CTRL+X`, then `Y`, then `Enter`) and load the new variables:
   ```bash
   source ~/.bashrc
   ```
   This method is more secure than placing secrets in a git-ignored file on a production server.

**Step 6: Build the Application**
Create a production-optimized build of your Next.js app.
```bash
npm run build
```

**Step 7: Run the Application with a Process Manager**
It's crucial to use a process manager like **PM2** to keep your application running continuously.

1.  **Install PM2 globally:**
    ```bash
    sudo npm install pm2 -g
    ```

2.  **Start your application with PM2:**
    ```bash
    pm2 start npm --name "nowfiber24" -- start
    ```
    - `--name "nowfiber24"` gives your process a memorable name.
    - `-- start` tells PM2 to use the `start` script from your `package.json`.

3.  **Ensure PM2 starts on server reboot:**
    ```bash
    pm2 startup
    ```
    This command will generate another command that you need to copy and paste to complete the setup.

4.  **Save the current process list:**
    ```bash
    pm2 save
    ```

**Step 8: Configure a Reverse Proxy (Recommended)**
To serve your app over port 80 (HTTP) or 443 (HTTPS) and add security, use a web server like Nginx as a reverse proxy. This is an advanced step and requires separate tutorials on configuring Nginx.

Your application is now running on your VPS! You can view logs with `pm2 logs nowfiber24` and manage the process with `pm2 stop nowfiber24`, `pm2 restart nowfiber24`, etc.
