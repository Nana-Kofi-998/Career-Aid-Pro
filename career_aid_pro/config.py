"""Runtime configuration."""

from __future__ import annotations

import os
from pathlib import Path


def _load_dotenv() -> None:
    """Load simple KEY=VALUE pairs from .env when the process has not set them."""
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            os.environ.setdefault(key, value)


_load_dotenv()

AI_SERVICE_BASE: str = (
    os.environ.get("AI_SERVICE_URL")
    or "https://ai-service.career-aid-pro.app"
).rstrip("/")

# Hosted AI model identifiers.
MODEL_CAREER: str = os.environ.get("CAREER_AID_MODEL_CAREER", "mistral")
MODEL_MENTAL: str = os.environ.get("CAREER_AID_MODEL_MENTAL", "llama3.1")
MODEL_OPEN: str = os.environ.get("CAREER_AID_MODEL_OPEN", "llama3.2")
MODEL_VISION: str = os.environ.get("CAREER_AID_MODEL_VISION", "llava")

DB_FILENAME: str = os.environ.get("CAREER_AID_DB", "career_aid_pro.db")
MAX_UPLOAD_MB: int = 10
CHAT_HISTORY_WINDOW: int = 12
VALIDATION_MAX_REGENERATIONS: int = 2
