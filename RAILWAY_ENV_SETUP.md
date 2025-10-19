# ⚙️ Railway Environment Variables - Copy & Paste Ready!

## 🎯 Add These to Railway NOW

Go to: **Railway Dashboard** → Your backend service → **Variables** → **Add Variable**

---

## 📋 MTN MoMo API Variables (COPY THESE):

### Variable 1:
```
Name:  MTN_MOMO_BASE_URL
Value: https://sandbox.momodeveloper.mtn.com
```

### Variable 2:
```
Name:  MTN_COLLECTION_SUBSCRIPTION_KEY
Value: b1bb50190a02409db2a5053f963538c8
```

### Variable 3:
```
Name:  MTN_API_USER
Value: b96a618b-f5ac-44fc-931c-767c26bf312c
```

### Variable 4:
```
Name:  MTN_API_KEY
Value: 47afe21dfa8e49a992c689b4e97541c3
```

### Variable 5:
```
Name:  MTN_TARGET_ENVIRONMENT
Value: sandbox
```

---

## 📋 Hubtel Variables (OPTIONAL - Add Later):

### Variable 6:
```
Name:  HUBTEL_API_KEY
Value: 04abf4cbb3c041839c1c3af89c3ebea2
```

### Variable 7:
```
Name:  HUBTEL_API_ID
Value: GR69OD8
```

### Variable 8:
```
Name:  HUBTEL_CHECKOUT_URL
Value: https://payproxyapi.hubtel.com/items/initiate
```

---

## ✅ After Adding Variables:

1. Click **"Deploy"** in Railway
2. Wait **60-90 seconds** for deployment
3. **Test the payment flow!**

---

## 🧪 Test Commands

### Test with Sandbox Number (Auto-Approves):

1. Visit: https://byupay.vercel.app/register
2. Register with any details
3. Go to: https://byupay.vercel.app/request
4. Enter amount: $1
5. Click "Proceed to Payment"
6. Select "MTN Mobile Money Direct"
7. Enter phone: `46733123454` (sandbox number)
8. Click "Proceed to Pay"

**Expected:**
```
✅ Payment prompt sent to 46733123454!
🔄 Checking payment status...
✅ Payment verified successfully!
```

### Test Backend Directly:

```bash
curl -X POST https://byupay.up.railway.app/api/student/initiate-mtn-payment \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "46733123454",
    "amount": 10,
    "paymentReference": "TEST123",
    "description": "Test Payment"
  }'
```

**Should return:**
```json
{
  "success": true,
  "message": "Payment prompt sent to customer phone",
  "data": {
    "referenceId": "...",
    "status": "pending"
  }
}
```

---

## 🌍 Production Checklist

Before going live with real customers:

- [ ] Test in sandbox with all test numbers
- [ ] Verify auto-verification works
- [ ] Check admin dashboard shows payments
- [ ] Test payment failure handling
- [ ] Update to production endpoints:
  - [ ] `MTN_MOMO_BASE_URL=https://proxy.momoapi.mtn.com`
  - [ ] `MTN_TARGET_ENVIRONMENT=mtnghana`
- [ ] Test with real MTN Ghana numbers
- [ ] Verify real payments work
- [ ] Monitor Railway logs for errors

---

## 🎉 You're Ready!

**Copy the variables above to Railway and click Deploy!**

**In 2 minutes, your MTN MoMo payment will work!** 🚀


