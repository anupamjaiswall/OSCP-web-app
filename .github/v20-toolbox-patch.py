from pathlib import Path

ROOT = Path('.')
index_p = ROOT / 'index.html'
current_p = ROOT / 'OSCP-Checklist-2026-Exam-Optimized.md'
v19_quick_p = ROOT / 'OSCP-V19-EXPERT-QUICKCARD.md'
v19_readme_p = ROOT / 'OSCP-V19-README.md'

index = index_p.read_text(encoding='utf-8')
current = current_p.read_text(encoding='utf-8')
v19_quick = v19_quick_p.read_text(encoding='utf-8')
v19_readme = v19_readme_p.read_text(encoding='utf-8')

MARKER = 'V20 AD / Windows Fallback Toolbox'
if MARKER in index or MARKER in current:
    raise SystemExit('V20 toolbox is already installed')

# ---------------------------------------------------------------------------
# V20 compact exam-time toolbox content. Core tools already covered elsewhere
# remain the primary path; this block fills named fallback gaps without bloating
# the default workflow.
# ---------------------------------------------------------------------------
toolbox_md = r'''
## V20 AD / Windows Fallback Toolbox — Searchable, Compact, Rule-Aware

`[V20:AD-FALLBACKS]` `[TOOL:RUNASCS]` `[TOOL:SHARPVIEW]` `[TOOL:WINDAPSEARCH]` `[TOOL:CERTIFY]` `[TOOL:SSHUTTLE]` `[TOOL:EMPIRE]` `[TOOL:INVEIGH]`

V20 **inherits every V19 core AD path** (NetExec, Impacket, BloodHound/SharpHound,
PowerView, Rubeus, Mimikatz, evil-winrm, Kerbrute, Certipy, Ligolo-ng/Chisel,
Windows privilege escalation and native commands). This section exists only to
close useful fallback gaps. Do **not** turn a tool list into a checklist you run
blindly: start with the simplest native/manual proof, then use one alternate tool
when it answers a specific question.

### High-value fallbacks

| Need | Preferred fallback | Exam-time use |
|---|---|---|
| Run known credentials as another Windows user | **RunasCs** | Confirm the alternate token first with `whoami /all`; choose local/domain scope deliberately. |
| PowerView blocked/unavailable | **SharpView** | C# PowerView-style queries for DCs, users, groups, ACLs and admin/session relationships. |
| Quick LDAP enumeration from Kali | **windapsearch** | Users/groups/computers/SPNs when raw `ldapsearch` is getting slow or error-prone. |
| Windows-side AD CS enumeration | **Certify** | Fallback/complement to Certipy when you already have a Windows session. |
| SSH pivot available | **sshuttle** | Route one justified internal subnet through an SSH foothold; do not replace a working Ligolo route just for variety. |

#### RunasCs — explicit-credential process launch

```powershell
# Local account: prove the resulting context first.
.\RunasCs.exe user1 'Password1!' "cmd /c whoami /all"

# Domain account. Start with a harmless identity check.
.\RunasCs.exe user1 'Password1!' "cmd /c whoami /all" -d domain.local

# If behavior differs by host/token, trust the binary's local help.
.\RunasCs.exe --help
```

Use it when you **already possess a password** and need to test what that identity
can actually do on the current host. A successful process start is not proof of
local administrator/SYSTEM. Avoid UAC-bypass options unless the exact privilege,
objective and rollback/evidence need justify them.

#### SharpView — PowerView fallback from Windows

```powershell
# Confirm syntax supported by the exact build first.
.\SharpView.exe Get-DomainController -Help

# Basic domain-controller query.
.\SharpView.exe Get-DomainController -Domain domain.local -Server dc.domain.local

# Then use only the exact method your evidence calls for, e.g. user/group/ACL/session queries.
```

Treat SharpView as an **alternate implementation**, not a second full enumeration
pass after PowerView/BloodHound already answered the question.

#### windapsearch — focused LDAP queries from Kali

```bash
# USER must include the domain (user@domain.local or DOMAIN\\user).
python3 windapsearch.py --dc-ip "$DC_IP" -u "$USER@$DOMAIN" -p "$PASS" -U   # users
python3 windapsearch.py --dc-ip "$DC_IP" -u "$USER@$DOMAIN" -p "$PASS" -G   # groups
python3 windapsearch.py --dc-ip "$DC_IP" -u "$USER@$DOMAIN" -p "$PASS" -C   # computers
python3 windapsearch.py --dc-ip "$DC_IP" -u "$USER@$DOMAIN" -p "$PASS" --user-spns
```

If authentication fails, fix bind identity, DNS/domain and credentials before
switching LDAP tools again. Raw `ldapsearch` remains the best manual truth check.

#### Certify — Windows-side AD CS fallback

```powershell
# Modern Certify command family: enumerate enabled/vulnerable templates for the current user.
.\Certify.exe enum-templates --filter-enabled --filter-vulnerable --current-user

# Enumerate CAs when the template result needs CA context.
.\Certify.exe enum-cas --current-user --filter-vulnerable
```

Use **Certipy from Kali as the default** because the main reference is already
built around it. Certify is valuable when Windows-local context is easier or a
second implementation is needed to validate the same AD CS prerequisite.

#### sshuttle — SSH-based routed pivot fallback

```bash
# One known internal subnet through an SSH foothold.
sudo sshuttle -r "$SSH_USER@$PIVOT" 10.10.20.0/24

# Add --dns only when internal DNS resolution is actually required and verified.
```

Use sshuttle only when the pivot supports SSH/Python and the route is simpler
than building another tunnel. Validate from the pivot first, then from Kali.

### Native Windows commands — always available before dropping another tool

```cmd
whoami /all
hostname
ipconfig /all
net user /domain
net group "Domain Admins" /domain
nltest /domain_trusts
klist
REM If RSAT/DSQUERY exists:
dsquery user -limit 0
dsquery computer -limit 0
```

Native output is often enough to prove identity, groups, trusts, cached tickets
or domain reachability. Prefer it when EDR/AMSI/tool transfer is becoming the
problem instead of the target.

### Rule-sensitive / secondary tools — searchable but not default

- **PowerShell Empire / Covenant** — OffSec's current FAQ lists them as allowed
  examples, but **features that perform a restricted action remain prohibited**.
  Do not use C2 automation as a substitute for understanding/recording the exact
  exploitation path; no Metasploit pivoting rule changes because another C2 exists.
- **PowerSploit** — the useful exam pieces are already represented by **PowerView
  and PowerUp**. Load the individual module you need rather than a whole legacy
  suite when a smaller script answers the question.
- **Inveigh / Responder** — **NO LLMNR/NBNS/mDNS poisoning or spoofing on the
  OSCP exam.** OffSec explicitly prohibits spoofing and specifically says
  Responder poisoning/spoofing is not allowed. Keep these names searchable so
  you remember the rule; do not start an active poisoning workflow.
- **ADPEEAS / PingCastle** — secondary audit helpers, not a default OSCP path.
  Use only if already available and a specific unresolved AD question justifies
  them. Their findings are leads; manually prove the exact permission/path.

### V20 fallback decision rule

```text
native/manual proof works?       → keep it; do not add tools
PowerView fails?                 → SharpView OR LDAP, not both blindly
raw LDAP is cumbersome?          → windapsearch for one focused query
Certipy context awkward?         → Certify from the owned Windows host
known password needs local test? → RunasCs → whoami /all → prove capability
SSH foothold + internal subnet?  → sshuttle if simpler than existing tunnel
Responder/Inveigh temptation?    → STOP: poisoning/spoofing is prohibited
Empire/Covenant available?       → allowed tool != every feature allowed
```

'''

anchor = '## V19 TARGET HANDOFF + ACCESS TRUTH LAYER'
if anchor not in current:
    raise SystemExit('current checklist insertion anchor missing')

current_v20 = current
current_v20 = current_v20.replace('> **Release: V19 · 06 Sep 2026**', '> **Release: V20 · 08 Sep 2026**', 1)
current_v20 = current_v20.replace('## V19 TODAY-LOCK — READ BEFORE TOUCHING A TARGET', '## V20 TODAY-LOCK — READ BEFORE TOUCHING A TARGET', 1)
current_v20 = current_v20.replace('Verified **06 Sep 2026** against the current OffSec OSCP+ Exam Guide, FAQ,', 'Verified **08 Sep 2026** against the current OffSec OSCP+ Exam Guide, FAQ,', 1)
current_v20 = current_v20.replace('### V19 stable tool lock (checked 06 Sep 2026)', '### V20 stable tool lock (re-checked 08 Sep 2026)', 1)
current_v20 = current_v20.replace(anchor, toolbox_md + '\n' + anchor, 1)
current_v20 = current_v20.replace('> Every published improvement increments the release number; V18 remains a separate preserved release.', '> Every published improvement increments the release number; V19 remains separately preserved and V20 inherits it.', 1)

# Keep the rolling/current file current, and add a separately preserved V20 copy.
current_p.write_text(current_v20, encoding='utf-8')
(ROOT / 'OSCP-V20-Checklist-2026-Exam-Optimized.md').write_text(current_v20, encoding='utf-8')

# Quick card: inherit V19, version-forward it, and add only the compact fallback block.
quick_v20 = v19_quick.replace('OSCP V19', 'OSCP V20', 1).replace('V19 rule:', 'V20 rule:', 1)
quick_v20 = quick_v20.replace('## V19 RULES LOCK', '## V20 RULES LOCK', 1)
quick_v20 = quick_v20.replace('Official OSCP+ rules re-checked **06 Sep 2026**.', 'Official OSCP+ rules re-checked **08 Sep 2026**.', 1)
quick_v20 = quick_v20.replace('Tool lock checked 06 Sep 2026:', 'Tool lock re-checked 08 Sep 2026:', 1)
quick_anchor = '### Certighost — CVE-2026-54121'
quick_insert = r'''
### V20 WINDOWS / AD FALLBACKS

```text
Known password, need another token  → RunasCs → whoami /all → prove capability
PowerView unavailable               → SharpView → one exact query
LDAP query getting cumbersome       → windapsearch (-U/-G/-C/--user-spns)
Windows-side AD CS context useful   → Certify enum-templates / enum-cas
SSH foothold to internal subnet     → sshuttle -r user@pivot subnet
Empire/Covenant                     → allowed example; restricted features still prohibited
Responder/Inveigh poisoning         → DO NOT USE: spoofing/poisoning prohibited
ADPEEAS/PingCastle                  → secondary leads only; manual proof required
```

```powershell
.\RunasCs.exe user1 'Password1!' "cmd /c whoami /all" -d domain.local
.\SharpView.exe Get-DomainController -Domain domain.local -Server dc.domain.local
.\Certify.exe enum-templates --filter-enabled --filter-vulnerable --current-user
```

```bash
python3 windapsearch.py --dc-ip "$DC_IP" -u "$USER@$DOMAIN" -p "$PASS" -U
python3 windapsearch.py --dc-ip "$DC_IP" -u "$USER@$DOMAIN" -p "$PASS" --user-spns
sudo sshuttle -r "$SSH_USER@$PIVOT" 10.10.20.0/24
```

Native first: `whoami /all`, `net user /domain`, `net group "Domain Admins" /domain`,
`nltest /domain_trusts`, `klist`, and `dsquery` when installed.

'''
if quick_anchor not in quick_v20:
    raise SystemExit('quick-card insertion anchor missing')
quick_v20 = quick_v20.replace(quick_anchor, quick_insert + quick_anchor, 1)
(ROOT / 'OSCP-V20-EXPERT-QUICKCARD.md').write_text(quick_v20, encoding='utf-8')

# V20 README: preserve V19 README, create a new release note with a focused delta.
readme_v20 = v19_readme.replace('# OSCP V19 — Exam-Only Operating System', '# OSCP V20 — Exam-Only Operating System', 1)
readme_v20 = readme_v20.replace('complete V19 reference', 'complete V20 reference', 1)
readme_v20 = readme_v20.replace('## V19 release — resumable targets and truthful Windows access', '## V20 release — complete AD/Windows fallback coverage without default-screen bloat', 1)
readme_v20 = readme_v20.replace('- V19 is a new, separately packaged release; **V18 is preserved**. The next improvement pass will be V20.', '- V20 is a new, separately packaged release; **V19 and V18 are preserved**. The next improvement pass will be V21.', 1)
readme_v20 = readme_v20.replace('Research was refreshed on **06 September 2026**', 'Research was refreshed on **08 September 2026**', 1)
readme_delta = r'''

### V20 delta — missing-tool closure

- Added a compact **AD / Windows fallback toolbox** to the Windows view and full reference without expanding the default top-tool list.
- Added **RunasCs** for explicit-credential local/domain token testing with `whoami /all` validation.
- Added **SharpView** as a C# PowerView fallback, with the rule to use one exact query rather than duplicate full enumeration.
- Added **windapsearch** for focused LDAP users/groups/computers/SPN queries when raw LDAP syntax is slowing the operator down.
- Added modern **Certify** enumeration syntax as a Windows-side AD CS fallback while keeping Certipy as the primary Kali workflow.
- Added **sshuttle** as an SSH-based routed pivot fallback behind Ligolo-ng/Chisel.
- Added searchable, rule-aware entries for **PowerShell Empire, Covenant, PowerSploit, Inveigh, ADPEEAS and PingCastle**.
- Added an explicit hard stop that **Responder/Inveigh poisoning or spoofing is prohibited**; the current OffSec FAQ lists Responder as allowed only without poisoning/spoofing, and the Exam Guide prohibits spoofing generally.
- Added native Windows fallbacks (`whoami /all`, `net user /domain`, `net group`, `nltest`, `klist`, `dsquery`) beside the tool alternatives so transfer/EDR friction does not become a rabbit hole.
- Re-checked OffSec Exam Guide/FAQ on **08 September 2026**; the live official pages remain authoritative.
'''
needle = '## Simple exam mode'
if needle not in readme_v20:
    raise SystemExit('README insertion anchor missing')
readme_v20 = readme_v20.replace(needle, readme_delta + '\n' + needle, 1)
readme_v20 = readme_v20.replace('V19 now has one capture-phase router:', 'V20 retains the same capture-phase router:', 1)
(ROOT / 'OSCP-V20-README.md').write_text(readme_v20, encoding='utf-8')

# ---------------------------------------------------------------------------
# Web app: add a compact Windows-view toolbox + a full-reference card. Keep the
# existing localStorage/data model intact; only user-visible release labels move
# forward so existing exam state does not get stranded by a cosmetic version bump.
# ---------------------------------------------------------------------------
toolbox_html = r'''
<div class="card" id="v20AdFallbackToolbox" style="margin-bottom:14px;border-color:#355a78">
  <div class="row" style="justify-content:space-between;align-items:flex-start">
    <div><h2>V20 AD / Windows Fallback Toolbox</h2><div class="muted">Use only when the core path cannot answer the current question. Native/manual proof first; one alternate implementation second.</div></div>
    <span class="chip">RULE-AWARE · SEARCHABLE</span>
  </div>
  <div class="simpleDecisionGrid" style="margin-top:12px">
    <div class="decisionRow"><h3>RunasCs</h3><div>Known password → run one harmless command as that local/domain identity → <code>whoami /all</code> → prove actual capability.</div><pre>.\\RunasCs.exe user1 'Password1!' "cmd /c whoami /all" -d domain.local</pre></div>
    <div class="decisionRow"><h3>SharpView</h3><div>PowerView unavailable/blocked → use one exact C# PowerView-style query; do not duplicate a full BloodHound/PowerView pass.</div><pre>.\\SharpView.exe Get-DomainController -Domain domain.local -Server dc.domain.local</pre></div>
    <div class="decisionRow"><h3>windapsearch</h3><div>Focused LDAP fallback for users, groups, computers and SPNs.</div><pre>python3 windapsearch.py --dc-ip "$DC_IP" -u "$USER@$DOMAIN" -p "$PASS" -U\npython3 windapsearch.py --dc-ip "$DC_IP" -u "$USER@$DOMAIN" -p "$PASS" --user-spns</pre></div>
    <div class="decisionRow"><h3>Certify</h3><div>Windows-side AD CS fallback; Certipy remains the primary Kali path.</div><pre>.\\Certify.exe enum-templates --filter-enabled --filter-vulnerable --current-user</pre></div>
    <div class="decisionRow"><h3>sshuttle</h3><div>SSH foothold + one known internal subnet → routed fallback when it is simpler than creating another tunnel.</div><pre>sudo sshuttle -r "$SSH_USER@$PIVOT" 10.10.20.0/24</pre></div>
    <div class="decisionRow"><h3>Native first</h3><div><code>whoami /all</code> · <code>net user /domain</code> · <code>net group "Domain Admins" /domain</code> · <code>nltest /domain_trusts</code> · <code>klist</code> · <code>dsquery</code> if installed.</div></div>
  </div>
  <details style="margin-top:12px"><summary><b>Rule-sensitive / secondary names</b></summary>
    <p><b>Empire / Covenant:</b> currently listed by OffSec as allowed examples, but any feature performing a restricted action is still prohibited. Use only for a specific justified function, not blind automation.</p>
    <p><b>PowerSploit:</b> PowerView and PowerUp are already covered; prefer the individual module you need.</p>
    <p><b>Responder / Inveigh:</b> <strong style="color:var(--bad)">DO NOT use LLMNR/NBNS/mDNS poisoning or spoofing in the OSCP exam.</strong> Keep these names searchable as a rule reminder, not an attack recipe.</p>
    <p><b>ADPEEAS / PingCastle:</b> secondary audit helpers only. Their findings are leads; manually prove the exact edge/permission before acting.</p>
  </details>
</div>
'''

win_anchor = '<section id="windowsStrategyView" class="view">'
if win_anchor not in index:
    raise SystemExit('windowsStrategyView anchor missing')
index = index.replace(win_anchor, win_anchor + '\n' + toolbox_html, 1)

ref_anchor = '<section id="referenceView" class="view">'
ref_html = r'''
<div class="card" id="v20ReferenceDelta" style="max-width:1180px;margin:0 auto 14px;border-color:#355a78">
  <h2>V20 delta — AD / Windows fallback coverage</h2>
  <p class="muted">Search terms: RunasCs · SharpView · windapsearch · Certify · sshuttle · Empire · Covenant · PowerSploit · Inveigh · ADPEEAS · PingCastle.</p>
  <p><b>Hard rule:</b> Responder/Inveigh poisoning or spoofing is not an OSCP workflow. Native/manual proof remains first; these are fallbacks for a specific unresolved question.</p>
  <button class="btn" onclick="switchView('windowsStrategyView')">Open Windows fallback toolbox →</button>
</div>
'''
if ref_anchor not in index:
    raise SystemExit('referenceView anchor missing')
index = index.replace(ref_anchor, ref_anchor + '\n' + ref_html, 1)

# Safe, user-visible release bump only. Do not rename persisted storage keys.
visible_replacements = {
    '<title>OSCP V19 Exam-Only Operating System</title>': '<title>OSCP V20 Exam-Only Operating System</title>',
    '🔐 OSCP V19 Exam OS': '🔐 OSCP V20 Exam OS',
    'Embedded V19 exam reference': 'Embedded V20 exam reference',
    '<h2>V19 exam rules lock</h2>': '<h2>V20 exam rules lock</h2>',
    'Verified 06 Sep 2026 against the current OffSec Exam Guide, FAQ and AI policy.': 'Re-checked 08 Sep 2026 against the current OffSec Exam Guide and FAQ.',
}
for old, new in visible_replacements.items():
    if old in index:
        index = index.replace(old, new, 1)

if 'data-release="V19"' in index:
    index = index.replace('data-release="V19"', 'data-release="V20"', 1)

index_p.write_text(index, encoding='utf-8')

# Smoke tests: additions must be unique, core existing features must survive,
# and preserved V19 files are intentionally untouched.
checks = [
    'id="v20AdFallbackToolbox"', 'RunasCs', 'SharpView', 'windapsearch',
    'Certify.exe enum-templates', 'sshuttle -r', 'Responder / Inveigh',
    'preExamAutoUpdateWarning', 'examStuckBtn', 'simplePointProtectionStatus',
    'V20 AD / Windows Fallback Toolbox',
]
for token in checks:
    if token not in index and token not in current_v20:
        raise SystemExit(f'missing required token: {token}')

assert index.count('id="v20AdFallbackToolbox"') == 1
assert index.count('id="v20ReferenceDelta"') == 1
assert index.count('<html') == 1 and index.count('</html>') == 1
assert (ROOT / 'OSCP-V20-Checklist-2026-Exam-Optimized.md').exists()
assert (ROOT / 'OSCP-V20-EXPERT-QUICKCARD.md').exists()
assert (ROOT / 'OSCP-V20-README.md').exists()
assert 'Release: V20' in current_v20
assert '[V20:AD-FALLBACKS]' in current_v20

print('V20 AD/Windows fallback toolbox patch + smoke tests passed')
