// Quick API Test Script
// Run with: node test-api.js

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const ADMIN_KEY = process.env.ADMIN_KEY;

// Test data
const testStudent = {
  name: 'Test Student',
  byuId: 'BYU99999',
  email: 'test@example.com',
  phone: '+233 24 999 9999'
};

async function runTests() {
  console.log('🧪 Starting API Tests...\n');

  try {
    // Test 1: Register Student
    console.log('1️⃣ Testing Student Registration...');
    const registerResponse = await axios.post(`${API_URL}/student/register`, testStudent);
    console.log('✅ Student registered:', registerResponse.data);
    console.log();

    // Test 2: Request Card
    console.log('2️⃣ Testing Card Request...');
    const cardRequest = await axios.post(`${API_URL}/student/request-card`, {
      byuId: testStudent.byuId,
      amount: 500
    });
    console.log('✅ Card requested:', cardRequest.data);
    const requestId = cardRequest.data.data.requestToken;
    console.log();

    // Test 3: Get Admin Stats
    console.log('3️⃣ Testing Admin Stats...');
    const stats = await axios.get(`${API_URL}/admin/stats`, {
      headers: { 'x-admin-key': ADMIN_KEY }
    });
    console.log('✅ Stats retrieved:', stats.data);
    console.log();

    // Test 4: Get All Requests
    console.log('4️⃣ Testing Get Requests...');
    const requests = await axios.get(`${API_URL}/admin/requests`, {
      headers: { 'x-admin-key': ADMIN_KEY }
    });
    console.log('✅ Found', requests.data.data.length, 'request(s)');
    
    if (requests.data.data.length > 0) {
      const firstRequest = requests.data.data[0];
      console.log('   Request ID:', firstRequest._id);
      console.log();

      // Test 5: Assign Mock Card
      console.log('5️⃣ Testing Mock Card Assignment...');
      const assignResponse = await axios.post(`${API_URL}/admin/assign/mock`, {
        requestId: firstRequest._id
      }, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      console.log('✅ Mock card assigned:', assignResponse.data.data.virtualCardNumber);
      console.log();
    }

    // Test 6: Get Student Dashboard
    console.log('6️⃣ Testing Student Dashboard...');
    const dashboard = await axios.get(`${API_URL}/student/dashboard/${testStudent.byuId}`);
    console.log('✅ Dashboard retrieved:', dashboard.data.data.cardRequests.length, 'request(s)');
    console.log();

    console.log('🎉 All tests passed!\n');

  } catch (error) {
    if (error.response) {
      console.error('❌ Error:', error.response.data.message);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to server. Is it running on port 3000?');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Check if server is running first
console.log('Checking if server is running on http://localhost:3000...\n');

axios.get('http://localhost:3000')
  .then(() => {
    console.log('✅ Server is running!\n');
    runTests();
  })
  .catch(() => {
    console.error('❌ Server is not running!');
    console.error('Please start the backend first:');
    console.error('   cd backend');
    console.error('   npm run dev\n');
  });

