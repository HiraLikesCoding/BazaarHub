import mongoose from 'mongoose';

/**
 * Cached MongoDB connection.
 *
 * Next.js reloads modules during development, so the connection is stored on
 * globalThis - otherwise every page render would open a brand new connection
 * until MongoDB refused us. The same helper is used by route handlers, by
 * server components and by the seed / test scripts.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is missing. Add it to client/.env.local (copy .env.example), or run "npm run dev" which starts an in-memory MongoDB for you.'
    );
  }

  const cached = globalThis._mongoose ?? (globalThis._mongoose = { conn: null, promise: null });

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow the next request to retry
    throw err;
  }

  return cached.conn;
}

/** Closes the connection - only used by scripts and tests. */
export async function disconnectDB() {
  const cached = globalThis._mongoose;
  if (!cached?.conn) return;
  await mongoose.connection.close();
  cached.conn = null;
  cached.promise = null;
}
