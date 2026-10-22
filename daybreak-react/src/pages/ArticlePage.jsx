import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import NewsCard from '../components/NewsCard';
import { ChevronLeftIcon, BookmarkIcon } from '../components/Icons';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { useReadingTimer } from '../hooks/useReadingTimer';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/* A row of suggested stories under the article */
function Suggestions({ title, hint, items, origin }) {
  if (!items.length) return null;
  return (
    <section className="suggestions" aria-label={title}>
      <h2 className="suggestions__title">{title}</h2>
      <p className="suggestions__hint">{hint}</p>
      <ul className="news-grid suggestions__grid">
        {items.map((s) => <NewsCard key={s.id} story={s} origin={origin} />)}
      </ul>
    </section>
  );
}

/* One story, at /article/:id. Records how long it is read, and suggests similar stories. */
export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { data, error, loading, setData } = useAsync((signal) => api.get(`/news/${id}`, { signal }), [id]);
  const story = data && String(data.id) === id ? data : null;     // never show the previous story while the next loads

  const similar = useAsync((signal) => api.get(`/news/${id}/similar?limit=6`, { signal }), [id]);
  const picks = useAsync((signal) => api.get(`/recommendations?limit=10&exclude=${id}`, { signal }), [id]);
  const similarItems = similar.data?.items || [];
  const similarIds = new Set(similarItems.map((s) => s.id));
  const pickItems = (picks.data?.items || []).filter((s) => !similarIds.has(s.id)).slice(0, 4);

  useReadingTimer(story ? story.id : null, location.state?.origin || 'other');
  useDocumentTitle(story ? story.title : loading ? 'Loading…' : 'Story not found');
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  /* "Back" returns to the same feed page when we came from a story list */
  const back = (event) => {
    if (location.state?.fromList) { event.preventDefault(); navigate(-1); }
  };

  const toggleSave = async () => {
    const next = !story.saved;
    setData((s) => ({ ...s, saved: next }));                      // optimistic
    try { await (next ? api.put(`/saved/${story.id}`) : api.del(`/saved/${story.id}`)); }
    catch { setData((s) => ({ ...s, saved: !next })); }
  };

  return (
    <>
      <article className="article">
        <Link className="article__back" to="/dashboard" onClick={back}>
          <ChevronLeftIcon size={16} /> Back to stories
        </Link>
        <div>
          {!story && loading ? <p className="article__text" role="status">Loading story…</p> : null}
          {!story && !loading ? (
            <>
              <h1 className="article__title">Story not found</h1>
              <p className="article__text">{error?.status === 404 || !error ? 'We couldn’t find that story.' : error.message} <Link className="text-link" to="/dashboard">Go back to the news feed</Link>.</p>
            </>
          ) : null}
          {story ? (
            <>
              <p className="article__category" style={{ '--hue': story.hue }}>{story.category}</p>
              <h1 className="article__title" tabIndex={-1}>{story.title}</h1>
              <p className="article__meta">
                <span>{story.source}</span>
                {story.time ? <span>{story.time}</span> : null}
                {story.readMinutes ? <span>{story.readMinutes} min read</span> : null}
              </p>
              <button className={`article__save${story.saved ? ' is-saved' : ''}`} type="button" aria-pressed={story.saved} onClick={toggleSave}>
                <BookmarkIcon size={18} fill={story.saved ? 'currentColor' : 'none'} />
                <span>{story.saved ? 'Saved' : 'Save'}</span>
              </button>
              {story.image ? <img className="article__image" decoding="async" width="320" height="180" src={story.image} alt="" /> : null}
              {story.summary ? <p className="article__lead">{story.summary}</p> : null}
              {story.content.map((p, i) => <p className="article__text" key={i}>{p}</p>)}
              {story.tags.length ? (
                <ul className="article__tags" aria-label="Tags">{story.tags.map((t) => <li key={t}>{t}</li>)}</ul>
              ) : null}
              <a className="btn btn--primary article__readmore" href={story.url} target="_blank" rel="noopener noreferrer">
                Read the full story on {story.source}
              </a>
            </>
          ) : null}
        </div>
      </article>

      {story ? (
        <aside className="article-suggestions">
          <Suggestions title="Similar stories" hint="Covering the same topic or event." items={similarItems} origin="similar" />
          <Suggestions title="You might like" hint="Picked from what you read and the topics you follow." items={pickItems} origin="recommended" />
        </aside>
      ) : null}
    </>
  );
}
