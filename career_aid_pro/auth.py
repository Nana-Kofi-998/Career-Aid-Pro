"""Password hashing: PBKDF2-HMAC-SHA256 with legacy SHA-256 fallback."""

from __future__ import annotations

import hashlib
import os
import secrets

PBKDF2_ITERATIONS = 310_000


def hash_password(password: str) -> str:
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${key.hex()}"


def verify_password(stored: str, provided: str) -> bool:
    parts = stored.split("$")
    if len(parts) == 1:
        return secrets.compare_digest(
            stored,
            hashlib.sha256(provided.encode("utf-8")).hexdigest(),
        )

    if len(parts) == 4 and parts[0] == "pbkdf2_sha256":
        _, iterations_raw, salt_hex, key_hex = parts
        try:
            iterations = int(iterations_raw)
        except ValueError:
            return False
    elif len(parts) == 2:
        salt_hex, key_hex = parts
        iterations = 100_000
    else:
        return False

    try:
        candidate = hashlib.pbkdf2_hmac(
            "sha256",
            provided.encode("utf-8"),
            bytes.fromhex(salt_hex),
            iterations,
        )
    except (ValueError, TypeError):
        return False
    return secrets.compare_digest(candidate.hex(), key_hex)
