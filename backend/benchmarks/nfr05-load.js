"use strict";

/**
 * NFR-05 / LOAD-01 — load benchmark for the two Sprint 1 hot endpoints.
 *
 * Target (docs/srs.md NFR-05): p95 <= 500 ms and zero 5xx responses for
 * `GET /api/menu` and `POST /api/orders`, measured at 20 concurrent
 * connections for 30 s per endpoint, on a database seeded with 500 orders
 * plus an order-test item with enough stock for the whole run.
 *
 * Tested with autocannon 9.0.0. The percentile values are read straight from
 * the raw latency histogram, because autocannon's summary list does not expose
 * p95.
 *
 * Usage, in `backend/` after `npm run build` and a seeded database:
 *   node benchmarks/nfr05-load.js                  # 5 runs x 30 s, the NFR-05 run
 *   node benchmarks/nfr05-load.js --runs=1 --duration=5   # smoke run
 *
 * Environment:
 *   BASE_URL            API origin (default http://localhost:3100)
 *   SEED_CUSTOMER_PASSWORD  required, read from backend/.env
 *   E2E_CUSTOMER_EMAIL  customer account (default customer1@campusbites.test)
 */

const path = require("node:path");
const fs = require("node:fs");
const autocannon = require("autocannon");
const { decodeHist, histAsObj } = require("autocannon/lib/histUtil");
const { PrismaClient } = require("@prisma/client");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const BASE_URL = process.env.BASE_URL || "http://localhost:3100";
const CUSTOMER_EMAIL = process.env.E2E_CUSTOMER_EMAIL || "customer1@campusbites.test";
const CUSTOMER_PASSWORD = process.env.SEED_CUSTOMER_PASSWORD;
const PERF_ITEM_NAME = "Order Test Item (NFR-05)";
const STOCK_FOR_RUN = 5_000_000;
const CONNECTIONS = 20;
const EVIDENCE_DIR = path.join(__dirname, "..", "..", "docs", "evidence", "nfr05");

function readArg(name, fallback) {
  const hit = process.argv.find((value) => value.startsWith(`--${name}=`));
  return hit ? Number(hit.split("=")[1]) : fallback;
}

const RUNS = readArg("runs", 5);
const DURATION = readArg("duration", 30);
const WARMUP_DURATION = readArg("warmup", 5);

/** Nearest-rank percentile over a sorted numeric array. */
function percentileOf(values, p) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

/** Reads one percentile from an hdr-histogram, across the two API spellings. */
function latencyValue(histogram, percentile) {
  if (typeof histogram.getValueAtPercentile === "function") {
    return histogram.getValueAtPercentile(percentile);
  }
  if (typeof histogram.percentile === "function") {
    return histogram.percentile(percentile);
  }
  throw new Error("Unsupported hdr-histogram API");
}

function round(value) {
  return value === null || value === undefined ? null : Math.round(value * 10) / 10;
}

/** Extracts exact latency percentiles and status counters from one autocannon result. */
function summarise(endpoint, run, result) {
  const histogram = decodeHist(result.latencies);
  const statusCounts = {};

  for (const [code, stats] of Object.entries(result.statusCodeStats || {})) {
    statusCounts[code] = Number(stats.count);
  }

  const fiveHundreds = Object.entries(statusCounts)
    .filter(([code]) => Number(code) >= 500)
    .reduce((sum, [, count]) => sum + count, 0);

  const p50 = latencyValue(histogram, 50);
  const p95 = latencyValue(histogram, 95);
  const p99 = latencyValue(histogram, 99);
  const latencyStats = histAsObj(histogram);

  return {
    endpoint,
    run,
    durationSeconds: DURATION,
    connections: CONNECTIONS,
    requests: {
      total: result.totalCompletedRequests,
      averagePerSecond: round(result.totalCompletedRequests / result.duration),
    },
    latencyMs: {
      p50: round(p50),
      p95: round(p95),
      p99: round(p99),
      mean: round(latencyStats.mean),
      max: round(latencyStats.max),
    },
    throughputBytesPerSecond: round(result.totalBytes / result.duration),
    statusCodes: statusCounts,
    non2xx: result.non2xx,
    fiveHundreds,
    errors: result.errors,
    timeouts: result.timeouts,
    mismatches: result.mismatches,
    resets: result.resets,
  };
}

function readAutocannonVersion() {
  try {
    return require("autocannon/package.json").version;
  } catch {
    return "unknown";
  }
}

async function login() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD }),
  });

  if (response.status !== 200) {
    throw new Error(`Login failed with ${response.status}: ${await response.text()}`);
  }

  const cookie = response.headers.getSetCookie()[0];
  if (!cookie) throw new Error("Login returned no session cookie");

  return cookie.split(";")[0];
}

async function runOne(options) {
  return new Promise((resolve, reject) => {
    autocannon(options, (error, result) => (error ? reject(error) : resolve(result)));
  });
}

async function main() {
  if (!CUSTOMER_PASSWORD) {
    throw new Error("SEED_CUSTOMER_PASSWORD is not set in backend/.env");
  }

  const prisma = new PrismaClient();
  const cookie = await login();

  const perfItem = await prisma.menuItem.findFirst({
    where: { name: PERF_ITEM_NAME },
    select: { id: true, priceSatang: true },
  });

  if (!perfItem) {
    throw new Error(
      `Menu item "${PERF_ITEM_NAME}" is missing; seed it with: npm run db:seed -- --with-perf-orders`
    );
  }

  const before = {
    users: await prisma.user.count(),
    menuItems: await prisma.menuItem.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
  };

  const endpoints = [
    { name: "GET /api/menu", options: { method: "GET", url: `${BASE_URL}/api/menu` } },
    {
      name: "POST /api/orders",
      options: {
        method: "POST",
        url: `${BASE_URL}/api/orders`,
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ items: [{ menuItemId: perfItem.id, quantity: 1 }] }),
      },
    },
  ];

  const results = [];

  for (const endpoint of endpoints) {
    process.stdout.write(
      `\n${endpoint.name}: warm-up ${WARMUP_DURATION}s, then ${RUNS} x ${DURATION}s at ${CONNECTIONS} connections\n`
    );

    await runOne({ ...endpoint.options, connections: CONNECTIONS, duration: WARMUP_DURATION });

    for (let run = 1; run <= RUNS; run += 1) {
      // NFR-05 requires enough stock for the whole run; provisioning it per run
      // keeps a 100k-stock seed from running dry under sustained write load.
      if (endpoint.options.method === "POST") {
        await prisma.menuItem.update({
          where: { id: perfItem.id },
          data: { stockQty: STOCK_FOR_RUN },
        });
      }

      const result = await runOne({
        ...endpoint.options,
        connections: CONNECTIONS,
        duration: DURATION,
        skipAggregateResult: true,
      });
      const summary = summarise(endpoint.name, run, result);
      results.push(summary);

      fs.mkdirSync(path.join(EVIDENCE_DIR, "raw"), { recursive: true });
      const slug = endpoint.options.method.toLowerCase();
      fs.writeFileSync(
        path.join(EVIDENCE_DIR, "raw", `${slug}-run${run}.json`),
        JSON.stringify({ endpoint: endpoint.name, run, durationSeconds: DURATION, connections: CONNECTIONS, summary, raw: result }, null, 2)
      );

      process.stdout.write(
        `  run ${run}: p50 ${summary.latencyMs.p50} ms | p95 ${summary.latencyMs.p95} ms | p99 ${summary.latencyMs.p99} ms | ` +
          `${summary.requests.averagePerSecond} req/s | 5xx ${summary.fiveHundreds}\n`
      );
    }
  }

  const after = {
    users: await prisma.user.count(),
    menuItems: await prisma.menuItem.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
  };
  await prisma.$disconnect();

  const perEndpoint = {};
  for (const endpoint of endpoints) {
    const rows = results.filter((row) => row.endpoint === endpoint.name);
    const p95s = rows.map((row) => row.latencyMs.p95);
    const rates = rows.map((row) => row.requests.averagePerSecond);
    const fiveHundreds = rows.reduce((sum, row) => sum + row.fiveHundreds, 0);

    perEndpoint[endpoint.name] = {
      runs: rows.length,
      p95: {
        median: round(percentileOf(p95s, 0.5)),
        p90: round(percentileOf(p95s, 0.9)),
        worst: round(Math.max(...p95s)),
      },
      requestsPerSecond: {
        median: round(percentileOf(rates, 0.5)),
        p90: round(percentileOf(rates, 0.9)),
      },
      fiveHundreds,
      statusCodes: rows.reduce((acc, row) => {
        for (const [code, count] of Object.entries(row.statusCodes)) {
          acc[code] = (acc[code] || 0) + count;
        }
        return acc;
      }, {}),
    };
  }

  const verdict = Object.entries(perEndpoint).every(
    ([, value]) => value.fiveHundreds === 0 && value.p95.median <= 500
  );

  const report = {
    requirement: "NFR-05 / LOAD-01",
    testedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    node: process.version,
    platform: `${process.platform} ${process.arch}`,
    autocannon: readAutocannonVersion(),
    configuration: {
      connections: CONNECTIONS,
      durationSeconds: DURATION,
      runsPerEndpoint: RUNS,
      warmupSeconds: WARMUP_DURATION,
      perfItem: { id: perfItem.id, name: PERF_ITEM_NAME, stockProvisionedPerRun: STOCK_FOR_RUN },
    },
    seededRowsBeforeRun: before,
    rowsAfterRun: after,
    perEndpoint,
    verdict: verdict ? "PASS" : "FAIL",
    runs: results,
  };

  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, "summary.json"),
    JSON.stringify(report, null, 2)
  );

  process.stdout.write("\n=== Run-level summary ===\n");
  for (const [name, value] of Object.entries(perEndpoint)) {
    process.stdout.write(
      `${name}: p95 median ${value.p95.median} ms, p90 ${value.p95.p90} ms, worst ${value.p95.worst} ms, ` +
        `${value.requestsPerSecond.median} req/s, 5xx ${value.fiveHundreds}, statuses ${JSON.stringify(value.statusCodes)}\n`
    );
  }
  process.stdout.write(`\nSeeded rows before: ${JSON.stringify(before)}\n`);
  process.stdout.write(`Verdict: ${report.verdict}\n`);

  process.exitCode = verdict ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
