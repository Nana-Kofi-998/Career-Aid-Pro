"""CV builder API — generate formatted CV from structured answers."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from api.deps import get_current_user
from career_aid_pro import database as db
from career_aid_pro.cv_builder import extract_career_chat_context, generate_cv
from career_aid_pro.personality_assessment import parse_stored_profile

router = APIRouter(prefix="/cv-builder", tags=["cv-builder"])


class ExperienceItem(BaseModel):
    title: str = ""
    company: str = ""
    dates: str = ""
    bullets: list[str] | str = Field(default_factory=list)


class EducationItem(BaseModel):
    degree: str = ""
    school: str = ""
    year: str = ""


class CvBuilderRequest(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    target_role: str = ""
    professional_summary: str = ""
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    skills: str = ""
    certifications: str = ""
    languages: str = ""
    use_ai: bool = True
    use_chat_context: bool = True
    cv_template: str = "sidebar"
    improvement_notes: list[str] = Field(default_factory=list)


CV_TEMPLATES = {
    "sidebar",
    "twocolumn",
    "timeline",
    "minimalist",
    "infographic",
    "centered",
    "boxed",
    "dark",
    "lined",
    "classic",
    "executive",
    "atelier",
    "metro",
    "editorial",
    "compact",
    "accentbar",
    "portfolio",
    "consultant",
    "graduate",
    "tech",
}


@router.post("/generate")
def build_cv(body: CvBuilderRequest, user: dict = Depends(get_current_user)) -> dict:
    data = {
        "full_name": body.full_name,
        "email": body.email,
        "phone": body.phone,
        "location": body.location,
        "linkedin": body.linkedin,
        "target_role": body.target_role,
        "professional_summary": body.professional_summary,
        "skills": body.skills,
        "certifications": body.certifications,
        "languages": body.languages,
        "improvement_notes": [note.strip() for note in body.improvement_notes if note.strip()][:8],
    }
    data["experience"] = []
    for e in body.experience:
        bullets = e.bullets
        if isinstance(bullets, str):
            bullets = [b.strip() for b in bullets.split("\n") if b.strip()]
        data["experience"].append(
            {"title": e.title, "company": e.company, "dates": e.dates, "bullets": bullets}
        )
    data["education"] = [e.model_dump() for e in body.education]

    if not data.get("full_name"):
        data["full_name"] = " ".join(
            filter(None, [user.get("first_name"), user.get("last_name")])
        ).strip() or user.get("username", "")

    chat_context = ""
    if body.use_chat_context:
        chats = db.list_recent_chats(user["username"], limit=30, include_history=True)
        chat_context = extract_career_chat_context(chats)

    # Add personality insights to context
    personality_raw = user.get("personality_summary") or ""
    personality = parse_stored_profile(personality_raw)
    personality_context = ""
    if personality and personality.get("cv_insights"):
        personality_context = "CV insights from temperament profile:\n" + "\n".join(f"- {tip}" for tip in personality["cv_insights"][:5])

    combined_context = chat_context
    if personality_context:
        combined_context = personality_context + "\n\n" + chat_context

    template = body.cv_template if body.cv_template in CV_TEMPLATES else "sidebar"
    result = generate_cv(data, chat_context=combined_context, use_ai=body.use_ai, template=template)
    return result
