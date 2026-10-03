# OSCP Tooling Review — 2026-10-03

Purpose: keep the exam app focused on a small, reliable tool stack. Community pass reports are anecdotal; current OffSec rules and the exact installed `-h/--help` output remain authoritative.

## What recent pass reports consistently reinforced

Recent 2026 pass reports repeatedly converge on a compact set rather than a huge arsenal:

- Nmap for authoritative discovery and focused service fingerprinting.
- NetExec + Impacket for Windows/AD authentication, enumeration and remote actions after rights are proven.
- BloodHound for relationship/path analysis, with a collector that fits the current foothold.
- Ligolo-ng for routing/pivoting.
- Burp Community, curl, feroxbuster and ffuf for web work.
- LinPEAS / WinPEAS / PrivescCheck as lead generators, followed by manual validation.
- Hashcat/John for local cracking.
- A stable shell handler, but shell-handler features must not silently cross exam restrictions.

A May 2026 passer listed many tools but explicitly said they could have passed with roughly half of them. A September 2026 100/100 passer emphasized optimized Nmap, service-oriented notes, careful output reading and combined privilege-escalation checks rather than exotic tooling. An October 2026 first-attempt passer again emphasized methodology and re-enumeration over adding more tools.

## V34.45 decisions

### Added to the arsenal

**Penelope** — recommended conditional shell handler.

Default command in the app:

```bash
penelope -O -p $LPORT
```

The upstream project exposes `-O / --oscp-safe`. The app deliberately does not enable MCP, automatic-privesc/Traitor-style features, or Meterpreter behavior by default.

**RustHound-CE** — conditional BloodHound CE collector fallback.

Use when `bloodhound-ce-python`/SharpHound is a tooling mismatch for the current foothold. Important graph edges still require manual validation. Current upstream documentation supports Linux/Windows collection, username/password and Kerberos auth, LDAP/LDAPS, DC-only/all collection, ZIP output and CE-compatible objects.

**smbclient-ng** — conditional SMB browsing fallback.

Use when classic `smbclient` is slowing interactive share review. Packaging can expose `smbclientng` or `smbclient-ng`, so installed help is authoritative. Classic `smbclient` remains the baseline.

**RustScan** — conditional discovery accelerator only.

Nmap remains the authoritative source. RustScan does not replace full TCP discovery plus focused `-sC -sV` enumeration.

### Deliberately not promoted

**Nuclei** — not a recommended exam default. Current OffSec rules prohibit mass vulnerability scanners and automatic exploitation. Even though individual passers report using Nuclei, the safer default is manual, service-specific enumeration unless the candidate has independently verified that a specific invocation remains within current rules.

**AutoRecon** — remains conditional/background coverage. It must not replace reading the raw scan and manually enumerating every exposed service.

**More Potato variants / exploit suggesters / AD helpers** — not promoted merely because they appear in one pass report. Add a specialist only when it closes a repeatable gap in the methodology.

## Primary → fallback → specialist model

| Phase | Primary | Fallback | Specialist |
|---|---|---|---|
| Discovery | Nmap | tcpdump/tshark | RustScan accelerator |
| Web | curl + Burp Community + feroxbuster | ffuf | stack-specific tool |
| SMB | NetExec + smbclient | smbclient-ng | rpcclient / Impacket |
| AD graph | BloodHound CE + bloodhound-ce-python | RustHound-CE | SharpHound |
| AD actions | NetExec + Impacket | LDAP / PowerView | BloodyAD / Certipy after proven prerequisites |
| Linux privesc | manual + LinPEAS | pspy | strace/ltrace |
| Windows privesc | manual + PrivescCheck | WinPEAS | Seatbelt / exact context-specific technique |
| Shell handling | Penelope `-O` or rlwrap/nc | socat | Evil-WinRM/native remoting |
| Pivoting | Ligolo-ng | SSH forwarding | Chisel/proxychains |
| Cracking | Hashcat | John | local custom rules/wordlists |
| Exploit research | SearchSploit + source review | browser/vendor/GitHub | restricted Metasploit use only under current rules |

## Tool-switch gate

Before changing tools:

1. Read the exact error/status and the relevant output again.
2. Identify the failing layer: route, DNS, authentication, authorization, protocol, prerequisite, syntax, or actual negative result.
3. Manually validate that layer.
4. Try one fallback implementation for the same hypothesis.
5. If evidence still does not improve, record the return condition and rotate.

The goal is not to own the largest toolkit. The goal is to answer the current exam question with the smallest reliable tool.

## V34.46 readiness model

The Best Tools view now includes a **pre-exam Kali toolchain readiness** gate. It evaluates jobs, not brands: each critical job can be satisfied by one of several equivalent commands. That keeps the app from treating a single missing package as a failure when a practiced fallback is already available.

The readiness gate covers:

- authoritative port discovery;
- manual HTTP requests;
- web content discovery;
- Burp Community;
- SMB/AD auth and share browsing;
- manual LDAP;
- Kerberos helpers;
- remote Windows shell;
- local cracking;
- SearchSploit;
- a stable listener;
- optional AD graph/AD CS/pivot fallbacks.

The app can copy a local-only Python inventory script. It uses `shutil.which()` to check command presence, writes `oscp-tool-preflight.json`, installs nothing, updates nothing and makes no network requests. Importing that JSON lets the Tooling view surface missing must-have capabilities before exam day and reuses the existing Compatibility view for version-specific drift.

This is intentionally a **presence/readiness check, not an updater**. The exam VM should be stabilized before the exam rather than modified automatically by the app.

## Sources checked

- OffSec OSCP+ Exam Guide and FAQ — current restrictions and examples of allowed tooling.
- NetExec v1.5.1 release notes — security fix for `spider_plus`; core app workflows do not require that module.
- Penelope upstream README — `-O / --oscp-safe` and current shell-handler behavior.
- RustHound-CE documentation/changelog — current CE collection syntax/capabilities.
- PrivescCheck 2026 changelog — active maintenance through mid-2026.
- Recent 2026 `/r/oscp` pass reports, used only for recurring workflow signals, never as rule authority.
