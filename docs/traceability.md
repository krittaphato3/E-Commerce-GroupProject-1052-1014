# Omazon — Requirements Traceability Matrix

| Item | Value |
|---|---|
| Document | `docs/traceability.md` |
| Version | 1.30 |
| Date | 2026-11-28 |
| Related | `docs/srs.md`, `docs/features.md`, `docs/sprints/sprint-1/features.md`, `docs/sprints/sprint-2/features.md`, `docs/sprints/sprint-3/features.md` |

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
| 1.20 | 2026-11-12 | NFR-05 records `PASS (S1 baseline)` with p95 40 ms as the run median and 37–47 ms as the run range, matching `docs/evidence/nfr05/summary.json`; the Result vocabulary now allows a scope qualifier so a Sprint 1 baseline is not read as a completed Sprint 3 requirement; FR-04 cites the AC-12 component test as a case without a TEST-nn ID | PR #20 review round 2: a Sprint 3 requirement showed an unqualified `PASS`, the p95 figures in §3 and §5 differed in form, and `TEST-12-ish` is not a real test ID |
| 1.21 | 2026-11-12 | New §4.1 separates the five red-then-green pairs the Definition of Done actually requires from the feature-level red suites, and states that TEST-09's red run is retroactive; new §4.2 records that AC-42 / TEST-42 is a UI-navigation check and that access control is proven by AC-37 / AC-38 (TEST-37, TEST-38) | Review round 3: the Version cells implied every row had a first-failure pair, and the AC-42 row did not say where the security is actually proven (PR #20 review) |
| 1.22 | 2026-11-27 | Sprint 2 contracts added: FR-10 to FR-13, BR-04 (S2 part), BR-06 (S2 part), BR-09, BR-10, BR-11, BR-13 (S2 part), NFR-06 and NFR-10 now name their AC and test IDs; new §4.3 maps AC-47 to AC-92; BR-04, BR-06 and BR-13 read `PASS (S1 only)` because their new Sprint 2 tests are `NOT RUN`; §5 updated | Sprint 2 contracts written before implementation (Issue #53) |
| 1.23 | 2026-11-28 | F-05 implemented and verified (TEST-47 to TEST-57): FR-10, BR-04 and BR-13 updated to `PASS` with test files and red/green evidence (`56fe6f6` retroactive red, `0a339a1` green); §4.3 F-05 row updated to `PASS` | F-05 Catalog management completed (Issue #54, PR #62) |
| 1.24 | 2026-11-28 | F-06 implemented and verified (TEST-58 to TEST-67): FR-11 and BR-10 updated to `PASS`, BR-06 to `PASS (S1 and F-06 only)`; §4.3 records AC-58 to AC-67 with test files; red at `ae84e79`, implementation at `3f1fedf`, full green run at `2998b71`. The first full E2E run, at `3f1fedf`, failed (7 passed, 1 failed: TEST-41) because `cancel.spec.ts` left an order in the shared E2E database; `cancel.spec.ts` now re-seeds after itself and TEST-41 is unchanged | F-06 Customer order cancellation (Issue #55) |
| 1.25 | 2026-11-28 | F-07 implemented and verified (TEST-68 to TEST-76) against contract 1.0 with no contract change: FR-13 and BR-11 updated to `PASS`; the BR-07 row adds F-07 with AC-74 / TEST-74; §4.3 records AC-68 to AC-76 with test files; red at `a221cba`, implementation and full green run at `c46b3bb` | F-07 Simulated payment (Issue #56) |
| 1.26 | 2026-11-28 | F-08 implemented and verified (TEST-77 to TEST-87) against contract 1.0 with no contract change: FR-12 and BR-09 updated to `PASS`; BR-06 updated to `PASS (S1 and S2)`; the BR-08 row adds F-08 with AC-84 / TEST-84 and the BR-15 row adds F-08 with AC-77, AC-78, AC-79 and AC-85; §4.3 records AC-77 to AC-87 with test files; red at `fc72fd4`, implementation and full green run at `7571373` | F-08 Fulfilment workflow (Issue #57) |
| 1.27 | 2026-11-28 | R-05 pre-release work (TEST-88, TEST-90 to TEST-92) against contract 1.0 with no contract change: NFR-10 updated to `PASS (pre-release)` with COV-01 at 97.9% line coverage of `backend/src/services` (560/572, measured at `b1d3f33`, gate-proof run exits non-zero); NFR-01 and NFR-02 add the Sprint 2 extension (TEST-90 to TEST-92; registry red at `6d6f86e`, green at `156eb4d`); §4.3 and §5 updated. NFR-06 (CHECK-01 / TEST-89) stays `NOT RUN` until the release is deployed | R-05 Delivery and quality gates (Issue #58) |
| 1.28 | 2026-11-28 | CHECK-01 (TEST-89) passed on the deployed release `2f6cc46`: NFR-06 and AC-89 updated to `PASS`; the order, its stock effect and the customer1 login were the same after a restart and after a redeploy, each of which created a new revision (`docs/evidence/CHECK-01-2f6cc46.txt`); §3, §4.3 and §5 updated | R-05 post-deployment persistence check (Issue #58) |
| 1.29 | 2026-11-28 | Sprint 3 contracts added: FR-14 to FR-17, BR-06 (S3 part), BR-10 (S3 operator path), BR-12, NFR-05 (S3 part), NFR-09 (S3 part) and NFR-11 now name their AC and test IDs; new §4.4 maps AC-93 to AC-147; every Sprint 3 test is `NOT RUN`; BR-10 reads `PASS (S2 only)` because its new Sprint 3 tests are `NOT RUN`; BR-06, NFR-05 and NFR-09 keep their earlier results for the earlier scope; §5 updated | Sprint 3 contracts written before implementation (Issue #59) |
| 1.30 | 2026-11-28 | F-09 implemented and verified (TEST-93 to TEST-104) against contract 1.2: FR-14 and BR-12 updated to `PASS`; BR-06 updated to `PASS (S1, S2 and F-09)`, with the F-12 tests still `NOT RUN`; NFR-01 and NFR-02 note that TEST-43 and TEST-92 now sweep 14 protected routes; §4.4 records AC-93 to AC-104 with test files; red at `70096cd`, implementation and full green run at `15ea606` | F-09 Order rejection with reason (Issue #59) |

### How to use this file
- Sprint 1 test IDs follow the rule **TEST-nn verifies AC-nn** (for example TEST-24 verifies AC-24).
- Fill the **Actual test** and **Result** columns only after running the tests. Record the commit hash in **Version**.
- Result values: `PASS`, `FAIL`, `SKIPPED`, `NOT RUN`, `INCOMPLETE`. Never mark `PASS` for a test that has not been executed. A `PASS` may carry a scope qualifier in parentheses when the recorded run is narrower than the requirement it verifies — for example `PASS (S1 baseline)` for a Sprint 1 local baseline of a requirement allocated to a later sprint — but the qualifier never replaces the five values above.
- Sprint 2 and 3 rows are allocated now. Their AC and tests are written in the sprint contract before implementation.

## 1. Functional requirements

| Requirement | Feature | Sprint | AC / verification target | Planned test | Actual test (file::name) | Result | Version |
|---|---|---|---|---|---|---|---|
| FR-01 | F-01 | 1 | AC-01, AC-02, AC-03, AC-04, AC-09 | TEST-01, 02, 03, 04, 09 | backend/tests/auth.test.ts::TEST-01, ::TEST-02, ::TEST-03, ::TEST-04; frontend/e2e/auth.spec.ts::TEST-09 | PASS | 8398fe2 (red), f222daa (green), bb0acb4 (TEST-03 rounds fix), 83f0337 (TEST-04 72-byte cap), 097da41 (E2E green), 9ec70cb (retroactive red, created after 097da41) |
| FR-02 | F-01 | 1 | AC-06, AC-09 | TEST-06, 09 | backend/tests/auth.test.ts::TEST-06 (seeded session plus supporting login-to-logout test); frontend/e2e/auth.spec.ts::TEST-09 | PASS | 8398fe2 (red; TEST-06 reworked in 05a4f08), f222daa (green), 097da41 (E2E green), 9ec70cb (retroactive red, created after 097da41) |
| FR-03 | F-01 | 1 | AC-05 | TEST-05 | backend/tests/auth.test.ts::TEST-05 | PASS | 8398fe2 (red), f222daa (green), 2022899 (explicit user field projection) |
| FR-04 | F-02 | 1 | AC-10, AC-11, AC-12, AC-13 | TEST-10, 11, 12, 13 | backend/tests/menu.test.ts::TEST-10; backend/src/services/menuRules.test.ts::TEST-11; frontend/e2e/menu.spec.ts::TEST-12 (E2E); frontend/src/pages/Menu.test.tsx::TEST-13, plus a supporting component test for AC-12 that carries no TEST-nn ID | PASS | 140c030 (red), 0f3c649 (green) |
| FR-05 | F-03 | 1 | AC-14, AC-15, AC-16, AC-18, AC-19, AC-20, AC-21, AC-22, AC-23, AC-26, AC-29, AC-30 | TEST-14, 15, 16, 18–23, 26, 29, 30 | backend/tests/orders.create.test.ts::TEST-14, ::TEST-15, ::TEST-16, ::TEST-18, ::TEST-19, ::TEST-20, ::TEST-21, ::TEST-22, ::TEST-23; backend/tests/orders.access.test.ts::TEST-26; frontend/e2e/order.spec.ts::TEST-29; frontend/src/pages/Menu.test.tsx::TEST-30 | PASS | 140c030 (red), 0f3c649 (green) |
| FR-06 | F-03 | 1 | AC-14, AC-17, AC-25, AC-27 | TEST-14, 17, 25, 27 | backend/tests/orders.create.test.ts::TEST-14, ::TEST-17, ::TEST-25; backend/tests/orders.access.test.ts::TEST-27 | PASS | 140c030 (red), 0f3c649 (green) |
| FR-07 | F-03 | 1 | AC-28, AC-31 | TEST-28, 31 | backend/tests/orders.access.test.ts::TEST-28; frontend/src/pages/MyOrders.test.tsx::TEST-31 | PASS | 140c030 (red), 0f3c649 (green) |
| FR-08 | F-04 | 1 | AC-32, AC-33, AC-38, AC-39 | TEST-32, 33, 38, 39 | backend/tests/orders.operator.test.ts::TEST-32, ::TEST-33, ::TEST-38, ::TEST-39 | PASS | c04ca45 (red), 6d1d2f7 (green) |
| FR-09 | F-04 | 1 | AC-34, AC-35, AC-36, AC-37, AC-40, AC-41, AC-42 | TEST-34, TEST-35, TEST-36, TEST-37, TEST-40, TEST-41, TEST-42 | backend/tests/orders.operator.test.ts::TEST-34, ::TEST-35, ::TEST-36, ::TEST-37, ::TEST-40; backend/src/services/orderStateMachine.test.ts::TEST-35; frontend/e2e/operator.spec.ts::TEST-41, ::TEST-42; frontend/src/pages/OperatorOrders.test.tsx (supporting component tests for AC-32/33/34/35/41; the file has no TEST-nn names) | PASS | c04ca45, a614473 (red); 6d1d2f7 (backend green), 984ddb9, c680623, 8fe7793, 162b413, 37cf31f (green) |
| FR-10 | F-05 | 2 | AC-47, AC-48, AC-49, AC-50, AC-51, AC-52, AC-53, AC-54, AC-55, AC-56, AC-57 | TEST-47 to TEST-57 | backend/tests/menuItems.test.ts::TEST-47, ::TEST-48, ::TEST-49, ::TEST-50, ::TEST-51, ::TEST-52, ::TEST-53, ::TEST-54, ::TEST-55; backend/src/middleware/menuItemSchema.test.ts::TEST-51, ::TEST-52; frontend/src/pages/OperatorMenu.test.tsx::TEST-56; frontend/e2e/catalog.spec.ts::TEST-57 | PASS | 56fe6f6 (retroactive red), 2639138 (green), 0a339a1 (review fix & full green) |
| FR-11 | F-06 | 2 | AC-58, AC-59, AC-60, AC-61, AC-62, AC-63, AC-64, AC-65, AC-66, AC-67 | TEST-58 to TEST-67 | backend/tests/orders.cancel.test.ts::TEST-58, ::TEST-59; backend/src/services/orderStateMachine.test.ts::TEST-60; backend/tests/orders.cancel.test.ts::TEST-61, ::TEST-62, ::TEST-63, ::TEST-64, ::TEST-65; frontend/src/pages/OrderDetail.test.tsx::TEST-66; frontend/e2e/cancel.spec.ts::TEST-67 | PASS | ae84e79 (red); 3f1fedf (green), 2998b71 (full green) |
| FR-12 | F-08 | 2 | AC-77, AC-78, AC-79, AC-80, AC-81, AC-82, AC-83, AC-84, AC-85, AC-86, AC-87 | TEST-77 to TEST-87 | backend/tests/orders.fulfilment.test.ts::TEST-77, ::TEST-78, ::TEST-79, ::TEST-80; backend/src/services/orderStateMachine.test.ts::TEST-81; backend/tests/orders.fulfilment.test.ts::TEST-82, ::TEST-83, ::TEST-84; backend/tests/orders.journey.test.ts::TEST-85; frontend/src/pages/OperatorOrders.test.tsx::TEST-86; frontend/src/pages/OrderDetail.test.tsx::TEST-86; frontend/e2e/fulfilment.spec.ts::TEST-87 | PASS | fc72fd4 (red); 7571373 (green) |
| FR-13 | F-07 | 2 | AC-68, AC-69, AC-70, AC-71, AC-72, AC-73, AC-74, AC-75, AC-76 | TEST-68 to TEST-76 | backend/tests/orders.pay.test.ts::TEST-68, ::TEST-69, ::TEST-70, ::TEST-71, ::TEST-72, ::TEST-73, ::TEST-74; backend/src/services/paymentRules.test.ts::TEST-69; backend/src/middleware/paymentSchema.test.ts::TEST-70; frontend/src/pages/OrderDetail.test.tsx::TEST-75; frontend/e2e/payment.spec.ts::TEST-76 | PASS | a221cba (red); c46b3bb (green) |
| FR-14 | F-09 | 3 | AC-93, AC-94, AC-95, AC-96, AC-97, AC-98, AC-99, AC-100, AC-101, AC-102, AC-103, AC-104 | TEST-93 to TEST-104 | backend/tests/orders.reject.test.ts::TEST-93, ::TEST-94; backend/src/services/orderStateMachine.test.ts::TEST-95; backend/src/middleware/orderRejectSchema.test.ts::TEST-96; backend/tests/orders.reject.test.ts::TEST-97, ::TEST-98, ::TEST-99, ::TEST-100, ::TEST-101; frontend/src/pages/OperatorOrders.test.tsx::TEST-102; frontend/src/pages/OrderDetail.test.tsx::TEST-103; frontend/e2e/reject.spec.ts::TEST-104 | PASS | 70096cd (red); 15ea606 (green) |
| FR-15 | F-10 | 3 | AC-105, AC-106, AC-107, AC-108, AC-109, AC-110, AC-111, AC-112, AC-113, AC-114, AC-115 | TEST-105 to TEST-115 | | NOT RUN | |
| FR-16 | F-11 | 3 | AC-116, AC-117, AC-118, AC-119, AC-120, AC-121, AC-122, AC-123 | TEST-116 to TEST-123 | | NOT RUN | |
| FR-17 | F-12 | 3 | AC-124, AC-125, AC-126, AC-127, AC-128, AC-129, AC-130, AC-131, AC-132, AC-133, AC-134, AC-135 | TEST-124 to TEST-135 | | NOT RUN | |

## 2. Business rules

| Requirement | Feature | Sprint | AC / verification target | Planned test | Actual test (file::name) | Result | Version |
|---|---|---|---|---|---|---|---|
| BR-01 | F-03 | 1 | AC-18, AC-19 | TEST-18, 19 | backend/src/services/orderRules.test.ts::TEST-18; backend/tests/orders.create.test.ts::TEST-18, ::TEST-19 | PASS | 140c030 (red), 0f3c649 (green) |
| BR-02 | F-02 (defines), F-03 (enforces) | 1 | AC-11, AC-21, AC-22 | TEST-11, 21, 22 | backend/src/services/menuRules.test.ts::TEST-11; backend/tests/orders.create.test.ts::TEST-21, ::TEST-22 | PASS | 140c030 (red), 0f3c649 (green) |
| BR-03 | F-03 | 1 | AC-15, AC-16 | TEST-15, 16 | backend/src/services/orderRules.test.ts::TEST-15; backend/tests/orders.create.test.ts::TEST-15, ::TEST-16 | PASS | 140c030 (red), 0f3c649 (green) |
| BR-04 | F-03, F-05 | 1 (F-03), 2 (F-05) | AC-17 (S1); AC-50 (S2 catalog edits) | TEST-17; TEST-50 (S2) | backend/tests/orders.create.test.ts::TEST-17; backend/tests/menuItems.test.ts::TEST-50 | PASS | 140c030 (S1 red), 0f3c649 (S1 green); 56fe6f6 (S2 retroactive red), 2639138 (S2 green), 0a339a1 (full green) |
| BR-05 | F-03 | 1 | AC-23, AC-24, AC-46 | TEST-23, 24, 46 | backend/tests/orders.create.test.ts::TEST-23, ::TEST-24; backend/tests/constraints.test.ts::TEST-46 | PASS | 140c030 (red), 0f3c649 (green) |
| BR-06 | F-04, F-06, F-08, F-09, F-12 | 1 (F-04); 2 (F-06, F-08); 3 (F-09, F-12) | AC-35 (S1 transitions); S2: AC-60, AC-61, AC-63, AC-77, AC-78, AC-79, AC-81, AC-82, AC-83; S3: AC-95, AC-97, AC-98, AC-99 (F-09); AC-127, AC-128, AC-129, AC-130, AC-131 (F-12) | TEST-35; TEST-60, 61, 63 (S2 F-06); TEST-77–79, 81–83 (S2 F-08); TEST-95, 97, 98, 99 (S3 F-09); TEST-127–131 (S3 F-12): NOT RUN | backend/src/services/orderStateMachine.test.ts::TEST-35; backend/tests/orders.operator.test.ts::TEST-35; backend/src/services/orderStateMachine.test.ts::TEST-60; backend/tests/orders.cancel.test.ts::TEST-61, ::TEST-63; backend/tests/orders.fulfilment.test.ts::TEST-77, ::TEST-78, ::TEST-79; backend/src/services/orderStateMachine.test.ts::TEST-81; backend/tests/orders.fulfilment.test.ts::TEST-82, ::TEST-83; backend/src/services/orderStateMachine.test.ts::TEST-95; backend/tests/orders.reject.test.ts::TEST-97, ::TEST-98, ::TEST-99 | PASS (S1, S2 and F-09) | c04ca45, a614473 (red); 6d1d2f7, c680623, 8fe7793, 37cf31f (S1 green); ae84e79 (F-06 red); 3f1fedf (F-06 green), 2998b71 (full green); fc72fd4 (F-08 red); 7571373 (F-08 green); 70096cd (F-09 red); 15ea606 (F-09 green) |
| BR-07 | F-03, F-04, R-01, F-07 | 1; 2 (F-07) | AC-27, AC-28, AC-39; S2 (F-07): AC-74 | TEST-27, 28, 39; TEST-74 (S2 F-07) | backend/tests/orders.access.test.ts::TEST-27, ::TEST-28; backend/tests/orders.operator.test.ts::TEST-39; backend/tests/orders.pay.test.ts::TEST-74 | PASS | 140c030 (red), 0f3c649 (F-03 green), 6d1d2f7 (F-04 green); a221cba (F-07 red), c46b3bb (F-07 green) |
| BR-08 | F-04, R-01, F-08 | 1; 2 (F-08) | AC-26, AC-37, AC-38, AC-43; S2 (F-08): AC-84 | TEST-26, 37, 38, 43; TEST-84 (S2 F-08) | backend/tests/orders.access.test.ts::TEST-26; backend/tests/orders.operator.test.ts::TEST-37, ::TEST-38; backend/tests/routes.access.test.ts::TEST-43; backend/tests/orders.fulfilment.test.ts::TEST-84 | PASS | 140c030, c04ca45, d7792c8 (red); 0f3c649, 6d1d2f7, 8f42cbd (green); fc72fd4 (F-08 red), 7571373 (F-08 green) |
| BR-09 | F-08 | 2 | AC-80, AC-86 | TEST-80, 86 | backend/tests/orders.fulfilment.test.ts::TEST-80; frontend/src/pages/OperatorOrders.test.tsx::TEST-86 | PASS | fc72fd4 (red); 7571373 (green) |
| BR-10 | F-06, F-12 | 2 (F-06); 3 (F-12) | AC-58, AC-59, AC-60, AC-61, AC-62, AC-63; S3 operator path: AC-127, AC-128, AC-129 | TEST-58 to TEST-63; TEST-127, 128, 129 (S3 F-12): NOT RUN | backend/tests/orders.cancel.test.ts::TEST-58, ::TEST-59; backend/src/services/orderStateMachine.test.ts::TEST-60; backend/tests/orders.cancel.test.ts::TEST-61, ::TEST-62, ::TEST-63 | PASS (S2 only) | ae84e79 (red); 3f1fedf (green), 2998b71 (full green) |
| BR-11 | F-07 | 2 | AC-68, AC-69, AC-70, AC-71, AC-72, AC-73, AC-74 | TEST-68 to TEST-74 | backend/tests/orders.pay.test.ts::TEST-68, ::TEST-69; backend/src/services/paymentRules.test.ts::TEST-69; backend/src/middleware/paymentSchema.test.ts::TEST-70; backend/tests/orders.pay.test.ts::TEST-70, ::TEST-71, ::TEST-72, ::TEST-73, ::TEST-74 | PASS | a221cba (red); c46b3bb (green) |
| BR-12 | F-09 | 3 | AC-93, AC-96, AC-100, AC-102 | TEST-93, 96, 100, 102 | backend/tests/orders.reject.test.ts::TEST-93, ::TEST-100; backend/src/middleware/orderRejectSchema.test.ts::TEST-96; frontend/src/pages/OperatorOrders.test.tsx::TEST-102 | PASS | 70096cd (red); 15ea606 (green) |
| BR-13 | F-05, R-03 | 1 (DB), 2 (API) | S1: AC-46 (DB constraints). S2: AC-51, AC-52 (API validation) | TEST-46; TEST-51, 52 (S2) | backend/tests/constraints.test.ts::TEST-46; backend/src/middleware/menuItemSchema.test.ts::TEST-51, ::TEST-52; backend/tests/menuItems.test.ts::TEST-51, ::TEST-52 | PASS | c215549 (S1 CHECK + TEST-46); 56fe6f6 (S2 retroactive red), 2639138 (S2 green), 0a339a1 (full green) |
| BR-14 | F-03 | 1 | AC-14 (order number format) | TEST-14 | backend/tests/orders.create.test.ts::TEST-14; backend/src/services/orderRules.test.ts::TEST-15 | PASS | 140c030 (red), 0f3c649 (green) |
| BR-15 | F-03, F-04, F-08 | 1; 2 (F-08) | AC-25, AC-34; S2 (F-08): AC-77, AC-78, AC-79, AC-85 | TEST-25, 34; TEST-77, 78, 79, 85 (S2 F-08) | backend/tests/orders.create.test.ts::TEST-25; backend/tests/orders.operator.test.ts::TEST-34; backend/tests/orders.fulfilment.test.ts::TEST-77, ::TEST-78, ::TEST-79; backend/tests/orders.journey.test.ts::TEST-85 | PASS | 140c030 (red), 0f3c649 (F-03 green), 6d1d2f7 (F-04 green); fc72fd4 (F-08 red), 7571373 (F-08 green) |

## 3. Non-functional requirements

| Requirement | Feature / responsibility | Sprint | Target and verification | Planned test | Actual test / measurement | Result | Version |
|---|---|---|---|---|---|---|---|
| NFR-01 | R-01 | 1, extended 2 and 3 | 401 without session on every protected route (AC-43; Sprint 2: AC-90 to AC-92) | TEST-43, 90, 91, 92 | backend/tests/routes.access.test.ts::TEST-43, ::TEST-92; backend/tests/routes.registry.test.ts::TEST-90, ::TEST-91; F-09: TEST-43 and TEST-92 sweep 14 protected routes, including reject | PASS | d7792c8 (red), 8f42cbd (green); 6d6f86e (R-05 red: TEST-90, TEST-91), 156eb4d (green), c15965e (full run); 70096cd (F-09 red), 15ea606 (F-09 green) |
| NFR-02 | R-01 | 1, extended 2 and 3 | 403 for wrong role or non-owner on every protected route (AC-43, AC-27, AC-37, AC-38; Sprint 2: AC-90 to AC-92) | TEST-43, 27, 37, 38, 90, 91, 92 | backend/tests/orders.access.test.ts::TEST-27; backend/tests/orders.operator.test.ts::TEST-37, ::TEST-38; backend/tests/routes.access.test.ts::TEST-43, ::TEST-92; backend/tests/routes.registry.test.ts::TEST-90, ::TEST-91; F-09: TEST-43 and TEST-92 sweep 14 protected routes, including reject | PASS | 140c030, c04ca45, d7792c8 (red); 0f3c649, 6d1d2f7, 8f42cbd (green); 6d6f86e (R-05 red: TEST-90, TEST-91), 156eb4d (green), c15965e (full run); 70096cd (F-09 red), 15ea606 (F-09 green) |
| NFR-03 | F-01 | 1 | bcrypt hash stored; hash never returned (AC-08) | TEST-08 | backend/tests/auth.test.ts::TEST-08; backend/src/services/password.test.ts::TEST-08 | PASS | 8398fe2 (red), f222daa (green), 2022899 (explicit `/me` field projection) |
| NFR-04 | F-01 | 1 | 8-hour expiry (AC-07); logout invalidates at once (AC-06) | TEST-06, 07 | backend/tests/auth.test.ts::TEST-06, ::TEST-07 | PASS | 8398fe2 (red; TEST-06 reworked in 05a4f08), f222daa (green), 6e68bee (expired session deletion on lookup & startup) |
| NFR-05 | R-04 | 3 | p95 ≤ 500 ms and zero 5xx responses for `GET /api/menu` and `POST /api/orders`, measured at 20 concurrent connections for 30 s per endpoint, database seeded with 500 orders plus an order-test item with enough stock for the whole run (NFR-05). Sprint 3: deployed re-measurement (AC-144) | LOAD-01: autocannon script, raw output and tested commit saved (Sprint 3 baseline recorded in Sprint 1); S3: TEST-144 (LOAD-02): NOT RUN | LOAD-01: `backend/benchmarks/nfr05-load.js` — 5 runs × 30 s per endpoint at 20 connections; `docs/evidence/nfr05/summary.json`, `raw/` and `run-log-5c3f984.txt`. `GET /api/menu` p50 1 ms / p95 1 ms / p99 3-4 ms at 16,640.3 req/s; `POST /api/orders` p50 10-13 ms / p95 40 ms (run range 37–47 ms) / p99 56-72 ms at 1,255.1 req/s; zero 5xx in both | PASS (S1 baseline)[^nfr05] | 5c3f984 (measured 2026-11-11) |
| NFR-06 | R-05 | 2 | Order survives restart and redeploy (AC-89) | TEST-89 (CHECK-01) | CHECK-01: `docs/evidence/CHECK-01-2f6cc46.txt` (post-deployment check on release `2f6cc46`) | PASS | 2f6cc46 (release) |
| NFR-07 | R-02 | 1 | Standard error shape; no stack trace (AC-04, AC-44) | TEST-04, 44 | backend/tests/auth.test.ts::TEST-04; backend/tests/error.test.ts::TEST-44 | PASS | f222daa, 83f0337 (TEST-04); 9de7923 (TEST-44) |
| NFR-08 | R-03 | 1 | Fresh clone in 8 commands or fewer; seed repeatable (AC-45) | TEST-45 | backend/tests/seed.test.ts::TEST-45; manual fresh-clone check at `0b2f7d5` (`docs/evidence/NFR-08-fresh-clone-0b2f7d5.txt` and `.png`) | PASS | c215549 (seed test); 0b2f7d5 (manual fresh-clone check, 2026-11-12) |
| NFR-09 | F-02, F-03, R-04 | 1 partial, 3 complete | Loading, empty and error states (AC-13, AC-30, AC-31 in S1; AC-145, AC-146, AC-147 in S3) | TEST-13, 30, 31; S3: TEST-145, 146, 147 (NOT RUN) | frontend/src/pages/Menu.test.tsx::TEST-13, ::TEST-30; frontend/src/pages/MyOrders.test.tsx::TEST-31 PASS; the Sprint 1 states are verified, the R-04 final usability pass is Sprint 3 | INCOMPLETE[^nfr09] | 140c030 (red), 0f3c649 (green) |
| NFR-10 | R-05 | 2 | At least 85% service-layer line coverage, enforced in CI (AC-88) | TEST-88 (COV-01) | COV-01: `npm run coverage --workspace=backend` in `.github/workflows/ci.yml` and `ci-docker.yml` (`test-and-docker`); 97.9% lines (560/572) over all 8 files of `backend/src/services`; gate proof with threshold 99 exits 1. `docs/evidence/COV-01-b1d3f33.txt`, `COV-01-gate-proof-b1d3f33.txt`. The release commit on `main` is not yet measured | PASS (pre-release) | b1d3f33 (gate and measurement), c15965e (full run) |
| NFR-11 | F-13 | 3 | 429 after 5 failed logins in 15 minutes (AC-136 to AC-143) | TEST-136 to TEST-143 | | NOT RUN | |

[^nfr05]: The result is a Sprint 1 local baseline, not a deployed measurement: one host, with the API and the load generator on the same machine (Apple M4, macOS) and PostgreSQL 16 in a local Docker container. `docs/evidence/nfr05/README.md` §2 and §5 record the environment and state the single-host limitation. Re-measurement on the deployed build is the Sprint 3 R-04 work.

[^nfr09]: The three Sprint 1 screens (menu, cart/409, my orders) have their loading, empty and error states verified by TEST-13, TEST-30 and TEST-31. The row stays `INCOMPLETE` because NFR-09 also covers the R-04 all-screens usability pass, which is Sprint 3 work.

## 4. Sprint 1 reverse view: AC to test to feature

| AC / TEST | Feature | AC / TEST | Feature | AC / TEST | Feature |
|---|---|---|---|---|---|
| 01–09 | F-01 | 14–31 | F-03 | 43–46 | R-01, R-02, R-03 |
| 10–13 | F-02 | 32–42 | F-04 | | |

Total Sprint 1 AC and tests: 46 each (one test per AC; some tests contain several assertions).

### 4.1 Which rows have a genuine red-then-green pair
The Definition of Done (item 4 in `docs/sprints/sprint-1/features.md` §2) requires a seen-failing-then-passing pair for **five** tests only, as listed in the feature DoDs (§7, §9, §10, §11):

| Test | Red | Green | Where the DoD requires it |
|---|---|---|---|
| TEST-06 (logout invalidates the session) | `8398fe2` (also `05a4f08`) | `f222daa` | F-01 DoD |
| TEST-24 (concurrent last unit) | `140c030` | `0f3c649` | F-03 DoD |
| TEST-35 (invalid transition) | `c04ca45`, `a614473` | `6d1d2f7` | F-04 DoD |
| TEST-40 (double accept) | `c04ca45`, `a614473` | `37cf31f` | F-04 DoD |
| TEST-43 (route access sweep) | `d7792c8` | `8f42cbd` | R-01 DoD (`§11`) |

Where a Version cell also shows a red commit for another test (for example `140c030` on FR-04, or `c04ca45` on FR-08), that is the feature-level red suite: the test failed on the unfixed code, but the DoD does not require a separate red commit for it.

**TEST-09 is retroactive.** Its red run at `60b5e57` (kept in `9ec70cb`) was created after TEST-09 had already passed at `097da41`, so it is not a genuine first failure and it is not counted as TDD evidence. F-01's DoD evidence rests on TEST-06; TEST-09's own proof is the passing E2E log at `097da41`.

### 4.2 AC-42 / TEST-42 is a UI-navigation check
TEST-42 asserts that a Customer opening `/operator/orders` sees the in-place 403 alert and no operator table. That is a rendering requirement (CHG-01 / DEC-23 Option A), not a security control: the actual access control is enforced by the API and proven by AC-37 and AC-38 (`TEST-37` in `backend/tests/orders.operator.test.ts`, `TEST-38` in `backend/tests/orders.access.test.ts`), and every protected route is swept by AC-43 (`TEST-43`).

### 4.3 Sprint 2 reverse view
Defined in `docs/sprints/sprint-2/features.md`. TEST-nn verifies AC-nn.

| AC / TEST | Feature | Requirements | Result |
|---|---|---|---|
| 47–57 | F-05 | FR-10, BR-04, BR-13 | PASS |
| 58–67 | F-06 | FR-11, BR-06, BR-10 | PASS |
| 68–76 | F-07 | FR-13, BR-11 | PASS |
| 77–87 | F-08 | FR-12, BR-06, BR-09 | PASS |
| 88 (COV-01) | R-05 | NFR-10 | PASS (pre-release) |
| 89 (CHECK-01) | R-05 | NFR-06 | PASS |
| 90–92 | R-05, R-01 extension | NFR-01, NFR-02 | PASS |

Total Sprint 2 AC and test IDs: 46 each. The `PASS` on the NFR-01 and NFR-02 rows in §3 covers the Sprint 1 routes and the Sprint 2 extension (AC-90 to AC-92). For BR-08, the F-08 access check (AC-84) is `PASS`; the F-05 check (AC-55) is not yet listed on the BR-08 row. The Sprint 2 access checks of BR-07 are `PASS` for cancel (AC-65, F-06) and pay (AC-74, F-07).

#### F-06 results by test

Red is the tests-only commit `ae84e79`. Green is the implementation commit `3f1fedf`, with the full run recorded at `2998b71`. Evidence: `F-06-red-ae84e79.txt` and `F-06-green-2998b71.txt`, `F-06-green-build-2998b71.txt`, `F-06-green-e2e-2998b71.txt` in `docs/evidence/`.

| AC | Actual test | Result | Red | Green |
|---|---|---|---|---|
| AC-58 | `backend/tests/orders.cancel.test.ts::TEST-58` | PASS | `ae84e79` | `3f1fedf`, `2998b71` |
| AC-59 | `backend/tests/orders.cancel.test.ts::TEST-59` | PASS | `ae84e79` | `3f1fedf`, `2998b71` |
| AC-60 | `backend/src/services/orderStateMachine.test.ts::TEST-60` | PASS | `ae84e79` (only the `PENDING` case failed; the 6 rejection cases already passed) | `3f1fedf`, `2998b71` |
| AC-61 | `backend/tests/orders.cancel.test.ts::TEST-61` | PASS | `ae84e79` | `3f1fedf`, `2998b71` |
| AC-62 | `backend/tests/orders.cancel.test.ts::TEST-62` | PASS | `ae84e79` | `3f1fedf`, `2998b71` |
| AC-63 | `backend/tests/orders.cancel.test.ts::TEST-63` | PASS | `ae84e79` | `3f1fedf`, `2998b71` |
| AC-64 | `backend/tests/orders.cancel.test.ts::TEST-64` | PASS | `ae84e79` | `3f1fedf`, `2998b71` |
| AC-65 | `backend/tests/orders.cancel.test.ts::TEST-65` | PASS | `ae84e79` | `3f1fedf`, `2998b71` |
| AC-66 | `frontend/src/pages/OrderDetail.test.tsx::TEST-66` | PASS | `ae84e79` | `3f1fedf`, `2998b71` |
| AC-67 | `frontend/e2e/cancel.spec.ts::TEST-67` | PASS | `ae84e79` | `3f1fedf`, `2998b71` |

#### F-07 results by test

Red is the tests-only commit `a221cba`. Green is the implementation commit `c46b3bb`, with the full run recorded at the same commit. Evidence: `F-07-red-a221cba.txt` and `F-07-green-c46b3bb.txt`, `F-07-green-build-c46b3bb.txt`, `F-07-green-e2e-c46b3bb.txt` in `docs/evidence/`. At red, the unit cases of TEST-69 failed because `paymentRules.ts` did not exist; TEST-73 failed with `[404, 404]` instead of `[200, 409]`.

| AC | Actual test | Result | Red | Green |
|---|---|---|---|---|
| AC-68 | `backend/tests/orders.pay.test.ts::TEST-68` | PASS | `a221cba` | `c46b3bb` |
| AC-69 | `backend/src/services/paymentRules.test.ts::TEST-69`; `backend/tests/orders.pay.test.ts::TEST-69` | PASS | `a221cba` | `c46b3bb` |
| AC-70 | `backend/src/middleware/paymentSchema.test.ts::TEST-70`; `backend/tests/orders.pay.test.ts::TEST-70` | PASS | `a221cba` | `c46b3bb` |
| AC-71 | `backend/tests/orders.pay.test.ts::TEST-71` | PASS | `a221cba` | `c46b3bb` |
| AC-72 | `backend/tests/orders.pay.test.ts::TEST-72` | PASS | `a221cba` | `c46b3bb` |
| AC-73 | `backend/tests/orders.pay.test.ts::TEST-73` | PASS | `a221cba` | `c46b3bb` |
| AC-74 | `backend/tests/orders.pay.test.ts::TEST-74` | PASS | `a221cba` | `c46b3bb` |
| AC-75 | `frontend/src/pages/OrderDetail.test.tsx::TEST-75` | PASS | `a221cba` | `c46b3bb` |
| AC-76 | `frontend/e2e/payment.spec.ts::TEST-76` | PASS | `a221cba` | `c46b3bb` |

#### F-08 results by test

Red is the tests-only commit `fc72fd4`. Green is the implementation commit `7571373`, with the full run recorded at the same commit: backend 211 passed, frontend 71 passed, 10 Playwright journeys passed, no failures and no skipped tests. Evidence: `F-08-red-fc72fd4.txt` and `F-08-green-7571373.txt`, `F-08-green-build-7571373.txt`, `F-08-green-e2e-7571373.txt`, `F-08-api-unpaid-409-customer-403-7571373.txt` in `docs/evidence/`. TEST-43 covers the three new routes (13 protected, 18 mounted). TEST-35 and TEST-60 pass unchanged. The backend coverage gate does not exist yet (R-05), so coverage was not measured.

| AC | Actual test | Result | Red | Green |
|---|---|---|---|---|
| AC-77 | `backend/tests/orders.fulfilment.test.ts::TEST-77` | PASS | `fc72fd4` | `7571373` |
| AC-78 | `backend/tests/orders.fulfilment.test.ts::TEST-78` | PASS | `fc72fd4` | `7571373` |
| AC-79 | `backend/tests/orders.fulfilment.test.ts::TEST-79` | PASS | `fc72fd4` | `7571373` |
| AC-80 | `backend/tests/orders.fulfilment.test.ts::TEST-80` | PASS | `fc72fd4` | `7571373` |
| AC-81 | `backend/src/services/orderStateMachine.test.ts::TEST-81` | PASS | `fc72fd4` (the 3 new pairs failed; the other 46 pairs and the table-shape case already passed) | `7571373` |
| AC-82 | `backend/tests/orders.fulfilment.test.ts::TEST-82` | PASS | `fc72fd4` | `7571373` |
| AC-83 | `backend/tests/orders.fulfilment.test.ts::TEST-83` | PASS | `fc72fd4` | `7571373` |
| AC-84 | `backend/tests/orders.fulfilment.test.ts::TEST-84` | PASS | `fc72fd4` | `7571373` |
| AC-85 | `backend/tests/orders.journey.test.ts::TEST-85` | PASS | `fc72fd4` | `7571373` |
| AC-86 | `frontend/src/pages/OperatorOrders.test.tsx::TEST-86`; `frontend/src/pages/OrderDetail.test.tsx::TEST-86` | PASS | `fc72fd4` (the 12 operator cases failed; the 5 order detail cases already passed because that page already showed status and history) | `7571373` |
| AC-87 | `frontend/e2e/fulfilment.spec.ts::TEST-87` | PASS | `fc72fd4` | `7571373` |

#### R-05 results by test

Evidence: `R-05-red-6d6f86e.txt`, `R-05-green-c15965e.txt`, `R-05-green-e2e-c15965e.txt`, `COV-01-b1d3f33.txt` and `COV-01-gate-proof-b1d3f33.txt` in `docs/evidence/`. Full run at `c15965e`: backend 214 passed, frontend 71 passed, 10 Playwright journeys passed, no failures and no skipped tests. TEST-92 has no red run: it verifies guards that F-05 to F-08 had already shipped, so it passed on its first run at `6d6f86e`.

| AC | Actual test | Result | Red | Green |
|---|---|---|---|---|
| AC-88 | `.github/workflows/ci.yml` and `ci-docker.yml` coverage step::COV-01 | PASS (pre-release) | Gate proof: non-zero exit at threshold 99 (`b1d3f33`) | `b1d3f33` |
| AC-89 | `docs/evidence/CHECK-01-2f6cc46.txt`::CHECK-01 | PASS | None (post-deployment check) | `2f6cc46` (release) |
| AC-90 | `backend/tests/routes.registry.test.ts::TEST-90` | PASS | `6d6f86e` | `156eb4d`, `c15965e` |
| AC-91 | `backend/tests/routes.registry.test.ts::TEST-91` | PASS | `6d6f86e` | `156eb4d`, `c15965e` |
| AC-92 | `backend/tests/routes.access.test.ts::TEST-92` (runs with `::TEST-43`) | PASS | None (see above) | `156eb4d`, `c15965e` |

### 4.4 Sprint 3 reverse view
Defined in `docs/sprints/sprint-3/features.md`. TEST-nn verifies AC-nn.

| AC / TEST | Feature | Requirements | Result |
|---|---|---|---|
| 93–104 | F-09 | FR-14, BR-06, BR-12 | PASS |
| 105–115 | F-10 | FR-15 | NOT RUN |
| 116–123 | F-11 | FR-16 | NOT RUN |
| 124–135 | F-12 | FR-17, BR-06, BR-10 | NOT RUN |
| 136–143 | F-13 | NFR-11 | NOT RUN |
| 144–147 (TEST-144 is LOAD-02, TEST-146 is UI-CHECK-01) | R-04 | NFR-05, NFR-09 | NOT RUN |

Total Sprint 3 AC and test IDs: 55 each.

#### F-09 results by test

Red is the tests-only commit `70096cd`. Green is the implementation commit `15ea606`, with the full run recorded at the same commit: backend 242 passed, frontend 89 passed, 11 Playwright journeys passed, no failures and no skipped tests. Service line coverage is 97.79% (COV-01 gate 85%). At red: backend 26 failed and 216 passed, frontend 18 failed and 71 passed, and TEST-104 failed. The pinned Sprint 2 and Sprint 1 tests listed in contract §2.1 (TEST-43, TEST-92, TEST-81, TEST-86) also failed at red and pass at green. Evidence: `F-09-red-70096cd.txt` and `F-09-green-15ea606.txt`, `F-09-green-build-15ea606.txt`, `F-09-green-e2e-15ea606.txt`, `F-09-api-customer-403-short-reason-400-15ea606.txt` and the `F-09-*.png` screenshots in `docs/evidence/`.

| AC | Actual test | Result | Red | Green |
|---|---|---|---|---|
| AC-93 | `backend/tests/orders.reject.test.ts::TEST-93` | PASS | `70096cd` | `15ea606` |
| AC-94 | `backend/tests/orders.reject.test.ts::TEST-94` | PASS | `70096cd` | `15ea606` |
| AC-95 | `backend/src/services/orderStateMachine.test.ts::TEST-95` | PASS | `70096cd` (only the `PENDING` case failed; the 6 rejection cases already passed) | `15ea606` |
| AC-96 | `backend/src/middleware/orderRejectSchema.test.ts::TEST-96` | PASS | `70096cd` | `15ea606` |
| AC-97 | `backend/tests/orders.reject.test.ts::TEST-97` | PASS | `70096cd` | `15ea606` |
| AC-98 | `backend/tests/orders.reject.test.ts::TEST-98` | PASS | `70096cd` | `15ea606` |
| AC-99 | `backend/tests/orders.reject.test.ts::TEST-99` | PASS | `70096cd` | `15ea606` |
| AC-100 | `backend/tests/orders.reject.test.ts::TEST-100` | PASS | `70096cd` | `15ea606` |
| AC-101 | `backend/tests/orders.reject.test.ts::TEST-101` | PASS | `70096cd` | `15ea606` |
| AC-102 | `frontend/src/pages/OperatorOrders.test.tsx::TEST-102` | PASS | `70096cd` | `15ea606` |
| AC-103 | `frontend/src/pages/OrderDetail.test.tsx::TEST-103` | PASS | `70096cd` (the 2 rejected-order cases failed; the "no reason line" case already passed) | `15ea606` |
| AC-104 | `frontend/e2e/reject.spec.ts::TEST-104` | PASS | `70096cd` | `15ea606` |

## 5. Coverage gaps

| Item | Status | Plan |
|---|---|---|
| Requirements with no feature or responsibility | None | — |
| Sprint 2 and 3 requirements without AC or tests | None: Sprint 2 contracts (§4.3) and Sprint 3 contracts (§4.4) are written. F-09 tests pass; the other Sprint 3 tests are `NOT RUN` | AC and STS are written before implementation of each sprint |
| NFR-05, NFR-06, NFR-10, NFR-11 | NFR-05: a Sprint 1 local baseline is measured and recorded — `GET /api/menu` p95 1 ms and `POST /api/orders` p95 40 ms (run range 37–47 ms, the same figures as §3) with zero 5xx at 20 connections for 30 s per endpoint (`5c3f984`). NFR-10 is measured before release (COV-01, §4.3); NFR-06 passed CHECK-01 on release `2f6cc46` (`docs/evidence/CHECK-01-2f6cc46.txt`); NFR-11 has AC and tests (AC-136 to AC-143) that are `NOT RUN` until F-13 is implemented | NFR-05 re-verification on the deployed system is planned for Sprint 3, which is the sprint allocation in `docs/srs.md` (R-04 hardening plus the deployed-build measurement). NFR-06 (CHECK-01) and NFR-10 (COV-01) are Sprint 2 checks; NFR-11 is Sprint 3. |
| BR-06 full transition table | `PENDING → ACCEPTED` (Sprint 1), `PENDING → CANCELLED` (F-06) and `ACCEPTED → PREPARING → READY → COMPLETED` (F-08) and `PENDING → REJECTED` (F-09) are built | `ACCEPTED → CANCELLED` (F-12, AC-127) is contracted and not yet built |

## 6. Approved changes log

| Change ID | Date | Affected requirement / feature | Description | Rationale | Approved by |
|---|---|---|---|---|---|
| CHG-01 | 2026-11-07 | FR-09 / AC-42 / TEST-42 | In-place 403 Forbidden alert rather than redirect on wrong-role navigation (DEC-23, Option A) | Matches ProtectedRoute behavior established in d7ec1c2 | Team decision |
| CHG-02 | 2026-11-07 | Cross-cutting display brand | Rename user-facing brand display name and document titles to Omazon while preserving technical identifiers (DEC-25) | Align user-facing branding with team product name | Team decision |
