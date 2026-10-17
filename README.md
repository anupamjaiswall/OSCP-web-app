# 🔐 OSCP Exam OS

<!-- build-version:start -->
**V34.72.0 — exam-time, offline-first OSCP/OSCP+ methodology and decision-support app.**
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
- **Unambiguous split panes:** `Ctrl+A` then `|` makes left/right panes (vertical divider), and `Ctrl+A` then `-` makes top/bottom panes (horizontal divider). [`scripts/tmux-splits.conf`](scripts/tmux-splits.conf) is a last-loaded override if your actual tmux bindings are reversed; examples and checks in Section 1.3.
- **Mouse-friendly tmux:** drag left mouse to copy tmux output into its buffer and, where available, the desktop clipboard; middle-click pastes tmux buffer into the clicked pane. Optional [`scripts/tmux-mouse.conf`](scripts/tmux-mouse.conf) and Section 1.3 include both the setup and test steps.
- **Actual downloadable clipboard helper:** [`scripts/clipboard.sh`](scripts/clipboard.sh) supports X11/Wayland. Install before the exam with `curl -fL https://raw.githubusercontent.com/anupamjaiswall/OSCP-web-app/main/scripts/clipboard.sh -o ~/bin/clipboard.sh && chmod 700 ~/bin/clipboard.sh`. Configure `Shift+Y` using the full tmux config under Section 1.3; tmux `y` / prefix + `]` work without a graphical clipboard.
- **Multi-machine tmux OSCP workflow:** one session and folder per machine (standalone/AD); no global `IP` export. Start at Full Reference → **Start here** for the 60-second launch/verify/scan steps.
- **Fullscreen Full Reference reader:** unified Light/Dark theme for the entire app, including sidebar, top bar, cards, controls and Full Reference; both theme switches stay synchronized and persist locally without changing text wrapping.
- **Linux / Windows / AD Method Trees:** branch-oriented exam methodology instead of a flat command dump.
- **WIN Linux / WIN Windows / WIN AD:** three separate 12-step exam-time winning desks with per-target checklists, copyable commands, deep links, and evidence banking; AD credential, Kerberos, BloodHound/AD CS, edge and troubleshooting tools stay available under WIN AD.
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
