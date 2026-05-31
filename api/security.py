"""JWT helpers for API authentication."""

from __future__ import annotations

import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

# Generate a secure process-local key if not set, instead of accepting a public default.
SECRET_KEY = os.environ.get("CAREER_AID_JWT_SECRET")

if not SECRET_KEY:
    import warnings

    SECRET_KEY = secrets.token_urlsafe(64)
    warnings.warn(
        "CAREER_AID_JWT_SECRET is not set. Using a temporary random JWT secret; "
        "existing sessions will expire when the API restarts. Set CAREER_AID_JWT_SECRET "
        "for stable production sessions.",
        UserWarning
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.environ.get("CAREER_AID_TOKEN_HOURS", "72"))


def create_access_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": username, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> str | None:
    try:
        payload: dict[str, Any] = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        return str(sub) if sub else None
    except JWTError:
        return None
