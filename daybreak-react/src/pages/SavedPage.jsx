import NewsCard from '../components/NewsCard';
import { CloseIcon, PlusIcon } from '../components/Icons';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const onOff = { decode: (raw) => raw === 'on', encode: (v) => (v ? 'on' : 'off') };   // keeps the original "on"/"off" format

/* Saved stories (stored per account on the server) plus, if switched on, more stories
   from the categories of the saved ones. */
export default function SavedPage() {
  useDocumentTitle('Saved');
  const [related, setRelated] = useLocalStorage('daybreak:related', false, onOff);
  const savedQ = useAsync((signal) => api.get('/saved', { signal }), []);
  const relatedQ = useAsync((signal) => (related ? api.get('/saved/related', { signal }) : Promise.resolve({ items: [] })), [related]);

  const savedItems = savedQ.data?.items || [];
  const relatedItems = relatedQ.data?.items || [];

  const remove = async (id) => {
    await api.del(`/saved/${id}`).catch(() => {});
    savedQ.reload();
    if (related) relatedQ.reload();
  };
  const add = async (id) => {
    await api.put(`/saved/${id}`).catch(() => {});
    savedQ.reload();
    relatedQ.reload();
  };

  return (
    <section className="news-feed" aria-labelledby="saved-title">
      <header className="news-feed__header">
        <h1 className="news-feed__title" id="saved-title" tabIndex={-1}>Saved</h1>
        <p className="news-feed__status" aria-live="polite">
          {savedItems.length ? `${savedItems.length} ${savedItems.length === 1 ? 'story' : 'stories'}` : ''}
        </p>
      </header>

      <div className="related-toggle">
        <div className="related-toggle__text">
          <span className="related-toggle__title" id="related-label">Collect related news</span>
          <span className="related-toggle__hint">Show more stories from the topics you have saved.</span>
        </div>
        <button className="switch" type="button" role="switch" aria-checked={related} aria-labelledby="related-label"
                onClick={() => setRelated((r) => !r)}>
          <span className="switch__knob" />
        </button>
      </div>

      {savedQ.error ? <p className="saved-empty" role="alert">{savedQ.error.message}</p> : null}

      <ul className="news-grid">
        {savedItems.map((n) => (
          <NewsCard key={n.id} story={n} origin="saved" action={
            <button className="news-card__action news-card__action--icon" type="button"
                    aria-label={`Remove “${n.title}” from saved`} onClick={() => remove(n.id)}>
              <CloseIcon size={16} />
            </button>
          } />
        ))}
      </ul>
      <p className="saved-empty" hidden={savedQ.loading || savedItems.length > 0}>
        You haven’t saved any stories yet. Open a story and press Save to keep it here.
      </p>

      <div hidden={!related}>
        <h2 className="saved-subtitle">Related stories</h2>
        <ul className="news-grid">
          {relatedItems.map((n) => (
            <NewsCard key={n.id} story={n} origin="recommended" action={
              <button className="news-card__action" type="button"
                      aria-label={`Add “${n.title}” to saved`} onClick={() => add(n.id)}>
                <PlusIcon size={16} />Add to saved
              </button>
            } />
          ))}
        </ul>
        <p className="saved-empty" hidden={relatedQ.loading || relatedItems.length > 0}>
          {savedItems.length ? 'No related stories to show right now.' : 'Save a story first and related stories will appear here.'}
        </p>
      </div>
    </section>
  );
}
