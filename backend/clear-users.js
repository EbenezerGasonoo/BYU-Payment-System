require('dotenv').config();
const { sequelize, connectDB } = require('./config/database');
const { Student, CardRequest } = require('./models');

async function clearDatabase() {
  if (process.env.CONFIRM_CLEAR !== 'yes') {
    console.error('❌ Refusing to run: set CONFIRM_CLEAR=yes to confirm database wipe.');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...');
    const connection = await connectDB();
    if (!connection) {
      console.error('❌ Could not connect to database. Aborting.');
      process.exit(1);
    }
    console.log('✅ Connected');

    console.log('🗑️ Clearing card requests and students...');
    await sequelize.query('TRUNCATE TABLE card_requests, students RESTART IDENTITY CASCADE');
    console.log('✅ Tables truncated.');

    console.log('✨ Database cleared successfully!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
