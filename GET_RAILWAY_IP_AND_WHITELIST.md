# 🌐 Get Railway IP Address & Whitelist with Hubtel

## 🎯 Your Server: Railway.app

**Backend URL:** https://byupay.up.railway.app  
**Hosting:** Railway (cloud platform)  
**Location:** Dynamic (changes based on deployment)  

---

## 📍 How to Get Your Railway IP Address

### Method 1: Add IP Detection to Your Backend (RECOMMENDED)

**I can add an endpoint that shows your current IP:**

```javascript
// Add to backend/server.js
app.get('/api/server-info', (req, res) => {
  res.json({
    ip: req.ip,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});
```

Then visit: `https://byupay.up.railway.app/api/server-info`

### Method 2: Use External IP Detection Service

Add this endpoint:

```javascript
const axios = require('axios');

app.get('/api/my-ip', async (req, res) => {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    res.json({
      publicIP: response.data.ip,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      error: 'Failed to get IP',
      requestIP: req.ip
    });
  }
});
```

Then call: `curl https://byupay.up.railway.app/api/my-ip`

### Method 3: Check Railway Dashboard

1. **Go to:** https://railway.app
2. **Find:** Your backend service
3. **Click:** Settings or Deployments
4. **Look for:** Network or IP information
5. **Note:** Railway may not show a fixed IP

### Method 4: Check Railway Logs

When your app makes outbound requests (like to Hubtel), the IP is visible:

1. Railway Dashboard → Your Service → Logs
2. Look for Hubtel API calls
3. Hubtel sees your IP in their logs
4. You can also see it in error messages

---

## ⚠️ The Railway IP Challenge

### Problem with Railway:

**Railway uses dynamic IPs:**
- IP can change between deployments
- No guaranteed fixed IP address
- Shared infrastructure

**Hubtel requires:**
- Fixed IP addresses to whitelist
- Maximum 4 IPs allowed
- Stable, predictable IPs

### This Creates a Conflict! ❌

**Railway:** "Your IP might change"  
**Hubtel:** "We only allow whitelisted IPs"  
**Result:** May work today, fail tomorrow if IP changes

---

## 🔧 Solutions for IP Whitelisting

### Solution 1: Railway Static IP (If Available)

**Check if Railway offers static IPs:**

1. Go to Railway Dashboard
2. Check Settings → Networking
3. Look for "Static IP" or "Dedicated IP" option
4. If available, enable it (may cost extra)
5. Use this IP for whitelisting

### Solution 2: Use Railway's IP Range

**Contact Railway Support:**

Email: team@railway.app

```
Subject: IP Range for Outbound Requests

Hi Railway Team,

I need to whitelist my backend service's IP with a payment provider (Hubtel).

They require fixed IP addresses for security.

Questions:
1. What is my service's current public IP?
2. Do you offer static/dedicated IPs?
3. What is Railway's IP range for outbound requests?
4. Can I get a list of IPs my service might use?

Service: byupay.up.railway.app

Thank you!
```

### Solution 3: Whitelist Multiple Railway IPs

**Ask Hubtel to whitelist Railway's IP range:**

1. Get Railway's potential IPs (from Railway support)
2. Provide all IPs to Hubtel (max 4)
3. Hubtel whitelists all of them
4. Should work even if IP changes

### Solution 4: Use VPN or Proxy with Fixed IP

**Add a fixed-IP proxy:**
- Route Hubtel requests through a proxy
- Proxy has fixed IP
- Whitelist proxy IP with Hubtel
- More complex but reliable

---

## 📋 Step-by-Step: How to Whitelist

### Step 1: Get Your IP

**Let me add an endpoint to show your IP:**

I'll create `/api/my-ip` endpoint for you.

### Step 2: Email Hubtel

```
To: support@hubtel.com
CC: Your Retail Systems Engineer (if assigned)
Subject: IP Whitelisting for Direct Debit - POS 2030303

Hi Hubtel Support,

I need IP whitelisting for Hubtel Direct Debit API.

My Details:
- POS Sales ID: 2030303
- Client ID: GR69OD8
- Business Name: Tema - POS Sales
- Backend: https://byupay.up.railway.app

My Server IP: [YOUR_IP_HERE]

Request:
1. Please whitelist the above IP for Direct Debit API access
2. Confirm "mobilemoney-receive-direct" scope is enabled
3. Advise if I need to whitelist multiple IPs (using Railway cloud hosting)

Current Error:
- 403 Forbidden when calling Direct Debit Charge endpoint

Thank you!
```

### Step 3: Wait for Confirmation

**Hubtel will:**
- Verify your account
- Add IP to whitelist
- Confirm via email
- Usually takes 1-2 business days

### Step 4: Test Again

Once whitelisted:
```bash
cd backend
node test-hubtel-direct-debit.js
```

Should show: ✅ Success!

---

## ⚡ Quick Test: Let Me Add IP Detection Endpoint

I can add an endpoint to your backend RIGHT NOW that will:
1. Show your current Railway IP
2. Log it for Hubtel
3. Help you get the IP to whitelist

---

## 🤔 Alternative: Why Not Use MTN MoMo?

**Honest Comparison:**

| Feature | Hubtel | MTN MoMo |
|---------|--------|----------|
| **IP Whitelisting** | Required ❌ | Not required ✅ |
| **Setup Time** | 1-2 days | 5 minutes ✅ |
| **Works Today** | No | Yes ✅ |
| **Networks** | MTN + Vodafone ✅ | MTN only |
| **Your Status** | Blocked (IP issue) | Ready to use ✅ |

---

## 🎯 What I Recommend

### Do This NOW:

**Let me add IP detection to your backend**
- I'll create `/api/my-ip` endpoint
- You'll see your Railway IP
- You send IP to Hubtel for whitelisting

### While Waiting (Optional):

**Enable MTN MoMo for testing**
- Complete payment flow works TODAY
- Real payment testing immediately
- Disable later if you want

---

## ❓ What Do You Want Me to Do?

**Option A:** Add IP detection endpoint + Guide you through Hubtel whitelisting  
**Option B:** Just provide email template, you handle Hubtel contact  
**Option C:** Add IP endpoint AND enable MTN (so you can test while waiting)  

**Which option do you prefer?** 

I'm ready to help with whichever approach you choose! 🚀
