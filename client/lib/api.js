/**
 * Small fetch wrapper used by every service.
 * Adds the API base URL, JSON handling, auth headers and friendly errors.
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const TOKEN_KEY = 'bazaarhub_token';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

/** Builds "?a=1&b=2" and leaves out empty values. */
export function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) return;
    search.append(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function api(path, { method = 'GET', body, token, headers = {}, revalidate } = {}) {
  const authToken = token === undefined ? getToken() : token;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      // `next.revalidate` only applies when this runs inside Next.js server code
      ...(revalidate ? { next: { revalidate } } : { cache: 'no-store' }),
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach the server. Check that the API is running.', 0, null);
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(data?.message || `Request failed (${response.status})`, response.status, data);
  }

  return data;
}

export const get = (path, options) => api(path, { ...options, method: 'GET' });
export const post = (path, body, options) => api(path, { ...options, method: 'POST', body });
export const put = (path, body, options) => api(path, { ...options, method: 'PUT', body });
export const del = (path, options) => api(path, { ...options, method: 'DELETE' });
