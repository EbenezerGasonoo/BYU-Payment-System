# 🎓 BYU Pathway Ghana Virtual Card Payment System

A modern, full-stack web application designed to help BYU Pathway Ghanaian students pay their school fees using virtual cards. This platform provides a seamless payment experience with real-time currency conversion, live chat support, and an intuitive admin dashboard.

## 🌟 Features

### For Students
- **Student Registration** - Easy signup with BYU Pathway email validation
- **Virtual Card Requests** - Request USD virtual cards for school fee payments
- **Live Currency Conversion** - Real-time USD to GHS exchange rates with 5% chargeback fee
- **Terms & Agreement** - Clear terms and conditions for card usage
- **Student Dashboard** - Track card requests and status
- **Live Chat Support** - Real-time assistance from administrators
- **Mobile Responsive** - Works perfectly on all devices
- **PWA Support** - Install as a mobile app

### For Administrators
- **Admin Dashboard** - Manage student requests and assign virtual cards
- **Live Chat Management** - Respond to student inquiries in real-time
- **Email Notifications** - Automated email alerts for new requests
- **Card Management** - Generate and assign virtual cards with 4-6 hour expiry
- **Request Tracking** - Monitor all student requests and their status

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client for API calls
- **CSS3** - Modern styling with animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Socket.IO** - Real-time bidirectional communication
- **Nodemailer** - Email service
- **Cron Jobs** - Automated tasks

### Additional Features
- **PWA (Progressive Web App)** - Mobile app capabilities
- **Live Exchange Rate API** - Real-time currency conversion
- **Email Service** - Automated notifications
- **Responsive Design** - Mobile-first approach

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd BYU-Payment-System
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   
   Create `backend/.env` file:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/byu-payment-system
   JWT_SECRET=your-jwt-secret
   ADMIN_KEY=byu-admin-2025-secret-key
   ADMIN_EMAIL=iamknightrae@gmail.com
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

5. **Start the development servers**
   
   Backend (Terminal 1):
   ```bash
   cd backend
   npm start
   ```
   
   Frontend (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 📱 Usage

### For Students
1. **Register** - Create an account with your BYU Pathway email
2. **Request Card** - Enter the USD amount needed for school fees
3. **View Conversion** - See the GHS equivalent with live exchange rates
4. **Accept Terms** - Review and accept the terms and conditions
5. **Submit Request** - Your request will be sent to administrators
6. **Track Status** - Monitor your request in the dashboard
7. **Receive Card** - Get email notification when card is assigned

### For Administrators
1. **Access Admin Panel** - Use the admin key to access the dashboard
2. **View Requests** - See all pending student requests
3. **Assign Cards** - Generate and assign virtual cards
4. **Monitor Chat** - Respond to student inquiries via live chat
5. **Manage System** - Track all activities and requests

## 🔧 Configuration

### Database Setup
- MongoDB connection string in `backend/.env`
- Collections are created automatically on first run

### Email Configuration
- Gmail SMTP settings in `backend/.env`
- App password required for Gmail authentication

### Exchange Rate API
- Currently using Open Exchange Rate API
- Free tier provides USD to GHS conversion
- Rate updates every 5 minutes

## 📁 Project Structure

```
BYU-Payment-System/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── CardRequest.js
│   │   ├── ChatMessage.js
│   │   ├── ContactMessage.js
│   │   └── Student.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── contactRoutes.js
│   │   └── studentRoutes.js
│   ├── utils/
│   │   ├── cronJobs.js
│   │   └── emailService.js
│   └── server.js
├── frontend/
│   ├── public/
│   │   ├── icons/
│   │   ├── manifest.json
│   │   └── service-worker.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── HelpButton.jsx
│   │   │   ├── InstallButton.jsx
│   │   │   ├── LiveChat.jsx
│   │   │   ├── OnboardingTour.jsx
│   │   │   ├── ProgressTracker.jsx
│   │   │   ├── Tooltip.jsx
│   │   │   └── WelcomeModal.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Contact.jsx
│   │   │   ├── FAQ.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── RequestPayment.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   └── StudentRegister.jsx
│   │   ├── api/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   └── vite.config.js
├── README.md
└── package.json
```

## 🔒 Security Features

- **Email Validation** - BYU Pathway email verification
- **JWT Authentication** - Secure session management
- **Input Validation** - Server-side validation for all inputs
- **CORS Protection** - Cross-origin request security
- **Rate Limiting** - API request throttling
- **Environment Variables** - Sensitive data protection

## 🌐 Deployment

### Local Development
- Use the provided batch files for easy startup
- `start-backend.bat` - Starts the backend server
- `start-frontend.bat` - Starts the frontend development server

### Production Deployment
- Deploy backend to Heroku, Railway, or similar
- Deploy frontend to Vercel, Netlify, or similar
- Configure environment variables for production
- Set up MongoDB Atlas for cloud database

## 📞 Support

- **Email:** iamknightrae@gmail.com
- **Phone:** +233 543692272
- **WhatsApp:** +233 543692272
- **Office Hours:** Monday - Friday, 9:00 AM - 5:00 PM GMT

## 📄 License

This project is created for educational purposes and is not officially affiliated with BYU Pathway. It's a student project designed to help fellow students with payment processes.

## 🤝 Contributing

This is a student project, but suggestions and improvements are welcome. Please feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Share feedback

## 🎯 Future Enhancements

- [ ] Payment gateway integration
- [ ] SMS notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app development
- [ ] Advanced security features

---

**Note:** This platform is not officially affiliated with BYU Pathway but is a project created by a student to help make payment easier for fellow students. Virtual cards expire automatically after 4-6 hours.