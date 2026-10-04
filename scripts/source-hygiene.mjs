import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const jsDir=path.join(root,'src/js'),files=fs.readdirSync(jsDir).filter(x=>x.endsWith('.js'));
const owner='26-v35-import-safety.js';
for(const file of files){
 const src=read('src/js/'+file);
 if(file!==owner&&/(?:importSession|importEncrypted|importTargets)[^\n]{0,120}\.onchange\s*=|\$\(['"]#(?:importSession|importEncrypted|importTargets)['"]\)\.onchange\s*=/.test(src))throw new Error(`${file} rebinds an import control; ${owner} must be the only owner`);
}
const guard=read('src/js/'+owner);
for(const marker of ['s.onchange=handleSessionImport','e.onchange=handleEncryptedImport','t.onchange=handleTargetImport',"$('importSession')?.onchange===handleSessionImport","$('importEncrypted')?.onchange===handleEncryptedImport","$('importTargets')?.onchange===handleTargetImport"])if(!guard.includes(marker))throw new Error('Import handler ownership marker missing: '+marker);
const build=read('src/js/00-build-meta.js');if(!build.includes('const SESSION_SCHEMA_VERSION=window.OSCP_BUILD.sessionSchema'))throw new Error('Central SESSION_SCHEMA_VERSION is missing from build metadata');
for(const file of ['src/js/03-core-app.js','src/js/06-handoff-access-truth.js']){const src=read(file);for(const bad of ['version:19','o.version=19','supported schema 19','o.version=16;o.ruleSnapshot=V16_RULE_VERIFIED'])if(src.includes(bad))throw new Error(`${file} still contains current-schema literal: ${bad}`)}
if(/const\s+SESSION_SCHEMA_VERSION\s*=/.test(guard))throw new Error('Import safety must consume the central SESSION_SCHEMA_VERSION, not redeclare it');

// Numeric prefixes are startup/dependency bands. Equal non-zero bands are allowed only
// when the exact tie and its authoritative template order are deliberately declared here.
const template=read('src/index.template.html');
function enforceBands(dir,ext,allowedTies){
 const names=fs.readdirSync(path.join(root,dir)).filter(x=>x.endsWith(ext)&&/^\d{2}-/.test(x));
 const groups=new Map();
 for(const name of names){const p=name.slice(0,2);if(!groups.has(p))groups.set(p,[]);groups.get(p).push(name)}
 for(const [prefix,group] of groups){
  if(prefix==='00'||group.length<2)continue;
  const expected=allowedTies[prefix];
  if(!expected||group.length!==expected.length||group.some(x=>!expected.includes(x)))throw new Error(`${dir} has undeclared tied prefix ${prefix}: ${group.sort().join(', ')}`);
  let previous=-1;
  for(const name of expected){const marker=`@inject:${ext==='.js'?'script':'style'}:${name}`;const at=template.indexOf(marker);if(at<0)throw new Error(`Declared tied-band file is not injected by the template: ${name}`);if(at<=previous)throw new Error(`Tied prefix ${prefix} order drifted; expected ${expected.join(' -> ')}`);previous=at}
 }
}
enforceBands('src/js','.js',{'19':['19-v34-runtime-diagnostics.js','19-v33-exam-integration.js']});
enforceBands('src/styles','.css',{'13':['13-v34-runtime-diagnostics.css','13-v33-exam-integration.css']});

const workflow=read('.github/workflows/ci.yml');
if(workflow.includes('Finalize V34.51 source-coupled test migration'))throw new Error('Obsolete V34.51 CI migration shim returned');

console.log(`Source hygiene passed: ${files.length} JS modules; transactional imports have one owner; schema version has one source; tied startup bands are explicit.`);
