"""Pydantic request/response models."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

ChatMode = Literal["Career Coach", "Mental Health", "free"]
ChatRole = Literal["user", "ai"]
LearnerProfile = Literal["shs_student", "shs_graduate_transition", "university_workforce", "general"]


import re

USERNAME_PATTERN = re.compile(r'^[a-zA-Z0-9_.-]+$')


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(default="", max_length=100)
    age: int = Field(ge=5, le=120, default=18)
    gender: str = "Prefer not to say"
    learner_profile: LearnerProfile = "general"

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        """Validate username format."""
        username = value.strip()
        if not USERNAME_PATTERN.match(username):
            raise ValueError("Username can only contain letters, numbers, underscores, hyphens, and dots")
        return username


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)


class UserPublic(BaseModel):
    username: str
    first_name: str | None = ""
    last_name: str | None = ""
    age: int | None = 18
    gender: str | None = ""
    learner_profile: LearnerProfile = "general"
    personality_summary: str | None = ""


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class ChatMessage(BaseModel):
    role: ChatRole
    content: str
    ts: str | None = None
    file: dict[str, Any] | None = None
    file_text: str | None = None


class ChatStreamRequest(BaseModel):
    message: str = Field(min_length=0, max_length=8000)
    mode: ChatMode = "Career Coach"
    history: list[ChatMessage] = Field(default_factory=list)
    doc_context: str = ""
    tone: str = "Friendly"
    summary: str = ""
    web_search_enabled: bool = True
    demo_mode: bool = False
    response_length: str = "balanced"
    use_personality: bool = True
    chat_id: int | None = None
    file: dict | None = None


class DocumentGenerateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=100000)


class DocumentFromChatRequest(BaseModel):
    chat_id: int
    doc_type: str = "word"


class ChatCreateRequest(BaseModel):
    mode: ChatMode
    title: str = "New chat"


class ChatUpdateRequest(BaseModel):
    history: list[ChatMessage]
    title: str | None = None


class ChatSummary(BaseModel):
    id: int
    mode: str
    title: str | None
    updated_at: str | None
    message_count: int = 0
    preview: str = ""


class ChatDetail(ChatSummary):
    history: list[dict[str, Any]]


class PersonalityUpdate(BaseModel):
    personality_summary: str = Field(max_length=4000)


class ProfileUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    age: int | None = Field(default=None, ge=5, le=120)
    gender: str | None = None
    learner_profile: LearnerProfile | None = None


class DashboardStats(BaseModel):
    total_chats: int
    cv_scores: int
    last_login: str | None
    ai_service_online: bool


class HealthResponse(BaseModel):
    status: str
    ai_service_online: bool
