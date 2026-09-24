(()=>{
 'use strict';
 const $id=id=>document.getElementById(id);
 const KEY_BACKUP='oscp_v34_last_external_backup';
 const KEY_CONTRAST='oscp_v34_high_contrast';
 function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e}
 function btn(label,fn,cls='btn'){const b=node('button',cls,label);b.type='button';b.addEventListener('click',fn);return b}
 function safeGet(k,d=''){try{const v=localStorage.getItem(k);return v===null?d:v}catch(_){return d}}
 function safeSet(k,v){try{localStorage.setItem(k,v);return true}catch(_){return false}}
 function parseJson(s,f=null){try{return JSON.parse(s)}catch(_){return f}}
 function rel(ts){if(!ts)return'never';const sec=Math.max(0,Math.floor((Date.now()-ts)/1000));if(sec<60)return sec+'s ago';const m=Math.floor(sec/60);if(m<60)return m+'m ago';const h=Math.floor(m/60);return h<48?h+'h ago':Math.floor(h/24)+'d ago'}
 function backupInfo(){const x=parseJson(safeGet(KEY_BACKUP,''),{});return x&&Number.isFinite(+x.at)?{at:+x.at,name:String(x.name||'session backup')}:{at:0,name:''}}
 function persistent(){return window.__OSCP_STORAGE_PERSISTENT__!==false}
 function markBackup(name){safeSet(KEY_BACKUP,JSON.stringify({at:Date.now(),name:String(name||'session backup')}));renderAll()}
 function contrastOn(){return document.body.classList.contains('v34HighContrast')}
 function setContrast(on){document.body.classList.toggle('v34HighContrast',!!on);safeSet(KEY_CONTRAST,on?'1':'0');renderAll()}
 function safetyRows(){
   const b=backupInfo(),age=b.at?Date.now()-b.at:Infinity;
   return[
     {title:'Browser persistence',state:persistent()?'good':'bad',detail:persistent()?'Persistent localStorage is available.':'Storage fallback is memory-only; export a session backup before closing the tab.'},
     {title:'External backup',state:!b.at?'warn':age>7200000?'warn':'good',detail:b.at?(b.name+' · '+rel(b.at)):'No downloaded session backup recorded in this browser yet.'}
   ];
 }
 function ensurePanel(){
   let back=$id('v34SafetyBackdrop');if(back)return back;
   back=node('div','v34SafetyBackdrop');back.id='v34SafetyBackdrop';back.setAttribute('role','dialog');back.setAttribute('aria-modal','true');back.setAttribute('aria-labelledby','v34SafetyTitle');
   const dialog=node('div','v34SafetyDialog'),head=node('div','v34SafetyHead'),left=node('div'),title=node('h2','Exam resilience status');title.id='v34SafetyTitle';
   left.append(title,node('div','muted','Lightweight status only: persistence, external backup freshness and readability.'));
   head.append(left,btn('×',closePanel));dialog.append(head);
   const grid=node('div','v34SafetyGrid');grid.id='v34SafetyGrid';dialog.append(grid);
   const actions=node('div','v34SafetyActions');
   actions.append(
     btn('Export secret-free backup',()=>{$id('exportSession')?.click()},'btn good'),
     btn('Open Session recovery',()=>{closePanel();if(typeof switchView==='function')switchView('sessionView')}),
     btn('Open Exam Clock',()=>{closePanel();if(typeof switchView==='function')switchView('clockView')}),
     btn('High contrast',()=>setContrast(!contrastOn()))
   );
   dialog.append(actions);back.append(dialog);back.addEventListener('click',e=>{if(e.target===back)closePanel()});document.body.append(back);return back;
 }
 function renderPanel(){
   const grid=$id('v34SafetyGrid');if(!grid)return;grid.replaceChildren();
   for(const x of safetyRows()){const d=node('div','v34SafetyItem '+x.state);d.append(node('b','',x.title),node('div','tiny',x.detail));grid.append(d)}
 }
 function openPanel(){ensurePanel();renderPanel();$id('v34SafetyBackdrop')?.classList.add('open')}
 function closePanel(){$id('v34SafetyBackdrop')?.classList.remove('open')}
 function renderTop(){
   const b=$id('v34SafetyBtn');if(!b)return;
   const rows=safetyRows(),bad=rows.some(x=>x.state==='bad'),warn=rows.some(x=>x.state==='warn');
   b.className='btn'+(bad?' v34Bad':warn?' v34Warn':'');b.textContent=bad?'⚠ Safety':warn?'○ Safety':'✓ Safety';b.title=rows.map(x=>x.title+': '+x.detail).join('\n');
 }
 function renderRecovery(){
   const root=$id('v34RecoveryStatus');if(!root)return;root.replaceChildren();const b=backupInfo();
   for(const x of safetyRows()){const d=node('div','v34RecoveryMetric');d.append(node('b','',x.title),node('div','tiny',x.detail));root.append(d)}
   const note=$id('v34BackupNote');if(note)note.textContent=b.at?'Last downloaded backup: '+new Date(b.at).toLocaleString()+' ('+b.name+').':'No downloaded session backup recorded yet. Local autosnapshots help, but keep an external file too.';
 }
 function renderContrastButton(){const b=$id('v34ContrastBtn');if(b)b.textContent=contrastOn()?'High contrast: ON':'High contrast: OFF'}
 function renderAll(){renderTop();renderPanel();renderRecovery();renderContrastButton()}
 function addEntryPoints(){
   const help=$id('examHelpBtn'),top=help?.parentElement;
   if(top&&!$id('v34SafetyBtn')){const b=btn('○ Safety',openPanel);b.id='v34SafetyBtn';top.insertBefore(b,help)}
   const session=$id('sessionView'),hero=session?.querySelector('.hero');
   if(session&&hero&&!$id('v34RecoveryCard')){
     const card=node('div','card v34RecoveryCard');card.id='v34RecoveryCard';const h=node('div','row'),left=node('div');
     left.append(node('h2','', 'Exam-state resilience'),node('div','muted','Keep an external session file in addition to local autosnapshots.'));
     h.append(left,btn('Open safety status',openPanel,'btn primary'));card.append(h);
     const note=node('div','tiny');note.id='v34BackupNote';card.append(note);
     const metrics=node('div','v34RecoveryStatus');metrics.id='v34RecoveryStatus';card.append(metrics);hero.insertAdjacentElement('afterend',card);
   }
   const rp=$id('readabilityPanel');
   if(rp&&!$id('v34ContrastBtn')){const g=node('div','readerGroup'),lab=node('div','readerLabel','Contrast'),wrap=node('div','readerButtons'),b=btn('High contrast: OFF',()=>setContrast(!contrastOn()));b.id='v34ContrastBtn';wrap.append(b);g.append(lab,wrap);rp.append(g)}
   const actions=window.OSCP_V26?.actions;
   if(Array.isArray(actions)&&!actions.some(x=>x.id==='v34-safety'))actions.push({id:'v34-safety',icon:'🛟',title:'Exam resilience status',desc:'Storage persistence and backup freshness',kind:'safety',keys:'backup safety recovery storage',run:openPanel});
 }
 function setupBackupTracking(){
   const plain=$id('exportSession'),enc=$id('exportEncrypted');
   if(plain&&!plain.dataset.v34BackupTrack){plain.dataset.v34BackupTrack='1';plain.addEventListener('click',()=>markBackup('oscp-session.json'))}
   if(enc&&!enc.dataset.v34BackupTrack){enc.dataset.v34BackupTrack='1';enc.addEventListener('click',()=>{const pass=$id('encPassphrase')?.value||'';if(pass.length>=8)markBackup('oscp-encrypted-backup.json')})}
 }
 function start(){
   document.body.classList.toggle('v34HighContrast',safeGet(KEY_CONTRAST,'0')==='1');
   ensurePanel();addEntryPoints();setupBackupTracking();renderAll();
   try{if(typeof V16_SELF_TESTS!=='undefined')V16_SELF_TESTS.push(['V34 lightweight resilience',()=>[!!$id('v34SafetyBtn')&&!!$id('v34SafetyBackdrop'),'no background render loop']])}catch(_){}
   window.OSCP_V34={openPanel,closePanel,backupInfo,setContrast,render:renderAll};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start()
})();
