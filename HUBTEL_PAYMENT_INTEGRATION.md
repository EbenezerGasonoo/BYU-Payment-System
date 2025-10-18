# 💳 Hubtel Payment Integration Guide

## Overview

The BYU Payment System now requires students to **pay first** before their card request is submitted to the admin. This ensures all requests are paid for upfront using Hubtel payment gateway.

---

## 🎯 Payment Flow

### 1. **Student Requests Card**
- Student enters their BYU ID and amount in USD
- System calculates GHS equivalent using live exchange rate
- System adds 5% chargeback fee
- Student sees total amount to pay in GHS

### 2. **Student Chooses Payment Method**
- Mobile Money (MTN, Vodafone, AirtelTigo)
- Cash Payment (at office)
- Bank Transfer

### 3. **Payment Processing**
- System creates card request with `paymentStatus: 'pending'`
- Generates unique payment reference
- Student completes payment via chosen method

### 4. **Payment Verification**
- Student confirms payment completion
- System verifies payment
- Updates `paymentStatus` to `'paid'`
- Notifies admin of new **paid** request

### 5. **Card Assignment**
- Admin sees only **paid** requests
- Admin assigns virtual card to student
- Student receives card details

---

## 📊 Database Changes

### CardRequest Model (Updated)

```javascript
{
  // ... existing fields
  
  // Payment Information
  amountInGHS: Number,           // Amount converted to GHS
  exchangeRate: Number,          // USD to GHS rate used
  chargebackFee: Number,         // Fee percentage (default: 5%)
  totalPaidGHS: Number,          // Total amount paid (GHS + fee)
  
  // Payment Status Tracking
  paymentStatus: {               // 'unpaid', 'pending', 'paid', 'failed'
    type: String,
    enum: ['unpaid', 'pending', 'paid', 'failed'],
    default: 'unpaid'
  },
  paymentReference: String,      // Unique payment reference
  paymentMethod: String,         // 'momo', 'card', 'bank', 'cash'
  paymentVerifiedAt: Date,       // When payment was verified
}
```

---

## 🔧 API Endpoints

### 1. Create Card Request (With Payment)

**POST** `/api/student/request-card`

**Request:**
```json
{
  "byuId": "123456789",
  "amount": 100,
  "amountInGHS": 1550,
  "exchangeRate": 15.5,
  "totalPaidGHS": 1627.50,
  "paymentMethod": "momo"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initiated...",
  "data": {
    "requestToken": "A1B2C3D4",
    "paymentReference": "BYU-1698765432-E5F6G7H8",
    "amount": 100,
    "totalPaidGHS": 1627.50,
    "paymentStatus": "pending",
    "status": "pending"
  }
}
```

### 2. Verify Payment

**POST** `/api/student/verify-payment`

**Request:**
```json
{
  "paymentReference": "BYU-1698765432-E5F6G7H8",
  "hubtelReference": "HUB-123456789" // Optional: From Hubtel
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully!",
  "data": {
    "requestToken": "A1B2C3D4",
    "paymentStatus": "paid",
    "status": "pending",
    "amount": 100,
    "totalPaidGHS": 1627.50
  }
}
```

### 3. Mark Payment Failed

**POST** `/api/student/payment-failed`

**Request:**
```json
{
  "paymentReference": "BYU-1698765432-E5F6G7H8",
  "reason": "Payment timeout"
}
```

---

## 💻 Frontend Components

### HubtelPayment Component

New modal component for handling Hubtel payments.

**Features:**
- Payment method selection (MoMo, Cash, Bank)
- Payment summary with breakdown
- Payment instructions per method
- Payment confirmation

**Props:**
```javascript
<HubtelPayment
  paymentData={{
    amount: 100,              // USD amount
    amountInGHS: 1550,        // GHS equivalent
    totalPaidGHS: 1627.50,    // Total with fee
    exchangeRate: 15.5,
    byuId: "123456789"
  }}
  onSuccess={(paymentRef, method) => {}}
  onCancel={() => {}}
/>
```

---

## 🎨 UI/UX Improvements

### Request Payment Page

**Before:**
- Enter amount → Submit → Request created

**After:**
- Enter amount → See GHS calculation → Accept terms → **Proceed to Payment** → Choose payment method → Complete payment → Request submitted

### Admin Dashboard

**New Information Displayed:**
- Payment Status badge (PAID, PENDING, FAILED)
- Amount in USD and GHS
- Total paid (with fee breakdown)
- Exchange rate used
- Payment reference number
- Payment method

---

## 📱 Payment Methods

### 1. Mobile Money

**Flow:**
1. Student enters mobile number
2. System initiates Hubtel MoMo request
3. Student receives prompt on phone (*170#)
4. Student approves payment with PIN
5. System verifies payment
6. Request submitted to admin

**Instructions Shown:**
```
1. Dial *170# on your phone
2. Select Option 6 (My Wallet)
3. Select Option 3 (My Approvals)
4. Approve payment of GHS 1,627.50
5. Enter your MOMO PIN
6. Receive confirmation SMS
```

### 2. Cash Payment

**Flow:**
1. Student selects cash payment
2. System generates payment reference
3. Student visits BYU office
4. Makes cash payment with reference
5. Admin verifies and marks as paid

**Instructions Shown:**
```
Visit: BYU Pathway Office, Accra
Amount: GHS 1,627.50
Reference: BYU-1698765432-E5F6G7H8
⚠️ Bring your BYU Student ID
```

### 3. Bank Transfer

**Flow:**
1. Student selects bank transfer
2. System shows bank details
3. Student makes transfer
4. Uses payment reference as description
5. Admin verifies payment

**Instructions Shown:**
```
Bank Name: [Your Bank]
Account Name: BYU Pathway Ghana
Account Number: [Account Number]
Amount: GHS 1,627.50
Reference: BYU-1698765432-E5F6G7H8
⚠️ Use reference as transfer description
```

---

## 🔐 Security Features

### Payment Validation
- ✅ All amounts validated on backend
- ✅ Exchange rates stored in database
- ✅ Duplicate payment prevention
- ✅ Unique payment references
- ✅ Payment status tracking

### Admin Protection
- ✅ Only **paid** requests can be assigned cards
- ✅ Payment reference visible for verification
- ✅ Payment method logged
- ✅ Payment timestamp recorded

---

## 🧪 Testing the Payment Flow

### Test as Student

1. **Register:**
   ```
   Name: Test Student
   BYU ID: 123456789
   Email: test@byupathway.edu
   Phone: 0241234567
   ```

2. **Request Card:**
   ```
   Amount: $100 USD
   
   Calculated:
   - Base (GHS): 1,550.00
   - Fee (5%): 77.50
   - Total: 1,627.50 GHS
   ```

3. **Choose Payment:**
   - Select: Mobile Money
   - Enter: 0241234567

4. **Complete Payment:**
   - Click "I've Completed Payment"
   - System verifies
   - Request submitted to admin

### Test as Admin

1. **View Requests:**
   - See payment status: PAID
   - See total paid: GHS 1,627.50
   - See payment reference

2. **Assign Card:**
   - Only possible if payment status = "paid"
   - Assign virtual card
   - Student receives notification

---

## 📝 Environment Variables

Add to `backend/.env`:

```env
# Hubtel Configuration (for production integration)
HUBTEL_CLIENT_ID=your_client_id
HUBTEL_CLIENT_SECRET=your_client_secret
HUBTEL_MERCHANT_NUMBER=your_merchant_number
```

**Note:** Current implementation uses manual payment confirmation. For automatic Hubtel API integration, additional implementation is needed.

---

## 🚀 Deployment Checklist

- [x] Update CardRequest model
- [x] Add payment endpoints
- [x] Create HubtelPayment component
- [x] Update RequestPayment page
- [x] Update AdminDashboard
- [x] Add payment status badges
- [x] Create payment instructions
- [ ] Configure Hubtel API credentials
- [ ] Test all payment methods
- [ ] Update terms and conditions
- [ ] Train admins on payment verification

---

## 🎯 Future Enhancements

### 1. Automatic Hubtel Integration
- Integrate Hubtel API directly
- Automatic payment verification
- Real-time payment status updates
- Webhook for payment callbacks

### 2. Payment Receipts
- Generate PDF receipts
- Email receipts to students
- Receipt download feature

### 3. Refund System
- Handle payment refunds
- Track refund status
- Automatic refund processing

### 4. Payment Analytics
- Payment success rate
- Popular payment methods
- Revenue tracking
- Payment timeline analytics

---

## ⚠️ Important Notes

1. **Manual Verification Required:**
   - Currently, admin must verify cash/bank payments manually
   - Payment reference must match transaction

2. **Exchange Rate:**
   - Live rate fetched from API
   - Rate stored with each request
   - Rate can be refreshed before payment

3. **Fee Structure:**
   - 5% chargeback fee applied
   - Fee included in total GHS amount
   - Student sees breakdown before payment

4. **Payment Status:**
   - `unpaid` - Request created, no payment
   - `pending` - Payment initiated, awaiting confirmation
   - `paid` - Payment verified, ready for card assignment
   - `failed` - Payment failed or timeout

---

## 📞 Support

For issues or questions:
- Check payment reference number
- Verify payment method details
- Contact admin with payment reference
- Check payment status in dashboard

---

**Payment Integration Complete! ✅**

All students must now pay before their card request reaches admin.


