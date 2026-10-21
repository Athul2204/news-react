"""
News collector with automatic category tagging.

Install:
    pip install feedparser beautifulsoup4 sentence-transformers

Tags = feed-based tag (region/topic) + content-based categories (embeddings).
Uses a multilingual model so Malayalam headlines are tagged too.
"""

import feedparser
import sqlite3
from bs4 import BeautifulSoup
from datetime import datetime, timezone
from sentence_transformers import SentenceTransformer, util


# ----------------------------------------------------------------------
# Settings
# ----------------------------------------------------------------------
DB_FILE = "news.db"
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"  # English + Malayalam
TOP_K = 3             # max content-based tags per article
THRESHOLD = 0.30      # min similarity for a tag (tune by eyeballing results)
BACKFILL_OLD_ROWS = True   # tag old rows where tags IS NULL


# ----------------------------------------------------------------------
# RSS feeds: name -> (url, base_tag)
# base_tag is always added to the article's tags (None = no base tag)
# ----------------------------------------------------------------------
rss_feeds = {
    # World News
    "BBC World": ("https://feeds.bbci.co.uk/news/world/rss.xml", "World"),
    "CNN": ("http://rss.cnn.com/rss/edition.rss", "World"),
    "The Guardian": ("https://www.theguardian.com/world/rss", "World"),

    # Indian News
    "Google News India": ("https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en", "India"),
    "The Hindu": ("https://www.thehindu.com/feeder/default.rss", "India"),
    "Indian Express": ("https://indianexpress.com/feed/", "India"),
    "NDTV": ("https://feeds.feedburner.com/ndtvnews-top-stories", "India"),

    # Kerala News
    "Google News Kerala": ("https://news.google.com/rss/search?q=Kerala&hl=en-IN&gl=IN&ceid=IN:en", "Kerala"),
    "Google News Malayalam": ("https://news.google.com/rss/search?q=Kerala&hl=ml&gl=IN&ceid=IN:ml", "Kerala"),

    # Technology
    "BBC Technology": ("https://feeds.bbci.co.uk/news/technology/rss.xml", "Technology"),
    "TechCrunch": ("https://techcrunch.com/feed/", "Technology"),
    "The Verge": ("https://www.theverge.com/rss/index.xml", "Technology"),
    "Wired": ("https://www.wired.com/feed/rss", "Technology"),

    # Artificial Intelligence
    "Google News AI": ("https://news.google.com/rss/search?q=artificial+intelligence&hl=en-IN&gl=IN&ceid=IN:en", "AI"),
    "Google News Machine Learning": ("https://news.google.com/rss/search?q=machine+learning&hl=en-IN&gl=IN&ceid=IN:en", "AI"),

    # Business
    "Economic Times": ("https://economictimes.indiatimes.com/rssfeedstopstories.cms", "Business"),

    # Science
    "NASA": ("https://www.nasa.gov/feed/", "Science"),
    "ScienceDaily": ("https://www.sciencedaily.com/rss/all.xml", "Science"),

    # Sports
    "BBC Sport": ("https://feeds.bbci.co.uk/sport/rss.xml", "Sports"),
}


# ----------------------------------------------------------------------
# Categories used for content-based tagging
# ----------------------------------------------------------------------
CATEGORIES = {
    "Politics": "politics, government, elections, parliament, ministers, political parties",
    "Business": "business, economy, markets, stocks, companies, finance, trade",
    "Technology": "technology, software, gadgets, internet, apps, startups, cybersecurity",
    "AI": "artificial intelligence, machine learning, chatbots, large language models",
    "Science": "science, research, space, astronomy, climate, scientific discovery",
    "Health": "health, medicine, disease, hospitals, vaccines, wellbeing",
    "Sports": "sports, cricket, football, match, tournament, players, league",
    "Crime": "crime, police, court, arrest, investigation, murder, fraud",
    "Entertainment": "movies, cinema, music, celebrities, film industry, television",
    "Weather/Disaster": "weather, rain, floods, cyclone, earthquake, landslide, disaster",
    "Education": "education, schools, universities, exams, students, admissions",
    "Environment": "environment, pollution, wildlife, forests, climate change, conservation",
    "War/Conflict": "war, military, conflict, attack, ceasefire, defence, terrorism",
    "Transport": "transport, railways, roads, airlines, metro, traffic, accidents",
}

print("Loading embedding model...")
model = SentenceTransformer(MODEL_NAME)
cat_names = list(CATEGORIES)
cat_emb = model.encode(list(CATEGORIES.values()), convert_to_tensor=True)


# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------
def clean_html(text):
    """Remove HTML tags and decode HTML entities."""
    return BeautifulSoup(text or "", "html.parser").get_text(" ", strip=True)


def build_tags(texts, base_tags):
    """
    Tag a batch of articles.
    texts:     list of "title. summary" strings
    base_tags: list of base tags (or None), same length as texts
    returns:   list of comma-separated tag strings
    """
    if not texts:
        return []

    embs = model.encode(
        [t[:512] for t in texts],
        convert_to_tensor=True,
        batch_size=32,
        show_progress_bar=False,
    )
    scores_matrix = util.cos_sim(embs, cat_emb)

    results = []
    for scores, base in zip(scores_matrix, base_tags):
        ranked = sorted(zip(cat_names, scores.tolist()), key=lambda x: -x[1])

        tags = [name for name, s in ranked[:TOP_K] if s >= THRESHOLD]

        # Always keep at least the best match
        if not tags:
            tags = [ranked[0][0]]

        # Base tag (region/topic from the feed) goes first
        if base and base not in tags:
            tags.insert(0, base)

        results.append(", ".join(tags))
    return results


# ----------------------------------------------------------------------
# Database setup
# ----------------------------------------------------------------------
conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT,
    title TEXT,
    link TEXT UNIQUE,
    published TEXT,
    summary TEXT,
    collected_at TEXT,
    tags TEXT
)
""")

# Add the tags column if the table was created by an older version
try:
    cursor.execute("ALTER TABLE news ADD COLUMN tags TEXT")
except sqlite3.OperationalError:
    pass  # column already exists

conn.commit()


# ----------------------------------------------------------------------
# Backfill: tag old rows that have no tags yet
# ----------------------------------------------------------------------
if BACKFILL_OLD_ROWS:
    old_rows = cursor.execute(
        "SELECT id, source, title, summary FROM news WHERE tags IS NULL"
    ).fetchall()

    if old_rows:
        print(f"Backfilling tags for {len(old_rows)} existing articles...")
        feed_base = {name: base for name, (_, base) in rss_feeds.items()}

        texts = [f"{title}. {summary or ''}" for _, _, title, summary in old_rows]
        bases = [feed_base.get(source) for _, source, _, _ in old_rows]
        new_tags = build_tags(texts, bases)

        cursor.executemany(
            "UPDATE news SET tags = ? WHERE id = ?",
            [(tag, row[0]) for tag, row in zip(new_tags, old_rows)],
        )
        conn.commit()
        print("Backfill done.")


# ----------------------------------------------------------------------
# Collect news
# ----------------------------------------------------------------------
today = datetime.now(timezone.utc).date()
total_saved = 0

for source, (url, base_tag) in rss_feeds.items():

    print(f"\nFetching news from: {source}")

    try:
        feed = feedparser.parse(url)

        if not feed.entries:
            print("No articles found or feed unavailable.")
            continue

        # 1) Filter and clean articles first
        batch = []
        for item in feed.entries:
            published = item.get("published", "")
            published_parsed = item.get("published_parsed")

            # Keep today's articles when a date is available
            if published_parsed:
                news_date = datetime(
                    *published_parsed[:6], tzinfo=timezone.utc
                ).date()
                if news_date != today:
                    continue

            title = clean_html(item.get("title", ""))
            summary = clean_html(item.get("summary", ""))
            link = item.get("link", "")

            if not link or not title:
                continue

            # Skip articles already stored (saves embedding time)
            exists = cursor.execute(
                "SELECT 1 FROM news WHERE link = ?", (link,)
            ).fetchone()
            if exists:
                continue

            batch.append((title, link, published, summary))

        if not batch:
            print("No new articles.")
            continue

        # 2) Tag the whole batch at once (much faster than one by one)
        texts = [f"{title}. {summary}" for title, _, _, summary in batch]
        tags_list = build_tags(texts, [base_tag] * len(batch))

        # 3) Save
        now = datetime.now(timezone.utc).isoformat()
        for (title, link, published, summary), tags in zip(batch, tags_list):
            cursor.execute("""
                INSERT OR IGNORE INTO news
                (source, title, link, published, summary, collected_at, tags)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (source, title, link, published, summary, now, tags))

            if cursor.rowcount > 0:
                total_saved += 1
                print(f"Saved: {title}  [{tags}]")

        conn.commit()

    except Exception as e:
        print(f"Error fetching {source}: {e}")


# Close the database
conn.close()

print("\nNews collection completed!")
print("New articles saved:", total_saved)
print("Database file:", DB_FILE)