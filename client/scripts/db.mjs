/**
 * Starts ONLY the in-memory MongoDB and keeps it running:
 *
 *   npm run db
 *
 * Handy when you want two terminals - one for the database and one for
 * `npm run dev:next`. Prints the connection string so you can paste it into
 * client/.env.local if you want other tools to reuse it.
 */
import { loadEnv } from './lib/env.mjs';
import { startMemoryMongo } from './lib/mongoms.mjs';

loadEnv();

async function main() {
  if (process.env.MONGODB_URI) {
    console.log('MONGODB_URI is already set in your environment:');
    console.log(' ', process.env.MONGODB_URI);
    console.log('Delete it from .env.local if you want the in-memory database instead.');
    return;
  }

  console.log('Starting an in-memory MongoDB...');
  const memory = await startMemoryMongo();
  const uri = memory.getUri();

  console.log('');
  console.log('  MONGODB_URI=' + uri);
  console.log('');
  console.log('Data is temporary and disappears when you stop this process.');
  console.log('Press Ctrl+C to stop.');

  const stop = async () => {
    try {
      await memory.stop();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  await new Promise(() => {}); // keep the process alive
}

main().catch((err) => {
  console.error('Could not start the database:', err.message);
  console.error('Tip: run "npm run db" once to download the MongoDB binary.');
  process.exit(1);
});
