# 🔧 Hubtel Direct Debit API - Complete Setup Guide

## 📚 Based On Official Documentation

Source: Hubtel Direct Debit Money API Documentation

---

## ⚠️ IMPORTANT REQUIREMENTS

Before using Hubtel Direct Debit, you MUST have:

### 1. **POS Sales ID** (Required!)
   - This is different from your API ID (GR69OD8)
   - Find it in Hubtel Dashboard
   - Needed for all Direct Debit API endpoints

### 2. **IP Whitelisting** (Mandatory!)
   - Share Railway's public IP with your Retail System Engineer
   - Maximum 4 IPs allowed
   - Without this: **403 Forbidden** or timeout errors

### 3. **Direct Debit Scope Enabled**
   - Contact Retail Systems Engineer
   - Request "mobilemoney-receive-direct" scope
   - Without this: **4101 error**

---

## 🎯 How Hubtel Direct Debit Works

### Two-Step Process:

**Step 1: Preapproval (One-time per customer)**
- Customer authorizes your merchant account
- Done once per phone number
- Customer gets USSD prompt or OTP
- Customer approves

**Step 2: Direct Debit Charge**
- You can debit customer without PIN
- Customer receives SMS notification
- No approval needed (already preapproved)

---

## 🔑 What You Need from Hubtel

### Contact Your Retail Systems Engineer:

**Email:** Your assigned engineer OR support@hubtel.com  
**Phone:** +233 30 281 0808

**Request:**
```
Hi,

I need to set up Hubtel Direct Debit API for my business.

Current Details:
- Client ID: GR69OD8
- Client Secret: 04abf4cbb3c041839c1c3af89c3ebea2

Please provide:
1. My POS Sales ID
2. Whitelist this IP: {Railway IP}
3. Enable "mobilemoney-receive-direct" scope on my account
4. Confirm available channels (mtn-gh-direct-debit, vodafone-gh-direct-debit)

Thank you!
```

---

## 📋 Implementation Steps

### Once You Have POS Sales ID:

**1. Update Environment Variables:**
```env
HUBTEL_POS_SALES_ID=your_pos_sales_id_here
HUBTEL_PREAPPROVAL_URL=https://preapproval.hubtel.com/api/v2
HUBTEL_CHARGE_URL=https://rmp.hubtel.com/merchantaccount
HUBTEL_STATUS_URL=https://api-txnstatus.hubtel.com
```

**2. Implement Preapproval Flow:**
```javascript
// First time customer pays
POST https://preapproval.hubtel.com/api/v2/merchant/{POS_ID}/preapproval/initiate
{
  clientReferenceId: "unique_ref",
  customerMsisdn: "233543692272",
  channel: "mtn-gh-direct-debit",
  callbackUrl: "https://byupay.up.railway.app/api/hubtel-preapproval-callback"
}

// Customer receives USSD prompt
// Customer approves on phone
// Hubtel sends callback: PreapprovalStatus: "APPROVED"
// Store: customer is preapproved
```

**3. Implement Direct Debit Charge:**
```javascript
// For subsequent payments (after preapproval)
POST https://rmp.hubtel.com/merchantaccount/merchants/{POS_ID}/receive/mobilemoney
{
  CustomerName: "Student Name",
  CustomerMsisdn: "233543692272",
  Channel: "mtn-gh-direct-debit",
  Amount: 11.45,
  PrimaryCallbackUrl: "https://byupay.up.railway.app/api/hubtel-charge-callback",
  Description: "BYU Virtual Card Payment",
  ClientReference: "BYU-123..."
}

// Money debited automatically (no PIN needed!)
// Hubtel sends callback with status
```

---

## 🎯 Benefits of Direct Debit

✅ **No PIN entry** - After preapproval, automatic debit  
✅ **Faster payments** - No customer action needed  
✅ **Better for subscriptions** - Perfect for recurring payments  
✅ **Multiple networks** - MTN and Telecel (Vodafone)  

---

## ⚠️ Current Limitation

**You're currently using:** Online Checkout API  
**Requires:** Redirect to Hubtel checkout page

**To Use Direct Debit:**
1. Get POS Sales ID from Hubtel
2. Get IP whitelisted
3. Enable Direct Debit scope
4. Implement preapproval flow
5. Then can use direct debit

---

## 💡 Recommended Approach

### Phase 1: NOW (Use Online Checkout)

Keep current implementation:
- Uses Online Checkout API
- Redirects to Hubtel page
- Works with current credentials
- **No POS Sales ID needed**
- **No IP whitelisting needed**

### Phase 2: LATER (Add Direct Debit)

After getting from Hubtel:
- POS Sales ID
- IP whitelisting
- Direct Debit scope enabled

Then implement:
- Preapproval flow
- Direct debit charge
- Better customer experience

---

## 🚀 What's Deployed Now

✅ **Hubtel Online Checkout** - Ready to use (needs account activation)  
✅ **MTN MoMo API** - Hidden but code ready  
✅ **Payment flow** - Fixed paymentReference issue  
✅ **Database** - Fixed validation errors  
✅ **Clean UI** - Only Hubtel shown  

---

## 📞 Next Steps

### Immediate:

1. **Set Railway Variables:**
   ```env
   HUBTEL_API_KEY=04abf4cbb3c041839c1c3af89c3ebea2
   HUBTEL_API_ID=GR69OD8
   HUBTEL_CHECKOUT_URL=https://payproxyapi.hubtel.com/items/initiate
   ```

2. **Contact Hubtel Support:**
   - Request Online Checkout activation (for now)
   - Ask about Direct Debit setup (for future)
   - Get your POS Sales ID

### Future (When Ready for Direct Debit):

1. Get POS Sales ID
2. Get IP whitelisted
3. Enable Direct Debit scope
4. Update implementation
5. Better payment experience!

---

**For now, focus on getting Online Checkout working, then upgrade to Direct Debit later!** ✅


