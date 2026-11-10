# Omazon — Sprint 1 Workflow Evidence

| Item | Value |
|---|---|
| Document | `docs/evidence/github-workflow.md` |
| Sprint | 1 (Deliverable 1, Part F) |
| Date | 2026-11-07 |
| Source | GitHub pull requests and reviews for `krittaphato3/E-Commerce-GroupProject-1052-1014` |
| Related | `docs/sprints/sprint-1/features.md` §2 (Definition of Done), §4 |

Sprint 1 work went through feature branches cut from `sprint-1-staging`, a reviewed pull request per issue, and a merge into staging. No author approved their own pull request.

## 1. Issue, branch and pull request chain

GitHub issue numbers are sequential in this repository; the contract's `ISSUE-n` labels refer to the same slices of work.

| Contract issue | Feature / responsibility | GitHub issue | Branch | PR | Author | Reviewed by | Merged by | Merged |
|---|---|---|---|---|---|---|---|---|
| — | Specification baseline | #1 | `feature/specification-docs`, `feature/sprint1/spec-docs-setup` | [#8](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/8) | napatsun | krittaphato3 (approved) | krittaphato3 | 2026-11-05 |
| ISSUE-1 | R-03 Scaffold, schema, seed | #2 | `feature/sprint1/scaffold-db-seed` | [#9](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/9) | krittaphato3 | napatsun (changes requested, then approved) | napatsun | 2026-11-06 |
| ISSUE-2 | F-01 Authentication and session | #3 | `feature/sprint1/auth-login-logout` | [#10](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/10) | napatsun | krittaphato3 (approved) | krittaphato3 | 2026-11-06 |
| ISSUE-4, ISSUE-5 | F-02 Menu, F-03 Order submission | #4 | `feature/sprint1/menu-and-place-order` | [#11](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/11) | krittaphato3 | napatsun (approved) | napatsun | 2026-11-07 |
| ISSUE-6 | F-04 Operator list and acceptance | #5 | `feature/sprint1/operator-accept-order` | [#12](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/12) | napatsun | krittaphato3 (approved) | krittaphato3 | 2026-11-07 |
| ISSUE-3 | R-01 Access control, TEST-43, E2E journeys | #6 | `feature/sprint1/access-and-e2e-tests` | [#13](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/pull/13) | napatsun | krittaphato3 (approved) | krittaphato3 | 2026-11-07 |

## 2. Review detail

- **PR #9 (scaffold, R-03).** The review raised blocking findings, including that a fresh clone failed at steps 4–5 of the quickstart, which conflicts with NFR-08. The author fixed the findings in `ab28061`; the reviewer re-checked and approved.
- **PR #10 (F-01).** Reviewed after implementation with an approval comment; follow-up review fixes landed as `bb0acb4`, `f45ba47`, `2022899`, `6e68bee` and `83f0337` (recorded in `docs/traceability.md` revision 1.8).
- **PR #11 (F-02, F-03).** Approved against the ISSUE-4/ISSUE-5 contracts with non-blocking suggestions; the cart, order and operator follow-ups were handled in the merge.
- **PR #12 (F-04).** Approved without requested changes; later review fixes (`c680623`, `8fe7793`, `162b413`, `37cf31f`) tightened TEST-40 and the types, as recorded in traceability revisions 1.11 and 1.12.
- **PR #13 (R-01, E2E).** Approved after the route registry, TEST-43 and the Playwright journeys were reviewed together.

Review comments are written in Thai in the repository; the outcomes above are the review states and merge outcomes as recorded by GitHub.

## 3. Contribution summary

Counts are roles, not line counts; the repository history is the source of truth for who wrote what.

| Member (GitHub) | Implemented | Reviewed | Merged |
|---|---|---|---|
| napatsun (Sun) | F-01 authentication (PR #10), F-04 operator acceptance (PR #12), R-01 route registry and TEST-43 (PR #13), E2E journeys, specification baseline (PR #8) | PR #9 (blocking findings, then approval), PR #11 | PR #9, PR #11 |
| krittaphato3 | R-03 scaffold, schema and seed (PR #9), F-02 menu and F-03 order submission (PR #11) | PR #8, PR #10, PR #12, PR #13 | PR #8, PR #10, PR #12, PR #13 |

Both members authored at least two issues and reviewed the other's pull requests, which satisfies the pairing rule in `docs/sprints/sprint-1/features.md` §4.

## 4. How to audit this

```bash
gh pr list --state all --limit 20
gh pr view 9 --json reviews,comments,mergedBy
git log --oneline --graph sprint-1-staging
```

The commit history for staging, including the contract-before-implementation order, is captured in `docs/evidence/sprint-1-commit-log.txt`.
