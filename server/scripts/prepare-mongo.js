/**
 * Optional helper: downloads a MongoDB binary so you can run the API
 * without installing MongoDB on your machine.
 *
 *   node scripts/prepare-mongo.js
 *
 * The binary is cached in your home folder (~/.bazaarhub-mongodb),
 * so this only needs to run once.
 */
const memory = require('../config/memoryMongo');

async function main() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  console.log(`Downloading MongoDB ${memory.version} (one time, may take a few minutes)...`);
  const server = await MongoMemoryServer.create();
  console.log('MongoDB ready at', server.getUri());
  await server.stop();
  console.log('Done. Binary cached in', memory.downloadDir);
}

main().catch((err) => {
  console.error('Download failed:', err.message);
  process.exit(1);
});
