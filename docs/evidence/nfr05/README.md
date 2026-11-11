# NFR-05 / LOAD-01 — Load Benchmark Evidence

| Item | Value |
|---|---|
| Requirement | NFR-05 (Performance), Q-04, responsibility R-04 |
| Test | LOAD-01 |
| Tested commit | `5c3f984` (application code; the harness itself was added in `f5dcf54` and is unchanged since) |
| Date | 2026-11-11 |
| Result | **PASS** — p95 ≤ 500 ms and zero 5xx responses on both endpoints |

## 1. Target

From `docs/srs.md` NFR-05: p95 ≤ 500 ms and zero 5xx responses for `GET /api/menu` and
`POST /api/orders`, measured at 20 concurrent connections for 30 s per endpoint, on a database
seeded with 500 orders and an order-test item with enough stock for the whole run.

## 2. Environment

| Item | Value |
|---|---|
| Machine | Apple M4, 10 cores, 16 GB RAM, macOS 15.7.4 (`darwin arm64`) |
| Node.js | v24.14.0 |
| API | Compiled build: `npm run build --workspace=backend`, then `PORT=3100 node dist/server.js` |
| Load generator | autocannon 9.0.0 (`backend/benchmarks/nfr05-load.js`) |
| Database | PostgreSQL 16 (`postgres:16-alpine`) in Docker 29.4.2 (`linux/arm64`), `synchronous_commit=on`, `fsync=on`, `max_connections=100` |
| Database state | `campusbites` migrated (`0001_init`, `0002_index_hygiene`) and seeded with the 500-order baseline |

The API and the load generator ran on the same machine, against a local database, exactly as the
Sprint 1 local-release configuration in the README describes.

## 3. Procedure

```bash
# 1. Fresh database state: the 500-order baseline plus the benchmark seed
docker exec campusbites-postgres psql -U postgres -d campusbites \
  -c 'TRUNCATE "OrderStatusHistory", "OrderItem", "Order" RESTART IDENTITY CASCADE;'
npm run db:seed --workspace=backend -- --with-perf-orders

# 2. Compiled API on a dedicated port
npm run build --workspace=backend
cd backend && PORT=3100 node dist/server.js

# 3. Benchmark: 20 connections, 30 s per endpoint, 5 runs per endpoint
npm run bench:nfr05
```

The console transcript of the run in this folder is `run-log-5c3f984.txt`.

**Seed flag note.** The root wrapper `npm run db:seed -- --with-perf-orders` drops the flag before it
reaches `backend/prisma/seed.ts` (the workspace script receives no arguments), so the first attempt
failed with `Menu item "Order Test Item (NFR-05)" is missing`. The run recorded here used
`npm run db:seed --workspace=backend -- --with-perf-orders`, which passes `--with-perf-orders`
through. The README's benchmark row was corrected accordingly.

Seeded rows immediately before the recorded run:

| Table | Rows |
|---|---|
| `User` | 4 |
| `MenuItem` | 8 (the 7 menu items plus `Order Test Item (NFR-05)`) |
| `Order` | 500 |
| `OrderItem` | 507 |

`POST /api/orders` was measured with one line of quantity 1 per request against
`Order Test Item (NFR-05)`. The harness provisions 5,000,000 stock for that item before every run, so
the item cannot sell out mid-run; without that, a 100,000-stock seed would be exhausted by a
sustained write benchmark. Each run therefore starts from a known stock level and the recorded
status codes contain no `409 ITEM_UNAVAILABLE`.

The run is additive: it left 194,879 orders and 194,897 order items in the local development
database. To repeat the measurement from the same 500-order starting state, run step 1 again.

## 4. Results

Per run, 20 connections, 30 s sampling:

| Endpoint | Run | p50 (ms) | p95 (ms) | p99 (ms) | Throughput (req/s) | 5xx |
|---|---|---|---|---|---|---|
| `GET /api/menu` | 1 | 1 | 1 | 3 | 18,284.0 | 0 |
| `GET /api/menu` | 2 | 1 | 1 | 3 | 17,655.4 | 0 |
| `GET /api/menu` | 3 | 1 | 1 | 3 | 16,578.9 | 0 |
| `GET /api/menu` | 4 | 1 | 1 | 3 | 16,640.3 | 0 |
| `GET /api/menu` | 5 | 1 | 1 | 4 | 15,729.6 | 0 |
| `POST /api/orders` | 1 | 10 | 37 | 56 | 1,368.5 | 0 |
| `POST /api/orders` | 2 | 11 | 39 | 60 | 1,300.7 | 0 |
| `POST /api/orders` | 3 | 11 | 40 | 61 | 1,255.1 | 0 |
| `POST /api/orders` | 4 | 12 | 42 | 64 | 1,209.8 | 0 |
| `POST /api/orders` | 5 | 13 | 47 | 72 | 1,125.3 | 0 |

Run-level summary (median, p90 and worst across the five runs):

| Endpoint | p95 median | p95 p90 | p95 worst | req/s median | Responses | 5xx |
|---|---|---|---|---|---|---|
| `GET /api/menu` | **1 ms** | 1 ms | 1 ms | 16,640.3 | 2,543,984 × `200` | 0 |
| `POST /api/orders` | **40 ms** | 45 ms | 47 ms | 1,255.1 | 187,810 × `201` | 0 |

Verdict: **PASS**. Both endpoints hold p95 ≤ 500 ms and produced zero 5xx responses across all ten
runs.

**Superseded run.** An earlier baseline recorded on 2026-11-10 reported
`GET /api/menu` p95 2 ms and `POST /api/orders` p95 304 ms on a Windows machine, but it cited a
commit hash that does not resolve in the repository. The numbers could therefore not be tied to a
revision, so the benchmark was re-measured at `5c3f984` instead. The replacement run above is the recorded
baseline; the difference in write-path latency (304 ms → 40 ms) follows from the different machine
and the same `fsync=on`/`synchronous_commit=on` settings, not from an application change.

## 5. Interpretation

`GET /api/menu` is far inside the target: the read path takes about 1 ms at 16,600 requests/s.
`POST /api/orders` is the constrained path at roughly 1,255 orders/s and a 40 ms run-level median
p95, because every order is an atomic transaction that reserves stock and writes an order, its items
and a history row with `synchronous_commit=on` and `fsync=on`. The margin to the 500 ms target is
large on this machine, but the measurement is still a single-host local baseline: R-04 hardening in
Sprint 3 should re-measure on the deployed build, where the database is a managed instance rather
than a laptop container, and the number should be taken as indicative until then.

## 6. Files

| File | Contents |
|---|---|
| `summary.json` | Machine-readable record: configuration, seeded and resulting row counts, per-run metrics, verdict |
| `run-log-5c3f984.txt` | Console transcript of the recorded run (seed, API start, per-run lines, verdict) |
| `raw/get-run1.json` … `raw/get-run5.json` | Raw autocannon result plus decoded summary for each `GET /api/menu` run |
| `raw/post-run1.json` … `raw/post-run5.json` | Raw autocannon result plus decoded summary for each `POST /api/orders` run |

Percentiles are read from the raw latency histogram exported by autocannon, because its summary
list has no p95 entry. No result in this folder was produced by a manual estimate.
