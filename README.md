# 🎓 BYU Pathway Ghana Virtual Card Payment Platform

A full-stack educational demo platform that allows Ghanaian BYU students without Visa cards to request temporary virtual cards for school fee payments. Cards are assigned by administrators and automatically expire after 12 hours.

## 📋 Features

- **Student Registration** - Students register with name, BYU ID, email, and phone
- **Card Request System** - Students request virtual cards for specific payment amounts
- **Admin Dashboard** - Administrators can approve requests and assign virtual cards
- **Email Notifications** - Automated emails for request confirmations and card assignments
- **Auto-Expiry** - Cards automatically expire 12 hours after assignment
- **Mock Card Generation** - System can generate mock card numbers for testing

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - REST API
- **MongoDB** - Database
- **Mongoose** - ODM
- **Nodemailer** - Email notifications (Gmail)
- **node-cron** - Scheduled tasks for card expiry
- **dotenv** - Environment configuration

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client

## 📁 Project Structure

```
byu-virtual-card-system/
├── backend/
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── utils/            # Email service & cron jobs
│   ├── config/           # Database configuration
│   ├── server.js         # Main server file
│   ├── package.json      # Backend dependencies
│   └── .env.example      # Environment template
└── frontend/
    ├── src/
    │   ├── pages/        # React page components
    │   ├── api/          # API service layer
    │   ├── App.jsx       # Main app component
    │   ├── App.css       # Styling
    │   └── main.jsx      # Entry point
    ├── package.json      # Frontend dependencies
    ├── vite.config.js    # Vite configuration
    └── index.html        # HTML template
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (running locally or remote)
- **Gmail Account** (for email notifications)

### Installation

1. **Clone or navigate to the project directory:**
```bash
cd "I:\Projects\BYU Payment System"
```

2. **Install Backend Dependencies:**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies:**
```bash
cd ../frontend
npm install
```

### Configuration

1. **Set up Backend Environment Variables:**

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/byu_virtual

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
ADMIN_EMAIL=admin@example.com

# Admin Authentication
ADMIN_KEY=your-secret-admin-key-here
```

**Note:** For Gmail, you need to:
1. Enable 2-factor authentication on your Google account
2. Generate an "App Password" in Google Account settings
3. Use the app password (not your regular Gmail password)

### Running the Application

1. **Start MongoDB** (if running locally):
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongodb
```

2. **Start Backend Server:**
```bash
cd backend
npm run dev
```

Backend will run on: `http://localhost:3000`

3. **Start Frontend (in a new terminal):**
```bash
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:5173`

## 📖 API Documentation

### Student Endpoints

#### Register Student
```http
POST /api/student/register
Content-Type: application/json

{
  "name": "John Doe",
  "byuId": "BYU12345",
  "email": "john@example.com",
  "phone": "+233 XX XXX XXXX"
}
```

#### Request Virtual Card
```http
POST /api/student/request-card
Content-Type: application/json

{
  "byuId": "BYU12345",
  "amount": 500
}
```

#### Get Student Dashboard
```http
GET /api/student/dashboard/:byuId
```

#### Get Card Request Details
```http
GET /api/student/request/:requestToken
```

### Admin Endpoints

All admin endpoints require the `x-admin-key` header.

#### Get All Requests
```http
GET /api/admin/requests?status=pending
Headers: x-admin-key: your-admin-key
```

#### Assign Mock Card
```http
POST /api/admin/assign/mock
Headers: x-admin-key: your-admin-key
Content-Type: application/json

{
  "requestId": "request-id-here"
}
```

#### Mark Request Status
```http
POST /api/admin/action
Headers: x-admin-key: your-admin-key
Content-Type: application/json

{
  "requestId": "request-id-here",
  "action": "paid"
}
```

#### Get Statistics
```http
GET /api/admin/stats
Headers: x-admin-key: your-admin-key
```

## 🎯 Usage Flow

### Student Flow

1. **Register** - Go to `/register` and fill in your details
2. **Request Card** - Navigate to `/request` and submit a card request
3. **Check Dashboard** - View your request status at `/dashboard`
4. **Receive Email** - Get card details via email when approved
5. **Make Payment** - Use the virtual card within 12 hours

### Admin Flow

1. **Login** - Access `/admin` with your admin key
2. **View Requests** - See all pending card requests
3. **Assign Card** - Click "Assign Mock Card" to generate and assign
4. **Track Status** - Monitor assigned, paid, and expired cards
5. **Manual Actions** - Mark requests as paid, expired, or declined

## 🔐 Security Notes

⚠️ **This is an educational demo platform:**

- Mock card numbers are randomly generated (not real)
- Not connected to actual payment processors
- Use only for demonstration and learning purposes
- Do not deploy with real financial data

## 🕐 Automated Tasks

### Card Expiry Cron Job

The system automatically runs a cron job every 5 minutes to:
- Check for cards that have passed their 12-hour validity
- Update status to "expired"
- Send expiry notification emails to students

## 🎨 UI Pages

1. **Home** (`/`) - Landing page with system overview
2. **Register** (`/register`) - Student registration form
3. **Request Card** (`/request`) - Card request submission
4. **Student Dashboard** (`/dashboard`) - View all your requests
5. **Admin Dashboard** (`/admin`) - Manage all card requests

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# If not, start it:
# Windows: Start MongoDB service
# macOS/Linux: sudo systemctl start mongodb
```

### Email Not Sending
- Verify Gmail credentials in `.env`
- Ensure you're using an App Password (not regular password)
- Check Gmail security settings

### Port Already in Use
```bash
# Change PORT in backend/.env to another port (e.g., 3001)
# Or kill the process using the port:
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -ti:3000 | xargs kill
```

## 📝 License

This project is for educational purposes only.

## 👥 Contributors

Built for BYU Pathway Ghana students.

---

**Made with ❤️ for education**

