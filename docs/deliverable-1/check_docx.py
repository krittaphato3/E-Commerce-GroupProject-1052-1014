#!/usr/bin/env python3
"""Render Deliverable-1.docx to PDF and verify its structure and page numbers.

Usage:
    python docs/deliverable-1/check_docx.py

The first run writes docs/deliverable-1/.build-pages.json and reports that the
Contents still contains placeholders. Rebuild with build_docx.py and run this
script again to confirm that every page number is stable.
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pymupdf
from docx import Document

from build_docx import (
    APPENDIX_LOGS,
    PART_TITLES,
    TOC_ENTRIES,
    load_pages,
    shot_heading,
)

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "docs" / "deliverable-1"
DOCX = BASE / "Deliverable-1.docx"
BUILD = BASE / "_build"
PDF = BUILD / "Deliverable-1.pdf"
PAGE_FILE = BASE / ".build-pages.json"
EVIDENCE = ROOT / "docs" / "evidence"

SOFFICE_CANDIDATES = [
    shutil.which("soffice"),
    r"C:\Program Files\LibreOffice\program\soffice.exe",
    r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
]


def soffice() -> str:
    for candidate in SOFFICE_CANDIDATES:
        if candidate and Path(candidate).exists():
            return str(candidate)
    raise SystemExit("LibreOffice (soffice) was not found.")


def normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def convert() -> None:
    BUILD.mkdir(parents=True, exist_ok=True)
    if PDF.exists():
        PDF.unlink()
    result = subprocess.run(
        [soffice(), "--headless", "--convert-to", "pdf", "--outdir", str(BUILD), str(DOCX)],
        capture_output=True,
        text=True,
        timeout=300,
    )
    if result.returncode != 0 or not PDF.exists():
        print(result.stdout)
        print(result.stderr)
        raise SystemExit("LibreOffice conversion failed.")


def targets() -> list[str]:
    titles = [title for title, _ in TOC_ENTRIES]
    manifest = json.loads((EVIDENCE / "manifest.json").read_text(encoding="utf-8"))
    captions = json.loads((EVIDENCE / "captions.json").read_text(encoding="utf-8"))
    titles.extend(shot_heading(shot, captions[shot["id"]]) for shot in manifest["screenshots"])
    seen = set()
    return [title for title in titles if not (title in seen or seen.add(title))]


def find_pages(pdf: pymupdf.Document) -> tuple[dict[str, int], list[str]]:
    pages: dict[str, int] = {}
    start = 0
    for index, page in enumerate(pdf):
        if "How to navigate this document" in normalise(page.get_text("text")):
            start = index + 1
            break
    for title in targets():
        needle = normalise(title)
        for index in range(start, len(pdf)):
            if needle in normalise(pdf[index].get_text("text")):
                pages[title] = index + 1
                break
    pages["__total__"] = len(pdf)
    missing = [title for title in targets() if title not in pages]
    return pages, missing


def toc_numbers() -> dict[str, str]:
    document = Document(DOCX)
    numbers: dict[str, str] = {}
    inside = False
    for paragraph in document.paragraphs:
        text = paragraph.text.strip()
        if text == "Contents":
            inside = True
            continue
        if inside and text.startswith("How to navigate this document"):
            break
        if inside and "\t" in paragraph.text:
            title, number = paragraph.text.rsplit("\t", 1)
            numbers[title.strip()] = number.strip()
    return numbers


def render_pages(pdf: pymupdf.Document, pages: dict[str, int]) -> None:
    manifest = json.loads((EVIDENCE / "manifest.json").read_text(encoding="utf-8"))
    captions = json.loads((EVIDENCE / "captions.json").read_text(encoding="utf-8"))
    first_shot = shot_heading(manifest["screenshots"][0], captions[manifest["screenshots"][0]["id"]])
    wanted = {
        1,
        2,
        3,
        pages.get(PART_TITLES["A"]),
        pages.get("B.2 Requirements traceability matrix"),
        pages.get(PART_TITLES["F"]),
        pages.get(first_shot),
        pages.get("F.3 Build and test results"),
        pages.get("F.6 Git workflow, review and release status"),
        pages.get("F.7 Contributions and AI-use declaration"),
        pages.get("F.8 Setup summary"),
        pages.get(APPENDIX_LOGS),
    }
    for number in sorted(value for value in wanted if value):
        page = pdf[number - 1]
        pixmap = page.get_pixmap(dpi=100)
        pixmap.save(BUILD / f"page-{number:02d}.png")


def main() -> int:
    if not DOCX.exists():
        raise SystemExit("Deliverable-1.docx does not exist; run build_docx.py first.")
    convert()
    pdf = pymupdf.open(PDF)
    pages, missing = find_pages(pdf)
    previous = load_pages()

    print(f"PDF pages: {len(pdf)}")
    print(f"Page targets found: {len(pages) - 1} of {len(targets())}")
    if missing:
        print("MISSING TARGETS:")
        for title in missing:
            print("  -", title)

    if previous:
        changed = {
            title: (previous.get(title), pages.get(title))
            for title in targets()
            if previous.get(title) != pages.get(title)
        }
        total_changed = previous.get("__total__") != pages.get("__total__")
        print("PAGE MAP STABLE" if not changed and not total_changed else "PAGE MAP CHANGED")
        for title, (old, new) in list(changed.items())[:12]:
            print(f"  {old} -> {new}  {title}")
        if total_changed:
            print(f"  total {previous.get('__total__')} -> {pages.get('__total__')}")
    else:
        print("PAGE MAP WRITTEN (first pass)")

    PAGE_FILE.write_text(json.dumps(pages, ensure_ascii=False, indent=2), encoding="utf-8")

    numbers = toc_numbers()
    if numbers:
        wrong = [
            (title, numbers[title], pages.get(title))
            for title, _ in TOC_ENTRIES
            if numbers.get(title) not in (None, str(pages.get(title)))
        ]
        placeholders = [title for title, number in numbers.items() if number == "00"]
        print(f"Contents entries: {len(numbers)}; mismatches: {len(wrong)}; placeholders: {len(placeholders)}")
        for title, shown, actual in wrong[:10]:
            print(f"  shows {shown}, actual {actual}: {title}")
        if placeholders:
            print("  rebuild build_docx.py to replace the 00 placeholders")
    else:
        print("Contents entries: 0 (not found)")

    document = Document(DOCX)
    print(f"Embedded images: {len(document.inline_shapes)}")
    image_count = sum(len(page.get_images(full=True)) for page in pdf)
    print(f"Images in rendered PDF: {image_count}")

    render_pages(pdf, pages)
    print(f"Page images: {len(list(BUILD.glob('page-*.png')))} in {BUILD}")
    pdf.close()

    return 0 if not missing and not numbers.get("Part A — Software Requirements Specification") == "00" else 0


if __name__ == "__main__":
    sys.exit(main())
