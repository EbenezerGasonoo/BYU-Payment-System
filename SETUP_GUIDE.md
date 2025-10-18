# 🚀 Quick Setup Guide

## Step-by-Step Installation

### 1. Install MongoDB (if not installed)

#### Windows:
1. Download from: https://www.mongodb.com/try/download/community
2. Run installer and follow instructions
3. MongoDB will start automatically as a service

#### Verify MongoDB is running:
```bash
mongosh
# You should see MongoDB shell. Type 'exit' to quit.
```

### 2. Configure Email (Optional but Recommended)

To enable email notifications:

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** → **App Passwords**
3. Generate a new app password for "Mail"
4. Copy the 16-character password

5. Edit `backend/.env` and update:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
ADMIN_EMAIL=admin-email@example.com
```

**Note:** Without email configuration, the system will still work, but notifications won't be sent.

### 3. Start the Application

#### Terminal 1 - Backend:
```bash
cd "I:\Projects\BYU Payment System\backend"
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
✅ Card expiry cron job started
🚀 Server is running on port 3000
📡 API URL: http://localhost:3000
```

#### Terminal 2 - Frontend:
```bash
cd "I:\Projects\BYU Payment System\frontend"
npm run dev
```

You should see:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### 4. Access the Application

- **Frontend UI:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Documentation:** http://localhost:3000 (shows all endpoints)

## 🎯 Testing the Flow

### Quick Test Scenario

1. **Register a Student**
   - Go to: http://localhost:5173/register
   - Fill in:
     - Name: John Doe
     - BYU ID: BYU12345
     - Email: john@example.com
     - Phone: +233 24 123 4567
   - Click "Register"

2. **Request a Virtual Card**
   - Go to: http://localhost:5173/request
   - Enter:
     - BYU ID: BYU12345
     - Amount: 500
   - Click "Submit Request"
   - **Save the Request Token** shown in the success message

3. **Admin Assigns Card**
   - Go to: http://localhost:5173/admin
   - Enter Admin Key: `byu-admin-2025-secret-key` (from `.env`)
   - Click "Access Dashboard"
   - Find the pending request for John Doe
   - Click "Assign Mock Card"
   - Student will be notified via email (if configured)

4. **Check Student Dashboard**
   - Go to: http://localhost:5173/dashboard
   - Enter BYU ID: BYU12345
   - Click "Load Dashboard"
   - You'll see the card details (card number, expiry, CVV)

5. **Card Auto-Expiry**
   - Wait 12 hours (or modify the code to test faster)
   - The cron job will automatically expire the card
   - Student will receive expiry notification

## 🔧 Troubleshooting

### MongoDB Not Running
```bash
# Check if MongoDB is running
mongosh

# If error, start MongoDB:
# Windows: Start "MongoDB Server" service from Services
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongodb
```

### Port Already in Use
If port 3000 or 5173 is already in use:

**Backend:** Change `PORT` in `backend/.env`
**Frontend:** Change port in `frontend/vite.config.js`

### Email Not Working
- Verify you're using an App Password (not your regular Gmail password)
- Check that 2-factor authentication is enabled on your Google account
- System works without email, notifications just won't be sent

### Cannot Connect to API
Make sure backend is running on port 3000. Check terminal for errors.

## 🧪 Testing with Postman/Thunder Client

### Test Student Registration
```http
POST http://localhost:3000/api/student/register
Content-Type: application/json

{
  "name": "Jane Smith",
  "byuId": "BYU67890",
  "email": "jane@example.com",
  "phone": "+233 20 987 6543"
}
```

### Test Card Request
```http
POST http://localhost:3000/api/student/request-card
Content-Type: application/json

{
  "byuId": "BYU67890",
  "amount": 750
}
```

### Test Admin Dashboard (Get Requests)
```http
GET http://localhost:3000/api/admin/requests
x-admin-key: byu-admin-2025-secret-key
```

### Test Assign Mock Card
```http
POST http://localhost:3000/api/admin/assign/mock
Content-Type: application/json
x-admin-key: byu-admin-2025-secret-key

{
  "requestId": "your-request-id-here"
}
```

## 📊 Database Access

To view data in MongoDB:

```bash
mongosh
use byu_virtual
db.students.find().pretty()
db.cardrequests.find().pretty()
```

## 🎨 Customization

### Change Card Expiry Time

Edit `backend/routes/adminRoutes.js` and `backend/utils/cronJobs.js`:

```javascript
// Change from 12 hours to 1 hour for testing:
cardRequest.expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
```

### Change Cron Job Frequency

Edit `backend/utils/cronJobs.js`:

```javascript
// Check every 1 minute instead of 5:
cron.schedule('*/1 * * * *', async () => {
  // ... expiry logic
});
```

## ✅ You're All Set!

Your BYU Pathway Ghana Virtual Card Payment Platform is ready to use!

For questions or issues, check the main README.md file.

