// Test BYU Payment Production Deployment
const https = require('https');

const FRONTEND_URL = 'https://byupay.vercel.app';
const BACKEND_URLS_TO_TRY = [
  'https://byupay.up.railway.app',
  'https://byu-payment-backend.up.railway.app',
  'https://byu-backend.up.railway.app'
];

console.log('🧪 Testing Production: https://byupay.vercel.app\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Test Frontend
async function testFrontend() {
  console.log('1️⃣ Testing Frontend Deployment...');
  console.log(`   URL: ${FRONTEND_URL}`);
  
  return new Promise((resolve) => {
    https.get(FRONTEND_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ Frontend is LIVE and accessible!');
          console.log(`   Status: ${res.statusCode} OK`);
          
          // Check if it's the React app
          if (data.includes('BYU') || data.includes('Payment') || data.includes('root')) {
            console.log('   ✅ React app loaded successfully!');
          }
        } else {
          console.log(`   ⚠️  Status: ${res.statusCode}`);
        }
        console.log();
        resolve(data);
      });
    }).on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}\n`);
      resolve(null);
    });
  });
}

// Check for backend URL in the page
async function findBackendUrl(htmlContent) {
  console.log('2️⃣ Checking Backend Configuration...');
  
  // Try to find API URL references in the HTML
  const apiUrlMatch = htmlContent ? htmlContent.match(/VITE_API_URL['":\s]+([^'"}\s]+)/i) : null;
  
  if (apiUrlMatch) {
    console.log(`   ℹ️  Found API URL in config: ${apiUrlMatch[1]}`);
    return apiUrlMatch[1];
  }
  
  // Try common Railway URLs
  console.log('   Testing common Railway URLs...\n');
  
  for (const url of BACKEND_URLS_TO_TRY) {
    try {
      const result = await testBackendUrl(url);
      if (result) return url;
    } catch (e) {
      // Continue to next URL
    }
  }
  
  return null;
}

// Test a specific backend URL
async function testBackendUrl(backendUrl) {
  console.log(`   Trying: ${backendUrl}/api/health`);
  
  return new Promise((resolve) => {
    https.get(`${backendUrl}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`   ✅ Backend found at: ${backendUrl}`);
          try {
            const json = JSON.parse(data);
            console.log(`   Status: ${json.status}`);
            console.log(`   Uptime: ${Math.floor(json.uptime)}s`);
          } catch (e) {}
          resolve(true);
        } else {
          console.log(`   ❌ Status: ${res.statusCode}`);
          resolve(false);
        }
      });
    }).on('error', () => {
      console.log(`   ❌ Not accessible`);
      resolve(false);
    });
  });
}

// Test Registration
async function testRegistration(backendUrl) {
  console.log('\n3️⃣ Testing Registration Endpoint...');
  console.log(`   URL: ${backendUrl}/api/student/register`);
  
  return new Promise((resolve) => {
    const testData = JSON.stringify({
      name: 'Production Test User',
      byuId: '888888888',
      email: 'prodtest@byupathway.edu',
      phone: '+233 24 888 8888'
    });

    const url = new URL(`${backendUrl}/api/student/register`);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 201) {
            console.log('   ✅ Registration works! Database connected!');
            console.log(`   Message: ${json.message}`);
          } else if (res.statusCode === 400 && json.message.includes('already exists')) {
            console.log('   ✅ Registration endpoint works! (Test user exists)');
            console.log(`   Database: Connected ✅`);
          } else {
            console.log(`   ⚠️  Status: ${res.statusCode}`);
            console.log(`   Message: ${json.message || data}`);
          }
        } catch (e) {
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

// Test Admin Endpoint
async function testAdmin(backendUrl) {
  console.log('4️⃣ Testing Admin Dashboard Access...');
  console.log(`   URL: ${backendUrl}/api/admin/stats`);
  
  return new Promise((resolve) => {
    const url = new URL(`${backendUrl}/api/admin/stats`);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'x-admin-key': 'byu-admin-2025-secret-key'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('   ✅ Admin endpoints working!');
            console.log(`   Total Students: ${json.data.totalStudents}`);
            console.log(`   Total Requests: ${json.data.totalRequests}`);
            console.log(`   Pending Requests: ${json.data.pendingRequests}`);
          } else {
            console.log(`   ⚠️  Status: ${res.statusCode}`);
            console.log(`   Response: ${data}`);
          }
        } catch (e) {
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

// Main test flow
async function runTests() {
  const htmlContent = await testFrontend();
  const backendUrl = await findBackendUrl(htmlContent);
  
  if (!backendUrl) {
    console.log('❌ Could not find backend URL!\n');
    console.log('📝 To fix this:');
    console.log('   1. Go to Railway dashboard and copy your backend URL');
    console.log('   2. Go to Vercel dashboard → Settings → Environment Variables');
    console.log('   3. Add: VITE_API_URL = <your-railway-url>/api');
    console.log('   4. Redeploy your frontend\n');
    return;
  }
  
  await testRegistration(backendUrl);
  await testAdmin(backendUrl);
  
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('✅ PRODUCTION TEST COMPLETE!\n');
  console.log('🌐 Your Live URLs:');
  console.log(`   Frontend: ${FRONTEND_URL}`);
  console.log(`   Backend:  ${backendUrl}\n`);
  console.log('📋 Next Steps:');
  console.log('   1. Open https://byupay.vercel.app in your browser');
  console.log('   2. Test student registration manually');
  console.log('   3. Test payment request');
  console.log('   4. Test admin dashboard with key: byu-admin-2025-secret-key\n');
}

runTests();

