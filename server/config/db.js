const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the connection string from MONGODB_URI.
 * The connection string never gets committed - it lives in .env files only.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is missing. Create a server/.env file (copy .env.example) and add your MongoDB connection string.'
    );
  }

  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

module.exports = connectDB;
