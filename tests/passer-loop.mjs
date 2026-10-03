import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync(new URL('../src/js/23-v34-passer-loop.js',import.meta.url),'utf8');
const context={globalThis:{}};
context.globalThis.globalThis=context.globalThis;
vm.runInNewContext(src,context.globalThis,{filename:'23-v34-passer-loop.js'});
const core=context.globalThis.OSCP_PASSER_CORE;
assert.ok(core,'passer loop core should initialize without DOM');
assert.equal(typeof core.resetChecklist,'function');
assert.equal(typeof core.openingStatus,'function');

const empty=core.openingStatus([]);
assert.equal(empty.total,0);
assert.equal(empty.mapReady,false);

const mapped=core.openingStatus([
 {status:{tcp:true},ports:[{port:80,state:'open'}]},
 {status:{tcp:true,foothold:true,local:true},ports:[{port:445,state:'open'}]}
]);
assert.equal(mapped.total,2);
assert.equal(mapped.tcp,2);
assert.equal(mapped.surfaced,2);
assert.equal(mapped.footholds,1);
assert.equal(mapped.banked,1);
assert.equal(mapped.mapReady,true);

const ad=core.resetChecklist({role:'dc',ports:[
 {port:88,state:'open',service:'kerberos'},
 {port:389,state:'open',service:'ldap'},
 {port:445,state:'open',service:'microsoft-ds'}
],creds:'CORP\\alice : secret'});
assert.ok(ad.some(x=>x.id==='ad-context'),'AD target should get AD restart loop');
assert.ok(ad.some(x=>x.id==='cred-fanout'),'credentialed target should get fan-out reset');
assert.ok(ad.some(x=>x.id==='inside-service'),'SMB/authenticated surface should get inside-service enumeration');
assert.equal(new Set(ad.map(x=>x.id)).size,ad.length,'reset actions must be unique');
assert.ok(ad.length<=core.MAX_RESET_ITEMS,'reset should stay bounded for exam-time readability');

const web=core.resetChecklist({role:'web',ports:[{port:443,state:'open',service:'https'}]});
assert.ok(web.some(x=>x.id==='web-depth'),'web target should get web depth pass');
assert.ok(web.some(x=>x.id==='all-services'),'all targets should re-touch every open service');

const linux=core.resetChecklist({role:'linux',status:{foothold:true},ports:[{port:22,state:'open'}]});
assert.ok(linux.some(x=>x.id==='linux-local'),'Linux foothold should get Linux local re-enumeration');

const windows=core.resetChecklist({role:'windows',status:{foothold:true,local:true},ports:[{port:445,state:'open'}]});
assert.equal(windows[0].id,'bank','earned evidence should be protected before reset work');
assert.ok(windows.some(x=>x.id==='win-local'),'Windows foothold should get Windows local re-enumeration');

const pivot=core.resetChecklist({role:'pivot',signals:['internal route via ligolo'],ports:[{port:445,state:'open'}]});
assert.ok(pivot.some(x=>x.id==='pivot-proof'),'pivot target should require route proof');
assert.equal(pivot.at(-1).id,'return-trigger','reset should end with a bounded rotate/return decision');

console.log('passer-loop tests passed');
