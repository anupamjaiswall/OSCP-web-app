
(()=>{
 'use strict';
 const WORK_STORE='oscp:work-state:v26';
 const STATIC_ACTIONS=[
  {id:'start',icon:'🏠',title:'Start / exam flow',desc:'Return to the simple exam operating loop',kind:'screen',keys:'start home exam flow',run:()=>switchView('simpleExamView')},
  {id:'target',icon:'🎯',title:'Current target workspace',desc:'Signals, findings, next actions and evidence for the active target',kind:'screen',keys:'target workspace current host',run:()=>switchView('workspaceView')},
  {id:'ports',icon:'⚡',title:'Service Router',desc:'Turn ports or Nmap output into a prioritized enumeration queue',kind:'workflow',keys:'ports scan nmap service enumeration',run:()=>{switchView('serviceRouterView');setTimeout(()=>document.getElementById('serviceRouterInput')?.focus(),30)}},
  {id:'linux',icon:'🐧',title:'Linux methodology tree',desc:'Linux shell → root evidence tree',kind:'workflow',keys:'linux shell root sudo suid capabilities cron systemd',run:()=>{switchView('methodTreesView');setTimeout(()=>window.OSCP_TREE_READER?.show?.('linux'),30)}},
  {id:'windows',icon:'▣',title:'Windows methodology tree',desc:'Windows shell → admin/SYSTEM evidence tree',kind:'workflow',keys:'windows shell admin system seimpersonate services tasks',run:()=>{switchView('methodTreesView');setTimeout(()=>window.OSCP_TREE_READER?.show?.('windows'),30)}},
  {id:'ad',icon:'🏰',title:'Active Directory methodology tree',desc:'Domain context/creds → graph → one proven edge',kind:'workflow',keys:'active directory ad domain kerberos ldap bloodhound certipy',run:()=>{switchView('methodTreesView');setTimeout(()=>window.OSCP_TREE_READER?.show?.('ad'),30)}},
  {id:'windesk',icon:'WIN',title:'Windows / AD exam desk',desc:'Credential routing, access ladder and edge planning',kind:'screen',keys:'windows ad desk material edge bloodhound',run:()=>switchView('windowsStrategyView')},
  {id:'creds',icon:'🔐',title:'Credential Matrix',desc:'Classify and test credential material by destination',kind:'screen',keys:'password hash ticket certificate ccache ntlm credentials',run:()=>switchView('credentialsView')},
  {id:'web',icon:'🌐',title:'Web enumeration path',desc:'Open the deep web enumeration workflow',kind:'reference',keys:'web http https vhost upload auth enum',run:()=>window.OSCP_TAG_LINKS?.goToTag?.('[WEB:ENUM]')},
  {id:'pivot',icon:'🛣️',title:'Pivot / internal subnet',desc:'Open the routing and pivot decision flow',kind:'reference',keys:'pivot internal subnet ligolo sshuttle route tunnel',run:()=>window.OSCP_TAG_LINKS?.goToTag?.('[PIVOT:FLOW]')},
  {id:'proof',icon:'✓',title:'Bank proof / protect points',desc:'Capture, submit and preserve proof before continuing',kind:'safety',keys:'proof local flag bank screenshot points evidence',run:()=>document.getElementById('examBankBtn')?.click()},
  {id:'stuck',icon:'↺',title:'Stuck reset',desc:'Stop tool swapping and re-establish evidence',kind:'safety',keys:'stuck reset rotate rabbit hole',run:()=>document.getElementById('examStuckBtn')?.click()},
  {id:'report',icon:'📝',title:'Evidence & report',desc:'Capture proof and reproducible steps while working',kind:'screen',keys:'report evidence screenshot proof reproduction',run:()=>switchView('reportsView')},
  {id:'reference',icon:'📚',title:'Full reference',desc:'Open the deep offline notes',kind:'screen',keys:'reference notes full docs',run:()=>switchView('referenceView')},
  {id:'search',icon:'⌕',title:'Global search',desc:'Search titles, tags, ports, errors, privileges and tools',kind:'action',keys:'search find lookup tag',run:()=>window.OSCP_READER?.focusSearch?.()},
  {id:'work',icon:'⚗',title:'Edit active work state',desc:'Evidence → hypothesis → blocker → next decisive test',kind:'state',keys:'hypothesis evidence blocker missing next test work state',run:()=>window.OSCP_V26?.openWork?.()},
  {id:'note',icon:'📝',title:'Quick exam note',desc:'Capture a temporary thought before target rotation',kind:'state',keys:'quick scratch note rotate',run:()=>window.OSCP_V25?.note?.(true)},
  {id:'focus',icon:'◉',title:'Toggle Focus mode',desc:'Hide nonessential navigation for reading/execution',kind:'action',keys:'focus distraction read',run:()=>window.OSCP_READER?.toggleFocus?.()}
 ];
 let workAll={},paletteItems=[],paletteIndex=0,lastTargetKey='';

 const $id=id=>document.getElementById(id);
 function loadWork(){try{const x=JSON.parse(localStorage.getItem(WORK_STORE)||'{}');workAll=x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch(_){workAll={}}}
 function saveWork(){try{localStorage.setItem(WORK_STORE,JSON.stringify(workAll));return true}catch(_){return false}}
 function target(){
   try{return typeof activeTarget==='function'?activeTarget():null}catch(_){return null}
 }
 function targetKey(){const t=target();return t?.id||'__global__'}
 function blankWork(){return{evidence:'',hypothesis:'',missing:'',nextTest:'',returnWhen:'',updated:0}}
 function getWork(){return{...blankWork(),...(workAll[targetKey()]||{})}}
 function setWork(w){
   const key=targetKey();workAll[key]={...blankWork(),...w,updated:Date.now()};saveWork();
   const t=target();
   if(t&&String(w.nextTest||'').trim()){
     t.next=Array.isArray(t.next)?t.next:['','',''];
     while(t.next.length<3)t.next.push('');
     t.next[0]=String(w.nextTest).trim();
     try{if(typeof saveTargets==='function')saveTargets()}catch(_){}
   }
   renderStrip();
 }
 function trim(s,n=110){s=String(s||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n-1)+'…':s}
 function targetLabel(){const t=target();return t?(t.ip||t.host||'unnamed target'):'No active target'}
 function targetStage(){const t=target();return t?(t.stage||t.role||'target'):'global'}

 function renderStrip(){
   const root=$id('activeWorkStrip');if(!root)return;
   const w=getWork(),has=!!target();
   const cell=(key,label,value)=>'<button class="workStripCell '+(!value?'empty':'')+'" data-work-cell="'+key+'" type="button"><span class="k">'+label+'</span><span class="v">'+escHtml(trim(value)||'click to define')+'</span></button>';
   root.innerHTML='<div class="workStripTarget"><span>Active work</span><b>'+escHtml(targetLabel())+'</b><span>'+escHtml(targetStage())+'</span></div>'+
     cell('evidence','Evidence',w.evidence)+cell('hypothesis','Hypothesis',w.hypothesis)+cell('missing','Missing',w.missing)+
     '<div class="workStripActions"><button class="btn" id="workStripNext" type="button" title="'+escAttr(w.nextTest||'Define next decisive test')+'">Next'+(w.nextTest?' ✓':'')+'</button><button class="btn" id="workStripEdit" type="button">Edit</button></div>';
   root.querySelectorAll('[data-work-cell]').forEach(b=>b.addEventListener('click',()=>openWork(b.dataset.workCell)));
   $id('workStripNext')?.addEventListener('click',()=>openWork('nextTest'));
   $id('workStripEdit')?.addEventListener('click',()=>openWork());
   root.classList.toggle('noTarget',!has);
 }
 function escHtml(s){return window.OSCP_UTILS.escapeHtml(s)}
 function escAttr(s){return window.OSCP_UTILS.escapeHtml(s)}

 const fieldMap={evidence:'workEvidence',hypothesis:'workHypothesis',missing:'workMissing',nextTest:'workNextTest',returnWhen:'workReturn'};
 function fillWork(){
   const w=getWork(),t=target();
   for(const [k,id] of Object.entries(fieldMap)){const el=$id(id);if(el)el.value=w[k]||''}
   const c=$id('workStateContext');if(c)c.textContent=t?[(t.ip||t.host||'unnamed target'),t.role||'unknown',t.stage||'enumeration'].join(' · '):'No active target — saved as global work state.';
   const m=$id('workStateSaved');if(m)m.textContent=w.updated?'Last saved '+new Date(w.updated).toLocaleTimeString()+' · local browser only':'Saved locally per target.';
 }
 function collectWork(){const w=blankWork();for(const [k,id] of Object.entries(fieldMap))w[k]=$id(id)?.value||'';return w}
 function persistFields(){setWork(collectWork());fillWork()}
 function openWork(focusKey){
   fillWork();$id('workStateBackdrop')?.classList.add('open');
   setTimeout(()=>$id(fieldMap[focusKey]||'workEvidence')?.focus(),0);
 }
 function closeWork(save=true){if(save)persistFields();$id('workStateBackdrop')?.classList.remove('open')}
 function packet(){
   const w=getWork(),t=target();
   return [
    'TARGET: '+(t?(t.ip||t.host||'unnamed target'):'global')+(t?' · '+(t.role||'unknown')+' · '+(t.stage||'enumeration'):''),
    'EVIDENCE: '+(w.evidence||''),
    'HYPOTHESIS: '+(w.hypothesis||''),
    'MISSING: '+(w.missing||''),
    'NEXT TEST: '+(w.nextTest||''),
    'RETURN WHEN: '+(w.returnWhen||'')
   ].join('\n');
 }
 function setupWork(){
   for(const id of Object.values(fieldMap))$id(id)?.addEventListener('input',()=>{const m=$id('workStateSaved');if(m)m.textContent='Unsaved changes · save/close to persist'});
   $id('workStateClose')?.addEventListener('click',()=>closeWork(true));
   $id('workSaveClose')?.addEventListener('click',()=>closeWork(true));
   $id('workStateBackdrop')?.addEventListener('click',e=>{if(e.target===$id('workStateBackdrop'))closeWork(true)});
   $id('workCopyPacket')?.addEventListener('click',async()=>{persistFields();const ok=typeof copyText==='function'?await copyText(packet()):false;if(typeof toast==='function')toast(ok?'Rotation packet copied':'Copy blocked')});
   $id('workClearState')?.addEventListener('click',()=>{if(!confirm('Clear active work state for this target?'))return;workAll[targetKey()]=blankWork();saveWork();fillWork();renderStrip()});
 }

 function normalize(s){return String(s||'').toLowerCase().replace(/[^a-z0-9:_\-.\[\] ]+/g,' ').trim()}
 function score(item,q){
   q=normalize(q);if(!q)return item.priority||10;
   const hay=normalize([item.title,item.desc,item.keys,item.tag].filter(Boolean).join(' '));
   if(hay===q)return 200;let n=0;
   if(hay.includes(q))n+=80;
   for(const t of q.split(/\s+/).filter(Boolean)){if(hay.includes(t))n+=18;if(normalize(item.title).includes(t))n+=12}
   return n;
 }
 function referencePaletteItems(){
   try{
     if(typeof SEARCH_ITEMS==='undefined')return[];
     return SEARCH_ITEMS.map((x,i)=>({id:'ref:'+x.anchor,icon:'§',title:x.title,desc:(x.tags||[]).slice(0,5).join(' ')+' · deep reference',kind:'reference',keys:(x.tags||[]).join(' ')+' '+x.text.slice(0,260),priority:2,run:()=>openRef(x.anchor)}));
   }catch(_){return[]}
 }
 function buildPalette(q=''){
   const items=[...STATIC_ACTIONS,...referencePaletteItems()].map(x=>({...x,_score:score(x,q)})).filter(x=>x._score>0).sort((a,b)=>b._score-a._score||String(a.title).localeCompare(String(b.title))).slice(0,70);
   paletteItems=items;paletteIndex=Math.min(paletteIndex,Math.max(0,items.length-1));renderPalette();
 }
 function renderPalette(){
   const root=$id('commandPaletteResults');if(!root)return;
   root.innerHTML=paletteItems.length?paletteItems.map((x,i)=>'<button class="paletteItem '+(i===paletteIndex?'active':'')+'" data-palette-index="'+i+'" type="button" role="option" aria-selected="'+(i===paletteIndex?'true':'false')+'"><span class="paletteIcon">'+escHtml(x.icon||'›')+'</span><span class="paletteMain"><span class="paletteTitle">'+escHtml(x.title)+'</span><span class="paletteDesc">'+escHtml(x.desc||'')+'</span></span><span class="paletteKind">'+escHtml(x.kind||'action')+'</span></button>').join(''):'<div class="muted" style="padding:18px">No matching command or reference section.</div>';
   root.querySelectorAll('[data-palette-index]').forEach(b=>b.addEventListener('click',()=>executePalette(+b.dataset.paletteIndex)));
   root.querySelector('.paletteItem.active')?.scrollIntoView({block:'nearest'});
 }
 function executePalette(i=paletteIndex){const x=paletteItems[i];if(!x)return;closePalette();setTimeout(()=>x.run?.(),0)}
 function openPalette(seed=''){const back=$id('commandPaletteBackdrop'),input=$id('commandPaletteInput');if(!back||!input)return;back.classList.add('open');input.value=seed;paletteIndex=0;buildPalette(seed);setTimeout(()=>input.focus(),0)}
 function closePalette(){$id('commandPaletteBackdrop')?.classList.remove('open')}
 function setupPalette(){
   const input=$id('commandPaletteInput');
   input?.addEventListener('input',()=>{paletteIndex=0;buildPalette(input.value)});
   input?.addEventListener('keydown',e=>{
     if(e.key==='ArrowDown'){e.preventDefault();paletteIndex=Math.min(paletteItems.length-1,paletteIndex+1);renderPalette()}
     else if(e.key==='ArrowUp'){e.preventDefault();paletteIndex=Math.max(0,paletteIndex-1);renderPalette()}
     else if(e.key==='Enter'){e.preventDefault();executePalette()}
     else if(e.key==='Escape'){e.preventDefault();closePalette()}
   });
   $id('commandPaletteClose')?.addEventListener('click',closePalette);
   $id('commandPaletteBackdrop')?.addEventListener('click',e=>{if(e.target===$id('commandPaletteBackdrop'))closePalette()});
 }

 function healthCheck(){
   const requiredIds=['globalSearch','simpleExamView','workspaceView','serviceRouterView','methodTreesView','windowsStrategyView','reportsView','referenceView','examBankBtn','examStuckBtn','activeWorkStrip'];
   const missing=requiredIds.filter(id=>!$id(id));
   const ids=[...document.querySelectorAll('[id]')].map(x=>x.id),seen=new Set(),dupes=[];
   ids.forEach(id=>{if(seen.has(id)&&!dupes.includes(id))dupes.push(id);seen.add(id)});
   let missingViews=[];
   document.querySelectorAll('[data-view]').forEach(b=>{const v=b.dataset.view;if(v&&!$id(v)&&!missingViews.includes(v))missingViews.push(v)});
   const ok=!missing.length&&!dupes.length&&!missingViews.length&&typeof switchView==='function'&&typeof openRef==='function';
   const result={ok,missing,dupes,missingViews,checkedAt:new Date().toISOString()};
   window.OSCP_BOOT_HEALTH=result;
   if(!ok){
     const d=document.createElement('div');d.className='appHealthWarning';d.textContent='⚠ App integrity warning: '+[missing.length?('missing IDs: '+missing.join(', ')):'',dupes.length?('duplicate IDs: '+dupes.join(', ')):'',missingViews.length?('missing views: '+missingViews.join(', ')):''].filter(Boolean).join(' · ');document.body.appendChild(d);
   }
   return result;
 }

 function setupKeys(){
   document.addEventListener('keydown',e=>{
     const tag=(e.target?.tagName||'').toLowerCase(),editing=['input','textarea','select'].includes(tag)||e.target?.isContentEditable;
     if((e.ctrlKey||e.metaKey)&&!e.altKey&&String(e.key).toLowerCase()==='p'){e.preventDefault();e.stopImmediatePropagation();openPalette();return}
     if(e.altKey&&!e.ctrlKey&&!e.metaKey&&String(e.key).toLowerCase()==='h'){e.preventDefault();e.stopImmediatePropagation();openWork();return}
     if(e.key==='Escape'&&$id('workStateBackdrop')?.classList.contains('open')){e.preventDefault();e.stopImmediatePropagation();closeWork(true);return}
     if(e.key==='Escape'&&$id('commandPaletteBackdrop')?.classList.contains('open')){e.preventDefault();e.stopImmediatePropagation();closePalette();return}
     if(!editing&&e.key==='.'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();openPalette()}
   },true);
 }

 loadWork();
 function start(){
   setupWork();setupPalette();setupKeys();renderStrip();
   lastTargetKey=targetKey();
   setInterval(()=>{const k=targetKey();if(k!==lastTargetKey){lastTargetKey=k;renderStrip()}},900);
   const health=healthCheck();
   try{
     if(typeof V16_SELF_TESTS!=='undefined'){
       V16_SELF_TESTS.push(
        ['V26 active work strip',()=>[!!$id('activeWorkStrip')&&!!$id('workStateBackdrop'),'work state']],
        ['V26 command palette',()=>[!!$id('commandPaletteBackdrop')&&STATIC_ACTIONS.length>=15,STATIC_ACTIONS.length+' actions']],
        ['V26 boot integrity',()=>[window.OSCP_BOOT_HEALTH?.ok===true,JSON.stringify(window.OSCP_BOOT_HEALTH||{})]]
       );
     }
   }catch(_){}
   window.OSCP_V26={openWork,closeWork,getWork,setWork,packet,openPalette,closePalette,actions:STATIC_ACTIONS,health};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
