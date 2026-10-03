# Roadmap

Keep this list short. The app is exam-time only; backlog items must improve reliability, speed or maintainability without adding another operating mode.

## Next

- **Legacy core extraction:** move DOM-free state migration, import/export validation and scoring out of `03-core-app.js` behind characterization tests before UI refactors.
- **DOM sink reduction:** replace legacy `innerHTML` rendering incrementally with small DOM helpers; the release ratchet must only move downward.
- **Functional module names:** rename historical `v20/v23/v24/...` files by responsibility only after import/build maps have regression coverage.
- **Schema fixture discipline:** when the session schema changes, add a fixture for the prior current schema and keep every historical fixture importable.
- **Report closure:** strengthen final report/evidence completeness checks without duplicating the official Exam Control Panel.

## Non-goal

- **Mock/rehearsal mode is intentionally not part of the product.** The UI remains exam-only. End-to-end create/export/wipe/restore behavior belongs in CI lifecycle dry-runs instead.
