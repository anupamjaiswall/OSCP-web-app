
(()=>{
  'use strict';
  const STORE='oscp:reader:v23';
  const defaults={size:'1',density:'comfortable',focus:false,guides:true,contrast:false,tree:'linux'};
  let state={...defaults};

  function load(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORE)||'{}');
      state={...defaults,...saved};
    }catch(_){state={...defaults};}
  }
  function save(){try{localStorage.setItem(STORE,JSON.stringify(state));}catch(_){}}
  function $id(id){return document.getElementById(id)}
  function apply(){
    document.body.dataset.readSize=String(state.size);
    document.body.dataset.readDensity=state.density;
    document.body.classList.toggle('examFocus',!!state.focus);
    document.body.classList.toggle('readGuideLines',!!state.guides);
    document.body.classList.toggle('examHighContrast',!!state.contrast);
    document.querySelectorAll('[data-read-size]').forEach(b=>b.classList.toggle('active',b.dataset.readSize===String(state.size)));
    document.querySelectorAll('[data-read-density]').forEach(b=>b.classList.toggle('active',b.dataset.readDensity===state.density));
    $id('readerGuideToggle')?.classList.toggle('active',!!state.guides);
    $id('focusModeBtn')?.classList.toggle('active',!!state.focus);
    const contrast=$id('readerContrastToggle');if(contrast){contrast.classList.toggle('active',!!state.contrast);contrast.setAttribute('aria-pressed',String(!!state.contrast));contrast.textContent=state.contrast?'High contrast · ON':'High contrast';}
    save();
  }
  function setPanel(open){
    const p=$id('readabilityPanel'),b=$id('readabilityBtn');
    if(!p||!b)return;
    p.hidden=!open;b.setAttribute('aria-expanded',String(!!open));
  }
  function toggleFocus(force){
    state.focus=typeof force==='boolean'?force:!state.focus;
    apply();setPanel(false);
    if(state.focus)setTimeout(()=>$id('globalSearch')?.blur(),0);
  }
  function focusSearch(){
    setPanel(false);
    const input=$id('globalSearch');
    if(!input)return;
    input.focus();input.select();
  }
  function updateProgress(){
    const d=document.documentElement;
    const max=Math.max(1,d.scrollHeight-innerHeight);
    const pct=Math.max(0,Math.min(100,(scrollY/max)*100));
    const bar=$id('readProgressBar');if(bar)bar.style.width=pct+'%';
    $id('backTopBtn')?.classList.toggle('show',scrollY>700);
  }

  function setupTreeTabs(){
    const view=$id('methodTreesView');
    const grid=view?.querySelector('.methodTreeGrid');
    if(!grid||grid.dataset.readerTabs==='1')return;
    grid.dataset.readerTabs='1';
    const cards=[...grid.querySelectorAll('.methodTreeCard')];
    const kinds=['linux','windows','ad'];
    cards.forEach((c,i)=>{c.dataset.treeKind=kinds[i]||('tree'+i);c.id=c.id||('method-tree-'+(kinds[i]||i));});
    const tabs=document.createElement('div');
    tabs.className='methodTreeTabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Methodology tree selector');
    tabs.innerHTML='<button class="btn" type="button" data-tree-tab="linux">🐧 Linux</button><button class="btn" type="button" data-tree-tab="windows">▣ Windows</button><button class="btn" type="button" data-tree-tab="ad">🏰 AD</button><button class="btn" type="button" data-tree-tab="all">All 3</button><span class="tiny">One tree at a time = less exam-time scanning.</span>';
    const treeButtons=[...tabs.querySelectorAll('[data-tree-tab]')];
    treeButtons.forEach(b=>{const kind=b.dataset.treeTab;b.id='method-tree-toggle-'+kind;b.setAttribute('aria-controls',kind==='all'?cards.map(c=>c.id).join(' '):('method-tree-'+kind));});
    cards.forEach(c=>{c.setAttribute('role','region');c.setAttribute('aria-label',(c.dataset.treeKind||'Methodology')+' methodology tree')});
    grid.parentNode.insertBefore(tabs,grid);
    function show(kind){
      state.tree=kind;save();
      cards.forEach(c=>{
        const all=kind==='all',hit=c.dataset.treeKind===kind;
        c.classList.toggle('treeHidden',!all&&!hit);
        c.classList.toggle('treeSolo',!all&&hit);
      });
      treeButtons.forEach(b=>{const on=b.dataset.treeTab===kind;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));b.tabIndex=on?0:-1});
      if(kind!=='all'){
        const card=cards.find(c=>c.dataset.treeKind===kind);
        if(card&&view.classList.contains('active'))setTimeout(()=>card.scrollIntoView({block:'start',behavior:'smooth'}),20);
      }
    }
    tabs.addEventListener('click',e=>{const b=e.target.closest('[data-tree-tab]');if(b)show(b.dataset.treeTab);});
    tabs.addEventListener('keydown',e=>{
      const b=e.target.closest?.('[data-tree-tab]');if(!b)return;
      const i=treeButtons.indexOf(b);let next=-1;
      if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(i+1)%treeButtons.length;
      else if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(i-1+treeButtons.length)%treeButtons.length;
      else if(e.key==='Home')next=0;else if(e.key==='End')next=treeButtons.length-1;
      if(next>=0){e.preventDefault();treeButtons[next].focus()}
    });
    show(['linux','windows','ad','all'].includes(state.tree)?state.tree:'linux');
    window.OSCP_TREE_READER={show};
  }

  load();
  function start(){
    apply();setupTreeTabs();updateProgress();

    $id('readabilityBtn')?.addEventListener('click',()=>setPanel($id('readabilityPanel')?.hidden!==false));
    $id('readabilityClose')?.addEventListener('click',()=>setPanel(false));
    document.querySelectorAll('[data-read-size]').forEach(b=>b.addEventListener('click',()=>{state.size=b.dataset.readSize;apply();}));
    document.querySelectorAll('[data-read-density]').forEach(b=>b.addEventListener('click',()=>{state.density=b.dataset.readDensity;apply();}));
    $id('readerGuideToggle')?.addEventListener('click',()=>{state.guides=!state.guides;apply();});
    $id('readerContrastToggle')?.addEventListener('click',()=>{state.contrast=!state.contrast;apply();});
    $id('focusModeBtn')?.addEventListener('click',()=>toggleFocus());
    $id('focusExitBtn')?.addEventListener('click',()=>toggleFocus(false));
    $id('readerResetBtn')?.addEventListener('click',()=>{state={...defaults};apply();setupTreeTabs();});
    $id('readerSearchBtn')?.addEventListener('click',focusSearch);
    $id('backTopBtn')?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
    addEventListener('scroll',updateProgress,{passive:true});
    addEventListener('resize',updateProgress,{passive:true});

    document.addEventListener('click',e=>{
      const p=$id('readabilityPanel'),btn=$id('readabilityBtn');
      if(!p||p.hidden||p.contains(e.target)||btn?.contains(e.target))return;
      setPanel(false);
    });

    document.addEventListener('keydown',e=>{
      const tag=(e.target?.tagName||'').toLowerCase();
      const editing=['input','textarea','select'].includes(tag)||e.target?.isContentEditable;
      if(e.key==='Escape'){
        if(state.focus){e.preventDefault();toggleFocus(false);return;}
        if($id('readabilityPanel')?.hidden===false){e.preventDefault();setPanel(false);return;}
      }
      if(e.altKey&&!e.ctrlKey&&!e.metaKey&&String(e.key).toLowerCase()==='z'){
        e.preventDefault();e.stopImmediatePropagation();toggleFocus();return;
      }
      if(!editing&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&e.key==='/'){
        e.preventDefault();focusSearch();
      }
    },true);

    try{
      if(typeof V16_SELF_TESTS!=='undefined'){
        V16_SELF_TESTS.push(
          ['Exam readability controls',()=>[!!$id('readabilityBtn')&&!!$id('readabilityPanel'),'reader controls']],
          ['Focus reading mode',()=>[typeof toggleFocus==='function'&&!!$id('focusExitBtn'),'focus mode']],
          ['Method tree tabs',()=>[!!document.querySelector('.methodTreeTabs')&&!!window.OSCP_TREE_READER,'tree tabs']]
        );
      }
    }catch(_){}
    window.OSCP_READER={state,apply,toggleFocus,focusSearch,setupTreeTabs};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
