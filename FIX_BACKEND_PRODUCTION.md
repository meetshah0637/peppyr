# Fix Backend in Production - Templates Not Saving

## Problem
Templates aren't being created and saved. This is because the backend isn't properly configured in production.

## Root Cause
1. **Missing `VITE_API_URL`** - Frontend doesn't know where the backend is
2. **Missing `FIREBASE_SERVICE_ACCOUNT`** - Backend can't connect to Firestore
3. **Backend might not be running** - Vercel serverless functions need proper configuration

## Solution: Configure Vercel Environment Variables

### Step 1: Set API URL for Frontend

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Add/Update `VITE_API_URL`:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://peppyr.online` (or your Vercel URL like `https://your-app.vercel.app`)
   - **Important:** Do NOT include `/api` - the frontend code adds it automatically
   - **Environments:** Select all (Production, Preview, Development)

### Step 2: Verify Backend Environment Variables

Make sure these are set in Vercel:

#### Required Backend Variables:
```
NODE_ENV=production
FRONTEND_URL=https://peppyr.online
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...} (the JSON string)
```

#### Required Frontend Variables:
```
VITE_API_URL=https://peppyr.online
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=peppyr.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=peppyr
VITE_FIREBASE_STORAGE_BUCKET=peppyr.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Step 3: Test Backend API

After setting environment variables and redeploying, test the backend:

1. **Health Check:**
   ```bash
   curl https://peppyr.online/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Check Browser Console:**
   - Open your app at `https://peppyr.online`
   - Open Developer Tools (F12) → Console
   - Look for API requests - you should see:
     ```
     [ApiClient] Making request: GET https://peppyr.online/api/templates with token
     ```

3. **Check Network Tab:**
   - Try creating a template
   - Go to Network tab → Look for requests to `/api/templates`
   - Check if they're going to the right URL
   - Check response status (should be 200 or 201)

### Step 4: Verify Backend is Running

The backend runs as a Vercel serverless function at `/api/*` routes.

**Check Vercel Logs:**
1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click on the latest deployment
3. Click **"Functions"** tab
4. Look for `api/index.js` - it should show as deployed
5. Click on it to see logs

**Common Issues:**
- If you see "Function not found" → The `vercel.json` configuration might be wrong
- If you see errors about `FIREBASE_SERVICE_ACCOUNT` → The environment variable isn't set correctly
- If you see CORS errors → `FRONTEND_URL` isn't set or doesn't match your domain

### Step 5: Debug Template Creation

If templates still aren't saving:

1. **Check Browser Console for Errors:**
   - Look for red error messages
   - Check if API requests are failing

2. **Check Network Requests:**
   - Open Network tab
   - Try creating a template
   - Find the POST request to `/api/templates`
   - Check:
     - **Status Code:** Should be 201 (created) or 200 (ok)
     - **Request URL:** Should be `https://peppyr.online/api/templates`
     - **Request Headers:** Should include `Authorization: Bearer <token>`
     - **Response:** Should contain the created template JSON

3. **Check Vercel Function Logs:**
   - Go to Vercel → Functions → `api/index.js` → Logs
   - Look for errors when creating templates
   - Common errors:
     - `Failed to initialize Firebase Admin` → `FIREBASE_SERVICE_ACCOUNT` is wrong
     - `Not allowed by CORS` → `FRONTEND_URL` doesn't match
     - `Unauthorized` → Token verification failing

## Quick Fix Checklist

- [ ] `VITE_API_URL` is set to `https://peppyr.online` (no trailing slash, no `/api`)
- [ ] `FIREBASE_SERVICE_ACCOUNT` is set (the full JSON string)
- [ ] `FRONTEND_URL` is set to `https://peppyr.online`
- [ ] All Firebase frontend variables are set (`VITE_FIREBASE_*`)
- [ ] Redeployed after setting environment variables
- [ ] Backend health check works: `https://peppyr.online/api/health`
- [ ] Browser console shows API requests going to correct URL

## Testing Locally First

Before deploying, test locally:

1. **Set local environment variables:**
   ```bash
   # In .env file (root directory)
   VITE_API_URL=http://localhost:3001
   ```

2. **Start backend:**
   ```bash
   cd server
   npm install
   npm run dev
   ```

3. **Start frontend:**
   ```bash
   npm install
   npm run dev
   ```

4. **Test template creation** - should work locally first

## Still Not Working?

1. **Check Vercel Build Logs:**
   - Look for errors during build
   - Make sure `api/index.js` is being built

2. **Verify vercel.json:**
   - Should have `api/index.js` in builds
   - Should route `/api/*` to `/api/index.js`

3. **Check Firebase:**
   - Verify Firestore is enabled in Firebase Console
   - Check Firestore rules allow writes
   - Verify service account has proper permissions

4. **Contact Support:**
   - Share Vercel function logs
   - Share browser console errors
   - Share network request details

