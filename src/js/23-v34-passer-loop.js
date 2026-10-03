/* V34.43: research-backed exam operating loop from repeated 2026 passer patterns.
   Community heuristics are decision aids only; official OffSec rules remain authoritative. */
(function(root){
 'use strict';
 const MAX_RESET_ITEMS=12;
 const uniq=items=>{const seen=new Set();return items.filter(x=>{if(!x?.id||seen.has(x.id))return false;seen.add(x.id);return true})};
 const roleOf=t=>String(t?.role||'').toLowerCase();
 const portsOf=t=>(Array.isArray(t?.ports)?t.ports:[]).filter(p=>p&&(p.state==='open'||p.state==='open|filtered'||!p.state));
 const hasPort=(t,...ports)=>portsOf(t).some(p=>ports.includes(Number(p.port)));
 const signals=t=>[roleOf(t),String(t?.stage||'').toLowerCase(),...(Array.isArray(t?.signals)?t.signals.map(x=>String(x).toLowerCase()):[])].join(' ');
 function platformOf(t){
  try{const p=root.OSCP_SERVICE_CORE?.inferPlatform?.(t);if(p&&p!=='unknown')return p}catch(_){}
  const r=roleOf(t);if(/windows|dc|ad-/.test(r)||hasPort(t,88,135,139,445,3389,5985,5986))return'windows';if(/linux/.test(r)||hasPort(t,22,111,2049))return'linux';return'unknown';
 }
 function isAD(t){const s=signals(t);return /domain controller|\bdc\b|ad-member|active directory|kerberos|ldap/.test(s)||hasPort(t,88,389,636,3268,3269)}
 function hasWeb(t){return /\bweb\b|http|https/.test(signals(t))||hasPort(t,80,443,8000,8008,8080,8081,8443,8888)}
 function hasAuthenticatedSurface(t){return !!String(t?.creds||'').trim()||/credential|password|hash|ticket|cert|authenticated/.test(signals(t))}
 function hasFoothold(t){return !!t?.status?.foothold||/foothold|shell|user access|post-shell/.test(signals(t))}
 function hasPivot(t){return /pivot|internal|route|tunnel|ligolo|chisel/.test(signals(t))}
 function hasProof(t){return !!(t?.status?.local||t?.status?.proof)||/root|system|administrator|privileged/.test(signals(t))}
 function resetChecklist(t){
  const items=[];
  if(hasProof(t))items.push({id:'bank',kind:'closure',title:'Bank earned points before changing state',detail:'Capture the official proof correctly, submit it in the Control Panel, and record the exact path/command before further testing.',query:'[REPORT:PROOF]'});
  items.push(
   {id:'raw-scan',kind:'remote',title:'Re-read the raw scan from line one',detail:'Confirm full TCP discovery is complete, then fingerprint only confirmed opens. Re-check exact errors and banners instead of remembering the summary.',query:'[ENUM:NMAP]'},
   {id:'all-services',kind:'remote',title:'Touch every open service manually',detail:'Connect, browse, list, banner-grab or authenticate where justified. Do not stop enumeration at the first promising lead.',query:'service enumeration'},
   {id:'prioritize',kind:'decision',title:'List every plausible lead, then rank easy → hard',detail:'Write the evidence for each lead. Prefer the shortest evidence-backed path; park version-only or prerequisite-missing ideas.',query:'[EXPLOIT:GATE]'},
   {id:'output',kind:'decision',title:'Read decisive output twice',detail:'Classify the failing layer before changing tools: reachability, authentication, authorization, syntax, prerequisite or target state.',query:'[OUTPUT:TRIAGE]'}
  );
  if(hasWeb(t))items.push({id:'web-depth',kind:'web',title:'Re-run the web depth pass',detail:'Hostnames/vhosts, TLS names, redirects, source/JS/API, files/backups, auth/reset/session, parameters and upload paths.',query:'[WEB:ENUM]'});
  if(hasPort(t,21,139,445,1433,3306,5432,5985,5986)||hasAuthenticatedSurface(t))items.push({id:'inside-service',kind:'auth',title:'Enumerate authenticated services from the inside',detail:'Shares/files, users/groups, readable/writable locations, database permissions/config, sessions and remote-logon rights can matter more than the banner.',query:'[CREDS:FANOUT]'});
  if(hasAuthenticatedSurface(t))items.push({id:'cred-fanout',kind:'credential',title:'Re-run credential/material fan-out',detail:'Keep local vs domain identity explicit. Re-test the recovered password/hash/key/ticket/cert only against justified discovered services and hosts.',query:'[CREDS:FANOUT]'});
  if(isAD(t))items.push({id:'ad-context',kind:'ad',title:'Restart the AD chain from context, not tools',detail:'Domain/DC/DNS/time → SMB/LDAP visibility → users/groups/shares → SPNs/AS-REP → BloodHound/ACL/delegation → sessions/admin rights → new credential → graph again.',query:'[AD:FLOW]'});
  if(hasFoothold(t)){
   if(platformOf(t)==='windows')items.push({id:'win-local',kind:'local',title:'Re-enumerate Windows locally by hand first',detail:'Identity/groups/privileges, listeners, services/tasks, ACLs, registry/path/DLL, configs/history/saved material; then use helper scripts to widen coverage.',query:'[WIN:TREE]'});
   else if(platformOf(t)==='linux')items.push({id:'linux-local',kind:'local',title:'Re-enumerate Linux locally by hand first',detail:'id/sudo, SUID/caps, services/processes/listeners, cron/systemd, configs/history/keys, containers/NFS/custom apps; then widen with helper scripts.',query:'[LINUX:TREE]'});
   else items.push({id:'local-generic',kind:'local',title:'Re-enumerate the shell as a new information boundary',detail:'Identity, privileges, local-only listeners, services/tasks, writable privileged objects, configs/history and reusable credentials.',query:'privilege escalation'});
  }
  if(hasPivot(t))items.push({id:'pivot-proof',kind:'pivot',title:'Prove the pivot before blaming the target',detail:'Route exists → pivot host reaches destination IP → listener binding → DNS separately → rescan the internal host as a fresh target.',query:'[PIVOT:FLOW]'});
  items.push({id:'return-trigger',kind:'rotate',title:'Write a return trigger before rotating',detail:'Record what new evidence would justify coming back. After one bounded retry with no new evidence, rotate instead of tool-swapping.',query:'[TIME:ROTATE]'});
  return Object.freeze(uniq(items).slice(0,MAX_RESET_ITEMS).map(x=>Object.freeze({...x})));
 }
 function openingStatus(list){
  const ts=(Array.isArray(list)?list:[]).filter(Boolean),total=ts.length;
  const tcp=ts.filter(t=>!!t?.status?.tcp).length;
  const surfaced=ts.filter(t=>portsOf(t).length>0).length;
  const footholds=ts.filter(hasFoothold).length;
  const privileged=ts.filter(t=>!!t?.status?.proof||/root|system|administrator/.test(signals(t))).length;
  const banked=ts.filter(t=>!!(t?.status?.local||t?.status?.proof)).length;
  return Object.freeze({total,tcp,surfaced,footholds,privileged,banked,mapReady:total>0&&tcp===total});
 }
 root.OSCP_PASSER_CORE=Object.freeze({resetChecklist,openingStatus,platformOf,isAD,hasWeb,MAX_RESET_ITEMS});
 if(typeof document==='undefined')return;
 const $=id=>document.getElementById(id);
 const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e};
 const button=(label,fn,cls='btn')=>{const b=node('button',cls,label);b.type='button';b.addEventListener('click',fn);return b};
 function targetList(){try{return typeof targets!=='undefined'&&Array.isArray(targets)?targets:[]}catch(_){return[]}}
 function currentTarget(){try{return typeof activeTarget==='function'?activeTarget():null}catch(_){return null}}
 function go(view){try{switchView(view)}catch(_){}}
 function search(q){const i=$('globalSearch');if(i)i.value=q;try{switchView('searchView');renderSearch(q)}catch(_){if(i)i.dispatchEvent(new Event('input',{bubbles:true}))}}
 function installStyles(){if($('v34PasserLoopStyles'))return;const s=node('style');s.id='v34PasserLoopStyles';s.textContent=`
.v34PasserCard{border-color:#526f8c}.v34PasserSteps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:10px 0}.v34PasserStep{padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--panel2)}.v34PasserStep b{display:block;margin-bottom:4px}.v34PasserMetrics{display:flex;gap:8px;flex-wrap:wrap}.v34PasserMetric{padding:6px 9px;border:1px solid var(--line);border-radius:999px;font-size:11px}.v34FreshBackdrop{position:fixed;inset:0;z-index:10030;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;padding:18px}.v34FreshBackdrop.open{display:flex}.v34FreshDialog{width:min(980px,100%);max-height:92vh;overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;box-shadow:0 22px 60px rgba(0,0,0,.45)}.v34FreshHead{display:flex;gap:12px;justify-content:space-between;align-items:flex-start}.v34FreshSummary{margin:10px 0;padding:9px;border:1px solid var(--line);border-radius:9px;background:var(--panel2)}.v34FreshList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v34FreshItem{display:grid;grid-template-columns:auto 1fr;gap:8px;padding:9px;border:1px solid var(--line);border-radius:9px}.v34FreshItem b{display:block;margin-bottom:3px}.v34FreshItem input{margin-top:3px}.v34FreshStatus{font:800 12px ui-monospace,Consolas,monospace}.v34FreshRule{margin-top:10px;padding:9px;border-left:3px solid var(--warn);background:var(--panel2)}.v34FreshActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}@media(max-width:760px){.v34PasserSteps,.v34FreshList{grid-template-columns:1fr}.v34FreshHead{align-items:center}}
`;document.head.append(s)}
 let freshChecks=[];
 function updateFreshStatus(){const st=$('v34FreshStatus');if(!st)return;const n=freshChecks.filter(x=>x.checked).length;st.textContent=n+' / '+freshChecks.length+' re-checked'}
 function ensureFreshModal(){
  let back=$('v34FreshBackdrop');if(back)return back;back=node('div','v34FreshBackdrop');back.id='v34FreshBackdrop';back.setAttribute('role','dialog');back.setAttribute('aria-modal','true');back.setAttribute('aria-labelledby','v34FreshTitle');
  const d=node('div','v34FreshDialog'),head=node('div','v34FreshHead'),left=node('div'),title=node('h2','', 'Fresh-eyes reset · re-enumerate from zero');title.id='v34FreshTitle';left.append(title,node('div','muted','Use after progress stalls. Rebuild the model from evidence before changing tools again.'));const close=button('×',closeFresh);close.id='v34FreshClose';close.setAttribute('aria-label','Close fresh-eyes reset');head.append(left,close);d.append(head);
  const summary=node('div','v34FreshSummary');summary.id='v34FreshSummary';d.append(summary);const row=node('div','row');row.style.justifyContent='space-between';row.append(node('b','', 'State-aware re-check'),node('span','v34FreshStatus','0 / 0 re-checked'));row.lastChild.id='v34FreshStatus';d.append(row);const list=node('div','v34FreshList');list.id='v34FreshList';d.append(list);
  const rule=node('div','v34FreshRule');rule.append(node('b','', 'Community heuristic, not an OffSec rule: '),document.createTextNode('recent passers repeatedly describe breaks, rotation and full re-enumeration as recovery mechanisms. OffSec itself explicitly expects rest breaks, food, drink and sleep during the 23h45m window. If you have spent a long block with no new evidence, step away briefly, then run this list once before deciding whether to rotate.'));d.append(rule);
  const actions=node('div','v34FreshActions');actions.append(button('Service dossier',()=>{closeFresh();try{root.OSCP_V33?.openDossier?.()}catch(_){go('serviceRouterView')}}),button('Next actions',()=>{closeFresh();try{root.OSCP_NEXT_ACTIONS?.open?.()}catch(_){go('workspaceView')}}),button('Active work state',()=>{closeFresh();try{root.OSCP_V26?.openWork?.()}catch(_){go('workspaceView')}}),button('Board / rotate',()=>{closeFresh();go('boardView')},'btn primary'));d.append(actions);back.append(d);back.addEventListener('click',e=>{if(e.target===back)closeFresh()});document.body.append(back);return back
 }
 function renderFresh(){
  ensureFreshModal();const t=currentTarget(),list=$('v34FreshList'),summary=$('v34FreshSummary');if(!list||!summary)return;list.replaceChildren();freshChecks=[];
  const items=resetChecklist(t);summary.textContent=t?((t.ip||t.host||'unnamed target')+' · '+(t.role||'unknown')+' · '+portsOf(t).length+' observed endpoints · '+items.length+' reset checks'):'No active target — use the Exam Board / Scan Intake to build the target map first.';
  for(const item of items){const label=node('label','v34FreshItem'),cb=document.createElement('input');cb.type='checkbox';cb.addEventListener('change',updateFreshStatus);const body=node('span');body.append(node('b','',item.title),node('span','muted',item.detail));label.append(cb,body);label.addEventListener('dblclick',()=>{if(item.query){closeFresh();search(item.query)}});list.append(label);freshChecks.push(cb)}updateFreshStatus()
 }
 function openFresh(){const b=ensureFreshModal();renderFresh();b.classList.add('open');setTimeout(()=>$('v34FreshClose')?.focus(),0)}
 function closeFresh(){$('v34FreshBackdrop')?.classList.remove('open')}
 function refreshCard(){
  const s=openingStatus(targetList()),box=$('v34PasserMetrics');if(!box)return;box.replaceChildren();const vals=[['Targets',s.total],['Full TCP',s.tcp+'/'+s.total],['Ports mapped',s.surfaced+'/'+s.total],['Footholds',s.footholds],['Proof/local',s.banked]];for(const [k,v] of vals)box.append(node('span','v34PasserMetric',k+' · '+v));const state=$('v34PasserMapState');if(state){state.textContent=s.total===0?'Build the map before committing to a path.':s.mapReady?'Baseline map complete — choose the strongest evidence, not the favorite target.':'Baseline incomplete — finish full TCP discovery on every recorded target before deep rabbit-hole work.';state.className='muted'}
 }
 function ensureCard(){
  if($('v34PasserLoopCard'))return;const grid=$('simpleExamView')?.querySelector('.grid');if(!grid)return;const card=node('div','card span12 v34PasserCard');card.id='v34PasserLoopCard';const head=node('div','row');head.style.justifyContent='space-between';head.style.alignItems='flex-start';const left=node('div');left.append(node('h2','', 'Evidence-first exam loop'),node('div','muted','Synthesized from repeated 2026 pass reports: map first, follow methodology, reset from evidence, bank points, reproduce before leaving access. Community advice is not an exam rule.'));const actions=node('div','row');actions.append(button('Fresh-eyes reset',openFresh,'btn primary'),button('Exam Board',()=>go('boardView')),button('Evidence / report',()=>go('reportsView')));head.append(left,actions);card.append(head);
  const steps=node('div','v34PasserSteps');[['1 · MAP','Scan every recorded target before deep commitment.'],['2 · CHOOSE','Rank evidence; do not chase the first shiny lead.'],['3 · RESET','When stalled, re-enumerate from zero before tool swapping.'],['4 · BANK','Proof + Control Panel + exact path before curiosity.'],['5 · REPRODUCE','Make the compromise replayable from notes while access exists.']].forEach(([a,b])=>{const x=node('div','v34PasserStep');x.append(node('b','',a),document.createTextNode(b));steps.append(x)});card.append(steps);const metrics=node('div','v34PasserMetrics');metrics.id='v34PasserMetrics';card.append(metrics,node('div','muted',''));card.lastChild.id='v34PasserMapState';const anchor=grid.querySelector('.v25StateRouter');anchor?.insertAdjacentElement('afterend',card)||grid.prepend(card);refreshCard()
 }
 function decorateStuck(){const g=$('examResetModal')?.querySelector('.examResetGrid');if(!g||$('v34FreshFromStuck'))return;const b=button('Open state-aware fresh-eyes checklist →',()=>{try{$('examResetClose')?.click()}catch(_){}openFresh()},'btn primary');b.id='v34FreshFromStuck';const wrap=node('div','examResetStep');wrap.append(node('b','', 'PASSER PATTERN · RESTART FROM FACTS'),document.createTextNode('Recent passes repeatedly describe the breakthrough arriving after a break, rotation, or complete re-enumeration rather than another tool swap.'),document.createElement('br'),b);g.append(wrap)}
 function start(){installStyles();ensureFreshModal();ensureCard();decorateStuck();document.addEventListener('change',e=>{if(e.target?.closest?.('#targetsView,#workspaceView,#intakeView'))refreshCard()});document.addEventListener('click',e=>{if(e.target?.closest?.('#addTarget,.delTarget,#parsePastedScan,#importScanTargets'))setTimeout(refreshCard,30)});document.addEventListener('keydown',e=>{const tag=String(e.target?.tagName||'').toLowerCase(),editing=['input','textarea','select'].includes(tag)||e.target?.isContentEditable;if(e.key==='Escape'&&$('v34FreshBackdrop')?.classList.contains('open')){e.preventDefault();e.stopImmediatePropagation();closeFresh();return}if(!editing&&e.altKey&&!e.ctrlKey&&!e.metaKey&&String(e.key).toLowerCase()==='r'){e.preventDefault();e.stopImmediatePropagation();openFresh()}},true);try{if(typeof V16_SELF_TESTS!=='undefined')V16_SELF_TESTS.push(['V34.43 fresh-eyes reset core',()=>[resetChecklist({role:'dc',ports:[{port:88,state:'open'},{port:445,state:'open'}]}).some(x=>x.id==='ad-context'),'state-aware reset']],['V34.43 exam-map summary',()=>[typeof openingStatus==='function'&&openingStatus([{status:{tcp:true}}]).mapReady===true,'opening map']])}catch(_){}root.OSCP_PASSER_LOOP=Object.freeze({open:openFresh,close:closeFresh,refresh:refreshCard})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window!=='undefined'?window:globalThis);
