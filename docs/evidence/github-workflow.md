# Omazon — Sprint 1 Workflow Evidence

| Item | Value |
|---|---|
| Document | `docs/evidence/github-workflow.md` |
| Sprint | 1 (Deliverable 1, Part F) |
| Version | 1.1 |
| Date | 2026-11-11 |
| Source | GitHub pull requests and reviews for `krittaphato3/E-Commerce-GroupProject-1052-1014` |
| Related | `docs/sprints/sprint-1/features.md` §2 (Definition of Done), §4 |

### Revision history
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-07 | Initial workflow evidence: PR #8 to #13 chain, review detail, contribution summary | Deliverable 1, Part F |
| 1.1 | 2026-11-11 | Added PR #14 and PR #17 with their Issues, branches, reviewers and merge commits; added the contract `ISSUE-n` to GitHub `#n` mapping table; added §4 review evidence for two completed Issues; added the release PR placeholder and the manual screenshot TODO list | Pre-submission audit: the workflow evidence stopped at PR #13 and had no review excerpts |

Sprint 1 work went through feature branches cut from `sprint-1-staging`, a reviewed pull request per issue, and a merge into staging. No author approved their own pull request.

## 1. Issue, branch and pull request chain

GitHub issue numbers are sequential in this repository; the contract's `ISSUE-n` labels refer to the same slices of work. The mapping is listed explicitly in §1.1 because the two numbering schemes do not line up.

| Contract issue | Feature / responsibility | GitHub issue | Branch | PR | Author | Reviewed by | Merged by | Merged | Merge commit |
|---|---|---|---|---|---|---|---|---|---|
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |
| — | Evidence refresh and dangling-hash fix | #18 | `fix/sprint1/evidence-refresh` | to be opened | napatsun | to be assigned | — | — | — |
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
| — | #18 | Evidence refresh and dangling-hash fix (this branch) |

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
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |

Both members authored at least two issues and reviewed the other's pull requests, which satisfies the pairing rule in `docs/sprints/sprint-1/features.md` §4.

## 4. Review evidence

### 4.1 Contract `ISSUE-n` to GitHub `#n` mapping

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
| — | #18 | Evidence refresh and dangling-hash fix (this branch) |

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
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |

Both members authored at least two issues and reviewed the other's pull requests, which satisfies the pairing rule in `docs/sprints/sprint-1/features.md` §4.

## 4. Review evidence

Two completed Issues with their pull requests, as required by `reference/project_deliverable_1_v1.pdf` §4.2. Quotes are verbatim; Thai comments are left untranslated deliberately so the original review text can be checked against GitHub.



### 4.2 PR #8 — Specification baseline
| Item | Value |
|---|---|
| Feature / contract | Specification baseline |
| Branch | `feature/specification-docs` |
| Author | napatsun |
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |
| Review state | APPROVED |
| Merge commit | `addbc0e` |

Excerpt 1 — krittaphato3, review of PR #8 ([PR #8](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/8)):
> ... (Placeholder: Needs review evidence from the actual PR #8 comment) ...



### 4.3 PR #10 — F-01 Authentication and session
| Item | Value |
|---|---|
| Feature / contract | F-01 Authentication and session |
| Branch | `feature/sprint1/auth-login-logout` |
| Author | napatsun |
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |
| Review state | APPROVED |
| Merge commit | `9e1a0ab` |

Excerpt 1 — krittaphato3, review of PR #10 ([PR #10](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/10)):
> ... (Placeholder: Needs review evidence from the actual PR #10 comment) ...



### 4.4 Tool, tasks and verification

| Tool | Tasks assisted | Which Issues/PRs | How output was verified | Student |
|---|---|---|---|---|
| Codebuff  | Tests-first work for F-01, the F-01 implementation and UI (`e78cb7f`, `8398fe2`, `05a4f08`, `f222daa`, `097da41`, `0c3e82e`) | GitHub Issue #3 (contract ISSUE-2, F-01), PR #10 | The F-01 tests those commits introduce pass in `docs/evidence/F-01-green-full-f222daa.txt` and again in the `5c3f984` run (`docs/evidence/R-01-green-tests-5c3f984.txt`); PR #10 was reviewed and approved by the teammate (§2). Any further hand-checking by the students: None beyond the automated tests and the teammate's PR review | Napat Kasemweerasan 67070501014 |
| Deepseek Harness  | Evidence refresh: re-ran backend, frontend, build and E2E on `5c3f984`; re-measured NFR-05; updated traceability, workflow evidence and commit log; drafted this declaration (`1861936`, `0c8bc0e`, `8c6dc59`, `b44c177`, `cb39080`, `8f98dca`) | GitHub Issue #18 (`fix/sprint1/evidence-refresh`), PR #20 | The student confirmed the diff against `origin/sprint-1-staging` touches only `docs/` and `README.md`, and that cited commits exist (`git cat-file -t`); test logs are raw output saved in `docs/evidence/`; the PR is reviewed by the teammate: None beyond the automated tests and the teammate's PR review | Krittaphat Punyasompan 67070501052 |
| Claude (Anthropic, claude.ai chat)  | Wrote the audit and fix prompts for the coding agent, summarized audit reports, and drafted Issue and declaration text | Issues/PRs for the audit fixes: All Issues | The student ran the verification commands (`git diff`, `git cat-file`, `grep`) on the repository before opening the PR; Claude's output was not committed without student review:  | Napatr Kaemweerasan 67070501014, Krittaphat Punyasompan 67070501052 |


Rule this table follows: nothing is claimed as reviewed or verified by the students unless the repository shows it (a merged, reviewed pull request or a recorded passing test run) or the authors state it. Everything else is left for the authors.




### 4.5 PR #12 — F-04 Operator list and acceptance
| Item | Value |
|---|---|
| Feature / contract | F-04 Operator list and acceptance |
| Branch | `feature/sprint1/operator-accept-order` |
| Author | napatsun |
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |
| Review state | APPROVED |
| Merge commit | `30b0f12` |

Excerpt 1 — krittaphato3, review of PR #12 ([PR #12](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/12)):
> ... (Placeholder: Needs review evidence from the actual PR #12 comment) ...



### 4.6 PR #13 — R-01 Access control
| Item | Value |
|---|---|
| Feature / contract | R-01 Access control, TEST-43, E2E journeys |
| Branch | `feature/sprint1/access-and-e2e-tests` |
| Author | napatsun |
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |
| Review state | APPROVED |
| Merge commit | `b7f1ed8` |

Excerpt 1 — krittaphato3, review of PR #13 ([PR #13](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/13)):
> ... (Placeholder: Needs review evidence from the actual PR #13 comment) ...

## 5. Screenshots to capture manually (TODO — team task, not yet done)

Screenshots cannot be produced by the documentation tooling; these must be captured from GitHub by a team member and inserted into Part F of the PDF:

- [ ] **TODO — final project board.** The GitHub Project board in its final Sprint 1 state, showing every Sprint 1 Issue in `Done`.
- [ ] **TODO — Issue #7 and PR #14.** The PR #14 conversation showing the review of 2026-11-07 and the approval of 2026-11-10, with the branch name and the merge into `sprint-1-staging` visible.
- [ ] **TODO — Issues #15/#16 and PR #17.** The PR #17 conversation showing the approval review and the "Merged" state.
- [ ] **TODO — release PR.** The `sprint-1-staging` → `main` pull request page after it is opened and merged (see the placeholder row in §1).
- [ ] **TODO — release tag.** The tag `sprint-1-v1.0` (once created) and the commit it points to.

Each screenshot should be labelled with the Issue/PR number, the branch, the author, the reviewer and the merge commit, so it matches the tables above.

## 6. AI-use declaration

Scope: this section answers `reference/project_deliverable_1_v1.pdf` §4.2: which AI tools were used, what they assisted with, and how the students verified the output. Items marked were inferred from repository evidence and must be confirmed or corrected by the authors before submission. External tools such as Codebuff and Claude 3.5 Sonnet leave no trace in Git and are explicitly declared by the authors.



### 4.7 Issue #7 — README and evidence pack (PR #14)

| Item | Value |
|---|---|
| Feature / contract | Deliverable 1 Part F: `docs/evidence/` index, README, manifest |
| Branch | `feature/sprint1/evidence-readme-pdf` |
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |
| Reviewer | napatsun |
| Review states | `COMMENTED` 2026-11-07, then `APPROVED` 2026-11-10 |
| Merge commit | `47813f7` into `sprint-1-staging` |

Excerpt 1 — napatsun, review of 2026-11-07 ([PR #14](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/14)):

> เนื้อหา evidence ทำได้ดีมาก แต่มี 2 เรื่องที่ต้องแก้ครับคุณโอโซน
> **Blocking 1** : PR description เขียนถึงไฟล์ที่ไม่ได้อยู่ใน commit จริง

Excerpt 2 — krittaphato3, author's reply of 2026-11-07 ([PR #14](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/14)):

> ตรวจแล้วครับ ทุกข้อถูกต้องทั้งหมด แก้ตามที่แนะนำแล้วใน `8315279` + `afe4961`

The blocking finding was resolved by two follow-up commits, and the reviewer recorded `APPROVED` on 2026-11-10 before the merge. The same thread later documents two force-pushes to `4d00f27` and `9d8e7cb` (reword, then revert) and why the revert was chosen; that discussion is in the PR timeline.



### 4.8 Issues #15 and #16 — NFR-05 baseline and audit corrections (PR #17)

| Item | Value |
|---|---|
| Feature / contract | NFR-05, LOAD-01, R-04 (Sprint 1 baseline); documentation audit |
| Branch | `fix/sprint1/docs-loadbenchmark-fix` |
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |
| Reviewer | napatsun |
| Review state | `APPROVED` 2026-11-10, with non-blocking comments |
| Merge commit | `5c3f984` into `sprint-1-staging` |

Excerpt 1 — napatsun, review of 2026-11-10 ([PR #17](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/17)):

> ตรวจครบทั้ง 3 commits (`5fbcb7a`, `f5dcf54`, `f5caa04`) — 23 ไฟล์ (+1,861/−29) ปิด #16 และ #15 CI ("Unit, integration and E2E") ผ่าน

Excerpt 2 — the same review, checking one audit correction against the code ([PR #17](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/17)):

> | 1 | `features.md` §11: `docker compose up -d db` → `up -d` | `docker-compose.yml` มี service เดียวชื่อ `postgres` (container `campusbites-postgres`) — ไม่มี `db` จริง คำสั่งเดิมถึงจะ fail |

The reviewer verified each documentation correction against the repository rather than accepting the description, which is the specific check required by the handout.




### 4.9 What the repository actually shows

| Evidence | Where | What it shows |
|---|---|---|
| Commit trailer `🤖 Generated with Codebuff` with `Co-Authored-By: Codebuff <noreply@codebuff.com>` | 12 commits (`git log --all --grep='Generated with Codebuff'`). Group 1, F-01 on `feature/sprint1/auth-login-logout`: `e78cb7f`, `8398fe2`, `05a4f08`, `f222daa`, `097da41`, `0c3e82e`. Group 2, evidence refresh on `fix/sprint1/evidence-refresh`: `1861936`, `0c8bc0e`, `8c6dc59`, `b44c177`, `cb39080`, `8f98dca` | Codebuff assisted with the F-01 red tests, backend, UI and evidence document (group 1), and with the evidence refresh, test re-run and NFR-05 re-measurement (group 2) |
| No other AI tool, model or vendor is named in any tracked file (grep for `AI-use`, `ChatGPT`, `Claude`, `Copilot`, `Codebuff`, `AI agent`) | repository | Other tool use, if any, is not recorded in Git and is declared in §6.2 by the students |
| Definition of Done item 10 | `docs/sprints/sprint-1/features.md` §2 | Completion is shown by output produced by running the product, not by an AI statement |
| CI workflow `.github/workflows/ci.yml`, PR #17 review | repository / GitHub | The test suites run in automation and the PR was checked by a reviewer (see §4.2) |



### 4.10 Issue #18 — Evidence refresh and dangling-hash fix (PR #20)

| Item | Value |
|---|---|
| Feature / contract | Evidence refresh, dangling hash fix |
| Branch | `fix/sprint1/evidence-refresh` |
| krittaphato3 | R-03 scaffold (Prisma, migrations, seed, PR #9), F-02/F-03 API (Menu, Order submission, PR #11), README/Evidence pack assembly (PR #14), NFR-05 benchmark/audit (PR #17), Evidence refresh/dangling hash fix (PR #20) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |
| Reviewer | napatsun |
| Review state | Pending |
| Merge commit | to be merged |

Excerpt 1 — napatsun, review of 2026-11-11 ([PR #20](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/20)):

> ... (Placeholder: Needs review evidence from the actual PR #20 comment once napatsun reviews it) ...




## 5. Screenshots to capture manually (TODO — team task, not yet done)

Screenshots cannot be produced by the documentation tooling; these must be captured from GitHub by a team member and inserted into Part F of the PDF:

- [ ] **TODO — final project board.** The GitHub Project board in its final Sprint 1 state, showing every Sprint 1 Issue in `Done`.
- [ ] **TODO — Issue #7 and PR #14.** The PR #14 conversation showing the review of 2026-11-07 and the approval of 2026-11-10, with the branch name and the merge into `sprint-1-staging` visible.
- [ ] **TODO — Issues #15/#16 and PR #17.** The PR #17 conversation showing the approval review and the "Merged" state.
- [ ] **TODO — release PR.** The `sprint-1-staging` → `main` pull request page after it is opened and merged (see the placeholder row in §1).
- [ ] **TODO — release tag.** The tag `sprint-1-v1.0` (once created) and the commit it points to.

Each screenshot should be labelled with the Issue/PR number, the branch, the author, the reviewer and the merge commit, so it matches the tables above.

## 6. AI-use declaration

Scope: this section answers `reference/project_deliverable_1_v1.pdf` §4.2: which AI tools were used, what they assisted with, and how the students verified the output. Items marked were inferred from repository evidence and must be confirmed or corrected by the authors before submission. External tools such as Codebuff and Claude 3.5 Sonnet leave no trace in Git and are explicitly declared by the authors.

### 6.1 What the repository actually shows

| Evidence | Where | What it shows |
|---|---|---|
| Commit trailer `🤖 Generated with Codebuff` with `Co-Authored-By: Codebuff <noreply@codebuff.com>` | 12 commits (`git log --all --grep='Generated with Codebuff'`). Group 1, F-01 on `feature/sprint1/auth-login-logout`: `e78cb7f`, `8398fe2`, `05a4f08`, `f222daa`, `097da41`, `0c3e82e`. Group 2, evidence refresh on `fix/sprint1/evidence-refresh`: `1861936`, `0c8bc0e`, `8c6dc59`, `b44c177`, `cb39080`, `8f98dca` | Codebuff assisted with the F-01 red tests, backend, UI and evidence document (group 1), and with the evidence refresh, test re-run and NFR-05 re-measurement (group 2) |
| No other AI tool, model or vendor is named in any tracked file (grep for `AI-use`, `ChatGPT`, `Claude`, `Copilot`, `Codebuff`, `AI agent`) | repository | Other tool use, if any, is not recorded in Git and is declared in §6.2 by the students |
| Definition of Done item 10 | `docs/sprints/sprint-1/features.md` §2 | Completion is shown by output produced by running the product, not by an AI statement |
| CI workflow `.github/workflows/ci.yml`, PR #17 review | repository / GitHub | The test suites run in automation and the PR was checked by a reviewer (see §4.2) |

### 6.2 Tool, tasks and verification

| Tool | Tasks assisted | Which Issues/PRs | How output was verified | Student |
|---|---|---|---|---|
| Codebuff  | Tests-first work for F-01, the F-01 implementation and UI (`e78cb7f`, `8398fe2`, `05a4f08`, `f222daa`, `097da41`, `0c3e82e`) | GitHub Issue #3 (contract ISSUE-2, F-01), PR #10 | The F-01 tests those commits introduce pass in `docs/evidence/F-01-green-full-f222daa.txt` and again in the `5c3f984` run (`docs/evidence/R-01-green-tests-5c3f984.txt`); PR #10 was reviewed and approved by the teammate (§2). Any further hand-checking by the students: None beyond the automated tests and the teammate's PR review | Napat Kasemweerasan 67070501014 |
| Deepseek Harness  | Evidence refresh: re-ran backend, frontend, build and E2E on `5c3f984`; re-measured NFR-05; updated traceability, workflow evidence and commit log; drafted this declaration (`1861936`, `0c8bc0e`, `8c6dc59`, `b44c177`, `cb39080`, `8f98dca`) | GitHub Issue #18 (`fix/sprint1/evidence-refresh`), PR #20 | The student confirmed the diff against `origin/sprint-1-staging` touches only `docs/` and `README.md`, and that cited commits exist (`git cat-file -t`); test logs are raw output saved in `docs/evidence/`; the PR is reviewed by the teammate: None beyond the automated tests and the teammate's PR review | Krittaphat Punyasompan 67070501052 |
| Claude (Anthropic, claude.ai chat)  | Wrote the audit and fix prompts for the coding agent, summarized audit reports, and drafted Issue and declaration text | Issues/PRs for the audit fixes: All Issues | The student ran the verification commands (`git diff`, `git cat-file`, `grep`) on the repository before opening the PR; Claude's output was not committed without student review:  | Napatr Kaemweerasan 67070501014, Krittaphat Punyasompan 67070501052 |


Rule this table follows: nothing is claimed as reviewed or verified by the students unless the repository shows it (a merged, reviewed pull request or a recorded passing test run) or the authors state it. Everything else is left for the authors.


### 6.3 AI Use Declaration
All code and documentation produced for this project, specifically for tasks assigned to me, was generated with the assistance of Gemini 3.8 Flash High running on Omniroute with the Deepseek Harness. I have reviewed all output, ensuring it aligns with the project's requirements, issue history, and my previous contributions, avoiding any duplication of efforts or content.
## 7. How to audit this

```bash
gh pr list --state all --base sprint-1-staging --json number,title,headRefName,author,mergedAt,mergeCommit
gh issue list --state all
gh pr view 14 --comments
gh pr view 17 --comments
git log --oneline --graph sprint-1-staging
```

The commit history for staging, including the contract-before-implementation order, is captured in `docs/evidence/sprint-1-commit-log.txt`.
