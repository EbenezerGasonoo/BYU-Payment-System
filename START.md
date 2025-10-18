# 🎯 How to Start the Application

## Prerequisites Checklist

Before starting, make sure you have:

- [x] Node.js installed (v16 or higher)
- [ ] MongoDB installed and running
- [ ] Dependencies installed (`npm install` in both backend and frontend)
- [ ] Backend `.env` file configured

## Current Status

✅ **Node.js**: Installed
✅ **Backend Dependencies**: Installed
✅ **Frontend Dependencies**: Installed
❌ **MongoDB**: Not detected

## Next Steps

### 1. Install MongoDB

**MongoDB is required for this application to work.**

See: [MONGODB_SETUP.md](MONGODB_SETUP.md) for installation instructions.

Quick link: https://www.mongodb.com/try/download/community

### 2. Configure Email (Optional)

Edit `backend/.env` and add your Gmail credentials:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

**Note:** Email is optional. The system works without it, but you won't receive notifications.

### 3. Start Backend Server

Open a terminal:

```bash
cd "I:\Projects\BYU Payment System\backend"
npm run dev
```

Expected output:
```
✅ MongoDB connected successfully
✅ Card expiry cron job started
🚀 Server is running on port 3000
```

### 4. Start Frontend (New Terminal)

Open a NEW terminal window:

```bash
cd "I:\Projects\BYU Payment System\frontend"
npm run dev
```

Expected output:
```
  VITE v4.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### 5. Access the Application

Open your browser and go to:
- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:3000

## Quick Start Commands

### Windows PowerShell

**Terminal 1 (Backend):**
```powershell
cd "I:\Projects\BYU Payment System\backend"
npm run dev
```

**Terminal 2 (Frontend):**
```powershell
cd "I:\Projects\BYU Payment System\frontend"
npm run dev
```

## Testing the System

Once both servers are running:

1. **Register**: http://localhost:5173/register
2. **Request Card**: http://localhost:5173/request
3. **Admin Login**: http://localhost:5173/admin
   - Admin Key: `byu-admin-2025-secret-key`

## Common Issues

### "MongoDB connection error"
- MongoDB is not installed or not running
- See [MONGODB_SETUP.md](MONGODB_SETUP.md)

### "Port 3000 already in use"
- Another application is using port 3000
- Change PORT in `backend/.env` to another number (e.g., 3001)

### "Cannot GET /api/..."
- Backend server is not running
- Start backend first with `npm run dev`

### "Network Error" in frontend
- Backend is not running or crashed
- Check backend terminal for errors

## Need Help?

Check these files:
- [README.md](README.md) - Complete documentation
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup instructions
- [MONGODB_SETUP.md](MONGODB_SETUP.md) - MongoDB installation guide

---

**Happy coding! 🚀**

