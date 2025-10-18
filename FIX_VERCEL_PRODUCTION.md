# 🔧 Fix Vercel Production Deployment

## Step-by-Step Instructions

### 1. Go to Vercel Dashboard
- Open: https://vercel.com/dashboard
- Find and click on your `frontend` project

### 2. Navigate to Environment Variables
- Click **Settings** (in the top menu)
- Click **Environment Variables** (in the left sidebar)

### 3. Find or Add VITE_API_URL

**If the variable EXISTS:**
1. Find `VITE_API_URL` in the list
2. Click the **Edit** button (pencil icon)
3. Make sure the value is: `https://byupay.up.railway.app/api`
4. **IMPORTANT:** Check the box for **Production** ✅
5. Click **Save**

**If the variable DOESN'T exist:**
1. Click **Add New** button
2. **Key:** `VITE_API_URL`
3. **Value:** `https://byupay.up.railway.app/api`
4. **Environment:** Check ✅ **Production** (and optionally Preview, Development)
5. Click **Save**

### 4. Redeploy Production

**Method A - Via Dashboard:**
1. Go to **Deployments** tab
2. Find the latest **Production** deployment
3. Click the **3 dots** (...) menu
4. Click **Redeploy**
5. Confirm the redeploy

**Method B - Trigger New Deployment:**
1. Make a small change (or dummy commit)
2. Push to main branch
3. Vercel will auto-deploy

### 5. Wait 1-2 Minutes

Vercel will rebuild and redeploy with the new environment variable.

### 6. Test Production

Once deployed:
1. Open: https://byupay.vercel.app/register
2. Fill in the registration form
3. Click Register
4. ✅ Should now work!

---

## ✅ Verification

After redeployment, test:
- Registration: https://byupay.vercel.app/register
- Dashboard: https://byupay.vercel.app
- Admin: https://byupay.vercel.app (with admin key)

All should now connect to your Railway backend properly!

