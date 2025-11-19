# Next Steps After Vercel Deployment

Your application has been successfully deployed to Vercel! Here's what you need to do next to make it fully functional.

## ✅ Current Status

- ✅ Code pushed to GitHub
- ✅ Backend configured for Vercel serverless functions
- ✅ Frontend and backend deployed to Vercel
- ✅ Production URL: https://peppyr-9epqiaqdx-meets-projects-d5af715b.vercel.app

## 🔧 Step 1: Configure Environment Variables

Your app needs environment variables to work properly. Set these in the Vercel dashboard:

### Access Vercel Dashboard
1. Go to: https://vercel.com/meets-projects-d5af715b/peppyr/settings/environment-variables
2. Or: Vercel Dashboard → Your Project → Settings → Environment Variables

### Required Environment Variables

#### Frontend Variables (VITE_*)
These are needed for your React app:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `VITE_API_URL` | `https://peppyr-9epqiaqdx-meets-projects-d5af715b.vercel.app/api` | Your backend API URL |
| `VITE_FIREBASE_API_KEY` | `your-firebase-api-key` | From Firebase Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` | From Firebase Console |
| `VITE_FIREBASE_PROJECT_ID` | `your-project-id` | From Firebase Console |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` | From Firebase Console |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `your-sender-id` | From Firebase Console |
| `VITE_FIREBASE_APP_ID` | `your-app-id` | From Firebase Console |

#### Backend Variables
These are needed for your Express.js backend:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `FRONTEND_URL` | `https://peppyr-9epqiaqdx-meets-projects-d5af715b.vercel.app` | Your frontend URL (for CORS) |
| `NODE_ENV` | `production` | Environment mode |
| `FIREBASE_SERVICE_ACCOUNT` | `{"type":"service_account",...}` | Full JSON string from `server/service-account.json` |

### How to Set Environment Variables

1. **In Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Click "Add New"
   - Enter Key and Value
   - Select environments: Production, Preview, Development (check all)
   - Click "Save"

2. **For FIREBASE_SERVICE_ACCOUNT:**
   - Open `server/service-account.json` on your local machine
   - Copy the entire JSON content
   - Paste it as the value for `FIREBASE_SERVICE_ACCOUNT` (as a single-line string)
   - Make sure it's valid JSON

### Where to Find Firebase Values

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon)
4. Scroll to "Your apps" section
5. Click on your web app (or create one)
6. Copy the config values

## 🔄 Step 2: Redeploy After Setting Variables

After adding environment variables, you need to redeploy:

### Option A: Via Dashboard
1. Go to Deployments tab
2. Click the three dots (⋯) on the latest deployment
3. Click "Redeploy"
4. Select "Use existing Build Cache" (optional)
5. Click "Redeploy"

### Option B: Via CLI
```bash
vercel --prod
```

## ✅ Step 3: Test Your Deployment

After redeploying with environment variables:

### Test Frontend
1. Visit: https://peppyr-9epqiaqdx-meets-projects-d5af715b.vercel.app
2. Check if the app loads
3. Try signing up/logging in

### Test Backend API
1. Health Check: https://peppyr-9epqiaqdx-meets-projects-d5af715b.vercel.app/api/health
   - Should return: `{"status":"ok"}`

2. Test Authentication:
   - Try signing up a new user
   - Try logging in
   - Check browser console for any errors

### Check Logs
If something doesn't work:
1. Go to Vercel Dashboard → Deployments
2. Click on your deployment
3. Click "Functions" tab to see backend logs
4. Check browser console (F12) for frontend errors

## 🌐 Step 4: Configure Custom Domain (Optional)

If you want to use `peppyr.online`:

1. **In Vercel Dashboard:**
   - Go to Settings → Domains
   - Click "Add Domain"
   - Enter: `peppyr.online`
   - Also add: `www.peppyr.online`

2. **Update DNS Records:**
   - Vercel will show you DNS records to add
   - Go to your domain registrar
   - Add the DNS records Vercel provides

3. **Update Environment Variables:**
   - Update `VITE_API_URL` to: `https://peppyr.online/api`
   - Update `FRONTEND_URL` to: `https://peppyr.online`
   - Redeploy

## 🔍 Step 5: Verify Everything Works

Test these features:

- [ ] Frontend loads correctly
- [ ] User can sign up
- [ ] User can log in
- [ ] Templates can be created/edited
- [ ] Contacts can be managed
- [ ] API calls work (check Network tab in DevTools)
- [ ] No CORS errors in console
- [ ] Backend health check returns OK

## 🐛 Troubleshooting

### Backend not responding
- Check Vercel Function Logs (Deployments → Functions tab)
- Verify `FIREBASE_SERVICE_ACCOUNT` is set correctly
- Check that `api/index.js` exists

### CORS errors
- Verify `FRONTEND_URL` matches your actual domain
- Check `allowedOrigins` in `server/index.js`

### Firebase errors
- Verify all `VITE_FIREBASE_*` variables are set
- Check Firebase Console for project status
- Ensure service account has correct permissions

### Environment variables not working
- Make sure you selected all environments (Production, Preview, Development)
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

## 📚 Additional Resources

- Vercel Dashboard: https://vercel.com/meets-projects-d5af715b/peppyr
- Deployment Guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Vercel Backend Guide: [DEPLOY_VERCEL_BACKEND.md](./DEPLOY_VERCEL_BACKEND.md)

## 🎯 Quick Command Reference

```bash
# View deployment logs
vercel logs

# Redeploy to production
vercel --prod

# View environment variables
vercel env ls

# Add environment variable (interactive)
vercel env add VARIABLE_NAME production

# Inspect deployment
vercel inspect [deployment-url]
```

---

**Need Help?** Check the deployment logs in Vercel dashboard or run `vercel logs` in your terminal.



