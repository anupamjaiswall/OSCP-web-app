# Changelog

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