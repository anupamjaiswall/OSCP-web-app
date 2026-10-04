import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const build=fs.readFileSync(path.join(root,'scripts/build.mjs'),'utf8');
const assert=(v,m)=>{if(!v)throw new Error(m)};

assert(build.includes("replace(/<\\/script/gi,'\\\\u003c/script')"),'reference payload must escape only raw-text closing-script terminators');
assert(!/^const referencePayload=.*replace\(\/<\/g/m.test(build),'reference payload must not blanket-escape every < character');
assert(build.includes('Artifact soft-limit headroom:'),'build must report remaining soft-limit headroom');
assert(build.includes('Artifact hard-limit headroom:'),'build must report remaining hard-limit headroom');
assert(build.includes("replace('<!-- @inject:reference-payload -->',()=>referencePayload)"),'reference payload injection contract changed');

console.log('build payload tests passed');
