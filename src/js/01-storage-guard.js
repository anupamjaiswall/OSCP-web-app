/* V34.13: parser-safe storage guard.
   Do not synchronously write to browser storage while the HTML parser is blocked.
   Core state helpers already catch read/write failures; this layer only installs
   an in-memory fallback when the storage object itself is unavailable. */
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
