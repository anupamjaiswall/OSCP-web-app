/* V34.42: whole-reference literal find with highlights, match count, previous/next and collapsed-section reveal. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const MAX_MARKS=5000;
 let marks=[],current=-1,query='',pending=null,inputTimer=0,wrapped=false;
 const state=()=>({query,total:marks.length,current:current>=0?current+1:0,remaining:current>=0?Math.max(0,marks.length-current-1):marks.length,capped:marks.length>=MAX_MARKS});
 function referenceActive(){return $('referenceView')?.classList.contains('active')===true}
 function ensureStyle(){
  if($('refFindStyles'))return;
  const s=document.createElement('style');s.id='refFindStyles';
  s.textContent=`
#refFindBar{grid-column:1/-1;display:grid;grid-template-columns:minmax(220px,1fr) auto auto auto auto;gap:7px;align-items:center;width:100%;padding:9px 0 0;margin-top:8px;border-top:1px solid var(--line)}
#refFindInput{width:100%;min-width:0;height:38px;padding:8px 10px;border-radius:8px;font:700 12px ui-monospace,SFMono-Regular,Consolas,monospace}
#refFindCount{min-width:180px;text-align:center;font:800 12px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--text);white-space:nowrap}
#refFindBar .btn{min-height:38px;padding:7px 10px;white-space:nowrap}
mark.refFindMark{background:#f3d86b;color:#16130a!important;border-radius:2px;padding:0 .06em;box-decoration-break:clone;-webkit-box-decoration-break:clone}
mark.refFindMark.refFindCurrent{background:#ff9f43;color:#111!important;outline:2px solid #fff;outline-offset:2px}
@media(max-width:860px){#refFindBar{grid-template-columns:1fr auto auto auto}#refFindInput{grid-column:1/-1}#refFindCount{min-width:130px}}
@media(max-width:520px){#refFindBar{grid-template-columns:1fr 1fr 1fr}#refFindInput{grid-column:1/-1}#refFindCount{grid-column:1/-1;text-align:left;min-width:0}.refFindClear{grid-column:3}}
@media print{#refFindBar{display:none!important}mark.refFindMark{background:transparent!important;color:inherit!important;outline:0!important}}
`;
  document.head.appendChild(s);
 }
 function ensureBar(){
  ensureStyle();
  const nav=$('refNavigator');if(!nav)return null;
  let bar=$('refFindBar');if(bar)return bar;
  bar=document.createElement('div');bar.id='refFindBar';bar.setAttribute('role','search');bar.setAttribute('aria-label','Find text in full reference');
  const input=document.createElement('input');input.id='refFindInput';input.type='search';input.autocomplete='off';input.spellcheck=false;input.placeholder='Find in full reference: api, JWT, SMB, SeImpersonate…';input.setAttribute('aria-label','Find in full reference');
  const count=document.createElement('span');count.id='refFindCount';count.setAttribute('role','status');count.setAttribute('aria-live','polite');count.textContent='0 / 0';
  const prev=document.createElement('button');prev.id='refFindPrev';prev.className='btn';prev.type='button';prev.textContent='↑ Previous';prev.title='Previous match (Shift+Enter / Shift+F3)';
  const next=document.createElement('button');next.id='refFindNext';next.className='btn primary';next.type='button';next.textContent='↓ Next';next.title='Next match (Enter / F3)';
  const clear=document.createElement('button');clear.id='refFindClear';clear.className='btn refFindClear';clear.type='button';clear.textContent='Clear';
  bar.append(input,count,prev,next,clear);nav.appendChild(bar);
  input.addEventListener('input',()=>{clearTimeout(inputTimer);inputTimer=setTimeout(()=>find(input.value,{scroll:false}),110)});
  input.addEventListener('keydown',e=>{
   if(e.key==='Enter'){e.preventDefault();e.shiftKey?previous():nextMatch();}
   else if(e.key==='Escape'){e.preventDefault();clearFind({focus:true})}
  });
  prev.addEventListener('click',()=>previous());next.addEventListener('click',()=>nextMatch());clear.addEventListener('click',()=>clearFind({focus:true}));
  updateControls();return bar;
 }
 function updateControls(message=''){
  const count=$('refFindCount'),prev=$('refFindPrev'),next=$('refFindNext');
  if(count){
   if(message)count.textContent=message;
   else if(!query||!marks.length)count.textContent='0 / 0';
   else count.textContent=`${current+1} / ${marks.length} · ${Math.max(0,marks.length-current-1)} more${marks.length>=MAX_MARKS?' +':''}`;
  }
  if(prev)prev.disabled=marks.length===0;if(next)next.disabled=marks.length===0;
 }
 function clearMarks(){
  const parents=new Set();
  for(const mark of marks){if(!mark?.isConnected)continue;const p=mark.parentNode;if(p)parents.add(p);mark.replaceWith(document.createTextNode(mark.textContent||''))}
  for(const p of parents){try{p.normalize()}catch(_){}}
  marks=[];current=-1;
 }
 function clearFind({focus=false,keepInput=false}={}){
  clearMarks();query='';pending=null;
  const input=$('refFindInput');if(input&&!keepInput)input.value='';updateControls();
  if(focus)input?.focus();
  return state();
 }
 function blockedTextNode(node){
  const p=node?.parentElement;if(!p)return true;
  return !!p.closest('script,style,textarea,input,select,option,button,#refNavigator,#refFindBar,.copyBtn,.refFindMark,[hidden]');
 }
 function collectTextNodes(root,needle){
  const out=[],lowerNeedle=needle.toLocaleLowerCase();
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
   if(blockedTextNode(node))return NodeFilter.FILTER_REJECT;
   const value=String(node.nodeValue||'');return value.toLocaleLowerCase().includes(lowerNeedle)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
  }});
  while(walker.nextNode())out.push(walker.currentNode);return out;
 }
 function markNode(node,needle){
  const text=String(node.nodeValue||''),lower=text.toLocaleLowerCase(),findLower=needle.toLocaleLowerCase();
  let pos=0,hit=lower.indexOf(findLower,pos);if(hit<0)return;
  const frag=document.createDocumentFragment();
  while(hit>=0&&marks.length<MAX_MARKS){
   if(hit>pos)frag.appendChild(document.createTextNode(text.slice(pos,hit)));
   const m=document.createElement('mark');m.className='refFindMark';m.textContent=text.slice(hit,hit+needle.length);m.dataset.refFind=String(marks.length+1);frag.appendChild(m);marks.push(m);
   pos=hit+needle.length;hit=lower.indexOf(findLower,pos);
  }
  if(pos<text.length)frag.appendChild(document.createTextNode(text.slice(pos)));
  node.replaceWith(frag);
 }
 function expandPath(el){
  const details=[];for(let cur=el?.parentElement;cur;cur=cur.parentElement)if(cur.tagName==='DETAILS')details.push(cur);
  details.reverse().forEach(d=>{d.open=true});
 }
 function activate(index,{scroll=true}={}){
  if(!marks.length){current=-1;updateControls();return null}
  for(const m of marks)m.classList.remove('refFindCurrent');
  current=((Number(index)||0)%marks.length+marks.length)%marks.length;
  const mark=marks[current];mark.classList.add('refFindCurrent');expandPath(mark);
  if(scroll)mark.scrollIntoView({behavior:'auto',block:'center',inline:'nearest'});
  updateControls();return mark;
 }
 function preferredIndex(anchor){
  if(!anchor)return 0;const el=$(anchor);if(!el)return 0;
  const direct=marks.findIndex(m=>el.contains(m));if(direct>=0)return direct;
  const detail=el.closest?.('details[id]');if(detail){const i=marks.findIndex(m=>detail.contains(m));if(i>=0)return i}
  return 0;
 }
 function find(value,{anchor='',scroll=true}={}){
  ensureBar();const nextQuery=String(value||'').trim();clearMarks();query=nextQuery;
  const input=$('refFindInput');if(input&&input.value!==nextQuery)input.value=nextQuery;
  if(!nextQuery){updateControls();return state()}
  if(nextQuery.length<2){updateControls('Type 2+ chars');return state()}
  if(window.OSCP_REFERENCE_READY!==true){pending={value:nextQuery,anchor,scroll};window.OSCP_REFERENCE?.start?.();updateControls('Loading…');return {...state(),pending:true}}
  const root=$('referenceRoot');if(!root){updateControls('Reference unavailable');return state()}
  const nodes=collectTextNodes(root,nextQuery);
  for(const node of nodes){if(marks.length>=MAX_MARKS)break;markNode(node,nextQuery)}
  if(!marks.length){updateControls();return state()}
  activate(preferredIndex(anchor),{scroll});return state();
 }
 function nextMatch({scroll=true}={}){return activate(current<0?0:current+1,{scroll})}
 function previous({scroll=true}={}){return activate(current<0?marks.length-1:current-1,{scroll})}
 function focus(seed=''){
  ensureBar();const input=$('refFindInput');if(seed&&!input.value)input.value=seed;input?.focus();input?.select();
 }
 function wrapOpenRef(){
  if(wrapped||typeof window.openRef!=='function')return;
  const base=window.openRef;
  const fn=function(anchor){
   const q=String($('globalSearch')?.value||'').trim();
   const result=base(anchor);
   return Promise.resolve(result).then(ok=>{if(ok&&q)find(q,{anchor,scroll:true});return ok});
  };
  fn.__oscpRefFind=true;fn.__baseOpenRef=base;window.openRef=fn;
  try{openRef=fn}catch(_){}
  wrapped=true;
 }
 function onReferenceReady(){
  setTimeout(()=>{ensureBar();if(pending){const p=pending;pending=null;find(p.value,{anchor:p.anchor,scroll:p.scroll})}},0);
 }
 function start(){
  ensureStyle();setTimeout(()=>{ensureBar();wrapOpenRef()},0);
  document.addEventListener('oscp-reference-ready',onReferenceReady);
  document.addEventListener('click',e=>{
   const mark=e.target?.closest?.('mark.refFindMark');if(mark){const i=marks.indexOf(mark);if(i>=0)activate(i,{scroll:false});return}
   if(e.target?.closest?.('[data-view="referenceView"]'))setTimeout(()=>{ensureBar();const q=String($('globalSearch')?.value||'').trim();if(q&&!query)find(q,{scroll:false})},0)
  },true);
  document.addEventListener('keydown',e=>{if(!referenceActive()||!marks.length)return;if(e.key==='F3'){e.preventDefault();e.shiftKey?previous():nextMatch()}},true);
  window.OSCP_REFERENCE_FIND={find,next:nextMatch,prev:previous,previous,clear:clearFind,focus,state,ensureBar};
  try{if(typeof V16_SELF_TESTS!=='undefined')V16_SELF_TESTS.push(
   ['V34.42 reference find controller',()=>[typeof window.OSCP_REFERENCE_FIND?.find==='function'&&typeof window.OSCP_REFERENCE_FIND?.next==='function'&&typeof window.OSCP_REFERENCE_FIND?.prev==='function','find/prev/next']],
   ['V34.42 reference find reveals collapsed match',()=>{
    if(window.OSCP_REFERENCE_READY!==true)return[true,'deferred until reference hydration'];
    const root=$('referenceRoot');if(!root)return[false,'reference root missing'];
    const outer=document.createElement('details'),inner=document.createElement('details'),p=document.createElement('p');outer.id='refFindSelfOuter';inner.id='refFindSelfInner';p.textContent='subdomain self-test keyword';inner.appendChild(p);outer.appendChild(inner);root.appendChild(outer);outer.open=false;inner.open=false;
    const r=find('subdomain',{anchor:inner.id,scroll:false});const ok=r.total>0&&outer.open&&inner.open&&inner.querySelectorAll('mark.refFindMark').length>0;clearFind();outer.remove();return[ok,`${r.total} matches · nested=${outer.open&&inner.open}`]
   }]
  )}catch(_){}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
