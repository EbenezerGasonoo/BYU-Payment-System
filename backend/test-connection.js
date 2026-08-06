// Quick Supabase / PostgreSQL connectivity smoke test
require('dotenv').config();
const { connectDB, sequelize } = require('./config/database');

(async () => {
  const hasUrl = !!(process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL);
  console.log(`Testing ${hasUrl ? 'Supabase (DATABASE_URL)' : 'PostgreSQL'} connection...\n`);

  try {
    const connection = await connectDB();
    if (!connection) {
      throw new Error('connectDB() returned null');
    }

    const [rows] = await sequelize.query('SELECT version() AS version');
    console.log(`✅ PostgreSQL is reachable.`);
    console.log(`   ${rows[0].version.split(',')[0]}`);

    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('students', 'card_requests', 'contact_messages', 'chat_messages')
      ORDER BY table_name
    `);

    if (tables.length) {
      console.log(`✅ App tables found: ${tables.map((t) => t.table_name).join(', ')}`);
    } else {
      console.log('ℹ️  App tables not created yet — they will be created on first server start.');
    }

    await sequelize.close();
    console.log('\nYou can start the backend now.\n');
    process.exit(0);
  } catch (error) {
    console.log('❌ PostgreSQL connection failed!\n');
    console.log('Error:', error.message);
    console.log('\n🔧 To fix this:');
    console.log('   1. Create a project at https://supabase.com');
    console.log('   2. Go to Project Settings → Database → Connection string (URI)');
    console.log('   3. Copy the URI and set DATABASE_URL in backend/.env');
    console.log('   4. Use the "Session" pooler URI for long-running servers (Railway)');
    console.log('   5. Replace [YOUR-PASSWORD] with your database password\n');
    process.exit(1);
  }
})();
