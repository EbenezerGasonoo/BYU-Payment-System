# 🚀 Hubtel Quick Setup - Copy & Paste Ready!

## ✅ Your Production URLs:
- **Frontend:** https://byupay.vercel.app
- **Backend:** https://byupay.up.railway.app

---

## 📋 Step 1: Add to Railway (Production)

Go to: **Railway Dashboard** → Your backend service → **Variables** → **+ New Variable**

Copy and paste these **7 variables**:

### Variable 1:
```
Name: HUBTEL_API_ID
Value: GR69OD8
```

### Variable 2:
```
Name: HUBTEL_API_KEY
Value: 04abf4cbb3c041839c1c3af89c3ebea2
```

### Variable 3:
```
Name: HUBTEL_CHECKOUT_URL
Value: https://payproxyapi.hubtel.com/items/initiate
```

### Variable 4:
```
Name: BACKEND_URL
Value: https://byupay.up.railway.app
```

### Variable 5:
```
Name: FRONTEND_URL
Value: https://byupay.vercel.app
```

### Variable 6 (Optional - auto-generated if not set):
```
Name: HUBTEL_CALLBACK_URL
Value: https://byupay.up.railway.app/api/student/hubtel-callback
```

### Variable 7 (Optional - auto-generated if not set):
```
Name: HUBTEL_RETURN_URL
Value: https://byupay.vercel.app/request?payment=success
```

---

## 📋 Step 2: Add to Local .env (Development)

Add these to your `backend/.env` file:

```env
HUBTEL_API_ID=GR69OD8
HUBTEL_API_KEY=04abf4cbb3c041839c1c3af89c3ebea2
HUBTEL_CHECKOUT_URL=https://payproxyapi.hubtel.com/items/initiate
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

---

## ✅ Step 3: Verify Hubtel Account

1. **Log in to Hubtel:** https://hubtel.com
2. **Check account status** - Should be **Active**
3. **If not active**, email: support@hubtel.com

---

## 🧪 Step 4: Test It!

1. **Deploy on Railway** (auto-deploys after adding variables)
2. **Wait 60-90 seconds**
3. **Visit:** https://byupay.vercel.app/request
4. **Enter amount** → Click "Proceed to Payment"
5. **Select "Mobile Money (Hubtel)"**
6. **Click "Proceed to Hubtel Checkout"**
7. **Should redirect to Hubtel payment page!** ✅

---

## 🔧 Troubleshooting

**"Hubtel credentials not configured"**
→ Check variables are set in Railway

**"Failed to create checkout"**
→ Verify Hubtel account is activated

**"Payment not verified"**
→ Check Railway logs for callback errors

---

## 📞 Need Help?

**Hubtel Support:** support@hubtel.com | +233 30 281 0808

**Full Guide:** See `docs/HUBTEL_SETUP_GUIDE.md`

---

**That's it! You're ready to go! 🎉**

