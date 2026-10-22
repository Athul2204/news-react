import { useEffect } from 'react';
import { api } from '../lib/api';

const START_DELAY_MS = 1000;   // a story open for less than a second is not counted (also skips React StrictMode's first mount)
const TICK_MS = 10000;         // how often the running total is sent to the server

/* Records one "view" of a story and how long it was actually on screen (tab visible).
     POST /views            when the reader has stayed on the story for a second
     PATCH /views/:id       every 10 s while visible, and when the tab is hidden / closed / the story changes
   The total is sent as an absolute number, so repeated or late requests cannot double count. */
export function useReadingTimer(newsId, origin = 'other') {
  useEffect(() => {
    if (!newsId) return undefined;

    let viewId = null;
    let seconds = 0;            // visible seconds so far
    let lastTick = null;        // timestamp when the current visible stretch began
    let sent = -1;
    let stopped = false;

    const visible = () => document.visibilityState === 'visible';
    const elapsed = () => (lastTick === null ? 0 : (Date.now() - lastTick) / 1000);
    const total = () => Math.floor(seconds + elapsed());

    const flush = (keepalive = false) => {
      if (viewId === null) return;
      const t = total();
      if (t === sent) return;
      sent = t;
      api.patch(`/views/${viewId}`, { seconds: t }, { keepalive }).catch(() => { sent = -1; });
    };

    const pause = () => { if (lastTick !== null) { seconds += elapsed(); lastTick = null; } };
    const resume = () => { if (lastTick === null && visible()) lastTick = Date.now(); };

    const onVisibility = () => {
      if (visible()) resume();
      else { pause(); flush(true); }
    };

    const starter = setTimeout(async () => {
      if (stopped) return;
      if (visible()) lastTick = Date.now() - START_DELAY_MS;   // count the second we waited
      try {
        const res = await api.post('/views', { news_id: newsId, origin });
        if (stopped) { viewId = res.id; flush(true); return; }
        viewId = res.id;
      } catch { /* history is best effort: never break reading */ }
    }, START_DELAY_MS);

    const interval = setInterval(() => flush(), TICK_MS);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onVisibility);

    return () => {
      stopped = true;
      clearTimeout(starter);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onVisibility);
      if (lastTick !== null || seconds > 0) { pause(); flush(true); }
    };
  }, [newsId, origin]);
}
