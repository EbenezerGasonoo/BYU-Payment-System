const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

const DB_HOST = process.env.MYSQL_HOST || 'localhost';
const DB_PORT = parseInt(process.env.MYSQL_PORT || '3306', 10);
const DB_USER = process.env.MYSQL_USER || 'root';
const DB_PASSWORD = process.env.MYSQL_PASSWORD || '';
const DB_NAME = process.env.MYSQL_DATABASE || 'byu_payment';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: false,
  define: {
    timestamps: true,
    updatedAt: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Ensure the target database exists before Sequelize tries to use it. This makes
// fresh XAMPP setups work with zero manual SQL.
const ensureDatabaseExists = async () => {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD
  });
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
  } finally {
    await conn.end();
  }
};

const connectDB = async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log(`MySQL connected: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);

    // Lazy-require so models/index.js can import the sequelize instance from us
    // without triggering a circular dependency at module-load time.
    const { syncModels } = require('../models');
    await syncModels();

    return sequelize;
  } catch (error) {
    console.error('MySQL connection error:', error.message);
    console.warn('Server will continue without database. Some features may not work.');
    return null;
  }
};

const isConnected = () => {
  // Sequelize keeps a connection manager pool; check whether it has been initialized.
  const pool = sequelize.connectionManager?.pool;
  return !!(pool && pool.size > 0 && !pool._draining);
};

module.exports = { sequelize, connectDB, isConnected };
