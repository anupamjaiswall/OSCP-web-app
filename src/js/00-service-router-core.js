/* V34.39 pure Service Router core: parser + classification + target next-action engine, DOM-free except optional DOMParser support. */
(function(root){
 'use strict';
 const DOMParser=root.DOMParser;
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
 function matchCatalog(x,e){return x.ports.includes(e.port)&&(!Array.isArray(x.protocols)||x.protocols.includes(e.proto))}
 function classify(input){
  const eps=(input||[]).map(x=>typeof x==='number'?{port:x,proto:'tcp',state:'open',service:''}:x);
  return CATALOG.map(x=>({...x,hit:eps.filter(e=>matchCatalog(x,e))})).filter(x=>x.hit.length).sort((a,b)=>a.priority-b.priority)
 }
 function targetEndpoints(target){return (Array.isArray(target?.ports)?target.ports:[]).filter(e=>e&&(e.state==='open'||e.state==='open|filtered')).map(e=>({port:Number(e.port),proto:String(e.proto||'tcp').toLowerCase(),state:String(e.state||'open').toLowerCase(),service:String(e.service||''),product:String(e.product||''),version:String(e.version||'')})).filter(e=>Number.isInteger(e.port)&&e.port>0&&e.port<=65535)}
 function targetText(target){return [target?.role,target?.stage,...(Array.isArray(target?.signals)?target.signals:[]),...targetEndpoints(target).flatMap(e=>[e.service,e.product,e.version])].filter(Boolean).join(' ').toLowerCase()}
 function inferPlatform(target){
  const eps=targetEndpoints(target),ports=new Set(eps.map(e=>e.port)),text=targetText(target);let windows=0,linux=0;
  if([135,139,445,3389,5985,5986].some(p=>ports.has(p)))windows+=3;
  if([88,389,636,3268,3269].some(p=>ports.has(p)))windows+=2;
  if(/\b(windows|winrm|smb|rdp|active directory|domain controller|kerberos|ldap|mssql)\b/.test(text))windows+=4;
  if([22,111,2049].some(p=>ports.has(p)))linux+=2;
  if(/\b(linux|unix|ubuntu|debian|centos|rhel|fedora|sudo|suid|systemd|nfs)\b/.test(text))linux+=4;
  if(windows>=linux+2)return'windows';if(linux>=windows+2)return'linux';return'unknown'
 }
 function targetStage(target){
  const s=String(target?.stage||'').toLowerCase();
  if(/proof|root|system|administrator|domain\s*admin|owned|complete/.test(s))return'privileged';
  if(/privesc|privilege|post|shell|foothold|user|local/.test(s))return'post-shell';
  return'enumeration'
 }
 function slug(v){return String(v||'item').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item'}
 function contextActions(target){
  const t=target||{},eps=targetEndpoints(t),rows=classify(eps),stage=targetStage(t),platform=inferPlatform(t),ports=new Set(eps.map(e=>e.port)),text=targetText(t),out=[],seen=new Set();
  const add=(id,priority,title,why,extra={})=>{if(seen.has(id))return;seen.add(id);out.push({id,priority,title,why,...extra})};
  const adSignal=/\b(active directory|domain controller|\bdc\b|domain)\b/.test(text)||([88,389,445].filter(p=>ports.has(p)).length>=2);
  const hasWeb=rows.some(x=>x.name==='HTTP/S'),hasFileSurface=rows.some(x=>['RPC/SMB','FTP','NFS'].includes(x.name));
  if(stage==='privileged'){
   add('bank-proof',1,'Bank proof before doing anything else','Keep the privileged interactive shell open, display the proof from its original path with target IP visible, capture the screenshot, submit the exact value, and compare it character-for-character.',{kind:'evidence',query:'[EVIDENCE:PACKET]',view:'reportsView'});
   add('repro-path',2,'Make the compromise reproducible','Record the exact path, commands, source URL/files, changes and screenshot filename while the successful path is still fresh.',{kind:'closure',view:'reportsView'});
   add('cleanup-notes',3,'Record changes and rollback obligations','Note services/configs/accounts/files you changed so the report and cleanup narrative is complete.',{kind:'closure',query:'report cleanup evidence'});
   add('next-target',4,'Rotate only after closure is complete','Once evidence and notes are closed, move to the next highest-value unfinished target rather than continuing curiosity on an already-owned host.',{kind:'rotation',view:'workspaceView'});
  }else if(stage==='post-shell'){
   add('bank-local',1,'Bank local access first','If local.txt is available, capture and submit it before privilege escalation. A shell is progress; banked evidence protects the points.',{kind:'evidence',query:'[EVIDENCE:PACKET]',view:'reportsView'});
   add('shell-context',2,'Re-prove shell context','Record current identity, groups/privileges, hostname, network interfaces/listeners and exact shell constraints before changing tools.',{kind:'truth',query:platform==='windows'?'Windows post exploitation whoami privileges':'Linux post exploitation id sudo network'});
   add('privesc-'+platform,3,(platform==='windows'?'Run Windows':'Run '+(platform==='linux'?'Linux':'platform-aware'))+' privilege-escalation triage','Start with cheap, evidence-producing checks and route findings into the matching attack tree instead of blindly running every technique.',{kind:'privesc',query:platform==='windows'?'Windows privilege escalation SeImpersonate services tasks':'Linux privilege escalation sudo SUID capabilities systemd',view:'methodTreesView'});
   add('local-secrets',4,'Correlate local secrets with exposed services','Configs, history, service files, scheduled tasks, shares and application credentials matter most when tied back to an exposed service or reachable host.',{kind:'credential',query:'post exploitation credentials config files pivot'});
   if(adSignal)add('ad-recollect',5,'Re-enumerate AD with the new identity','A shell or recovered identity can change LDAP/SMB/graph visibility. Re-check domain access with the new context instead of assuming old negatives still apply.',{kind:'ad',query:'Active Directory authenticated enumeration BloodHound credentials',view:'windowsStrategyView'});
  }else{
   if(!eps.length)add('scan-full',1,'Complete target discovery before guessing','Import or run a complete, structured port scan so decisions are driven by observed services instead of assumptions.',{kind:'discovery',query:'Nmap full TCP UDP enumeration',view:'intakeView'});
   if(adSignal){
    add('ad-context',2,'Prove AD context: DNS, domain, DC and time','Kerberos/LDAP/SMB failures are often context failures. Resolve the FQDN/domain/DC and clock before treating credentials or tools as broken.',{kind:'ad',query:'Active Directory DNS clock skew domain controller context',view:'windowsStrategyView'});
    add('ad-identity',3,'Build the smallest proven identity path','Use anonymous/guest/known credentials only where evidence supports them; separate authentication, authorization and admin rights.',{kind:'ad',query:'AD authentication SMB LDAP Kerberos identity scope',view:'windowsStrategyView'});
   }
   for(const x of rows.slice(0,4))add('service-'+slug(x.name),10+x.priority,'Enumerate '+x.name+' intentionally',x.first,{kind:'service',query:x.query,view:'serviceRouterView',service:x.name,ports:x.hit.map(endpointKey)});
   if(hasWeb&&hasFileSurface)add('cross-service',17,'Correlate web findings with file/share surfaces','Source, backups, configs, usernames and credentials found in web or shares become valuable only when replayed deliberately against the other observed services.',{kind:'correlation',query:'source config backup credentials reuse services'});
   const unknown=eps.filter(e=>!CATALOG.some(x=>matchCatalog(x,e)));
   if(unknown.length)add('identify-unknown',70,'Identify unclassified protocols before CVE hunting','Unknown open ports are observations, not vulnerabilities. Fingerprint the protocol/product manually once, then map it to the right methodology.',{kind:'discovery',query:unknown.map(e=>e.service||e.product||String(e.port)).filter(Boolean).join(' '),view:'serviceRouterView',ports:unknown.map(endpointKey)});
  }
  if(!out.length)add('workspace-state',90,'Write one decisive next test','Record the strongest evidence, one hypothesis, the missing prerequisite and one cheap test that can confirm or kill it.',{kind:'decision',view:'workspaceView'});
  return out.sort((a,b)=>a.priority-b.priority||a.title.localeCompare(b.title)).slice(0,5).map((x,i)=>({...x,rank:i+1,platform,stage}))
 }
 root.OSCP_SERVICE_CORE=Object.freeze({
   CATALOG,endpointKey,endpointLabel,addEndpoint,parseServices,parsePorts,matchCatalog,classify,targetEndpoints,targetText,inferPlatform,targetStage,contextActions
 });
})(typeof window!=='undefined'?window:globalThis);