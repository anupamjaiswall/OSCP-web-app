
(()=>{
 'use strict';
 const RECENT_STORE='oscp:recent-nav:v24';
 const MAX_RECENT=10;
 let recent=[];let refEntries=[];let refIndex=0;let raf=0;let baseOpenRef=null;

 function $id(id){return document.getElementById(id)}
 function loadRecent(){try{const a=JSON.parse(localStorage.getItem(RECENT_STORE)||'[]');recent=Array.isArray(a)?a.slice(0,MAX_RECENT):[]}catch(_){recent=[]}}
 function saveRecent(){try{localStorage.setItem(RECENT_STORE,JSON.stringify(recent.slice(0,MAX_RECENT)))}catch(_){}}
 function cleanTitle(s){return String(s||'').replace(/\s+/g,' ').trim().slice(0,90)}
 function searchItem(anchor){try{return typeof SEARCH_ITEMS!=='undefined'&&SEARCH_ITEMS.length?SEARCH_ITEMS.find(x=>x.anchor===anchor):null}catch(_){return null}}
 function addRecent(entry){
   if(!entry||(!entry.anchor&&!entry.tag))return;
   const key=entry.tag?'t:'+entry.tag:'a:'+entry.anchor;
   recent=[{...entry,key,at:Date.now()},...recent.filter(x=>x.key!==key)].slice(0,MAX_RECENT);saveRecent();renderReaderQuick();
 }
 function addRecentAnchor(anchor){
   const item=searchItem(anchor);
   let title=item?.title;
   if(!title){
     const el=document.getElementById(anchor);
     title=el?.querySelector?.('summary')?.textContent||el?.textContent||anchor;
   }
   addRecent({anchor,title:cleanTitle(title||anchor)});
 }
 function addRecentTag(tag){addRecent({tag:String(tag),title:String(tag)})}

 function escapeText(s){return String(s||'')}
 function makeQuickButton(label,title,handler,cls='btn'){
   const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.title=title||label;b.addEventListener('click',handler);return b;
 }
 function renderReaderQuick(){
   const panel=$id('readabilityPanel');if(!panel)return;
   let root=$id('readerQuickAccess');
   if(!root){
     root=document.createElement('div');root.id='readerQuickAccess';root.className='readerGroup';
     panel.appendChild(root);
   }
   root.replaceChildren();
   const title=document.createElement('div');title.className='readerLabel';title.textContent='Quick access';root.appendChild(title);

   const rg=document.createElement('div');rg.className='readerQuickGroup';
   const rh=document.createElement('div');rh.className='readerQuickTitle';
   const rs=document.createElement('span');rs.textContent='Recent';rh.appendChild(rs);
   if(recent.length){rh.appendChild(makeQuickButton('Clear','Clear recent navigation',()=>{recent=[];saveRecent();renderReaderQuick();}));}
   rg.appendChild(rh);
   const rl=document.createElement('div');rl.className='readerQuickList';
   if(!recent.length){const e=document.createElement('div');e.className='readerQuickEmpty';e.textContent='Clicked tags and opened reference sections appear here.';rl.appendChild(e);}
   recent.slice(0,6).forEach(x=>{
     rl.appendChild(makeQuickButton(x.title||x.tag||x.anchor,x.title||'',()=>{
       if(x.tag&&window.OSCP_TAG_LINKS?.goToTag)window.OSCP_TAG_LINKS.goToTag(x.tag);
       else if(x.anchor&&typeof openRef==='function')openRef(x.anchor);
     }));
   });rg.appendChild(rl);root.appendChild(rg);

   const pg=document.createElement('div');pg.className='readerQuickGroup';
   const ph=document.createElement('div');ph.className='readerQuickTitle';ph.textContent='Pinned reference';pg.appendChild(ph);
   const pl=document.createElement('div');pl.className='readerQuickList';
   let pins=[];
   try{pins=(typeof favorites!=='undefined'?favorites:[]).map(a=>searchItem(a)).filter(Boolean)}catch(_){}
   if(!pins.length){const e=document.createElement('div');e.className='readerQuickEmpty';e.textContent='Pin search results or the current reference section.';pl.appendChild(e);}
   pins.slice(0,6).forEach(x=>pl.appendChild(makeQuickButton('★ '+cleanTitle(x.title),x.title,()=>openRef(x.anchor))));
   pg.appendChild(pl);root.appendChild(pg);
 }

 function help(open){
   const back=$id('examHelpBackdrop');if(!back)return;
   back.classList.toggle('open',!!open);
   if(open)setTimeout(()=>$id('examHelpClose')?.focus(),0);
 }
 function isEditing(t){const tag=(t?.tagName||'').toLowerCase();return ['input','textarea','select','button'].includes(tag)||t?.isContentEditable}

 function setupHelp(){
   $id('examHelpBtn')?.addEventListener('click',()=>help(!$id('examHelpBackdrop')?.classList.contains('open')));
   $id('examHelpClose')?.addEventListener('click',()=>help(false));
   $id('examHelpBackdrop')?.addEventListener('click',e=>{if(e.target===$id('examHelpBackdrop'))help(false)});
 }

 function sectionAnchor(el){
   if(!el)return'';
   if(el.id)return el.id;
   const d=el.closest?.('details[id]');return d?.id||'';
 }
 function buildReferenceEntries(){
   const root=$id('referenceRoot');if(!root)return[];
   const seen=new Set(),out=[];
   root.querySelectorAll('h2,h3,summary').forEach(el=>{
     const anchor=sectionAnchor(el);if(!anchor||seen.has(anchor))return;seen.add(anchor);
     out.push({anchor,title:cleanTitle(el.textContent||anchor),el:document.getElementById(anchor)||el});
   });
   return out;
 }
 function renderRefBreadcrumb(){
   const root=$id('refBreadcrumb'),current=$id('refBreadcrumbCurrent');if(!root||!current)return;
   const entry=refEntries[refIndex];root.hidden=!entry;current.textContent=entry?.title||'Reference';
 }
 function updatePinButton(){
   const b=$id('refPinCurrent');if(!b||!refEntries.length)return;
   const a=refEntries[refIndex]?.anchor;let on=false;
   try{on=typeof favorites!=='undefined'&&favorites.includes(a)}catch(_){}
   b.textContent=on?'★ Pinned':'☆ Pin';b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'Unpin current reference section':'Pin current reference section');
 }
 function renderRefSelect(){
   const sel=$id('refSectionSelect');if(!sel)return;
   sel.replaceChildren();
   refEntries.forEach((x,i)=>{const o=document.createElement('option');o.value=x.anchor;o.textContent=(i+1)+' · '+x.title;sel.appendChild(o)});
   if(refEntries[refIndex])sel.value=refEntries[refIndex].anchor;
   const pos=$id('refPosition');if(pos)pos.textContent=refEntries.length?(refIndex+1)+' / '+refEntries.length:'0 / 0';
   renderRefBreadcrumb();updatePinButton();
 }
 function goRefIndex(i){
   if(!refEntries.length)return;
   refIndex=Math.max(0,Math.min(refEntries.length-1,i));renderRefSelect();
   const a=refEntries[refIndex].anchor;
   if(typeof openRef==='function')openRef(a);
 }
 function syncRefPosition(){
   raf=0;
   const view=$id('referenceView');if(!view?.classList.contains('active')||!refEntries.length)return;
   const cutoff=(document.querySelector('.top')?.getBoundingClientRect().bottom||62)+62;
   let best=0;
   for(let i=0;i<refEntries.length;i++){
     const top=refEntries[i].el.getBoundingClientRect().top;
     if(top<=cutoff)best=i;else break;
   }
   if(best!==refIndex){refIndex=best;renderRefSelect();}
 }
 function scheduleRefSync(){if(!raf)raf=requestAnimationFrame(syncRefPosition)}
 function setupReferenceNavigator(){
   const view=$id('referenceView'),root=$id('referenceRoot');if(!view||!root)return;
   if($id('refNavigator')){refEntries=buildReferenceEntries();refIndex=Math.min(refIndex,Math.max(0,refEntries.length-1));renderRefSelect();return}
   refEntries=buildReferenceEntries();
   const nav=document.createElement('div');nav.id='refNavigator';nav.className='noPrint';nav.setAttribute('role','navigation');nav.setAttribute('aria-label','Reference section navigation');
   nav.innerHTML='<div class="refBreadcrumb" id="refBreadcrumb" aria-label="Reference breadcrumb"><button class="refCrumbHome" id="refBreadcrumbHome" type="button">Reference</button><span aria-hidden="true">›</span><span id="refBreadcrumbCurrent" aria-current="location">Reference</span></div><button class="btn" id="refPrev" type="button" title="Previous reference section" aria-label="Previous reference section">←</button><select id="refSectionSelect" aria-label="Reference section"></select><button class="btn" id="refNext" type="button" title="Next reference section" aria-label="Next reference section">→</button><button class="btn refNavSecondary" id="refPinCurrent" type="button" aria-pressed="false">☆ Pin</button><span class="refPos refNavSecondary" id="refPosition" aria-live="polite"></span>';
   root.parentNode.insertBefore(nav,root);
   renderRefSelect();
   $id('refBreadcrumbHome')?.addEventListener('click',()=>{$id('referenceView')?.scrollIntoView({block:'start',behavior:'smooth'})});
   $id('refPrev')?.addEventListener('click',()=>goRefIndex(refIndex-1));
   $id('refNext')?.addEventListener('click',()=>goRefIndex(refIndex+1));
   $id('refSectionSelect')?.addEventListener('change',e=>{
     const i=refEntries.findIndex(x=>x.anchor===e.target.value);if(i>=0)goRefIndex(i);
   });
   $id('refPinCurrent')?.addEventListener('click',()=>{
     const a=refEntries[refIndex]?.anchor;if(!a)return;
     try{if(typeof toggleFavorite==='function'){toggleFavorite(a);updatePinButton();renderReaderQuick();}}catch(_){}
   });
   nav.addEventListener('keydown',e=>{
     if(e.target?.tagName==='SELECT')return;
     if(e.key==='ArrowLeft'){e.preventDefault();goRefIndex(refIndex-1)}
     else if(e.key==='ArrowRight'){e.preventDefault();goRefIndex(refIndex+1)}
     else if(e.key==='Home'){e.preventDefault();goRefIndex(0)}
     else if(e.key==='End'){e.preventDefault();goRefIndex(refEntries.length-1)}
   });
   addEventListener('scroll',scheduleRefSync,{passive:true});addEventListener('resize',scheduleRefSync,{passive:true});
 }

 function setupOpenTracking(){
   try{
     if(typeof openRef==='function'){
       baseOpenRef=openRef;
       openRef=function(anchor){addRecentAnchor(anchor);return baseOpenRef(anchor)};
     }
   }catch(_){}
   document.addEventListener('click',e=>{
     const tag=e.target?.closest?.('.tagRefLink')?.dataset?.tagRef;if(tag)addRecentTag(tag);
   },true);
 }

 function setupSearchKeys(){
   const input=$id('globalSearch');if(!input)return;
   const hint=document.createElement('div');hint.className='searchKeyboardHint';hint.textContent='Tip: Enter opens the best match · ↓ moves into results · / focuses search.';
   $id('searchStats')?.insertAdjacentElement('afterend',hint);
   input.addEventListener('keydown',e=>{
     if(e.key==='Enter'){
       const q=input.value.trim();if(!q)return;
       e.preventDefault();
       if(/^\[[A-Z0-9_-]+(?::[A-Z0-9_.-]+)+\]$/.test(q)&&window.OSCP_TAG_LINKS?.goToTag){window.OSCP_TAG_LINKS.goToTag(q);return;}
       document.querySelector('#searchResults [data-open]')?.click();
     }else if(e.key==='ArrowDown'){
       const first=document.querySelector('#searchResults [data-open]');if(first){e.preventDefault();first.focus();}
     }
   });
   document.addEventListener('keydown',e=>{
     const b=e.target?.closest?.('#searchResults [data-open]');if(!b||!['ArrowDown','ArrowUp'].includes(e.key))return;
     const all=[...document.querySelectorAll('#searchResults [data-open]')];const i=all.indexOf(b);if(i<0)return;
     e.preventDefault();all[(i+(e.key==='ArrowDown'?1:-1)+all.length)%all.length]?.focus();
   });
 }

 loadRecent();
 function start(){
   setupHelp();setupOpenTracking();setupReferenceNavigator();setupSearchKeys();renderReaderQuick();
   document.addEventListener('oscp-reference-ready',()=>{setupReferenceNavigator();renderReaderQuick();});
   document.addEventListener('keydown',e=>{
     if(e.key==='Escape'&&$id('examHelpBackdrop')?.classList.contains('open')){e.preventDefault();e.stopImmediatePropagation();help(false);return;}
     if(!isEditing(e.target)&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&e.key==='?'){e.preventDefault();help(!$id('examHelpBackdrop')?.classList.contains('open'));}
   },true);
   try{
     if(typeof V16_SELF_TESTS!=='undefined'){
       V16_SELF_TESTS.push(
         ['Reference navigator',()=>[!!$id('refNavigator')&&refEntries.length>20,refEntries.length+' sections']],
         ['Recent and pinned quick access',()=>[!!$id('readerQuickAccess'),'reader quick access']],
         ['Keyboard help overlay',()=>[!!$id('examHelpBackdrop')&&!!$id('examHelpBtn'),'help overlay']],
         ['Search Enter shortcut',()=>[!!$id('globalSearch'),'search keyboard']]
       );
     }
   }catch(_){}
   window.OSCP_V24={recent:()=>[...recent],help,renderReaderQuick,refEntries:()=>refEntries.map(x=>({anchor:x.anchor,title:x.title}))};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
