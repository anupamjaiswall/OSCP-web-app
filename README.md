# OSCP — High-Signal Knowledge Engine

V16 keeps the full V15 **Failure-Resistant Operator Console** and changes the next optimization target: **decision quality**.

The goal is not to add hundreds of payloads. V16 makes version-based research harder to misuse, surfaces modern AD helpers, adds source-assisted web methodology, and prioritizes high-yield privilege-escalation candidates before fragile research PoCs.

- **High-Signal Engine** view with trust tiers and one-click jumps to the most important new material.
- **Evidence-first First 10 Minutes** replaces the inherited version/CVE-first quick-win checklist.
- **CVE Context Card** requires LOCAL/REMOTE, authentication/privilege, exact build/package, configuration, trigger, backport status, PoC match, reliability and crash risk.
- **Exact Package Revision Cheatsheet** for Debian/Ubuntu and RPM-family backport verification.
- **Public Exploit Intake Workflow** plus `oscp-v16-exploit-workbench.py` to preserve the original exploit, hash it, make a working copy and generate a report-ready diff.
- **Exposed `.git` Recovery** workflow using `git-dumper`, Git history, deleted files and source-assisted validation.
- **Impacket 0.13 AD Helper Pack**: `dacledit`, `owneredit`, `GetLAPSPassword`, `GetADComputers`, plus conditional `badsuccessor`/dMSA awareness.
- **AD CS fast matrix** for ESC1/4/8/13/15/16/17.
- **Certighost CVE-2026-54121 prerequisite card** rather than a bare CVE name.
- **High-yield Linux LPE pack**:
  - CVE-2025-32463 — sudo chroot LPE
  - CVE-2025-32462 — sudo host-option rule bypass
  - needrestart family: CVE-2024-48990 / 48991 / 48992 / 10224 / 11003
  - CVE-2023-4911 — Looney Tunables
  - CVE-2025-6018 + CVE-2025-6019 — PAM/allow_active → libblockdev/udisks chain
  - CVE-2024-6387 — regreSSHion, explicitly marked LAST RESORT
- **Windows CVE context correction**: CVE-2026-26128 is a LOCAL elevation-of-privilege issue, not remote SMB RCE.
- **Destructive / Stability Command Guard** warns on reboot/shutdown, raw disk changes, service/task destruction and kernel/module actions; catastrophic root-filesystem commands are blocked by the local command linter.
- **V16 preflight** checks modern Impacket wrappers plus `git-dumper`; optional `bloodyAD` is visible but not required.

## Trust tiers

- `� CORE` — reliable first-line methodology.
- `� CONDITIONAL` — valuable when exact prerequisites exist.
- `� RULE-SENSITIVE` — action may cross an exam restriction; verify the current official guide.
- `� LEGACY` — useful on older targets, not a default priority.
- `� LAST RESORT` — fragile/racy/kernel/driver/reboot-risk path.
- `⚫ LAB-ONLY` — retained for authorized practice, not for the exam.

## Why the Quick-Win section changed

V15 still inherited an older checklist that encouraged `exact version → Searchsploit/CVE` too early. V16 replaces it with:

```text
anonymous/default access
→ hostname/vhost/service role
→ source/config/backup/.git/secrets
→ credential fan-out
→ prove a primitive
→ exact build/package + LOCAL/REMOTE context
→ configuration/prerequisites/backport
→ safe validation
→ exploit
```

The legacy CVE quick-reference remains available as a recognition index, but it is explicitly **CONDITIONAL / LEGACY**.

## helper commands

```bash
python3 oscp-v16-preflight.py
python3 oscp-v16-state-doctor.py oscp-v16-session.json
python3 oscp-v16-evidence-audit.py --session oscp-v16-session.json --evidence-dir ~/oscp/evidence
python3 oscp-v16-exploit-workbench.py init --source ./exploit.py --url 'SOURCE_URL' --target 10.10.10.10 --outdir ~/oscp/exploits/candidate
python3 oscp-v16-exploit-workbench.py finalize --outdir ~/oscp/exploits/candidate
python3 oscp-v16-report-finalizer.py --osid OS-XXXXX --pdf ./report.pdf --outdir ./final
python3 validate_oscp_v16_console.py
```

## Current tool snapshot retained / extended

- NetExec / nxc 1.5.1
- BloodHound CE 9.6.0
- BloodHound CE Python collector 1.9.1
- Certipy AD 5.1.0
- Ligolo-ng 0.9.1
- Impacket 0.13.0
- Evil-WinRM 3.9
- FreeRDP 3.30.0
- Chisel common binary snapshot 1.12.0-rc3

A version difference is not an instruction to downgrade. **Your installed `-h/--version` output wins.**

## Primary research used for the V16 additions

- OffSec OSCP+ Exam Guide: https://help.offsec.com/hc/en-us/articles/360040165632-OSCP-Exam-Guide
- OffSec OSCP+ Exam FAQ: https://help.offsec.com/hc/en-us/articles/4412170923924-OSCP-Exam-FAQ
- Impacket 0.13 release/change log: https://github.com/fortra/impacket/releases
- Certipy releases: https://github.com/ly4k/Certipy/releases
- sudo CVE-2025-32463: https://www.openwall.com/lists/oss-security/2025/06/30/3
- sudo CVE-2025-32462: https://www.openwall.com/lists/oss-security/2025/06/30/2
- needrestart LPE family: https://blog.qualys.com/vulnerabilities-threat-research/2024/11/19/qualys-tru-uncovers-five-local-privilege-escalation-vulnerabilities-in-needrestart
- Looney Tunables CVE-2023-4911: https://blog.qualys.com/vulnerabilities-threat-research/2023/10/03/cve-2023-4911-looney-tunables-local-privilege-escalation-in-the-glibcs-ld-so
- CVE-2025-6018/6019 chain: https://blog.qualys.com/vulnerabilities-threat-research/2025/06/17/qualys-tru-uncovers-chained-lpe-suse-15-pam-to-full-root-via-libblockdev-udisks
- regreSSHion CVE-2024-6387: https://www.qualys.com/regresshion-cve-2024-6387
- Certighost CVE-2026-54121: https://techcommunity.microsoft.com/blog/MicrosoftThreatProtectionBlog/detecting-cve-2026-54121-certighost-with-microsoft-defender/4542861
- CVE-2026-26128: https://nvd.nist.gov/vuln/detail/cve-2026-26128

## Compatibility / migration

V16 uses a new `oscp_v16_` browser namespace and migrates the newest available V15 state first. V15 encrypted backups remain import-compatible. The inherited target reliability object is intentionally preserved internally for migration compatibility; this does not affect the V16 UI or exported session version.

## Validation goals

The V16 validator checks:

- offline CSP
- V15 → V16 migration
- high-signal view and all V16 reference anchors
- stale version-first methodology removal
- CVE context/package revision coverage
- modern Impacket/AD CS/CVE content
- destructive command guard
- V15 reliability and V14 submission gate retention
- actual DOM duplicate IDs / balanced details/sections
- JavaScript syntax for every script block

The official OffSec Exam Guide and FAQ always override the offline rule snapshot. Re-check them immediately before the exam.

## V16 Fixed Runtime Patch

This package supersedes the first V16 build. Runtime testing found and fixed issues that static JavaScript syntax validation did not catch.

### Fixed

- Added a localStorage compatibility guard. If browser/file security blocks persistent localStorage, the console falls back to temporary in-memory state and shows a warning instead of aborting initialization.
- Replaced stale calls to the nonexistent `overallCoverage()` helper with the actual `coverageStats()` implementation. This fixes Reliability/Report Reproduction, Missed-Edge/Contradiction, consistency/bankability and related coverage paths.
- Made **Clear local data** work with both native browser Storage and the in-memory fallback.
- Re-ran the V16 functional self-test: **16/16 PASS**.
- Browser smoke-tested navigation plus Workspace, Scan Intake, Credential Matrix, Output Analyzer, Scope/Rule Guard, Coverage, Report Audit, Missed-Edge Detector, Reports, Reliability Center, Causal Chain, High-Signal jumps and Disaster runbooks with **zero runtime errors**.

If the yellow storage warning appears, export an encrypted/session backup before closing the tab because the fallback state is temporary.
