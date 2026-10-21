import { Link } from 'react-router-dom';

/* One story card (renders an <li>). `action` is an optional button shown on the card
   (Remove / Add to saved on the Saved page). */
export default function NewsCard({ story, action }) {
  return (
    <li>
      <article className="news-card" style={{ '--hue': story.hue }}>
        <div className="news-card__thumb" aria-hidden="true" style={{ backgroundImage: `url(${story.image})` }} />
        <div className="news-card__body">
          <p className="news-card__category">{story.category}</p>
          <h2 className="news-card__title">
            <Link className="news-card__link" to={`/article/${story.id}`} state={{ fromList: true }}>{story.title}</Link>
          </h2>
          <p className="news-card__summary">{story.summary}</p>
          <p className="news-card__meta">
            <span>{story.source}</span><span>{story.time}</span><span>{story.readMinutes} min read</span>
          </p>
        </div>
        {action}
      </article>
    </li>
  );
}
