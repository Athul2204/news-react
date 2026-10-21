import { Link, useLocation } from 'react-router-dom';
import { DatabaseIcon, LogoutIcon, PenIcon, ResearchIcon, SlidersIcon, UsersIcon } from './Icons';

const ITEMS = [
  { to: '/research', label: 'Research', Icon: ResearchIcon },
  { to: '/sources', label: 'Data collection', Icon: DatabaseIcon },
  { to: '#', label: 'Collaboration', Icon: UsersIcon },   // placeholder pages: add routes when ready
  { to: '#', label: 'Blogging', Icon: PenIcon },
  { to: '/settings', label: 'Settings', Icon: SlidersIcon },
];

function SidebarLink({ to, label, Icon, onNavigate }) {
  const { pathname } = useLocation();
  const active = to !== '#' && pathname === to;
  const content = (
    <>
      <Icon className="app-sidebar__icon" />
      <span className="app-sidebar__label">{label}</span>
    </>
  );
  const className = `app-sidebar__link${active ? ' app-sidebar__link--active' : ''}`;
  if (to === '#') {
    return <a className={className} href="#" onClick={(e) => { e.preventDefault(); onNavigate(); }}>{content}</a>;
  }
  return (
    <Link className={className} to={to} aria-current={active ? 'page' : undefined} onClick={onNavigate}>
      {content}
    </Link>
  );
}

/* Sidebar: icons + labels from 768px, icon-only drawer below that */
export default function Sidebar({ open, sidebarRef, onNavigate }) {
  return (
    <aside className={`app-sidebar${open ? ' is-open' : ''}`} id="app-sidebar" ref={sidebarRef}>
      <nav className="app-sidebar__nav" aria-label="Sections">
        <ul className="app-sidebar__list">
          {ITEMS.map((item) => (
            <li key={item.label}><SidebarLink {...item} onNavigate={onNavigate} /></li>
          ))}
        </ul>
        <SidebarLink to="/login" label="Log out" Icon={LogoutIcon} onNavigate={onNavigate} />
      </nav>
    </aside>
  );
}
