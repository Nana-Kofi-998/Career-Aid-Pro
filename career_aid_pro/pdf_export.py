"""Optional PDF export for CV score summaries (reportlab)."""

from __future__ import annotations

import io
from typing import Any

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def build_cv_score_pdf(username: str, analysis: dict[str, Any]) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter
    y = height - 50
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, "Career-Aid Pro — CV Score Report")
    y -= 28
    c.setFont("Helvetica", 10)
    c.drawString(50, y, f"User: {username}")
    y -= 16
    c.drawString(50, y, f"Total score: {analysis.get('total_score', 0)} / 100")
    y -= 22
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y, "Breakdown")
    y -= 16
    c.setFont("Helvetica", 10)
    for k, v in (analysis.get("breakdown") or {}).items():
        c.drawString(50, y, f"{k}: {v}")
        y -= 14
        if y < 80:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 10)
    y -= 10
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y, "Feedback")
    y -= 16
    c.setFont("Helvetica", 9)
    for line in analysis.get("feedback") or []:
        for chunk in _wrap(line, 95):
            c.drawString(50, y, chunk)
            y -= 12
            if y < 60:
                c.showPage()
                y = height - 50
                c.setFont("Helvetica", 9)
    c.showPage()
    c.save()
    data = buf.getvalue()
    buf.close()
    return data


def _wrap(text: str, max_len: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for w in words:
        test = (cur + " " + w).strip()
        if len(test) <= max_len:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [""]
