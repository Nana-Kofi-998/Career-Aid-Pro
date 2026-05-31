"""AI chat streaming (SSE)."""

from __future__ import annotations
import json
import base64
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from api.deps import get_current_user
from api.schemas import ChatStreamRequest
from career_aid_pro import database as db
from career_aid_pro.config import MAX_UPLOAD_MB
from career_aid_pro.cv_analysis import extract_cv_text
from career_aid_pro.services.chat_service import complete_ai_turn, stream_ai_tokens
from career_aid_pro.uploads import MemoryUpload
from career_aid_pro.validation import validate_and_fix_response

router = APIRouter(prefix="/chat", tags=["chat"])

MAX_CHAT_FILE_BYTES = MAX_UPLOAD_MB * 1024 * 1024
MAX_EXTRACTED_CHARS = 20000
ALLOWED_CHAT_UPLOADS = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/octet-stream",
    "",
}


def _now_ts() -> str:
    return datetime.now().strftime("%H:%M")


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _extract_file_text(file_info: dict | None) -> tuple[str, str | None, dict | None]:
    """Extract text from attached file (PDF, DOCX, TXT, images)."""
    if not file_info:
        return "", None, None
    
    base64_data = file_info.get("base64", "")
    mime_type = file_info.get("mimeType", "") or ""
    filename = str(file_info.get("name") or "upload")[:180]
    
    if not isinstance(base64_data, str) or not base64_data:
        return "", "The attached file did not include readable data.", None
    if len(base64_data) > MAX_CHAT_FILE_BYTES * 2:
        return "", f"Max file size is {MAX_UPLOAD_MB} MB.", None
    
    try:
        file_bytes = base64.b64decode(base64_data, validate=True)
    except Exception:
        return "", "The attached file could not be decoded.", None
    
    if len(file_bytes) > MAX_CHAT_FILE_BYTES:
        return "", f"Max file size is {MAX_UPLOAD_MB} MB.", None
    
    if mime_type not in ALLOWED_CHAT_UPLOADS:
        return "", f"Unsupported file type: {mime_type}", None
    
    wrapper = MemoryUpload(file_bytes, filename, mime_type)
    text_content, err = extract_cv_text(wrapper)
    if err:
        return "", err, None
    text_content = text_content.strip()
    if not text_content:
        return "", "No readable text could be extracted from the attachment.", None

    stored_file = {
        "name": filename,
        "mimeType": wrapper.type,
        "size": len(file_bytes),
        "extractedChars": min(len(text_content), MAX_EXTRACTED_CHARS),
    }
    return text_content[:MAX_EXTRACTED_CHARS], None, stored_file


def _history_with_attachment_context(history: list[dict]) -> list[dict]:
    enriched: list[dict] = []
    for msg in history:
        clean = dict(msg)
        file_text = (clean.get("file_text") or "").strip()
        if file_text and clean.get("role") == "user":
            clean["content"] = (
                f"{clean.get('content') or ''}\n\n"
                f"[Previously extracted attachment text:]\n{file_text[:4000]}"
            ).strip()
        enriched.append(clean)
    return enriched


def _attachment_label(file_info: dict | None, stored_file: dict | None) -> str:
    source = stored_file or file_info or {}
    name = source.get("name", "unknown")
    mime = source.get("mimeType", "unknown")
    return f"\n\n[File attached: {name}, type: {mime}]"


def _safe_user_file_message(file_text: str, stored_file: dict | None) -> dict | None:
    if not stored_file:
        return None
    return {
        **stored_file,
        "hasExtractedText": bool(file_text),
    }


def _extract_or_raise(file_info: dict | None) -> tuple[str, dict | None]:
    file_text, err, stored_file = _extract_file_text(file_info)
    if err:
        raise HTTPException(status_code=400, detail=err)
    return file_text, stored_file


@router.post("/stream")
def stream_chat(body: ChatStreamRequest, user: dict = Depends(get_current_user)):
    history = [m.model_dump() for m in body.history]
    age = user.get("age")
    personality = (user.get("personality_summary") or "") if body.use_personality else ""
    
    file_text, stored_file = _extract_or_raise(body.file)
    file_info = ""
    extra_instruction = ""
    
    if body.file:
        file_info = _attachment_label(body.file, stored_file)
        extra_instruction = (
            "\n\n[Extracted content from attached file. Use this content directly; "
            "do not say you cannot access the file:]\n"
            f"{file_text}"
        )

    model_history = _history_with_attachment_context(history)
    
    def generate():
        raw_parts: list[str] = []
        try:
            for token in stream_ai_tokens(
                body.message + file_info,
                age=age,
                mode=body.mode,
                doc_context=body.doc_context,
                history=model_history,
                personality=personality,
                tone=body.tone,
                summary=body.summary,
                web_enabled=body.web_search_enabled,
                demo=body.demo_mode,
                response_length=body.response_length,
                extra_user_instruction=extra_instruction,
            ):
                raw_parts.append(token)
                yield _sse("token", {"text": token})

            raw = "".join(raw_parts)
            final, regen = validate_and_fix_response(
                raw, model_history, body.doc_context, body.mode
            )
            if regen and not body.demo_mode:
                final = complete_ai_turn(
                    body.message + file_info,
                    age=age,
                    mode=body.mode,
                    doc_context=body.doc_context,
                    history=model_history,
                    personality=personality,
                    tone=body.tone,
                    summary=body.summary,
                    web_enabled=body.web_search_enabled,
                    demo=False,
                    response_length=body.response_length,
                    extra_user_instruction=extra_instruction,
                )

            user_msg = {"role": "user", "content": body.message, "ts": _now_ts()}
            safe_file = _safe_user_file_message(file_text, stored_file)
            if safe_file:
                user_msg["file"] = safe_file
                user_msg["file_text"] = file_text
            ai_msg = {"role": "ai", "content": final, "ts": _now_ts()}
            new_history = history + [user_msg, ai_msg]

            chat_id = body.chat_id
            if chat_id:
                title = body.message[:80] if len(history) == 0 else None
                db.save_chat(chat_id, user["username"], new_history, title=title)
            else:
                title = body.message[:80] or (stored_file or {}).get("name", "Attachment chat")[:80]
                chat_id = db.create_chat(user["username"], body.mode, title, new_history)

            yield _sse(
                "done",
                {"content": final, "history": new_history, "chat_id": chat_id},
            )
        except Exception as exc:
            raw = "".join(raw_parts).strip()
            if raw:
                fallback_history = history + [
                    {"role": "user", "content": body.message, "ts": _now_ts()},
                    {"role": "ai", "content": raw, "ts": _now_ts()},
                ]
                yield _sse(
                    "done",
                    {
                        "content": raw,
                        "history": fallback_history,
                        "chat_id": body.chat_id,
                        "warning": f"Chat stream stopped early: {exc!s}",
                    },
                )
                return
            yield _sse("error", {"detail": f"Chat stream stopped early: {exc!s}"})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
