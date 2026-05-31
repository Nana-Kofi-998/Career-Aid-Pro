"""Personality / temperament assessment API."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from api.deps import get_current_user, get_current_username
from career_aid_pro import database as db
from career_aid_pro.personality_assessment import (
    ASSESSMENT_COUNT,
    _QUESTIONS_POOL,
    build_profile,
    get_questions,
    parse_stored_profile,
    profile_to_storage,
)

router = APIRouter(prefix="/personality", tags=["personality"])


class SubmitAnswers(BaseModel):
    answers: dict[str, int] = Field(..., description="question_id -> 1-5")
    seed: int = Field(..., description="Seed from the questions response")


class KidSubmitAnswers(BaseModel):
    answers: dict[str, int] = Field(..., description="question_id -> 1-5")


@router.get("/questions")
def questions(
    randomize: bool = Query(True, description="Shuffle questions each session"),
    count: int = Query(ASSESSMENT_COUNT, ge=1, le=40),
    seed: int | None = Query(None, description="Optional fixed seed"),
) -> dict:
    qs, used_seed = get_questions(randomize=randomize, count=count, seed=seed)
    return {"questions": qs, "seed": used_seed, "total_in_pool": len(_QUESTIONS_POOL)}


@router.get("/profile")
def get_profile(user: dict = Depends(get_current_user)) -> dict:
    raw = user.get("personality_summary") or ""
    parsed = parse_stored_profile(raw)
    if not parsed:
        return {"has_profile": False, "profile": None}
    return {"has_profile": True, "profile": parsed}


@router.post("/submit")
def submit_assessment(
    body: SubmitAnswers,
    username: str = Depends(get_current_username),
) -> dict:
    expected_questions, _ = get_questions(randomize=True, count=ASSESSMENT_COUNT, seed=body.seed)
    expected_ids = {q["id"] for q in expected_questions}
    answer_ids = set(body.answers)
    if answer_ids != expected_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Please answer the exact {ASSESSMENT_COUNT} questions from this assessment session",
        )
    for qid, val in body.answers.items():
        if val < 1 or val > 5:
            raise HTTPException(status_code=400, detail=f"Invalid score for {qid}")
    profile = build_profile(body.answers)
    stored = profile_to_storage(profile)
    if not db.update_personality_summary(username, stored):
        raise HTTPException(status_code=500, detail="Could not save profile")
    return {"ok": True, "profile": profile}


@router.post("/kid-submit")
def submit_kid_personality(
    body: KidSubmitAnswers,
    username: str = Depends(get_current_username),
) -> dict:
    if len(body.answers) < 10:
        raise HTTPException(status_code=400, detail="Please answer all 10 questions")
    for qid, val in body.answers.items():
        if val < 1 or val > 5:
            raise HTTPException(status_code=400, detail=f"Invalid score for {qid}")
    
    total = sum(body.answers.values())
    avg = total / len(body.answers)
    
    if avg >= 4:
        profile = "Creative Explorer"
    elif avg >= 3:
        profile = "Curious Learner"
    else:
        profile = "Careful Thinker"
    
    stored = f"KidProfile:{profile}"
    if not db.update_personality_summary(username, stored):
        raise HTTPException(status_code=500, detail="Could not save profile")
    return {"profile": profile, "ok": True}
