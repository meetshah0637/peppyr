# Fix Firebase auth/invalid-email Error for Custom Domain

## Problem
After changing to custom domain `peppyr.online`, you're getting:
```
Firebase: Error (auth/invalid-email)
```

This happens because Firebase needs to recognize your custom domain as an authorized domain.

## Solution: Add Custom Domain to Firebase

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **peppyr**

### Step 2: Add Authorized Domains
1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Click **"Add domain"**
3. Add these domains:
   - `peppyr.online`
   - `www.peppyr.online`
   - `your-vercel-app.vercel.app` (your Vercel deployment URL)

### Step 3: Update Environment Variables in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Update `VITE_FIREBASE_AUTH_DOMAIN`:
   - **Current value:** Probably something like `peppyr.firebaseapp.com` or `peppyr.web.app`
   - **New value:** Should be your Firebase project's auth domain (check Firebase Console → Project Settings → General → Your apps)
   - **Note:** This is NOT your custom domain, it's Firebase's auth domain (usually `your-project-id.firebaseapp.com`)

3. Verify all Firebase environment variables are set:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=peppyr.firebaseapp.com (or peppyr.web.app)
   VITE_FIREBASE_PROJECT_ID=peppyr
   VITE_FIREBASE_STORAGE_BUCKET=peppyr.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

### Step 4: Redeploy
After updating environment variables, Vercel will automatically redeploy. Or manually trigger a redeploy.

## Why This Happens

Firebase Authentication only allows requests from domains listed in "Authorized domains". When you switch to a custom domain, Firebase doesn't automatically know about it, so it rejects authentication requests.

## Verify It's Fixed

1. Clear your browser cache and cookies for `peppyr.online`
2. Visit `https://peppyr.online`
3. Try to sign in with email/password or Google
4. The error should be gone!

## Additional Notes

- The `authDomain` in Firebase config is NOT your custom domain - it's Firebase's domain
- Authorized domains are separate from the authDomain setting
- You can have multiple authorized domains (localhost, vercel.app, custom domain, etc.)

