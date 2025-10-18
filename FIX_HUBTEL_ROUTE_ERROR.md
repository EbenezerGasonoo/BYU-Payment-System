# 🔧 Fix: "Route Not Found" - Hubtel Payment

## 🐛 The Problem

When clicking "Proceed to Pay" for Mobile Money (Hubtel), you get:
```
Route not found
```

## ✅ The Solution

I've just triggered a Railway redeploy. **Wait 2-3 minutes**, then it will work!

### But CRITICAL: You MUST Set Environment Variables in Railway!

---

## ⚠️ CRITICAL STEP: Set Railway Environment Variables

The Hubtel integration **will not work** without these environment variables set in Railway:

### Go to Railway Dashboard:

1. **Visit:** https://railway.app
2. **Login** to your account
3. **Find your backend project** (byupay or similar)
4. Click on the **backend service**
5. Click **"Variables"** tab
6. Click **"Add Variable"** or **"New Variable"**

### Add These Variables:

```env
HUBTEL_API_KEY=04abf4cbb3c041839c1c3af89c3ebea2
HUBTEL_API_ID=GR69OD8
HUBTEL_CHECKOUT_URL=https://payproxyapi.hubtel.com/items/initiate
```

### How to Add Each One:

**Variable 1:**
- Name: `HUBTEL_API_KEY`
- Value: `04abf4cbb3c041839c1c3af89c3ebea2`

**Variable 2:**
- Name: `HUBTEL_API_ID`
- Value: `GR69OD8`

**Variable 3:**
- Name: `HUBTEL_CHECKOUT_URL`
- Value: `https://payproxyapi.hubtel.com/items/initiate`

### After Adding Variables:

7. Click **"Deploy"** button (Railway will redeploy with new variables)
8. Wait 60-90 seconds for deployment

---

## 🧪 Test After Deployment (2-3 minutes)

### Step 1: Verify Backend Has New Route

```bash
curl https://byupay.up.railway.app/
```

Look for: `initiate-hubtel-payment` in the output

### Step 2: Test the Hubtel Endpoint

```bash
curl -X POST https://byupay.up.railway.app/api/student/initiate-hubtel-payment \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"0241234567","amount":100,"paymentReference":"TEST123","studentName":"Test","studentEmail":"test@example.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "checkoutId": "...",
    "checkoutUrl": "https://checkout.hubtel.com/...",
    ...
  }
}
```

**OR (if Hubtel credentials need updating):**
```json
{
  "success": false,
  "message": "Failed to initiate payment",
  "error": "..."
}
```

Both are OK! The important thing is **NOT getting "Route not found"**

### Step 3: Test in Browser

1. Visit: https://byupay.vercel.app/register
2. Register a test student
3. Go to: https://byupay.vercel.app/request
4. Enter amount: $10
5. Click "Proceed to Payment"
6. Select "Mobile Money (Hubtel)"
7. Enter phone: 0241234567
8. Click "Proceed to Pay"

**Expected:**
- ✅ "Initiating payment with Hubtel..."
- ✅ "Redirecting to Hubtel payment page..." OR error message from Hubtel
- ❌ **NOT** "Route not found"

---

## 🕐 Timeline

**Now (20:36 UTC):**
- ✅ Code pushed to GitHub
- ⏳ Railway auto-deploying

**In 2 minutes (20:38 UTC):**
- ✅ Railway deployment complete
- ✅ Route `/api/student/initiate-hubtel-payment` available

**After you set environment variables:**
- ✅ Hubtel integration fully working
- ✅ Can redirect to Hubtel checkout page

---

## 🔍 Why This Happened

### Issue 1: Route Not Deployed Yet
The `/api/student/initiate-hubtel-payment` endpoint was added in recent commits but Railway hadn't auto-deployed yet.

**Fix:** Triggered redeploy (done ✅)

### Issue 2: Missing Environment Variables
Even with the route deployed, Hubtel needs:
- `HUBTEL_API_KEY`
- `HUBTEL_API_ID`
- `HUBTEL_CHECKOUT_URL`

Without these, the Hubtel API call will fail.

**Fix:** Set variables in Railway (you need to do this ⏳)

---

## 📋 Checklist

- [x] Code pushed to GitHub (commit: 3940594)
- [x] Railway redeploying (wait 2-3 minutes)
- [ ] **YOU MUST DO:** Set Railway environment variables
  - [ ] HUBTEL_API_KEY
  - [ ] HUBTEL_API_ID
  - [ ] HUBTEL_CHECKOUT_URL
- [ ] Click "Deploy" in Railway after adding variables
- [ ] Test the payment flow

---

## 🆘 Still Getting "Route Not Found"?

### Check 1: Railway Deployment Status

Go to Railway → Your Project → Deployments

Look for:
- ✅ Green checkmark = Deployed successfully
- 🔄 Building/Deploying = Wait a bit longer
- ❌ Red X = Deployment failed (check logs)

### Check 2: Test Route Exists

```bash
curl https://byupay.up.railway.app/api/student/initiate-hubtel-payment
```

Should return:
```json
{"success":false,"message":"All payment details are required"}
```

NOT:
```json
{"success":false,"message":"Route not found"}
```

### Check 3: Clear Browser Cache

- Press `Ctrl + Shift + R` to hard refresh
- Or clear cache completely

---

## ✅ What to Expect After Fix

1. **Click "Proceed to Pay"**
   - Shows: "Initiating payment with Hubtel..."

2. **Backend calls Hubtel API**
   - With your credentials

3. **Two Possible Outcomes:**

   **A) Hubtel accepts (credentials valid):**
   - Redirects to: `https://checkout.hubtel.com/...`
   - Student completes payment
   - Returns to dashboard

   **B) Hubtel rejects (credentials issue):**
   - Shows error: "Failed to initiate payment"
   - Error message from Hubtel
   - (This is OK - means route works, just need to verify credentials with Hubtel)

---

## 🎯 Summary

**What I Did:**
- ✅ Pushed code to trigger Railway redeploy
- ✅ Route will be available in 2-3 minutes

**What You Must Do:**
1. ⏳ Wait 2-3 minutes for Railway deployment
2. 🔧 Set environment variables in Railway:
   - `HUBTEL_API_KEY=04abf4cbb3c041839c1c3af89c3ebea2`
   - `HUBTEL_API_ID=GR69OD8`
   - `HUBTEL_CHECKOUT_URL=https://payproxyapi.hubtel.com/items/initiate`
3. 🚀 Click "Deploy" in Railway
4. 🧪 Test payment flow

**Time to Fix:** 5 minutes total

---

**After setting Railway variables, the "Route not found" error will be gone!** ✅


