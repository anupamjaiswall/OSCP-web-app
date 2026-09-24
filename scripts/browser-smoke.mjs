import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const appUrl=pathToFileURL(path.join(root,'index.html')).href;

function findBrowser(){
  if(process.env.CHROME_BIN&&fs.existsSync(process.env.CHROME_BIN))return process.env.CHROME_BIN;
  for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){
    try{return execFileSync('which',[name],{encoding:'utf8'}).trim()}catch(_){}
  }
  throw new Error('Chrome/Chromium executable not found');
}
function run(scale){
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'oscp-chrome-'));
  try{
    const out=execFileSync(findBrowser(),[
      '--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage',
      '--disable-background-networking','--disable-component-update','--disable-sync','--disable-client-side-phishing-detection',
      '--disable-extensions','--disable-default-apps','--metrics-recording-only','--mute-audio','--disable-features=OptimizationHints,MediaRouter,Translate,AutofillServerCommunication',
      '--no-first-run','--no-default-browser-check','--allow-file-access-from-files',
      '--virtual-time-budget=5000',`--force-device-scale-factor=${scale}`,
      `--user-data-dir=${profile}`,'--dump-dom',appUrl
    ],{encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024,stdio:['ignore','pipe','pipe']});
    const required=[
      '<title>OSCP Exam-Only Operating System</title>',
      'id="globalSearch"',
      'id="serviceRouterView"',
      'id="readerContrastToggle"',
      'id="refNavigator"',
      'id="v33TopCheck"'
    ];
    const missing=required.filter(x=>!out.includes(x));
    if(missing.length)throw new Error('runtime DOM missing at scale '+scale+': '+missing.join(', '));
    if(!/OSCP_BOOT_HEALTH/.test(fs.readFileSync(path.join(root,'src/js/16-v26-scratch-architecture.js'),'utf8')))throw new Error('boot health implementation missing');
    return {scale,bytes:Buffer.byteLength(out)};
  }finally{fs.rmSync(profile,{recursive:true,force:true})}
}

try{
  const results=[run(1),run(1.25),run(1.5)];
  console.log('Browser smoke passed:',JSON.stringify(results));
}catch(e){
  console.error('Browser smoke failed:',e.message);
  process.exitCode=1;
}
