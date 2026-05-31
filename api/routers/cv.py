"""CV upload, extract, score."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from api.deps import get_current_username
from career_aid_pro import database as db
from career_aid_pro.config import MAX_UPLOAD_MB
from career_aid_pro.cv_analysis import analyze_cv_score, extract_cv_text
from career_aid_pro.pdf_export import build_cv_score_pdf
from career_aid_pro.uploads import MemoryUpload

router = APIRouter(prefix="/cv", tags=["cv"])

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


@router.post("/process")
async def process_cv(
    file: UploadFile = File(...),
    username: str = Depends(get_current_username),
) -> dict:
    """Extract text and score in one request (avoids double-upload issues)."""
    content = await file.read()
    if len(content) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Max file size is {MAX_UPLOAD_MB} MB")
    _validate_upload_type(file)
    wrapper = MemoryUpload(content, file.filename or "upload", file.content_type or "")
    text, err = extract_cv_text(wrapper)
    if err:
        raise HTTPException(status_code=400, detail=err)
    if not text.strip():
        raise HTTPException(status_code=400, detail="No text extracted from file")
    analysis = analyze_cv_score(text)
    db.insert_cv_score(
        username,
        int(analysis["total_score"]),
        analysis["breakdown"],
        analysis["feedback"],
    )
    return {
        "text": text,
        "filename": file.filename,
        "analysis": analysis,
    }


@router.post("/extract")
async def extract_cv(
    file: UploadFile = File(...),
    username: str = Depends(get_current_username),
) -> dict:
    _ = username
    content = await file.read()
    if len(content) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Max file size is {MAX_UPLOAD_MB} MB")
    _validate_upload_type(file)
    wrapper = MemoryUpload(content, file.filename or "upload", file.content_type or "")
    text, err = extract_cv_text(wrapper)
    if err:
        raise HTTPException(status_code=400, detail=err)
    if not text.strip():
        raise HTTPException(status_code=400, detail="No text extracted")
    return {"text": text, "filename": file.filename}


@router.post("/score")
async def score_cv(
    file: UploadFile = File(...),
    username: str = Depends(get_current_username),
) -> dict:
    content = await file.read()
    if len(content) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Max file size is {MAX_UPLOAD_MB} MB")
    _validate_upload_type(file)
    wrapper = MemoryUpload(content, file.filename or "upload", file.content_type or "")
    text, err = extract_cv_text(wrapper)
    if err:
        raise HTTPException(status_code=400, detail=err)
    if not text.strip():
        raise HTTPException(status_code=400, detail="No text extracted from file")
    analysis = analyze_cv_score(text)
    db.insert_cv_score(
        username,
        int(analysis["total_score"]),
        analysis["breakdown"],
        analysis["feedback"],
    )
    pdf_bytes = build_cv_score_pdf(username, analysis)
    return {
        "analysis": analysis,
        "pdf_base64": None,
        "pdf_available": True,
        "pdf_bytes_len": len(pdf_bytes),
    }


@router.post("/score-text")
def score_text(body: dict, username: str = Depends(get_current_username)) -> dict:
    text = (body.get("text") or "").strip()
    if len(text) < 20:
        raise HTTPException(status_code=400, detail="Text too short")
    analysis = analyze_cv_score(text)
    db.insert_cv_score(
        username,
        int(analysis["total_score"]),
        analysis["breakdown"],
        analysis["feedback"],
    )
    return {"analysis": analysis}
