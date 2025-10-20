// Test Hubtel Direct Debit API connectivity and permissions
require('dotenv').config();
const axios = require('axios');

const HUBTEL_CLIENT_ID = process.env.HUBTEL_API_ID || 'GR69OD8';
const HUBTEL_CLIENT_SECRET = process.env.HUBTEL_API_KEY || '04abf4cbb3c041839c1c3af89c3ebea2';
const HUBTEL_POS_SALES_ID = process.env.HUBTEL_POS_SALES_ID || '2030303';

console.log('\n🔍 Testing Hubtel Direct Debit API Connection...\n');
console.log('Credentials:');
console.log('  Client ID:', HUBTEL_CLIENT_ID);
console.log('  Client Secret:', HUBTEL_CLIENT_SECRET.substring(0, 8) + '...');
console.log('  POS Sales ID:', HUBTEL_POS_SALES_ID);
console.log('');

const authToken = Buffer.from(`${HUBTEL_CLIENT_ID}:${HUBTEL_CLIENT_SECRET}`).toString('base64');

async function testDirectDebit() {
  try {
    console.log('📡 Testing Direct Debit PreApproval Endpoint (CORRECT API)...');
    console.log(`   URL: https://preapproval.hubtel.com/api/v2/merchant/${HUBTEL_POS_SALES_ID}/preapproval/initiate`);
    console.log('');

    // Test payload (CORRECT FORMAT from documentation)
    const testPayload = {
      clientReferenceId: 'TEST-' + Date.now(),
      customerMsisdn: '233241234567',
      channel: 'mtn-gh-direct-debit',
      callbackUrl: 'https://byupay.up.railway.app/api/student/hubtel-callback'
    };

    console.log('📤 Sending test request...');
    console.log('   Test Phone: 233241234567');
    console.log('   Channel: mtn-gh-direct-debit');
    console.log('');

    const response = await axios.post(
      `https://preapproval.hubtel.com/api/v2/merchant/${HUBTEL_POS_SALES_ID}/preapproval/initiate`,
      testPayload,
      {
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('═'.repeat(60));
    console.log('✅ SUCCESS! Hubtel Direct Debit PreApproval is working!');
    console.log('═'.repeat(60));
    console.log('');
    console.log('Response Code:', response.data.responseCode);
    console.log('Message:', response.data.message);
    console.log('');
    console.log('PreApproval Details:');
    if (response.data.data) {
      console.log('  PreApproval ID:', response.data.data.hubtelPreApprovalId);
      console.log('  Client Reference:', response.data.data.clientReferenceId);
      console.log('  Verification Type:', response.data.data.verificationType);
      console.log('  PreApproval Status:', response.data.data.preapprovalStatus);
      if (response.data.data.otpPrefix) {
        console.log('  OTP Prefix:', response.data.data.otpPrefix);
      }
    }
    console.log('');
    console.log('Full Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    console.log('═'.repeat(60));
    console.log('🎉 YOUR HUBTEL INTEGRATION IS READY!');
    console.log('═'.repeat(60));
    console.log('');
    console.log('✅ Credentials are valid');
    console.log('✅ IP is whitelisted');
    console.log('✅ Direct Debit scope is enabled');
    console.log('✅ API is accessible');
    console.log('✅ Using CORRECT endpoint (preapproval API)');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Test with real phone number');
    console.log('2. Customer will receive USSD/OTP for approval');
    console.log('3. After approval, callback will confirm payment');
    console.log('');

  } catch (error) {
    console.log('═'.repeat(60));
    console.log('❌ HUBTEL API ERROR');
    console.log('═'.repeat(60));
    console.log('');

    if (error.response) {
      console.log('HTTP Status:', error.response.status, error.response.statusText);
      console.log('');

      // Specific error handling
      if (error.response.status === 401) {
        console.log('🔑 ERROR: Unauthorized (401)');
        console.log('');
        console.log('Possible Causes:');
        console.log('  ❌ Wrong API credentials');
        console.log('  ❌ Client ID or Secret incorrect');
        console.log('');
        console.log('Solutions:');
        console.log('  1. Verify credentials in Hubtel dashboard');
        console.log('  2. Regenerate API keys if needed');
        console.log('  3. Double-check Client ID and Secret');
        console.log('');
      } else if (error.response.status === 403) {
        console.log('🚫 ERROR: Forbidden (403)');
        console.log('');
        console.log('Possible Causes:');
        console.log('  ❌ IP address not whitelisted');
        console.log('  ❌ Direct Debit scope not enabled');
        console.log('');
        console.log('Solutions:');
        console.log('  1. Contact Hubtel support: support@hubtel.com');
        console.log('  2. Request IP whitelisting for your server');
        console.log('  3. Request "mobilemoney-receive-direct" scope activation');
        console.log('  4. Provide POS Sales ID: ' + HUBTEL_POS_SALES_ID);
        console.log('');
      } else if (error.response.status === 404) {
        console.log('🔍 ERROR: Not Found (404)');
        console.log('');
        console.log('Possible Causes:');
        console.log('  ❌ Wrong POS Sales ID');
        console.log('  ❌ Wrong endpoint URL');
        console.log('');
        console.log('Solutions:');
        console.log('  1. Verify POS Sales ID in Hubtel dashboard');
        console.log('  2. Current POS ID: ' + HUBTEL_POS_SALES_ID);
        console.log('  3. Check if ID is correct');
        console.log('');
      } else if (error.response.status === 4101) {
        console.log('🔐 ERROR: Permission Denied (4101)');
        console.log('');
        console.log('Error Message:', error.response.data?.Message || error.response.data);
        console.log('');
        console.log('This means:');
        console.log('  ❌ Direct Debit scope not enabled on your account');
        console.log('');
        console.log('Solution:');
        console.log('  Contact your Retail Systems Engineer');
        console.log('  Request: Enable "mobilemoney-receive-direct" scope');
        console.log('');
      }

      console.log('Error Response:', JSON.stringify(error.response.data, null, 2));
      console.log('');
    } else if (error.code === 'ENOTFOUND') {
      console.log('🌐 ERROR: Cannot reach Hubtel servers');
      console.log('');
      console.log('  ❌ DNS resolution failed');
      console.log('  ❌ Check internet connection');
      console.log('');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.log('⏱️  ERROR: Request Timeout');
      console.log('');
      console.log('Possible Causes:');
      console.log('  ❌ IP not whitelisted (Hubtel blocks unknown IPs)');
      console.log('  ❌ Firewall blocking request');
      console.log('');
      console.log('Solution:');
      console.log('  Contact Hubtel to whitelist your IP address');
      console.log('');
    } else {
      console.log('❌ Unknown Error:', error.message);
      console.log('');
    }

    console.log('═'.repeat(60));
    console.log('📞 NEXT STEPS');
    console.log('═'.repeat(60));
    console.log('');
    console.log('Contact Hubtel Support:');
    console.log('  Email: support@hubtel.com');
    console.log('  Phone: +233 30 281 0808');
    console.log('');
    console.log('Request:');
    console.log('  1. IP whitelisting for Railway server');
    console.log('  2. Enable Direct Debit scope');
    console.log('  3. Verify POS Sales ID: ' + HUBTEL_POS_SALES_ID);
    console.log('  4. Confirm account activation');
    console.log('');
  }
}

testDirectDebit();

