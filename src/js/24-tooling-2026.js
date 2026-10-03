/* V34.46: research-backed tooling defaults + pre-exam toolchain readiness. */
(function(root){
 'use strict';
 const ADDITIONS=Object.freeze([
  Object.freeze({id:'penelope',name:'Penelope (OSCP-safe mode)',category:'Shell Handling',tier:'conditional',trigger:'A raw listener works but you want stable session handling, logging, resize and multiple callbacks without changing the exploitation path.',command:'penelope -O -p $LPORT',fallback:'rlwrap -cAr nc -lvnp $LPORT; use socat only when PTY/TTY behavior needs it.',rule:'Use -O / --oscp-safe. Keep MCP and automatic-privesc/Traitor-style features out of the exam workflow; Meterpreter restrictions still apply independently.'}),
  Object.freeze({id:'rusthound-ce',name:'RustHound-CE',category:'Active Directory',tier:'conditional',trigger:'You need BloodHound CE collection from Linux/Windows and bloodhound-ce-python or SharpHound is inconvenient or failing for a tooling reason.',command:'rusthound-ce -d $DOMAIN -i $DC_IP -u "$USER@$DOMAIN" -p "$PASS" -o loot/rusthound -z',fallback:'bloodhound-ce-python first from Kali; SharpHound from a Windows foothold; validate important edges manually with LDAP/PowerView/NetExec.',rule:'Collector output is graph evidence, not proof that an edge is exploitable. Validate the exact ACE/right/prerequisite before modifying AD.'}),
  Object.freeze({id:'smbclient-ng',name:'smbclient-ng',category:'SMB',tier:'conditional',trigger:'You have authenticated SMB access and want faster interactive share browsing, tree/list/cat/get workflows or classic smbclient UX is slowing you down.',command:'smbclientng -H $IP -d "$DOMAIN" -u "$USER" -p "$PASS"',fallback:'smbclient remains the portable baseline; NetExec for auth/permissions; Impacket smbclient for Kerberos/DFS-specific behavior.',rule:'Packaging can expose smbclientng or smbclient-ng; verify local -h. List/read first and download only files needed for the objective.'}),
  Object.freeze({id:'rustscan',name:'RustScan',category:'Discovery',tier:'conditional',trigger:'You already know Nmap well and want a fast port-discovery front-end on a target where ordinary Nmap discovery is the bottleneck.',command:'rustscan -a $IP -- -Pn -n',fallback:'Nmap remains the source of truth: full TCP discovery followed by focused -sC -sV on confirmed ports.',rule:'Treat RustScan only as a discovery accelerator. Save/re-run Nmap output and do not confuse a fast port list with service enumeration.'})
 ]);
 const LADDERS=Object.freeze([
  Object.freeze({phase:'Discovery',primary:'Nmap',fallback:'tcpdump / tshark',specialist:'RustScan only as an optional port-discovery accelerator',why:'One authoritative map beats multiple overlapping scanners.'}),
  Object.freeze({phase:'Web',primary:'curl + Burp Community + feroxbuster',fallback:'ffuf',specialist:'Gobuster / WhatWeb / WPScan only when the stack justifies them',why:'Use ffuf for vhosts/parameters; use recursive content discovery for paths; keep manual requests visible.'}),
  Object.freeze({phase:'SMB',primary:'NetExec + smbclient',fallback:'smbclient-ng',specialist:'rpcclient / Impacket smbclient',why:'Separate authentication, authorization and file access instead of swapping clients blindly.'}),
  Object.freeze({phase:'AD graph',primary:'BloodHound CE + bloodhound-ce-python',fallback:'RustHound-CE',specialist:'SharpHound from Windows',why:'Re-collect after new identities, then validate the specific edge manually.'}),
  Object.freeze({phase:'AD actions',primary:'NetExec + Impacket',fallback:'PowerView / LDAP',specialist:'BloodyAD / Certipy only for a proven ACL or AD CS path',why:'Read first; use the smallest modifying action only after rights/prerequisites are proven.'}),
  Object.freeze({phase:'Linux privesc',primary:'manual checks + LinPEAS',fallback:'pspy',specialist:'strace / ltrace for custom binaries',why:'Automation finds leads; ownership, writability, trigger and execution context prove the path.'}),
  Object.freeze({phase:'Windows privesc',primary:'manual checks + PrivescCheck',fallback:'WinPEAS',specialist:'Seatbelt / exact token technique only when context fits',why:'PrivescCheck remains actively maintained; combine tools, but read their output instead of collecting more output.'}),
  Object.freeze({phase:'Shell handling',primary:'Penelope -O or rlwrap/nc',fallback:'socat',specialist:'Evil-WinRM / native remoting when WinRM is the proven access path',why:'A stable interactive shell is the goal; the handler is not the exploit.'}),
  Object.freeze({phase:'Pivoting',primary:'Ligolo-ng',fallback:'SSH forwarding',specialist:'Chisel / proxychains when topology or protocol support demands it',why:'Prefer a real route; prove IP reachability before debugging DNS or application tools.'}),
  Object.freeze({phase:'Cracking',primary:'Hashcat',fallback:'John',specialist:'custom local rules/wordlists',why:'Keep captured credential material local; do not upload exam hashes to third-party services.'}),
  Object.freeze({phase:'Exploit research',primary:'SearchSploit + source/advisory review',fallback:'browser/GitHub/vendor advisory',specialist:'Metasploit only under the current one-target restriction',why:'Version strings create candidates; target evidence and prerequisites decide exploitability.'})
 ]);
 const DEFAULT_IDS=Object.freeze(['nmap','curl','feroxbuster','ffuf','burp','nxc','smbclient','ldapsearch','bloodhound','impacket-kerberos','impacket-remote','evil-winrm','hashcat','linpeas','privesccheck','ligolo','penelope','listeners']);
 const READINESS_GROUPS=Object.freeze([
  Object.freeze({job:'Port discovery',level:'must',any:Object.freeze(['nmap']),why:'Authoritative TCP/UDP mapping must work before the exam.'}),
  Object.freeze({job:'HTTP baseline',level:'must',any:Object.freeze(['curl']),why:'Manual request/response inspection without depending on a browser.'}),
  Object.freeze({job:'Web content discovery',level:'must',any:Object.freeze(['feroxbuster','ffuf','gobuster']),why:'At least one well-practiced content/vhost discovery tool.'}),
  Object.freeze({job:'Intercepting proxy',level:'must',any:Object.freeze(['burpsuite']),why:'Burp Community is an allowed manual web-testing example in the current guide.'}),
  Object.freeze({job:'SMB / AD auth',level:'must',any:Object.freeze(['nxc','netexec']),why:'One maintained NetExec entrypoint for auth/permissions/context.'}),
  Object.freeze({job:'SMB browsing',level:'must',any:Object.freeze(['smbclient','smbclientng','smbclient-ng']),why:'You need a predictable way to list/read shares after auth succeeds.'}),
  Object.freeze({job:'LDAP query',level:'must',any:Object.freeze(['ldapsearch']),why:'Manual RootDSE/object validation is the fallback when wrappers disagree.'}),
  Object.freeze({job:'Kerberos helpers',level:'must',any:Object.freeze(['impacket-GetNPUsers','GetNPUsers.py']),why:'AS-REP/user validation path should not depend on installing tooling mid-exam.'}),
  Object.freeze({job:'Remote Windows shell',level:'must',any:Object.freeze(['evil-winrm','impacket-wmiexec','wmiexec.py']),why:'Have one known-good remote shell path for proven rights.'}),
  Object.freeze({job:'Offline cracking',level:'must',any:Object.freeze(['hashcat','john']),why:'Keep hashes local; at least one cracker must be ready.'}),
  Object.freeze({job:'Exploit lookup',level:'must',any:Object.freeze(['searchsploit']),why:'Fast local PoC/source discovery reduces browser dependency.'}),
  Object.freeze({job:'Shell listener',level:'must',any:Object.freeze(['penelope','rlwrap','nc','ncat']),why:'A stable callback handler must be available before exploitation.'}),
  Object.freeze({job:'AD graph collection',level:'recommended',any:Object.freeze(['bloodhound-ce-python','rusthound-ce']),why:'Pre-stage a CE-compatible collector; SharpHound can remain the Windows-side fallback.'}),
  Object.freeze({job:'AD CS',level:'recommended',any:Object.freeze(['certipy','certipy-ad']),why:'Useful only when AD CS exists, but install/verify it before exam day.'}),
  Object.freeze({job:'Pivot fallback',level:'recommended',any:Object.freeze(['ligolo-proxy','chisel','ssh']),why:'Have at least one route/forward implementation you have already practiced.'})
 ]);
 const INVENTORY_COMMANDS=Object.freeze([...new Set(READINESS_GROUPS.flatMap(g=>g.any))].sort());
 function decision(toolError='',hasEvidence=false){
  const err=String(toolError||'').trim();
  if(!err)return Object.freeze({step:'stay',message:'Keep the primary tool until you have an exact limitation or contradictory evidence.'});
  if(!hasEvidence)return Object.freeze({step:'validate',message:'Read the exact error/output and manually validate the failing layer before changing tools.'});
  return Object.freeze({step:'fallback',message:'Try one fallback implementation for the same hypothesis; do not fan out into multiple tools at once.'});
 }
 function normalizedToolNames(preflight){
  const set=new Set();
  const rows=Array.isArray(preflight?.tools)?preflight.tools:[];
  for(const item of rows){
   if(!item?.present)continue;
   const raw=String(item.tool||'').trim().toLowerCase();
   const path=String(item.path||'').trim().replace(/\\/g,'/');
   if(raw)set.add(raw);
   if(path)set.add(path.split('/').pop().toLowerCase());
  }
  return set;
 }
 function readinessFromPreflight(preflight){
  const known=!!(preflight&&Array.isArray(preflight.tools));
  const present=normalizedToolNames(preflight);
  const rows=READINESS_GROUPS.map(g=>{
   const matched=g.any.find(x=>present.has(String(x).toLowerCase()))||'';
   return Object.freeze({...g,known,ok:known&&!!matched,matched});
  });
  const must=rows.filter(x=>x.level==='must'),rec=rows.filter(x=>x.level==='recommended');
  return Object.freeze({known,rows:Object.freeze(rows),mustReady:must.filter(x=>x.ok).length,mustTotal:must.length,recommendedReady:rec.filter(x=>x.ok).length,recommendedTotal:rec.length});
 }
 function inventoryScript(){
  const specs=INVENTORY_COMMANDS.map(cmd=>[cmd,READINESS_GROUPS.some(g=>g.level==='must'&&g.any.includes(cmd))?'core':'optional']);
  const payload=JSON.stringify(specs);
  return [
   "python3 - <<'PY' > oscp-tool-preflight.json",
   "import shutil, json, datetime, os",
   "spec="+payload,
   "tools=[]",
   "for cmd,priority in spec:",
   "    path=shutil.which(cmd)",
   "    tools.append({'tool':cmd,'priority':priority,'present':bool(path),'path':path or '','version':''})",
   "out={'generated':datetime.datetime.now(datetime.timezone.utc).isoformat(),'host':os.uname().nodename,'tools':tools}",
   "print(json.dumps(out,indent=2))",
   "PY",
   "cat oscp-tool-preflight.json",
   "# Import oscp-tool-preflight.json in Session → Tool preflight. This script only checks local command presence; it installs nothing and makes no network requests."
  ].join('\n');
 }
 root.OSCP_TOOLING_2026_CORE=Object.freeze({ADDITIONS,LADDERS,DEFAULT_IDS,READINESS_GROUPS,INVENTORY_COMMANDS,decision,readinessFromPreflight,inventoryScript});
 if(typeof document==='undefined')return;
 const $=id=>document.getElementById(id);
 function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
 function installStyles(){
  if($('tooling2026Styles'))return;
  const s=node('style');s.id='tooling2026Styles';s.textContent=`
#tooling2026Desk{margin:0 0 12px}.tooling2026Head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.tooling2026Grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.tooling2026Row{border:1px solid var(--line);border-radius:10px;padding:10px;min-width:0}.tooling2026Row h3{margin:0 0 7px;font-size:14px}.tooling2026Path{display:grid;grid-template-columns:82px minmax(0,1fr);gap:5px;font-size:12px}.tooling2026Path b{color:var(--muted)}.tooling2026Why{margin-top:7px;font-size:12px;color:var(--muted)}.toolingSwitchGate{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.toolingSwitchGate>div{border:1px dashed var(--line);border-radius:9px;padding:9px;font-size:12px}.toolingAvoid{margin-top:10px;padding:9px;border-left:3px solid var(--warn);background:color-mix(in srgb,var(--warn) 8%,transparent);font-size:12px}.toolingResearch{margin-top:9px;font-size:11px;color:var(--muted)}.toolingReadiness{margin-top:10px;border-top:1px solid var(--line);padding-top:10px}.toolingReadiness summary{cursor:pointer;font-weight:700}.toolingReadinessHead{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;margin:9px 0}.toolingReadyGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.toolingReadyRow{border:1px solid var(--line);border-radius:8px;padding:8px;display:grid;grid-template-columns:24px minmax(0,1fr);gap:7px;align-items:start;font-size:12px}.toolingReadyRow b{display:block}.toolingReadyMeta{color:var(--muted);font-size:11px;margin-top:2px}.toolingReadyUnknown{color:var(--muted)}.toolingReadyBad{color:var(--bad)}.toolingReadyGood{color:var(--good)}.toolingReadyWarn{color:var(--warn)}
@media(max-width:900px){.tooling2026Grid,.toolingSwitchGate,.toolingReadyGrid{grid-template-columns:1fr}}
`;
  document.head.appendChild(s);
 }
 function installToolRows(){
  if(typeof TOOL_ARSENAL==='undefined')return;
  for(const item of ADDITIONS){if(!TOOL_ARSENAL.some(x=>x.id===item.id))TOOL_ARSENAL.push({...item})}
  if(typeof BEST_TOOL_IDS!=='undefined')BEST_TOOL_IDS.add('penelope');
 }
 function syncLabels(){
  const n=typeof BEST_TOOL_IDS!=='undefined'?BEST_TOOL_IDS.size:null;if(!n)return;
  const hero=$('toolArsenalView')?.querySelector('.hero .chip');if(hero&&/RECOMMENDED/i.test(hero.textContent||''))hero.textContent=n+' RECOMMENDED';
  for(const span of document.querySelectorAll('#simpleExamView .simpleLinks .tiny')){if(/recommended tools first/i.test(span.textContent||''))span.textContent=n+' recommended tools first'}
 }
 function importedPreflight(){
  try{return typeof preflightData!=='undefined'?preflightData:null}catch(_){return null}
 }
 function renderReadiness(){
  const rootEl=$('toolingReadinessRows'),status=$('toolingReadinessStatus');if(!rootEl||!status)return;
  const r=readinessFromPreflight(importedPreflight());
  if(!r.known)status.textContent='No Kali inventory imported · readiness unknown';
  else status.textContent=`must-have ${r.mustReady}/${r.mustTotal} · recommended ${r.recommendedReady}/${r.recommendedTotal}`;
  rootEl.replaceChildren(...r.rows.map(row=>{
   const item=node('div','toolingReadyRow');
   const icon=node('div',!row.known?'toolingReadyUnknown':row.ok?'toolingReadyGood':row.level==='must'?'toolingReadyBad':'toolingReadyWarn',!row.known?'○':row.ok?'✓':'!');
   const body=node('div');body.append(node('b','',row.job));
   const meta=node('div','toolingReadyMeta',row.known?(row.ok?`Ready via ${row.matched}`:`Missing: any of ${row.any.join(' / ')}`):`Need any of ${row.any.join(' / ')}`);
   body.append(meta);item.append(icon,body);return item;
  }));
 }
 async function copyInventory(){
  const text=inventoryScript();let ok=false;
  try{if(typeof copyText==='function')ok=await copyText(text);else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);ok=true}}catch(_){}
  if(typeof toast==='function')toast(ok?'Kali readiness script copied':'Copy blocked — select/copy the script from Full Reference or browser devtools');
 }
 function installDesk(){
  const view=$('toolArsenalView');if(!view||$('tooling2026Desk'))return;
  const card=node('section','card');card.id='tooling2026Desk';card.setAttribute('aria-labelledby','tooling2026Title');
  const head=node('div','tooling2026Head');const hwrap=node('div');const h=node('h2','', '2026 exam-time tool defaults');h.id='tooling2026Title';hwrap.append(h,node('div','muted','Use one primary tool per question. Switch only when an exact error, unsupported feature or conflicting evidence proves a limitation.'));
  const chips=node('div','row');for(const t of ['PRIMARY FIRST','ONE FALLBACK','SPECIALIST LAST'])chips.append(node('span','chip',t));head.append(hwrap,chips);card.append(head);
  const grid=node('div','tooling2026Grid');
  for(const row of LADDERS){const r=node('article','tooling2026Row');r.append(node('h3','',row.phase));const p=node('div','tooling2026Path');for(const [k,v] of [['Primary',row.primary],['Fallback',row.fallback],['Specialist',row.specialist]]){p.append(node('b','',k),node('span','',v))}r.append(p,node('div','tooling2026Why',row.why));grid.append(r)}card.append(grid);
  const gate=node('div','toolingSwitchGate');[['1 · Read','Capture the exact error/status and re-read the relevant output before touching another tool.'],['2 · Validate','Test the failing layer manually: route, DNS, auth, authorization, protocol, prerequisite or syntax.'],['3 · One fallback','Try one alternate implementation for the same hypothesis. If evidence still does not improve, park/rotate.']].forEach(([a,b])=>{const d=node('div');d.append(node('b','',a),document.createTextNode(' — '+b));gate.append(d)});card.append(gate);
  const avoid=node('div','toolingAvoid');avoid.append(node('b','', 'Do not make these defaults: '),document.createTextNode('Nuclei/mass-scanner workflows, broad spraying, AutoRecon as a substitute for reading output, or random Potato/tool swapping. Current OffSec rules prohibit mass vulnerability scanning and automatic exploitation; manual, service-specific enumeration remains the safer exam default.'));card.append(avoid);
  const ready=node('details','toolingReadiness');ready.open=true;
  const sum=node('summary','', 'Pre-exam Kali toolchain readiness');
  const readyHead=node('div','toolingReadinessHead');const status=node('span','chip','No Kali inventory imported');status.id='toolingReadinessStatus';
  const actions=node('div','row');const copy=node('button','btn','Copy readiness script');copy.id='toolingCopyInventory';copy.type='button';const imp=node('button','btn','Import JSON');imp.id='toolingImportInventory';imp.type='button';const compat=node('button','btn','Compatibility');compat.id='toolingOpenCompat';compat.type='button';actions.append(copy,imp,compat);readyHead.append(status,actions);
  const note=node('div','tiny','Run the copied script on the exact Kali VM you plan to use. It performs local command-presence checks only—no installs, updates or network requests—then creates oscp-tool-preflight.json.');
  const readyRows=node('div','toolingReadyGrid');readyRows.id='toolingReadinessRows';ready.append(sum,readyHead,note,readyRows);card.append(ready);
  card.append(node('div','toolingResearch','Reviewed 3 Oct 2026 against current OffSec restrictions and recent 2026 pass reports. Installed -h/--help and live OffSec rules remain authoritative.'));
  const firstCard=view.querySelector('.hero')?.nextElementSibling;if(firstCard)firstCard.after(card);else view.prepend(card);
  copy.addEventListener('click',copyInventory);
  imp.addEventListener('click',()=>{const input=$('importPreflight');if(input)input.click();else if(typeof switchView==='function')switchView('sessionView')});
  compat.addEventListener('click',()=>{if(typeof switchView==='function')switchView('compatView')});
  const input=$('importPreflight');if(input)input.addEventListener('change',()=>{setTimeout(renderReadiness,400)});
  renderReadiness();
 }
 function start(){installStyles();installToolRows();installDesk();syncLabels();try{if(typeof initToolArsenal==='function')initToolArsenal();else if(typeof renderToolArsenal==='function')renderToolArsenal()}catch(_){}
  try{if(typeof V16_SELF_TESTS!=='undefined')V16_SELF_TESTS.push(
   ['V34.46 tooling additions unique',()=>{const ids=ADDITIONS.map(x=>x.id);return[new Set(ids).size===ids.length,ids.join(',')]}],
   ['V34.46 Penelope uses OSCP-safe mode',()=>[ADDITIONS.find(x=>x.id==='penelope')?.command.includes('-O')===true,ADDITIONS.find(x=>x.id==='penelope')?.command||'missing']],
   ['V34.46 Nuclei is not a recommended default',()=>[typeof BEST_TOOL_IDS==='undefined'||!BEST_TOOL_IDS.has('nuclei'),'nuclei not recommended']],
   ['V34.46 readiness inventory is local-only',()=>{const s=inventoryScript();return[!/(?:apt|pip|wget)/.test(s)&&s.includes('shutil.which')&&!/https?:\/\//.test(s),'presence-only inventory']}]
  )}catch(_){}
 }
 root.OSCP_TOOLING_2026=Object.freeze({refreshReadiness:renderReadiness,inventoryScript,readinessFromPreflight});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window!=='undefined'?window:globalThis);
