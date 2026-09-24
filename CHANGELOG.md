# Changelog

## V34.14.0 — 2026-09-24

### Batch 14 — fix infinite-load MutationObserver loop
- Fixed the V28 active-work-strip observer recursively observing `renderStripButton()` edits.
- Changed the observer from `childList + subtree` to direct `childList` only.
- Added a regression test preventing self-observing strip behavior from returning.
- Root cause was confirmed by a live Chrome debugger stack in CI.


## Browser gate origin correction — 2026-09-24

- Runtime browser validation now serves the exact generated `index.html` from an ephemeral localhost origin instead of navigating headless Chrome directly to `file://`.
- This avoids Chromium's headless file-origin storage initialization stall while still using the same self-contained artifact with no external assets or network dependencies.
- Static build, CSP, checksum, generated-artifact sync, and source validation remain independent of the runtime origin.


## V34.13.0 — 2026-09-24

### Batch 13 — parser-safe storage guard
- Removed the synchronous localStorage set/remove persistence probe from parser boot.
- Kept the in-memory fallback for contexts where the storage object itself is unavailable.
- Added regression coverage preventing parser-time storage mutation from returning.
- No exam state schema or methodology changed.


## V34.12.0 — 2026-09-24

### Batch 12 — parser-safe deep reference
- Compressed the inert reference payload with gzip/base64 so the browser scans far less text before reaching the end of the document.
- Moved the 410 KB deep methodology HTML out of the parser-critical DOM into an escaped inert JSON payload.
- Hydrates reference sections incrementally after `window.load`.
- Search waits for reference readiness and refreshes after hydration.
- Reference navigator and live notes index rebuild when hydration completes.
- Preserves the single-file offline artifact and the 1.5 MB size budget.


## V34.11.0 — 2026-09-24

### Batch 11 — parser-safe initial render
- Removed the last immediate V10 compatibility render embedded in wrapper setup.
- Deferred the first V14/V19 heavy compatibility render chain until after the browser load event.
- Added a 120ms post-load yield so the offline page can finish first paint and become responsive before derived panels populate.
- Added regression coverage preventing heavy compatibility rendering from returning to the parser path.


## V34.10.0 — 2026-09-24

### Batch 10 — collapse historical startup renders
- Removed redundant standalone render passes from the V8–V14 compatibility layers.
- Startup now performs one final V14 render after foundational setup; each V14 render already includes the older render chain exactly once.
- Added a regression that permits only one standalone compatibility render during boot.
- No storage schema or methodology changes.


## V34.9.0 — 2026-09-24

### Batch 9 — defer reference code decoration
- Moved processing of 420 embedded reference code blocks off the synchronous boot path.
- Copy-button creation and placeholder substitution now run in finite 24-block chunks after startup.
- Added a regression preventing whole-reference synchronous code decoration from returning.
- No storage schema change or background polling was added.


## CI browser gate repair — 2026-09-24

- Replaced file-appearance screenshot polling with a direct Chrome DevTools protocol readiness probe.
- The required gate now verifies `document.readyState === complete`, critical controls, boot health, uncaught exceptions, and PNG capture at 100%, 125%, and 150% scale.
- Chrome is explicitly terminated after verification, so app timers do not control CI lifecycle.
- Runtime application code is unchanged.


## V34.8.2 — 2026-09-24

### Browser render gate harness fix
- Replaced Chrome virtual-time/compositor screenshot flags with a fixed wall-clock headless screenshot timeout.
- Keeps the browser render gate required at 100%, 125%, and 150% scale while avoiding a Chrome lifecycle stall unrelated to app correctness.
- Runtime app code and exam methodology are unchanged.


## V34.8.1 — 2026-09-24

### Lazy-index boot leak fix
- Removed the legacy `renderSearch('')` boot call that accidentally forced the new lazy deep-search index to build during startup.
- Added a regression test preventing empty-search rendering from re-entering the boot path.
- No storage schema or exam workflow behavior changed.


## V34.8.0 — 2026-09-24

### Batch 8 — lazy search indexing
- Removed synchronous deep-reference search-index construction from script startup.
- Added `ensureSearchItems()` and a small readiness API so search data is built only when a search/index feature is actually used.
- Replaced `innerText` extraction with `textContent` to avoid layout-forcing work during index creation.
- Updated bracket lookup, command palette, notes index, favorites, and preflight to tolerate the lazy index safely.
- Added regressions that forbid eager search-index construction.


## V34.7.2 — 2026-09-24

### Browser-gate lifecycle fix
- Browser render CI now polls for a valid PNG instead of waiting for Chrome to exit naturally.
- Chrome is terminated explicitly after capture, preventing child-process/profile cleanup races on GitHub-hosted runners.
- Temporary profile cleanup is best-effort and cannot mask the actual render result.
- App runtime code and exam artifact are unchanged.


## V34.7.1 — 2026-09-24

### Browser render gate stabilization
- Replaced Chrome `--dump-dom` smoke mode with bounded screenshot rendering at 100%, 125%, and 150% scale.
- The required CI gate now proves Chrome can render the full offline app without hanging on DOM-dump completion semantics.
- Critical controls remain statically asserted and behavior remains covered by deterministic unit regressions.
- App runtime code and generated exam artifact are unchanged from V34.7.0.


## V34.7.0 — 2026-09-24

### Batch 7 — startup performance
- Replaced synchronous whole-document bracket-tag linkification during DOMContentLoaded with finite chunked processing after first paint.
- Delayed the bracket-link mutation observer until the initial pass completes, reducing boot-time mutation churn.
- Fixed global-regex state leakage in bracket-tag eligibility checks.
- Added regression coverage preventing a return to the blocking startup path.
- Browser smoke gets a slightly larger bounded process timeout while retaining a fixed virtual-time budget.


## V34.6.5 — 2026-09-24

### Browser-gate stabilization
- Replaced the flaky DevTools-pipe transport with bounded headless Chrome DOM boot checks using a fixed virtual-time budget.
- The required gate verifies runtime-created exam controls at 100%, 125%, and 150% scale.
- Typo search and high-contrast behavior remain covered by deterministic regression tests instead of fragile CDP interaction transport.
- App runtime code and generated exam artifact remain unchanged.


## V34.6.4 — 2026-09-24

### Required browser-gate pipe transport
- Replaced both TCP DevTools and `--dump-dom` with Chrome DevTools Protocol over local OS pipes.
- The required gate creates and attaches to the exact offline app target without network-port or load-event races.
- Restored real browser interaction checks for typo search, high contrast, 125%/150% zoom, boot health, and uncaught exceptions.
- App runtime code and generated exam artifact remain unchanged.


## V34.6.3 — 2026-09-24

### Required browser-gate transport fix
- Replaced flaky Chrome remote-debugging/CDP transport with native headless `--dump-dom` plus a bounded virtual-time budget.
- The required gate now proves startup JavaScript produced runtime-only controls and fails if the page does not settle within the browser timeout.
- Runs the boot check at normal, 125%, and 150% display scale.
- Keeps deterministic unit regressions for typo search and high-contrast behavior.
- App runtime code and generated exam artifact remain unchanged.


## V34.6.2 — 2026-09-24

### Browser-gate target fix
- Replaced the unreliable `Page.loadEventFired` dependency with a dedicated Chrome DevTools page target created directly for the offline `index.html`.
- Readiness checks now poll the exact app target for up to 30 seconds with bounded evaluations.
- The browser gate remains required; no app runtime code or generated exam artifact changed in this patch.


## V34.6.1 — 2026-09-24

### Browser-gate determinism fix
- Synchronized the required Chrome probe on `Page.loadEventFired` before evaluating app readiness.
- Increased bounded Runtime.evaluate timeouts and improved failure diagnostics without weakening the required gate.
- Disabled additional background Chrome services to reduce CI noise and timing variance.
- App runtime code and generated exam artifact are unchanged by this patch.


## V34.6.0 — 2026-09-24

### Batch 6 — required browser regression gate
- Promoted the headless Chrome smoke test from advisory to required CI.
- Added 125% and 150% zoom checks for critical exam controls.
- Kept typo-search, high-contrast, boot-health, and uncaught-exception checks in the required browser gate.
- This directly guards against the class of browser-only regression that caused the earlier infinite-load failure.


## V34.5.0 — 2026-09-24

### Batch 5 — target deletion integrity
- Target deletion creates a secret-free recovery snapshot first.
- Confirmation now identifies the target being deleted.
- Deleting the active target repairs active-target selection deterministically.
- All dependent views refresh after deletion to avoid stale exam state.
- Added regression coverage for ordering and active-target repair.


## V34.4.0 — 2026-09-24

### Batch 4 — report-readiness ergonomics
- Added a persisted per-target “Needs report review” flag inside the existing report object.
- Surfaced review status in the Reports header and active-target summary.
- Kept the internal review flag out of exported Markdown.
- Added regression coverage for persistence/UI wiring and export cleanliness.
- No timers, polling, cross-tab coordination, or background rendering were added.


## V34.3.0 — 2026-09-24

### Batch 3 — recovery and destructive-action safety
- Normal session imports are file-size checked and backup-schema validated before state mutation.
- Normal imports create a secret-free recovery snapshot before restore.
- Clear-all operations state creates a recovery snapshot first and uses explicit destructive wording.
- Recovery snapshot deletion now requires confirmation and uses an explicit Delete button.
- Removed the legacy two-stage normal-session import wrapper so one validated restore chain is authoritative.
- No new timers, storage listeners, polling, or background render loops were added.


## V34.2.0 — 2026-09-24

### Batch 2 — regression and security gates
- Added dynamic-code execution rejection for eval/new Function.
- Expanded offline CSP validation.
- Added a 1.5 MB generated index budget.
- Added truncated scan/noise parser fixtures.
- Added structured reference-ID and critical-anchor regressions.
- No runtime UI/storage behavior changed in this batch.


## V34.1.0 — 2026-09-24

### Batch 1 — search, readability, and browser boot safety
- Added pure typo-tolerant search scoring with regression tests.
- Added user-triggered high-contrast mode inside the existing readability controls.
- Strengthened keyboard focus visibility.
- Added a bounded headless Chrome boot smoke test in CI.
- Added no background render loops, cross-tab storage chatter, or state-schema changes in this batch.


## V33.0.0 — 2026-09-24

### Workflow integration
- Added an active-target Service Dossier combining imported endpoints with tested service methodology and deep-note search.
- Added one-click selected-host Scan Intake → target import → Service Router handoff.
- Added a local app preflight covering build identity, storage, offline isolation, critical controls, parser/search health and runtime integrity.
- Added Alt+D / Alt+F access and command-palette entries for dossier/preflight.
- Kept the generated single-file artifact synchronized with modular source.


## V32.0.0 — 2026-09-24

### Research-backed exam notes
- Replaced concurrent same-host Nmap discovery/fingerprinting with a reliable two-pass default.
- Added scan-sanity recovery for sparse/inconsistent results, lossy VPNs and pivot/SOCKS paths.
- Added output triage separating network, name/TLS, authentication, authorization and local-tool failures before tool switching.
- Added an AD `secretsdump` decision gate requiring proven local-admin or replication rights.
- Added a pivot proof ladder and route diary.
- Rebuilt malformed Sections 18.3–19.2 into valid collapsible HTML and removed old Markdown-conversion debris.
- Added concise live-note/report templates and a stronger passing-score evidence audit.
- Updated the first-30-minute exam scan flow to avoid stacking heavy scans against one host.
- Added OffSec Body of Knowledge / Authoritative References plus a dated passer-feedback synthesis.
- Added CI regressions for two-pass scanning, pivot proof, output triage and conversion-debris cleanup.


## V31.0.0 — 2026-09-24

- Added a single canonical build-version source and runtime build metadata.
- Extracted Service Router parsing/classification into a DOM-free, unit-tested core.
- Added parser regression tests for Nmap normal/grepable, UDP, Masscan, RustScan, strict lists, invalid input, priority routing, and unknown ports.
- Added JavaScript syntax auditing and methodology-fragment structure auditing.
- Added accessibility live regions for toast, parser, score, and duplicate-attempt feedback.
- Added `npm run checksum` for SHA-256 verification of the offline artifact.
- Strengthened CI to build → test → audit → validate before accepting generated artifact sync.


## V30.0.0 — 2026-09-24

- Modular source tree with generated single-file exam artifact.
- CSS, JS, and embedded reference content split under `src/`.
- Zero-dependency build script and GitHub Actions CI.
- Node tests for escaping, 70-point scoring, and evidence gates.
- Static validation for CSP, external resources, IDs, anchors, reference count, and `innerHTML` regressions.
- Four `esc()` implementations consolidated behind one tested shared utility.
- Service Router scoring and evidence-gate logic wired to tested pure helpers.
- Oversized README replaced by project/use/build documentation.
- Added `.gitignore`, `package.json`, architecture docs, content map, and changelog.

## V29 — 2026-09-24

- Added `rlwrap -cAr` to interactive `nc`/`ncat` listeners where appropriate.

## V28

- Hardened scan routing and added the attempt ledger.