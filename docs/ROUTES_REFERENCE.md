# 🗺️ BYU Payment System - All Routes Reference

## ✅ System Status

- **Frontend:** https://byupay.vercel.app ✅ LIVE
- **Backend:** https://byupay.up.railway.app ✅ LIVE

---

## 🌐 Frontend Routes (Vercel)

### Available Pages:

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Landing page with system overview |
| `/register` | Student Registration | Register new students |
| `/request` | Request Payment | Request virtual card payment |
| `/dashboard` | Student Dashboard | View your requests and cards |
| `/faq` | FAQ | Frequently asked questions |
| `/contact` | Contact | Contact form |
| `/admin` | Admin Dashboard | Admin panel (requires admin key) |

### Direct Links:

```
✅ https://byupay.vercel.app/
✅ https://byupay.vercel.app/register
✅ https://byupay.vercel.app/request
✅ https://byupay.vercel.app/dashboard
✅ https://byupay.vercel.app/faq
✅ https://byupay.vercel.app/contact
✅ https://byupay.vercel.app/admin
```

---

## 🔌 Backend API Routes (Railway)

### Student Routes (`/api/student/...`)

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/api/student/register` | Register new student | `{name, byuId, email, phone}` |
| `POST` | `/api/student/request-card` | Request virtual card | `{byuId, amount, amountInGHS, exchangeRate, totalPaidGHS, paymentMethod}` |
| `POST` | `/api/student/initiate-hubtel-payment` | Initiate Hubtel payment | `{phoneNumber, amount, paymentReference, studentName, studentEmail}` |
| `POST` | `/api/student/verify-payment` | Verify payment completion | `{paymentReference, hubtelReference?}` |
| `POST` | `/api/student/payment-failed` | Mark payment as failed | `{paymentReference, reason}` |
| `POST` | `/api/student/hubtel-callback` | Hubtel webhook callback | Hubtel sends this |
| `GET` | `/api/student/dashboard/:byuId` | Get student dashboard data | BYU ID in URL |
| `GET` | `/api/student/request/:requestToken` | Get specific request | Request token in URL |

### Admin Routes (`/api/admin/...`)

| Method | Endpoint | Description | Headers |
|--------|----------|-------------|---------|
| `GET` | `/api/admin/requests` | Get all card requests | `x-admin-key: byu-admin-2025-secret-key` |
| `GET` | `/api/admin/requests?status=pending` | Filter by status | `x-admin-key: ...` |
| `POST` | `/api/admin/assign` | Assign real card | `x-admin-key: ...` |
| `POST` | `/api/admin/assign/mock` | Assign mock card | `x-admin-key: ...` |
| `POST` | `/api/admin/action` | Update request status | `x-admin-key: ...` |
| `GET` | `/api/admin/stats` | Get statistics | `x-admin-key: ...` |

### Contact Routes (`/api/contact/...`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/contact/submit` | Submit contact message |
| `GET` | `/api/contact/messages` | Get all messages (admin) |
| `PATCH` | `/api/contact/messages/:id` | Update message status (admin) |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Check server status |
| `GET` | `/` | API documentation |

---

## 🧪 Test All Routes

### Test Frontend Routes:

```bash
# Test home page
curl https://byupay.vercel.app/

# Test register page
curl https://byupay.vercel.app/register

# Test request page
curl https://byupay.vercel.app/request

# Test dashboard
curl https://byupay.vercel.app/dashboard

# Test FAQ
curl https://byupay.vercel.app/faq

# Test contact
curl https://byupay.vercel.app/contact

# Test admin
curl https://byupay.vercel.app/admin
```

### Test Backend API Routes:

```bash
# Test health check
curl https://byupay.up.railway.app/api/health

# Test API documentation
curl https://byupay.up.railway.app/

# Test student registration
curl -X POST https://byupay.up.railway.app/api/student/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "byuId": "123456789",
    "email": "test@byupathway.edu",
    "phone": "0241234567"
  }'

# Test admin requests (requires admin key)
curl https://byupay.up.railway.app/api/admin/requests \
  -H "x-admin-key: byu-admin-2025-secret-key"

# Test contact submission
curl -X POST https://byupay.up.railway.app/api/contact/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test",
    "message": "Hello"
  }'
```

---

## ❌ Common "Route Not Found" Errors

### Issue 1: Frontend 404

**Symptoms:**
```
Cannot GET /some-page
404 Not Found
```

**Valid Routes:**
- ✅ `/` - Home
- ✅ `/register` - Registration
- ✅ `/request` - Request payment
- ✅ `/dashboard` - Student dashboard
- ✅ `/faq` - FAQ
- ✅ `/contact` - Contact
- ✅ `/admin` - Admin dashboard

**Invalid Routes:**
- ❌ `/login` - Not implemented
- ❌ `/signup` - Use `/register` instead
- ❌ `/payment` - Use `/request` instead
- ❌ `/students` - Use `/dashboard` instead

### Issue 2: API 404

**Symptoms:**
```json
{
  "success": false,
  "message": "Route not found"
}
```

**Common Mistakes:**

❌ **Wrong:** `https://byupay.up.railway.app/student/register`  
✅ **Correct:** `https://byupay.up.railway.app/api/student/register`

❌ **Wrong:** `https://byupay.up.railway.app/api/students/register`  
✅ **Correct:** `https://byupay.up.railway.app/api/student/register`

❌ **Wrong:** `https://byupay.up.railway.app/api/admin/request`  
✅ **Correct:** `https://byupay.up.railway.app/api/admin/requests`

### Issue 3: Missing `/api/` Prefix

All backend routes require `/api/` prefix:

❌ **Wrong:** `/student/register`  
✅ **Correct:** `/api/student/register`

❌ **Wrong:** `/admin/requests`  
✅ **Correct:** `/api/admin/requests`

---

## 🔍 Quick Diagnostics

### Check if Frontend is Working:

```bash
curl -I https://byupay.vercel.app
# Should return: HTTP/1.1 200 OK
```

### Check if Backend is Working:

```bash
curl https://byupay.up.railway.app/api/health
# Should return: {"status":"OK","timestamp":"...","uptime":...}
```

### Check Specific Route:

```bash
# Replace {route} with the route you're trying
curl -I https://byupay.vercel.app/{route}
```

---

## 🛠️ Common Issues & Solutions

### Issue: "Cannot GET /api/..."

**Cause:** Frontend trying to access API route  
**Solution:** API routes are on backend (Railway), not frontend (Vercel)

**Correct URLs:**
- Frontend pages: `https://byupay.vercel.app/register`
- API endpoints: `https://byupay.up.railway.app/api/student/register`

### Issue: "Route not found" on API

**Check:**
1. Is `/api/` prefix included?
2. Is the route spelled correctly?
3. Is the HTTP method correct? (GET vs POST)
4. Is the backend running? (check health endpoint)

### Issue: 404 on Frontend Route

**Check:**
1. Route exists in App.jsx Routes
2. URL is spelled correctly
3. Using correct case (routes are case-sensitive)

---

## 📋 Quick Reference Card

```
┌─────────────────────────────────────────────┐
│  FRONTEND (Vercel)                          │
├─────────────────────────────────────────────┤
│  Home:       /                              │
│  Register:   /register                      │
│  Request:    /request                       │
│  Dashboard:  /dashboard                     │
│  FAQ:        /faq                           │
│  Contact:    /contact                       │
│  Admin:      /admin                         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  BACKEND API (Railway)                      │
├─────────────────────────────────────────────┤
│  Health:     GET  /api/health               │
│  Register:   POST /api/student/register     │
│  Request:    POST /api/student/request-card │
│  Hubtel:     POST /api/student/initiate-... │
│  Verify:     POST /api/student/verify-...   │
│  Dashboard:  GET  /api/student/dashboard/:id│
│  Admin:      GET  /api/admin/requests       │
└─────────────────────────────────────────────┘
```

---

## 🎯 What Route Are You Looking For?

**Tell me what you're trying to do:**

1. **View the app?**  
   → https://byupay.vercel.app

2. **Register a student?**  
   → https://byupay.vercel.app/register

3. **Request a card?**  
   → https://byupay.vercel.app/request

4. **View dashboard?**  
   → https://byupay.vercel.app/dashboard

5. **Access admin panel?**  
   → https://byupay.vercel.app/admin

6. **Test API?**  
   → https://byupay.up.railway.app/api/health

---

**All routes are working! ✅**

If you're still getting "Route not found", please share:
- The exact URL you're trying to access
- What page/action you're trying to reach
- Any error message you see


