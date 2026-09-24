
/* Boot migration: fill missing current keys from the newest older OSCP state.
   A single current setting must not suppress migration of older targets/credentials. */
function olderOSCPStoragePrefixes(keys,currentVersion=16){
 const versions=[...new Set((keys||[]).map(k=>{const m=String(k||'').match(/^oscp_v(\d+)_/);return m?Number(m[1]):null}).filter(v=>Number.isInteger(v)&&v>0&&v<currentVersion))];
 return versions.sort((a,b)=>b-a).map(v=>`oscp_v${v}_`);
}
try{
 const keys=[];for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));
 const sources=olderOSCPStoragePrefixes(keys,16),migrated=[];
 for(const source of sources){
  let used=false;
  for(const k of keys.filter(k=>k&&k.startsWith(source))){
   const nk='oscp_v16_'+k.slice(source.length);
   if(localStorage.getItem(nk)===null){localStorage.setItem(nk,localStorage.getItem(k));used=true}
  }
  if(used)migrated.push(source.replace(/_$/,''));
 }
 if(migrated.length)localStorage.setItem('oscp_v16_migrated_from',migrated.join(','));
}catch(e){}
