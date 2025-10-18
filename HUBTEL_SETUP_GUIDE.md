# 🚀 Hubtel Payment Integration Setup Guide

## 📱 Mobile Money (Hubtel) - Automated Payment

### Step 1: Get Hubtel Account

1. **Sign Up for Hubtel:**
   - Visit: https://hubtel.com
   - Click "Get Started" or "Sign Up"
   - Create a business account
   - Complete KYC verification

2. **Get API Credentials:**
   - Login to Hubtel Dashboard
   - Go to **Settings** → **API Keys**
   - You'll get:
     - `Client ID`
     - `Client Secret`
     - `Merchant Account Number`

### Step 2: Add Credentials to Backend

Add to `backend/.env`:

```env
# Hubtel API Configuration
HUBTEL_CLIENT_ID=your_client_id_here
HUBTEL_CLIENT_SECRET=your_client_secret_here
HUBTEL_MERCHANT_NUMBER=your_merchant_account_number
HUBTEL_API_URL=https://api.hubtel.com/v2
```

### Step 3: Install Hubtel SDK

```bash
cd backend
npm install hubtel-payment
```

### Step 4: Create Hubtel Payment Service

Create `backend/utils/hubtelService.js`:

```javascript
const axios = require('axios');

const HUBTEL_API_URL = process.env.HUBTEL_API_URL || 'https://api.hubtel.com/v2';
const CLIENT_ID = process.env.HUBTEL_CLIENT_ID;
const CLIENT_SECRET = process.env.HUBTEL_CLIENT_SECRET;
const MERCHANT_NUMBER = process.env.HUBTEL_MERCHANT_NUMBER;

// Get Basic Auth token
const getAuthToken = () => {
  const credentials = `${CLIENT_ID}:${CLIENT_SECRET}`;
  return Buffer.from(credentials).toString('base64');
};

// Initiate Mobile Money Payment
const initiatePayment = async (phoneNumber, amount, paymentReference, description) => {
  try {
    const response = await axios.post(
      `${HUBTEL_API_URL}/merchantaccount/merchants/${MERCHANT_NUMBER}/receive/mobilemoney`,
      {
        CustomerName: description,
        CustomerMsisdn: phoneNumber,
        CustomerEmail: '',
        Channel: 'mtn-gh', // or 'vodafone-gh', 'airtel-gh'
        Amount: amount,
        PrimaryCallbackUrl: `${process.env.API_URL}/api/student/hubtel-callback`,
        Description: description,
        ClientReference: paymentReference
      },
      {
        headers: {
          'Authorization': `Basic ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Hubtel payment error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

// Check Payment Status
const checkPaymentStatus = async (transactionId) => {
  try {
    const response = await axios.get(
      `${HUBTEL_API_URL}/merchantaccount/merchants/${MERCHANT_NUMBER}/transactions/${transactionId}`,
      {
        headers: {
          'Authorization': `Basic ${getAuthToken()}`
        }
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Hubtel status check error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

module.exports = {
  initiatePayment,
  checkPaymentStatus
};
```

### Step 5: Update Student Routes

Update `backend/routes/studentRoutes.js`:

```javascript
const { initiatePayment, checkPaymentStatus } = require('../utils/hubtelService');

// Add this new endpoint for Hubtel payment initiation
router.post('/initiate-hubtel-payment', async (req, res) => {
  try {
    const { phoneNumber, amount, paymentReference, studentName } = req.body;

    // Initiate Hubtel payment
    const result = await initiatePayment(
      phoneNumber,
      amount,
      paymentReference,
      `BYU Payment - ${studentName}`
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Payment request sent to phone',
        data: {
          transactionId: result.data.TransactionId,
          status: result.data.Status
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to initiate payment',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error initiating Hubtel payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Hubtel Callback Endpoint (webhook)
router.post('/hubtel-callback', async (req, res) => {
  try {
    const { Data } = req.body;
    
    // Data contains:
    // - TransactionId
    // - ClientReference (our paymentReference)
    // - Status ("Paid" or "Failed")
    // - Amount
    
    if (Data.Status === 'Paid') {
      // Find and update card request
      const cardRequest = await CardRequest.findOne({ 
        paymentReference: Data.ClientReference 
      }).populate('student');
      
      if (cardRequest) {
        cardRequest.paymentStatus = 'paid';
        cardRequest.paymentVerifiedAt = new Date();
        await cardRequest.save();
        
        // Notify admin
        await notifyAdminNewRequest(cardRequest.student, cardRequest);
      }
    } else if (Data.Status === 'Failed') {
      // Update to failed
      const cardRequest = await CardRequest.findOne({ 
        paymentReference: Data.ClientReference 
      });
      
      if (cardRequest) {
        cardRequest.paymentStatus = 'failed';
        cardRequest.status = 'declined';
        await cardRequest.save();
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Hubtel callback error:', error);
    res.status(500).send('Error');
  }
});
```

### Step 6: Update Frontend Hubtel Component

Update `frontend/src/components/HubtelPayment.jsx`:

```javascript
const initiatePayment = async () => {
  if (!phoneNumber) {
    setMessage({ type: 'error', text: 'Please enter your mobile money number' });
    return;
  }

  setProcessing(true);
  setMessage({ type: '', text: '' });

  if (paymentMethod === 'momo-hubtel') {
    try {
      // Call backend to initiate Hubtel payment
      const response = await axios.post(`${API_BASE_URL}/student/initiate-hubtel-payment`, {
        phoneNumber,
        amount: totalPaidGHS,
        paymentReference,
        studentName: studentName || 'Student'
      });

      if (response.data.success) {
        setShowInstructions(true);
        setMessage({
          type: 'success',
          text: `Payment prompt sent to ${phoneNumber}! Please check your phone.`
        });
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Failed to initiate payment'
        });
        setProcessing(false);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to initiate payment'
      });
      setProcessing(false);
    }
  } else {
    // For momo-direct, just show instructions
    setShowInstructions(true);
    setMessage({
      type: 'info',
      text: `Payment initiated! Reference: ${paymentReference}`
    });
  }
};
```

### Step 7: Configure Webhook in Hubtel Dashboard

1. Login to Hubtel Dashboard
2. Go to **Settings** → **Webhooks**
3. Add callback URL:
   ```
   https://byupay.up.railway.app/api/student/hubtel-callback
   ```
4. Select events: `Payment Received`, `Payment Failed`
5. Save

### Step 8: Test Hubtel Integration

**Test Mode:**
```bash
# Hubtel provides test credentials
HUBTEL_CLIENT_ID=test_client_id
HUBTEL_CLIENT_SECRET=test_client_secret
```

**Test Phone Numbers:**
- Success: `0241234567` (auto-approves)
- Failure: `0247654321` (auto-fails)

---

## 💳 MTN Mobile Money Direct - Manual Payment

### What You Need:

### Step 1: Get MTN MoMo Merchant Account

1. **Apply for MTN MoMo Merchant Account:**
   - Visit MTN office or call: 0244300000
   - Apply for business MoMo account
   - Provide:
     - Business registration documents
     - ID card
     - Business location
   - Get approved (takes 1-2 weeks)

2. **You'll Receive:**
   - MTN MoMo Business Number (e.g., 024XXXXXXX)
   - Merchant account name

### Step 2: Update Your MoMo Number in Code

Update `frontend/src/components/HubtelPayment.jsx`:

```javascript
// Replace this line:
<p><strong>MTN MoMo Number:</strong> <span>0241234567</span></p>

// With your actual MTN MoMo business number:
<p><strong>MTN MoMo Number:</strong> <span>024XXXXXXX</span></p>
```

### Step 3: Create Admin Verification Process

Admins need to:

1. **Check Payment Reference:**
   - Student provides: `BYU-1698765432-E5F6G7H8`
   - Admin logs into MTN MoMo merchant account
   - Checks transaction history
   - Verifies amount matches

2. **Manual Verification Steps:**
   - Login to MTN MoMo dashboard or check SMS
   - Find transaction with reference number
   - Confirm amount: GHS 1,627.50
   - Verify sender matches student phone number
   - Mark as verified in admin dashboard

### Step 4: Add Admin Verification Button

Update `frontend/src/pages/AdminDashboard.jsx`:

Add button to verify payment:

```javascript
{request.paymentStatus === 'pending' && request.paymentMethod === 'momo-direct' && (
  <button
    onClick={() => handleVerifyPayment(request._id)}
    className="btn btn-success btn-sm"
  >
    ✓ Verify Payment
  </button>
)}
```

And the handler:

```javascript
const handleVerifyPayment = async (requestId) => {
  if (confirm('Have you verified this payment in your MTN MoMo account?')) {
    try {
      await adminAPI.verifyManualPayment(adminKey, requestId);
      setMessage({ type: 'success', text: 'Payment verified successfully!' });
      loadDashboard();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to verify payment' });
    }
  }
};
```

### Step 5: Add Backend Verification Endpoint

Add to `backend/routes/adminRoutes.js`:

```javascript
// Manually verify payment
router.post('/verify-manual-payment', adminAuth, async (req, res) => {
  try {
    const { requestId } = req.body;

    const cardRequest = await CardRequest.findById(requestId).populate('student');
    if (!cardRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Update payment status
    cardRequest.paymentStatus = 'paid';
    cardRequest.paymentVerifiedAt = new Date();
    await cardRequest.save();

    // Notify admin
    await notifyAdminNewRequest(cardRequest.student, cardRequest);

    res.json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});
```

---

## 📋 Summary: What You Need

### For Hubtel (Automated):
- ✅ Hubtel business account
- ✅ API credentials (Client ID, Secret, Merchant Number)
- ✅ Add credentials to `.env`
- ✅ Install Hubtel SDK
- ✅ Create Hubtel service
- ✅ Configure webhook URL
- ✅ Test integration

**Cost:** Hubtel charges ~1-2% transaction fee

### For MTN MoMo Direct (Manual):
- ✅ MTN MoMo merchant account
- ✅ Business MoMo number
- ✅ Update number in code
- ✅ Admin verification process
- ✅ Add verification button in admin dashboard
- ✅ Train admins to verify payments

**Cost:** Standard MTN MoMo merchant fees apply

---

## 🎯 Recommendation

**Start with MTN MoMo Direct** because:
1. ✅ Easier to set up (just need MoMo merchant number)
2. ✅ No API integration needed initially
3. ✅ Works immediately
4. ✅ Lower barrier to entry

**Then add Hubtel** for:
1. 🚀 Automated payment verification
2. 🚀 Better user experience
3. 🚀 Handles multiple networks (MTN, Vodafone, AirtelTigo)
4. 🚀 Scales better

---

## ⚡ Quick Start (MTN Direct Only)

1. Get MTN MoMo merchant number
2. Update the number in `HubtelPayment.jsx`
3. Deploy
4. Students can pay immediately
5. Admins verify manually

**Time to launch:** 1-2 weeks (waiting for MTN approval)

---

## 🔧 Need Help?

Contact:
- **Hubtel Support:** support@hubtel.com
- **MTN MoMo Business:** 0244300000
- **Integration Help:** Check Hubtel API docs at https://developers.hubtel.com


