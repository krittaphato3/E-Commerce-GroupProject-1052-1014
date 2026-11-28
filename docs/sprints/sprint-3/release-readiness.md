# Omazon — Sprint 3 Release Readiness, Setup and Remaining Work

| Item | Value |
|---|---|
| Document | `docs/sprints/sprint-3/release-readiness.md` |
| Version | 1.0 |
| Date | 2026-11-28 |
| Evaluated commit | `dad286b` (head of `sprint-3-staging` after PR #72) |
| Related | `docs/traceability.md`, `docs/change-register.md`, `docs/features.md`, `docs/sprints/sprint-3/features.md`, `docs/labs/lab-05/deployment.md` |

### Revision history
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-28 | Initial readiness review, setup summary and remaining-work plan | Deliverable 2, Part E (Issue #60) |

## 1. Release candidate scope

| Item | Status | Verified at |
|---|---|---|
| F-01 to F-04 (Sprint 1) | accepted (`sprint-1-v1.0`) | Re-run at `dad286b` |
| F-05 to F-08, R-05 (Sprint 2) | accepted (`sprint-2-v2.0`, `2f6cc46`) | Re-run at `dad286b`; CHECK-01 on `2f6cc46` only |
| F-09 Order rejection with reason | tested, on staging; **not released** | `15ea606`; re-run at `dad286b` |
| F-10 Search and filter | planned, not implemented | NOT RUN |
| F-11 Sales summary | planned, not implemented | NOT RUN |
| F-12 Operator cancel and refund | planned, not implemented | NOT RUN |
| F-13 Login throttling | planned, not implemented | NOT RUN |
| R-04 Performance and final usability | planned | NOT RUN |

So the candidate contains F-01 to F-09 and R-05. It does **not** contain F-10 to F-13 or R-04. The tag `sprint-3-rc1` does not exist yet, and the candidate has not been merged to `main` or deployed. The final candidate run on `main` (CI run URL and deployed version) will be added after the release merge.

Acceptance criteria: 104 of 147 implemented, run and passed (AC-01 to AC-104); 43 not implemented and `NOT RUN` (AC-105 to AC-147). See `docs/traceability.md` §7.

### Regression at `dad286b` (local, 2026-11-28)

| Check | Result | Evidence (`docs/evidence/`) |
|---|---|---|
| `npm run typecheck` | exit 0 | `RC-pre-release-dad286b.txt` |
| `npm run build` | exit 0 | `RC-pre-release-build-dad286b.txt` |
| `npm run test`, backend | 242 passed, 0 failed, 0 skipped (28 files) | `RC-pre-release-dad286b.txt` |
| `npm run test`, frontend | 89 passed, 0 failed, 0 skipped (9 files) | `RC-pre-release-dad286b.txt` |
| `npm run coverage --workspace=backend` | 242 passed; `src/services` lines 97.79% (gate 85%) | `RC-pre-release-dad286b.txt` |
| `npm run e2e` | 11 passed, 0 failed, 0 skipped, 0 flaky | `RC-pre-release-e2e-dad286b.txt` |
| Sprint 1 continuity | API 45 passed; Playwright 6 passed; 0 failed, 0 skipped | `A-sprint1-continuity-dad286b.txt` |

Environment: macOS, Node.js v24.14.0, npm 11.9.0, PostgreSQL 16 in Docker. CI uses Node 22. The deployment-script tests that `test-and-docker` runs were not part of this local run.

CI: commit `cd823c6` (PR #72 head) has the same Git tree as `dad286b`; its `CI` run [46136081854](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/actions/runs/46136081854) succeeded (coverage 97.79%, 11 Playwright journeys passed). `test-and-docker` did not run on that PR, because `ci-docker.yml` does not list `sprint-3-staging` (DEC-57).

## 2. Readiness review

**Verdict.** F-09 on top of the accepted Sprint 2 release passes every automated check that was run. It is a candidate for the Deliverable 2 release, not a complete Sprint 3. It is not yet ready to be called released: the release PR, `test-and-docker` on it, deployment and the post-deployment journey are outstanding.

### Known defects and open items

| ID | Summary | Effect | State |
|---|---|---|---|
| FND-01 (#50) | An unbroken 200-character pickup note overflows on order detail | Cosmetic. The rejection reason added by F-09 already wraps | open, planned with R-04 |
| DEF-01 | Current Secret Manager values returned 401 for `operator1`, `customer1`, `customer2` on the deployed system | Graders and testers cannot rely on the secret values; a working password has to come from the team. Cause unconfirmed | documented; password reconciliation remains |

Smaller limits found while reading the code, not covered by tests: an oversized request body would be answered 500 and an unknown `/api` path gets the framework's 404 page (System SDS §4). No team decision is recorded.

**Skipped and failed tests:** 0 skipped and 0 failed in the runs listed in §1. The 43 acceptance criteria of F-10 to F-13 and R-04 have no tests yet; they are `NOT RUN`, not skipped.

### Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Final exams, 1–11 Dec (`docs/sprints/plan.md` §6). Most proposed target dates below fall inside them | Remaining Sprint 3 work slips | Contracts already written; one feature per target date; no main workflow in the last two days; confirm owners and dates now |
| Cloud SQL is the main cost and may be paused | A merge to `main` while paused fails: the migration job and smoke test need the database; the demo is down | Resume before any release or demo (`deployment.md` §11); do not merge while paused |
| Demo password mismatch (DEF-01) | A demo, UAT re-test or CHECK repeat can fail at login | Reconcile by 6 Dec (proposed); until then supply the working password through an environment variable only |
| Load-test data volume (OQ-08, open) | LOAD-02 leaves many synthetic orders in the demo database, filling the operator list (200-row limit) and the sales report | Decide data handling **before** running LOAD-02 |
| F-12 and F-11 change pinned route and transition tests | An unlisted test change could hide a regression | Contract §2.1 lists each change (CHG-04) |
| `sprint-3-staging` PRs do not run `test-and-docker` | A Docker or deploy-script failure shows only at the release PR | DEC-57 change; until then read the release PR checks |

### Cross-feature checks that cover older behaviour

All passed at `dad286b`.

| Check | What it protects |
|---|---|
| TEST-85 (`backend/tests/orders.journey.test.ts`) | Create → accept → pay → start → ready → complete through the API, across F-03, F-04, F-07, F-08 |
| TEST-92 with TEST-43 (`backend/tests/routes.access.test.ts`) | 401 and 403 on all 14 protected routes; registry matches the mounted routes; negative calls change no data |
| TEST-43 route-registry check | A new unregistered route fails the suite |
| F-06 races: TEST-62, TEST-63 | Double cancel; cancel against accept |
| F-07 race: TEST-73 | Double payment |
| F-08 race: TEST-83 | Two operators making the same fulfilment step |
| F-09 races: TEST-98, TEST-99 | Reject against customer cancel; reject against accept |
| Sprint 1 races: TEST-24, TEST-40 | Last unit of stock; double accept |

## 3. Remaining-work plan to 13 Dec 2026

**Owners and target dates are proposed, to be confirmed by the team** (answers OQ-10 once confirmed).

| Feature / defect ID | Current status (achieved AC, tested commit) | Remaining action (missing AC, verification or fix) | Owner and target date (proposed, to be confirmed by the team) |
|---|---|---|---|
| F-12 Operator cancel and refund | planned; no AC achieved | AC-124 to AC-135 (TEST-124 to TEST-135); apply the §2.1 test updates | Napat, 2 Dec |
| F-10 Search and filter | planned; no AC achieved | AC-105 to AC-115 (TEST-105 to TEST-115); pagination (CHG-06) | Krittaphat, 3 Dec |
| F-13 Login throttling | planned; no AC achieved | AC-136 to AC-143 (TEST-136 to TEST-143); migration `0003_login_throttle` | Napat, 4 Dec |
| F-11 Sales summary | planned; no AC achieved | AC-116 to AC-123 (TEST-116 to TEST-123) | Krittaphat, 5 Dec |
| FND-01 pickup-note wrap and NFR-09 all-screens states (R-04) | planned; Sprint 1 screen states pass (TEST-13, 30, 31 at `dad286b`); rejection reason already wraps (`15ea606`) | AC-145 to AC-147 (TEST-145, TEST-146 UI-CHECK-01, TEST-147 red then green); close #50. UI-CHECK-01 needs the deployed final build, so it is repeated there | Napat, 6 Dec |
| DEF-01 password reconciliation, and `ci-docker.yml` for `sprint-3-staging` (DEC-57) | DEF-01 documented (`deployment.md` §10); workflow unchanged | Reconcile the demo passwords and confirm by login, without writing them anywhere; add the branch to `ci-docker.yml` | Krittaphat, 6 Dec |
| NFR-05 deployed re-measurement (R-04) | `PASS (S1 baseline)` only (`5c3f984`) | Decide data handling first (OQ-08); AC-144 (TEST-144, LOAD-02) on the deployed build | Krittaphat, 8 Dec |
| UAT re-tests | FND-02 re-tested by automated test only; no partner re-test recorded | Re-test FND-01, FND-02 and any other recorded finding on the deployed build; record tester, version and result | Both, 9–10 Dec |
| Final regression, demo video, final release and PDF | Pre-release regression at `dad286b` only | Full suite and CI on the final commit; fresh-clone check; persistence check; deploy; post-deployment journey; tag `sprint-3-v3.0`; video; PDF | Both, 11–13 Dec |

No main workflow is left for the last two days. R-04's contract orders it after F-09 to F-13, because its screen checks and load test cover the final build.

Not in the table: the Deliverable 2 release itself (release PR from `sprint-3-staging` to `main`, deployment, post-deployment journey and the `sprint-3-rc1` tag), planned for 29 Nov in Issue #59.

## 4. Setup summary

### 4.1 Dependencies and versions

| Tool or library | Version |
|---|---|
| Node.js | `>=20.12` (`package.json`); CI and images use 22 |
| Docker with Compose | needed for PostgreSQL and the image build |
| PostgreSQL | 16 (`postgres:16-alpine`) |
| Backend | Express `^5.1.0`, Prisma `^6.4.1` (6.19.3 installed in this run), zod `^3.24.2`, bcryptjs `^3.0.2`, TypeScript `^5.7.3` |
| Frontend | React `^18.3.1`, React Router `^6.30.6`, Vite `^6.2.0`, Bootstrap `^5.3.3` |
| Tests | Vitest `^3.0.7` (3.2.7 in this run), Supertest `^7.0.0`, Testing Library, Playwright `^1.65.0` |

Exact installed versions are fixed by `package-lock.json`.

### 4.2 Environment variables

Local values go in `backend/.env`, copied from `backend/.env.example`. The values below are the placeholders or obviously fake examples.

| Name | Example | Needed |
|---|---|---|
| `PORT` | `3000` | optional |
| `NODE_ENV` | `development` | optional |
| `CLIENT_ORIGIN` | `http://localhost:5173` | optional in production |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/campusbites?schema=public` (local Docker default) | required |
| `TEST_DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/campusbites_test?schema=public` (name must end `_test`) | tests and E2E |
| `SESSION_TTL_HOURS` | `8` | optional |
| `COOKIE_SECURE` | `false` locally | optional; defaults to `true` in production |
| `BCRYPT_ROUNDS` | `10` | optional |
| `SEED_CUSTOMER_PASSWORD` | `change-me-local` (placeholder, refused in production) | required for demo seed |
| `SEED_OPERATOR_PASSWORD` | `change-me-local` (placeholder, refused in production) | required for seed |
| `SEED_DEMO_DATA` | `false` | optional |
| `RUN_MIGRATIONS` | `true` | container entrypoint only |
| `SERVE_STATIC`, `CLIENT_DIST_PATH` | `../frontend/dist` | optional |
| `E2E_*`, `CAPTURE_EVIDENCE`, `BASE_URL` | see `.env.example` | optional |
| `API_PROXY_TARGET` | `http://localhost:8080` (shell only) | optional |
| `APP_VERSION`, `GIT_SHA`, `VITE_GIT_SHA` | `abc1234` | set by the image build and release |

GitHub environment `demo` variables (names only): `GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT`. Secret Manager secret names: `toktickit-database-url`, `toktickit-admin-password`, `toktickit-demo-password`.

### 4.3 Build, run and test

```bash
cp backend/.env.example backend/.env     # then set your own local seed passwords
docker compose up -d postgres            # database only
npm install                              # also runs prisma generate
npm run db:migrate
npm run db:seed
npm run dev:backend                      # http://localhost:3000
npm run dev:frontend                     # http://localhost:5173 (second terminal)
```

```bash
npm run typecheck
npm run build
npm test
npm run coverage --workspace=backend
npm run e2e:install --workspace=frontend  # once
npm run e2e
```

Do not run `npm test` or the coverage command at the same time as `npm run e2e`; they share the test database.

Full stack in containers: `docker compose up --build -d`, then open `http://localhost:5173`; `docker compose down` stops it. Production image: `docker build -t omazon:local .` (root `Dockerfile`).

### 4.4 Migration and seed

- `npm run db:migrate` runs `prisma migrate deploy`. There are two migrations: `0001_init`, `0002_index_hygiene`.
- `npm run db:seed` is **create-only**: it never changes an existing user (including the password) or menu item. Changing a seed password in `.env` and re-seeding does **not** change an account that already exists. For a local database only, `npm run db:reset` drops, migrates and seeds again.
- In the cloud, the job `toktickit-migrate` runs migration and seed on every normal release.

### 4.5 Deployment

1. Merge a reviewed release PR into `main` (requires `test-and-docker` and one approval). The push runs the `Deploy demo` workflow: tests, image build and push, migration job, service update, smoke test, run summary.
2. Verify: `GET /api/health` shows the short SHA of the release; check the run summary and the serving Cloud Run revision (`deployment.md` §7).
3. Rollback: run `Deploy demo` on `main` with `rollback` = `true` and `image_tag` = the full 40-character SHA of an earlier successful release. Only the application image changes; the database is not rolled back and no migration or seed runs.

### 4.6 Safe test accounts

- **Local:** the seed creates synthetic accounts `customer1@campusbites.test`, `customer2@campusbites.test`, `operator1@campusbites.test`, `operator2@campusbites.test` (demo data on). Their passwords are whatever you put in your own `backend/.env` before the first seed.
- **Deployed system:** obtain working passwords through the private course handoff. Do not assume a Secret Manager value is the account password (DEF-01). Supply passwords to scripts through environment variables only; never in a command line, file or commit.
