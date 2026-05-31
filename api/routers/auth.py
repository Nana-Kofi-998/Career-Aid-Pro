"""Authentication routes."""

from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock

from fastapi import APIRouter, HTTPException, status

from api.schemas import LoginRequest, RegisterRequest, TokenResponse, UserPublic
from api.security import create_access_token
from career_aid_pro import database as db
from career_aid_pro.auth import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

# Simple in-memory rate limiting
_login_attempts: dict[str, list[float]] = defaultdict(list)
_register_attempts: dict[str, list[float]] = defaultdict(list)
_rate_lock = Lock()
RATE_LIMIT_WINDOW = 300  # 5 minutes
RATE_LIMIT_MAX_LOGIN = 5
RATE_LIMIT_MAX_REGISTER = 3


def _cleanup_old_attempts(attempts: dict[str, list[float]], window: float) -> None:
    """Remove attempts older than the window."""
    now = time.time()
    for ip in list(attempts.keys()):
        attempts[ip] = [t for t in attempts[ip] if now - t < window]
        if not attempts[ip]:
            del attempts[ip]


def _check_rate_limit(
    attempts: dict[str, list[float]], 
    key: str, 
    max_attempts: int, 
    window: float
) -> bool:
    """Check if rate limit is exceeded. Returns True if allowed."""
    with _rate_lock:
        _cleanup_old_attempts(attempts, window)
        now = time.time()
        recent = [t for t in attempts.get(key, []) if now - t < window]
        if len(recent) >= max_attempts:
            return False
        attempts[key].append(now)
        return True


def _public_user(row: dict) -> UserPublic:
    return UserPublic(
        username=row["username"],
        first_name=row.get("first_name") or "",
        last_name=row.get("last_name") or "",
        age=row.get("age") or 18,
        gender=row.get("gender") or "",
        learner_profile=row.get("learner_profile") or "general",
        personality_summary=row.get("personality_summary") or "",
    )


@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest) -> TokenResponse:
    # Rate limiting
    client_key = body.username.strip().lower()
    if not _check_rate_limit(_register_attempts, client_key, RATE_LIMIT_MAX_REGISTER, RATE_LIMIT_WINDOW):
        raise HTTPException(
            status_code=429,
            detail="Too many registration attempts. Please try again later."
        )
    
    clean_username = body.username.strip()
    
    # Validate first name
    if not body.first_name.strip():
        raise HTTPException(status_code=400, detail="First name is required")
    
    ok = db.create_user(
        clean_username,
        hash_password(body.password),
        body.first_name.strip(),
        body.last_name.strip(),
        body.age,
        body.gender,
        body.learner_profile,
    )
    if not ok:
        raise HTTPException(status_code=400, detail="Username already exists")
    db.update_last_login(clean_username)
    row = db.get_user(clean_username)
    if not row:
        raise HTTPException(status_code=500, detail="Could not load created user")
    token = create_access_token(clean_username)
    return TokenResponse(access_token=token, user=_public_user(row))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest) -> TokenResponse:
    # Rate limiting
    client_key = body.username.strip().lower()
    if not _check_rate_limit(_login_attempts, client_key, RATE_LIMIT_MAX_LOGIN, RATE_LIMIT_WINDOW):
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Please try again later."
        )
    
    username = body.username.strip()
    row = db.get_user(username)
    if not row or not verify_password(row["password"], body.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    db.update_last_login(username)
    token = create_access_token(username)
    return TokenResponse(access_token=token, user=_public_user(row))
