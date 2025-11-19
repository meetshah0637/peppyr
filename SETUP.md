# Peppyr Setup Guide

This guide will help you set up Peppyr with a proper backend API and frontend architecture.

## Architecture Overview

- **Frontend**: React + Vite application that uses Firebase Auth for client-side authentication
- **Backend**: Express.js API server that verifies Firebase ID tokens and manages user data in Firestore
- **Extension**: Browser extension for LinkedIn outreach

## Prerequisites

- Node.js 18+ installed
- Firebase project created
- Firebase Authentication enabled (Email/Password and Google providers)

## Setup Steps

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
   - Enable "Google" (optional but recommended)
4. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Copy the security rules from `FIRESTORE_RULES.md` to the Rules tab
5. Get Firebase Config:
   - Go to Project Settings > General
   - Scroll down to "Your apps" and click the web icon (</>)
   - Copy the config values

### 3. Configure Backend

1. Get Firebase Service Account:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file (keep it secure!)

2. Create `server/.env`:
```bash
cd server
cp .env.example .env
```

3. Edit `server/.env` and add:
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

   **Important**: Paste the entire service account JSON as a single-line string. You can use a tool to minify it, or manually remove all newlines.

### 4. Configure Frontend

1. Create `.env` in the root directory:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Firebase config:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:3001/api
```

### 5. Start Development Servers

**Option 1: Run both servers separately**

Terminal 1 (Frontend):
```bash
npm run dev
```

Terminal 2 (Backend):
```bash
npm run dev:backend
```

**Option 2: Run both servers together**
```bash
npm run dev:all
```

The frontend will be available at `http://localhost:5173`
The backend API will be available at `http://localhost:3001`

## How It Works

### Authentication Flow

1. User signs up/logs in using Firebase Auth (client-side)
2. Frontend gets Firebase ID token
3. Frontend sends ID token to backend API in `Authorization: Bearer <token>` header
4. Backend verifies the ID token using Firebase Admin SDK
5. Backend ensures user document exists in Firestore
6. Backend returns user data

### Data Storage

- **Authenticated users**: All templates/messages are stored in Firestore, scoped by `userId`
- **Anonymous users**: Data is stored in browser localStorage (fallback)

### API Endpoints

All endpoints require authentication except `/api/health`:

- `GET /api/health` - Health check
- `POST /api/auth/verify` - Verify Firebase ID token
- `GET /api/templates` - Get user's templates
- `POST /api/templates` - Create new template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Archive template

## Troubleshooting

### "Firebase is not configured" error
- Check that all `VITE_FIREBASE_*` environment variables are set in `.env`
- Restart the dev server after changing `.env`

### "Unauthorized: Invalid token" error
- Make sure the backend has the correct Firebase Service Account configured
- Check that the token is being sent in the Authorization header
- Verify Firebase Auth is working on the frontend

### "Missing or insufficient permissions" in Firestore
- Make sure you've copied the security rules from `FIRESTORE_RULES.md` to your Firestore Rules
- Ensure the rules are published

### Backend runs in "mock mode"
- This means the Firebase Service Account is not configured
- Check `server/.env` and ensure `FIREBASE_SERVICE_ACCOUNT` is set correctly
- Data will be lost on server restart in mock mode

## Production Deployment

1. Set environment variables on your hosting platform
2. Update `VITE_API_URL` to point to your production backend URL
3. Update `FRONTEND_URL` in backend `.env` to your production frontend URL
4. Ensure Firebase Service Account is configured securely (use environment variables, not files)

## Security Notes

- Never commit `.env` files or service account keys to version control
- Use environment variables for sensitive data in production
- The backend verifies all Firebase ID tokens before processing requests
- Firestore security rules ensure users can only access their own data

