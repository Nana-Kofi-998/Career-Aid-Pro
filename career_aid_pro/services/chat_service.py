"""AI chat orchestration (validation, web search, preview response mode)."""

from __future__ import annotations

from collections.abc import Iterator

from career_aid_pro.config import VALIDATION_MAX_REGENERATIONS
from career_aid_pro.demo import get_demo_response
from career_aid_pro.ai_client import collect_stream, query_ai_streaming
from career_aid_pro.validation import validate_and_fix_response
from career_aid_pro.web_search import needs_web_search, web_search


def stream_ai_tokens(
    user_text: str,
    *,
    age: int | None,
    mode: str,
    doc_context: str = "",
    history: list | None = None,
    personality: str = "",
    tone: str = "Friendly",
    summary: str = "",
    web_enabled: bool = True,
    demo: bool = False,
    response_length: str = "balanced",
    extra_user_instruction: str = "",
) -> Iterator[str]:
    """Yield raw tokens from the AI service or preview response mode."""
    history = history or []

    if demo:
        text = get_demo_response(mode, user_text)
        for ch in text:
            yield ch
        return

    web_context = ""
    if web_enabled and mode in ("free", "Career Coach") and needs_web_search(user_text):
        web_context = web_search(user_text)

    yield from query_ai_streaming(
        user_text,
        age,
        mode=mode,
        doc_context=doc_context,
        history=history,
        personality=personality,
        tone=tone,
        summary=summary,
        web_context=web_context,
        response_length=response_length,
        extra_user_instruction=extra_user_instruction,
    )


def complete_ai_turn(
    user_text: str,
    *,
    age: int | None,
    mode: str,
    doc_context: str = "",
    history: list | None = None,
    personality: str = "",
    tone: str = "Friendly",
    summary: str = "",
    web_enabled: bool = True,
    demo: bool = False,
    response_length: str = "balanced",
    extra_user_instruction: str = "",
) -> str:
    """Full turn with validation and up to VALIDATION_MAX_REGENERATIONS retries."""
    history = history or []

    if demo:
        raw = get_demo_response(mode, user_text)
        fixed, _ = validate_and_fix_response(raw, history, doc_context, mode)
        return fixed

    web_context = ""
    if web_enabled and mode in ("free", "Career Coach") and needs_web_search(user_text):
        web_context = web_search(user_text)

    extra = extra_user_instruction
    final_text = ""
    attempts = VALIDATION_MAX_REGENERATIONS + 1

    for _attempt in range(attempts):
        gen = query_ai_streaming(
            user_text,
            age,
            mode=mode,
            doc_context=doc_context,
            history=history,
            personality=personality,
            tone=tone,
            summary=summary,
            web_context=web_context,
            response_length=response_length,
            extra_user_instruction=extra,
        )
        raw = collect_stream(gen)
        fixed, regen = validate_and_fix_response(raw, history, doc_context, mode)
        final_text = fixed
        if not regen:
            break
        extra = (
            "Regenerate carefully: avoid repeating wording from your prior replies in this thread; "
            "stay grounded in the document/web context when present; avoid 'training cutoff' "
            "disclaimers—use provided web results."
        )

    return final_text
