import fs from 'node:fs';
import vm from 'node:vm';

const src=fs.readFileSync(new URL('../src/js/26-v35-import-safety.js',import.meta.url),'utf8');
const sandbox={console,TextEncoder,globalThis:{}};vm.createContext(sandbox);vm.runInContext(src,sandbox);const c=sandbox.globalThis.OSCP_IMPORT_SAFETY_CORE||sandbox.OSCP_IMPORT_SAFETY_CORE;if(!c)throw new Error('import safety core did not initialize');
const ok=(v,m)=>{if(!v)throw new Error(m)};
const target={id:'fixture_a',ip:'10.10.10.10',host:'fixture',role:'linux',status:{},next:['','',''],notes:''};
for(const version of [1,9,16,19]){const r=c.parseBackupText(JSON.stringify({app:'OSCP-V'+version,version,targets:[target],activeTargetId:'fixture_a'}));ok(r.ok,`schema ${version} should be accepted by envelope inspector: ${r.issues?.join('; ')}`)}
let r=c.parseBackupText('{"targets":[');ok(!r.ok&&r.code==='json','truncated JSON should fail parsing');
r=c.parseBackupText(JSON.stringify({version:16,targets:{}}));ok(!r.ok&&r.code==='schema','wrong-shaped targets should fail schema inspection');
r=c.parseBackupText(JSON.stringify({version:20,targets:[target]}));ok(!r.ok&&r.issues.some(x=>x.includes('newer than supported')),'future schema should be rejected');
r=c.parseBackupText(JSON.stringify({version:16,targets:[target,target]}));ok(!r.ok&&r.issues.some(x=>x.includes('duplicate target IDs')),'duplicate target IDs should fail');
r=c.parseBackupText(JSON.stringify({version:16,targets:[target]}),32);ok(!r.ok&&r.code==='oversized','oversized backup text should be rejected before parse');
let applied=false,rolled=false;
let tx=await c.transactionalApply({x:1},{capture:()=>({old:1}),snapshot:()=>true,apply:()=>{applied=true},rollback:()=>{rolled=true}});ok(tx.ok&&applied&&!rolled,'successful transaction should not rollback');
applied=false;rolled=false;tx=await c.transactionalApply({x:1},{capture:()=>({old:1}),snapshot:()=>true,apply:()=>{applied=true;throw new Error('forced apply failure')},rollback:before=>{ok(before.old===1,'rollback should receive captured state');rolled=true}});ok(!tx.ok&&tx.rolledBack&&applied&&rolled,'failed apply should automatically rollback');
let snapshotBlocked=false;try{await c.transactionalApply({},{capture:()=>({}),snapshot:()=>false,apply:()=>{throw new Error('must not run')},rollback:()=>{}})}catch(e){snapshotBlocked=/snapshot failed/i.test(e.message)}ok(snapshotBlocked,'failed pre-restore snapshot should block mutation');
let combined=false;try{await c.transactionalApply({},{capture:()=>({}),snapshot:()=>true,apply:()=>{throw new Error('apply')},rollback:()=>{throw new Error('rollback')}})}catch(e){combined=/automatic rollback also failed/i.test(e.message)}ok(combined,'rollback failure should surface a combined recovery error');
console.log('import-safety tests passed');
