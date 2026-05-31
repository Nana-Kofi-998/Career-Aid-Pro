"""SQLite persistence — parameterized queries only."""

from __future__ import annotations

import json
import sqlite3
import sys
import traceback
from datetime import datetime
from pathlib import Path
from typing import Any

from career_aid_pro.config import DB_FILENAME


def _db_path() -> Path:
    return Path(DB_FILENAME).resolve()


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(_db_path()), timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                age INTEGER,
                gender TEXT,
                learner_profile TEXT DEFAULT 'general',
                personality_summary TEXT DEFAULT NULL,
                reset_token TEXT DEFAULT NULL,
                reset_token_expires TIMESTAMP DEFAULT NULL,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS chats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                mode TEXT,
                title TEXT,
                history TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (username) REFERENCES users(username)
            );

            CREATE TABLE IF NOT EXISTS cv_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                score INTEGER,
                breakdown TEXT,
                feedback TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (username) REFERENCES users(username)
            );
            """
        )
        # Lightweight migration: add columns if missing (older DBs)
        cur.execute("PRAGMA table_info(users)")
        cols = {row[1] for row in cur.fetchall()}
        if "last_login" not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN last_login TIMESTAMP")
        if "learner_profile" not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN learner_profile TEXT DEFAULT 'general'")
        if "reset_token" not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN reset_token TEXT DEFAULT NULL")
        if "reset_token_expires" not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP DEFAULT NULL")
        conn.commit()
    except sqlite3.Error:
        print("Database init error:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise
    finally:
        if conn:
            conn.close()


def create_user(
    username: str,
    password_hash: str,
    first_name: str,
    last_name: str,
    age: int,
    gender: str,
    learner_profile: str = "general",
) -> bool:
    conn = None
    try:
        conn = get_connection()
        conn.execute(
            """
            INSERT INTO users (username, password, first_name, last_name, age, gender, learner_profile)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (username, password_hash, first_name, last_name, age, gender, learner_profile),
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return False
    finally:
        if conn:
            conn.close()


def get_user(username: str) -> dict[str, Any] | None:
    conn = None
    try:
        conn = get_connection()
        row = conn.execute(
            "SELECT username, password, first_name, last_name, age, gender, "
            "learner_profile, personality_summary, last_login, created_at FROM users WHERE username = ?",
            (username,),
        ).fetchone()
        if not row:
            return None
        return dict(row)
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return None
    finally:
        if conn:
            conn.close()


def update_last_login(username: str) -> None:
    conn = None
    try:
        conn = get_connection()
        conn.execute(
            "UPDATE users SET last_login = ? WHERE username = ?",
            (datetime.now().isoformat(timespec="seconds"), username),
        )
        conn.commit()
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
    finally:
        if conn:
            conn.close()


def update_personality_summary(username: str, summary: str) -> bool:
    conn = None
    try:
        conn = get_connection()
        cur = conn.execute(
            "UPDATE users SET personality_summary = ? WHERE username = ?",
            (summary, username),
        )
        conn.commit()
        return cur.rowcount > 0
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return False
    finally:
        if conn:
            conn.close()


def update_user_profile(username: str, updates: dict) -> bool:
    conn = None
    try:
        allowed = {"first_name", "last_name", "age", "gender", "learner_profile"}
        set_parts = []
        values: list = []
        for k, v in updates.items():
            if k not in allowed:
                continue
            set_parts.append(f"{k} = ?")
            values.append(v)
        if not set_parts:
            return False
        values.append(username)
        conn = get_connection()
        cur = conn.execute(
            f"UPDATE users SET {', '.join(set_parts)} WHERE username = ?",
            values,
        )
        conn.commit()
        return cur.rowcount > 0
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return False
    finally:
        if conn:
            conn.close()


def delete_user(username: str) -> bool:
    conn = None
    try:
        conn = get_connection()
        conn.execute("DELETE FROM cv_scores WHERE username = ?", (username,))
        conn.execute("DELETE FROM chats WHERE username = ?", (username,))
        conn.execute("DELETE FROM users WHERE username = ?", (username,))
        conn.commit()
        return True
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()


def count_chats(username: str) -> int:
    conn = None
    try:
        conn = get_connection()
        n = conn.execute(
            "SELECT COUNT(*) FROM chats WHERE username = ?", (username,)
        ).fetchone()[0]
        return int(n)
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return 0
    finally:
        if conn:
            conn.close()


def count_cv_scores(username: str) -> int:
    conn = None
    try:
        conn = get_connection()
        n = conn.execute(
            "SELECT COUNT(*) FROM cv_scores WHERE username = ?", (username,)
        ).fetchone()[0]
        return int(n)
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return 0
    finally:
        if conn:
            conn.close()


def list_recent_chats(username: str, limit: int = 100, include_history: bool = False) -> list[dict[str, Any]]:
    conn = None
    try:
        conn = get_connection()
        rows = conn.execute(
            """
            SELECT id, mode, title, updated_at, history
            FROM chats WHERE username = ?
            ORDER BY datetime(updated_at) DESC
            LIMIT ?
            """,
            (username, limit),
        ).fetchall()
        out: list[dict[str, Any]] = []
        for r in rows:
            d = dict(r)
            try:
                hist_raw = d.get("history") if include_history else d.pop("history")
                hist = json.loads(hist_raw or "[]")
            except json.JSONDecodeError:
                hist = []
            d["message_count"] = len(hist)
            if include_history:
                d["history"] = hist
            preview = ""
            for msg in reversed(hist):
                if msg.get("role") == "user" and msg.get("content"):
                    preview = str(msg["content"])[:120]
                    break
            d["preview"] = preview
            out.append(d)
        return out
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return []
    finally:
        if conn:
            conn.close()


def create_chat(username: str, mode: str, title: str, history: list) -> int | None:
    conn = None
    try:
        conn = get_connection()
        cur = conn.execute(
            """
            INSERT INTO chats (username, mode, title, history)
            VALUES (?, ?, ?, ?)
            """,
            (username, mode, title, json.dumps(history)),
        )
        conn.commit()
        return int(cur.lastrowid)
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return None
    finally:
        if conn:
            conn.close()


def load_chat(chat_id: int, username: str) -> dict[str, Any] | None:
    conn = None
    try:
        conn = get_connection()
        row = conn.execute(
            "SELECT id, username, mode, title, history, created_at, updated_at "
            "FROM chats WHERE id = ? AND username = ?",
            (chat_id, username),
        ).fetchone()
        if not row:
            return None
        d = dict(row)
        try:
            d["history"] = json.loads(d["history"] or "[]")
        except json.JSONDecodeError:
            d["history"] = []
        return d
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return None
    finally:
        if conn:
            conn.close()


def save_chat(chat_id: int, username: str, history: list, title: str | None = None) -> bool:
    conn = None
    try:
        conn = get_connection()
        if title:
            cur = conn.execute(
                """
                UPDATE chats SET history = ?, title = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND username = ?
                """,
                (json.dumps(history), title, chat_id, username),
            )
        else:
            cur = conn.execute(
                """
                UPDATE chats SET history = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND username = ?
                """,
                (json.dumps(history), chat_id, username),
            )
        conn.commit()
        return cur.rowcount > 0
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return False
    finally:
        if conn:
            conn.close()


def delete_chat(chat_id: int, username: str) -> bool:
    conn = None
    try:
        conn = get_connection()
        cur = conn.execute(
            "DELETE FROM chats WHERE id = ? AND username = ?",
            (chat_id, username),
        )
        conn.commit()
        return cur.rowcount > 0
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return False
    finally:
        if conn:
            conn.close()


def delete_all_chats(username: str) -> bool:
    conn = None
    try:
        conn = get_connection()
        conn.execute("DELETE FROM chats WHERE username = ?", (username,))
        conn.commit()
        return True
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return False
    finally:
        if conn:
            conn.close()


def insert_cv_score(
    username: str,
    score: int,
    breakdown: dict,
    feedback: list,
) -> bool:
    conn = None
    try:
        conn = get_connection()
        conn.execute(
            """
            INSERT INTO cv_scores (username, score, breakdown, feedback)
            VALUES (?, ?, ?, ?)
            """,
            (username, score, json.dumps(breakdown), json.dumps(feedback)),
        )
        conn.commit()
        return True
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return False
    finally:
        if conn:
            conn.close()


def get_latest_cv_score(username: str) -> dict[str, Any] | None:
    conn = None
    try:
        conn = get_connection()
        row = conn.execute(
            """
            SELECT id, score, breakdown, feedback, timestamp
            FROM cv_scores WHERE username = ?
            ORDER BY datetime(timestamp) DESC LIMIT 1
            """,
            (username,),
        ).fetchone()
        if not row:
            return None
        d = dict(row)
        try:
            d["breakdown"] = json.loads(d["breakdown"] or "{}")
            d["feedback"] = json.loads(d["feedback"] or "[]")
        except json.JSONDecodeError:
            d["breakdown"] = {}
            d["feedback"] = []
        return d
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return None
    finally:
        if conn:
            conn.close()


def set_reset_token(username: str, token: str, expiry: str) -> bool:
    conn = None
    try:
        conn = get_connection()
        cur = conn.execute(
            "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE username = ?",
            (token, expiry, username),
        )
        conn.commit()
        return cur.rowcount > 0
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return False
    finally:
        if conn:
            conn.close()


def get_user_by_reset_token(token: str) -> dict[str, Any] | None:
    conn = None
    try:
        conn = get_connection()
        row = conn.execute(
            "SELECT username, password, first_name, last_name, age, gender, "
            "learner_profile, personality_summary, reset_token_expires, last_login, created_at "
            "FROM users WHERE reset_token = ?",
            (token,),
        ).fetchone()
        if not row:
            return None
        return dict(row)
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return None
    finally:
        if conn:
            conn.close()


def update_user_password(username: str, hashed_password: str) -> bool:
    conn = None
    try:
        conn = get_connection()
        cur = conn.execute(
            "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE username = ?",
            (hashed_password, username),
        )
        conn.commit()
        return cur.rowcount > 0
    except sqlite3.Error:
        traceback.print_exc(file=sys.stderr)
        return False
    finally:
        if conn:
            conn.close()
