# Release and Tag Discipline

Batch commits can move quickly during active exam-tool development. Stable tags should mark a tested exam artifact, not every micro-batch.

## Stable release checklist
1. `main` passes `npm run check`.
2. Required browser smoke gates pass.
3. Run `npm run checksum` and record the SHA-256.
4. Confirm build metadata, package version, README version, changelog entry, badge, and generated artifact agree.
5. Review `docs/KNOWN-LIMITATIONS.md` and confirm the artifact-size, `innerHTML`, and legacy-core quality ratchets still have acceptable headroom.
6. Perform the manual cold/offline preflight in `docs/EXAM-PREFLIGHT.md`.
7. Tag the exact tested commit as `vMAJOR.MINOR.PATCH`.
8. Release notes summarize exam-facing changes and include the generated `index.html` checksum.

## Policy
- Do not tag while CI is still auto-syncing a different generated artifact commit.
- Tag the final generated-artifact commit, not the preceding source-only commit.
- Avoid releases for every batch; release only a version you would actually take into the exam.
