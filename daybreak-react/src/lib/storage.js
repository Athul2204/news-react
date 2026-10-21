/* Safe localStorage helpers: never throw when storage is unavailable. */
export function readStorage(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function writeStorage(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}
