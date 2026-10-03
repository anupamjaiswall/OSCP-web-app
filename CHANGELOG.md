# Changelog

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
