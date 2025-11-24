require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const CardRequest = require('./models/CardRequest');

async function clearDatabase() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🗑️ Clearing users...');
        const studentResult = await Student.deleteMany({});
        console.log(`✅ Deleted ${studentResult.deletedCount} students.`);

        // Optional: Clear card requests too since they depend on students
        console.log('🗑️ Clearing card requests (to avoid orphaned data)...');
        const requestResult = await CardRequest.deleteMany({});
        console.log(`✅ Deleted ${requestResult.deletedCount} card requests.`);

        console.log('✨ Database cleared successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing database:', error);
        process.exit(1);
    }
}

clearDatabase();
