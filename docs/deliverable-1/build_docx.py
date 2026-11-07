#!/usr/bin/env python3
"""Assemble Deliverable 1 (Sprint 1) into a single Word document.

Run from anywhere inside the repository:

    python docs/deliverable-1/build_docx.py

Reads the Markdown sources in docs/ and the evidence artefacts in
docs/evidence/, then writes docs/deliverable-1/Deliverable-1.docx.
Requires Python 3.10+ and python-docx (``pip install python-docx``).
"""

from __future__ import annotations

import json
import re
import subprocess
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENT, WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.image.image import Image as DocxImage
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "docs" / "evidence"
OUTPUT = ROOT / "docs" / "deliverable-1" / "Deliverable-1.docx"

NAVY = RGBColor(0x1F, 0x38, 0x64)
BLUE = RGBColor(0x0D, 0x6E, 0xFD)
GREY = RGBColor(0x5A, 0x5A, 0x5A)
BODY_FONT = "Calibri"
MONO_FONT = "Consolas"


# --------------------------------------------------------------------------- #
# File-level study sources
# --------------------------------------------------------------------------- #
PARTS = [
    ("Part 1 — Software Requirements Specification", "docs/srs.md"),
    ("Part 2 — System-Level Software Design Specification", "docs/system-sds.md"),
    ("Part 3 — Three-Sprint Plan", "docs/sprints/plan.md"),
    ("Part 4 — Sprint 1 Feature Contracts", "docs/sprints/sprint-1/features.md"),
]
TRACEABILITY = ("Part 5 — Requirements Traceability Matrix", "docs/traceability.md")
APPENDIX_FEATURES = ("Appendix A — Feature Inventory", "docs/features.md")
APPENDIX_EXCERPTS = ("Appendix B — Test Excerpts", "docs/evidence/test-excerpts.md")


# --------------------------------------------------------------------------- #
# Small helpers
# --------------------------------------------------------------------------- #
def git_hash() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, text=True
        ).strip()
    except Exception:
        return "unknown"


def usable_cm(section) -> float:
    # Subtraction of Length objects yields plain EMU integers, so convert explicitly.
    length_emu = int(section.page_width) - int(section.left_margin) - int(section.right_margin)
    return length_emu / 360000.0


PPR_ORDER = [qn(tag) for tag in (
    "w:pStyle", "w:keepNext", "w:keepLines", "w:pageBreakBefore", "w:framePr",
    "w:widowControl", "w:numPr", "w:suppressLineNumbers", "w:pBdr", "w:shd",
    "w:tabs", "w:suppressAutoHyphens", "w:kinsoku", "w:wordWrap", "w:overflowPunct",
    "w:topLinePunct", "w:autoSpaceDE", "w:autoSpaceDN", "w:bidi", "w:adjustRightInd",
    "w:snapToGrid", "w:spacing", "w:ind", "w:contextualSpacing", "w:mirrorIndents",
    "w:suppressOverlap", "w:jc", "w:textDirection", "w:textAlignment",
    "w:textboxTightWrap", "w:outlineLvl", "w:divId", "w:cnfStyle", "w:rPr",
    "w:sectPr", "w:pPrChange",
)]
TCPR_ORDER = [qn(tag) for tag in (
    "w:cnfStyle", "w:tcW", "w:gridSpan", "w:hMerge", "w:vMerge", "w:tcBorders",
    "w:shd", "w:noWrap", "w:tcMar", "w:textDirection", "w:tcFitText", "w:vAlign",
    "w:hideMark", "w:headers", "w:cellIns", "w:cellDel", "w:cellMerge", "w:tcPrChange",
)]
TBLPR_ORDER = [qn(tag) for tag in (
    "w:tblStyle", "w:tblpPr", "w:tblOverlap", "w:bidiVisual", "w:tblStyleRowBandSize",
    "w:tblStyleColBandSize", "w:tblW", "w:jc", "w:tblCellSpacing", "w:tblInd",
    "w:tblBorders", "w:shd", "w:tblLayout", "w:tblCellMar", "w:tblLook",
    "w:tblCaption", "w:tblDescription",
)]
TRPR_ORDER = [qn(tag) for tag in (
    "w:cnfStyle", "w:divId", "w:gridBefore", "w:gridAfter", "w:wBefore", "w:wAfter",
    "w:cantSplit", "w:trHeight", "w:tblHeader", "w:tblCellSpacing", "w:jc",
    "w:hidden", "w:ins", "w:del", "w:trPrChange",
)]


def insert_in_order(parent, element, order: list[str]) -> None:
    """Insert element so the OOXML child order stays schema-valid for Word."""
    try:
        position = order.index(element.tag)
    except ValueError:
        parent.append(element)
        return
    for child in list(parent):
        if child.tag in order and order.index(child.tag) > position:
            child.addprevious(element)
            return
    parent.append(element)


def shade_cell(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    insert_in_order(tc_pr, shd, TCPR_ORDER)


def set_table_margins(table, top: int = 30, left: int = 70, bottom: int = 30, right: int = 70) -> None:
    tbl_pr = table._tbl.tblPr
    mar = OxmlElement("w:tblCellMar")
    for tag, value in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        el = OxmlElement(f"w:{tag}")
        el.set(qn("w:w"), str(value))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    insert_in_order(tbl_pr, mar, TBLPR_ORDER)


def repeat_header(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    header = OxmlElement("w:tblHeader")
    header.set(qn("w:val"), "true")
    insert_in_order(tr_pr, header, TRPR_ORDER)


def add_paragraph_shading(paragraph, fill: str) -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    insert_in_order(p_pr, shd, PPR_ORDER)


def add_left_border(paragraph, color: str = "BDBDBD") -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = OxmlElement("w:pBdr")
    left = OxmlElement("w:left")
    left.set(qn("w:val"), "single")
    left.set(qn("w:sz"), "12")
    left.set(qn("w:space"), "6")
    left.set(qn("w:color"), color)
    p_bdr.append(left)
    insert_in_order(p_pr, p_bdr, PPR_ORDER)


def add_bottom_rule(paragraph, color: str = "0D6EFD", size: str = "12") -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), size)
    bottom.set(qn("w:space"), "6")
    bottom.set(qn("w:color"), color)
    p_bdr.append(bottom)
    insert_in_order(p_pr, p_bdr, PPR_ORDER)


def add_field(paragraph, instruction: str, placeholder: str = "") -> None:
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = instruction
    sep = OxmlElement("w:fldChar")
    sep.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = placeholder
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    for element in (begin, instr, sep, text, end):
        run._r.append(element)


INLINE_RE = re.compile(r"(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))")
ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]")
CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]")


def sanitize(text: str) -> str:
    """Strip ANSI escapes and control bytes that Word XML cannot store."""
    return CONTROL_RE.sub("", ANSI_RE.sub("", text))


def unescape(text: str) -> str:
    return (
        text.replace("\\|", "|")
        .replace("\\*", "*")
        .replace("\\_", "_")
        .replace("\\`", "`")
        .replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
    )


def render_inline(paragraph, text: str, size: float | None = None, bold: bool = False, italic: bool = False):
    text = sanitize(unescape(text))

    def add_run(value: str, is_code: bool = False, is_bold: bool = False, is_italic: bool = False) -> None:
        run = paragraph.add_run(value)
        if is_code:
            run.font.name = MONO_FONT
        if size:
            run.font.size = Pt(max(size - 1.0, 5.5) if is_code else size)
        if bold or is_bold:
            run.bold = True
        if italic or is_italic:
            run.italic = True

    for token in INLINE_RE.split(text):
        if not token:
            continue
        if token.startswith("**") and token.endswith("**") and len(token) > 4:
            # Bold may wrap inline code, e.g. **Workflow (`POST /api/orders`).**
            for part in re.split(r"(`[^`]+`)", token[2:-2]):
                if not part:
                    continue
                if part.startswith("`") and part.endswith("`") and len(part) > 2:
                    add_run(part[1:-1], is_code=True, is_bold=True)
                else:
                    add_run(part, is_bold=True)
        elif token.startswith("`") and token.endswith("`") and len(token) > 2:
            add_run(token[1:-1], is_code=True)
        elif token.startswith("*") and token.endswith("*") and len(token) > 2:
            add_run(token[1:-1], is_italic=True)
        elif token.startswith("[") and "](" in token and token.endswith(")"):
            label, url = token[1:-1].split("](", 1)
            if label:
                render_inline(paragraph, label, size=size, bold=bold, italic=italic)
            tail = paragraph.add_run(f" ({url})")
            tail.font.size = Pt(7.5)
            tail.font.color.rgb = GREY
            if bold:
                tail.bold = True
        else:
            add_run(token)


def compute_widths(rows: list[list[str]], total_cm: float) -> list[float]:
    ncols = len(rows[0])
    maxlen = []
    for index in range(ncols):
        maxlen.append(max(len(row[index]) if index < len(row) else 0 for row in rows))
    weights = [max(value, 4) ** 0.55 for value in maxlen]
    total_weight = sum(weights)
    widths = [total_cm * weight / total_weight for weight in weights]
    minimum = 1.25
    widths = [max(width, minimum) for width in widths]
    scale = total_cm / sum(widths)
    return [width * scale for width in widths]


def split_row(line: str) -> list[str]:
    text = line.strip()
    if text.startswith("|"):
        text = text[1:]
    if text.endswith("|"):
        text = text[:-1]
    text = text.replace("\\|", "\u0000")
    return [cell.replace("\u0000", "|").strip() for cell in text.split("|")]


def is_separator(line: str) -> bool:
    cells = split_row(line)
    return bool(cells) and all(re.fullmatch(r":?-{2,}:?", cell) for cell in cells)


# --------------------------------------------------------------------------- #
# Markdown renderer
# --------------------------------------------------------------------------- #
class Renderer:
    def __init__(self, document: Document, width_cm: float):
        self.doc = document
        self.width_cm = width_cm

    # -- primitives -------------------------------------------------------- #
    def spacer(self, points: float = 4) -> None:
        paragraph = self.doc.add_paragraph()
        fmt = paragraph.paragraph_format
        fmt.space_before = Pt(0)
        fmt.space_after = Pt(0)
        fmt.line_spacing = 1.0
        paragraph.add_run("").font.size = Pt(points)

    def heading(self, text: str, level: int) -> None:
        paragraph = self.doc.add_paragraph(style=f"Heading {min(level, 5)}")
        render_inline(paragraph, text)

    def paragraph(self, text: str) -> None:
        paragraph = self.doc.add_paragraph()
        render_inline(paragraph, text)

    def list_item(self, text: str, level: int, ordered: bool, number: str | None) -> None:
        paragraph = self.doc.add_paragraph()
        fmt = paragraph.paragraph_format
        indent = Cm(0.55 + 0.55 * level)
        fmt.left_indent = indent
        fmt.first_line_indent = Cm(-0.45)
        fmt.space_after = Pt(2)
        fmt.tab_stops.add_tab_stop(indent)
        prefix = f"{number}." if ordered and number else "•"
        paragraph.add_run(prefix + "\t")
        render_inline(paragraph, text)

    def page_break(self) -> None:
        self.doc.add_page_break()

    def code_block(self, text: str, language: str = "") -> None:
        paragraph = self.doc.add_paragraph()
        fmt = paragraph.paragraph_format
        fmt.space_before = Pt(2)
        fmt.space_after = Pt(6)
        fmt.line_spacing = 1.0
        fmt.left_indent = Cm(0.2)
        add_paragraph_shading(paragraph, "F3F4F6")
        add_left_border(paragraph)
        run = paragraph.add_run(sanitize(text))
        run.font.name = MONO_FONT
        run.font.size = Pt(7.5)
        if language == "mermaid":
            caption = self.doc.add_paragraph()
            run_caption = caption.add_run(
                "Diagram source is stored as Mermaid text; paste it into mermaid.live to render it."
            )
            run_caption.italic = True
            run_caption.font.size = Pt(7.5)
            run_caption.font.color.rgb = GREY
            caption.paragraph_format.space_after = Pt(8)

    def log_block(self, text: str) -> None:
        lines = text.replace("\r\n", "\n").replace("\r", "").split("\n")
        chunk_size = 45
        for start in range(0, len(lines), chunk_size):
            chunk = lines[start : start + chunk_size]
            if not chunk:
                continue
            paragraph = self.doc.add_paragraph()
            fmt = paragraph.paragraph_format
            fmt.space_before = Pt(0)
            fmt.space_after = Pt(0)
            fmt.line_spacing = 1.0
            fmt.left_indent = Cm(0.15)
            add_paragraph_shading(paragraph, "F7F7F7")
            run = paragraph.add_run(sanitize("\n".join(chunk)))
            run.font.name = MONO_FONT
            run.font.size = Pt(6.8)

    def table(self, rows: list[list[str]]) -> None:
        if not rows:
            return
        ncols = max(len(row) for row in rows)
        rows = [row + [""] * (ncols - len(row)) for row in rows]
        table = self.doc.add_table(rows=len(rows), cols=ncols)
        table.style = "Table Grid"
        table.autofit = False
        table.allow_autofit = False
        widths = compute_widths(rows, self.width_cm)
        if ncols >= 7:
            font_size = 7.2
        elif ncols >= 5:
            font_size = 8.0
        else:
            font_size = 8.8
        for c_index, width in enumerate(widths):
            table.columns[c_index].width = Cm(width)
        for r_index, row in enumerate(rows):
            for c_index, value in enumerate(row):
                cell = table.cell(r_index, c_index)
                cell.width = Cm(widths[c_index])
                paragraph = cell.paragraphs[0]
                fmt = paragraph.paragraph_format
                fmt.space_before = Pt(0)
                fmt.space_after = Pt(0)
                fmt.line_spacing = 1.0
                render_inline(paragraph, value, size=font_size, bold=(r_index == 0))
                if r_index == 0:
                    shade_cell(cell, "D9E2F3")
                elif r_index % 2 == 0:
                    shade_cell(cell, "F5F7FA")
        repeat_header(table.rows[0])
        set_table_margins(table)
        self.spacer(3)

    def picture(self, path: Path, max_height_cm: float = 9.6) -> None:
        image = DocxImage.from_file(str(path))
        aspect = image.px_height / image.px_width if image.px_width else 0.5625
        width = self.width_cm - 1.6
        height = width * aspect
        if height > max_height_cm:
            height = max_height_cm
            width = height / aspect
        self.doc.add_picture(str(path), width=Cm(width))
        self.doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER

    # -- markdown ---------------------------------------------------------- #
    def render(self, text: str) -> None:
        lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
        index = 0
        kind = None
        buffer: list[str] = []
        list_meta = None

        def flush() -> None:
            nonlocal kind, buffer, list_meta
            if buffer:
                body = " ".join(part.strip() for part in buffer).strip()
                if kind == "list" and list_meta:
                    ordered, number, level = list_meta
                    self.list_item(body, level, ordered, number)
                elif body:
                    self.paragraph(body)
            kind = None
            buffer = []
            list_meta = None

        while index < len(lines):
            raw = lines[index].rstrip()
            stripped = raw.strip()

            if not stripped:
                flush()
                index += 1
                continue

            # fenced code
            if stripped.startswith("```"):
                flush()
                language = stripped[3:].strip()
                index += 1
                block: list[str] = []
                while index < len(lines) and not lines[index].strip().startswith("```"):
                    block.append(lines[index].rstrip())
                    index += 1
                index += 1
                self.code_block("\n".join(block), language)
                continue

            # table
            if stripped.startswith("|") and index + 1 < len(lines) and is_separator(lines[index + 1]):
                flush()
                rows: list[list[str]] = []
                while index < len(lines) and lines[index].strip().startswith("|"):
                    rows.append(split_row(lines[index]))
                    index += 1
                if len(rows) >= 2:
                    rows = [rows[0]] + rows[2:]
                self.table(rows)
                continue

            # horizontal rule: start a new page only when it precedes a section
            if re.fullmatch(r"-{3,}", stripped):
                flush()
                look = index + 1
                while look < len(lines) and not lines[look].strip():
                    look += 1
                if look < len(lines) and lines[look].startswith("## "):
                    self.page_break()
                index += 1
                continue

            # headings
            match = re.match(r"^(#{1,6})\s+(.*)$", raw)
            if match:
                flush()
                level = len(match.group(1))
                if level > 1:
                    self.heading(match.group(2).strip(), level)
                index += 1
                continue

            # list items
            bullet = re.match(r"^(\s*)([-*+])\s+(.*)$", raw)
            ordered = re.match(r"^(\s*)(\d+)\.\s+(.*)$", raw)
            if bullet or ordered:
                flush()
                if bullet:
                    indent, body = bullet.group(1), bullet.group(3)
                    list_meta = (False, None, len(indent) // 2)
                else:
                    indent, number, body = ordered.group(1), ordered.group(2), ordered.group(3)
                    list_meta = (True, number, len(indent) // 2)
                kind = "list"
                buffer = [body]
                index += 1
                continue

            # plain text (or a continuation line)
            if kind is None:
                kind = "para"
            buffer.append(stripped)
            index += 1

        flush()


# --------------------------------------------------------------------------- #
# Document assembly
# --------------------------------------------------------------------------- #
def configure_styles(document: Document) -> None:
    normal = document.styles["Normal"]
    normal.font.name = BODY_FONT
    normal.font.size = Pt(10)
    normal.font.color.rgb = RGBColor(0x1A, 0x1A, 0x1A)
    normal.paragraph_format.space_after = Pt(5)
    normal.paragraph_format.line_spacing = 1.12

    headings = {
        "Heading 1": (19, NAVY, 0, 10),
        "Heading 2": (13.5, RGBColor(0x2E, 0x53, 0x95), 12, 5),
        "Heading 3": (11.5, NAVY, 10, 4),
        "Heading 4": (10.5, RGBColor(0x40, 0x40, 0x40), 8, 3),
    }
    for name, (size, colour, before, after) in headings.items():
        style = document.styles[name]
        style.font.name = BODY_FONT
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = colour
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.keep_with_next = True


def add_header_and_footer(section, commit: str) -> None:
    header = section.header.paragraphs[0]
    header.text = ""
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = header.add_run("Omazon — Deliverable 1 (Sprint 1)")
    run.font.size = Pt(8)
    run.font.color.rgb = GREY

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = footer.add_run("Page ")
    run.font.size = Pt(8)
    run.font.color.rgb = GREY
    add_field(footer, " PAGE ", "1")
    run = footer.add_run(" of ")
    run.font.size = Pt(8)
    run.font.color.rgb = GREY
    add_field(footer, " NUMPAGES ", "1")


def add_cover(document: Document, renderer: Renderer, commit: str) -> None:
    for _ in range(3):
        document.add_paragraph()

    title = document.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("OMAZON")
    run.bold = True
    run.font.size = Pt(46)
    run.font.color.rgb = BLUE
    title.paragraph_format.space_after = Pt(2)

    subtitle = document.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = subtitle.add_run("Online Food Ordering Platform for a University Canteen")
    run.font.size = Pt(13)
    run.font.color.rgb = GREY
    subtitle.paragraph_format.space_after = Pt(18)

    rule = document.add_paragraph()
    add_bottom_rule(rule, "0D6EFD", "18")
    rule.paragraph_format.space_after = Pt(22)

    heading = document.add_paragraph()
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = heading.add_run("Deliverable 1 — Sprint 1 Engineering Documentation")
    run.bold = True
    run.font.size = Pt(20)
    run.font.color.rgb = NAVY
    heading.paragraph_format.space_after = Pt(10)

    meta = document.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = meta.add_run("Software Engineering · Year 3, Trimester 1 · Group 1052-1014")
    run.font.size = Pt(11)
    meta.paragraph_format.space_after = Pt(2)

    repo = document.add_paragraph()
    repo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = repo.add_run("github.com/krittaphato3/E-Commerce-GroupProject-1052-1014")
    run.font.size = Pt(9.5)
    run.font.color.rgb = GREY
    repo.paragraph_format.space_after = Pt(2)

    stamp = document.add_paragraph()
    stamp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = stamp.add_run(f"sprint-1-staging · assembled {date.today().isoformat()} · source {commit}")
    run.font.size = Pt(9.5)
    run.font.color.rgb = GREY
    stamp.paragraph_format.space_after = Pt(30)

    document.add_paragraph("Document control").runs[0].bold = True
    renderer.table(
        [
            ["Field", "Value"],
            ["Document", "Omazon — Deliverable 1: Sprint 1 Engineering Documentation"],
            ["Version", "1.0 (assembled from the version-controlled Markdown sources)"],
            ["Date", date.today().strftime("%d %B %Y")],
            ["Repository", "github.com/krittaphato3/E-Commerce-GroupProject-1052-1014"],
            ["Branches", f"sprint-1-staging; evidence and documentation branch at {commit}"],
            ["Format", "DOCX. To obtain a PDF: File → Save As → PDF."],
            ["Prepared by", "Group 1052-1014 — napatsun (Sun) and krittaphato3"],
        ]
    )
    note = document.add_paragraph()
    run = note.add_run(
        "Generated by docs/deliverable-1/build_docx.py from the Markdown sources and evidence files "
        "listed in each part. Edit those sources, not this file."
    )
    run.italic = True
    run.font.size = Pt(8.5)
    run.font.color.rgb = GREY


def add_contents(document: Document) -> None:
    paragraph = document.add_paragraph()
    run = paragraph.add_run("Contents")
    run.bold = True
    run.font.size = Pt(20)
    run.font.color.rgb = NAVY
    paragraph.paragraph_format.space_after = Pt(4)

    hint = document.add_paragraph()
    run = hint.add_run(
        "The list below is built from the document headings. If it appears empty, right-click it and "
        "choose Update Field, or press Ctrl+A then F9."
    )
    run.italic = True
    run.font.size = Pt(8.5)
    run.font.color.rgb = GREY
    hint.paragraph_format.space_after = Pt(12)

    toc = document.add_paragraph()
    add_field(toc, 'TOC \\o "1-2" \\h \\z \\u', "Contents will appear here after Word updates the field.")


def add_part(document: Document, renderer: Renderer, title: str, relative_path: str) -> None:
    document.add_paragraph(style="Heading 1").add_run(title)
    source = document.add_paragraph()
    run = source.add_run(f"Source: {relative_path}")
    run.italic = True
    run.font.size = Pt(8.5)
    run.font.color.rgb = GREY
    source.paragraph_format.space_after = Pt(8)
    renderer.render((ROOT / relative_path).read_text(encoding="utf-8"))


def add_evidence_part(document: Document, renderer: Renderer, manifest: dict) -> None:
    document.add_paragraph(style="Heading 1").add_run("Part 6 — Sprint 1 Evidence Pack")
    source = document.add_paragraph()
    run = source.add_run(
        "Sources: docs/evidence/ (screenshots and terminal logs), docs/evidence/manifest.json, "
        "docs/evidence/github-workflow.md and docs/traceability.md"
    )
    run.italic = True
    run.font.size = Pt(8.5)
    run.font.color.rgb = GREY
    source.paragraph_format.space_after = Pt(8)

    intro = (
        "This part records how the Sprint 1 requirements were shown to work. Every screenshot was "
        "taken from the running application against the seeded database; every terminal log names the "
        "commit it was produced from. Nothing here is a description of intended behaviour: the "
        "traceability matrix in Part 5 links each requirement to the test that proves it, and the raw "
        "output behind the green runs is reproduced in Appendix C."
    )
    renderer.paragraph(intro)

    total_tests = 46
    log_files = sorted(EVIDENCE.glob("*.txt"))
    embedded_logs = [log for log in manifest["logs"] if log.get("embed")]
    renderer.heading("6.1 Verification summary", 2)
    renderer.table(
        [
            ["Item", "Value"],
            ["Sprint 1 acceptance criteria", f"{total_tests} (AC-01 to AC-46), one test per AC"],
            ["Tests recorded in the traceability matrix", f"{total_tests} (TEST-01 to TEST-46)"],
            ["Latest full unit and integration run", "c8fd8fc — backend 84 passed (15 files), frontend 36 passed (8 files)"],
            ["Latest full end-to-end run", "c8fd8fc — 6 Playwright journeys passed"],
            ["Screenshots in this pack", f"{len(manifest['screenshots'])} covering the required flows, rejection states and access control"],
            ["Terminal logs in the pack", f"{len(log_files)} files in docs/evidence; {len(embedded_logs)} reproduced in Appendix C"],
            ["Code coverage / load testing", "Not in Sprint 1 scope (NFR-10 is Sprint 2, NFR-05 is Sprint 3)"],
        ]
    )

    renderer.heading("6.2 Screenshot evidence index", 2)
    renderer.paragraph(
        "The seven flows required for the demo, followed by the rejection and access-control states "
        "that the contracts also require. Each entry maps to the acceptance criteria it demonstrates."
    )
    renderer.table(
        [["ID", "Flow", "AC", "File"]]
        + [[shot["id"], shot["flow"], shot["ac"], shot["file"]] for shot in manifest["screenshots"]]
    )

    renderer.heading("6.3 Screenshot gallery", 2)
    renderer.paragraph(
        "Captions describe what is visible in each frame, including the limits of the capture."
    )
    for shot in manifest["screenshots"]:
        caption = document.add_paragraph()
        caption.paragraph_format.space_before = Pt(10)
        caption.paragraph_format.keep_with_next = True
        run = caption.add_run(f"{shot['id']} · {shot['flow']} ({shot['ac']})")
        run.bold = True
        run.font.size = Pt(9)
        renderer.picture(EVIDENCE / shot["file"])
        body = document.add_paragraph()
        body.paragraph_format.space_after = Pt(2)
        render_inline(body, shot["caption"], size=8.5, italic=True)
        note = document.add_paragraph()
        note.paragraph_format.space_after = Pt(8)
        render_inline(note, f"Note: {shot['note']}", size=8)

    renderer.heading("6.4 Test execution summary", 2)
    renderer.paragraph(
        "Each run was executed from the repository root; logs are stored under docs/evidence/. The "
        "backend suites run against PostgreSQL (campusbites_test) with no mocked SQL."
    )
    renderer.table(
        [
            ["Feature", "Run", "Commit", "Command", "Result"],
            ["F-01", "Unit + integration", "f222daa", "npm test", "backend 30 passed; frontend 1 passed"],
            ["F-01", "End-to-end", "097da41", "npm run e2e", "1 journey passed"],
            ["F-02 / F-03", "Unit + integration", "0f3c649", "npm test", "backend 69 passed; frontend 22 passed"],
            ["F-02 / F-03", "End-to-end", "0f3c649", "npm run e2e", "3 journeys passed"],
            ["F-04", "Unit + integration", "37cf31f", "npm test", "backend 82 passed; frontend 36 passed"],
            ["F-04", "End-to-end", "37cf31f", "npm run e2e", "5 journeys passed"],
            ["R-01", "Unit + integration", "c8fd8fc", "npm test", "backend 84 passed; frontend 36 passed"],
            ["R-01", "End-to-end", "c8fd8fc", "npm run e2e", "6 journeys passed"],
        ]
    )

    renderer.heading("6.5 Red then green (TDD) evidence", 2)
    renderer.paragraph(
        "For every feature the failing tests were written first and their output kept. The commit IDs "
        "below match the file names in docs/evidence/."
    )
    renderer.table(
        [
            ["Feature", "Red — failing first", "Green — passing after implementation"],
            ["F-01", "8398fe2 (F-01-red-full-8398fe2.txt)", "f222daa (F-01-green-full-f222daa.txt), E2E at 097da41"],
            ["F-02 / F-03", "140c030 (F-02-F-03-red-140c030.txt)", "0f3c649 (tests and E2E)"],
            ["F-04", "c04ca45, a614473 (F-04-red-c04ca45.txt)", "6d1d2f7, 984ddb9, c680623, 8fe7793, 162b413, 37cf31f"],
            ["R-01", "d7792c8 (R-01-red-TEST-43-d7792c8.txt)", "8f42cbd (TEST-43), c8fd8fc (full suite and E2E)"],
        ]
    )

    renderer.heading("6.6 Workflow evidence", 2)
    renderer.paragraph(
        "Feature branches were cut from sprint-1-staging and merged only after a review by the other "
        "member. No author approved their own pull request. Full detail: docs/evidence/github-workflow.md."
    )
    renderer.table(
        [
            ["PR", "Scope", "Author", "Reviewer", "Merged by", "Date"],
            ["#8", "Specification baseline", "napatsun", "krittaphato3 (approved)", "krittaphato3", "2026-11-05"],
            ["#9", "R-03 scaffold, schema, seed", "krittaphato3", "napatsun (changes, then approved)", "napatsun", "2026-11-06"],
            ["#10", "F-01 authentication", "napatsun", "krittaphato3 (approved)", "krittaphato3", "2026-11-06"],
            ["#11", "F-02 menu, F-03 orders", "krittaphato3", "napatsun (approved)", "napatsun", "2026-11-07"],
            ["#12", "F-04 operator acceptance", "napatsun", "krittaphato3 (approved)", "krittaphato3", "2026-11-07"],
            ["#13", "R-01 access control, E2E", "napatsun", "krittaphato3 (approved)", "krittaphato3", "2026-11-07"],
        ]
    )
    renderer.paragraph(
        "Contribution split: napatsun implemented F-01, F-04, R-01 and the specification baseline and "
        "reviewed PR #9 and PR #11; krittaphato3 implemented R-03, F-02 and F-03 and reviewed PR #8, "
        "#10, #12 and #13. Both members therefore authored and reviewed at least two slices, as the "
        "sprint contract requires."
    )

    renderer.heading("6.7 Known gaps and outstanding items", 2)
    renderer.paragraph(
        "Disclosed rather than hidden, as the Definition of Done requires. None of these invalidates a "
        "passing Sprint 1 test; each is allocated work or a submission step."
    )
    for gap in manifest["gaps"]:
        renderer.list_item(gap, 0, False, None)

    renderer.paragraph(
        "Two traceability rows remain INCOMPLETE by design: NFR-09 is verified for the Sprint 1 screens "
        "but its final usability pass belongs to Sprint 3, and BR-13 is fully verified at the database "
        "level only until the Sprint 2 catalog API adds its own validation."
    )


def add_log_appendix(document: Document, renderer: Renderer, manifest: dict) -> None:
    document.add_paragraph(style="Heading 1").add_run("Appendix C — Test Execution Logs")
    source = document.add_paragraph()
    run = source.add_run(
        "Verbatim terminal output. Each block names the feature, the state (red or green), the tested "
        "commit and the command that produced it. Red logs are indexed in docs/evidence/README.md and "
        "kept out of this appendix to avoid duplicating hundreds of lines of expected failures."
    )
    run.italic = True
    run.font.size = Pt(8.5)
    run.font.color.rgb = GREY
    source.paragraph_format.space_after = Pt(12)

    for log in manifest["logs"]:
        if not log.get("embed"):
            continue
        document.add_page_break()
        document.add_paragraph(style="Heading 2").add_run(
            f"{log['id']} — {log['feature']} · {log['state']} · {log['commit']}"
        )
        meta = document.add_paragraph()
        render_inline(
            meta,
            f"Command: `{log['command']}` · Result: {log['summary']} · File: `{log['file']}`",
            size=8.5,
        )
        meta.paragraph_format.space_after = Pt(6)
        path = EVIDENCE / log["file"]
        if path.exists():
            renderer.log_block(path.read_text(encoding="utf-8", errors="replace"))
        else:
            renderer.paragraph(f"Missing evidence file: {log['file']}")


def build() -> Path:
    commit = git_hash()
    manifest = json.loads((EVIDENCE / "manifest.json").read_text(encoding="utf-8"))

    document = Document()
    configure_styles(document)
    document.core_properties.title = "Omazon — Deliverable 1 (Sprint 1)"
    document.core_properties.subject = "Sprint 1 engineering documentation and evidence"
    document.core_properties.author = "Group 1052-1014"
    document.core_properties.comments = "Generated from docs/ Markdown sources by build_docx.py"

    settings = document.settings.element
    update = OxmlElement("w:updateFields")
    update.set(qn("w:val"), "true")
    compat = settings.find(qn("w:compat"))
    if compat is not None:
        compat.addprevious(update)
    else:
        settings.append(update)

    cover_section = document.sections[0]
    cover_section.page_width = Cm(21.0)
    cover_section.page_height = Cm(29.7)
    cover_section.left_margin = Cm(2.2)
    cover_section.right_margin = Cm(2.2)
    cover_section.top_margin = Cm(2.0)
    cover_section.bottom_margin = Cm(1.8)
    cover_section.different_first_page_header_footer = True
    add_header_and_footer(cover_section, commit)

    renderer = Renderer(document, usable_cm(cover_section))
    add_cover(document, renderer, commit)

    document.add_page_break()
    add_contents(document)
    document.add_page_break()

    add_part(document, Renderer(document, usable_cm(cover_section)), *PARTS[0])
    for title, path in PARTS[1:]:
        document.add_page_break()
        add_part(document, Renderer(document, usable_cm(document.sections[-1])), title, path)

    # Traceability is the widest table set, so it gets its own landscape section.
    landscape = document.add_section(WD_SECTION.NEW_PAGE)
    landscape.orientation = WD_ORIENT.LANDSCAPE
    landscape.page_width = Cm(29.7)
    landscape.page_height = Cm(21.0)
    landscape.left_margin = Cm(1.7)
    landscape.right_margin = Cm(1.7)
    landscape.top_margin = Cm(1.7)
    landscape.bottom_margin = Cm(1.5)
    add_part(document, Renderer(document, usable_cm(landscape)), *TRACEABILITY)

    portrait = document.add_section(WD_SECTION.NEW_PAGE)
    portrait.orientation = WD_ORIENT.PORTRAIT
    portrait.page_width = Cm(21.0)
    portrait.page_height = Cm(29.7)
    portrait.left_margin = Cm(2.0)
    portrait.right_margin = Cm(2.0)
    portrait.top_margin = Cm(1.9)
    portrait.bottom_margin = Cm(1.7)
    add_evidence_part(document, Renderer(document, usable_cm(portrait)), manifest)

    document.add_page_break()
    add_part(document, Renderer(document, usable_cm(portrait)), *APPENDIX_FEATURES)

    document.add_page_break()
    add_part(document, Renderer(document, usable_cm(portrait)), *APPENDIX_EXCERPTS)

    logs_section = document.add_section(WD_SECTION.NEW_PAGE)
    logs_section.orientation = WD_ORIENT.LANDSCAPE
    logs_section.page_width = Cm(29.7)
    logs_section.page_height = Cm(21.0)
    logs_section.left_margin = Cm(1.6)
    logs_section.right_margin = Cm(1.6)
    logs_section.top_margin = Cm(1.6)
    logs_section.bottom_margin = Cm(1.4)
    add_log_appendix(document, Renderer(document, usable_cm(logs_section)), manifest)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document.save(OUTPUT)
    return OUTPUT


if __name__ == "__main__":
    output = build()
    size_kb = output.stat().st_size / 1024
    print(f"Wrote {output.relative_to(ROOT)} ({size_kb:.0f} KB)")
