import { useCallback, useEffect, useRef, useState } from 'react';

/* Runs `fn(signal)` when `deps` change. Returns { data, error, loading, reload, setData }.
   A slower, older request can never overwrite a newer one. */
export function useAsync(fn, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef.current(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setState({ data, error: null, loading: false }); })
      .catch((error) => { if (error.name !== 'AbortError' && !controller.signal.aborted) setState((s) => ({ data: s.data, error, loading: false })); });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })), []);
  return { ...state, reload, setData };
}
