import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import SearchBar from './SearchBar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useMediaQuery } from '../hooks/useMediaQuery';

/* Shell for every signed-in page: navbar, search bar, sidebar (+ drawer backdrop on phones),
   the page content (<Outlet />) and footer. */
export default function AppLayout() {
  const wide = useMediaQuery('(min-width: 768px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const sidebarRef = useRef(null);
  const logoRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchToggleRef = useRef(null);

  const open = drawerOpen && !wide;   // the sidebar is always visible from 768px
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => { if (wide) setDrawerOpen(false); }, [wide]);
  useEffect(() => {
    document.body.classList.toggle('has-drawer', open);
    return () => document.body.classList.remove('has-drawer');
  }, [open]);

  /* Close the drawer on outside tap or Escape */
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (!sidebarRef.current?.contains(e.target) && !logoRef.current?.contains(e.target)) setDrawerOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { setDrawerOpen(false); logoRef.current?.focus(); }
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  /* Move focus into the search box when it opens, back to the button when it closes */
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    if (searchOpen) searchInputRef.current?.focus();
    else searchToggleRef.current?.focus();
  }, [searchOpen]);

  return (
    <>
      <Navbar wide={wide} drawerOpen={open} onToggleDrawer={() => setDrawerOpen((o) => !o)} logoRef={logoRef}
              searchOpen={searchOpen} onToggleSearch={() => setSearchOpen((o) => !o)} searchToggleRef={searchToggleRef} />
      <SearchBar open={searchOpen} inputRef={searchInputRef} onClose={() => setSearchOpen(false)} />
      <div className={`app-backdrop${open ? ' is-visible' : ''}`} aria-hidden="true" onClick={closeDrawer} />
      <Sidebar open={open} sidebarRef={sidebarRef} onNavigate={() => { if (!wide) closeDrawer(); }} />
      <main className="app-content">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
