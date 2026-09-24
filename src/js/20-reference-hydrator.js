(()=>{
 'use strict';
 const root=document.getElementById('referenceRoot'),payload=document.getElementById('referencePayload'),status=document.getElementById('referenceLoading');
 let parts=null,index=0,running=false,ready=false;
 function parsePayload(){
   if(parts)return parts;
   try{
     const html=JSON.parse(payload?.textContent||'""');
     parts=String(html||'').split(/(?=<h2\s+id=)/i).filter(Boolean);
   }catch(e){parts=[];console.error('[OSCP] Reference payload parse failed',e)}
   return parts;
 }
 function appendHtml(html){
   const range=document.createRange();range.selectNodeContents(root);root.appendChild(range.createContextualFragment(String(html||'')));
 }
 function finish(){
   ready=true;running=false;window.OSCP_REFERENCE_READY=true;status?.remove();
   try{if(typeof prepareCode==='function')prepareCode()}catch(_){}
   document.dispatchEvent(new CustomEvent('oscp-reference-ready'));
 }
 function schedule(){
   if(ready||!running)return;
   const run=()=>{
     if(index>=parsePayload().length){finish();return}
     appendHtml(parts[index++]);if(status)status.textContent='Loading deep reference… '+index+'/'+parts.length;
     setTimeout(schedule,0);
   };
   if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:250});else setTimeout(run,0);
 }
 function start(){if(ready||running||!root)return;running=true;parsePayload();if(!parts.length){finish();return}schedule()}
 window.OSCP_REFERENCE={start,ready:()=>ready,progress:()=>({loaded:index,total:parts?.length||0})};
 window.OSCP_REFERENCE_READY=false;
 if(document.readyState==='complete')setTimeout(start,250);else window.addEventListener('load',()=>setTimeout(start,250),{once:true});
})();