# NFR-05 / LOAD-01 — Load Benchmark Evidence

| Item | Value |
|---|---|
| Requirement | NFR-05 (Performance), Q-04, responsibility R-04 |
| Test | LOAD-01 |
| Tested commit | `f0255a6` (benchmark harness); application code identical to `dd8a12e` / `47813f7` |
| Date | 2026-11-10 |
| Result | **PASS** — p95 ≤ 500 ms and zero 5xx responses on both endpoints |

## 1. Target

From `docs/srs.md` NFR-05: p95 ≤ 500 ms and zero 5xx responses for `GET /api/menu` and
`POST /api/orders`, measured at 20 concurrent connections for 30 s per endpoint, on a database
seeded with 500 orders and an order-test item with enough stock for the whole run.

## 2. Environment

| Item | Value |
|---|---|
| Machine | AMD Ryzen 9 8940HX, 16 cores / 32 logical processors, 31.2 GB RAM, Windows (`win32 x64`) |
| Node.js | v26.13.0 |
| API | Compiled build: `npm run build --workspace=backend`, then `PORT=3100 node dist/server.js` |
| Load generator | autocannon 9.0.0 (`backend/benchmarks/nfr05-load.js`) |
| Database | PostgreSQL 16 (`postgres:16-alpine`) in Docker Desktop 29.9.2, `synchronous_commit=on`, `fsync=on`, `max_connections=100` |
| Database state | `campusbites` freshly migrated (`0001_init`, `0002_index_hygiene`) and seeded |

The API and the load generator ran on the same machine, against a local database, exactly as the
Sprint 1 local-release configuration in the README describes.

## 3. Procedure

```bash
# 1. Fresh database state: migrations plus the benchmark seed
npm run db:migrate
npm run db:seed -- --with-perf-orders

# 2. Compiled API on a dedicated port
npm run build --workspace=backend
cd backend && PORT=3100 node dist/server.js

# 3. Benchmark: 20 connections, 30 s per endpoint, 5 runs per endpoint
npm run bench:nfr05
```

Seeded rows immediately before the recorded run:

| Table | Rows |
|---|---|
| `User` | 4 |
| `MenuItem` | 8 (the 7 menu items plus `Order Test Item (NFR-05)`) |
| `Order` | 500 |
| `OrderItem` | 500 |

`POST /api/orders` was measured with one line of quantity 1 per request against
`Order Test Item (NFR-05)`. The harness provisions 5,000,000 stock for that item before every run, so
the item cannot sell out mid-run; without that, a 100,000-stock seed would be exhausted by a
sustained write benchmark. Each run therefore starts from a known stock level and the recorded
status codes contain no `409 ITEM_UNAVAILABLE`.

The run is additive: it created 32,918 orders in the local development database. To repeat the
measurement from the same 500-order starting state:

```bash
docker exec campusbites-postgres psql -U postgres -d campusbites \
  -c 'TRUNCATE "OrderStatusHistory", "OrderItem", "Order" RESTART IDENTITY CASCADE;'
npm run db:seed -- --with-perf-orders
```

## 4. Results

Per run, 20 connections, 30 s sampling:

| Endpoint | Run | p50 (ms) | p95 (ms) | p99 (ms) | Throughput (req/s) | 5xx |
|---|---|---|---|---|---|---|
| `GET /api/menu` | 1 | 2 | 2 | 4 | 8,274.3 | 0 |
| `GET /api/menu` | 2 | 2 | 2 | 4 | 8,113.1 | 0 |
| `GET /api/menu` | 3 | 2 | 2 | 4 | 8,375.8 | 0 |
| `GET /api/menu` | 4 | 2 | 2 | 5 | 8,178.5 | 0 |
| `GET /api/menu` | 5 | 2 | 2 | 5 | 8,208.6 | 0 |
| `POST /api/orders` | 1 | 59 | 313 | 503 | 212.0 | 0 |
| `POST /api/orders` | 2 | 59 | 300 | 492 | 218.8 | 0 |
| `POST /api/orders` | 3 | 61 | 304 | 478 | 222.3 | 0 |
| `POST /api/orders` | 4 | 68 | 292 | 460 | 221.3 | 0 |
| `POST /api/orders` | 5 | 30 | 311 | 493 | 222.6 | 0 |

Run-level summary (median and p90 across the five runs):

| Endpoint | p95 median | p95 p90 | p95 worst | req/s median | Responses | 5xx |
|---|---|---|---|---|---|---|
| `GET /api/menu` | **2 ms** | 2 ms | 2 ms | 8,208.6 | 1,234,512 × `200` | 0 |
| `POST /api/orders` | **304 ms** | 312.2 ms | 313 ms | 221.3 | 32,918 × `201` | 0 |

Verdict: **PASS**. Both endpoints hold p95 ≤ 500 ms and produced zero 5xx responses across all ten
runs.

## 5. Interpretation

`GET /api/menu` is two orders of magnitude inside the target: the read path takes about 2 ms at
8,200 requests/s. `POST /api/orders` is the constrained path at roughly 221 orders/s and a 304 ms
run-level median p95, because every order is an atomic transaction that reserves stock and writes an
order, its items and a history row with `synchronous_commit=on` and `fsync=on` against Docker
Desktop's WSL2-backed storage. The margin to the 500 ms target is real but not large, so the write
path remains the first thing to watch: R-04 hardening in Sprint 3 should re-measure on the deployed
build, where the database is a managed instance rather than a laptop container.

## 6. Files

| File | Contents |
|---|---|
| `summary.json` | Machine-readable record: configuration, seeded and resulting row counts, per-run metrics, verdict |
| `raw/get-run1.json` … `raw/get-run5.json` | Raw autocannon result plus decoded summary for each `GET /api/menu` run |
| `raw/post-run1.json` … `raw/post-run5.json` | Raw autocannon result plus decoded summary for each `POST /api/orders` run |

Percentiles are read from the raw latency histogram exported by autocannon, because its summary
list has no p95 entry. No result in this folder was produced by a manual estimate.
