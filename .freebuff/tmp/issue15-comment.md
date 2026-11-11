Validated against `sprint-1-staging` at `47813f7`. The gap is real: `docs/traceability.md:85` has NFR-05 as `NOT RUN`, there is no autocannon dependency or benchmark script in the repository, and `docs/evidence/README.md` §6 discloses the same.

Two corrections to the issue text, so the tracker stays accurate:

1. **#7 does not stay open.** It is closed (`2026-11-10T05:37:19Z`, immediately after PR #14 merged). It was split into this issue rather than left open.
2. **NFR-05 is allocated to Sprint 3, not Sprint 1.** `docs/srs.md:105` (sprint column `3`), `docs/features.md` (R-04, Sprint 3), `docs/sprints/plan.md` (R-04, Sprint 3) and `docs/traceability.md` all say Sprint 3, and the Deliverable 1 handout only requires an NFR to be defined with a measurable target and a verification method — not executed performance evidence. So this is not a Deliverable 1 blocker; we will treat the run below as an early baseline and keep R-04's remaining hardening work in Sprint 3.

Part of the scope already exists, which keeps this bounded: `backend/prisma/seed.ts` has `seedPerformanceOrders()` (500 orders plus a 100,000-stock `Order Test Item (NFR-05)`), reachable as `npm run db:seed -- --with-perf-orders`, and `.gitignore` already carries the `!scripts/*.py` exception.

So yes, valid. This issue (#15) and #16 are being done in parallel on one branch, `fix/sprint1/docs-loadbenchmark-fix`, cut from `sprint-1-staging`, with a single PR back into `sprint-1-staging`.

The NFR-05 row moves to `PASS` only if the measured run actually holds the target: zero 5xx and p95 ≤ 500 ms for `GET /api/menu` and `POST /api/orders` at 20 connections for 30 s per endpoint, at least 5 runs, with median and p90 of the run-level metrics, the exact command, the seeded row counts and the machine spec recorded. If a target is missed, the row records the measured result honestly instead.

Documentation consequence, flagged under the team rule that specs are only edited where they are wrong: `docs/evidence/README.md` §6 and the NFR-05 line in `docs/evidence/manifest.json` currently state the benchmark has not been run, so they are updated to the measured outcome, and `docs/traceability.md` gets a revision-history row recording the tested commit.
