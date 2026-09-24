# Architecture

V30 separates **maintainable source** from the **single-file exam artifact**.

```text
src/index.template.html
 ├─ src/styles/*.css
 ├─ src/js/*.js
 └─ src/content/*.html
          ↓
     build.mjs
          ↓
      index.html
```

There are no runtime imports, fetches, CDNs, or module loaders.

Reference methodology lives once under `src/content/`; `src/content/manifest.json` controls exact order.

Shared DOM-free logic lives in `src/js/00-core-utils.js` and is directly tested in Node. V30 starts with escaping, point calculations, and evidence gates. Future pure logic should move there rather than creating another version-specific layer.

**Never edit root `index.html` directly.** Run `npm run check` after source changes. CI rebuilds the artifact and fails on drift.

The existing UI still has legacy `innerHTML` rendering. Validation freezes the audited V29 assignment count, while new dynamic UI should prefer DOM APIs/`textContent`.

Reliability beats architectural purity: large behavioral rewrites should be incremental and tested.
