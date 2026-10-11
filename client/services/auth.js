/**
 * Auth against Supabase Auth + public.profiles.
 *
 * Replaces the Express /api/auth/* endpoints. The handle_new_user() trigger
 * creates the profile row on signup, and the returned user keeps the same
 * shape ({ _id, name, email, role, ... }) the components already read.
 */
import { getSupabase } from '@/lib/supabase';

const PROFILE_COLUMNS = 'id,name,email,role,phone,created_at,updated_at';

export function toUserDto(profile) {
  if (!profile) return null;
  return {
    _id: profile.id,
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    phone: profile.phone || '',
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

async function loadProfile(userId, authUser) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  if (data) return toUserDto(data);

  // No profile row yet (trigger lag or pending email confirmation):
  // fall back to what Auth knows so the UI still has a name.
  return toUserDto({
    id: userId,
    name: (authUser && authUser.user_metadata && authUser.user_metadata.name) || '',
    email: (authUser && authUser.email) || '',
    role: 'customer',
    phone: '',
  });
}

export async function register({ name, email, password }) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw new Error(error.message);

  // With email confirmation enabled there is no session yet - the old flow
  // logged people in immediately, so surface a clear message instead.
  if (!data.session) {
    throw new Error('Almost there - confirm your email address, then sign in.');
  }
  return loadProfile(data.user.id, data.user);
}

export async function login({ email, password }) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return loadProfile(data.user.id, data.user);
}

export async function fetchMe() {
  const sb = getSupabase();
  const { data } = await sb.auth.getSession();
  const authUser = data.session && data.session.user;
  if (!authUser) return null;
  return loadProfile(authUser.id, authUser);
}

export async function updateProfile(payload) {
  const sb = getSupabase();
  const { data } = await sb.auth.getSession();
  const authUser = data.session && data.session.user;
  if (!authUser) throw new Error('You must be signed in to update your profile.');

  const patch = {};
  if (payload.name !== undefined) patch.name = payload.name;
  if (payload.phone !== undefined) patch.phone = payload.phone;
  if (Object.keys(patch).length === 0) return loadProfile(authUser.id, authUser);

  const { data: updated, error } = await sb
    .from('profiles')
    .update(patch)
    .eq('id', authUser.id)
    .select(PROFILE_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toUserDto(updated);
}
