# Omazon — Change and Defect Register

| Item | Value |
|---|---|
| Document | `docs/change-register.md` |
| Version | 1.4 |
| Date | 2026-11-28 |
| Related | `docs/traceability.md` (§6 approved changes), `docs/srs.md`, `docs/sprints/sprint-3/features.md`, `docs/sprints/sprint-3/release-readiness.md` |

### Revision history
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-28 | Initial register: FND-01, FND-02, Issue #49, CHG-01, CHG-02, DEF-01, approved baseline revisions CHG-03 to CHG-06, and the Sprint 1 continuity record | Deliverable 2, Parts A and D (Issue #60) |
| 1.1 | 2026-11-28 | Added CHG-07 (CR-01, BR-01 per-line cap 10 → 5) to §2 as proposed, not approved | Lab 7 change request (Issue #76) |
| 1.2 | 2026-11-28 | CHG-07: restated the affected acceptance criteria and tests and added the database constraint note; status unchanged (Proposed) | Sync with the revised body of Issue #76 |
| 1.3 | 2026-11-28 | CHG-07 rewritten for the stock-aware per-line cap (BR-01 and BR-02). It supersedes the earlier "10 → 5" wording in rows 1.1 and 1.2. Status: proposed, team approval pending | Instructor announcement dated 24 Nov 2026; the earlier proposal was judged trivial (Issue #76) |
| 1.4 | 2026-11-28 | CHG-07: the contract revision is committed on `docs/CR-01-contract` (Issue #77), with final criteria AC-148 to AC-160 and decisions DEC-58 to DEC-66. Status unchanged: proposed, team approval pending. Teammate review not yet done; nothing implemented | CR-01 contract revision |

Only items with evidence in this repository, its Issues or its pull requests are listed. Findings from Lab 6 or Lab 7 that are not recorded there are not included.

**Status values.** `resolved`: the accepted change is in a release and has a recorded re-test. `remaining`: work or verification is still open. A resolved item can still name a re-test that has not been done.

## 1. Register

| ID | Source | Affected requirement / feature | Accepted decision | Status | Fix or change release | Re-test outcome |
|---|---|---|---|---|---|---|
| FND-01 ([#50](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/50), open) | Lab 6 UAT, case UAT-S1-06, evidence ID E-06b | Order detail display of `pickupNote`; planned under NFR-09 / R-04 (AC-147). AC-20 itself passed in UAT-S1-06; no Sprint 1 AC requires unbroken-word wrapping | Enhancement, low priority; deferred to Sprint 3 R-04. Fix with Bootstrap `text-break` (DEC-56) | **remaining** (planned) | None. F-09 (PR [#72](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/72), `15ea606`) applies `text-break` to the rejection reason only; the pickup note in `frontend/src/pages/OrderDetail.tsx` still has no wrap class | NOT RUN (TEST-147) |
| FND-02 ([#48](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/48), closed) | Lab 6 UAT, case UAT-S1-07, evidence IDs E-07a, E-07e; tested on `main` `61e1a3c`, revision `toktickit-00006-wgn` | FR-04, F-02 (AC-12), F-03 (AC-30) | Minor defect: after `409 ITEM_UNAVAILABLE`, re-fetch the menu in place without clearing the cart, the pickup note or the error | **resolved** | PR [#51](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/51) (red `4eb5edc`, green `0cdea82`, merge `4423158`), released by PR [#52](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/52), merge `b1422f4` on `main` (2026-11-25). Also contained in `sprint-2-v2.0` (`2f6cc46`) | The PR #51 review records that the reviewer ran the red commit and saw the test fail for the reported reason, then approved `0cdea82`. The PR #52 description records a local suite with 0 failures and 0 skipped. Re-run at `dad286b`: case `AC-21 / AC-30` in `frontend/e2e/order.spec.ts` PASS (`docs/evidence/A-sprint1-continuity-dad286b.txt`). A re-test by the partner UAT team is not recorded in the repository |
| #49 ([issue](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/49), closed) | Partner UAT team feedback and TA traceability requirement (as stated in the issue) | R-03 / Lab 5 R-08, System SDS §7.2 | Show the running commit in `GET /api/health` and in the UI footer | **resolved** | Same as FND-02: PR #51, released by PR #52 (`b1422f4`); in `sprint-2-v2.0` | `backend/tests/health.test.ts` passes at `dad286b` (`RC-pre-release-dad286b.txt`). On the deployed release, `GET /api/health` returned `2f6cc46` throughout CHECK-01 (`docs/evidence/CHECK-01-2f6cc46.txt`) |
| CHG-01 | F-04 implementation review (DEC-23, Option A) | FR-09 / AC-42 / TEST-42 | Wrong-role navigation shows an in-place 403 alert instead of redirecting | **resolved** | `984ddb9`; in `sprint-1-v1.0` | TEST-42 PASS at `dad286b` |
| CHG-02 | Team product naming (DEC-25) | Cross-cutting display brand | Rename user-facing brand and document titles to Omazon; keep technical identifiers | **resolved** | `e78ea16` (red) and the following brand commit; in `sprint-1-v1.0` | `frontend/src/App.test.tsx` and TEST-09 pass at `dad286b` |
| DEF-01 | Found during CHECK-01, 2026-11-28. The 401 logins were run by the team from a local terminal, outside the scripted check (`docs/evidence/CHECK-01-2f6cc46.txt`, Finding) | Demo accounts on the deployed system; `docs/labs/lab-05/deployment.md` §10 | Login with the current Secret Manager values returned `401 INVALID_CREDENTIALS` for `operator1`, `customer1` and `customer2`. The seed is create-only, so the stored hashes do not match the current secret values; **the cause is unconfirmed**. Correct the document now; reconcile the passwords later | **remaining**: documented; password reconciliation remains | Documentation only: `deployment.md` §10 wording as proposed in PR [#70](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/70), applied on `docs/deliverable-2` (Issue #60). No password, data or configuration change | NOT RUN. CHECK-01 itself passed using a working `customer1` password supplied by the team through an environment variable |

## 2. Approved baseline revisions

**Reference baseline.** `sprint-1-v1.0` (`858ef85`). `git diff sprint-1-v1.0 dad286b -- docs/srs.md` is empty: no FR, BR or NFR wording changed after that tag and before this Deliverable 2 update. The revisions below change how a requirement is verified, or the agreed behaviour behind it. Each was written in a contract or pull request that the other student approved. CHG numbering continues from CHG-02 and is mirrored in `docs/traceability.md` §6.

| ID | Date | Affected | Revision | Rationale | Approval evidence | State |
|---|---|---|---|---|---|---|
| CHG-03 | 2026-11-27, 2026-11-28 | BR-10; F-06, F-12 | BR-10 is verified in two parts: the customer path in Sprint 2 (AC-58 to AC-63) and the operator path in Sprint 3 (AC-127 to AC-129). In Sprint 2 an Operator calling the cancel endpoint gets 403; the "409 from `PREPARING`, `READY`, `COMPLETED` by any role" rule sits in the role-independent state machine and reaches Operators with F-12. BR-10 wording is unchanged | Operator cancellation is FR-17, allocated to Sprint 3 (DEC-33, OQ-01) | PR [#61](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/61) approved 2026-11-27; PR [#71](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/71) approved 2026-11-28 | Customer path PASS; operator path NOT RUN |
| CHG-04 | 2026-11-28 | BR-06; AC-60, AC-81; TEST-43, TEST-92, TEST-81, TEST-86, TEST-60 | Sprint 3 extends transition and route facts that earlier tests pin (AC-95 and AC-127 extend AC-60 and AC-81). Each earlier test change is listed with its new value in the Sprint 3 contract §2.1. The Sprint 2 contract text is not rewritten | The Sprint 3 requirements change those facts; naming each change keeps it separate from weakening a test (DEC-45) | PR #71 approved; F-09 type-only addition (contract revision 1.1) in PR [#72](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/72), approved 2026-11-28 | F-09 rows applied and passing at `15ea606`; F-11 and F-12 rows not yet applied |
| CHG-05 | 2026-11-28 | Order detail response (F-03, F-04 API); FR-14 | Every history entry in order detail gains `note` (string or null), which carries the rejection reason | The `OrderStatusHistory.note` column already exists and the customer must see the reason (DEC-43) | PR #71 and PR #72 approved | Implemented on `sprint-3-staging`; TEST-93 and TEST-103 PASS |
| CHG-06 | 2026-11-28 | FR-07, FR-08 list endpoints; System SDS §4 | The 200-row list limit is to be replaced by page-number pagination when F-10 is built | The System SDS already states that pagination arrives with F-10 (DEC-46) | PR #71 approved | Approved, **not implemented**; lists still return at most 200 rows |
| CHG-07 | 2026-11-28 | CR-01: BR-01 and BR-02; F-02, F-03; AC-10 / TEST-10 and AC-18 / TEST-18 revised; new AC-148 to AC-160 / TEST-148 to TEST-160 (AC-148 to AC-156 are draft D-1 to D-9); AC-19 / TEST-19 and TEST-22 unchanged; new error code `QUANTITY_LIMIT_EXCEEDED` | Proposed: stock-aware per-line cap. Maximum quantity per line = `min(5, max(1, floor(stockQty / 2)))` for an orderable item, enforced inside the single reserving `UPDATE`. Above 5 or invalid: 400 `VALIDATION_ERROR`; disabled, stock 0 or above the stock: 409 `ITEM_UNAVAILABLE`; within the stock but above the maximum: 409 `QUANTITY_LIMIT_EXCEEDED` with `{ itemId, allowedMax }`. Any failing line rejects the whole order. Lines per order stay 1 to 10, with no duplicate item. The menu API is to expose `maxOrderQuantity`. `OrderItem_quantity_check` (1 to 10) stays, so the database does not enforce the new upper limit by itself. No data migration, concluded from reading the code only (not tested). Known limitation: several orders are not limited. **Contract revision committed** (not yet reviewed or merged): `docs/srs.md` §9.3 (DEC-58 to DEC-66) and §11.1, `docs/system-sds.md` §9, `docs/sprints/sprint-1/features.md` F-02 and F-03 Revision 1.4; [impact analysis](labs/lab-07/CR-01-impact-analysis.md); [review sheet](labs/lab-07/CR-01-contract-review.md); [CR-01 v2.0](labs/lab-07/CR-01-change-request.md). **Supersedes the earlier "10 → 5" wording of this row** | Stop one customer from taking most of a low-stock item, so that more customers can order it (synthetic business request for Lab 7) | None recorded yet. Team approval is to be recorded as a comment on Issue [#76](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/76). Instructor announcement dated 24 Nov 2026 (quoted in the CR record §11): instructor/TA approval is not required | Proposed, team approval pending (Issue #76); instructor/TA approval waived per 24 Nov 2026 announcement. Contract revision committed; teammate review pending; not implemented |

**CHG-07 is a proposal.** The section heading and the statements above about approval and mirroring in `docs/traceability.md` §6 do not yet apply to it. It is not in that approved-changes log. Its contract revision is committed on `docs/CR-01-contract` as a proposal (SRS, System SDS, Sprint 1 contracts, and `docs/traceability.md` §2, §4.5 and §7, marked not implemented and `NOT RUN`). No source code or test has been changed for it.

Detailed Sprint 2 and Sprint 3 acceptance criteria (AC-47 to AC-147) and decisions DEC-28 to DEC-57 elaborate allocated requirements. They are recorded in the sprint contracts and are not repeated here.

## 3. Sprint 1 continuity

| Item | Value |
|---|---|
| Accepted Sprint 1 release | Tag `sprint-1-v1.0`, commit `858ef85` (release PR [#21](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/21), approved and merged 2026-11-13) |
| Later Sprint 1 change release | Merge commit `b1422f4` on `main`, 2026-11-25 (PR #52, FND-02 and #49). The PR title says `sprint-1-v1.1`, but **no `sprint-1-v1.1` tag exists** locally or on the remote (checked 2026-11-28) |
| Current accepted release | Tag `sprint-2-v2.0`, commit `2f6cc46`; it contains `b1422f4` |
| Continuity run | `dad286b` (head of `sprint-3-staging`), 2026-11-28, local machine with PostgreSQL in Docker |
| Result | API and database: 45 passed, 0 failed, 0 skipped. Playwright: 6 passed, 0 failed, 0 skipped. Output: `docs/evidence/A-sprint1-continuity-dad286b.txt` |

| Journey step | Covering tests |
|---|---|
| Login, logout, session | TEST-01 to TEST-09 |
| Menu | TEST-10, TEST-12 |
| Place order | TEST-14 to TEST-25, TEST-29 |
| Operator accepts | TEST-32 to TEST-40 |
| Customer sees `ACCEPTED` and history | TEST-41 |
| Access checks | TEST-26 to TEST-28, TEST-37, TEST-38, TEST-42 (screen only), TEST-43, TEST-92 |

Limits: the run uses the current test files on the current code; the `sprint-1-v1.0` build was not re-run. Compared with `sprint-1-v1.0`, `auth.spec.ts`, `menu.spec.ts`, `operator.spec.ts`, `auth.test.ts`, `menu.test.ts`, `orders.create.test.ts`, `orders.access.test.ts` and `orders.operator.test.ts` are unchanged; `order.spec.ts` gained the FND-02 assertions and `routes.access.test.ts` was extended for the later routes. This is not a deployed run and not a partner re-test. The journey after the next release candidate is deployed is still to be captured.
