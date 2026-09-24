
(()=>{
 'use strict';
 const FATIGUE_STORE='oscp:fatigue:v27';
 let tab='services',tagIndex=new Map(),fatigue={started:0,limit:90},fatigueTick=null;
 const $id=id=>document.getElementById(id);
 function esc(s){return window.OSCP_UTILS.escapeHtml(s)}
 function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9:_\-.\[\] ]+/g,' ').trim()}

 function buildTagIndex(){
   tagIndex=new Map();
   try{
     const items=typeof ensureSearchItems==='function'?ensureSearchItems():(typeof SEARCH_ITEMS!=='undefined'?SEARCH_ITEMS:[]);
     for(const item of items){
       for(const tag of (item.tags||[])){
         if(!tagIndex.has(tag))tagIndex.set(tag,{tag,count:0,titles:[],anchors:[]});
         const x=tagIndex.get(tag);x.count++;
         if(x.titles.length<4&&!x.titles.includes(item.title))x.titles.push(item.title);
         if(x.anchors.length<4&&!x.anchors.includes(item.anchor))x.anchors.push(item.anchor);
       }
     }
   }catch(_){}
 }
 const phases=[
  {name:'Initial access / services',prefixes:['[PORT:','[SERVICE:'],icon:'◌'},
  {name:'Web',prefixes:['[WEB:'],icon:'🌐'},
  {name:'Linux privilege escalation',prefixes:['[LINUX:'],icon:'🐧'},
  {name:'Windows privilege escalation',prefixes:['[WIN:'],icon:'▣'},
  {name:'Active Directory',prefixes:['[AD:'],icon:'🏰'},
  {name:'Credential material',prefixes:['[CREDS:','[AUTH:'],icon:'🔐'},
  {name:'Pivoting / routing',prefixes:['[PIVOT:'],icon:'🛣'},
  {name:'Evidence / reporting',prefixes:['[EVIDENCE:','[REPORT:'],icon:'📸'},
  {name:'Errors / failure modes',prefixes:['[ERROR:'],icon:'⚠'}
 ];
 function tagsForPhase(p){return [...tagIndex.values()].filter(x=>p.prefixes.some(pre=>x.tag.startsWith(pre))).sort((a,b)=>b.count-a.count||a.tag.localeCompare(b.tag))}
 function serviceTags(){return [...tagIndex.values()].filter(x=>/^\[PORT:[^\]]+\]$/.test(x.tag)).sort((a,b)=>{const an=parseInt(a.tag.match(/\d+/)?.[0]||99999),bn=parseInt(b.tag.match(/\d+/)?.[0]||99999);return an-bn||a.tag.localeCompare(b.tag)})}
 function openTag(tag){closeIndex();if(window.OSCP_TAG_LINKS?.goToTag)window.OSCP_TAG_LINKS.goToTag(tag);else{const input=$id('globalSearch');if(input)input.value=tag;switchView('searchView');if(typeof renderSearch==='function')renderSearch(tag)}}
 function card(x,prefix=''){
   const title=x.titles[0]||x.tag;
   return '<button class="indexCard" type="button" data-index-tag="'+esc(x.tag)+'"><div class="indexTag">'+esc(prefix+x.tag)+'</div><div class="indexTitle">'+esc(title)+'</div><div class="indexMeta">'+x.count+' indexed section'+(x.count===1?'':'s')+(x.titles.length>1?' · '+esc(x.titles.slice(1).join(' · ')):'')+'</div></button>';
 }
 function recentCards(){
   let out=[];
   try{
     const recent=window.OSCP_V24?.recent?.()||[];
     if(recent.length){out.push('<div class="indexSectionTitle">Recent navigation</div>');for(const x of recent.slice(0,9)){const label=x.tag||x.title||x.anchor;out.push('<button class="indexCard" type="button" data-index-recent="'+esc(x.tag?('tag:'+x.tag):('anchor:'+x.anchor))+'"><div class="indexTag">RECENT</div><div class="indexTitle">'+esc(label)+'</div><div class="indexMeta">'+esc(x.title||'')+'</div></button>')}}
   }catch(_){}
   try{
     const pins=(typeof favorites!=='undefined'?favorites:[]).map(a=>(typeof SEARCH_ITEMS!=='undefined'?SEARCH_ITEMS.find(x=>x.anchor===a):null)).filter(Boolean);
     if(pins.length){out.push('<div class="indexSectionTitle">Pinned reference</div>');for(const x of pins.slice(0,12))out.push('<button class="indexCard" type="button" data-index-anchor="'+esc(x.anchor)+'"><div class="indexTag">★ PINNED</div><div class="indexTitle">'+esc(x.title)+'</div><div class="indexMeta">'+esc((x.tags||[]).slice(0,4).join(' '))+'</div></button>')}
   }catch(_){}
   return out;
 }
 function renderIndex(){
   const root=$id('examIndexResults'),stats=$id('examIndexStats');if(!root)return;
   const q=norm($id('examIndexFilter')?.value||'');let html=[],shown=0;
   if(tab==='services'){
     for(const x of serviceTags()){const hay=norm(x.tag+' '+x.titles.join(' '));if(q&&!hay.includes(q))continue;html.push(card(x));shown++}
   }else if(tab==='phases'){
     for(const p of phases){
       const xs=tagsForPhase(p).filter(x=>!q||norm(p.name+' '+x.tag+' '+x.titles.join(' ')).includes(q));
       if(!xs.length)continue;html.push('<div class="indexSectionTitle">'+esc(p.icon+' '+p.name)+' · '+xs.length+' tags</div>');
       for(const x of xs.slice(0,40)){html.push(card(x));shown++}
     }
   }else{
     html=recentCards();shown=html.filter(x=>x.startsWith('<button')).length;
     if(q){
       const temp=document.createElement('div');temp.innerHTML=html.join('');
       temp.querySelectorAll('.indexCard').forEach(b=>{if(!norm(b.textContent).includes(q))b.remove()});
       html=[temp.innerHTML];shown=temp.querySelectorAll('.indexCard').length;
     }
   }
   root.innerHTML=html.join('')||'<div class="muted" style="grid-column:1/-1;padding:18px">No matching indexed notes.</div>';
   if(stats)stats.textContent=(tab==='services'?'Service/port index':tab==='phases'?'Phase-filtered index':'Recent/pinned index')+' · '+shown+' visible items · generated from current notes';
   root.querySelectorAll('[data-index-tag]').forEach(b=>b.addEventListener('click',()=>openTag(b.dataset.indexTag)));
   root.querySelectorAll('[data-index-anchor]').forEach(b=>b.addEventListener('click',()=>{closeIndex();openRef(b.dataset.indexAnchor)}));
   root.querySelectorAll('[data-index-recent]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.indexRecent;closeIndex();if(v.startsWith('tag:'))openTag(v.slice(4));else openRef(v.slice(7))}));
 }
 function openIndex(which='services'){tab=which;buildTagIndex();$id('examIndexBackdrop')?.classList.add('open');document.querySelectorAll('[data-index-tab]').forEach(b=>b.classList.toggle('active',b.dataset.indexTab===tab));renderIndex();setTimeout(()=>$id('examIndexFilter')?.focus(),0)}
 function closeIndex(){$id('examIndexBackdrop')?.classList.remove('open')}

 function setupIndex(){
   $id('examIndexOpen')?.addEventListener('click',()=>openIndex('services'));
   $id('serviceIndexOpen')?.addEventListener('click',()=>openIndex('services'));
   $id('examIndexClose')?.addEventListener('click',closeIndex);
   $id('examIndexBackdrop')?.addEventListener('click',e=>{if(e.target===$id('examIndexBackdrop'))closeIndex()});
   $id('examIndexFilter')?.addEventListener('input',renderIndex);
   document.querySelectorAll('[data-index-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.indexTab;document.querySelectorAll('[data-index-tab]').forEach(x=>x.classList.toggle('active',x===b));renderIndex()}));
 }

 function loadFatigue(){try{fatigue={...fatigue,...JSON.parse(localStorage.getItem(FATIGUE_STORE)||'{}')}}catch(_){}}
 function saveFatigue(){try{localStorage.setItem(FATIGUE_STORE,JSON.stringify(fatigue))}catch(_){}}
 function fatigueElapsed(){return fatigue.started?Math.max(0,Date.now()-fatigue.started):0}
 function fmt(ms){const m=Math.floor(ms/60000),h=Math.floor(m/60),mm=m%60;return h?String(h)+'h '+String(mm).padStart(2,'0')+'m':String(mm)+'m'}
 function renderFatigue(){
   const clock=$id('fatigueClock'),btn=$id('fatigueReset'),sel=$id('fatigueLimit');if(!clock)return;
   if(sel)sel.value=String(fatigue.limit||90);
   if(!fatigue.started){clock.textContent='Not started';clock.className='fatigueClock';if(btn)btn.textContent='Start';return}
   const elapsed=fatigueElapsed(),ratio=elapsed/((fatigue.limit||90)*60000);
   clock.textContent=fmt(elapsed)+' since last break';clock.className='fatigueClock'+(ratio>=1.35?' bad':ratio>=1?' warn':'');
   if(btn)btn.textContent='I took a break';
 }
 function setupFatigue(){
   const panel=$id('readabilityPanel');if(!panel||$id('fatigueGuard'))return;
   const g=document.createElement('div');g.id='fatigueGuard';g.className='fatigueGuard';
   g.innerHTML='<div class="readerLabel">Fatigue guard</div><div class="fatigueLine"><span id="fatigueClock" class="fatigueClock">Not started</span><select id="fatigueLimit" aria-label="Break reminder interval"><option value="60">60 min</option><option value="90">90 min</option><option value="120">120 min</option></select><button class="btn" id="fatigueReset" type="button">Start</button></div><div class="tiny" style="padding:6px 0 0">Optional only. Recent pass reports repeatedly recommend real breaks when attention stops producing new evidence.</div>';
   panel.appendChild(g);
   $id('fatigueReset')?.addEventListener('click',()=>{fatigue.started=Date.now();saveFatigue();renderFatigue()});
   $id('fatigueLimit')?.addEventListener('change',e=>{fatigue.limit=+e.target.value||90;saveFatigue();renderFatigue()});
   renderFatigue();clearInterval(fatigueTick);fatigueTick=setInterval(renderFatigue,30000);
 }

 function extendPalette(){
   const a=window.OSCP_V26?.actions;if(!Array.isArray(a))return;
   const add=x=>{if(!a.some(y=>y.id===x.id))a.push(x)};
   add({id:'index',icon:'☷',title:'Exam notes index',desc:'Browse live notes by service/port or phase',kind:'index',keys:'index service port phase filters notes',run:()=>openIndex('services')});
   add({id:'scanintake',icon:'📥',title:'Scan Intake',desc:'Parse Nmap XML/text locally and import target services',kind:'screen',keys:'scan nmap xml import ports intake',run:()=>switchView('intakeView')});
   add({id:'output',icon:'👁',title:'Output Analyzer',desc:'Classify exact tool output before changing tools',kind:'screen',keys:'output error analyze tool failure read',run:()=>switchView('analyzerView')});
 }

 loadFatigue();
 function start(){
   setupIndex();setupFatigue();extendPalette();
   document.addEventListener('oscp-reference-ready',()=>{buildTagIndex();if($id('examIndexBackdrop')?.classList.contains('open'))renderIndex()});
   document.addEventListener('keydown',e=>{
     const tag=(e.target?.tagName||'').toLowerCase(),editing=['input','textarea','select'].includes(tag)||e.target?.isContentEditable;
     if(e.key==='Escape'&&$id('examIndexBackdrop')?.classList.contains('open')){e.preventDefault();e.stopImmediatePropagation();closeIndex();return}
     if(e.altKey&&!e.ctrlKey&&!e.metaKey&&String(e.key).toLowerCase()==='i'){e.preventDefault();e.stopImmediatePropagation();openIndex('services');return}
     if(!editing&&e.key.toLowerCase()==='i'&&e.shiftKey&&e.altKey){e.preventDefault();openIndex('services')}
   },true);
   try{if(typeof V16_SELF_TESTS!=='undefined')V16_SELF_TESTS.push(
    ['Embedded favicon',()=>[!!document.querySelector('link[rel="icon"][href^="data:image/svg+xml"]'),'data SVG favicon']],
    ['Live service/phase index',()=>[!!$id('examIndexBackdrop')&&tagIndex instanceof Map,'notes index']],
    ['Fatigue guard',()=>[!!$id('fatigueGuard'),'optional break timer']]
   )}catch(_){}
   window.OSCP_V27={openIndex,closeIndex,renderIndex,tagIndex:()=>new Map(tagIndex),fatigue:()=>({...fatigue})};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
