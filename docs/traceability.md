# CampusBites — Requirements Traceability Matrix

| Item | Value |
|---|---|
| Document | `docs/traceability.md` |
| Version | 1.5 |
| Date | 2026-11-05 |
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

### How to use this file
- Sprint 1 test IDs follow the rule **TEST-nn verifies AC-nn** (for example TEST-24 verifies AC-24).
- Fill the **Actual test** and **Result** columns only after running the tests. Record the commit hash in **Version**.
- Result values: `PASS`, `FAIL`, `SKIPPED`, `NOT RUN`, `INCOMPLETE`. Never mark `PASS` for a test that has not been executed.
- Sprint 2 and 3 rows are allocated now. Their AC and tests are written in the sprint contract before implementation.

## 1. Functional requirements

| Requirement | Feature | Sprint | AC / verification target | Planned test | Actual test (file::name) | Result | Version |
|---|---|---|---|---|---|---|---|
| FR-01 | F-01 | 1 | AC-01, AC-02, AC-03, AC-04, AC-09 | TEST-01, 02, 03, 04, 09 | | NOT RUN | |
| FR-02 | F-01 | 1 | AC-06, AC-09 | TEST-06, 09 | | NOT RUN | |
| FR-03 | F-01 | 1 | AC-05 | TEST-05 | | NOT RUN | |
| FR-04 | F-02 | 1 | AC-10, AC-11, AC-12, AC-13 | TEST-10, 11, 12, 13 | | NOT RUN | |
| FR-05 | F-03 | 1 | AC-14, AC-15, AC-16, AC-18, AC-19, AC-20, AC-21, AC-22, AC-23, AC-26, AC-29, AC-30 | TEST-14, 15, 16, 18–23, 26, 29, 30 | | NOT RUN | |
| FR-06 | F-03 | 1 | AC-14, AC-17, AC-25, AC-27 | TEST-14, 17, 25, 27 | | NOT RUN | |
| FR-07 | F-03 | 1 | AC-28, AC-31 | TEST-28, 31 | | NOT RUN | |
| FR-08 | F-04 | 1 | AC-32, AC-33, AC-38, AC-39 | TEST-32, 33, 38, 39 | | NOT RUN | |
| FR-09 | F-04 | 1 | AC-34, AC-35, AC-36, AC-37, AC-40, AC-41, AC-42 | TEST-34, TEST-35, TEST-36, TEST-37, TEST-40, TEST-41, TEST-42 | | NOT RUN | |
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
| BR-01 | F-03 | 1 | AC-18, AC-19 | TEST-18, 19 | | NOT RUN | |
| BR-02 | F-02 (defines), F-03 (enforces) | 1 | AC-11, AC-21, AC-22 | TEST-11, 21, 22 | | NOT RUN | |
| BR-03 | F-03 | 1 | AC-15, AC-16 | TEST-15, 16 | | NOT RUN | |
| BR-04 | F-03, F-05 | 1 (F-03), 2 (F-05) | AC-17 (S1); S2: catalog-edit AC to be defined in the Sprint 2 contract | TEST-17 | | NOT RUN | |
| BR-05 | F-03 | 1 | AC-23, AC-24, AC-46 | TEST-23, 24, 46 | | NOT RUN | |
| BR-06 | F-04, F-06, F-08, F-09, F-12 | 1 (F-04); 2 (F-06, F-08); 3 (F-09, F-12) | AC-35 (S1 transitions); full machine in Sprint 2 and 3 contracts | TEST-35, then TBD | | NOT RUN | |
| BR-07 | F-03, F-04, R-01 | 1 | AC-27, AC-28, AC-39 | TEST-27, 28, 39 | | NOT RUN | |
| BR-08 | F-04, R-01 | 1 | AC-26, AC-37, AC-38, AC-43 | TEST-26, 37, 38, 43 | | NOT RUN | |
| BR-09 | F-08 | 2 | To be defined in Sprint 2 contract | TBD | | NOT RUN | |
| BR-10 | F-06 | 2 | To be defined in the Sprint 2 contract (F-06) | TBD | | NOT RUN | |
| BR-11 | F-07 | 2 | To be defined in Sprint 2 contract | TBD | | NOT RUN | |
| BR-12 | F-09 | 3 | To be defined in Sprint 3 contract | TBD | | NOT RUN | |
| BR-13 | F-05, R-03 | 1 (DB), 2 (API) | S1: AC-46 (DB constraints). S2: API validation in contract | TEST-46, then TBD | backend/tests/constraints.test.ts::TEST-46 | PASS | feature/sprint1/scaffold-db-seed |
| BR-14 | F-03 | 1 | AC-14 (order number format) | TEST-14 | | NOT RUN | |
| BR-15 | F-03, F-04 | 1 | AC-25, AC-34 | TEST-25, 34 | | NOT RUN | |

## 3. Non-functional requirements

| Requirement | Feature / responsibility | Sprint | Target and verification | Planned test | Actual test / measurement | Result | Version |
|---|---|---|---|---|---|---|---|
| NFR-01 | R-01 | 1, extended 2 and 3 | 401 without session on every protected route (AC-43) | TEST-43 | | NOT RUN | |
| NFR-02 | R-01 | 1, extended 2 and 3 | 403 for wrong role or non-owner on every protected route (AC-43, AC-27, AC-37, AC-38) | TEST-43, 27, 37, 38 | | NOT RUN | |
| NFR-03 | F-01 | 1 | bcrypt hash stored; hash never returned (AC-08) | TEST-08 | | NOT RUN | |
| NFR-04 | F-01 | 1 | 8-hour expiry (AC-07); logout invalidates at once (AC-06) | TEST-06, 07 | | NOT RUN | |
| NFR-05 | R-04 | 3 | p95 ≤ 500 ms and zero 5xx responses for `GET /api/menu` and `POST /api/orders`, measured at 20 concurrent connections for 30 s per endpoint, database seeded with 500 orders plus an order-test item with enough stock for the whole run (NFR-05) | LOAD-01: autocannon script, raw output and tested commit saved (Sprint 3) | | NOT RUN | |
| NFR-06 | R-05 | 2 | Order survives restart and redeploy (post-deployment check) | CHECK-01 (Sprint 2) | | NOT RUN | |
| NFR-07 | R-02 | 1 | Standard error shape; no stack trace (AC-04, AC-44) | TEST-04, 44 | | NOT RUN | |
| NFR-08 | R-03 | 1 | Fresh clone in 8 commands or fewer; seed repeatable (AC-45) | TEST-45 | backend/tests/seed.test.ts::TEST-45 | PASS | feature/sprint1/scaffold-db-seed |
| NFR-09 | F-02, F-03, R-04 | 1 partial, 3 complete | Loading, empty and error states (AC-13, AC-30, AC-31 in S1) | TEST-13, 30, 31, then TBD | | NOT RUN | |
| NFR-10 | R-05 | 2 | At least 85% service-layer line coverage (coverage report) | COV-01 (Sprint 2) | | NOT RUN | |
| NFR-11 | F-13 | 3 | 429 after 5 failed logins in 15 minutes | TBD (Sprint 3) | | NOT RUN | |

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
| NFR-05, NFR-06, NFR-10, NFR-11 | Not measurable until later sprints | Allocated to Sprints 2 and 3 |
| BR-06 full transition table | Only `PENDING → ACCEPTED` is built in Sprint 1 | Remaining transitions are covered in F-06, F-08, F-09, F-12 contracts |

## 6. Approved changes log

| Change ID | Date | Affected requirement / feature | Description | Rationale | Approved by |
|---|---|---|---|---|---|
| (none yet) | | | | | |
