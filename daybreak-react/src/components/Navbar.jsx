import { Link, useLocation } from 'react-router-dom';
import { BookmarkIcon, HomeIcon, LogoIcon, SearchIcon, ThemeIcon } from './Icons';
import { useTheme } from '../hooks/useTheme';

function NavItem({ to, icon, label, searchOpen }) {
  const { pathname } = useLocation();
  const active = pathname === to && !searchOpen;   // only one navbar item is highlighted at a time
  return (
    <li>
      <Link className={`app-navbar__link${active ? ' app-navbar__link--active' : ''}`} to={to}
            aria-current={active ? 'page' : undefined}>
        {icon}
        <span className="app-navbar__label">{label}</span>
      </Link>
    </li>
  );
}

/* Fixed top bar. The logo button toggles the sidebar on small screens. */
export default function Navbar({ wide, drawerOpen, onToggleDrawer, logoRef, searchOpen, onToggleSearch, searchToggleRef }) {
  const { dark, toggle } = useTheme();
  return (
    <header className="app-navbar">
      <div className="app-navbar__bar">
        <div className="app-navbar__brand">
          <button className="app-navbar__logo-button" type="button" ref={logoRef}
                  onClick={onToggleDrawer} disabled={wide}
                  aria-controls="app-sidebar"
                  aria-expanded={wide ? undefined : drawerOpen}
                  aria-label={wide ? 'Daybreak' : drawerOpen ? 'Close menu' : 'Open menu'}>
            <span className="app-navbar__logo"><LogoIcon /></span>
          </button>
          <Link className="app-navbar__brand-name" to="/dashboard">Daybreak</Link>
        </div>

        <nav className="app-navbar__menu" aria-label="Main">
          <ul className="app-navbar__links">
            <NavItem to="/dashboard" label="Home" searchOpen={searchOpen} icon={<HomeIcon className="app-navbar__icon" />} />
            <NavItem to="/saved" label="Saved" searchOpen={searchOpen} icon={<BookmarkIcon className="app-navbar__icon" />} />
            <li>
              <button className="app-navbar__link" type="button" data-theme-toggle
                      aria-pressed={dark} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                      onClick={toggle}>
                <ThemeIcon className="app-navbar__icon" />
                <span className="app-navbar__label">Switch</span>
              </button>
            </li>
          </ul>
          <button className="app-navbar__link app-navbar__search" type="button" ref={searchToggleRef}
                  aria-controls="app-search" aria-expanded={searchOpen} onClick={onToggleSearch}>
            <SearchIcon className="app-navbar__icon" />
            <span className="app-navbar__label">Search</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
