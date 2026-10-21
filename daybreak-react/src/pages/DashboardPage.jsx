import { useRef } from 'react';
import { NEWS_ITEMS } from '../data/news';
import NewsCard from '../components/NewsCard';
import Pager from '../components/Pager';
import { usePageParam } from '../hooks/usePageParam';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PER_PAGE = 10;

export default function DashboardPage() {
  useDocumentTitle('Dashboard');
  const total = Math.ceil(NEWS_ITEMS.length / PER_PAGE);
  const [page, setPage] = usePageParam(total);
  const titleRef = useRef(null);

  const start = (page - 1) * PER_PAGE;
  const slice = NEWS_ITEMS.slice(start, start + PER_PAGE);

  const goTo = (n) => {
    setPage(n);
    window.scrollTo(0, 0);
    titleRef.current?.focus({ preventScroll: true });
  };

  return (
    <section className="news-feed" aria-labelledby="news-feed-title">
      <header className="news-feed__header">
        <h1 className="news-feed__title" id="news-feed-title" ref={titleRef} tabIndex={-1}>Top stories</h1>
        <p className="news-feed__status" aria-live="polite">
          <span className="news-feed__status-label">Showing </span>{start + 1}–{start + slice.length} of {NEWS_ITEMS.length}
        </p>
      </header>
      <ul className="news-grid">
        {slice.map((story) => <NewsCard key={story.id} story={story} />)}
      </ul>
      <Pager page={page} total={total} onChange={goTo} />
    </section>
  );
}
