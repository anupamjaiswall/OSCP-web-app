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

assert.ok(core.READINESS_GROUPS.length>=12,'readiness should cover the exam-critical jobs');
assert.ok(core.READINESS_GROUPS.every(x=>x.job&&x.level&&Array.isArray(x.any)&&x.any.length&&x.why),'every readiness group needs alternatives and rationale');
assert.equal(new Set(core.READINESS_GROUPS.map(x=>x.job)).size,core.READINESS_GROUPS.length,'readiness jobs must be unique');
assert.ok(core.INVENTORY_COMMANDS.includes('nmap'));
assert.ok(core.INVENTORY_COMMANDS.includes('nxc'));
assert.ok(core.INVENTORY_COMMANDS.includes('impacket-GetNPUsers'));

const unknown=core.readinessFromPreflight(null);
assert.equal(unknown.known,false);
assert.equal(unknown.mustReady,0);

const readyTools=core.READINESS_GROUPS.map(x=>({tool:x.any[0],present:true,path:'/usr/bin/'+x.any[0],priority:x.level==='must'?'core':'optional'}));
const ready=core.readinessFromPreflight({generated:'test',tools:readyTools});
assert.equal(ready.known,true);
assert.equal(ready.mustReady,ready.mustTotal,'one valid implementation per must-have job should satisfy readiness');
assert.equal(ready.recommendedReady,ready.recommendedTotal);

const withoutNmap=core.readinessFromPreflight({tools:readyTools.filter(x=>x.tool!=='nmap')});
assert.equal(withoutNmap.mustReady,withoutNmap.mustTotal-1,'missing nmap should create exactly one must-have gap in the complete fixture');
assert.equal(withoutNmap.rows.find(x=>x.job==='Port discovery')?.ok,false);

const aliasReady=core.readinessFromPreflight({tools:[{tool:'netexec',present:true,path:'/usr/bin/netexec'}]});
assert.equal(aliasReady.rows.find(x=>x.job==='SMB / AD auth')?.ok,true,'NetExec alias should satisfy SMB/AD auth readiness');

const inventory=core.inventoryScript();
assert.match(inventory,/oscp-tool-preflight\.json/);
assert.match(inventory,/shutil\.which/);
assert.match(inventory,/python3 - <<'PY'/);
assert.doesNotMatch(inventory,/\b(?:apt(?:-get)?|pip(?:3)?|wget)\b/,'readiness script must not install/download anything');
assert.doesNotMatch(inventory,/https?:\/\//,'readiness script must not make network requests');
console.log('tooling-2026 tests passed');
