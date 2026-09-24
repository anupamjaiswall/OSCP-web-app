
/* V19 FIX: storage compatibility guard.
   Some browser/file contexts deny localStorage entirely. In that case keep the
   console functional with an in-memory Storage-compatible fallback for this tab. */
(function(){
  try{
    const k='__oscp_v16_storage_probe__';
    window.localStorage.setItem(k,'1'); window.localStorage.removeItem(k);
    window.__OSCP_STORAGE_PERSISTENT__=true;
  }catch(e){
    const mem=new Map();
    const fallback={
      getItem:k=>mem.has(String(k))?mem.get(String(k)):null,
      setItem:(k,v)=>{mem.set(String(k),String(v));},
      removeItem:k=>{mem.delete(String(k));},
      clear:()=>mem.clear(),
      key:i=>Array.from(mem.keys())[i]??null,
      get length(){return mem.size;}
    };
    try{Object.defineProperty(window,'localStorage',{value:fallback,configurable:true});}catch(_e){}
    window.__OSCP_STORAGE_PERSISTENT__=false;
  }
})();
