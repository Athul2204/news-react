import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/* Current page number kept in the URL hash (#page=3), so refresh and the Back button
   return to the same page. Returns [page, setPage]. `total` clamps the page to 1..total;
   pass null while the total is still unknown (e.g. data loading from the API). */
export function usePageParam(total) {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const match = /page=(\d+)/.exec(hash);
  const raw = match ? parseInt(match[1], 10) : 1;
  const max = total == null ? Infinity : Math.max(total, 1);
  const page = Math.min(Math.max(raw, 1), max);

  const setPage = useCallback((n) => {
    navigate({ hash: `#page=${n}`, search: window.location.search }, { replace: true });
  }, [navigate]);

  return [page, setPage];
}
