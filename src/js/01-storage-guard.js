/* V34.54: parser-safe storage and saved-state guard.
   Installs an in-memory localStorage fallback before core boot, then owns the
   defensive JSON/shape/read/write helpers consumed by the legacy core and later
   modules. Keep this module ahead of 03-core-app.js in the template. */
(function(){
  let storage=null;
  try{storage=window.localStorage;}catch(_){}
  if(storage){
    window.__OSCP_STORAGE_PERSISTENT__=true;
    return;
  }
  const mem=new Map();
  const fallback={
    getItem:k=>mem.has(String(k))?mem.get(String(k)):null,
    setItem:(k,v)=>{mem.set(String(k),String(v));},
    removeItem:k=>{mem.delete(String(k));},
    clear:()=>mem.clear(),
    key:i=>Array.from(mem.keys())[i]??null,
    get length(){return mem.size;}
  };
  try{Object.defineProperty(window,'localStorage',{value:fallback,configurable:true});}catch(_){}
  window.__OSCP_STORAGE_PERSISTENT__=false;
})();

/* Boot-resilience: one malformed localStorage value must never white-screen the exam console. */
window.__OSCP_CORRUPT_STORAGE__=window.__OSCP_CORRUPT_STORAGE__||[];
function safeStoredJSON(key,fallback){
 try{
  const raw=localStorage.getItem(key);
  if(raw===null||raw==='')return fallback;
  return JSON.parse(raw);
 }catch(e){
  window.__OSCP_CORRUPT_STORAGE__.push(key);
  console.warn('[OSCP] Ignoring malformed saved state:',key,e);
  return fallback;
 }
}
function safeStoredArray(key){
 const value=safeStoredJSON(key,[]);
 if(Array.isArray(value))return value;
 window.__OSCP_CORRUPT_STORAGE__.push(key+':shape');
 console.warn('[OSCP] Ignoring wrong-shaped saved array:',key);
 return [];
}
function safeStoredRecord(key,fallback={}){
 const value=safeStoredJSON(key,fallback);
 if(value&&typeof value==='object'&&!Array.isArray(value))return value;
 window.__OSCP_CORRUPT_STORAGE__.push(key+':shape');
 console.warn('[OSCP] Ignoring wrong-shaped saved object:',key);
 return fallback;
}
let __oscpStorageWriteWarned=false;
function safeStoreSet(key,value){
 try{localStorage.setItem(key,value);return true}catch(e){
  console.error('[OSCP] Browser storage write failed:',key,e);
  if(!__oscpStorageWriteWarned){__oscpStorageWriteWarned=true;setTimeout(()=>{if(typeof toast==='function')toast('Browser storage write failed — export an encrypted/session backup now; local state may not persist.');const sw=document.getElementById('v16StorageWarning');if(sw){sw.style.display='block';sw.innerHTML='<b>⚠ Browser storage write failed.</b><div class="tiny">Quota or browser storage restrictions prevented persistence. Export an encrypted/session backup now; current in-tab state may be newer than what is saved.</div>'}},0)}
  return false;
 }
}
function safeStoreGet(key,fallback=''){
 try{const v=localStorage.getItem(key);return v===null?fallback:v}catch(e){
  window.__OSCP_CORRUPT_STORAGE__.push(key+':unavailable');
  console.warn('[OSCP] Browser storage read failed:',key,e);return fallback;
 }
}
function safeStoreRemove(key){try{localStorage.removeItem(key);return true}catch(e){console.warn('[OSCP] Browser storage remove failed:',key,e);return false}}
