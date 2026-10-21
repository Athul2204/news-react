import { useRef, useState } from 'react';
import { HUES, SAMPLE_REPORTS } from '../data/research';
import { CATEGORIES } from '../data/options';
import Pager from '../components/Pager';
import { PlusIcon } from '../components/Icons';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePageParam } from '../hooks/usePageParam';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PER_PAGE = 9;
const EMPTY = { title: '', brief: '', category: CATEGORIES[0] };

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function ResearchCard({ report }) {
  const progress = report.status === 'progress';
  return (
    <li>
      <article className="research-card" style={{ '--hue': HUES[report.category] || 210 }}>
        <div className="research-card__top">
          <p className="research-card__category">{report.category}</p>
          <span className={`research-card__status${progress ? ' research-card__status--progress' : ''}`}>
            {progress ? 'In progress' : 'Complete'}
          </span>
        </div>
        <h2 className="research-card__title"><a className="research-card__link" href="#" onClick={(e) => e.preventDefault()}>{report.title}</a></h2>
        <p className="research-card__summary">{report.summary}</p>
        <p className="research-card__meta">
          <span>{fmtDate(report.date)}</span>
          {report.sources ? <span>{report.sources} sources</span> : null}
        </p>
      </article>
    </li>
  );
}

/* Research list with pagination and a "New research" dialog. Reports you create are stored in
   localStorage "daybreak:research" (newest first) and listed ahead of the samples. Replace the
   create step in `create()` with a call to your API. */
export default function ResearchPage() {
  useDocumentTitle('Research');
  const [mineRaw, setMine] = useLocalStorage('daybreak:research', []);
  const mine = Array.isArray(mineRaw) ? mineRaw : [];
  const all = [...mine, ...SAMPLE_REPORTS];
  const total = Math.max(1, Math.ceil(all.length / PER_PAGE));
  const [page, setPage] = usePageParam(total);
  const slice = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const titleRef = useRef(null);
  const dialogRef = useRef(null);
  const topicRef = useRef(null);
  const [draft, setDraft] = useState(EMPTY);
  const [topicError, setTopicError] = useState('');

  const goTo = (n) => {
    setPage(n);
    window.scrollTo(0, 0);
    titleRef.current?.focus({ preventScroll: true });
  };

  const openDialog = () => {
    setDraft(EMPTY);
    setTopicError('');
    dialogRef.current.showModal();
    topicRef.current?.focus();
  };
  const closeDialog = () => dialogRef.current.close();
  const set = (name) => (e) => setDraft((d) => ({ ...d, [name]: e.target.value }));

  const create = (event) => {
    event.preventDefault();
    const name = draft.title.trim();
    if (!name) {
      setTopicError('Give your research a title.');
      topicRef.current?.focus();
      return;
    }
    // Example: POST to your API here and use the report it returns
    setMine([{
      id: `mine-${Date.now()}`,
      title: name,
      category: draft.category,
      summary: draft.brief.trim() || 'Your report is being prepared.',
      status: 'progress',
      sources: 0,
      date: new Date().toISOString(),
    }, ...mine]);
    closeDialog();
    setPage(1);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <section className="news-feed research" aria-labelledby="research-title">
        <header className="research__header">
          <div>
            <h1 className="news-feed__title" id="research-title" ref={titleRef} tabIndex={-1}>Research</h1>
            <p className="news-feed__status" aria-live="polite">{all.length} reports</p>
          </div>
          <button className="btn btn--primary research__new" type="button" onClick={openDialog}>
            <PlusIcon size={18} />
            <span>New<span className="research__new-long"> research</span></span>
          </button>
        </header>

        <ul className="research-grid">
          {slice.map((r) => <ResearchCard key={r.id} report={r} />)}
        </ul>
        <Pager page={page} total={total} onChange={goTo} />
      </section>

      {/* Create research */}
      <dialog className="research-dialog" ref={dialogRef} aria-labelledby="research-dialog-title"
              onClick={(e) => { if (e.target === dialogRef.current) closeDialog(); }}>
        <form className="form" method="dialog" noValidate onSubmit={create}>
          <h2 className="research-dialog__title" id="research-dialog-title">New research</h2>
          <p className="research-dialog__text">Describe what you want to find out and we’ll prepare a report.</p>

          <div className="form-field">
            <label className="form-field__label" htmlFor="research-topic">Title</label>
            <input className="form-field__input" id="research-topic" name="title" type="text" maxLength={100}
                   placeholder="e.g. Impact of solar power on rural villages" autoComplete="off" required
                   ref={topicRef} value={draft.title} onChange={(e) => { set('title')(e); setTopicError(''); }}
                   aria-invalid={topicError ? 'true' : undefined} />
            <p className="form-field__error" aria-live="polite">{topicError}</p>
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="research-brief">What should the report answer?</label>
            <textarea className="form-field__input research-dialog__textarea" id="research-brief" name="brief" rows={4}
                      maxLength={600} placeholder="Key questions, time period, regions or angles to cover"
                      value={draft.brief} onChange={set('brief')} />
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="research-category">Category</label>
            <select className="form-field__input form-field__input--select" id="research-category" name="category"
                    value={draft.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="research-dialog__actions">
            <button className="btn btn--text" type="button" onClick={closeDialog}>Cancel</button>
            <button className="btn btn--primary" type="submit">Create research</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
