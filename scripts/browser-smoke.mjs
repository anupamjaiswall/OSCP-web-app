import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
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
    await rpc.send('Page.navigate',{url:appUrl});

    let lastState=null,lastProbeError='';
    const ready=await waitFor(async()=>{
      try{
        const out=await rpc.send('Runtime.evaluate',{expression:`JSON.stringify({ready:document.readyState,stage:window.__OSCP_BOOT_STAGE__||'unset',parseStage:window.__OSCP_PARSE_STAGE__||'unset',coreStage:window.__OSCP_CORE_STAGE__||'unset',controls:['globalSearch','serviceRouterView','examBankBtn','examStuckBtn'].map(id=>[id,!!document.getElementById(id)]),boot:window.OSCP_BOOT_HEALTH||null,searchReady:window.OSCP_SEARCH_INDEX_READY===true,codeReady:window.OSCP_CODE_BLOCKS_READY===true,initialRender:window.OSCP_INITIAL_RENDER_READY===true})`,returnByValue:true});
        const raw=out?.result?.value;if(!raw)return false;lastState=JSON.parse(raw);lastProbeError='';
        const controlsOk=lastState.controls.every(x=>x[1]);
        return lastState.ready==='complete'&&controlsOk&&lastState.boot?.ok!==false?lastState:false;
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

    // Real interaction 1: typo-tolerant search must produce results after lazy reference hydration.
    await evalValue(`(()=>{const i=document.getElementById('globalSearch');i.value='seimpersonte';i.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
    const typoSearch=await waitFor(async()=>{
      const x=await evalValue(`JSON.stringify({stats:document.getElementById('searchStats')?.textContent||'',results:document.querySelectorAll('#searchResults .result').length,ready:window.OSCP_REFERENCE_READY===true})`);
      const s=JSON.parse(x||'{}');return s.ready&&s.results>0?s:false;
    },20000,150);
    if(!typoSearch)throw new Error('typo-tolerant browser search did not return a result');

    // Real interaction 2: readability/high-contrast control must change the live body state.
    const contrast=await evalValue(`(()=>{const b=document.getElementById('readerContrastToggle');if(!b)return false;b.click();return document.body.classList.contains('examHighContrast')})()`);
    if(!contrast)throw new Error('high-contrast browser toggle did not activate');

    // Real interaction 3: target creation must render a target in a fresh profile.
    const targetCreated=await evalValue(`(()=>{const before=document.querySelectorAll('#targetList .target').length;document.getElementById('addTarget')?.click();const after=document.querySelectorAll('#targetList .target').length;return after===before+1})()`);
    if(!targetCreated)throw new Error('target creation did not render exactly one new target');

    const renders=[];
    for(const scale of [1,1.25,1.5]){
      await rpc.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:scale,mobile:false});
      const shot=await rpc.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
      const buf=Buffer.from(shot.data,'base64');
      if(buf.length<20000||buf[0]!==0x89||buf[1]!==0x50||buf[2]!==0x4e||buf[3]!==0x47)throw new Error('invalid browser render at scale '+scale);
      renders.push({scale,bytes:buf.length});
    }
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
