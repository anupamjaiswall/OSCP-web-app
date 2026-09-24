# 🔐 OSCP Exam OS

**V32 — exam-time, offline-first OSCP/OSCP+ methodology and decision-support app.**

The repository ships one self-contained **`index.html`** for exam use while keeping maintainable source modular under `src/`. No runtime server, CDN, package install, external stylesheet, or network connection is required.

## Exam use

1. Download or clone the repository before the exam.
2. Open **`index.html`** directly in a modern browser.
3. Keep it local/offline.
4. Use Search, Service Router, methodology trees, target workspace, and evidence gates instead of scrolling linearly.

GitHub Pages: https://anupamjaiswall.github.io/OSCP-web-app/

> Live OffSec instructions, the Exam Control Panel, and the proctor always override this offline reference. This app is for exam-time reference, not AI assistance during the exam.

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
