import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const meta=JSON.parse(read('src/meta/build.json'));
const quality=JSON.parse(read('src/meta/quality.json'));

if(!/^\d+\.\d+\.\d+$/.test(meta.version)) throw new Error('Invalid semantic build version');
if(!/^V\d+$/.test(meta.label)) throw new Error('Invalid build label');
if(!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error('Invalid build date');

function syncReadmeVersion(){
  const p=path.join(root,'README.md');
  const start='<!-- build-version:start -->',end='<!-- build-version:end -->';
  const current=fs.readFileSync(p,'utf8');
  if(!current.includes(start)||!current.includes(end)) throw new Error('README build-version markers are missing');
  const block=start+'\n**V'+meta.version+' — exam-time, offline-first OSCP/OSCP+ methodology and decision-support app.**\n'+end;
  const next=current.replace(/<!-- build-version:start -->[\s\S]*?<!-- build-version:end -->/,block);
  if(next!==current)fs.writeFileSync(p,next);
}
syncReadmeVersion();

let html=read('src/index.template.html');
html=html.replace(/\/\* @inject:style:([^*]+?) \*\//g,(_,f)=>read('src/styles/'+f.trim()));
html=html.replace(/\/\* @inject:script:([^*]+?) \*\//g,(_,f)=>read('src/js/'+f.trim()));
// Small late-bound modules can extend the generated exam artifact without enlarging the already-large template.
const lateScripts=['22-reference-find.js','23-v34-passer-loop.js','24-tooling-2026.js','25-v35-reliability-safety.js','26-v35-import-safety.js'];
const lateHtml=lateScripts.map(f=>'<script>'+read('src/js/'+f).replace(/<\/script/gi,'<\\/script')+'</script>').join('\n');
html=html.replace('</body>',lateHtml+'\n</body>');
const manifest=JSON.parse(read('src/content/manifest.json'));
const referenceHtml=manifest.files.map(f=>read('src/content/'+f)).join('');
// Keep reference inert during parser boot without relying on optional browser decompression APIs.
// A raw-text <script> element only needs literal closing-script terminators neutralized.
// The previous blanket form replace(/</g,'\\u003c') inflated every HTML tag in the embedded reference.
const referencePayload=JSON.stringify(referenceHtml).replace(/<\/script/gi,'\\u003c/script');
html=html.replace('<!-- @inject:reference-payload -->',()=>referencePayload);

html=html
  .replaceAll('__OSCP_VERSION__',meta.version)
  .replaceAll('__OSCP_VERSION_LABEL__',meta.label)
  .replaceAll('__OSCP_BUILD_DATE__',meta.date);

const unresolved=[...new Set([
  ...(html.match(/@inject:[^<\\n]*/g)||[]),
  ...(html.match(/__(?:OSCP_VERSION|OSCP_VERSION_LABEL|OSCP_BUILD_DATE)__/g)||[])
])];
if(unresolved.length) throw new Error('Unresolved build marker(s): '+unresolved.join(' | '));
fs.writeFileSync(path.join(root,'index.html'),html);
const bytes=Buffer.byteLength(html);
const softHeadroom=quality.artifactSoftLimitBytes-bytes;
const hardHeadroom=quality.artifactHardLimitBytes-bytes;
console.log('Built index.html ('+bytes.toLocaleString()+' bytes)');
if(softHeadroom<0)console.warn('Artifact size warning: '+bytes.toLocaleString()+' bytes exceeds soft budget '+quality.artifactSoftLimitBytes.toLocaleString()+' by '+Math.abs(softHeadroom).toLocaleString()+' bytes.');
else console.log('Artifact soft-limit headroom: '+softHeadroom.toLocaleString()+' bytes');
console.log('Artifact hard-limit headroom: '+Math.max(0,hardHeadroom).toLocaleString()+' bytes');
console.log('SHA-256 '+createHash('sha256').update(html).digest('hex'));
