# 🔐 OSCP Exam OS

<!-- build-version:start -->
**V34.55.0 — exam-time, offline-first OSCP/OSCP+ methodology and decision-support app.**
<!-- build-version:end -->

One self-contained `index.html` designed to be the main reference open during the exam. It has no required CDN, package install, AI service, or runtime network dependency.

> Live OffSec instructions, the Exam Control Panel, and the proctor always override this offline reference.

## Open the app

- GitHub Pages: https://anupamjaiswall.github.io/OSCP-web-app/
- Or download `index.html` and open it locally in a modern browser.

## Most useful exam features

- **Global Search:** typo-tolerant search across the app and methodology.
- **Reference Find:** highlight every match, show current/total count, and navigate with Previous/Next, Enter/Shift+Enter, or F3.
- **Active Target Workspace + Next Actions:** keeps current target context and ranks a small set of relevant next steps locally.
- **Service Router:** turns discovered ports/services into a focused enumeration queue.
- **Linux / Windows / AD Method Trees:** branch-oriented exam methodology instead of a flat command dump.
- **Fresh-Eyes Reset:** structured re-enumeration when progress stalls.
- **Bank the Points:** proof/local evidence checklist before changing target state.
- **Best Tools:** Primary → Fallback → Specialist guidance plus Kali readiness checks.
- **Reliability Preflight:** one-click local checks for storage, backup round-trip, search/reference, clock health and backup freshness.
- **Online Resource Desk:** curated external references when Internet use is appropriate.
- **Reports / Session Safety:** evidence tracking, recovery snapshots, secret-free/encrypted backups, and report workflow.

## Useful shortcuts

- `Ctrl/Cmd + K` — global search
- `Alt + J` — context-aware Next Actions
- `Alt + B` — Bank the Points
- In Reference Find: `Enter` / `F3` = next, `Shift + Enter` / `Shift + F3` = previous

## Exam safety

- Keep flags, credentials, hashes, tickets, dumps, and screenshots local unless you have a specific safe reason to use an external service.
- Secret-free exports warn when credential-shaped material is detected in free-text notes/report fields.
- Bank point-bearing evidence as soon as you obtain it.
- Export a backup periodically and keep it outside the browser profile.
- Re-read the current OffSec exam guide before the exam; this repository is a dated offline reference, not the authority.

## Build and validate

Node.js 20+; CI currently uses Node 22.

```bash
npm run build
npm run check
npm run browser-smoke
npm run reference-find-smoke
npm run passer-loop-smoke
npm run tooling-smoke
npm run reliability-smoke
npm run checksum
```

`npm run build` regenerates `index.html` and synchronizes the README version line from `src/meta/build.json`.

## Essential docs

- [Exam preflight](docs/EXAM-PREFLIGHT.md)
- [Known limitations](docs/KNOWN-LIMITATIONS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Release process](docs/RELEASE-PROCESS.md)
- [Changelog](CHANGELOG.md)

## License

See [LICENSE](LICENSE). The repository currently does not grant an open-source reuse license.
