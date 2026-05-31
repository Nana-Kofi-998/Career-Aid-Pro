"""FastAPI dependencies."""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from api.security import decode_token
from career_aid_pro import database as db

_bearer = HTTPBearer(auto_error=False)


def get_current_username(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    if not creds or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    username = decode_token(creds.credentials)
    if not username or not db.get_user(username):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return username


def get_current_user(username: str = Depends(get_current_username)) -> dict:
    user = db.get_user(username)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
