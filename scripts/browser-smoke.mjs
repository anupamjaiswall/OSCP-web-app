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

function render(scale){
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'oscp-chrome-'));
  const shot=path.join(tmp,'boot.png');
  try{
    execFileSync(findBrowser(),[
      '--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage',
      '--disable-background-networking','--disable-component-update','--disable-sync',
      '--disable-extensions','--disable-default-apps','--metrics-recording-only','--mute-audio',
      '--disable-client-side-phishing-detection','--disable-features=OptimizationHints,MediaRouter,Translate,AutofillServerCommunication',
      '--no-first-run','--no-default-browser-check','--allow-file-access-from-files',
      '--run-all-compositor-stages-before-draw','--virtual-time-budget=6000',
      '--window-size=1440,1000',`--force-device-scale-factor=${scale}`,
      `--user-data-dir=${path.join(tmp,'profile')}`,`--screenshot=${shot}`,appUrl
    ],{encoding:'utf8',timeout:30000,maxBuffer:2*1024*1024,stdio:['ignore','pipe','pipe']});
    if(!fs.existsSync(shot))throw new Error('Chrome did not create screenshot at scale '+scale);
    const buf=fs.readFileSync(shot);
    if(buf.length<20000)throw new Error('browser render is unexpectedly small at scale '+scale+': '+buf.length+' bytes');
    if(buf[0]!==0x89||buf[1]!==0x50||buf[2]!==0x4e||buf[3]!==0x47)throw new Error('browser render is not a PNG at scale '+scale);
    return {scale,bytes:buf.length};
  }finally{fs.rmSync(tmp,{recursive:true,force:true})}
}

try{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const id of ['globalSearch','serviceRouterView','examBankBtn','examStuckBtn'])if(!html.includes('id="'+id+'"'))throw new Error('critical static control missing: '+id);
  const results=[render(1),render(1.25),render(1.5)];
  console.log('Browser render gate passed:',JSON.stringify(results));
}catch(e){
  console.error('Browser render gate failed:',e.message);
  process.exitCode=1;
}
