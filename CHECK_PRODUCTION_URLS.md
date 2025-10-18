# 🔍 Find Your Production URLs

## Step 1: Get Your Railway Backend URL

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/dashboard
   - Find your BYU Payment System project

2. **Get the URL:**
   - Click on your backend service
   - Look for "Settings" tab
   - Find "Public Networking" or "Domains"
   - Copy the URL (should look like: `https://your-app.up.railway.app`)

3. **Test it:**
   - Open: `https://your-railway-url.up.railway.app/api/health`
   - You should see: `{"status":"OK","timestamp":"...","uptime":...}`

## Step 2: Get Your Vercel Frontend URL

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Find your frontend project

2. **Get the URL:**
   - Click on your project
   - You'll see the URL at the top (e.g., `https://your-app.vercel.app`)
   - Or click "Visit" button

3. **If No Deployment Yet:**
   - Deploy now using: `cd frontend && npx vercel --prod --yes`
   - Follow the prompts
   - Get your production URL

## Step 3: Verify Frontend Has Correct Backend URL

**IMPORTANT:** Your frontend needs to know where the backend is!

1. **Check Vercel Environment Variable:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Look for: `VITE_API_URL`
   - It should be: `https://your-railway-backend-url.up.railway.app/api`

2. **If Not Set:**
   - Add the environment variable
   - Redeploy: `npx vercel --prod --yes`

## Step 4: Run My Test Script

Once you have both URLs, run:

```bash
node test-production-endpoints.js https://your-railway.up.railway.app https://your-app.vercel.app
```

Replace with your actual URLs!

## Quick Checklist

- [ ] Railway backend is deployed and running
- [ ] Railway backend URL is accessible
- [ ] Vercel frontend is deployed
- [ ] Vercel has `VITE_API_URL` environment variable set to Railway backend
- [ ] Both URLs are HTTPS
- [ ] Health endpoint returns OK

---

## Or Deploy Now If Not Yet Deployed

### Deploy Frontend to Vercel (if not deployed):

```bash
cd frontend
npx vercel --prod --yes
```

When prompted:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N** (if first time) or **Y** (if already exists)
- What's your project's name? **byu-payment-frontend**
- In which directory is your code? **./**
- Want to modify settings? **N**

You'll get a URL like: `https://byu-payment-frontend.vercel.app`

### Check Railway Backend:

Your backend should already be deployed if you said you hosted it on Railway.

Go to: https://railway.app/dashboard

And find your project URL.

