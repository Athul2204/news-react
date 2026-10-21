import { SOURCES } from '../data/sources';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/* One card per kind of data; on/off choices are stored in localStorage "daybreak:sources". */
export default function SourcesPage() {
  useDocumentTitle('Sources');
  const [choice, setChoice] = useLocalStorage('daybreak:sources', {});
  const isOn = (s) => (s.key in choice ? !!choice[s.key] : s.on);
  const count = SOURCES.filter(isOn).length;

  const toggle = (s) => setChoice((prev) => ({ ...prev, [s.key]: !(s.key in prev ? !!prev[s.key] : s.on) }));

  return (
    <section className="news-feed sources" aria-labelledby="sources-title">
      <header className="news-feed__header">
        <h1 className="news-feed__title" id="sources-title" tabIndex={-1}>Sources</h1>
        <p className="news-feed__status" aria-live="polite">{count} of {SOURCES.length} collecting</p>
      </header>
      <p className="sources__intro">Choose what Daybreak collects. Research reports and your feed draw on everything switched on here.</p>
      <ul className="sources-grid">
        {SOURCES.map((s) => {
          const on = isOn(s);
          return (
            <li key={s.key}>
              <article className={`source-card${on ? ' is-on' : ''}`} style={{ '--hue': s.hue }}>
                <div className="source-card__icon"><s.Icon /></div>
                <h2 className="source-card__title" id={`src-${s.key}`}>{s.name}</h2>
                <p className="source-card__text">{s.text}</p>
                <ul className="source-card__tags">{s.examples.map((e) => <li key={e}>{e}</li>)}</ul>
                <div className="source-card__footer">
                  <p className="source-card__count"><strong>{s.count.toLocaleString()}</strong> items collected</p>
                  <span className="source-card__state">{on ? 'Collecting' : 'Off'}</span>
                  <button className="switch" type="button" role="switch" aria-checked={on}
                          aria-labelledby={`src-${s.key}`} onClick={() => toggle(s)}>
                    <span className="switch__knob" />
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
