
# Fiber24 - FTTH Network Management & Field Engineering Platform

Fiber24 is a comprehensive, AI-powered platform designed for Internet Service Providers (ISPs) to manage their Fiber-to-the-Home (FTTH) network operations and empower their field technicians. The application provides a robust suite of tools for real-time monitoring, task management, inventory control, and advanced network diagnostics.

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

## Project Structure

Here is an overview of the key files and directories in the project:

```
/
├── public/                 # Static assets (images, fonts, etc.)
├── src/
│   ├── app/                # Next.js App Router: all pages and layouts
│   │   ├── (admin)/        # Route group for admin-only pages
│   │   ├── (technician)/   # Route group for technician-only pages
│   │   ├── api/            # API routes (if needed)
│   │   ├── layout.tsx      # Root layout for the entire application
│   │   ├── page.tsx        # The main dashboard page
│   │   └── login/          # The login page
│   ├── ai/                 # All Genkit AI-related code
│   │   ├── flows/          # Genkit flows that define AI tasks
│   │   └── genkit.ts       # Genkit configuration and initialization
│   ├── components/         # Reusable React components
│   │   ├── dashboard/      # Components specific to the dashboard
│   │   ├── layout/         # Layout components (Header, Sidebar)
│   │   └── ui/             # ShadCN UI components
│   ├── contexts/           # React contexts for state management
│   │   └── auth-context.tsx  # Handles user authentication state
│   ├── hooks/              # Custom React hooks
│   │   └── use-firestore-query.ts # Hook for live data from Firestore
│   ├── lib/                # Libraries, helpers, and configuration
│   │   ├── firebase.ts     # Firebase initialization and configuration
│   │   ├── types.ts        # TypeScript type definitions for all data models
│   │   └── utils.ts        # Utility functions (e.g., cn for styling)
│   └── styles/             # Global styles and Tailwind CSS configuration
│       └── globals.css     # Main stylesheet with Tailwind directives and theme variables
├── .env                    # Environment variables (e.g., API keys)
├── next.config.mjs         # Next.js configuration
├── package.json            # Project dependencies and scripts
└── README.md               # This file
```

## Production Setup Guide

Follow these steps to set up and run the project on your local machine and prepare it for deployment.

### 1. Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) (or [yarn](https://yarnpkg.com/))

### 2. Firebase Setup (Crucial Step)

This application is powered by Firebase. You must configure it correctly for the application to run.

**A. Create a Firebase Project:**
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** and follow the on-screen instructions to create a new project.

**B. Create a Web App:**
1. Inside your new project, click the Web icon (`</>`) to create a new Web App.
2. Register your app with a nickname (e.g., "Fiber24 Web"). You do **not** need to set up Firebase Hosting at this stage.
3. After registering, Firebase will provide you with a `firebaseConfig` object. **Copy this object.**

**C. Configure the Application:**
1. In the project's root directory, open the file `src/lib/firebase.ts`.
2. **Replace the existing `firebaseConfig` object with the one you copied** from the Firebase console. The file should look like this:

```typescript
// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Paste your config object here
  apiKey: "AIza...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "...",
  appId: "1:...",
  measurementId: "G-..."
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app); // Firebase Authentication instance
const db = getFirestore(app); // Firestore Database instance

export { app, auth, db };
```

**D. Enable Firebase Services:**
1. In the Firebase Console, go to the **Authentication** section. Click **"Get started"** and enable the **"Email/Password"** sign-in provider.
2. Go to the **Firestore Database** section. Click **"Create database"**, start in **test mode** for now (you can secure it later with Security Rules), and choose a location.

**E. Create User Accounts:**
The application will not work without user accounts. You need to create them in Firebase Authentication.
1. Go to the **Authentication** -> **Users** tab in the Firebase Console.
2. Click **"Add user"** to create the following accounts. The email is derived from the User ID.
    - **Admin User**:
        - **Email**: `admin@fibervision.com`
        - **Password**: `admin`
    - **Technician User**:
        - **Email**: `tech-001@fibervision.com`
        - **Password**: `password`

**F. Set up Firestore Data:**
To see data in the app, you need to add documents to your Firestore database. The application uses the following collections: `users`, `technicians`, `tasks`, `alerts`, `infrastructure`, `connections`, `materials`, `assignments`, and `referrals`.

1. Go to the **Firestore Database** -> **Data** tab.
2. Create a collection named `users`.
3. For each user you created in Authentication, add a corresponding document in the `users` collection. The **Document ID** must be the **User UID** from the Authentication tab.
    - **Admin Document (ID = UID of `admin@fibervision.com`):**
      - `id`: "admin"
      - `name`: "Admin User"
      - `role`: "Admin"
      - `isBlocked`: false
      - `avatarUrl`: "https://i.pravatar.cc/150?u=admin"
    - **Technician Document (ID = UID of `tech-001@fibervision.com`):**
      - `id`: "tech-001"
      - `name`: "John Doe"
      - `role`: "Technician"
      - `isBlocked`: false
      - `avatarUrl`: "https://i.pravatar.cc/150?u=tech-001"
      
*You will need to create other collections and add data to them for the application to be fully populated.*

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
    -   **Password:** `admin`

-   **Technician:**
    -   **User ID:** `tech-001`
    -   **Password:** `password`

### 5. Deployment

This Next.js application is ready to be deployed to any hosting provider that supports Node.js.

**Recommended: Firebase Hosting**
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
