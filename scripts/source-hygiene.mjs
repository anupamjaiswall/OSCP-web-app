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
console.log(`Source hygiene passed: ${files.length} JS modules; transactional imports have one owner; schema version has one source.`);
