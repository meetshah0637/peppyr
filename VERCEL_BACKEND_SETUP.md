# Vercel Backend Setup - No Start Command Needed!

## Important: Vercel Serverless Functions Don't Need a Start Command

**You do NOT need to add a start command for the backend on Vercel.**

### Why?

Vercel uses **serverless functions**, not traditional servers. This means:

- ✅ **No start command needed** - Functions are invoked on-demand
- ✅ **No server to keep running** - Vercel handles this automatically
- ✅ **Auto-scales** - Handles traffic spikes automatically
- ✅ **Pay per use** - Only charged when functions are called

### How It Works

1. **Build Time:**
   - Vercel runs `installCommand` to install dependencies
   - Vercel builds your frontend (static files)
   - Vercel packages your serverless function (`api/index.js`)

2. **Runtime:**
   - When a request comes to `/api/*`, Vercel invokes `api/index.js`
   - The function runs, handles the request, and returns a response
   - Function shuts down after response (no server stays running)

### Current Configuration

Your `vercel.json` is set up correctly:

```json
{
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    }
  ]
}
```

This tells Vercel:
- ✅ Build `api/index.js` as a serverless function
- ✅ Route all `/api/*` requests to that function
- ✅ Use `@vercel/node` runtime (Node.js)

### What You DO Need

1. **Install Command** (in `vercel.json`):
   ```json
   "installCommand": "npm install && cd server && npm install"
   ```
   This ensures both root and server dependencies are installed.

2. **Environment Variables** (in Vercel Dashboard):
   - `FIREBASE_SERVICE_ACCOUNT` - For backend to connect to Firestore
   - `FRONTEND_URL` - For CORS configuration
   - `VITE_API_URL` - For frontend to know backend URL

### Verify Backend is Working

1. **Check Vercel Dashboard:**
   - Go to **Deployments** → Latest deployment
   - Click **Functions** tab
   - Should see `api/index.js` listed

2. **Test Health Endpoint:**
   ```
   https://peppyr.online/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

3. **Check Function Logs:**
   - Go to **Functions** → `api/index.js` → **Logs**
   - Should see function invocations when you make API calls

### Common Issues

#### Issue: "Function not found" or 404 on `/api/*`

**Cause:** Function not built or routing wrong

**Fix:**
- Check `vercel.json` has the function build configuration
- Verify `api/index.js` exists and exports the Express app
- Check Vercel build logs for errors

#### Issue: "Module not found" errors

**Cause:** Server dependencies not installed

**Fix:**
- Add `installCommand` to `vercel.json`:
  ```json
  "installCommand": "npm install && cd server && npm install"
  ```
- Or move server dependencies to root `package.json`

#### Issue: Backend works locally but not on Vercel

**Cause:** Missing environment variables

**Fix:**
- Set `FIREBASE_SERVICE_ACCOUNT` in Vercel
- Set `FRONTEND_URL` in Vercel
- Redeploy after setting environment variables

### Summary

- ❌ **Don't add** a start command
- ✅ **Do ensure** `installCommand` installs server dependencies
- ✅ **Do set** environment variables in Vercel Dashboard
- ✅ **Do verify** function appears in Vercel Functions tab
- ✅ **Do test** with `/api/health` endpoint

The backend runs automatically as serverless functions - no manual start needed!

