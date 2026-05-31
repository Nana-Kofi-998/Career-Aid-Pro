"""Chat persistence routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from api.deps import get_current_username
from api.schemas import ChatCreateRequest, ChatDetail, ChatSummary, ChatUpdateRequest
from career_aid_pro import database as db

router = APIRouter(prefix="/chats", tags=["chats"])


def _summary(row: dict) -> ChatSummary:
    return ChatSummary(
        id=int(row["id"]),
        mode=row["mode"],
        title=row.get("title"),
        updated_at=str(row.get("updated_at")) if row.get("updated_at") else None,
        message_count=int(row.get("message_count") or 0),
        preview=str(row.get("preview") or ""),
    )


@router.get("", response_model=list[ChatSummary])
def list_chats(username: str = Depends(get_current_username)) -> list[ChatSummary]:
    return [_summary(r) for r in db.list_recent_chats(username, limit=100)]


@router.get("/{chat_id}", response_model=ChatDetail)
def get_chat(chat_id: int, username: str = Depends(get_current_username)) -> ChatDetail:
    data = db.load_chat(chat_id, username)
    if not data:
        raise HTTPException(status_code=404, detail="Chat not found")
    hist = data.get("history") or []
    return ChatDetail(
        id=int(data["id"]),
        mode=data["mode"],
        title=data.get("title"),
        updated_at=str(data.get("updated_at")) if data.get("updated_at") else None,
        message_count=len(hist),
        preview="",
        history=hist,
    )


@router.post("", response_model=ChatDetail)
def create_chat(
    body: ChatCreateRequest,
    username: str = Depends(get_current_username),
) -> ChatDetail:
    cid = db.create_chat(username, body.mode, body.title, [])
    if not cid:
        raise HTTPException(status_code=500, detail="Could not create chat")
    data = db.load_chat(cid, username)
    if not data:
        raise HTTPException(status_code=500, detail="Created chat could not be loaded")
    return ChatDetail(
        id=cid,
        mode=data["mode"],
        title=data.get("title"),
        updated_at=str(data.get("updated_at")) if data.get("updated_at") else None,
        message_count=0,
        preview="",
        history=[],
    )


@router.put("/{chat_id}", response_model=ChatDetail)
def update_chat(
    chat_id: int,
    body: ChatUpdateRequest,
    username: str = Depends(get_current_username),
) -> ChatDetail:
    existing = db.load_chat(chat_id, username)
    if not existing:
        raise HTTPException(status_code=404, detail="Chat not found")
    history = [m.model_dump() for m in body.history]
    if not db.save_chat(chat_id, username, history, title=body.title):
        raise HTTPException(status_code=500, detail="Could not save chat")
    data = db.load_chat(chat_id, username)
    if not data:
        raise HTTPException(status_code=500, detail="Saved chat could not be loaded")
    hist = data.get("history") or []
    return ChatDetail(
        id=chat_id,
        mode=data["mode"],
        title=data.get("title"),
        updated_at=str(data.get("updated_at")) if data.get("updated_at") else None,
        message_count=len(hist),
        preview="",
        history=hist,
    )


@router.delete("/{chat_id}")
def delete_one_chat(
    chat_id: int,
    username: str = Depends(get_current_username),
) -> dict:
    if not db.delete_chat(chat_id, username):
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"ok": True}


@router.delete("")
def clear_chats(username: str = Depends(get_current_username)) -> dict:
    if not db.delete_all_chats(username):
        raise HTTPException(status_code=500, detail="Could not clear chats")
    return {"ok": True}
