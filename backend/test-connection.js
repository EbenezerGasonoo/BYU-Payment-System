// Quick MySQL (XAMPP) connectivity smoke test
require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'byu_payment'
};

console.log(`Testing MySQL connection at ${config.user}@${config.host}:${config.port}...\n`);

(async () => {
  try {
    // Connect without selecting a database first so we can verify the server is up
    // even if the target DB doesn't exist yet.
    const conn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });

    const [rows] = await conn.query('SELECT VERSION() AS version');
    console.log(`✅ MySQL is reachable. Server version: ${rows[0].version}`);

    const [dbs] = await conn.query(
      `SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [config.database]
    );
    if (dbs.length) {
      console.log(`✅ Database "${config.database}" exists.`);
    } else {
      console.log(`ℹ️  Database "${config.database}" does not exist yet — the server will create it on startup.`);
    }

    await conn.end();
    console.log('\nYou can start the backend now.\n');
    process.exit(0);
  } catch (error) {
    console.log('❌ MySQL connection failed!\n');
    console.log('Error:', error.message);
    console.log('\n🔧 To fix this:');
    console.log('   1. Open the XAMPP Control Panel.');
    console.log('   2. Make sure "MySQL" is started (green).');
    console.log('   3. If you set a password for `root`, put it in backend/.env (MYSQL_PASSWORD).');
    console.log('   4. Default XAMPP creds: user=root, password=(empty), port=3306.\n');
    process.exit(1);
  }
})();
