
(()=>{
 'use strict';
 const STORE='oscp:attempt-ledger:v28';let all={};let lastKey='';
 const $id=id=>document.getElementById(id);
 function key(){try{return (typeof activeTarget==='function'&&activeTarget()?.id)||'__global__'}catch(_){return'__global__'}}
 function load(){try{const x=JSON.parse(localStorage.getItem(STORE)||'{}');all=x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch(_){all={}}}
 function save(){try{localStorage.setItem(STORE,JSON.stringify(all));return true}catch(_){return false}}
 function entries(){return Array.isArray(all[key()])?all[key()]:[]}
 function norm(s){return String(s||'').toLowerCase().replace(/\s+/g,' ').trim()}
 function esc(s){return window.OSCP_UTILS.escapeHtml(s)}
 function outcomeLabel(v){return({evidence:'new evidence',success:'worked',negative:'negative',blocked:'blocked'})[v]||v}
 function nonProgressStreak(){
   let n=0;for(const e of [...entries()].reverse()){if(e.outcome==='negative'||e.outcome==='blocked')n++;else break}return n
 }
 function duplicateFor(action){
   const n=norm(action);if(!n)return null;return [...entries()].reverse().find(e=>norm(e.action)===n)||null
 }
 function renderHint(){
   const a=$id('attemptAction')?.value||'',hit=duplicateFor(a),h=$id('attemptDuplicateHint'),btn=$id('attemptAdd');if(!h||!btn)return;
   if(hit){h.textContent='Already logged '+new Date(hit.at).toLocaleTimeString()+': '+outcomeLabel(hit.outcome)+' — '+(hit.result||'no result text');btn.classList.add('warn')}else{h.textContent='';btn.classList.remove('warn')}
 }
 function rowHTML(e){
   return '<div class="attemptRow" data-attempt-id="'+esc(e.id)+'"><span class="attemptOutcome '+esc(e.outcome)+'">'+esc(outcomeLabel(e.outcome))+'</span><div><div class="attemptAction">'+esc(e.action)+'</div><div class="attemptResult">'+esc(e.result||'')+'</div></div><span class="attemptTime">'+new Date(e.at).toLocaleTimeString()+'</span><button class="btn bad attemptDelete" type="button" title="Delete this ledger entry">×</button></div>'
 }
 function render(){
   const list=$id('attemptLedgerList'),streak=nonProgressStreak(),badge=$id('attemptStreak');
   if(list){const xs=[...entries()].reverse();list.innerHTML=xs.length?xs.map(rowHTML).join(''):'<div class="muted">No attempts recorded for this target yet.</div>';list.querySelectorAll('.attemptDelete').forEach(b=>b.addEventListener('click',()=>remove(b.closest('[data-attempt-id]')?.dataset.attemptId)))}
   if(badge){badge.textContent=streak+' non-progress';badge.className='attemptStreak'+(streak>=3?' bad':streak>=2?' warn':'')}
   renderWorkspace();renderStripButton();renderHint()
 }
 function add(){
   const action=String($id('attemptAction')?.value||'').trim(),result=String($id('attemptResult')?.value||'').trim(),outcome=$id('attemptOutcome')?.value||'evidence';
   if(!action){if(typeof toast==='function')toast('Describe the branch/test first');return}
   const hit=duplicateFor(action);
   if(hit&&norm(hit.result)===norm(result)&&hit.outcome===outcome){if(typeof toast==='function')toast('Exact attempt already logged — do not repeat it');renderHint();return}
   const arr=entries(),entry={id:String(Date.now())+'-'+Math.random().toString(36).slice(2,7),at:Date.now(),action,result,outcome};arr.push(entry);all[key()]=arr.slice(-100);save();
   if($id('attemptAction'))$id('attemptAction').value='';if($id('attemptResult'))$id('attemptResult').value='';
   try{const t=typeof activeTarget==='function'?activeTarget():null;if(t&&typeof logEvent==='function'){logEvent(t,'attempt',action+' → '+outcomeLabel(outcome)+(result?': '+result:''));if(typeof saveTargets==='function')saveTargets()}}catch(_){}
   render();
   const streak=nonProgressStreak();if(streak>=2&&typeof toast==='function')toast(streak+' consecutive non-progress attempts — redefine the hypothesis or rotate')
 }
 function remove(id){if(!id)return;all[key()]=entries().filter(e=>e.id!==id);save();render()}
 function renderWorkspace(){
   const root=$id('workspaceAttemptLedger');if(!root)return;const xs=[...entries()].reverse().slice(0,6);
   root.innerHTML=xs.length?xs.map(e=>'<div class="attemptWorkspaceItem"><b>'+esc(outcomeLabel(e.outcome))+' · '+esc(e.action)+'</b><span>'+esc(e.result||'')+' · '+new Date(e.at).toLocaleTimeString()+'</span></div>').join(''):'No attempts logged for this target.';
 }
 function openLedger(){
   window.OSCP_V26?.openWork?.();setTimeout(()=>{$id('attemptAction')?.focus();$id('attemptLedgerList')?.scrollIntoView({block:'nearest'})},50)
 }
 function renderStripButton(){
   const actions=$id('activeWorkStrip')?.querySelector('.workStripActions');if(!actions)return;
   let b=$id('workStripAttempts');if(!b){b=document.createElement('button');b.id='workStripAttempts';b.type='button';b.className='btn workStripAttempts';b.addEventListener('click',openLedger);actions.insertBefore(b,actions.firstChild)}
   const n=entries().length,streak=nonProgressStreak();b.textContent='Tried '+n+(streak>=2?' · '+streak+'× no progress':'');b.className='btn workStripAttempts'+(streak>=3?' bad':streak>=2?' warn':'');b.title=streak>=2?'Repeated non-progress: redefine hypothesis or rotate':'Open tried/result ledger'
 }
 function extendPacket(){
   const original=window.OSCP_V26?.packet;if(typeof original!=='function'||window.OSCP_V28_PACKET_WRAPPED)return;
   window.OSCP_V28_PACKET_WRAPPED=true;window.OSCP_V26.packet=function(){const base=original(),xs=[...entries()].reverse().slice(0,5).reverse();return base+(xs.length?'\nTRIED:\n'+xs.map(e=>'  - ['+outcomeLabel(e.outcome)+'] '+e.action+(e.result?' → '+e.result:'')).join('\n'):'')}
 }
 load();
 function start(){
   $id('attemptAdd')?.addEventListener('click',add);$id('attemptAction')?.addEventListener('input',renderHint);$id('attemptResult')?.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();add()}});
   $id('workspaceAttemptOpen')?.addEventListener('click',openLedger);render();extendPacket();lastKey=key();
   const root=$id('activeWorkStrip');if(root)new MutationObserver(()=>renderStripButton()).observe(root,{childList:true});
   setInterval(()=>{const k=key();if(k!==lastKey){lastKey=k;render()}},900);
   try{if(typeof V16_SELF_TESTS!=='undefined')V16_SELF_TESTS.push(
     ['V28 attempt ledger',()=>[!!$id('attemptLedgerList')&&!!$id('workspaceAttemptLedger'),'ledger surfaces']],
     ['V28 duplicate-attempt detector',()=>[typeof duplicateFor==='function','duplicate detector']],
     ['V28 non-progress streak',()=>[typeof nonProgressStreak==='function','streak detector']]
   )}catch(_){}
   window.OSCP_V28={entries,add,remove,duplicateFor,nonProgressStreak,openLedger,render};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
