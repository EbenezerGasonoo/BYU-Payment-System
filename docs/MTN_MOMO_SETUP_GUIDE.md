# 🚀 MTN MoMo API Integration Setup Guide

## Overview

Integrate MTN Mobile Money API to send payment prompts directly to customer phones!

Based on: https://momodeveloper.mtn.com/api-documentation/use-cases

---

## ✨ What You Get

✅ **Direct phone prompt** - Customer receives MTN MoMo notification  
✅ **No manual verification** - Automatic payment status checking  
✅ **Stays in app** - No redirect needed  
✅ **Real-time updates** - Auto-polls payment status  
✅ **Better UX** - Seamless payment experience  

---

## 📋 Step-by-Step Setup

### Step 1: Register on MTN MoMo Developer Portal

1. **Visit:** https://momodeveloper.mtn.com
2. **Click** "Sign Up"
3. **Create Account** with your details
4. **Verify Email** (check inbox)
5. **Login** to the portal

### Step 2: Subscribe to Collection Product

1. **Go to:** "Products" page
2. **Find:** "Collection" product
3. **Click:** "Subscribe"
4. **Get:** Primary Subscription Key (save this!)

Example: `abc123def456ghi789jkl012mno345pqr678`

### Step 3: Create API User

Use the Provisioning API to create an API user:

```bash
# Replace {subscription_key} with your subscription key from Step 2
curl -X POST https://sandbox.momodeveloper.mtn.com/v1_0/apiuser \
  -H "X-Reference-Id: {generate_a_uuid}" \
  -H "Ocp-Apim-Subscription-Key: {your_subscription_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "providerCallbackHost": "byupay.up.railway.app"
  }'
```

**Generate UUID:** Use https://www.uuidgenerator.net/  
**Save the UUID** - this is your API User ID

### Step 4: Create API Key

```bash
# Replace {api_user_uuid} and {subscription_key}
curl -X POST https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/{api_user_uuid}/apikey \
  -H "Ocp-Apim-Subscription-Key: {your_subscription_key}"
```

**Response:** You'll get an API Key (save this!)

### Step 5: Add to Environment Variables

Add to `backend/.env`:

```env
# MTN MoMo API Configuration
MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
MTN_COLLECTION_SUBSCRIPTION_KEY=your_subscription_key_from_step_2
MTN_API_USER=your_api_user_uuid_from_step_3
MTN_API_KEY=your_api_key_from_step_4
MTN_TARGET_ENVIRONMENT=sandbox
```

### Step 6: Add to Railway

1. Go to Railway Dashboard
2. Your backend service → Variables
3. Add each variable:
   - `MTN_MOMO_BASE_URL`
   - `MTN_COLLECTION_SUBSCRIPTION_KEY`
   - `MTN_API_USER`
   - `MTN_API_KEY`
   - `MTN_TARGET_ENVIRONMENT`
4. Click "Deploy"

### Step 7: Test in Sandbox

Test with MTN sandbox phone numbers:

**Test Numbers:**
- Success: `46733123454` (auto-approves)
- Pending: `46733123450` (stays pending)
- Failed: `46733123456` (auto-fails)

### Step 8: Go to Production

Once testing works:

1. **Update environment variables:**
   ```env
   MTN_MOMO_BASE_URL=https://proxy.momoapi.mtn.com
   MTN_TARGET_ENVIRONMENT=mtnghana
   ```

2. **Use same subscription key and API credentials**

3. **Test with real Ghana MTN numbers**

---

## 🎯 How It Works

### Payment Flow:

**1. Customer Initiates Payment:**
```javascript
POST /api/student/initiate-mtn-payment
{
  phoneNumber: "0241234567",
  amount: 1627.50,
  paymentReference: "BYU-1698765432-E5F6G7H8"
}
```

**2. Backend Calls MTN MoMo API:**
```http
POST https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay
Authorization: Bearer {access_token}
X-Reference-Id: {uuid}
Ocp-Apim-Subscription-Key: {subscription_key}

{
  "amount": "1627.50",
  "currency": "GHS",
  "externalId": "BYU-1698765432-E5F6G7H8",
  "payer": {
    "partyIdType": "MSISDN",
    "partyId": "233241234567"
  },
  "payerMessage": "BYU Virtual Card Payment",
  "payeeNote": "Payment for BYU-1698765432-E5F6G7H8"
}
```

**3. MTN Sends Prompt to Customer Phone:**
```
📱 *Beep*

MTN Mobile Money
────────────────
Payment Request
From: BYU Pathway Ghana
Amount: GHS 1,627.50

[Approve] [Decline]
```

**4. Customer Approves with PIN**

**5. Frontend Polls Status:**
```javascript
// Every 5 seconds
POST /api/student/check-mtn-payment
{
  referenceId: "{uuid}",
  paymentReference: "BYU-..."
}
```

**6. Payment Verified:**
```
Status: SUCCESSFUL
✅ Auto-updates payment to "paid"
✅ Notifies admin
✅ Submits card request
```

---

## 📱 Customer Experience

### What Customer Sees:

**Step 1:**
```
Select: MTN Mobile Money Direct
Enter Phone: 0241234567
[Proceed to Pay] →
```

**Step 2:**
```
✅ Payment prompt sent to 0241234567!
Check your MTN phone NOW!

🔄 Checking payment status...
Waiting for you to approve on your phone
```

**Step 3 (On Phone):**
```
📱 Pop-up appears:

MTN Mobile Money Payment Request
Amount: GHS 1,627.50
From: BYU Pathway Ghana

Enter PIN: ****

[Confirm]
```

**Step 4:**
```
✅ Payment verified successfully!
Your card request has been submitted to admin.

[View Dashboard] →
```

---

## 🔧 Troubleshooting

### Issue: "Failed to get access token"

**Cause:** Wrong credentials or subscription key  
**Solution:**
1. Verify subscription key in MTN portal
2. Check API user and key are correct
3. Ensure subscription is active

### Issue: "Invalid subscription key"

**Cause:** Subscription key not active or wrong  
**Solution:**
1. Login to momodeveloper.mtn.com
2. Go to Profile → Subscriptions
3. Get Primary Key for Collection product
4. Update in .env

### Issue: "Payment prompt not received"

**Cause:** Phone number format or sandbox limitation  
**Solution:**
1. In sandbox, use test numbers (46733123454)
2. In production, ensure phone is 233XXXXXXXXX format
3. Customer must have MTN MoMo active

### Issue: "Payment stays pending"

**Cause:** Customer hasn't approved yet  
**Solution:**
1. Wait up to 2 minutes
2. Customer checks phone for prompt
3. Approve with PIN
4. System auto-verifies

---

## 📊 Environment Variables Summary

### Sandbox (Testing):

```env
MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
MTN_COLLECTION_SUBSCRIPTION_KEY=your_sandbox_subscription_key
MTN_API_USER=your_api_user_uuid
MTN_API_KEY=your_api_key
MTN_TARGET_ENVIRONMENT=sandbox
```

### Production (Live):

```env
MTN_MOMO_BASE_URL=https://proxy.momoapi.mtn.com
MTN_COLLECTION_SUBSCRIPTION_KEY=your_production_subscription_key  
MTN_API_USER=your_api_user_uuid
MTN_API_KEY=your_api_key
MTN_TARGET_ENVIRONMENT=mtnghana
```

---

## 🎉 Benefits

| Feature | Manual Method | MTN MoMo API ✅ |
|---------|--------------|----------------|
| Phone Prompt | No | Yes - Automatic |
| Verification | Manual by admin | Automatic |
| Payment Status | Unknown | Real-time |
| User Experience | Complex instructions | One-click approve |
| Admin Work | Manual verification | None - automated |
| Speed | Slow (manual) | Fast (automated) |

---

## ✅ Implementation Complete

I've already integrated:

✅ `mtnMomoService.js` - MTN API service  
✅ `/api/student/initiate-mtn-payment` - Request to Pay endpoint  
✅ `/api/student/check-mtn-payment` - Status check endpoint  
✅ Frontend polling - Auto-checks payment every 5 seconds  
✅ Auto-verification - Updates payment status automatically  
✅ Database fields - mtnReferenceId, mtnTransactionId  

### What You Need:

1. ⏱️ Register on https://momodeveloper.mtn.com
2. 🔑 Get subscription key
3. 🆔 Create API user and key
4. ⚙️ Add to Railway environment variables
5. 🧪 Test!

---

## 🚀 Quick Start (15 minutes)

1. **Register:** momodeveloper.mtn.com (5 min)
2. **Subscribe:** Collection product (2 min)
3. **Create API User:** Use curl commands above (5 min)
4. **Add to Railway:** Environment variables (2 min)
5. **Test:** Try payment! (1 min)

---

**Your MTN MoMo integration is ready!**  
**Just need to register and get your credentials!** 🎉

**Links:**
- MTN Developer Portal: https://momodeveloper.mtn.com
- API Documentation: https://momodeveloper.mtn.com/api-documentation
- Use Cases: https://momodeveloper.mtn.com/api-documentation/use-cases


