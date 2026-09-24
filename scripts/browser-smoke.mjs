import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'oscp-chrome-'));
const appUrl=pathToFileURL(path.join(root,'index.html')).href;

function findBrowser(){
  if(process.env.CHROME_BIN&&fs.existsSync(process.env.CHROME_BIN))return process.env.CHROME_BIN;
  for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){
    try{return execFileSync('which',[name],{encoding:'utf8'}).trim()}catch(_){}
  }
  throw new Error('Chrome/Chromium executable not found');
}
function delay(ms){return new Promise(r=>setTimeout(r,ms))}
function withTimeout(p,ms,label){
  return Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(new Error(label+' timed out')),ms))]);
}

const browser=findBrowser();
const child=spawn(browser,[
  '--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage',
  '--disable-background-networking','--disable-component-update','--disable-sync',
  '--disable-extensions','--disable-default-apps','--metrics-recording-only','--mute-audio',
  '--no-first-run','--no-default-browser-check','--allow-file-access-from-files',
  '--remote-debugging-pipe',`--user-data-dir=${tmp}`,'about:blank'
],{stdio:['ignore','ignore','pipe','pipe','pipe']});

let stderr='',exited=null,seq=0,buffer='';
const pending=new Map(),exceptions=[];
child.stderr.on('data',d=>{stderr+=String(d);if(stderr.length>12000)stderr=stderr.slice(-12000)});
child.on('exit',(code,signal)=>{exited={code,signal};for(const {reject} of pending.values())reject(new Error('Chrome exited: '+JSON.stringify(exited)));pending.clear()});

const commandPipe=child.stdio[3],responsePipe=child.stdio[4];
if(!commandPipe||!responsePipe)throw new Error('Chrome DevTools pipe descriptors unavailable');

responsePipe.on('data',chunk=>{
  buffer+=chunk.toString('utf8');
  let cut;
  while((cut=buffer.indexOf('\0'))>=0){
    const raw=buffer.slice(0,cut);buffer=buffer.slice(cut+1);
    if(!raw)continue;
    let msg;try{msg=JSON.parse(raw)}catch(_){continue}
    if(msg.id&&pending.has(msg.id)){
      const {resolve,reject}=pending.get(msg.id);pending.delete(msg.id);
      if(msg.error)reject(new Error(msg.error.message||JSON.stringify(msg.error)));else resolve(msg.result);
      continue;
    }
    if(msg.method==='Runtime.exceptionThrown')exceptions.push(msg.params?.exceptionDetails?.text||'Runtime exception');
  }
});

function send(method,params={},sessionId){
  if(exited)return Promise.reject(new Error('Chrome already exited: '+JSON.stringify(exited)));
  return new Promise((resolve,reject)=>{
    const id=++seq;pending.set(id,{resolve,reject});
    const msg={id,method,params};if(sessionId)msg.sessionId=sessionId;
    commandPipe.write(JSON.stringify(msg)+'\0');
  });
}

let sessionId='';
try{
  const created=await withTimeout(send('Target.createTarget',{url:appUrl}),10000,'create app target');
  if(!created?.targetId)throw new Error('Chrome did not create app target');
  const attached=await withTimeout(send('Target.attachToTarget',{targetId:created.targetId,flatten:true}),10000,'attach app target');
  sessionId=attached?.sessionId||'';if(!sessionId)throw new Error('Chrome did not return app session');
  await withTimeout(send('Runtime.enable',{},sessionId),5000,'Runtime.enable');
  await withTimeout(send('Page.enable',{},sessionId),5000,'Page.enable');

  let lastStateError='',state={};
  async function readState(){
    try{
      const evaluated=await withTimeout(send('Runtime.evaluate',{
        expression:`(()=>({
          ready:document.readyState,
          title:document.title,
          url:location.href,
          globalSearch:!!document.getElementById('globalSearch'),
          serviceRouter:!!document.getElementById('serviceRouterView'),
          contrast:!!document.getElementById('readerContrastToggle'),
          refNavigator:!!document.getElementById('refNavigator'),
          preflight:!!document.getElementById('v33TopCheck'),
          boot:window.OSCP_BOOT_HEALTH||null
        }))()`,
        returnByValue:true
      },sessionId),5000,'state evaluation');
      lastStateError='';
      return evaluated?.result?.value||{};
    }catch(e){lastStateError=e.message;return{}}
  }

  const readyBy=Date.now()+30000;
  while(Date.now()<readyBy){
    state=await readState();
    if(state.globalSearch&&state.serviceRouter&&state.contrast&&state.refNavigator&&state.preflight&&state.boot?.ok===true)break;
    await delay(200);
  }
  if(!state.globalSearch||!state.serviceRouter||!state.contrast||!state.refNavigator||!state.preflight)throw new Error('critical exam UI did not become ready: '+JSON.stringify(state)+(lastStateError?' · '+lastStateError:''));
  if(state.boot?.ok!==true)throw new Error('OSCP boot health did not pass: '+JSON.stringify(state.boot));
  if(!['interactive','complete'].includes(state.ready))throw new Error('document not interactive: '+state.ready);
  if(state.title!=='OSCP Exam-Only Operating System')throw new Error('unexpected title: '+state.title);
  if(!String(state.url||'').startsWith('file:'))throw new Error('app did not load as local file: '+state.url);

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
  },sessionId),5000,'interaction evaluation');
  const behavior=interaction?.result?.value||{};
  if(!(behavior.matches>0))throw new Error('typo search produced no browser results');
  if(!behavior.contrastOn)throw new Error('high-contrast control did not apply');

  async function checkZoom(percent){
    const result=await withTimeout(send('Runtime.evaluate',{
      expression:`(()=>{
        document.documentElement.style.zoom='${percent}%';
        const ids=['globalSearch','examBankBtn','examStuckBtn','simpleExamView'];
        const bad=ids.filter(id=>{const e=document.getElementById(id);if(!e)return true;const r=e.getBoundingClientRect();return !Number.isFinite(r.width)||!Number.isFinite(r.height)||r.width<=0||r.height<=0});
        const out={bad,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth};
        document.documentElement.style.zoom='';
        return out;
      })()`,
      returnByValue:true
    },sessionId),5000,'zoom '+percent+' evaluation');
    const z=result?.result?.value||{};if(z.bad?.length)throw new Error('critical UI collapsed at '+percent+'% zoom: '+z.bad.join(', '));return z;
  }
  const zoom125=await checkZoom(125),zoom150=await checkZoom(150);
  if(exceptions.length)throw new Error('uncaught browser exception(s): '+exceptions.join(' | '));
  console.log('Browser smoke passed:',JSON.stringify({state,behavior,zoom125,zoom150}));
}catch(e){
  console.error('Browser smoke failed:',e.message);
  if(stderr)console.error('Chrome stderr tail:\n'+stderr);
  process.exitCode=1;
}finally{
  try{if(sessionId)await withTimeout(send('Runtime.disable',{},sessionId),1000,'Runtime.disable')}catch(_){}
  try{child.kill('SIGKILL')}catch(_){}
  try{fs.rmSync(tmp,{recursive:true,force:true})}catch(_){}
}
