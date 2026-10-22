"""
Daybreak API  (FastAPI + SQLite)

Run:   uvicorn server:app --reload --port 8000        (from the backend folder)
Docs:  http://127.0.0.1:8000/docs
"""
import json
import os
import re
import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, FastAPI, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator

import auth
import db
import nlp
import recommend
from catalog import CATEGORY_NAMES, DEFAULT_CATEGORY, HUES
from auth import current_token, current_user, get_conn


class ApiError(Exception):
    def __init__(self, status, message, field=None):
        self.status, self.message, self.field = status, message, field


@asynccontextmanager
async def lifespan(app):
    with db.session() as conn:
        db.init_db(conn)
    yield


app = FastAPI(title="Daybreak API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("DAYBREAK_CORS", "http://localhost:5173,http://127.0.0.1:5173").split(","),
    allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(ApiError)
async def api_error(_, exc: ApiError):
    body = {"detail": exc.message}
    if exc.field:
        body["field"] = exc.field
    return JSONResponse(body, status_code=exc.status)


@app.exception_handler(RequestValidationError)
async def validation_error(_, exc: RequestValidationError):
    err = exc.errors()[0]
    msg = err.get("msg", "Invalid request.").removeprefix("Value error, ")
    field = next((str(p) for p in reversed(err.get("loc", ())) if isinstance(p, str) and p != "body"), None)
    return JSONResponse({"detail": msg, "field": field}, status_code=422)


# ======================================================================== schemas
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
USERNAME_RE = re.compile(r"^[A-Za-z0-9_.]{3,20}$")
VALID_TOPICS = {c.lower() for c in CATEGORY_NAMES}


def _check_new_password(v: str) -> str:
    if len(v) < 8:
        raise ValueError("Use at least 8 characters.")
    if not re.search(r"[A-Za-z]", v) or not re.search(r"[0-9]", v):
        raise ValueError("Include at least one letter and one number.")
    return v


def _clean_topics(v):
    return sorted({t.strip().lower() for t in v if t.strip().lower() in VALID_TOPICS})


def _clean_langs(v):
    return [l.strip()[:8] for l in v if l.strip()][:10]


class SignupIn(BaseModel):
    username: str
    email: str
    password: str
    country: str = ""
    region: str = ""
    languages: list[str] = []
    topics: list[str] = []
    remember: bool = False

    @field_validator("username")
    @classmethod
    def _u(cls, v):
        v = v.strip()
        if not USERNAME_RE.match(v):
            raise ValueError("Use 3 to 20 letters, numbers, dots or underscores.")
        return v

    @field_validator("email")
    @classmethod
    def _e(cls, v):
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError("That email looks incomplete. Use a format like name@example.com.")
        return v

    @field_validator("password")
    @classmethod
    def _p(cls, v):
        return _check_new_password(v)

    @field_validator("topics")
    @classmethod
    def _t(cls, v):
        return _clean_topics(v)

    @field_validator("languages")
    @classmethod
    def _l(cls, v):
        return _clean_langs(v)


class LoginIn(BaseModel):
    email: str
    password: str
    remember: bool = False


class PrefsIn(BaseModel):
    country: str = ""
    region: str = ""
    languages: list[str] = []
    topics: list[str] = []

    @field_validator("topics")
    @classmethod
    def _t(cls, v):
        return _clean_topics(v)

    @field_validator("languages")
    @classmethod
    def _l(cls, v):
        return _clean_langs(v)


class PasswordIn(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def _p(cls, v):
        return _check_new_password(v)


class ViewStartIn(BaseModel):
    news_id: int
    origin: str = "other"


class ViewTickIn(BaseModel):
    seconds: int = Field(ge=0)


# ======================================================================== helpers
def user_payload(u):
    return {
        "id": u["id"], "username": u["username"], "email": u["email"],
        "country": u["country"] or "", "region": u["region"] or "",
        "languages": json.loads(u["languages"] or "[]"), "topics": json.loads(u["topics"] or "[]"),
        "createdAt": u["created_at"],
    }


def _parse_iso(text):
    try:
        dt = datetime.fromisoformat(text)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return None


def humanize(dt):
    if not dt:
        return ""
    secs = (datetime.now(timezone.utc) - dt).total_seconds()
    if secs < 90:
        return "Just now"
    if secs < 3600:
        return f"{int(secs // 60)}m ago"
    if secs < 86400:
        return f"{int(secs // 3600)}h ago"
    if secs < 172800:
        return "Yesterday"
    return dt.strftime("%d %b")


def display_summary(title, summary):
    """Google News summaries only repeat the headline: show nothing instead of a duplicate."""
    s, t = (summary or "").strip(), (title or "").strip()
    if not s or (s.startswith(t[:30]) and len(s) < len(t) + 60):
        return ""
    return s


def story(row, saved_ids=frozenset()):
    cat = row["category"] or DEFAULT_CATEGORY
    pub = _parse_iso(row["published_at"])
    return {
        "id": row["id"], "category": cat, "hue": HUES.get(cat, 210),
        "title": row["title"], "summary": display_summary(row["title"], row["summary"]), "content": [],
        "source": row["source"], "time": humanize(pub), "publishedAt": row["published_at"],
        "readMinutes": None,    # only RSS summaries are stored, so no honest reading time
        "image": row["image"], "url": row["link"],
        "tags": [t for t in (row["tags"] or "").split(",") if t],
        "saved": row["id"] in saved_ids,
    }


NEWS_COLS = "id, source, title, link, summary, published_at, category, tags, image"


def stories_by_ids(conn, ids, user_id):
    """Stories in the order of `ids`, with the reader's saved flag."""
    if not ids:
        return []
    marks = ",".join("?" * len(ids))
    rows = {r["id"]: r for r in conn.execute(f"SELECT {NEWS_COLS} FROM news WHERE id IN ({marks})", list(ids))}
    saved = {r["news_id"] for r in conn.execute(
        f"SELECT news_id FROM saved_news WHERE user_id = ? AND news_id IN ({marks})", [user_id, *ids])}
    return [story(rows[i], saved) for i in ids if i in rows]


def get_news_or_404(conn, news_id):
    row = conn.execute(f"SELECT {NEWS_COLS} FROM news WHERE id = ?", (news_id,)).fetchone()
    if not row:
        raise ApiError(404, "We couldn’t find that story.")
    return row


api = APIRouter(prefix="/api")


@api.get("/health")
def health():
    return {"ok": True}


# ======================================================================== auth
@api.post("/auth/signup", status_code=201)
def signup(body: SignupIn, conn=Depends(get_conn)):
    if conn.execute("SELECT 1 FROM users WHERE email = ?", (body.email,)).fetchone():
        raise ApiError(409, "An account with this email already exists.", "email")
    if conn.execute("SELECT 1 FROM users WHERE username = ?", (body.username,)).fetchone():
        raise ApiError(409, "That username is taken. Try another.", "username")
    try:
        cur = conn.execute(
            "INSERT INTO users (username, email, password_hash, country, region, languages, topics, created_at) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (body.username, body.email, auth.hash_password(body.password), body.country, body.region,
             json.dumps(body.languages), json.dumps(body.topics), db.utcnow_iso()))
    except sqlite3.IntegrityError:
        raise ApiError(409, "That email or username is already registered.")
    token = auth.create_session(conn, cur.lastrowid, body.remember)
    user = conn.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone()
    return {"token": token, "user": user_payload(user)}


@api.post("/auth/login")
def login(body: LoginIn, request: Request, conn=Depends(get_conn)):
    email = body.email.strip().lower()
    auth.check_throttle(email, request)
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    ok = auth.verify_password(body.password, user["password_hash"]) if user else (auth.fake_verify() or False)
    if not ok:
        auth.record_fail(email, request)
        raise ApiError(401, "Incorrect email or password.")
    auth.clear_fails(email, request)
    return {"token": auth.create_session(conn, user["id"], body.remember), "user": user_payload(user)}


@api.post("/auth/logout")
def logout(token=Depends(current_token), conn=Depends(get_conn)):
    auth.delete_session(conn, token)
    return {"ok": True}


@api.get("/me")
def me(user=Depends(current_user)):
    return user_payload(user)


@api.put("/me/preferences")
def update_preferences(body: PrefsIn, user=Depends(current_user), conn=Depends(get_conn)):
    conn.execute("UPDATE users SET country=?, region=?, languages=?, topics=? WHERE id=?",
                 (body.country, body.region, json.dumps(body.languages), json.dumps(body.topics), user["id"]))
    return user_payload(conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone())


@api.post("/me/password")
def change_password(body: PasswordIn, token=Depends(current_token), user=Depends(current_user),
                    conn=Depends(get_conn)):
    if not auth.verify_password(body.current_password, user["password_hash"]):
        raise ApiError(400, "Your current password is incorrect.", "current_password")
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (auth.hash_password(body.new_password), user["id"]))
    # sign out every other device
    conn.execute("DELETE FROM sessions WHERE user_id = ? AND token_hash != ?", (user["id"], auth._token_hash(token)))
    return {"ok": True}


# ======================================================================== news
@api.get("/news")
def list_news(page: int = Query(1, ge=1), per_page: int = Query(10, ge=1, le=50), category: str | None = None,
              user=Depends(current_user), conn=Depends(get_conn)):
    where, params = "", []
    if category:
        match = next((c for c in CATEGORY_NAMES if c.lower() == category.lower()), None)
        if not match:
            raise ApiError(400, "Unknown category.", "category")
        where, params = "WHERE COALESCE(category, ?) = ?", [DEFAULT_CATEGORY, match]
    total = conn.execute(f"SELECT COUNT(*) FROM news {where}", params).fetchone()[0]
    rows = conn.execute(
        f"SELECT {NEWS_COLS} FROM news {where} ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?",
        [*params, per_page, (page - 1) * per_page]).fetchall()
    ids = [r["id"] for r in rows]
    saved = {r["news_id"] for r in conn.execute(
        f"SELECT news_id FROM saved_news WHERE user_id = ? AND news_id IN ({','.join('?' * len(ids)) or 'NULL'})",
        [user["id"], *ids])}
    return {"items": [story(r, saved) for r in rows], "page": page, "perPage": per_page, "total": total,
            "totalPages": max(1, -(-total // per_page))}


@api.get("/news/{news_id}")
def get_news(news_id: int, user=Depends(current_user), conn=Depends(get_conn)):
    return stories_by_ids(conn, [get_news_or_404(conn, news_id)["id"]], user["id"])[0]


@api.get("/news/{news_id}/similar")
def similar_news(news_id: int, limit: int = Query(6, ge=1, le=20), user=Depends(current_user), conn=Depends(get_conn)):
    get_news_or_404(conn, news_id)
    ids = [i for i, _ in nlp.find_similar(conn, news_id, limit)]
    return {"items": stories_by_ids(conn, ids, user["id"])}


@api.get("/recommendations")
def recommendations(limit: int = Query(6, ge=1, le=20), exclude: list[int] = Query(default=[]),
                    user=Depends(current_user), conn=Depends(get_conn)):
    ids = recommend.recommend(conn, user, limit, exclude)
    return {"items": stories_by_ids(conn, ids, user["id"])}


# ======================================================================== saved
@api.get("/saved")
def saved_list(user=Depends(current_user), conn=Depends(get_conn)):
    ids = [r["news_id"] for r in conn.execute(
        "SELECT news_id FROM saved_news WHERE user_id = ? ORDER BY saved_at DESC, rowid DESC", (user["id"],))]
    return {"items": stories_by_ids(conn, ids, user["id"])}


@api.put("/saved/{news_id}")
def saved_add(news_id: int, user=Depends(current_user), conn=Depends(get_conn)):
    get_news_or_404(conn, news_id)
    conn.execute("INSERT OR IGNORE INTO saved_news (user_id, news_id, saved_at) VALUES (?,?,?)",
                 (user["id"], news_id, db.utcnow_iso()))
    return {"saved": True}


@api.delete("/saved/{news_id}")
def saved_remove(news_id: int, user=Depends(current_user), conn=Depends(get_conn)):
    conn.execute("DELETE FROM saved_news WHERE user_id = ? AND news_id = ?", (user["id"], news_id))
    return {"saved": False}


@api.get("/saved/related")
def saved_related(limit: int = Query(12, ge=1, le=30), user=Depends(current_user), conn=Depends(get_conn)):
    """Unsaved stories from the categories of the reader's saved stories, newest first."""
    cats = [r[0] for r in conn.execute(
        "SELECT DISTINCT COALESCE(n.category, ?) FROM saved_news s JOIN news n ON n.id = s.news_id WHERE s.user_id = ?",
        (DEFAULT_CATEGORY, user["id"]))]
    if not cats:
        return {"items": []}
    marks = ",".join("?" * len(cats))
    ids = [r["id"] for r in conn.execute(
        f"SELECT id FROM news WHERE COALESCE(category, ?) IN ({marks}) "
        "AND id NOT IN (SELECT news_id FROM saved_news WHERE user_id = ?) "
        "ORDER BY published_at DESC LIMIT ?", [DEFAULT_CATEGORY, *cats, user["id"], limit])]
    return {"items": stories_by_ids(conn, ids, user["id"])}


# ======================================================================== reading history + insights
MAX_VIEW_SECONDS = 6 * 3600


@api.post("/views", status_code=201)
def view_start(body: ViewStartIn, user=Depends(current_user), conn=Depends(get_conn)):
    n = get_news_or_404(conn, body.news_id)
    origin = body.origin if body.origin in {"feed", "similar", "recommended", "saved", "other"} else "other"
    now = db.utcnow_iso()
    cur = conn.execute(
        "INSERT INTO article_views (user_id, news_id, title, source, category, link, origin, started_at, last_active_at) "
        "VALUES (?,?,?,?,?,?,?,?,?)",
        (user["id"], n["id"], n["title"], n["source"], n["category"] or DEFAULT_CATEGORY, n["link"], origin, now, now))
    return {"id": cur.lastrowid}


@api.patch("/views/{view_id}")
def view_tick(view_id: int, body: ViewTickIn, user=Depends(current_user), conn=Depends(get_conn)):
    """The page sends its total visible seconds so far (absolute, so repeats are harmless)."""
    v = conn.execute("SELECT * FROM article_views WHERE id = ? AND user_id = ?", (view_id, user["id"])).fetchone()
    if not v:
        raise ApiError(404, "View not found.")
    elapsed = (datetime.now(timezone.utc) - _parse_iso(v["started_at"])).total_seconds()
    seconds = int(min(max(body.seconds, v["duration_seconds"]), elapsed + 5, MAX_VIEW_SECONDS))   # can't exceed wall clock
    conn.execute("UPDATE article_views SET duration_seconds = ?, last_active_at = ? WHERE id = ?",
                 (seconds, db.utcnow_iso(), view_id))
    return {"seconds": seconds}


@api.get("/history")
def history(limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0), category: str | None = None,
            user=Depends(current_user), conn=Depends(get_conn)):
    where, params = "user_id = ?", [user["id"]]
    if category:
        where += " AND category = ?"
        params.append(category)
    total = conn.execute(f"SELECT COUNT(*) FROM article_views WHERE {where}", params).fetchone()[0]
    rows = conn.execute(
        f"SELECT * FROM article_views WHERE {where} ORDER BY started_at DESC, id DESC LIMIT ? OFFSET ?",
        [*params, limit, offset]).fetchall()
    return {"total": total, "items": [{
        "id": r["id"], "newsId": r["news_id"], "title": r["title"], "source": r["source"], "category": r["category"],
        "hue": HUES.get(r["category"], 210), "origin": r["origin"], "url": r["link"],
        "startedAt": r["started_at"], "seconds": r["duration_seconds"]} for r in rows]}


@api.get("/insights")
def insights(days: int = Query(30, ge=1, le=365), tz: int = Query(0, ge=-840, le=840),
             user=Depends(current_user), conn=Depends(get_conn)):
    """tz = the reader's UTC offset in minutes (India = 330) so 'per day' matches their calendar."""
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(days=days)).replace(microsecond=0).isoformat()
    uid = user["id"]

    t = conn.execute(
        "SELECT COALESCE(SUM(duration_seconds),0) s, COUNT(*) v, COUNT(DISTINCT news_id) a "
        "FROM article_views WHERE user_id = ? AND started_at >= ?", (uid, cutoff)).fetchone()
    total_s = t["s"]

    cats = conn.execute(
        "SELECT category, SUM(duration_seconds) s, COUNT(*) v FROM article_views "
        "WHERE user_id = ? AND started_at >= ? GROUP BY category ORDER BY s DESC, v DESC", (uid, cutoff)).fetchall()
    by_category = [{"category": c["category"], "hue": HUES.get(c["category"], 210), "seconds": c["s"], "views": c["v"],
                    "share": round(c["s"] / total_s, 4) if total_s else 0} for c in cats]

    local_today = (now + timedelta(minutes=tz)).date()
    per_day = {r["d"]: r["s"] for r in conn.execute(
        "SELECT date(started_at, ?) d, SUM(duration_seconds) s FROM article_views "
        "WHERE user_id = ? AND started_at >= ? GROUP BY d", (f"{tz:+d} minutes", uid, cutoff))}
    daily = []
    for i in range(min(days, 30) - 1, -1, -1):
        d = (local_today - timedelta(days=i)).isoformat()
        daily.append({"date": d, "seconds": per_day.get(d, 0)})

    sources = conn.execute(
        "SELECT source, SUM(duration_seconds) s, COUNT(*) v FROM article_views "
        "WHERE user_id = ? AND started_at >= ? GROUP BY source ORDER BY s DESC LIMIT 5", (uid, cutoff)).fetchall()
    origins = conn.execute(
        "SELECT origin, COUNT(*) v FROM article_views WHERE user_id = ? AND started_at >= ? GROUP BY origin",
        (uid, cutoff)).fetchall()

    return {
        "days": days,
        "totalSeconds": total_s, "views": t["v"], "articles": t["a"],
        "avgSecondsPerView": round(total_s / t["v"]) if t["v"] else 0,
        "topCategory": by_category[0]["category"] if by_category and by_category[0]["seconds"] else None,
        "byCategory": by_category, "daily": daily,
        "topSources": [{"source": s["source"], "seconds": s["s"], "views": s["v"]} for s in sources],
        "origins": {o["origin"]: o["v"] for o in origins},
    }


app.include_router(api)

# ---- optional: serve the built React app (npm run build -> ../daybreak-react/dist) from this same server
DIST = os.getenv("DAYBREAK_DIST", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "daybreak-react", "dist"))
if os.path.isdir(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        file = os.path.join(DIST, path)
        return FileResponse(file if path and os.path.isfile(file) else os.path.join(DIST, "index.html"))
