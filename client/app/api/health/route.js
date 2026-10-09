import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db/connect';

// Always runs on the server and never uses the page cache
export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Tiny service check used by the dev scripts, the smoke tests and uptime
 * monitors. Confirms both that the API is up and that MongoDB is reachable.
 */
export async function GET() {
  try {
    await connectDB();

    return NextResponse.json(
      {
        success: true,
        message: 'BazaarHub API is running',
        database: {
          status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          name: mongoose.connection.name || null,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: err.message,
        database: { status: 'disconnected', name: null },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
