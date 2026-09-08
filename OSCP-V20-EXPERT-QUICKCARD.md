# OSCP V20 — HIGH-SIGNAL QUICK CARD

> V20 rule: **evidence before CVE, prerequisites before PoC, banked proof before curiosity.**

> **EXAM ONLY:** no training modes, simulations, or prohibited-tool workflows are included.

> Official OSCP+ rules re-checked **08 Sep 2026**. The live OffSec Exam Guide/FAQ always override this offline snapshot. AI/LLM use is prohibited during both the exam and reporting phase.

## V20 RULES LOCK

```text
[ ] exact control-panel objectives read       [ ] AI/LLM/chatbots closed
[ ] Metasploit target unused/recorded         [ ] no Metasploit pivoting
[ ] proof = interactive + original path + IP  [ ] every flag submitted before exam ends
[ ] necessary-download rule understood        [ ] PDF-only .7z/order/MD5/Submit File understood
```

`23h45m` attack window · `+24h` report upload · `70/100` pass · no bonus.

## 0. ONE METHODOLOGY

```text
prepare + scope
→ full TCP map + focused service scans
→ enumerate every service manually
→ write one evidence-backed hypothesis
→ validate access/build/config/prerequisites
→ record original state + rollback before any target change
→ use the smallest reliable exploit / mutation
→ stabilize + enumerate locally
→ privesc / lateral movement
→ test each new credential on appropriate exposed in-scope services with lockout awareness
→ capture proof + commands + changes immediately
→ re-enumerate with the new identity/access
→ close reporting gaps + move on
```

**Park the path after 20–30 minutes or two failed tests with no new evidence.** Write the missing prerequisite and the exact condition that would justify returning.

### I HAVE → NEXT ACTION

```text
IP only        → full TCP + focused scan; save output; targeted UDP if justified
Port/service   → native client → anonymous/default/known creds → alternate client
Web            → hostname/vhost/source/JS/robots/sitemap → content/backups/.git → inputs
Version        → exact build/package/config/access/trigger/backport → then PoC
Credential     → classify type/scope → one-host auth proof → expand only from evidence
Linux shell    → sudo/SUID/caps → cron/systemd/services → secrets → containers → kernel last
Windows shell  → privileges → services/tasks → registry/DLL/path → creds/local ports → kernel last
Domain cred    → DNS/time → SMB/LDAP → shares/SPNs → BloodHound/AD CS → exact edge → repeat
New network    → prove reachability → one tunnel/route → enumerate → repeat
Root/SYSTEM    → proof from original location + IP → submit → notes/evidence → protect pass
Tool failure   → exact error → route/DNS/time/auth/version → one fallback → manual proof
```

### CREDENTIAL TYPE → FIRST PROOF

```bash
# Domain password
nxc smb "$IP" -u "$USER" -p "$PASS" -d "$DOMAIN"

# Local/SAM password (one host)
nxc smb "$IP" -u "$LOCAL_USER" -p "$PASS" --local-auth

# NT hash — choose domain OR --local-auth
nxc smb "$IP" -u "$USER" -H "$NTHASH" -d "$DOMAIN"

# Existing Kerberos cache — use FQDN, not an IP-shaped SPN
export KRB5CCNAME='/absolute/path/user.ccache'; klist
nxc smb "$HOST_FQDN" --use-kcache

# PFX certificate
nxc smb "$HOST_FQDN" -u "$USER" --pfx-cert "$PFX" --pfx-pass "$PFX_PASS"

# AES principal key
impacket-getTGT "$DOMAIN/$USER" -aesKey "$AES_KEY" -dc-ip "$DC_IP"

# LAPS: exact mapped host/local admin only
nxc smb "$IP" -u "$LOCAL_ADMIN" -p "$LAPS_PASS" --local-auth

# gMSA hash: one host/service justified by SPN/graph
nxc smb "$HOST_FQDN" -u "$GMSA_USER" -H "$NTHASH" -d "$DOMAIN"
```

`[+]` proves authentication for that protocol, not admin. Protect and unset
secret variables after use. In Impacket 0.13.1, use `GetUserSPNs -no-rc4` only
when ordinary Kerberoasting fails because RC4 is disabled; `dpapidump` is a
privileged late-stage collection option, never a first-pass enumerator.

Tool lock re-checked 08 Sep 2026: Impacket `0.13.1`, NetExec `1.5.1`,
BloodHound CE stable `9.6.0` (do not switch to the 9.7 RC), Certipy `5.1.0`,
Ligolo-ng `0.9.1`. Installed `-h` always wins. Do not use NetExec
`spider_plus` below 1.5.1; the core workflow does not require it.

### TARGET HANDOFF — COMPLETE BEFORE PARKING

```text
CURRENT ACCESS / IDENTITY:
STRONGEST EVIDENCE:
EXACT HYPOTHESIS:
MISSING PREREQUISITE:
NEXT DECISIVE COMMAND:
RE-ENTRY / RECOVERY:
```

Use labels or variable names—never raw secrets. **Park + pause timer** only when
all six lines are usable. After a revert, treat the packet, sessions, routes and
protocol outcomes as stale until revalidated.

### WINDOWS ACCESS TRUTH

```text
transport works
→ authentication accepted
→ resource / data access
→ command execution
→ interactive shell / session
→ privileged / admin control
→ original-path proof + submission + report evidence
```

Record only the highest level actually observed for SMB, LDAP, WinRM, RDP,
MSSQL and WMI. NetExec `[+]` is authentication, not admin. `Pwn3d!` is
protocol-specific; verify the token/action. Command execution is not
automatically an interactive proof shell.

### STUCK NOW — THREE-MINUTE RESET

```text
STOP changes → save output/context → write one hypothesis + missing prerequisite
→ run one decisive check → continue if confidence rises
→ one manual/fallback implementation if the tool failed
→ otherwise record the return condition, protect evidence, and rotate
```

## 1. FIRST 10 MINUTES

```text
anonymous/default access
→ hostname / vhost / service role
→ source / config / backup / .git
→ secrets / credentials → fan out
→ prove primitive
→ exact build/package
→ LOCAL/REMOTE + auth/priv
→ config/module/trigger/backport
→ safe validation
→ exploit
```

## 2. CVE CARD

```text
ACCESS: LOCAL / REMOTE / ADJACENT?
AUTH / PRIV REQUIRED?
EXACT PRODUCT / BUILD / PACKAGE REVISION?
CONFIG / MODULE / SERVICE?
TRIGGER / NETWORK PATH?
VENDOR PATCH / DISTRO BACKPORT?
PoC MATCHES THIS TARGET?
RELIABILITY / CRASH RISK?
SAFE VALIDATION?
KILL CONDITION?
```

Version only = **LOW priority**.

## 2A. MUTATION / ROLLBACK GATE

```text
EXACT PRINCIPAL + PERMISSION + PRIVILEGED TRIGGER PROVEN?
ORIGINAL PATH / OWNER / MODE / ACL / HASH / CONFIG RECORDED?
EARNED FLAG ALREADY BANKED? CURRENT SHELL + RE-ENTRY PATH SAFE?
SMALLEST REVERSIBLE CHANGE SELECTED?
ROLLBACK COMMAND WRITTEN BEFORE EXECUTION?
RESULTING IDENTITY + CHANGE + RESTORE / REVALIDATION RECORDED?
```

Applies to files, services, tasks, registry, ACLs, GPOs, AD objects, certificate templates, packages, routes and firewall rules.

## 3. LINUX PACKAGE REVISION

```bash
dpkg-query -W -f='${Package} ${Version}\n' sudo libc6 needrestart 2>/dev/null
apt-cache policy sudo libc6 needrestart 2>/dev/null
rpm -q --qf '%{NAME}-%{VERSION}-%{RELEASE}.%{ARCH}\n' sudo glibc PackageKit udisks2 libblockdev 2>/dev/null
uname -r
```

## 4. HIGH-YIELD LINUX LPE RECOGNITION

```text
CVE-2025-32463 sudo chroot       LOCAL LOW → root
CVE-2025-32462 sudo --host       LOCAL + host-specific sudoers condition
needrestart 2024 family          LOCAL LOW → root; package < 3.8 upstream
CVE-2023-4911 Looney Tunables    LOCAL glibc path
CVE-2025-6018 → 6019             PAM allow_active → udisks/libblockdev root
CVE-2024-6387 regreSSHion        REMOTE race/complex → LAST RESORT
```

Package backports override upstream-looking banners.

## 5. EXPOSED .GIT

```bash
curl -s http://$IP/.git/HEAD
git-dumper http://$IP/.git/ loot/git-repo
cd loot/git-repo
git log --all --oneline --decorate --graph
git log --all --diff-filter=D --summary
git log --all -p | less
grep -RniE 'pass|secret|token|api[_-]?key|jdbc:|mongodb|mysql|postgres|PRIVATE' . --exclude-dir=.git
```

Source → credential / file primitive / auth bypass / RCE. Do not just collect source.

## 6. IMPACKET 0.13 AD HELPERS

```bash
impacket-dacledit -h
impacket-owneredit -h
impacket-GetLAPSPassword -h
impacket-GetADComputers -h
impacket-badsuccessor -h   # CONDITIONAL / dMSA environments
```

Flow:

```text
BloodHound edge
→ exact object / ACE / attribute
→ READ
→ BACKUP
→ minimum change
→ validate resulting access
→ preserve rollback
```

## 7. AD CS

```bash
certipy -v
certipy find -u 'user@domain.local' -p 'Password' -dc-ip $DC_IP -enabled -vulnerable -stdout
```

Fast matrix: **ESC1 / ESC4 / ESC8 / ESC13 / ESC15 / ESC16 / ESC17**. An ESC label is not enough; prove exact enrollment rights, template/CA settings and downstream identity path.


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

### Certighost — CVE-2026-54121

```text
Enterprise CA?
→ affected/unpatched?
→ Machine enrollment / chase path?
→ valid domain user?
→ controlled/new machine principal?
→ CA can reach controlled host 445 + 389?
→ only then candidate
```

**RULE-SENSITIVE:** re-check current OffSec rules before any PoC involving rogue/relay-style services.

## 8. PUBLIC POC

```bash
python3 oscp-v19-exploit-workbench.py init --source ./exploit.py --url 'SOURCE_URL' --target $IP --outdir ~/oscp/exploits/candidate
# edit working/exploit.py only
python3 oscp-v19-exploit-workbench.py finalize --outdir ~/oscp/exploits/candidate
```

Keep original + hash + source URL + diff + explanation.

## 9. TRUST TIERS

```text
🟢 CORE           first-line methodology
🔵 CONDITIONAL    exact prerequisites required
🟡 RULE-SENSITIVE verify current exam action rules
🟠 LEGACY         old target recognition
🔴 LAST RESORT    race/kernel/driver/reboot risk
✕ EXCLUDED        non-exam action; not present in this console
```

## 10. ROOT / SYSTEM

```text
STOP
→ proof/local from ORIGINAL LOCATION
→ INTERACTIVE shell
→ cat/type the original file
→ ip addr / ifconfig / ipconfig in the same terminal view
→ target IP + full flag contents visible in ONE readable screenshot
→ submit exact value in control panel before attack end
→ save `<host-or-IP>-<local-or-proof>-original-path.png` + exact commands + exploit URL/changes
→ mark evidence gate + audit the actual file
→ write the next action; take a 5–10 minute break if fatigue is rising
→ protect the pass
```

PowerShell Core / PSSession counts as an interactive shell. `hostname` and `id` / `whoami` are useful extra context; the official required screenshot pair is target IP + flag contents. Do not use a web shell, download, or copied flag file as proof.

```bash
# Linux — use the exact original path
hostname; id; ip addr; pwd; cat /root/proof.txt

# Windows cmd — use the exact original path
hostname & whoami & ipconfig & cd & type C:\Users\Administrator\Desktop\proof.txt
```

## 11. WHEN STUCK

```text
Did evidence change?
YES → continue
NO  → strongest hypothesis has one cheap missing prerequisite?
      YES → test it
      NO  → rotate
```

Tool failure ≠ hypothesis failure. Version match ≠ vulnerability.

## 12. TOOL CHOICE — FAST MAP

```text
Port surface       Nmap → focused NSE/manual client
Web content        Feroxbuster → FFUF/Gobuster → curl/manual
SMB                NetExec → smbclient → rpcclient/enum4linux-ng
LDAP / AD graph    ldapsearch/NetExec → BloodHound CE → manual edge validation
Kerberos           Impacket → Rubeus → DNS/time/KDC checks
AD CS              Certipy → prove template/CA/enrollment prerequisites
Windows shell      Evil-WinRM / FreeRDP / Impacket (match actual rights)
Windows privesc    PrivEscCheck → winPEAS/Seatbelt → manual validation
Linux privesc      LinPEAS/lse → pspy → manual sudo/SUID/cap/service checks
Pivot              Ligolo-ng → Chisel → SSH forwarding → Socat
File transfer      Python HTTP → curl/wget/IWR → SMB/SCP
Hashes             hashid → Hashcat/John → verify recovered credential
```

Rule-sensitive: online guessing can lock accounts; Responder poisoning/spoofing is prohibited; Nuclei/SQLmap-style automated scanning/exploitation is not an exam workflow; Metasploit is locked to one selected target and cannot pivot.

### Current Ligolo-ng console flow

Verified against the 0.9.1 snapshot on 06 Sep 2026. The explicit managed-route
flow is retained because it is easy to inspect and recover; 0.8+ `autoroute` is
an optional shortcut when confirmed by installed console help.

```text
proxy -selfcert
→ interface_create --name ligolo
→ certificate_fingerprint
→ agent -connect LHOST:11601 -accept-fingerprint FINGERPRINT
→ session → ifconfig → tunnel_start --tun ligolo
→ interface_add_route --name ligolo --route IN_SCOPE_CIDR
```

Prefer fingerprint validation. `-ignore-cert` is an emergency debugging fallback. Installed `-h` / console help wins if syntax differs.

## ISSUED DOMAIN CREDENTIAL — FIRST 10 MINUTES

```text
1. DOMAIN + DC FQDN + DC IP
2. DNS SRV + time query + exact AD ports
3. Prove auth once: SMB + LDAP + native smbclient
4. Shares + users + groups
5. SPNs + confirmed-user AS-REP checks
6. BloodHound CE + Certipy find
7. Inspect current-principal OUTGOING control
8. Execute one fully proven edge; re-collect after identity/change
```

Identity form:

```text
domain account → -d DOMAIN | DOMAIN/user | user@domain.local
local account  → omit -d; NetExec --local-auth
```

Failure map:

```text
KRB_AP_ERR_SKEW              → time, not password
KDC_ERR_S_PRINCIPAL_UNKNOWN  → FQDN / DNS / SPN
KRB_AP_ERR_MODIFIED          → wrong host/SPN, stale ticket, duplicate identity
STATUS_LOGON_FAILURE         → auth rejected; verify format/provenance once
STATUS_ACCESS_DENIED         → auth may work; requested action is unauthorized
STATUS_BAD_NETWORK_NAME      → list shares; use exact returned name
[+] without Pwn3d!           → authenticated, admin execution not proven
Pwn3d!                       → protocol-specific admin/code execution indicated
unknown option/import/usage  → local tool/version/dependency, not target proof
```

Before an AD write: **source principal → target object → exact right → required
host/protocol/token → read/backup → minimum change → validate → rollback →
re-collect**. Every new shell/protocol is a new token/context; baseline it again.

### V19 BLOODHOUND EDGE MICRO-DESK

```text
GenericAll/Write → user  Shadow auto if 2016+ + PKINIT; else WriteSPN; password reset last
AddMember → group        read members → add one principal → fresh token → remove exact member
ForceChangePassword      service impact? no safer path? NO safe rollback without old password
WriteDacl                read + backup → one minimum ACE → verify → restore exact backup
WriteOwner               record old owner → take → minimum DACL → restore DACL → restore owner
AddKeyCredentialLink     list keys → shadow auto → compare; remove exact device ID only
AllowedToAct / RBCD      SPN + 2012+ + delegable user → one delegate/ticket → remove, never flush
AdminTo                  prove route/port/service → one matching client → whoami /all
CanPSRemote / CanRDP     proves logon path, NOT admin; new protocol = new token
ReadLAPS                 exact computer → local auth only; no cross-host assumption
ReadGMSA                 exact account/SPN → retrieve hash → one justified service
DCSync                    GetChanges + GetChangesAll → one required user first
```

```bash
# Reversible group control
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" get object "$EDGE_TARGET" --attr member
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" add groupMember "$EDGE_TARGET" "$CONTROLLED_PRINCIPAL"
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" remove groupMember "$EDGE_TARGET" "$CONTROLLED_PRINCIPAL"

# DACL / owner pre-state
impacket-dacledit -action backup -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"
impacket-owneredit -action read -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER:$AUTH_PASS"

# Shadow Credentials: auto should remove its own key; prove with list before/after
certipy shadow list -u "$AUTH_USER@$DOMAIN" -p "$AUTH_PASS" -account "$EDGE_TARGET" -dc-ip "$DC_IP"
certipy shadow auto -u "$AUTH_USER@$DOMAIN" -p "$AUTH_PASS" -account "$EDGE_TARGET" -dc-ip "$DC_IP"

# One-account DCSync after the exact composed edge is proven
impacket-secretsdump -just-dc-user "$DCSYNC_USER" -dc-ip "$DC_IP" -outputfile "dcsync-$DCSYNC_USER" "$DOMAIN/$AUTH_USER:$AUTH_PASS@$DC"
```

Use the Windows destination's 14-plan selector or Markdown section **9.6B** for
full prerequisites, verification and exact rollback commands.

## 13. FINAL ATTACK-WINDOW GATE

```text
[ ] every counted flag submitted in the control panel
[ ] every counted flag has original-path interactive-shell proof
[ ] target IP + full flag contents are visible together
[ ] exact commands, source URLs and exploit changes are preserved
[ ] every counted compromise is reproducible from the notes
[ ] technical issues/reverts and re-establish state are recorded
```

The current guide provides a 24-revert bank and permits one reset. A revert destroys target-side changes; revalidate shells, tunnels, uploads and modifications. Report VPN/target infrastructure issues to the proctor immediately.

## 14. FINAL REPORT-UPLOAD GATE

```text
[ ] AI/LLM remains off during reporting
[ ] final PDF visually reviewed
[ ] target sections, IPs and report order verified against the control panel
[ ] OSCP-OS-XXXXX-Exam-Report.pdf        (exact, case-sensitive)
[ ] OSCP-OS-XXXXX-Exam-Report.7z         (exact, case-sensitive)
[ ] .7z created on Kali; contains only the PDF; no password; <= 200 MB
[ ] upload within 24 hours at upload.offsec.com
[ ] displayed upload MD5 equals local md5sum
[ ] final Submit File button clicked
[ ] acknowledgement preserved
```

Do not download exam-environment applications/files/source to Kali unless necessary to compromise the target; delete such local copies after completing the objective, as required by the current guide.

## V19 NAVIGATION / WINDOWS STRATEGY
- Simple mode is the default: **Start, Methodology, Best Tools, Windows, Target, Evidence & Report, Full Reference**.
- **Show advanced** reveals every retained V19 audit, workbench, playbook and reliability view.
- Best Tools starts with **29 recommended tools**; use the scope selector to reveal all 90 exam-reference tools.
- Browser Back / Forward now follows app views and reference jumps.
- In-app **Back** / **Forward** buttons are in the top bar.
- `Alt+Left` / `Alt+Right`: Back / Forward.
- `Alt+1`: Start · `Alt+M`: Methodology · `Alt+2`: Workspace · `Alt+3`: Credentials · `Alt+4`: Reports · `Alt+5`: Full Reference · `Alt+6`: Best Tools.
- `Alt+W`: Windows Strategy · `Alt+P`: High-Signal Engine · `Alt+K`: Exam Clock.
- `Alt+C`: Coverage · `Alt+H`: Hypothesis. Conflicting inherited shortcuts are suppressed.
- Windows post-shell loop: **Baseline → quick filesystem/software triage → save + READ automated output → credential hunt → privileges → services/tasks → local listeners/custom software → re-enumerate after identity/context change → kernel/CVE LAST.**
- Start contains the real shared 20–30 minute evidence timer; Windows contains the issued-credential fast path, offline failure decoder and copy buttons for every command block.
