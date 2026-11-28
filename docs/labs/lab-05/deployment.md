# Lab 5 Deployment Notes (CPE 334)

Status: Lab 5 is deployed. The application runs on Google Cloud Run and the automated pipeline (`Deploy demo`) is live: every merge into `main` is tested, built, released and smoke-tested automatically.

## 1. Stack summary

| Layer | Choice |
| --- | --- |
| Language / framework | TypeScript, Express 5 API; React 18 + Vite SPA (npm workspaces: `backend`, `frontend`) |
| Database / ORM | PostgreSQL 16, Prisma 6 (`prisma migrate deploy`) |
| Auth | Opaque random session token in the `cb_session` cookie; only its SHA-256 hash is stored in the `Session` table (no in-memory state, no signing secret) |
| File uploads | None (N/A) |
| Port | `PORT` env var (default 3000), bound to `0.0.0.0` |
| Probes | `GET /api/health` (no DB), `GET /api/ready` (200 if DB reachable, 503 if not) |

Deviation from the reference stack (Docker, Cloud Run, Cloud SQL for PostgreSQL, Secret Manager, GitHub Actions): none in the choice of components.
Containerization:
- Multi-container Docker Compose for development and end-to-end testing: `postgres` (PostgreSQL 16), `backend` (Express 5 API on :3000 with `NODE_ENV=development`), and `frontend` (Nginx serving SPA and proxying `/api` on :5173).
- Single-container multi-stage root `Dockerfile` for Cloud Run (Node 22 runtime serving API and built SPA static files from the same origin). The root image entrypoint runs `exec "$@"` by default, and optionally executes `prisma migrate deploy` + `db:seed` when `RUN_MIGRATIONS=true`.
The deployed system uses Cloud Run (service and migration job), Cloud SQL for PostgreSQL, Secret Manager and Artifact Registry. It is released by the GitHub Actions workflow `.github/workflows/deploy.yml` (see sections 4 and 5).

### Seed and deploy notes
- The Cloud Run migration job runs `migrate` + `seed` on every release. The seed is create-only for users (an existing user's password hash is never changed); menu data is create-only.
- With `NODE_ENV=production` and `SEED_DEMO_DATA` unset or `false`, the seed creates only the operator account `operator1@campusbites.test`, using `SEED_OPERATOR_PASSWORD`. That variable must be set and must not be the `change-me-local` placeholder. Demo customers, the second operator and the test-fixture menu items are skipped.
- `deploy/deploy.sh` mounts the Secret Manager secret `toktickit-admin-password` as `SEED_OPERATOR_PASSWORD` and (with `--demo`) `toktickit-demo-password` as `SEED_CUSTOMER_PASSWORD` in the migration job. The job runs `npx prisma migrate deploy --schema=backend/prisma/schema.prisma && npm run db:seed`.
- `SEED_DEMO_DATA=true` is needed on the cloud job only when demo accounts are wanted (Lab 6); it also requires `SEED_CUSTOMER_PASSWORD`.
- `COOKIE_SECURE` defaults to `true` when `NODE_ENV=production` (and `false` otherwise); an explicit value wins. It must be `true` behind HTTPS (Cloud Run). The repo's `docker-compose.yml` runs backend with `NODE_ENV=development`, so local compose runs keep it `false` for HTTP.
- CORS: in production with `CLIENT_ORIGIN` unset, CORS is disabled (same-origin deployment). Outside production the default is `http://localhost:5173` with credentials.
- Seeding never overwrites existing users or menu items. Without demo data it creates the first operator and the four starter menu items; the sold-out/last-unit/delisted fixture items are demo-only. `SEED_DEMO_DATA` accepts `true`/`false`/`1`/`0`; any other value (for example `ture`) makes the seed fail.
- `/api/ready` runs `SELECT 1` with a 2 second timeout (503 on failure or timeout), sends `Cache-Control: no-store`, and logs only an error code and redacted message, never a connection string.

## 2. Environment variables

| Name | Purpose | Secret? | Source |
| --- | --- | --- | --- |
| `PORT` | HTTP port | No | Local `.env`; Cloud Run sets it automatically |
| `NODE_ENV` | `development` / `test` / `production` | No | Local `.env`; Cloud Run env var |
| `DATABASE_URL` | PostgreSQL connection string | Yes | Local `.env`; Secret Manager |
| `TEST_DATABASE_URL` | Test DB (name must end `_test`) | No (local only) | Local `.env` |
| `CLIENT_ORIGIN` | CORS allowed origin; optional in production (unset disables CORS) | No | Local `.env`; Cloud Run env var |
| `SESSION_TTL_HOURS` | Session lifetime | No | Local `.env`; Cloud Run env var |
| `COOKIE_SECURE` | Defaults to `true` in production; must be `true` behind HTTPS | No | Local `.env`; Cloud Run env var |
| `BCRYPT_ROUNDS` | bcrypt cost (4-15) | No | Local `.env`; Cloud Run env var |
| `SEED_DEMO_DATA` | Seed demo data (default on locally, off in production) | No | Local `.env`; Cloud Run env var |
| `SEED_CUSTOMER_PASSWORD` | Demo customer password | Yes | Local `.env`; Secret Manager |
| `SEED_OPERATOR_PASSWORD` | Demo operator password | Yes | Local `.env`; Secret Manager |
| `RUN_MIGRATIONS` | Opt-in migration + seed run in root entrypoint (default off) | No | Cloud Run job / manual run |
| `API_PROXY_TARGET` | Vite dev proxy target (default `http://localhost:3000`) | No | Shell only, e.g. `API_PROXY_TARGET=http://localhost:8080 npm run dev:frontend`; not read from `backend/.env` |
| `E2E_*`, `CAPTURE_EVIDENCE` | Playwright overrides | No | `backend/.env` (loaded by `frontend/playwright.config.ts`) or shell |
| `BASE_URL` | NFR-05 benchmark target | No | `backend/.env` (loaded by `backend/benchmarks/nfr05-load.js`) or shell |

## 3. Local commands

### Docker Compose (Full Stack)

```bash
docker compose up --build -d             # build and start postgres, backend, and frontend
docker compose ps                        # check container status and health
docker compose logs -f backend           # follow backend logs and migration status
curl http://localhost:3000/api/health    # probe backend health directly
curl http://localhost:3000/api/ready     # probe backend readiness (DB check)
curl http://localhost:5173/api/health    # probe health via frontend Nginx proxy
docker compose down                      # stop containers (database volume persists)
```

### Local Development (without Docker for app services)

```bash
npm ci                                   # install
docker compose up -d postgres            # local database only
cp backend/.env.example backend/.env     # then set local seed passwords
npm run db:migrate                       # apply migrations
npm run db:seed                          # seed demo data (idempotent)
npm run dev:backend                      # run API on :3000
npm run dev:frontend                     # run SPA on :5173
npm run build                            # build both workspaces
npm test                                 # unit + integration tests
npm run e2e                              # Playwright (needs e2e:install once)
```

## 4. CI/CD and Deployment

- **`test-and-docker`** (in `.github/workflows/ci-docker.yml`): The required PR check gate. Runs deploy script static validation (`bash -n`, stub tests, smoke tests), backend unit/integration tests against a real PostgreSQL 16 service container with the COV-01 coverage gate (see below), frontend tests and production build, and verifies root `Dockerfile` build. It does not deploy anything. It is also a reusable workflow (`workflow_call`), which `deploy.yml` calls.
- **`ci.yml`**: Continues to run on pull requests for full unit, integration, and Playwright E2E test coverage across browsers.
- **Coverage gate (COV-01)**: both workflows run `npm run coverage --workspace=backend` as their backend test step. It fails below 85% line coverage of `backend/src/services` (settings in `backend/vitest.config.ts`). Because the step is part of `test-and-docker`, it also blocks the deployment. `ci.yml` uploads `backend/coverage/` as the run artifact `backend-coverage`. `ci-docker.yml` also runs on pull requests into `sprint-2-staging`.
- **Concurrency**: PR runs automatically cancel prior runs for the same branch (`cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}`). Runs on `main` complete without cancellation.
- **`deploy.yml` (workflow name: Deploy demo)**: Deploys to Cloud Run.
  - **Triggers**: every push to `main`, and manual `workflow_dispatch` with two inputs: `rollback` (boolean, default `false`) and `image_tag` (string, the commit SHA to deploy in rollback mode).
  - **`test` job**: calls `ci-docker.yml`, so a release only proceeds if `test-and-docker` passes. It is skipped when `rollback` is `true`.
  - **`deploy` job**: runs in the GitHub environment `demo` with `id-token: write` permission. It authenticates to Google Cloud with Workload Identity Federation (`google-github-actions/auth`), so no service account key is stored anywhere. It then:
    1. validates that rollback mode has an `image_tag`;
    2. configures Docker for Artifact Registry;
    3. builds the root `Dockerfile` and pushes it as `toktickit:<full commit SHA>` (skipped in rollback mode);
    4. runs `deploy/release.sh`, which resolves the image to an immutable `@sha256` digest, runs the migration job `toktickit-migrate` (normal release only; a failed migration stops the release before the service is touched), updates the Cloud Run service `toktickit` to that digest and sends it 100% of traffic;
    5. runs `deploy/smoke_test.py` against the live service URL (`/api/health`, `/api/ready`, `/`, `/api/menu`, with retries for cold starts);
    6. writes a **Run Summary** (commit image tag, image digest, service URL).
  - **Concurrency**: group `deploy-demo`, `cancel-in-progress: false`, so a deployment in progress is never cancelled by a newer one.

## 5. GCP Resources and Conventions

- GCP project ID: `cpe334-1014-1052`
- Region: `asia-southeast1`
- Public URL: <https://toktickit-lchsspl3sa-as.a.run.app>
- **Starter Kit Resource Naming**: The deployment scripts (`deploy/deploy.sh`, `deploy/teardown.sh`, `deploy/release.sh`) retain the course Starter Kit naming conventions as expected by the lab grading rubric, while deploying the CampusBites containerized application:
  - Artifact Registry repository: `toktickit`
  - Cloud Run service: `toktickit`
  - Cloud SQL instance: `toktickit-pg` (PostgreSQL 16)
  - Cloud SQL database & user: `toktickit`
  - Cloud Run migration & seed job: `toktickit-migrate`
  - Service Account: `toktickit-runner`
  - Secret Manager secrets: `toktickit-database-url`, `toktickit-admin-password`, `toktickit-demo-password`
- **Pipeline identity (keyless deployment)**:
  - Deployer service account: `toktickit-deployer`
  - Workload Identity pool: `github-actions`; provider: `github-main`
  - GitHub environment `demo` with four variables: `GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT` (the WIF values are not recorded in this document; they live only in the GitHub environment settings)

## 6. Release procedure

1. Create a GitHub Issue describing the change.
2. Create a branch from `lab5-staging`, named `feature/...`, `fix/...` or `docs/...`.
3. Open a PR into `lab5-staging` with the label `lab5`. The teammate reviews and approves it; the author never approves their own PR.
4. Merge into `lab5-staging` with a merge commit.
5. If `main` is ahead of `lab5-staging`, merge `origin/main` into `lab5-staging` and push.
6. Open the release PR `lab5-staging` -> `main`. The branch protection ruleset `protect-main` requires the check `test-and-docker` and 1 approval.
7. Merge the release PR into `main` with a merge commit.
8. The `Deploy demo` workflow starts automatically on the push to `main`.
9. Verify: open the workflow run and check the Run Summary, confirm the smoke test step is green, and confirm the new Cloud Run revision is serving (section 7).

## 7. How to find the running commit

1. **GitHub Actions**: open Actions -> `Deploy demo` -> the run -> Summary. It shows `Commit image tag` (the full 40-character commit SHA) and `Image digest` (`...@sha256:...`).
2. **Cloud Run**: the service's image digest must equal the digest in the Summary:

   ```bash
   gcloud run services describe toktickit --region asia-southeast1 --format="value(spec.template.spec.containers[0].image)"
   ```

3. **Artifact Registry**: the image is tagged with the commit SHA:

   ```bash
   gcloud artifacts docker images list asia-southeast1-docker.pkg.dev/cpe334-1014-1052/toktickit --include-tags
   ```

Evidence examples:

| Release | Commit SHA (image tag) | Cloud Run revision | Image digest |
| --- | --- | --- | --- |
| A | `c70969973cdfee6ea64213a3de1685d907610607` | `toktickit-00002-9h5` | `sha256:f8bb8fb00378749a07311f3f6d0158776e1f16054495b3f7dc799f708f3a5db5` |
| B | `f7d50f7f63eef2dadcbe84b09e6e53b4f3ada19a` | `toktickit-00003-87w` (same image served again as `toktickit-00005-b4n` after the roll-forward) | `sha256:3ae886f2ebe5f67cd713797970af0368ec57422f884f7c66210c4b0101bd6fcb` |

Cloud Run revision history (`gcloud run revisions list --service toktickit --region asia-southeast1 --limit 5`):

| Revision | Deployed (UTC) | Deployed by |
| --- | --- | --- |
| `toktickit-00005-b4n` (active) | 2026-11-22 14:36:41 | `toktickit-deployer` |
| `toktickit-00004-zgn` | 2026-11-22 14:32:27 | `toktickit-deployer` |
| `toktickit-00003-87w` | 2026-11-22 14:10:51 | `toktickit-deployer` |
| `toktickit-00002-9h5` | 2026-11-22 13:39:53 | `toktickit-deployer` |
| `toktickit-00001-zwk` | 2026-11-22 07:25:04 | a team member (manual first deploy with `deploy/deploy.sh`) |

## 8. Rollback and roll-forward

**Rollback**: Actions -> `Deploy demo` -> Run workflow, branch `main`, `rollback` = `true`, `image_tag` = the full 40-character SHA of an earlier successful release. In rollback mode the test, build and migration steps are skipped. Only the application image of the Cloud Run service changes (`release.sh` updates the service and restores 100% traffic to it); the database is not rolled back. The smoke test and Run Summary still run.

**Roll-forward**: run the same workflow again with `rollback` = `true` and the newer SHA as `image_tag`.

| Symptom | Cause / fix |
| --- | --- |
| `Invalid image tag.` | A short SHA was used. Use the full 40-character lowercase SHA. |
| `Image digest not found.` | No image with that tag exists in Artifact Registry. Check the tag with the `gcloud artifacts docker images list` command in section 7. |
| Workflow fails at authentication / branch not allowed | Run the workflow from branch `main` (the deployment is set up to accept runs from `main` only). |
| Page does not change after a deployment | The browser cached the old page. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R). |

## 9. Persistence check

- Orders are stored in Cloud SQL (PostgreSQL). An order created before a rollback and a roll-forward was still present afterwards.
- Sessions are stored in the database (only the hash of the `cb_session` cookie token is stored), so a signed-in user stays signed in across a redeploy.
- The app has no file uploads, so there is no file storage to persist.

## 10. Demo accounts

- The production seed creates only `operator1@campusbites.test` by default (`SEED_DEMO_DATA` unset or `false`).
- For the demo, the migration job `toktickit-migrate` was updated with `SEED_DEMO_DATA=true` and the secret `toktickit-demo-password` mounted as `SEED_CUSTOMER_PASSWORD`, so the demo customers `customer1` and `customer2` exist.
- Passwords are never written in the repository or in this document. The seed is create-only: it never changes the password hash of an existing user. Therefore the current value of `toktickit-admin-password` or `toktickit-demo-password` is the password of an account only if the account was created from that version. It may differ for accounts created earlier. Before relying on a secret, confirm it by logging in. If login returns 401, ask the team for the working password and supply it through an environment variable, never in a command line, a file or a commit.
- To read a secret value in Cloud Shell, run the command below with the secret name (`toktickit-admin-password` for the operator, `toktickit-demo-password` for customers). The limit above applies: the value read is not proof of the account password.

  ```bash
  gcloud secrets versions access latest --secret=<name>
  ```

- **Known defect DEF-01** (`docs/change-register.md`): on 2026-11-28 the current values of both secrets returned 401 for `operator1`, `customer1` and `customer2` (`docs/evidence/CHECK-01-2f6cc46.txt`, Finding). Status: **documented; password reconciliation remains**. The cause is unconfirmed.

## 11. Cost control

- Cloud SQL (`toktickit-pg`) is the main cost. Pause it when the system is idle; follow the pause/resume steps in the Student Guide, Episode 9. (The repository does not contain a pause or resume script.)
- Do not merge into `main` while the database is paused: the release runs the migration job and the smoke test needs the database.
- At the end of term, and only after grading is finished, remove everything with `deploy/teardown.sh`. It permanently deletes the Cloud SQL data. Preview first with `DRY_RUN=1 ./deploy/teardown.sh`; a real run asks you to type the project ID.

## 12. Known limitations

- The optional login check in the smoke test is skipped, because `SMOKE_EMAIL` and `SMOKE_PASSWORD` are not set (the script prints `SKIP login`). The four public checks still run.
- Some GitHub Actions show a Node.js 20 deprecation annotation. It is a warning only and does not affect the result.
