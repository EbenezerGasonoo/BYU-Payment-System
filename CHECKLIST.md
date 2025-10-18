# ✅ Setup & Launch Checklist

Use this checklist to ensure everything is configured correctly before running the application.

## 📋 Pre-Flight Checklist

### 1. Software Installation

- [ ] **Node.js** installed (v16 or higher)
  - Check: Run `node --version` in terminal
  - Download: https://nodejs.org/

- [ ] **MongoDB** installed and running
  - Check: Run `mongosh` in terminal
  - Download: https://www.mongodb.com/try/download/community
  - See: [MONGODB_SETUP.md](MONGODB_SETUP.md)

### 2. Dependencies Installed

- [x] **Backend dependencies** installed
  - Status: ✅ Completed (129 packages)
  
- [x] **Frontend dependencies** installed
  - Status: ✅ Completed (90 packages)

### 3. Configuration Files

- [x] **backend/.env** file exists
  - Status: ✅ Created

- [ ] **Email configured** in backend/.env
  - [ ] EMAIL_USER set
  - [ ] EMAIL_PASSWORD set (Gmail App Password)
  - [ ] ADMIN_EMAIL set
  - Note: Optional, system works without email

- [x] **Admin key** configured
  - Default: `byu-admin-2025-secret-key`
  - Location: backend/.env

### 4. MongoDB Connection

- [ ] MongoDB service is running
  - Windows: Check Services → MongoDB Server
  - Command: `mongosh` should connect successfully

- [ ] Database created
  - Will be created automatically on first run
  - Database name: `byu_virtual`

## 🚀 Launch Sequence

### Step 1: Start MongoDB
```bash
# Should already be running as a service on Windows
# To verify:
mongosh
# Type 'exit' to quit if successful
```
- [ ] MongoDB is accessible

### Step 2: Start Backend Server
```bash
# Option A: Double-click start-backend.bat
# Option B: Manual command
cd "I:\Projects\BYU Payment System\backend"
npm run dev
```

**Expected Output:**
```
✅ MongoDB connected successfully
✅ Card expiry cron job started (runs every 5 minutes)
🚀 Server is running on port 3000
📡 API URL: http://localhost:3000
📧 Email notifications: Enabled/Disabled
🔐 Admin key: Set
```

- [ ] Backend server is running
- [ ] MongoDB connection successful
- [ ] No error messages
- [ ] Port 3000 is accessible

### Step 3: Start Frontend (New Terminal)
```bash
# Option A: Double-click start-frontend.bat
# Option B: Manual command
cd "I:\Projects\BYU Payment System\frontend"
npm run dev
```

**Expected Output:**
```
VITE v4.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

- [ ] Frontend server is running
- [ ] Port 5173 is accessible
- [ ] No error messages

### Step 4: Access Application
- [ ] Open browser to http://localhost:5173
- [ ] Homepage loads successfully
- [ ] Navigation works
- [ ] No console errors (F12)

## 🧪 Functionality Testing

### Test 1: Student Registration
1. [ ] Go to http://localhost:5173/register
2. [ ] Fill in form:
   - Name: Test Student
   - BYU ID: TEST123
   - Email: test@example.com
   - Phone: +233 24 123 4567
3. [ ] Click "Register"
4. [ ] See success message
5. [ ] No errors in console

### Test 2: Card Request
1. [ ] Go to http://localhost:5173/request
2. [ ] Enter:
   - BYU ID: TEST123
   - Amount: 500
3. [ ] Click "Submit Request"
4. [ ] See success message with request token
5. [ ] Save the request token

### Test 3: Admin Dashboard
1. [ ] Go to http://localhost:5173/admin
2. [ ] Enter admin key: `byu-admin-2025-secret-key`
3. [ ] Click "Access Dashboard"
4. [ ] See statistics cards
5. [ ] See pending request for TEST123

### Test 4: Assign Mock Card
1. [ ] In admin dashboard, find TEST123 request
2. [ ] Click "Assign Mock Card"
3. [ ] See success alert
4. [ ] Request status changes to "ASSIGNED"
5. [ ] Card details are visible

### Test 5: Student Dashboard
1. [ ] Go to http://localhost:5173/dashboard
2. [ ] Enter BYU ID: TEST123
3. [ ] Click "Load Dashboard"
4. [ ] See student information
5. [ ] See card request with status "assigned"
6. [ ] Card details visible (number, expiry, CVV)

### Test 6: Email Notifications (Optional)
- [ ] Admin received email when card was requested
- [ ] Student received email when card was assigned
- Note: Only if email is configured

## 🔧 Troubleshooting

### Backend Won't Start

**Issue**: MongoDB connection error
- [ ] Check MongoDB is installed
- [ ] Check MongoDB service is running
- [ ] Try: `mongosh` in terminal
- [ ] See: [MONGODB_SETUP.md](MONGODB_SETUP.md)

**Issue**: Port 3000 already in use
- [ ] Change PORT in backend/.env
- [ ] Or stop other application using port 3000

**Issue**: Module not found
- [ ] Run `npm install` in backend folder
- [ ] Check package.json exists

### Frontend Won't Start

**Issue**: Port 5173 already in use
- [ ] Change port in frontend/vite.config.js
- [ ] Or stop other application using port 5173

**Issue**: Module not found
- [ ] Run `npm install` in frontend folder
- [ ] Check package.json exists

### API Connection Failed

**Issue**: Frontend can't connect to backend
- [ ] Verify backend is running on port 3000
- [ ] Check http://localhost:3000 in browser
- [ ] Check browser console for CORS errors
- [ ] Verify vite.config.js proxy settings

### Email Not Working

**Issue**: Emails not being sent
- [ ] Verify EMAIL_USER in .env
- [ ] Verify EMAIL_PASSWORD is App Password (not regular password)
- [ ] Check 2FA is enabled on Gmail
- [ ] Check backend console for email errors
- Note: System works without email, just no notifications

## 📊 System Health Check

Run these commands to verify everything is working:

```bash
# Check backend API
curl http://localhost:3000

# Check frontend
curl http://localhost:5173

# Test student registration (requires backend running)
cd backend
node test-api.js
```

- [ ] Backend API responds
- [ ] Frontend loads
- [ ] Test script passes

## 📝 Common Commands

```bash
# Start backend
cd "I:\Projects\BYU Payment System\backend"
npm run dev

# Start frontend
cd "I:\Projects\BYU Payment System\frontend"
npm run dev

# Check MongoDB
mongosh

# View database
mongosh
use byu_virtual
db.students.find().pretty()
db.cardrequests.find().pretty()

# Run API tests
cd backend
node test-api.js
```

## ✨ You're Ready!

If all checkboxes are marked, your system is fully operational!

### Next Steps:
- [ ] Read [README.md](README.md) for complete documentation
- [ ] Review [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed setup
- [ ] Check [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for feature overview
- [ ] Explore the code and customize as needed

### Need Help?
- Check documentation files in project root
- Review backend console for errors
- Check browser console (F12) for frontend errors
- Verify all configuration in backend/.env

---

**System Status**: 🟢 Ready to Launch

**Happy Coding! 🚀**

