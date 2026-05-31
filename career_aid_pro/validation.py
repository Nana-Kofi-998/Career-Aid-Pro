"""Post-process and quality-check model output."""

from __future__ import annotations

import re


def _looks_like_structured_list(text: str) -> bool:
    numbered = len(re.findall(r"(?m)^\s*\d+[.)]\s+", text))
    bullets = len(re.findall(r"(?m)^\s*[-*•]\s+", text))
    return numbered + bullets >= 3


def _looks_incomplete(text: str) -> bool:
    stripped = text.strip()
    if re.search(r"(?m)^\s*\d+[.)]\s*$", stripped):
        return True
    if re.search(r"(?m)^\s*[-*•]\s*$", stripped):
        return True
    if re.search(r"(?i)\b(and|or|with|including|such as|for example|e\.g\.)\s*$", stripped):
        return True
    cleaned = re.sub(r'[*_`\s"\'”’]+$', '', stripped)
    return bool(cleaned and cleaned[-1] not in ".!?)]")


def _split_sentences(s: str) -> list[str]:
    protected = (
        s.replace("e. g.", "e.g.")
        .replace("i. e.", "i.e.")
        .replace("E. g.", "E.g.")
        .replace("I. e.", "I.e.")
    )
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9])", protected)
    return [p.strip() for p in parts if p.strip()]


def validate_and_fix_response(
    response: str,
    history: list,
    doc_context: str = "",
    mode: str = "free",
) -> tuple[str, bool]:
    """
    Returns (fixed_response, should_regenerate).
    Maximum 2 regeneration attempts allowed (caller responsibility).
    """
    if not response or len(response.strip()) < 10:
        return response, False

    # CHECK 1: Remove forbidden opening phrases
    forbidden_openers = [
        "Great!",
        "Certainly!",
        "Of course!",
        "Absolutely!",
        "Thank you for",
        "I appreciate",
    ]
    stripped = response.strip()
    for opener in forbidden_openers:
        if stripped.startswith(opener):
            stripped = stripped[len(opener) :].lstrip(".,! ")
    response = stripped
    response = (
        response.replace("e. g. ,", "e.g.,")
        .replace("e. g.", "e.g.")
        .replace("i. e. ,", "i.e.,")
        .replace("i. e.", "i.e.")
    )

    has_document = bool(doc_context and len(doc_context.strip()) > 50)

    # CHECK 2: Enforce length limits only for prose. Lists are allowed when
    # explicitly requested and must not be cut mid-item.
    sentences = _split_sentences(response)
    if not has_document and not _looks_like_structured_list(response):
        if len(sentences) > 12:
            response = " ".join(sentences[:12])
    elif has_document and not _looks_like_structured_list(response):
        if len(sentences) > 20:
            response = " ".join(sentences[:20])

    # CHECK 3: Repetition vs recent AI messages - Increased threshold
    if history and len(history) >= 2:
        recent_ai = [
            msg["content"].lower()
            for msg in history[-6:]
            if msg.get("role") == "ai"
        ]
        repetition_count = 0
        words = response.lower().split()
        for prev_message in recent_ai:
            for i in range(max(0, len(words) - 4)):
                phrase = " ".join(words[i : i + 5])
                if phrase in prev_message and len(phrase) > 20:
                    repetition_count += 1
        if repetition_count > 4:
            return response, True

    # CHECK 4: CV specificity when document uploaded
    if has_document and any(
        word in response.lower() for word in ("cv", "resume", "document")
    ):
        indicators = [
            "university",
            "degree",
            "python",
            "javascript",
            "experience",
            "project",
            "company",
            "school",
        ]
        has_specifics = sum(1 for ind in indicators if ind in response.lower()) > 0
        if not has_specifics:
            return response, True

    # CHECK 5: Fix paragraph formatting - add newlines for lists and paragraphs
    lines = response.split('\n')
    formatted_lines = []
    for line in lines:
        stripped_line = line.strip()
        if not stripped_line:
            continue
        # Check if this looks like a list item without proper spacing
        if re.match(r'^\d+[.)]\s+\w', stripped_line) or re.match(r'^[-*•]\s+\w', stripped_line):
            formatted_lines.append('')
            formatted_lines.append(stripped_line)
        elif stripped_line and not stripped_line[0].isupper() and len(stripped_line) < 50:
            formatted_lines.append('')
            formatted_lines.append(stripped_line)
        else:
            if formatted_lines and formatted_lines[-1]:
                formatted_lines.append('')
            formatted_lines.append(stripped_line)
    response = '\n'.join(formatted_lines).strip()

    # CHECK 6: Web search failure phrases (Open Chat / temporal) - Made more specific
    web_search_failures = [
        "i cannot access current real-time information",
        "my knowledge cutoff prevents me from accessing",
        "i don't have the ability to browse",
        "i'm unable to access current",
        "i don't have real-time data capabilities",
    ]
    low = response.lower()
    if any(phrase in low for phrase in web_search_failures):
        return response, True

    # CHECK 7: Never accept answers that visibly end mid-list or mid-thought.
    if _looks_incomplete(response):
        return response, True

    return response, False
