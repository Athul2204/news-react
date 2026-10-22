import os, shutil, sys, time
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.pop("DAYBREAK_SEMANTIC", None)          # tests use the fast keyword mode

import pytest
from fastapi.testclient import TestClient

REAL_DB = os.path.join(os.path.dirname(__file__), "..", "news.db")   # your collected data (copied, never modified)


@pytest.fixture(scope="module")
def env(tmp_path_factory):
    path = str(tmp_path_factory.mktemp("d") / "news.db")
    if os.path.exists(REAL_DB):
        shutil.copy(REAL_DB, path)                  # your real, already collected data
    os.environ["DAYBREAK_DB"] = path
    import db, collector
    db.DB_PATH = path
    conn = db.connect(path)
    db.init_db(conn)
    collector.backfill(conn, log=lambda *_: None)
    import server
    with TestClient(server.app) as client:
        yield client, conn, server


def signup(client, name="alex", email=None, **kw):
    body = dict(username=name, email=email or f"{name}@example.com", password="secret123", **kw)
    r = client.post("/api/auth/signup", json=body)
    assert r.status_code == 201, r.text
    return {"Authorization": "Bearer " + r.json()["token"]}


# ----------------------------------------------------------------- data / collector
def test_migration_and_backfill(env):
    _, conn, _ = env
    from catalog import CATEGORY_NAMES
    n = conn.execute("SELECT COUNT(*) FROM news").fetchone()[0]
    assert n > 0
    assert conn.execute("SELECT COUNT(*) FROM news WHERE published_at IS NULL").fetchone()[0] == 0
    cats = {r[0] for r in conn.execute("SELECT DISTINCT category FROM news")}
    assert cats and cats <= set(CATEGORY_NAMES)


def test_collect_with_fake_feed(env):
    import collector
    _, conn, _ = env
    today = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    xml = f"""<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel>
    <item><title>Cricket: India win the final match in a thriller</title><link>http://x/1</link><pubDate>{today}</pubDate>
      <description>&lt;p&gt;The bowler took five wickets.&lt;/p&gt;</description><media:thumbnail url="http://img/1.jpg"/></item>
    <item><title>Old story</title><link>http://x/2</link><pubDate>Mon, 01 Jan 2024 10:00:00 +0000</pubDate></item>
    <item><title>Doctors warn of dengue outbreak as hospitals fill</title><link>http://x/3</link><pubDate>{today}</pubDate></item>
    </channel></rss>"""
    import feedparser
    feeds = {"Test Feed": ("http://fake", "India", None)}
    parse = lambda url: feedparser.parse(xml)
    assert collector.collect(conn, feeds, parse=parse, log=lambda *_: None) == 2      # old story skipped
    assert collector.collect(conn, feeds, parse=parse, log=lambda *_: None) == 0      # no duplicates
    r = conn.execute("SELECT * FROM news WHERE link='http://x/1'").fetchone()
    assert r["category"] == "Sports" and "India" in r["tags"] and r["image"] == "http://img/1.jpg"
    assert r["summary"] == "The bowler took five wickets."
    assert datetime.fromisoformat(r["published_at"]).date() == datetime.now(timezone.utc).date()
    assert conn.execute("SELECT category FROM news WHERE link='http://x/3'").fetchone()[0] == "Health"


def test_test_mode_tags_one(env):
    import collector, feedparser
    _, conn, _ = env
    today = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    xml = "<rss><channel>" + "".join(
        f"<item><title>Film star story {i}</title><link>http://t/{i}</link><pubDate>{today}</pubDate></item>" for i in range(3)
    ) + "</channel></rss>"
    collector.collect(conn, {"T": ("u", None, None)}, test_mode=True, parse=lambda u: feedparser.parse(xml), log=lambda *_: None)
    got = [r[0] for r in conn.execute("SELECT category FROM news WHERE link LIKE 'http://t/%' ORDER BY id")]
    assert got[0] is not None and got[1:] == [None, None]


# ----------------------------------------------------------------- auth
def test_signup_validation_and_duplicates(env):
    c, _, _ = env
    r = c.post("/api/auth/signup", json={"username": "bob", "email": "bob@example.com", "password": "short"})
    assert r.status_code == 422 and r.json()["field"] == "password"
    r = c.post("/api/auth/signup", json={"username": "b!", "email": "bob@example.com", "password": "secret123"})
    assert r.status_code == 422 and r.json()["field"] == "username"
    signup(c, "bob", topics=["Sports", "nonsense"])
    r = c.post("/api/auth/signup", json={"username": "bob2", "email": "BOB@example.com", "password": "secret123"})
    assert r.status_code == 409 and r.json()["field"] == "email"
    r = c.post("/api/auth/signup", json={"username": "BOB", "email": "b2@example.com", "password": "secret123"})
    assert r.status_code == 409 and r.json()["field"] == "username"


def test_login_logout_and_protection(env):
    c, _, _ = env
    assert c.get("/api/news").status_code == 401
    signup(c, "carol")
    r = c.post("/api/auth/login", json={"email": "carol@example.com", "password": "wrongpass1"})
    assert r.status_code == 401 and "Incorrect" in r.json()["detail"]
    r = c.post("/api/auth/login", json={"email": "nobody@example.com", "password": "secret123"})
    assert r.status_code == 401
    r = c.post("/api/auth/login", json={"email": "Carol@Example.com", "password": "secret123", "remember": True})
    assert r.status_code == 200
    h = {"Authorization": "Bearer " + r.json()["token"]}
    assert c.get("/api/me", headers=h).json()["username"] == "carol"
    assert "password" not in str(c.get("/api/me", headers=h).json()).lower()
    c.post("/api/auth/logout", headers=h)
    assert c.get("/api/me", headers=h).status_code == 401


def test_login_throttle(env):
    c, _, _ = env
    signup(c, "dave")
    for _ in range(5):
        assert c.post("/api/auth/login", json={"email": "dave@example.com", "password": "bad"}).status_code == 401
    r = c.post("/api/auth/login", json={"email": "dave@example.com", "password": "secret123"})
    assert r.status_code == 429


def test_password_change_revokes_other_sessions(env):
    c, _, _ = env
    h1 = signup(c, "erin")
    h2 = {"Authorization": "Bearer " + c.post("/api/auth/login", json={"email": "erin@example.com", "password": "secret123"}).json()["token"]}
    assert c.post("/api/me/password", headers=h1, json={"current_password": "nope12345", "new_password": "newpass123"}).status_code == 400
    assert c.post("/api/me/password", headers=h1, json={"current_password": "secret123", "new_password": "newpass123"}).status_code == 200
    assert c.get("/api/me", headers=h1).status_code == 200 and c.get("/api/me", headers=h2).status_code == 401
    assert c.post("/api/auth/login", json={"email": "erin@example.com", "password": "newpass123"}).status_code == 200


def test_preferences(env):
    c, _, _ = env
    h = signup(c, "fay")
    r = c.put("/api/me/preferences", headers=h, json={"country": "IN", "region": "Kerala", "languages": ["ml", "en"], "topics": ["sports", "Health", "zzz"]})
    assert r.json()["topics"] == ["health", "sports"] and r.json()["region"] == "Kerala"


# ----------------------------------------------------------------- news
def test_news_list_and_filter(env):
    c, conn, _ = env
    h = signup(c, "gina")
    r = c.get("/api/news?per_page=5", headers=h).json()
    assert len(r["items"]) == 5 and r["totalPages"] >= 1
    dates = [i["publishedAt"] for i in r["items"]]
    assert dates == sorted(dates, reverse=True)
    for k in ("id", "category", "hue", "title", "summary", "source", "time", "image", "url", "tags"):
        assert k in r["items"][0]
    biz = c.get("/api/news?category=business&per_page=50", headers=h).json()
    assert biz["total"] > 0 and all(i["category"] == "Business" for i in biz["items"])
    assert c.get("/api/news?category=Nope", headers=h).status_code == 400
    assert c.get("/api/news/99999999", headers=h).status_code == 404


def test_similar_stories(env):
    c, conn, _ = env
    h = signup(c, "hank")
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    ids = []
    for i, t in enumerate(["Reserve Bank holds repo rate steady as inflation cools",
                           "RBI keeps repo rate unchanged, inflation easing",
                           "Local football club wins derby with late goal"]):
        cur = conn.execute("INSERT INTO news (source,title,link,summary,published_at,category) VALUES ('T',?,?,?,?,?)",
                           (t, f"http://sim/{i}", "", now, "Business" if i < 2 else "Sports"))
        ids.append(cur.lastrowid)
    conn.commit()
    items = c.get(f"/api/news/{ids[0]}/similar?limit=3", headers=h).json()["items"]
    got = [i["id"] for i in items]
    assert ids[0] not in got and got[0] == ids[1]


# ----------------------------------------------------------------- saved
def test_saved_flow(env):
    c, _, _ = env
    h = signup(c, "ivy")
    items = c.get("/api/news?per_page=30", headers=h).json()["items"]
    a = items[0]
    assert c.put(f"/api/saved/{a['id']}", headers=h).json() == {"saved": True}
    c.put(f"/api/saved/{a['id']}", headers=h)                                   # idempotent
    saved = c.get("/api/saved", headers=h).json()["items"]
    assert [s["id"] for s in saved] == [a["id"]] and saved[0]["saved"] is True
    assert c.get(f"/api/news/{a['id']}", headers=h).json()["saved"] is True
    rel = c.get("/api/saved/related", headers=h).json()["items"]
    assert rel and all(r["category"] == a["category"] and r["id"] != a["id"] for r in rel)
    c.delete(f"/api/saved/{a['id']}", headers=h)
    assert c.get("/api/saved", headers=h).json()["items"] == []
    # saved lists are per user
    h2 = signup(c, "ivy2")
    assert c.get("/api/saved", headers=h2).json()["items"] == []


# ----------------------------------------------------------------- views / insights / recommendations
def test_views_insights_history(env):
    c, conn, _ = env
    h = signup(c, "jon")
    h_other = signup(c, "jon2")
    sports = c.get("/api/news?category=Business&per_page=3", headers=h).json()["items"]
    tech = c.get("/api/news?category=Technology&per_page=3", headers=h).json()["items"]
    v1 = c.post("/api/views", headers=h, json={"news_id": sports[0]["id"], "origin": "feed"}).json()["id"]
    v2 = c.post("/api/views", headers=h, json={"news_id": tech[0]["id"], "origin": "similar"}).json()["id"]

    # make the views look 100s / 40s old so the wall-clock cap lets the time through
    past = (datetime.now(timezone.utc).timestamp())
    for vid, age in ((v1, 100), (v2, 40)):
        conn.execute("UPDATE article_views SET started_at=? WHERE id=?",
                     (datetime.fromtimestamp(past - age, timezone.utc).replace(microsecond=0).isoformat(), vid))
    conn.commit()

    assert c.patch(f"/api/views/{v1}", headers=h, json={"seconds": 90}).json()["seconds"] == 90
    assert c.patch(f"/api/views/{v1}", headers=h, json={"seconds": 30}).json()["seconds"] == 90      # never goes down
    assert c.patch(f"/api/views/{v2}", headers=h, json={"seconds": 99999}).json()["seconds"] <= 46  # capped by wall clock
    assert c.patch(f"/api/views/{v1}", headers=h_other, json={"seconds": 5}).status_code == 404       # not yours
    assert c.post("/api/views", headers=h, json={"news_id": 99999999}).status_code == 404

    ins = c.get("/api/insights?days=7&tz=330", headers=h).json()
    assert ins["views"] == 2 and ins["articles"] == 2
    assert ins["totalSeconds"] == 90 + c.patch(f"/api/views/{v2}", headers=h, json={"seconds": 0}).json()["seconds"]
    assert ins["topCategory"] == "Business"
    cats = {x["category"]: x for x in ins["byCategory"]}
    assert set(cats) == {"Business", "Technology"} and abs(sum(x["share"] for x in cats.values()) - 1) < 0.01
    assert len(ins["daily"]) == 7 and sum(d["seconds"] for d in ins["daily"]) == ins["totalSeconds"]
    assert ins["origins"] == {"feed": 1, "similar": 1}
    assert c.get("/api/insights", headers=h_other).json()["views"] == 0

    hist = c.get("/api/history", headers=h).json()
    assert hist["total"] == 2 and hist["items"][0]["title"] == tech[0]["title"] and hist["items"][1]["seconds"] == 90
    assert c.get("/api/history?category=Business", headers=h).json()["total"] == 1
    # history keeps the content even if the news row is deleted
    conn.execute("DELETE FROM news WHERE id=?", (tech[0]["id"],)); conn.commit()
    assert c.get("/api/history", headers=h).json()["items"][0]["title"] == tech[0]["title"]


def test_recommendations_follow_reading(env):
    c, conn, _ = env
    h = signup(c, "kim", topics=["sports"])
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    for i in range(6):
        for cat in ("Sports", "Entertainment"):
            conn.execute("INSERT INTO news (source,title,link,summary,published_at,category) VALUES ('T',?,?,'',?,?)",
                         (f"{cat} story {i}", f"http://rec/{cat}/{i}", now, cat))
    conn.commit()
    r = c.get("/api/recommendations?limit=4", headers=h).json()["items"]
    assert sum(i["category"] == "Sports" for i in r) >= 2            # chosen topic is favoured
    # reading lots of Entertainment shifts the list towards it
    ent = c.get("/api/news?category=Entertainment&per_page=1", headers=h).json()["items"][0]
    vid = c.post("/api/views", headers=h, json={"news_id": ent["id"]}).json()["id"]
    conn.execute("UPDATE article_views SET started_at=?, duration_seconds=600 WHERE id=?",
                 (datetime.fromtimestamp(time.time() - 700, timezone.utc).replace(microsecond=0).isoformat(), vid)); conn.commit()
    r2 = c.get("/api/recommendations?limit=6", headers=h).json()["items"]
    assert ent["id"] not in [i["id"] for i in r2]                    # already read -> not suggested again
    assert sum(i["category"] == "Entertainment" for i in r2) >= 2


# ----------------------------------------------------------------- embedding code path (stand-in model)
class FakeModel:
    """Deterministic bag-of-words 'embeddings' so the embedding code path can be tested without a download."""
    DIM = 128

    def encode(self, texts, **_):
        import re, zlib
        import numpy as np
        out = np.zeros((len(texts), self.DIM), dtype="float32")
        for i, t in enumerate(texts):
            for w in re.findall(r"[a-z]{3,}", t.lower()):
                out[i, zlib.crc32(w.encode()) % self.DIM] += 1
        return out


def test_embedding_path(env, monkeypatch):
    import nlp
    c, conn, _ = env
    monkeypatch.setattr(nlp, "SEMANTIC", True)
    monkeypatch.setattr(nlp, "_model", FakeModel())
    monkeypatch.setattr(nlp, "_model_tried", True)
    monkeypatch.setattr(nlp, "_cat_emb", None)

    items = [{"source": "BBC Sport", "title": "Sports cricket football tennis tournaments matches players", "summary": ""},
             {"source": "X", "title": "Health medicine diseases hospitals doctors vaccines", "summary": ""}]
    res = nlp.classify(items, {"BBC Sport": (None, "Sports")})
    assert res[0]["category"] == "Sports" and res[1]["category"] == "Health"
    assert len(res[0]["embedding"]) == FakeModel.DIM * 4          # float32 blob stored in the db

    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    titles = ["Heavy rain floods the city streets", "City streets flooded after heavy rain", "Football club signs new striker"]
    embs = nlp.classify([{"source": "T", "title": t, "summary": ""} for t in titles])
    ids = []
    for t, e in zip(titles, embs):
        cur = conn.execute("INSERT INTO news (source,title,link,summary,published_at,category,embedding) VALUES ('T',?,?,'',?,?,?)",
                           (t, f"http://emb/{t}", now, e["category"], e["embedding"]))
        ids.append(cur.lastrowid)
    conn.commit()
    got = [i for i, _ in nlp.find_similar(conn, ids[0], limit=3)]
    assert got and got[0] == ids[1] and ids[2] not in got


# ----------------------------------------------------------------- speed
def test_feeds_download_in_parallel_and_model_stays_unloaded(env):
    import collector, feedparser, nlp
    _, conn, _ = env
    xml = "<rss><channel><item><title>x</title><link>http://p/{}</link></item></channel></rss>"
    def slow_parse(url):
        time.sleep(0.4)
        return feedparser.parse(xml.format(url))
    feeds = {f"F{i}": (f"u{i}", None, None) for i in range(8)}
    t = time.time()
    res = collector.fetch_all(feeds, slow_parse)
    assert time.time() - t < 1.6                       # 8 x 0.4s sequentially would be 3.2s
    assert all(not isinstance(v, Exception) for v in res.values())
    def boom(url): raise OSError("timeout")
    assert isinstance(collector.fetch_all({"B": ("u", None, None)}, boom)["B"], OSError)   # one bad feed is isolated
    assert nlp._model_tried is False                   # the AI model was never loaded


def test_malayalam_keywords():
    import nlp
    cases = {"കേരളത്തിൽ ഇന്നും വ്യാപക മഴക്ക് സാധ്യത, യെല്ലോ അലർട്ട്": "Environment",
             "സ്വ\u200dർണം, വെള്ളി വിലകൾ; ഇന്നത്തെ നിരക്കുകൾ": "Business",
             "കേരള ബ്ലാസ്റ്റേഴ്സിന്റെ ആദ്യ ഹോം മത്സരം 25ന്": "Sports",
             "പിണറായി വിജയന് ഇന്ന് നിർണായകം": "World"}
    for title, want in cases.items():
        assert nlp.classify([{"source": "Google News Malayalam", "title": title, "summary": ""}])[0]["category"] == want
