import fs from 'node:fs';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
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

const browser=findBrowser();
const required=[
  '<title>OSCP Exam-Only Operating System</title>',
  'id="globalSearch"',
  'id="serviceRouterView"',
  'id="readerContrastToggle"',
  'id="refNavigator"',
  'id="v33TopCheck"'
];

function boot(label,scale='1'){
  const result=spawnSync(browser,[
    '--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage',
    '--disable-background-networking','--disable-component-update','--disable-sync',
    '--disable-extensions','--disable-default-apps','--metrics-recording-only','--mute-audio',
    '--no-first-run','--no-default-browser-check','--allow-file-access-from-files',
    '--virtual-time-budget=5000',`--force-device-scale-factor=${scale}`,'--dump-dom',appUrl
  ],{encoding:'utf8',timeout:30000,maxBuffer:20*1024*1024});

  if(result.error){
    const extra=result.error.code==='ETIMEDOUT'?' (page did not settle inside the browser timeout)':'';
    throw new Error(label+' Chrome launch failed: '+result.error.message+extra);
  }
  if(result.status!==0)throw new Error(label+' Chrome exited '+result.status+': '+String(result.stderr||'').slice(-4000));
  const dom=String(result.stdout||'');
  if(dom.length<100000)throw new Error(label+' DOM output unexpectedly small: '+dom.length+' chars');
  const missing=required.filter(x=>!dom.includes(x));
  if(missing.length)throw new Error(label+' boot missing runtime UI: '+missing.join(', '));
  if(/@inject:|__(?:OSCP_VERSION|OSCP_VERSION_LABEL|OSCP_BUILD_DATE)__/.test(dom))throw new Error(label+' contains unresolved build markers');
  return{chars:dom.length,scale};
}

try{
  const normal=boot('normal','1');
  const scale125=boot('125% scale','1.25');
  const scale150=boot('150% scale','1.5');
  console.log('Browser boot smoke passed:',JSON.stringify({normal,scale125,scale150}));
}catch(e){
  console.error('Browser smoke failed:',e.message);
  process.exitCode=1;
}
