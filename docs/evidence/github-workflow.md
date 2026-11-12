# Omazon — Sprint 1 Workflow Evidence

| Item | Value |
|---|---|
| Document | `docs/evidence/github-workflow.md` |
| Sprint | 1 (Deliverable 1, Part F) |
| Version | 1.3 |
| Date | 2026-11-12 |
| Source | GitHub pull requests and reviews for `krittaphato3/E-Commerce-GroupProject-1052-1014` |
| Related | `docs/sprints/sprint-1/features.md` §2 (Definition of Done), §4 |

### Revision history
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-07 | Initial workflow evidence: PR #8 to #13 chain, review detail, contribution summary | Deliverable 1, Part F |
| 1.1 | 2026-11-11 | Added PR #14 and PR #17 with their Issues, branches, reviewers and merge commits; added the contract `ISSUE-n` to GitHub `#n` mapping table; added §4 review evidence for two completed Issues; added the release PR placeholder and the manual screenshot TODO list | Pre-submission audit: the workflow evidence stopped at PR #13 and had no review excerpts |
| 1.2 | 2026-11-11 | Added §4.2 review evidence for krittaphato3 covering PR #8, PR #10, PR #12, and PR #13; updated §6 AI-use declaration to include Gemini 3.8 Flash High (ZCode) for Krittaphat Panyasomphan (67070501052) | Deliverable 1 requirements: complete two-way peer review evidence and comprehensive AI-use declaration |
| 1.3 | 2026-11-12 | §4 states which PR pairs are the review evidence and moves PR #12 and PR #13 to §4.3 as approvals without specific findings; PR #11 is disclosed as having no review comment; the §1 and §1.1 rows for Issue #18 now name PR #20 and its author instead of "to be opened" / "to be assigned" | Review round 2 found approvals quoted as review detail and a stale placeholder row in the chain table (PR #20 review) |

Sprint 1 work went through feature branches cut from `sprint-1-staging`, a reviewed pull request per issue, and a merge into staging. No author approved their own pull request.

## 1. Issue, branch and pull request chain

GitHub issue numbers are sequential in this repository; the contract's `ISSUE-n` labels refer to the same slices of work. The mapping is listed explicitly in §1.1 because the two numbering schemes do not line up.

| Contract issue | Feature / responsibility | GitHub issue | Branch | PR | Author | Reviewed by | Merged by | Merged | Merge commit |
|---|---|---|---|---|---|---|---|---|---|
| — | Specification baseline | #1 | `feature/specification-docs`, `feature/sprint1/spec-docs-setup` | [#8](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/8) | napatsun | krittaphato3 (approved) | krittaphato3 | 2026-11-05 | `addbc0e` |
| ISSUE-1 | R-03 Scaffold, schema, seed | #2 | `feature/sprint1/scaffold-db-seed` | [#9](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/9) | krittaphato3 | napatsun (changes requested, then approved) | napatsun | 2026-11-06 | `60b5e57` |
| ISSUE-2 | F-01 Authentication and session | #3 | `feature/sprint1/auth-login-logout` | [#10](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/10) | napatsun | krittaphato3 (approved) | krittaphato3 | 2026-11-06 | `9e1a0ab` |
| ISSUE-4, ISSUE-5 | F-02 Menu, F-03 Order submission | #4 | `feature/sprint1/menu-and-place-order` | [#11](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/11) | krittaphato3 | napatsun (approved) | napatsun | 2026-11-07 | `9495000` |
| ISSUE-6 | F-04 Operator list and acceptance | #5 | `feature/sprint1/operator-accept-order` | [#12](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/12) | napatsun | krittaphato3 (approved) | krittaphato3 | 2026-11-07 | `30b0f12` |
| ISSUE-3 | R-01 Access control, TEST-43, E2E journeys | #6 | `feature/sprint1/access-and-e2e-tests` | [#13](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/13) | napatsun | krittaphato3 (approved) | krittaphato3 | 2026-11-07 | `b7f1ed8` |
| — | README and evidence pack (Deliverable 1 Part F) | #7 | `feature/sprint1/evidence-readme-pdf` | [#14](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/14) | krittaphato3 | napatsun (changes requested, then approved) | napatsun | 2026-11-10 | `47813f7` |
| — | NFR-05 / LOAD-01 benchmark, R-04 baseline | #15 | `fix/sprint1/docs-loadbenchmark-fix` | [#17](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/17) | krittaphato3 | napatsun (approved, non-blocking comments) | napatsun | 2026-11-10 | `5c3f984` |
| — | Documentation-vs-code audit corrections | #16 | `fix/sprint1/docs-loadbenchmark-fix` | [#17](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/17) | krittaphato3 | napatsun (approved, non-blocking comments) | napatsun | 2026-11-10 | `5c3f984` |
| — | Evidence refresh and dangling-hash fix | #18 | `fix/sprint1/evidence-refresh` | [#20](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/20) | krittaphato3 | napatsun (changes requested, re-review pending) | — | — | — |
| — | Release: `sprint-1-staging` → `main` | — | `sprint-1-staging` | **to be filled after merge** | — | to be assigned | — | — | — |

PR #17 closed both #15 and #16 in one reviewed increment: its three commits are `5fbcb7a` (the six audit corrections), `f5dcf54` (the autocannon harness) and `f5caa04` (the recorded NFR-05 baseline).

### 1.1 Contract `ISSUE-n` to GitHub `#n` mapping

| Contract label | GitHub issue | Scope |
|---|---|---|
| — | #1 | Specification baseline (PR #8) |
| ISSUE-1 | #2 | R-03 scaffold, schema, seed |
| ISSUE-2 | #3 | F-01 authentication and session |
| ISSUE-3 | #6 | R-01 access control, TEST-43, E2E journeys |
| ISSUE-4 | #4 | F-02 menu browsing |
| ISSUE-5 | #4 | F-03 order submission (same PR as ISSUE-4) |
| ISSUE-6 | #5 | F-04 operator list and acceptance |
| — | #7 | README and evidence pack (PR #14) |
| — | #15 | NFR-05 / LOAD-01 load benchmark |
| — | #16 | Documentation-vs-code audit corrections (PR #17) |
| — | #18 | Evidence refresh and dangling-hash fix (PR #20) |

GitHub issues #7, #15, #16 and #18 have no contract `ISSUE-n` label because they are post-contract delivery and documentation work, not Sprint 1 feature slices.

## 2. Review detail

- **PR #9 (scaffold, R-03).** The review raised blocking findings, including that a fresh clone failed at steps 4–5 of the quickstart, which conflicts with NFR-08. The author fixed the findings in `ab28061`; the reviewer re-checked and approved.
- **PR #10 (F-01).** Reviewed after implementation with an approval comment; follow-up review fixes landed as `bb0acb4`, `f45ba47`, `2022899`, `6e68bee` and `83f0337` (recorded in `docs/traceability.md` revision 1.8).
- **PR #11 (F-02, F-03).** Approved against the ISSUE-4/ISSUE-5 contracts with non-blocking suggestions; the cart, order and operator follow-ups were handled in the merge.
- **PR #12 (F-04).** Approved without requested changes; later review fixes (`c680623`, `8fe7793`, `162b413`, `37cf31f`) tightened TEST-40 and the types, as recorded in traceability revisions 1.11 and 1.12.
- **PR #13 (R-01, E2E).** Approved after the route registry, TEST-43 and the Playwright journeys were reviewed together.
- **PR #14 (README and evidence pack, Issue #7).** Reviewed with blocking findings: the review showed that the PR description and the commit messages described a `.docx` and a `build_docx.py` that were not in the diff. The author answered in `8315279` and `afe4961` and the reviewer approved on 2026-11-10. Excerpts in §4.1.
- **PR #17 (NFR-05 baseline and audit corrections, Issues #15 and #16).** Approved with non-blocking comments after the reviewer checked each documentation correction against the shipped code, the compose file and the workspace scripts. Excerpts in §4.2.

Review comments are written in Thai in the repository; the outcomes above are the review states and merge outcomes as recorded by GitHub, and the excerpts in §4 are reproduced verbatim.

## 3. Contribution summary

Counts are roles, not line counts; the repository history is the source of truth for who wrote what.

| Member (GitHub) | Implemented | Reviewed | Merged |
|---|---|---|---|
| napatsun (Sun) | F-01 authentication (PR #10), F-04 operator acceptance (PR #12), R-01 route registry and TEST-43 (PR #13), E2E journeys, specification baseline (PR #8) | PR #9 (blocking findings, then approval), PR #11, PR #14 (blocking findings, then approval), PR #17 | PR #9, PR #11, PR #14, PR #17 |
| krittaphato3 | R-03 scaffold, schema and seed (PR #9), F-02 menu and F-03 order submission (PR #11), README and evidence pack (PR #14), NFR-05 benchmark and audit corrections (PR #17) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |

Both members authored at least two issues and reviewed the other's pull requests, which satisfies the pairing rule in `docs/sprints/sprint-1/features.md` §4.

## 4. Review evidence

Completed Issues with their pull requests demonstrating two-way peer review between both team members, as required by `reference/project_deliverable_1_v1.pdf` §4.2. Quotes are verbatim; Thai comments are left untranslated deliberately so the original review text can be checked against GitHub.

**Pairs used as the review evidence.** The two-way peer review rests on four pull requests that carry specific review comments and the author's replies: napatsun reviewing krittaphato3's work in PR #14 (§4.1.1) and PR #17 (§4.1.2), and krittaphato3 reviewing napatsun's work in PR #8 (§4.2.1) and PR #10 (§4.2.2). The excerpts below are the review text those PRs actually contain; no review was added or rewritten after the fact.

**Not counted as review evidence.** PR #11 and PR #12 add no specific finding: PR #11 carries no review comment, and PR #12 was approved with a one-line message. PR #13 was also approved with a one-line message that names no specific check. Their verbatim text is kept in §4.3 for completeness and the gap is disclosed in §5.

### 4.1 Reviews by napatsun (reviewed krittaphato3's PRs)

#### 4.1.1 Issue #7 — README and evidence pack (PR #14)

| Item | Value |
|---|---|
| Feature / contract | Deliverable 1 Part F: `docs/evidence/` index, README, manifest |
| Branch | `feature/sprint1/evidence-readme-pdf` |
| Author | krittaphato3 |
| Reviewer | napatsun |
| Review states | `COMMENTED` 2026-11-07, then `APPROVED` 2026-11-10 |
| Merge commit | `47813f7` into `sprint-1-staging` |

Excerpt 1 — napatsun, review of 2026-11-07 ([PR #14](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/14)):

> เนื้อหา evidence ทำได้ดีมาก แต่มี 2 เรื่องที่ต้องแก้ครับคุณโอโซน
> **Blocking 1** : PR description เขียนถึงไฟล์ที่ไม่ได้อยู่ใน commit จริง

Excerpt 2 — krittaphato3, author's reply of 2026-11-07 ([PR #14](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/14)):

> ตรวจแล้วครับ ทุกข้อถูกต้องทั้งหมด แก้ตามที่แนะนำแล้วใน `8315279` + `afe4961`

The blocking finding was resolved by two follow-up commits, and the reviewer recorded `APPROVED` on 2026-11-10 before the merge. The same thread later documents two force-pushes to `4d00f27` and `9d8e7cb` (reword, then revert) and why the revert was chosen; that discussion is in the PR timeline.

#### 4.1.2 Issues #15 and #16 — NFR-05 baseline and audit corrections (PR #17)

| Item | Value |
|---|---|
| Feature / contract | NFR-05, LOAD-01, R-04 (Sprint 1 baseline); documentation audit |
| Branch | `fix/sprint1/docs-loadbenchmark-fix` |
| Author | krittaphato3 |
| Reviewer | napatsun |
| Review state | `APPROVED` 2026-11-10, with non-blocking comments |
| Merge commit | `5c3f984` into `sprint-1-staging` |

Excerpt 1 — napatsun, review of 2026-11-10 ([PR #17](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/17)):

> ตรวจครบทั้ง 3 commits (`5fbcb7a`, `f5dcf54`, `f5caa04`) — 23 ไฟล์ (+1,861/−29) ปิด #16 และ #15 CI ("Unit, integration and E2E") ผ่าน

Excerpt 2 — the same review, checking one audit correction against the code ([PR #17](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/17)):

> | 1 | `features.md` §11: `docker compose up -d db` → `up -d` | `docker-compose.yml` มี service เดียวชื่อ `postgres` (container `campusbites-postgres`) — ไม่มี `db` จริง คำสั่งเดิมถึงจะ fail |

The reviewer verified each documentation correction against the repository rather than accepting the description, which is the specific check required by the handout.

### 4.2 Reviews by krittaphato3 (reviewed napatsun's PRs)

#### 4.2.1 Specification baseline (PR #8)

| Item | Value |
|---|---|
| Feature / contract | Specification baseline |
| Branch | `feature/specification-docs`, `feature/sprint1/spec-docs-setup` |
| Author | napatsun |
| Reviewer | krittaphato3 |
| Review states | `COMMENTED` 2026-11-05, then `APPROVED` 2026-11-05 |
| Merge commit | `addbc0e` into `sprint-1-staging` |

Excerpt 1 — krittaphato3, review of 2026-11-05 ([PR #8](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/8)):

> จากที่ผมอ่านเอกสารครบทุกไฟล์แล้ว SRS, features, traceability, system-sds, sprint plan, sprint-1 contracts ทั้งหมดเขียนมาแน่นมาก ครบดีมากครับ โดยเฉพาะ decision log กับ Q&A ที่บันทึก reasoning ไว้ชัดเจน แต่มีข้อเสนอดเพิ่มเติม
> 
> ข้อเสนอเพิ่มเติม
> 1. เพิ่ม BR สำหรับ Late Cancellation boundary
> Theme 4 spec บอกให้ *"Clarify price calculation, availability, **cancellation**, and allowed status changes"* แต่ ตอนนี้ FR-17 บอกว่า operator cancel ได้ตอน `ACCEPTED` before preparation แต่ไม่มี explicit rule บอกว่า `PREPARING` / `READY` / `COMPLETED` ห้าม cancel โดยใครทั้งนั้น
> 
> 2. เพิ่ม explicit exclusion สำหรับ out-of-band scenarios
> ใน Assumptions ของ srs.md อาจเพิ่มสักข้อ เช่น:
> A-08: ระบบไม่รองรับ partial fulfillment, waste tracking หรือ no-show terminal state ถ้าลูกค้าไม่มารับของตอน `READY` หรือของหมดตอน `PREPARING` ให้ operator แก้ไขนอก ระบบ

Excerpt 2 — napatsun, author's reply of 2026-11-05 ([PR #8](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/8)):

> ขอบคุณมากครับสำหรับรีวิวและข้อเสนอแนะที่ช่วยให้เอกสารครอบคลุมขึ้นมากจริงๆครับคุณกฤตภาส ซึ่งผมได้นำข้อเสนอแนะทั้งสองจุดไปปรับเเก้ไขเรียบร้อยแล้ว โดยมีรายละเอียดดังนี้ครับ:
> 1. **Late Cancellation Boundary (`BR-10`)**: ขยายความ `BR-10` โดยระบุว่า *"Cancellation is not allowed from `PREPARING`, `READY` or `COMPLETED` by any role; such a request is rejected with 409 `INVALID_TRANSITION`."*
> 2. **Explicit Exclusions / Out-of-band Scenarios (`A-08` & `§3.2`)**: เพิ่มสมมติฐาน `A-08` ใน Assumptions ของ `docs/srs.md` และเพิ่มใน `§3.2 Explicit exclusions`
> 3. **Document Audit & ID Integrity**: ปรับ Version bump (`srs.md` เป็น v1.3, `traceability.md` เป็น v1.4) พร้อมบันทึก Revision history

Excerpt 3 — krittaphato3, approval review of 2026-11-05 ([PR #8](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/8)):

> เห็น commit ล่าสุดแล้ว ดีมากครับจากมุมมองของผม ครบถ้วนดีแล้วครับ

#### 4.2.2 Issue #3 — F-01 Authentication and session (PR #10)

| Item | Value |
|---|---|
| Feature / contract | F-01 Authentication and session |
| Branch | `feature/sprint1/auth-login-logout` |
| Author | napatsun |
| Reviewer | krittaphato3 |
| Review states | `COMMENTED` 2026-11-06, then `APPROVED` 2026-11-06 |
| Merge commit | `9e1a0ab` into `sprint-1-staging` |

Excerpt 1 — krittaphato3, review of 2026-11-06 ([PR #10](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/10)):

> ผมลองอ่าน PR #10 ทั้งหมดดูแล้วนะครับ สรุปภาพรวมให้ด้านล่างนี้ครับ
> 
> อาจจะนำไปพิจารณาแก้ก่อน merge
> 
> #### 1. `DUMMY_PASSWORD_HASH` ถูก hardcode ที่ cost 10 — timing defense จะ break ทันทีที่มีคนปรับ bcrypt ให้แข็งขึ้น
> ที่ `backend/src/services/authService.ts:11`:
> `const DUMMY_PASSWORD_HASH = "$2b$10$tc7NwgWdFKcEqe2yqZ14c.EQDtFJBlb2MmiCcRsdsgacNmHU3Tnga";`
> bcrypt มัน encode cost factor *ไว้ในตัว hash string* ด้วยครับ hash ของ user จริงถูกสร้างโดย `seed.ts -> resolveBcryptRounds() -> process.env.BCRYPT_ROUNDS` ซึ่ง schema ใน `env.ts` อนุญาตตั้งแต่ 4 ถึง 15 พอมีคนปรับ `BCRYPT_ROUNDS` เป็น 12 dummy hash ยังรัน cost 10 อยู่ ส่วน user hash รัน cost 12 -> ต่างกันประมาณ 4 เท่า ซึ่งวัด timing attack ผ่าน network ได้สบายๆ และ test ใน CI ก็จับไม่ได้ด้วยเพราะ `setup.ts` บังคับ `BCRYPT_ROUNDS=4`
> 
> **วิธีแก้:** สร้าง dummy ที่ cost ที่ config ไว้ แบบ lazy ครับ
> 
> #### 2. `requireRole` ถูกส่งเข้ามาโดยไม่มี test
> `middleware/auth.ts:35` เพิ่มโค้ด authorization ~15 บรรทัด แต่ไม่มี test ไหนใช้มันเลย ลองเขียน test 20 บรรทัด mount stub route ด้วย `requireRole("OPERATOR")` แล้ว assert 401/403/200 ดูครับ
> 
> #### 3. `GET /me` พึ่ง `select` clause ที่ห่างไปสามไฟล์เพื่อไม่ให้ hash รั่ว
> `authController.ts:41` ส่ง `req.user` ออกไปตรงๆ วันนี้ปลอดภัยแค่เพราะ `sessionRepository.findValid` ดันไป `select` แค่ 4 field... ทำให้ invariant อยู่ในที่ของมันดีกว่า...

Excerpt 2 — napatsun, author's reply of 2026-11-06 ([PR #10](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/10)):

> ขอบคุณสำหรับ technical review ที่ละเอียดและช่วยป้องกัน security issue ได้ตรงจุดมากครับคุณกฤตภาส ได้นำข้อเสนอแนะไปปรับแก้ใน commit `8d2689d` และ `07a67ff` เรียบร้อยครับ พร้อมผ่าน automated tests ทั้งหมด

Excerpt 3 — krittaphato3, approval review of 2026-11-06 ([PR #10](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/10)):

> ผ่านครับ ดีมาก

### 4.3 Approvals without specific review findings

These pull requests were approved, but the approval message names no specific finding and the PRs therefore cannot serve as review evidence. The text is reproduced unchanged; nothing was added to them.

- **PR #11 (F-02, F-03).** Approved with no review comment on the conversation thread.

#### 4.3.1 Issue #5 — F-04 Operator list and acceptance (PR #12)

| Item | Value |
|---|---|
| Feature / contract | F-04 Operator list and acceptance |
| Branch | `feature/sprint1/operator-accept-order` |
| Author | napatsun |
| Reviewer | krittaphato3 |
| Review state | `APPROVED` 2026-11-07 |
| Merge commit | `30b0f12` into `sprint-1-staging` |

Excerpt 1 — krittaphato3, review of 2026-11-07 ([PR #12](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/12)):

> เรียบร้อยครับ ทำได้ดีมาก ไม่มีข้อติ

The approval records the merge state only; the state machine, role guard and `TEST-40` findings themselves are in `docs/traceability.md` and the test logs, not in this comment.

#### 4.3.2 Issue #6 — R-01 Access control, TEST-43, E2E journeys (PR #13)

| Item | Value |
|---|---|
| Feature / contract | R-01 Access control, TEST-43, E2E journeys |
| Branch | `feature/sprint1/access-and-e2e-tests` |
| Author | napatsun |
| Reviewer | krittaphato3 |
| Review state | `APPROVED` 2026-11-07 |
| Merge commit | `b7f1ed8` into `sprint-1-staging` |

Excerpt 1 — krittaphato3, review of 2026-11-07 ([PR #13](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/13)):

> จากที่ดู test ทั้งหมด ผ่าน และครบถ้วนดีมากครับ ผ่านครับ

The approval states that the suites passed; the coverage claims for the route registry and the Playwright journeys are evidenced by `docs/traceability.md` and the logs in this directory, not by this comment.

## 5. Screenshots to capture manually (TODO — team task, not yet done)

Screenshots cannot be produced by the documentation tooling; these must be captured from GitHub by a team member and inserted into Part F of the PDF:

- **Known limitation — review content.** PR #11 (F-02/F-03) has no review comment, and PR #12 (F-04) and PR #13 (R-01) were approved with one-line messages that name no specific finding. The two-way review evidence therefore rests on PR #14 and PR #17 (napatsun reviewing krittaphato3) and on PR #8 and PR #10 (krittaphato3 reviewing napatsun), as stated at the start of §4. Those two pairs are the ones to screenshot for the handout's two review examples.

- [ ] **TODO — final project board.** The GitHub Project board in its final Sprint 1 state, showing every Sprint 1 Issue in `Done`.
- [ ] **TODO — Issue #7 and PR #14.** The PR #14 conversation showing the review of 2026-11-07 and the approval of 2026-11-10, with the branch name and the merge into `sprint-1-staging` visible.
- [ ] **TODO — Issues #15/#16 and PR #17.** The PR #17 conversation showing the approval review and the "Merged" state.
- [ ] **TODO — PR #8 and PR #10.** The PR #8 and PR #10 conversations showing the review feedback from krittaphato3 and the approval before merge.
- [ ] **TODO — release PR.** The `sprint-1-staging` → `main` pull request page after it is opened and merged (see the placeholder row in §1).
- [ ] **TODO — release tag.** The tag `sprint-1-v1.0` (once created) and the commit it points to.

Each screenshot should be labelled with the Issue/PR number, the branch, the author, the reviewer and the merge commit, so it matches the tables above.

## 6. AI-use declaration

Scope: this section answers `reference/project_deliverable_1_v1.pdf` §4.2: which AI tools were used, what they assisted with, and how the students verified the output. Items were inferred from repository evidence and confirmed/extended by the authors. External tools such as Gemini 3.8 Flash High (via ZCode), Codebuff, and Claude 3.5 Sonnet leave no explicit trace in Git without trailers and are explicitly declared below by the authors.

### 6.1 What the repository actually shows

| Evidence | Where | What it shows |
|---|---|---|
| Commit trailer `🤖 Generated with Codebuff` with `Co-Authored-By: Codebuff <noreply@codebuff.com>` | 12 commits (`git log --all --grep='Generated with Codebuff'`). Group 1, F-01 on `feature/sprint1/auth-login-logout`: `e78cb7f`, `8398fe2`, `05a4f08`, `f222daa`, `097da41`, `0c3e82e`. Group 2, evidence refresh on `fix/sprint1/evidence-refresh`: `1861936`, `0c8bc0e`, `8c6dc59`, `b44c177`, `cb39080`, `8f98dca` | Codebuff assisted with the F-01 red tests, backend, UI and evidence document (group 1), and with the evidence refresh, test re-run and NFR-05 re-measurement (group 2) |
| No other AI tool, model or vendor is named in any tracked commit trailer | repository | Other tool use is declared in §6.2 and §6.3 by the students |
| Definition of Done item 10 | `docs/sprints/sprint-1/features.md` §2 | Completion is shown by output produced by running the product, not by an AI statement |
| CI workflow `.github/workflows/ci.yml`, PR #17 review | repository / GitHub | The test suites run in automation and all PRs were checked by peer reviewers (see §4) |

### 6.2 Tool, tasks and verification

| Tool | Tasks assisted | Which Issues/PRs | How output was verified | Student |
|---|---|---|---|---|
| Gemini 3.8 Flash High (via ZCode) | Implementation of R-03 project scaffold & database seed (PR #9), F-02 menu browsing & F-03 order placement APIs (PR #11), README & evidence pack assembly (PR #14), NFR-05 load benchmark harness & documentation audit corrections (PR #17), and in-depth security/technical PR reviews (PR #8, PR #10) | GitHub Issues #2, #4, #7, #15, #16, #18; PR #8, PR #9, PR #10, PR #11, PR #14, PR #17, PR #20 | All generated code, migrations, tests, and documentation were strictly verified via automated suites (`npm test`, `npm run typecheck`, `npm run build`, `npm run e2e`, `autocannon` load benchmarks), git diff sanity checks, and peer review approvals on GitHub by teammate napatsun | Krittaphat Panyasomphan 67070501052 |
| Codebuff | Tests-first work for F-01, the F-01 implementation and UI (`e78cb7f`, `8398fe2`, `05a4f08`, `f222daa`, `097da41`, `0c3e82e`) | GitHub Issue #3 (contract ISSUE-2, F-01), PR #10 | The F-01 tests those commits introduce pass in `docs/evidence/F-01-green-full-f222daa.txt` and again in the `5c3f984` run (`docs/evidence/R-01-green-tests-5c3f984.txt`); PR #10 was reviewed and approved by the teammate (§2). Any further hand-checking: automated test suites and peer PR review | Napat Kasemweerasan 67070501014 |
| Codebuff | Evidence refresh: re-ran backend, frontend, build and E2E on `5c3f984`; re-measured NFR-05; updated traceability, workflow evidence and commit log; drafted initial declaration (`1861936`, `0c8bc0e`, `8c6dc59`, `b44c177`, `cb39080`, `8f98dca`) | GitHub Issue #18 (`fix/sprint1/evidence-refresh`), PR #20 | Confirmed the diff against `origin/sprint-1-staging` touches only `docs/` and `README.md`, and that cited commits exist (`git cat-file -t`); test logs are raw output saved in `docs/evidence/`; peer review by teammate | Krittaphat Panyasomphan 67070501052 |
| Claude (Anthropic, claude.ai chat) | Wrote the audit and fix prompts for the coding agent, summarized audit reports, and drafted Issue and declaration text | Issues/PRs for the audit fixes: All Issues | The students ran verification commands (`git diff`, `git cat-file`, `grep`) on the repository before opening the PR; Claude's output was not committed without student review | Napat Kasemweerasan 67070501014, Krittaphat Panyasomphan 67070501052 |

Rule this table follows: nothing is claimed as reviewed or verified by the students unless the repository shows it (a merged, reviewed pull request or a recorded passing test run) or the authors explicitly state and take responsibility for it.

### 6.3 Student declaration by Krittaphat Panyasomphan (67070501052)

All code and documentation produced for tasks assigned to Krittaphat Panyasomphan (krittaphato3) was generated and refined with the assistance of Gemini 3.8 Flash High running via ZCode. I have thoroughly reviewed, edited, and verified all outputs against the project's requirements, issue history, automated test suites, and teammate reviews to ensure correctness, security, and strict adherence to the Definition of Done.

## 7. How to audit this

```bash
gh pr list --state all --base sprint-1-staging --json number,title,headRefName,author,mergedAt,mergeCommit
gh issue list --state all
gh pr view 14 --comments
gh pr view 17 --comments
git log --oneline --graph sprint-1-staging
```

The commit history for staging, including the contract-before-implementation order, is captured in `docs/evidence/sprint-1-commit-log.txt`.
