/**
 * Shared mongodb-memory-server configuration.
 * Require this BEFORE using MongoMemoryServer so every script looks for the
 * binary in the same cached folder (instead of downloading it again).
 */
const os = require('os');
const path = require('path');

process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '7.0.14';
process.env.MONGOMS_DOWNLOAD_DIR =
  process.env.MONGOMS_DOWNLOAD_DIR || path.join(os.homedir(), '.bazaarhub-mongodb');

module.exports = {
  version: process.env.MONGOMS_VERSION,
  downloadDir: process.env.MONGOMS_DOWNLOAD_DIR,
};
