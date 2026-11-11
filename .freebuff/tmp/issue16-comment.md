Validated against `sprint-1-staging` at `47813f7`. All 6 findings reproduce. The code and configuration are correct in every case, so this is a documentation defect: the fix is documentation-only, no behavior change.

| # | Finding | Evidence on `47813f7` |
|---|---|---|
| 1 | `docker compose up -d db` | `docs/sprints/sprint-1/features.md:672`; the only service in `docker-compose.yml:2` is `postgres` |
| 2 | Bare `npm run dev` | `docs/sprints/sprint-1/features.md:675`; root `package.json` has no `dev` script, only `dev:backend` and `dev:frontend` |
| 3 | `GET /api/health` version | `backend/src/routes/health.ts:8` returns `version: "1.0.0"`; `features.md` §11 and `system-sds.md` §7.2 describe `<git sha or dev>` |
| 4 | Planned test file names | `backend/tests/error.test.ts` and `backend/tests/constraints.test.ts` exist; `features.md:711` lists `errors.test.ts` and `db.constraints.test.ts` |
| 5 | `DATABASE_URL` example | `docs/system-sds.md:277-278` uses `campusbites:changeme@localhost:5432`; `backend/.env.example` uses `postgres:postgres@localhost:5432/campusbites` |
| 6 | SRS version | `docs/srs.md` header says `1.8`; the revision history already ends at `1.9` |

Confirmed: following §11 as written fails at step 3 (no such compose service) and step 6 (no root `dev` script), so a TA on a clean clone hits errors — NFR-08 / AC-45 consistency is affected.

Plan: this issue (#16) and #15 are being done in parallel on one branch, `fix/sprint1/docs-loadbenchmark-fix`, cut from `sprint-1-staging`, with a single PR back into `sprint-1-staging`.

For item 3 we are correcting the documents to the shipped behavior (`1.0.0`) and marking the git SHA in `GET /api/health` as Lab 5 delivery, because `system-sds.md` §7.2 already plans that capability for deployment. Every changed document gets a version bump and a revision-history row, and `README.md` / `docs/traceability.md` will be re-checked for agreement afterwards.
