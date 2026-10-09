/**
 * One-command development setup:
 *
 *   npm run dev
 *
 * 1. reads client/.env.local
 * 2. starts an in-memory MongoDB when MONGODB_URI is not set
 * 3. runs `next dev` with that connection string
 *
 * Everything is deleted when you stop the server - that is the point of the
 * in-memory database. Add a real MONGODB_URI to .env.local to keep your data.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { loadEnv, ROOT_DIR } from './lib/env.mjs';
import { startMemoryMongo } from './lib/mongoms.mjs';

loadEnv();

let memory = null;
let nextProcess = null;
let shuttingDown = false;

async function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill();
    nextProcess = null;
  }
  if (memory) {
    try {
      await memory.stop();
    } catch {
      /* already stopped */
    }
    memory = null;
  }
  process.exit(code);
}

async function main() {
  if (process.env.MONGODB_URI) {
    console.log('[dev] Using MONGODB_URI from your environment / .env.local');
  } else {
    console.log('[dev] No MONGODB_URI found - starting an in-memory MongoDB...');
    memory = await startMemoryMongo();
    process.env.MONGODB_URI = memory.getUri();
    console.log('[dev] In-memory MongoDB ready at', process.env.MONGODB_URI);
    console.log('[dev] Data is temporary. Run "npm run seed" to load the demo catalogue.');
  }

  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'dev-only-secret-change-me-before-deploying';
    console.log('[dev] JWT_SECRET not set - using a development-only value.');
  }

  const nextBin = path.join(ROOT_DIR, 'node_modules', 'next', 'dist', 'bin', 'next');
  nextProcess = spawn(process.execPath, [nextBin, 'dev'], {
    cwd: ROOT_DIR,
    env: process.env,
    stdio: 'inherit',
    windowsHide: true,
  });

  nextProcess.on('exit', (code) => shutdown(code ?? 0));
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

main().catch((err) => {
  console.error('[dev] Could not start:', err.message);
  shutdown(1);
});
