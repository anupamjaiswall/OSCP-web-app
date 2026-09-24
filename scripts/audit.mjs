import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=m=>{throw new Error(m)};

const jsFiles=fs.readdirSync(path.join(root,'src/js')).filter(x=>x.endsWith('.js')).sort();
for(const file of jsFiles){
  const source=read('src/js/'+file);
  try{new vm.Script(source,{filename:file})}
  catch(e){fail('JavaScript syntax error in '+file+': '+e.message)}
  if(/\beval\s*\(/.test(source)||/\bnew\s+Function\s*\(/.test(source))fail('Dynamic code execution primitive found in '+file);
  const unsafeDom=[
    [/\.insertAdjacentHTML\s*\(/,'insertAdjacentHTML'],
    [/\.outerHTML\s*=/,'outerHTML assignment'],
    [/\bdocument\.write(?:ln)?\s*\(/,'document.write'],
    [/\.srcdoc\s*=/,'srcdoc assignment'],
    [/\.setAttribute\s*\(\s*['"]on[a-z]+['"]/i,'inline event-handler attribute'],
    [/['"]javascript\s*:/i,'javascript: URL']
  ];
  for(const [pattern,label] of unsafeDom)if(pattern.test(source))fail('Unsafe DOM primitive ('+label+') found in '+file);
}

const core=read('src/js/00-service-router-core.js');
if(/\bdocument\b|\blocalStorage\b/.test(core)) fail('Service Router core must stay DOM/storage independent');

const manifest=JSON.parse(read('src/content/manifest.json'));
for(const file of manifest.files){
  const s=read('src/content/'+file);
  if(/<script\b|<style\b/i.test(s)) fail('Executable/style tag found in content fragment '+file);
  if(/&lt;\/?details&gt;|```/.test(s)) fail('Markdown/HTML conversion debris found in content fragment '+file);
  for(const tag of ['details','pre','code']){
    const open=(s.match(new RegExp('<'+tag+'\\b','gi'))||[]).length;
    const close=(s.match(new RegExp('</'+tag+'>','gi'))||[]).length;
    if(open!==close) fail(file+' has unbalanced <'+tag+'> tags: '+open+' open / '+close+' close');
  }
}
console.log('Audit passed: '+jsFiles.length+' JS modules syntax-checked; '+manifest.files.length+' content fragments structurally checked');
