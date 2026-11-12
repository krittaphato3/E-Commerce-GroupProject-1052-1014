# Omazon — Requirements Traceability Matrix

| Item | Value |
|---|---|
| Document | `docs/traceability.md` |
| Version | 1.19 |
| Date | 2026-11-12 |
| Related | `docs/srs.md`, `docs/features.md`, `docs/sprints/sprint-1/features.md` |

### Revision history
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-03 | Initial matrix. Sprint 1 AC and tests defined; Sprint 2 and 3 allocated only. | Deliverable 1 |
| 1.1 | 2026-11-05 | FR-09 row adds AC-42 and TEST-42; BR-02 mapped to F-02 (defines) and F-03 (enforces); NFR-05 row carries the full target including the order-test item with enough stock | Audit corrections: close the AC-42 traceability gap and align requirement ownership |
| 1.2 | 2026-11-05 | BR-04 adds F-05; BR-06 adds F-06, F-08, F-09 and F-12 with the sprint split; BR-07 adds R-01; BR-13 stays F-05 and R-03 | Align the feature column with the inventory in `docs/features.md` |
| 1.3 | 2026-11-05 | BR-04 AC cell updated with S1/S2 split; BR-06 sprint cell explicitly lists features per sprint (1 (F-04); 2 (F-06, F-08); 3 (F-09, F-12)) | Align BR-04 AC scope and BR-06 sprint allocations with srs.md |
| 1.4 | 2026-11-05 | BR-10 AC cell updated to note verifying AC definition in Sprint 2 contract (F-06) | Align BR-10 traceability note with Sprint 2 contract |
| 1.5 | 2026-11-05 | Record test results for TEST-45 and TEST-46 | Verification of Issue 2 (R-03, NFR-08, BR-13, AC-45, AC-46) |
| 1.6 | 2026-11-06 | NFR-08 quickstart repaired: `.env` co-located with the backend workspace, `prisma generate` runs on install, Express 5 async error propagation, FK indexes added. Re-verified fresh-clone quickstart before keeping NFR-08 PASS | Review fix for PR #9 |
| 1.7 | 2026-11-06 | Record F-01 results: FR-01 to FR-03 and NFR-03/NFR-04 PASS at f222daa (backend) and 097da41 (TEST-09); NFR-07 INCOMPLETE because TEST-44 has no recorded result | Verification of Issue #3 (F-01, AC-01 to AC-09) |
| 1.8 | 2026-11-06 | Record PR #10 Tier 1 review fixes for F-01 (`bb0acb4`, `f45ba47`, `2022899`, `6e68bee`, `83f0337`, and retroactive `TEST-09` red run at `60b5e57` in `9ec70cb`) and mark NFR-07 PASS with `TEST-44` added in `9de7923` | PR #10 review fixes for Issue #3 (F-01) |
| 1.9 | 2026-11-06 | Record F-02 and F-03 results for TEST-10 to TEST-31 at `0f3c649`; BR-07, BR-08 and BR-15 stay `INCOMPLETE` because their TEST-39, TEST-37/38/43 and TEST-34 rows belong to F-04 and ISSUE-3 | Verification of Issue #4 (F-02, F-03, AC-10 to AC-31) |
| 1.10 | 2026-11-07 | Record F-04 verification results: red (failing) test evidence at c04ca45; FR-08, FR-09, BR-06, BR-07, BR-15 PASS at 6d1d2f7 (backend green) and 984ddb9 (UI green); BR-08 and NFR-02 record TEST-37 and TEST-38 while remaining INCOMPLETE pending ISSUE-3 (TEST-43) | Verification of Issue #6 (F-04, AC-32 to AC-42) |
| 1.11 | 2026-11-07 | Update F-04 verification results: red test evidence at a614473; follow-up review fixes PASS at c680623 (UI fix green), 8fe7793 (TEST-40 race barrier & mutation check), 162b413 (types), with updated green evidence files | Review fixes for Issue #6 (F-04) |
| 1.12 | 2026-11-07 | TEST-40 restored to 10 iterations with barrier synchronization and verified PASS against real PostgreSQL at 37cf31f | Verification of TEST-40 contract compliance |
| 1.13 | 2026-11-07 | Record R-01 verification results: TEST-43 red at d7792c8 and green at 8f42cbd; mark BR-08, NFR-01 and NFR-02 PASS; add CHG-02 for the Omazon display brand rename | Verification of Issue #3 (R-01, AC-43/TEST-43) and the display brand rename |
| 1.14 | 2026-11-07 | Deliverable 1 finalisation: TEST-20 is named explicitly in the FR-05 actual-test cell; the TEST-45 and TEST-46 version cells cite the commit that introduced the tests (`c215549`) instead of a branch name | Evidence pack and document assembly (Issue #7) |
| 1.15 | 2026-11-10 | A LOAD-01 baseline was recorded for NFR-05 with 5 runs × 30 s per endpoint at 20 connections on the 500-order seed, citing a commit hash that does not exist in the repository | Early Sprint 1 baseline for NFR-05 (Issue #15); R-04 hardening and the deployed-build measurement stay in Sprint 3 |
| 1.16 | 2026-11-11 | LOAD-01 re-measured at `5c3f984` because the hash cited in 1.15 does not exist in the repository: `GET /api/menu` p95 1 ms at 16,640.3 req/s, `POST /api/orders` p95 40 ms (p90 45 ms, worst 47 ms) at 1,255.1 req/s, zero 5xx — NFR-05 stays `PASS` and `docs/evidence/nfr05/` now carries the run transcript `run-log-5c3f984.txt` | Pre-submission audit: a result that cannot be tied to a revision is not evidence (Issue #18) |
| 1.17 | 2026-11-11 | §5 states the Sprint 1 local baseline for NFR-05 (p95 1 ms and p95 40 ms, zero 5xx at `5c3f984`) and that re-verification on the deployed system is planned for Sprint 3, replacing the statement that NFR-05 was not measurable; the revision rows now read 1.14, 1.15, 1.16, 1.17 in order | §3 marked NFR-05 `PASS` while §5 said it was not measurable, which contradicted the evidence (pre-submission audit, Issue #18) |
| 1.18 | 2026-11-11 | Full suite re-run on `5c3f984` from a clean working tree: backend 85 passed in 16 files, frontend 36 passed in 8 files, 6 Playwright journeys passed, build and typecheck exit 0, no failures and no skipped tests; the logs are `docs/evidence/R-01-green-tests-5c3f984.txt`, `R-01-green-e2e-5c3f984.txt` and `R-01-green-build-5c3f984.txt` | The recorded suite results were tied to `4a37e95`, which is not the revision being submitted (pre-submission audit, Issue #18) |
| 1.19 | 2026-11-12 | FR-04 also cites the TEST-12 component test; FR-05 no longer cites TEST-17 (that test verifies AC-17, which is FR-06); FR-09 marks `OperatorOrders.test.tsx` as supporting component tests because the file has no TEST-nn names; BR-13 and NFR-08 explain why their version cells cite `c215549` only; NFR-05 and NFR-09 carry footnotes; NFR-08 cites the fresh-clone check recorded at `0b2f7d5` | PR #20 review: remove cross-references that do not match the tests, and attach the missing manual evidence for TEST-45 |

### How to use this file
- Sprint 1 test IDs follow the rule **TEST-nn verifies AC-nn** (for example TEST-24 verifies AC-24).
- Fill the **Actual test** and **Result** columns only after running the tests. Record the commit hash in **Version**.
- Result values: `PASS`, `FAIL`, `SKIPPED`, `NOT RUN`, `INCOMPLETE`. Never mark `PASS` for a test that has not been executed.
- Sprint 2 and 3 rows are allocated now. Their AC and tests are written in the sprint contract before implementation.

## 1. Functional requirements

| Requirement | Feature | Sprint | AC / verification target | Planned test | Actual test (file::name) | Result | Version |
|---|---|---|---|---|---|---|---|
| FR-01 | F-01 | 1 | AC-01, AC-02, AC-03, AC-04, AC-09 | TEST-01, 02, 03, 04, 09 | backend/tests/auth.test.ts::TEST-01, ::TEST-02, ::TEST-03, ::TEST-04; frontend/e2e/auth.spec.ts::TEST-09 | PASS | 8398fe2 (red), f222daa (green), bb0acb4 (TEST-03 rounds fix), 83f0337 (TEST-04 72-byte cap), 097da41 (E2E green), 9ec70cb (retroactive red, created after 097da41) |
| FR-02 | F-01 | 1 | AC-06, AC-09 | TEST-06, 09 | backend/tests/auth.test.ts::TEST-06 (seeded session plus supporting login-to-logout test); frontend/e2e/auth.spec.ts::TEST-09 | PASS | 8398fe2 (red; TEST-06 reworked in 05a4f08), f222daa (green), 097da41 (E2E green), 9ec70cb (retroactive red, created after 097da41) |
| FR-03 | F-01 | 1 | AC-05 | TEST-05 | backend/tests/auth.test.ts::TEST-05 | PASS | 8398fe2 (red), f222daa (green), 2022899 (explicit user field projection) |
| FR-04 | F-02 | 1 | AC-10, AC-11, AC-12, AC-13 | TEST-10, 11, 12, 13 | backend/tests/menu.test.ts::TEST-10; backend/src/services/menuRules.test.ts::TEST-11; frontend/e2e/menu.spec.ts::TEST-12 (E2E); frontend/src/pages/Menu.test.tsx::TEST-12-ish (component, supporting), ::TEST-13 | PASS | 140c030 (red), 0f3c649 (green) |
| FR-05 | F-03 | 1 | AC-14, AC-15, AC-16, AC-18, AC-19, AC-20, AC-21, AC-22, AC-23, AC-26, AC-29, AC-30 | TEST-14, 15, 16, 18–23, 26, 29, 30 | backend/tests/orders.create.test.ts::TEST-14, ::TEST-15, ::TEST-16, ::TEST-18, ::TEST-19, ::TEST-20, ::TEST-21, ::TEST-22, ::TEST-23; backend/tests/orders.access.test.ts::TEST-26; frontend/e2e/order.spec.ts::TEST-29; frontend/src/pages/Menu.test.tsx::TEST-30 | PASS | 140c030 (red), 0f3c649 (green) |
| FR-06 | F-03 | 1 | AC-14, AC-17, AC-25, AC-27 | TEST-14, 17, 25, 27 | backend/tests/orders.create.test.ts::TEST-14, ::TEST-17, ::TEST-25; backend/tests/orders.access.test.ts::TEST-27 | PASS | 140c030 (red), 0f3c649 (green) |
| FR-07 | F-03 | 1 | AC-28, AC-31 | TEST-28, 31 | backend/tests/orders.access.test.ts::TEST-28; frontend/src/pages/MyOrders.test.tsx::TEST-31 | PASS | 140c030 (red), 0f3c649 (green) |
| FR-08 | F-04 | 1 | AC-32, AC-33, AC-38, AC-39 | TEST-32, 33, 38, 39 | backend/tests/orders.operator.test.ts::TEST-32, ::TEST-33, ::TEST-38, ::TEST-39 | PASS | c04ca45 (red), 6d1d2f7 (green) |
| FR-09 | F-04 | 1 | AC-34, AC-35, AC-36, AC-37, AC-40, AC-41, AC-42 | TEST-34, TEST-35, TEST-36, TEST-37, TEST-40, TEST-41, TEST-42 | backend/tests/orders.operator.test.ts::TEST-34, ::TEST-35, ::TEST-36, ::TEST-37, ::TEST-40; backend/src/services/orderStateMachine.test.ts::TEST-35; frontend/e2e/operator.spec.ts::TEST-41, ::TEST-42; frontend/src/pages/OperatorOrders.test.tsx (supporting component tests for AC-32/33/34/35/41; the file has no TEST-nn names) | PASS | c04ca45, a614473 (red); 6d1d2f7 (backend green), 984ddb9, c680623, 8fe7793, 162b413, 37cf31f (green) |
| FR-10 | F-05 | 2 | To be defined in Sprint 2 contract | TBD | | NOT RUN | |
| FR-11 | F-06 | 2 | To be defined in Sprint 2 contract | TBD | | NOT RUN | |
| FR-12 | F-08 | 2 | To be defined in Sprint 2 contract | TBD | | NOT RUN | |
| FR-13 | F-07 | 2 | To be defined in Sprint 2 contract | TBD | | NOT RUN | |
| FR-14 | F-09 | 3 | To be defined in Sprint 3 contract | TBD | | NOT RUN | |
| FR-15 | F-10 | 3 | To be defined in Sprint 3 contract | TBD | | NOT RUN | |
| FR-16 | F-11 | 3 | To be defined in Sprint 3 contract | TBD | | NOT RUN | |
| FR-17 | F-12 | 3 | To be defined in Sprint 3 contract | TBD | | NOT RUN | |

## 2. Business rules

| Requirement | Feature | Sprint | AC / verification target | Planned test | Actual test (file::name) | Result | Version |
|---|---|---|---|---|---|---|---|
| BR-01 | F-03 | 1 | AC-18, AC-19 | TEST-18, 19 | backend/src/services/orderRules.test.ts::TEST-18; backend/tests/orders.create.test.ts::TEST-18, ::TEST-19 | PASS | 140c030 (red), 0f3c649 (green) |
| BR-02 | F-02 (defines), F-03 (enforces) | 1 | AC-11, AC-21, AC-22 | TEST-11, 21, 22 | backend/src/services/menuRules.test.ts::TEST-11; backend/tests/orders.create.test.ts::TEST-21, ::TEST-22 | PASS | 140c030 (red), 0f3c649 (green) |
| BR-03 | F-03 | 1 | AC-15, AC-16 | TEST-15, 16 | backend/src/services/orderRules.test.ts::TEST-15; backend/tests/orders.create.test.ts::TEST-15, ::TEST-16 | PASS | 140c030 (red), 0f3c649 (green) |
| BR-04 | F-03, F-05 | 1 (F-03), 2 (F-05) | AC-17 (S1); S2: catalog-edit AC to be defined in the Sprint 2 contract | TEST-17 | backend/tests/orders.create.test.ts::TEST-17 | PASS | 140c030 (red), 0f3c649 (green) |
| BR-05 | F-03 | 1 | AC-23, AC-24, AC-46 | TEST-23, 24, 46 | backend/tests/orders.create.test.ts::TEST-23, ::TEST-24; backend/tests/constraints.test.ts::TEST-46 | PASS | 140c030 (red), 0f3c649 (green) |
| BR-06 | F-04, F-06, F-08, F-09, F-12 | 1 (F-04); 2 (F-06, F-08); 3 (F-09, F-12) | AC-35 (S1 transitions); full machine in Sprint 2 and 3 contracts | TEST-35, then TBD | backend/src/services/orderStateMachine.test.ts::TEST-35; backend/tests/orders.operator.test.ts::TEST-35 | PASS | c04ca45, a614473 (red); 6d1d2f7, c680623, 8fe7793, 37cf31f (green) |
| BR-07 | F-03, F-04, R-01 | 1 | AC-27, AC-28, AC-39 | TEST-27, 28, 39 | backend/tests/orders.access.test.ts::TEST-27, ::TEST-28; backend/tests/orders.operator.test.ts::TEST-39 | PASS | 140c030 (red), 0f3c649 (F-03 green), 6d1d2f7 (F-04 green) |
| BR-08 | F-04, R-01 | 1 | AC-26, AC-37, AC-38, AC-43 | TEST-26, 37, 38, 43 | backend/tests/orders.access.test.ts::TEST-26; backend/tests/orders.operator.test.ts::TEST-37, ::TEST-38; backend/tests/routes.access.test.ts::TEST-43 | PASS | 140c030, c04ca45, d7792c8 (red); 0f3c649, 6d1d2f7, 8f42cbd (green) |
| BR-09 | F-08 | 2 | To be defined in Sprint 2 contract | TBD | | NOT RUN | |
| BR-10 | F-06 | 2 | To be defined in the Sprint 2 contract (F-06) | TBD | | NOT RUN | |
| BR-11 | F-07 | 2 | To be defined in Sprint 2 contract | TBD | | NOT RUN | |
| BR-12 | F-09 | 3 | To be defined in Sprint 3 contract | TBD | | NOT RUN | |
| BR-13 | F-05, R-03 | 1 (DB), 2 (API) | S1: AC-46 (DB constraints). S2: API validation in contract | TEST-46, then TBD | backend/tests/constraints.test.ts::TEST-46 | PASS | c215549 (the CHECK constraints and TEST-46 landed together in the scaffold commit, so no separate red commit exists; the test is re-run green in every later suite log) |
| BR-14 | F-03 | 1 | AC-14 (order number format) | TEST-14 | backend/tests/orders.create.test.ts::TEST-14; backend/src/services/orderRules.test.ts::TEST-15 | PASS | 140c030 (red), 0f3c649 (green) |
| BR-15 | F-03, F-04 | 1 | AC-25, AC-34 | TEST-25, 34 | backend/tests/orders.create.test.ts::TEST-25; backend/tests/orders.operator.test.ts::TEST-34 | PASS | 140c030 (red), 0f3c649 (F-03 green), 6d1d2f7 (F-04 green) |

## 3. Non-functional requirements

| Requirement | Feature / responsibility | Sprint | Target and verification | Planned test | Actual test / measurement | Result | Version |
|---|---|---|---|---|---|---|---|
| NFR-01 | R-01 | 1, extended 2 and 3 | 401 without session on every protected route (AC-43) | TEST-43 | backend/tests/routes.access.test.ts::TEST-43 | PASS | d7792c8 (red), 8f42cbd (green) |
| NFR-02 | R-01 | 1, extended 2 and 3 | 403 for wrong role or non-owner on every protected route (AC-43, AC-27, AC-37, AC-38) | TEST-43, 27, 37, 38 | backend/tests/orders.access.test.ts::TEST-27; backend/tests/orders.operator.test.ts::TEST-37, ::TEST-38; backend/tests/routes.access.test.ts::TEST-43 | PASS | 140c030, c04ca45, d7792c8 (red); 0f3c649, 6d1d2f7, 8f42cbd (green) |
| NFR-03 | F-01 | 1 | bcrypt hash stored; hash never returned (AC-08) | TEST-08 | backend/tests/auth.test.ts::TEST-08; backend/src/services/password.test.ts::TEST-08 | PASS | 8398fe2 (red), f222daa (green), 2022899 (explicit `/me` field projection) |
| NFR-04 | F-01 | 1 | 8-hour expiry (AC-07); logout invalidates at once (AC-06) | TEST-06, 07 | backend/tests/auth.test.ts::TEST-06, ::TEST-07 | PASS | 8398fe2 (red; TEST-06 reworked in 05a4f08), f222daa (green), 6e68bee (expired session deletion on lookup & startup) |
| NFR-05 | R-04 | 3 | p95 ≤ 500 ms and zero 5xx responses for `GET /api/menu` and `POST /api/orders`, measured at 20 concurrent connections for 30 s per endpoint, database seeded with 500 orders plus an order-test item with enough stock for the whole run (NFR-05) | LOAD-01: autocannon script, raw output and tested commit saved (Sprint 3 baseline recorded in Sprint 1) | LOAD-01: `backend/benchmarks/nfr05-load.js` — 5 runs × 30 s per endpoint at 20 connections; `docs/evidence/nfr05/summary.json`, `raw/` and `run-log-5c3f984.txt`. `GET /api/menu` p50 1 ms / p95 1 ms / p99 3-4 ms at 16,640.3 req/s; `POST /api/orders` p50 10-13 ms / p95 37-47 ms / p99 56-72 ms at 1,255.1 req/s; zero 5xx in both | PASS[^nfr05] | 5c3f984 (measured 2026-11-11) |
| NFR-06 | R-05 | 2 | Order survives restart and redeploy (post-deployment check) | CHECK-01 (Sprint 2) | | NOT RUN | |
| NFR-07 | R-02 | 1 | Standard error shape; no stack trace (AC-04, AC-44) | TEST-04, 44 | backend/tests/auth.test.ts::TEST-04; backend/tests/error.test.ts::TEST-44 | PASS | f222daa, 83f0337 (TEST-04); 9de7923 (TEST-44) |
| NFR-08 | R-03 | 1 | Fresh clone in 8 commands or fewer; seed repeatable (AC-45) | TEST-45 | backend/tests/seed.test.ts::TEST-45; manual fresh-clone check at `0b2f7d5` (`docs/evidence/NFR-08-fresh-clone-0b2f7d5.txt` and `.png`) | PASS | c215549 (seed test); 0b2f7d5 (manual fresh-clone check, 2026-11-12) |
| NFR-09 | F-02, F-03, R-04 | 1 partial, 3 complete | Loading, empty and error states (AC-13, AC-30, AC-31 in S1) | TEST-13, 30, 31, then TBD | frontend/src/pages/Menu.test.tsx::TEST-13, ::TEST-30; frontend/src/pages/MyOrders.test.tsx::TEST-31 PASS; the Sprint 1 states are verified, the R-04 final usability pass is Sprint 3 | INCOMPLETE[^nfr09] | 140c030 (red), 0f3c649 (green) |
| NFR-10 | R-05 | 2 | At least 85% service-layer line coverage (coverage report) | COV-01 (Sprint 2) | | NOT RUN | |
| NFR-11 | F-13 | 3 | 429 after 5 failed logins in 15 minutes | TBD (Sprint 3) | | NOT RUN | |

[^nfr05]: The result is a Sprint 1 local baseline, not a deployed measurement: one host, with the API and the load generator on the same machine (Apple M4, macOS) and PostgreSQL 16 in a local Docker container. `docs/evidence/nfr05/README.md` §2 and §5 record the environment and state the single-host limitation. Re-measurement on the deployed build is the Sprint 3 R-04 work.

[^nfr09]: The three Sprint 1 screens (menu, cart/409, my orders) have their loading, empty and error states verified by TEST-13, TEST-30 and TEST-31. The row stays `INCOMPLETE` because NFR-09 also covers the R-04 all-screens usability pass, which is Sprint 3 work.

## 4. Sprint 1 reverse view: AC to test to feature

| AC / TEST | Feature | AC / TEST | Feature | AC / TEST | Feature |
|---|---|---|---|---|---|
| 01–09 | F-01 | 14–31 | F-03 | 43–46 | R-01, R-02, R-03 |
| 10–13 | F-02 | 32–42 | F-04 | | |

Total Sprint 1 AC and tests: 46 each (one test per AC; some tests contain several assertions).

## 5. Coverage gaps

| Item | Status | Plan |
|---|---|---|
| Requirements with no feature or responsibility | None | — |
| Sprint 2 and 3 requirements without AC or tests | Expected: contracts not yet written | AC and STS are written before implementation of each sprint |
| NFR-05, NFR-06, NFR-10, NFR-11 | NFR-05: a Sprint 1 local baseline is measured and recorded — `GET /api/menu` p95 1 ms and `POST /api/orders` p95 40 ms with zero 5xx at 20 connections for 30 s per endpoint (`5c3f984`). NFR-06, NFR-10 and NFR-11 remain not measurable until their sprints | NFR-05 re-verification on the deployed system is planned for Sprint 3, which is the sprint allocation in `docs/srs.md` (R-04 hardening plus the deployed-build measurement). NFR-06 and NFR-11 are Sprint 2 and 3 checks; NFR-10 is the Sprint 2 coverage report. |
| BR-06 full transition table | Only `PENDING → ACCEPTED` is built in Sprint 1 | Remaining transitions are covered in F-06, F-08, F-09, F-12 contracts |

## 6. Approved changes log

| Change ID | Date | Affected requirement / feature | Description | Rationale | Approved by |
|---|---|---|---|---|---|
| CHG-01 | 2026-11-07 | FR-09 / AC-42 / TEST-42 | In-place 403 Forbidden alert rather than redirect on wrong-role navigation (DEC-23, Option A) | Matches ProtectedRoute behavior established in d7ec1c2 | Team decision |
| CHG-02 | 2026-11-07 | Cross-cutting display brand | Rename user-facing brand display name and document titles to Omazon while preserving technical identifiers (DEC-25) | Align user-facing branding with team product name | Team decision |
