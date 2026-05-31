"""Hosted AI model streaming and health checks."""

from __future__ import annotations

import json
from collections.abc import Iterator
from typing import Any

from career_aid_pro.config import (
    CHAT_HISTORY_WINDOW,
    MODEL_CAREER,
    MODEL_MENTAL,
    MODEL_OPEN,
    AI_SERVICE_BASE,
)
from career_aid_pro.demo import get_demo_response
from career_aid_pro.prompts import build_system_prompt

AI_CHAT_URL = f"{AI_SERVICE_BASE}/api/chat"

MODELS = {
    "Career Coach": MODEL_CAREER,
    "Mental Health": MODEL_MENTAL,
    "free": MODEL_OPEN,
}


def _offline_response(mode: str, prompt: str) -> str:
    return (
        "I am using preview guidance while the hosted AI service reconnects.\n\n"
        f"{get_demo_response(mode, prompt)}\n\n"
        "You can keep working now; the app will use the live AI service again as soon as it is reachable."
    )


def _requests():
    import requests

    return requests


def check_ai_service() -> bool:
    """Best-effort health check for the hosted AI service.

    Some AI backends don't return 200 on `/`.
    We probe known endpoints with a short timeout to avoid false negatives.
    """
    try:
        requests = _requests()
        # Prefer common AI service health and metadata endpoints.
        for path in [
            "/api/tags",
            "/api/chat",
            "/",  # last resort
        ]:
            try:
                response = requests.get(f"{AI_SERVICE_BASE}{path}", timeout=5)
                # Accept common "service is alive" codes.
                if response.status_code in (200, 401, 404):
                    return True
            except Exception:
                continue
        return False
    except Exception:
        return False



def query_ai_streaming(
    prompt: str,
    age: int | None,
    mode: str = "free",
    doc_context: str = "",
    history: list | None = None,
    personality: str = "",
    tone: str = "Friendly",
    summary: str = "",
    web_context: str = "",
    response_length: str = "balanced",
    extra_user_instruction: str = "",
) -> Iterator[str]:
    """
    Yield tokens from the configured AI chat API.
    """
    ai_online = check_ai_service()
    if not ai_online:
        yield _offline_response(mode, prompt)
        return

    model = MODELS.get(mode, MODEL_OPEN)
    system_prompt = build_system_prompt(
        age,
        mode,
        doc_context,
        personality,
        tone,
        summary,
        web_context,
        response_length,
    )

    messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]

    if history:
        for msg in history[-CHAT_HISTORY_WINDOW:]:
            role = "user" if msg.get("role") == "user" else "assistant"
            content = msg.get("content", "")
            # Include file_text if present for follow-up questions
            file_text = msg.get("file_text", "")
            if file_text:
                content = f"{content}\n\n[File content attached:]\n{file_text}"
            messages.append({"role": role, "content": content})

    user_content = prompt
    if extra_user_instruction:
        user_content = f"{prompt}\n\n[{extra_user_instruction}]"
    messages.append({"role": "user", "content": user_content})

    try:
        requests = _requests()
        with requests.post(
        AI_CHAT_URL,
            json={"model": model, "messages": messages, "stream": True},
            stream=True,
            timeout=180,
        ) as response:
            if response.status_code != 200:
                yield _offline_response(mode, prompt)
                return
            for line in response.iter_lines():
                if not line:
                    continue
                try:
                    chunk = json.loads(line.decode("utf-8"))
                except json.JSONDecodeError:
                    continue
                token = chunk.get("message", {}).get("content", "")
                if token:
                    yield token
                if chunk.get("done"):
                    break
    except Exception as e:
        if e.__class__.__name__ == "Timeout":
            yield "Request timed out. Try a shorter message."
            return
        yield _offline_response(mode, prompt)


def collect_stream(gen: Iterator[str]) -> str:
    return "".join(gen)
