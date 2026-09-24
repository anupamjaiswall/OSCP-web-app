# Architecture

V31 separates **maintainable/testable source** from the **single-file exam artifact**.

```text
src/index.template.html
 ├─ src/styles/*.css
 ├─ src/js/*.js
 │    ├─ 00-core-utils.js
 │    ├─ 00-service-router-core.js
 │    └─ browser feature layers
 ├─ src/content/*.html
 └─ src/meta/build.json
          ↓
     build.mjs
          ↓
      index.html
```

There are no runtime imports, fetches, CDNs, or module loaders.

## Pure logic

DOM-free logic should be extracted into testable modules instead of remaining buried in UI IIFEs. V31 tests HTML escaping, scoring, evidence requirements, Service Router parsing, and Service Router classification/prioritization.

The browser Service Router delegates to `OSCP_SERVICE_CORE`; it no longer owns its parser implementation.

## Source of truth

Reference methodology lives once under `src/content/`; `src/content/manifest.json` controls order. Build identity lives once under `src/meta/build.json` and is validated against `package.json`.

## Generated-file rule

**Never edit root `index.html` directly.**

```bash
npm run check
npm run checksum
```

CI rebuilds `index.html` and fails on drift.

## Audit policy

`npm run audit` syntax-checks every JS module and checks structural balance of methodology fragments. `npm run validate` checks offline CSP, runtime resources, IDs, anchors, version wiring, accessibility live regions, escaping consolidation, and `innerHTML` regression limits.

Reliability beats architectural purity: behavioral rewrites should be incremental and test-covered.
