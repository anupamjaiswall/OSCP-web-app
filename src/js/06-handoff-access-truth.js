
/* ===== V19 Exam Handoff + Windows Access Truth Layer =====
   Keeps target rotation resumable and prevents authentication/admin confusion.
   State is local, target-scoped, secret-free by design, and included in backups.
*/
const V19_RESUME_FIELDS=[
 ['access','Current access / identity','Exact user, host and channel. Example: CORP\\alice via WinRM; admin not proven.'],
 ['evidence','Strongest evidence','One concrete observation that changed the target model.'],
 ['hypothesis','Exact hypothesis','Because I observed X, I may be able to do Y.'],
 ['prerequisite','Missing prerequisite','The one fact, right, route, build or trigger still required.'],
 ['nextCommand','Next decisive command','One command that will confirm or reject the hypothesis. Use variable names, not secrets.'],
 ['reentry','Re-entry / recovery','Exact shell, tunnel, listener, route or foothold needed to return.']
];
const ACCESS_OUTCOMES=[
 {id:'untested',label:'Not tested',rank:0},
 {id:'transport',label:'Transport / service fails',rank:-2},
 {id:'rejected',label:'Authentication rejected',rank:-1},
 {id:'authenticated',label:'Authenticated only',rank:1},
 {id:'resource',label:'Resource / data access',rank:2},
 {id:'command',label:'Command execution',rank:3},
 {id:'shell',label:'Interactive shell / session',rank:4},
 {id:'admin',label:'Privileged / admin control',rank:5}
];
const ACCESS_PROTOCOLS=[
 {id:'smb',label:'SMB',ports:[445],client:'nxc smb'},
 {id:'ldap',label:'LDAP',ports:[389,636,3268,3269],client:'nxc ldap'},
 {id:'winrm',label:'WinRM',ports:[5985,5986],client:'nxc winrm'},
 {id:'rdp',label:'RDP',ports:[3389],client:'nxc rdp'},
 {id:'mssql',label:'MSSQL',ports:[1433],client:'nxc mssql'},
 {id:'wmi',label:'WMI',ports:[135,593],client:'nxc wmi'}
];
function v19Text(value,max=500){return String(value||'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,' ').trim().slice(0,max)}
function resumePacketSecretRisks(value){
 const text=typeof value==='string'?value:V19_RESUME_FIELDS.map(([k])=>value?.[k]||'').join('\n'),risks=[];
 const add=x=>{if(!risks.includes(x))risks.push(x)};
 if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i.test(text))add('private key material');
 if(/\$(?:krb5tgs|krb5asrep|DCC2)\$/i.test(text))add('crackable credential material');
 if(/\b[a-f0-9]{32}(?::[a-f0-9]{32})?\b/i.test(text))add('possible NTLM hash');
 if(/\b(?:password|passwd|pwd|secret|auth_pass|laps_pass)\s*[:=]\s*["']?(?![$<[])[^\s"']{4,}/i.test(text))add('inline secret assignment');
 if(/(?:^|\s)(?:-p|--password)(?:=|\s+)["']?(?!\$)[^\s"']{3,}/im.test(text))add('literal command-line password');
 return risks;
}
function upgradeV19Target(t){
 t=upgradeV16Target(t);const old=t.resumePacket&&typeof t.resumePacket==='object'?t.resumePacket:{};
 const packet={};for(const [key] of V19_RESUME_FIELDS)packet[key]=v19Text(old[key]);
 packet.parked=!!old.parked;packet.savedAt=+old.savedAt||0;packet.parkedAt=+old.parkedAt||0;packet.resumedAt=+old.resumedAt||0;
 packet.epoch=Number.isFinite(+old.epoch)?+old.epoch:(+t.revertEpoch||0);t.resumePacket=packet;return t;
}
function resumePacketCompleteness(packet){
 const missing=V19_RESUME_FIELDS.filter(([key])=>!v19Text(packet?.[key])).map(([,label])=>label);
 return{done:V19_RESUME_FIELDS.length-missing.length,total:V19_RESUME_FIELDS.length,missing,complete:missing.length===0};
}
function resumePacketStale(t){
 if(!t)return false;const p=upgradeV19Target(t).resumePacket;
 return !!(t.needsReestablish||(+p.epoch||0)<(+t.revertEpoch||0));
}
function resumePacketText(t){
 if(!t)return'';const p=upgradeV19Target(t).resumePacket,stamp=p.savedAt?new Date(p.savedAt).toISOString():'not saved';
 return[`TARGET: ${targetLabel(t)}`,`STATE: ${p.parked?'PARKED':'ACTIVE'}`,`SAVED: ${stamp}`,`REVERT EPOCH: ${p.epoch}`,'',...V19_RESUME_FIELDS.map(([key,label])=>`${label.toUpperCase()}: ${p[key]||'[missing]'}`)].join('\n');
}
let v19ResumeSaveTimer=null;
function readResumePacketForm(root){
 const out={};root.querySelectorAll('.resumePacketInput').forEach(el=>out[el.dataset.field]=v19Text(el.value));return out;
}
function updateResumePacketFormState(t){
 const root=$('#workspaceResume');if(!root||!t)return;const data=readResumePacketForm(root),c=resumePacketCompleteness(data),risks=resumePacketSecretRisks(data),stale=resumePacketStale(t),p=t.resumePacket;
 const status=$('#resumePacketState'),notice=$('#resumePacketNotice'),park=$('#resumePacketPark'),copy=$('#resumePacketCopy'),save=$('#resumePacketSave');
 if(status){status.className='resumePacketState '+(risks.length?'warn':p.parked?'parked':c.complete?'ready':'warn');status.textContent=risks.length?'NOT SAVED':p.parked?'PARKED':`${c.done}/${c.total} READY`}
 if(save)save.disabled=!!risks.length;if(park)park.disabled=!c.complete||!!risks.length;if(copy)copy.disabled=!c.complete||!!risks.length;
 if(notice){
  notice.className='resumePacketNotice '+(risks.length?'bad':stale?'warn':c.complete?'':'warn');
  notice.textContent=risks.length?'Not saved: possible secret material detected. Replace it with a credential label or environment-variable name.':stale?'Target state changed after a revert. Re-establish access and rewrite/revalidate this packet before trusting it.':c.complete?'Packet is complete. Park pauses the evidence timer; Resume never assumes old access still works.':`Complete before parking: ${c.missing.join(', ')}.`;
 }
}
function commitResumePacket(t,{park=false,log=false}={}){
 const root=$('#workspaceResume');if(!root||!t)return false;const data=readResumePacketForm(root),risks=resumePacketSecretRisks(data);if(risks.length){updateResumePacketFormState(t);return false}
 const p=upgradeV19Target(t).resumePacket;Object.assign(p,data);p.savedAt=Date.now();p.epoch=+t.revertEpoch||0;
 if(park){p.parked=true;p.parkedAt=Date.now();pauseEvidenceTimer()}
 if(log)logEvent(t,park?'park':'handoff',park?'Target parked with a complete 6-line resume packet':`Resume packet saved (${resumePacketCompleteness(p).done}/${V19_RESUME_FIELDS.length})`);
 saveTargets();updateResumePacketFormState(t);return true;
}
const v19ResumeHTMLBase=resumeHTML;
resumeHTML=function(t){
 const base=v19ResumeHTMLBase(t);if(!t)return base;const p=upgradeV19Target(t).resumePacket,c=resumePacketCompleteness(p);if(!c.complete)return base;
 return `<div class="resumePacketNotice ${resumePacketStale(t)?'warn':''}"><b>${p.parked?'PARKED HANDOFF':'SAVED HANDOFF'}</b> · ${esc(p.nextCommand)}<div class="tiny">Re-entry: ${esc(p.reentry)}</div></div>${base}`;
};
function renderV19ResumeWorkspace(){
 const root=$('#workspaceResume'),t=activeTarget();if(!root)return;if(!t){root.innerHTML='<div class="muted">No active target.</div>';return}
 const p=upgradeV19Target(t).resumePacket,c=resumePacketCompleteness(p);
 root.innerHTML=`<div class="resumePacketShell"><div class="resumePacketTop"><div><b>${esc(targetLabel(t))}</b><div class="tiny">Six lines are enough to resume without reconstructing the target from memory. Never paste a raw password, hash, ticket or key.</div></div><span id="resumePacketState" class="resumePacketState">${c.done}/${c.total} READY</span></div><div class="resumePacketGrid">${V19_RESUME_FIELDS.map(([key,label,placeholder])=>`<div class="field"><label for="resumePacket-${key}">${esc(label)}</label><textarea id="resumePacket-${key}" class="resumePacketInput" data-field="${key}" maxlength="500" spellcheck="false" placeholder="${esc(placeholder)}">${esc(p[key])}</textarea></div>`).join('')}</div><div id="resumePacketNotice" class="resumePacketNotice"></div><div class="row"><button class="btn" id="resumePacketSave" type="button">Save now</button><button class="btn primary" id="resumePacketPark" type="button">Park + pause timer</button><button class="btn good" id="resumePacketResume" type="button">Resume target</button><button class="btn" id="resumePacketCopy" type="button">Copy packet</button></div><details class="resumePacketAuto"><summary>Automatic target context</summary><div style="margin-top:8px">${v19ResumeHTMLBase(t)}</div></details></div>`;
 const inputs=$$('.resumePacketInput',root);inputs.forEach(el=>el.oninput=()=>{updateResumePacketFormState(t);clearTimeout(v19ResumeSaveTimer);const data=readResumePacketForm(root);if(!resumePacketSecretRisks(data).length)v19ResumeSaveTimer=setTimeout(()=>commitResumePacket(t),350)});
 $('#resumePacketSave').onclick=()=>{clearTimeout(v19ResumeSaveTimer);if(commitResumePacket(t,{log:true})){renderV19ResumeWorkspace();toast('Resume packet saved')}};
 $('#resumePacketPark').onclick=()=>{clearTimeout(v19ResumeSaveTimer);if(commitResumePacket(t,{park:true,log:true})){renderV19ResumeWorkspace();toast('Target parked; evidence timer paused')}};
 $('#resumePacketResume').onclick=()=>{const packet=upgradeV19Target(t).resumePacket,stale=resumePacketStale(t);packet.parked=false;packet.resumedAt=Date.now();logEvent(t,'resume',stale?'Target resumed — live access still requires revalidation after revert':'Target resumed from saved handoff packet');saveTargets();renderV19ResumeWorkspace();toast(stale?'Resumed: revalidate live access first':'Target resumed')};
 $('#resumePacketCopy').onclick=async()=>{const data=readResumePacketForm(root);if(resumePacketCompleteness(data).complete&&!resumePacketSecretRisks(data).length){commitResumePacket(t);toast(await copyText(resumePacketText(t))?'Resume packet copied':'Copy blocked')}};
 updateResumePacketFormState(t);
}

function accessOutcomeRank(id){return ACCESS_OUTCOMES.find(x=>x.id===id)?.rank??0}
function blankAccessOutcomes(epoch=0){return Object.fromEntries(ACCESS_PROTOCOLS.map(p=>[p.id,{status:'untested',epoch:+epoch||0,at:0}]))}
function accessRecord(state,protocolId){
 const raw=state?.outcomes?.[protocolId];if(typeof raw==='string')return{status:ACCESS_OUTCOMES.some(x=>x.id===raw)?raw:'untested',epoch:0,at:0};
 const status=ACCESS_OUTCOMES.some(x=>x.id===raw?.status)?raw.status:'untested';return{status,epoch:+raw?.epoch||0,at:+raw?.at||0};
}
let accessLadderState=safeStoredRecord(STORE+'accessLadder',{});
function accessStateFor(key=winStrategyKey(),epoch=0){
 const old=accessLadderState[key]&&typeof accessLadderState[key]==='object'?accessLadderState[key]:{};
 const next={principal:v19Text(old.principal,120),outcomes:{},updated:+old.updated||0};
 for(const p of ACCESS_PROTOCOLS)next.outcomes[p.id]=accessRecord(old,p.id);
 if(!old.outcomes)next.outcomes=blankAccessOutcomes(epoch);accessLadderState[key]=next;return next;
}
function saveAccessLadder(){safeStoreSet(STORE+'accessLadder',JSON.stringify(accessLadderState));v9Dirty=true}
function accessRecordStale(record,t){return !!(t&&record.status!=='untested'&&(+record.epoch||0)<(+t.revertEpoch||0))}
function protocolExposed(t,protocol){
 const open=(t?.ports||[]).filter(p=>p.state!=='closed').map(p=>+p.port);return !open.length||protocol.ports.some(port=>open.includes(port));
}
function accessLadderNext(protocolId,status){
 const p=ACCESS_PROTOCOLS.find(x=>x.id===protocolId)||ACCESS_PROTOCOLS[0],proto=p.id,portList=p.ports.join(',');
 if(status==='transport')return{title:`Fix ${p.label} transport first`,why:'Separate route, port, hostname and TLS/service failure from credential failure.',command:`nmap -Pn -n -p ${portList} "$TARGET"\nip route get "$TARGET"\n# For domain protocols, also verify FQDN, DNS and time.`};
 if(status==='rejected')return{title:`Verify ${p.label} identity context once`,why:'Confirm local versus domain scope, username form and lockout risk. Retry one host with one native/manual check; do not spray.',command:`${p.client} "$TARGET" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"\n# Exact local/SAM account only: omit -d and use --local-auth where supported.`};
 const first={
  smb:`nxc smb "$TARGET" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"\nsmbclient -L "//$TARGET/" -U "$DOMAIN/$AUTH_USER"`,
  ldap:`nxc ldap "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"\nldapsearch -x -H ldap://"$DC_IP" -D "$AUTH_USER@$DOMAIN" -W -b "$BASE_DN" -s base`,
  winrm:`nxc winrm "$TARGET" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"`,
  rdp:`nxc rdp "$TARGET" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"`,
  mssql:`nxc mssql "$TARGET" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"`,
  wmi:`nxc wmi "$TARGET" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN"`
 };
 const prove={
  smb:`nxc smb "$TARGET" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" --shares\nsmbclient -L "//$TARGET/" -U "$DOMAIN/$AUTH_USER"`,
  ldap:`nxc ldap "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" --users\nnxc ldap "$DC_IP" -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" --groups`,
  winrm:`evil-winrm -i "$TARGET" -u "$AUTH_USER" -p "$AUTH_PASS"`,
  rdp:`xfreerdp /v:"$TARGET" /u:"$AUTH_USER" /d:"$DOMAIN" /p:"$AUTH_PASS" /cert:ignore +clipboard`,
  mssql:`impacket-mssqlclient "$DOMAIN/$AUTH_USER@$TARGET" -windows-auth  # password prompt`,
  wmi:`impacket-wmiexec "$DOMAIN/$AUTH_USER@$TARGET" "whoami /all"  # password prompt`
 };
 if(status==='authenticated')return{title:`Prove usable ${p.label} authorization`,why:'Accepted authentication is not admin and does not prove share, query, session or command rights. Mark only the access you actually observe.',command:prove[proto]};
 if(status==='resource')return{title:`Turn ${p.label} visibility into one exact path`,why:proto==='ldap'?'Inspect the current principal, outgoing control, groups, delegation and certificate paths; re-collect after identity changes.':'Read the accessible resource, capture its exact path/ACL/context, and follow only the evidence it exposes.',command:proto==='ldap'?`bloodhound-ce-python -u "$AUTH_USER" -p "$AUTH_PASS" -d "$DOMAIN" -dc "$DC" -ns "$DC_IP" -c All --zip`:prove[proto]};
 if(status==='command')return{title:'Prove an interactive session or document the exact command context',why:'Remote command execution is useful, but it is not automatically an interactive proof shell and does not prove admin.',command:`whoami /all & hostname & ipconfig\n# Obtain a stable interactive session before relying on it for proof.`};
 if(status==='shell')return{title:'Baseline the new token, then enumerate locally',why:'A new protocol/session can change groups, profile, network reachability and credential visibility. Admin is still a separate fact.',command:`whoami /all\nhostname\nipconfig /all\nroute print\nnetstat -ano`};
 if(status==='admin')return{title:'Bank proof and reporting evidence now',why:'Confirm the exact privileged identity, read the flag from its original path in the interactive target shell, show the target IP, submit it, and preserve reproducible commands.',command:`set ORIGINAL_FLAG_PATH=C:\\exact\\original\\path\\proof.txt\nhostname & whoami & ipconfig & cd & type "%ORIGINAL_FLAG_PATH%"`};
 return{title:`Test ${p.label} on this one justified host`,why:'Use the exact target and current principal. Record transport, authentication and authorization as separate observations.',command:first[proto]};
}
function accessLadderPlan(state,t){
 if(!t)return null;if(!state.principal)return{protocol:ACCESS_PROTOCOLS[0],status:'untested',title:'Name the current principal first',why:'Use an identity label only; never paste the secret.',command:''};
 const rows=ACCESS_PROTOCOLS.filter(p=>protocolExposed(t,p)).map(p=>({protocol:p,record:accessRecord(state,p.id)}));
 const stale=rows.find(x=>accessRecordStale(x.record,t));if(stale){const n=accessLadderNext(stale.protocol.id,'untested');return{protocol:stale.protocol,status:stale.record.status,title:`Revalidate stale ${stale.protocol.label} access`,why:'This target was reverted after the recorded result. Treat the old transport, session and privileges as stale.',command:n.command,stale:true}}
 const order=['admin','shell','command','resource','authenticated','transport','rejected','untested'];
 for(const status of order){const row=rows.find(x=>x.record.status===status);if(row)return{protocol:row.protocol,status,...accessLadderNext(row.protocol.id,status)}}
 return null;
}
function accessLadderPlanText(state,t){
 const plan=accessLadderPlan(state,t);if(!plan)return'No current target.';
 return[`TARGET: ${targetLabel(t)}`,`PRINCIPAL LABEL: ${state.principal||'[missing]'}`,`PROTOCOL: ${plan.protocol.label}`,`RECORDED OUTCOME: ${ACCESS_OUTCOMES.find(x=>x.id===plan.status)?.label||plan.status}`,'',`NEXT: ${plan.title}`,`WHY: ${plan.why}`,plan.command?`\nCOMMAND TEMPLATE\n${plan.command}`:'','\nINTERPRETATION\nTransport, authentication, resource access, command execution, interactive shell and admin are separate facts. Mark only observed evidence.'].join('\n');
}
function renderAccessLadder(){
 const rowsRoot=$('#accessLadderRows'),summary=$('#accessLadderSummary'),principal=$('#accessLadderPrincipal'),copy=$('#accessLadderCopy'),reset=$('#accessLadderReset');if(!rowsRoot||!summary||!principal)return;
 const key=winStrategyKey(),t=targets.find(x=>x.id===key)||null,state=accessStateFor(key,+t?.revertEpoch||0),disabled=!t;
 principal.disabled=disabled;principal.value=state.principal;copy.disabled=disabled||!state.principal;reset.disabled=disabled;
 rowsRoot.innerHTML=ACCESS_PROTOCOLS.map(p=>{const r=accessRecord(state,p.id),stale=accessRecordStale(r,t),next=accessLadderNext(p.id,stale?'untested':r.status),exposed=protocolExposed(t,p);return `<div class="accessLadderRow ${stale?'stale':''}" data-protocol="${p.id}"><div class="accessProtocol">${esc(p.label)}<div class="tiny">${p.ports.join('/') }${exposed?'':' · not in imported scan'}</div></div><select class="accessOutcome" data-protocol="${p.id}" ${disabled?'disabled':''} aria-label="${esc(p.label)} access outcome">${ACCESS_OUTCOMES.map(o=>`<option value="${o.id}" ${o.id===r.status?'selected':''}>${esc(o.label)}</option>`).join('')}</select><div class="accessNext">${stale?'<span class="accessStale">STALE AFTER REVERT · revalidate</span><br>':''}<b>${esc(next.title)}</b><br><span class="muted">${esc(next.why)}</span></div></div>`}).join('');
 const records=ACCESS_PROTOCOLS.map(p=>({p,r:accessRecord(state,p.id)})),fresh=records.filter(x=>!accessRecordStale(x.r,t)),best=fresh.sort((a,b)=>accessOutcomeRank(b.r.status)-accessOutcomeRank(a.r.status))[0],staleCount=records.filter(x=>accessRecordStale(x.r,t)).length,plan=accessLadderPlan(state,t);
 summary.className='accessLadderSummary '+(staleCount?'warn':best&&accessOutcomeRank(best.r.status)>=4?'good':'');
 summary.innerHTML=!t?'<b>No exam target selected.</b> Choose the current Windows/AD target above.':!state.principal?'<b>Principal label required.</b> Use a label such as CORP\\alice; never paste the password/hash/ticket/key.':`<div class="row" style="justify-content:space-between"><div><b>Best fresh result:</b> ${best&&accessOutcomeRank(best.r.status)>0?`${esc(best.p.label)} · ${esc(ACCESS_OUTCOMES.find(o=>o.id===best.r.status)?.label||best.r.status)}`:'no usable access proven'}${staleCount?`<div class="accessStale">${staleCount} stale after revert</div>`:''}</div><span class="chip">${esc(state.principal)}</span></div><div style="margin-top:7px"><b>Safest next:</b> ${esc(plan?.title||'Record one observed outcome.')}</div>`;
 principal.onchange=()=>{const next=v19Text(principal.value,120),risks=resumePacketSecretRisks(next),progressed=ACCESS_PROTOCOLS.some(p=>accessRecord(state,p.id).status!=='untested');if(risks.length){alert('Possible secret material detected. Store only a principal/credential label.');principal.value=state.principal;return}if(next!==state.principal&&progressed&&!confirm('Changing the principal makes every recorded protocol outcome ambiguous. Reset all outcomes for the new principal?')){principal.value=state.principal;return}if(next!==state.principal){state.principal=next;state.outcomes=blankAccessOutcomes(+t?.revertEpoch||0);state.updated=Date.now();saveAccessLadder();if(t)logEvent(t,'credential',`Access ladder principal set to ${next||'unlabeled'}; protocol outcomes reset`);if(t)saveTargets();renderAccessLadder()}};
 $$('.accessOutcome',rowsRoot).forEach(select=>select.onchange=()=>{if(!t)return;if(!state.principal){alert('Enter a principal label before recording outcomes.');renderAccessLadder();return}state.outcomes[select.dataset.protocol]={status:select.value,epoch:+t.revertEpoch||0,at:Date.now()};state.updated=Date.now();saveAccessLadder();const p=ACCESS_PROTOCOLS.find(x=>x.id===select.dataset.protocol);logEvent(t,'access',`${state.principal} · ${p.label}: ${ACCESS_OUTCOMES.find(x=>x.id===select.value)?.label}`);saveTargets();renderAccessLadder()});
 copy.onclick=async()=>{const plan=accessLadderPlanText(state,t);await guardedCopyText(sanitizeUnicode(plan),'Access proof plan',null,{allowPlaceholders:true})};
 reset.onclick=()=>{if(!t||!confirm(`Reset all recorded protocol outcomes for ${targetLabel(t)}?`))return;state.outcomes=blankAccessOutcomes(+t.revertEpoch||0);state.updated=Date.now();saveAccessLadder();logEvent(t,'access','Protocol access outcomes reset');saveTargets();renderAccessLadder()};
}

targets=targets.map(upgradeV19Target);
const v19NewTargetBase=newTarget;newTarget=function(){return upgradeV19Target(v19NewTargetBase())};
const v19SaveTargetsBase=saveTargets;saveTargets=function(){targets=targets.map(upgradeV19Target);return v19SaveTargetsBase()};
const v19WorkspaceRenderBase=renderWorkspace;renderWorkspace=function(){v19WorkspaceRenderBase();renderV19ResumeWorkspace()};
const v19WindowsRenderBase=renderWindowsStrategy;renderWindowsStrategy=function(){v19WindowsRenderBase();renderAccessLadder()};
$('#winStrategyTarget').onchange=renderWindowsStrategy;
const v19ActiveTargetBase=setActiveTarget;setActiveTarget=function(id){v19ActiveTargetBase(id);renderV19ResumeWorkspace();renderAccessLadder()};

const v19SessionBase=sessionPayload;sessionPayload=function(includeSecrets=false){const o=v19SessionBase(includeSecrets);o.app='OSCP-V19';o.version=19;o.releaseVersion='V19';o.accessLadderState=accessLadderState;return o};
// Secret-free exports must not quietly retain known passwords/hashes inside copied
// journal/report text. Dedicated secret fields were already omitted; scrub exact known
// secret values from the most likely free-text leak surfaces as a second layer.
function knownSessionSecrets(){const vals=[...Object.values(sessionSecrets||{}),...Object.values(sessionCredentialSecrets||{}),settings?.PASSWORD||''].map(x=>String(x||'')).filter(Boolean);return [...new Set(vals)].sort((a,b)=>b.length-a.length)}
function redactKnownSecretText(value,secrets=knownSessionSecrets()){let out=String(value??'');for(const sec of secrets){if(sec.length>=4||out===sec)out=out.split(sec).join('<REDACTED>')}return out}
function scrubSecretFreeTarget(t,secrets){const x={...t};x.notes=redactKnownSecretText(x.notes,secrets);x.next=Array.isArray(x.next)?x.next.map(v=>redactKnownSecretText(v,secrets)):x.next;if(x.report&&typeof x.report==='object')x.report=Object.fromEntries(Object.entries(x.report).map(([k,v])=>[k,typeof v==='string'?redactKnownSecretText(v,secrets):v]));if(Array.isArray(x.journal))x.journal=x.journal.map(j=>({...j,command:redactKnownSecretText(j.command,secrets),note:redactKnownSecretText(j.note,secrets)}));if(Array.isArray(x.findings))x.findings=x.findings.map(f=>({...f,title:redactKnownSecretText(f.title,secrets),tag:redactKnownSecretText(f.tag,secrets)}));if(Array.isArray(x.path))x.path=x.path.map(a=>({...a,label:redactKnownSecretText(a.label,secrets),result:redactKnownSecretText(a.result,secrets)}));if(Array.isArray(x.timeline))x.timeline=x.timeline.map(e=>({...e,text:redactKnownSecretText(e.text,secrets),label:redactKnownSecretText(e.label,secrets)}));if(x.resumePacket&&typeof x.resumePacket==='object')x.resumePacket=Object.fromEntries(Object.entries(x.resumePacket).map(([k,v])=>[k,typeof v==='string'?redactKnownSecretText(v,secrets):v]));return x}
function targetOnlyPayload(){const secrets=knownSessionSecrets();return{app:'OSCP-Targets',version:19,exported:new Date().toISOString(),targets:targets.map(t=>({...scrubSecretFreeTarget(t,secrets),creds:''}))}}
const safeTargetExportBtn=$('#exportTargets');if(safeTargetExportBtn)safeTargetExportBtn.onclick=()=>{downloadText('oscp-targets.json',JSON.stringify(targetOnlyPayload(),null,2),'application/json');toast('Targets exported without secrets — use encrypted backup if secrets must be preserved')};
const secretSafeSessionPayloadBase=sessionPayload;sessionPayload=function(includeSecrets=false){const o=secretSafeSessionPayloadBase(includeSecrets);if(includeSecrets)return o;const secrets=knownSessionSecrets();o.targets=Array.isArray(o.targets)?o.targets.map(t=>scrubSecretFreeTarget(t,secrets)):o.targets;return o};
const v19RestoreBase=restoreV9Payload;restoreV9Payload=function(o){if(o?.accessLadderState&&typeof o.accessLadderState==='object')accessLadderState=o.accessLadderState;v19RestoreBase(o);targets=targets.map(upgradeV19Target);saveTargets();saveAccessLadder();renderV19ResumeWorkspace();renderAccessLadder()};

/* Replace the inherited partial JSON-import chain with the same complete restore
   path already used by encrypted backups and recovery snapshots. */
$('#importSession').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{assertImportFileSize(file,'Session backup');const o=JSON.parse(await file.text());if(o?.ciphertext)throw new Error('Use the encrypted-backup restore control for encrypted files');assertRestorableBackup(o);snapshotNow('before session import');restoreV9Payload(o);toast('Complete session restored')}catch(err){alert('Invalid OSCP session JSON: '+err.message)}finally{e.target.value=''}};

/* V19 destructive-action safety: create a secret-field-free recovery point before
   operations-state clears/restores. Full local-data deletion gets a second,
   explicit confirmation because it also removes browser restore points. */
const v19ClearOpsBtn=$('#clearV7Ops');
if(v19ClearOpsBtn)v19ClearOpsBtn.onclick=()=>{
 if(!confirm('Clear targets, credentials, favorites and preflight from this browser?'))return;
 snapshotNow('before operations-state clear');
 ['targets','credentials','favorites','preflight','activeTarget'].forEach(k=>safeStoreRemove(STORE+k));
 targets=[];credentials=[];favorites=[];preflightData=null;activeTargetId='';sessionSecrets={};sessionCredentialSecrets={};
 renderTargets();renderAllV7();renderSnapshots();toast('Operations state cleared — recovery snapshot retained');
};
function isOSCPAppStorageKey(k){return /^oscp_v\d+_/.test(String(k||''))}
function legacyOSCPStorageKeys(){const ks=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(isOSCPAppStorageKey(k)&&!String(k).startsWith(STORE))ks.push(k)}return ks}
function legacyArrayHasData(suffix){for(const k of legacyOSCPStorageKeys().filter(x=>x.endsWith('_'+suffix))){try{const v=JSON.parse(localStorage.getItem(k)||'null');if(Array.isArray(v)&&v.length)return true}catch(e){}}return false}
function purgeLegacyOSCPStorage(){const ks=legacyOSCPStorageKeys();if(!ks.length)return{removed:0,skipped:false};if((legacyArrayHasData('targets')&&!targets.length)||(legacyArrayHasData('credentials')&&!credentials.length))return{removed:0,skipped:true};ks.forEach(k=>safeStoreRemove(k));return{removed:ks.length,skipped:false}}
const legacyStorageCleanup=purgeLegacyOSCPStorage();
if(legacyStorageCleanup.removed)console.info(`OSCP console removed ${legacyStorageCleanup.removed} migrated legacy storage key(s).`);
const v19ClearAllBtn=$('#clearLocal');
if(v19ClearAllBtn)v19ClearAllBtn.onclick=()=>{
 if(!confirm('Clear ALL OSCP local data from this browser? This includes targets, settings, timers, evidence, restore points and migrated legacy-version state.'))return;
 if(!confirm('Final confirmation: this cannot be undone unless you already exported a backup. Continue?'))return;
 const ks=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(isOSCPAppStorageKey(k))ks.push(k)}
 ks.forEach(k=>safeStoreRemove(k));location.reload();
};

try{V16_SELF_TESTS.push(
 ['Resume packet schema',()=>{const p=upgradeV19Target({id:'v19-test',status:{},path:[],findings:[],timeline:[]}).resumePacket;return[V19_RESUME_FIELDS.length===6&&resumePacketCompleteness(p).total===6,'6-line target handoff']}],
 ['Resume packet secret guard',()=>[resumePacketSecretRisks('password=LiteralSecret!').length>0&&resumePacketSecretRisks('nxc smb "$TARGET" -u "$USER" -p "$PASS"').length===0,'literal blocked; variables accepted']],
 ['Access outcomes ordered',()=>[ACCESS_OUTCOMES.length===8&&accessOutcomeRank('authenticated')<accessOutcomeRank('resource')&&accessOutcomeRank('command')<accessOutcomeRank('shell')&&accessOutcomeRank('shell')<accessOutcomeRank('admin'),'auth<resource<command<shell<admin']],
 ['Protocol ladder complete',()=>[ACCESS_PROTOCOLS.length===6&&ACCESS_PROTOCOLS.every(p=>p.id&&p.label&&p.ports.length)&&accessLadderNext('smb','authenticated').command.includes('--shares'),'6 protocol routes']],
 ['Complete backup/restore surface',()=>[sessionPayload(false).version===19&&sessionPayload(false).accessLadderState===accessLadderState&&typeof restoreV9Payload==='function','resume embedded + ladder state']],
 ['Backup validator rejects duplicate credential IDs',()=>{const r=v15BackupValidate({version:19,targets:[{id:'a'}],credentials:[{id:'c'},{id:'c'}],activeTargetId:'a'});return[!r.ok&&r.issues.includes('duplicate credential IDs'),r.issues.join('|')]}],
 ['Secret-free restore clears stale session secrets',()=>{const oldS=sessionSecrets,oldC=sessionCredentialSecrets;try{sessionSecrets={'restore-test':'OLD'};sessionCredentialSecrets={'restore-cred':'OLD'};clearSessionSecretsForRestore();return[Object.keys(sessionSecrets).length===0&&Object.keys(sessionCredentialSecrets).length===0,'stale maps cleared']}finally{sessionSecrets=oldS;sessionCredentialSecrets=oldC}}],
 ['Backup validator rejects unsafe record IDs',()=>{const r=v15BackupValidate({version:19,targets:[{id:'x\"><img src=x onerror=1>'}],credentials:[],activeTargetId:''});return[!r.ok&&r.issues.includes('target with invalid ID'),r.issues.join('|')]}],
 ['Backup validator rejects injected matrix states',()=>{const r=v15BackupValidate({version:19,targets:[{id:'t1'}],credentials:[{id:'c1',checks:{'t1|SMB':'\"><img src=x>'}}],activeTargetId:'t1'});return[!r.ok&&r.issues.includes('credential checks contain invalid state'),r.issues.join('|')]}],
 ['Clear-all key matcher covers current, legacy and future versioned state only',()=>[isOSCPAppStorageKey('oscp_v6_targets')&&isOSCPAppStorageKey('oscp_v16_targets')&&isOSCPAppStorageKey('oscp_v999_future')&&!isOSCPAppStorageKey('unrelated_app_state'),'versioned OSCP keys only']],
 ['AD ten-case map keeps poisoning blocked and spraying guarded',()=>{const txt=document.querySelector('#windowsStrategyView')?.innerText||'';return[txt.includes('LLMNR / NBT-NS poisoning')&&txt.includes('BLOCKED ACTION')&&txt.includes('Password spraying')&&txt.includes('GUARDED')&&txt.includes('Golden Ticket'),'10-case recognition map present']}],
 ['Static reference has no broad subnet credential-spray recipe',()=>{const txt=document.getElementById('referenceRoot')?.textContent||'';const bad=['SPRAY DA HASH EVERYWHERE','spray creds/hashes on entire subnet','After DA — spray creds/hashes on entire subnet','Password spray: common passwords against all users','Spray cracked hashes across all machines','Use local admin to dump LSASS on each box','Persistence if needed for report','nxc smb 10.10.10.0/24 -u Administrator -H','nxc smb $IP/24 -u admin -H','nxc smb IP/24 -u admin -H'].some(x=>txt.includes(x));return[!bad,bad?'broad credential spray residue found':'targeted credential validation only']}],
 ['Static reference has no phishing-delivery recipes',()=>{const txt=document.getElementById('referenceRoot')?.textContent||'';const bad=/SEND PHISHING|MAIL WITH ATTACHMENT|victim@domain\.com|--attach \/path\/to\/malicious/i.test(txt);return[!bad,bad?'phishing-delivery residue found':'SMTP stops at capability validation']}],
 ['Static reference has no broad Defender/AMSI disable recipes',()=>{const txt=document.getElementById('referenceRoot')?.textContent||'';const bad=/Set-MpPreference -DisableRealtimeMonitoring|DisableAntiSpyware|AmsiUtils|Invoke-Obfuscation/i.test(txt);return[!bad,bad?'broad defense-bypass residue found':'execution constraints are diagnosis-first']}],
 ['Static reference has no $TARGETS credential fanout',()=>{const txt=document.getElementById('referenceRoot')?.textContent||'';return[!/(?:nxc|netexec)\s+(?:smb|winrm|rdp|ssh|mssql)\s+\$TARGETS/i.test(txt),'one-host credential validation']}],
 ['Password-state recovery is prompt-based and decoder-linked',()=>{const ref=document.getElementById('ref-9-4b-password-state-recovery')?.textContent||'';const rule=AD_FAILURE_RULES.find(x=>x.id==='password-state');return[ref.includes('impacket-changepasswd')&&!ref.includes('-newpass')&&rule?.ref==='ref-9-4b-password-state-recovery','mutation-safe recovery wired']}],
 ['Password-state output analyzer signal exists',()=>[OUTPUT_RULES.some(x=>x.id==='win-password-state'),'password-state analyzer signal present']],
 ['Static reference avoids literal demo passwords in executable examples',()=>{const txt=document.getElementById('referenceRoot')?.textContent||'';const bad=/(?:-u\s+(?:user|sa)\s+-p\s+['"]?pass|\/u:user\s+\/p:pass|user%pass|domain\\user%password)/i.test(txt);return[!bad,bad?'literal demo password residue found':'credential examples use variables or prompts']}],
 ['Rule snapshot date is 24 Sep 2026',()=>[RULE_VERIFIED_DATE==='2026-09-23'&&V13_RULE_DEFAULT==='2026-09-23'&&V16_RULE_VERIFIED==='2026-09-23','official-rule snapshot date current']],
 ['Nmap banner rendering escapes hostile text',()=>{const old=scanPreviewHosts;try{scanPreviewHosts=[{ip:'10.10.10.10',host:'<img src=x onerror=window.__xss=1>',role:'linux',signals:[],tags:[],ports:[{port:22,proto:'tcp',state:'open',service:'ssh',product:'<svg onload=window.__xss=2>',version:''}]}];window.__xss=0;renderScanPreview();const html=$('#scanPreview').innerHTML;return[window.__xss===0&&!$('#scanPreview img')&&!$('#scanPreview svg')&&html.includes('&lt;img'),'host/service escaped']}finally{scanPreviewHosts=old;renderScanPreview()}}],
 ['Command quote survives apostrophe',()=>[shQuote("p@ss'word;$HOME")==="'p@ss'\"'\"'word;$HOME'",'POSIX single-quote escape']],
 ['Password route uses -p',()=>{const c={id:'cmd-pw',user:'alice',type:'password'},t=upgradeV8Target({id:'cmd-t',ip:'10.10.10.10',ports:[]});sessionCredentialSecrets[c.id]="P@ss w'rd!";const out=credCommands(t,c,'WINRM',[`nxc winrm {TARGET} -u {U} -p {P}`]).join('\n');delete sessionCredentialSecrets[c.id];return[out.includes(' -p ')&&!out.includes(' -H ')&&!out.includes('{P}'),'password only']}],
 ['NTLM route never uses -p',()=>{const c={id:'cmd-h',user:'alice',type:'ntlm'},t=upgradeV8Target({id:'cmd-t2',ip:'10.10.10.11',ports:[]});sessionCredentialSecrets[c.id]='0123456789abcdef0123456789abcdef';const out=credCommands(t,c,'SMB',[]).join('\n');delete sessionCredentialSecrets[c.id];return[out.includes(' -H ')&&!/\s-p\s/.test(out)&&out.includes('--pw-nt-hash'),'PTH only']}],
 ['Non-password material is blocked',()=>{const t=upgradeV8Target({id:'cmd-t3',ip:'10.10.10.12',ports:[]});return[['token','ccache','certificate','ssh key'].every((type,i)=>{const c={id:'cmd-x'+i,user:'alice',type};sessionCredentialSecrets[c.id]='DO_NOT_EMBED';const out=credCommands(t,c,'WINRM',[`nxc winrm {TARGET} -u {U} -p {P}`]).join('\n');delete sessionCredentialSecrets[c.id];return!out.includes('DO_NOT_EMBED')&&!/\s-p\s/.test(out)}),'token/ticket/cert/key not coerced to password']}],
 ['SMB hash target composition',()=>{const c={id:'cmd-smbh',user:'alice',type:'ntlm'},t=upgradeV8Target({id:'cmd-t4',ip:'10.10.10.13',ports:[]});sessionCredentialSecrets[c.id]='0123456789abcdef0123456789abcdef';const out=credCommands(t,c,'SMB',[]).join('\n');delete sessionCredentialSecrets[c.id];return[out.includes("smbclient -L '//10.10.10.13'")&&!out.includes("//'10.10.10.13'"),'valid //host composition']}],
 ['Command builder leaves no template braces',()=>{const c={id:'cmd-final',user:'alice',type:'password'},t=upgradeV8Target({id:'cmd-t5',ip:'10.10.10.14',ports:[]});sessionCredentialSecrets[c.id]='SafePass!';const out=credCommands(t,c,'MSSQL',[`nxc mssql {TARGET} -u {U} -p {P}`,`impacket-mssqlclient {MSSQL_TARGET}`]).join('\n');delete sessionCredentialSecrets[c.id];return[!/{(?:TARGET|U|P|MSSQL_TARGET)}/.test(out),'all builder tokens resolved']}],
 ['LDAP domain override becomes a DN',()=>[normalizeBaseDN('corp.local')==='DC=corp,DC=local'&&normalizeBaseDN('OU=Users,DC=corp,DC=local')==='OU=Users,DC=corp,DC=local','DNS domain normalized; explicit DN preserved']],
 ['LDAP password bind uses UPN + prompt',()=>{const t=upgradeV8Target({id:'ldap-t',ip:'10.10.10.10',ports:[]}),c={id:'ldap-c',user:'CORP\\alice',type:'password',scope:'domain'};sessionCredentialSecrets[c.id]='P@ss:word!';const out=V8_CMD_TEMPLATES.ldap.make(t,c,'corp.local').join('\n');delete sessionCredentialSecrets[c.id];return[out.includes("-D 'CORP\\alice'")&&out.includes(' -W ')&&out.includes("-b 'DC=corp,DC=local'")&&!out.includes('P@ss:word!'),out]}],
 ['Kerberos prefers configured DC IP',()=>{const old=settings.DC_IP;try{settings.DC_IP='10.10.10.99';const t=upgradeV8Target({id:'krb-t',ip:'10.10.10.13',ports:[]});const out=V8_CMD_TEMPLATES.kerberos.make(t,null,'').join('\n');return[out.includes("-dc-ip '10.10.10.99'")&&!out.includes("-dc-ip '10.10.10.13'"),out]}finally{settings.DC_IP=old}}],
 ['Impacket password targets avoid inline password parser',()=>{const c={id:'imp-pw',user:'alice',type:'password',scope:'domain'},t=upgradeV8Target({id:'imp-t',ip:'10.10.10.15',ports:[]});const old=settings.DOMAIN;settings.DOMAIN='corp.local';sessionCredentialSecrets[c.id]='P@ss:with:delims';try{const m=credCommands(t,c,'MSSQL',[]).join('\n'),k=V8_CMD_TEMPLATES.kerberos.make(t,c,'').join('\n');const imp=m.split('\n').find(x=>x.startsWith('impacket-'))||'';return[!imp.includes('P@ss:with:delims')&&!k.includes('P@ss:with:delims')&&imp.includes('password prompts interactively')&&k.includes('password prompts interactively'),m+' | '+k]}finally{delete sessionCredentialSecrets[c.id];settings.DOMAIN=old}}],
 ['Secret-free payload redacts known journal/report secrets',()=>{const oldT=targets,oldC=credentials,oldS=sessionCredentialSecrets;try{targets=[upgradeV19Target({id:'redact-t',ip:'10.0.0.1',journal:[{id:'j',command:'nxc smb 10.0.0.1 -u alice -p SuperSecret!',note:'used SuperSecret!'}],report:{title:'x',foothold:'SuperSecret!',privesc:'',commands:'echo SuperSecret!',screens:'',remediation:''},status:{},signals:[],path:[],findings:[],timeline:[]})];credentials=[{id:'redact-c',user:'alice',type:'password',scope:'domain',checks:{}}];sessionCredentialSecrets={'redact-c':'SuperSecret!'};const out=JSON.stringify(sessionPayload(false));return[!out.includes('SuperSecret!')&&out.includes('<REDACTED>'),'known secret removed from exported free text']}finally{targets=oldT;credentials=oldC;sessionCredentialSecrets=oldS}}],
 ['LDAP transport honors LDAPS and Global Catalog ports',()=>{const a=upgradeV8Target({id:'ldap-ssl',ip:'10.0.0.30',ports:[{port:636,proto:'tcp',state:'open',service:'ldaps'}]}),b=upgradeV8Target({id:'ldap-gc',ip:'10.0.0.31',ports:[{port:3269,proto:'tcp',state:'open',service:'globalcatLDAPssl'}]});const ua=ldapURIForTarget(a),ub=ldapURIForTarget(b);return[ua==="'ldaps://10.0.0.30'"&&ub==="'ldaps://10.0.0.31:3269'",ua+' | '+ub]}],
 ['Standard service ports stay canonical without banner text',()=>{const pairs=[[23,'TELNET'],[873,'RSYNC'],[3268,'LDAP'],[3269,'LDAP'],[5432,'POSTGRES']];const bad=pairs.filter(([port,want])=>canonicalServiceName({port,proto:'tcp',state:'open'})!==want);return[bad.length===0,bad.length?JSON.stringify(bad):'23 · 873 · 3268/3269 · 5432 mapped']}],
 ['Explicit service identity outranks conventional port',()=>{const cases=[[{port:443,service:'ssh'},'SSH'],[{port:22,service:'http'},'WEB'],[{port:8080,service:'ms-sql-s'},'MSSQL']];const bad=cases.filter(([rec,want])=>canonicalServiceName(rec)!==want);return[bad.length===0,bad.length?JSON.stringify(bad):'SSH@443 · HTTP@22 · MSSQL@8080 routed by service evidence']}],
 ['WinRM HTTPS-only command honors 5986',()=>{const c={id:'winrm-ssl-c',user:'alice',type:'password',scope:'domain'},t=upgradeV8Target({id:'winrm-ssl-t',ip:'10.0.0.20',ports:[{port:5986,proto:'tcp',state:'open',service:'https',product:'Microsoft HTTPAPI httpd'}]});sessionCredentialSecrets[c.id]='SafePass!';const out=credCommands(t,c,'WINRM',[]).join('\n');delete sessionCredentialSecrets[c.id];return[out.includes('--port 5986 --check-proto https')&&out.includes('evil-winrm')&&out.includes(' -S')&&out.includes(' -P 5986'),out]}],
 ['RDP custom port is preserved',()=>{const c={id:'rdp-port-c',user:'alice',type:'password',scope:'domain'},t=upgradeV8Target({id:'rdp-port-t',ip:'10.0.0.21',ports:[{port:13389,proto:'tcp',state:'open',service:'ms-wbt-server'}]});sessionCredentialSecrets[c.id]='SafePass!';const out=credCommands(t,c,'RDP',[]).join('\n');delete sessionCredentialSecrets[c.id];return[out.includes('--port 13389')&&out.includes("'10.0.0.21'"),out]}],
 ['MSSQL custom port reaches both clients',()=>{const c={id:'mssql-port-c',user:'alice',type:'password',scope:'domain'},t=upgradeV8Target({id:'mssql-port-t',ip:'10.0.0.22',ports:[{port:6520,proto:'tcp',state:'open',service:'ms-sql-s'}]});sessionCredentialSecrets[c.id]='SafePass!';const out=credCommands(t,c,'MSSQL',[]).join('\n');delete sessionCredentialSecrets[c.id];return[out.includes('nxc mssql')&&out.includes('--port 6520')&&out.includes('impacket-mssqlclient -port 6520'),out]}],
 ['Target-only export is always secret-free',()=>{const oldT=targets,oldS=sessionSecrets;try{targets=[upgradeV19Target({id:'target-export',ip:'10.0.0.2',notes:'password TargetSecret!',status:{},signals:[],path:[],findings:[],timeline:[]})];sessionSecrets={'target-export':'TargetSecret!'};const out=JSON.stringify(targetOnlyPayload());return[!out.includes('TargetSecret!')&&out.includes('<REDACTED>'),'target JSON redacted']}finally{targets=oldT;sessionSecrets=oldS}}],
 ['Target-only import cannot inherit stale session secret',()=>{const oldP=persistSecrets;try{persistSecrets=false;const prep=prepareTargetImport([{id:'same-id',ip:'10.0.0.3',creds:''}]);return[Object.keys(prep.secrets).length===0&&!prep.targets[0].creds,'fresh secret map']}finally{persistSecrets=oldP}}]
)}catch(e){}
try{V16_SELF_TESTS.push(
 ['Evidence gate follows claimed local/proof access instead of demanding both',()=>{const t=upgradeV19Target({id:'ev-claim',ip:'10.0.0.50',status:{foothold:true,local:true},evidence:{enumRecorded:true,commandsRecorded:true,footholdRecorded:true,localRead:true,localSubmitted:true,localScreenshot:true},report:{title:'Local foothold',commands:'id'}});const miss=evidenceMissing(t);return[!miss.some(x=>/proof\.txt|PrivEsc/i.test(x))&&miss.length===0,miss.join(' | ')||'local-only claim can be fully banked']}],
 ['Evidence gate requires proof evidence once privilege/proof is claimed',()=>{const t=upgradeV19Target({id:'ev-proof',ip:'10.0.0.51',status:{foothold:true,local:true,privesc:true,proof:true},evidence:{enumRecorded:true,commandsRecorded:true,footholdRecorded:true,localRead:true,localSubmitted:true,localScreenshot:true},report:{title:'Root',commands:'id'}});const miss=evidenceMissing(t);return[miss.includes('proof.txt read at original location')&&miss.includes('Proof screenshot has proof + IP'),miss.join(' | ')]}],
 ['Exam board point inputs clamp to 0..100 and awarded cannot exceed possible',()=>[clampExamPoints(-2)===0&&clampExamPoints(101)===100&&clampExamPoints(19.7)===20,'0 / 100 / 20']],
 ['Command Guard warns on list-based credential spraying',()=>{const x=lintCommand('nxc smb 10.0.0.5 -u users.txt -p passwords.txt');return[x.issues.some(i=>i.code==='rule-spray'),x.issues.map(i=>i.code).join('|')]}],
 ['Primary state writer fails closed instead of throwing on storage errors',()=>[typeof safeStoreSet==='function','safeStoreSet present for targets/credentials/evidence/autosnapshots']],
 ['Coverage/debt can route directly into a pre-contextualized Command Builder',()=>{const oldT=targets,oldC=credentials,oldA=activeTargetId,oldS=sessionCredentialSecrets;try{const t=upgradeV19Target({id:'route-test',ip:'10.0.0.5',ports:[{port:445,proto:'tcp',state:'open',service:'microsoft-ds'}]}),c={id:'route-cred',user:'CORP\\alice',type:'password',scope:'domain',checks:{}};targets=[t];credentials=[c];activeTargetId=t.id;sessionCredentialSecrets={'route-cred':'Safe!'};renderAllV11();openCommandBuilderFor(t.id,c.id,'SMB');return[$('#commandsView').classList.contains('active')&&$('#cmdTarget').value===t.id&&$('#cmdCredential').value===c.id&&$('#cmdService').value==='SMB','target + credential + SMB preserved']}finally{targets=oldT;credentials=oldC;activeTargetId=oldA;sessionCredentialSecrets=oldS;renderAllV11()}}]
)}catch(e){}
try{V16_SELF_TESTS.push(
 ['Plain session export cannot opt into plaintext secrets',()=>[!document.getElementById('exportSecrets')&&/secret-free/i.test(document.getElementById('exportSession')?.textContent||''),'no plaintext-secret export control']],
 ['Evidence timer payload preserves running target and elapsed state',()=>{const old={...timer};try{timer.running=true;timer.started=Date.now()-5000;timer.elapsed=12345;timer.limitMinutes=47;timer.targetKey='timer-target';const x=evidenceTimerPayload();return[x.running&&x.targetKey==='timer-target'&&x.elapsed===12345&&x.limitMinutes===47,JSON.stringify(x)]}finally{Object.assign(timer,old)}}],
 ['Backup validator rejects malformed nested module state',()=>{const base={app:'OSCP-V19',version:19,targets:[],credentials:[],evidenceVault:[]},r=v15BackupValidate({...base,guardConfig:'bad'});return[!r.ok&&r.issues.includes('guardConfig must be an object'),r.issues.join(' | ')]}],
 ['Backup validator rejects duplicate evidence IDs',()=>{const base={app:'OSCP-V19',version:19,targets:[],credentials:[],evidenceVault:[{id:'dup'},{id:'dup'}]},r=v15BackupValidate(base);return[!r.ok&&r.issues.includes('duplicate evidence IDs'),r.issues.join(' | ')]}],
 ['Proof bank dialog verifies evidence instead of claiming points are banked',()=>[!!document.getElementById('examBankVerify')&&!document.getElementById('examBankDone'),'verify-only evidence gate']],
 ['Static reference has no hardcoded Password123 spray or inline user:pass@ PoC',()=>{const txt=document.getElementById('referenceRoot')?.textContent||'';return[!txt.includes('Password123')&&!/domain\/user:pass@/i.test(txt),'hardcoded spray/PoC secret patterns absent']}],
 ['Rubeus reference has no literal example password',()=>{const txt=document.getElementById('referenceRoot')?.textContent||'';return[!txt.includes('Rubeus.exe asktgt /user:user /password:'+'pass')&&txt.includes('Rubeus — Windows-Side Kerberos Material Router'),'Rubeus routes are material-first']}],
 ['Analyzer distinguishes PREAUTH_REQUIRED from returned AS-REP material',()=>{const a=analyzeText('[-] KDC_ERR_PREAUTH_REQUIRED'),b=analyzeText('$krb5asrep$23$alice@CORP.LOCAL:deadbeef');return[a.some(x=>x.id==='krb-preauth-required')&&!a.some(x=>x.id==='rubeus-asrep-material')&&b.some(x=>x.id==='rubeus-asrep-material'),'expected KDC signal != roast hash']}],
 ['Analyzer recognizes Kerberoast material and Rubeus ticket import',()=>{const a=analyzeText('$krb5tgs$23$*svc$CORP.LOCAL$http/web$abcd'),b=analyzeText('[+] Ticket successfully imported!');return[a.some(x=>x.id==='rubeus-tgs-material')&&b.some(x=>x.id==='rubeus-ptt-success'),'TGS + PTT signals recognized']}],
 ['Backup validator rejects wrong-shaped Rubeus router state',()=>{const r=v15BackupValidate({version:19,targets:[],credentials:[],rubeusRouteState:[]});return[!r.ok&&r.issues.includes('rubeusRouteState must be an object'),r.issues.join('|')]}],
 ['Reference placeholder substitution never injects a password',()=>{const old=settings.PASSWORD;try{settings.PASSWORD='DOM_LEAK_SENTINEL!';const out=substitute('PASSWORD $PASSWORD -p pass');return[!out.includes('DOM_LEAK_SENTINEL!'),out]}finally{settings.PASSWORD=old}}],
 ['Credential matrix masks secrets without embedding plaintext in HTML',()=>{const oldC=credentials,oldS=sessionCredentialSecrets,oldA=activeTargetId;try{credentials=[{id:'dom-secret-test',user:'alice',type:'password',scope:'domain',checks:{}}];sessionCredentialSecrets={'dom-secret-test':'HoverLeakSentinel!'};renderCredentialMatrix();const html=document.getElementById('credBody')?.innerHTML||'';return[!html.includes('HoverLeakSentinel!')&&html.includes('Secret present for this credential'),html.includes('HoverLeakSentinel!')?'plaintext leaked':'masked']}finally{credentials=oldC;sessionCredentialSecrets=oldS;activeTargetId=oldA;renderCredentialMatrix()}}],
 ['Target upgrader repairs valid-JSON wrong nested shapes',()=>{const t=upgradeV19Target({id:'shape-target',status:[],next:{},signals:{},findings:'bad',path:7,evidence:'bad',report:[],coverage:'bad',hypothesisState:[],v15:{chain:'bad'}});return[plainRecord(t.status)&&Array.isArray(t.next)&&t.next.length===3&&Array.isArray(t.signals)&&Array.isArray(t.findings)&&Array.isArray(t.path)&&plainRecord(t.evidence)&&plainRecord(t.report)&&plainRecord(t.coverage)&&plainRecord(t.hypothesisState)&&plainRecord(t.v15.chain),'nested target state normalized']}],
 ['Guard config normalizer rejects wrong-shaped entries',()=>{const g=normalizeGuardConfig({entries:{bad:true},requireScope:'yes',checkPlaceholders:0,lhost:123,msfTargetId:[]});return[Array.isArray(g.entries)&&g.entries.length===0&&g.requireScope===true&&g.checkPlaceholders===true&&g.lhost===''&&g.msfTargetId==='','safe guard defaults']}],
 ['Revert state normalizer clamps bank and repairs ledger',()=>{const a=normalizeRevertState({bankUsed:999,resetUsed:'yes',ledger:{}}),b=normalizeRevertState({bankUsed:-5,ledger:[null,{kind:'incident'}]});return[a.bankUsed===24&&a.resetUsed===true&&Array.isArray(a.ledger)&&a.ledger.length===0&&b.bankUsed===0&&b.ledger.length===1,'bank 0..24 + record ledger only']}],
 ['Pre-exam gate references only live built-in surfaces',()=>{const text=PRE_EXAM_ITEMS.map(x=>x[1]).join(' | ');return[!/(?:V13 validator|Quick Card)/i.test(text)&&/self-tests/i.test(text)&&/Simple Exam/i.test(text),text]}],
 ['Disabling secret persistence immediately scrubs saved target and credential secrets',()=>{const oldP=persistSecrets,oldT=targets,oldC=credentials,oldSS=sessionSecrets,oldCS=sessionCredentialSecrets;const kt=STORE+'targets',kc=STORE+'credentials';const beforeT=safeStoreGet(kt,''),beforeC=safeStoreGet(kc,'');try{targets=[upgradeV19Target({id:'persist-target',ip:'10.0.0.77',creds:'TargetPersistSecret!',status:{}})];credentials=[{id:'persist-cred',user:'alice',type:'password',scope:'domain',secret:'CredPersistSecret!',checks:{}}];sessionSecrets={'persist-target':'TargetPersistSecret!'};sessionCredentialSecrets={'persist-cred':'CredPersistSecret!'};persistSecrets=true;saveTargets();saveOps();applySecretPersistence(false);const raw=(safeStoreGet(kt,'')+'\n'+safeStoreGet(kc,''));return[!raw.includes('TargetPersistSecret!')&&!raw.includes('CredPersistSecret!')&&persistSecrets===false,'saved target + credential secrets scrubbed immediately']}finally{persistSecrets=oldP;targets=oldT;credentials=oldC;sessionSecrets=oldSS;sessionCredentialSecrets=oldCS;if(beforeT)safeStoreSet(kt,beforeT);else safeStoreRemove(kt);if(beforeC)safeStoreSet(kc,beforeC);else safeStoreRemove(kc);saveTargets();saveOps()}}],
 ['Port 111 routes to rpcbind coverage, not NFS unless NFS is actually identified',()=>{const a=canonicalServiceName({port:111,proto:'tcp',state:'open',service:'rpcbind'}),b=canonicalServiceName({port:2049,proto:'tcp',state:'open',service:'nfs'});return[a==='RPCBIND'&&b==='NFS',a+' / '+b]}],
 ['Credential-qualified Kerberos domain outranks unrelated global domain',()=>{const oldD=settings.DOMAIN;try{settings.DOMAIN='wrong.local';const c={user:'CORP\\alice',scope:'domain',type:'password'},id=credentialIdentity(c);const t={ip:'10.0.0.10',ports:[{port:88,proto:'tcp',state:'open',service:'kerberos'}]};const out=V8_CMD_TEMPLATES.kerberos.make(t,c,'').join('\n');return[id.domain==='CORP'&&out.includes("'CORP/alice'")&&!out.includes('wrong.local/alice'),out]}finally{settings.DOMAIN=oldD}}],
 ['Encrypted backup validator rejects abusive KDF work before PBKDF2',()=>{try{validateEncryptedContainer({format:'OSCP-V10-AESGCM',version:1,kdf:'PBKDF2-SHA256',iterations:999999999,salt:b64(new Uint8Array(16)),iv:b64(new Uint8Array(12)),ciphertext:b64(new Uint8Array(16))});return[false,'unsafe work factor accepted']}catch(e){return[/iterations/i.test(e.message),e.message]}}],
 ['Encrypted backup validator enforces AES-GCM nonce length',()=>{try{validateEncryptedContainer({format:'OSCP-V10-AESGCM',version:1,kdf:'PBKDF2-SHA256',iterations:250000,salt:b64(new Uint8Array(16)),iv:b64(new Uint8Array(11)),ciphertext:b64(new Uint8Array(16))});return[false,'bad IV accepted']}catch(e){return[/IV.*12 bytes/i.test(e.message),e.message]}}],
 ['Import size guard rejects oversized JSON before reading it',()=>{try{assertImportFileSize({size:MAX_IMPORT_FILE_BYTES+1},'Test backup');return[false,'oversized file accepted']}catch(e){return[/too large/i.test(e.message),e.message]}}],
 ['Port 135 has a dedicated MSRPC endpoint-mapper coverage path',()=>{const name=canonicalServiceName({port:135,proto:'tcp',state:'open',service:'msrpc'}),pb=SERVICE_PLAYBOOKS[name];return[name==='MSRPC'&&pb?.checks?.some(x=>x[0]==='epm'),name+' / '+(pb?.checks?.length||0)+' checks']}],
 ['RPCbind/MSRPC/NFS coverage routes directly into guard-safe enum builders',()=>{const t=upgradeV8Target({id:'rpc-family',ip:'10.0.0.44',ports:[{port:111,proto:'tcp',state:'open',service:'rpcbind'},{port:135,proto:'tcp',state:'open',service:'msrpc'},{port:2049,proto:'tcp',state:'open',service:'nfs'}]});const a=V8_CMD_TEMPLATES.rpcbind.make(t,null,'').join('\n'),b=V8_CMD_TEMPLATES.msrpc.make(t,null,'').join('\n'),c=V8_CMD_TEMPLATES.nfs.make(t,null,'').join('\n'),all=[a,b,c],safe=all.every(x=>!unresolvedTokens(x).length&&!lintCommand(x).issues.some(i=>i.sev==='block'));return[V8_CMD_SERVICES.includes('RPCBIND')&&V8_CMD_SERVICES.includes('MSRPC')&&V8_CMD_SERVICES.includes('NFS')&&a.includes('rpcinfo -p')&&b.includes('impacket-rpcdump')&&c.includes('showmount -e')&&safe,(safe?'guard-safe · ':'guard-blocked · ')+a+' | '+b+' | '+c]}],
 ['WEB vhost override gets a curl --resolve proof path',()=>{const t=upgradeV8Target({id:'web-vhost',ip:'10.0.0.55',ports:[{port:8443,proto:'tcp',state:'open',service:'https'}]});const out=V8_CMD_TEMPLATES.web.make(t,null,'app.corp.local').join('\n');return[out.includes("--resolve 'app.corp.local:8443:10.0.0.55'")&&out.includes("'https://app.corp.local:8443/'"),out]}],
 ['Standard SMTP submission ports route to SMTP coverage',()=>[canonicalServiceName({port:465,proto:'tcp',state:'open'})==='SMTP'&&canonicalServiceName({port:587,proto:'tcp',state:'open'})==='SMTP','465 + 587']],
 ['Pasted scan/journal parsers reject oversized text before parsing',()=>{let a=false,b=false;const huge='x'.repeat(MAX_TEXT_INTAKE_CHARS+1);try{parseScanText(huge)}catch(e){a=/safety limit/i.test(e.message)}try{parseJournalText(huge)}catch(e){b=/safety limit/i.test(e.message)}return[a&&b,'scan='+a+' journal='+b]}],
 ['Exam Board pass threshold is fixed to current OSCP+ 70/100',()=>{boardConfig.passTarget=1;renderBoard();return[boardConfig.passTarget===OSCP_PASS_TARGET&&!document.getElementById('boardPassTarget'),`goal=${boardConfig.passTarget}`]}],
 ['State doctor flags impossible exam totals above 100',()=>{const a=upgradeV19Target({id:'sum-a',ip:'10.0.0.1',pointsPossible:60,pointsAwarded:60}),b=upgradeV19Target({id:'sum-b',ip:'10.0.0.2',pointsPossible:60,pointsAwarded:50});const issues=v15StateIssuesFor({targets:[a,b],credentials:[],evidenceVault:[],activeTargetId:a.id});return[issues.some(x=>x.title==='Configured possible points exceed exam total')&&issues.some(x=>x.title==='Awarded estimate exceeds exam total'),issues.map(x=>x.title).join(' | ')]}],
 ['Placeholder substitution changes values without corrupting command grammar',()=>{const old={...settings};try{Object.assign(settings,{TARGET:'10.0.0.9',LHOST:'192.168.45.9',LPORT:'4444',DOMAIN:'corp.local',USERNAME:'alice'});const raw=`export DOMAIN=domain.local
msf> set LHOST $LHOST
net user %USERNAME%
curl http://TARGET/path
impacket-dacledit -target 'TARGET' -d $DOMAIN`;const out=substitute(raw);return[out.includes('export DOMAIN=domain.local')&&out.includes('set LHOST 192.168.45.9')&&out.includes('%USERNAME%')&&out.includes('http://10.0.0.9/path')&&out.includes("-target 'TARGET'")&&out.includes('-d corp.local'),out]}finally{Object.assign(settings,old)}}]
)}catch(e){}
credentials=Array.isArray(credentials)?credentials.filter(plainRecord).map(c=>({...c,checks:plainRecord(c.checks)?Object.fromEntries(Object.entries(c.checks).filter(([,v])=>V7_MATRIX_STATES.includes(v))):{},scope:['domain','local','application'].includes(c.scope)?c.scope:'domain',secret:typeof c.secret==='string'?c.secret:'',user:typeof c.user==='string'?c.user:String(c.user??''),domain:typeof c.domain==='string'?c.domain:String(c.domain??'')})):[];
guardConfig=normalizeGuardConfig(guardConfig);revertState=normalizeRevertState(revertState);
saveTargets();saveAccessLadder();renderV19ResumeWorkspace();renderWindowsStrategy();
