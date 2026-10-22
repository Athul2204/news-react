export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <span className="app-footer__brand">Daybreak</span>
        <ul className="app-footer__links">
          <li><a href="#">About</a></li>
          <li><a href="#">Contact</a></li>
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Terms</a></li>
        </ul>
        <p className="app-footer__note">&copy; 2026 Daybreak News. Headlines and summaries are collected from public RSS feeds and link to their original publishers.</p>
      </div>
    </footer>
  );
}
