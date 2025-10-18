# 🧪 Test Production Version - Quick Guide

## ✅ OPTION 1: Quick Test with Ngrok (2 Minutes)

This creates a production-like HTTPS URL for testing without actual deployment.

### Step 1: Make Sure Both Servers Are Running

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Backend should be running on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend should be running on `http://localhost:5173`

### Step 2: Get Your Ngrok Token (FREE)

1. Go to: **https://dashboard.ngrok.com/signup**
2. Sign up (FREE account)
3. Get your authtoken from: **https://dashboard.ngrok.com/get-started/your-authtoken**
4. Copy the token

### Step 3: Configure Ngrok

```bash
# From project root
.\ngrok.exe config add-authtoken YOUR_TOKEN_HERE
```

### Step 4: Expose Frontend to Internet

**Terminal 3:**
```bash
.\ngrok.exe http 5173
```

You'll see output like:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:5173
```

### Step 5: Test Your Production URL! 🎉

1. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)
2. **Open it in a browser** (can be on your phone, different network, etc.)
3. **Test registration:**
   - Navigate to Student Registration
   - Fill in the form
   - Submit and verify it works!

### What This Tests:
✅ HTTPS connection (like production)
✅ Real internet access (anyone can access)
✅ Mobile device testing
✅ Different networks
✅ Production-like environment

### To Stop:
- Press `Ctrl+C` in the ngrok terminal
- Your URL will stop working

---

## 🚀 OPTION 2: Deploy to Real Production (10-15 Minutes)

For permanent URLs and real production deployment.

### A. Deploy Backend to Railway

1. **Create Account:**
   - Go to: **https://railway.app**
   - Sign up with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Click "Add variables"

3. **Add Environment Variables:**
   ```
   PORT=3000
   MONGODB_URI=mongodb+srv://gas24001_db_user:RYL6UZblQRBQStkr@byu.wxvcbyd.mongodb.net/byu-payment-system?retryWrites=true&w=majority&appName=BYU
   ADMIN_KEY=byu-admin-2025-secret-key
   ADMIN_EMAIL=iamknightrae@gmail.com
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

4. **Deploy:**
   - Railway will automatically build and deploy
   - You'll get a URL like: `https://your-app.up.railway.app`
   - Test health check: `https://your-app.up.railway.app/api/health`

### B. Deploy Frontend to Vercel

1. **Create Account:**
   - Go to: **https://vercel.com**
   - Sign up with GitHub

2. **Import Project:**
   - Click "New Project"
   - Import your GitHub repository
   - Set **Root Directory** to: `frontend`
   - Framework Preset: **Vite**

3. **Configure Environment Variable:**
   - Go to Project Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend.up.railway.app/api`
   - (Use your Railway backend URL from Step A)

4. **Deploy:**
   - Click "Deploy"
   - You'll get: `https://your-project.vercel.app`

5. **Test Your Production App! 🎉**
   - Visit your Vercel URL
   - Test all features
   - Share the link with anyone!

---

## 🔍 Testing Checklist

Use this to test your production version:

### Registration Flow:
- [ ] Open the app
- [ ] Navigate to Student Registration
- [ ] Fill in the form with valid data
- [ ] Submit the form
- [ ] Verify success message appears
- [ ] Check database for new student

### Payment Request Flow:
- [ ] Navigate to Request Payment
- [ ] Enter your BYU ID
- [ ] Enter amount
- [ ] Submit request
- [ ] Verify request token is generated

### Admin Dashboard:
- [ ] Navigate to Admin Dashboard
- [ ] Enter admin key: `byu-admin-2025-secret-key`
- [ ] Verify you see pending requests
- [ ] Test assigning a mock card
- [ ] Verify card details appear

### Student Dashboard:
- [ ] Navigate to Student Dashboard
- [ ] Enter your BYU ID
- [ ] Verify you see your requests
- [ ] Check card details if assigned

### Contact Form:
- [ ] Navigate to Contact page
- [ ] Fill in contact form
- [ ] Submit message
- [ ] Verify success confirmation

### Mobile Testing:
- [ ] Open on mobile device
- [ ] Test responsive design
- [ ] Test all forms
- [ ] Verify navigation works

---

## 📊 Compare Options

| Feature | Ngrok (Quick Test) | Production Deploy |
|---------|-------------------|-------------------|
| **Setup Time** | 2 minutes | 15 minutes |
| **Cost** | FREE | FREE |
| **URL Type** | Temporary | Permanent |
| **HTTPS** | ✅ Yes | ✅ Yes |
| **Share with Others** | ✅ Yes | ✅ Yes |
| **Survives Restart** | ❌ No | ✅ Yes |
| **Custom Domain** | ❌ No | ✅ Yes (paid) |
| **Best For** | Quick testing | Production use |

---

## 🐛 Troubleshooting

### Ngrok Issues:

**"ERR_NGROK_108"**
- You need to add your authtoken
- Run: `.\ngrok.exe config add-authtoken YOUR_TOKEN`

**"Tunnel not found"**
- The ngrok process stopped
- Restart: `.\ngrok.exe http 5173`

**Backend not connecting:**
- Backend must be running on `localhost:3000`
- Frontend uses proxy to connect
- No backend changes needed!

### Production Deploy Issues:

**"Build Failed" on Vercel:**
- Check build logs
- Verify `VITE_API_URL` is set
- Try: `cd frontend && npm run build` locally first

**"Connection refused" on Railway:**
- Verify all environment variables are set
- Check Railway logs for errors
- Test health endpoint: `/api/health`

**CORS Errors:**
- Verify frontend URL is allowed in backend
- Backend already has `cors()` enabled for all origins
- Should work automatically!

---

## 💡 Recommended Workflow

1. **For Quick Testing:** Use Ngrok
   - Perfect for showing to friends
   - Testing on mobile
   - Quick demos

2. **For Production:** Deploy to Vercel + Railway
   - Permanent URL
   - Better performance
   - Professional setup
   - Can add custom domain

---

## 📞 Next Steps

After testing production:
1. Share the URL with stakeholders
2. Collect feedback
3. Make improvements
4. Redeploy (automatic if using GitHub)
5. Monitor using Railway and Vercel dashboards

---

**Quick Command Reference:**

```bash
# Start Ngrok
.\ngrok.exe http 5173

# Check if servers are running
curl http://localhost:3000/api/health  # Backend
curl http://localhost:5173              # Frontend

# Deploy to Vercel
cd frontend
vercel --prod

# Check Railway deployment
railway status
```

