import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'oscp-chrome-'));
const port=9300+(process.pid%500);

function findBrowser(){
  if(process.env.CHROME_BIN&&fs.existsSync(process.env.CHROME_BIN))return process.env.CHROME_BIN;
  for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){
    try{return execFileSync('which',[name],{encoding:'utf8'}).trim()}catch(_){}
  }
  throw new Error('Chrome/Chromium executable not found');
}
function delay(ms){return new Promise(r=>setTimeout(r,ms))}
async function waitForJson(url,timeoutMs=25000){
  const end=Date.now()+timeoutMs;
  let last='';
  while(Date.now()<end){
    if(childExit)throw new Error('Chrome exited before DevTools became ready: '+JSON.stringify(childExit));
    try{
      const r=await fetch(url);
      if(r.ok)return await r.json();
      last='HTTP '+r.status;
    }catch(e){last=e.message}
    await delay(150);
  }
  throw new Error('DevTools endpoint unavailable: '+last);
}
function withTimeout(p,ms,label){
  return Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(new Error(label+' timed out')),ms))]);
}

const browser=findBrowser();
let childExit=null;
const child=spawn(browser,[
  '--headless','--disable-gpu','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking',
  '--disable-component-update','--disable-sync','--disable-extensions','--disable-default-apps','--metrics-recording-only','--mute-audio','--no-first-run','--no-default-browser-check',
  '--allow-file-access-from-files','--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${port}`,`--user-data-dir=${tmp}`,'about:blank'
],{stdio:['ignore','ignore','pipe']});
let stderr='';
child.stderr.on('data',d=>{stderr+=String(d);if(stderr.length>12000)stderr=stderr.slice(-12000)});
child.on('exit',(code,signal)=>{childExit={code,signal}});

let ws;
try{
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const appUrl=pathToFileURL(path.join(root,'index.html')).href;
  const created=await withTimeout(fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(appUrl)}`,{method:'PUT'}),5000,'DevTools target creation');
  if(!created.ok)throw new Error('Unable to create app DevTools target: HTTP '+created.status);
  const page=await created.json();
  if(!page?.webSocketDebuggerUrl)throw new Error('No app page DevTools target');

  ws=new WebSocket(page.webSocketDebuggerUrl);
  await withTimeout(new Promise((resolve,reject)=>{
    ws.addEventListener('open',resolve,{once:true});
    ws.addEventListener('error',()=>reject(new Error('DevTools WebSocket failed')),{once:true});
  }),5000,'DevTools WebSocket');

  let seq=0;
  const pending=new Map();
  const exceptions=[];
  const waiters=new Map();
  ws.addEventListener('message',event=>{
    const msg=JSON.parse(String(event.data));
    if(msg.id&&pending.has(msg.id)){
      const {resolve,reject}=pending.get(msg.id);pending.delete(msg.id);
      if(msg.error)reject(new Error(msg.error.message||JSON.stringify(msg.error)));else resolve(msg.result);
      return;
    }
    if(msg.method==='Runtime.exceptionThrown')exceptions.push(msg.params?.exceptionDetails?.text||'Runtime exception');
    const list=waiters.get(msg.method);
    if(list?.length){waiters.delete(msg.method);for(const resolve of list)resolve(msg.params)}
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
  });
  await send('Runtime.enable');
  await send('Page.enable');

  let lastStateError='';
  async function readState(){
    try{
      const evaluated=await withTimeout(send('Runtime.evaluate',{
        expression:`(()=>({
          ready:document.readyState,
          title:document.title,
          globalSearch:!!document.getElementById('globalSearch'),
          serviceRouter:!!document.getElementById('serviceRouterView'),
          contrast:!!document.getElementById('readerContrastToggle'),
          boot:window.OSCP_BOOT_HEALTH||null
        }))()`,
        returnByValue:true
      }),4000,'state evaluation');
      lastStateError='';
      return evaluated?.result?.value||{};
    }catch(e){lastStateError=e.message;return{}}
  }
  let state={};
  const readyBy=Date.now()+30000;
  while(Date.now()<readyBy){
    state=await readState();
    if(state.globalSearch&&state.serviceRouter&&state.contrast&&state.boot?.ok===true)break;
    await delay(200);
  }
  if(!state.globalSearch||!state.serviceRouter||!state.contrast)throw new Error('critical exam UI did not become ready: '+JSON.stringify(state)+(lastStateError?' · last evaluate error: '+lastStateError:''));
  if(state.boot?.ok!==true)throw new Error('OSCP boot health did not pass: '+JSON.stringify(state.boot));
  if(!['interactive','complete'].includes(state.ready))throw new Error('document not interactive: '+state.ready);
  if(state.title!=='OSCP Exam-Only Operating System')throw new Error('unexpected title: '+state.title);

  const interaction=await withTimeout(send('Runtime.evaluate',{
    expression:`(()=>{
      const search=document.getElementById('globalSearch');
      search.value='seimpersonte';
      search.dispatchEvent(new Event('input',{bubbles:true}));
      const matches=document.querySelectorAll('#searchResults .result').length;
      const contrast=document.getElementById('readerContrastToggle');
      contrast.click();
      const contrastOn=document.body.classList.contains('examHighContrast');
      contrast.click();
      return {matches,contrastOn};
    })()`,
    returnByValue:true
  }),2500,'interaction evaluation');
  const behavior=interaction?.result?.value||{};
  if(!(behavior.matches>0))throw new Error('typo search produced no browser results');
  if(!behavior.contrastOn)throw new Error('high-contrast control did not apply');

  async function checkZoom(percent){
    const result=await withTimeout(send('Runtime.evaluate',{
      expression:`(()=>{
        document.documentElement.style.zoom='${percent}%';
        const ids=['globalSearch','examBankBtn','examStuckBtn','simpleExamView'];
        const bad=ids.filter(id=>{const e=document.getElementById(id);if(!e)return true;const r=e.getBoundingClientRect();return !Number.isFinite(r.width)||!Number.isFinite(r.height)||r.width<=0||r.height<=0});
        const state={bad,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth};
        document.documentElement.style.zoom='';
        return state;
      })()`,
      returnByValue:true
    }),2500,'zoom '+percent+' evaluation');
    const z=result?.result?.value||{};
    if(z.bad?.length)throw new Error('critical UI collapsed at '+percent+'% zoom: '+z.bad.join(', '));
    return z;
  }
  const zoom125=await checkZoom(125);
  const zoom150=await checkZoom(150);

  if(exceptions.length)throw new Error('uncaught browser exception(s): '+exceptions.join(' | '));
  console.log('Browser smoke passed:',JSON.stringify({state,behavior,zoom125,zoom150}));
}catch(e){
  console.error('Browser smoke failed:',e.message);
  if(stderr)console.error('Chrome stderr tail:\n'+stderr);
  process.exitCode=1;
}finally{
  try{ws?.close()}catch(_){}
  try{child.kill('SIGKILL')}catch(_){}
  try{fs.rmSync(tmp,{recursive:true,force:true})}catch(_){}
}
