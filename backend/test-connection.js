// Quick test to see what's preventing server startup
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...\n');

mongoose.connect('mongodb://localhost:27017/byu_virtual', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB is connected and working!');
  console.log('You can start the servers now.\n');
  process.exit(0);
})
.catch((error) => {
  console.log('❌ MongoDB Connection Failed!\n');
  console.log('Error:', error.message);
  console.log('\n📋 This means MongoDB is not installed or not running.');
  console.log('\n🔧 To fix this:');
  console.log('   1. Download MongoDB from: https://www.mongodb.com/try/download/community');
  console.log('   2. Install it (choose "Complete" installation)');
  console.log('   3. MongoDB will run as a Windows service automatically');
  console.log('   4. Then try starting the servers again\n');
  console.log('See MONGODB_SETUP.md for detailed instructions.\n');
  process.exit(1);
});

