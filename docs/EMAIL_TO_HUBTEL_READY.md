# 📧 COPY & PASTE Email to Hubtel - Ready to Send!

## 🎯 Your Railway Server IP Address

**Public IP (Outbound):** `208.77.244.86`

This is the IP address Railway uses when your backend calls Hubtel API.

---

## ✉️ EMAIL TO SEND NOW

**Copy everything below and send to Hubtel:**

---

**To:** support@hubtel.com  
**Subject:** IP Whitelisting Request - Direct Debit API - POS Sales ID: 2030303

---

Hi Hubtel Support Team,

I need to whitelist my server IP address for Hubtel Direct Debit API access.

**ACCOUNT DETAILS:**
- POS Sales ID: **2030303**
- Client ID (API ID): **GR69OD8**
- Client Secret: 04abf4cbb3c041839c1c3af89c3ebea2
- Business Name: Tema - POS Sales
- Account Created: May 22, 2025

**SERVER DETAILS:**
- Backend URL: https://byupay.up.railway.app
- Hosting Platform: Railway.app (cloud hosting)
- Server Public IP: **208.77.244.86**

**REQUEST:**

1. **Please whitelist this IP address for Direct Debit API:**
   - IP: **208.77.244.86**
   - Purpose: Making Direct Debit Charge API calls
   - Endpoint: https://rmp.hubtel.com/merchantaccount/merchants/2030303/receive/mobilemoney

2. **Enable "mobilemoney-receive-direct" scope** (if not already enabled)

3. **Confirm my account is fully activated** for Direct Debit API

**CURRENT ISSUE:**
Getting **403 Forbidden** error when calling Direct Debit Charge endpoint. Test confirms:
- ✅ Credentials are valid
- ✅ POS Sales ID is correct
- ✅ Endpoint URL is correct
- ❌ IP not whitelisted (causing 403)

**QUESTIONS:**

1. Since I'm using Railway cloud hosting (dynamic IPs), should I:
   - Whitelist just this one IP: 208.77.244.86?
   - Whitelist a range of IPs?
   - What happens if Railway changes my IP?

2. What is the typical timeline for IP whitelisting activation?

3. Are there any other account settings I need to configure for Direct Debit?

4. Do I need to complete a preapproval process before using Direct Debit Charge?

**INTEGRATION DETAILS:**
- Using: Hubtel Direct Debit Charge API
- Available Channels: mtn-gh-direct-debit, vodafone-gh-direct-debit
- Callback URL: https://byupay.up.railway.app/api/student/hubtel-callback
- Application: BYU Pathway Ghana Virtual Card Payment System

Thank you for your assistance! Looking forward to getting this activated.

Best regards,
[Your Name]
[Your Contact Number]

---

**END OF EMAIL**

---

## ✅ After Sending Email

**What to Expect:**

1. **Hubtel Response:** Within 24-48 hours
2. **Questions:** They may ask for:
   - Business verification
   - Use case explanation
   - Additional documentation
3. **Whitelisting:** 1-2 business days after approval
4. **Confirmation:** Email when IP is whitelisted

**Then:**

1. **Test:** Run `node backend/test-hubtel-direct-debit.js`
2. **Should See:** ✅ Success! (not 403)
3. **Try Payment:** https://byupay.vercel.app/request
4. **Works!** 🎉

---

## 🔍 How to Verify IP Was Whitelisted

**Test Command:**
```bash
cd backend
node test-hubtel-direct-debit.js
```

**Before Whitelisting:**
```
❌ HTTP Status: 403 Forbidden
🚫 ERROR: IP address not whitelisted
```

**After Whitelisting:**
```
✅ SUCCESS! Hubtel Direct Debit is working!
Response Code: 0000 or 0001
Message: Transaction pending...
```

---

## 📞 Hubtel Contact Info

**Email:** support@hubtel.com  
**Phone:** +233 30 281 0808  
**Hours:** Monday-Friday, 8am-5pm GMT  

**What to say if you call:**
> "Hi, I sent an email about IP whitelisting for POS Sales ID 2030303.  
> I need my server IP 208.77.244.86 whitelisted for Direct Debit API.  
> Can you help expedite this?"

---

## 🚀 Summary

**Your Railway IP:** 208.77.244.86  
**What to Do:** Copy email above and send to support@hubtel.com  
**Timeline:** 1-2 business days  
**Then:** Hubtel payment will work!  

**Ready to send the email?** ✅


