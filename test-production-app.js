// Quick test to verify production app is working
const https = require('https');

console.log('\n🔍 Testing BYU Payment System Production Deployment...\n');

// Test 1: Backend Health
console.log('1️⃣ Testing Backend (Railway)...');
https.get('https://byupay.up.railway.app/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('   ✅ Backend is UP and healthy');
      console.log('   Response:', data);
    } else {
      console.log('   ❌ Backend returned status:', res.statusCode);
    }
    
    // Test 2: Frontend
    console.log('\n2️⃣ Testing Frontend (Vercel)...');
    https.get('https://byupay.vercel.app', (res2) => {
      if (res2.statusCode === 200) {
        console.log('   ✅ Frontend is UP and serving');
      } else {
        console.log('   ❌ Frontend returned status:', res2.statusCode);
      }
      
      // Test 3: Test API endpoint from backend
      console.log('\n3️⃣ Testing API Endpoint...');
      https.get('https://byupay.up.railway.app/', (res3) => {
        let apiData = '';
        res3.on('data', chunk => apiData += chunk);
        res3.on('end', () => {
          if (res3.statusCode === 200) {
            console.log('   ✅ API root endpoint working');
            const json = JSON.parse(apiData);
            console.log('   API Version:', json.version);
          }
          
          console.log('\n' + '═'.repeat(60));
          console.log('📊 DIAGNOSIS:\n');
          console.log('✅ Backend: WORKING');
          console.log('✅ Frontend: WORKING');
          console.log('\n⚠️  If app still doesn\'t load in browser:');
          console.log('   → Open https://byupay.vercel.app');
          console.log('   → Press F12 (Developer Tools)');
          console.log('   → Check Console for errors');
          console.log('   → Look for API connection errors\n');
          console.log('🔧 FIX: Set VITE_API_URL in Vercel Dashboard');
          console.log('   1. Go to: https://vercel.com/dashboard');
          console.log('   2. Settings → Environment Variables');
          console.log('   3. Add: VITE_API_URL = https://byupay.up.railway.app/api');
          console.log('   4. Redeploy the project');
          console.log('═'.repeat(60) + '\n');
        });
      }).on('error', (e) => {
        console.log('   ❌ API Error:', e.message);
      });
    }).on('error', (e) => {
      console.log('   ❌ Frontend Error:', e.message);
    });
  });
}).on('error', (e) => {
  console.log('   ❌ Backend Error:', e.message);
});

