/* V34.49: exam-day reliability safety — storage headroom, export lint, fast preflight, one-click backup. */
(function(root){
 'use strict';
 const STORAGE_BUDGET=5*1024*1024;
 const STORAGE_WARN_RATIO=.70;
 const BACKUP_FRESH_MS=2*60*60*1000;
 const SECRET_PATTERNS=Object.freeze([
  Object.freeze({kind:'private key',re:/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/i}),
  Object.freeze({kind:'Kerberos hash',re:/\$krb5(?:asrep|tgs)\$/i}),
  Object.freeze({kind:'password hash',re:/\$(?:1|2[abxy]?|5|6|y|argon2(?:id|i|d))\$/i}),
  Object.freeze({kind:'JWT/token',re:/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/}),
  Object.freeze({kind:'NTLM/hash pair',re:/\b[0-9a-fA-F]{32}:[0-9a-fA-F]{32}\b/}),
  Object.freeze({kind:'credential label',re:/\b(?:password|passwd|pwd|secret|token|api[_ -]?key)\s*[:=]\s*(?!<redacted>|redacted|none|null|\*{3,})\S{4,}/i}),
  Object.freeze({kind:'hex token/hash/flag',re:/\b[0-9a-fA-F]{32,64}\b/}),
  Object.freeze({kind:'AWS-style access key',re:/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/})
 ]);
 function utf16Bytes(value){return String(value??'').length*2}
 function storageUsage(entries,prefix='oscp_v16_',budget=STORAGE_BUDGET){
  const rows=Array.isArray(entries)?entries:[];let bytes=0,keys=0;
  for(const pair of rows){const k=String(pair?.[0]??''),v=String(pair?.[1]??'');if(!k.startsWith(prefix))continue;keys++;bytes+=utf16Bytes(k)+utf16Bytes(v)}
  const pct=budget>0?(bytes/budget)*100:0;
  return Object.freeze({bytes,keys,budget,pct,warning:pct>=STORAGE_WARN_RATIO*100});
 }
 function scanSecretLikeText(value){
  const out=[];const seen=new Set();
  function visit(v,path){
   if(v===null||v===undefined)return;
   if(typeof v==='string'){
    for(const p of SECRET_PATTERNS){p.re.lastIndex=0;if(!p.re.test(v))continue;const key=p.kind+'|'+path;if(!seen.has(key)){seen.add(key);out.push(Object.freeze({kind:p.kind,path}))}}
    return;
   }
   if(Array.isArray(v)){v.forEach((x,i)=>visit(x,path+'['+i+']'));return}
   if(typeof v==='object')for(const [k,x] of Object.entries(v))visit(x,path?path+'.'+k:k);
  }
  visit(value,'');return Object.freeze(out.slice(0,40));
 }
 function backupFreshness(meta,now=Date.now(),freshMs=BACKUP_FRESH_MS){
  const at=Number(meta?.at)||0,kind=String(meta?.kind||'backup');
  if(!at)return Object.freeze({at:0,kind,ageMs:Infinity,fresh:false,label:'none'});
  const ageMs=Math.max(0,Number(now)-at);return Object.freeze({at,kind,ageMs,fresh:ageMs<=freshMs,label:ageMs<60000?'just now':ageMs<3600000?Math.floor(ageMs/60000)+'m ago':Math.floor(ageMs/3600000)+'h ago'});
 }
 function preflightSummary(rows){
  const xs=Array.isArray(rows)?rows:[];return Object.freeze({pass:xs.filter(x=>x.state==='pass').length,warn:xs.filter(x=>x.state==='warn').length,fail:xs.filter(x=>x.state==='fail').length,total:xs.length,ok:!xs.some(x=>x.state==='fail')});
 }
 root.OSCP_RELIABILITY_CORE=Object.freeze({STORAGE_BUDGET,STORAGE_WARN_RATIO,BACKUP_FRESH_MS,SECRET_PATTERNS,utf16Bytes,storageUsage,scanSecretLikeText,backupFreshness,preflightSummary});
 if(typeof document==='undefined')return;
 const $=id=>document.getElementById(id);
 function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
 function fmtBytes(n){const x=Number(n)||0;if(x<1024)return x+' B';if(x<1024*1024)return(x/1024).toFixed(x<10240?1:0)+' KB';return(x/1024/1024).toFixed(2)+' MB'}
 function localEntries(){const rows=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k!==null)rows.push([k,localStorage.getItem(k)||''])}}catch(_){}return rows}
 function currentUsage(){return storageUsage(localEntries(),typeof STORE!=='undefined'?STORE:'oscp_v16_')}
 function getBackupMeta(){try{return typeof externalBackupMeta!=='undefined'?externalBackupMeta:{at:0,kind:''}}catch(_){return{at:0,kind:''}}}
 function installStyles(){
  if($('reliabilitySafetyStyles'))return;
  const s=el('style');s.id='reliabilitySafetyStyles';s.textContent=`
#reliabilitySafetyCard{margin-top:0}.reliabilityHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}.reliabilityMeter{margin:10px 0}.reliabilityMeter progress{width:100%;height:12px}.reliabilityMeta{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:5px;font-size:11px;color:var(--muted)}.reliabilityActions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.reliabilityResults{display:grid;gap:6px;margin-top:9px}.reliabilityResult{display:grid;grid-template-columns:22px minmax(0,1fr);gap:7px;padding:7px 8px;border:1px solid var(--line);border-radius:8px;font-size:12px}.reliabilityResult.pass>span:first-child{color:var(--good)}.reliabilityResult.warn>span:first-child{color:var(--warn)}.reliabilityResult.fail>span:first-child{color:var(--bad)}.reliabilityClockBadge{font-size:11px;padding:5px 7px;border:1px solid var(--line);border-radius:999px;color:var(--muted)}.reliabilityClockBadge.warn{color:var(--warn);border-color:color-mix(in srgb,var(--warn) 50%,var(--line))}.reliabilityClockBadge.good{color:var(--good);border-color:color-mix(in srgb,var(--good) 50%,var(--line))}
`;
  document.head.appendChild(s);
 }
 function renderStorage(){
  const u=currentUsage(),bar=$('reliabilityStorageBar'),txt=$('reliabilityStorageText'),meta=$('reliabilityStorageMeta');if(!bar||!txt||!meta)return u;
  bar.value=Math.min(100,u.pct);txt.textContent=`App localStorage: ${fmtBytes(u.bytes)} / 5.00 MB planning budget · ${u.pct.toFixed(1)}%`;
  txt.dataset.state=u.warning?'warn':'good';meta.textContent=`${u.keys} app keys · warning starts at 70% · actual browser quota can vary`;
  if(navigator.storage?.estimate)navigator.storage.estimate().then(x=>{if(!x||!Number.isFinite(x.usage)||!Number.isFinite(x.quota))return;meta.textContent+=` · origin estimate ${fmtBytes(x.usage)} / ${fmtBytes(x.quota)}`}).catch(()=>{});
  return u;
 }
 function renderBackupBadge(){
  const b=$('reliabilityBackupBadge');if(!b)return;const f=backupFreshness(getBackupMeta());b.className='reliabilityClockBadge '+(f.fresh?'good':'warn');b.textContent=f.at?`backup ${f.label}`:'backup missing';b.title=f.at?`Last external ${f.kind} backup: ${new Date(f.at).toLocaleString()}`:'No external backup recorded in this browser profile';
 }
 function secretWarning(payload){
  const findings=scanSecretLikeText(payload);if(!findings.length)return true;
  const kinds=[...new Set(findings.map(x=>x.kind))].join(', '),fields=[...new Set(findings.map(x=>x.path).filter(Boolean))].slice(0,8).join(', ');
  return confirm(`Secret-free export found ${findings.length} credential/secret-like free-text pattern${findings.length===1?'':'s'} (${kinds}).\n\nStructured secret fields are already removed, but free-text notes/report fields are not automatically scrubbed.${fields?'\n\nReview fields: '+fields:''}\n\nContinue export anyway?`);
 }
 function wrapSecretFreeExports(){
  for(const id of ['exportSession','copySessionJson']){
   const b=$(id);if(!b||b.dataset.secretLint==='1')continue;const original=b.onclick;if(typeof original!=='function')continue;b.dataset.secretLint='1';
   b.onclick=async ev=>{let payload;try{payload=typeof sessionPayload==='function'?sessionPayload(false):null}catch(_){payload=null}if(payload&&!secretWarning(payload)){if(typeof toast==='function')toast('Secret-free export cancelled — review free-text first');return false}return original.call(b,ev)};
  }
 }
 async function backupNow(){const b=$('exportSession');if(!b)throw new Error('Secret-free session export control is unavailable');b.click();setTimeout(()=>{renderBackupBadge();renderStorage()},450);return true}
 function row(state,name,detail){return Object.freeze({state,name,detail:String(detail||'')})}
 async function runPreflight(){
  const rows=[];
  try{
   const prefix=typeof STORE!=='undefined'?STORE:'oscp_v16_',key=prefix+'preflightProbe_'+Date.now(),value='ok-'+Math.random().toString(36).slice(2);localStorage.setItem(key,value);const ok=localStorage.getItem(key)===value;localStorage.removeItem(key);rows.push(row(ok?'pass':'fail','Browser storage round-trip',ok?'write/read/delete succeeded':'stored value did not round-trip'));
  }catch(e){rows.push(row('fail','Browser storage round-trip',e.message))}
  const u=renderStorage();rows.push(row(u.warning?'warn':'pass','Storage headroom',`${fmtBytes(u.bytes)} used · ${u.pct.toFixed(1)}% of conservative 5 MB budget`));
  try{
   if(typeof sessionPayload!=='function'||typeof assertRestorableBackup!=='function')throw new Error('backup validation functions unavailable');const plain=sessionPayload(false),round=JSON.parse(JSON.stringify(plain));assertRestorableBackup(round);const signed=typeof withBackupIntegrity==='function'?await withBackupIntegrity(round):round;if(signed?.integrity&&typeof verifyBackupIntegrity==='function')await verifyBackupIntegrity(signed);rows.push(row('pass','Secret-free backup round-trip',signed?.integrity?'schema + SHA-256 verified':'schema verified; Web Crypto checksum unavailable'));
  }catch(e){rows.push(row('fail','Secret-free backup round-trip',e.message))}
  try{const findings=typeof sessionPayload==='function'?scanSecretLikeText(sessionPayload(false)):[];rows.push(row(findings.length?'warn':'pass','Free-text secret lint',findings.length?`${findings.length} possible secret/credential patterns need review`:'no credential-shaped free-text patterns detected'))}catch(e){rows.push(row('warn','Free-text secret lint','unable to scan: '+e.message))}
  const searchOk=!!root.OSCP_SEARCH_CORE&&!!root.OSCP_REFERENCE;rows.push(row(searchOk?'pass':'fail','Search + Reference engine',searchOk?'core APIs available':'search/reference API missing'));
  const build=root.OSCP_BUILD||{},meta=document.querySelector('meta[name="oscp-build-version"]')?.content||'';rows.push(row(build.version&&build.version===meta?'pass':'fail','Build metadata',build.version&&build.version===meta?`version ${build.version} consistent`:`runtime ${build.version||'missing'} vs meta ${meta||'missing'}`));
  const before=Date.now();await new Promise(r=>setTimeout(r,20));const clockOk=Date.now()>before&&!!$('attackCountdown')&&!!$('reportCountdown');rows.push(row(clockOk?'pass':'fail','Clock sanity',clockOk?'system clock advances and countdown controls exist':'clock/countdown control check failed'));
  const corrupt=Array.isArray(root.__OSCP_CORRUPT_STORAGE__)?root.__OSCP_CORRUPT_STORAGE__:[];rows.push(row(corrupt.length?'warn':'pass','Saved-state parse health',corrupt.length?`${corrupt.length} malformed/unavailable storage entries were recovered`:'no malformed saved-state entries detected'));
  const backup=backupFreshness(getBackupMeta());rows.push(row(backup.fresh?'pass':'warn','External backup freshness',backup.at?`${backup.kind} · ${backup.label}`:'no external backup recorded'));
  const summary=preflightSummary(rows);renderPreflight(rows,summary);renderBackupBadge();return Object.freeze({rows:Object.freeze(rows),summary});
 }
 function renderPreflight(rows,summary){
  const rootEl=$('reliabilityResults'),status=$('reliabilitySummary');if(!rootEl||!status)return;status.textContent=`${summary.pass} pass · ${summary.warn} warn · ${summary.fail} fail`;status.dataset.state=summary.fail?'bad':summary.warn?'warn':'good';
  rootEl.replaceChildren(...rows.map(x=>{const r=el('div','reliabilityResult '+x.state);r.append(el('span','',x.state==='pass'?'✓':x.state==='warn'?'!':'×'));const b=el('div');const n=el('b','',x.name),d=el('div','tiny',x.detail);b.append(n,d);r.append(b);return r}));
 }
 function installCard(){
  const grid=$('sessionView')?.querySelector('.opsGrid');if(!grid||$('reliabilitySafetyCard'))return;
  const card=el('section','card opsSpan12');card.id='reliabilitySafetyCard';const head=el('div','reliabilityHead'),left=el('div'),h=el('h2','', '🧪 Exam reliability preflight'),desc=el('div','muted','One-click local checks for storage, backup round-trip, free-text secret risk, search/reference availability, clock sanity and backup freshness. No network calls.');left.append(h,desc);const status=el('span','chip','not run');status.id='reliabilitySummary';head.append(left,status);card.append(head);
  const meter=el('div','reliabilityMeter'),text=el('div','tiny');text.id='reliabilityStorageText';const bar=el('progress');bar.id='reliabilityStorageBar';bar.max=100;bar.value=0;const meta=el('div','reliabilityMeta');meta.id='reliabilityStorageMeta';meter.append(text,bar,meta);card.append(meter);
  const actions=el('div','reliabilityActions');const run=el('button','btn primary','Run preflight self-test');run.type='button';run.id='reliabilityRun';const refresh=el('button','btn','Refresh storage');refresh.type='button';refresh.id='reliabilityRefresh';const backup=el('button','btn good','Download backup now');backup.type='button';backup.id='reliabilityBackupNow';actions.append(run,refresh,backup);card.append(actions);
  const results=el('div','reliabilityResults');results.id='reliabilityResults';card.append(results);grid.appendChild(card);
  run.addEventListener('click',async()=>{run.disabled=true;status.textContent='checking…';try{await runPreflight()}catch(e){status.textContent='preflight error';status.dataset.state='bad';if(typeof toast==='function')toast('Preflight failed: '+e.message)}finally{run.disabled=false}});refresh.addEventListener('click',()=>{renderStorage();renderBackupBadge()});backup.addEventListener('click',()=>backupNow().catch(e=>{if(typeof toast==='function')toast(e.message)}));renderStorage();
 }
 function installClockBackup(){
  if($('reliabilityClockBackup'))return;const save=$('saveExamClock'),rowEl=save?.parentElement;if(!rowEl)return;const b=el('button','btn good','⬇ Backup now');b.type='button';b.id='reliabilityClockBackup';b.title='Download a secret-free external session backup';const badge=el('span','reliabilityClockBadge warn','backup unknown');badge.id='reliabilityBackupBadge';rowEl.append(b,badge);b.addEventListener('click',()=>backupNow().catch(e=>{if(typeof toast==='function')toast(e.message)}));renderBackupBadge();
 }
 function wireBackupFreshness(){
  try{if(typeof markExternalBackup==='function'&&!markExternalBackup.__reliabilityWrapped){const base=markExternalBackup;const wrapped=function(kind){const out=base(kind);renderBackupBadge();renderStorage();return out};wrapped.__reliabilityWrapped=true;markExternalBackup=wrapped}}catch(_){}
  window.addEventListener('focus',()=>{renderBackupBadge();renderStorage()});document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderBackupBadge();renderStorage()}});
 }
 function start(){installStyles();installCard();installClockBackup();wrapSecretFreeExports();wireBackupFreshness();renderStorage();renderBackupBadge();try{if(typeof V16_SELF_TESTS!=='undefined')V16_SELF_TESTS.push(
   ['V34.49 reliability core is DOM-free',()=>[typeof root.OSCP_RELIABILITY_CORE?.storageUsage==='function'&&typeof root.OSCP_RELIABILITY_CORE?.scanSecretLikeText==='function','core available']],
   ['V34.49 secret-free lint does not expose matched values',()=>{const x=scanSecretLikeText({notes:'password=ExampleSecret123'});return[x.length===1&&!('value' in x[0]),JSON.stringify(x)]}],
   ['V34.49 storage warning threshold is 70%',()=>{const x=storageUsage([['oscp_v16_x','a'.repeat(1900000)]],'oscp_v16_',5*1024*1024);return[x.warning===true,x.pct.toFixed(1)+'%']}]
  )}catch(_){}
 }
 root.OSCP_RELIABILITY_SAFETY=Object.freeze({runPreflight,refresh:()=>{renderStorage();renderBackupBadge()},backupNow,scanCurrent:()=>{try{return scanSecretLikeText(sessionPayload(false))}catch(_){return[]}}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,0),{once:true});else setTimeout(start,0);
})(typeof window!=='undefined'?window:globalThis);
