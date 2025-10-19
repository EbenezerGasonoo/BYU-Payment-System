# 🎓 BYU Pathway Ghana - Virtual Card Payment System

Modern, secure payment platform for BYU Pathway Ghana students to request and receive virtual cards for school fee payments.

---

## 🌟 Features

✅ **Student Registration** - Register with BYU ID and email  
✅ **Payment Requests** - Request virtual cards in USD with live GHS conversion  
✅ **Hubtel Integration** - Secure mobile money payments (MTN, Vodafone, AirtelTigo)  
✅ **Live Exchange Rates** - Real-time USD to GHS conversion  
✅ **5% Processing Fee** - Transparent fee calculation  
✅ **Admin Dashboard** - Manage requests and assign cards  
✅ **Payment Tracking** - Real-time payment status updates  
✅ **Email Notifications** - Automated admin alerts  
✅ **Live Chat** - Real-time support via Socket.io  
✅ **PWA Support** - Install as mobile app  

---

## 🚀 Live URLs

**Frontend:** https://byupay.vercel.app  
**Backend API:** https://byupay.up.railway.app  
**Admin Dashboard:** https://byupay.vercel.app/admin  

---

## 🛠️ Tech Stack

### Frontend:
- **React** - UI framework
- **Vite** - Build tool  
- **React Router** - Navigation
- **Axios** - API calls
- **Socket.io Client** - Real-time chat
- **Vercel** - Hosting

### Backend:
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database (Atlas)
- **Socket.io** - WebSocket server
- **Hubtel API** - Payment processing
- **Railway** - Hosting

---

## 💳 Payment Integration

### Hubtel Mobile Money:
- Supports: MTN, Vodafone, AirtelTigo
- Method: Direct Debit API
- Auto-verification via callbacks
- POS Sales ID: 2030303

### Status:
⏳ **Awaiting IP whitelisting** (1-2 business days)  
📧 **Action Required:** See `docs/EMAIL_TO_HUBTEL_READY.md`

---

## ⚙️ Setup & Configuration

### Local Development:

```bash
# Start backend
cd backend
npm install
npm start

# Start frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables:

See `docs/RAILWAY_ENV_SETUP.md` for complete Railway configuration.

**Required:**
- MongoDB URI
- Hubtel API credentials
- Admin key

---

## 📚 Documentation

All guides are in the `docs/` folder:

- **EMAIL_TO_HUBTEL_READY.md** ⚡ Send this email NOW!
- **HUBTEL_IP_WHITELISTING_GUIDE.md** - IP whitelisting steps
- **RAILWAY_ENV_SETUP.md** - Environment variables
- **ROUTES_REFERENCE.md** - API endpoints
- **PAYMENT_INTEGRATION_COMPLETE.md** - Payment system overview

---

## 🔑 Admin Access

**URL:** https://byupay.vercel.app/admin  
**Default Admin Key:** `byu-admin-2025-secret-key`  
*Change this in production!*

---

## 🧪 Testing

**Health Check:**
```bash
curl https://byupay.up.railway.app/api/health
```

**Get Server IP:**
```bash
curl https://byupay.up.railway.app/api/my-ip
```

**Test Hubtel Integration:**
```bash
cd backend
node test-hubtel-direct-debit.js
```

---

## 📊 Project Structure

```
BYU Payment System/
├── backend/              # Node.js Express API
│   ├── config/          # Database configuration
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── utils/           # Helper services (Hubtel, MTN, Email)
│   └── server.js        # Main server file
├── frontend/            # React application
│   ├── src/
│   │   ├── api/        # API client
│   │   ├── components/ # React components
│   │   └── pages/      # Page components
│   └── public/         # Static assets
├── docs/                # Documentation
└── scripts/             # Utility scripts
```

---

## 🔒 Security

- ✅ Environment variables for sensitive data
- ✅ Admin key authentication
- ✅ MongoDB Atlas with IP whitelist
- ✅ CORS configured
- ✅ HTTPS only in production
- ✅ Input validation

---

## 📞 Support

**Hubtel:** support@hubtel.com  
**Railway:** team@railway.app  
**MongoDB:** support.mongodb.com  

---

## 📝 License

Private - BYU Pathway Ghana

---

## 🎯 Current Status

✅ **Deployed to production**  
✅ **Payment system integrated**  
⏳ **Hubtel IP whitelisting pending**  

**Next Action:** Send email to Hubtel (see `docs/EMAIL_TO_HUBTEL_READY.md`)

---

**Built for BYU Pathway Ghana** 🎓
