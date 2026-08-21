require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');

let mongoReady = false;

const connectMongoDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️  No MONGODB_URI set — skipping MongoDB connection.');
    return null;
  }

  try {
    await mongoose.connect(uri);
    mongoReady = true;
    const host = mongoose.connection.host;
    console.log(`✅ MongoDB Atlas connected @ ${host}`);
    return mongoose.connection;
  } catch (error) {
    mongoReady = false;
    console.error('❌ MongoDB connection error:', error.message);
    return null;
  }
};

const isMongoConnected = () => mongoReady;

const pingMongo = async () => {
  if (!mongoReady) return false;
  try {
    await mongoose.connection.db.admin().ping();
    return true;
  } catch {
    return false;
  }
};

module.exports = { connectMongoDB, isMongoConnected, pingMongo };
