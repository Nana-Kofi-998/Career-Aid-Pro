"""Upload wrapper for in-memory files (full file-like API for PyPDF2, python-docx, Pillow)."""

from __future__ import annotations

import io


class MemoryUpload(io.BytesIO):
    """BytesIO with filename/MIME metadata for CV extraction libraries."""

    def __init__(self, content: bytes, filename: str, content_type: str = "") -> None:
        super().__init__(content)
        self.name = filename
        self.type = content_type or ""
        if not self.type or self.type == "application/octet-stream":
            from career_aid_pro.cv_analysis import _guess_mime

            guessed = _guess_mime(filename)
            if guessed:
                self.type = guessed

    def seek(self, pos: int, whence: int = io.SEEK_SET) -> int:
        return super().seek(pos, whence)

    def tell(self) -> int:
        return super().tell()

    def readable(self) -> bool:
        return True

    def seekable(self) -> bool:
        return True
