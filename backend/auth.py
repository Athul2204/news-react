"""Password hashing, sessions (opaque bearer tokens) and login throttling."""
import base64
import hashlib
import hmac
import os
import secrets
import time
from datetime import datetime, timedelta, timezone

from fastapi import Depends, Header, HTTPException, Request

import db

SESSION_DAYS_REMEMBER = 30
SESSION_DAYS_DEFAULT = 1
MAX_FAILS = 5
LOCK_SECONDS = 15 * 60

# scrypt parameters (stdlib, no extra dependency)
_N, _R, _P = 2 ** 14, 8, 1


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=_N, r=_R, p=_P, dklen=32)
    return "scrypt${}${}${}${}${}".format(_N, _R, _P, base64.b64encode(salt).decode(), base64.b64encode(digest).decode())


def verify_password(password: str, stored: str) -> bool:
    try:
        _, n, r, p, salt, digest = stored.split("$")
        calc = hashlib.scrypt(password.encode(), salt=base64.b64decode(salt), n=int(n), r=int(r), p=int(p), dklen=32)
        return hmac.compare_digest(calc, base64.b64decode(digest))
    except Exception:
        return False


_DUMMY_HASH = hash_password("dummy-password-for-timing")   # verified when the email is unknown (same response time)


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(conn, user_id: int, remember: bool) -> str:
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    days = SESSION_DAYS_REMEMBER if remember else SESSION_DAYS_DEFAULT
    conn.execute("DELETE FROM sessions WHERE expires_at < ?", (now.isoformat(),))
    conn.execute(
        "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?,?,?,?)",
        (_token_hash(token), user_id, now.isoformat(), (now + timedelta(days=days)).isoformat()))
    return token


def delete_session(conn, token: str):
    conn.execute("DELETE FROM sessions WHERE token_hash = ?", (_token_hash(token),))


# ---------------------------------------------------------------- throttling (in memory)
_fails: dict[str, list[float]] = {}


def _key(email: str, request: Request) -> str:
    ip = request.client.host if request.client else "?"
    return f"{email.lower()}|{ip}"


def check_throttle(email: str, request: Request):
    key = _key(email, request)
    now = time.time()
    recent = [t for t in _fails.get(key, []) if now - t < LOCK_SECONDS]
    _fails[key] = recent
    if len(recent) >= MAX_FAILS:
        wait = int((LOCK_SECONDS - (now - recent[0])) / 60) + 1
        raise HTTPException(429, f"Too many failed attempts. Try again in {wait} minute{'s' if wait != 1 else ''}.")


def record_fail(email: str, request: Request):
    _fails.setdefault(_key(email, request), []).append(time.time())


def clear_fails(email: str, request: Request):
    _fails.pop(_key(email, request), None)


def fake_verify():
    verify_password("x", _DUMMY_HASH)


# ---------------------------------------------------------------- FastAPI dependencies
def get_conn():
    conn = db.connect()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def _bearer(authorization: str | None) -> str | None:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip() or None
    return None


def current_token(authorization: str | None = Header(default=None)) -> str:
    token = _bearer(authorization)
    if not token:
        raise HTTPException(401, "Please log in.")
    return token


def current_user(token: str = Depends(current_token), conn=Depends(get_conn)):
    row = conn.execute(
        "SELECT u.*, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?",
        (_token_hash(token),)).fetchone()
    if not row or row["expires_at"] < datetime.now(timezone.utc).isoformat():
        raise HTTPException(401, "Your session has expired. Please log in again.")
    return row
