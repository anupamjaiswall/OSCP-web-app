import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const p=x=>path.join(root,x);
const read=x=>fs.readFileSync(p(x),'utf8');
const write=(x,s)=>fs.writeFileSync(p(x),s);
const must=(v,m)=>{if(!v)throw new Error(m)};
const replaceOnce=(src,from,to,label)=>{const i=src.indexOf(from);must(i>=0,'missing '+label);must(src.indexOf(from,i+from.length)<0,'duplicate '+label);return src.slice(0,i)+to+src.slice(i+from.length)};

const helperNames=['safeStoredJSON','safeStoredArray','safeStoredRecord','safeStoreSet','safeStoreGet','safeStoreRemove'];
let core=read('src/js/03-core-app.js');
let storage=read('src/js/01-storage-guard.js');
const oldCoreBytes=Buffer.byteLength(core);
const startMarker='/* Boot-resilience: one malformed localStorage value must never white-screen the exam console. */';
const endMarker='const defaultSettings=';
const start=core.indexOf(startMarker),end=start>=0?core.indexOf(endMarker,start):-1;
if(start<0){
 for(const name of helperNames){must(storage.includes('function '+name+'('),'already-extracted storage guard missing '+name);must(!core.includes('function '+name+'('),'already-extracted legacy core still owns '+name)}
 console.log('V34.54 storage extraction is already present; migration is a no-op.');
 process.exit(0);
}
must(end>start,'storage helper seam end not found in legacy core');
must(core.indexOf(startMarker,start+1)<0,'storage helper seam is duplicated in legacy core');
const extracted=core.slice(start,end);
for(const name of helperNames)must(extracted.includes('function '+name+'('),'extraction block missing '+name);
core=core.slice(0,start)+core.slice(end);
const newCoreBytes=Buffer.byteLength(core),freed=oldCoreBytes-newCoreBytes;
must(newCoreBytes<oldCoreBytes&&freed>1500,'core extraction did not create meaningful headroom');
for(const name of helperNames)must(!core.includes('function '+name+'('),'legacy core still owns '+name);

const oldHeader=`/* V34.13: parser-safe storage guard.\n   Do not synchronously write to browser storage while the HTML parser is blocked.\n   Core state helpers already catch read/write failures; this layer only installs\n   an in-memory fallback when the storage object itself is unavailable. */`;
const newHeader=`/* V34.54: parser-safe storage and saved-state guard.\n   Installs an in-memory localStorage fallback before core boot, then owns the\n   defensive JSON/shape/read/write helpers consumed by the legacy core and later\n   modules. Keep this module ahead of 03-core-app.js in the template. */`;
must(storage.includes(oldHeader),'storage guard header drifted');
storage=storage.replace(oldHeader,newHeader).trimEnd()+'\n\n'+extracted.trim()+'\n';
for(const name of helperNames)must(storage.includes('function '+name+'('),'storage guard did not receive '+name);
write('src/js/03-core-app.js',core);
write('src/js/01-storage-guard.js',storage);

const storageTest=`import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'src/js/01-storage-guard.js'),'utf8');
let passed=0;
const ok=(v,m='assertion failed')=>{if(!v)throw new Error(m)};
const eq=(a,b,m='values differ')=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Error(m+': '+JSON.stringify(a)+' != '+JSON.stringify(b))};
function test(name,fn){fn();passed++;console.log('✓ '+name)}
function storage(seed={}){const mem=new Map(Object.entries(seed));return{getItem:k=>mem.has(String(k))?mem.get(String(k)):null,setItem:(k,v)=>mem.set(String(k),String(v)),removeItem:k=>mem.delete(String(k)),clear:()=>mem.clear(),key:i=>Array.from(mem.keys())[i]??null,get length(){return mem.size},mem}}
function load(local){const sandbox={localStorage:local,document:{getElementById:()=>null},console:{warn(){},error(){}},setTimeout:fn=>{fn();return 1},clearTimeout(){}};sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(source,sandbox);return sandbox}

test('storage guard parses valid JSON',()=>{const s=load(storage({good:'{"x":1}'}));eq(s.safeStoredJSON('good',{}),{x:1})});
test('storage guard recovers malformed JSON',()=>{const s=load(storage({bad:'{not json'}));eq(s.safeStoredJSON('bad',{safe:true}),{safe:true});ok(s.__OSCP_CORRUPT_STORAGE__.includes('bad'))});
test('storage guard rejects wrong array/object shapes',()=>{const s=load(storage({arr:'{}',obj:'[]'}));eq(s.safeStoredArray('arr'),[]);eq(s.safeStoredRecord('obj',{safe:true}),{safe:true});ok(s.__OSCP_CORRUPT_STORAGE__.includes('arr:shape'));ok(s.__OSCP_CORRUPT_STORAGE__.includes('obj:shape'))});
test('storage guard read/write/remove helpers preserve normal behavior',()=>{const st=storage(),s=load(st);ok(s.safeStoreSet('k','v'));eq(s.safeStoreGet('k','x'),'v');ok(s.safeStoreRemove('k'));eq(s.safeStoreGet('k','fallback'),'fallback')});
test('storage guard fails closed on quota/read errors',()=>{const broken={getItem(){throw new Error('read blocked')},setItem(){throw new Error('quota')},removeItem(){throw new Error('remove blocked')},key(){return null},get length(){return 0}};const s=load(broken);eq(s.safeStoreGet('k','fallback'),'fallback');ok(s.__OSCP_CORRUPT_STORAGE__.includes('k:unavailable'));ok(s.safeStoreSet('k','v')===false);ok(s.safeStoreRemove('k')===false)});
test('storage guard installs in-memory fallback when localStorage object is unavailable',()=>{const sandbox={document:{getElementById:()=>null},console:{warn(){},error(){}},setTimeout:fn=>{fn();return 1},clearTimeout(){}};Object.defineProperty(sandbox,'localStorage',{configurable:true,get(){throw new Error('storage unavailable')}});sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(source,sandbox);ok(sandbox.__OSCP_STORAGE_PERSISTENT__===false);ok(sandbox.safeStoreSet('fallback','works'));eq(sandbox.safeStoreGet('fallback',''),'works')});
console.log('Storage guard behavior tests passed: '+passed);
`;
write('tests/storage-guard.mjs',storageTest);

let pkg=JSON.parse(read('package.json'));
pkg.version='34.54.0';
if(!pkg.scripts.test.includes('node tests/storage-guard.mjs'))pkg.scripts.test=pkg.scripts.test.replace('node tests/run-tests.mjs','node tests/run-tests.mjs && node tests/storage-guard.mjs');
write('package.json',JSON.stringify(pkg,null,2)+'\n');

const build=JSON.parse(read('src/meta/build.json'));build.version='34.54.0';build.label='V34';build.date='2026-10-04';write('src/meta/build.json',JSON.stringify(build,null,2)+'\n');
const quality=JSON.parse(read('src/meta/quality.json'));must(quality.maxCoreAppBytes===oldCoreBytes,'quality core ratchet drifted before extraction');quality.maxCoreAppBytes=newCoreBytes;write('src/meta/quality.json',JSON.stringify(quality,null,2)+'\n');

let hygiene=read('scripts/source-hygiene.mjs');
const hygieneMarker="const template=read('src/index.template.html');\n";
const hygieneInsert=`const storageLayer=read('src/js/01-storage-guard.js'),legacyCore=read('src/js/03-core-app.js');\nconst storageHelpers=['safeStoredJSON','safeStoredArray','safeStoredRecord','safeStoreSet','safeStoreGet','safeStoreRemove'];\nfor(const name of storageHelpers){if(!storageLayer.includes('function '+name+'('))throw new Error('Storage guard missing extracted helper: '+name);if(legacyCore.includes('function '+name+'('))throw new Error('Legacy core reabsorbed extracted storage helper: '+name)}\nif(template.indexOf('@inject:script:01-storage-guard.js')<0||template.indexOf('@inject:script:03-core-app.js')<0||template.indexOf('@inject:script:01-storage-guard.js')>template.indexOf('@inject:script:03-core-app.js'))throw new Error('Storage guard must execute before the legacy core');\n`;
if(!hygiene.includes('Legacy core reabsorbed extracted storage helper'))hygiene=replaceOnce(hygiene,hygieneMarker,hygieneMarker+hygieneInsert,'source-hygiene template marker');
write('scripts/source-hygiene.mjs',hygiene);

let tests=read('tests/run-tests.mjs');
const testMarker="test('escapeHtml'";
const testAt=tests.indexOf(testMarker);must(testAt>=0,'run-tests insertion marker missing');
if(!tests.includes('storage guard owns defensive persistence helpers before legacy core')){
 const testInsert=`test('storage guard owns defensive persistence helpers before legacy core',()=>{const guard=read('src/js/01-storage-guard.js'),core=read('src/js/03-core-app.js'),tpl=read('src/index.template.html');for(const name of ['safeStoredJSON','safeStoredArray','safeStoredRecord','safeStoreSet','safeStoreGet','safeStoreRemove']){ok(guard.includes('function '+name+'('),name+' missing from storage guard');ok(!core.includes('function '+name+'('),name+' leaked back into legacy core')}ok(tpl.indexOf('@inject:script:01-storage-guard.js')<tpl.indexOf('@inject:script:03-core-app.js'),'storage guard must load before core')});\n`;
 tests=tests.slice(0,testAt)+testInsert+tests.slice(testAt);
}
write('tests/run-tests.mjs',tests);

let roadmap=read('ROADMAP.md');
const oldRoad='- **Legacy core extraction — blocking before further core growth:** `03-core-app.js` is intentionally pinned at its downward-only byte ratchet. Do not raise the cap. Before any feature needs more legacy core, extract a characterized DOM-free seam (state/storage helpers, import/export validation or scoring) into a dedicated module and ratchet the core limit down again.';
const newRoad='- **Legacy core reduction:** V34.54 extracted the defensive storage/state helper seam into the parser-first storage guard and lowered the byte ratchet. Keep the cap downward-only; future legacy changes should prefer another characterized extraction over regrowth.';
must(roadmap.includes(oldRoad),'roadmap core-extraction item drifted');roadmap=roadmap.replace(oldRoad,newRoad);write('ROADMAP.md',roadmap);

let changelog=read('CHANGELOG.md');
const entry=`## V34.54.0 — 2026-10-04\n\n### Legacy core storage extraction\n- Moved defensive saved-state parsing and storage helpers (safeStoredJSON/Array/Record and safeStoreSet/Get/Remove) out of \`03-core-app.js\` into the parser-first \`01-storage-guard.js\` module without changing the storage namespace or session schema.\n- Lowered the legacy-core byte ratchet from ${oldCoreBytes.toLocaleString('en-US')} to ${newCoreBytes.toLocaleString('en-US')} bytes, creating ${freed.toLocaleString('en-US')} bytes of real headroom instead of raising the cap.\n- Added isolated behavior tests for malformed JSON, wrong-shaped state, normal persistence, read/write/remove failures and the in-memory storage fallback.\n- Added source-hygiene and unit ownership guards that require the storage layer to load before the core and prevent the extracted helpers from drifting back into \`03-core-app.js\`.\n- Kept the generated app single-file/offline-first; no runtime network dependency, schema migration or new operating mode was introduced.\n\n`;
if(!changelog.includes('## V34.54.0'))changelog=replaceOnce(changelog,'# Changelog\n\n','# Changelog\n\n'+entry,'changelog header');write('CHANGELOG.md',changelog);

console.log(`V34.54 extraction prepared: core ${oldCoreBytes} -> ${newCoreBytes} bytes (${freed} bytes extracted)`);
