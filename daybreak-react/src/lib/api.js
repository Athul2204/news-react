import { clearToken, getToken } from './token';

const BASE = import.meta.env.VITE_API_URL || '';

/* Error with the server's message; `field` names the form field it is about (if any). */
export class ApiError extends Error {
  constructor(message, status, field) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

async function request(path, { method = 'GET', body, auth = true, keepalive = false, signal } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method, headers, keepalive, signal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Can’t reach the server. Check your connection and try again.', 0);
  }

  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    if (res.status === 401 && token) {          // expired or revoked session
      clearToken();
      window.dispatchEvent(new Event('daybreak:unauthorized'));
    }
    throw new ApiError(data?.detail || 'Something went wrong. Try again.', res.status, data?.field);
  }
  return data;
}

/* ?a=1&b=2 from an object, skipping empty values */
export const qs = (params) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString();
  return s ? `?${s}` : '';
};

export const api = {
  get: (path, opts) => request(path, opts),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...opts }),
  put: (path, body, opts) => request(path, { method: 'PUT', body, ...opts }),
  patch: (path, body, opts) => request(path, { method: 'PATCH', body, ...opts }),
  del: (path, opts) => request(path, { method: 'DELETE', ...opts }),
};
