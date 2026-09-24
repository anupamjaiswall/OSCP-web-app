import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const appUrl=pathToFileURL(path.join(root,'index.html')).href;
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
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const id of ['globalSearch','serviceRouterView','examBankBtn','examStuckBtn'])if(!html.includes('id="'+id+'"'))throw new Error('critical static control missing: '+id);

  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'oscp-chrome-'));
  const args=[
    '--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage',
    '--disable-background-networking','--disable-component-update','--disable-sync',
    '--disable-extensions','--disable-default-apps','--metrics-recording-only','--mute-audio',
    '--disable-client-side-phishing-detection','--disable-features=OptimizationHints,MediaRouter,Translate,AutofillServerCommunication',
    '--no-first-run','--no-default-browser-check','--allow-file-access-from-files',
    '--remote-debugging-port=0',`--user-data-dir=${path.join(tmp,'profile')}`,appUrl
  ];
  const child=spawn(findBrowser(),args,{stdio:['ignore','ignore','pipe']});
  let stderr='',browserWs='';
  child.stderr.on('data',d=>{stderr+=String(d);if(stderr.length>12000)stderr=stderr.slice(-12000);const m=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m)browserWs=m[1]});
  try{
    const wsUrl=await waitFor(()=>browserWs||'',12000);
    if(!wsUrl)throw new Error('Chrome DevTools endpoint did not start'+(stderr?' · '+stderr.slice(-1000):''));
    const u=new URL(wsUrl),base='http://'+u.hostname+':'+u.port;
    const page=await waitFor(async()=>{
      const pages=await (await fetch(base+'/json/list')).json();
      return pages.find(p=>p.type==='page'&&String(p.url||'').startsWith('file:'))||pages.find(p=>p.type==='page');
    },12000);
    if(!page?.webSocketDebuggerUrl)throw new Error('Chrome page target was not available');

    const ws=new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(new Error('DevTools websocket timed out')),8000);ws.onopen=()=>{clearTimeout(t);resolve()};ws.onerror=e=>{clearTimeout(t);reject(e instanceof Error?e:new Error('DevTools websocket failed'))}});
    const rpc=makeRpc(ws);
    await rpc.send('Runtime.enable');await rpc.send('Page.enable');

    let lastState=null,lastProbeError='';
    const ready=await waitFor(async()=>{
      try{
        const out=await rpc.send('Runtime.evaluate',{expression:`JSON.stringify({ready:document.readyState,controls:['globalSearch','serviceRouterView','examBankBtn','examStuckBtn'].map(id=>[id,!!document.getElementById(id)]),boot:window.OSCP_BOOT_HEALTH||null,searchReady:window.OSCP_SEARCH_INDEX_READY===true,codeReady:window.OSCP_CODE_BLOCKS_READY===true})`,returnByValue:true});
        const raw=out?.result?.value;if(!raw)return false;lastState=JSON.parse(raw);lastProbeError='';
        const controlsOk=lastState.controls.every(x=>x[1]);
        return lastState.ready==='complete'&&controlsOk&&lastState.boot?.ok!==false?lastState:false;
      }catch(e){lastProbeError=e.message;return false}
    },20000,150);
    if(!ready)throw new Error('Offline app did not reach a usable completed state · lastState='+JSON.stringify(lastState)+' · probe='+lastProbeError);

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
    try{fs.rmSync(tmp,{recursive:true,force:true,maxRetries:2,retryDelay:100})}catch(_){}
  }
}

main().catch(e=>{console.error('Browser render gate failed:',e.message);process.exitCode=1});
