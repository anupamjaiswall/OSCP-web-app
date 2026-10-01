import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync(new URL('../src/js/00-service-router-core.js',import.meta.url),'utf8');
const context={globalThis:{}};
context.globalThis.globalThis=context.globalThis;
vm.runInNewContext(src,context.globalThis,{filename:'00-service-router-core.js'});
const core=context.globalThis.OSCP_SERVICE_CORE;
assert.ok(core,'service core should initialize without a DOM');
assert.equal(typeof core.contextActions,'function');
assert.equal(typeof core.inferPlatform,'function');
assert.equal(typeof core.targetStage,'function');

const empty=core.contextActions({stage:'enumeration',ports:[]});
assert.equal(empty[0].id,'scan-full','empty enumeration target should prioritize structured discovery');
assert.equal(empty[0].rank,1);

const mixed=core.contextActions({stage:'enumeration',ports:[
  {port:80,proto:'tcp',state:'open',service:'http'},
  {port:445,proto:'tcp',state:'open',service:'microsoft-ds'}
]});
assert.ok(mixed.some(x=>x.id==='service-http-s'),'web service should surface');
assert.ok(mixed.some(x=>x.id==='service-rpc-smb'),'SMB service should surface');
assert.ok(mixed.some(x=>x.id==='cross-service'),'web + share surface should trigger correlation');
assert.ok(mixed.length<=5,'advisor must stay deliberately small');
assert.equal(new Set(mixed.map(x=>x.id)).size,mixed.length,'advisor actions must be unique');

const ad=core.contextActions({role:'domain controller',stage:'enumeration',ports:[
  {port:88,proto:'tcp',state:'open',service:'kerberos'},
  {port:389,proto:'tcp',state:'open',service:'ldap'},
  {port:445,proto:'tcp',state:'open',service:'microsoft-ds'}
]});
assert.equal(ad[0].id,'ad-context','AD targets should prove context before tool swapping');
assert.ok(ad.some(x=>x.id==='ad-identity'),'AD identity path should be explicit');
assert.equal(core.inferPlatform({role:'domain controller',ports:[{port:445,proto:'tcp',state:'open'}]}),'windows');

const shell=core.contextActions({stage:'foothold',ports:[{port:445,proto:'tcp',state:'open'}]});
assert.equal(shell[0].id,'bank-local','post-shell flow should protect local evidence first');
assert.ok(shell.some(x=>x.id==='privesc-windows'),'Windows shell should route to Windows privilege escalation');
assert.equal(core.targetStage({stage:'foothold'}),'post-shell');

const privileged=core.contextActions({stage:'SYSTEM',ports:[{port:445,proto:'tcp',state:'open'}]});
assert.equal(privileged[0].id,'bank-proof','privileged shell should protect proof first');
assert.ok(privileged.some(x=>x.id==='repro-path'),'privileged closure should preserve reproducibility');
assert.equal(core.targetStage({stage:'SYSTEM'}),'privileged');

assert.equal(core.inferPlatform({stage:'enumeration',ports:[{port:22,proto:'tcp',state:'open'},{port:2049,proto:'tcp',state:'open'}]}),'linux');
console.log('context-actions tests passed');
