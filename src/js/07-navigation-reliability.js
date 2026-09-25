
/* ===== V19 Navigation Reliability Layer =====
   - Browser Back / Forward for SPA views
   - Deep links: #view=<viewId>&ref=<reference-anchor>
   - Scroll restoration
   - Last-view restore
   - Central shortcut router to prevent inherited Alt-key collisions
*/
(function(){
  'use strict';
  if(window.__OSCP_V16_NAV_READY__) return;
  window.__OSCP_V16_NAV_READY__=true;

  const NAV_STORE='oscp_v16_last_view';
  const NAV_SCROLL='oscp_v16_view_scrolls';
  const MODE_STORE='oscp_v16_advanced_mode';
  const SIMPLE_VIEWS=new Set(['simpleExamView','methodologyView','toolArsenalView','windowsStrategyView','workspaceView','reportsView','referenceView']);
  const baseSwitch=window.switchView || switchView;
  let historyReplay=false;
  let navSerial=Number(history.state?.serial)||0;
  let navMaxSerial=navSerial;
  const scrolls={};
  try{Object.assign(scrolls,JSON.parse(localStorage.getItem(NAV_SCROLL)||'{}')||{});}catch(e){}

  function isView(id){
    const el=id&&document.getElementById(id);
    return !!(el&&el.classList.contains('view'));
  }
  function activeView(){return document.querySelector('.view.active')?.id||'simpleExamView';}
  function safeView(id){return isView(id)?id:'simpleExamView';}
  function hashParts(){
    const raw=(location.hash||'').replace(/^#/,'');
    if(!raw.startsWith('view=')) return {};
    const p=new URLSearchParams(raw);
    return {view:p.get('view')||'',ref:p.get('ref')||''};
  }
  function navURL(view,ref=''){
    const p=new URLSearchParams();p.set('view',view);if(ref)p.set('ref',ref);
    return '#'+p.toString();
  }
  function rememberScroll(view){
    if(!view)return;
    scrolls[view]=Math.max(0,Math.round(window.scrollY||document.documentElement.scrollTop||0));
    try{localStorage.setItem(NAV_SCROLL,JSON.stringify(scrolls));}catch(e){}
  }
  function currentState(refOverride){
    const v=activeView();
    const hp=hashParts();
    return {oscpNav:1,serial:navSerial,view:v,ref:refOverride!==undefined?refOverride:(hp.ref||''),scrollY:Math.max(0,Math.round(window.scrollY||0))};
  }
  function updateHistoryButtons(){
    const b=document.getElementById('navBackBtn'),f=document.getElementById('navForwardBtn');
    if(b)b.disabled=navSerial<=0;
    if(f)f.disabled=navSerial>=navMaxSerial;
  }
  function updateViewChrome(view){
    try{localStorage.setItem(NAV_STORE,view);}catch(e){}
    const active=[...document.querySelectorAll('.navbtn')].find(b=>b.dataset.view===view);
    if(active&&active.scrollIntoView){
      try{active.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});}catch(e){}
    }
    updateHistoryButtons();
  }
  async function waitForReferenceAnchor(anchor,timeout=12000){
    const deadline=Date.now()+Math.max(500,Number(timeout)||12000);
    while(Date.now()<deadline){
      const direct=document.getElementById(anchor);if(direct)return direct;
      try{
        const api=window.OSCP_REFERENCE;
        if(api?.waitForAnchor){const el=await api.waitForAnchor(anchor,{timeout:Math.max(500,deadline-Date.now())});if(el)return el;if(api.error?.())return null}
        else api?.start?.();
      }catch(_){}
      await new Promise(r=>setTimeout(r,40));
    }
    return document.getElementById(anchor);
  }
  async function openReferenceAnchor(anchor,restoreScroll){
    if(!anchor)return;
    const el=await waitForReferenceAnchor(anchor);if(!el)return;
    let d=el.closest('details');if(d)d.open=true;
    if(Number.isFinite(restoreScroll))window.scrollTo({top:restoreScroll,behavior:'auto'});
    else el.scrollIntoView({behavior:'auto',block:'start'});
    el.classList.add('highlight');setTimeout(()=>el.classList.remove('highlight'),1200);
  }

  // Final wrapper: all inherited view render hooks still execute through baseSwitch.
  window.switchView=switchView=function(id,opts){
    opts=opts||{};id=safeView(id);
    const before=activeView();
    const same=before===id;
    if(!historyReplay&&!same){
      rememberScroll(before);
      try{history.replaceState({...currentState(),view:before,scrollY:scrolls[before]||window.scrollY||0},'',location.href);}catch(e){}
    }
    baseSwitch(id);
    updateViewChrome(id);
    if(!historyReplay&&opts.history!==false&&!same){
      navSerial++;navMaxSerial=navSerial;
      try{history.pushState({oscpNav:1,serial:navSerial,view:id,ref:'',scrollY:0},'',navURL(id));}catch(e){}
    }else if(!historyReplay&&same&&opts.replace===true){
      try{history.replaceState({oscpNav:1,serial:navSerial,view:id,ref:'',scrollY:window.scrollY||0},'',navURL(id));}catch(e){}
    }
    return id;
  };

  // Reference jumps become real history entries and Back returns to prior view/scroll.
  if(typeof window.openRef==='function'||typeof openRef==='function'){
    const baseOpenRef=window.openRef||openRef;
    window.openRef=openRef=function(anchor){
      const before=activeView(),hpBefore=hashParts();rememberScroll(before);
      if(before==='referenceView'&&hpBefore.ref&&hpBefore.ref!==anchor){
        try{history.replaceState({...currentState(hpBefore.ref),view:'referenceView',ref:hpBefore.ref,scrollY:scrolls.referenceView||window.scrollY||0},'',navURL('referenceView',hpBefore.ref));}catch(e){}
      }
      baseOpenRef(anchor);
      setTimeout(()=>{
        try{
          const st={...(history.state||{}),oscpNav:1,view:'referenceView',ref:anchor||'',scrollY:window.scrollY||0};
          if(before==='referenceView'&&hpBefore.ref&&hpBefore.ref!==anchor){
            navSerial++;navMaxSerial=navSerial;st.serial=navSerial;history.pushState(st,'',navURL('referenceView',anchor||''));
          }else history.replaceState(st,'',navURL('referenceView',anchor||''));
          updateHistoryButtons();
        }catch(e){}
      },45);
    };
  }

  window.addEventListener('popstate',e=>{
    const hp=hashParts();
    const st=e.state&&e.state.oscpNav?e.state:null;
    const view=safeView(st?.view||hp.view||'simpleExamView');
    const ref=st?.ref||hp.ref||'';
    const y=Number.isFinite(st?.scrollY)?st.scrollY:(scrolls[view]||0);
    if(Number.isFinite(st?.serial))navSerial=st.serial;
    historyReplay=true;
    try{baseSwitch(view);updateViewChrome(view);}finally{historyReplay=false;}
    if(ref)openReferenceAnchor(ref,y||undefined);
    else setTimeout(()=>window.scrollTo({top:y||0,behavior:'auto'}),20);
  });

  window.addEventListener('hashchange',()=>{
    if(historyReplay)return;
    const hp=hashParts();if(!hp.view)return;
    const view=safeView(hp.view);
    if(activeView()!==view){historyReplay=true;try{baseSwitch(view);updateViewChrome(view);}finally{historyReplay=false;}}
    if(hp.ref)openReferenceAnchor(hp.ref);
  });

  window.addEventListener('beforeunload',()=>{
    const v=activeView();rememberScroll(v);
    try{history.replaceState({...currentState(),view:v,scrollY:scrolls[v]||window.scrollY||0},'',location.href);}catch(e){}
  });

  // App buttons + native Alt+Left/Right behavior.
  document.getElementById('navBackBtn')?.addEventListener('click',()=>history.back());
  document.getElementById('navForwardBtn')?.addEventListener('click',()=>history.forward());

  // Keep the exam-facing navigation small. The inherited engine remains one click away.
  document.querySelectorAll('#advancedToggle ~ *').forEach(el=>el.classList.add('advancedNav'));
  let advanced=false;
  try{advanced=localStorage.getItem(MODE_STORE)==='1';}catch(e){}
  function setAdvancedMode(on){
    advanced=!!on;document.body.classList.toggle('advancedMode',advanced);
    const b=document.getElementById('advancedToggle');if(b){b.textContent=advanced?'Hide advanced':'Show advanced';b.setAttribute('aria-pressed',String(advanced));}
    try{localStorage.setItem(MODE_STORE,advanced?'1':'0');}catch(e){}
  }
  document.getElementById('advancedToggle')?.addEventListener('click',()=>setAdvancedMode(!advanced));
  setAdvancedMode(advanced);

  // One capture-phase router owns exam shortcuts; inherited duplicate listeners were removed.
  const SHORTCUTS={
    'x':'operatorView','c':'coverageView','d':'debtView','h':'hypothesisView','r':'correlationView',
    'a':'auditView','e':'vaultView','s':'sanityView','t':'regressionView','f':'freshnessView','k':'clockView',
    'v':'revertView','u':'submissionView','p':'v16HighSignalView','w':'windowsStrategyView','q':'serviceRouterView','y':'methodTreesView',
    'i':'v15ReliabilityView','g':'guardView','j':'journalView','o':'analyzerView',
    '1':'simpleExamView','2':'workspaceView','3':'credentialsView','4':'reportsView','5':'referenceView','6':'toolArsenalView','m':'methodologyView',
    '7':'intakeView','8':'boardView','9':'commandsView'
  };
  document.addEventListener('keydown',e=>{
    if(!e.altKey||e.ctrlKey||e.metaKey)return;
    const k=String(e.key||'').toLowerCase();
    if(k==='arrowleft'){e.preventDefault();e.stopImmediatePropagation();history.back();return;}
    if(k==='arrowright'){e.preventDefault();e.stopImmediatePropagation();history.forward();return;}
    const v=SHORTCUTS[k];if(!v)return;
    e.preventDefault();e.stopImmediatePropagation();switchView(v);
  },true);

  // Initial deep link / last-view restoration without adding a fake history entry.
  try{history.scrollRestoration='manual';}catch(e){}
  const hp=hashParts();
  let initial=hp.view;
  if(!isView(initial)){
    try{initial=localStorage.getItem(NAV_STORE)||activeView();}catch(e){initial=activeView();}
  }
  if(!hp.view&&!advanced&&!SIMPLE_VIEWS.has(initial))initial='simpleExamView';
  initial=safeView(initial);
  historyReplay=true;
  try{baseSwitch(initial);updateViewChrome(initial);}finally{historyReplay=false;}
  const initialY=scrolls[initial]||0;
  try{history.replaceState({oscpNav:1,serial:navSerial,view:initial,ref:hp.ref||'',scrollY:initialY},'',navURL(initial,hp.ref||''));}catch(e){}
  if(hp.ref)openReferenceAnchor(hp.ref);
  else setTimeout(()=>window.scrollTo({top:initialY,behavior:'auto'}),20);

  // Small testable surface for the built-in self-test and manual debugging.
  window.OSCP_NAV={activeView,isView,hashParts,shortcuts:{...SHORTCUTS},setAdvancedMode,back:()=>history.back(),forward:()=>history.forward()};
  try{
    if(typeof V16_SELF_TESTS!=='undefined'){
      V16_SELF_TESTS.push(
        ['Browser history navigation layer',()=>[!!window.OSCP_NAV&&typeof history.pushState==='function','history+OSCP_NAV']],
        ['Navigation deep-link parser',()=>[OSCP_NAV.isView('windowsStrategyView')&&OSCP_NAV.isView('referenceView'),'views resolvable']],
        ['Shortcut conflicts removed',()=>[OSCP_NAV.shortcuts.c==='coverageView'&&OSCP_NAV.shortcuts.h==='hypothesisView'&&OSCP_NAV.shortcuts.e==='vaultView'&&OSCP_NAV.shortcuts.k==='clockView'&&OSCP_NAV.shortcuts.p==='v16HighSignalView','C/H/E/K/P unique']],
        ['Simple exam mode available',()=>[OSCP_NAV.isView('simpleExamView')&&OSCP_NAV.isView('methodologyView')&&typeof OSCP_NAV.setAdvancedMode==='function','simple+method+toggle']]
      );
    }
  }catch(e){}
})();