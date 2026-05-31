"""AI feedback generation for CV Analyzer."""

from __future__ import annotations

import json
from typing import Any

import requests

from career_aid_pro.config import AI_SERVICE_BASE, MODEL_CAREER
from career_aid_pro.ai_client import check_ai_service


def _offline_feedback_report(heuristic_analysis: dict[str, Any]) -> str:
    score = heuristic_analysis.get("score", heuristic_analysis.get("total_score", "not scored"))
    suggestions = heuristic_analysis.get("suggestions") or heuristic_analysis.get("recommendations") or []
    if not isinstance(suggestions, list):
        suggestions = [str(suggestions)]
    data = {
        "overall_objective_summary": (
            f"Live AI feedback is currently offline, so this report uses the built-in CV scorecard. "
            f"Current score: {score}."
        ),
        "strengths": ["The CV was readable enough for the automated scorecard to evaluate."],
        "weaknesses": suggestions[:3] or ["Some sections may need clearer evidence, formatting, or role-specific detail."],
        "recommended_improvements": suggestions[:5] or [
            "Add measurable achievements to experience bullets.",
            "Keep formatting consistent and easy to scan.",
            "Tailor the summary and skills to the target role.",
        ],
        "priority_actions": suggestions[:3] or [
            "Review contact details, summary, experience, and skills.",
            "Add numbers, tools, and outcomes where possible.",
            "Run the CV through the analyzer again after edits.",
        ],
    }
    return json.dumps(data, ensure_ascii=False, indent=2)


def _build_feedback_prompt(cv_text: str, heuristic_analysis: dict[str, Any]) -> str:
    # Keep prompt deterministic-ish and structure output.
    return (
        "You are an expert CV reviewer and career coach. "
        "Write an objective, detailed feedback report for the user\n\n"
        "REQUIREMENTS\n"
        "- Tone: professional, constructive, and direct.\n"
        "- Must be based on the provided CV text only.\n"
        "- Include: strengths, weaknesses, and recommended improvements.\n"
        "- Add specific examples by referencing relevant parts of the CV (e.g., 'in the Experience section...').\n"
        "- Do NOT invent jobs, degrees, employers, dates, or skills.\n\n"
        "OUTPUT FORMAT (strict JSON)\n"
        "Return ONLY valid JSON with keys:\n"
        "{\n"
        '  "overall_objective_summary": string,\n'
        '  "strengths": string[],\n'
        '  "weaknesses": string[],\n'
        '  "recommended_improvements": string[],\n'
        '  "priority_actions": string[]\n'
        "}\n\n"
        "HEURISTIC SCORECARD (may help you focus)\n"
        f"{json.dumps(heuristic_analysis, ensure_ascii=False)}\n\n"
        "CV TEXT\n"
        f"""{cv_text}"""
    )


def generate_cv_feedback_report(cv_text: str, heuristic_analysis: dict[str, Any]) -> str:
    """Generate a CV feedback report as JSON string, or a user-readable string on errors."""
    if not check_ai_service():
        return _offline_feedback_report(heuristic_analysis)

    prompt = _build_feedback_prompt(cv_text=cv_text, heuristic_analysis=heuristic_analysis)

    try:
        resp = requests.post(
            f"{AI_SERVICE_BASE}/api/generate",
            json={"model": MODEL_CAREER, "prompt": prompt, "stream": False},
            timeout=180,
        )
    except requests.RequestException:
        return _offline_feedback_report(heuristic_analysis)
    if resp.status_code != 200:
        return _offline_feedback_report(heuristic_analysis)

    raw = (resp.json().get("response") or "").strip()

    # Try to extract JSON.
    try:
        match_start = raw.find("{")
        match_end = raw.rfind("}")
        if match_start == -1 or match_end == -1 or match_end <= match_start:
            return raw
        data = json.loads(raw[match_start : match_end + 1])
        return json.dumps(data, ensure_ascii=False, indent=2)
    except Exception:
        return raw
