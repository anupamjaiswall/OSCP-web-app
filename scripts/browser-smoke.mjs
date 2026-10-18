import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import http from 'node:http';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const appFile=path.join(root,'index.html');
const delay=ms=>new Promise(r=>setTimeout(r,ms));

function findBrowser(){
  if(process.env.CHROME_BIN&&fs.existsSync(process.env.CHROME_BIN))return process.env.CHROME_BIN;
  for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){
    try{return execFileSync('which',[name],{encoding:'utf8'}).trim()}catch(_){}
  }
  throw new Error('Chrome/Chromium executable not found');
}
async function waitFor(fn,timeout=20000,step=100){
  const end=Date.now()+timeout;let last;
  while(Date.now()<end){
    try{last=await fn();if(last)return last}catch(_){}
    await delay(step);
  }
  return last;
}
function makeRpc(ws){
  let seq=0;const pending=new Map(),events=[];
  ws.onmessage=e=>{
    const msg=JSON.parse(String(e.data));
    if(msg.id&&pending.has(msg.id)){const {resolve,reject}=pending.get(msg.id);pending.delete(msg.id);msg.error?reject(new Error(JSON.stringify(msg.error))):resolve(msg.result);return}
    if(msg.method)events.push(msg);
  };
  function send(method,params={}){
    return new Promise((resolve,reject)=>{
      const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
      setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(new Error(method+' timed out'))}},8000);
    });
  }
  return{send,events};
}
async function main(){
  const html=fs.readFileSync(appFile,'utf8');
  const server=http.createServer((req,res)=>{
    if(req.url==='/'||req.url==='/index.html'){
      res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
      res.end(html);return;
    }
    res.writeHead(404,{'content-type':'text/plain'});res.end('not found');
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  const addr=server.address();
  const appUrl='http://127.0.0.1:'+addr.port+'/index.html';
  for(const id of ['globalSearch','serviceRouterView','examBankBtn','examStuckBtn'])if(!html.includes('id="'+id+'"'))throw new Error('critical static control missing: '+id);

  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'oscp-chrome-'));
  const profile=path.join(tmp,'profile');
  const args=[
    '--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage',
    '--disable-background-networking','--disable-component-update','--disable-sync',
    '--disable-extensions','--disable-default-apps','--metrics-recording-only','--mute-audio',
    '--disable-client-side-phishing-detection','--disable-features=OptimizationHints,MediaRouter,Translate,AutofillServerCommunication',
    '--no-first-run','--no-default-browser-check','--allow-file-access-from-files',
    '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'
  ];
  const child=spawn(findBrowser(),args,{stdio:['ignore','ignore','pipe']});
  let stderr='';
  child.stderr.on('data',d=>{stderr+=String(d);if(stderr.length>12000)stderr=stderr.slice(-12000)});
  try{
    const devtools=await waitFor(()=>{
      try{
        const active=path.join(profile,'DevToolsActivePort');
        if(fs.existsSync(active)){
          const lines=fs.readFileSync(active,'utf8').trim().split(/\r?\n/);
          const port=Number(lines[0]);if(Number.isInteger(port)&&port>0)return{port,source:'DevToolsActivePort'};
        }
      }catch(_){}
      const m=stderr.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
      return m?{port:Number(m[1]),source:'stderr'}:false;
    },40000,100);
    if(!devtools?.port)throw new Error('Chrome DevTools endpoint did not start'+(stderr?' · '+stderr.slice(-1000):''));
    const base='http://127.0.0.1:'+devtools.port;
    const version=await waitFor(async()=>{try{return await (await fetch(base+'/json/version')).json()}catch(_){return false}},12000);
    if(!version?.webSocketDebuggerUrl)throw new Error('Chrome DevTools JSON endpoint was not reachable on '+devtools.port+' ('+devtools.source+')'+(stderr?' · '+stderr.slice(-1000):''));
    const page=await waitFor(async()=>{
      const pages=await (await fetch(base+'/json/list')).json();
      return pages.find(p=>p.type==='page');
    },12000);
    if(!page?.webSocketDebuggerUrl)throw new Error('Chrome page target was not available');

    const ws=new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(new Error('DevTools websocket timed out')),8000);ws.onopen=()=>{clearTimeout(t);resolve()};ws.onerror=e=>{clearTimeout(t);reject(e instanceof Error?e:new Error('DevTools websocket failed'))}});
    const rpc=makeRpc(ws);
    await rpc.send('Runtime.enable');await rpc.send('Page.enable');await rpc.send('Debugger.enable');
    await rpc.send('Page.navigate',{url:appUrl+'#view=simpleExamView'});

    let lastState=null,lastProbeError='';
    const ready=await waitFor(async()=>{
      try{
        const out=await rpc.send('Runtime.evaluate',{expression:`JSON.stringify({ready:document.readyState,stage:window.__OSCP_BOOT_STAGE__||'unset',parseStage:window.__OSCP_PARSE_STAGE__||'unset',coreStage:window.__OSCP_CORE_STAGE__||'unset',controls:['globalSearch','serviceRouterView','examBankBtn','examStuckBtn'].map(id=>[id,!!document.getElementById(id)]),boot:window.OSCP_BOOT_HEALTH||null,searchReady:window.OSCP_SEARCH_INDEX_READY===true,codeReady:window.OSCP_CODE_BLOCKS_READY===true,initialRender:window.OSCP_INITIAL_RENDER_READY===true,layoutText:Array.from(document.querySelector('.layout')?.childNodes||[]).filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).filter(Boolean),startRect:(()=>{const r=document.getElementById('simpleExamView')?.getBoundingClientRect();return r?{w:r.width,h:r.height,top:r.top,left:r.left}:null})()})`,returnByValue:true});
        const raw=out?.result?.value;if(!raw)return false;lastState=JSON.parse(raw);lastProbeError='';
        const controlsOk=lastState.controls.every(x=>x[1]);
        const layoutClean=Array.isArray(lastState.layoutText)&&lastState.layoutText.length===0;
        const startVisible=lastState.startRect&&lastState.startRect.w>300&&lastState.startRect.h>200&&lastState.startRect.left>0;
        return lastState.ready==='complete'&&controlsOk&&layoutClean&&startVisible&&lastState.boot?.ok!==false?lastState:false;
      }catch(e){lastProbeError=e.message;return false}
    },20000,150);
    if(!ready){
      const stages=rpc.events.filter(e=>e.method==='Runtime.consoleAPICalled').map(e=>e.params?.args?.map(a=>a.value).filter(v=>v!==undefined)).filter(a=>a?.[0]==='[OSCP_BOOT_STAGE]').map(a=>a[1]);
      let stack=[];
      try{
        rpc.send('Debugger.pause').catch(()=>{});
        await delay(700);
        const paused=[...rpc.events].reverse().find(e=>e.method==='Debugger.paused');
        stack=(paused?.params?.callFrames||[]).slice(0,10).map(f=>({fn:f.functionName||'<anonymous>',url:f.url||'',line:(f.location?.lineNumber??-1)+1,column:(f.location?.columnNumber??-1)+1}));
      }catch(_){}
      throw new Error('Local offline artifact did not reach a usable completed state · lastState='+JSON.stringify(lastState)+' · consoleStages='+JSON.stringify(stages.slice(-12))+' · stack='+JSON.stringify(stack)+' · probe='+lastProbeError);
    }

    async function evalValue(expression){
      const out=await rpc.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
      if(out?.exceptionDetails)throw new Error('browser evaluation exception: '+JSON.stringify(out.exceptionDetails).slice(0,1200));
      return out?.result?.value;
    }

    // Reliability audit: the exact hash route used on GitHub Pages must restore the visible Start view.
    const hashBoot=await evalValue(`JSON.stringify({hash:location.hash,active:document.querySelector('.view.active')?.id||'',start:document.getElementById('simpleExamView')?.classList.contains('active')===true})`);
    const hashBootState=JSON.parse(hashBoot||'{}');
    if(hashBootState.hash!=='#view=simpleExamView'||!hashBootState.start)throw new Error('hash deep-link boot did not restore simpleExamView: '+hashBoot);

    // Reliability audit: every nav destination must exist, become active, and occupy real layout space.
    const navSweepRaw=await evalValue(`(async()=>{
      window.OSCP_NAV?.setAdvancedMode?.(true);
      const failures=[],visited=[];
      const buttons=[...document.querySelectorAll('#nav .navbtn[data-view]')];
      for(const b of buttons){
        const id=b.dataset.view||'';
        b.click();
        await new Promise(r=>setTimeout(r,12));
        const v=document.getElementById(id),r=v?.getBoundingClientRect();
        const cs=v?getComputedStyle(v):null;
        const ok=!!v&&v.classList.contains('active')&&cs?.display!=='none'&&!!r&&r.width>300&&r.height>20;
        visited.push(id);
        if(!ok)failures.push({id,active:!!v?.classList.contains('active'),display:cs?.display||'',rect:r?{w:r.width,h:r.height,left:r.left,top:r.top}:null});
      }
      window.switchView('simpleExamView',{history:false});
      return JSON.stringify({count:visited.length,failures,active:document.querySelector('.view.active')?.id||''});
    })()`);
    const navSweep=JSON.parse(navSweepRaw||'{}');
    if(!navSweep.count||navSweep.failures?.length||navSweep.active!=='simpleExamView')throw new Error('navigation sweep failed: '+navSweepRaw);

    // Reliability audit: run the app's own deterministic self-test suite in the real browser.
    const selfTestsRaw=await evalValue(`(()=>{if(typeof runV16SelfTests!=='function')return JSON.stringify({missing:true});const s=runV16SelfTests();return JSON.stringify({total:s.total,pass:s.pass,fail:s.fail,failed:s.rows.filter(x=>!x.pass).map(x=>({name:x.name,observed:x.observed}))})})()`);
    const selfTests=JSON.parse(selfTestsRaw||'{}');
    if(selfTests.missing||selfTests.fail>0)throw new Error('built-in browser self-tests failed: '+selfTestsRaw);

    // Reliability audit: safety/readability dialogs must open and close without trapping the UI.
    const dialogAuditRaw=await evalValue(`(()=>{
      const out=[];
      const checks=[
        ['examStuckBtn','examResetModal','examResetClose'],
        ['examBankBtn','examBankModal','examBankClose'],
        ['readabilityBtn','readabilityPanel','readabilityClose']
      ];
      for(const [openId,panelId,closeId] of checks){
        const open=document.getElementById(openId),panel=document.getElementById(panelId),close=document.getElementById(closeId);
        if(!open||!panel||!close){out.push({openId,missing:true});continue}
        open.click();
        const opened=panel.hidden===false||panel.classList.contains('open')||panel.getAttribute('aria-hidden')==='false';
        close.click();
        const closed=panel.hidden===true||!panel.classList.contains('open')||panel.getAttribute('aria-hidden')==='true';
        out.push({openId,opened,closed});
      }
      return JSON.stringify(out);
    })()`);
    const dialogAudit=JSON.parse(dialogAuditRaw||'[]');
    if(dialogAudit.some(x=>x.missing||!x.opened||!x.closed))throw new Error('dialog audit failed: '+dialogAuditRaw);

    // Service Router layout regression: verify real 7/5 desktop columns and usable control widths.
    await rpc.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    const serviceLayoutRaw=await evalValue(`(()=>{
      window.switchView('serviceRouterView',{history:false});
      const view=document.getElementById('serviceRouterView');
      const cards=[...view.querySelectorAll(':scope > .grid > .card')];
      const first=cards.find(x=>x.querySelector('#serviceFirstPassQueue'));
      const runway=cards.find(x=>x.querySelector('#scoreSummary'));
      const controls=document.querySelector('.serviceRouterControls');
      const buttons=[...controls?.querySelectorAll(':scope > .btn')||[]];
      const fr=first?.getBoundingClientRect(),rr=runway?.getBoundingClientRect(),cr=controls?.getBoundingClientRect();
      const br=buttons.map(b=>b.getBoundingClientRect());
      return JSON.stringify({
        first:fr?{w:fr.width,left:fr.left}:null,
        runway:rr?{w:rr.width,left:rr.left}:null,
        controls:cr?{w:cr.width}:null,
        buttons:br.map(r=>({w:r.width,left:r.left,top:r.top})),
        overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-window.innerWidth
      });
    })()`);
    const serviceLayout=JSON.parse(serviceLayoutRaw||'{}');
    if(!serviceLayout.first||!serviceLayout.runway||serviceLayout.first.w<500||serviceLayout.runway.w<300||serviceLayout.buttons.length!==4||serviceLayout.buttons.some(x=>x.w<120)||serviceLayout.overflow>8)throw new Error('Service Router layout regression: '+serviceLayoutRaw);
    await evalValue("(()=>{window.switchView('simpleExamView',{history:false});return true})()");

    // Real interaction 0: direct reference navigation must work even if hydration is still in progress.
    const directAnchor='ref-c4-i-have-a-linux-shell-what-now';
    const directOpenResult=await evalValue("window.openRef('"+directAnchor+"')");
    if(directOpenResult!==true)throw new Error('openRef did not report success in browser: '+String(directOpenResult));
    const directReference=await waitFor(async()=>{
      const x=await evalValue("JSON.stringify({view:document.getElementById('referenceView')?.classList.contains('active')===true,anchor:!!document.getElementById('"+directAnchor+"'),ready:window.OSCP_REFERENCE_READY===true})");
      const s=JSON.parse(x||'{}');return s.view&&s.anchor?s:false;
    },20000,100);
    if(!directReference)throw new Error('direct deep-reference navigation failed during/after lazy hydration');
    const referenceNavigator=await waitFor(async()=>{const n=await evalValue("document.querySelectorAll('#refSectionSelect option').length");return n>20?n:false},12000,100);
    if(!referenceNavigator)throw new Error('reference navigator did not repopulate after lazy hydration');

    // Full-reference reader: lazy TOC, searchable links and fullscreen toggle.
    const readerStateRaw=await evalValue("(async()=>{\n      window.switchView('referenceView',{history:false});\n      await window.OSCP_REFERENCE?.start?.();\n      window.OSCP_REF_READER?.build?.();\n      const toc=document.getElementById('refReaderToc'),filter=document.getElementById('refReaderFilter');\n      const links=toc?.querySelectorAll('button[data-ref-id]')||[];\n      const pre=!!toc?.querySelector('[data-ref-id=\"ref-1-3-tmux-setup-never-work-without-it\"]');\n      const during=!!toc?.querySelector('[data-ref-id=\"ref-exam-tmux-operator-runbook\"]');\n      filter.value='tmux';filter.dispatchEvent(new Event('input',{bubbles:true}));\n      const filtered=toc?.querySelectorAll('button:not([hidden])').length||0;\n      filter.value='';filter.dispatchEvent(new Event('input',{bubbles:true}));\n      document.getElementById('refReaderFullscreen')?.click();\n      await new Promise(r=>setTimeout(r,150));\n      const immersive=document.body.classList.contains('referenceReaderMode');\n      document.getElementById('refReaderExit')?.click();\n      await new Promise(r=>setTimeout(r,150));\n      return JSON.stringify({count:links.length,pre,during,filtered,immersive,exited:!document.body.classList.contains('referenceReaderMode')});\n    })()");
    const readerState=JSON.parse(readerStateRaw||'{}');
    if(!(readerState.count>30&&readerState.pre&&readerState.during&&readerState.filtered>0&&readerState.immersive&&readerState.exited))
      throw new Error('reference reader fullscreen/sidebar failure: '+readerStateRaw);

    // Layout regression: prevent one-character-per-line reader/sidebar rendering.
    const widths=JSON.parse(await evalValue(`(()=>{
      const view=document.getElementById('referenceView');
      const width=e=>e?.getBoundingClientRect().width||0;
      const buttons=[...(view?.querySelectorAll('.refReaderQuick button')||[])];
      const root=document.getElementById('referenceRoot');
      const quote=root?.querySelector('blockquote');
      const paragraph=quote?.querySelector('p');
      const info=e=>{const cs=e?getComputedStyle(e):null;return e?{width:width(e),scrollWidth:e.scrollWidth,display:cs?.display,position:cs?.position,maxWidth:cs?.maxWidth,minWidth:cs?.minWidth,whiteSpace:cs?.whiteSpace,overflowWrap:cs?.overflowWrap,wordBreak:cs?.wordBreak,gridTemplateColumns:cs?.gridTemplateColumns,writingMode:cs?.writingMode,font:cs?.font,fontSize:cs?.fontSize,fontFamily:cs?.fontFamily,padding:cs?.padding,margin:cs?.margin,boxSizing:cs?.boxSizing,clientWidth:e.clientWidth,offsetWidth:e.offsetWidth,parentWidth:e.parentElement?.getBoundingClientRect().width,styleAttr:e.getAttribute('style')}:null};
      return JSON.stringify({article:width(view?.querySelector('.refReaderArticleCol')),paper:width(root),buttons:buttons.map(width),quote:info(quote),paragraph:info(paragraph),root:info(root),theme:document.documentElement.dataset.theme});

    })()`));
    if(!(widths.article>320&&widths.paper>320&&widths.buttons.every(w=>w>140)&&widths.quote?.width>240&&widths.paragraph?.width>210))
      throw new Error('reference too narrow / per-character wrap: '+JSON.stringify(widths));

    // Regression: verify paper/night colors, toggle state and restoration in a real browser.
    const themeColors=JSON.parse(await evalValue(`(()=>{
      const root=document.getElementById('referenceRoot'),btn=document.getElementById('refReaderTheme');
      if(!root||!btn)return JSON.stringify({error:'missing theme controls'});
      if(root.classList.contains('darkRef'))btn.click();
      const paper=getComputedStyle(root).backgroundColor;
      btn.click();
      const night=getComputedStyle(root).backgroundColor;
      const pressed=btn.getAttribute('aria-pressed');
      const nightSaved=localStorage.getItem('oscp:reference-theme:v1');
      btn.click();
      const restored=getComputedStyle(root).backgroundColor;
      return JSON.stringify({paper,night,pressed,nightSaved,restored});
    })()`));
    if(!(['rgb(255, 255, 255)','rgb(251, 244, 223)'].includes(themeColors.paper)&&themeColors.night!==themeColors.paper&&themeColors.pressed==='true'&&themeColors.nightSaved==='night'&&['rgb(255, 255, 255)','rgb(251, 244, 223)'].includes(themeColors.restored)))
      throw new Error('reference color toggle/regression: '+JSON.stringify(themeColors));

    // Regression: Light must recolor the entire shell, left menu AND reference TOC.
    const fullTheme=JSON.parse(await evalValue(`(()=>{
      const reader=document.getElementById('refReaderTheme'),top=document.getElementById('themeBtn');
      const root=document.getElementById('referenceRoot'),side=document.querySelector('.side'),toc=document.getElementById('refReaderTocWrap');
      if(root.classList.contains('darkRef')===false)reader.click();
      const dark={body:getComputedStyle(document.body).backgroundColor,side:getComputedStyle(side).backgroundColor};
      top.click();
      const light={body:getComputedStyle(document.body).backgroundColor,side:getComputedStyle(side).backgroundColor,toc:getComputedStyle(toc).backgroundColor,mode:document.body.classList.contains('themeLight'),stored:localStorage.getItem('oscp:reference-theme:v1')};
      const nav=document.querySelector('.side .navbtn');
      light.navText=nav?getComputedStyle(nav).color:null;
      reader.click(); // return to dark, preserving test isolation
      const restored=!document.body.classList.contains('themeLight');
      return JSON.stringify({dark,light,restored});
    })()`));
    if(!(fullTheme.light.mode&&fullTheme.light.stored==='day'&&
       fullTheme.light.body!==fullTheme.dark.body&&fullTheme.light.side!==fullTheme.dark.side&&
       !!fullTheme.light.toc&&!!fullTheme.light.navText&&
       fullTheme.restored))
      throw new Error('full light theme missed shell or navigation: '+JSON.stringify(fullTheme));

    // Vintage coverage: use the ONE visible Appearance picker, then inspect the
    // real computed surfaces instead of relying on source-text or screenshots.
    const vintage=JSON.parse(await evalValue(`(()=>{
      const picker=document.getElementById('themePickerSidebar');
      const read=s=>{const e=document.querySelector(s);return e?getComputedStyle(e).backgroundColor:null};
      if(!picker)return JSON.stringify({error:'missing visible Appearance control'});
      picker.value='parchment';picker.dispatchEvent(new Event('change',{bubbles:true}));
      const results={
        theme:document.documentElement.dataset.theme,
        stored:localStorage.getItem('oscp:reference-theme:v1'),
        picker:picker.value,
        duplicateVisible:!!document.querySelector('#themeBtn:not([hidden]),#themePicker'),
        body:read('body'),side:read('.side'),card:read('.card'),
        route:read('.stateRoute.goodRoute'),reader:read('#referenceRoot'),
        dialog:read('.examResetDialog'),
        gradient:(()=>{const x=document.querySelector('.v25StateRouter');return x?getComputedStyle(x).backgroundImage:null})()
      };
      picker.value='dusk';picker.dispatchEvent(new Event('change',{bubbles:true}));
      return JSON.stringify(results);
    })()`));
    if(!(vintage.theme==='parchment'&&vintage.stored==='parchment'&&vintage.picker==='parchment'&&
         !vintage.duplicateVisible&&
         vintage.side==='rgb(238, 227, 195)'&&vintage.card==='rgb(251, 244, 223)'&&
         vintage.reader==='rgb(251, 244, 223)'&&
         vintage.dialog==='rgb(251, 244, 223)'&&
         vintage.gradient==='none'))
      throw new Error('Vintage theme misses shell/tools/reader or duplicates switcher: '+JSON.stringify(vintage));

    // Real interaction 1: typo-tolerant search must produce results after lazy reference hydration.
    await evalValue(`(()=>{const i=document.getElementById('globalSearch');i.value='seimpersonte';i.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
    const typoSearch=await waitFor(async()=>{
      const x=await evalValue(`JSON.stringify({stats:document.getElementById('searchStats')?.textContent||'',results:document.querySelectorAll('#searchResults .result').length,ready:window.OSCP_REFERENCE_READY===true})`);
      const s=JSON.parse(x||'{}');return s.ready&&s.results>0?s:false;
    },20000,150);
    if(!typoSearch)throw new Error('typo-tolerant browser search did not return a result');

    // Real interaction 1B: body-text search must open the exact collapsed reference section.
    await evalValue(`(()=>{const i=document.getElementById('globalSearch');i.value='subdomain';i.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
    const subdomainSearch=await waitFor(async()=>{
      const x=await evalValue(`JSON.stringify({ready:window.OSCP_REFERENCE_READY===true,first:document.querySelector('#searchResults [data-open]')?.dataset.open||'',hosts:!!document.querySelector('#searchResults [data-open="ref-2-2-etc-hosts-management"]')})`);
      const s=JSON.parse(x||'{}');return s.ready&&s.hosts?s:false;
    },20000,150);
    if(!subdomainSearch)throw new Error('subdomain search did not surface /etc/hosts management');
    const hostsOpened=await evalValue(`(async()=>{const b=document.querySelector('#searchResults [data-open="ref-2-2-etc-hosts-management"]');if(!b)return false;b.click();await new Promise(r=>setTimeout(r,100));const d=document.getElementById('ref-2-2-etc-hosts-management');return !!d&&d.open===true&&document.getElementById('referenceView')?.classList.contains('active')===true})()`);
    if(!hostsOpened)throw new Error('search result did not expand collapsed /etc/hosts management section');

    // Real interaction 2: readability/high-contrast control must change the live body state.
    const contrast=await evalValue(`(()=>{const b=document.getElementById('readerContrastToggle');if(!b)return false;b.click();return document.body.classList.contains('examHighContrast')})()`);
    if(!contrast)throw new Error('high-contrast browser toggle did not activate');

    // Real interaction 3: target creation must render a target in a fresh profile.
    const targetCreated=await evalValue(`(()=>{const before=document.querySelectorAll('#targetList .target').length;document.getElementById('addTarget')?.click();const after=document.querySelectorAll('#targetList .target').length;return after===before+1})()`);
    if(!targetCreated)throw new Error('target creation did not render exactly one new target');

    // Cross-application functional audit: exercise critical controls with real browser state.
    const functionalAuditRaw=await evalValue(`(async()=>{
      const fail=[],ok=[];
      const record=(name,pass,detail='')=>{(pass?ok:fail).push({name,detail})};
      const click=id=>{const el=document.getElementById(id);if(!el)return false;el.click();return true};

      // Theme toggle must actually change the reference theme and be reversible.
      window.switchView('referenceView',{history:false});
      await window.OSCP_REFERENCE?.start?.();
      const ref=document.getElementById('referenceRoot');
      const themeBefore=!!ref?.classList.contains('darkRef');
      click('themeBtn');const themeAfter=!!ref?.classList.contains('darkRef');
      click('themeBtn');const themeRestored=!!ref?.classList.contains('darkRef')===themeBefore;
      record('theme toggle',themeAfter!==themeBefore&&themeRestored,JSON.stringify({themeBefore,themeAfter,themeRestored}));

      // Evidence rotation timer: start -> advances, pause -> stable, reset -> zero.
      window.switchView('simpleExamView',{history:false});
      click('simpleTimerReset');click('simpleTimerStart');
      await new Promise(r=>setTimeout(r,1100));
      const timerRunning=document.getElementById('simpleTimerDisplay')?.textContent||'';
      click('simpleTimerPause');
      const timerPausedA=document.getElementById('simpleTimerDisplay')?.textContent||'';
      await new Promise(r=>setTimeout(r,700));
      const timerPausedB=document.getElementById('simpleTimerDisplay')?.textContent||'';
      click('simpleTimerReset');
      const timerReset=document.getElementById('simpleTimerDisplay')?.textContent||'';
      record('evidence rotation timer',timerRunning!=='00:00'&&timerPausedA===timerPausedB&&timerReset==='00:00',JSON.stringify({timerRunning,timerPausedA,timerPausedB,timerReset}));

      // Clock edit must survive the 1-second tick, save, persist, auto-save now, and clear.
      window.switchView('clockView',{history:false});
      click('clearExamClock');
      const clockInput=document.getElementById('examStart');
      clockInput.value='2035-11-12T09:30';
      clockInput.dispatchEvent(new Event('input',{bubbles:true}));
      await new Promise(r=>setTimeout(r,1300));
      const clockSurvivesTick=clockInput.value==='2035-11-12T09:30';
      click('saveExamClock');
      const clockSaved=JSON.parse(localStorage.getItem('oscp_v16_examClock')||'{}').start==='2035-11-12T09:30';
      const clockRuns=document.getElementById('attackCountdown')?.textContent!=='--:--:--';
      click('clockNowStart');
      const nowAutoSaved=JSON.parse(localStorage.getItem('oscp_v16_examClock')||'{}').start===clockInput.value&&!!clockInput.value;
      click('clearExamClock');
      const clockCleared=!clockInput.value&&document.getElementById('attackCountdown')?.textContent==='--:--:--';
      record('exam clock edit/save/now/clear',clockSurvivesTick&&clockSaved&&clockRuns&&nowAutoSaved&&clockCleared,JSON.stringify({clockSurvivesTick,clockSaved,clockRuns,nowAutoSaved,clockCleared}));

      // Method tree selector must isolate one tree and restore all.
      window.switchView('methodTreesView',{history:false});
      window.OSCP_TREE_READER?.show?.('windows');
      const treeCards=[...document.querySelectorAll('#methodTreesView .methodTreeCard')];
      const win=treeCards.find(x=>x.dataset.treeKind==='windows');
      const hiddenOthers=treeCards.filter(x=>x!==win).every(x=>x.classList.contains('treeHidden'));
      const winVisible=!!win&&!win.classList.contains('treeHidden')&&win.classList.contains('treeSolo');
      window.OSCP_TREE_READER?.show?.('all');
      const allVisible=treeCards.length>=3&&treeCards.every(x=>!x.classList.contains('treeHidden'));
      record('method tree selector',winVisible&&hiddenOthers&&allVisible,JSON.stringify({cards:treeCards.length,winVisible,hiddenOthers,allVisible}));

      // Service Router must parse and classify a realistic mixed service set and update score runway.
      window.switchView('serviceRouterView',{history:false});
      const sri=document.getElementById('serviceRouterInput');
      if(sri){sri.value='22/tcp open ssh OpenSSH 9.2\\n80/tcp open http nginx\\n445/tcp open microsoft-ds';click('serviceRouterBuild')}
      const srSummary=document.getElementById('serviceParseSummary')?.textContent||'';
      const srQueue=document.getElementById('serviceQueue')?.textContent||'';
      const scoreAD=document.getElementById('scoreAD'),scores=[...document.querySelectorAll('.scoreStandalone')];
      if(scoreAD){scoreAD.value='40';scoreAD.dispatchEvent(new Event('change',{bubbles:true}))}
      if(scores[0]){scores[0].value='20';scores[0].dispatchEvent(new Event('change',{bubbles:true}))}
      if(scores[1]){scores[1].value='20';scores[1].dispatchEvent(new Event('change',{bubbles:true}))}
      const scoreText=document.getElementById('scoreSummary')?.textContent||'';
      record('Service Router functional parse',/3 endpoint/.test(srSummary)&&/SSH/.test(srQueue)&&srQueue.includes('RPC/SMB')&&srQueue.includes('HTTP/S')&&scoreText.includes('80/100'),JSON.stringify({srSummary,scoreText}));

      // Browser-safe G + key navigation must work without OS-reserved Alt chords.
      const key=(target,letter,alt=false)=>target.dispatchEvent(new KeyboardEvent('keydown',{key:letter,altKey:alt,bubbles:true,cancelable:true}));
      const navigateByGo=(letter)=>{key(document,'g');key(document,letter);return document.querySelector('.view.active')?.id||'';};
      const gLinux=navigateByGo('l')==='linuxStrategyView';
      const gWindows=navigateByGo('w')==='windowsStrategyView';
      const gAD=navigateByGo('a')==='adStrategyView';
      const gClock=navigateByGo('c')==='clockView';
      const searchField=document.getElementById('globalSearch');
      const beforeTyping=document.querySelector('.view.active')?.id||'';
      key(searchField,'g');key(searchField,'a');
      const textSafe=(document.querySelector('.view.active')?.id||'')===beforeTyping;
      key(document,'h',true);
      const workAlt=!!document.getElementById('workStateBackdrop')?.classList.contains('open');
      window.OSCP_V26?.closeWork?.(true);
      key(document,'i',true);
      const notesAlt=!!document.getElementById('examIndexBackdrop')?.classList.contains('open');
      window.OSCP_V27?.closeIndex?.();
      record('browser-safe G shortcuts and Alt conflict fix',gLinux&&gWindows&&gAD&&gClock&&textSafe&&workAlt&&notesAlt,JSON.stringify({gLinux,gWindows,gAD,gClock,textSafe,workAlt,notesAlt}));

      // Both platform-specific winning desks must render their 12 exam-time steps.
      window.switchView('windowsStrategyView',{history:false});
      const winWinningCards=document.querySelectorAll('#winStrategyBody .winStrategyStep').length;
      window.switchView('adStrategyView',{history:false});
      const adWinningCards=document.querySelectorAll('#adStrategyBody .winStrategyStep').length;
      record('Windows and AD winning steps',winWinningCards===12&&adWinningCards===12&&!!window.OSCP_AD_WINNING_STEPS,JSON.stringify({winWinningCards,adWinningCards}));

      // AD username generator: evidence-derived names should produce non-empty candidates.
      window.switchView('adStrategyView',{history:false});
      const names=document.getElementById('adUsernameNames');
      if(names)names.value='John Smith\\nAlice Brown';
      click('adUsernameCore');click('adUsernameGenerate');
      const userOut=document.getElementById('adUsernameOutput')?.textContent||'';
      const candidateLines=userOut.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean);
      record('AD username generator',candidateLines.length>=4&&!/Paste names/i.test(userOut),candidateLines.slice(0,8).join('|'));

      // Scan Intake: parse normal Nmap text without importing it.
      window.switchView('intakeView',{history:false});
      const scan=document.getElementById('scanPaste');
      if(scan)scan.value='Nmap scan report for 10.10.10.20\\nHost is up.\\nPORT   STATE SERVICE\\n22/tcp open  ssh\\n80/tcp open  http';
      click('parsePastedScan');
      const scanPreview=document.getElementById('scanPreview')?.textContent||'';
      const scanImport=document.getElementById('importScanTargets');
      record('scan intake parser',/10\.10\.10\.20/.test(scanPreview)&&/22/.test(scanPreview)&&/80/.test(scanPreview)&&scanImport?.disabled===false,scanPreview.slice(0,300));

      // Deterministic analyzer: explicit root evidence must be recognized.
      window.switchView('analyzerView',{history:false});
      const ai=document.getElementById('analyzerInput');
      if(ai)ai.value='uid=0(root) gid=0(root) groups=0(root)';
      click('analyzeOutput');
      const analyzerText=document.getElementById('analyzerResults')?.textContent||'';
      record('output analyzer',/root identity explicitly confirmed/i.test(analyzerText),analyzerText.slice(0,300));

      // Unicode sanitizer must remove smart quotes and lint the normalized command.
      window.switchView('guardView',{history:false});
      const gc=document.getElementById('guardCommand');
      if(gc)gc.value='curl “http://10.10.10.20/”';
      click('sanitizeGuardCommand');
      const guardValue=gc?.value||'',guardResult=document.getElementById('unicodeSanitizeResult')?.textContent||'';
      record('command Unicode sanitizer',!/[“”]/.test(guardValue)&&guardValue.includes('curl "http://10.10.10.20/"')&&/Detected|No risky Unicode/.test(guardResult),JSON.stringify({guardValue,guardResult}));

      // Command palette must open, filter, expose results, and close.
      window.OSCP_V26?.openPalette?.('linux');
      await new Promise(r=>setTimeout(r,30));
      const palette=document.getElementById('commandPaletteBackdrop');
      const paletteResults=document.querySelectorAll('#commandPaletteResults [data-palette-index]').length;
      const paletteOpen=!!palette?.classList.contains('open')&&paletteResults>0;
      click('commandPaletteClose');
      record('command palette',paletteOpen&&!palette?.classList.contains('open'),'results='+paletteResults);

      // Quick note must autosave input and append a timestamp/context block.
      window.OSCP_V25?.note?.(true);
      const note=document.getElementById('quickNoteText');
      if(note){note.value='functional-audit-note';note.dispatchEvent(new Event('input',{bubbles:true}));note.selectionStart=note.selectionEnd=note.value.length}
      click('quickNoteStamp');
      const noteValue=note?.value||'';
      const noteOpen=document.getElementById('quickNoteBackdrop')?.classList.contains('open');
      click('quickNoteClose');
      record('quick note',!!noteOpen&&noteValue.includes('functional-audit-note')&&noteValue.includes('[')&&noteValue.includes(']'),noteValue.slice(0,240));

      return JSON.stringify({ok,fail});
    })()`);
    const functionalAudit=JSON.parse(functionalAuditRaw||'{}');
    if(functionalAudit.fail?.length)throw new Error('cross-application functional audit failed: '+JSON.stringify(functionalAudit.fail));

    // Stateful feature audit after a target exists.
    const targetFeatureAuditRaw=await evalValue(`(async()=>{
      const fail=[],ok=[];const record=(name,pass,detail='')=>{(pass?ok:fail).push({name,detail})};const click=id=>{const el=document.getElementById(id);if(!el)return false;el.click();return true};

      // Attempt ledger should persist a result for the active target.
      window.OSCP_V26?.openWork?.();
      await new Promise(r=>setTimeout(r,20));
      const aa=document.getElementById('attemptAction'),ar=document.getElementById('attemptResult');
      if(aa)aa.value='Functional audit SMB auth';
      if(ar)ar.value='STATUS_LOGON_FAILURE proved auth negative';
      click('attemptAdd');
      const ledger=document.getElementById('attemptLedgerList')?.textContent||'';
      record('attempt ledger',/Functional audit SMB auth/.test(ledger)&&/STATUS_LOGON_FAILURE/.test(ledger),ledger.slice(0,300));
      window.OSCP_V26?.closeWork?.(true);

      // Credential Matrix add flow must create a row.
      window.switchView('credentialsView',{history:false});
      click('showAddCred');
      const cu=document.getElementById('credUser'),cs=document.getElementById('credSecret');
      if(cu)cu.value='audit-user';if(cs)cs.value='AuditSecret!';
      const beforeCred=document.querySelectorAll('#credBody tr[data-cid]').length;
      click('addCredential');
      const afterCred=document.querySelectorAll('#credBody tr[data-cid]').length;
      const credText=document.getElementById('credBody')?.textContent||'';
      record('credential add flow',afterCred===beforeCred+1&&credText.includes('audit-user'),JSON.stringify({beforeCred,afterCred,credText:credText.slice(0,180)}));

      // Report generator must produce Markdown for the active target.
      window.switchView('reportsView',{history:false});
      click('generateReport');
      const report=document.getElementById('reportPreview')?.value||'';
      record('report generator',report.length>80&&/^#|##/m.test(report),report.slice(0,200));

      // Browser history buttons: two app views then Back should restore the previous one.
      window.switchView('methodologyView');
      window.switchView('toolArsenalView');
      history.back();
      await new Promise(r=>setTimeout(r,80));
      const backView=document.querySelector('.view.active')?.id||'';
      record('browser history restore',backView==='methodologyView',backView);

      return JSON.stringify({ok,fail});
    })()`);
    const targetFeatureAudit=JSON.parse(targetFeatureAuditRaw||'{}');
    if(targetFeatureAudit.fail?.length)throw new Error('target-state functional audit failed: '+JSON.stringify(targetFeatureAudit.fail));

    // Whole-app responsive sweep: every navigation view must stay within the page viewport.
    const responsivePasses=[];
    for(const width of [1440,900,560,390]){
      await rpc.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
      const raw=await evalValue(`(async()=>{
        const failures=[],ids=[...new Set([...document.querySelectorAll('#nav .navbtn[data-view]')].map(b=>b.dataset.view).filter(Boolean))];
        for(const id of ids){
          window.switchView(id,{history:false});
          await new Promise(r=>setTimeout(r,6));
          const v=document.getElementById(id),r=v?.getBoundingClientRect(),cs=v?getComputedStyle(v):null;
          const overflow=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-window.innerWidth;
          const ok=!!v&&v.classList.contains('active')&&cs?.display!=='none'&&r&&r.width>Math.min(260,window.innerWidth-30)&&r.left>=-2&&r.right<=window.innerWidth+8&&overflow<=8;
          if(!ok){
            const offenders=[...v.querySelectorAll('*')].map(el=>{const q=el.getBoundingClientRect();return{tag:el.tagName.toLowerCase(),id:el.id||'',cls:String(el.className||'').slice(0,100),text:String(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,90),left:Math.round(q.left),right:Math.round(q.right),w:Math.round(q.width),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}}).filter(x=>x.right>window.innerWidth+8||x.w>(r?.width||window.innerWidth)+8||x.scrollWidth>x.clientWidth+8).sort((a,b)=>(b.right-window.innerWidth)-(a.right-window.innerWidth)||b.w-a.w).slice(0,10);
            failures.push({id,display:cs?.display||'',rect:r?{left:r.left,right:r.right,w:r.width,h:r.height}:null,innerWidth:window.innerWidth,overflow,offenders});
          }
        }
        return JSON.stringify({width:window.innerWidth,count:ids.length,failures});
      })()`);
      responsivePasses.push(JSON.parse(raw||'{}'));
    }
    const responsiveFailures=responsivePasses.flatMap(x=>(x.failures||[]).map(f=>({width:x.width,...f})));
    if(responsiveFailures.length)throw new Error('whole-app responsive sweep failed: '+JSON.stringify(responsiveFailures.slice(0,20)));
    await rpc.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    await evalValue("(()=>{window.switchView('simpleExamView',{history:false});return true})()");

    const renders=[];
    for(const scale of [1,1.25,1.5]){
      await rpc.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:scale,mobile:false});
      const shot=await rpc.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
      const buf=Buffer.from(shot.data,'base64');
      if(buf.length<20000||buf[0]!==0x89||buf[1]!==0x50||buf[2]!==0x4e||buf[3]!==0x47)throw new Error('invalid browser render at scale '+scale);
      renders.push({scale,bytes:buf.length});
    }
    // Local-file gate: this is the intended exam deployment mode.
    // Simulate a browser/profile without DecompressionStream. The artifact must still work.
    await rpc.send('Page.addScriptToEvaluateOnNewDocument',{source:"try{Object.defineProperty(globalThis,'DecompressionStream',{value:undefined,writable:true,configurable:true})}catch(_){try{globalThis.DecompressionStream=undefined}catch(__){}}"});
    const fileUrl=pathToFileURL(appFile).href;
    await rpc.send('Page.navigate',{url:fileUrl});
    const localReady=await waitFor(async()=>{
      try{
        const x=await evalValue("JSON.stringify({ready:document.readyState,boot:window.OSCP_BOOT_HEALTH||null,noDecompressionStream:typeof globalThis.DecompressionStream==='undefined',controls:['globalSearch','serviceRouterView','examBankBtn','examStuckBtn'].every(id=>!!document.getElementById(id))})");
        const s=JSON.parse(x||'{}');return s.ready==='complete'&&s.controls&&s.noDecompressionStream&&s.boot?.ok!==false?s:false;
      }catch(_){return false}
    },25000,150);
    if(!localReady)throw new Error('file:// offline artifact did not reach a usable state without DecompressionStream');
    const localOpenResult=await evalValue("window.openRef('"+directAnchor+"')");
    if(localOpenResult!==true)throw new Error('file:// openRef did not report success: '+String(localOpenResult));
    const localRef=await waitFor(async()=>await evalValue("!!document.getElementById('"+directAnchor+"')&&document.getElementById('referenceView')?.classList.contains('active')===true"),20000,100);
    if(!localRef)throw new Error('file:// deep-reference navigation failed');

    const exceptions=rpc.events.filter(e=>e.method==='Runtime.exceptionThrown');
    if(exceptions.length)throw new Error('uncaught browser exception: '+JSON.stringify(exceptions[0].params?.exceptionDetails||{}).slice(0,1500));
    ws.close();
    console.log('Browser render gate passed:',JSON.stringify({ready,renders}));
  }finally{
    try{child.kill('SIGKILL')}catch(_){}
    try{server.close()}catch(_){}
    try{fs.rmSync(tmp,{recursive:true,force:true,maxRetries:2,retryDelay:100})}catch(_){}
  }
}

main().catch(e=>{console.error('Browser render gate failed:',e.message);process.exitCode=1});