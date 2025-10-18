# 🔧 Hubtel "Failed to Initiate Payment" - Troubleshooting Guide

## 🎯 Issue: "Failed to initiate payment"

Good news: The route exists! (Progress from "Route not found")  
Issue: Hubtel API call is failing

---

## 🔍 Common Causes

### 1. **IP Whitelisting** (Most Common) ⚠️

Hubtel requires your server's IP address to be whitelisted!

**Solution:**
1. **Get Railway's IP Address:**
   - Railway uses dynamic IPs, but you can find current IP
   - Or contact Hubtel to whitelist Railway's IP range

2. **Contact Hubtel Support:**
   - Email: support@hubtel.com
   - Phone: +233 30 281 0808
   - Say: "Please whitelist my server IP for API access"
   - Provide: Your Client ID (GR69OD8)
   - They need: Railway's IP address

3. **Get Railway IP:**
   ```bash
   # Run this in Railway console or add to your app temporarily
   curl https://api.ipify.org
   ```

### 2. **API Credentials** 

**Check:**
- Client ID: `GR69OD8`
- Client Secret: `04abf4cbb3c041839c1c3af89c3ebea2`

**Verify:**
1. Login to Hubtel Dashboard: https://app.hubtel.com
2. Go to Settings → API Keys
3. Confirm your credentials match

### 3. **Wrong API Endpoint**

**Current endpoint:**
```
https://api.hubtel.com/v1/merchantaccount/merchants/GR69OD8/receive/mobilemoney
```

**Alternative endpoints to try:**
```
https://api.hubtel.com/v2/merchantaccount/merchants/GR69OD8/receive/mobilemoney
```

OR

```
https://payproxyapi.hubtel.com/request-money/{phoneNumber}
```

### 4. **Account Not Activated**

Your Hubtel merchant account might not be fully activated for Direct Debit.

**Check:**
1. Login to Hubtel Dashboard
2. Check account status
3. Verify "Receive Money" is enabled

---

## 🧪 Quick Test

### Test 1: Check if Route Exists

```bash
curl -X POST https://byupay.up.railway.app/api/student/initiate-hubtel-payment \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"0241234567","amount":100,"paymentReference":"TEST","studentName":"Test","studentEmail":"test@example.com"}'
```

**Expected:**
- ✅ If you get JSON response (even with error) = Route exists
- ❌ If you get "Route not found" = Route doesn't exist (wait for deployment)

### Test 2: Check Railway Logs

1. Go to: https://railway.app
2. Find your backend project
3. Click "View Logs"
4. Look for:
   ```
   🚀 Initiating Hubtel Direct Debit...
   ❌ Hubtel Direct Debit error: ...
   ```

The error message will tell you exactly what's wrong!

---

## 💡 Solutions by Error Message

### Error: "401 Unauthorized"

**Cause:** Wrong credentials or not authenticated  
**Solution:**
1. Check HUBTEL_API_KEY and HUBTEL_API_ID in Railway
2. Verify credentials in Hubtel dashboard
3. Regenerate API keys if needed

### Error: "403 Forbidden"

**Cause:** IP not whitelisted  
**Solution:**
1. Contact Hubtel support
2. Provide Railway's IP address
3. Request whitelisting

### Error: "404 Not Found"

**Cause:** Wrong endpoint URL  
**Solution:**
1. Verify the correct API endpoint in Hubtel docs
2. Try alternative endpoints (v1 vs v2)

### Error: "Invalid merchant account"

**Cause:** Client ID doesn't match merchant account  
**Solution:**
1. Verify GR69OD8 is correct
2. Check Hubtel dashboard for correct merchant ID

### Error: "Service not enabled"

**Cause:** Direct Debit not activated on your account  
**Solution:**
1. Contact Hubtel support
2. Request "Receive Money" / "Direct Debit" activation

---

## 🔧 Alternative: Use Test Credentials

If you want to test immediately while waiting for IP whitelisting:

### Option 1: Hubtel Sandbox/Test Mode

Ask Hubtel if they have test credentials that don't require IP whitelisting.

### Option 2: Temporarily Use MTN Direct Only

While Hubtel is being set up, disable "Mobile Money (Hubtel)" and only use "MTN Mobile Money Direct" which doesn't need Hubtel API.

**To disable Hubtel option temporarily:**

```javascript
// frontend/src/components/HubtelPayment.jsx
const paymentMethods = [
  // Temporarily comment out Hubtel
  // { id: 'momo-hubtel', name: 'Mobile Money (Hubtel)', ... },
  { id: 'momo-direct', name: 'MTN Mobile Money Direct', ... }
];
```

---

## 📋 Checklist

- [ ] Route exists (check: `curl https://byupay.up.railway.app/api/student/initiate-hubtel-payment`)
- [ ] Railway environment variables set:
  - [ ] HUBTEL_API_KEY
  - [ ] HUBTEL_API_ID
  - [ ] HUBTEL_API_BASE
- [ ] Hubtel credentials correct (check dashboard)
- [ ] IP address whitelisted with Hubtel
- [ ] Account activated for "Receive Money"
- [ ] Check Railway logs for exact error

---

## 🆘 Next Steps

### Immediate Action:

1. **Check Railway Logs** (most important!)
   - Go to Railway dashboard
   - View logs
   - Find the exact Hubtel error message

2. **Share the Error with Me:**
   - What exact error do you see in Railway logs?
   - Copy the full error message

3. **Contact Hubtel Support:**
   - Email: support@hubtel.com
   - Mention: "Need IP whitelisting for Direct Debit API"
   - Provide: Client ID (GR69OD8)

### While Waiting:

Use **MTN Mobile Money Direct** method which works without API calls!

---

## 📞 Hubtel Contact

**Support:**
- Email: support@hubtel.com
- Phone: +233 30 281 0808
- Hours: Mon-Fri, 8am-5pm GMT

**What to Say:**
> "Hi, I'm integrating the Direct Debit Money API. My Client ID is GR69OD8. I need:
> 1. My server IP whitelisted (Railway hosting)
> 2. Confirmation that Direct Debit is enabled on my account
> 3. The correct API endpoint for receiving mobile money payments"

---

## ✅ Once Fixed

After Hubtel confirms whitelisting and activation:

1. **Test again:**
   - Visit: https://byupay.vercel.app/request
   - Try payment with Hubtel option

2. **Check logs:**
   - Should see: "✅ Hubtel Direct Debit response"
   - Not: "❌ Hubtel Direct Debit error"

3. **Customer experience:**
   - Click "Proceed to Pay"
   - "Payment prompt sent to phone"
   - Customer receives MoMo notification
   - Approve with PIN
   - ✅ Success!

---

**Most likely issue: IP whitelisting. Contact Hubtel support!**


