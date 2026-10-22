"""SQLite connection + schema + safe migrations (works on your existing news.db)."""
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

DB_PATH = os.getenv("DAYBREAK_DB", os.path.join(os.path.dirname(os.path.abspath(__file__)), "news.db"))


def utcnow_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def connect(path=None):
    conn = sqlite3.connect(path or DB_PATH, check_same_thread=False, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


@contextmanager
def session(path=None):
    conn = connect(path)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


SCHEMA = """
CREATE TABLE IF NOT EXISTS news (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    source       TEXT,
    title        TEXT,
    link         TEXT UNIQUE,
    published    TEXT,            -- original date string from the feed
    summary      TEXT,
    collected_at TEXT             -- when WE inserted it (UTC ISO)
);

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    country       TEXT DEFAULT '',
    region        TEXT DEFAULT '',
    languages     TEXT DEFAULT '[]',   -- JSON list
    topics        TEXT DEFAULT '[]',   -- JSON list of category values (lowercase)
    created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,       -- sha256 of the token (the token itself is never stored)
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);

-- One row per time a user opens a story. This is the reading history.
CREATE TABLE IF NOT EXISTS article_views (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    news_id          INTEGER REFERENCES news(id) ON DELETE SET NULL,
    -- snapshot of the content at view time, so history survives even if news rows are purged
    title            TEXT,
    source           TEXT,
    category         TEXT,
    link             TEXT,
    origin           TEXT,             -- feed | similar | recommended | saved | other
    started_at       TEXT NOT NULL,    -- UTC ISO
    last_active_at   TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0   -- seconds the story was actually visible on screen
);

CREATE TABLE IF NOT EXISTS saved_news (
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    news_id  INTEGER NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    saved_at TEXT NOT NULL,
    PRIMARY KEY (user_id, news_id)
);

CREATE INDEX IF NOT EXISTS idx_views_user_time ON article_views(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_views_user_news ON article_views(user_id, news_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user   ON sessions(user_id);
"""

# Columns added to the existing `news` table (name -> type)
NEWS_COLUMNS = {
    "published_at": "TEXT",   # normalised UTC ISO date of the article (sortable)
    "category": "TEXT",       # ONE of the app categories
    "tags": "TEXT",           # comma separated: region + secondary categories
    "image": "TEXT",
    "embedding": "BLOB",      # float32 sentence embedding (used for similar stories)
}


def parse_date(text):
    """RSS date string -> aware UTC datetime (or None)."""
    if not text:
        return None
    try:
        dt = parsedate_to_datetime(text)
    except (TypeError, ValueError):
        try:
            dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def init_db(conn):
    conn.executescript(SCHEMA)
    have = {r["name"] for r in conn.execute("PRAGMA table_info(news)")}
    for name, typ in NEWS_COLUMNS.items():
        if name not in have:
            conn.execute(f"ALTER TABLE news ADD COLUMN {name} {typ}")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_news_pub ON news(published_at)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_news_cat ON news(category, published_at)")

    # Give every old row a sortable date: the feed's date, else the time we collected it
    rows = conn.execute("SELECT id, published, collected_at FROM news WHERE published_at IS NULL").fetchall()
    for r in rows:
        dt = parse_date(r["published"]) or parse_date(r["collected_at"])
        iso = dt.replace(microsecond=0).isoformat() if dt else utcnow_iso()
        conn.execute("UPDATE news SET published_at = ? WHERE id = ?", (iso, r["id"]))
    conn.commit()
