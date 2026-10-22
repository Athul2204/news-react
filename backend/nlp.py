"""
Categorisation + similarity.

Categorisation
  * with `sentence-transformers` installed  -> meaning based (multilingual, works for Malayalam)
  * without it                              -> keyword scoring (English only), so everything still runs
Similar stories
  * uses the stored embeddings when the article has one, otherwise TF-IDF on title + summary.
"""
import os
import re
from datetime import datetime, timedelta, timezone

import numpy as np

from catalog import CATEGORIES, CATEGORY_NAMES, DEFAULT_CATEGORY, KEYWORDS_ML

MODEL_NAME = os.getenv("DAYBREAK_MODEL", "paraphrase-multilingual-MiniLM-L12-v2")
SECONDARY_THRESHOLD = 0.30   # min similarity for an extra tag (tune by eye)
PRIOR_BONUS_EMB = 0.08       # nudge for topic feeds (e.g. BBC Sport -> Sports)
PRIOR_BONUS_KW = 2.0
MAX_SECONDARY = 2
MIN_BEST_SIM = 0.15          # below this and no prior -> default category
SIM_MIN_EMBEDDING = 0.40     # min cosine for "similar story" with embeddings (tune by eye)
SIM_MIN_TFIDF = 0.14         # same for the TF-IDF fallback (calibrated on real articles)

KERALA_RE = re.compile(
    r"\b(kerala|thiruvananthapuram|trivandrum|kochi|cochin|kozhikode|calicut|thrissur|kollam|kannur|"
    r"malappuram|palakkad|alappuzha|wayanad|idukki|pinarayi|sabarimala)\b", re.I)
GN_PUBLISHER_RE = re.compile(r"\s+[-–|]\s+[^-–|]{2,40}$")   # "Headline - The Hindu" (Google News)

_KW_RE = {
    name: re.compile(r"\b(?:%s)\b" % "|".join(re.escape(k) for k in sorted(c["keywords"], key=len, reverse=True)), re.I)
    for name, c in CATEGORIES.items() if c["keywords"]
}

_CHILLU = {"\u0D23\u0D4D\u200D": "\u0D7A", "\u0D28\u0D4D\u200D": "\u0D7B", "\u0D30\u0D4D\u200D": "\u0D7C",
           "\u0D32\u0D4D\u200D": "\u0D7D", "\u0D33\u0D4D\u200D": "\u0D7E", "\u0D15\u0D4D\u200D": "\u0D7F"}


def normalize_ml(text):
    """Old-style chillu letters (ര + ് + ZWJ) -> the modern single character, so spelling variants match."""
    for old, new in _CHILLU.items():
        text = text.replace(old, new)
    return text.replace("\u200d", "").replace("\u200c", "")   # stray joiners differ between publishers


# Malayalam stems: match at the start of a word, any ending allowed
_ML_RE = {
    name: re.compile(r"(?<![\u0D00-\u0D7F])(?:%s)" % "|".join(
        re.escape(normalize_ml(k).rstrip("\u0D4D")) for k in sorted(stems, key=len, reverse=True)))
    for name, stems in KEYWORDS_ML.items()
}


# ------------------------------------------------------------------ embeddings
_model = None
_model_tried = False
_cat_emb = None


SEMANTIC = os.getenv("DAYBREAK_SEMANTIC") == "1"   # off by default: the AI model is slow to load


def enable_semantic(on=True):
    global SEMANTIC
    SEMANTIC = on


def get_model():
    """The embedding model, loaded only when semantic mode is on (python collector.py --semantic)."""
    global _model, _model_tried
    if not SEMANTIC:
        return None
    if _model_tried:
        return _model
    _model_tried = True
    try:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(MODEL_NAME)
    except Exception as exc:   # not installed / no internet for the first download
        print(f"[nlp] semantic model unavailable ({exc.__class__.__name__}); using keywords instead "
              "(pip install -r requirements-semantic.txt)")
        _model = None
    return _model


def embed(texts):
    """-> unit-length float32 array (n, dim) or None when no model."""
    model = get_model()
    if model is None or not texts:
        return None
    vecs = model.encode([t[:512] for t in texts], batch_size=32, show_progress_bar=False)
    vecs = np.asarray(vecs, dtype="float32")
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    return vecs / np.clip(norms, 1e-9, None)


def to_blob(vec):
    return np.asarray(vec, dtype="float32").tobytes()


def from_blob(blob):
    return np.frombuffer(blob, dtype="float32")


def _category_embeddings():
    global _cat_emb
    if _cat_emb is None:
        _cat_emb = embed([CATEGORIES[n]["desc"] for n in CATEGORY_NAMES])
    return _cat_emb


# ------------------------------------------------------------------ helpers
def clean_title(title, source=""):
    """Google News appends ' - Publisher' to titles; drop it before analysing the text."""
    if source.startswith("Google News"):
        return GN_PUBLISHER_RE.sub("", title or "")
    return title or ""


def text_of(item):
    title = clean_title(item.get("title", ""), item.get("source", ""))
    summary = item.get("summary") or ""
    if summary.strip().startswith(title[:30]) and len(summary) < len(title) + 60:
        summary = ""   # Google News summaries just repeat the headline
    return f"{title}. {summary}".strip()


def keyword_scores(item):
    title = clean_title(item.get("title", ""), item.get("source", ""))
    summary = item.get("summary") or ""
    title_ml, summary_ml = normalize_ml(title), normalize_ml(summary)
    scores = {}
    for name in CATEGORY_NAMES:
        t = s_ = 0
        if name in _KW_RE:
            t += len(_KW_RE[name].findall(title))
            s_ += len(_KW_RE[name].findall(summary))
        if name in _ML_RE:
            t += len(_ML_RE[name].findall(title_ml))
            s_ += len(_ML_RE[name].findall(summary_ml))
        scores[name] = 2 * t + min(s_, 3)
    return scores


def regions(item, feed_region):
    out = []
    if feed_region:
        out.append(feed_region)
    text = f"{item.get('title', '')} {item.get('summary', '')}"
    if (KERALA_RE.search(text) or re.search(r"[\u0D00-\u0D7F]", text)) and "Kerala" not in out:
        out.append("Kerala")
    if "Kerala" in out and "India" not in out:
        out.insert(0, "India")
    return out


# ------------------------------------------------------------------ classify
def classify(items, feed_info=None):
    """
    items:     [{title, summary, source}]
    feed_info: {source: (region, prior_category)} (from catalog.FEEDS)
    returns:   [{category, tags: [..], embedding: bytes|None}]
    """
    feed_info = feed_info or {}
    texts = [text_of(i) for i in items]
    emb = embed(texts)
    cat_emb = _category_embeddings() if emb is not None else None
    results = []

    for idx, item in enumerate(items):
        region, prior = feed_info.get(item.get("source"), (None, None))
        secondary = []

        if emb is not None:
            sims = dict(zip(CATEGORY_NAMES, (emb[idx] @ cat_emb.T).tolist()))
            adj = {n: s + (PRIOR_BONUS_EMB if n == prior else 0) for n, s in sims.items()}
            category = max(adj, key=adj.get)
            if adj[category] < MIN_BEST_SIM and not prior:
                category = DEFAULT_CATEGORY
            ranked = sorted(sims.items(), key=lambda x: -x[1])
            secondary = [n for n, s in ranked if n != category and s >= SECONDARY_THRESHOLD][:MAX_SECONDARY]
        else:
            scores = keyword_scores(item)
            if prior:
                scores[prior] = scores.get(prior, 0) + PRIOR_BONUS_KW
            best = max(scores.values(), default=0)
            if best <= 0:
                category = prior or DEFAULT_CATEGORY
            else:
                # ties go to the prior category, then to catalog order
                tied = [n for n, s in scores.items() if s == best]
                category = prior if prior in tied else tied[0]
            secondary = [n for n, s in sorted(scores.items(), key=lambda x: -x[1])
                         if n != category and s >= 3][:MAX_SECONDARY]

        tags = regions(item, region) + secondary
        results.append({
            "category": category,
            "tags": tags,
            "embedding": to_blob(emb[idx]) if emb is not None else None,
        })
    return results


# ------------------------------------------------------------------ similar stories
_tfidf_cache = {"key": None, "vec": None, "matrix": None, "ids": None}
TOKEN_PATTERN = r"[\w\u0900-\u0DFF]{2,}"   # \w plus Devanagari/Tamil/Malayalam ranges (combining marks)


def _window_cutoff(days):
    return (datetime.now(timezone.utc) - timedelta(days=days)).replace(microsecond=0).isoformat()


def find_similar(conn, news_id, limit=6, window_days=30, max_candidates=3000):
    """Most similar stories to `news_id`, best first. Returns [(id, score)]."""
    target = conn.execute(
        "SELECT id, title, summary, source, category, embedding FROM news WHERE id = ?", (news_id,)).fetchone()
    if not target:
        return []
    rows = conn.execute(
        "SELECT id, title, summary, source, category, embedding, published_at FROM news "
        "WHERE id != ? AND published_at >= ? ORDER BY published_at DESC LIMIT ?",
        (news_id, _window_cutoff(window_days), max_candidates)).fetchall()
    if not rows:
        return []

    scored = []
    if target["embedding"] is not None:
        cand = [r for r in rows if r["embedding"] is not None]
        if cand:
            mat = np.vstack([from_blob(r["embedding"]) for r in cand])
            sims = mat @ from_blob(target["embedding"])
            scored = list(zip([r for r in cand], sims.tolist()))
    if not scored:
        from sklearn.feature_extraction.text import TfidfVectorizer
        docs = [text_of(dict(r)) for r in rows]
        vec = TfidfVectorizer(token_pattern=TOKEN_PATTERN, lowercase=True, stop_words="english", sublinear_tf=True)
        try:
            mat = vec.fit_transform(docs + [text_of(dict(target))])
        except ValueError:   # empty vocabulary
            return []
        sims = (mat[:-1] @ mat[-1].T).toarray().ravel()
        scored = list(zip(rows, sims.tolist()))

    ranked = []
    for r, s in scored:
        bonus = 0.04 if r["category"] == target["category"] else 0.0
        ranked.append((r["id"], s + bonus, s))
    ranked.sort(key=lambda x: -x[1])
    min_sim = SIM_MIN_EMBEDDING if target["embedding"] is not None else SIM_MIN_TFIDF
    # only genuinely related stories: an empty list is better than padding with unrelated ones
    return [(i, sc) for i, sc, raw in ranked if raw >= min_sim][:limit]
