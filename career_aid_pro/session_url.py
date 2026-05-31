"""URL query-param helpers for lightweight session restore hints."""

from __future__ import annotations

import streamlit as st

from career_aid_pro import database as db


def _qp_first(key: str, default: str = "") -> str:
    if key not in st.query_params:
        return default
    v = st.query_params[key]
    if isinstance(v, (list, tuple)):
        return str(v[0]) if v else default
    return str(v)


def save_session_to_url() -> None:
    """Encode non-sensitive session hints into the URL (username is not secret)."""
    user = st.session_state.get("user")
    if not user or user == "Guest":
        return
    st.query_params["u"] = user
    st.query_params["p"] = st.session_state.get("page", "dashboard")
    st.query_params["m"] = st.session_state.get("chat_mode", "Career Coach")
    cid = st.session_state.get("chat_id")
    if cid:
        st.query_params["c"] = str(cid)
    st.query_params["ws"] = "1" if st.session_state.get("web_search_enabled", True) else "0"
    st.query_params["dm"] = "1" if st.session_state.get("demo_mode", False) else "0"


def restore_session() -> None:
    """Restore session hints from URL once per run."""
    if st.session_state.get("_session_restored"):
        return
    st.session_state["_session_restored"] = True

    username = _qp_first("u", "")
    if username:
        user_data = db.get_user(username)
        if user_data:
            st.session_state.user = username
            st.session_state.age = user_data.get("age") or 18
            st.session_state.first_name = user_data.get("first_name") or ""
            st.session_state.personality_summary = user_data.get("personality_summary") or ""
            st.session_state.logged_in = True

    page = _qp_first("p", "")
    if page:
        st.session_state.page = page

    mode = _qp_first("m", "")
    if mode:
        st.session_state.chat_mode = mode

    st.session_state.web_search_enabled = _qp_first("ws", "1") == "1"
    st.session_state.demo_mode = _qp_first("dm", "0") == "1"

    if st.session_state.get("page") == "chat":
        cid_s = _qp_first("c", "0")
        try:
            cid = int(cid_s)
        except ValueError:
            cid = 0
        user = st.session_state.get("user")
        if user and cid:
            chat_data = db.load_chat(cid, user)
            if chat_data:
                st.session_state.chat_history = chat_data["history"]
                st.session_state.chat_id = cid
                st.session_state.chat_mode = chat_data["mode"]
