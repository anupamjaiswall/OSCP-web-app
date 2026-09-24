(()=>{
 'use strict';
 const root=document.getElementById('referenceRoot'),payload=document.getElementById('referencePayload'),status=document.getElementById('referenceLoading');
 let parts=null,index=0,running=false,ready=false,decodePromise=null;
 async function parsePayload(){
   if(parts)return parts;
   if(decodePromise)return decodePromise;
   decodePromise=(async()=>{
     const raw=String(payload?.textContent||'').trim();
     if(!raw){parts=[];return parts}
     if(typeof DecompressionStream!=='function')throw new Error('This browser lacks DecompressionStream support required for the embedded offline reference.');
     const bin=atob(raw),bytes=new Uint8Array(bin.length);
     for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
     const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
     const html=await new Response(stream).text();
     parts=html.split(/(?=<h2\s+id=)/i).filter(Boolean);
     return parts;
   })();
   return decodePromise;
 }
 function appendHtml(html){
   const range=document.createRange();range.selectNodeContents(root);root.appendChild(range.createContextualFragment(String(html||'')));
 }
 function finish(){
   ready=true;running=false;window.OSCP_REFERENCE_READY=true;status?.remove();
   try{if(typeof prepareCode==='function')prepareCode()}catch(_){}
   document.dispatchEvent(new CustomEvent('oscp-reference-ready'));
 }
 function fail(e){
   running=false;console.error('[OSCP] Reference hydration failed',e);
   if(status){status.className='card';status.replaceChildren();const b=document.createElement('b');b.textContent='Deep reference could not load.';const d=document.createElement('div');d.className='tiny';d.textContent=String(e?.message||e);status.append(b,d)}
 }
 function schedule(){
   if(ready||!running)return;
   const run=()=>{
     if(index>=parts.length){finish();return}
     appendHtml(parts[index++]);if(status)status.textContent='Loading deep reference… '+index+'/'+parts.length;
     setTimeout(schedule,0);
   };
   if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:250});else setTimeout(run,0);
 }
 async function start(){
   if(ready||running||!root)return;
   running=true;
   try{await parsePayload();if(!parts.length){finish();return}schedule()}catch(e){fail(e)}
 }
 window.OSCP_REFERENCE={start,ready:()=>ready,progress:()=>({loaded:index,total:parts?.length||0})};
 window.OSCP_REFERENCE_READY=false;
 if(document.readyState==='complete')setTimeout(()=>start(),250);else window.addEventListener('load',()=>setTimeout(()=>start(),250),{once:true});
})();