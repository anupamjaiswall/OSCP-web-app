# Exam Preflight

Run this on the exact repository state you plan to use:

```bash
npm run check
npm run browser-smoke
npm run checksum
```

Then perform this manual drill on the exact `index.html`:

1. **Cold start:** open it in the same modern browser/profile you plan to use. Confirm the cockpit becomes responsive and the deep reference finishes loading.
2. **Offline start:** disconnect networking and reopen it. Search, Service Router, Method Trees, target workspace, evidence/report UI, Session recovery and Exam Clock must still work.
3. **Search:** test an exact tag and one typo, for example `[WIN:SEIMPERSONATE]` and `seimpersonte`.
4. **Navigation:** immediately after a cold open, click a deep-reference button before waiting for the reference to finish loading; it must still land on the requested section. Then verify bracket tags, the Reference breadcrumb/section picker, Back/Forward and command palette.
5. **Display:** check 100%, 125% and 150% browser zoom. Test your preferred readability/high-contrast setting.
6. **Persistence:** create a temporary target, reload the page, confirm it survives, then delete it.
7. **Recovery:** export a secret-free full session. If you need secrets preserved, also export an encrypted backup and verify the passphrase.
8. **Backup test:** use **Reliability Center → SOS Backup Integrity Check** on the exported file without restoring it.
9. **Restore rehearsal:** on a disposable/test state, import a backup and verify targets, active-target context, report state and evidence metadata.
10. **Artifact identity:** confirm the visible build badge matches the version you practiced with and keep the printed SHA-256.
11. **Spare copy:** keep a second local copy of the same verified `index.html` in a separate folder.
12. **Current rules:** immediately before the exam, re-read the current OffSec exam guide and proctor instructions.

## During the exam

- Prefer **one active app tab** and one browser profile.
- Keep autosnapshots, but periodically create a real external session backup.
- A clipboard recovery JSON is an emergency fallback, not a durable backup until saved elsewhere.
- If browser/VM state is lost: open the spare verified artifact → import the newest tested backup → verify active target/evidence/report state → re-enter authoritative exam timing if needed.
- Do not rely on GitHub Pages during the exam.

See [Known Limitations](KNOWN-LIMITATIONS.md) before exam day.

The live Exam Control Panel remains authoritative for objectives, points, proof submission and timing.