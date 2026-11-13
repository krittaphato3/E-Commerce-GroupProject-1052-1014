/**
 * Screenshot helper for the Sprint 1 evidence set (docs/evidence/*.png).
 *
 * Screenshots are written only when `CAPTURE_EVIDENCE=1`, so a normal
 * `npm run e2e` leaves the committed evidence untouched. Nothing captured here
 * contains a password: the login form uses `type="password"`, and no spec
 * writes credentials into the page.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Locator, Page } from "@playwright/test";

const evidenceDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../docs/evidence"
);

export async function captureEvidence(page: Page, fileName: string): Promise<void> {
  if (process.env.CAPTURE_EVIDENCE !== "1") {
    return;
  }

  // Bootstrap buttons and alerts animate colour for ~150 ms; snapshotting the
  // first painted frame captures the previous state, so fast-forward them.
  await page.screenshot({
    path: path.join(evidenceDir, fileName),
    fullPage: true,
    animations: "disabled",
  });
}

/** Capture a single element (for example one table row) as its own evidence image. */
export async function captureEvidenceLocator(locator: Locator, fileName: string): Promise<void> {
  if (process.env.CAPTURE_EVIDENCE !== "1") {
    return;
  }

  await locator.screenshot({
    path: path.join(evidenceDir, fileName),
    animations: "disabled",
  });
}
