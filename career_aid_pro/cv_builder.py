"""AI-assisted CV generation from structured answers and career chat context."""

from __future__ import annotations

import html
import json
import re
from typing import Any

from career_aid_pro.config import AI_SERVICE_BASE, MODEL_CAREER
from career_aid_pro.ai_client import check_ai_service


def _esc(text: str) -> str:
    return html.escape((text or "").strip())


def _bullets(items: list[str]) -> str:
    clean = [b.strip() for b in items if b and b.strip()]
    if not clean:
        return ""
    return "<ul>" + "".join(f"<li>{_esc(b)}</li>" for b in clean) + "</ul>"


def render_cv_html(data: dict[str, Any], ai_sections: dict[str, str] | None = None, template: str = "sidebar") -> str:
    """Render a professional CV as printable HTML with dramatically different layouts."""
    ai = ai_sections or {}
    name = _esc(data.get("full_name") or "Your Name")
    role = _esc(data.get("target_role") or "Professional")
    email = _esc(data.get("email") or "")
    phone = _esc(data.get("phone") or "")
    location = _esc(data.get("location") or "")
    linkedin = (data.get("linkedin") or "").strip()
    summary = _esc(ai.get("summary") or data.get("professional_summary") or "")

    contact_parts = [p for p in [email, phone, location] if p]
    contact_line = " | ".join(contact_parts)
    if linkedin:
        safe_url = linkedin if linkedin.startswith("http") else f"https://{linkedin}"
        contact_line += f' | <a href="{_esc(safe_url)}" class="cv-link">{_esc(linkedin)}</a>'

    _exp = lambda job: (
        f'<div class="cv-block">'
        f'<div class="cv-row"><strong>{_esc(job.get("title") or "")}</strong><span class="cv-muted">{_esc(job.get("dates") or "")}</span></div>'
        f'<p class="cv-sub">{_esc(job.get("company") or "")}</p>{_bullets(job.get("bullets") or [])}</div>'
    )
    exp_html = "".join(_exp(job) for job in (data.get("experience") or []))

    _edu = lambda ed: (
        f'<div class="cv-block">'
        f'<div class="cv-row"><strong>{_esc(ed.get("degree") or "")}</strong><span class="cv-muted">{_esc(ed.get("year") or "")}</span></div>'
        f'<p class="cv-sub">{_esc(ed.get("school") or "")}</p></div>'
    )
    edu_html = "".join(_edu(ed) for ed in (data.get("education") or []))

    skills = _esc(ai.get("skills") or data.get("skills") or "")
    certs = _esc(data.get("certifications") or "")
    languages = _esc(data.get("languages") or "")

    sections: list[str] = []
    if summary:
        sections.append(f"<section class='cv-section'><h2>Professional Summary</h2><p>{summary}</p></section>")
    if exp_html.strip():
        sections.append(f"<section class='cv-section'><h2>Experience</h2>{exp_html}</section>")
    if edu_html.strip():
        sections.append(f"<section class='cv-section'><h2>Education</h2>{edu_html}</section>")
    if skills:
        sections.append(f"<section class='cv-section'><h2>Skills</h2><p class='cv-tags'>{skills}</p></section>")
    if certs:
        sections.append(f"<section class='cv-section'><h2>Certifications</h2><p>{certs}</p></section>")
    if languages:
        sections.append(f"<section class='cv-section'><h2>Languages</h2><p>{languages}</p></section>")

    body = "\n".join(sections)

    templates = {
        "sidebar": _cv_sidebar(name, role, email, phone, location, linkedin, contact_line, body),
        "twocolumn": _cv_twocolumn(name, role, email, phone, location, linkedin, contact_line, body),
        "timeline": _cv_timeline(name, role, email, phone, location, linkedin, contact_line, body),
        "minimalist": _cv_minimalist(name, role, email, phone, location, linkedin, contact_line, body),
        "infographic": _cv_infographic(name, role, email, phone, location, linkedin, contact_line, body),
        "centered": _cv_centered(name, role, email, phone, location, linkedin, contact_line, body),
        "boxed": _cv_boxed(name, role, email, phone, location, linkedin, contact_line, body),
        "dark": _cv_dark(name, role, email, phone, location, linkedin, contact_line, body),
        "lined": _cv_lined(name, role, email, phone, location, linkedin, contact_line, body),
        "classic": _cv_classic(name, role, email, phone, location, linkedin, contact_line, body),
        "executive": _cv_executive(name, role, email, phone, location, linkedin, contact_line, body),
        "atelier": _cv_atelier(name, role, email, phone, location, linkedin, contact_line, body),
        "metro": _cv_metro(name, role, email, phone, location, linkedin, contact_line, body),
        "editorial": _cv_editorial(name, role, email, phone, location, linkedin, contact_line, body),
        "compact": _cv_compact(name, role, email, phone, location, linkedin, contact_line, body),
        "accentbar": _cv_accentbar(name, role, email, phone, location, linkedin, contact_line, body),
        "portfolio": _cv_portfolio(name, role, email, phone, location, linkedin, contact_line, body),
        "consultant": _cv_consultant(name, role, email, phone, location, linkedin, contact_line, body),
        "graduate": _cv_graduate(name, role, email, phone, location, linkedin, contact_line, body),
        "tech": _cv_tech(name, role, email, phone, location, linkedin, contact_line, body),
    }
    return templates.get(template, templates["sidebar"])


def _cv_modern_template(
    name: str,
    role: str,
    contact_line: str,
    body: str,
    *,
    slug: str,
    font: str,
    bg: str,
    paper: str,
    ink: str,
    muted: str,
    accent: str,
    header: str,
    section: str,
) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>{name} — CV</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: {font}; background: {bg}; color: {ink}; padding: 2.25rem; line-height: 1.55; }}
    .cv-wrapper {{ max-width: 860px; margin: 0 auto; background: {paper}; border: 1px solid rgba(15,23,42,0.12); box-shadow: 0 18px 50px rgba(15,23,42,0.12); }}
    .cv-header {{ {header} }}
    .cv-header h1 {{ font-size: 2.35rem; line-height: 1; font-weight: 800; margin-bottom: 0.45rem; }}
    .cv-role {{ color: {muted}; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.78rem; }}
    .cv-contact {{ color: {muted}; margin-top: 0.8rem; font-size: 0.9rem; }}
    .cv-body {{ padding: 2rem 2.25rem; }}
    .cv-section {{ {section} }}
    .cv-section h2 {{ color: {accent}; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.7rem; }}
    .cv-block {{ margin-bottom: 1rem; break-inside: avoid; }}
    .cv-row {{ display: flex; justify-content: space-between; gap: 1rem; }}
    .cv-sub, .cv-muted {{ color: {muted}; }}
    .cv-tags {{ font-weight: 600; }}
    ul {{ margin-left: 1.15rem; }}
    li {{ margin: 0.25rem 0; }}
    a {{ color: {accent}; text-decoration: none; }}
    @media print {{ body {{ padding: 0; background: #fff; }} .cv-wrapper {{ box-shadow: none; border: 0; }} }}
  </style>
</head>
<body class="{slug}">
  <div class="cv-wrapper">
    <header class="cv-header">
      <h1>{name}</h1>
      <p class="cv-role">{role}</p>
      <p class="cv-contact">{contact_line}</p>
    </header>
    <main class="cv-body">{body}</main>
  </div>
</body>
</html>"""


def _cv_executive(name, role, email, phone, location, linkedin, contact_line, body):
    return _cv_modern_template(name, role, contact_line, body, slug="executive", font="'Inter', Arial, sans-serif", bg="#eef2f7", paper="#ffffff", ink="#111827", muted="#64748b", accent="#1d4ed8", header="padding: 2.4rem 2.5rem; border-top: 8px solid #1d4ed8; border-bottom: 1px solid #dbe3ef;", section="margin-bottom: 1.55rem;")


def _cv_atelier(name, role, email, phone, location, linkedin, contact_line, body):
    return _cv_modern_template(name, role, contact_line, body, slug="atelier", font="'Playfair Display', Georgia, serif", bg="#f7f2ec", paper="#fffdf8", ink="#1f2937", muted="#7c6f64", accent="#be123c", header="padding: 2.6rem; border-bottom: 3px double #be123c; text-align: center;", section="margin-bottom: 1.75rem;")


def _cv_metro(name, role, email, phone, location, linkedin, contact_line, body):
    return _cv_modern_template(name, role, contact_line, body, slug="metro", font="'Inter', Arial, sans-serif", bg="#f8fafc", paper="#ffffff", ink="#172033", muted="#56657a", accent="#0f766e", header="padding: 2rem 2.25rem; background: linear-gradient(90deg,#0f766e 0 34%,#ffffff 34%); color: #0f172a;", section="margin-bottom: 1.4rem; padding-left: 1rem; border-left: 3px solid #0f766e;")


def _cv_editorial(name, role, email, phone, location, linkedin, contact_line, body):
    return _cv_modern_template(name, role, contact_line, body, slug="editorial", font="'Georgia', serif", bg="#ffffff", paper="#ffffff", ink="#111111", muted="#555555", accent="#111111", header="padding: 2.4rem 0 1.2rem; margin: 0 2.5rem; border-bottom: 5px solid #111;", section="margin-bottom: 1.6rem;")


def _cv_compact(name, role, email, phone, location, linkedin, contact_line, body):
    return _cv_modern_template(name, role, contact_line, body, slug="compact", font="'Inter', Arial, sans-serif", bg="#f1f5f9", paper="#ffffff", ink="#0f172a", muted="#475569", accent="#2563eb", header="padding: 1.55rem 1.8rem; background: #eff6ff;", section="margin-bottom: 1rem;")


def _cv_accentbar(name, role, email, phone, location, linkedin, contact_line, body):
    return _cv_modern_template(name, role, contact_line, body, slug="accentbar", font="'Inter', Arial, sans-serif", bg="#f7fafc", paper="#ffffff", ink="#102a43", muted="#627d98", accent="#b45309", header="padding: 2.4rem 2.5rem 2.4rem 3.25rem; border-left: 18px solid #b45309;", section="margin-bottom: 1.45rem;")


def _cv_portfolio(name, role, email, phone, location, linkedin, contact_line, body):
    return _cv_modern_template(name, role, contact_line, body, slug="portfolio", font="'Inter', Arial, sans-serif", bg="#0b1120", paper="#f8fafc", ink="#111827", muted="#64748b", accent="#7c3aed", header="padding: 2.5rem; background: #111827; color: #ffffff;", section="margin-bottom: 1.45rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem;")


def _cv_consultant(name, role, email, phone, location, linkedin, contact_line, body):
    return _cv_modern_template(name, role, contact_line, body, slug="consultant", font="'Inter', Arial, sans-serif", bg="#f8fafc", paper="#ffffff", ink="#0f172a", muted="#64748b", accent="#0891b2", header="padding: 2.25rem; display: grid; grid-template-columns: 1.4fr 1fr; gap: 1rem; align-items: end; border-bottom: 4px solid #0891b2;", section="margin-bottom: 1.4rem;")


def _cv_graduate(name, role, email, phone, location, linkedin, contact_line, body):
    return _cv_modern_template(name, role, contact_line, body, slug="graduate", font="'Inter', Arial, sans-serif", bg="#ecfeff", paper="#ffffff", ink="#164e63", muted="#0e7490", accent="#0891b2", header="padding: 2.2rem; background: #cffafe; border-bottom: 1px solid #67e8f9;", section="margin-bottom: 1.35rem;")


def _cv_tech(name, role, email, phone, location, linkedin, contact_line, body):
    return _cv_modern_template(name, role, contact_line, body, slug="tech", font="'Inter', Arial, sans-serif", bg="#020617", paper="#0f172a", ink="#e5e7eb", muted="#94a3b8", accent="#22c55e", header="padding: 2.35rem; border-bottom: 1px solid #334155; background: linear-gradient(135deg,#0f172a,#111827);", section="margin-bottom: 1.4rem;")


def _cv_sidebar(name, role, email, phone, location, linkedin, contact_line, body):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>{name} — CV</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: 'Inter', sans-serif; background: #fff; padding: 0; }}
    .cv-wrapper {{ display: flex; min-height: 100vh; }}
    .cv-sidebar {{ width: 35%; background: #0f172a; color: #e2e8f0; padding: 2.5rem 1.5rem; }}
    .cv-main {{ width: 65%; padding: 2.5rem 2rem; }}
    .cv-sidebar h1 {{ font-size: 1.9rem; color: #fff; margin-bottom: 0.3rem; }}
    .cv-sidebar .cv-role {{ font-size: 0.95rem; color: #94a3b8; margin-bottom: 1.5rem; text-transform: uppercase; }}
    .cv-sidebar-label {{ font-size: 0.7rem; text-transform: uppercase; color: #64748b; margin: 1.5rem 0 0.4rem; }}
    .cv-main h2 {{ font-size: 0.75rem; text-transform: uppercase; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 0.3rem; margin: 1.5rem 0 0.8rem; }}
    .cv-block {{ margin-bottom: 1rem; }}
    ul {{ margin-left: 1.2rem; font-size: 0.88rem; }}
  </style>
</head>
<body>
  <div class="cv-wrapper">
    <aside class="cv-sidebar">
      <h1>{name}</h1>
      <p class="cv-role">{role}</p>
      <div class="cv-sidebar-label">Contact</div>
      <div>{contact_line}</div>
    </aside>
    <main class="cv-main">{body}</main>
  </div>
</body>
</html>"""


def _cv_twocolumn(name, role, email, phone, location, linkedin, contact_line, body):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>{name} — CV</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: 'Inter', sans-serif; background: #f8fafc; padding: 2rem; color: #1e293b; }}
    .cv-wrapper {{ max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; }}
    .cv-header {{ grid-column: 1 / -1; text-align: center; padding-bottom: 1.5rem; border-bottom: 4px solid #0ea5e9; }}
    .cv-header h1 {{ font-size: 2.4rem; font-weight: 800; color: #0f172a; }}
    .cv-header p {{ color: #64748b; }}
    .cv-section h2 {{ font-size: 0.85rem; text-transform: uppercase; color: #0ea5e9; }}
  </style>
</head>
<body>
  <div class="cv-wrapper">
    <header class="cv-header"><h1>{name}</h1><p>{role} | {contact_line}</p></header>
    {body}
  </div>
</body>
</html>"""


def _cv_timeline(name, role, email, phone, location, linkedin, contact_line, body):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>{name} — CV</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: 'Inter', sans-serif; background: #fff; padding: 2rem; color: #1e293b; }}
    .cv-timeline {{ max-width: 800px; margin: 0 auto; position: relative; }}
    .cv-timeline::before {{ content: ''; position: absolute; left: 40px; top: 0; bottom: 0; width: 4px; background: #0ea5e9; }}
    .cv-header {{ margin-bottom: 2rem; padding-left: 80px; }}
    .cv-header h1 {{ font-size: 2rem; font-weight: 800; }}
    .cv-section {{ margin-bottom: 1.5rem; padding-left: 80px; position: relative; }}
    .cv-section::before {{ content: ''; position: absolute; left: 30px; top: 6px; width: 24px; height: 24px; background: #0ea5e9; border-radius: 50%; border: 4px solid #fff; }}
    .cv-section h2 {{ font-size: 0.9rem; color: #0ea5e9; }}
  </style>
</head>
<body>
  <div class="cv-timeline">
    <header class="cv-header"><h1>{name}</h1><p>{role}</p></header>
    {body}
  </div>
</body>
</html>"""


def _cv_minimalist(name, role, email, phone, location, linkedin, contact_line, body):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>{name} — CV</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; padding: 3.5rem; color: #000; line-height: 1.6; }}
    .cv-wrapper {{ max-width: 680px; margin: 0 auto; }}
    .cv-header {{ margin-bottom: 2.5rem; }}
    .cv-header h1 {{ font-size: 2.4rem; font-weight: 300; letter-spacing: -0.03em; }}
    .cv-header p {{ color: #555; font-size: 1.1rem; }}
    .cv-section {{ margin-bottom: 2rem; }}
    .cv-section h2 {{ font-size: 0.8rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem; }}
    .cv-section h2 span {{ display: block; width: 50px; height: 1px; background: #000; margin-top: 0.5rem; }}
  </style>
</head>
<body>
  <div class="cv-wrapper">
    <header class="cv-header"><h1>{name}</h1><p>{role} — {contact_line}</p></header>
    {body}
  </div>
</body>
</html>"""


def _cv_infographic(name, role, email, phone, location, linkedin, contact_line, body):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>{name} — CV</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: 'Inter', sans-serif; background: #0f172a; color: #e2e8f0; padding: 2.5rem; }}
    .cv-wrapper {{ max-width: 850px; margin: 0 auto; }}
    .cv-header {{ text-align: center; padding: 2.5rem; background: linear-gradient(135deg, #0ea5e9, #8b5cf6); border-radius: 20px; margin-bottom: 2rem; }}
    .cv-header h1 {{ font-size: 2.5rem; font-weight: 800; color: #fff; }}
    .cv-header p {{ color: rgba(255,255,255,0.9); }}
    .cv-section {{ background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; }}
    .cv-section h2 {{ font-size: 0.85rem; color: #0ea5e9; }}
  </style>
</head>
<body>
  <div class="cv-wrapper">
    <header class="cv-header"><h1>{name}</h1><p>{role}</p></header>
    {body}
  </div>
</body>
</html>"""


def _cv_centered(name, role, email, phone, location, linkedin, contact_line, body):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>{name} — CV</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: 'Georgia', serif; background: #fdf6e3; color: #333; padding: 2.5rem; }}
    .cv-wrapper {{ max-width: 750px; margin: 0 auto; text-align: center; }}
    .cv-header {{ margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 4px double #333; }}
    .cv-header h1 {{ font-size: 2.8rem; font-weight: bold; letter-spacing: 0.05em; }}
    .cv-header p {{ font-size: 1.2rem; font-style: italic; }}
    .cv-section {{ margin-bottom: 2.5rem; text-align: left; }}
    .cv-section h2 {{ font-size: 1rem; font-weight: bold; text-align: center; border-top: 2px solid #333; border-bottom: 2px solid #333; padding: 0.6rem 0; margin: 2rem 0; }}
  </style>
</head>
<body>
  <div class="cv-wrapper">
    <header class="cv-header"><h1>{name}</h1><p>{role}<br/>{contact_line}</p></header>
    {body}
  </div>
</body>
</html>"""


def _cv_boxed(name, role, email, phone, location, linkedin, contact_line, body):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>{name} — CV</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: 'Inter', sans-serif; background: #f1f5f9; padding: 2.5rem; }}
    .cv-wrapper {{ max-width: 820px; margin: 0 auto; background: #fff; padding: 3rem; border: 3px solid #0ea5e9; box-shadow: 15px 15px 0 rgba(0,0,0,0.12); }}
    .cv-header {{ border: 3px solid #0ea5e9; padding: 2rem; text-align: center; margin-bottom: 2.5rem; background: #f8fafc; }}
    .cv-header h1 {{ font-size: 2.2rem; font-weight: 800; }}
    .cv-section {{ border: 2px solid #e2e8f0; padding: 1.5rem; margin-bottom: 1.5rem; }}
    .cv-section h2 {{ font-size: 0.85rem; color: #0ea5e9; }}
  </style>
</head>
<body>
  <div class="cv-wrapper">
    <header class="cv-header"><h1>{name}</h1><p>{role} • {contact_line}</p></header>
    {body}
  </div>
</body>
</html>"""


def _cv_dark(name, role, email, phone, location, linkedin, contact_line, body):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>{name} — CV</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: 'Inter', sans-serif; background: #000; color: #e5e7eb; padding: 3rem; }}
    .cv-wrapper {{ max-width: 820px; margin: 0 auto; background: #111; border: 1px solid #333; }}
    .cv-header {{ background: #1a1a1a; padding: 2.5rem; text-align: center; }}
    .cv-header h1 {{ font-size: 2.3rem; font-weight: 800; color: #fff; }}
    .cv-header p {{ color: #9ca3af; }}
    .cv-body {{ padding: 2.5rem; }}
    .cv-section {{ margin-bottom: 1.8rem; }}
    .cv-section h2 {{ font-size: 0.85rem; color: #60a5fa; }}
  </style>
</head>
<body>
  <div class="cv-wrapper">
    <header class="cv-header"><h1>{name}</h1><p>{role} — {contact_line}</p></header>
    <div class="cv-body">{body}</div>
  </div>
</body>
</html>"""


def _cv_lined(name, role, email, phone, location, linkedin, contact_line, body):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>{name} — CV</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: 'Georgia', serif; color: #1a1a1a; background: #fff; padding: 0; }}
    .cv-wrapper {{ max-width: 750px; margin: 0 auto; background: repeating-linear-gradient(#fff, #fff 34px, #e5e7eb 35px); padding: 3rem; }}
    .cv-header {{ text-align: center; padding: 2rem; border: 2px solid #ddd; margin-bottom: 2.5rem; background: #f9fafb; }}
    .cv-header h1 {{ font-size: 2.5rem; font-weight: bold; letter-spacing: 0.08em; }}
    .cv-section {{ margin-bottom: 2rem; }}
    .cv-section h2 {{ font-size: 1rem; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 0.4rem; margin-bottom: 1rem; }}
  </style>
</head>
<body>
  <div class="cv-wrapper">
    <header class="cv-header"><h1>{name}</h1><p>{role}<br/>{contact_line}</p></header>
    {body}
  </div>
</body>
</html>"""


def _cv_classic(name, role, email, phone, location, linkedin, contact_line, body):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>{name} — CV</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: 'Times New Roman', serif; background: #fff; padding: 3rem; color: #000; }}
    .cv-wrapper {{ max-width: 700px; margin: 0 auto; }}
    .cv-header {{ text-align: center; padding-bottom: 1.5rem; border-bottom: 5px solid #000; margin-bottom: 2.5rem; }}
    .cv-header h1 {{ font-size: 2.4rem; font-weight: bold; }}
    .cv-header p {{ font-size: 1.1rem; }}
    .cv-section {{ margin-bottom: 1.8rem; }}
    .cv-section h2 {{ font-size: 1rem; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 0.3rem; margin-bottom: 0.8rem; }}
  </style>
</head>
<body>
  <div class="cv-wrapper">
    <header class="cv-header"><h1>{name}</h1><p>{role} — {contact_line}</p></header>
    {body}
  </div>
</body>
</html>"""


def extract_career_chat_context(chats: list[dict[str, Any]], max_chars: int = 3500) -> str:
    snippets: list[str] = []
    for chat in chats:
        if chat.get("mode") != "Career Coach":
            continue
        history = chat.get("history") or []
        if isinstance(history, str):
            try:
                history = json.loads(history)
            except json.JSONDecodeError:
                continue
        for msg in history:
            if msg.get("role") == "user":
                text = (msg.get("content") or "").strip()
                if len(text) > 30:
                    snippets.append(text[:400])
    return "\n".join(snippets[-12:])[:max_chars]


def polish_cv_with_ai(
    data: dict[str, Any],
    chat_context: str = "",
) -> tuple[dict[str, str], str | None]:
    if not check_ai_service():
        return {}, "AI polish is temporarily unavailable — using your answers as provided."

    payload = {
        "full_name": data.get("full_name"),
        "target_role": data.get("target_role"),
        "summary": data.get("professional_summary"),
        "experience": data.get("experience"),
        "education": data.get("education"),
        "skills": data.get("skills"),
        "improvement_notes": data.get("improvement_notes") or [],
    }
    prompt = (
        "You are an expert CV writer for Ghana and international job markets. "
        "Given this JSON profile, return ONLY valid JSON with keys: "
        '"summary" (3-4 professional sentences), '
        '"skills" (comma-separated skill string), '
        '"experience" (same array structure but improved bullets as string arrays, max 4 each). '
        "Use strong action verbs; stay truthful.\n\n"
        "If improvement_notes are present, use them as editing instructions. "
        "Do not invent jobs, employers, certifications, grades, dates, numbers, or outcomes.\n\n"
        f"Profile:\n{json.dumps(payload, ensure_ascii=False)}"
    )
    if chat_context.strip():
        prompt += f"\n\nCareer coaching context:\n{chat_context[:2000]}"

    try:
        import requests

        resp = requests.post(
            f"{AI_SERVICE_BASE}/api/generate",
            json={"model": MODEL_CAREER, "prompt": prompt, "stream": False},
            timeout=120,
        )
        if resp.status_code != 200:
            return {}, f"AI polish failed ({resp.status_code})"
        raw = (resp.json().get("response") or "").strip()
        match = re.search(r"\{[\s\S]*\}", raw)
        if not match:
            return {}, None
        parsed = json.loads(match.group())
        ai_sections: dict[str, str] = {}
        if parsed.get("summary"):
            ai_sections["summary"] = str(parsed["summary"])
        if parsed.get("skills"):
            ai_sections["skills"] = str(parsed["skills"])
        if isinstance(parsed.get("experience"), list):
            data["experience"] = parsed["experience"]
        return ai_sections, None
    except Exception as e:
        return {}, str(e)


def generate_cv(
    data: dict[str, Any],
    chat_context: str = "",
    use_ai: bool = True,
    template: str = "sidebar",
) -> dict[str, Any]:
    ai_sections: dict[str, str] = {}
    ai_note: str | None = None
    if use_ai:
        ai_sections, ai_note = polish_cv_with_ai(data, chat_context)
    html_doc = render_cv_html(data, ai_sections, template=template)
    return {"html": html_doc, "ai_note": ai_note, "used_ai": bool(ai_sections)}
