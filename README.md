# 🔐 OSCP Exam OS

**V34.46 — exam-time, offline-first OSCP/OSCP+ methodology and decision-support app.**

## V34.46 tooling readiness

Best Tools now includes a capability-based Kali readiness gate. It checks whether the exact exam VM has at least one practiced implementation for each critical job (discovery, web, SMB/AD auth, LDAP, Kerberos, remote shell, cracking, exploit lookup and shell handling) instead of assuming one specific package is mandatory. The page can copy a local-only inventory script that creates `oscp-tool-preflight.json`; it installs nothing and makes no network requests. Importing that JSON surfaces missing must-have capabilities and feeds the existing compatibility view.

## V34.36 search navigation hotfix

Global search now routes body-text matches to the exact collapsed reference section instead of letting a broad parent heading absorb text from child `<details>` blocks. Opening a search result expands every ancestor `<details>` before scrolling/highlighting. Browser CI searches `subdomain`, opens `2.2 /etc/hosts Management`, and requires that section to be expanded.
