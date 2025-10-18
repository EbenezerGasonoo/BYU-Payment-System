# 🔧 Quick Fix for byupay.vercel.app

## What Just Happened

The CLI deployment worked, but it created a new deployment URL instead of updating the main domain.

**New deployment:** https://frontend-8rb8navg0-ebenezer-gasonoos-projects.vercel.app  
**Main domain:** https://byupay.vercel.app (still needs fixing)

## ✅ Quick 3-Step Fix

### Step 1: Add Environment Variable in Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Click on your **frontend** project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"** (or edit existing if `VITE_API_URL` exists)
5. Fill in:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://byupay.up.railway.app/api`
   - **Environments:** Check ✅ **Production**, **Preview**, **Development** (all three)
6. Click **Save**

### Step 2: Redeploy

Two ways:

**Method A - Via Dashboard:**
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **...** (3 dots)
4. Click **"Redeploy"**

**Method B - Via CLI:**
```bash
cd frontend
npx vercel --prod --yes
```

### Step 3: Test

Wait 1-2 minutes, then test:
```
https://byupay.vercel.app/register
```

## ⚡ Even Faster - Set via Vercel CLI

Or run this command to set the env variable via CLI:

```bash
cd frontend
npx vercel env add VITE_API_URL production
# When prompted, enter: https://byupay.up.railway.app/api
```

Then redeploy:
```bash
npx vercel --prod --yes
```

---

## 🎯 What This Does

By adding `VITE_API_URL` to Vercel project settings:
- ✅ All future deployments will use the correct backend URL
- ✅ The main domain (byupay.vercel.app) will work
- ✅ Preview deployments will also work
- ✅ No more "registration failed" errors

---

## ✅ Expected Result

After this fix:
- **byupay.vercel.app** → Works perfectly ✅
- Student registration → Success ✅
- Payment requests → Success ✅
- Admin dashboard → Success ✅

---

**Do this now and your production app will be 100% functional!** 🚀

