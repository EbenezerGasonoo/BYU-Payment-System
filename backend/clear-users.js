require('dotenv').config();
const { sequelize, connectDB } = require('./config/database');
const { Student, CardRequest } = require('./models');

async function clearDatabase() {
  try {
    console.log('🔌 Connecting to MySQL...');
    const connection = await connectDB();
    if (!connection) {
      console.error('❌ Could not connect to MySQL. Aborting.');
      process.exit(1);
    }
    console.log('✅ Connected to MySQL');

    console.log('🗑️ Clearing card requests first (FK constraint to students)...');
    const requestCount = await CardRequest.destroy({ where: {}, truncate: true });
    console.log(`✅ Deleted ${requestCount} card requests.`);

    console.log('🗑️ Clearing students...');
    const studentCount = await Student.destroy({ where: {}, truncate: true });
    console.log(`✅ Deleted ${studentCount} students.`);

    console.log('✨ Database cleared successfully!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
