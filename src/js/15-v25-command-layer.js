
(()=>{
 'use strict';
 const NOTE_STORE='oscp:quick-note:v25';
 const SOLO_STORE='oscp:ref-solo:v25';
 let solo=false,baseOpenRef25=null;

 const $id=id=>document.getElementById(id);
 function safeGet(k,d=''){try{const v=localStorage.getItem(k);return v===null?d:v}catch(_){return d}}
 function safeSet(k,v){try{localStorage.setItem(k,v);return true}catch(_){return false}}
 function targetContext(){
   try{
     const t=typeof activeTarget==='function'?activeTarget():null;
     if(!t)return null;
     const next=(Array.isArray(t.next)?t.next.find(x=>String(x||'').trim()):'')||'';
     return {label:t.ip||t.host||'unnamed target',role:t.role||'unknown',stage:t.stage||'enumeration',next};
   }catch(_){return null}
 }
 function renderTopContext(){
   const b=$id('topTargetContext');if(!b)return;
   const t=targetContext();
   if(!t){b.textContent='No target';b.title='No active target — open Current target';return}
   b.textContent=t.label+' · '+t.stage;
   b.title=[t.label,t.role,t.stage,t.next?('Next: '+t.next):''].filter(Boolean).join(' · ');
 }
 function goTree(kind){
   if(typeof switchView==='function')switchView('methodTreesView');
   setTimeout(()=>window.OSCP_TREE_READER?.show?.(kind),30);
 }
 function route(kind){
   switch(kind){
     case'ports':switchView('serviceRouterView');setTimeout(()=>$id('serviceRouterInput')?.focus(),40);break;
     case'web':window.OSCP_TAG_LINKS?.goToTag?.('[WEB:ENUM]');break;
     case'linux':goTree('linux');break;
     case'windows':goTree('windows');break;
     case'ad':goTree('ad');break;
     case'credential':switchView('credentialsView');break;
     case'pivot':window.OSCP_TAG_LINKS?.goToTag?.('[PIVOT:FLOW]');break;
     case'proof':$id('examBankBtn')?.click();break;
   }
 }
 function setupRouter(){
   document.querySelectorAll('[data-v25-route]').forEach(b=>b.addEventListener('click',()=>route(b.dataset.v25Route)));
 }

 function note(open){
   const back=$id('quickNoteBackdrop');if(!back)return;
   back.classList.toggle('open',!!open);
   if(open){const ta=$id('quickNoteText');ta.value=safeGet(NOTE_STORE,'');renderNoteMeta();setTimeout(()=>ta.focus(),0);}
 }
 function renderNoteMeta(){
   const m=$id('quickNoteMeta'),t=targetContext();if(!m)return;
   m.textContent=(t?('Context: '+t.label+' · '+t.role+' · '+t.stage+' · '):'')+'autosaved locally in this browser.';
 }
 function noteStamp(){
   const ta=$id('quickNoteText');if(!ta)return;
   const t=targetContext(),stamp=new Date().toLocaleString();
   const block='\n['+stamp+']'+(t?' '+t.label+' · '+t.role+' · '+t.stage:'')+(t?.next?'\nNext tracked action: '+t.next:'')+'\n';
   const pos=ta.selectionStart??ta.value.length;ta.value=ta.value.slice(0,pos)+block+ta.value.slice(pos);safeSet(NOTE_STORE,ta.value);ta.focus();ta.selectionStart=ta.selectionEnd=pos+block.length;renderNoteMeta();
 }
 function setupNote(){
   const ta=$id('quickNoteText');
   ta?.addEventListener('input',()=>{safeSet(NOTE_STORE,ta.value);renderNoteMeta()});
   $id('quickNoteClose')?.addEventListener('click',()=>note(false));
   $id('quickNoteBackdrop')?.addEventListener('click',e=>{if(e.target===$id('quickNoteBackdrop'))note(false)});
   $id('quickNoteStamp')?.addEventListener('click',noteStamp);
   $id('quickNoteCopy')?.addEventListener('click',async()=>{const ok=typeof copyText==='function'?await copyText(ta?.value||''):false;if(typeof toast==='function')toast(ok?'Quick note copied':'Copy blocked')});
   $id('quickNoteClear')?.addEventListener('click',()=>{if(!confirm('Clear the local quick note?'))return;if(ta)ta.value='';safeSet(NOTE_STORE,'');renderNoteMeta()});
 }

 function currentRefAnchor(){
   try{
     const entries=window.OSCP_V24?.refEntries?.()||[];
     const sel=$id('refSectionSelect');
     return sel?.value||entries[0]?.anchor||'';
   }catch(_){return''}
 }
 function applySolo(anchor){
   const root=$id('referenceRoot');if(!root)return;
   const target=document.getElementById(anchor);
   const owner=target?.closest?.('details[id]')||target;
   root.querySelectorAll('details[id],h2[id],h3[id]').forEach(el=>{
     const same=el===owner||el.contains?.(owner)||owner?.contains?.(el);
     el.classList.toggle('refSoloHidden',solo&&!same);
   });
   if(owner?.tagName==='DETAILS')owner.open=true;
   $id('refNavigator')?.classList.toggle('soloOn',solo);
   const b=$id('refSoloCurrent');if(b){b.classList.toggle('active',solo);b.textContent=solo?'◉ Solo':'○ Solo'}
 }
 function setupSolo(){
   solo=safeGet(SOLO_STORE,'0')==='1';
   const nav=$id('refNavigator');if(!nav)return;
   if(!$id('refSoloCurrent')){
     const b=document.createElement('button');b.id='refSoloCurrent';b.type='button';b.className='btn refNavSecondary';b.textContent='○ Solo';b.title='Show only the current reference section';
     const pos=$id('refPosition');nav.insertBefore(b,pos||null);
     b.addEventListener('click',()=>{solo=!solo;safeSet(SOLO_STORE,solo?'1':'0');applySolo(currentRefAnchor())});
   }
   if(solo)applySolo(currentRefAnchor());
   if(typeof openRef==='function'){
     baseOpenRef25=openRef;
     openRef=function(anchor){
       if(solo)applySolo(anchor);
       const out=baseOpenRef25(anchor);
       if(solo)setTimeout(()=>applySolo(anchor),35);
       return out;
     };
   }
 }

 function addReaderNoteButton(){
   const panel=$id('readabilityPanel');if(!panel||$id('readerQuickNoteGroup'))return;
   const g=document.createElement('div');g.id='readerQuickNoteGroup';g.className='readerGroup';
   g.innerHTML='<div class="readerLabel">Capture before rotating</div><button class="btn" id="readerQuickNoteBtn" type="button" style="width:100%">📝 Quick note · Alt+N</button>';
   panel.appendChild(g);$id('readerQuickNoteBtn')?.addEventListener('click',()=>note(true));
 }
 function setupKeys(){
   document.addEventListener('keydown',e=>{
     const tag=(e.target?.tagName||'').toLowerCase(),editing=['input','textarea','select'].includes(tag)||e.target?.isContentEditable;
     if(e.key==='Escape'&&$id('quickNoteBackdrop')?.classList.contains('open')){e.preventDefault();e.stopImmediatePropagation();note(false);return}
     if(e.altKey&&!e.ctrlKey&&!e.metaKey&&String(e.key).toLowerCase()==='n'){e.preventDefault();e.stopImmediatePropagation();note(true);return}
     if(!editing&&e.key.toLowerCase()==='n'&&e.shiftKey&&e.altKey){e.preventDefault();note(true)}
   },true);
 }

 function start(){
   setupRouter();setupNote();setupSolo();addReaderNoteButton();setupKeys();
   $id('topTargetContext')?.addEventListener('click',()=>switchView('workspaceView'));
   renderTopContext();setInterval(renderTopContext,2000);
   try{
     if(typeof V16_SELF_TESTS!=='undefined'){
       V16_SELF_TESTS.push(
        ['Evidence state router',()=>[document.querySelectorAll('[data-v25-route]').length===8,'8 state routes']],
        ['Top target context',()=>[!!$id('topTargetContext'),'target context']],
        ['Quick exam note',()=>[!!$id('quickNoteBackdrop')&&!!$id('quickNoteText'),'local scratchpad']],
        ['Solo reference mode',()=>[!!$id('refSoloCurrent'),'solo reference']]
       );
     }
   }catch(_){}
   window.OSCP_V25={route,note,renderTopContext,applySolo,solo:()=>solo};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
