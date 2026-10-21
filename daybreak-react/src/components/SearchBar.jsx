import { CloseIcon } from './Icons';

/* Full-width search bar below the navbar. On submit it fires a "daybreak:search" event on
   document (detail.query). Listen for it on your search page, or replace this with a router
   navigation / API call. */
export default function SearchBar({ open, inputRef, onClose }) {
  const submit = (event) => {
    event.preventDefault();
    const query = inputRef.current.value.trim();
    if (query) document.dispatchEvent(new CustomEvent('daybreak:search', { detail: { query } }));
  };

  return (
    <div className="app-search" id="app-search" hidden={!open}
         onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <form className="app-search__form" role="search" onSubmit={submit}>
        <input className="app-search__input" ref={inputRef} type="search" name="q" enterKeyHint="search"
               inputMode="search" placeholder="Search stories" aria-label="Search stories" autoComplete="off" />
        <button className="app-search__close" type="button" aria-label="Close search" onClick={onClose}>
          <CloseIcon />
        </button>
      </form>
    </div>
  );
}
