import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
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
const delay=ms=>new Promise(r=>setTimeout(r,ms));

async function render(scale){
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'oscp-chrome-'));
  const shot=path.join(tmp,'boot.png');
  const args=[
    '--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage',
    '--disable-background-networking','--disable-component-update','--disable-sync',
    '--disable-extensions','--disable-default-apps','--metrics-recording-only','--mute-audio',
    '--disable-client-side-phishing-detection','--disable-features=OptimizationHints,MediaRouter,Translate,AutofillServerCommunication',
    '--no-first-run','--no-default-browser-check','--allow-file-access-from-files',
    '--run-all-compositor-stages-before-draw','--virtual-time-budget=6000',
    '--window-size=1440,1000',`--force-device-scale-factor=${scale}`,
    `--user-data-dir=${path.join(tmp,'profile')}`,`--screenshot=${shot}`,appUrl
  ];
  const child=spawn(findBrowser(),args,{stdio:['ignore','ignore','pipe']});
  let stderr='',exited=false;
  child.stderr.on('data',d=>{stderr+=String(d);if(stderr.length>6000)stderr=stderr.slice(-6000)});
  child.on('exit',()=>{exited=true});
  try{
    const deadline=Date.now()+25000;
    while(Date.now()<deadline){
      if(fs.existsSync(shot)){
        const buf=fs.readFileSync(shot);
        if(buf.length>=20000&&buf[0]===0x89&&buf[1]===0x50&&buf[2]===0x4e&&buf[3]===0x47){
          try{child.kill('SIGKILL')}catch(_){}
          return {scale,bytes:buf.length};
        }
      }
      if(exited)break;
      await delay(200);
    }
    throw new Error('Chrome did not produce a valid render at scale '+scale+(stderr?' · '+stderr.slice(-1200):''));
  }finally{
    try{child.kill('SIGKILL')}catch(_){}
    try{fs.rmSync(tmp,{recursive:true,force:true,maxRetries:2,retryDelay:100})}catch(_){}
  }
}

try{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const id of ['globalSearch','serviceRouterView','examBankBtn','examStuckBtn'])if(!html.includes('id="'+id+'"'))throw new Error('critical static control missing: '+id);
  const results=[];
  for(const scale of [1,1.25,1.5])results.push(await render(scale));
  console.log('Browser render gate passed:',JSON.stringify(results));
}catch(e){
  console.error('Browser render gate failed:',e.message);
  process.exitCode=1;
}
