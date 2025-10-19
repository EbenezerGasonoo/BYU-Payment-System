# 🌐 Hubtel IP Whitelisting - Complete Guide

## 🎯 Step-by-Step Process

### Step 1: Get Your Railway Server's IP Address

**Visit this URL in your browser:**
```
https://byupay.up.railway.app/api/my-ip
```

**You'll see something like:**
```json
{
  "success": true,
  "publicIP": "34.123.45.67",
  "requestIP": "::ffff:34.123.45.67",
  "timestamp": "2025-10-19T...",
  "message": "Use this IP for Hubtel whitelisting"
}
```

**📝 COPY the `publicIP` value** (e.g., `34.123.45.67`)

---

### Step 2: Email Hubtel Support

**Send this email NOW:**

```
To: support@hubtel.com
Subject: IP Whitelisting Request - Direct Debit API - POS Sales ID: 2030303

Hi Hubtel Support Team,

I need to whitelist my server IP for Hubtel Direct Debit API access.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACCOUNT DETAILS:
- POS Sales ID: 2030303
- Client ID (API ID): GR69OD8
- Business Name: Tema - POS Sales
- Date Created: May 22, 2025

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IP ADDRESS TO WHITELIST:
[PASTE YOUR IP FROM STEP 1 HERE]

Example: 34.123.45.67

Backend URL: https://byupay.up.railway.app
Hosting Platform: Railway.app (cloud hosting)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REQUEST:
1. Please whitelist the above IP address for Direct Debit API
2. Enable "mobilemoney-receive-direct" scope (if not already enabled)
3. Confirm my account is fully activated for Direct Debit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT ISSUE:
Getting 403 Forbidden when calling:
POST https://rmp.hubtel.com/merchantaccount/merchants/2030303/receive/mobilemoney

Test shows endpoint is correct and credentials are valid, just need IP whitelisting.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUESTIONS:
1. Since I'm using Railway (cloud hosting with dynamic IPs), should I:
   - Whitelist multiple IP addresses?
   - Get Railway's IP range?
   - Use a different approach?

2. What is the typical timeline for IP whitelisting?

3. Is there anything else I need to activate on my account?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for your assistance!

Best regards,
[Your Name]
```

---

### Step 3: Wait for Hubtel Response

**Expected Timeline:**
- **Response:** Within 24-48 hours
- **Whitelisting:** 1-2 business days
- **Total:** 2-3 business days

**What Hubtel Will Do:**
1. Verify your account and POS Sales ID
2. Add your IP to their whitelist
3. Confirm Direct Debit scope is enabled
4. Send confirmation email

---

### Step 4: Test After Whitelisting

Once Hubtel confirms IP is whitelisted:

**Test Command:**
```bash
cd backend
node test-hubtel-direct-debit.js
```

**Expected Result:**
```
✅ SUCCESS! Hubtel Direct Debit is working!
Response Code: 0000 or 0001
Message: Transaction pending...
```

**Then test in your app:**
```
Visit: https://byupay.vercel.app/request
Enter amount → Proceed to Payment
Enter phone → Proceed to Pay
✅ Should work!
```

---

## 🔧 Railway IP Considerations

### Important Notes:

**Railway IPs Can Change When:**
- You redeploy the service
- Railway scales your app
- Infrastructure maintenance

**Solutions:**

1. **Ask Hubtel for IP Range Whitelisting:**
   - Request to whitelist Railway's entire IP range
   - More stable solution

2. **Monitor IP Changes:**
   - Check `/api/my-ip` after each deployment
   - If IP changes, notify Hubtel

3. **Consider Static IP (if available):**
   - Check if Railway offers dedicated IPs
   - May cost extra but more reliable

---

## 📞 Contact Information

### Hubtel Support:
- **Email:** support@hubtel.com
- **Phone:** +233 30 281 0808
- **Hours:** Monday-Friday, 8am-5pm GMT
- **Response Time:** 24-48 hours

### Railway Support (for IP questions):
- **Email:** team@railway.app
- **Discord:** railway.app/discord
- **Ask:** "What's my service's public IP?"

---

## ✅ Checklist

**Before Emailing Hubtel:**
- [ ] Visit https://byupay.up.railway.app/api/my-ip
- [ ] Copy your public IP address
- [ ] Note: It might show multiple IPs

**Email to Hubtel:**
- [ ] Include POS Sales ID: 2030303
- [ ] Include Client ID: GR69OD8
- [ ] Include your IP address(es)
- [ ] Mention Railway cloud hosting
- [ ] Request Direct Debit scope confirmation

**After Hubtel Confirms:**
- [ ] Test with: `node test-hubtel-direct-debit.js`
- [ ] Should show success
- [ ] Test in app: https://byupay.vercel.app
- [ ] Verify payment works

---

## 🚀 Next Steps

**RIGHT NOW:**
1. Visit: https://byupay.up.railway.app/api/my-ip
2. Copy your IP address
3. Use email template above
4. Send to support@hubtel.com

**WAIT FOR:**
- Hubtel confirmation (1-2 days)
- IP whitelisting complete

**THEN:**
- Test payment flow
- ✅ Everything works!

---

**Do you want me to deploy the `/api/my-ip` endpoint now so you can get your IP address?**
