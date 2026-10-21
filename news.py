
import feedparser
import sqlite3
import re
from bs4 import BeautifulSoup
from datetime import datetime, timezone


# Clean HTML and unwanted text
def clean_data(text):
    if not text:
        return ""

    soup = BeautifulSoup(text, "html.parser")

    # Remove scripts, styles and other unwanted elements
    for tag in soup(["script", "style", "noscript", "iframe"]):
        tag.decompose()

    # Extract plain text and decode HTML entities
    text = soup.get_text(" ", strip=True)

    # Remove URLs embedded in text if desired
    # text = re.sub(r"https?://\S+", "", text)

    # Remove extra spaces and blank characters
    text = re.sub(r"\s+", " ", text)

    return text.strip()


rss_feeds = {
    "BBC World": "https://feeds.bbci.co.uk/news/world/rss.xml",
    "CNN": "http://rss.cnn.com/rss/edition.rss",
    "The Guardian": "https://www.theguardian.com/world/rss",

    "Google News India": "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en",
    "The Hindu": "https://www.thehindu.com/feeder/default.rss",
    "Indian Express": "https://indianexpress.com/feed/",
    "NDTV": "https://feeds.feedburner.com/ndtvnews-top-stories",

    "Google News Kerala": "https://news.google.com/rss/search?q=Kerala&hl=en-IN&gl=IN&ceid=IN:en",
    "Google News Malayalam": "https://news.google.com/rss/search?q=Kerala&hl=ml&gl=IN&ceid=IN:ml",

    "BBC Technology": "https://feeds.bbci.co.uk/news/technology/rss.xml",
    "TechCrunch": "https://techcrunch.com/feed/",
    "The Verge": "https://www.theverge.com/rss/index.xml",
    "Wired": "https://www.wired.com/feed/rss",

    "Google News AI": "https://news.google.com/rss/search?q=artificial+intelligence&hl=en-IN&gl=IN&ceid=IN:en",
    "Google News Machine Learning": "https://news.google.com/rss/search?q=machine+learning&hl=en-IN&gl=IN&ceid=IN:en",

    "Economic Times": "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
    "NASA": "https://www.nasa.gov/feed/",
    "ScienceDaily": "https://www.sciencedaily.com/rss/all.xml",
    "BBC Sport": "https://feeds.bbci.co.uk/sport/rss.xml"
}


# Connect to SQLite
conn = sqlite3.connect("news.db")
cursor = conn.cursor()

# Create table if it does not exist
cursor.execute("""
CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT,
    title TEXT,
    link TEXT UNIQUE,
    published TEXT,
    summary TEXT,
    collected_at TEXT
)
""")

conn.commit()


# Clean existing database records
cursor.execute("SELECT id, title, summary FROM news")
rows = cursor.fetchall()

for row_id, title, summary in rows:
    cursor.execute("""
        UPDATE news
        SET title = ?, summary = ?
        WHERE id = ?
    """, (
        clean_data(title),
        clean_data(summary),
        row_id
    ))

conn.commit()
print("Existing database records cleaned.")


# Collect today's news
today = datetime.now(timezone.utc).date()
total_saved = 0

for source, url in rss_feeds.items():
    print(f"\nFetching: {source}")

    try:
        feed = feedparser.parse(url)

        for item in feed.entries:
            published_parsed = item.get("published_parsed")
            published = item.get("published", "")

            if published_parsed:
                news_date = datetime(
                    *published_parsed[:6],
                    tzinfo=timezone.utc
                ).date()

                if news_date != today:
                    continue

            # Clean all text before saving
            title = clean_data(item.get("title", ""))
            summary = clean_data(item.get("summary", ""))
            link = item.get("link", "").strip()

            if not title or not link:
                continue

            cursor.execute("""
                INSERT OR IGNORE INTO news
                (source, title, link, published, summary, collected_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                clean_data(source),
                title,
                link,
                published,
                summary,
                datetime.now(timezone.utc).isoformat()
            ))

            if cursor.rowcount > 0:
                total_saved += 1
                print("Saved:", title)

        conn.commit()

    except Exception as error:
        print(f"Error fetching {source}: {error}")

conn.close()

print("\nNews collection completed!")
print("Existing records cleaned.")
print("New articles saved:", total_saved)
