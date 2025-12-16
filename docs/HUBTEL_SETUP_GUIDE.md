# 🚀 Hubtel Payment Setup Guide - Step by Step

## ✅ Quick Setup Checklist

Follow these steps to get Hubtel payments working:

---

## Step 1: Get Your Hubtel Credentials

You already have these credentials:
- **Client ID (API ID):** `GR69OD8`
- **Client Secret (API Key):** `04abf4cbb3c041839c1c3af89c3ebea2`

**If you need to verify or get new ones:**
1. Log in to Hubtel Dashboard: https://hubtel.com
2. Go to **Settings** → **API Credentials**
3. Copy your **Client ID** and **Client Secret**

---

## Step 2: Set Environment Variables

### For Local Development (.env file):

Add these to your `backend/.env` file:

```env
# Hubtel Online Checkout Configuration
HUBTEL_API_ID=GR69OD8
HUBTEL_API_KEY=04abf4cbb3c041839c1c3af89c3ebea2
HUBTEL_CHECKOUT_URL=https://payproxyapi.hubtel.com/items/initiate

# Your Application URLs
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Hubtel Callback URLs (auto-generated, but you can override)
HUBTEL_CALLBACK_URL=http://localhost:3000/api/student/hubtel-callback
HUBTEL_RETURN_URL=http://localhost:5173/request?payment=success
```

### For Production (Railway):

1. Go to **Railway Dashboard** → Your backend service
2. Click **Variables** tab
3. Click **+ New Variable** and add each one:

**Variable 1:**
```
Name: HUBTEL_API_ID
Value: GR69OD8
```

**Variable 2:**
```
Name: HUBTEL_API_KEY
Value: 04abf4cbb3c041839c1c3af89c3ebea2
```

**Variable 3:**
```
Name: HUBTEL_CHECKOUT_URL
Value: https://payproxyapi.hubtel.com/items/initiate
```

**Variable 4:**
```
Name: BACKEND_URL
Value: https://byupay.up.railway.app
```
*(Replace with your actual Railway backend URL)*

**Variable 5:**
```
Name: FRONTEND_URL
Value: https://byupay.vercel.app
```
*(Replace with your actual frontend URL)*

**Variable 6 (Optional - auto-generated if not set):**
```
Name: HUBTEL_CALLBACK_URL
Value: https://byupay.up.railway.app/api/student/hubtel-callback
```

**Variable 7 (Optional - auto-generated if not set):**
```
Name: HUBTEL_RETURN_URL
Value: https://byupay.vercel.app/request?payment=success
```

---

## Step 3: Verify Hubtel Account Status

**Important:** Your Hubtel account needs to be activated for Online Checkout.

### Check Account Status:

1. **Log in to Hubtel Dashboard:** https://hubtel.com
2. Go to **Settings** → **Account Status**
3. Verify your account is **Active** and **Verified**

### If Account is Not Activated:

**Contact Hubtel Support:**
- **Email:** support@hubtel.com
- **Phone:** +233 30 281 0808
- **Subject:** Account Activation Request - Online Checkout

**Email Template:**
```
Hi Hubtel Support,

I need to activate my Hubtel Online Checkout API for my business.

Account Details:
- Client ID: GR69OD8
- Business Name: [Your Business Name]
- Use Case: Online payment processing for virtual card system

Please:
1. Activate my Online Checkout API access
2. Confirm my account is ready for production use
3. Provide any additional setup steps needed

Thank you!
```

---

## Step 4: Test the Integration

### Local Testing:

1. **Start your backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start your frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test the flow:**
   - Visit: http://localhost:5173/request
   - Enter an amount (e.g., $10)
   - Click "Proceed to Payment"
   - Select "Mobile Money (Hubtel)"
   - Click "Proceed to Hubtel Checkout"
   - You should be redirected to Hubtel's payment page

### Production Testing:

1. **Deploy to Railway:**
   - After adding environment variables, Railway will auto-deploy
   - Wait 60-90 seconds for deployment

2. **Test the flow:**
   - Visit your frontend URL: https://byupay.vercel.app/request
   - Enter an amount
   - Click "Proceed to Payment"
   - Select "Mobile Money (Hubtel)"
   - Click "Proceed to Hubtel Checkout"
   - You should be redirected to Hubtel's payment page

---

## Step 5: Verify Callback is Working

After a test payment:

1. **Check Railway Logs:**
   - Go to Railway Dashboard → Your service → **Deployments** → **View Logs**
   - Look for: `📥 Hubtel callback received (POST):`
   - Should show payment details

2. **Check Database:**
   - Payment status should update to `paid`
   - `paymentVerifiedAt` should be set

3. **Check Admin Dashboard:**
   - Payment should appear as verified
   - Admin should receive email notification

---

## 🔧 Troubleshooting

### Issue: "Hubtel credentials not configured"

**Solution:**
- Check that `HUBTEL_API_ID` and `HUBTEL_API_KEY` are set in environment variables
- Restart your backend server after adding variables

### Issue: "Failed to create checkout" or "401 Unauthorized"

**Solution:**
- Verify your Client ID and Client Secret are correct
- Check that your Hubtel account is activated
- Contact Hubtel support if credentials are correct but still failing

### Issue: "Payment not verified after completion"

**Solution:**
- Check that `HUBTEL_CALLBACK_URL` is correct and accessible
- Verify Railway backend is running and accessible
- Check Railway logs for callback errors
- Ensure callback endpoint is: `/api/student/hubtel-callback`

### Issue: "Redirect not working"

**Solution:**
- Check that `FRONTEND_URL` is set correctly
- Verify `HUBTEL_RETURN_URL` is correct
- Test that your frontend URL is accessible

---

## 📞 Need Help?

### Hubtel Support:
- **Email:** support@hubtel.com
- **Phone:** +233 30 281 0808
- **Hours:** Monday - Friday, 8:00 AM - 5:00 PM GMT

### Check Your Setup:
1. ✅ Environment variables are set
2. ✅ Hubtel account is activated
3. ✅ Backend is running and accessible
4. ✅ Callback URL is correct
5. ✅ Test payment flow works

---

## 🎉 Success Indicators

You'll know it's working when:

✅ Clicking "Proceed to Hubtel Checkout" redirects to Hubtel payment page  
✅ After payment, you're redirected back to your app  
✅ Payment status updates to "paid" automatically  
✅ Admin receives email notification  
✅ Payment appears in admin dashboard  

---

## 📝 Next Steps After Setup

1. **Test with small amounts first**
2. **Monitor Railway logs for any errors**
3. **Test with different networks (MTN, Vodafone, AirtelTigo)**
4. **Verify email notifications are working**
5. **Check admin dashboard shows payments correctly**

---

**You're all set! 🚀**

