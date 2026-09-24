import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const meta=JSON.parse(read('src/meta/build.json'));

if(!/^\d+\.\d+\.\d+$/.test(meta.version)) throw new Error('Invalid semantic build version');
if(!/^V\d+$/.test(meta.label)) throw new Error('Invalid build label');
if(!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error('Invalid build date');

let html=read('src/index.template.html');
html=html.replace(/\/\* @inject:style:([^*]+?) \*\//g,(_,f)=>read('src/styles/'+f.trim()));
html=html.replace(/\/\* @inject:script:([^*]+?) \*\//g,(_,f)=>read('src/js/'+f.trim()));
const manifest=JSON.parse(read('src/content/manifest.json'));
html=html.replace('<!-- @inject:reference -->',()=>manifest.files.map(f=>read('src/content/'+f)).join(''));

html=html
  .replaceAll('__OSCP_VERSION__',meta.version)
  .replaceAll('__OSCP_VERSION_LABEL__',meta.label)
  .replaceAll('__OSCP_BUILD_DATE__',meta.date);

const unresolved=[...new Set([
  ...(html.match(/@inject:[^<\\n]*/g)||[]),
  ...(html.match(/__OSCP_[A-Z_]+__/g)||[])
])];
if(unresolved.length) throw new Error('Unresolved build marker(s): '+unresolved.join(' | '));
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Built index.html ('+Buffer.byteLength(html).toLocaleString()+' bytes)');
console.log('SHA-256 '+createHash('sha256').update(html).digest('hex'));
