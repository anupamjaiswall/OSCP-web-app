# Exam Preflight

Run this on the exact copy you plan to use:

```bash
npm run check
npm run checksum
```

Then:

- keep the printed SHA-256 with your exam-day notes;
- open `index.html` with network disabled and verify Search, Service Router, Method Trees, target workspace, quick note, evidence UI, Session recovery, and Exam Clock;
- keep a second local copy of the same `index.html` in a separate folder;
- do not rely on GitHub Pages during the exam;
- verify the visible build badge matches the version you practiced with;
- confirm local storage works with a temporary target, then remove the temporary data;
- keep **one app tab only**; V34 warns when another copy responds through the browser storage channel;
- test the UI at 100%, 125%, and 150% browser zoom;
- re-read the current OffSec exam guide and proctor instructions immediately before the attempt.

## Recovery drill

Do this once before exam day so recovery is muscle memory:

1. Open **Session → Export secret-free session** and save the JSON outside the browser profile.
2. If you rely on stored passwords, hashes, keys, or tickets, create an **encrypted backup** too and verify the passphrase.
3. Use **SOS Backup Integrity Check** to test the file without replacing your current state.
4. Close the app, reopen the exact offline `index.html`, import the backup, and confirm targets, credential metadata, evidence, active target, and report state are usable.
5. Re-enter the authoritative exam start time in **Exam Clock** if the browser or VM itself had to be replaced.
6. During the exam, keep local autosnapshots **and** periodically download an external session file. Autosnapshots do not protect you from losing the browser profile or VM.

If the primary browser/VM fails mid-exam: open the spare offline copy → Session → import the latest valid backup → verify the active target/evidence state → set the Exam Clock from the control panel/proctor time → continue.

The live Exam Control Panel remains authoritative for objectives, points, and timing.
