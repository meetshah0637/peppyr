# Peppyr - LinkedIn Outreach Message Manager

A modern web application for appointment setters to manage LinkedIn outreach messages, templates, contacts, and analytics.

## 📁 Project Structure

```
peppyr/
├── src/               # React frontend application (root level)
├── server/            # Express.js backend API
├── api/               # Vercel serverless function entry point
├── extension/         # Browser extension
├── docs/              # Documentation
├── scripts/           # Utility scripts
└── config/            # Configuration files
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project (for production)

### Development

1. **Install dependencies:**
   ```bash
   # From root directory - installs frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

2. **Start development servers:**
   
   **Option 1: Run both frontend and backend together (recommended):**
   ```bash
   npm run dev:all
   ```
   This runs:
   - Frontend on `http://localhost:5173` (Vite dev server)
   - Backend on `http://localhost:3001` (Express server)
   
   **Option 2: Run separately:**
   ```bash
   # Terminal 1 - Frontend (port 5173)
   npm run dev
   
   # Terminal 2 - Backend (port 3001)
   npm run dev:backend
   ```

3. **Setup Firebase:**
   - See [Firebase Setup Guide](./docs/setup/FIREBASE_SETUP.md)
   - Add `service-account.json` to `server/` directory
   - Create `.env` file in root for frontend variables (VITE_*)
   - Create `.env` file in `server/` for backend variables

## 📚 Documentation

- [Main Documentation](./docs/README.md)
- [Setup Guide](./docs/setup/SETUP.md)
- [API Documentation](./docs/api/README_BACKEND.md)
- [Database Schema](./docs/database/DATABASE_VERIFICATION.md)

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + Firebase Admin SDK
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth

## 📦 Features

- ✅ Template management with parameter replacement
- ✅ Contact/Lead management with CSV import
- ✅ Activity tracking and analytics
- ✅ Browser extension for quick access
- ✅ User-specific data isolation

## 🚀 Deployment (Vercel)

### Important: No Manual Commands Needed!

When deployed to Vercel, **you don't need to run any start commands**. Vercel automatically:
- Builds your frontend using `npm run build` (or `vercel-build`)
- Deploys your backend as serverless functions (from `api/index.js`)
- Handles all server startup and routing automatically

### Environment Variables

Make sure to add all required environment variables in Vercel Dashboard:
- **Backend**: `FIREBASE_SERVICE_ACCOUNT`, `FRONTEND_URL`, `NODE_ENV`
- **Frontend**: `VITE_FIREBASE_*`, `VITE_API_URL`

See [Vercel Environment Variables Setup](./docs/setup/SETUP.md#vercel-deployment)

### Local vs Production

| Environment | Frontend | Backend | Commands Needed? |
|------------|----------|---------|------------------|
| **Local** | `npm run dev` | `npm run dev:backend` | ✅ Yes - run manually |
| **Vercel** | Auto-built | Serverless functions | ❌ No - automatic |

## 🔧 Configuration

See [Configuration Guide](./docs/setup/FIREBASE_SETUP.md) for environment variables and Firebase setup.

## 📝 License

Private - All rights reserved
