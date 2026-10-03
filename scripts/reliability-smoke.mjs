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
function rpc(ws){let id=0;const pending=new Map(),events=[];ws.onmessage=e=>{const m=JSON.parse(String(e.data));if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);return}if(m.method)events.push(m)};const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.has(n)){pending.delete(n);reject(new Error(method+' timed out'))}},9000)});return{send,events}}

async function main(){
 const server=http.createServer((req,res)=>{if(req.url==='/'||req.url==='/index.html'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(html)}else{res.writeHead(404);res.end('not found')}});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'oscp-reliability-')),profile=path.join(tmp,'profile');const child=spawn(browser(),['--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-extensions','--no-first-run','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});let stderr='';child.stderr.on('data',d=>{stderr=(stderr+String(d)).slice(-12000)});
 try{
  const port=await waitFor(()=>{const f=path.join(profile,'DevToolsActivePort');if(fs.existsSync(f)){const p=Number(fs.readFileSync(f,'utf8').split(/\r?\n/)[0]);if(p)return p}const m=stderr.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);return m?Number(m[1]):false},40000);if(!port)throw new Error('DevTools endpoint did not start');
  const base='http://127.0.0.1:'+port,page=await waitFor(async()=>{const a=await(await fetch(base+'/json/list')).json();return a.find(x=>x.type==='page')},12000);if(!page?.webSocketDebuggerUrl)throw new Error('No page target');
  const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=()=>reject(new Error('DevTools websocket failed'))});const c=rpc(ws);await c.send('Runtime.enable');await c.send('Page.enable');await c.send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/index.html#view=sessionView'});
  const evaluate=async expression=>{const out=await c.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(out.exceptionDetails)throw new Error(JSON.stringify(out.exceptionDetails));return out.result?.value};
  const ready=await waitFor(async()=>await evaluate(`document.readyState==='complete'&&typeof window.OSCP_RELIABILITY_SAFETY?.runPreflight==='function'&&!!document.getElementById('reliabilitySafetyCard')&&!!document.getElementById('reliabilityClockBackup')`),25000);if(!ready)throw new Error('Reliability safety UI did not boot');
  const pure=JSON.parse(await evaluate(`(()=>{const c=window.OSCP_RELIABILITY_CORE,f=c.scanSecretLikeText({note:'password=ExampleSecret123',k:'-----BEGIN PRIVATE KEY-----'}),u=c.storageUsage([['oscp_v16_big','x'.repeat(4000)]],'oscp_v16_',10000);return JSON.stringify({findings:f.map(x=>({kind:x.kind,path:x.path,hasValue:Object.prototype.hasOwnProperty.call(x,'value')})),warning:u.warning,pct:u.pct})})()`));
  if(!pure.findings.some(x=>x.kind==='credential label')||!pure.findings.some(x=>x.kind==='private key')||pure.findings.some(x=>x.hasValue)||pure.warning!==true)throw new Error('Pure reliability logic failed: '+JSON.stringify(pure));
  const pre=JSON.parse(await evaluate(`(async()=>{const r=await window.OSCP_RELIABILITY_SAFETY.runPreflight();return JSON.stringify({summary:r.summary,count:r.rows.length,card:!!document.getElementById('reliabilitySafetyCard'),meter:document.getElementById('reliabilityStorageText')?.textContent||'',results:document.querySelectorAll('#reliabilityResults .reliabilityResult').length,backup:!!document.getElementById('reliabilityBackupNow')})})()`));
  if(pre.summary.fail!==0||pre.count<7||pre.results!==pre.count||!pre.card||!pre.backup||!/localStorage/i.test(pre.meter))throw new Error('Reliability preflight failed: '+JSON.stringify(pre));
  const exportWrapped=await evaluate(`document.getElementById('exportSession')?.dataset.secretLint==='1'`);if(exportWrapped!==true)throw new Error('Secret-free export lint wrapper missing');
  const exceptions=c.events.filter(e=>e.method==='Runtime.exceptionThrown');if(exceptions.length)throw new Error('Uncaught browser exception: '+JSON.stringify(exceptions[0].params?.exceptionDetails||{}).slice(0,1000));ws.close();console.log('Reliability browser gate passed:',JSON.stringify({preflight:true,storage:true,secretLint:true,clockBackup:true}));
 }finally{try{child.kill('SIGKILL')}catch(_){}try{server.close()}catch(_){}try{fs.rmSync(tmp,{recursive:true,force:true})}catch(_){}}
}
main().catch(e=>{console.error('Reliability browser gate failed:',e.message);process.exitCode=1});
