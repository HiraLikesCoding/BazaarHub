import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to the client/ folder (the Next.js project root). */
export const ROOT_DIR = path.resolve(__dirname, '..', '..');

/**
 * Loads .env.local and .env into process.env.
 *
 * Next.js does this automatically for app code, but our standalone scripts
 * (dev, seed, tests) run under plain Node, so they need the same variables.
 * Existing values are never overwritten.
 */
export function loadEnv() {
  for (const filename of ['.env.local', '.env']) {
    const filePath = path.join(ROOT_DIR, filename);
    if (!fs.existsSync(filePath)) continue;

    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;

      let value = match[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[match[1]] === undefined) {
        process.env[match[1]] = value;
      }
    }
  }
}
