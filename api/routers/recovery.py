"""Password recovery and reset endpoints."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from career_aid_pro import database as db
from career_aid_pro.auth import hash_password

router = APIRouter(prefix="/auth/recovery", tags=["recovery"])


class ForgotRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)


class ResetRequest(BaseModel):
    token: str = Field(min_length=1)
    password: str = Field(min_length=8, max_length=128)


@router.post("/forgot")
def forgot_password(body: ForgotRequest):
    """
    Generate a secure cryptographically random reset token for the username
    and store it with a 1-hour expiration window.
    """
    username = body.username.strip()
    user = db.get_user(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Username not found.",
        )

    # Generate a cryptographically secure 32-character hex token
    token = secrets.token_hex(16)
    # Set expiration to 1 hour from now
    expiry = (datetime.now() + timedelta(hours=1)).isoformat()

    if not db.set_reset_token(username, token, expiry):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate reset token. Please try again.",
        )

    # Return the token directly for testing/development environments (since we don't have SMTP configured)
    return {
        "ok": True,
        "detail": "Password reset token successfully generated.",
        "reset_token": token,
    }


@router.post("/reset")
def reset_password(body: ResetRequest):
    """
    Verify the reset token is valid and unexpired, hash the new password,
    and save it in the database.
    """
    token = body.token.strip()
    user = db.get_user_by_reset_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or unrecognized password reset token.",
        )

    # Check token expiration
    try:
        expiry_time = datetime.fromisoformat(user["reset_token_expires"])
        if datetime.now() > expiry_time:
            raise ValueError()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your password reset token has expired. Please request a new one.",
        )

    # Hash and save the new password
    hashed_password = hash_password(body.password)
    if not db.update_user_password(user["username"], hashed_password):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save new password. Please try again.",
        )

    return {
        "ok": True,
        "detail": "Your password has been successfully updated.",
    }
