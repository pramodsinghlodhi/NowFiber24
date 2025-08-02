
# Fiber24 - FTTH Network Management & Field Engineering Platform

Fiber24 is a comprehensive, AI-powered platform designed for Internet Service Providers (ISPs) to manage their Fiber-to-the-Home (FTTH) network operations and empower their field technicians. The application provides a robust suite of tools for real-time monitoring, task management, inventory control, and advanced network diagnostics, all powered by a live Firebase backend.

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
│   │   ├── (admin)/        # Route group for admin-only pages (e.g., /technicians, /inventory)
│   │   ├── (technician)/   # Route group for technician-only pages
│   │   ├── api/            # API routes (if needed)
│   │   ├── layout.tsx      # Root layout for the entire application
│   │   ├── page.tsx        # The main dashboard page
│   │   └── login/          # The login page
│   ├── ai/                 # All Genkit AI-related code
│   │   ├── flows/          # Genkit flows that define AI tasks (e.g., fault detection)
│   │   └── genkit.ts       # Genkit configuration and initialization
│   ├── components/         # Reusable React components
│   │   ├── dashboard/      # Components specific to the dashboard (e.g., MapView, StatsCard)
│   │   ├── layout/         # Layout components (Header, Sidebar, MobileNav)
│   │   └── ui/             # ShadCN UI components (Button, Card, etc.)
│   ├── contexts/           # React contexts for state management
│   │   └── auth-context.tsx  # Handles user authentication state against Firebase
│   ├── hooks/              # Custom React hooks
│   │   └── use-firestore-query.ts # Hook for fetching live data collections from Firestore
│   ├── lib/                # Libraries, helpers, and configuration
│   │   ├── firebase.ts     # Firebase initialization and configuration (IMPORTANT)
│   │   ├── types.ts        # TypeScript type definitions for all data models
│   │   └── utils.ts        # Utility functions (e.g., cn for styling)
│   └── README.md           # This file, providing setup and deployment instructions
├── .env                    # Environment variables (e.g., API keys)
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and scripts
└── tsconfig.json           # TypeScript configuration for the project
```

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
2. Click **"Add project"** and follow the on-screen instructions to create a new project.

**B. Create a Web App:**
1. Inside your new project, click the Web icon (`</>`) to create a new Web App.
2. Register your app with a nickname (e.g., "Fiber24 Web"). You do **not** need to set up Firebase Hosting at this stage.
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
1. In the Firebase Console, go to the **Authentication** section. Click **"Get started"** and enable the **"Email/Password"** sign-in provider.
2. Go to the **Firestore Database** section. Click **"Create database"**, start in **test mode** for now (you can secure it later with Security Rules), and choose a location.

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
2. Create a collection named `users`.
3. For each user you created in Authentication, you must add a corresponding document in the `users` collection. **The Document ID must be the User UID** from the Authentication tab (not the email).
    - **Get the UID**: In the Authentication -> Users tab, copy the UID for each user.
    - **Create the Document**: In Firestore, click "Add document" in the `users` collection and paste the UID as the Document ID.

    - **Admin Document (ID = UID of `admin@fibervision.com`):**
      - `id`: "admin" (This is the login ID)
      - `name`: "Admin User"
      - `role`: "Admin"
      - `isBlocked`: `false`
      - `avatarUrl`: "https://i.pravatar.cc/150?u=admin"
      - `contact`: "+15551234567"

    - **Technician Document (ID = UID of `tech-001@fibervision.com`):**
      - `id`: "tech-001" (This is the login ID)
      - `name`: "John Doe"
      - `role`: "Technician"
      - `isBlocked`: `false`
      - `avatarUrl`: "https://i.pravatar.cc/150?u=tech-001"
      - `contact`: "+15558765432"

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
