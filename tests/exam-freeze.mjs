import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('src/js/27-exam-freeze.js');
let passed=0;
const ok=(v,m='assertion failed')=>{if(!v)throw new Error(m)};
const eq=(a,b,m='values differ')=>{if(a!==b)throw new Error(`${m}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`)};
async function test(name,fn){await fn();passed++;console.log('✓ '+name)}
function load(base){const sandbox={decryptPayload:base};vm.createContext(sandbox);vm.runInContext(source,sandbox);return sandbox}

await test('AES-GCM auth failure becomes an actionable backup message',async()=>{
 const subtle=globalThis.crypto.subtle;
 const key=await subtle.generateKey({name:'AES-GCM',length:128},true,['encrypt','decrypt']);
 const wrong=await subtle.generateKey({name:'AES-GCM',length:128},true,['encrypt','decrypt']);
 const iv=globalThis.crypto.getRandomValues(new Uint8Array(12));
 const cipher=await subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode('oscp-backup-probe'));
 const s=load(async()=>subtle.decrypt({name:'AES-GCM',iv},wrong,cipher));
 let err;try{await s.decryptPayload({},'wrong')}catch(e){err=e}
 ok(err,'wrong-key decrypt should fail');
 eq(err.message,'Wrong passphrase or corrupted backup file.');
});

await test('non-auth decrypt errors keep their useful message',async()=>{
 const marker=new Error('Malformed encrypted backup container');
 const s=load(async()=>{throw marker});
 let err;try{await s.decryptPayload({},'x')}catch(e){err=e}
 eq(err?.message,'Malformed encrypted backup container');
});

await test('exam-freeze patch is built after the legacy decrypt/UI layer',async()=>{
 const build=read('scripts/build.mjs'),core=read('src/js/03-core-app.js');
 ok(build.includes("'27-exam-freeze.js'"),'exam-freeze module missing from late build');
 ok(core.includes("$('#v15RunBackupTest').onclick=async"),'backup-test UI handler missing');
 ok(core.includes('esc(e.message)'),'backup-test UI no longer displays thrown decrypt reason');
});

console.log('Exam-freeze regressions passed: '+passed);
