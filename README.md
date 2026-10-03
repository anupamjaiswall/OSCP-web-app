# 🔐 OSCP Exam OS

<!-- build-version:start -->
**V34.47.0 — exam-time, offline-first OSCP/OSCP+ methodology and decision-support app.**
<!-- build-version:end -->

One self-contained `index.html` designed to be the only reference open during the exam. The runtime has no required CDN, package install, server, AI service, or network dependency.

> Live OffSec instructions, the Exam Control Panel, and the proctor always override this offline reference.

## Latest three versions

### V34.47.0 — repository hardening
- README build version is generated from `src/meta/build.json` and validation rejects drift.
- Artifact size policy now has a 1.50 MB soft warning and a deliberate 1.75 MB hard ceiling instead of silently running out of headroom.
- Added quality ratchets for total `innerHTML` assignments and the oversized legacy core.
- GitHub Actions are SHA-pinned, Dependabot tracks action updates, PRs reject generated-artifact drift, and the write permission is isolated to the main-only sync job.
- Added an explicit all-rights-reserved license notice rather than silently implying an open-source license.

### V34.46.0 — Kali toolchain readiness
- Added a capability-based pre-exam Kali readiness desk.
- Local-only inventory script checks whether core exam jobs have at least one practiced tool available.
- Distinguishes must-have capabilities from recommended/specialist tooling.

### V34.45.0 — exam-time tooling defaults
- Added Primary → Fallback → Specialist tool ladders.
- Added Penelope OSCP-safe mode, RustHound-CE, smbclient-ng, and RustScan as deliberately scoped options.
- Added a tool-switch gate so exact errors and failing layers are validated before swapping tools.

Older release history: [CHANGELOG.md](CHANGELOG.md).

## Exam use

1. Clone or download the repository before the exam.
2. Open `index.html` in a modern browser.
3. Keep it local/offline.
4. Use Start, active-target Workspace, Service Router, Method Trees, Best Tools, Reference search, evidence/proof gates, and Reports instead of scrolling linearly.
5. Export a secret-free or encrypted backup periodically and keep it outside the browser profile.

GitHub Pages: https://anupamjaiswall.github.io/OSCP-web-app/

## High-value workflows

- **Global Search + Full Reference Find:** typo-tolerant global search plus in-reference highlighting, current/total count, Previous/Next, Enter/Shift+Enter and F3 navigation.
- **Active Target Next Actions:** deterministic local ranking from target role, stage, access and discovered services.
- **Service Router:** ports/services → small prioritized enumeration queue.
- **Linux / Windows / AD Method Trees:** branch-oriented methodology rather than a flat command dump.
- **Fresh-Eyes Reset:** bounded re-enumeration when evidence stops improving.
- **Bank the Points:** proof/local evidence closure checklist before changing target state.
- **Best Tools:** Primary → Fallback → Specialist plus pre-exam Kali capability readiness.
- **Online Resource Desk:** curated external references, while the exam artifact itself remains offline.
- **Session / Reliability:** local snapshots, secret-free export/import, integrity checks and recovery status.

## Build and validation

Node.js 20+; CI currently tests with Node 22.

```bash
npm run build
npm test
npm run audit
npm run contrast-audit
npm run validate
npm run checksum
npm run check
```

`npm run build` generates `index.html` and synchronizes the README version line from `src/meta/build.json`.

CI validates the generated artifact in real Chromium, including navigation, search, reference find, passer-loop behavior and tooling readiness. Pull requests fail when `index.html` or the generated README version line drifts from source.

## Size policy

Exam reliability is more important than aggressive minification. The generated artifact therefore stays readable/debuggable and uses explicit budgets in `src/meta/quality.json`:

- **1,500,000 bytes:** soft warning — investigate growth.
- **1,750,000 bytes:** hard failure.

Raising the hard limit or the DOM/core ratchets requires changing validator ceilings deliberately; they cannot silently increase through metadata alone.

## Architecture

```text
src/index.template.html
 + src/styles/*.css
 + src/js/*.js
 + src/content/*.html
 + src/meta/build.json
 + src/meta/quality.json
          ↓
   scripts/build.mjs
          ↓
      index.html
```

`03-core-app.js` is still the largest legacy unit. New functionality should stay outside it where possible. The validator prevents the core from growing beyond its current bounded allowance and treats the audited `innerHTML` count as a downward-only ratchet.

Detailed architecture and backlog:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/CONTENT-MAP.md](docs/CONTENT-MAP.md)
- [docs/IMPROVEMENT-TRACKER.md](docs/IMPROVEMENT-TRACKER.md)
- [docs/EXAM-PREFLIGHT.md](docs/EXAM-PREFLIGHT.md)
- [docs/KNOWN-LIMITATIONS.md](docs/KNOWN-LIMITATIONS.md)
- [docs/RELEASE-PROCESS.md](docs/RELEASE-PROCESS.md)

## Repository policy

The repository is public for viewing and personal use by its owner, but no open-source reuse license has been granted. See [LICENSE](LICENSE). If broader reuse is desired later, choose an explicit open-source license deliberately rather than assuming one.
