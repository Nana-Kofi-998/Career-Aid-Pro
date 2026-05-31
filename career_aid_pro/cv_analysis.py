"""CV text extraction and heuristic scoring (0–100)."""

from __future__ import annotations

import base64
import io
import re
from typing import Any

import requests

from career_aid_pro.config import AI_SERVICE_BASE, MODEL_VISION


def _guess_mime(name: str) -> str:
    lower = name.lower()
    if lower.endswith(".pdf"):
        return "application/pdf"
    if lower.endswith(".docx"):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    if lower.endswith(".txt"):
        return "text/plain"
    if lower.endswith(".png"):
        return "image/png"
    if lower.endswith((".jpg", ".jpeg")):
        return "image/jpeg"
    if lower.endswith(".webp"):
        return "image/webp"
    return ""


def extract_cv_text(uploaded_file) -> tuple[str, str | None]:
    """
    Extract text from an uploaded CV-like file.
    Returns (text, error_message_or_None).
    """
    file_type = getattr(uploaded_file, "type", None) or ""
    name = getattr(uploaded_file, "name", "") or ""
    if not file_type or file_type == "application/octet-stream":
        guessed = _guess_mime(name)
        if guessed:
            file_type = guessed

    try:
        try:
            uploaded_file.seek(0)
        except Exception:
            pass

        if file_type == "application/pdf":
            from PyPDF2 import PdfReader

            uploaded_file.seek(0)
            pdf_stream = uploaded_file
            if hasattr(uploaded_file, "getvalue"):
                pdf_stream = io.BytesIO(uploaded_file.getvalue())
            reader = PdfReader(pdf_stream)
            parts: list[str] = []
            for page in reader.pages:
                t = page.extract_text() or ""
                parts.append(t)
            return "\n".join(parts), None

        if file_type == (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ):
            from docx import Document

            uploaded_file.seek(0)
            docx_stream = uploaded_file
            if hasattr(uploaded_file, "getvalue"):
                docx_stream = io.BytesIO(uploaded_file.getvalue())
            doc = Document(docx_stream)
            return "\n".join(p.text for p in doc.paragraphs), None

        if file_type == "text/plain":
            raw = uploaded_file.read()
            if isinstance(raw, bytes):
                return raw.decode("utf-8", errors="replace"), None
            return str(raw), None

        if file_type in ("image/png", "image/jpeg", "image/webp"):
            from PIL import Image

            uploaded_file.seek(0)
            image = Image.open(uploaded_file)
            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            img_b64 = base64.b64encode(buffered.getvalue()).decode("ascii")
            url = f"{AI_SERVICE_BASE}/api/generate"
            resp = requests.post(
                url,
                json={
                    "model": MODEL_VISION,
                    "prompt": (
                        "Extract ALL visible text word-for-word from this image. "
                        "Be thorough and specific. Output plain text only."
                    ),
                    "images": [img_b64],
                    "stream": False,
                },
                timeout=120,
            )
            if resp.status_code != 200:
                return "", f"Vision model service error ({resp.status_code}). Please try again later."
            data = resp.json()
            return (data.get("response") or "").strip(), None

        return "", f"Unsupported file type: {file_type or name}"

    except Exception as e:
        return "", str(e)


def analyze_cv_score(cv_text: str) -> dict[str, Any]:
    scores: dict[str, int] = {}
    feedback: list[str] = []

    text_lower = cv_text.lower()
    email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
    phone_pattern = r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}"

    contact_score = 0
    if re.search(email_pattern, cv_text):
        contact_score += 5
    else:
        feedback.append("Missing email address (-5 pts)")
    if re.search(phone_pattern, cv_text):
        contact_score += 5
    else:
        feedback.append("Missing phone number (-5 pts)")
    scores["Contact Information"] = contact_score

    edu_keywords = [
        "university",
        "college",
        "bachelor",
        "master",
        "degree",
        "diploma",
        "knust",
        "ug",
        "gimpa",
        "ucc",
        "uew",
    ]
    edu_count = sum(1 for kw in edu_keywords if kw in text_lower)
    scores["Education"] = min(15, edu_count * 3)

    exp_keywords = [
        "experience",
        "worked",
        "position",
        "role",
        "company",
        "responsibilities",
        "duties",
        "managed",
        "led",
    ]
    exp_count = sum(1 for kw in exp_keywords if kw in text_lower)
    exp_score = min(20, exp_count * 2)
    numbers = re.findall(r"\b\d+[%+]?\b", cv_text)
    if len(numbers) > 3:
        exp_score += 5
        feedback.append("CV has quantified achievements (+5 pts)")
    else:
        feedback.append("Add numbers: e.g. 'increased sales by 30%' (-5 pts)")
    scores["Work Experience"] = exp_score

    tech_skills = [
        "python",
        "javascript",
        "java",
        "sql",
        "react",
        "node",
        "aws",
        "docker",
        "git",
        "excel",
        "powerpoint",
    ]
    soft_skills = [
        "leadership",
        "communication",
        "teamwork",
        "problem solving",
        "analytical",
        "creative",
        "adaptable",
    ]
    all_skills = tech_skills + soft_skills
    skill_count = sum(1 for skill in all_skills if skill in text_lower)
    scores["Skills"] = min(20, skill_count * 2)

    word_count = len(cv_text.split())
    if 300 <= word_count <= 800:
        scores["Formatting"] = 15
    elif 200 <= word_count <= 1000:
        scores["Formatting"] = 10
    else:
        scores["Formatting"] = 5

    urls = re.findall(r"https?://[^\s]+", cv_text)
    link_score = 0
    if any("linkedin.com" in url for url in urls):
        link_score += 5
    if any("github.com" in url for url in urls):
        link_score += 5
    scores["Professional Links"] = link_score

    action_verbs = [
        "achieved",
        "improved",
        "designed",
        "developed",
        "managed",
        "led",
        "created",
        "implemented",
        "increased",
        "reduced",
    ]
    action_count = sum(1 for verb in action_verbs if verb in text_lower)
    scores["Action Verbs"] = min(5, action_count)

    total = int(sum(scores.values()))
    return {
        "total_score": total,
        "breakdown": scores,
        "feedback": feedback,
        "word_count": word_count,
    }
