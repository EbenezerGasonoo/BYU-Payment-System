# 🔧 Fix Railway Backend - 502 Error

## Problem
Your Railway backend at `https://byupay.up.railway.app` is returning **502 Bad Gateway**
This means the app is deployed but failing to start properly.

## ✅ Step-by-Step Fix

### 1. Check Railway Logs (MOST IMPORTANT!)

1. Go to: https://railway.app/project/f4c56b76-70fd-41b2-a00b-b1f3b8b2d83d
2. Click on your backend service
3. Go to **"Deployments"** tab
4. Click on the latest deployment
5. Look at the **Logs** - this will show you the exact error!

**Common errors you might see:**
- ❌ `MongoDB connection error` → Database URL is wrong
- ❌ `EADDRINUSE` → Port configuration issue
- ❌ `Cannot find module` → Build issue
- ❌ `Exited with code 1` → Application crashed

### 2. Check Environment Variables

Go to: Railway → Your Project → Variables tab

**Required variables:**

```
PORT=3000
MONGODB_URI=mongodb+srv://gas24001_db_user:RYL6UZblQRBQStkr@byu.wxvcbyd.mongodb.net/byu-payment-system?retryWrites=true&w=majority&appName=BYU
ADMIN_KEY=byu-admin-2025-secret-key
ADMIN_EMAIL=iamknightrae@gmail.com
EMAIL_USER=
EMAIL_PASSWORD=
```

**Important Notes:**
- ✅ `PORT` should be `3000` (or let Railway auto-assign)
- ✅ `MONGODB_URI` must match your MongoDB Atlas connection string EXACTLY
- ⚠️  `EMAIL_USER` and `EMAIL_PASSWORD` can be empty (emails just won't work)

### 3. Check MongoDB Atlas Access

1. Go to: https://cloud.mongodb.com/v2/68f3ada8598cfe16f2eaf866#/clusters
2. Click **"Network Access"** in the left sidebar
3. Make sure **0.0.0.0/0** is in the IP Access List
4. This allows Railway to connect from any IP

### 4. Verify Railway Configuration

Check your `railway.json` file has correct settings:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100
  }
}
```

### 5. Check package.json Start Script

In `backend/package.json`, verify:
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

## 🚀 Quick Fix Options

### Option A: Redeploy (If settings are correct)

In Railway dashboard:
1. Go to your service
2. Click **"Deployments"** tab
3. Click **"Redeploy"** button on latest deployment

### Option B: Manual Deploy via CLI

```bash
cd backend
npm install -g @railway/cli
railway login
railway link
railway up
```

### Option C: Deploy from GitHub (Recommended)

1. Make sure your code is pushed to GitHub
2. In Railway:
   - Settings → Connect to GitHub repo
   - Select your repository
   - Set Root Directory: `backend`
   - Railway will auto-deploy on every push

## 🔍 Debugging Steps

### Test 1: Check if backend is accessible
```bash
curl https://byupay.up.railway.app/api/health
```

**Expected:** `{"status":"OK","timestamp":"...","uptime":...}`
**Current:** `{"status":"error","code":502,...}`

### Test 2: Check Railway build logs
Look for these in Railway logs:
- ✅ `npm install` completed
- ✅ `Server is running on port 3000`
- ✅ `MongoDB connected successfully`
- ❌ Any error messages

### Test 3: Check MongoDB connection locally
```bash
cd backend
node test-connection.js
```

If this works locally but fails on Railway, it's a Railway environment variable issue.

## 🎯 Most Likely Causes (in order):

1. **MongoDB Connection String Wrong** (90% of cases)
   - Check `MONGODB_URI` in Railway variables
   - Verify MongoDB Atlas network access allows 0.0.0.0/0
   - Check username/password in connection string

2. **Environment Variables Missing** (5% of cases)
   - Make sure all required variables are set in Railway
   - Check for typos in variable names

3. **Port Configuration Issue** (3% of cases)
   - Railway expects your app to listen on the `PORT` environment variable
   - Your `server.js` should use: `const PORT = process.env.PORT || 3000;`

4. **Build Failed** (2% of cases)
   - Check Railway build logs
   - Missing dependencies in package.json

## ✅ Verification Checklist

Once you make changes:

- [ ] Railway logs show "Server is running"
- [ ] Railway logs show "MongoDB connected successfully"
- [ ] `curl https://byupay.up.railway.app/api/health` returns 200 OK
- [ ] Can register a student from the frontend
- [ ] Admin dashboard loads data

## 📞 Quick Help

**Right now, do this:**

1. **Go to Railway → Your Service → Deployments → Latest → Logs**
2. **Find the error message** (it will be red text usually)
3. **Share that error with me** and I'll tell you exactly how to fix it!

The logs will tell us EXACTLY what's wrong. Most likely it's the MongoDB connection string.

---

## 🔧 Common MongoDB URI Issues

Your connection string should look like:
```
mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/DATABASE?retryWrites=true&w=majority
```

Common mistakes:
- ❌ Missing `mongodb+srv://` prefix
- ❌ Password has special characters not URL-encoded
- ❌ Wrong database name
- ❌ Extra spaces or line breaks
- ❌ Wrong cluster address

## Need More Help?

Share the Railway logs with me and I'll diagnose the exact issue!

