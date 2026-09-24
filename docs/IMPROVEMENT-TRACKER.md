# Original 100-Item Improvement Tracker

This tracker maps the earlier 1–100 review to the current app. Labels are concise summaries of those items rather than verbatim wording.

**Legend:** ✅ implemented · 🟡 satisfied with a safer/modified approach or partly applicable · 🔜 still applicable/pending · ⏭ intentionally not implemented

| # | Status | Improvement | Current disposition |
|---:|:---:|---|---|
| 1 | ✅ | Full-session JSON export | Implemented; secret-free export + encrypted backup. |
| 2 | ✅ | Full-session JSON import | Validated before mutation; pre-restore snapshot. |
| 3 | 🟡 | Automatic external JSON downloads | Not used; local autosnapshots + explicit external export avoid browser download spam. |
| 4 | ✅ | Visible save/recovery freshness | Work-state timestamp plus V34.25 recovery-risk / external-backup status. |
| 5 | ✅ | Conditional beforeunload warning | V34.25 warns only for storage failure or dirty state + stale/missing external backup. |
| 6 | ✅ | Undo destructive actions | V34.26 restores newest retained pre-destructive safety snapshot. |
| 7 | ✅ | Explicit backup/schema versions | Session formats/version validation already enforced. |
| 8 | ✅ | Whole-state checksum | V34.21 embeds/verifies SHA-256 for secret-free backups. |
| 9 | ✅ | Emergency clipboard recovery | V34.18 + V34.21 integrity metadata. |
| 10 | ✅ | Documented disaster recovery | V34.19 preflight + Known Limitations. |
| 11 | ⏭ | PWA manifest | Skipped: not useful enough for one-file exam artifact. |
| 12 | ⏭ | Service Worker offline cache | Skipped: adds caching/failure modes to an already-offline file. |
| 13 | ⏭ | PWA cache/version lifecycle | Skipped with Service Worker approach. |
| 14 | ✅ | Cold-start/offline rehearsal | Documented preflight + required browser boot gate. |
| 15 | 🟡 | Direct file:// validation | Manual exam preflight uses exact file; CI uses ephemeral localhost because headless Chromium file-origin storage can stall. |
| 16 | ✅ | 23h45 exam clock | Existing Exam Clock retained. |
| 17 | ✅ | Rotation/fatigue timers | Existing evidence rotation/fatigue guard retained. |
| 18 | ✅ | Per-target attempt ledger | Existing Tried/Result ledger retained. |
| 19 | ✅ | Report skeleton/export | Existing report workspace + Markdown exports. |
| 20 | ✅ | Evidence/proof checklist | Existing evidence gate and Bank the Points workflow. |
| 21 | ✅ | 70-point score tracking | Existing Exam Board score threshold. |
| 22 | ⏭ | Break timer that pauses VPN | Not implemented; underlying assumption was incorrect. |
| 23 | ✅ | Shortcut/help overlay | Existing exam help / shortcut surfaces. |
| 24 | ✅ | Active-target + next-action context | Existing workspace/top context and V33 dossier. |
| 25 | ✅ | Flag target for report review | V34.4. |
| 26 | ✅ | Current AD-set workflow | Current 3-machine AD methodology represented. |
| 27 | ✅ | Kerberoast / AS-REP paths | Existing rights/prerequisite-gated AD notes. |
| 28 | ✅ | Responder poisoning warning | Current rule snapshot distinguishes allowed tool vs prohibited poisoning/spoofing. |
| 29 | ✅ | Metasploit restriction warning | Current rule snapshot and guardrails. |
| 30 | ✅ | Current exam-rule snapshot | Maintained in app + dated research docs. |
| 31 | 🟡 | BOF material reduction | Kept out of primary flow but not deleted because memory-corruption knowledge remains relevant. |
| 32 | ✅ | Official-rule cross-check | Research log + rule snapshot. |
| 33 | ✅ | Rabbit-hole control | Stuck reset, timers, attempt ledger, evidence rotation. |
| 34 | ✅ | Linux/Windows quick-win trees | Methodology trees and attack paths. |
| 35 | ✅ | Pivot decision/troubleshooting flow | Pivot proof ladder + route diary. |
| 36 | ✅ | All reference fragments searchable | V34.20 indexes complete immediate heading regions. |
| 37 | ✅ | Typo/fuzzy search | V34.1 + V34.20. |
| 38 | ✅ | Highlight destination on jump | Existing reference jump highlight. |
| 39 | ✅ | Recently viewed references | Existing V24 navigator. |
| 40 | ✅ | Breadcrumbs | V34.16. |
| 41 | ⏭ | Permanent large sidebar | Skipped; quick index/navigator preserves screen width. |
| 42 | ✅ | Active target → service methodology | V33 Service Dossier. |
| 43 | ✅ | Skip-to-content | V34.16 keyboard-visible skip link. |
| 44 | ⏭ | Automatically follow OS theme | Skipped; explicit/predictable exam appearance preferred. |
| 45 | ✅ | High-contrast mode | V34.1. |
| 46 | 🔜 | Formal contrast-ratio audit | Still useful as a static/design audit. |
| 47 | ✅ | Strong focus-visible styling | V34.1. |
| 48 | ✅ | Font-size controls | Existing readability panel. |
| 49 | ✅ | Keyboard-order / control semantics | V34.20 + V34.24. |
| 50 | ✅ | Compact/comfortable density | Existing readability panel. |
| 51 | ⏭ | Drag-to-reorder targets | Skipped: accidental-drag risk and low exam value. |
| 52 | ✅ | Glanceable target status | Exam Board / active-target summaries. |
| 53 | ✅ | Copy buttons for commands | Existing reference code copy controls, chunked after boot. |
| 54 | ✅ | Destructive confirmations | Target/snapshot/clear/import safety layers. |
| 55 | 🔜 | Persistent runtime error log | Still useful if implemented without rendering from the error handler. |
| 56 | ✅ | Sticky active-target identity | Top target context / active-work strip. |
| 57 | 🟡 | Empty-state audit | Major views have empty states; a full consistency pass is still optional. |
| 58 | 🟡 | Print CSS | Basic print hiding exists; app is not intended to be the final report editor. |
| 59 | 🟡 | Printable report view | Markdown report export is the primary path. |
| 60 | ⏭ | Complex print page-break system | Skipped: low exam value versus exported report workflow. |
| 61 | 🔜 | Split oversized core app | Deferred until behavioral coverage is stronger; high refactor risk. |
| 62 | 🟡 | Split strategy files | Windows/AD/service layers are already separated; core still has legacy layers. |
| 63 | 🟡 | Modularize monolith | V30 modularized source; generated exam artifact intentionally stays one file. |
| 64 | ⏭ | Add ESLint dependency | Skipped to preserve zero-dependency build; custom audits cover critical invariants. |
| 65 | ✅ | Generated artifact size budget | V34.2, 1.5 MB ceiling. |
| 66 | 🔜 | Naming/contribution conventions doc | Low-risk maintainability item still open. |
| 67 | ✅ | Real browser smoke test | Required CI gate. |
| 68 | ✅ | V33 live-state regressions | Static wiring + browser behavior coverage. |
| 69 | 🔜 | Deeper Windows/access-truth behavior tests | Still worthwhile. |
| 70 | ✅ | Critical section-anchor assertions | V34.2. |
| 71 | ✅ | Artifact size regression | V34.2 size budget. |
| 72 | ✅ | Strict CSP validation | V34.2. |
| 73 | ✅ | Unsafe DOM/sink audit | V34.23. |
| 74 | ⏭ | Self-verifying embedded app hash | Skipped: same-file expected hash is not a trustworthy tamper boundary. |
| 75 | ✅ | Reject eval/new Function | V34.2. |
| 76 | ⏭ | Choose/add LICENSE automatically | Skipped until reuse rights are deliberately chosen. |
| 77 | 🔜 | Repository description/topics polish | Useful but lower priority than exam behavior. |
| 78 | ⏭ | CONTRIBUTING.md for personal exam repo | Skipped unless collaboration becomes a goal. |
| 79 | 🔜 | Release/tag discipline | Useful after the current batch series stabilizes. |
| 80 | ⏭ | SECURITY.md | Low value for this personal offline exam reference. |
| 81 | ✅ | Repo hygiene/build docs | V30+ README, .gitignore, architecture/content docs. |
| 82 | ✅ | Lazy deep rendering/indexing | V34.8 + V34.12. |
| 83 | ✅ | Search debounce | V34.20. |
| 84 | ✅ | Startup profiling / boot hardening | V34.9–V34.14 plus browser diagnostics. |
| 85 | ⏭ | Optimize around second phone | Skipped: exam workstation should be the primary surface. |
| 86 | ⏭ | Tablet/mobile secondary-device workflow | Skipped for the same reason. |
| 87 | 🟡 | Consolidated settings experience | Readability + local settings are already centralized enough for exam use. |
| 88 | ✅ | Reset settings without deleting exam state | V34.17. |
| 89 | 🟡 | Hide irrelevant sections | Focus mode/tree soloing exists; automatic hiding is intentionally limited. |
| 90 | 🔜 | Global JS runtime diagnostics panel | Still useful; must be non-recursive and on-demand. |
| 91 | ⏭ | Support old browsers | Skipped; modern browser/WebCrypto/DecompressionStream are documented requirements. |
| 92 | ✅ | 100/125/150% zoom testing | Required browser screenshots. |
| 93 | ✅ | Clear-target vs wipe-all distinction | V34.3/V34.5/V34.17. |
| 94 | 🔜 | Multi-tab write conflict warning | Still useful if implemented without localStorage chatter/polling. |
| 95 | 🟡 | Force Save button | Existing manual snapshot + full backup are safer/more explicit equivalents. |
| 96 | ✅ | Visible build/version identity | Top badge + build metadata + checksum. |
| 97 | ✅ | Known Limitations document | V34.19. |
| 98 | ✅ | Changelog/version history | Maintained per batch. |
| 99 | ✅ | Malformed/truncated scan fixtures | V34.2. |
| 100 | 🟡 | Full exam dry run | Preflight documents it; the human operator must perform the real rehearsal. |

## Remaining applicable work

The remaining high-value items are deliberately small in number: formal contrast auditing, a non-recursive runtime diagnostics panel, deeper Windows/access-truth browser regressions, naming conventions, optional repository metadata/releases, and an event-driven multi-tab conflict warning. Splitting the legacy core is deferred until behavioral coverage is strong enough to make that refactor low-risk.

Items marked ⏭ are not backlog debt: they were intentionally rejected because they add exam-day complexity, rely on an incorrect premise, weaken the zero-dependency/offline model, or provide little value for this personal exam artifact.
