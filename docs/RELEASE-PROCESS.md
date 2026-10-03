# Release and Tag Discipline

Stable tags should mark a tested exam artifact, not every micro-batch.

## Stable release checklist
1. Run `npm run ratchet` after any reduction in legacy-core size or audited `innerHTML` assignments; it may lower limits, never raise them.
2. `main` passes `npm run check` and all required Chromium gates, including lifecycle/import safety.
3. Run `npm run checksum` and record the SHA-256.
4. Confirm build metadata, package version, README version, changelog entry and generated artifact agree.
5. Review `docs/KNOWN-LIMITATIONS.md`, `ROADMAP.md` and `docs/IMPORT-SAFETY.md`.
6. Perform the manual cold/offline preflight in `docs/EXAM-PREFLIGHT.md`.
7. Tag the exact tested generated-artifact commit as `vMAJOR.MINOR.PATCH`.
8. Release notes summarize exam-facing changes and include the generated `index.html` checksum.

## GitHub Actions supply-chain pins

The workflow uses immutable SHAs with human-readable release comments. Verified on 2026-10-03 against GitHub tag refs:

- `actions/checkout@v7.0.1` → `3d3c42e5aac5ba805825da76410c181273ba90b1`
- `actions/setup-node@v7.0.0` → `820762786026740c76f36085b0efc47a31fe5020`

Dependabot is enabled for GitHub Actions so version comments and SHA pins can be reviewed together when upstream releases change.

## Policy
- Do not tag while CI is still auto-syncing a different generated artifact commit.
- Tag the final generated-artifact commit, not the preceding source-only commit.
- Quality ratchets are downward-only. A feature that needs more legacy core or more audited `innerHTML` must first extract/migrate code rather than raise the cap.
- Release only a version you would actually take into the exam.
