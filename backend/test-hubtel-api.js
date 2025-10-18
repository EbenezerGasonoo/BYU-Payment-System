// Test Hubtel API endpoints to find the correct one
require('dotenv').config({ path: './backend/.env' });
const axios = require('axios');

const HUBTEL_CLIENT_ID = process.env.HUBTEL_API_ID || 'GR69OD8';
const HUBTEL_CLIENT_SECRET = process.env.HUBTEL_API_KEY || '04abf4cbb3c041839c1c3af89c3ebea2';

console.log('\n🔍 Testing Hubtel API Endpoints...\n');
console.log('Credentials:');
console.log('  Client ID:', HUBTEL_CLIENT_ID);
console.log('  Client Secret:', HUBTEL_CLIENT_SECRET.substring(0, 8) + '...');
console.log('');

const authToken = Buffer.from(`${HUBTEL_CLIENT_ID}:${HUBTEL_CLIENT_SECRET}`).toString('base64');

const testEndpoints = [
  {
    name: 'Receive Mobile Money (v1)',
    url: `https://api.hubtel.com/v1/merchantaccount/merchants/${HUBTEL_CLIENT_ID}/receive/mobilemoney`
  },
  {
    name: 'Receive Mobile Money (v2)',
    url: `https://api.hubtel.com/v2/merchantaccount/merchants/${HUBTEL_CLIENT_ID}/receive/mobilemoney`
  },
  {
    name: 'Receive Mobile Money (simple)',
    url: 'https://api.hubtel.com/v1/merchantaccount/receive/mobilemoney'
  },
  {
    name: 'Online Checkout (alternative)',
    url: 'https://payproxyapi.hubtel.com/items/initiate'
  }
];

const testPayload = {
  CustomerName: 'Test Customer',
  CustomerMsisdn: '233241234567',
  CustomerEmail: 'test@example.com',
  Channel: 'mtn-gh',
  Amount: 1.00,
  PrimaryCallbackUrl: 'https://byupay.up.railway.app/api/student/hubtel-callback',
  Description: 'Test Payment',
  ClientReference: 'TEST-' + Date.now()
};

async function testEndpoint(endpoint) {
  try {
    console.log(`\n📡 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);
    
    const response = await axios.post(
      endpoint.url,
      testPayload,
      {
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('   ✅ SUCCESS!');
    console.log('   Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`   ❌ Error ${error.response.status}: ${error.response.statusText}`);
      console.log('   Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNABORTED') {
      console.log('   ⏱️  Timeout - API not responding');
    } else {
      console.log('   ❌ Error:', error.message);
    }
    return false;
  }
}

async function runTests() {
  console.log('═'.repeat(60));
  console.log('Starting Hubtel API Endpoint Tests...');
  console.log('═'.repeat(60));

  for (const endpoint of testEndpoints) {
    const success = await testEndpoint(endpoint);
    if (success) {
      console.log('\n🎉 FOUND WORKING ENDPOINT!');
      console.log(`   Use this: ${endpoint.url}`);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }

  console.log('\n' + '═'.repeat(60));
  console.log('Test Complete!');
  console.log('═'.repeat(60));
  console.log('\n📋 Next Steps:');
  console.log('1. If a working endpoint was found, update backend/utils/hubtelService.js');
  console.log('2. If all failed with 401/403, contact Hubtel support for:');
  console.log('   - IP whitelisting');
  console.log('   - Account activation');
  console.log('   - Correct API endpoint');
  console.log('3. Provide them with Client ID: ' + HUBTEL_CLIENT_ID);
  console.log('\n💡 Alternative: Use "MTN Mobile Money Direct" method which works without API!\n');
}

runTests();

