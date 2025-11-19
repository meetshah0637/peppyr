# Peppyr Backend API

This is the backend API server for Peppyr, a LinkedIn outreach message manager.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Create a `.env` file in the `server` directory (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure Firebase Service Account:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Copy the JSON content and paste it as a single-line string in `FIREBASE_SERVICE_ACCOUNT` in your `.env` file

4. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### Health Check
- `GET /api/health` - Check if the server is running

### Authentication
- `POST /api/auth/signup` - Create a new user account
- `POST /api/auth/verify` - Verify Firebase ID token and ensure user document exists
- `POST /api/auth/login` - (Deprecated - use Firebase Auth SDK on client)

### Templates/Messages
- `GET /api/templates` - Get all templates for the authenticated user
- `POST /api/templates` - Create a new template
- `PUT /api/templates/:id` - Update a template
- `DELETE /api/templates/:id` - Soft delete (archive) a template

All template endpoints require authentication via Firebase ID token in the `Authorization: Bearer <token>` header.

## Development Mode

If Firebase Service Account is not configured, the server will run in "mock mode" with in-memory storage. This is useful for development but data will be lost on server restart.

## Production Deployment

1. Set up proper environment variables
2. Ensure Firebase Service Account is configured
3. Set `FRONTEND_URL` to your production frontend URL
4. Use a process manager like PM2 or deploy to a cloud service

