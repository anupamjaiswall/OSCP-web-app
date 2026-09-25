# Source and Naming Conventions

This repository intentionally produces one offline `index.html`, but source changes belong under `src/` and are built into that artifact.

## File layout
- `src/js/00-*.js`: pure/shared cores that should avoid DOM and storage when possible.
- `src/js/NN-*.js`: browser feature layers, ordered by dependency/startup sequence.
- `src/styles/NN-*.css`: styles paired to browser feature layers.
- `src/content/NN-*.html`: deep-reference methodology fragments only; no script/style tags.
- `src/meta/build.json`: canonical version/date/label source.
- `scripts/*.mjs`: zero-dependency build/audit/validation utilities.
- `tests/run-tests.mjs`: deterministic regressions for pure logic and structural invariants.

## JavaScript
- Prefer pure functions and DOM-free cores for logic that deserves unit tests.
- New dynamic rendering should use DOM APIs and `textContent`; do not increase unsafe HTML sinks casually.
- Do not use `eval`, `new Function`, `document.write`, `outerHTML=`, `insertAdjacentHTML`, `srcdoc`, `javascript:` URLs, or string-created event-handler attributes.
- Prefix persisted keys with `oscp:` or reuse the existing canonical storage namespace.
- Bound retained arrays/logs; exam tabs can remain open for many hours.
- Avoid polling when a browser event can express the same transition.
- Runtime error handlers must record only; they must not recursively render or throw.

## DOM IDs and classes
- IDs are unique and feature-oriented.
- CSS-only hooks use classes.
- Controls that mutate state need explicit labels/titles and keyboard reachability.
- Operational dynamic status uses polite live regions where appropriate.

## Version/build workflow
1. Update source, never hand-edit generated `index.html`.
2. Bump `src/meta/build.json` and `package.json` together.
3. Add a changelog entry.
4. Add/adjust deterministic tests.
5. Run `npm run check`, `npm run browser-smoke`, and `npm run checksum`.
6. Push source; CI regenerates and verifies `index.html`.

## Content rules
- Official OffSec instructions outrank community experience.
- Passer write-ups are anecdotal workflow evidence, not rules.
- Prefer prerequisite/decision logic over blind command accumulation.
- Keep secrets out of examples and persisted diagnostics.
- Avoid duplicating methodology in README and reference content.
