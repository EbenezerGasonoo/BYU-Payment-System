// Production Testing Script
// This will test your Railway backend and Vercel frontend

const https = require('https');
const http = require('http');

// REPLACE THESE WITH YOUR ACTUAL URLS
const BACKEND_URL = process.argv[2] || 'YOUR_RAILWAY_URL';
const FRONTEND_URL = process.argv[3] || 'YOUR_VERCEL_URL';

console.log('🧪 Testing Production Deployment\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test 1: Backend Health Check
async function testBackendHealth() {
  console.log('1️⃣ Testing Backend Health...');
  console.log(`   URL: ${BACKEND_URL}/api/health`);
  
  return new Promise((resolve) => {
    const url = new URL(`${BACKEND_URL}/api/health`);
    const protocol = url.protocol === 'https:' ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ Backend is healthy!');
          try {
            const json = JSON.parse(data);
            console.log(`   Status: ${json.status}`);
            console.log(`   Uptime: ${Math.floor(json.uptime)}s`);
          } catch (e) {}
        } else {
          console.log(`   ❌ Backend returned status ${res.statusCode}`);
        }
        console.log();
        resolve();
      });
    }).on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      console.log('   Make sure your Railway backend URL is correct!\n');
      resolve();
    });
  });
}

// Test 2: Test Registration Endpoint
async function testRegistration() {
  console.log('2️⃣ Testing Registration Endpoint...');
  console.log(`   URL: ${BACKEND_URL}/api/student/register`);
  
  return new Promise((resolve) => {
    const url = new URL(`${BACKEND_URL}/api/student/register`);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const testData = JSON.stringify({
      name: 'Production Test Student',
      byuId: '999999999',
      email: 'prodtest@byupathway.edu',
      phone: '+233 24 999 9999'
    });

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length
      }
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log('   ✅ Registration endpoint works!');
          try {
            const json = JSON.parse(data);
            console.log(`   Message: ${json.message}`);
          } catch (e) {}
        } else if (res.statusCode === 400) {
          console.log('   ⚠️  Registration returned 400 (might be duplicate - that\'s OK!)');
          try {
            const json = JSON.parse(data);
            console.log(`   Message: ${json.message}`);
          } catch (e) {}
        } else {
          console.log(`   ❌ Unexpected status: ${res.statusCode}`);
          console.log(`   Response: ${data}`);
        }
        console.log();
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}\n`);
      resolve();
    });

    req.write(testData);
    req.end();
  });
}

// Test 3: Test Database Connection
async function testDatabase() {
  console.log('3️⃣ Testing Database Connection...');
  console.log(`   URL: ${BACKEND_URL}/api/admin/stats`);
  
  return new Promise((resolve) => {
    const url = new URL(`${BACKEND_URL}/api/admin/stats`);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'x-admin-key': 'byu-admin-2025-secret-key'
      }
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ Database connection works!');
          try {
            const json = JSON.parse(data);
            console.log(`   Total Students: ${json.data.totalStudents}`);
            console.log(`   Total Requests: ${json.data.totalRequests}`);
            console.log(`   Pending Requests: ${json.data.pendingRequests}`);
          } catch (e) {
            console.log(`   Response: ${data}`);
          }
        } else {
          console.log(`   ❌ Status: ${res.statusCode}`);
          console.log(`   Response: ${data}`);
        }
        console.log();
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}\n`);
      resolve();
    });

    req.end();
  });
}

// Test 4: Frontend Accessibility
async function testFrontend() {
  console.log('4️⃣ Testing Frontend...');
  console.log(`   URL: ${FRONTEND_URL}`);
  
  return new Promise((resolve) => {
    const url = new URL(FRONTEND_URL);
    const protocol = url.protocol === 'https:' ? https : http;
    
    protocol.get(url, (res) => {
      if (res.statusCode === 200) {
        console.log('   ✅ Frontend is accessible!');
        console.log(`   Status: ${res.statusCode}`);
      } else {
        console.log(`   ⚠️  Status: ${res.statusCode}`);
      }
      console.log();
      resolve();
    }).on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      console.log('   Make sure your Vercel frontend URL is correct!\n');
      resolve();
    });
  });
}

// Run all tests
async function runAllTests() {
  if (BACKEND_URL === 'YOUR_RAILWAY_URL' || FRONTEND_URL === 'YOUR_VERCEL_URL') {
    console.log('❌ Please provide your URLs:\n');
    console.log('Usage: node test-production-endpoints.js <BACKEND_URL> <FRONTEND_URL>\n');
    console.log('Example:');
    console.log('  node test-production-endpoints.js https://byu-backend.up.railway.app https://byu-frontend.vercel.app\n');
    return;
  }

  await testBackendHealth();
  await testRegistration();
  await testDatabase();
  await testFrontend();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Testing Complete!\n');
  console.log('📝 Next Steps:');
  console.log('   1. Open your Vercel URL in a browser');
  console.log('   2. Test student registration manually');
  console.log('   3. Test payment request');
  console.log('   4. Test admin dashboard\n');
}

runAllTests();

