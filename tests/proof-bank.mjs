import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync(new URL('../src/js/11-exam-bank.js',import.meta.url),'utf8');
const context={globalThis:{}};
context.globalThis.globalThis=context.globalThis;
vm.runInNewContext(src,context.globalThis,{filename:'11-exam-bank.js'});
const core=context.globalThis.OSCP_PROOF_BANK_CORE;
assert.ok(core,'proof-bank core should initialize without a DOM');
assert.equal(core.ITEMS.length,5,'proof closure checklist should retain five explicit gates');
assert.match(core.COMMANDS.linux,/ip addr; cat \/absolute\/path\/to\/local-or-proof\.txt/);
assert.match(core.COMMANDS.windows,/ipconfig & type C:\\absolute\\path\\to\\local-or-proof\.txt/);
assert.deepEqual({...core.closureStatus([true,false,true,false,false])},{checked:2,total:5,complete:false});
assert.deepEqual({...core.closureStatus([true,true,true,true,true])},{checked:5,total:5,complete:true});
console.log('proof-bank tests passed');
