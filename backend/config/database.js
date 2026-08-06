const { Sequelize } = require('sequelize');

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

const DB_HOST = process.env.SUPABASE_DB_HOST || process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.SUPABASE_DB_PORT || process.env.DB_PORT || '5432', 10);
const DB_USER = process.env.SUPABASE_DB_USER || process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD || '';
const DB_NAME = process.env.SUPABASE_DB_NAME || process.env.DB_NAME || 'postgres';

// Supabase requires SSL; set DB_SSL=false only for local Postgres without TLS.
const useSsl = process.env.DB_SSL !== 'false';

const commonOptions = {
  dialect: 'postgres',
  logging: false,
  define: {
    timestamps: true,
    updatedAt: false,
    underscored: false
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, {
      ...commonOptions,
      dialectOptions: useSsl
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {}
    })
  : new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      ...commonOptions,
      host: DB_HOST,
      port: DB_PORT,
      dialectOptions: useSsl
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {}
    });

let dbReady = false;

const getConnectionLabel = () => {
  if (DATABASE_URL) {
    try {
      const url = new URL(DATABASE_URL);
      return `Supabase PostgreSQL @ ${url.hostname}`;
    } catch {
      return 'Supabase PostgreSQL (DATABASE_URL)';
    }
  }
  return `PostgreSQL @ ${DB_HOST}:${DB_PORT}/${DB_NAME}`;
};

const connectDB = async () => {
  if (!DATABASE_URL && !DB_PASSWORD && DB_HOST.includes('supabase')) {
    console.warn('⚠️  Set DATABASE_URL or SUPABASE_DB_PASSWORD in backend/.env');
  }

  try {
    await sequelize.authenticate();
    console.log(`✅ ${getConnectionLabel()} connected`);

    const { syncModels } = require('../models');
    await syncModels();

    dbReady = true;
    return sequelize;
  } catch (error) {
    dbReady = false;
    console.error('PostgreSQL connection error:', error.message);
    console.warn('Server will continue without database. Some features may not work.');
    return null;
  }
};

const isConnected = () => dbReady;

const pingDB = async () => {
  if (!dbReady) return false;
  try {
    await sequelize.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};

module.exports = { sequelize, connectDB, isConnected, pingDB };
