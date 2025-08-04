
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

### 2. Firebase Project Setup (CRUCIAL)

This application is fully powered by Firebase. **It will not run without a correctly configured Firebase project.**

**A. Create a Firebase Project:**
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"**.
3. Enter a project name (e.g., "NowFiber24-prod") and click **"Continue"**.
4. You can choose to enable Google Analytics or not for this project. It is not required for the application to function. Click **"Continue"**.
5. After a moment, your project will be ready. Click **"Continue"**.

**B. Create a Web App:**
1. Inside your new project, click the Web icon (`</>`) to create a new Web App.
2. Register your app with a nickname (e.g., "NowFiber24 Web"). You do **not** need to set up Firebase Hosting at this stage.
3. After registering, Firebase will provide you with a `firebaseConfig` object. **Copy this object.**

**C. Configure the Application:**
1. In the project's root directory, open the file `src/lib/firebase.ts`.
2. **Replace the placeholder `firebaseConfig` object with the one you copied** from your Firebase console. The file and line numbers are provided below for clarity.

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
1. In the Firebase Console, go to the **Authentication** section in the left-hand menu (under Build).
2. Click **"Get started"**.
3. On the Sign-in method tab, select **"Email/Password"** from the list of providers.
4. Enable the **"Email/Password"** provider and click **"Save"**.
5. Next, go to the **Firestore Database** section in the left-hand menu.
6. Click **"Create database"**.
7. Select **"Start in test mode"**. This allows for easy read/write access during setup. You can (and should) secure your database with Security Rules before going to production. Click **"Next"**.
8. Choose a Cloud Firestore location. Select a location closest to your users for the best performance. Click **"Enable"**.

**E. Create User Accounts (Required for Login):**
The application will not work without user accounts. You must create them in Firebase Authentication.
1. Go to the **Authentication** -> **Users** tab in the Firebase Console.
2. Click **"Add user"** to create at least one administrator and one technician. The email address is derived from the User ID you want to use for login.

    - **Admin User**:
        - **Email**: `admin@fibervision.com`
        - **Password**: `admin` (or any password of your choice)

    - **Technician User**:
        - **Email**: `tech-001@fibervision.com`
        - **Password**: `password` (or any password of your choice)

**F. Set up Firestore Data:**
For the application to be populated with data, you must create collections in Firestore. The most important is the `users` collection, which links Authentication accounts to application roles.

1. Go to the **Firestore Database** -> **Data** tab.
2. Click **"+ Start collection"**.
3. For the **Collection ID**, enter `users`. Click **"Next"**.
4. Now you will create the first document. **The Document ID must be the User UID** from the Authentication tab (not the email).
    - **To get the UID**: Go to the Authentication -> Users tab in a separate browser tab. You will see a "User UID" column. Copy the UID for the `admin@fibervision.com` user.
    - **Create the Admin Document**:
        - Paste the copied UID into the **Document ID** field.
        - Add the following fields to the document:
            - `id` (string): `admin`
            - `name` (string): `Admin User`
            - `role` (string): `Admin`
            - `isBlocked` (boolean): `false`
            - `avatarUrl` (string): `https://i.pravatar.cc/150?u=admin`
            - `contact` (string): `+15551234567`
        - Click **"Save"**.
5. **Create the Technician Document**:
    - In the `users` collection, click **"Add document"**.
    - Go back to the Authentication tab and copy the User UID for the `tech-001@fibervision.com` user.
    - Paste the UID into the **Document ID** field.
    - Add the following fields:
        - `id` (string): `tech-001`
        - `name` (string): `John Doe`
        - `role` (string): `Technician`
        - `isBlocked` (boolean): `false`
        - `avatarUrl` (string): `https://i.pravatar.cc/150?u=tech-001`
        - `contact` (string): `+15558765432`
    - Click **"Save"**.

*For the application to be fully functional, you will need to add documents to other collections as well, such as `technicians`, `tasks`, `alerts`, and `infrastructure`.*

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
    Create a new file named `.env` in the root of your project. This file is for secret keys and should not be committed to version control. Add your Gemini API key for the AI features to work.
    ```env
    # .env
    # This key is required for the Genkit AI flows to function.
    # Get your key from Google AI Studio.
    GEMINI_API_KEY=your_google_ai_studio_api_key
    ```
    
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:3000](http://localhost:3000).

### 4. Default Login Credentials

Use these credentials to log in after setting up the user accounts in Firebase.

-   **Administrator:**
    -   **User ID:** `admin`
    -   **Password:** `admin` (or the password you set)

-   **Technician:**
    -   **User ID:** `tech-001`
    -   **Password:** `password` (or the password you set)

### 5. Deployment

You have multiple options for deploying this Next.js application.

#### Option 1: Firebase Hosting (Recommended)
1.  Install the Firebase CLI: `npm install -g firebase-tools`
2.  Login to Firebase: `firebase login`
3.  Initialize Firebase Hosting: `firebase init hosting`
    -   Select "Use an existing project" and choose the project you created.
    -   When asked for your public directory, enter `.next`.
    -   Configure as a single-page app (SPA): **No**.
    -   Set up automatic builds and deploys with GitHub: **Yes** (recommended) or No.
4.  Deploy your application:
    ```bash
    npm run build
    firebase deploy
    ```

This will deploy your application to a live URL provided by Firebase.

#### Option 2: Deploying to a Virtual Private Server (VPS)
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

**Step 5: Set Up Environment Variables**
Create a `.env` file for your production environment variables.
```bash
# Create and open the .env file with nano editor
nano .env
```
Add your Gemini API key to this file:
```env
# .env
GEMINI_API_KEY=your_production_google_ai_studio_api_key
```
Press `CTRL+X`, then `Y`, then `Enter` to save and exit `nano`.

**Step 6: Build the Application**
Create a production-optimized build of your Next.js app.
```bash
npm run build
```

**Step 7: Run the Application with a Process Manager**
It's crucial to use a process manager like **PM2** to keep your application running continuously, even if it crashes or the server reboots.

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
To serve your app over port 80 (HTTP) or 443 (HTTPS) and add security, use a web server like Nginx as a reverse proxy. The Next.js app runs on port 3000 by default, and Nginx will forward traffic from port 80 to it.

This is an advanced step and requires separate tutorials on configuring Nginx.

Your application is now running on your VPS! You can view logs with `pm2 logs nowfiber24` and manage the process with `pm2 stop nowfiber24`, `pm2 restart nowfiber24`, etc.
