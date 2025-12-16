# 🔍 Railway Deployment Debugging Guide

## Issue: Health Check Failing

The health check at `/api/health` is failing, which means the server isn't starting or responding.

## Steps to Debug:

### 1. Check Railway Logs

Go to **Railway Dashboard** → Your service → **Deployments** → Click on the latest deployment → **View Logs**

Look for:
- ❌ Error messages
- ❌ Stack traces
- ✅ "Server is running on port" message
- ✅ "MongoDB connected" message

### 2. Common Issues:

#### Issue A: Missing MONGODB_URI
**Symptom:** Server starts but database connection fails
**Fix:** Add `MONGODB_URI` environment variable in Railway

#### Issue B: Module Loading Error
**Symptom:** Error like "Cannot find module" or "require is not defined"
**Fix:** Check that all dependencies are in `package.json`

#### Issue C: Port Binding Error
**Symptom:** "EADDRINUSE" or "Port already in use"
**Fix:** Railway sets PORT automatically, this shouldn't happen

#### Issue D: Syntax Error
**Symptom:** "SyntaxError" or "Unexpected token"
**Fix:** Check server.js for syntax errors

### 3. Test Locally First

Run this to test if server can start:
```bash
cd backend
npm install
npm start
```

If it works locally, the issue is with Railway configuration.

### 4. Check Environment Variables

Make sure these are set in Railway:
- `PORT` (auto-set by Railway)
- `MONGODB_URI` (required for database)
- `ADMIN_KEY` (optional but recommended)

### 5. Minimal Test

Try running the test script:
```bash
cd backend
node test-server.js
```

This will show which module is failing to load.

## Quick Fixes:

### Fix 1: Ensure Server Starts
The server should now start even without a database. Check logs for:
```
🚀 Server is running on port [PORT]
```

### Fix 2: Check Health Endpoint
The health endpoint is registered FIRST, so it should work even if routes fail.

### Fix 3: Verify PORT
Railway sets PORT automatically. Make sure your code uses:
```javascript
const PORT = process.env.PORT || 3000;
```

## Next Steps:

1. **Check Railway logs** for actual error messages
2. **Share the error logs** so we can fix the specific issue
3. **Verify environment variables** are set correctly
4. **Test locally** to ensure code works

---

**The server code has been updated to:**
- ✅ Start even if database fails
- ✅ Register health check first
- ✅ Handle errors gracefully
- ✅ Log startup information

**If health check still fails, the logs will show why.**

