# Omazon — Sprint 1 Evidence Pack (Deliverable 1, Part F)

| Item | Value |
|---|---|
| Document | `docs/evidence/README.md` |
| Sprint | 1 (Deliverable 1) |
| Version | 1.6 |
| Date | 2026-11-12 |
| Related | `docs/traceability.md`, `docs/sprints/sprint-1/features.md` §6. The assembled Word file is produced from these sources and submitted outside this repository. |

### Revision history
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-07 | Initial evidence pack index: screenshots, red/green logs, derived documents | Deliverable 1, Part F |
| 1.1 | 2026-11-11 | NFR-05 baseline re-measured at `5c3f984`; the earlier baseline cited a commit hash that does not exist in the repository | Pre-submission audit (Issue #18) |
| 1.2 | 2026-11-11 | Full test, E2E and build run recorded at `5c3f984`; the `4a37e95` logs are kept and marked superseded | The submitted revision must be the one the suites ran on (Issue #18) |
| 1.3 | 2026-11-11 | Replaced the "AI-use declaration not included" note with a pointer to the new declaration in `github-workflow.md` §6 | Deliverable 1 §4.2 requires a brief AI-use declaration (Issue #18) |
| 1.4 | 2026-11-12 | Added the NFR-08 / TEST-45 manual fresh-clone check (`NFR-08-fresh-clone-0b2f7d5.txt` and `.png`) | The contract requires the manual quickstart part to be recorded, and no such file existed (PR #20 review) |
| 1.5 | 2026-11-12 | §6 states that `git diff --stat 9d8e7cb..5c3f984 -- backend/src` is empty, so the demo set captured at `9d8e7cb` is still the code under test | The screenshots are a commit earlier than the tested revision and the pack did not say whether the application code had changed in between (PR #20 review) |
| 1.6 | 2026-11-12 | §1 no longer claims a "seven flows" requirement and groups the rows by the Part F demos instead; the DOCX statement now matches the handout (a PDF is what gets submitted, the `.docx` is the working file); §4 and §6 state that `manifest.json` is a curated selection, not an inventory of every file | Review round 3: the handout defines three demo categories rather than seven flows, it requires PDF rather than DOCX, and the manifest's 15 entries were read as the full evidence set (PR #20 review) |

This directory holds the evidence that the Sprint 1 requirements were met by running the product, not by assertion. File names carry the feature or responsibility they support (`F-01` to `F-04`, `R-01`), and terminal logs carry the tested commit hash in their file name.

## 1. Screenshot evidence — required flows

The flows for Part F of the deliverable, captured from the running application. The row numbers group them by the three demo categories in `docs/sprints/sprint-1/features.md` §6 (demo 1 normal journey, demo 2 rule rejection, demo 3 access control); they are not a count required by the handout:

| # | Required flow | AC | File | What the screenshot shows |
|---|---|---|---|---|
| 1 | Login page | AC-01, AC-09 | `F-01-login-page.png` | The empty login form: email, password and a single Log in action |
| 1 | Login validation | AC-02, AC-04 | `F-01-login-failure.png` | A failed login showing the generic "Invalid email or password." alert |
| 2 | Menu browsing, available and sold out | AC-10, AC-12 | `F-01-customer-menu.png` | Desktop menu with THB prices, a "1 left" stock hint, "Sold out" badges on Chicken Sandwich and Pad Thai, and the cart panel |
| 2 | Menu browsing at phone width | AC-10, AC-12 | `F-02-menu-sold-out-mobile.png` | The same catalogue at 430 px: sold-out badges, the low-stock hint and disabled Add buttons stay visible |
| 3 | Cart before confirmation | AC-14, AC-15 | `F-03-cart-filled.png` | Cart with two lines, per-line totals, estimated total `฿150.00` and an empty pickup note |
| 3 | Order confirmation | AC-14, AC-29 | `F-03-order-detail.png` | The screen shown straight after placing: order number, `Pending` and `Unpaid` badges, line items, total, pickup note |
| 4 | Customer order detail (`PENDING`) | AC-14, AC-25, AC-29 | `F-03-order-detail.png` | Same screen: server-calculated total and the first `Order placed` history row with actor `CUSTOMER` and a timestamp |
| 5 | Operator orders dashboard (oldest first) | AC-32, AC-33 | `F-01-operator-orders.png` | Operator "Incoming orders" with the Pending filter: two orders with distinct placed times, `CB-000001` above `CB-000002`, each with an Accept button |
| 6 | Operator order acceptance action | AC-34, AC-41 | `F-04-operator-accept-action.png` | Row `CB-000001` while still `PENDING`, with the green Accept button before it is clicked |
| 6 | Operator order accepted | AC-34, AC-41 | `F-04-operator-accepted.png` | The All view after the click: `CB-000001` is `ACCEPTED` with no action, `CB-000002` is still `PENDING` |
| 7 | Customer sees `ACCEPTED` | AC-41 | `F-04-customer-accepted.png` | Customer order `CB-000001` with `Accepted` and a two-row history: `Order placed`, then `Pending → Accepted` by `OPERATOR` |

## 2. Screenshot evidence — rejection and access control

| Behaviour | AC | File | What the screenshot shows |
|---|---|---|---|
| Unavailable item rejected without losing the cart | AC-21, AC-30 | `F-03-order-unavailable-409.png` | Inline alert "Mango Sticky Rice is sold out." while both cart lines and the total stay on screen; no navigation |
| Customer blocked from an operator screen | AC-42 | `F-04-customer-forbidden-403.png` | In-place "403 Forbidden: You have no access to this page." instead of the operator order table |
| My orders list | AC-28, AC-31 | `F-03-my-orders.png` | Customer order table with number, placed time, status and total, newest first |
| Logout returns to the login form | AC-06, AC-09 | `F-01-after-logout-login.png` | Post-logout state, back at the empty login form. The image is byte-identical to `F-01-login-page.png` because it is the same form and both were captured with animations disabled; TEST-06 supplies the proof that the session is gone (the old cookie is rejected with 401 and the URL is `/login`) |

## 3. Terminal evidence — red, then green

Every feature was seen failing before it passed. The file names record the commit under test.

| Feature | Red run | Green run | End-to-end |
|---|---|---|---|
| F-01 Authentication and session | `F-01-red-full-8398fe2.txt`, `F-01-red-TEST-06-05a4f08.txt`, `F-01-red-TEST-09-retroactive-60b5e57.txt` | `F-01-green-full-f222daa.txt` (backend 30 passed, frontend 1 passed), `F-01-green-TEST-06-f222daa.txt` | `F-01-e2e-097da41.txt` (1 journey passed) |
| F-02 Menu, F-03 Order submission | `F-02-F-03-red-140c030.txt` | `F-02-F-03-green-tests-0f3c649.txt` (backend 69 passed, frontend 22 passed) | `F-02-F-03-green-e2e-0f3c649.txt` (3 journeys passed) |
| F-04 Operator acceptance | `F-04-red-c04ca45.txt` | `F-04-green-tests-37cf31f.txt` (backend 82 passed, frontend 36 passed), `F-04-TEST-40-mutation-37cf31f.txt` | `F-04-green-e2e-37cf31f.txt` (5 journeys passed) |
| R-01 Access control | `R-01-red-TEST-43-d7792c8.txt` | `R-01-green-TEST-43-8f42cbd.txt`, `R-01-green-tests-5c3f984.txt` (backend 85 passed, frontend 36 passed) | `R-01-green-e2e-5c3f984.txt` (6 journeys passed) |

Supporting logs: `F-01-build-097da41.txt`, `F-01-typecheck-097da41.txt`, `F-01-test-097da41.txt`, `F-01-logout-401-097da41.txt`, `F-02-F-03-green-build-0f3c649.txt`, `F-04-green-build-*.txt`, `F-04-green-e2e-*.txt`, `R-01-green-build-5c3f984.txt`.

The R-01 row supersedes the earlier `c8fd8fc` runs (`R-01-green-tests-c8fd8fc.txt`, `R-01-green-e2e-c8fd8fc.txt`, `R-01-green-build-c8fd8fc.txt`), which are kept for history. The current logs were produced at `5c3f984`, the release-candidate commit this pack documents. The earlier `4a37e95` logs (`R-01-green-tests-4a37e95.txt`, `R-01-green-e2e-4a37e95.txt`, `R-01-green-build-4a37e95.txt`) are kept for history and are **superseded** by the `5c3f984` set.

Commands used for every run:

```bash
npm test          # backend Vitest + Supertest, then frontend Vitest
npm run e2e       # Playwright journeys on ports 3100 / 5174
npm run typecheck
npm run build
```

### 3.1 Manual check — fresh clone (NFR-08 / TEST-45)

`NFR-08-fresh-clone-0b2f7d5.txt` records the manual part of TEST-45: a clone of `fix/sprint1/evidence-refresh` at `0b2f7d5` into an empty directory, followed by the eight README quickstart commands in order. Both migrations applied, the seed exited 0, the suite passed (backend 85/85 in 16 files, frontend 36/36 in 8 files), `GET /api/health` returned 200 and the SPA login page returned 200. `NFR-08-fresh-clone-0b2f7d5.png` is the login page of that cloned instance. The run used Windows, Node.js v26.13.0, Docker 29.9.2 and `postgres:16-alpine`.

## 4. Derived evidence documents

| File | Contents |
|---|---|
| `manifest.json` | A **curated selection** of the evidence: 15 screenshots and 15 log files in a captioned order. It is not an inventory — this directory holds 56 `.png`/`.txt` files in total, including superseded and supporting runs that are kept for history |
| `test-excerpts.md` | Annotated excerpts of TEST-24 (concurrent last unit) and TEST-27 (cross-customer access), the two test excerpts required by the contract §6 |
| `github-workflow.md` | Issue → PR chains, authors, reviewers and merge points for Sprint 1 |
| `sprint-1-commit-log.txt` | Commit history of `sprint-1-staging`, showing contracts before implementation |

## 5. How the screenshots were produced

All screenshots come from Playwright driving the real application, not from a mock:

```bash
CAPTURE_EVIDENCE=1 npm run e2e
```

- `frontend/e2e/evidence.ts` writes the files only when `CAPTURE_EVIDENCE=1`, so a normal `npm run e2e` leaves the committed set untouched.
- `playwright.config.ts` starts the API on port 3100 and Vite on port 5174; `globalSetup` resets and re-seeds the **test** database first, so every run starts from the same catalogue and order numbering.
- Screenshots are full page and captured with `animations: "disabled"`, because Bootstrap buttons transition their colour over ~150 ms; without that, the first painted frame shows the previous filter state.
- The acceptance action (E-10) is a row-level capture, so the Accept button and the `PENDING` status it acts on appear together.

## 6. Outstanding items and known gaps

These are disclosed rather than hidden; they belong to the team/Lab 5 and Sprint 2–3 work:

- **NFR-05 load benchmark (autocannon) has a recorded Sprint 1 baseline.** LOAD-01 was re-measured at `5c3f984` on 2026-11-11 (5 runs × 30 s per endpoint at 20 connections, 500-order seed): `GET /api/menu` p95 1 ms and `POST /api/orders` p95 40 ms (run-level median), zero 5xx. Raw runs, the summary and the run transcript are in [`nfr05/`](nfr05/README.md); R-04 hardening and the deployed-build measurement stay in Sprint 3. The earlier 2026-11-10 baseline cited a commit hash that does not exist in the repository, which is why it was re-run rather than re-cited.
- **The unit, integration and Playwright suites were re-run at `5c3f984`** from a clean working tree (backend 85 passed in 16 files, frontend 36 passed in 8 files, 6 Playwright journeys passed, build and typecheck exit 0, no failures and no skipped tests). The screenshots were captured at `9d8e7cb`, before the later documentation and benchmark-harness commits: `git diff --stat 9d8e7cb..5c3f984 -- backend/src` is empty, so no application code changed between the demo set and the tested revision. The only files that changed in that range are `docs/` (including the benchmark evidence), `README.md`, `.gitignore`, the `backend/benchmarks` harness and the `package.json`, `backend/package.json` and `package-lock.json` entries that add the benchmark script; no file under `backend/src`, `backend/prisma`, `backend/tests`, `frontend/src` or `frontend/e2e` changed.
- **`manifest.json` is a curated selection.** It lists 15 screenshots and 15 logs in presentation order; the directory contains more files (superseded runs such as `*4a37e95.txt`, mutation checks, per-test red logs) that are kept for history rather than listed.
- **No separate order-confirmation screen.** The application navigates straight to the order detail after a successful POST, so `F-03-order-detail.png` is the confirmation evidence.
- **The login screenshot covers invalid credentials**, not the 400 field-validation state; that path is covered by TEST-04.
- **Release tag `sprint-1-v1.0`** from the contract has not been created yet.
- **Contribution table and AI-use declaration.** The AI-use declaration is in [`github-workflow.md`](github-workflow.md) §6; the contribution table is team-authored and is not generated here.
- **Deliverable format is PDF.** The handout requires the submitted document as a PDF; the pack is assembled locally (the working file is a `.docx`) and exported to PDF. The assembled file and the scripts that build it are not tracked in Git and are submitted outside this repository.

## 7. Integrity

- No real secrets, API keys or personal data are stored here. Seed accounts are synthetic (`@campusbites.test`), and passwords exist only in the local, untracked `backend/.env`.
- Every log names the commit it was produced from, so a result can be tied to a revision.
- Screenshots show only seeded demo data.
