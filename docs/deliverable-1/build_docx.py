#!/usr/bin/env python3
"""Assemble Deliverable 1 (Sprint 1) into a single Word document.

Run from anywhere inside the repository:

    python docs/deliverable-1/build_docx.py

Reads the Markdown sources in docs/, the screenshot manifest and captions in
docs/evidence/, and writes docs/deliverable-1/Deliverable-1.docx.

Page numbers in the Contents and in the Part A-F navigation table come from
docs/deliverable-1/.build-pages.json, which docs/deliverable-1/check_docx.py
writes after rendering the document to PDF. Build once, render and check, then
build again to fill the numbers. Requires python-docx and, for checking, a
LibreOffice installation plus PyMuPDF.
"""

from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENT, WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.shared import Cm, Pt, RGBColor

from docx_base import (
    BLUE,
    EVIDENCE,
    GREY,
    NAVY,
    OUTPUT,
    ROOT,
    Renderer,
    add_bottom_rule,
    add_header_and_footer,
    add_left_border,
    add_paragraph_shading,
    configure_styles,
    git_hash,
    prevent_row_split,
    render_inline,
    set_table_margins,
    shade_cell,
    split_row,
    usable_cm,
)

STUDENT_1 = "Krittaphat Panyasomphan (67070501052)"
STUDENT_2 = "Napat Kasemweerasan (67070501014)"
THEME = "E-Commerce / CampusBites"
REPO_URL = "https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014"
REPO_LABEL = "github.com/krittaphato3/E-Commerce-GroupProject-1052-1014"
RELEASE_TAG = "sprint-1-v1.0"
TESTED_COMMIT = "c8fd8fc"
PAGE_FILE = ROOT / "docs" / "deliverable-1" / ".build-pages.json"

PART_TITLES = {
    "A": "Part A — Software Requirements Specification",
    "B": "Part B — Features and Requirements Traceability",
    "C": "Part C — System-Level Software Design Specification",
    "D": "Part D — Three-Sprint Plan",
    "E": "Part E — Sprint 1 Engineering Contracts",
    "F": "Part F — Execution Evidence",
}
APPENDIX_LOGS = "Appendix A — Test Execution Logs"
TEST_EXCERPTS_PATH = "docs/evidence/test-excerpts.md"

TOC_ENTRIES = [
    (PART_TITLES["A"], 0),
    (PART_TITLES["B"], 0),
    ("B.1 Feature inventory and coverage", 1),
    ("B.2 Requirements traceability matrix", 1),
    (PART_TITLES["C"], 0),
    (PART_TITLES["D"], 0),
    (PART_TITLES["E"], 0),
    (PART_TITLES["F"], 0),
    ("F.1 Verification summary", 1),
    ("F.2 Screenshot evidence", 1),
    ("F.3 Build and test results", 1),
    ("F.4 Red-then-green (TDD) evidence", 1),
    ("F.5 Test excerpts", 1),
    ("F.6 Git workflow, review and release status", 1),
    ("F.7 Contributions and AI-use declaration", 1),
    ("F.8 Setup summary", 1),
    ("F.9 Known limitations", 1),
    (APPENDIX_LOGS, 0),
]


# --------------------------------------------------------------------------- #
# Page map
# --------------------------------------------------------------------------- #
def load_pages() -> dict[str, int]:
    if not PAGE_FILE.exists():
        return {}
    raw = json.loads(PAGE_FILE.read_text(encoding="utf-8"))
    return {key: int(value) for key, value in raw.items()}


def page_of(pages: dict[str, int], title: str) -> str:
    value = pages.get(title)
    return str(value) if value else "00"


def page_range(pages: dict[str, int], start: str, end: str | None = None) -> str:
    first = pages.get(start)
    if not first:
        return "—"
    if end:
        last = pages.get(end)
        if last and last > first:
            return f"{first}–{last - 1}"
        return str(first)
    total = pages.get("__total__", first)
    return f"{first}–{total}" if total > first else str(first)


def shot_heading(shot: dict, meta: dict) -> str:
    return f"{shot['id']} · {shot['flow']} ({shot['ac']})"


# --------------------------------------------------------------------------- #
# Front matter
# --------------------------------------------------------------------------- #
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
    subtitle.paragraph_format.space_after = Pt(4)

    theme = document.add_paragraph()
    theme.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = theme.add_run(f"Theme: {THEME}")
    run.bold = True
    run.font.size = Pt(10.5)
    run.font.color.rgb = NAVY
    theme.paragraph_format.space_after = Pt(16)

    rule = document.add_paragraph()
    add_bottom_rule(rule, "0D6EFD", "18")
    rule.paragraph_format.space_after = Pt(20)

    heading = document.add_paragraph()
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = heading.add_run("Deliverable 1 — Sprint 1 Engineering Documentation")
    run.bold = True
    run.font.size = Pt(20)
    run.font.color.rgb = NAVY
    heading.paragraph_format.space_after = Pt(8)

    meta = document.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = meta.add_run("CPE 334 Software Engineering · Semester 1/2026 · Group 1052-1014")
    run.font.size = Pt(10.5)
    meta.paragraph_format.space_after = Pt(18)

    students = document.add_paragraph()
    students.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = students.add_run(f"{STUDENT_1}\n{STUDENT_2}")
    run.font.size = Pt(12)
    run.bold = True
    students.paragraph_format.space_after = Pt(2)

    repo = document.add_paragraph()
    repo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = repo.add_run(REPO_LABEL)
    run.font.size = Pt(9.5)
    run.font.color.rgb = GREY
    repo.paragraph_format.space_after = Pt(20)

    document.add_paragraph("Release identification").runs[0].bold = True
    renderer.table(
        [
            ["Field", "Value"],
            ["Release tag", f"{RELEASE_TAG} — NOT YET CREATED; see Part F.6"],
            ["Code under test", f"{TESTED_COMMIT} — latest recorded unit/integration run: backend 84, frontend 36, all passing"],
            ["Evidence commit", f"{commit} — screenshots and E2E run; this document is built from that evidence"],
            ["Repository", REPO_URL],
            ["Branches", "sprint-1-staging (integration); main release pending"],
            ["Assembled", date.today().strftime("%d %B %Y")],
        ]
    )
    note = document.add_paragraph()
    run = note.add_run(
        "Generated from the version-controlled Markdown sources and evidence artefacts. "
        "Edit those sources, not this file."
    )
    run.italic = True
    run.font.size = Pt(8)
    run.font.color.rgb = GREY


def add_contents(document: Document, width_cm: float, pages: dict[str, int]) -> None:
    paragraph = document.add_paragraph()
    run = paragraph.add_run("Contents")
    run.bold = True
    run.font.size = Pt(20)
    run.font.color.rgb = NAVY
    paragraph.paragraph_format.space_after = Pt(2)

    hint = document.add_paragraph()
    run = hint.add_run("Page numbers refer to the pages of this document.")
    run.italic = True
    run.font.size = Pt(8.5)
    run.font.color.rgb = GREY
    hint.paragraph_format.space_after = Pt(14)

    for title, indent in TOC_ENTRIES:
        entry = document.add_paragraph()
        fmt = entry.paragraph_format
        fmt.space_after = Pt(4)
        fmt.left_indent = Cm(0.6 * indent)
        fmt.tab_stops.add_tab_stop(
            Cm(width_cm - 0.6 * indent), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS
        )
        run = entry.add_run(title)
        run.font.size = Pt(10) if indent == 0 else Pt(9.5)
        run.bold = indent == 0
        entry.add_run("\t")
        number = entry.add_run(page_of(pages, title))
        number.bold = indent == 0


def add_navigation(document: Document, renderer: Renderer, pages: dict[str, int]) -> None:
    paragraph = document.add_paragraph()
    run = paragraph.add_run("How to navigate this document")
    run.bold = True
    run.font.size = Pt(18)
    run.font.color.rgb = NAVY
    paragraph.paragraph_format.space_after = Pt(6)

    renderer.paragraph(
        "Parts A–E reproduce the complete engineering documents. Part F is the execution "
        "evidence: the screenshots, the runs and their counts, the red-then-green record and "
        "the workflow evidence. Each row below names the page range, the identifiers a reader "
        "needs, and where the proof is recorded."
    )

    part_e_range = page_range(pages, PART_TITLES["E"], PART_TITLES["F"])
    part_f_page = pages.get(PART_TITLES["F"], "—")
    renderer.table(
        [
            ["Part", "Contents", "Pages", "Key IDs", "Proof in Part F"],
            [
                "A — SRS",
                "Problem and scope, actors, exclusions, functional and business rules, NFRs, assumptions, decisions",
                page_range(pages, PART_TITLES["A"], PART_TITLES["B"]),
                "FR-01–FR-17; BR-01–BR-15; NFR-01–NFR-11; DEC-01–DEC-27",
                "Requirements are tested in F.3.3 and shown in F.2",
            ],
            [
                "B — Features and traceability",
                "Feature inventory, coverage, full matrix, gaps and approved changes",
                page_range(pages, PART_TITLES["B"], PART_TITLES["C"]),
                "F-01–F-13; R-01–R-05; CHG-01–CHG-02",
                "Planned and actual tests: F.3.3",
            ],
            [
                "C — System design",
                "Architecture, data model, UI and API conventions, role matrix, authentication, config, GCP plan",
                page_range(pages, PART_TITLES["C"], PART_TITLES["D"]),
                "R-01–R-03; NFR-06–NFR-08",
                "Design claims are evidenced by F.2 and F.3",
            ],
            [
                "D — Plan",
                "Goals, feature IDs, dependencies, Sprint 1 scope and completion outcome",
                page_range(pages, PART_TITLES["D"], PART_TITLES["E"]),
                "F-01–F-04; R-01–R-03",
                "Sprint 1 outcome and counts: F.1",
            ],
            [
                "E — Contracts",
                "Feature SDS, API and data specifications, AC, STS and Definition of Done for Sprint 1",
                part_e_range,
                "AC-01–AC-46; TEST-01–TEST-46",
                "Each AC is mapped to its actual test in F.3.3",
            ],
            [
                "F — Execution evidence",
                "Screenshots with role and steps, build and test results, excerpts, TDD, Git workflow, contributions, setup",
                page_range(pages, PART_TITLES["F"], APPENDIX_LOGS),
                "E-01–E-14; L-01–L-14",
                "This part; raw logs in Appendix A",
            ],
        ]
    )
    example = document.add_paragraph()
    run = example.add_run(
        f"Example: Part E, pages {part_e_range}: F-03, AC-11, TEST-11; "
        f"execution evidence in Part F, page {part_f_page}."
    )
    run.italic = True
    run.font.size = Pt(8.5)
    run.font.color.rgb = GREY
    example.paragraph_format.space_after = Pt(6)
    renderer.paragraph(
        f"Appendix A reproduces the raw terminal logs and starts on page {page_of(pages, APPENDIX_LOGS)}."
    )


# --------------------------------------------------------------------------- #
# Parts
# --------------------------------------------------------------------------- #
def part_heading(document: Document, title: str) -> None:
    document.add_paragraph(style="Heading 1").add_run(title)


def source_line(document: Document, text: str) -> None:
    source = document.add_paragraph()
    run = source.add_run(text)
    run.italic = True
    run.font.size = Pt(8.5)
    run.font.color.rgb = GREY
    source.paragraph_format.space_after = Pt(8)


def add_part(document: Document, renderer: Renderer, title: str, relative_path: str, demote: int = 0) -> None:
    part_heading(document, title)
    source_line(document, f"Source: {relative_path}")
    renderer.render((ROOT / relative_path).read_text(encoding="utf-8"), demote=demote)


def add_subsection(document: Document, renderer: Renderer, title: str, relative_path: str) -> None:
    document.add_paragraph(style="Heading 2").add_run(title)
    source_line(document, f"Source: {relative_path}")
    renderer.render((ROOT / relative_path).read_text(encoding="utf-8"), demote=1)


# --------------------------------------------------------------------------- #
# Part F helpers
# --------------------------------------------------------------------------- #
def compact_table(document: Document, rows: list[tuple[str, str]], width_cm: float, key_width: float = 3.5) -> None:
    table = document.add_table(rows=len(rows), cols=2)
    table.style = "Table Grid"
    table.autofit = False
    table.allow_autofit = False
    table.columns[0].width = Cm(key_width)
    table.columns[1].width = Cm(width_cm - key_width)
    for index, (key, value) in enumerate(rows):
        key_cell = table.cell(index, 0)
        value_cell = table.cell(index, 1)
        key_cell.width = Cm(key_width)
        value_cell.width = Cm(width_cm - key_width)
        for cell in (key_cell, value_cell):
            fmt = cell.paragraphs[0].paragraph_format
            fmt.space_before = Pt(0)
            fmt.space_after = Pt(0)
            fmt.line_spacing = 1.0
        render_inline(key_cell.paragraphs[0], key, size=8.2, bold=True)
        render_inline(value_cell.paragraphs[0], value, size=8.2)
        shade_cell(key_cell, "EDF2F9")
    for row in table.rows:
        prevent_row_split(row)
    set_table_margins(table)


def add_placeholder(document: Document, title: str, lines: list[str]) -> None:
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(8)
    paragraph.paragraph_format.space_after = Pt(10)
    add_paragraph_shading(paragraph, "FFF4E5")
    add_left_border(paragraph, "E67E22")
    run = paragraph.add_run(title)
    run.bold = True
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(0x8A, 0x4B, 0x08)
    for line in lines:
        paragraph.add_run().add_break()
        bullet = paragraph.add_run("• " + line)
        bullet.font.size = Pt(8.5)


def add_screenshot(document: Document, renderer: Renderer, shot: dict, meta: dict) -> None:
    document.add_paragraph(style="Heading 3").add_run(shot_heading(shot, meta))
    compact_table(
        document,
        [
            ("Feature / AC", f"{meta['feature']} · {shot['ac']}"),
            ("Role", meta["role"]),
            ("Starting conditions", meta["start"]),
            ("Steps", meta["steps"]),
            ("Expected", meta["expected"]),
            ("Actual", meta["actual"]),
            ("Result", meta["result"]),
        ],
        renderer.width_cm,
    )
    renderer.picture(EVIDENCE / shot["file"], max_height_cm=12.5)
    note = document.add_paragraph()
    note.paragraph_format.space_after = Pt(4)
    render_inline(note, f"Caption: {shot['caption']}", size=8.2, italic=True)
    limits = document.add_paragraph()
    limits.paragraph_format.space_after = Pt(4)
    render_inline(limits, f"Capture note: {shot['note']}", size=8)


def extract_actual(cell: str, test_id: str) -> str:
    for part in cell.split(";"):
        files = re.findall(r"[\w./-]+\.(?:tsx|ts)\b", part)
        if re.search(rf"::{re.escape(test_id)}\b", part) and files:
            return f"{files[-1]}::{test_id}"
    return ""


def planned_tests(cell: str) -> set[int]:
    """Expand shorthand such as 'TEST-01, 02, 03' and 'TEST-18–23'."""
    numbers: set[int] = set()
    for chunk in re.split(r"[,;]", cell):
        chunk = chunk.strip()
        if not chunk or "TBD" in chunk or re.search(r"(LOAD|CHECK|COV)-", chunk):
            continue
        if "TEST-" not in chunk and not re.fullmatch(r"\d{1,2}(?:\s*[–-]\s*\d{1,2})?", chunk):
            continue
        for match in re.finditer(r"(?:TEST-)?(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?", chunk):
            start = int(match.group(1))
            end = int(match.group(2)) if match.group(2) else start
            if 1 <= start <= 46:
                numbers.update(range(start, min(end, 46) + 1))
    return numbers


def build_ac_rows(trace_text: str) -> tuple[list[list[str]], list[int]]:
    records: list[list[str]] = []
    for line in trace_text.splitlines():
        if not line.strip().startswith("|"):
            continue
        cells = split_row(line)
        if len(cells) < 8:
            continue
        if re.fullmatch(r"(FR|BR|NFR)-\d+", cells[0].strip()):
            records.append(cells)

    rows: list[list[str]] = []
    missing: list[int] = []
    for number in range(1, 47):
        test_id = f"TEST-{number:02d}"
        matches = [cells for cells in records if number in planned_tests(cells[4])]
        actual = ""
        for cells in matches:
            candidate = extract_actual(cells[5], test_id)
            if candidate and (not actual or cells[6].strip() == "PASS"):
                actual = candidate
        results = [cells[6].strip() for cells in matches]
        if "PASS" in results:
            result = "PASS"
        elif results:
            result = results[0]
        else:
            missing.append(number)
            result = "SEE PART B"
        automated = "Yes"
        if "/e2e/" in actual:
            automated = "Yes (E2E)"
        if number == 45:
            automated = "Yes + manual"
        rows.append([f"AC-{number:02d}", test_id, actual or "See Part B", automated, result])
    return rows, missing


def add_evidence_part(
    document: Document,
    renderer: Renderer,
    manifest: dict,
    captions: dict,
    pages: dict[str, int],
    commit: str,
) -> None:
    part_heading(document, PART_TITLES["F"])
    source_line(
        document,
        "Sources: docs/evidence/*.png, manifest.json, captions.json, github-workflow.md, "
        "test-excerpts.md and docs/traceability.md",
    )
    renderer.paragraph(
        "This part records how the Sprint 1 requirements were shown to work. Every screenshot was "
        "taken from the running application against the seeded database, and every terminal log names "
        "the commit it was produced from. The screenshots are presented in the order of the required "
        "customer and operator journey, followed by the rejection and access-control states. The "
        "traceability matrix in Part B links each requirement to the test that proves it, and the raw "
        "output behind the recorded runs is reproduced in Appendix A."
    )

    total_tests = 46
    log_files = sorted(EVIDENCE.glob("*.txt"))
    embedded_logs = [log for log in manifest["logs"] if log.get("embed")]

    renderer.heading("F.1 Verification summary", 2)
    renderer.table(
        [
            ["Item", "Value"],
            ["Sprint 1 acceptance criteria", f"{total_tests} (AC-01 to AC-46); one planned test per AC"],
            [
                "Unit and integration (latest recorded)",
                f"{TESTED_COMMIT} — backend 84 passed (15 files); frontend 36 passed (8 files); 0 failed, 0 skipped",
            ],
            [
                "End-to-end (latest run)",
                f"{commit} — 6 Playwright journeys passed on 2026-11-07; 0 failed",
            ],
            ["Type check and build", f"Green at {TESTED_COMMIT} (build and type-check logs kept in docs/evidence/)"],
            ["Screenshots", f"{len(manifest['screenshots'])} (E-01 to E-14), captured from the running application"],
            [
                "Terminal logs",
                f"{len(log_files)} files in docs/evidence; {len(embedded_logs)} reproduced in Appendix A",
            ],
            ["Rejection and access control", "E-06 rejects an unavailable item; E-13 blocks a customer from an operator screen; API-level proof in F.3.3"],
            ["Coverage and load testing", "NFR-10 coverage is Sprint 2; the NFR-05 benchmark is Sprint 3 and has not been run (F.9)"],
        ]
    )

    renderer.heading("F.2 Screenshot evidence", 2)
    renderer.paragraph(
        "Each entry below gives the feature and acceptance criteria, the role, the starting "
        "conditions, the steps taken, and the expected result beside what the capture actually "
        "shows. The result column states the outcome; it is not inferred from the picture alone."
    )
    renderer.table(
        [["ID", "Feature", "Flow", "Role", "AC", "Page"]]
        + [
            [
                shot["id"],
                captions.get(shot["id"], {}).get("feature", "—"),
                shot["flow"],
                captions.get(shot["id"], {}).get("role", "—"),
                shot["ac"],
                str(pages.get(shot_heading(shot, captions.get(shot["id"], {})), "—")),
            ]
            for shot in manifest["screenshots"]
        ]
    )
    for shot in manifest["screenshots"]:
        meta = captions.get(shot["id"])
        if not meta:
            continue
        document.add_page_break()
        add_screenshot(document, renderer, shot, meta)

    renderer.heading("F.3 Build and test results", 2)
    renderer.heading("F.3.1 Commands and environments", 3)
    renderer.table(
        [
            ["Command", "Purpose", "Environment"],
            ["npm install", "Install both workspaces and generate the Prisma client", "Node.js >= 20.12"],
            ["npm run db:migrate", "Apply Prisma migrations and raw SQL CHECK constraints", "PostgreSQL 16 (Docker Compose)"],
            ["npm run db:seed", "Load the idempotent synthetic users and menu", "campusbites"],
            ["npm test", "Backend Vitest + Supertest, then frontend Vitest", "campusbites_test; no mocked SQL"],
            ["npm run typecheck", "tsc --noEmit across both workspaces", "Local"],
            ["npm run build", "Backend tsc emit and Vite production bundle", "Local"],
            ["npm run e2e", "Playwright journeys on ports 3100 and 5174", "campusbites_test; globalSetup resets and seeds"],
            ["CAPTURE_EVIDENCE=1 npm run e2e", "The same journeys with screenshot capture into docs/evidence/", "campusbites_test"],
        ]
    )

    renderer.heading("F.3.2 Recorded runs", 3)
    renderer.paragraph(
        "Counts are copied from the retained logs, not restated from memory. The full block for each "
        "embedded run is in Appendix A."
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
            ["Evidence capture", "End-to-end + screenshots", commit, "CAPTURE_EVIDENCE=1 npm run e2e", "6 journeys passed (2026-11-07)"],
        ]
    )

    renderer.heading("F.3.3 Acceptance criterion to actual test", 3)
    renderer.paragraph(
        "TEST-nn verifies AC-nn. The planned test column comes from the Sprint 1 contracts, and the "
        "actual file and test name are taken from the traceability matrix. All 46 criteria have an "
        "automated test; TEST-45 additionally requires the manual fresh-clone quickstart check. A test "
        "is marked PASS only where the matrix records an executed pass at the named commit."
    )
    trace_text = (ROOT / "docs/traceability.md").read_text(encoding="utf-8")
    ac_rows, missing = build_ac_rows(trace_text)
    renderer.table([["AC", "Planned", "Actual test (file::name)", "Automated", "Result"]] + ac_rows)
    if missing:
        renderer.paragraph(
            "These criteria had no planned test in the matrix and need review before submission: "
            + ", ".join(f"AC-{number:02d}" for number in missing)
            + "."
        )

    renderer.heading("F.4 Red-then-green (TDD) evidence", 2)
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

    renderer.heading("F.5 Test excerpts", 2)
    renderer.paragraph(
        "Two short excerpts are reproduced below: one domain rule (the last unit under concurrency) "
        "and one access restriction (a customer requesting another customer's order). Each keeps the "
        "setup, the assertion and the executed result."
    )
    renderer.render((ROOT / TEST_EXCERPTS_PATH).read_text(encoding="utf-8"), demote=1)

    renderer.heading("F.6 Git workflow, review and release status", 2)
    renderer.paragraph(
        "Feature branches were cut from sprint-1-staging and merged only after a review by the other "
        "member. No author approved their own pull request. GitHub issue numbers are sequential in "
        "this repository; the contract's ISSUE-n labels refer to the same slices of work."
    )
    renderer.table(
        [
            ["PR", "Issue", "Branch", "Author", "Reviewer", "Merged into sprint-1-staging", "Date"],
            ["#8", "#1", "feature/specification-docs", "napatsun", "krittaphato3 (approved)", "krittaphato3", "2026-11-05"],
            ["#9", "#2", "feature/sprint1/scaffold-db-seed", "krittaphato3", "napatsun (changes, then approved)", "napatsun", "2026-11-06"],
            ["#10", "#3", "feature/sprint1/auth-login-logout", "napatsun", "krittaphato3 (approved)", "krittaphato3", "2026-11-06"],
            ["#11", "#4, #5", "feature/sprint1/menu-and-place-order", "krittaphato3", "napatsun (approved)", "napatsun", "2026-11-07"],
            ["#12", "#5", "feature/sprint1/operator-accept-order", "napatsun", "krittaphato3 (approved)", "krittaphato3", "2026-11-07"],
            ["#13", "#6", "feature/sprint1/access-and-e2e-tests", "napatsun", "krittaphato3 (approved)", "krittaphato3", "2026-11-07"],
        ]
    )

    renderer.heading("F.6.1 Substantive review findings", 3)
    renderer.table(
        [
            ["Reviewer", "PR", "Finding", "Outcome"],
            [
                "napatsun",
                "#9",
                "Fresh clone failed at quickstart steps 4–5: P1012 because the root .env was not loaded, and the Prisma client was not initialized. This conflicts with NFR-08.",
                "Fixed in ab28061 (backend/.env.example, postinstall prisma generate, dotenv); re-reviewed and approved.",
            ],
            [
                "krittaphato3",
                "#10",
                "DUMMY_PASSWORD_HASH was hardcoded at bcrypt cost 10, so the timing defence breaks as soon as BCRYPT_ROUNDS is raised.",
                "Follow-up fixes bb0acb4, f45ba47, 2022899, 6e68bee and 83f0337; approved.",
            ],
            [
                "napatsun",
                "#11",
                "Five non-blocking findings: show the API message, fix the My orders link against operator access, add Location on 201, cover the menu 500 path, and cap quantity by stock.",
                "Handled in the merge and the following PRs; tracked in the traceability revisions.",
            ],
        ]
    )
    renderer.paragraph(
        "The full review threads are in the repository. The findings above are the specific defects "
        "or risks that changed the implementation, not approval-only comments."
    )

    renderer.heading("F.6.2 Contract-before-implementation sequence", 3)
    commit_log = (EVIDENCE / "sprint-1-commit-log.txt").read_text(encoding="utf-8", errors="replace")
    log_lines = commit_log.replace("\r\n", "\n").split("\n")
    renderer.paragraph(
        "The first entries of the staging history show the specification and contract commits before "
        "the feature implementations, as the Definition of Done requires."
    )
    renderer.log_block("\n".join(log_lines[:26]))

    renderer.heading("F.6.3 Release and final board status", 3)
    add_placeholder(
        document,
        "TO BE COMPLETED AFTER THE RELEASE MERGE — release and board status",
        [
            "Current state on 7 November 2026: Issues #1–#6 are closed and PR #8–#13 are merged into sprint-1-staging; Issue #7 and PR #14 (this document) are open; no release PR into main exists; the tag sprint-1-v1.0 has not been created.",
            "Fill in: the release PR number, its merge commit on main and the tag sprint-1-v1.0 with its date.",
            "Fill in: the final sprint board state (all Sprint 1 cards Done) and a link or screenshot of the board.",
            "Then replace the tested commit on the cover with the release commit, so the submitted document names an immutable revision.",
        ],
    )

    renderer.heading("F.7 Contributions and AI-use declaration", 2)
    renderer.paragraph(
        "The contribution split below is the same record as the PR authors, reviewers and merge actors. "
        "Both members authored at least two slices and reviewed the other member's pull requests."
    )
    renderer.table(
        [
            ["Member", "Implemented", "Reviewed", "Merged"],
            [
                "Krittaphat Panyasomphan (krittaphato3), 67070501052",
                "R-03 scaffold, schema and seed (PR #9); F-02 menu and F-03 order submission (PR #11)",
                "PR #8, #10, #12, #13",
                "PR #8, #10, #12, #13",
            ],
            [
                "Napat Kasemweerasan (napatsun), 67070501014",
                "F-01 authentication (PR #10); F-04 operator acceptance (PR #12); R-01 route registry and TEST-43 (PR #13); specification baseline (PR #8)",
                "PR #9, #11",
                "PR #9, #11",
            ],
        ]
    )
    add_placeholder(
        document,
        "TO BE COMPLETED BY BOTH MEMBERS — AI-use declaration",
        [
            "Name every AI assistant or coding tool used, or state that none was used.",
            "Describe what AI helped with (drafting, test scaffolding, review, documentation) and which parts each member wrote or rewrote themselves.",
            "State how AI-assisted changes were verified: which tests were run, at which commit, and what was reviewed manually.",
            "Confirm that no AI output was reported as passing without an executed test, and that all cited screenshots were produced from the running product.",
        ],
    )

    renderer.heading("F.8 Setup summary", 2)
    renderer.paragraph(
        "A fresh clone needs Node.js 20.12 or newer and Docker. No real credentials are stored in the "
        "repository; the seeded accounts use local values set in backend/.env."
    )
    renderer.table(
        [
            ["Dependency / component", "Version or source", "Purpose"],
            ["Node.js", ">= 20.12 (package.json engines)", "API and frontend build"],
            ["PostgreSQL", "16 via docker-compose.yml", "campusbites and campusbites_test"],
            ["Backend", "Express 5, Prisma 6, zod, bcryptjs", "API, persistence, validation, sessions"],
            ["Frontend", "React 18, Vite 6, Bootstrap 5", "Single-page application"],
            ["Tests", "Vitest, Supertest, Testing Library, Playwright", "Unit, integration, UI and E2E"],
            ["Document build", "Python 3.10+, python-docx", "This Word document"],
        ]
    )
    renderer.table(
        [
            ["Environment variable", "Purpose"],
            ["PORT", "API port (default 3000)"],
            ["NODE_ENV", "Runtime mode; production refuses placeholder seed passwords"],
            ["CLIENT_ORIGIN", "Exact SPA origin allowed to send credentialed requests"],
            ["DATABASE_URL", "Development database connection"],
            ["TEST_DATABASE_URL", "Test database; the name must end in _test"],
            ["SESSION_TTL_HOURS", "Session lifetime and cookie Max-Age (default 8)"],
            ["COOKIE_SECURE", "Set true when serving over HTTPS"],
            ["BCRYPT_ROUNDS", "bcrypt cost factor (default 10)"],
            ["SEED_CUSTOMER_PASSWORD", "Local password for the seeded customer accounts"],
            ["SEED_OPERATOR_PASSWORD", "Local password for the seeded operator accounts"],
        ]
    )
    renderer.paragraph(
        "Copy backend/.env.example to backend/.env and set the two seed passwords locally. The file is "
        "not committed; .env.example contains placeholders only."
    )
    renderer.code_block(
        "cp backend/.env.example backend/.env\n"
        "docker compose up -d\n"
        "npm install\n"
        "npm run db:migrate\n"
        "npm run db:seed\n"
        "npm test\n"
        "npm run dev:backend\n"
        "npm run dev:frontend\n"
        "\n"
        "# End-to-end journeys (one-time browser install first)\n"
        "npm run e2e:install --workspace=frontend\n"
        "npm run e2e",
        "bash",
    )

    renderer.heading("F.9 Known limitations", 2)
    renderer.paragraph(
        "Disclosed rather than hidden, as the Definition of Done requires. None of these turns a "
        "recorded pass into a fail; each is allocated work, a later sprint, or a submission step."
    )
    for item in [
        "The release tag sprint-1-v1.0 and the merge to main are not done yet; F.6.3 is the slot for that evidence. The document currently names the tested commit c8fd8fc.",
        "The NFR-05 load benchmark (autocannon, 20 connections, 30 s per endpoint) is allocated to Sprint 3 and has not been run; the traceability row stays NOT RUN.",
        "The unit and integration suites have not been re-run since c8fd8fc. The Playwright journeys were re-run for this evidence pack at 9d8e7cb and all six passed.",
        "NFR-09 is verified for the Sprint 1 screens but its final usability pass belongs to Sprint 3; the matrix row stays INCOMPLETE.",
        "BR-13 is verified at the database level only until the Sprint 2 catalog API adds its own validation.",
        "No separate order-confirmation screen exists: the SPA navigates straight to the order detail after a 201, so E-07 is the confirmation evidence.",
        "The login screenshot covers invalid credentials, not the 400 field-validation path; TEST-04 covers that response shape.",
        "The R-01 route registry does not extract routers nested inside routers, and a router mounted under two prefixes keeps only the last mount; both are Sprint 2 backlog items.",
        "NFR-10 coverage (at least 85% of the service layer) is a Sprint 2 measurement and has no recorded result yet.",
        "The contribution confirmation and the AI-use declaration in F.7 are team-authored statements and remain to be completed by both members.",
    ]:
        renderer.list_item(item, 0, False, None)


def add_log_appendix(document: Document, renderer: Renderer, manifest: dict) -> None:
    document.add_paragraph(style="Heading 1").add_run(APPENDIX_LOGS)
    source_line(
        document,
        "Verbatim terminal output from docs/evidence/. Each block names the feature, the state, the tested commit and the command.",
    )
    first_log = True
    for log in manifest["logs"]:
        if not log.get("embed"):
            continue
        if not first_log:
            document.add_page_break()
        first_log = False
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


# --------------------------------------------------------------------------- #
# Document assembly
# --------------------------------------------------------------------------- #
def build() -> Path:
    commit = git_hash()
    pages = load_pages()
    manifest = json.loads((EVIDENCE / "manifest.json").read_text(encoding="utf-8"))
    captions = json.loads((EVIDENCE / "captions.json").read_text(encoding="utf-8"))

    document = Document()
    configure_styles(document)
    document.core_properties.title = "Omazon — Deliverable 1 (Sprint 1)"
    document.core_properties.subject = "Sprint 1 engineering documentation and execution evidence"
    document.core_properties.author = "Group 1052-1014"
    document.core_properties.comments = "Generated from docs/ Markdown sources by build_docx.py"

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
    add_contents(document, usable_cm(cover_section), pages)
    document.add_page_break()
    add_navigation(document, Renderer(document, usable_cm(cover_section)), pages)
    document.add_page_break()

    add_part(document, Renderer(document, usable_cm(cover_section)), PART_TITLES["A"], "docs/srs.md")

    document.add_page_break()
    part_heading(document, PART_TITLES["B"])
    source_line(document, "Sources: docs/features.md; docs/traceability.md")
    document.add_paragraph(style="Heading 2").add_run("B.1 Feature inventory and coverage")
    source_line(document, "Source: docs/features.md")
    Renderer(document, usable_cm(cover_section)).render(
        (ROOT / "docs/features.md").read_text(encoding="utf-8"), demote=1
    )

    landscape = document.add_section(WD_SECTION.NEW_PAGE)
    landscape.orientation = WD_ORIENT.LANDSCAPE
    landscape.page_width = Cm(29.7)
    landscape.page_height = Cm(21.0)
    landscape.left_margin = Cm(1.7)
    landscape.right_margin = Cm(1.7)
    landscape.top_margin = Cm(1.7)
    landscape.bottom_margin = Cm(1.5)
    landscape.different_first_page_header_footer = False
    document.add_paragraph(style="Heading 2").add_run("B.2 Requirements traceability matrix")
    source_line(document, "Source: docs/traceability.md")
    Renderer(document, usable_cm(landscape)).render(
        (ROOT / "docs/traceability.md").read_text(encoding="utf-8"), demote=1
    )

    portrait = document.add_section(WD_SECTION.NEW_PAGE)
    portrait.orientation = WD_ORIENT.PORTRAIT
    portrait.page_width = Cm(21.0)
    portrait.page_height = Cm(29.7)
    portrait.left_margin = Cm(2.0)
    portrait.right_margin = Cm(2.0)
    portrait.top_margin = Cm(1.9)
    portrait.bottom_margin = Cm(1.7)
    portrait.different_first_page_header_footer = False
    add_part(document, Renderer(document, usable_cm(portrait)), PART_TITLES["C"], "docs/system-sds.md")
    document.add_page_break()
    add_part(document, Renderer(document, usable_cm(portrait)), PART_TITLES["D"], "docs/sprints/plan.md")
    document.add_page_break()
    add_part(
        document,
        Renderer(document, usable_cm(portrait)),
        PART_TITLES["E"],
        "docs/sprints/sprint-1/features.md",
    )

    document.add_page_break()
    add_evidence_part(
        document,
        Renderer(document, usable_cm(portrait)),
        manifest,
        captions,
        pages,
        commit,
    )

    logs_section = document.add_section(WD_SECTION.NEW_PAGE)
    logs_section.orientation = WD_ORIENT.LANDSCAPE
    logs_section.page_width = Cm(29.7)
    logs_section.page_height = Cm(21.0)
    logs_section.left_margin = Cm(1.6)
    logs_section.right_margin = Cm(1.6)
    logs_section.top_margin = Cm(1.6)
    logs_section.bottom_margin = Cm(1.4)
    logs_section.different_first_page_header_footer = False
    add_log_appendix(document, Renderer(document, usable_cm(logs_section)), manifest)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document.save(OUTPUT)
    return OUTPUT


if __name__ == "__main__":
    output = build()
    size_kb = output.stat().st_size / 1024
    print(f"Wrote {output.relative_to(ROOT)} ({size_kb:.0f} KB)")
