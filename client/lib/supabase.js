import { createClient } from '@supabase/supabase-js';

/**
 * Supabase access for the storefront.
 *
 * One lazily created anon-key client is shared by browser and server code:
 * the public catalog reads are covered by RLS, so no session is needed yet.
 * The auth domain keeps its own client when it moves over.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return UUID_RE.test(String(value || '').trim());
}

/**
 * Escapes a user typed value for use inside a PostgREST quoted filter,
 * e.g. `name.ilike."%<escaped>%"`. Backslash-escapes LIKE wildcards so a
 * search for "50%" does not turn into a wildcard pattern.
 */
export function escapeFilterValue(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/"/g, '\\"');
}

/**
 * True while `next build` is prerendering pages.
 *
 * Same guard the Express-backed fetch wrapper used: bindings and env values
 * that only exist at runtime are unavailable in the build container, so
 * server components render their empty state and pick the data up on the
 * first runtime revalidation instead of stalling the build.
 */
export function isBuilding() {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

let client = null;

/** Shared Supabase client (anon key, public RLS reads). */
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY in client/.env.local and on Vercel.'
    );
  }

  if (!client) {
    client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}
