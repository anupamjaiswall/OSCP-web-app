# 🔐 OSCP Exam OS

**V30 — exam-time, offline-first OSCP/OSCP+ methodology and decision-support app.**

The repository ships a **single self-contained `index.html`** for exam use, while maintainable source lives under `src/`. The generated artifact needs no web server, CDN, npm install, external stylesheet, or runtime network connection.

## Exam use

1. Download or clone the repository before the exam.
2. Open **`index.html`** directly in a modern browser.
3. Keep it local/offline.
4. Use Search, Service Router, methodology trees, and target workspace instead of scrolling the reference linearly.

GitHub Pages: https://anupamjaiswall.github.io/OSCP-web-app/

> Live OffSec instructions, the Exam Control Panel, and the proctor always override this offline reference. This app is for exam-time reference, not AI assistance during the exam.

## Architecture

```text
src/index.template.html
 + src/styles/*.css
 + src/js/*.js
 + src/content/*.html
          ↓
   scripts/build.mjs
          ↓
      index.html
```

**Do not hand-edit `index.html`.** Edit source, then run `npm run check`.

The previous 300+ KB README content dump was removed. Embedded methodology now has one source of truth under `src/content/`.

## Development

Node.js 20+, zero npm dependencies:

```bash
npm run build
npm test
npm run validate
npm run check
```

CI rebuilds the artifact and fails if the committed `index.html` differs.

## V30 reliability gates

- strict offline CSP including `connect-src 'none'`;
- no runtime external scripts/styles;
- unique element IDs and valid static internal anchors;
- one canonical HTML-escaping implementation;
- scoring and evidence-gate pure logic covered by Node tests;
- current audited `innerHTML` assignment count cannot increase silently;
- reference-section count stays stable;
- generated artifact remains reproducible from source.

## Why the final output is still one file

A single local HTML file is an advantage under exam pressure: no server, package manager, missing assets, CDN, relative-path failures, or network dependency. V30 makes the **source modular** while deliberately keeping the **exam artifact monolithic**.

## Security / maintainability

Four independent `esc()` implementations now delegate to tested `OSCP_UTILS.escapeHtml()`, including single-quote escaping. Legacy `innerHTML` remains for compatibility, but CI prevents adding more without deliberate review.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/CONTENT-MAP.md](docs/CONTENT-MAP.md), and [CHANGELOG.md](CHANGELOG.md).

## License

No open-source license has been selected. Add one only after deciding what reuse rights you want to grant.
