import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

/* 1 ... 4 5 6 ... 10 */
function pageNumbers(page, total) {
  const out = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(total - 1, page + 1);
  if (from > 2) out.push('gap-start');
  for (let p = from; p <= to; p++) out.push(p);
  if (to < total - 1) out.push('gap-end');
  if (total > 1) out.push(total);
  return out;
}

export default function Pager({ page, total, onChange }) {
  if (total <= 1) return <nav className="pager" aria-label="Pagination" />;
  return (
    <nav className="pager" aria-label="Pagination">
      <button className="pager__btn pager__btn--icon" type="button" aria-label="Previous page"
              disabled={page === 1} onClick={() => onChange(page - 1)}>
        <ChevronLeftIcon />
      </button>
      <p className="pager__summary">
        <span className="pager__long">Page {page} of {total}</span>
        <span className="pager__short" aria-hidden="true">{page} / {total}</span>
      </p>
      <ul className="pager__numbers">
        {pageNumbers(page, total).map((p) => (
          typeof p === 'string'
            ? <li key={p} className="pager__gap" aria-hidden="true">…</li>
            : (
              <li key={p}>
                <button className="pager__btn" type="button" aria-label={`Page ${p}`}
                        aria-current={p === page ? 'page' : undefined} onClick={() => onChange(p)}>
                  {p}
                </button>
              </li>
            )
        ))}
      </ul>
      <button className="pager__btn pager__btn--icon" type="button" aria-label="Next page"
              disabled={page === total} onClick={() => onChange(page + 1)}>
        <ChevronRightIcon />
      </button>
    </nav>
  );
}
