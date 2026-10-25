
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


 function setupVariableBuilder(){
   const command=$id('guardCommand');if(!command||$id('oscpVariableBuilder'))return;
   const host=command.closest('.card');if(!host)return;
   const style=document.createElement('style');style.id='oscpVariableBuilderStyles';
   style.textContent='#oscpVariableBuilder{margin-top:14px;padding:12px;border:1px solid var(--line,#344052);border-radius:12px;background:var(--panel2,#111722)}#oscpVariableBuilder .ovb-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0}#oscpVariableBuilder label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--muted,#aab4c4)}#oscpVariableBuilder input,#oscpVariableBuilder textarea{width:100%;min-width:0}#oscpVariableBuilder textarea{min-height:88px}#oscpVariableBuilder .ovb-actions{display:flex;flex-wrap:wrap;gap:7px;margin:8px 0}#oscpVariableBuilder .ovb-help{font-size:12px;color:var(--muted,#aab4c4);margin-top:6px}@media(max-width:650px){#oscpVariableBuilder .ovb-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}';
   document.head.appendChild(style);
   const panel=document.createElement('section');panel.id='oscpVariableBuilder';
   panel.innerHTML='<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><strong>⚙️ Context-aware command template</strong><span class="tiny">LOCAL ONLY · NEVER EXECUTES</span></div><p class="ovb-help">Set common non-secret values once for this page session. Use {{RHOST}}, {{LHOST}}, {{LPORT}}, {{DOMAIN}}, {{USER}}, {{URL}}, or {{PORT}} in a command template. Passwords and hashes are intentionally not stored here.</p><div class="ovb-grid"><label>RHOST / target IP<input id="ovbRhost" autocomplete="off" placeholder="Target IP"></label><label>LHOST / callback IP<input id="ovbLhost" autocomplete="off" placeholder="Your VPN IP"></label><label>LPORT<input id="ovbLport" autocomplete="off" value="4444"></label><label>DOMAIN<input id="ovbDomain" autocomplete="off" placeholder="corp.local"></label><label>USER<input id="ovbUser" autocomplete="off" placeholder="username"></label><label>PORT / service port<input id="ovbPort" autocomplete="off" placeholder="445"></label><label style="grid-column:1/-1">URL / base URL<input id="ovbUrl" autocomplete="off" placeholder="http://target/"></label></div><label>Command template<textarea id="ovbTemplate" spellcheck="false" placeholder="Example: nmap -Pn -p {{PORT}} {{RHOST}}"></textarea></label><div class="ovb-actions"><button class="btn" id="ovbFillTarget" type="button">Fill from active target</button><button class="btn primary" id="ovbExpand" type="button">Expand → command linter</button><button class="btn" id="ovbCopy" type="button">Copy expanded command</button></div><div id="ovbStatus" class="ovb-help" role="status" aria-live="polite">Values are kept in memory only and cleared on reload.</div><label>Expanded preview<textarea id="ovbPreview" readonly spellcheck="false" placeholder="Expanded command appears here."></textarea></label>';
   command.insertAdjacentElement('afterend',panel);
   const val=id=>$id(id)?.value.trim()||'';
   const vars=()=>({RHOST:val('ovbRhost'),LHOST:val('ovbLhost'),LPORT:val('ovbLport'),DOMAIN:val('ovbDomain'),USER:val('ovbUser'),URL:val('ovbUrl'),PORT:val('ovbPort')});
   const expand=()=>{
     const template=val('ovbTemplate'),v=vars();let unresolved=[];
     const out=template.replace(/\{\{([A-Z][A-Z0-9_]*)\}\}/g,(whole,key)=>{if(!(key in v)){unresolved.push(key);return whole}if(!v[key]){unresolved.push(key);return whole}return v[key]});
     $id('ovbPreview').value=out;
     const missing=[...new Set(unresolved)];
     $id('ovbStatus').textContent=missing.length?'Unresolved placeholders: '+missing.map(x=>'{{'+x+'}}').join(', ')+'. Fill them before use.':'Expanded locally. Review the exact command and run the normal command linter before use.';
     return {out,missing};
   };
   $id('ovbFillTarget').addEventListener('click',()=>{
     try{const t=typeof activeTarget==='function'?activeTarget():null;if(t){$id('ovbRhost').value=t.ip||t.host||'';$id('ovbUrl').value=t.host?'http://'+t.host+'/':(t.ip?'http://'+t.ip+'/':'');$id('ovbStatus').textContent='Filled target IP/hostname from the active workspace. Verify scheme, vhost and port manually.'}else{$id('ovbStatus').textContent='No active target found. Open Per-Target Workspace and select a target.'}}catch(_){$id('ovbStatus').textContent='Could not read active target. Fill values manually.'}
     try{const l=$id('guardLhost')?.value.trim();if(l)$id('ovbLhost').value=l}catch(_){}
     expand();
   });
   $id('guardLhost')?.addEventListener('change',()=>{if(!$id('ovbLhost').value.trim())$id('ovbLhost').value=$id('guardLhost').value.trim()});
   $id('ovbExpand').addEventListener('click',()=>{
     const r=expand();if(r.missing.length){if(typeof toast==='function')toast('Fill unresolved placeholders first');return}
     command.value=r.out;command.dispatchEvent(new Event('input',{bubbles:true}));command.dispatchEvent(new Event('change',{bubbles:true}));
     $id('guardResults')?.scrollIntoView({block:'nearest',behavior:'smooth'});
     if(typeof toast==='function')toast('Expanded into command linter — review before use');
   });
   $id('ovbCopy').addEventListener('click',async()=>{
     const r=expand();if(r.missing.length){if(typeof toast==='function')toast('Fill unresolved placeholders first');return}
     const ok=typeof copyText==='function'?await copyText(r.out):false;
     if(typeof toast==='function')toast(ok?'Expanded command copied':'Clipboard blocked');
   });
   panel.querySelectorAll('input,textarea').forEach(el=>el.addEventListener('input',()=>{if(el.id!=='ovbPreview')expand()}));
   try{if(typeof V16_SELF_TESTS!=='undefined')V16_SELF_TESTS.push(['Context-aware command template',()=>[!!$id('oscpVariableBuilder')&&!!$id('ovbExpand')&&!!$id('ovbPreview'),'session-only variable expansion']])}catch(_){}
 }

 function start(){
   setupRouter();setupNote();setupSolo();addReaderNoteButton();setupKeys();setupVariableBuilder();
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
