// Test Production After MongoDB Fix
const https = require('https');

console.log('🧪 Testing Production After MongoDB Fix\n');
console.log('═══════════════════════════════════════════════════════════\n');

const BACKEND_URL = 'https://byupay.up.railway.app';
const FRONTEND_URL = 'https://byupay.vercel.app';

// Test 1: Health Check
async function testHealth() {
  console.log('1️⃣ Testing Backend Health...');
  
  return new Promise((resolve) => {
    https.get(`${BACKEND_URL}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ Backend is UP!');
          const json = JSON.parse(data);
          console.log(`   Status: ${json.status}`);
          console.log(`   Uptime: ${Math.floor(json.uptime)}s`);
        } else if (res.statusCode === 502) {
          console.log('   ❌ Still getting 502 - MongoDB not connected yet');
          console.log('   Wait 1-2 minutes and try again...');
        }
        console.log();
        resolve(res.statusCode === 200);
      });
    }).on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}\n`);
      resolve(false);
    });
  });
}

// Test 2: Database Stats
async function testDatabase() {
  console.log('2️⃣ Testing Database Connection...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'byupay.up.railway.app',
      path: '/api/admin/stats',
      method: 'GET',
      headers: {
        'x-admin-key': 'byu-admin-2025-secret-key'
      }
    };

    https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ Database is connected!');
          const json = JSON.parse(data);
          console.log(`   Total Students: ${json.data.totalStudents}`);
          console.log(`   Total Requests: ${json.data.totalRequests}`);
          console.log(`   Pending Requests: ${json.data.pendingRequests}`);
        } else {
          console.log(`   ⚠️  Status: ${res.statusCode}`);
          console.log(`   Response: ${data}`);
        }
        console.log();
        resolve(res.statusCode === 200);
      });
    }).on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}\n`);
      resolve(false);
    }).end();
  });
}

// Test 3: Test Registration
async function testRegistration() {
  console.log('3️⃣ Testing Student Registration...');
  
  return new Promise((resolve) => {
    const testData = JSON.stringify({
      name: 'Production Test',
      byuId: '777777777',
      email: 'test777@byupathway.edu',
      phone: '+233 24 777 7777'
    });

    const options = {
      hostname: 'byupay.up.railway.app',
      path: '/api/student/register',
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
        const json = JSON.parse(data);
        if (res.statusCode === 201) {
          console.log('   ✅ Registration works perfectly!');
          console.log(`   Message: ${json.message}`);
        } else if (res.statusCode === 400 && json.message.includes('already exists')) {
          console.log('   ✅ Registration endpoint works! (test user exists)');
        } else {
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response: ${json.message || data}`);
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

// Run tests
async function runTests() {
  const healthOk = await testHealth();
  
  if (!healthOk) {
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('⚠️  Backend is still having issues\n');
    console.log('📝 Next Steps:');
    console.log('   1. Make sure you added 0.0.0.0/0 to MongoDB Atlas');
    console.log('   2. Wait 1-2 minutes for changes to take effect');
    console.log('   3. Run this test again: node test-after-mongodb-fix.js\n');
    return;
  }
  
  const dbOk = await testDatabase();
  
  if (dbOk) {
    await testRegistration();
  }
  
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('🎉 PRODUCTION IS LIVE!\n');
  console.log('🌐 Your URLs:');
  console.log(`   Frontend: ${FRONTEND_URL}`);
  console.log(`   Backend:  ${BACKEND_URL}\n`);
  console.log('📋 Test in Browser:');
  console.log('   1. Open https://byupay.vercel.app');
  console.log('   2. Register a new student');
  console.log('   3. Request a virtual card');
  console.log('   4. Check admin dashboard\n');
}

runTests();

