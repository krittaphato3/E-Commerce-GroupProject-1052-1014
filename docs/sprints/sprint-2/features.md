# Omazon — Sprint 2 Features: Engineering Contracts

| Item | Value |
|---|---|
| Document | `docs/sprints/sprint-2/features.md` |
| Sprint | 2 (due with Deliverable 2, 29 Nov 2026) |
| Staging branch | `sprint-2-staging` |
| Release tag (planned) | `sprint-2-v2.0` |
| Version | 1.0 |
| Date | 2026-11-27 |
| Related | `docs/srs.md`, `docs/features.md` (whole-product inventory), `docs/traceability.md`, `docs/sprints/plan.md`, `docs/system-sds.md`, `docs/sprints/sprint-1/features.md` |

## Revision history (contract set)
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-27 | Initial contracts F-05 to F-08 and cross-cutting R-05 (AC-47 to AC-92, DEC-28 to DEC-42) | Written before implementation (Issue #53) |

Each contract below keeps its own revision history. Log every change there with a reason; do not rewrite earlier entries.

Nothing in this document is implemented yet. Every test listed here is `NOT RUN` in `docs/traceability.md`.

## 1. Contract index

| Section | Feature | AC / tests | Requirements |
|---|---|---|---|
| 7 | F-05 Catalog management | AC-47 to AC-57 | FR-10, BR-13, BR-04 (S2 part), BR-08, NFR-09 (partial) |
| 8 | F-06 Customer order cancellation | AC-58 to AC-67 | FR-11, BR-10, BR-06, BR-05, BR-07, BR-15 |
| 9 | F-07 Simulated payment | AC-68 to AC-76 | FR-13, BR-11, BR-07 |
| 10 | F-08 Fulfilment workflow | AC-77 to AC-87 | FR-12, BR-06, BR-09, BR-08, BR-15 |
| 11 | R-05 Delivery and quality gates (with the R-01 extension) | AC-88 to AC-92 | NFR-06, NFR-10, NFR-01, NFR-02 |
| 12 | Decisions and open questions | DEC-28 to DEC-42 | — |

Total: **46 acceptance criteria (AC-47 to AC-92) and 46 test IDs** (TEST-nn verifies AC-nn, continuing from Sprint 1). TEST-88 is also named **COV-01** and TEST-89 is also named **CHECK-01** (DEC-39).

---

## 2. Product Definition of Done (applies to every feature)

A feature is **done** only when all items are true and the evidence is retained:

1. Required behavior is implemented as described in the feature contract, and its AC are met.
2. Every planned test for the feature has been **executed**; the command, tested commit, counts (pass / fail / skipped) and output are saved.
3. Assertions are meaningful. No required test is skipped, disabled, mocked-away or weakened. Any failed or skipped test is disclosed.
4. For each meaningful rule, a test was seen **failing first** (red) and then passing (green); both commit IDs are recorded.
5. The work is on a feature branch created from `sprint-2-staging`, in a PR into `sprint-2-staging` reviewed by the teammate with a specific comment. The author does not approve their own PR.
6. Integration tests and acceptance checks pass on `sprint-2-staging`. The reviewed release PR from staging to `main` is merged, the release is deployed, and the accepted release is tagged `sprint-2-v2.0`.
7. Documents are current: contract revisions are logged with reasons, `README.md`, `.env.example`, migrations and seed match the code.
8. No real secrets or personal data are in Git or in the PDF. Demo data is synthetic.
9. Incomplete work, known defects and limitations are listed in the Deliverable 2 PDF.
10. Completion is shown by test output and screenshots that you produced by running the product, not by an AI agent's statement.
11. Every new endpoint is in `backend/src/routes/registry.ts` and covered by TEST-43 in the same PR that adds it. All Sprint 1 tests (TEST-01 to TEST-46) still pass.

---

## 3. Test-level summary

| Level | Count | Test IDs |
|---|---|---|
| Unit | 4 | TEST-60, 81, 90, 91 |
| Unit + API/database integration | 4 | TEST-51, 52, 69, 70 |
| API + database integration (API-DB) | 28 | TEST-47 to 50, 53 to 55, 58, 59, 61 to 65, 68, 71 to 74, 77 to 80, 82 to 85, 92 |
| UI component | 4 | TEST-56, 66, 75, 86 |
| End-to-end (Playwright) | 4 | TEST-57, 67, 76, 87 |
| Check (CI gate or post-deployment) | 2 | TEST-88 (COV-01), TEST-89 (CHECK-01) |
| **Total** | **46** | |

The 46 is the number of test IDs, not the number of executed cases. One TEST-nn can be implemented by several cases.

---

## 4. Planned Issues and branches

| GitHub issue | Contract item | Planned branch |
|---|---|---|
| #53 | Sprint 2 contracts (this document) | `docs/sprint2-contracts` |
| #54 | F-05 Catalog management | `feature/F-05-catalog` |
| #55 | F-06 Customer order cancellation | `feature/F-06-customer-cancel` |
| #56 | F-07 Simulated payment | `feature/F-07-payment` |
| #57 | F-08 Fulfilment workflow | `feature/F-08-fulfilment` |
| #58 | R-05 Delivery and quality gates | `chore/R-05-coverage-persistence` |

Every branch starts from `sprint-2-staging` and is merged back into it through a reviewed PR. The release goes `sprint-2-staging` → `main` and is tagged `sprint-2-v2.0`.

Order: #53 is merged before the first F-05 to F-08 implementation commit. F-07 (#56) is merged before F-08 (#57). R-05 (#58) is merged after #54 to #57.

Both students author at least two Issues and review the others; record who authored and who reviewed in each PR.

---

## 5. Commit sequence to keep for evidence

For each feature, make these commits in order and keep the hashes:

1. `docs(F-xx): contract revision` (only if the contract must change before coding, with the reason)
2. `test(F-xx): failing tests for AC-.. (red)` — run and save the failing output to `docs/evidence/F-xx-red-<sha>.txt`
3. `feat(F-xx): implementation (green)` — run and save the passing output to `docs/evidence/F-xx-green-<sha>.txt`
4. `docs(F-xx): contract revision` (only if the contract changed during implementation, with the reason)

The specification commit that Sprint 1 listed first is this document, delivered under Issue #53.

---

## 6. Evidence to collect for the Deliverable 2 PDF

| Evidence | From | Maps to |
|---|---|---|
| Versioned contract history: this file's revision tables and `git log` showing contracts merged before implementation | `git log`, PR for #53 | all |
| Catalog journey screenshots: create item, edit price, disable, public menu reflects it; old order still shows the old price | AC-47, AC-49, AC-50, AC-57 | F-05 |
| Cancellation screenshots: Cancel button, `CANCELLED` with history, stock before and after | AC-58, AC-59, AC-67 | F-06 |
| Payment screenshots: confirmation, `PAID` badge, rejection message | AC-68, AC-69, AC-75, AC-76 | F-07 |
| Fulfilment screenshots: operator buttons per status, customer view of progress | AC-85, AC-87 | F-08 |
| **Domain rule test excerpt:** unpaid order cannot start preparing | TEST-80 | F-08 |
| **Access restriction test excerpt:** route sweep listing every Sprint 2 endpoint with its role guard | TEST-92 (runs with TEST-43) | R-01, R-05 |
| TDD red then green output with commit IDs for TEST-50, TEST-63, TEST-73, TEST-80 | git history, `docs/evidence/` | TDD evidence |
| Full test command and output with counts and the tested commit hash | all | Build and test results |
| COV-01 coverage report and the CI run that enforced it | TEST-88 | NFR-10 |
| CHECK-01 record: commands, revision names, order before and after | TEST-89 | NFR-06 |
| AC → TEST → actual test file::name → result table | `docs/traceability.md` | Results table |
| Two Issue and PR chains with branch, author, reviewer, review comment, staging merge, release merge (F-07, #56, is the suggested first chain) | GitHub | Workflow evidence |
| Contribution table, AI-use declaration, known limitations | team | PDF |

---
