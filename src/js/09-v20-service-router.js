
(()=>{
 const {CATALOG,endpointLabel,parseServices,parsePorts,matchCatalog,classify}=window.OSCP_SERVICE_CORE;
 const $=id=>document.getElementById(id);
 function esc(s){return window.OSCP_UTILS.escapeHtml(s)}
 function search(q){const g=$('globalSearch');if(!g)return;g.value=q;try{switchView('searchView');renderSearch(q)}catch(e){g.dispatchEvent(new Event('input',{bubbles:true}))}}
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
