"""Temperament & work-style assessment (offline, no AI required)."""

from __future__ import annotations

import hashlib
import json
import random
import time
from typing import Any

# Likert 1–5 per question — pool of 33 questions to pick from
_QUESTIONS_POOL: list[dict[str, Any]] = [
    {
        "id": "social_energy",
        "text": "I feel energized after group discussions or team meetings.",
        "dimension": "extraversion",
    },
    {
        "id": "deep_focus",
        "text": "I prefer working alone on complex tasks for long stretches.",
        "dimension": "introversion",
    },
    {
        "id": "structure",
        "text": "Clear plans, deadlines, and checklists help me perform best.",
        "dimension": "conscientiousness",
    },
    {
        "id": "flexibility",
        "text": "I adapt easily when plans change at the last minute.",
        "dimension": "openness",
    },
    {
        "id": "stress_calm",
        "text": "Under pressure, I usually stay calm and think step by step.",
        "dimension": "emotional_stability",
    },
    {
        "id": "stress_worry",
        "text": "Stressful situations often make me worry about disappointing others.",
        "dimension": "sensitivity",
        "reverse": False,
    },
    {
        "id": "empathy",
        "text": "I notice how others feel and adjust my tone to support them.",
        "dimension": "agreeableness",
    },
    {
        "id": "directness",
        "text": "I prefer honest, direct feedback even when it is uncomfortable.",
        "dimension": "assertiveness",
    },
    {
        "id": "creativity",
        "text": "I enjoy brainstorming new ideas more than refining existing ones.",
        "dimension": "openness",
    },
    {
        "id": "risk",
        "text": "I am willing to try unfamiliar paths if the long-term reward is strong.",
        "dimension": "risk_tolerance",
    },
    {
        "id": "achievement",
        "text": "Hitting measurable goals (grades, targets, KPIs) motivates me deeply.",
        "dimension": "drive",
    },
    {
        "id": "balance",
        "text": "Rest and personal life are as important as career success to me.",
        "dimension": "work_life_balance",
    },
    {
        "id": "leadership",
        "text": "I naturally take charge when a group lacks direction.",
        "dimension": "assertiveness",
    },
    {
        "id": "detail_oriented",
        "text": "I catch small errors others overlook before submitting work.",
        "dimension": "conscientiousness",
    },
    {
        "id": "collaboration",
        "text": "I do my best work when collaborating with diverse teammates.",
        "dimension": "extraversion",
    },
    {
        "id": "reflection",
        "text": "I need quiet time to reflect before making important decisions.",
        "dimension": "introversion",
    },
    {
        "id": "learning",
        "text": "I actively seek new skills even when my current role is stable.",
        "dimension": "openness",
    },
    {
        "id": "optimism",
        "text": "Setbacks usually feel temporary — I bounce back within days.",
        "dimension": "emotional_stability",
    },
    {
        "id": "conflict_avoid",
        "text": "I sometimes avoid conflict to keep relationships harmonious.",
        "dimension": "agreeableness",
    },
    {
        "id": "competition",
        "text": "Healthy competition motivates me to outperform my previous best.",
        "dimension": "drive",
    },
    {
        "id": "patience",
        "text": "I can stay patient with slow progress if the end goal matters.",
        "dimension": "conscientiousness",
    },
    # ==== Expanded pool below ====
    {
        "id": "time_pressure",
        "text": "I work efficiently even when deadlines are very tight.",
        "dimension": "conscientiousness",
    },
    {
        "id": "networking",
        "text": "I enjoy networking and meeting new people I have never spoken to before.",
        "dimension": "extraversion",
    },
    {
        "id": "solo_ideas",
        "text": "I come up with my best ideas when I am working alone without interruptions.",
        "dimension": "introversion",
    },
    {
        "id": "values_fit",
        "text": "I need to feel that my work aligns with my personal values to stay motivated.",
        "dimension": "emotional_stability",
    },
    {
        "id": "new_tools",
        "text": "When a new tool or technology is introduced, I am eager to try it first.",
        "dimension": "openness",
    },
    {
        "id": "clear_rules",
        "text": "Unclear rules and vague instructions make me uncomfortable.",
        "dimension": "conscientiousness",
    },
    {
        "id": "mentor_role",
        "text": "Others often come to me for advice or help without me asking.",
        "dimension": "agreeableness",
    },
    {
        "id": "starting_over",
        "text": "Starting something completely new is more exciting to me than improving something existing.",
        "dimension": "openness",
    },
    {
        "id": "small_talk",
        "text": "I find casual small talk with strangers or colleagues enjoyable and easy.",
        "dimension": "extraversion",
    },
    {
        "id": "quiet_debrief",
        "text": "After a busy day, I need quiet time alone before I feel ready to socialize again.",
        "dimension": "introversion",
    },
    {
        "id": "criticism",
        "text": "I take constructive criticism personally and need time to process it.",
        "dimension": "sensitivity",
    },
    {
        "id": "team_workload",
        "text": "I naturally check in on teammates who seem overwhelmed.",
        "dimension": "agreeableness",
    },
    {
        "id": "routine_boredom",
        "text": "Doing the same routine every day makes me lose motivation quickly.",
        "dimension": "openness",
    },
    {
        "id": "follow_through",
        "text": "Once I commit to something, I almost always follow through, even when it gets harder.",
        "dimension": "drive",
    },
    {
        "id": "ambition",
        "text": "Setting ambitious career goals keeps me focused and driven every day.",
        "dimension": "drive",
    },
    {
        "id": "leap_faith",
        "text": "I am comfortable making big decisions with incomplete information.",
        "dimension": "risk_tolerance",
    },
    {
        "id": "boundaries",
        "text": "I find it easy to say no to people when my workload is already full.",
        "dimension": "assertiveness",
    },
    {
        "id": "deadline_procrastination",
        "text": "I tend to delay tasks when there is no clear deadline.",
        "dimension": "conscientiousness",
    },
    {
        "id": "customer_service",
        "text": "I feel satisfied after helping someone solve their problem.",
        "dimension": "agreeableness",
    },
    {
        "id": "long_term_vision",
        "text": "I think about where I want to be in five years more than what I am doing right now.",
        "dimension": "openness",
    },
    {
        "id": "quiet_confidence",
        "text": "I prefer leading through quiet example rather than through words.",
        "dimension": "introversion",
    },
    {
        "id": "policy_standards",
        "text": "I care more about doing the right thing than fitting in with everyone else.",
        "dimension": "sensitivity",
    },
    {
        "id": "educational_resources",
        "text": "I actively consume career and industry content outside of work hours.",
        "dimension": "openness",
    },
    {
        "id": "structured_breaks",
        "text": "I plan structured breaks during long tasks to stay productive.",
        "dimension": "work_life_balance",
    },
    {
        "id": "honest_feedback",
        "text": "I give feedback to others directly even when it may feel uncomfortable.",
        "dimension": "assertiveness",
    },
    {
        "id": "fair_process",
        "text": "I feel more stressed by unfairness than by hard work itself.",
        "dimension": "emotional_stability",
    },
    {
        "id": "public_speaking",
        "text": "Speaking in front of a group energises rather than drains me.",
        "dimension": "extraversion",
    },
    {
        "id": "ethical_dilemma",
        "text": "In an ethical dilemma, I choose the option that protects the most vulnerable person.",
        "dimension": "agreeableness",
    },
    {
        "id": "job_security",
        "text": "Job security matters more to me than high pay or fast promotion.",
        "dimension": "work_life_balance",
    },
    {
        "id": "subordinate_role",
        "text": "I am equally comfortable following a plan as I am creating one.",
        "dimension": "risk_tolerance",
    },
    {
        "id": "positive_reinforcement",
        "text": "Recognition and praise matter more to me than a bonus or raise.",
        "dimension": "sensitivity",
    },
    {
        "id": "experimentation",
        "text": "I try different approaches when the first one fails instead of escalating immediately.",
        "dimension": "openness",
    },
    {
        "id": "peer_criticism",
        "text": "When a peer challenges my work, I see it as collaboration not confrontation.",
        "dimension": "emotional_stability",
    },
    {
        "id": "project_ownership",
        "text": "I volunteer to own projects that no one else wants to handle.",
        "dimension": "drive",
    },
]

ASSESSMENT_COUNT = 20   # questions shown per session

DIMENSION_LABELS = {
    "extraversion": "Social energy",
    "introversion": "Independent focus",
    "conscientiousness": "Structure & discipline",
    "openness": "Curiosity & adaptability",
    "emotional_stability": "Calm under pressure",
    "sensitivity": "Emotional attunement",
    "agreeableness": "Cooperation & empathy",
    "assertiveness": "Direct communication",
    "risk_tolerance": "Comfort with change",
    "drive": "Achievement motivation",
    "work_life_balance": "Balance priority",
}


def _derived_seed(seed: int | None) -> int:
    """Return a stable integer seed; derive from utc time if None."""
    if seed is not None:
        return int(seed)
    return time.time_ns()


def get_questions(
    randomize: bool = False,
    count: int = ASSESSMENT_COUNT,
    seed: int | None = None,
) -> tuple[list[dict[str, str]], int]:
    """Return (questions, seed_used).

    If *randomize* is True a deterministic shuffle is applied so every
    submission round uses a different order.  The returned *seed_used*
    must be echoed back to the submit endpoint so the same ordering is
    used when scoring.
    """
    if randomize:
        s = _derived_seed(seed)
        pool = list(_QUESTIONS_POOL)
        rng = random.Random(s)
        rng.shuffle(pool)
        picked = pool[: min(count, len(pool))]
        questions = [{"id": q["id"], "text": q["text"]} for q in picked]
        return questions, s
    picked = _QUESTIONS_POOL[: min(count, len(_QUESTIONS_POOL))]
    return [{"id": q["id"], "text": q["text"]} for q in picked], _derived_seed(seed)


def _score_dimension(
    answers: dict[str, int],
    dimension: str,
    questions_list: list[dict[str, Any]] | None = None,
) -> float:
    vals: list[float] = []
    qs = questions_list if questions_list is not None else _QUESTIONS_POOL
    for q in qs:
        if q["dimension"] != dimension:
            continue
        raw = answers.get(q["id"])
        if raw is None:
            continue
        v = max(1, min(5, int(raw)))
        vals.append(float(v))
    if not vals:
        return 50.0
    return round((sum(vals) / len(vals) / 5.0) * 100, 1)


def _temperament_label(scores: dict[str, float]) -> str:
    ext = scores.get("extraversion", 50)
    con = scores.get("conscientiousness", 50)
    ope = scores.get("openness", 50)
    stab = scores.get("emotional_stability", 50)
    if con >= 65 and stab >= 55:
        return "Structured Achiever"
    if ope >= 65 and ext >= 55:
        return "Creative Connector"
    if stab >= 65 and scores.get("agreeableness", 50) >= 60:
        return "Steady Supporter"
    if ext <= 45 and scores.get("introversion", 50) >= 55:
        return "Thoughtful Specialist"
    if scores.get("risk_tolerance", 50) >= 65:
        return "Bold Explorer"
    if scores.get("work_life_balance", 50) >= 65:
        return "Balanced Harmonizer"
    return "Adaptive Generalist"


def _classical_temperament(scores: dict[str, float]) -> dict[str, str]:
    """Map work-style scores onto the four classical temperament families."""
    ext = scores.get("extraversion", 50)
    intro = scores.get("introversion", 50)
    con = scores.get("conscientiousness", 50)
    drive = scores.get("drive", 50)
    assertive = scores.get("assertiveness", 50)
    agree = scores.get("agreeableness", 50)
    stability = scores.get("emotional_stability", 50)
    sensitivity = scores.get("sensitivity", 50)
    balance = scores.get("work_life_balance", 50)
    openness = scores.get("openness", 50)

    temperament_scores = {
        "Sanguine": (ext * 0.35) + (openness * 0.25) + (agree * 0.2) + ((100 - intro) * 0.2),
        "Choleric": (drive * 0.35) + (assertive * 0.3) + (con * 0.2) + ((100 - balance) * 0.15),
        "Melancholic": (con * 0.3) + (intro * 0.25) + (sensitivity * 0.2) + ((100 - ext) * 0.15) + (stability * 0.1),
        "Phlegmatic": (stability * 0.3) + (agree * 0.25) + (balance * 0.25) + ((100 - assertive) * 0.2),
    }
    name = max(temperament_scores, key=temperament_scores.get)
    descriptions = {
        "Sanguine": "expressive, social, optimistic, and energized by people and new experiences",
        "Choleric": "goal-driven, decisive, direct, and motivated by progress and responsibility",
        "Melancholic": "thoughtful, analytical, detail-aware, and motivated by quality and meaning",
        "Phlegmatic": "calm, cooperative, steady, and motivated by harmony and dependable routines",
    }
    return {"name": name, "description": descriptions[name]}


def generate_cv_insights(
    scores: dict[str, float],
    temperament: str,
    top_traits: list[tuple[str, float]],
) -> list[str]:
    """Return a short list of CV / career advice lines for a given profile."""
    tips: list[str] = []
    ext = scores.get("extraversion", 50)
    con = scores.get("conscientiousness", 50)
    ope = scores.get("openness", 50)

    if con >= 60:
        tips.append(
            "Quantify achievements — metrics, targets, and deadlines appeal "
            "to hiring managers who value structured performers."
        )
    if ext >= 60:
        tips.append(
            "Lead your CV with collaboration and team-impact stories; "
            "recruiters notice social-energy candidates quickly."
        )
    if ope >= 60:
        tips.append(
            "Highlight side projects, self-taught skills, and creative solutions "
            "to show you bring fresh perspectives to every role."
        )
    if scores.get("drive", 50) >= 65:
        tips.append(
            "Add a 'Key Achievements' bullet block: measurable results, "
            "KPIs hit, and promotions earned carry the most weight."
        )
    if scores.get("introversion", 50) >= 55 and ext < 50:
        tips.append(
            "Showcase depth over breadth — focused expertise, certifications, "
            "and written case studies resonate well for specialist roles."
        )
    if scores.get("agreeableness", 50) >= 65:
        tips.append(
            "Mention stakeholder management and conflict-resolution wins; "
            "people-first roles prioritise empathy on CVs."
        )
    if scores.get("work_life_balance", 50) >= 65:
        tips.append(
            "Signal reliability but set healthy boundaries — 'available for "
            "on-call rotation' earns trust without overselling burnout."
        )
    if not tips:
        tips.append(
            "Tailor your CV to each role with language from the job description "
            "and clear metrics wherever you can."
        )
    # Add temperament-specific label
    tips.insert(0, f"Temperament '{temperament}' excels when the CV reflects personal authenticity.")
    return tips


def build_profile(answers: dict[str, int]) -> dict[str, Any]:
    """Compute trait scores and human-readable coaching notes."""
    dimensions = sorted(
        {q["dimension"] for q in _QUESTIONS_POOL},
        key=lambda d: DIMENSION_LABELS.get(d, d),
    )
    scores = {d: _score_dimension(answers, d) for d in dimensions}
    temperament = _temperament_label(scores)
    classical = _classical_temperament(scores)

    top_traits = sorted(scores.items(), key=lambda x: -x[1])[:3]
    growth_traits = sorted(scores.items(), key=lambda x: x[1])[:2]

    trait_lines = "\n".join(
        f"- {DIMENSION_LABELS.get(k, k)}: {v}/100" for k, v in scores.items()
    )
    top_line = ", ".join(DIMENSION_LABELS.get(k, k) for k, _ in top_traits)
    growth_line = ", ".join(DIMENSION_LABELS.get(k, k) for k, _ in growth_traits)

    career_notes = (
        f"Career coaching: Lead with their strength in {top_line}. "
        f"Offer structured steps and measurable milestones when conscientiousness or drive is high. "
        f"For lower {growth_line}, suggest smaller experiments and mentorship rather than sudden leaps."
    )
    work_style = (
        f"This user is likely to work best when tasks make use of {top_line}. "
        "They should be given clear expectations, practical examples, and room to turn strengths into visible outcomes."
    )
    learning_style = (
        "They are likely to benefit from step-by-step explanations, short practice loops, "
        "and feedback that connects concepts to real career or study situations."
    )
    motivators = [
        DIMENSION_LABELS.get(k, k) for k, _ in top_traits
    ]
    growth_areas = [
        f"Build confidence in {DIMENSION_LABELS.get(k, k)} through small, low-risk practice tasks."
        for k, _ in growth_traits
    ]
    wellness_notes = (
        f"Mental wellness: Temperament '{temperament}'. "
        f"If sensitivity is elevated, validate feelings before problem-solving. "
        f"If emotional stability is lower, emphasize grounding routines and realistic pacing. "
        f"Respect balance priority — avoid hustle-only framing when work-life balance scores high."
    )
    coach_instructions = (
        f"Personalize coaching for a {temperament}: start with validation, use structured next steps, "
        "ask one clarifying question when needed, and connect advice to the user's strongest traits."
    )

    # CV-specific advice keyed by dominant traits
    cv_insights = generate_cv_insights(scores, temperament, top_traits)

    summary = (
        f"TEMPERAMENT: {temperament}\n\n"
        f"CLASSICAL TEMPERAMENT: {classical['name']} - {classical['description']}\n\n"
        f"TRAIT SCORES (0-100):\n{trait_lines}\n\n"
        f"STRENGTHS: {top_line}\n"
        f"GROWTH AREAS: {growth_line}\n\n"
        f"WORK STYLE: {work_style}\n\n"
        f"LEARNING STYLE: {learning_style}\n\n"
        f"MOTIVATORS: {', '.join(motivators)}\n\n"
        f"{career_notes}\n\n"
        f"{wellness_notes}\n\n"
        f"COACH INSTRUCTIONS: {coach_instructions}"
    )

    return {
        "temperament": temperament,
        "classical_temperament": classical["name"],
        "classical_temperament_description": classical["description"],
        "scores": scores,
        "summary": summary,
        "career_notes": career_notes,
        "wellness_notes": wellness_notes,
        "work_style": work_style,
        "learning_style": learning_style,
        "motivators": motivators,
        "growth_areas": growth_areas,
        "coach_instructions": coach_instructions,
        "cv_insights": cv_insights,
        "completed_at": None,
    }


def profile_to_storage(profile: dict[str, Any]) -> str:
    """Store JSON + readable block for prompts."""
    payload = {
        "version": 1,
        "temperament": profile["temperament"],
        "classical_temperament": profile.get("classical_temperament", ""),
        "classical_temperament_description": profile.get("classical_temperament_description", ""),
        "scores": profile["scores"],
        "career_notes": profile["career_notes"],
        "wellness_notes": profile["wellness_notes"],
        "work_style": profile.get("work_style", ""),
        "learning_style": profile.get("learning_style", ""),
        "motivators": profile.get("motivators", []),
        "growth_areas": profile.get("growth_areas", []),
        "coach_instructions": profile.get("coach_instructions", ""),
        "cv_insights": profile.get("cv_insights", []),
    }
    return json.dumps(payload, ensure_ascii=False) + "\n---\n" + profile["summary"]


def parse_stored_profile(raw: str | None) -> dict[str, Any] | None:
    if not raw or not raw.strip():
        return None
    if "---" in raw:
        head = raw.split("---", 1)[0].strip()
        summary = raw.split("---", 1)[1].strip()
        try:
            data = json.loads(head)
            data["summary"] = summary
            return data
        except json.JSONDecodeError:
            return {"summary": raw.strip(), "temperament": "Unknown"}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"summary": raw.strip(), "temperament": "Custom"}
