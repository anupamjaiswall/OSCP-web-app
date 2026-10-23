# Changelog

## V34.74.0 — 2026-10-23

### Document tmux copy-mode clipboard diagnosis
- Added a targeted troubleshooting section to OSCP Reference → Section 1.3 for the case where the clipboard helper works in a tmux pane but copy-mode selection does not reach the desktop clipboard.
- Recorded the confirmed direct-helper test, the unsuccessful temporary `y` binding experiment, and a diagnostic sequence comparing tmux's internal buffer with `xclip`.
- Clarified that the temporary binding is not a verified fix; preserve the Night Ops theme and avoid rerunning the installer until the failing stage is isolated.


## V34.73.0 — 2026-10-20

### Repair Kali tmux installer, system clipboard and Night Ops colors
- Added a complete idempotent root-level `install.sh` with timestamped backups, dependency installation, graphical clipboard environment refresh, and live tmux config reload without killing sessions.
- Restored a high-contrast amber/teal `~/.tmux-theme.conf` with active-window and pane highlights, status clock, session identity, and visible prefix state; uses ordinary fonts.
- Consolidated copy-mode `y`/`Y` and mouse drag onto one X11/Wayland `clipboard.sh` helper. Copies into both tmux's internal buffer and the graphical desktop clipboard. Disabled competing OSC52/tmux-yank behavior and redirected xclip stdout.
- Shipped installable target launcher, per-pane timestamped logs, log cleanup and preserved Ctrl+A pane bindings.
- Replaced conflicting in-app tmux setup instructions with canonical file sources and real install, diagnostics, mouse, clipboard and recovery workflows.
- Added a temp-HOME installer regression test plus headless tmux runtime and mocked X11 clipboard validation.

## V34.72.0 — 2026-10-17

### Clarify pane orientation and repair reversed tmux bindings
- Explained tmux's surprising `split-window -h` (side-by-side) versus `-v` (top/bottom) terminology using visual pane diagrams, labelled by the separator direction.
- Shipped the real `scripts/tmux-splits.conf` override to restore `Ctrl+A | → left/right` and `Ctrl+A - → top/bottom` after other plugin/config overrides.
- Added a direct install/source/persist sequence, active `tmux list-keys` checks, and an instruction to test in a disposable window.
- Added a regression test ensuring the override matches the embedded offline source and main tmux config.


## V34.71.0 — 2026-10-17

### tmux mouse select, copy and paste
- Enabled left-button drag selection with automatic copy to tmux buffer and attempted system clipboard via the real `~/bin/clipboard.sh` helper (X11 / Wayland).
- Added middle-click paste into the selected tmux pane, with event forwarding for applications that request mouse input; preserves native Shift+drag and terminal clipboard shortcuts.
- Shipped `scripts/tmux-mouse.conf` as a separate downloadable overlay and embedded its complete source in the offline notes with install, verification and fallback instructions.
- Added a test ensuring the standalone mouse configuration matches the embedded reference and retains keyboard copy/paste.


## V34.70.0 — 2026-10-17

### Actual clipboard.sh shipped and linked
- Added the real standalone `scripts/clipboard.sh` file in the repository (X11, Wayland, `copy|paste|check`).
- Added a direct Kali install command and GitHub file link in Section 1.3; the full script remains in the offline reference as a verifiable fallback.
- Fixed all tmux binding/diagnostic paths to point to `~/bin/clipboard.sh` instead of a helper that was documented but never committed.
- Regression test asserts the real script matches the embedded offline version, validates Bash syntax and preserves the tmux-only clipboard fallback.


## V34.69.0 — 2026-10-17

### Fix Shift+Y desktop clipboard guidance
- Replaced the brittle X11-only tmux clipboard binding with a `~/bin/tmux-clipboard.sh` helper for X11 (`xclip`) and Wayland (`wl-copy` / `wl-paste`).
- Kept `y` and prefix + `]` as the dependable tmux internal-buffer workflow regardless of desktop clipboard access.
- Added install instructions, harmless clipboard echo test, tmux binding inspection, display/remote-desktop troubleshooting and warnings about clipboard sharing boundaries.
- Added a regression test for Bash syntax and tmux bindings in the reference.


## V34.68.0 — 2026-10-17

### Full light mode for the entire OSCP workspace
- Unified the top-bar toggle and Full Reference day/night switch: both now control the complete app and retain the preference locally.
- Light mode changes the page, left navigation, active links, top bar, search/inputs, action buttons, card panels, dialogs, reference TOC, and code blocks to a matching high-contrast light palette.
- Dark mode restores the existing slate appearance. Kept V34.66 safe grid widths, one-column reader shortcuts and command wrapping intact.
- Added accessibility color contrast assertions and a browser-level smoke check for both theme switches, sidebar and full-reference colours.


## V34.67.0 — 2026-10-17

### Readable, contrast-checked colors without layout regression
- Restyled the dark app shell with less harsh blue-grey cards, readable navigation, clear selected actions and subdued separators; made no changes to the app's sizing, columns or wrapping.
- Gave daytime reference pages soft neutral paper, dark ink, obvious links/headings, readable inline code, and restrained tables/quotes. Night notes use charcoal-slate with high-contrast teal links and bright commands.
- Added a Day notes / Night notes button inside Full Reference (including immersive mode) with local preference and synchronization with the existing top-bar toggle.
- Added WCAG AA text color pair assertions and browser tests for theme toggling, computed colors, word wrapping and sidebar widths.


## V34.66.0 — 2026-10-17

### Fix cramped theme and per-character text wrapping
- Kept the proven main app shell palette/layout, scoping eye-comfort colors to the reference only.
- Replaced the reader's cramped three-column shortcuts with full-width rows; guarded reader widths and restored normal word wrapping.
- Kept commands in horizontally scrollable preformatted blocks and mobile reading in one column.
- Preserved soft-paper and dusk modes; added static/browser layout regression coverage.


## V34.65.0 — 2026-10-17

### One-machine-per-session exam workflow and eye-comfort theme
- Replaced the first legacy navigation block with a copyable, compact multi-target quickstart: separate standalone and AD tmux sessions, explicit unique listener ports, per-target environment verification and target-local Nmap output.
- Documented that `target.sh` attaches/switches to its session, so sequential invocations require detaching or a second terminal. The optional `AD_set` session is notes-only; never use global `export IP`.
- Added a reader-sidebar Start here button and shortened the Setup / During exam labels, preserving existing deep links.
- Added eye-comfort slate shell and soft-paper full reference with a matching gentle dusk toggle, clearer selected navigation, low-glare code blocks and readable spacing. Print remains light.
- Added deterministic regression coverage for multi-host quickstart, navigation and theme source contracts.


## V34.64.0 — 2026-10-17

### Default NSE, explicit Nikto and tmux clipboard correction
- Made the Nmap workflow run `-sV` for targeted version detection in Step 2 and `--script=default` in Step 4, avoiding duplicated default NSE scans and replacing the required script-name placeholder.
- Added a clear Nmap-to-HTTP enumeration handoff and surfaced Nikto immediately after the confirmed HTTP(S) endpoint fingerprint, with distinct HTTP/HTTPS output files and manual validation guidance.
- Explained that Shift+Y in tmux copy mode **copies** to the X11 clipboard, not pastes; added Ctrl+A then capital Y to paste from that clipboard. Redirected xclip stdout to avoid tmux copy-mode hangs and expanded binding/X11 diagnostics.
- Added deterministic source tests for these exam-time commands and clipboard bindings.


## V34.63.0 — 2026-10-17

### Per-machine OSCP terminal workflows
- Replaced the misleading global `export IP=10.10.10.x` pre-engagement example with a pre-exam verification flow and clearly identified per-machine `IP`, `TARGET`, `LHOST`, `LPORT`, optional `DOMAIN` and `DC` variables.
- Reworked `~/bin/target.sh` so tmux `new-session -e` seeds the target-specific environment before the very first pane starts, masking any tmux global host variables, rather than injecting `export IP` into a pane after creation.
- Added `--ip`, `--domain`, `--dc`, `--lport` options, IPv4/port validation, session identity checking, clear behavior when reattaching, and a `tun0`-derived LHOST.
- Updated the During Exam runbook for distinct standalone sessions, individual AD DC/member machine sessions, and optional `AD_set` coordination with intentionally blank IP. Emphasized that `tmux set-environment` does not update already running shells.
- Standardized runnable examples to `~/bin/target.sh` so a shell PATH update is not required. Kept Nmap output folder initialization only in section 3.1 and removed conflicting shared `newbox` instructions.
- Added an executable mocked-tmux Bash regression test for two standalone machines, AD member and AD coordination session, including invalid IP rejection and per-host workspace isolation.


## V34.62.0 — 2026-10-16

### Full-screen reference and separate exam phases
- Added an immersive **Full screen** toggle to Full Reference with browser fullscreen when available and a CSS-only fallback, a persistent Exit control and responsive layouts.
- Added a searchable, sticky **left-side reference navigation**, grouped by the actual embedded section headings and loaded after offline reference hydration. Every section uses the existing `openRef` workflow, preserving deep links and search.
- Added quick links for **Pre-exam tmux setup** and **During-exam tmux operations**, keeping installation/config/scripts before the exam and target sessions/copy/paste/pane/log management in a distinct During Exam reference section.
- Kept the original pre-exam tmux anchor for existing bookmarks and linked between pre-exam setup and the exam runbook.
- Added static and headless-browser regressions for reader navigation, fullscreen fallback, mobile/sidebar controls and the separated tmux anchors.


## V34.61.0 — 2026-10-16

### Keyboard shortcut reliability
- Fixed the web app's central Alt shortcut routing conflict: Alt+H was routed to Hypothesis before the Active Work panel; Alt+I was routed to Reliability before the Notes Index. Their designated feature handlers now own those keys.
- Added browser-safe, typing-aware two-key **G then key** navigation with a 2-second expiry: G→L Linux; G→W Windows; G→A AD; G→C Exam Clock; G→T Method Trees; G→B Bank Proof; G→P Palette; G→H Work State; G→I Notes Index; G→N Quick Note, plus other workflow shortcuts.
- Updated the in-app help dialog with clear directions and removed the duplicate/misleading Alt+Y entry. The existing Alt shortcuts remain best-effort where browsers intercept them.
- Made tmux Ctrl+A [ and Ctrl+A ] explicit, decoupled lowercase y from X11 clipboard availability and assigned uppercase Y to optional xclip desktop copying. Added source reload and live binding diagnostics in Full Reference.
- Added unit and browser smoke regression checks for shortcut routing, editing safety, Alt conflicts and tmux configuration.


## V34.60.0 — 2026-10-14

### Exam clock fix and tmux copy-mode reference
- Fixed the 1-second Exam Clock countdown refresh overwriting the editable `datetime-local` exam start. The input now stays untouched while editing; restoring a session explicitly synchronizes the saved start.
- Added date/time validity checks, clear saved/unsaved feedback and `Use current time as start` auto-save. Countdown still follows the locally saved start, with the official proctor clock authoritative.
- Expanded Full Reference → tmux Setup with `Ctrl+A [` → `v` select → `y` copy, `Ctrl+A ]` internal paste, `Ctrl+Shift+V` desktop paste, scrollback navigation/search, Shift+drag and `xclip` troubleshooting.
- Removed the duplicate `nmap` directory from `target.sh` tmux session setup. Nmap workflow section 3.1 owns `mkdir -p scans/nmap`; aligned the tmux daily-use example with `scans/nmap`.
- Added regression tests for uninterrupted clock editing and Nmap folder ownership; browser smoke checks clock save, countdown, persistence and clear.


## V34.59.0 — 2026-10-13

### Dedicated Windows and Active Directory winning-step desks
- Reorganized **WIN Windows** so its existing 12 target-aware post-shell → Administrator/SYSTEM checklist appears first, with an exam-time winning line, three-condition validation gate and Bank Proof shortcut. Existing Windows coverage and commands are retained.
- Added a dedicated **WIN AD** 12-step workflow: DC/DNS/time; prove account or anonymous access; SMB/LDAP visibility; targeted Kerberos; BloodHound; AD CS; manual ACL validation; credential-material routing; one verified edge with rollback; member-host access; new-token re-enumeration; domain objective and evidence.
- Preserved the existing issued-credential sprint, AD fallback toolbox, Rubeus/material routers, BloodHound execution planner, failure decoder, username generator and AD ten-case map beneath the new WIN AD steps.
- Kept Windows and AD selected targets and checked steps distinct, while retaining secret-free session backup/restore. Added simple-mode navigation, Start shortcuts, Method Tree routes, command-palette search, health checks and tests.
- New AD rendering uses DOM nodes rather than adding to the DOM-safety ratchet. No runtime network dependency or AI functionality.


## V34.58.0 — 2026-10-13

### Win Linux exam desk
- Added a target-aware **WIN Linux** exam desk mirroring the existing Windows/AD workflow: 12 ordered post-shell → root winning steps, per-target completion state, copyable commands, deep-reference jumps, reset controls, and session backup/restore integration.
- Added a Linux winning line and three-condition validation gate (privileged context + controllable object + reliable trigger), with explicit branches for secrets, sudo, SUID/SGID/capabilities, cron/systemd, root processes/local services, writable dependencies, containers/mounts/NFS, and kernel/package CVEs last.
- Wired WIN Linux into the left navigation, Start screen, Linux method tree, command palette, simple-mode navigation, Alt+L shortcut, health checks and regression tests.
- Clarified product structure: **WIN Windows** remains the combined Windows + Active Directory exam desk; **WIN Linux** is the standalone Linux shell → root desk. Root proof closure remains aligned with the embedded OffSec proof/evidence rules.


## V34.57.0 — 2026-10-11

### Nishang secondary PowerShell fallback
- Added a searchable Nishang reference under Windows transfer and shell execution, with explicit import/invocation examples and listener preparation.
- Kept Nishang secondary to built-in Windows shell/transfer options and added OffSec rules-sensitive module-selection guidance.
- Kept the offline-first app architecture unchanged; published HTML/README are regenerated by the main-branch GitHub workflow.

## V34.56.0 — 2026-10-07

### OSCPDB pre-exam resource
- Added `https://oscpdb.vercel.app/` to the Online Resource Desk under the searchable tag `[ONLINE:OSCPDB]`.
- Kept the exam app offline-first: OSCPDB is a navigational reference only and is not loaded as a runtime dependency.
- Added an explicit warning that OSCPDB is not an OffSec whitelist and that its current AI Reasoning area should be treated as pre-exam-only because OSCP+ currently prohibits AI/LLM chatbot assistance during the exam/reporting phase.
- Added tests that lock the URL, privacy/rule warning and pre-exam positioning.


## V34.55.0 — 2026-10-04

### Exam freeze and encrypted-backup failure UX
- Fixed blank encrypted-backup failure feedback: AES-GCM `OperationError` now becomes `Wrong passphrase or corrupted backup file.` before the existing backup-test UI renders the error.
- Added an executable regression that triggers a real AES-GCM authentication failure with the wrong key and verifies the stable actionable message; non-auth decrypt errors keep their original useful message.
- Kept `03-core-app.js` unchanged at its 332,081-byte downward-only ratchet; the fix lives in a small late-bound freeze layer and does not change the session schema, storage namespace or offline model.
- Declared the app in exam freeze: no new features, architecture migrations or proactive hardening before OSCP unless real practice exposes a reproducible problem or current OffSec rules materially change.

## V34.54.0 — 2026-10-04

### Legacy core storage extraction
- Moved defensive saved-state parsing and storage helpers (safeStoredJSON/Array/Record and safeStoreSet/Get/Remove) out of `03-core-app.js` into the parser-first `01-storage-guard.js` module without changing the storage namespace or session schema.
- Lowered the legacy-core byte ratchet from 334,255 to 332,081 bytes, creating 2,174 bytes of real headroom instead of raising the cap.
- Added isolated behavior tests for malformed JSON, wrong-shaped state, normal persistence, read/write/remove failures and the in-memory storage fallback.
- Added source-hygiene and unit ownership guards that require the storage layer to load before the core and prevent the extracted helpers from drifting back into `03-core-app.js`.
- Kept the generated app single-file/offline-first; no runtime network dependency, schema migration or new operating mode was introduced.

## V34.53.0 — 2026-10-04

### Access-truth defensive hardening
- Fixed a latent `accessRecordStale()` null/undefined dereference; missing records now fail closed as not stale instead of throwing.
- Added a real browser self-test that invokes `accessRecordStale()` with null, undefined, stale and untested records, so Chromium CI now verifies behavior rather than only source markers.
- No current UI call site was failing: all live callers normalize records through `accessRecord()`. This is defensive hardening for malformed/future callers.
- Legacy `03-core-app.js` remains unchanged at its 334,255-byte ratchet cap; the next feature touching it still requires extraction first.

## V34.52.0 — 2026-10-04

### Repository hygiene and major-module coverage
- Removed the obsolete V34.51 source-migration find/replace shim from both CI jobs; verification now runs only committed source, and the generated-artifact job only rebuilds/synchronizes `index.html` and README.
- Added direct deterministic contracts for the large Windows strategy and handoff/access-truth modules so their critical workflow data, privilege branches, resume fields, secret-risk scanning, access outcomes and protocols are no longer covered only incidentally.
- Added explicit npm metadata `"license": "UNLICENSED"` to match the repository's all-rights-reserved `LICENSE`.
- Clarified that numeric source prefixes are startup/dependency bands rather than unique ordinals; tied bands are permitted only when their authoritative order is explicit in the template/build pipeline.
- Build output now reports remaining soft-limit headroom as well as hard-limit headroom, making artifact growth visible before the warning threshold is crossed.
- Preserved the single-file, offline-first reference payload rather than externalizing methodology content solely to reduce artifact size.

## V34.51.0 — 2026-10-03

### Import ownership, persistence and reliability correction
- Removed superseded legacy import `.onchange` handlers from the core and handoff layer; `26-v35-import-safety.js` is now the single import owner and browser/self-tests assert exact handler identity.
- Centralized the current session schema as `SESSION_SCHEMA_VERSION`; current session and target exports, validators and import guards consume the same value.
- Orphaned `activeTargetId` is now a recoverable warning and is repaired to the first imported target; duplicate/missing IDs and future schemas remain hard failures.
- Imports now check conservative storage headroom and verify critical localStorage keys by reading them back after restore; persistence mismatch triggers automatic rollback.
- Added localStorage fault injection that forces a quota-style write failure and proves both in-memory and persisted state roll back to the pre-import session while retaining the recovery snapshot.
- Added representative import fixtures for schemas 1, 9, 16 and 19 and a Chromium gate that restores each through the current build.
- Reduced secret-lint noise: bare 32/64-character proof values and unlabeled MD5/SHA digests no longer warn; acknowledged `kind|path` findings prompt only once per browser tab.
- Backup freshness is now configurable (30m/1h/2h/4h) with stronger due-soon, expired and missing visual states.
- Removed dead handler code from the legacy core, reducing it to 334,255 bytes, and tightened the quality ratchet to the exact current size.
- Added permanent source-hygiene and downward-only ratchet checks, `ROADMAP.md`, updated import-safety/release docs, and a CI-only create→clock→export→wipe→restore→compare lifecycle dry run.
- Verified GitHub Action SHA pins against the `v7.0.1` checkout and `v7.0.0` setup-node tag refs; Dependabot remains enabled for Actions updates.

## V34.50.0 — 2026-10-03

### Transactional import / restore safety
- Normal session, encrypted session and target-only imports now validate before mutation and require a pre-restore recovery snapshot.
- Restore/apply failures automatically roll back to the captured in-memory session while retaining the pre-restore recovery snapshot.
- Added post-restore state validation so a restore that produces invalid state is treated as a failed transaction and rolled back.
- Added pure malformed/truncated/oversized/wrong-shaped/future-schema regression coverage and transaction rollback tests.
- Added a dedicated Chromium import-safety gate covering transactional wiring, supported schema compatibility and rollback behavior.
- Added `docs/IMPORT-SAFETY.md`; no new background loop, network dependency or legacy-core growth was introduced.

## V34.49.0 — 2026-10-03

### Exam reliability safety
- Added an isolated reliability module instead of growing the legacy core.
- Added a Session reliability preflight for browser storage round-trip, storage headroom, secret-free backup schema/integrity round-trip, free-text secret lint, search/reference availability, build metadata, clock sanity, saved-state parse health and external-backup freshness.
- Added an app-owned localStorage meter using a conservative 5 MB planning budget with a warning at 70%; actual browser quota remains browser-dependent.
- Secret-free session export and clipboard recovery now warn before continuing when credential/hash/key/token-like material is detected in free-text notes or report fields; detected values are never echoed by the scanner.
- Added one-click secret-free backup controls to Session and the exam-clock controls.
- Added pure regression tests plus a dedicated Chromium reliability-safety gate.
- No schema migration, IndexedDB dependency, background polling loop or automatic network activity was added.

## V34.48.0 — 2026-10-03

### README and documentation cleanup
- Reduced `README.md` to the information that is useful for opening, using, validating and maintaining the exam app.
- Removed release-history detail, size-policy detail and retired backlog material from the README; those belong in dedicated docs/validation output.
- Deleted `docs/IMPROVEMENT-TRACKER.md` and removed live documentation dependencies on the retired 100-item tracker.
- Updated the stable-release checklist to use current quality ratchets, known limitations and preflight checks instead.
- No exam runtime behavior changed.

## V34.47.0 — 2026-10-03

### Repository and release hardening
- README version is synchronized from `src/meta/build.json`; validation rejects README/package/build metadata drift.
- Added a changelog gate requiring the first release entry to match the current build version/date.
- Replaced the nearly-exhausted 1.5 MB hard artifact limit with an explicit quality policy: warn at 1.50 MB and fail at 1.75 MB.
- Added downward-only quality ratchets for audited `innerHTML` assignments and maximum legacy `03-core-app.js` size.
- GitHub Actions are pinned to immutable commit SHAs corresponding to checkout v7.0.1 and setup-node v7.0.0.
- Added Dependabot updates for GitHub Actions.
- Split CI permissions: verification is read-only; only the main-only generated-artifact sync job gets `contents: write`.
- Pull requests now fail when generated `index.html` or the README version block is not committed.
- Added an explicit all-rights-reserved `LICENSE` notice; no open-source license is granted by default.

## V34.46.0 — 2026-10-03

### Kali toolchain readiness
- Added capability-based pre-exam Kali readiness checks to Best Tools.
- Added a local-only inventory script that checks command availability without installing, updating, or contacting the network.
- Readiness accepts equivalent tools for the same exam job instead of requiring one exact package name.
- Added unit and Chromium coverage for complete-toolchain and missing-critical-tool states.

## V34.45.0 — 2026-10-03

### Exam-time tooling defaults
- Added Primary → Fallback → Specialist ladders for discovery, web, SMB, AD, privesc, shell handling, pivoting, cracking and exploit research.
- Added Penelope OSCP-safe mode as a recommended shell-handler option.
- Added RustHound-CE, smbclient-ng and RustScan as deliberately conditional fallbacks.
- Added a tool-switch gate: read exact error → validate failing layer → try one fallback → rotate if evidence does not improve.

## V34.44.0 — 2026-10-03

### Online Resource Desk
- Added curated official and community references for OffSec rules, Linux, Windows, AD, web, pivoting and exploit research.
- Added search tags such as `[ONLINE:AD]`, `[ONLINE:WEB]`, `[ONLINE:PIVOT]` and `[ONLINE:CVE]`.
- Added guidance to keep exam credentials, hashes, tickets, flags and screenshots out of random third-party services.

## V34.43.0 — 2026-10-03

### Research-backed exam operating loop
- Added MAP → CHOOSE → RESET → BANK → REPRODUCE guidance derived from recurring 2026 passer signals and current OffSec rules.
- Added state-aware Fresh-Eyes Reset flows for web, Linux, Windows, AD and pivoting.
- Added live exam-state metrics and explicit bank-before-reset behavior when point-bearing evidence exists.

## V34.42.0 — 2026-10-03

### Full Reference find navigation
- Added a dedicated in-reference finder with all-match highlighting, active-match emphasis, current/total and remaining counts.
- Added Previous/Next, Enter/Shift+Enter and F3/Shift+F3 navigation with wrapping.
- Hidden matches inside collapsed `<details>` now open automatically.
- Preserved the existing global fuzzy search behavior.

## V34.39.0 — 2026-10-03

### Context-aware Next Actions
- Added deterministic active-target recommendations from role, stage, services, access and evidence state.
- Capped recommendations to a small exam-time queue and deep-linked them into existing methodology instead of creating another large page.

## V34.38.0 — 2026-10-01

### Proof closure guard
- Added a five-step Bank the Points checklist, fast Linux/Windows proof-capture commands and explicit manual-verification state.
- Added dedicated proof-bank regressions and current OffSec evidence-workflow research notes.

## V34.37.0 — 2026-10-01

### Search language aliases
- Added exam-language-aware aliases such as subdomain/vhost/hosts, privesc/privilege escalation, pivot/tunnel/Ligolo, BloodHound collectors, Kerberoast/SPN and upload/transfer.

## V34.36.0 — 2026-09-30

### Search-to-reference collapsed-section fix
- Global search body-text hits now route to the exact collapsed reference section and expand all ancestor `<details>` elements before scrolling/highlighting.

## Earlier V34 history

Detailed earlier release notes remain available in repository history and in the reliability/research documentation under `docs/`, especially `docs/ARCHITECTURE.md` and `docs/RESEARCH-*.md`.
