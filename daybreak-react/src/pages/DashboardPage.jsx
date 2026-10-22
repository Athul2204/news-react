import { useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NewsCard from '../components/NewsCard';
import Pager from '../components/Pager';
import CategoryTabs from '../components/CategoryTabs';
import { api, qs } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { usePageParam } from '../hooks/usePageParam';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PER_PAGE = 10;

export default function DashboardPage() {
  useDocumentTitle('Dashboard');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const category = params.get('category') || '';
  const [page, setPage] = usePageParam(null);
  const titleRef = useRef(null);

  const { data, error, loading, reload } = useAsync(
    (signal) => api.get(`/news${qs({ page, per_page: PER_PAGE, category })}`, { signal }),
    [page, category]);

  const items = data?.items || [];
  const total = data?.total || 0;
  const start = (page - 1) * PER_PAGE;

  const goTo = (n) => {
    setPage(n);
    window.scrollTo(0, 0);
    titleRef.current?.focus({ preventScroll: true });
  };
  /* changing the category starts again at page 1 */
  const pick = (c) => navigate({ pathname: '/dashboard', search: c ? `?category=${encodeURIComponent(c)}` : '', hash: '' });

  return (
    <section className="news-feed" aria-labelledby="news-feed-title">
      <header className="news-feed__header">
        <h1 className="news-feed__title" id="news-feed-title" ref={titleRef} tabIndex={-1}>{category || 'Top stories'}</h1>
        <p className="news-feed__status" aria-live="polite">
          {total ? <><span className="news-feed__status-label">Showing </span>{start + 1}–{start + items.length} of {total}</> : ''}
        </p>
      </header>

      <CategoryTabs value={category} onChange={pick} />

      {error ? (
        <p className="saved-empty" role="alert">{error.message} <button className="text-link" type="button" onClick={reload}>Try again</button></p>
      ) : null}
      {!error && !loading && !items.length ? (
        <p className="saved-empty">No stories in this category yet. Run the collector to fetch the latest news.</p>
      ) : null}

      <ul className="news-grid" aria-busy={loading}>
        {items.map((story) => <NewsCard key={story.id} story={story} origin="feed" />)}
      </ul>
      {loading && !items.length ? <p className="saved-empty" role="status">Loading stories…</p> : null}
      <Pager page={page} total={data?.totalPages || 1} onChange={goTo} />
    </section>
  );
}
