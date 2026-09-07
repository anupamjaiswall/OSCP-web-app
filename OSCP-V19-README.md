# OSCP V19 — Exam-Only Operating System

This build is an exam-time-only operating system: no quizzes, simulations, study plans, or prohibited-tool workflows. It combines the high-signal console, complete V19 reference, Windows post-shell strategy, evidence workflow, and navigation reliability layer.

It is designed to remove avoidable exam-time lookup and documentation gaps, but it cannot guarantee a passing result. The current OffSec instructions and your validated target evidence always win.

## V19 release — resumable targets and truthful Windows access

- V19 is a new, separately packaged release; **V18 is preserved**. The next improvement pass will be V20.
- Research was refreshed on **06 September 2026** against OffSec's current Exam Guide, FAQ, AI policy and reporting requirements, plus current NetExec and Microsoft WinRM documentation. No exam-format change was found.
- The existing seven-destination exam layout is unchanged and Drill/Rehearsal remain absent.
- **Target** now has a six-line **Resume / Park Packet**: current access, strongest evidence, exact hypothesis, missing prerequisite, next decisive command and re-entry path.
- A target cannot be marked parked until all six fields are usable. Parking pauses the shared evidence timer; resuming never assumes that a pre-revert shell, route or token is still live.
- The packet rejects common inline password, hash, ticket and private-key patterns. It stores credential labels or environment-variable names, not deliberate secret material.
- **Windows** now has a target-scoped **Authentication → Usable Access Ladder** for SMB, LDAP, WinRM, RDP, MSSQL and WMI. It separates transport, rejected authentication, accepted authentication, resource access, command execution, interactive sessions and privileged/admin control.
- Every protocol result records the target revert epoch. Old outcomes are marked stale after a revert, and the next-action engine prioritizes revalidation, proof closure and one-host capability checks.
- NetExec `[+]`, protocol-specific `Pwn3d!`, remote command execution, interactive proof shells and actual admin control are no longer collapsed into one ambiguous success state.
- Normal JSON session import now uses the same complete restore path as encrypted backups and recovery snapshots. This fixes inherited partial restores of later-version board, evidence, guard, clock, revert, Windows, rules-lock and router state.
- Resume packets are embedded in their target records; access-ladder state and all existing Windows/rule state are included in normal and encrypted V19 backups.
- V18's current rule lock, eight-type credential-material router, Impacket 0.13.1 delta, NetExec 1.5.1 safety floor, BloodHound CE 9.6.0 stable lock and live DOM-derived search remain intact.
- The app remains one self-contained offline HTML file with no network, external assets or AI workflow.

## Simple exam mode

- The default sidebar now has only seven destinations: **Start, Methodology, Best Tools, Windows, Target, Evidence & Report, Full Reference**.
- A single **Show advanced** button reveals the complete inherited V19 engine. No reference, audit, playbook, Linux privilege-escalation entry, AD helper or reliability feature was removed.
- The Start view presents one four-stage loop, short mutation / pre-exit gates, and a six-branch three-minute recovery desk for common exam stalls.
- Methodology provides the full evidence-first sequence from scope and scanning through proof, credential reuse, re-enumeration and reporting.
- A hard rotation rule parks a path after **20–30 minutes or two failed tests without new evidence**.
- The Start card now contains the actual shared evidence timer—Start, Pause, Reset and a 10–120 minute limit—rather than redirecting to the separate exam clock. Its state mirrors the advanced cockpit timer.
- Best Tools shows a curated **29-tool** set by default; the same view can reveal the complete **90-tool exam-reference arsenal**.
- Start now includes an **“I have this — what next?”** decision desk for IP, service, web, version, credential, Linux shell, Windows shell, domain credential, pivot and privileged-shell states.
- Methodology includes collapsed first-command, credential fan-out, Linux/Windows escalation, web/AD and tool-failure playbooks, keeping the default screen compact.
- A state-aware **Bank the points** card now activates from the selected target and shows incomplete original-path, screenshot, submission and reproducibility checks before the operator moves on.
- A cross-target **Exam risk strip** exposes the recorded point estimate, unbanked targets, stale post-revert state, untested credential/service pairs and whether an actual secret-free recovery point exists—without adding another destination. It explicitly labels the exam control panel as authoritative.
- Evidence & Report includes a small proof-command builder for Linux, Windows cmd and PowerShell, with editable original paths, copy-ready target-IP + flag commands, and a sanitized target-specific screenshot filename.
- Evidence & Report now keeps the complete final-package sequence visible in simple mode: target/order check, PDF review, Kali archive, exact contents/size, upload MD5, final submit action, and acknowledgement.
- Base text, form labels, evidence checks, focus rings and touch targets were enlarged for long exam sessions; responsive and reduced-motion behavior remain intact.

## Current-rule and methodology hardening

- Official Exam Guide, Exam FAQ, AI policy, Candidate Handbook and report-upload requirements were re-checked on **6 September 2026**. The live official pages always override this offline snapshot.
- Added the 90-second point-closure gate, the 70+ point evidence audit, the 24-revert/one-reset incident gate, the mutation/rollback gate, PowerShell Core/PSSession handling, and the exam-environment download restriction.
- Corrected proof capture so the command displays the **target's** interface rather than Kali's `tun0`; removed downloaded/copied flag examples and an invented alternate Windows proof path.
- Replaced aggressive shared-output first scans with per-target `-oA` output and an adaptive `--min-rate 1000` baseline. Blanket `--script vuln`/`-A` use was replaced by reviewed, service-specific NSE selection. AutoRecon is optional after manual review rather than the default for every host.
- Corrected FTP listing, rsync upload and pspy logging examples. FTP/MySQL/VNC/Telnet first-pass blocks no longer launch brute-force scripts; any remaining online guessing path is clearly last-resort, lockout-aware and uses a small evidence-derived shortlist.
- Standardized the rabbit-hole gate to **20–30 minutes or two failed decisive tests without new evidence**.
- LinPEAS color is now explicitly a lead, not proof; credential/default tests require scope and lockout awareness.
- Ligolo-ng uses the current managed interface/session/route/listener flow with certificate-fingerprint validation. Installed local help still wins when syntax changes.
- The Ligolo snapshot is now explicitly 0.9.1; the auditable managed-route sequence remains the default and 0.8+ `autoroute` is labeled as an optional local-help-confirmed shortcut.
- Legacy “missed tricks” examples no longer imply blanket credential fan-out and now preserve `/etc/passwd` / `authorized_keys` state before any write, with an explicit rollback obligation.
- Full-reference search is derived only from the visible reference at startup; there is no secondary generated text blob to drift or serve superseded advice.
- The report finalizer refuses silent overwrites unless `--force` is supplied and verifies exact filename, single-PDF contents, archive size and encryption state.

## Full Markdown manual

- The package now includes `OSCP-V19-Checklist-2026-Exam-Optimized.md` as the complete 9,200+ line exam reference.
- Its new open-by-default Decision Desk provides a 14-step target loop, symptom-to-next-action matrix, minimum tool stack, credential fan-out commands, web/Linux/Windows/AD trees, proof commands and detailed high-yield validation trees.
- All original GitHub-compatible `<details>/<summary>` blocks and protected Linux entries remain intact.

## Navigation fixes

- Browser **Back** and **Forward** now work across SPA views using `history.pushState` / `popstate`.
- Added visible **Back** and **Forward** buttons in the top bar.
- View URLs are deep-linkable as `#view=<viewId>`.
- Full-reference jumps also preserve anchors as `&ref=<anchor>`.
- Back restores the previous view and saved scroll position.
- Reference → reference jumps create usable history entries instead of destroying the previous reference location.
- Reload restores the last app view when there is no explicit deep link.
- Clicking the already-active view does not spam browser history.
- Active sidebar entries are brought into view automatically.
- Replaced non-standard `scrollTo(... behavior:"instant")` with cross-browser `behavior:"auto"`.

## Shortcut fixes

Inherited versions had conflicting shortcuts (`Alt+C` and `Alt+H`) and the dashboard advertised `Alt+1` through `Alt+5` without implementing them. V19 now has one capture-phase router:

- `Alt+1` Start
- `Alt+M` Methodology
- `Alt+2` Workspace
- `Alt+3` Credentials
- `Alt+4` Reports
- `Alt+5` Full Reference
- `Alt+6` Tool Arsenal
- `Alt+W` Windows Strategy
- `Alt+P` High-Signal Engine
- `Alt+K` Exam Clock
- `Alt+C` Coverage
- `Alt+H` Hypothesis Workbench
- `Alt+Left` / `Alt+Right` Back / Forward

The router suppresses inherited duplicate listeners so one key cannot switch to two views.

## Curated tools plus full arsenal

- Dedicated offline, searchable Best Tools view with 29 recommended entries by default and all 90 exam-reference entries through one selector.
- Each card includes the use trigger, conservative first command, fallback/manual validation, trust tier, and rule warning.
- Coverage spans discovery, web, SMB/auth, Active Directory, remote access, services, exploit research, credentials, Linux/Windows privilege escalation, pivoting, transfer, and shell handling.
- Added high-value gaps including Arjun, MANSPIDER, ldeep, targetedKerberoast, pyWhisker, Coercer awareness, grpcurl, and expanded service-client coverage.
- Non-exam Nuclei and active Responder/relay workflows are removed. Responder is analyze-mode only; rule-sensitive entries still expose lockout and Metasploit restrictions.
- Preflight now distinguishes core from optional commands and checks the expanded Kali-side inventory.

## Windows strategy retained

The Windows destination is now a compact Windows/AD exam desk. Before the post-shell checklist it provides:

- an issued-domain-credential first-10-minutes sequence covering DNS, time, ports, authentication, shares, LDAP, Kerberos, BloodHound CE and Certipy;
- a six-protocol authentication-to-access ladder that preserves the current principal label, the exact result per target, protocol-specific next proof and post-revert staleness;
- an exact graph-edge execution gate with read/backup/minimum-change/rollback/re-collection requirements;
- an offline deterministic error decoder that separates Unicode formatting, route/port, DNS/realm, time, principal/SPN, authentication, authorization, account-state, share-name and local tool/version failures;
- explicit NetExec `[+]` versus `Pwn3d!`, domain-versus-local identity formatting, and “new protocol = new token/context” guidance;
- sanitized copy buttons on the AD fast path and every Windows checklist command block, larger command/explanation text, and correct target-role handling for Windows, AD-member and DC targets.
- a target-aware 14-plan edge selector with copy-ready prerequisite/read/action/verify/rollback records and explicit reversible-versus-disruptive risk labels;
- a four-step issued-credential progress counter that persists per target and can be reset without touching the 12-step post-shell checklist.

The integrated post-shell workflow remains target-aware and persists per target in normal/encrypted session backups:

1. Baseline identity / OS / network
2. Quick filesystem and installed-software triage
3. Automated pass — **save and read** PrivEscCheck / WinPEAS / Seatbelt output
4. Focused credential hunting
5. Token / privilege validation
6. Service privilege-escalation checks
7. Scheduled tasks
8. Registry / installer / autorun checks
9. Local-only listeners and process mapping
10. Installed/custom applications
11. Re-enumerate after context/identity changes
12. Driver/kernel/CVE paths last

## Validation performed

- Simple-mode default, methodology, advanced toggle and curated/full tool scopes are covered by deterministic validation.
- Markdown completeness, raw-details balance, protected entries, current rule summary, decision tags, tool coverage and every web-app reference jump are checked by `test_oscp_v19_content.py`.
- Tool Arsenal contains **90 unique exam-reference entries across 13 categories**; every card has a trigger, command, fallback, tier, and required rule text.
- Drill/Rehearsal UI, state, handlers, search data, and styling are absent; automated checks prevent either mode from returning unnoticed.
- SQLmap workflows, active Responder poisoning, forced-authentication/relay examples, Nuclei, and fake practice-target state are absent.
- Tool data evaluates independently in Node; search/tier/category filter models passed.
- All copied command templates pass shell-quoting syntax checks and Unicode/smart-quote checks.
- Expanded preflight contains **101 checks**, labels core vs optional, executes successfully, and emits valid JSON.
- Helper integration tests exercise preflight JSON, evidence hash success/failure, exploit preservation/diffing, safe state repair, exact report packaging, overwrite refusal, and encrypted-archive rejection.
- A dependency-free Node test executes the proof-command builder and screenshot-name sanitizer against Linux, cmd and PowerShell paths (including quotes/newlines), verifies the exact seven-item default navigation, and checks risk-strip/offline/search/submission invariants.
- The same Node suite now executes the AD failure classifier against success, expected Kerberos, time, DNS/SPN, transport, syntax, account-state, authentication and authorization fixtures, and checks the shared timer limit model.
- V19-specific checks require all 14 BloodHound edge IDs, every prove/action/verify/rollback field, four target-aware issued-credential stages, explicit multi-value cleanup traps, release identity, and backup/restore coverage for the new per-target state.
- V19-specific logic tests also exercise six-field handoff completeness, secret-pattern rejection, target independence, the eight-state access hierarchy, all six Windows/AD protocol routes, revert-epoch staleness and complete normal-session restore wiring.
- The release builder uses fixed ZIP metadata; two builds from identical sources were verified byte-for-byte identical, and a clean extraction passed every packaged checksum and test.
- Current OffSec exam, proof, tool and report-upload rules were re-checked on **6 September 2026**; official rules remain authoritative.
- All navigation targets resolve to real views.
- No duplicate real DOM IDs.
- HTML section/details balance passed.
- All JavaScript blocks pass `node --check`.
- History, deep-link, scroll-restore and same-view deduplication wiring checks passed.
- Central shortcut routing checks passed.
- Existing V19 storage fallback and `coverageStats` runtime fix remain present.

The build environment does not include a Playwright browser binary, so this build does not claim a full browser click-through. The package includes `test_oscp_v19_runtime.js`; when Chromium is available it exercises deep links, filters, Alt+6, Back/Forward, the six-line handoff and secret guard, Park/Resume timer behavior, the eight-state protocol ladder, post-revert staleness, complete JSON restore, the 14-plan edge selector, per-target persistence, preflight import, built-in self-tests, responsive layout, external requests, and runtime errors. Browser-independent validators execute the same decision functions and verify all new markup, state wiring and restore surfaces here.
