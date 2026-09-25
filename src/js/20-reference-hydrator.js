(()=>{
 'use strict';
 const root=document.getElementById('referenceRoot'),payload=document.getElementById('referencePayload'),status=document.getElementById('referenceLoading');
 let parts=null,index=0,running=false,ready=false,decodePromise=null,lastError=null;
 const nextTick=()=>new Promise(r=>setTimeout(r,0));
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
   if(ready)return;
   ready=true;running=false;lastError=null;window.OSCP_REFERENCE_READY=true;status?.remove();
   try{if(typeof prepareCode==='function')prepareCode()}catch(_){}
   document.dispatchEvent(new CustomEvent('oscp-reference-ready'));
 }
 function fail(e){
   running=false;lastError=e instanceof Error?e:new Error(String(e));console.error('[OSCP] Reference hydration failed',e);
   if(status){status.className='card';status.replaceChildren();const b=document.createElement('b');b.textContent='Deep reference could not load.';const d=document.createElement('div');d.className='tiny';d.textContent=String(e?.message||e);status.append(b,d)}
   document.dispatchEvent(new CustomEvent('oscp-reference-failed',{detail:{message:String(e?.message||e)}}));
 }
 function appendBatch(count=1){
   let added=0;
   while(parts&&index<parts.length&&added<count){appendHtml(parts[index++]);added++}
   if(status&&parts)status.textContent='Loading deep reference… '+index+'/'+parts.length;
   if(parts&&index>=parts.length)finish();
   return added;
 }
 function schedule(){
   if(ready||!running)return;
   const run=()=>{if(ready||!running)return;appendBatch(1);if(!ready)setTimeout(schedule,0)};
   if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:180});else setTimeout(run,0);
 }
 async function start(){
   if(ready||!root)return ready;
   if(running)return true;
   running=true;
   try{await parsePayload();if(!parts.length){finish();return true}schedule();return true}catch(e){fail(e);return false}
 }
 async function waitForAnchor(anchor,{timeout=12000}={}){
   anchor=String(anchor||'').trim();if(!anchor)return null;
   let el=document.getElementById(anchor);if(el)return el;
   const deadline=Date.now()+Math.max(500,Number(timeout)||12000);
   try{
     await parsePayload();
     if(!running&&!ready){running=true;schedule()}
     while(Date.now()<deadline){
       el=document.getElementById(anchor);if(el)return el;
       if(lastError)return null;
       if(parts&&index<parts.length){
         appendBatch(3);
         el=document.getElementById(anchor);if(el)return el;
       }
       if(ready)break;
       await nextTick();
     }
   }catch(e){fail(e);return null}
   return document.getElementById(anchor);
 }
 window.OSCP_REFERENCE={start,waitForAnchor,ready:()=>ready,progress:()=>({loaded:index,total:parts?.length||0}),error:()=>lastError};
 window.OSCP_REFERENCE_READY=false;
 if(document.readyState==='complete')setTimeout(()=>start(),250);else window.addEventListener('load',()=>setTimeout(()=>start(),250),{once:true});
})();