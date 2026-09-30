(()=>{
 'use strict';
 const root=document.getElementById('referenceRoot'),payload=document.getElementById('referencePayload'),status=document.getElementById('referenceLoading');
 let ready=false,hydratePromise=null,lastError=null;
 const nextTask=()=>new Promise(r=>setTimeout(r,0));
 function finish(){
   if(ready)return true;
   ready=true;lastError=null;window.OSCP_REFERENCE_READY=true;status?.remove();
   try{if(typeof prepareCode==='function')prepareCode()}catch(_){}
   document.dispatchEvent(new CustomEvent('oscp-reference-ready'));
   return true;
 }
 function fail(e){
   lastError=e instanceof Error?e:new Error(String(e));window.OSCP_REFERENCE_READY=false;
   console.error('[OSCP] Reference hydration failed',lastError);
   if(status){status.className='card';status.replaceChildren();const b=document.createElement('b');b.textContent='Deep reference could not load.';const d=document.createElement('div');d.className='tiny';d.textContent=String(lastError.message||lastError);status.append(b,d)}
   document.dispatchEvent(new CustomEvent('oscp-reference-failed',{detail:{message:String(lastError.message||lastError)}}));
   return false;
 }
 function decodePayload(){
   const raw=String(payload?.textContent||'').trim();
   if(!raw)throw new Error('Embedded reference payload is empty.');
   let html='';
   try{html=JSON.parse(raw)}catch(e){throw new Error('Embedded reference payload is invalid: '+String(e?.message||e))}
   if(typeof html!=='string'||!html.trim())throw new Error('Embedded reference payload did not decode to text.');
   return html;
 }
 function appendHtml(html){
   const range=document.createRange();range.selectNodeContents(root);
   root.appendChild(range.createContextualFragment(String(html||'')));
 }
 async function hydrateReferenceOnce(){
   if(ready)return true;
   if(!root||!payload)return fail(new Error('Reference container or payload is missing.'));
   if(status)status.textContent='Loading deep reference…';
   try{
     const html=decodePayload();
     await nextTask();
     appendHtml(html);
     return finish();
   }catch(e){return fail(e)}
 }
 function start(){
   if(ready)return Promise.resolve(true);
   if(hydratePromise)return hydratePromise;
   hydratePromise=hydrateReferenceOnce().finally(()=>{if(!ready)hydratePromise=null});
   return hydratePromise;
 }
 async function waitForAnchor(anchor,{timeout=12000}={}){
   anchor=String(anchor||'').trim();if(!anchor)return null;
   const existing=document.getElementById(anchor);if(existing)return existing;
   const ok=await Promise.race([
     start(),
     new Promise(r=>setTimeout(()=>r(false),Math.max(500,Number(timeout)||12000)))
   ]);
   if(!ok||lastError)return null;
   return document.getElementById(anchor);
 }
 window.OSCP_REFERENCE={start,waitForAnchor,ready:()=>ready,progress:()=>({loaded:ready?1:0,total:1}),error:()=>lastError};
 window.OSCP_REFERENCE_READY=false;
 const autoStart=()=>setTimeout(()=>start(),250);
 if(document.readyState==='complete')autoStart();else window.addEventListener('load',autoStart,{once:true});
 setTimeout(()=>{if(!ready&&!hydratePromise)start()},2000);
})();