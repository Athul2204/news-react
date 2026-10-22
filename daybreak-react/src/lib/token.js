/* Session token. "Keep me logged in" -> localStorage (survives closing the browser);
   otherwise sessionStorage (gone when the tab closes). */
const KEY = 'daybreak:token';

const safe = (fn) => { try { return fn(); } catch { return null; } };

export const getToken = () =>
  safe(() => sessionStorage.getItem(KEY)) || safe(() => localStorage.getItem(KEY)) || null;

export function setToken(token, remember) {
  clearToken();
  safe(() => (remember ? localStorage : sessionStorage).setItem(KEY, token));
}

export function clearToken() {
  safe(() => sessionStorage.removeItem(KEY));
  safe(() => localStorage.removeItem(KEY));
}
