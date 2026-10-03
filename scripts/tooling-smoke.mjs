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
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'oscp-tooling-')),profile=path.join(tmp,'profile');const child=spawn(browser(),['--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-extensions','--no-first-run','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});let stderr='';child.stderr.on('data',d=>{stderr=(stderr+String(d)).slice(-12000)});
 try{
  const port=await waitFor(()=>{const f=path.join(profile,'DevToolsActivePort');if(fs.existsSync(f)){const p=Number(fs.readFileSync(f,'utf8').split(/\r?\n/)[0]);if(p)return p}const m=stderr.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);return m?Number(m[1]):false},40000);if(!port)throw new Error('DevTools endpoint did not start');
  const base='http://127.0.0.1:'+port,page=await waitFor(async()=>{const a=await(await fetch(base+'/json/list')).json();return a.find(x=>x.type==='page')},12000);if(!page?.webSocketDebuggerUrl)throw new Error('No page target');
  const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=()=>reject(new Error('DevTools websocket failed'))});const rpc=makeRpc(ws);await rpc.send('Runtime.enable');await rpc.send('Page.enable');await rpc.send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/index.html#view=toolArsenalView'});
  const evaluate=async expression=>{const out=await rpc.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(out.exceptionDetails)throw new Error(JSON.stringify(out.exceptionDetails));return out.result?.value};
  const ready=await waitFor(async()=>await evaluate(`document.readyState==='complete'&&!!window.OSCP_TOOLING_2026_CORE&&!!document.getElementById('tooling2026Desk')&&document.getElementById('toolArsenalView')?.classList.contains('active')`),25000);if(!ready)throw new Error('Tooling desk did not boot');
  const initial=JSON.parse(await evaluate(`JSON.stringify({count:document.getElementById('toolCount')?.textContent||'',desk:document.getElementById('tooling2026Desk')?.textContent||'',hero:[...document.querySelectorAll('#toolArsenalView .hero .chip')].map(x=>x.textContent).join(' '),penelope:typeof TOOL_ARSENAL!=='undefined'&&TOOL_ARSENAL.some(x=>x.id==='penelope'),rusthound:typeof TOOL_ARSENAL!=='undefined'&&TOOL_ARSENAL.some(x=>x.id==='rusthound-ce')})`));
  if(!initial.penelope||!initial.rusthound||!/PRIMARY FIRST/.test(initial.desk)||!/Penelope/.test(initial.desk)||!/29 RECOMMENDED/.test(initial.hero+initial.count))throw new Error('Tooling desk/defaults missing: '+JSON.stringify(initial));
  const penelope=JSON.parse(await evaluate(`(()=>{const s=document.getElementById('toolScope'),q=document.getElementById('toolSearch');s.value='all';s.dispatchEvent(new Event('change',{bubbles:true}));q.value='penelope';q.dispatchEvent(new Event('input',{bubbles:true}));return new Promise(r=>setTimeout(()=>r(JSON.stringify({text:document.getElementById('toolGrid')?.textContent||'',cards:document.querySelectorAll('#toolGrid .toolCard').length})),180))})()`));
  if(penelope.cards!==1||!/OSCP-safe mode/.test(penelope.text)||!/-O -p/.test(penelope.text))throw new Error('Penelope tooling card incorrect: '+JSON.stringify(penelope));
  const rusthound=JSON.parse(await evaluate(`(()=>{const q=document.getElementById('toolSearch');q.value='rusthound';q.dispatchEvent(new Event('input',{bubbles:true}));return new Promise(r=>setTimeout(()=>r(JSON.stringify({text:document.getElementById('toolGrid')?.textContent||'',cards:document.querySelectorAll('#toolGrid .toolCard').length})),180))})()`));
  if(rusthound.cards!==1||!/RustHound-CE/.test(rusthound.text)||!/bloodhound-ce-python/.test(rusthound.text))throw new Error('RustHound fallback card incorrect: '+JSON.stringify(rusthound));
  const nuclei=JSON.parse(await evaluate(`(()=>{const s=document.getElementById('toolScope'),q=document.getElementById('toolSearch');s.value='best';s.dispatchEvent(new Event('change',{bubbles:true}));q.value='nuclei';q.dispatchEvent(new Event('input',{bubbles:true}));return new Promise(r=>setTimeout(()=>r(JSON.stringify({cards:document.querySelectorAll('#toolGrid .toolCard').length,text:document.getElementById('toolGrid')?.textContent||''})),180))})()`));
  if(nuclei.cards!==0)throw new Error('Nuclei was incorrectly promoted into recommended defaults: '+JSON.stringify(nuclei));
  const exceptions=rpc.events.filter(e=>e.method==='Runtime.exceptionThrown');if(exceptions.length)throw new Error('Uncaught browser exception: '+JSON.stringify(exceptions[0].params?.exceptionDetails||{}).slice(0,1200));
  ws.close();console.log('Tooling browser gate passed:',JSON.stringify({desk:true,recommended:29,penelope:true,rusthound:true,nucleiDefault:false}));
 }finally{try{child.kill('SIGKILL')}catch(_){}try{server.close()}catch(_){}try{fs.rmSync(tmp,{recursive:true,force:true})}catch(_){}}
}
main().catch(e=>{console.error('Tooling browser gate failed:',e.message);process.exitCode=1});
