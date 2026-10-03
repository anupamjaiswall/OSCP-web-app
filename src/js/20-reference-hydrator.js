(()=>{
 'use strict';
 const root=document.getElementById('referenceRoot'),payload=document.getElementById('referencePayload'),status=document.getElementById('referenceLoading');
 let ready=false,hydratePromise=null,lastError=null;
 let findMarks=[],findIndex=-1,findQuery='',findTimer=null,findGeneration=0;
 const nextTask=()=>new Promise(r=>setTimeout(r,0));
 const findActive=()=>document.getElementById('referenceView')?.classList.contains('active')===true;
 function finish(){
   if(ready)return true;
   ready=true;lastError=null;window.OSCP_REFERENCE_READY=true;status?.remove();
   try{if(typeof prepareCode==='function')prepareCode()}catch(_){}
   document.dispatchEvent(new CustomEvent('oscp-reference-ready'));
   if(findActive())scheduleReferenceFind(document.getElementById('globalSearch')?.value||'',0);
   return true;
 }
 function fail(e){
   lastError=e instanceof Error?e:new Error(String(e));window.OSCP_REFERENCE_READY=false;
   console.error('[OSCP] Reference hydration failed',lastError);
   if(status){status.className='card';status.replaceChildren();const b=document.createElement('b');b.textContent='Deep reference could not load.';const d=document.createElement('div');d.className='tiny';d.textContent=String(lastError.message||lastError);status.append(b,d)}
   document.dispatchEvent(new CustomEvent('oscp-reference-failed',{detail:{message:String(lastError.message||lastError)}}));
   return false;
 }
 function decodePayload(){
   const raw=String(payload?.textContent||'').trim();
   if(!raw)throw new Error('Embedded reference payload is empty.');
   let html='';
   try{html=JSON.parse(raw)}catch(e){throw new Error('Embedded reference payload is invalid: '+String(e?.message||e))}
   if(typeof html!=='string'||!html.trim())throw new Error('Embedded reference payload did not decode to text.');
   return html;
 }
 function appendHtml(html){
   const range=document.createRange();range.selectNodeContents(root);
   root.appendChild(range.createContextualFragment(String(html||'')));
 }
 async function hydrateReferenceOnce(){
   if(ready)return true;
   if(!root||!payload)return fail(new Error('Reference container or payload is missing.'));
   if(status)status.textContent='Loading deep reference…';
   try{
     const html=decodePayload();
     await nextTask();
     appendHtml(html);
     return finish();
   }catch(e){return fail(e)}
 }
 function start(){
   if(ready)return Promise.resolve(true);
   if(hydratePromise)return hydratePromise;
   hydratePromise=hydrateReferenceOnce().finally(()=>{if(!ready)hydratePromise=null});
   return hydratePromise;
 }
 async function waitForAnchor(anchor,{timeout=12000}={}){
   anchor=String(anchor||'').trim();if(!anchor)return null;
   const existing=document.getElementById(anchor);if(existing)return existing;
   const ok=await Promise.race([
     start(),
     new Promise(r=>setTimeout(()=>r(false),Math.max(500,Number(timeout)||12000)))
   ]);
   if(!ok||lastError)return null;
   return document.getElementById(anchor);
 }
 function installFindStyles(){
   if(document.getElementById('referenceFindStyles'))return;
   const style=document.createElement('style');style.id='referenceFindStyles';style.textContent=`
#referenceFindBar{position:sticky;top:64px;z-index:75;display:flex;gap:8px;align-items:center;flex-wrap:wrap;max-width:1180px;margin:0 auto 12px;padding:8px 10px;border:1px solid #526f8c;border-radius:10px;background:rgba(13,17,25,.97);box-shadow:0 10px 28px rgba(0,0,0,.28)}
#referenceFindBar[hidden]{display:none!important}.referenceFindLabel{font-weight:800}.referenceFindQuery{max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 12px ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--accent)}
#referenceFindCount{font:800 12px ui-monospace,SFMono-Regular,Consolas,monospace;min-width:64px}.referenceFindRemaining{color:var(--muted);font-size:11px}.referenceFindSpacer{flex:1}.referenceFindHint{color:var(--muted);font-size:10px}
.refFindMark{background:#f3d66b;color:#111!important;border-radius:2px;padding:0 .04em;box-decoration-break:clone;-webkit-box-decoration-break:clone}.refFindMark.refFindActive{background:#ff9f43;color:#111!important;outline:2px solid #fff;outline-offset:2px}
@media(max-width:800px){#referenceFindBar{top:64px;margin-left:0;margin-right:0}.referenceFindHint{display:none}.referenceFindSpacer{display:none}.referenceFindQuery{max-width:180px}}
@media print{#referenceFindBar{display:none!important}.refFindMark{background:transparent!important;color:inherit!important;outline:0!important}}
`;
   document.head.append(style)
 }
 function ensureFindBar(){
   installFindStyles();let bar=document.getElementById('referenceFindBar');if(bar)return bar;
   const view=document.getElementById('referenceView');if(!view)return null;
   bar=document.createElement('div');bar.id='referenceFindBar';bar.hidden=true;bar.setAttribute('role','search');bar.setAttribute('aria-label','Find matches in full reference');
   const label=document.createElement('span');label.className='referenceFindLabel';label.textContent='Find in reference';
   const query=document.createElement('span');query.id='referenceFindQuery';query.className='referenceFindQuery';
   const count=document.createElement('span');count.id='referenceFindCount';count.setAttribute('role','status');count.setAttribute('aria-live','polite');count.textContent='0 / 0';
   const remaining=document.createElement('span');remaining.id='referenceFindRemaining';remaining.className='referenceFindRemaining';
   const spacer=document.createElement('span');spacer.className='referenceFindSpacer';
   const hint=document.createElement('span');hint.className='referenceFindHint';hint.textContent='Enter next · Shift+Enter previous · F3';
   const prev=document.createElement('button');prev.id='referenceFindPrev';prev.className='btn';prev.type='button';prev.textContent='↑ Previous';prev.addEventListener('click',()=>stepReferenceFind(-1));
   const next=document.createElement('button');next.id='referenceFindNext';next.className='btn primary';next.type='button';next.textContent='↓ Next';next.addEventListener('click',()=>stepReferenceFind(1));
   const clear=document.createElement('button');clear.id='referenceFindClear';clear.className='btn';clear.type='button';clear.textContent='×';clear.title='Clear find highlights';clear.setAttribute('aria-label','Clear reference find');clear.addEventListener('click',()=>{const input=document.getElementById('globalSearch');if(input){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()}else clearReferenceFind()});
   bar.append(label,query,count,remaining,spacer,hint,prev,next,clear);view.insertBefore(bar,root||view.firstChild);return bar
 }
 function clearReferenceFind({hide=true}={}){
   const parents=new Set();for(const mark of findMarks){const p=mark.parentNode;if(!p)continue;parents.add(p);p.replaceChild(document.createTextNode(mark.textContent||''),mark)}for(const p of parents)try{p.normalize()}catch(_){}
   findMarks=[];findIndex=-1;findQuery='';const bar=ensureFindBar();if(bar&&hide)bar.hidden=true;updateFindBar()
 }
 function updateFindBar(){
   const bar=ensureFindBar();if(!bar)return;const total=findMarks.length,position=total&&findIndex>=0?findIndex+1:0;
   const query=document.getElementById('referenceFindQuery'),count=document.getElementById('referenceFindCount'),remaining=document.getElementById('referenceFindRemaining'),prev=document.getElementById('referenceFindPrev'),next=document.getElementById('referenceFindNext');
   if(query)query.textContent=findQuery?'“'+findQuery+'”':'';if(count)count.textContent=position+' / '+total;if(remaining)remaining.textContent=total?(Math.max(0,total-position)+' after'):'No matches';if(prev)prev.disabled=!total;if(next)next.disabled=!total
 }
 function expandFindAncestors(el){for(let cur=el?.parentElement;cur;cur=cur.parentElement)if(cur.tagName==='DETAILS')cur.open=true}
 function activateReferenceFind(index,{scroll=true}={}){
   if(!findMarks.length){findIndex=-1;updateFindBar();return false}for(const m of findMarks)m.classList.remove('refFindActive');findIndex=((Number(index)||0)%findMarks.length+findMarks.length)%findMarks.length;const mark=findMarks[findIndex];mark.classList.add('refFindActive');expandFindAncestors(mark);if(scroll)mark.scrollIntoView({block:'center',inline:'nearest',behavior:'auto'});updateFindBar();return true
 }
 function stepReferenceFind(delta){return activateReferenceFind((findIndex<0?0:findIndex)+(Number(delta)||1))}
 function shouldSkipTextNode(textNode){
   const p=textNode?.parentElement;if(!p||!String(textNode.nodeValue||'').trim())return true;
   return !!p.closest('script,style,noscript,textarea,input,select,option,button,svg,[contenteditable="true"],#referenceFindBar,.refFindMark')
 }
 function highlightReferenceText(query){
   if(!root)return[];const needle=String(query||'').toLocaleLowerCase();if(!needle)return[];
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];let n;while((n=walker.nextNode()))if(!shouldSkipTextNode(n)&&String(n.nodeValue||'').toLocaleLowerCase().includes(needle))nodes.push(n);
   const marks=[];for(const textNode of nodes){const source=String(textNode.nodeValue||''),lower=source.toLocaleLowerCase();let from=0,at=lower.indexOf(needle);if(at<0)continue;const frag=document.createDocumentFragment();while(at>=0){if(at>from)frag.append(document.createTextNode(source.slice(from,at)));const mark=document.createElement('mark');mark.className='refFindMark';mark.textContent=source.slice(at,at+query.length);frag.append(mark);marks.push(mark);from=at+query.length;at=lower.indexOf(needle,from)}if(from<source.length)frag.append(document.createTextNode(source.slice(from)));textNode.parentNode?.replaceChild(frag,textNode)}return marks
 }
 async function runReferenceFind(rawQuery,{scroll=true}={}){
   const generation=++findGeneration,q=String(rawQuery||'').trim(),bar=ensureFindBar(),sameQuery=q===findQuery&&findMarks.length>0;
   if(q.length<2){clearReferenceFind();return{query:q,total:0,index:-1}}
   if(bar){bar.hidden=false;const query=document.getElementById('referenceFindQuery');if(query)query.textContent='“'+q+'”';const count=document.getElementById('referenceFindCount');if(count)count.textContent=ready?'Finding…':'Loading reference…'}
   if(!ready){const ok=await start();if(!ok||generation!==findGeneration)return{query:q,total:0,index:-1}}
   if(generation!==findGeneration)return{query:q,total:0,index:-1};
   if(sameQuery){if(bar)bar.hidden=false;updateFindBar();return{query:q,total:findMarks.length,index:findIndex}}
   clearReferenceFind({hide:false});findQuery=q;findMarks=highlightReferenceText(q);if(findMarks.length)activateReferenceFind(0,{scroll});else{findIndex=-1;updateFindBar()}if(bar)bar.hidden=false;return{query:q,total:findMarks.length,index:findIndex}
 }
 function scheduleReferenceFind(q,delay=110){clearTimeout(findTimer);const value=String(q||'');findTimer=setTimeout(()=>{if(findActive())runReferenceFind(value).catch(e=>console.error('[OSCP] Reference find failed',e))},Math.max(0,delay))}
 function installReferenceFind(){
   const bar=ensureFindBar(),input=document.getElementById('globalSearch'),view=document.getElementById('referenceView');if(!input||!view)return;
   input.addEventListener('input',e=>{if(!findActive())return;e.stopImmediatePropagation();scheduleReferenceFind(input.value)},true);
   input.addEventListener('keydown',e=>{if(!findActive()||!findMarks.length)return;if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();stepReferenceFind(e.shiftKey?-1:1)}} ,true);
   document.addEventListener('keydown',e=>{if(!findActive()||!findMarks.length)return;const tag=String(e.target?.tagName||'').toLowerCase(),editing=['textarea','select'].includes(tag)||e.target?.isContentEditable;if(e.key==='F3'&&!editing){e.preventDefault();stepReferenceFind(e.shiftKey?-1:1)}},true);
   root?.addEventListener('click',e=>{const mark=e.target?.closest?.('.refFindMark');if(!mark)return;const i=findMarks.indexOf(mark);if(i>=0)activateReferenceFind(i,{scroll:false})});
   new MutationObserver(()=>{if(findActive())scheduleReferenceFind(input.value,20);else if(bar){bar.hidden=true}}).observe(view,{attributes:true,attributeFilter:['class']});
   document.addEventListener('oscp-reference-ready',()=>{if(findActive())scheduleReferenceFind(input.value,0)});
 }
 window.OSCP_REFERENCE={start,waitForAnchor,ready:()=>ready,progress:()=>({loaded:ready?1:0,total:1}),error:()=>lastError};
 window.OSCP_REFERENCE_FIND={run:runReferenceFind,next:()=>stepReferenceFind(1),previous:()=>stepReferenceFind(-1),clear:clearReferenceFind,state:()=>({query:findQuery,total:findMarks.length,index:findIndex})};
 window.OSCP_REFERENCE_READY=false;
 installReferenceFind();
 const autoStart=()=>setTimeout(()=>start(),250);
 if(document.readyState==='complete')autoStart();else window.addEventListener('load',autoStart,{once:true});
 setTimeout(()=>{if(!ready&&!hydratePromise)start()},2000);
})();