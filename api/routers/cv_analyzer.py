"""CV Analyzer API - upload CV, extract text, and generate objective AI feedback."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from api.deps import get_current_username
from career_aid_pro.config import MAX_UPLOAD_MB
from career_aid_pro.cv_analysis import analyze_cv_score, extract_cv_text
from career_aid_pro.ai_client import check_ai_service
from career_aid_pro.ai_feedback import generate_cv_feedback_report
from career_aid_pro import database as db

router = APIRouter(prefix="/cv-analyzer", tags=["cv-analyzer"])

ALLOWED = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/webp",
}


def _validate_upload_type(file: UploadFile) -> None:
    mime = file.content_type or ""
    if mime in ALLOWED:
        return
    from career_aid_pro.cv_analysis import _guess_mime

    guessed = _guess_mime(file.filename or "")
    if guessed in ALLOWED:
        return
    raise HTTPException(status_code=400, detail=f"Unsupported file type: {mime or file.filename or 'unknown'}")


@router.post("/analyze")
async def analyze_cv(
    file: UploadFile = File(...),
    username: str = Depends(get_current_username),
) -> dict:
    """Upload a CV, extract text, compute heuristic score, and generate detailed AI feedback."""
    content = await file.read()
    if len(content) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Max file size is {MAX_UPLOAD_MB} MB")

    _validate_upload_type(file)
    mime = file.content_type or ""

    from career_aid_pro.uploads import MemoryUpload

    wrapper = MemoryUpload(content, file.filename or "upload", mime)
    text, err = extract_cv_text(wrapper)
    if err:
        raise HTTPException(status_code=400, detail=err)
    if not text.strip():
        raise HTTPException(status_code=400, detail="No text extracted from file")

    heuristics = analyze_cv_score(text)

    report = None
    if check_ai_service():
        try:
            report = generate_cv_feedback_report(
                cv_text=text,
                heuristic_analysis=heuristics,
            )
        except Exception as e:
            # Don't fail the entire request if report generation fails.
            report = f"Could not generate AI feedback report: {e!s}"

    # Persist score/feedback (keep current schema usage)
    db.insert_cv_score(
        username,
        int(heuristics.get("total_score") or 0),
        heuristics.get("breakdown") or {},
        [
            report
            if isinstance(report, str)
            else "AI feedback report generated"
            if report
            else "",
            *([]),
        ],
    )

    return {
        "text": text,
        "filename": file.filename,
        "analysis": heuristics,
        "feedback_report": report,
    }
