import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const RANGES = [7, 30, 90];
const TZ = -new Date().getTimezoneOffset();      // reader's UTC offset in minutes, so "per day" matches their calendar

/* 4m 20s, 1h 05m, 45s */
export function formatDuration(total) {
  const s = Math.round(total || 0);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`;
}

const fmtWhen = (iso) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const fmtDay = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const ORIGIN = { feed: 'From the feed', similar: 'Similar story', recommended: 'Suggested', saved: 'From saved', other: 'Direct link' };

function Tile({ label, value, hint }) {
  return (
    <li className="insight-tile">
      <p className="insight-tile__label">{label}</p>
      <p className="insight-tile__value">{value}</p>
      {hint ? <p className="insight-tile__hint">{hint}</p> : null}
    </li>
  );
}

/* Time spent per category, time per day and the reading history */
export default function InsightsPage() {
  useDocumentTitle('Insights');
  const [days, setDays] = useState(30);
  const [limit, setLimit] = useState(10);

  const insights = useAsync((signal) => api.get(`/insights?days=${days}&tz=${TZ}`, { signal }), [days]);
  const history = useAsync((signal) => api.get(`/history?limit=${limit}`, { signal }), [limit]);

  const d = insights.data;
  const items = history.data?.items || [];
  const maxDay = Math.max(1, ...(d?.daily || []).map((x) => x.seconds));
  const empty = d && d.views === 0;

  return (
    <section className="news-feed insights" aria-labelledby="insights-title">
      <header className="news-feed__header">
        <h1 className="news-feed__title" id="insights-title" tabIndex={-1}>Insights</h1>
        <p className="news-feed__status">How you read: time per category and your history.</p>
      </header>

      <div className="category-tabs" role="group" aria-label="Time range">
        {RANGES.map((r) => (
          <button key={r} type="button" className={`category-tab${days === r ? ' is-active' : ''}`}
                  aria-pressed={days === r} onClick={() => setDays(r)}>Last {r} days</button>
        ))}
      </div>

      {insights.error ? <p className="saved-empty" role="alert">{insights.error.message}</p> : null}
      {!d && insights.loading ? <p className="saved-empty" role="status">Loading your insights…</p> : null}

      {d ? (
        <>
          <ul className="insight-tiles">
            <Tile label="Time reading" value={formatDuration(d.totalSeconds)} />
            <Tile label="Stories opened" value={d.articles} hint={`${d.views} ${d.views === 1 ? 'visit' : 'visits'}`} />
            <Tile label="Average per visit" value={formatDuration(d.avgSecondsPerView)} />
            <Tile label="Favourite category" value={d.topCategory || '–'} />
          </ul>

          {empty ? (
            <p className="saved-empty">Nothing yet for this period. Open a story and spend a little time on it, and your insights will appear here.</p>
          ) : (
            <>
              <h2 className="saved-subtitle">Time by category</h2>
              <ul className="cat-bars">
                {d.byCategory.map((c) => (
                  <li key={c.category} className="cat-bar" style={{ '--hue': c.hue }}>
                    <div className="cat-bar__row">
                      <span className="cat-bar__name">{c.category}</span>
                      <span className="cat-bar__value">{formatDuration(c.seconds)} · {Math.round(c.share * 100)}%</span>
                    </div>
                    <div className="cat-bar__track" aria-hidden="true"><div className="cat-bar__fill" style={{ width: `${Math.max(c.share * 100, 2)}%` }} /></div>
                    <span className="cat-bar__views">{c.views} {c.views === 1 ? 'visit' : 'visits'}</span>
                  </li>
                ))}
              </ul>

              <h2 className="saved-subtitle">Reading per day</h2>
              <div className="day-chart" role="img" aria-label={`Reading time per day, ${d.daily.length} days`}>
                {d.daily.map((x) => (
                  <div key={x.date} className="day-chart__col" title={`${fmtDay(x.date)}: ${formatDuration(x.seconds)}`}>
                    <div className="day-chart__bar" style={{ height: `${(x.seconds / maxDay) * 100}%` }} />
                  </div>
                ))}
              </div>
              <p className="day-chart__axis"><span>{fmtDay(d.daily[0].date)}</span><span>{fmtDay(d.daily[d.daily.length - 1].date)}</span></p>

              {d.topSources.length ? (
                <>
                  <h2 className="saved-subtitle">Top sources</h2>
                  <ul className="source-list">
                    {d.topSources.map((s) => (
                      <li key={s.source}><span>{s.source}</span><span>{formatDuration(s.seconds)}</span></li>
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          )}
        </>
      ) : null}

      <h2 className="saved-subtitle">Reading history</h2>
      {history.error ? <p className="saved-empty" role="alert">{history.error.message}</p> : null}
      {!history.loading && !items.length ? <p className="saved-empty">Stories you open will be listed here.</p> : null}
      <ul className="history-list">
        {items.map((h) => (
          <li key={h.id} className="history-item" style={{ '--hue': h.hue }}>
            <p className="history-item__category">{h.category}</p>
            <p className="history-item__title">
              {h.newsId ? <Link className="history-item__link" to={`/article/${h.newsId}`} state={{ origin: 'other' }}>{h.title}</Link> : h.title}
            </p>
            <p className="history-item__meta">
              <span>{h.source}</span><span>{fmtWhen(h.startedAt)}</span>
              <span>{formatDuration(h.seconds)} read</span><span>{ORIGIN[h.origin] || ORIGIN.other}</span>
            </p>
          </li>
        ))}
      </ul>
      {history.data && items.length < history.data.total ? (
        <button className="btn btn--outline insights__more" type="button" onClick={() => setLimit((l) => l + 10)}>Show more</button>
      ) : null}
    </section>
  );
}
