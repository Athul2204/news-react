import { useCallback, useState } from 'react';
import { readStorage, writeStorage } from '../lib/storage';

const json = { decode: (raw) => JSON.parse(raw), encode: (v) => JSON.stringify(v) };

/* useState that persists to localStorage. Pass { decode, encode } for non-JSON formats
   (e.g. the "on"/"off" string used by daybreak:related). */
export function useLocalStorage(key, initial, codec = json) {
  const [value, setValue] = useState(() => {
    const raw = readStorage(key);
    if (raw === null) return initial;
    try { return codec.decode(raw); } catch { return initial; }
  });

  const set = useCallback((next) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      writeStorage(key, codec.encode(resolved));
      return resolved;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, set];
}
