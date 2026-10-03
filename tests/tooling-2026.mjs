import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync(new URL('../src/js/24-tooling-2026.js',import.meta.url),'utf8');
const context={globalThis:{}};context.globalThis.globalThis=context.globalThis;
vm.runInNewContext(src,context.globalThis,{filename:'24-tooling-2026.js'});
const core=context.globalThis.OSCP_TOOLING_2026_CORE;
assert.ok(core,'tooling core should initialize without a DOM');
assert.equal(core.ADDITIONS.length,4,'tooling review should stay deliberately small');
assert.equal(new Set(core.ADDITIONS.map(x=>x.id)).size,core.ADDITIONS.length,'tool additions must be unique');
assert.ok(core.ADDITIONS.every(x=>x.name&&x.category&&x.tier&&x.trigger&&x.command&&x.fallback&&x.rule),'every added tool needs decision fields');

const penelope=core.ADDITIONS.find(x=>x.id==='penelope');
assert.ok(penelope,'Penelope should be present');
assert.match(penelope.command,/\s-O\b/,'Penelope default must use OSCP-safe mode');
assert.doesNotMatch(penelope.command,/--mcp|traitor|meterpreter/i,'Penelope default must not enable risky extras');

const rusthound=core.ADDITIONS.find(x=>x.id==='rusthound-ce');
assert.ok(rusthound,'RustHound-CE should be present as a collector fallback');
assert.match(rusthound.command,/rusthound-ce\s+-d\s+\$DOMAIN/);
assert.match(rusthound.command,/-z\b/);

const smbng=core.ADDITIONS.find(x=>x.id==='smbclient-ng');
assert.ok(smbng,'smbclient-ng should be present');
assert.match(smbng.rule,/verify local -h/i,'packaging drift must be explicit');

const rustscan=core.ADDITIONS.find(x=>x.id==='rustscan');
assert.ok(rustscan,'RustScan should be available only as a conditional discovery accelerator');
assert.equal(rustscan.tier,'conditional');
assert.match(rustscan.rule,/Nmap/i);

assert.equal(core.ADDITIONS.some(x=>x.id==='nuclei'),false,'Nuclei must not be promoted into the default tooling additions');
assert.ok(core.LADDERS.length>=10,'tooling ladder should cover the major exam phases');
assert.match(core.LADDERS.find(x=>x.phase==='AD graph')?.fallback||'',/RustHound-CE/);
assert.match(core.LADDERS.find(x=>x.phase==='Windows privesc')?.primary||'',/PrivescCheck/);
assert.match(core.LADDERS.find(x=>x.phase==='Pivoting')?.primary||'',/Ligolo-ng/);
assert.ok(core.DEFAULT_IDS.includes('penelope'));
assert.ok(core.DEFAULT_IDS.length<=20,'default stack should stay cognitively small');
assert.equal(core.decision().step,'stay');
assert.equal(core.decision('timeout',false).step,'validate');
assert.equal(core.decision('unsupported auth',true).step,'fallback');
console.log('tooling-2026 tests passed');
