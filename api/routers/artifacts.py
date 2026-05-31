"""Chat file generation routes."""

from __future__ import annotations

from io import BytesIO
import hashlib
import re
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from api.deps import get_current_user
from api.routers.document import generate_pdf_doc, generate_word_doc

router = APIRouter(prefix="/artifacts", tags=["artifacts"])


class ArtifactTextRequest(BaseModel):
    text: str = Field(min_length=1, max_length=100000)
    title: str = Field(default="Career Aid Chat Response", max_length=120)


class ArtifactImageRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=4000)
    title: str = Field(default="Generated Chat Image", max_length=120)


def _filename(value: str, extension: str) -> str:
    safe = "".join(ch.lower() if ch.isalnum() else "-" for ch in value).strip("-")
    safe = "-".join(part for part in safe.split("-") if part)[:48] or "career-aid-file"
    return f"{safe}.{extension}"


def _clean_markdown(value: str) -> str:
    value = re.sub(r"\*\*(.*?)\*\*", r"\1", value)
    value = re.sub(r"`([^`]+)`", r"\1", value)
    value = re.sub(r"^\s*[*-]\s+", "", value, flags=re.MULTILINE)
    return re.sub(r"\s+", " ", value).strip()


def _extract_labeled_value(prompt: str, label: str) -> str:
    match = re.search(rf"\*\*{label}:\*\*\s*(.+)", prompt, flags=re.IGNORECASE)
    if not match:
        match = re.search(rf"{label}:\s*(.+)", prompt, flags=re.IGNORECASE)
    if not match:
        return ""
    value = match.group(1).strip()
    value = re.split(r"\s+\*\*[A-Z][^*]{1,40}:\*\*|\n\s*\d+\.", value, maxsplit=1)[0]
    return _clean_markdown(value)


def _extract_milestones(prompt: str) -> list[tuple[str, str]]:
    milestones: list[tuple[str, str]] = []
    heading = ""
    body_lines: list[str] = []

    def flush() -> None:
        nonlocal heading, body_lines
        if heading:
            milestones.append((heading, _clean_markdown(" ".join(body_lines))))
        heading = ""
        body_lines = []

    for raw_line in prompt.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        numbered = re.match(r"^\d+\.\s*(?:\*\*)?(.+?)(?:\*\*)?\s*$", line)
        if numbered:
            flush()
            text = _clean_markdown(numbered.group(1))
            if ":" in text:
                heading, first_body = text.split(":", 1)
                heading = heading.strip()
                if first_body.strip():
                    body_lines.append(first_body.strip())
            else:
                heading = text.strip()
            continue

        if heading and re.match(r"^[*-]\s+", line):
            body_lines.append(re.sub(r"^[*-]\s+", "", line))
        elif heading and not re.match(r"^\*\*[A-Za-z ]+:\*\*", line):
            body_lines.append(line)

    flush()

    unique: list[tuple[str, str]] = []
    seen: set[str] = set()
    for item_heading, item_body in milestones:
        key = item_heading.lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append((item_heading[:42], item_body[:210]))
    return unique[:5]


def _text_size(draw: Any, text: str, font: Any) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0], box[3] - box[1]


def _wrap_to_width(draw: Any, text: str, font: Any, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if _text_size(draw, candidate, font)[0] <= max_width:
            current = candidate
            continue
        if current:
            lines.append(current)
        current = word
    if current:
        lines.append(current)
    return lines


def _draw_wrapped_text(
    draw: Any,
    text: str,
    xy: tuple[int, int],
    font: Any,
    fill: tuple[int, int, int],
    max_width: int,
    max_lines: int,
    line_height: int,
) -> int:
    x, y = xy
    lines = _wrap_to_width(draw, text, font, max_width)
    visible = lines[:max_lines]
    if len(lines) > max_lines and visible:
        while visible[-1] and _text_size(draw, f"{visible[-1]}...", font)[0] > max_width:
            visible[-1] = visible[-1][:-1].rstrip()
        visible[-1] = visible[-1].rstrip(".,;: ") + "..."
    for line in visible:
        draw.text((x, y), line, font=font, fill=fill)
        y += line_height
    return y


def _generate_prompt_image(prompt: str, title: str) -> bytes:
    """Create a clean local PNG from a chat image brief."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Image generation requires Pillow: {exc!s}")

    width, height = 1280, 960
    extracted_title = _extract_labeled_value(prompt, "Title")
    subtitle = _extract_labeled_value(prompt, "Subtitle")
    image_brief = _extract_labeled_value(prompt, "Image") or _clean_markdown(prompt)
    display_title = extracted_title or title
    milestones = _extract_milestones(prompt)

    digest = hashlib.sha256(prompt.encode("utf-8")).digest()
    color_a = (12 + digest[0] % 36, 78 + digest[1] % 64, 106 + digest[2] % 64)
    color_b = (32 + digest[3] % 76, 124 + digest[4] % 72, 126 + digest[5] % 72)

    img = Image.new("RGB", (width, height), color_a)
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / max(height - 1, 1)
        fill = tuple(int(color_a[i] * (1 - t) + color_b[i] * t) for i in range(3))
        draw.line([(0, y), (width, y)], fill=fill)

    for i in range(8):
        x = int((digest[i] / 255) * width)
        y = int((digest[i + 8] / 255) * height)
        radius = 90 + digest[i + 16] % 160
        layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        layer_draw = ImageDraw.Draw(layer)
        layer_draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(255, 255, 255, 30))
        img = Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")

    draw = ImageDraw.Draw(img)
    try:
        title_font = ImageFont.truetype("arial.ttf", 44)
        subtitle_font = ImageFont.truetype("arial.ttf", 24)
        heading_font = ImageFont.truetype("arial.ttf", 28)
        body_font = ImageFont.truetype("arial.ttf", 21)
        small_font = ImageFont.truetype("arial.ttf", 20)
    except Exception:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        heading_font = ImageFont.load_default()
        body_font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    draw.rounded_rectangle((64, 54, width - 64, height - 54), radius=34, fill=(248, 252, 250), outline=(255, 255, 255), width=2)
    draw.rounded_rectangle((64, 54, width - 64, 214), radius=34, fill=(8, 44, 58))
    draw.rectangle((64, 132, width - 64, 214), fill=(8, 44, 58))

    title_y = _draw_wrapped_text(draw, display_title, (108, 86), title_font, (255, 255, 255), width - 216, 2, 50)
    if subtitle:
        _draw_wrapped_text(draw, subtitle, (112, min(title_y + 8, 174)), subtitle_font, (177, 231, 216), width - 224, 1, 30)

    if milestones:
        start_y = 282
        gap = 20
        card_height = min(128, int((height - 370) / max(len(milestones), 1)))
        line_x = 150
        line_end = start_y + len(milestones) * (card_height + gap) - gap - 42
        draw.line((line_x, start_y + 42, line_x, line_end), fill=(14, 116, 144), width=8)
        for index, (heading, body) in enumerate(milestones):
            y = start_y + index * (card_height + gap)
            circle_fill = (6, 148, 162) if index % 2 == 0 else (92, 80, 210)
            draw.ellipse((line_x - 30, y + 24, line_x + 30, y + 84), fill=circle_fill, outline=(255, 255, 255), width=4)
            number = str(index + 1)
            num_w, num_h = _text_size(draw, number, heading_font)
            draw.text((line_x - num_w / 2, y + 54 - num_h / 2), number, font=heading_font, fill=(255, 255, 255))

            card_left = 220
            card_right = width - 108
            draw.rounded_rectangle((card_left, y, card_right, y + card_height), radius=20, fill=(235, 250, 247), outline=(171, 220, 213), width=2)
            _draw_wrapped_text(draw, heading, (card_left + 28, y + 18), heading_font, (8, 44, 58), card_right - card_left - 56, 1, 34)
            _draw_wrapped_text(draw, body or image_brief, (card_left + 28, y + 58), body_font, (35, 63, 73), card_right - card_left - 56, 2, 28)
    else:
        draw.rounded_rectangle((120, 280, width - 120, 650), radius=26, fill=(235, 250, 247), outline=(171, 220, 213), width=2)
        draw.text((160, 326), "Visual Brief", font=heading_font, fill=(8, 44, 58))
        _draw_wrapped_text(draw, image_brief, (160, 382), body_font, (35, 63, 73), width - 320, 7, 32)

    draw.text((96, height - 42), "Career Aid", font=small_font, fill=(230, 252, 246))

    output = BytesIO()
    img.save(output, format="PNG", optimize=True)
    output.seek(0)
    return output.read()


@router.post("/word")
def generate_word_file(payload: ArtifactTextRequest, _user: dict = Depends(get_current_user)):
    doc_bytes = generate_word_doc(f"{payload.title}\n\n{payload.text}")
    return StreamingResponse(
        BytesIO(doc_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{_filename(payload.title, "docx")}"'},
    )


@router.post("/pdf")
def generate_pdf_file(payload: ArtifactTextRequest, _user: dict = Depends(get_current_user)):
    pdf_bytes = generate_pdf_doc(f"{payload.title}\n\n{payload.text}")
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{_filename(payload.title, "pdf")}"'},
    )


@router.post("/image")
def generate_image_file(payload: ArtifactImageRequest, _user: dict = Depends(get_current_user)):
    image_bytes = _generate_prompt_image(payload.prompt, payload.title)
    return StreamingResponse(
        BytesIO(image_bytes),
        media_type="image/png",
        headers={"Content-Disposition": f'attachment; filename="{_filename(payload.title, "png")}"'},
    )
