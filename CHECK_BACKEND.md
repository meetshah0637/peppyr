# How to Check if Backend is Working in Production

## Quick Tests

### 1. Test Health Endpoint (Easiest)

Open in your browser or use curl:
```
https://peppyr.online/api/health
```

**Expected Response:**
```json
{"status":"ok","timestamp":"2024-..."}
```

**If it fails:**
- ❌ 404 Not Found → Backend not deployed or routing wrong
- ❌ 500 Error → Backend deployed but has errors
- ❌ CORS error → Frontend URL not configured
- ❌ Timeout → Backend not responding

### 2. Check Vercel Deployment

1. Go to **Vercel Dashboard** → Your Project
2. Click **"Deployments"** tab
3. Check latest deployment:
   - ✅ **Status:** "Ready" (green)
   - ✅ **Functions:** Should show `api/index.js`

4. Click on the deployment → **"Functions"** tab
   - Should see: `api/index.js` listed
   - Click it to see details

### 3. Check Vercel Function Logs

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click latest deployment → **"Functions"** → `api/index.js`
3. Click **"View Function Logs"** or **"Logs"** tab
4. Look for:
   - ✅ "Server started" or similar
   - ❌ Error messages (red)
   - ❌ "Failed to initialize Firebase"

### 4. Test from Browser Console

1. Open your app: `https://peppyr.online`
2. Press **F12** → **Console** tab
3. Run this command:
   ```javascript
   fetch('https://peppyr.online/api/health')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error)
   ```

**Expected:** `{status: "ok", timestamp: "..."}`

**If error:**
- `Failed to fetch` → Backend not accessible
- `404` → Route not found
- `CORS error` → CORS not configured

### 5. Check Network Tab

1. Open your app: `https://peppyr.online`
2. Press **F12** → **Network** tab
3. Try to create a template or load templates
4. Look for requests to `/api/templates`:
   - ✅ Status: `200` or `201` → Working!
   - ❌ Status: `404` → Route not found
   - ❌ Status: `500` → Backend error
   - ❌ Status: `401` → Auth issue
   - ❌ Status: `CORS error` → CORS issue

### 6. Test API Endpoints Directly

#### Health Check:
```bash
curl https://peppyr.online/api/health
```

#### Test with Authentication (requires token):
1. Sign in to your app
2. Open Console → Application → Local Storage
3. Find Firebase auth token (or check Network tab for Authorization header)
4. Use it in curl:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://peppyr.online/api/templates
```

## Common Issues & Fixes

### Issue: 404 Not Found on `/api/health`

**Cause:** Backend not deployed or `vercel.json` routing wrong

**Fix:**
1. Check `vercel.json` has:
   ```json
   {
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/api/index.js"
       }
     ]
   }
   ```
2. Verify `api/index.js` exists
3. Redeploy on Vercel

### Issue: 500 Internal Server Error

**Cause:** Backend error (usually Firebase not configured)

**Fix:**
1. Check Vercel logs for error message
2. Verify `FIREBASE_SERVICE_ACCOUNT` is set
3. Check `FRONTEND_URL` is set correctly

### Issue: CORS Error

**Cause:** Frontend domain not in allowed origins

**Fix:**
1. Set `FRONTEND_URL` environment variable to `https://peppyr.online`
2. Check `server/index.js` has your domain in `allowedOrigins`

### Issue: Backend Function Not Showing in Vercel

**Cause:** Build configuration issue

**Fix:**
1. Check `vercel.json` has the function build:
   ```json
   {
     "builds": [
       {
         "src": "api/index.js",
         "use": "@vercel/node"
       }
     ]
   }
   ```
2. Verify `api/index.js` exports the Express app
3. Redeploy

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] Health endpoint works: `https://peppyr.online/api/health`
- [ ] Vercel shows function: `api/index.js` in Functions tab
- [ ] Vercel logs show no errors
- [ ] Browser console shows API requests (check Network tab)
- [ ] Environment variables are set:
  - [ ] `FIREBASE_SERVICE_ACCOUNT`
  - [ ] `FRONTEND_URL`
  - [ ] `VITE_API_URL`
- [ ] Latest deployment is "Ready" (green)
- [ ] No CORS errors in browser console

## Still Not Working?

1. **Share Vercel Logs:**
   - Copy error messages from Function logs
   - Share deployment status

2. **Share Browser Console:**
   - Copy any red error messages
   - Share Network tab errors

3. **Check These Files:**
   - `vercel.json` - routing configuration
   - `api/index.js` - serverless function wrapper
   - `server/index.js` - backend code

