"""'You might like' - ranks recent stories by the reader's category interest (time spent + chosen topics)."""
import math
from datetime import datetime, timedelta, timezone

from catalog import CATEGORY_NAMES

HISTORY_DAYS = 30        # reading history that shapes the interest profile
CANDIDATE_DAYS = 3       # only recommend fresh stories
W_HISTORY, W_TOPICS = 0.7, 0.3


def _iso(days):
    return (datetime.now(timezone.utc) - timedelta(days=days)).replace(microsecond=0).isoformat()


def interest_profile(conn, user_row):
    """{category: weight 0..1} from time spent (history) and the topics picked at signup/settings."""
    import json
    weights = {c: 0.0 for c in CATEGORY_NAMES}
    rows = conn.execute(
        "SELECT category, SUM(MAX(duration_seconds, 3)) AS s FROM article_views "
        "WHERE user_id = ? AND started_at >= ? AND category IS NOT NULL GROUP BY category",
        (user_row["id"], _iso(HISTORY_DAYS))).fetchall()
    total = sum(r["s"] for r in rows) or 0
    if total:
        for r in rows:
            if r["category"] in weights:
                weights[r["category"]] += W_HISTORY * r["s"] / total
    try:
        topics = [t.title() for t in json.loads(user_row["topics"] or "[]")]
    except ValueError:
        topics = []
    topics = [t for t in topics if t in weights]
    for t in topics:
        weights[t] += W_TOPICS / len(topics)
    return weights


def recommend(conn, user_row, limit=6, exclude_ids=()):
    profile = interest_profile(conn, user_row)
    seen = {r["news_id"] for r in conn.execute(
        "SELECT DISTINCT news_id FROM article_views WHERE user_id = ? AND started_at >= ? AND news_id IS NOT NULL",
        (user_row["id"], _iso(7)))}
    skip = seen | set(exclude_ids)
    rows = conn.execute(
        "SELECT id, category, published_at FROM news WHERE published_at >= ? "
        "ORDER BY published_at DESC LIMIT 600", (_iso(CANDIDATE_DAYS),)).fetchall()
    now = datetime.now(timezone.utc)
    cands = []
    for r in rows:
        if r["id"] in skip:
            continue
        try:
            age_h = max((now - datetime.fromisoformat(r["published_at"])).total_seconds() / 3600, 0)
        except (TypeError, ValueError):
            age_h = 72
        score = profile.get(r["category"] or "World", 0.0) + 0.35 * math.exp(-age_h / 24)
        cands.append((score, r["id"], r["category"]))

    # greedy pick with a penalty for repeating a category, so the list stays varied
    picked, per_cat = [], {}
    cands.sort(key=lambda x: -x[0])
    pool = cands[:200]
    while pool and len(picked) < limit:
        best = max(pool, key=lambda c: c[0] - 0.12 * per_cat.get(c[2], 0))
        pool.remove(best)
        picked.append(best[1])
        per_cat[best[2]] = per_cat.get(best[2], 0) + 1
    return picked
