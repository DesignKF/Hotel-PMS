# 🚀 Vercel Deployment Guide for Moshi Urban Hostel PMS

This guide walks you through deploying the Moshi Urban Property Management System (PMS) to **Vercel** with full authentication (Google Sign-In, Email/Password, and Phone OTP) and persistent cloud database storage via Google Cloud Firestore.

---

## 📋 What Has Been Configured For Vercel

1. **`vercel.json`**:
   - Configures Vite single-page application (SPA) client-side routing so deep links (`/bookings`, `/rooms`, `/settings`, etc.) and page refreshes work without 404 errors.
   - Sets up serverless API rewrites so calls to `/api/*` are handled by Vercel Serverless Functions.

2. **`api/index.ts`**:
   - Vercel Serverless Function entrypoint exporting the Express backend router for staff authentication, JWT token generation, role verification, and audit logs.

3. **Resilient Dual Authentication**:
   - **Google Sign-In**: Authenticates directly through Firebase Authentication with Google Calendar sync.
   - **Staff & Admin Credentials**: Authenticates via `/api/auth/login` with automatic client-side fallback, ensuring login never fails even during serverless cold starts.

4. **Persistent Firestore Cloud Database**:
   - Connects to your dedicated cloud database (`ai-studio-hotelbookingpms-37eb265e-d518-4e48-9eb8-989d14f5c1a7`).
   - Automatically falls back to `firebase-applet-config.json` or custom `VITE_FIREBASE_*` environment variables.
   - Offline-ready with local browser caching.

---

## 🛠️ Step-by-Step Deployment Instructions

### Step 1: Push the Code to GitHub
1. Initialize Git (if not already done) and commit all files:
   ```bash
   git add .
   git commit -m "Configure Vercel deployment with serverless API and Firebase"
   ```
2. Push your repository to your GitHub account (e.g., `https://github.com/your-username/moshi-urban-pms`).

---

### Step 2: Import Project into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New..."** > **"Project"**.
3. Select your GitHub repository and click **"Import"**.
4. In the configuration screen, Vercel will auto-detect **Vite**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

---

### Step 3: Add Environment Variables in Vercel
Before clicking Deploy, expand the **"Environment Variables"** section in Vercel and add:

| Name | Value | Purpose |
| :--- | :--- | :--- |
| `JWT_SECRET` | *(Generate a 32+ character random string)* | Encrypts staff session tokens |
| `ADMIN_PASSWORD` | `Admin12345` *(or your custom password)* | Master admin login password |
| `NODE_ENV` | `production` | Production mode |

*(Optional)* If you do not commit `firebase-applet-config.json` to GitHub, add these Firebase variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_FIRESTORE_DATABASE_ID`

*(Values can be copied from `.env.example` or `firebase-applet-config.json`)*.

Click **"Deploy"**. Vercel will build and assign you a production URL (e.g., `https://moshi-urban-pms.vercel.app`).

---

### Step 4: ⚠️ CRITICAL STEP — Authorize Your Vercel Domain in Firebase
> **Why this is required**: Firebase Authentication strictly blocks Google Sign-In and OAuth popups from unauthorized domains. If you skip this step, Google Sign-In will display an `auth/unauthorized-domain` error.

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **`gen-lang-client-0021427211`** (or your linked Firebase project).
3. In the left navigation, click **Build** > **Authentication**.
4. Click on the **Settings** tab at the top.
5. In the **Authorized domains** list, click **"Add domain"**.
6. Paste your Vercel deployment domain without `https://` (for example: `moshi-urban-pms.vercel.app`).
7. Click **Add**.

*(If using a custom domain like `pms.moshiurban.co.tz`, add that domain here as well).*

---

### Step 5: (Optional) Google OAuth Authorized JavaScript Origins
If you are syncing reservations directly with Google Calendar:
1. Open [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Select your project.
3. Click on your OAuth 2.0 Web Client ID: `659229637933-hrf8lpelm6ajjo05u98v5ekn0ue979c3.apps.googleusercontent.com`.
4. Under **Authorized JavaScript origins**, click **Add URI** and add:
   - `https://your-app.vercel.app`
5. Click **Save**.

---

## 🔐 How to Log In After Deployment

Open your deployed Vercel URL. You can log in using either:

### Method A: One-Click Google Sign-In (Recommended)
- Click **"Sign in with Google"**.
- Use `wolfgodie@gmail.com` or `gdnjau@gmail.com` for instant Administrator access with full permissions and live Google Calendar synchronization.

### Method B: System Administrator Credentials
- **Email**: `admin@moshiurban.co.tz` (or `gdnjau@gmail.com`)
- **Password**: `Admin12345` (or whatever you set in `ADMIN_PASSWORD` on Vercel)

### Method C: Front Desk Reception Staff
- **Email**: `reception@moshiurban.co.tz` (or `staff@moshiurban.co.tz`)
- **Password**: `Moshi123!`

---

## 💾 How Your Data is Maintained (Database & Persistence)

1. **Google Cloud Firestore (Global Real-time Sync)**:
   - All room reservations, bed assignments, payments, and guest contact records are stored in Firestore database: `ai-studio-hotelbookingpms-37eb265e-d518-4e48-9eb8-989d14f5c1a7`.
   - Any booking created on one device immediately syncs in real-time to all other devices connected to the PMS.

2. **Local Browser Storage & Offline Protection**:
   - All rooms, exchange rates, and active reservations are mirrored locally in browser storage.
   - If the front desk encounters internet dropouts in Moshi, the application continues to run seamlessly offline and synchronizes when the connection resumes.
