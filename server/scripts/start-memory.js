/**
 * One-command development server for machines without MongoDB installed.
 *
 *   npm run dev:memory
 *
 * Starts an in-memory MongoDB, seeds it with sample data and then runs the API.
 * The data disappears when you stop the server (that is the point - it is a demo).
 * For real data use MongoDB Atlas or a local MongoDB install instead.
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const localEnv = path.join(__dirname, '..', '.env');
const rootEnv = path.join(__dirname, '..', '..', '.env');
dotenv.config({ path: fs.existsSync(localEnv) ? localEnv : rootEnv });

process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me-before-deploying';
require('../config/memoryMongo');

async function main() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongoose = require('mongoose');

  console.log('Starting in-memory MongoDB...');
  const memoryServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = memoryServer.getUri();
  console.log('In-memory MongoDB at', process.env.MONGODB_URI);

  // server.js connects to MongoDB and starts listening
  require('../server.js');

  await new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) return resolve();
    mongoose.connection.once('open', resolve);
    mongoose.connection.once('error', resolve);
  });

  const { runSeed } = require('../seed/seed');
  await runSeed();

  const shutdown = async () => {
    try {
      await mongoose.connection.close();
      await memoryServer.stop();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Could not start the in-memory server:', err.message);
  console.error('Tip: run "npm run mongo:prepare" once to download the MongoDB binary.');
  process.exit(1);
});
