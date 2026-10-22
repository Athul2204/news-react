"""
RSS collector: fetch (in parallel) -> clean -> date -> categorise -> store.

    python collector.py              fast run (a few seconds): keyword categories, no AI model
    python collector.py --semantic   also use the AI model (meaning based; slower, optional)
    python collector.py --test       categorise only ONE new article
    python collector.py --all-dates  keep articles of any date (default: only today's, UTC)

Why it is fast: all feeds are downloaded at the same time (with a timeout), the AI model is only loaded
when --semantic is given, and everything is written to SQLite in one transaction per feed.

Each article is stored with:
    published_at  normalised UTC date of the article        collected_at  when it was inserted
    category      ONE of the app categories (catalog.CATEGORIES)
    tags          region + secondary categories, comma separated
    image         thumbnail from the feed (if any)           embedding  vector (only with --semantic)
"""
import argparse
import re
import socket
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import feedparser
from bs4 import BeautifulSoup

import db
import nlp
from catalog import FEEDS

FETCH_WORKERS = 8      # feeds downloaded at the same time
FETCH_TIMEOUT = 15     # seconds before a slow feed is skipped


def clean_data(text):
    """Strip HTML, scripts and extra whitespace; decode entities."""
    if not text:
        return ""
    soup = BeautifulSoup(text, "html.parser")
    for tag in soup(["script", "style", "noscript", "iframe"]):
        tag.decompose()
    return re.sub(r"\s+", " ", soup.get_text(" ", strip=True)).strip()


def extract_image(item):
    for key in ("media_thumbnail", "media_content"):
        for m in item.get(key) or []:
            if str(m.get("url", "")).startswith("http"):
                return m["url"]
    for e in list(item.get("enclosures") or []) + list(item.get("links") or []):
        if str(e.get("type", "")).startswith("image") and str(e.get("href", "")).startswith("http"):
            return e["href"]
    html = item.get("summary", "") or ""
    for c in item.get("content") or []:
        html += c.get("value", "")
    img = BeautifulSoup(html, "html.parser").find("img")
    if img and str(img.get("src", "")).startswith("http"):
        return img["src"]
    return None


def _feed_info(feeds):
    return {name: (region, prior) for name, (_, region, prior) in feeds.items()}


def fetch_all(feeds, parse=feedparser.parse, workers=FETCH_WORKERS, timeout=FETCH_TIMEOUT):
    """Download every feed at the same time. -> {name: parsed feed | Exception}"""
    socket.setdefaulttimeout(timeout)          # a dead server can no longer stall the run

    def one(item):
        name, (url, _region, _prior) = item
        try:
            return name, parse(url)
        except Exception as exc:               # noqa: BLE001 - one broken feed must not stop the others
            return name, exc

    with ThreadPoolExecutor(max_workers=workers) as pool:
        return dict(pool.map(one, feeds.items()))


def backfill(conn, feeds=FEEDS, log=print):
    """Categorise rows that have no category (and, in --semantic mode, rows without an embedding)."""
    semantic = nlp.get_model() is not None
    where = "category IS NULL OR embedding IS NULL" if semantic else "category IS NULL"
    rows = conn.execute(f"SELECT id, source, title, summary FROM news WHERE {where}").fetchall()
    if not rows:
        return 0
    log(f"Categorising {len(rows)} stored articles ({'AI model' if semantic else 'keywords'})...")
    items = [{"source": r["source"], "title": clean_data(r["title"]), "summary": clean_data(r["summary"])} for r in rows]
    results = nlp.classify(items, _feed_info(feeds))
    conn.executemany(
        "UPDATE news SET title=?, summary=?, category=?, tags=?, embedding=? WHERE id=?",
        [(i["title"], i["summary"], res["category"], ",".join(res["tags"]), res["embedding"], r["id"])
         for r, i, res in zip(rows, items, results)])
    conn.commit()
    return len(rows)


def collect(conn, feeds=FEEDS, only_today=True, test_mode=False, parse=feedparser.parse, log=print):
    today = datetime.now(timezone.utc).date()
    info = _feed_info(feeds)
    known = {r[0] for r in conn.execute("SELECT link FROM news")}      # one query instead of one per article
    saved = 0
    test_done = False

    t0 = time.time()
    fetched = fetch_all(feeds, parse)
    log(f"Downloaded {len(feeds)} feeds in {time.time() - t0:.1f}s")

    for source in feeds:
        feed = fetched[source]
        if isinstance(feed, Exception):
            log(f"{source}: error: {feed}")
            continue
        if not feed.entries:
            log(f"{source}: no articles (feed unavailable?)")
            continue

        batch = []
        for entry in feed.entries:
            published = entry.get("published", "")
            parsed = entry.get("published_parsed")
            pub_dt = datetime(*parsed[:6], tzinfo=timezone.utc) if parsed else db.parse_date(published)
            if only_today and pub_dt and pub_dt.date() != today:
                continue
            title = clean_data(entry.get("title", ""))
            link = (entry.get("link") or "").strip()
            if not title or not link or link in known:
                continue
            known.add(link)
            batch.append({
                "source": source, "title": title, "link": link, "published": published,
                "summary": clean_data(entry.get("summary", "")), "image": extract_image(entry),
                "published_at": (pub_dt or datetime.now(timezone.utc)).replace(microsecond=0).isoformat(),
            })
        if not batch:
            log(f"{source}: no new articles")
            continue

        if test_mode:
            results = [None] * len(batch)
            if not test_done:
                results[0] = nlp.classify(batch[:1], info)[0]
                log(f"TEST ARTICLE: {batch[0]['title']}\nTEST RESULT : {results[0]['category']} | {results[0]['tags']}")
                test_done = True
        else:
            results = nlp.classify(batch, info)

        now = db.utcnow_iso()
        before = conn.total_changes
        conn.executemany(
            "INSERT OR IGNORE INTO news (source, title, link, published, summary, collected_at, "
            "published_at, category, tags, image, embedding) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            [(i["source"], i["title"], i["link"], i["published"], i["summary"], now, i["published_at"],
              r and r["category"], r and ",".join(r["tags"]), i["image"], r and r["embedding"])
             for i, r in zip(batch, results)])
        conn.commit()
        added = conn.total_changes - before
        saved += added
        log(f"{source}: {added} new")
        if test_mode and test_done:
            log("Test article saved, stopping early.")
            break
    return saved


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--semantic", action="store_true", help="use the AI model (slower, meaning based)")
    ap.add_argument("--test", action="store_true", help="categorise only one new article")
    ap.add_argument("--all-dates", action="store_true", help="do not restrict to today's articles")
    ap.add_argument("--db", help="path to news.db (default: backend/news.db or $DAYBREAK_DB)")
    args = ap.parse_args(argv)

    start = time.time()
    if args.semantic:
        nlp.enable_semantic(True)
    conn = db.connect(args.db)
    db.init_db(conn)
    if not args.test:
        backfill(conn)
    saved = collect(conn, only_today=not args.all_dates, test_mode=args.test)
    conn.close()
    print(f"\nDone in {time.time() - start:.1f}s. New articles saved: {saved}")


if __name__ == "__main__":
    sys.exit(main())
