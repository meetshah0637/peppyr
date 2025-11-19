# Run Peppyr Locally - Quick Start Guide

## Prerequisites Check

- ✅ Node.js 18+ installed
- ✅ Dependencies installed (see below)

## Quick Start (Easiest Way)

### Option 1: Run Both Together (Recommended)

Open **one terminal** in the project root and run:

```bash
npm run dev:all
```

This will start:
- **Frontend** on `http://localhost:5173`
- **Backend** on `http://localhost:3001`

### Option 2: Run Separately (If you need separate terminals)

**Terminal 1 - Frontend:**
```bash
npm run dev
```
Frontend will run on: `http://localhost:5173`

**Terminal 2 - Backend:**
```bash
npm run dev:backend
```
Backend will run on: `http://localhost:3001`

## First Time Setup

### 1. Install Dependencies

If you haven't installed dependencies yet:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Set Up Environment Variables

#### Frontend (`.env` in root directory):

Create `.env` file with:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=peppyr.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=peppyr
VITE_FIREBASE_STORAGE_BUCKET=peppyr.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:3001
```

#### Backend (`server/.env`):

Create `server/.env` file with:
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"peppyr",...}
```

**Note:** For `FIREBASE_SERVICE_ACCOUNT`, you can:
- Copy the entire JSON from `server/service-account.json`
- Convert it to a single-line string (remove newlines)
- Or use the file directly (backend will read it if env var not set)

### 3. Start the Servers

```bash
npm run dev:all
```

## Verify It's Working

1. **Frontend:** Open `http://localhost:5173`
   - Should see the Peppyr home page

2. **Backend Health Check:** Open `http://localhost:3001/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

3. **Check Console:**
   - Frontend terminal should show: `VITE v5.x.x  ready in xxx ms`
   - Backend terminal should show: `🚀 Peppyr API server running on port 3001`

## Troubleshooting

### Port Already in Use

If port 3001 or 5173 is already in use:

**Backend:**
- Change `PORT` in `server/.env` to a different port (e.g., `3002`)
- Update `VITE_API_URL` in `.env` to match

**Frontend:**
- Vite will automatically try the next available port
- Or specify: `npm run dev -- --port 5174`

### Dependencies Not Installed

```bash
# Frontend
npm install

# Backend
cd server && npm install && cd ..
```

### Backend Not Starting

1. Check `server/.env` exists and has correct values
2. Check `server/service-account.json` exists (if not using env var)
3. Check Node.js version: `node --version` (should be 18+)

### Frontend Can't Connect to Backend

1. Verify backend is running on port 3001
2. Check `VITE_API_URL=http://localhost:3001` in `.env`
3. Check browser console for CORS errors
4. Verify `FRONTEND_URL=http://localhost:5173` in `server/.env`

## Development Tips

- **Hot Reload:** Both frontend and backend support hot reload
  - Frontend: Changes to React components auto-reload
  - Backend: Uses `node --watch` to auto-restart on changes

- **Stop Servers:** Press `Ctrl+C` in the terminal

- **Separate Logs:** If using `dev:all`, logs from both servers will be mixed. Use separate terminals for cleaner logs.

## Next Steps

Once both servers are running:
1. Sign up / Sign in at `http://localhost:5173`
2. Create templates
3. Test all features locally before deploying

