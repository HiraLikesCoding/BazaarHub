import os from 'node:os';
import path from 'node:path';

/**
 * Points mongodb-memory-server at the MongoDB binary that is already cached
 * in your home folder (~/.bazaarhub-mongodb), so nothing is downloaded twice.
 */
export function configureMongoBinary() {
  if (!process.env.MONGOMS_VERSION) process.env.MONGOMS_VERSION = '7.0.14';
  if (!process.env.MONGOMS_DOWNLOAD_DIR) {
    process.env.MONGOMS_DOWNLOAD_DIR = path.join(os.homedir(), '.bazaarhub-mongodb');
  }
}

/**
 * Boots a throwaway MongoDB. Returns the server instance - remember to call
 * `.stop()` when your script finishes, otherwise the process hangs.
 */
export async function startMemoryMongo() {
  configureMongoBinary();
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  return MongoMemoryServer.create();
}
