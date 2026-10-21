import { NEWS_ITEMS } from '../data/news';
import NewsCard from '../components/NewsCard';
import { CloseIcon, PlusIcon } from '../components/Icons';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const RELATED_MAX = 12;
const onOff = { decode: (raw) => raw === 'on', encode: (v) => (v ? 'on' : 'off') };   // keeps the original "on"/"off" format

const byId = (id) => NEWS_ITEMS.find((n) => n.id === id);

/* Saved stories (ids in localStorage "daybreak:saved", written by the article page) plus
   optional related stories from the same categories. */
export default function SavedPage() {
  useDocumentTitle('Saved');
  const [savedRaw, setSaved] = useLocalStorage('daybreak:saved', []);
  const [related, setRelated] = useLocalStorage('daybreak:related', false, onOff);
  const saved = Array.isArray(savedRaw) ? savedRaw : [];

  const savedItems = saved.slice().reverse().map(byId).filter(Boolean);   // most recently saved first

  /* Related = unsaved stories from the saved stories' categories, newest first */
  const relatedItems = (() => {
    if (!related) return [];
    const cats = new Set(savedItems.map((n) => n.category));
    return NEWS_ITEMS.filter((n) => cats.has(n.category) && !saved.includes(n.id)).slice(0, RELATED_MAX);
  })();

  const remove = (id) => setSaved((prev) => (Array.isArray(prev) ? prev : []).filter((x) => x !== id));
  const add = (id) => setSaved((prev) => {
    const list = Array.isArray(prev) ? prev : [];
    return list.includes(id) ? list : [...list, id];
  });

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

      <ul className="news-grid">
        {savedItems.map((n) => (
          <NewsCard key={n.id} story={n} action={
            <button className="news-card__action news-card__action--icon" type="button"
                    aria-label={`Remove “${n.title}” from saved`} onClick={() => remove(n.id)}>
              <CloseIcon size={16} />
            </button>
          } />
        ))}
      </ul>
      <p className="saved-empty" hidden={savedItems.length > 0}>
        You haven’t saved any stories yet. Open a story and press Save to keep it here.
      </p>

      <div hidden={!related}>
        <h2 className="saved-subtitle">Related stories</h2>
        <ul className="news-grid">
          {relatedItems.map((n) => (
            <NewsCard key={n.id} story={n} action={
              <button className="news-card__action" type="button"
                      aria-label={`Add “${n.title}” to saved`} onClick={() => add(n.id)}>
                <PlusIcon size={16} />Add to saved
              </button>
            } />
          ))}
        </ul>
        <p className="saved-empty" hidden={relatedItems.length > 0}>
          {savedItems.length ? 'No related stories to show right now.' : 'Save a story first and related stories will appear here.'}
        </p>
      </div>
    </section>
  );
}
