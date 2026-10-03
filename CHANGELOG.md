# Changelog

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

Detailed pre-V34.36 release notes remain available in the repository history and in the implementation/reliability documentation under `docs/`, especially `docs/IMPROVEMENT-TRACKER.md`, `docs/ARCHITECTURE.md`, and `docs/RESEARCH-*.md`.
