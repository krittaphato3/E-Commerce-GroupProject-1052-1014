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
| — | Specification baseline | #1 | `feature/specification-docs`, `feature/sprint1/spec-docs-setup` | [#8](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/8) | napatsun | krittaphato3 (approved) | krittaphato3 | 2026-11-05 | `addbc0e` |
| ISSUE-1 | R-03 Scaffold, schema, seed | #2 | `feature/sprint1/scaffold-db-seed` | [#9](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/9) | krittaphato3 | napatsun (changes requested, then approved) | napatsun | 2026-11-06 | `60b5e57` |
| ISSUE-2 | F-01 Authentication and session | #3 | `feature/sprint1/auth-login-logout` | [#10](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/10) | napatsun | krittaphato3 (approved) | krittaphato3 | 2026-11-06 | `9e1a0ab` |
| ISSUE-4, ISSUE-5 | F-02 Menu, F-03 Order submission | #4 | `feature/sprint1/menu-and-place-order` | [#11](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/11) | krittaphato3 | napatsun (approved) | napatsun | 2026-11-07 | `9495000` |
| ISSUE-6 | F-04 Operator list and acceptance | #5 | `feature/sprint1/operator-accept-order` | [#12](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/12) | napatsun | krittaphato3 (approved) | krittaphato3 | 2026-11-07 | `30b0f12` |
| ISSUE-3 | R-01 Access control, TEST-43, E2E journeys | #6 | `feature/sprint1/access-and-e2e-tests` | [#13](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/13) | napatsun | krittaphato3 (approved) | krittaphato3 | 2026-11-07 | `b7f1ed8` |
| — | README and evidence pack (Deliverable 1 Part F) | #7 | `feature/sprint1/evidence-readme-pdf` | [#14](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/14) | krittaphato3 | napatsun (changes requested, then approved) | napatsun | 2026-11-10 | `47813f7` |
| — | NFR-05 / LOAD-01 benchmark, R-04 baseline | #15 | `fix/sprint1/docs-loadbenchmark-fix` | [#17](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/17) | krittaphato3 | napatsun (approved, non-blocking comments) | napatsun | 2026-11-10 | `5c3f984` |
| — | Documentation-vs-code audit corrections | #16 | `fix/sprint1/docs-loadbenchmark-fix` | [#17](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/17) | krittaphato3 | napatsun (approved, non-blocking comments) | napatsun | 2026-11-10 | `5c3f984` |
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
| krittaphato3 | R-03 scaffold, schema and seed (PR #9), F-02 menu and F-03 order submission (PR #11), README and evidence pack (PR #14), NFR-05 benchmark and audit corrections (PR #17) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |

Both members authored at least two issues and reviewed the other's pull requests, which satisfies the pairing rule in `docs/sprints/sprint-1/features.md` §4.

## 4. Review evidence

Two completed Issues with their pull requests, as required by `reference/project_deliverable_1_v1.pdf` §4.2. Quotes are verbatim; Thai comments are left untranslated deliberately so the original review text can be checked against GitHub.

### 4.1 Issue #7 — README and evidence pack (PR #14)

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

### 4.2 Issues #15 and #16 — NFR-05 baseline and audit corrections (PR #17)

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

## 5. Screenshots to capture manually (TODO — team task, not yet done)

Screenshots cannot be produced by the documentation tooling; these must be captured from GitHub by a team member and inserted into Part F of the PDF:

- [ ] **TODO — final project board.** The GitHub Project board in its final Sprint 1 state, showing every Sprint 1 Issue in `Done`.
- [ ] **TODO — Issue #7 and PR #14.** The PR #14 conversation showing the review of 2026-11-07 and the approval of 2026-11-10, with the branch name and the merge into `sprint-1-staging` visible.
- [ ] **TODO — Issues #15/#16 and PR #17.** The PR #17 conversation showing the approval review and the "Merged" state.
- [ ] **TODO — release PR.** The `sprint-1-staging` → `main` pull request page after it is opened and merged (see the placeholder row in §1).
- [ ] **TODO — release tag.** The tag `sprint-1-v1.0` (once created) and the commit it points to.

Each screenshot should be labelled with the Issue/PR number, the branch, the author, the reviewer and the merge commit, so it matches the tables above.

## 6. How to audit this

```bash
gh pr list --state all --base sprint-1-staging --json number,title,headRefName,author,mergedAt,mergeCommit
gh issue list --state all
gh pr view 14 --comments
gh pr view 17 --comments
git log --oneline --graph sprint-1-staging
```

The commit history for staging, including the contract-before-implementation order, is captured in `docs/evidence/sprint-1-commit-log.txt`.
