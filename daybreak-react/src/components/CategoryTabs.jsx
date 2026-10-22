import { CATEGORIES } from '../data/options';

/* "All" + one pill per category. `value` is '' for all, otherwise a category name. */
export default function CategoryTabs({ value, onChange }) {
  return (
    <div className="category-tabs" role="group" aria-label="Filter by category">
      {['', ...CATEGORIES].map((c) => (
        <button key={c || 'all'} type="button" className={`category-tab${value === c ? ' is-active' : ''}`}
                aria-pressed={value === c} onClick={() => onChange(c)}>
          {c || 'All'}
        </button>
      ))}
    </div>
  );
}
