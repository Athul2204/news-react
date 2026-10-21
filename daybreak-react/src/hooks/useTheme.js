import { useCallback, useEffect, useState } from 'react';
import { readStorage, writeStorage } from '../lib/storage';

const KEY = 'daybreak:theme';
const query = '(prefers-color-scheme: dark)';

function currentIsDark() {
  const t = document.documentElement.getAttribute('data-theme');
  return t ? t === 'dark' : window.matchMedia(query).matches;
}

/* Light / dark switch. Without a saved choice the device setting is used (see tokens.css). */
export function useTheme() {
  const [dark, setDark] = useState(currentIsDark);

  useEffect(() => {
    const saved = readStorage(KEY);
    if (saved === 'light' || saved === 'dark') document.documentElement.setAttribute('data-theme', saved);
    setDark(currentIsDark());
  }, []);

  const toggle = useCallback(() => {
    const next = currentIsDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    writeStorage(KEY, next);
    setDark(next === 'dark');
  }, []);

  return { dark, toggle };
}
