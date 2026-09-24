# 🔐 OSCP Exam OS

**V34.6 — exam-time, offline-first OSCP/OSCP+ methodology and decision-support app.**

The repository ships one self-contained **`index.html`** for exam use while keeping maintainable source modular under `src/`. No runtime server, CDN, package install, external stylesheet, or network connection is required.

## Exam use

1. Download or clone the repository before the exam.
2. Open **`index.html`** directly in a modern browser.
3. Keep it local/offline.
4. Use Search, Service Router, methodology trees, target workspace, and evidence gates instead of scrolling linearly.

GitHub Pages: https://anupamjaiswall.github.io/OSCP-web-app/

> Live OffSec instructions, the Exam Control Panel, and the proctor always override this offline reference. This app is for exam-time reference, not AI assistance during the exam.

## V34.6 Batch 6 — required browser regression gate

- Headless Chrome boot/interaction testing is now a required CI gate, not advisory.
- The gate creates a dedicated Chrome DevTools target for the offline `index.html` and polls that exact page for readiness, avoiding races with Chrome's initial blank tab.
- CI verifies the offline app reaches a healthy boot state with core exam controls present.
- The browser test exercises typo-tolerant search and high-contrast mode.
- It additionally checks critical controls at 125% and 150% zoom.
- Any uncaught browser exception now fails the build.

## V34.5 Batch 5 — target deletion integrity

- Target deletion now names the target in the confirmation prompt.
- A secret-free recovery snapshot is created before the target is removed.
- If the deleted target was active, the app selects a deterministic remaining target (or clears active state).
- All dependent exam views refresh immediately after deletion instead of leaving stale UI.
- No new background behavior was added.

## V34.4 Batch 4 — report-readiness ergonomics

This batch adds one small report-state flag to the existing target report object.

- **Needs report review:** mark a target when its commands, screenshots, or narrative still need a final human pass.
- **Visible status:** the Reports view shows the review flag beside the target selector.
- **Cockpit visibility:** the active-target summary carries a REPORT REVIEW chip until the flag is cleared.
- **Export stays clean:** the internal review flag is intentionally not written into exported report Markdown.
- No timers, polling, cross-tab coordination, or background rendering were added.

## V34.3 Batch 3 — recovery and destructive-action safety

This batch changes existing recovery paths only; it adds no polling, background render loop, or cross-tab behavior.

- **Validated normal session restore:** secret-free session JSON is size-checked and schema-validated before any live state is replaced.
- **Automatic pre-restore snapshot:** normal session imports create a secret-free recovery point first.
- **Safe clear-all:** clearing browser operations state creates a recovery snapshot before deletion and uses explicit “Clear ALL” wording.
- **Snapshot delete confirmation:** restore points cannot be deleted with a single accidental click.
- **One restore chain:** the legacy two-stage normal-session import wrapper is removed so one validated restore path is authoritative.

## V34.2 Batch 2 — regression and security gates

This batch changes validation/tests only; it adds no runtime behavior.

- Rejects `eval()` and `new Function()` in shipped JS modules.
- Validates the full offline CSP baseline, not only `connect-src`.
- Enforces a 1.5 MB generated-artifact budget.
- Adds malformed/truncated scan fixtures and numeric-noise regressions.
- Locks in critical Linux/Windows/AD reference anchors and structured content IDs.

## V34.1 Batch 1 — safe retrieval/readability upgrades

This batch deliberately avoids background timers, storage listeners, runtime polling, and state-schema changes.

- **Typo-tolerant search:** common one-edit mistakes in strong title/tag tokens still surface the intended methodology.
- **High-contrast reading mode:** user-triggered and persisted inside the existing readability settings.
- **Stronger focus visibility:** keyboard focus remains obvious during long exam sessions.
- **Bounded headless-browser boot test:** CI now opens the generated offline `index.html` in Chrome with a fixed virtual-time budget and asserts core exam surfaces exist.

## V33 integration upgrades

V33 keeps the V32 research-backed methodology and makes the exam workflow more connected:

- **Active-target Service Dossier:** imported ports are classified against the tested Service Router core and shown with first-pass methodology, a manual/native truth check, failure fallback, and direct note search.
- **Selected Scan Handoff:** every Scan Intake preview host gains **Import + Route**, which imports only that host, makes it active, and opens Service Router with its real TCP/UDP endpoints.
- **Exam App Preflight:** checks build identity, localStorage, offline isolation/CSP, critical controls, duplicate IDs, Service Router parsing, search-index health, runtime boot integrity, local-file usage, and active-target state.
- **Fast access:** Service Dossier is available from the active-work strip/workspace and **Alt+D**; Preflight is visible on Start/top bar and **Alt+F**.
- These additions reuse live target state and the existing methodology rather than adding a second command cheatsheet.

## V32 research-backed note upgrades

V32 was reviewed against the current OffSec Exam Guide, FAQ and Body of Knowledge plus recent 2026 pass reports. Recurring high-signal patterns were converted into exam-time decision aids:

- clean full-port discovery → targeted fingerprinting;
- output/error classification before tool switching;
- a layer-by-layer pivot proof ladder;
- rights-gated AD credential extraction;
- concise evidence-oriented live notes;
- stronger passing-score screenshot/report audits;
- repaired reporting/quick-reference markup left by older Markdown conversion.

Community pass reports are anecdotal evidence only; official OffSec instructions remain authoritative.

Research log: [docs/RESEARCH-2026-09-24.md](docs/RESEARCH-2026-09-24.md)

## V31 reliability foundation

- **One canonical build version:** `src/meta/build.json` drives the visible build and is validated against `package.json`.
- **Unit-tested Service Router core:** scan parsing/classification is separated from DOM rendering and tested against Nmap normal/grepable, UDP, Masscan, RustScan, strict lists, garbage input, invalid ports, priority routing, and unknown ports.
- **JavaScript syntax audit:** every source JS module is compiled by Node in CI.
- **Content-structure audit:** methodology fragments are checked for balanced `details`, `pre`, and `code` tags.
- **Accessibility feedback:** changing parser, score, toast, and duplicate-attempt feedback are polite ARIA live regions.
- **Artifact checksum:** `npm run checksum` prints SHA-256 for the exact offline `index.html`.

## Architecture

```text
src/index.template.html
 + src/styles/*.css
 + src/js/*.js
 + src/content/*.html
 + src/meta/build.json
          ↓
   scripts/build.mjs
          ↓
      index.html
```

**Do not hand-edit `index.html`.**

```bash
npm run check
npm run checksum
```

The large methodology is no longer duplicated in README; `src/content/` is the source of truth.

## Development

Node.js 20+, zero npm dependencies:

```bash
npm run build
npm test
npm run audit
npm run validate
npm run checksum
npm run check
```

CI rebuilds the exam artifact and fails if committed `index.html` drifts from source.

## Why the final output stays one file

A single local HTML file is an operational advantage under exam pressure: no server, missing assets, CDN, CORS, package manager, or network dependency. The source is modular; the exam artifact intentionally is not.

## Security / maintainability

Dynamic HTML escaping is centralized through tested `OSCP_UTILS.escapeHtml()`. The Service Router parser/classifier is isolated in `OSCP_SERVICE_CORE` so correctness is tested without a browser.

Legacy `innerHTML` rendering remains for compatibility, but CI prevents the audited assignment count from increasing silently. New dynamic UI should prefer DOM APIs and `textContent`.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/CONTENT-MAP.md](docs/CONTENT-MAP.md), [docs/EXAM-PREFLIGHT.md](docs/EXAM-PREFLIGHT.md), and [CHANGELOG.md](CHANGELOG.md).

## License

No open-source license has been selected. Add one only after deciding what reuse rights you want to grant.