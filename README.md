
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
You must provide your secret keys to the production application. Instead of using a `.env.local` file on the server, it's more secure to set them as actual environment variables.

1. **Set Environment Variables**:
   Edit your shell's profile script (e.g., `~/.bashrc`, `~/.profile`, or `~/.zshrc`) to export the variables.
   ```bash
   nano ~/.bashrc
   ```
   Add these lines to the end of the file, copying the values from your local `.env.local` file:
   ```bash
   export NODE_ENV="production"
   
   # Server-side
   export FIREBASE_PROJECT_ID="your-project-id"
   export FIREBASE_CLIENT_EMAIL="your-client-email"
   export FIREBASE_PRIVATE_KEY="your-private-key-with-newlines"
   export GEMINI_API_KEY="your_google_ai_studio_api_key"

   # Client-side
   export NEXT_PUBLIC_FIREBASE_API_KEY="your_web_api_key"
   export NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_auth_domain"
   export NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
   export NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
   export NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
   export NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
   ```
   Save the file (`CTRL+X`, then `Y`, then `Enter`) and load the new variables:
   ```bash
   source ~/.bashrc
   ```
   This method is more secure than placing secrets in a file on a production server.

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

    