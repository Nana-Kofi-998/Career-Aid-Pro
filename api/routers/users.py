"""User profile and dashboard."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from api.deps import get_current_user, get_current_username
from api.schemas import DashboardStats, PersonalityUpdate, ProfileUpdate, UserPublic
from career_aid_pro import database as db
from career_aid_pro.ai_client import check_ai_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
def me(user: dict = Depends(get_current_user)) -> UserPublic:
    return UserPublic(
        username=user["username"],
        first_name=user.get("first_name") or "",
        last_name=user.get("last_name") or "",
        age=user.get("age") or 18,
        gender=user.get("gender") or "",
        learner_profile=user.get("learner_profile") or "general",
        personality_summary=user.get("personality_summary") or "",
    )


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(username: str = Depends(get_current_username)) -> DashboardStats:
    row = db.get_user(username)
    return DashboardStats(
        total_chats=db.count_chats(username),
        cv_scores=db.count_cv_scores(username),
        last_login=row.get("last_login") if row else None,
        ai_service_online=check_ai_service(),
    )


@router.patch("/me")
def update_profile(
    body: ProfileUpdate,
    username: str = Depends(get_current_username),
) -> dict:
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if not db.update_user_profile(username, updates):
        raise HTTPException(status_code=500, detail="Could not update profile")
    row = db.get_user(username)
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True, "user": UserPublic(
        username=row["username"],
        first_name=row.get("first_name") or "",
        last_name=row.get("last_name") or "",
        age=row.get("age") or 18,
        gender=row.get("gender") or "",
        learner_profile=row.get("learner_profile") or "general",
        personality_summary=row.get("personality_summary") or "",
    )}


@router.patch("/me/personality")
def update_personality(
    body: PersonalityUpdate,
    username: str = Depends(get_current_username),
) -> dict:
    if not db.update_personality_summary(username, body.personality_summary.strip()):
        raise HTTPException(status_code=500, detail="Could not save")
    return {"ok": True}


@router.delete("/me")
def delete_account(username: str = Depends(get_current_username)) -> dict:
    if not db.delete_user(username):
        raise HTTPException(status_code=500, detail="Could not delete account")
    return {"ok": True}
