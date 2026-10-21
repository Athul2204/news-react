import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/* Current page number kept in the URL hash (#page=3), so refresh and the Back button
   return to the same page. Returns [page, setPage] with page clamped to 1..total. */
export function usePageParam(total) {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const match = /page=(\d+)/.exec(hash);
  const raw = match ? parseInt(match[1], 10) : 1;
  const page = Math.min(Math.max(raw, 1), Math.max(total, 1));

  const setPage = useCallback((n) => {
    navigate({ hash: `#page=${n}` }, { replace: true });
  }, [navigate]);

  return [page, setPage];
}
