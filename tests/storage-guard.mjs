import fs from 'node:fs';
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
