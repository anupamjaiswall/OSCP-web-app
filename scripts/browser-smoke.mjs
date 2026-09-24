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
async function waitForJson(url,timeoutMs=12000){
  const end=Date.now()+timeoutMs;
  let last='';
  while(Date.now()<end){
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
const child=spawn(browser,[
  '--headless=new','--disable-gpu','--no-sandbox','--disable-background-networking',
  '--disable-component-update','--disable-sync','--no-first-run','--no-default-browser-check',
  '--allow-file-access-from-files',`--remote-debugging-port=${port}`,`--user-data-dir=${tmp}`,'about:blank'
],{stdio:['ignore','ignore','pipe']});
let stderr='';
child.stderr.on('data',d=>{stderr+=String(d);if(stderr.length>12000)stderr=stderr.slice(-12000)});

let ws;
try{
  const targets=await waitForJson(`http://127.0.0.1:${port}/json/list`);
  const page=targets.find(x=>x.type==='page');
  if(!page?.webSocketDebuggerUrl)throw new Error('No page DevTools target');

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
  const once=method=>new Promise(resolve=>waiters.set(method,[...(waiters.get(method)||[]),resolve]));

  await send('Runtime.enable');
  await send('Page.enable');
  const loaded=once('Page.loadEventFired');
  await send('Page.navigate',{url:pathToFileURL(path.join(root,'index.html')).href});
  await withTimeout(loaded,12000,'Page load');
  await delay(300);

  const evaluated=await send('Runtime.evaluate',{
    expression:`(()=>({
      ready:document.readyState,
      title:document.title,
      globalSearch:!!document.getElementById('globalSearch'),
      serviceRouter:!!document.getElementById('serviceRouterView'),
      contrast:!!document.getElementById('readerContrastToggle'),
      boot:window.OSCP_BOOT_HEALTH||null
    }))()`,
    returnByValue:true
  });
  const state=evaluated?.result?.value||{};
  if(state.ready!=='complete')throw new Error('document.readyState='+state.ready);
  if(state.title!=='OSCP Exam-Only Operating System')throw new Error('unexpected title: '+state.title);
  if(!state.globalSearch||!state.serviceRouter||!state.contrast)throw new Error('critical exam UI missing: '+JSON.stringify(state));
  if(state.boot&&state.boot.ok===false)throw new Error('OSCP boot health failed: '+JSON.stringify(state.boot));

  const interaction=await send('Runtime.evaluate',{
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
  });
  const behavior=interaction?.result?.value||{};
  if(!(behavior.matches>0))throw new Error('typo search produced no browser results');
  if(!behavior.contrastOn)throw new Error('high-contrast control did not apply');

  if(exceptions.length)throw new Error('uncaught browser exception(s): '+exceptions.join(' | '));
  console.log('Browser smoke passed:',JSON.stringify({state,behavior}));
}catch(e){
  console.error('Browser smoke failed:',e.message);
  if(stderr)console.error('Chrome stderr tail:\n'+stderr);
  process.exitCode=1;
}finally{
  try{ws?.close()}catch(_){}
  try{child.kill('SIGKILL')}catch(_){}
  try{fs.rmSync(tmp,{recursive:true,force:true})}catch(_){}
}
