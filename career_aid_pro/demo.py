"""Preview response mode - deterministic canned answers for presentations."""

from __future__ import annotations

DEMO_RESPONSES = {
    "career_cv": """Your CV shows strong technical foundations in Python, JavaScript,
and database skills. The most immediate improvement I see is to quantify your
achievements — instead of "built a career guidance app", write "developed AI-powered
career platform serving 50+ beta users with 73% satisfaction rate". Which section
would you like to strengthen first — your work experience or technical projects?""",
    "sports": """Arsenal won their match today 2-1 against Nottingham Forest.
Bukayo Saka scored both goals in the second half. They're currently 2nd in the
Premier League, 6 points behind Liverpool.""",
    "stress": """It sounds like the exam pressure is weighing heavily on you right now.
That feeling of everything piling up at once — work, studies, expectations — is real
and it's exhausting. Before we talk about strategies, can I ask: when did you last
take a full day to just rest, without guilt?""",
    "bitcoin": """Bitcoin is currently trading at $67,340 USD, up 2.3% in the last 24 hours.
The recent surge is attributed to increased institutional adoption and positive regulatory
developments in the United States.""",
}


def get_demo_response(mode: str, query: str) -> str:
    """Return a pre-written response for common preview queries."""
    q = query.lower()

    if any(word in q for word in ("arsenal", "football", "match", "score", "premier")):
        return DEMO_RESPONSES["sports"]
    if any(word in q for word in ("bitcoin", "crypto", "btc", "price")):
        return DEMO_RESPONSES["bitcoin"]
    if mode == "Mental Health" and any(
        word in q for word in ("stress", "anxious", "worried", "pressure", "overwhelm")
    ):
        return DEMO_RESPONSES["stress"]
    if any(word in q for word in ("cv", "resume", "curriculum")):
        return DEMO_RESPONSES["career_cv"]

    if mode == "Career Coach":
        return DEMO_RESPONSES["career_cv"]
    if mode == "Mental Health":
        return DEMO_RESPONSES["stress"]
    return (
        "Here is a concise preview response. Turn off preview response mode to use the hosted AI service. "
        "Try asking about a CV, football scores, Bitcoin, or stress."
    )
