# Setup Custom Domain: peppyr.online

This guide will help you configure your custom domain `peppyr.online` on Vercel.

## Step 1: Add Domain in Vercel Dashboard

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/meets-projects-d5af715b/peppyr/settings/domains

2. **Add Domain:**
   - Click "Add Domain" button
   - Enter: `peppyr.online`
   - Click "Add"

3. **Add WWW Subdomain (Optional but Recommended):**
   - Click "Add Domain" again
   - Enter: `www.peppyr.online`
   - Click "Add"

4. **Vercel will show you DNS records to add:**
   - You'll see something like:
     - Type: `A` or `CNAME`
     - Name: `@` or `peppyr.online`
     - Value: Vercel's provided IP address or domain

## Step 2: Configure DNS at Your Domain Registrar

You need to add DNS records at your domain registrar (where you bought `peppyr.online`).

### Common Registrars:
- **Namecheap**: Domain List → Manage → Advanced DNS
- **GoDaddy**: My Products → DNS
- **Google Domains**: DNS → Custom records
- **Cloudflare**: DNS → Records

### DNS Records to Add:

Vercel will provide you with specific records. Typically:

#### Option A: A Record (Root Domain)
```
Type: A
Name: @ (or leave blank, or peppyr.online)
Value: [Vercel's IP address - they'll provide this]
TTL: 3600 (or Auto)
```

#### Option B: CNAME Record (Root Domain - if supported)
```
Type: CNAME
Name: @ (or leave blank)
Value: cname.vercel-dns.com (or what Vercel provides)
TTL: 3600 (or Auto)
```

#### For WWW Subdomain:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com (or what Vercel provides)
TTL: 3600 (or Auto)
```

**Important:** Use the exact values Vercel provides in the dashboard!

## Step 3: Wait for DNS Propagation

- DNS changes can take 5 minutes to 48 hours
- Usually takes 5-60 minutes
- Check status in Vercel dashboard (it will show "Valid Configuration" when ready)

### Check DNS Propagation:
```bash
# Windows PowerShell
nslookup peppyr.online

# Or use online tools:
# - https://dnschecker.org
# - https://www.whatsmydns.net
```

## Step 4: Update Environment Variables

Once your domain is configured and working, update these environment variables:

### In Vercel Dashboard:
Go to: https://vercel.com/meets-projects-d5af715b/peppyr/settings/environment-variables

Update these variables:

1. **VITE_API_URL**
   - Old: `https://peppyr-9epqiaqdx-meets-projects-d5af715b.vercel.app/api`
   - New: `https://peppyr.online/api`

2. **FRONTEND_URL**
   - Old: `https://peppyr-9epqiaqdx-meets-projects-d5af715b.vercel.app`
   - New: `https://peppyr.online`

### Update via CLI (Alternative):
```bash
# Update VITE_API_URL
vercel env rm VITE_API_URL production
vercel env add VITE_API_URL production
# Enter: https://peppyr.online/api

# Update FRONTEND_URL
vercel env rm FRONTEND_URL production
vercel env add FRONTEND_URL production
# Enter: https://peppyr.online
```

## Step 5: Update Backend CORS (if needed)

The backend should already allow `peppyr.online`, but verify in `server/index.js`:

```javascript
const allowedOrigins = [
  'https://peppyr.online',
  'https://www.peppyr.online',
  process.env.FRONTEND_URL || 'http://localhost:5173'
].filter(Boolean);
```

If you need to add it, the code is already there and will use `FRONTEND_URL` environment variable.

## Step 6: Redeploy

After updating environment variables:

1. **Via Dashboard:**
   - Go to Deployments
   - Click ⋯ on latest deployment
   - Click "Redeploy"

2. **Via CLI:**
   ```bash
   vercel --prod
   ```

## Step 7: Test Your Domain

1. **Test Frontend:**
   - Visit: https://peppyr.online
   - Should load your app

2. **Test Backend:**
   - Visit: https://peppyr.online/api/health
   - Should return: `{"status":"ok"}`

3. **Test WWW (if configured):**
   - Visit: https://www.peppyr.online
   - Should redirect to or work the same as peppyr.online

## Troubleshooting

### Domain not working after DNS setup
- Wait longer (DNS can take up to 48 hours)
- Verify DNS records are correct
- Check Vercel dashboard for domain status
- Ensure no conflicting DNS records exist

### SSL Certificate Issues
- Vercel automatically provisions SSL certificates
- Wait 5-10 minutes after DNS is configured
- Check Vercel dashboard for certificate status

### CORS Errors
- Verify `FRONTEND_URL` environment variable is set to `https://peppyr.online`
- Check `allowedOrigins` in `server/index.js`
- Redeploy after updating environment variables

### Domain shows "Invalid Configuration"
- Check DNS records match exactly what Vercel provided
- Ensure no typos in DNS records
- Wait for DNS propagation

## Quick Checklist

- [ ] Domain added in Vercel dashboard
- [ ] DNS records added at domain registrar
- [ ] DNS propagated (check with nslookup)
- [ ] Environment variables updated (`VITE_API_URL` and `FRONTEND_URL`)
- [ ] Application redeployed
- [ ] Frontend accessible at https://peppyr.online
- [ ] Backend API accessible at https://peppyr.online/api/health
- [ ] No CORS errors in browser console

---

**Need Help?** 
- Vercel Domain Docs: https://vercel.com/docs/concepts/projects/domains
- Check domain status in Vercel dashboard

