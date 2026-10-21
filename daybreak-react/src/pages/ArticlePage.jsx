import { useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { NEWS_ITEMS } from '../data/news';
import { ChevronLeftIcon, BookmarkIcon } from '../components/Icons';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/* One story, at /article/:id. Replace the lookup with a fetch() to your API. */
export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const story = NEWS_ITEMS.find((n) => n.id === parseInt(id, 10));
  const [savedIds, setSavedIds] = useLocalStorage('daybreak:saved', []);

  useDocumentTitle(story ? story.title : 'Story not found');
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  /* "Back" returns to the same feed page when we came from a story list */
  const back = (event) => {
    if (location.state?.fromList) { event.preventDefault(); navigate(-1); }
  };

  const saved = Array.isArray(savedIds) && story ? savedIds.includes(story.id) : false;
  const toggleSave = () => {
    setSavedIds((prev) => {
      const list = (Array.isArray(prev) ? prev : []).filter((x) => x !== story.id);
      if (!saved) list.push(story.id);
      return list;
    });
  };

  return (
    <article className="article">
      <Link className="article__back" to="/dashboard" onClick={back}>
        <ChevronLeftIcon size={16} /> Back to stories
      </Link>
      <div>
        {!story ? (
          <>
            <h1 className="article__title">Story not found</h1>
            <p className="article__text">We couldn’t find that story. <Link className="text-link" to="/dashboard">Go back to the news feed</Link>.</p>
          </>
        ) : (
          <>
            <p className="article__category" style={{ '--hue': story.hue }}>{story.category}</p>
            <h1 className="article__title" tabIndex={-1}>{story.title}</h1>
            <p className="article__meta">
              <span>{story.source}</span><span>{story.time}</span><span>{story.readMinutes} min read</span>
            </p>
            <button className={`article__save${saved ? ' is-saved' : ''}`} type="button" aria-pressed={saved} onClick={toggleSave}>
              <BookmarkIcon size={18} fill={saved ? 'currentColor' : 'none'} />
              <span>{saved ? 'Saved' : 'Save'}</span>
            </button>
            <img className="article__image" decoding="async" width="320" height="180" src={story.image} alt="" />
            <p className="article__lead">{story.summary}</p>
            {story.content.map((p, i) => <p className="article__text" key={i}>{p}</p>)}
            <p className="article__source">
              Original story: <a className="text-link" href={story.url} target="_blank" rel="noopener noreferrer">{story.url}</a>
            </p>
          </>
        )}
      </div>
    </article>
  );
}
