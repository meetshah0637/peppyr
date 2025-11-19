# Deployment Guide - Peppyr on Vercel (Free Forever)

## 🚀 Quick Deploy to Vercel (Recommended - Free Forever)

Vercel offers a **permanent free tier** (not a trial) with:
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Custom domains
- ✅ Serverless functions for your API

## Step-by-Step Deployment

### 1. Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account (free)
3. No credit card required

### 2. Import Your Repository
1. Click **"Add New Project"**
2. Select your GitHub repository: `meetshah0637/peppyr`
3. Vercel will auto-detect your settings from `vercel.json`

### 3. Configure Build Settings
Vercel should auto-detect:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 4. Set Environment Variables
In Vercel dashboard, go to **Settings → Environment Variables** and add:

#### Required Variables:
```
NODE_ENV=production
FRONTEND_URL=https://your-app-name.vercel.app
```

#### Firebase Service Account (Required):
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"peppyr","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-fbsvc@peppyr.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

**To get your Firebase Service Account JSON:**
1. Copy the entire contents of `server/service-account.json`
2. Convert it to a single-line JSON string (remove all newlines)
3. Paste it as the value for `FIREBASE_SERVICE_ACCOUNT`

**Quick PowerShell command to convert:**
```powershell
$json = Get-Content server/service-account.json -Raw | ConvertFrom-Json | ConvertTo-Json -Compress
$json
```

### 5. Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Your app will be live at: `https://your-app-name.vercel.app`

### 6. Update Frontend URL (After First Deploy)
1. After deployment, copy your Vercel URL
2. Go to **Settings → Environment Variables**
3. Update `FRONTEND_URL` to your actual Vercel URL
4. Redeploy (Vercel will auto-redeploy when you update env vars)

## 🔄 Automatic Deployments

Once connected, Vercel will automatically deploy:
- Every push to `master` branch → Production
- Every push to other branches → Preview deployments

## 🌐 Custom Domain (Optional)

1. Go to **Settings → Domains**
2. Add your custom domain
3. Follow DNS instructions
4. Vercel provides free SSL certificates

## 📊 Free Tier Limits

- **Bandwidth:** 100 GB/month
- **Serverless Function Execution:** 100 GB-hours/month
- **Build Time:** 6000 minutes/month
- **Team Members:** Unlimited

These limits are generous and won't expire - it's a permanent free tier!

## 🆚 Alternative: Netlify (Also Free Forever)

If you prefer Netlify:

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Import repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variables (same as above)
6. For API routes, you'll need to use Netlify Functions (different setup)

## 🐛 Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure `npm run build` works locally first

### API Routes Not Working
- Verify `FIREBASE_SERVICE_ACCOUNT` is set correctly
- Check Vercel function logs in dashboard
- Ensure `api/index.js` exports the Express app correctly

### CORS Errors
- Update `FRONTEND_URL` environment variable to your Vercel URL
- Check server logs in Vercel dashboard

## 📝 Notes

- Your `service-account.json` file is in `.gitignore` (good for security)
- Always use environment variables for sensitive data in production
- Vercel provides free analytics and monitoring

