# 🔑 Get Your MTN MoMo API Credentials

## ✅ What You Have:

```
Subscription: Collections
Primary Key: b1bb50190a02409db2a5053f963538c8
Secondary Key: 11fc648597bf4d2fbe43526a3cfb0f58
```

---

## 📋 What You Still Need:

1. **API User** (UUID format)
2. **API Key** (password for the API User)

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Generate a UUID

**Option A - Online:**
Visit: https://www.uuidgenerator.net/version4

**Option B - PowerShell:**
```powershell
[guid]::NewGuid().ToString()
```

**You'll get something like:**
```
a1b2c3d4-e5f6-7890-1234-567890abcdef
```

**Save this** - This will be your `API User ID`

### Step 2: Create the API User

Run this command (replace the UUIDs):

```powershell
# Replace {YOUR_UUID} with the UUID you generated
# Replace {YOUR_PRIMARY_KEY} with your subscription key

$uuid = "YOUR_UUID_HERE"
$subscriptionKey = "b1bb50190a02409db2a5053f963538c8"

$headers = @{
    "X-Reference-Id" = $uuid
    "Ocp-Apim-Subscription-Key" = $subscriptionKey
    "Content-Type" = "application/json"
}

$body = @{
    providerCallbackHost = "byupay.up.railway.app"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://sandbox.momodeveloper.mtn.com/v1_0/apiuser" -Method POST -Headers $headers -Body $body
```

**Expected Response:** `201 Created` (means success!)

### Step 3: Generate API Key

```powershell
# Use the same UUID and subscription key

$uuid = "YOUR_UUID_HERE"
$subscriptionKey = "b1bb50190a02409db2a5053f963538c8"

$headers = @{
    "Ocp-Apim-Subscription-Key" = $subscriptionKey
}

$response = Invoke-WebRequest -Uri "https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/$uuid/apikey" -Method POST -Headers $headers

$response.Content | ConvertFrom-Json
```

**You'll get:** `{"apiKey": "1234567890abcdef..."}`

**Save this!** This is your `API Key`

---

## 🎯 Your Complete MTN Credentials

After running the commands above, you'll have:

```env
MTN_COLLECTION_SUBSCRIPTION_KEY=b1bb50190a02409db2a5053f963538c8
MTN_API_USER={the_uuid_you_generated}
MTN_API_KEY={the_api_key_from_step_3}
```

---

## ⚙️ Add to Railway

1. Go to: **Railway Dashboard** → Your backend project → **Variables**

2. Add these **5 variables:**

```env
MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
MTN_COLLECTION_SUBSCRIPTION_KEY=b1bb50190a02409db2a5053f963538c8
MTN_API_USER={your_uuid}
MTN_API_KEY={your_api_key}
MTN_TARGET_ENVIRONMENT=sandbox
```

3. Click **"Deploy"**

4. Wait 60 seconds

---

## 🧪 Test in Sandbox

### Test with MTN Sandbox Numbers:

**Success (auto-approves):**
```
Phone: 46733123454
→ Will automatically approve payment
```

**Pending:**
```
Phone: 46733123450
→ Stays pending (for testing pending states)
```

**Failed:**
```
Phone: 46733123456
→ Auto-fails (for testing failure handling)
```

### Test Flow:

1. **Visit:** https://byupay.vercel.app/request
2. **Enter:** $10 USD
3. **Select:** "MTN Mobile Money Direct"
4. **Enter:** `46733123454` (test number)
5. **Click:** "Proceed to Pay"
6. **See:** "Payment prompt sent!"
7. **Watch:** Auto-verifies (sandbox auto-approves)
8. **Success:** "Payment verified!" → Redirected to dashboard

---

## 🌍 Go to Production

Once sandbox testing is successful:

### Update Railway Variables:

```env
MTN_MOMO_BASE_URL=https://proxy.momoapi.mtn.com
MTN_TARGET_ENVIRONMENT=mtnghana
```

Keep the same:
- MTN_COLLECTION_SUBSCRIPTION_KEY
- MTN_API_USER
- MTN_API_KEY

### Test with Real Numbers:

Use real Ghana MTN numbers (024XXXXXXX)

---

## 🆘 Troubleshooting

### Issue: "Failed to create API user"

**Cause:** UUID already exists or subscription key wrong  
**Solution:** Generate a new UUID and try again

### Issue: "Invalid subscription key"

**Cause:** Using wrong key or subscription not active  
**Solution:** 
1. Login to momodeveloper.mtn.com
2. Go to Profile → Subscriptions
3. Verify "Collection" is subscribed
4. Copy Primary Key

### Issue: "API key request failed"

**Cause:** API user doesn't exist yet  
**Solution:** Run Step 2 first to create API user

---

## 📞 Need Help?

If the PowerShell commands don't work, I can help you:
1. Generate the commands with your UUID
2. Run them for you
3. Get your credentials

Just share:
- The UUID you generated
- Whether the commands work or error

---

**Ready to get your credentials? Let's do this!** 🚀


