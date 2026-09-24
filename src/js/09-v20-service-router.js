
(()=>{
 const CATALOG=[
  {name:'FTP',ports:[21],priority:20,first:'Anonymous/default login → recursive listing → readable/writable paths → banners only after access checks.',truth:'Use ftp/lftp or raw protocol behavior once; distinguish LIST denial from login denial.',fallback:'If one client misbehaves, confirm passive/active mode and TLS before changing tools.',query:'FTP anonymous writable'},
  {name:'SSH',ports:[22],priority:55,first:'Fingerprint auth methods and host role; use recovered credentials/keys deliberately. Do not brute force.',truth:'ssh -vvv can explain key exchange, auth method, key permission and host-key problems.',fallback:'If auth fails, distinguish username, key format/permissions, algorithm mismatch and network policy.',query:'SSH keys authorized_keys'},
  {name:'SMTP',ports:[25,465,587],priority:45,first:'Banner → capabilities → VRFY/EXPN only if supported → relay/mail context → usernames only when evidence justifies it.',truth:'EHLO manually and read extensions; STARTTLS changes what the server exposes.',fallback:'If a script says closed/filtered, verify TLS mode and direct connection before discarding.',query:'SMTP enumeration'},
  {name:'DNS',ports:[53],priority:28,first:'Identify nameserver/domain → targeted records → zone transfer once → use discovered names to drive web/AD.',truth:'dig +short / dig axfr gives protocol-level truth.',fallback:'If AXFR fails, move on; query known names/records rather than blind guessing forever.',query:'DNS zone transfer dig'},
  {name:'HTTP/S',ports:[80,443,8000,8008,8080,8081,8443,8888,3000,5000],priority:5,first:'Open manually → redirects/title/tech → vhost/hostname → content/routes/backups/source → auth/session/input → exact version last.',truth:'curl -i/-k plus browser/Burp Free; inspect response headers/body and redirects yourself.',fallback:'If content discovery is empty, try the hostname/vhost, extensions, source/maps/backups and app-specific routes before another wordlist.',query:'web enumeration vhost backups source'},
  {name:'Kerberos',ports:[88,464],priority:12,first:'Treat as AD signal: resolve domain/DC/FQDN/time first, then validate only the identity path you actually have.',truth:'klist / impacket helpers with explicit domain and DC context; clock skew is a first-class failure mode.',fallback:'If Kerberos fails, check DNS, realm, FQDN/SPN and time before assuming credentials are wrong.',query:'Kerberos clock skew SPN'},
  {name:'RPC/SMB',ports:[135,139,445],priority:8,first:'Anonymous/guest → shares → read/write → users/groups/domain clues → known creds with explicit local/domain scope → admin is a separate proof.',truth:'smbclient/rpcclient/native protocol check; list one share manually and read permissions.',fallback:'If NetExec disagrees with reality, validate auth scope, SMB dialect/signing and one smbclient/native action before moving on.',query:'SMB enumeration rpcclient shares'},
  {name:'LDAP',ports:[389,636,3268,3269],priority:14,first:'Confirm naming context/domain/DC → anonymous or known bind → users/groups/computers/SPNs/ACL questions driven by evidence.',truth:'ldapsearch with explicit base DN/FQDN is the manual truth check.',fallback:'Fix bind identity, DNS/FQDN, TLS and time before swapping enumeration frameworks.',query:'LDAP ldapsearch base DN'},
  {name:'WinRM',ports:[5985,5986],priority:18,first:'Treat as execution surface only after you have a justified Windows credential/token path.',truth:'Test one known identity and then prove resulting context with whoami /all.',fallback:'If auth works elsewhere but WinRM fails, check group/policy, transport, hostname and local/domain scope.',query:'WinRM evil-winrm'},
  {name:'MSSQL',ports:[1433],priority:24,first:'Known/default creds only when justified → enumerate DBs/logins/linked context → identify OS execution primitive only after permissions prove it.',truth:'impacket-mssqlclient or sqlcmd-style query to prove identity and role.',fallback:'If login succeeds but commands fail, enumerate server/database roles before trying a different client.',query:'MSSQL xp_cmdshell linked servers'},
  {name:'MySQL',ports:[3306],priority:30,first:'Known/default creds only when justified → databases/users/files/plugins → local config/credential correlation.',truth:'mysql client query for USER(), VERSION(), grants and schemas.',fallback:'Distinguish network auth plugin/TLS errors from bad credentials before changing tools.',query:'MySQL enumeration grants'},
  {name:'PostgreSQL',ports:[5432],priority:30,first:'Known/default creds only when justified → roles/databases → file/program capabilities depend on role/config.',truth:'psql identity/version/role queries.',fallback:'Check pg_hba/auth method, database name and TLS mode before assuming credential failure.',query:'PostgreSQL enumeration'},
  {name:'RDP',ports:[3389],priority:48,first:'Use only with known/recovered credentials; note domain/local identity and whether interactive logon is actually allowed.',truth:'One xfreerdp connection with explicit domain/local context is enough to prove the access path.',fallback:'Auth success elsewhere does not imply RDP logon rights; inspect error before retrying.',query:'RDP credentials NLA'},
  {name:'SNMP',ports:[161],protocols:['udp'],priority:34,first:'Usually UDP: if discovered, test common read community only where justified → system/process/network/user clues → correlate, do not dump endlessly.',truth:'snmpwalk on a small OID branch first proves access and version.',fallback:'If timeout, verify UDP reachability/version/community before larger walks.',query:'SNMP enumeration'},
  {name:'NFS',ports:[111,2049],priority:22,first:'Exports → mount options → readable/writable data → UID/GID mapping → secrets/source/backups.',truth:'showmount then a read-only mount first where possible.',fallback:'RPC visibility does not guarantee mount permission; inspect export restrictions and source host rules.',query:'NFS showmount no_root_squash'}
 ];
 const $=id=>document.getElementById(id);
 function endpointKey(e){return String(e.port)+'/'+String(e.proto||'tcp')}
 function endpointLabel(e){return endpointKey(e)+(e.service?' '+e.service:'')+(e.state==='open|filtered'?' ?':'')}
 function addEndpoint(map,e){
  const port=Number(e.port),proto=String(e.proto||'tcp').toLowerCase(),state=String(e.state||'open').toLowerCase();
  if(!Number.isInteger(port)||port<1||port>65535||!['tcp','udp'].includes(proto)||!['open','open|filtered'].includes(state))return;
  const key=port+'/'+proto,prev=map.get(key)||{};
  map.set(key,{port,proto,state:prev.state==='open'||state==='open'?'open':'open|filtered',service:String(e.service||prev.service||'').trim(),detail:String(e.detail||prev.detail||'').trim()});
 }
 function parseServices(text){
  const raw=String(text||'').trim(),map=new Map();let mode='none';
  if(!raw)return{endpoints:[],mode,recognized:false};
  if(/<nmaprun\b/i.test(raw)&&typeof DOMParser!=='undefined'){
   try{
    const doc=new DOMParser().parseFromString(raw,'application/xml');
    if(!doc.querySelector('parsererror')){
     doc.querySelectorAll('port').forEach(p=>{const st=p.querySelector('state')?.getAttribute('state')||'',svc=p.querySelector('service');addEndpoint(map,{port:p.getAttribute('portid'),proto:p.getAttribute('protocol'),state:st,service:svc?.getAttribute('name')||'',detail:[svc?.getAttribute('product'),svc?.getAttribute('version'),svc?.getAttribute('extrainfo')].filter(Boolean).join(' ')})});
     if(map.size)mode='Nmap XML';
    }
   }catch(_){}
  }
  if(!map.size){
   for(const m of raw.matchAll(/(\d{1,5})\/(open(?:\|filtered)?)\/(tcp|udp)\/\/([^\/\s]*)[^,\n]*/gi)){addEndpoint(map,{port:m[1],state:m[2],proto:m[3],service:m[4]});mode='Nmap grepable'}
  }
  if(!map.size){
   for(const line of raw.split(/\r?\n/)){
    const m=line.match(/^\s*(\d{1,5})\/(tcp|udp)\s+(open(?:\|filtered)?)\s*([^\s]*)?\s*(.*)$/i);
    if(m){addEndpoint(map,{port:m[1],proto:m[2],state:m[3],service:m[4],detail:m[5]});mode='Nmap normal'}
   }
  }
  if(!map.size){
   for(const m of raw.matchAll(/Discovered\s+open\s+port\s+(\d{1,5})\/(tcp|udp)\b/gi)){addEndpoint(map,{port:m[1],proto:m[2],state:'open'});mode='Masscan'}
  }
  if(!map.size){
   for(const m of raw.matchAll(/\bOpen\s+[^\s:]+:(\d{1,5})\b/gi)){addEndpoint(map,{port:m[1],proto:'tcp',state:'open'});mode='RustScan'}
  }
  if(!map.size){
   const compact=raw.replace(/[;\n]+/g,',').replace(/\s+/g,',').replace(/,+/g,',').replace(/^,|,$/g,'');
   if(compact&&compact.split(',').every(t=>/^\d{1,5}(?:\/(?:tcp|udp))?$/i.test(t))){
    compact.split(',').forEach(t=>{const m=t.match(/^(\d{1,5})(?:\/(tcp|udp))?$/i);addEndpoint(map,{port:m[1],proto:m[2]||'tcp',state:'open'})});mode='explicit list'
   }
  }
  const endpoints=[...map.values()].sort((a,b)=>a.port-b.port||a.proto.localeCompare(b.proto));
  return{endpoints,mode,recognized:endpoints.length>0}
 }
 function parsePorts(text){return[...new Set(parseServices(text).endpoints.map(e=>e.port))].sort((a,b)=>a-b)}
 function esc(s){return window.OSCP_UTILS.escapeHtml(s)}
 function search(q){const g=$('globalSearch');if(!g)return;g.value=q;try{switchView('searchView');renderSearch(q)}catch(e){g.dispatchEvent(new Event('input',{bubbles:true}))}}
 function matchCatalog(x,e){return x.ports.includes(e.port)&&(!Array.isArray(x.protocols)||x.protocols.includes(e.proto))}
 function classify(input){
  const eps=(input||[]).map(x=>typeof x==='number'?{port:x,proto:'tcp',state:'open',service:''}:x);
  return CATALOG.map(x=>({...x,hit:eps.filter(e=>matchCatalog(x,e))})).filter(x=>x.hit.length).sort((a,b)=>a.priority-b.priority)
 }
 function roleHints(endpoints){
  const ports=[...new Set((endpoints||[]).map(e=>e.port))],h=[],has=p=>ports.includes(p),webs=[80,443,8000,8008,8080,8081,8443,8888,3000,5000].filter(has);
  if((has(88)||has(389)||has(636))&&has(445))h.push('<b>Likely AD/Windows role:</b> establish domain, DC/FQDN, DNS and time early; keep local vs domain credentials separate.');
  if(has(445)&&(has(5985)||has(3389)))h.push('<b>Windows access ladder:</b> SMB authentication, admin rights, WinRM/RDP logon rights and code execution are separate results.');
  if(webs.length>=2)h.push('<b>Multi-web host:</b> compare titles, redirects, certificates, Host handling and app fingerprints across ports before duplicate discovery.');
  if(has(22)&&webs.length)h.push('<b>Web + SSH:</b> prioritize source/config/backups and recovered keys/credentials; do not attack SSH just because it is exposed.');
  return h
 }
 function renderParseSummary(parsed){
  const el=$('serviceParseSummary');if(!el)return;
  if(!String($('serviceRouterInput')?.value||'').trim()){el.className='serviceParseSummary muted';el.textContent='Parser waits for a strict port list or recognized scan format.';return}
  if(!parsed.recognized){el.className='serviceParseSummary warn';el.textContent='No real open-port records recognized. Unrelated numbers, IP octets, versions and timing values are intentionally ignored. Use a strict list such as 22,80,445 or paste Nmap/Masscan output.';return}
  const tcp=parsed.endpoints.filter(e=>e.proto==='tcp').length,udp=parsed.endpoints.filter(e=>e.proto==='udp').length,uncertain=parsed.endpoints.filter(e=>e.state==='open|filtered').length;
  el.className='serviceParseSummary good';el.innerHTML='<b>'+esc(parsed.mode)+'</b> · '+parsed.endpoints.length+' endpoint'+(parsed.endpoints.length===1?'':'s')+' · TCP '+tcp+' · UDP '+udp+(uncertain?' · '+uncertain+' open|filtered':'')
 }
 function render(){
  const parsed=parseServices($('serviceRouterInput')?.value||''),endpoints=parsed.endpoints,rows=classify(endpoints),unknown=endpoints.filter(e=>!CATALOG.some(x=>matchCatalog(x,e))),box=$('serviceQueue'),q=$('serviceFirstPassQueue'),rh=$('serviceRoleHints');
  renderParseSummary(parsed);
  if(rh)rh.innerHTML=roleHints(endpoints).map(x=>'<div class="serviceRoleHint">'+x+'</div>').join('');
  if(!endpoints.length){if(box)box.innerHTML='<div class="muted">No recognized open endpoints yet.</div>';if(q)q.textContent='Paste a strict port list or recognized scan output.';return}
  if(box)box.innerHTML=rows.map(x=>'<div class="serviceCard"><h3>'+esc(x.name)+' <span class="ports">'+x.hit.map(e=>'<span class="endpointPill '+(e.proto==='udp'?'udp ':'')+(e.state==='open|filtered'?'uncertain':'')+'">'+esc(endpointLabel(e))+'</span>').join('')+'</span></h3><div class="serviceAction"><b>First pass</b><br>'+esc(x.first)+'</div><div class="manualTruth"><b>Manual truth</b><br>'+esc(x.truth)+'</div><div class="fallback"><b>If tooling disagrees</b><br>'+esc(x.fallback)+'</div><div class="row"><button class="btn" type="button" data-service-search="'+esc(x.query)+'">Search reference →</button></div></div>').join('')+
   (unknown.length?'<div class="serviceCard"><h3>Other endpoints <span class="ports">'+unknown.map(e=>'<span class="endpointPill '+(e.proto==='udp'?'udp ':'')+'">'+esc(endpointLabel(e))+'</span>').join('')+'</span></h3><div class="serviceAction">Identify the protocol/product manually: banner, TLS, HTTP probe, product role and access context. Search by the observed product/service name.</div><div class="fallback">Do not map an unknown port number directly to a CVE.</div></div>':'');
  const lines=['SERVICE-FIRST FIRST PASS','Parsed as: '+parsed.mode,'Endpoints: '+endpoints.map(endpointLabel).join(', '),''];
  rows.forEach((x,i)=>lines.push((i+1)+'. '+x.name+' ['+x.hit.map(endpointLabel).join(', ')+']\n   '+x.first+'\n   Truth: '+x.truth+'\n   Fallback: '+x.fallback));
  if(unknown.length)lines.push('\nOther endpoints ['+unknown.map(endpointLabel).join(', ')+']\n   Identify protocol/product manually, then route by evidence.');
  lines.push('\nSTOP CONDITION: new evidence → continue. Two decisive failures/no new evidence → record the result and rotate.');
  if(q)q.textContent=lines.join('\n');
  box?.querySelectorAll('[data-service-search]').forEach(b=>b.addEventListener('click',()=>search(b.dataset.serviceSearch)))
 }
 function activeTargetPortsText(){
  try{const t=typeof activeTarget==='function'?activeTarget():null;if(!t||!Array.isArray(t.ports)||!t.ports.length)return'';
   return t.ports.filter(p=>p&&p.port&&p.state!=='closed').map(p=>String(p.port)+'/'+String(p.proto||'tcp')+' '+String(p.state||'open')+' '+String(p.service||'')+' '+[p.product,p.version,p.extra].filter(Boolean).join(' ')).join('\n')
  }catch(_){return''}
 }
 function loadActiveTargetPorts(){
  const txt=activeTargetPortsText();if(!txt){if(typeof toast==='function')toast('Active target has no imported service data');return}
  const ta=$('serviceRouterInput');if(ta){ta.value=txt;render();if(typeof toast==='function')toast('Loaded active target services')}
 }
 function saveParsedToTarget(){
  const parsed=parseServices($('serviceRouterInput')?.value||'');if(!parsed.endpoints.length){if(typeof toast==='function')toast('No recognized endpoints to save');return}
  let t=null;try{t=typeof activeTarget==='function'?activeTarget():null}catch(_){}
  if(!t){if(typeof toast==='function')toast('Select/add an active target first');return}
  t.ports=Array.isArray(t.ports)?t.ports:[];
  for(const e of parsed.endpoints){
   const hit=t.ports.find(p=>+p.port===e.port&&String(p.proto||'tcp')===e.proto);
   if(hit){if(!hit.service&&e.service)hit.service=e.service;if(!hit.state||hit.state==='filtered')hit.state=e.state}
   else t.ports.push({port:e.port,proto:e.proto,state:e.state,service:e.service||'',product:'',version:'',extra:e.detail||''})
  }
  t.ports.sort((a,b)=>(+a.port)-(+b.port)||String(a.proto).localeCompare(String(b.proto)));t.updated=Date.now();
  try{if(typeof logEvent==='function')logEvent(t,'enum','Service Router saved '+parsed.endpoints.length+' parsed endpoint(s)');if(typeof saveTargets==='function')saveTargets();if(typeof renderWorkspace==='function')renderWorkspace()}catch(_){}
  if(typeof toast==='function')toast('Merged '+parsed.endpoints.length+' endpoint(s) into active target')
 }
 function score(){const ad=Number($('scoreAD')?.value||0),ss=[...document.querySelectorAll('.scoreStandalone')].map(x=>Number(x.value||0)),scoreState=window.OSCP_UTILS.examScore(ad,ss,70),total=scoreState.total,need=scoreState.need,el=$('scoreSummary');if(!el)return;el.className='scoreSummary '+(total>=70?'good':'warn');let next='Bank every earned flag/evidence now.';if(total<70){const o=[];ss.forEach((v,i)=>{if(v===0)o.push(`S${i+1} local +10`);if(v===10)o.push(`S${i+1} privesc +10`)});if(ad<40)o.push(`AD remaining up to +${40-ad}`);next=o.length?`Nearest remaining point units: ${o.join(' · ')}`:'Re-check the Exam Control Panel objectives.'}el.innerHTML=`<div class="scoreBig">${total}/100</div><div><b>${total>=70?'Pass threshold reached in this planner':need+' more points to 70'}</b></div><div class="tiny" style="margin-top:6px">${esc(next)}</div>`}
 $('serviceRouterBuild')?.addEventListener('click',render);$('serviceRouterInput')?.addEventListener('input',()=>{clearTimeout(window.__oscpServiceTimer);window.__oscpServiceTimer=setTimeout(render,180)});$('serviceRouterCopy')?.addEventListener('click',async()=>{render();const txt=$('serviceFirstPassQueue')?.textContent||'';try{await navigator.clipboard.writeText(txt);toast('First-pass queue copied')}catch(e){}});$('serviceRouterLoadTarget')?.addEventListener('click',loadActiveTargetPorts);$('serviceRouterSaveTarget')?.addEventListener('click',saveParsedToTarget);$('scoreAD')?.addEventListener('change',score);document.querySelectorAll('.scoreStandalone').forEach(x=>x.addEventListener('change',score));score();window.OSCP_SERVICE_ROUTER={parsePorts,parseServices,classify,render,score,loadActiveTargetPorts,saveParsedToTarget};try{if(typeof V16_SELF_TESTS!=='undefined')V16_SELF_TESTS.push(['Service router parses Nmap TCP/UDP',()=>{const r=parseServices('22/tcp open ssh\\n53/udp open domain\\n161/udp open|filtered snmp');return[r.endpoints.length===3&&r.endpoints.some(x=>x.port===53&&x.proto==='udp'),'count='+r.endpoints.length]}],['Service router ignores unrelated numbers',()=>{const p=parsePorts('Nmap scan report for 10.10.10.123\\nHost is up (0.021s latency).\\n22/tcp open ssh OpenSSH 8.9p1');return[p.length===1&&p[0]===22,p.join(',')]}],['Service router explicit list stays strict',()=>{const p=parsePorts('22,80,445');return[p.join(',')==='22,80,445',p.join(',')]}],['Service router arbitrary numeric prose is not ports',()=>{const p=parsePorts('target 10.10.10.10 latency 21 ms version 8.9');return[p.length===0,p.join(',')||'none']}],['Service router prioritizes SMB before SSH',()=>{const r=classify([22,445]).map(x=>x.name);return[r[0]==='RPC/SMB',r.join(' > ')]}],['Service router does not map unknown port to a CVE',()=>{const r=classify([31337]);return[r.length===0,'unknown remains manual-identification path']}])}catch(e){}
})();
