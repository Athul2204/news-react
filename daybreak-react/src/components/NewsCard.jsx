import { Link } from 'react-router-dom';

/* One story card (renders an <li>). `action` is an optional button shown on the card
   (Remove / Add to saved on the Saved page). `origin` says where the card was shown
   (feed | similar | recommended | saved) so the reading history can record how a story was found. */
export default function NewsCard({ story, action, origin = 'feed' }) {
  return (
    <li>
      <article className="news-card" style={{ '--hue': story.hue }}>
        <div className="news-card__thumb" aria-hidden="true"
             style={story.image ? { backgroundImage: `url(${story.image})` } : undefined} />
        <div className="news-card__body">
          <p className="news-card__category">{story.category}</p>
          <h2 className="news-card__title">
            <Link className="news-card__link" to={`/article/${story.id}`} state={{ fromList: true, origin }}>{story.title}</Link>
          </h2>
          {story.summary ? <p className="news-card__summary">{story.summary}</p> : null}
          <p className="news-card__meta">
            <span>{story.source}</span>
            {story.time ? <span>{story.time}</span> : null}
            {story.readMinutes ? <span>{story.readMinutes} min read</span> : null}
          </p>
        </div>
        {action}
      </article>
    </li>
  );
}
