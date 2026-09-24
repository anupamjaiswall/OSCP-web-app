
(()=>{ const PATTERNS=[
  {id:'first.last',label:'first.last',core:true,fn:n=>n.last?`${n.first}.${n.last}`:''},
  {id:'flast',label:'flast',core:true,fn:n=>n.last?`${n.first[0]||''}${n.last}`:''},
  {id:'firstl',label:'firstl',core:true,fn:n=>n.last?`${n.first}${n.last[0]||''}`:''},
  {id:'firstlast',label:'firstlast',core:true,fn:n=>n.last?`${n.first}${n.last}`:''},
  {id:'first',label:'first',core:true,fn:n=>n.first},
  {id:'f.last',label:'f.last',core:false,fn:n=>n.last?`${n.first[0]||''}.${n.last}`:''},
  {id:'first_last',label:'first_last',core:false,fn:n=>n.last?`${n.first}_${n.last}`:''},
  {id:'first-last',label:'first-last',core:false,fn:n=>n.last?`${n.first}-${n.last}`:''},
  {id:'last.first',label:'last.first',core:false,fn:n=>n.last?`${n.last}.${n.first}`:''},
  {id:'lastf',label:'lastf',core:false,fn:n=>n.last?`${n.last}${n.first[0]||''}`:''},
  {id:'last',label:'last',core:false,fn:n=>n.last}
 ];
 const TITLE=/^(?:mr|mrs|ms|miss|dr|prof|sir|mx)\.?$/i,SUFFIX=/^(?:jr|sr|ii|iii|iv|v)\.?$/i;
 const ascii=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 function parseNameLine(line){
  let x=String(line||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();if(!x)return null;
  let first='',last='';
  if(x.includes(',')){const a=x.split(',');last=ascii(a.shift());let rest=a.join(' ').trim().split(/\s+/).filter(Boolean);while(rest.length&&TITLE.test(rest[0]))rest.shift();first=ascii(rest[0]||'')}
  else{let a=x.split(/\s+/).filter(Boolean);while(a.length&&TITLE.test(a[0]))a.shift();while(a.length&&SUFFIX.test(a[a.length-1]))a.pop();first=ascii(a[0]||'');last=ascii(a.length>1?a[a.length-1]:'')}
  if(!first&&!last)return null;if(!first){first=last;last=''}return{raw:x,first,last};
 }
 function cleanCandidate(x,clamp20){let y=String(x||'').toLowerCase().replace(/[^a-z0-9._-]/g,'').replace(/[._-]{2,}/g,m=>m[0]).replace(/^[._-]+|[._-]+$/g,'');if(clamp20)y=y.slice(0,20).replace(/[._-]+$/g,'');return y}
 function generate(text,ids,clamp20=true){
  const lines=String(text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),names=[];for(const l of lines.slice(0,250)){const n=parseNameLine(l);if(n)names.push(n)}
  const chosen=PATTERNS.filter(p=>ids.includes(p.id)),seen=new Set(),out=[];let rawCount=0;
  for(const n of names){for(const p of chosen){const c=cleanCandidate(p.fn(n),clamp20);if(!c)continue;rawCount++;if(!seen.has(c)){seen.add(c);out.push(c)}if(out.length>=2500)break}if(out.length>=2500)break}
  return{names,candidates:out,rawCount,deduped:Math.max(0,rawCount-out.length),truncated:lines.length>250||out.length>=2500,chosen};
 }
 function observedUser(x){let u=String(x||'').trim();if(u.includes('\\'))u=u.split('\\').pop();if(u.includes('@'))u=u.split('@')[0];return cleanCandidate(u,false)}
 function infer(name,user,clamp20=true){const n=parseNameLine(name),u=observedUser(user);if(!n||!u)return[];return PATTERNS.filter(p=>cleanCandidate(p.fn(n),clamp20)===u).map(p=>p.id)}
 function selected(){return [...document.querySelectorAll('.adUsernamePatternCheck:checked')].map(x=>x.value)}
 function setPatterns(ids){document.querySelectorAll('.adUsernamePatternCheck').forEach(x=>x.checked=ids.includes(x.value))}
 function renderPatterns(){const root=document.getElementById('adUsernamePatterns');if(!root)return;root.innerHTML=PATTERNS.map(p=>`<label class="usernamePattern"><input class="adUsernamePatternCheck" type="checkbox" value="${p.id}" ${p.core?'checked':''}><code>${p.label}</code></label>`).join('')}
 let last={names:[],candidates:[],rawCount:0,deduped:0,truncated:false,chosen:[]};
 function paint(){
  const names=document.getElementById('adUsernameNames'),out=document.getElementById('adUsernameOutput'),stats=document.getElementById('adUsernameStats'),notice=document.getElementById('adUsernameNotice');if(!names||!out)return;
  last=generate(names.value,selected(),document.getElementById('adUsernameClamp20').checked);out.textContent=last.candidates.length?last.candidates.join('\n'):'No candidates. Paste real names and select at least one pattern.';
  stats.innerHTML=`<div><b>${last.names.length}</b><br><span class="tiny">names</span></div><div><b>${last.chosen.length}</b><br><span class="tiny">patterns</span></div><div><b>${last.candidates.length}</b><br><span class="tiny">candidates</span></div><div><b>${last.deduped}</b><br><span class="tiny">deduped</span></div>`;
  const many=last.candidates.length>250;notice.className='usernameGenNotice'+(many||last.truncated?' warn':'');notice.textContent=last.truncated?'Input/output safety cap reached. Narrow to the observed convention before validation.':many?'Large candidate set. Infer or select fewer patterns before user enumeration; smaller evidence-derived lists are easier to reason about.':'Generated candidates are hypotheses, not confirmed users. Validate usernames separately; do not turn this into password spraying.';
 }
 async function copyCandidates(){if(!last.candidates.length)paint();if(!last.candidates.length)return toast('No username candidates to copy');const ok=await copyText(last.candidates.join('\n')+'\n');toast(ok?'Username candidates copied':'Copy failed')}
 function downloadCandidates(){if(!last.candidates.length)paint();if(!last.candidates.length)return toast('No username candidates to download');downloadText('username_candidates.txt',last.candidates.join('\n')+'\n','text/plain');toast('username_candidates.txt downloaded')}
 async function copyKerbrute(){const cmd='kerbrute userenum -d "$DOMAIN" username_candidates.txt --dc "$DC_IP" -o loot/valid-users.txt';if(typeof guardedCopyText==='function')await guardedCopyText(cmd,'Kerbrute username enumeration',null,{allowPlaceholders:true});else{await copyText(cmd);toast('Kerbrute userenum copied')}}
 function doInfer(){const name=document.getElementById('adUsernameInferName').value,user=document.getElementById('adUsernameInferUser').value,result=document.getElementById('adUsernameInferResult'),hits=infer(name,user,document.getElementById('adUsernameClamp20').checked);if(hits.length){setPatterns(hits);result.textContent=`Matched convention: ${hits.join(', ')}. Pattern selection narrowed to the observed evidence.`;paint()}else result.textContent='No exact built-in convention matched. Keep a small manual selection or use Username Anarchy as a fallback.'}
 renderPatterns();
 document.getElementById('adUsernameGenerate')?.addEventListener('click',paint);document.getElementById('adUsernameCopy')?.addEventListener('click',copyCandidates);document.getElementById('adUsernameDownload')?.addEventListener('click',downloadCandidates);document.getElementById('adUsernameKerbrute')?.addEventListener('click',copyKerbrute);document.getElementById('adUsernameOpenRef')?.addEventListener('click',()=>openRef('ref-9-2a-ad-username-candidate-generation'));document.getElementById('adUsernameInfer')?.addEventListener('click',doInfer);document.getElementById('adUsernameCore')?.addEventListener('click',()=>{setPatterns(PATTERNS.filter(p=>p.core).map(p=>p.id));paint()});document.getElementById('adUsernameAll')?.addEventListener('click',()=>{setPatterns(PATTERNS.map(p=>p.id));paint()});document.getElementById('adUsernameClamp20')?.addEventListener('change',paint);document.getElementById('adUsernamePatterns')?.addEventListener('change',paint);
 window.OSCP_USERNAME_GEN={patterns:PATTERNS.map(({id,label,core})=>({id,label,core})),parseNameLine,generate,infer,observedUser};
 try{if(typeof V16_SELF_TESTS!=='undefined')V16_SELF_TESTS.push(
  ['AD username generator normalizes names',()=>{const r=generate("José O'Neil",['first.last','flast'],true);return[r.candidates.includes('jose.oneil')&&r.candidates.includes('joneil'),r.candidates.join('|')]}],
  ['AD username generator parses Last, First',()=>{const r=generate('Smith, Alice',['first.last'],true);return[r.candidates[0]==='alice.smith',r.candidates.join('|')]}],
  ['AD username convention inference works',()=>{const x=infer('John Smith','CORP\\jsmith',true);return[x.includes('flast'),x.join('|')]}],
  ['AD username generator deduplicates',()=>{const r=generate('John Smith\nJohn Smith',['first.last'],true);return[r.candidates.length===1&&r.deduped===1,`candidates=${r.candidates.length}; deduped=${r.deduped}`]}],
  ['AD username generator can clamp sAMAccountName hypothesis',()=>{const r=generate('Alexanderthegreat Verylongsurname',['first.last'],true);return[r.candidates.length===1&&r.candidates[0].length<=20,r.candidates[0]||'none']}],
  ['AD username generator userenum is not a spray workflow',()=>{const txt=document.getElementById('adUsernameGeneratorCard')?.textContent||'';return[txt.includes('USERENUM ONLY')&&!/passwordspray|bruteuser|bruteforce/i.test(txt),'offline userenum only']}]
 )}catch(e){}
})();
