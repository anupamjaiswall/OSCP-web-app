import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import http from 'node:http';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function browser(){if(process.env.CHROME_BIN&&fs.existsSync(process.env.CHROME_BIN))return process.env.CHROME_BIN;for(const n of ['google-chrome','google-chrome-stable','chromium','chromium-browser'])try{return execFileSync('which',[n],{encoding:'utf8'}).trim()}catch(_){}throw new Error('Chrome/Chromium executable not found')}
async function waitFor(fn,timeout=25000,step=100){const end=Date.now()+timeout;while(Date.now()<end){try{const v=await fn();if(v)return v}catch(_){}await delay(step)}return false}
function makeRpc(ws){let id=0;const pending=new Map(),events=[];ws.onmessage=e=>{const m=JSON.parse(String(e.data));if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);return}if(m.method)events.push(m)};const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.has(n)){pending.delete(n);reject(new Error(method+' timed out'))}},9000)});return{send,events}}

async function main(){
 const server=http.createServer((req,res)=>{if(req.url==='/'||req.url==='/index.html'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(html)}else{res.writeHead(404);res.end('not found')}});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'oscp-passer-loop-')),profile=path.join(tmp,'profile');const child=spawn(browser(),['--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-extensions','--no-first-run','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});let stderr='';child.stderr.on('data',d=>{stderr=(stderr+String(d)).slice(-12000)});
 try{
  const port=await waitFor(()=>{const f=path.join(profile,'DevToolsActivePort');if(fs.existsSync(f)){const p=Number(fs.readFileSync(f,'utf8').split(/\r?\n/)[0]);if(p)return p}const m=stderr.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);return m?Number(m[1]):false},40000);if(!port)throw new Error('DevTools endpoint did not start');
  const base='http://127.0.0.1:'+port,page=await waitFor(async()=>{const a=await(await fetch(base+'/json/list')).json();return a.find(x=>x.type==='page')},12000);if(!page?.webSocketDebuggerUrl)throw new Error('No page target');
  const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=()=>reject(new Error('DevTools websocket failed'))});const rpc=makeRpc(ws);await rpc.send('Runtime.enable');await rpc.send('Page.enable');await rpc.send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/index.html#view=simpleExamView'});
  const evaluate=async expression=>{const out=await rpc.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(out.exceptionDetails)throw new Error(JSON.stringify(out.exceptionDetails));return out.result?.value};
  const ready=await waitFor(async()=>await evaluate(`document.readyState==='complete'&&!!window.OSCP_PASSER_CORE&&!!window.OSCP_PASSER_LOOP&&!!document.getElementById('v34PasserLoopCard')&&document.getElementById('simpleExamView')?.classList.contains('active')`),25000);if(!ready)throw new Error('Passer-derived exam loop did not boot');
  const core=JSON.parse(await evaluate(`JSON.stringify({ad:window.OSCP_PASSER_CORE.resetChecklist({role:'dc',ports:[{port:88,state:'open'},{port:389,state:'open'},{port:445,state:'open'}],creds:'CORP\\\\alice : secret'}).map(x=>x.id),web:window.OSCP_PASSER_CORE.resetChecklist({role:'web',ports:[{port:443,state:'open'}]}).map(x=>x.id)})`));
  if(!core.ad.includes('ad-context')||!core.ad.includes('cred-fanout')||!core.web.includes('web-depth'))throw new Error('State-aware reset branches missing: '+JSON.stringify(core));
  const seeded=JSON.parse(await evaluate(`(()=>{const t=newTarget();t.ip='10.10.10.10';t.role='dc';t.ports=[{port:88,proto:'tcp',state:'open',service:'kerberos'},{port:389,proto:'tcp',state:'open',service:'ldap'},{port:445,proto:'tcp',state:'open',service:'microsoft-ds'}];t.status={tcp:true};t.creds='CORP\\\\alice : secret';targets=[t];activeTargetId=t.id;saveTargets();window.OSCP_PASSER_LOOP.refresh();window.OSCP_PASSER_LOOP.open();return JSON.stringify({open:document.getElementById('v34FreshBackdrop')?.classList.contains('open'),text:document.getElementById('v34FreshList')?.textContent||'',metrics:document.getElementById('v34PasserMetrics')?.textContent||'',count:document.querySelectorAll('#v34FreshList input[type="checkbox"]').length})})()`));
  if(!seeded.open||seeded.count<6||!/Restart the AD chain/.test(seeded.text)||!/Full TCP · 1\/1/.test(seeded.metrics))throw new Error('Fresh-eyes UI did not reflect active AD target: '+JSON.stringify(seeded));
  const checked=await evaluate(`(()=>{const c=document.querySelector('#v34FreshList input[type="checkbox"]');if(!c)return '';c.click();return document.getElementById('v34FreshStatus')?.textContent||''})()`);if(!/^1 \/ /.test(checked))throw new Error('Fresh-eyes checklist status did not update: '+checked);
  const stuckLink=await evaluate(`(()=>{window.OSCP_PASSER_LOOP.close();document.getElementById('examStuckBtn')?.click();return !!document.getElementById('v34FreshFromStuck')&&document.getElementById('examResetModal')?.classList.contains('open')})()`);if(!stuckLink)throw new Error('Existing stuck reset was not upgraded with fresh-eyes handoff');
  const exceptions=rpc.events.filter(e=>e.method==='Runtime.exceptionThrown');if(exceptions.length)throw new Error('Uncaught browser exception: '+JSON.stringify(exceptions[0].params?.exceptionDetails||{}).slice(0,1200));
  ws.close();console.log('Passer-loop browser gate passed:',JSON.stringify({stateAware:true,ad:true,web:true,metrics:true,stuckHandoff:true}));
 }finally{try{child.kill('SIGKILL')}catch(_){}try{server.close()}catch(_){}try{fs.rmSync(tmp,{recursive:true,force:true})}catch(_){}}
}
main().catch(e=>{console.error('Passer-loop browser gate failed:',e.message);process.exitCode=1});
