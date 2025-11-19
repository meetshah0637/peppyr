# Firebase Setup Guide

Your frontend Firebase credentials are already configured! ✅

Now you need to set up the **Firebase Service Account** for the backend server.

## Why Two Different Configs?

- **Frontend (.env)**: Uses Firebase Client SDK - for user authentication
- **Backend (server/.env)**: Uses Firebase Admin SDK - for verifying tokens and managing data

## Quick Setup

### Option 1: Using the Helper Script (Recommended)

1. **Get Service Account Key**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to **Project Settings** → **Service Accounts**
   - Click **"Generate new private key"**
   - Save the JSON file (e.g., `firebase-service-account.json`)

2. **Run the formatter script**:
   ```bash
   node scripts/format-service-account.js firebase-service-account.json
   ```

3. **Restart the backend server**

### Option 2: Manual Setup

1. **Get Service Account Key** (same as above)

2. **Open the JSON file** and copy its contents

3. **Minify it** (remove all newlines and extra spaces) - you can use:
   - [JSON Minifier](https://jsonformatter.org/json-minify)
   - Or manually remove newlines

4. **Edit `server/.env`** and add:
   ```env
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
   ```

5. **Restart the backend server**

## Verify Setup

After configuring, restart the backend and check the console. You should see:
```
✅ Firebase Admin initialized successfully
```

Instead of:
```
⚠️  Firebase Service Account not configured. Using mock mode.
```

## Security Note

- **Never commit** the service account JSON file or `server/.env` to git
- The `.env` files are already in `.gitignore`
- Keep your service account key secure

## Troubleshooting

### "Failed to initialize Firebase Admin"
- Check that the JSON is valid and properly formatted
- Ensure there are no extra quotes or escaping issues
- Try using the helper script to format it correctly

### "Unauthorized: Invalid token"
- Make sure the Service Account is from the same Firebase project
- Verify the frontend and backend are using the same project

### Backend still in "mock mode"
- Check `server/.env` has `FIREBASE_SERVICE_ACCOUNT` set
- Restart the backend server after making changes
- Check for JSON parsing errors in the backend console

