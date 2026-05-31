"""
Career-Aid Pro — Streamlit entrypoint.
Run from this directory: streamlit run app.py
"""

from __future__ import annotations

import sys
import traceback
from datetime import datetime
from typing import Iterator

import streamlit as st

from career_aid_pro import database as db
from career_aid_pro.auth import hash_password, verify_password
from career_aid_pro.config import MAX_UPLOAD_MB, VALIDATION_MAX_REGENERATIONS
from career_aid_pro.cv_analysis import analyze_cv_score, extract_cv_text
from career_aid_pro.demo import get_demo_response
from career_aid_pro.ai_client import check_ai_service, collect_stream, query_ai_streaming
from career_aid_pro.pdf_export import build_cv_score_pdf
from career_aid_pro.session_url import restore_session, save_session_to_url
from career_aid_pro.validation import validate_and_fix_response
from career_aid_pro.web_search import needs_web_search, web_search


def _init_session_defaults() -> None:
    defaults = {
        "logged_in": False,
        "user": None,
        "first_name": "",
        "age": 18,
        "gender": "",
        "personality_summary": "",
        "page": "login",
        "chat_mode": "Career Coach",
        "chat_id": None,
        "chat_history": [],
        "doc_context": "",
        "doc_filename": "",
        "web_search_enabled": True,
        "demo_mode": False,
        "tone": "Friendly",
        "conv_summary": "",
        "delete_account_step": 0,
        "clear_history_confirm": False,
        "last_cv_analysis": None,
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v


def _logout() -> None:
    keys = list(st.session_state.keys())
    for k in keys:
        del st.session_state[k]
    st.query_params.clear()
    _init_session_defaults()
    st.session_state.page = "login"
    st.session_state._session_restored = True


def _inject_css() -> None:
    st.markdown(
        """
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  html, body, [class*="css"]  {
    font-family: 'Inter', system-ui, sans-serif;
  }
  .block-container { padding-top: 1.2rem; max-width: 960px; }
  div[data-testid="stSidebarContent"] {
    background: linear-gradient(180deg, #0b2a4a 0%, #0f3a63 100%);
    color: #f8fafc;
  }
  .glass {
    backdrop-filter: blur(10px);
    background: rgba(255,255,255,0.55);
    border: 1px solid rgba(148,163,184,0.35);
    border-radius: 14px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
  }
  .user-bubble {
    background: #dbeafe;
    border-radius: 12px;
    padding: 0.75rem 1rem;
    margin: 0.35rem 0;
    text-align: right;
  }
  .ai-bubble {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 0.75rem 1rem;
    margin: 0.35rem 0;
  }
</style>
""",
        unsafe_allow_html=True,
    )


def _now_ts() -> str:
    return datetime.now().strftime("%H:%M")


def _run_ai_turn(
    user_text: str,
    *,
    mode: str,
    doc_context: str,
    history: list,
    personality: str,
    tone: str,
    summary: str,
    web_enabled: bool,
    demo: bool,
) -> str:
    """Returns final assistant text after validation / optional regeneration."""
    age = st.session_state.get("age")

    if demo:
        raw = get_demo_response(mode, user_text)
        fixed, _ = validate_and_fix_response(raw, history, doc_context, mode)
        return fixed

    web_context = ""
    if web_enabled and mode == "free" and needs_web_search(user_text):
        web_context = web_search(user_text)

    extra = ""
    final_text = ""
    attempts = VALIDATION_MAX_REGENERATIONS + 1
    for attempt in range(attempts):
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
            extra_user_instruction=extra,
        )
        raw = collect_stream(gen)
        fixed, regen = validate_and_fix_response(raw, history, doc_context, mode)
        final_text = fixed
        if not regen:
            break
        extra = (
            "Regenerate carefully: avoid repeating wording from your prior replies in this thread; "
            "stay grounded in the document/web context when present; avoid 'training cutoff' disclaimers—use provided web results."
        )
        if attempt == attempts - 1:
            break
    return final_text


def _render_login() -> None:
    st.title("Career-Aid Pro")
    st.caption("Hosted AI-powered career guidance and mental wellness.")
    with st.form("login_form"):
        u = st.text_input("Username")
        p = st.text_input("Password", type="password")
        ok = st.form_submit_button("Log in", use_container_width=True)
    if ok:
        row = db.get_user(u.strip())
        if row and verify_password(row["password"], p):
            db.update_last_login(u.strip())
            st.session_state.logged_in = True
            st.session_state.user = u.strip()
            st.session_state.first_name = row.get("first_name") or ""
            st.session_state.age = row.get("age") or 18
            st.session_state.gender = row.get("gender") or ""
            st.session_state.personality_summary = row.get("personality_summary") or ""
            st.session_state.page = "dashboard"
            save_session_to_url()
            st.rerun()
        else:
            st.error("Invalid username or password.")

    if st.button("Create an account"):
        st.session_state.page = "register"
        st.rerun()


def _render_register() -> None:
    st.title("Create account")
    with st.form("reg_form"):
        u = st.text_input("Username", key="r_u")
        p = st.text_input("Password", type="password", key="r_p")
        p2 = st.text_input("Confirm password", type="password", key="r_p2")
        fn = st.text_input("First name")
        ln = st.text_input("Last name")
        age = st.number_input("Age", min_value=5, max_value=120, value=18)
        gender = st.selectbox("Gender", ["Prefer not to say", "Female", "Male", "Non-binary"])
        sub = st.form_submit_button("Register", use_container_width=True)
    if sub:
        if p != p2:
            st.error("Passwords do not match.")
            return
        if len(p) < 8:
            st.error("Password must be at least 8 characters.")
            return
        ok = db.create_user(
            u.strip(),
            hash_password(p),
            fn.strip(),
            ln.strip(),
            int(age),
            gender,
        )
        if ok:
            st.success("Account created. You can log in.")
            st.session_state.page = "login"
            st.rerun()
        else:
            st.error("Username already exists.")

    if st.button("Back to login"):
        st.session_state.page = "login"
        st.rerun()


def _sidebar_nav() -> None:
    st.sidebar.markdown("### Navigation")
    user = st.session_state.user
    st.sidebar.write(f"Signed in as **{user}**")
    if st.sidebar.button("Dashboard", use_container_width=True):
        st.session_state.page = "dashboard"
        save_session_to_url()
        st.rerun()
    if st.sidebar.button("Chat", use_container_width=True):
        st.session_state.page = "chat"
        save_session_to_url()
        st.rerun()
    if st.sidebar.button("Settings", use_container_width=True):
        st.session_state.page = "settings"
        save_session_to_url()
        st.rerun()
    st.sidebar.divider()
    if st.sidebar.button("Log out", use_container_width=True):
        _logout()
        st.rerun()

    ai_service_ok = check_ai_service()
    if st.session_state.demo_mode:
        st.sidebar.info("Preview response mode is ON.")
    elif not ai_service_ok:
        st.sidebar.error("The AI service is temporarily unavailable. Please try again shortly.")


def _render_dashboard() -> None:
    fn = st.session_state.first_name or st.session_state.user
    st.markdown(f'<div class="glass"><h2>Welcome back, {fn}!</h2></div>', unsafe_allow_html=True)

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total chats", db.count_chats(st.session_state.user))
    with col2:
        st.metric("CV scores saved", db.count_cv_scores(st.session_state.user))
    with col3:
        row = db.get_user(st.session_state.user)
        ll = row.get("last_login") if row else None
        st.metric("Last login", "—" if not ll else str(ll)[:19])

    st.subheader("Start a mode")
    c1, c2, c3 = st.columns(3)
    if c1.button("Career Coach", use_container_width=True):
        st.session_state.chat_mode = "Career Coach"
        st.session_state.chat_id = None
        st.session_state.chat_history = []
        st.session_state.page = "chat"
        save_session_to_url()
        st.rerun()
    if c2.button("Mental Wellness", use_container_width=True):
        st.session_state.chat_mode = "Mental Health"
        st.session_state.chat_id = None
        st.session_state.chat_history = []
        st.session_state.page = "chat"
        save_session_to_url()
        st.rerun()
    if c3.button("Open Chat", use_container_width=True):
        st.session_state.chat_mode = "free"
        st.session_state.chat_id = None
        st.session_state.chat_history = []
        st.session_state.page = "chat"
        save_session_to_url()
        st.rerun()

    st.subheader("Recent chats")
    for ch in db.list_recent_chats(st.session_state.user):
        label = f"{ch['title'][:42]}…" if len(ch.get("title") or "") > 45 else (ch.get("title") or "Untitled")
        if st.button(f"{label}  ·  {ch['mode']}", key=f"rch_{ch['id']}"):
            data = db.load_chat(int(ch["id"]), st.session_state.user)
            if data:
                st.session_state.chat_id = int(ch["id"])
                st.session_state.chat_mode = data["mode"]
                st.session_state.chat_history = data["history"]
                st.session_state.page = "chat"
                save_session_to_url()
                st.rerun()

    st.subheader("CV upload & scoring (Career Coach)")
    up = st.file_uploader(
        "PDF, DOCX, TXT, or image (PNG/JPG/WEBP)",
        type=["pdf", "docx", "txt", "png", "jpg", "jpeg", "webp"],
    )
    if up is not None:
        size_mb = len(up.getvalue()) / (1024 * 1024)
        if size_mb > MAX_UPLOAD_MB:
            st.error(f"File too large ({size_mb:.1f} MB). Max {MAX_UPLOAD_MB} MB.")
        else:
            if st.button("Extract & score CV"):
                with st.spinner("Extracting text…"):
                    text, err = extract_cv_text(up)
                if err:
                    st.error(err)
                elif not text.strip():
                    st.warning("No text extracted.")
                else:
                    st.session_state.doc_context = text
                    st.session_state.doc_filename = up.name
                    analysis = analyze_cv_score(text)
                    st.session_state.last_cv_analysis = analysis
                    db.insert_cv_score(
                        st.session_state.user,
                        int(analysis["total_score"]),
                        analysis["breakdown"],
                        analysis["feedback"],
                    )
                    st.success(f"Score: **{analysis['total_score']}**/100 (words: {analysis['word_count']})")
                    st.json({"breakdown": analysis["breakdown"], "feedback": analysis["feedback"]})
                    pdf_bytes = build_cv_score_pdf(st.session_state.user, analysis)
                    st.download_button(
                        "Download score PDF",
                        data=pdf_bytes,
                        file_name="cv_score_report.pdf",
                        mime="application/pdf",
                    )


def _persist_chat(title: str | None, history: list) -> None:
    uid = st.session_state.user
    cid = st.session_state.chat_id
    mode = st.session_state.chat_mode
    if cid:
        db.save_chat(cid, uid, history, title=title)
    else:
        new_id = db.create_chat(uid, mode, title or "New chat", history)
        if new_id:
            st.session_state.chat_id = new_id
        else:
            st.error("Could not save chat to the database.")
    save_session_to_url()


def _render_chat() -> None:
    mode = st.session_state.chat_mode
    st.title("Chat")
    st.caption(f"Mode: **{mode}**")

    if mode == "Career Coach":
        st.session_state.doc_context = st.session_state.doc_context or ""
        up = st.file_uploader("Attach CV (optional)", type=["pdf", "docx", "txt", "png", "jpg", "jpeg", "webp"])
        if up is not None:
            if len(up.getvalue()) / (1024 * 1024) > MAX_UPLOAD_MB:
                st.error(f"Max upload size is {MAX_UPLOAD_MB} MB.")
            elif st.button("Load CV into this chat"):
                with st.spinner("Extracting…"):
                    text, err = extract_cv_text(up)
                if err:
                    st.error(err)
                else:
                    st.session_state.doc_context = text
                    st.session_state.doc_filename = up.name
                    st.success("CV loaded for this session.")

    hist: list = st.session_state.chat_history
    for msg in hist:
        role = msg.get("role")
        content = msg.get("content", "")
        ts = msg.get("ts", "")
        with st.chat_message("user" if role == "user" else "assistant"):
            if ts:
                st.caption(ts)
            st.markdown(content)

    if prompt := st.chat_input("Message…"):
        if not st.session_state.demo_mode and not check_ai_service():
            st.error("The AI service is temporarily unavailable. Enable preview responses in Settings or try again shortly.")
            return

        title = prompt[:80] if not hist else None

        with st.chat_message("user"):
            st.caption(_now_ts())
            st.markdown(prompt)

        assistant_text: list[str] = []

        def _stream_reply() -> Iterator[str]:
            text = _run_ai_turn(
                prompt,
                mode=mode,
                doc_context=st.session_state.doc_context or "",
                history=hist,
                personality=st.session_state.personality_summary or "",
                tone=st.session_state.tone,
                summary=st.session_state.conv_summary or "",
                web_enabled=st.session_state.web_search_enabled,
                demo=st.session_state.demo_mode,
            )
            assistant_text.append(text)
            for ch in text:
                yield ch

        with st.chat_message("assistant"):
            st.write_stream(_stream_reply())

        reply = assistant_text[0] if assistant_text else ""
        hist.append({"role": "user", "content": prompt, "ts": _now_ts()})
        hist.append({"role": "ai", "content": reply, "ts": _now_ts()})
        st.session_state.chat_history = hist
        _persist_chat(title, hist)
        st.rerun()


def _render_settings() -> None:
    st.title("Settings")
    st.session_state.web_search_enabled = st.toggle(
        "Web search (Open Chat temporal queries)",
        value=bool(st.session_state.web_search_enabled),
    )
    st.session_state.demo_mode = st.toggle(
        "Preview response mode",
        value=bool(st.session_state.demo_mode),
    )
    st.session_state.tone = st.selectbox("Tone", ["Friendly", "Professional", "Casual"])

    st.subheader("Personality summary")
    st.write("Short notes the AI can use to personalize replies.")
    txt = st.text_area("Personality summary", value=st.session_state.personality_summary or "", height=100)
    if st.button("Save personality summary"):
        if db.update_personality_summary(st.session_state.user, txt.strip()):
            st.session_state.personality_summary = txt.strip()
            st.success("Saved.")
        else:
            st.error("Could not save.")

    st.subheader("Danger zone")
    st.session_state.clear_history_confirm = st.checkbox(
        "I understand this deletes all my saved chats.", value=st.session_state.clear_history_confirm
    )
    if st.button("Clear all chat history", type="primary", disabled=not st.session_state.clear_history_confirm):
        if db.delete_all_chats(st.session_state.user):
            st.session_state.chat_history = []
            st.session_state.chat_id = None
            st.success("All chats deleted.")
        else:
            st.error("Something went wrong.")

    st.divider()
    st.write("Delete account (two steps)")
    if st.session_state.delete_account_step == 0:
        if st.button("I want to delete my account"):
            st.session_state.delete_account_step = 1
            st.rerun()
    else:
        st.warning("This removes your user, chats, and CV scores permanently.")
        if st.button("Confirm permanent account deletion", type="primary"):
            u = st.session_state.user
            if db.delete_user(u):
                _logout()
                st.rerun()
            st.error("Could not delete account.")
        if st.button("Cancel"):
            st.session_state.delete_account_step = 0
            st.rerun()

    save_session_to_url()


def main() -> None:
    st.set_page_config(
        page_title="Career-Aid Pro",
        page_icon="🧭",
        layout="wide",
        initial_sidebar_state="expanded",
    )
    _inject_css()

    try:
        db.init_db()
    except Exception:
        st.error("Database initialization failed. Check stderr logs.")
        traceback.print_exc(file=sys.stderr)
        return

    _init_session_defaults()
    restore_session()

    if st.session_state.logged_in:
        _sidebar_nav()

    page = st.session_state.page
    if not st.session_state.logged_in:
        if page == "register":
            _render_register()
        else:
            _render_login()
        return

    if page == "dashboard":
        _render_dashboard()
    elif page == "chat":
        _render_chat()
    elif page == "settings":
        _render_settings()
    else:
        st.session_state.page = "dashboard"
        st.rerun()


if __name__ == "__main__":
    main()
