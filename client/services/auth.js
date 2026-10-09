import { get, post, put } from '@/lib/api';

export async function register(payload) {
  const data = await post('/api/auth/register', payload);
  return data.data; // { token, user }
}

export async function login(payload) {
  const data = await post('/api/auth/login', payload);
  return data.data; // { token, user }
}

export async function fetchMe(token) {
  const data = await get('/api/auth/me', token ? { token } : undefined);
  return data.data.user;
}

export async function updateProfile(payload) {
  const data = await put('/api/auth/me', payload);
  return data.data.user;
}
