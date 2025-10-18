# 🏗️ System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🎓 Student Portal              👨‍💼 Admin Dashboard               │
│  ┌──────────────────┐           ┌──────────────────┐            │
│  │ • Register       │           │ • View Requests  │            │
│  │ • Request Card   │           │ • Assign Cards   │            │
│  │ • View Dashboard │           │ • Track Status   │            │
│  └──────────────────┘           └──────────────────┘            │
│           │                               │                      │
│           └───────────────┬───────────────┘                      │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                      FRONTEND LAYER                              │
│                     React + Vite                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📱 React Router         🔌 Axios API Client                     │
│  ┌──────────────┐        ┌──────────────┐                       │
│  │ Home         │        │ studentAPI   │                       │
│  │ Register     │───────▶│ adminAPI     │                       │
│  │ Request      │        │              │                       │
│  │ Dashboard    │        └──────┬───────┘                       │
│  │ Admin        │               │                               │
│  └──────────────┘               │                               │
│                                 │                               │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
                                  │ HTTP Requests
                                  │ Port 5173 → 3000
                                  │
┌─────────────────────────────────▼───────────────────────────────┐
│                       BACKEND LAYER                             │
│                    Node.js + Express                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🛣️  API Routes                                                  │
│  ┌──────────────────────────────────────────────┐               │
│  │  /api/student/*       /api/admin/*           │               │
│  │  ├─ register          ├─ requests            │               │
│  │  ├─ request-card      ├─ assign              │               │
│  │  ├─ dashboard/:id     ├─ assign/mock         │               │
│  │  └─ request/:token    ├─ action              │               │
│  │                       └─ stats               │               │
│  └──────────────┬───────────────┬───────────────┘               │
│                 │               │                               │
│  🔐 Middleware  │               │  📧 Utilities                  │
│  ┌─────────────▼──┐        ┌───▼──────────────┐                │
│  │ CORS           │        │ Email Service    │                │
│  │ JSON Parser    │        │ Cron Jobs        │                │
│  │ Admin Auth     │        │ (Card Expiry)    │                │
│  └─────────────┬──┘        └───┬──────────────┘                │
│                │               │                               │
│                └───────┬───────┘                               │
│                        │                                       │
└────────────────────────┼───────────────────────────────────────┘
                         │
                         │ Mongoose ODM
                         │
┌────────────────────────▼───────────────────────────────────────┐
│                     DATABASE LAYER                             │
│                      MongoDB                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 Collections                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │  students                cardrequests            │           │
│  │  ┌───────────────┐       ┌──────────────────┐   │           │
│  │  │ _id           │       │ _id              │   │           │
│  │  │ name          │       │ student (ref)    │   │           │
│  │  │ byuId         │◀──────│ amount           │   │           │
│  │  │ email         │       │ status           │   │           │
│  │  │ phone         │       │ requestToken     │   │           │
│  │  │ createdAt     │       │ virtualCardNum   │   │           │
│  │  └───────────────┘       │ cardExpiryDate   │   │           │
│  │                          │ cardCVV          │   │           │
│  │                          │ assignedAt       │   │           │
│  │                          │ expiresAt        │   │           │
│  │                          │ createdAt        │   │           │
│  │                          └──────────────────┘   │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📧 Gmail SMTP                      ⏰ Node-Cron                 │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │ Admin Notify     │              │ Every 5 minutes  │         │
│  │ Student Notify   │              │ Check Expiry     │         │
│  │ Card Expired     │              │ Auto-Update DB   │         │
│  └──────────────────┘              └──────────────────┘         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Student Registration Flow

```
Student                Frontend              Backend              Database
  │                       │                     │                    │
  ├─ Fill Form ──────────▶│                     │                    │
  │                       │                     │                    │
  │                       ├─ POST /register ───▶│                    │
  │                       │                     │                    │
  │                       │                     ├─ Validate Data     │
  │                       │                     │                    │
  │                       │                     ├─ Save Student ────▶│
  │                       │                     │                    │
  │                       │                     │◀─── Success ───────┤
  │                       │                     │                    │
  │                       │◀─── 201 Created ────┤                    │
  │                       │                     │                    │
  │◀─ Success Message ────┤                     │                    │
  │                       │                     │                    │
```

### 2. Card Request Flow

```
Student              Frontend           Backend           Database         Email
  │                     │                  │                 │              │
  ├─ Submit Request ───▶│                  │                 │              │
  │                     │                  │                 │              │
  │                     ├─ POST /request ─▶│                 │              │
  │                     │                  │                 │              │
  │                     │                  ├─ Find Student ─▶│              │
  │                     │                  │                 │              │
  │                     │                  │◀─── Student ────┤              │
  │                     │                  │                 │              │
  │                     │                  ├─ Create Token   │              │
  │                     │                  │                 │              │
  │                     │                  ├─ Save Request ─▶│              │
  │                     │                  │                 │              │
  │                     │                  ├─ Notify Admin ─────────────────▶│
  │                     │                  │                 │              │
  │                     │◀─── Response ────┤                 │              │
  │                     │    (with token)  │                 │              │
  │◀─ Show Token ───────┤                  │                 │              │
  │                     │                  │                 │              │
```

### 3. Admin Card Assignment Flow

```
Admin              Frontend           Backend           Database         Email
  │                   │                  │                 │              │
  ├─ View Requests ──▶│                  │                 │              │
  │                   │                  │                 │              │
  │                   ├─ GET /requests ─▶│                 │              │
  │                   │                  │                 │              │
  │                   │                  ├─ Fetch All ────▶│              │
  │                   │                  │                 │              │
  │                   │                  │◀─── Requests ───┤              │
  │                   │                  │                 │              │
  │                   │◀─── List ────────┤                 │              │
  │                   │                  │                 │              │
  │◀─ Display Cards ──┤                  │                 │              │
  │                   │                  │                 │              │
  ├─ Assign Mock ────▶│                  │                 │              │
  │                   │                  │                 │              │
  │                   ├─ POST /assign/mock                 │              │
  │                   │                  │                 │              │
  │                   │                  ├─ Generate Card  │              │
  │                   │                  │                 │              │
  │                   │                  ├─ Set Expiry     │              │
  │                   │                  │   (now + 12h)   │              │
  │                   │                  │                 │              │
  │                   │                  ├─ Update Request▶│              │
  │                   │                  │   status=assigned              │
  │                   │                  │                 │              │
  │                   │                  ├─ Notify Student─────────────────▶│
  │                   │                  │                 │              │
  │                   │◀─── Success ─────┤                 │              │
  │                   │                  │                 │              │
  │◀─ Confirmation ───┤                  │                 │              │
  │                   │                  │                 │              │
```

### 4. Auto-Expiry Cron Job Flow

```
Cron Job           Backend           Database         Email
   │                  │                 │              │
   ├─ Every 5 min ───▶│                 │              │
   │                  │                 │              │
   │                  ├─ Find Expired ─▶│              │
   │                  │   (expiresAt    │              │
   │                  │    <= now AND   │              │
   │                  │    status =     │              │
   │                  │    assigned)    │              │
   │                  │                 │              │
   │                  │◀─── List ───────┤              │
   │                  │                 │              │
   │                  ├─ For each:      │              │
   │                  │                 │              │
   │                  ├─ Update Status ▶│              │
   │                  │   (expired)     │              │
   │                  │                 │              │
   │                  ├─ Notify Student─────────────────▶│
   │                  │                 │              │
   │                  ├─ Log Result     │              │
   │                  │                 │              │
   │◀─── Complete ────┤                 │              │
   │                  │                 │              │
```

## Component Architecture

### Frontend Components

```
App.jsx
  │
  ├─ Router
  │   │
  │   ├─ Navbar
  │   │
  │   ├─ Routes
  │   │   │
  │   │   ├─ Home.jsx
  │   │   ├─ StudentRegister.jsx
  │   │   ├─ RequestPayment.jsx
  │   │   ├─ StudentDashboard.jsx
  │   │   └─ AdminDashboard.jsx
  │   │
  │   └─ Footer
  │
  └─ API Service (api.js)
      │
      ├─ studentAPI
      │   ├─ register()
      │   ├─ requestCard()
      │   ├─ getDashboard()
      │   └─ getRequest()
      │
      └─ adminAPI
          ├─ getRequests()
          ├─ assignCard()
          ├─ assignMockCard()
          ├─ updateAction()
          └─ getStats()
```

### Backend Structure

```
server.js
  │
  ├─ Express App
  │   │
  │   ├─ Middleware
  │   │   ├─ CORS
  │   │   ├─ JSON Parser
  │   │   └─ URL Encoded
  │   │
  │   ├─ Routes
  │   │   ├─ /api/student (studentRoutes.js)
  │   │   └─ /api/admin (adminRoutes.js)
  │   │
  │   └─ Error Handlers
  │
  ├─ Database Connection (database.js)
  │
  ├─ Models
  │   ├─ Student.js
  │   └─ CardRequest.js
  │
  └─ Utilities
      ├─ emailService.js
      │   ├─ notifyAdminNewRequest()
      │   ├─ notifyStudentCardAssigned()
      │   └─ notifyStudentCardExpired()
      │
      └─ cronJobs.js
          └─ startCardExpiryJob()
```

## Security Architecture

```
┌─────────────────────────────────────────────────┐
│              Security Layers                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  🔐 Admin Authentication                         │
│  ├─ API Key in Headers (x-admin-key)            │
│  ├─ Verified on Each Request                    │
│  └─ Stored in Environment Variables              │
│                                                  │
│  🛡️  Input Validation                            │
│  ├─ Required Fields Check                        │
│  ├─ Email Format Validation                      │
│  ├─ Unique Constraint (BYU ID, Email)           │
│  └─ Amount Range Validation                      │
│                                                  │
│  🌐 CORS Policy                                  │
│  ├─ Cross-Origin Resource Sharing               │
│  └─ Configured in Express                        │
│                                                  │
│  📧 Email Security                               │
│  ├─ App Passwords (not real password)           │
│  ├─ Environment Variables                        │
│  └─ No Credentials in Code                       │
│                                                  │
│  💾 Database Security                            │
│  ├─ Connection String in .env                    │
│  ├─ Mongoose Validation                          │
│  └─ Unique Indexes                               │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Deployment Architecture (Suggested)

```
┌────────────────────────────────────────────────────┐
│                   Production                        │
├────────────────────────────────────────────────────┤
│                                                     │
│  Frontend: Vercel / Netlify                         │
│  ├─ Build: npm run build                            │
│  ├─ Deploy: dist/ folder                            │
│  └─ Environment: VITE_API_URL                       │
│                                                     │
│  Backend: Heroku / Railway / Render                 │
│  ├─ Process: Node.js                                │
│  ├─ Port: Dynamic (process.env.PORT)                │
│  └─ Environment Variables:                          │
│      ├─ MONGODB_URI                                 │
│      ├─ EMAIL_USER                                  │
│      ├─ EMAIL_PASSWORD                              │
│      └─ ADMIN_KEY                                   │
│                                                     │
│  Database: MongoDB Atlas                            │
│  ├─ Cluster: M0 (Free Tier)                         │
│  ├─ Region: Closest to users                        │
│  └─ Connection: mongodb+srv://...                   │
│                                                     │
└────────────────────────────────────────────────────┘
```

## Technology Stack Summary

| Layer      | Technology       | Purpose                    |
|------------|------------------|----------------------------|
| Frontend   | React 18         | UI Framework               |
| Frontend   | Vite             | Build Tool                 |
| Frontend   | React Router     | Navigation                 |
| Frontend   | Axios            | HTTP Client                |
| Backend    | Node.js          | Runtime                    |
| Backend    | Express          | Web Framework              |
| Backend    | Mongoose         | MongoDB ODM                |
| Backend    | Nodemailer       | Email Service              |
| Backend    | node-cron        | Task Scheduler             |
| Database   | MongoDB          | NoSQL Database             |
| Auth       | API Key          | Admin Authentication       |
| Email      | Gmail SMTP       | Email Notifications        |

---

**Complete. Clean. Modular. Ready to Scale. 🚀**

