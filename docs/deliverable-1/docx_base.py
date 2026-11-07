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
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
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


def prevent_row_split(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    cant = OxmlElement("w:cantSplit")
    insert_in_order(tr_pr, cant, TRPR_ORDER)


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

    def heading(self, text: str, level: int, demote: int = 0) -> None:
        paragraph = self.doc.add_paragraph(style=f"Heading {min(level + demote, 5)}")
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
        for row in table.rows:
            prevent_row_split(row)
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
    def render(self, text: str, demote: int = 0) -> None:
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
                    self.heading(match.group(2).strip(), level, demote)
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
