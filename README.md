# Peppyr - LinkedIn Outreach Message Manager

A modern web application for appointment setters to manage LinkedIn outreach messages, templates, contacts, and analytics.

## 📁 Project Structure

```
peppyr/
├── frontend/          # React frontend application
├── backend/           # Express.js backend API
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
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```

2. **Start development servers:**
   ```bash
   # From root directory
   npm run dev:all
   ```
   
   Or separately:
   ```bash
   # Frontend (port 5173)
   cd frontend && npm run dev
   
   # Backend (port 3001)
   cd backend && npm run dev
   ```

3. **Setup Firebase:**
   - See [Firebase Setup Guide](./docs/setup/FIREBASE_SETUP.md)
   - Add `service-account.json` to `backend/` directory

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

## 🔧 Configuration

See [Configuration Guide](./docs/setup/FIREBASE_SETUP.md) for environment variables and Firebase setup.

## 📝 License

Private - All rights reserved
