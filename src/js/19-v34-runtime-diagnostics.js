/* V34.28: bounded runtime error log + on-demand diagnostics + event-driven multi-tab warning. */
(()=>{
 'use strict';
 const ERROR_KEY='oscp:runtime-errors:v34';
 const TAB_KEY='oscp:tab-claim:v34';
 const MAX_ERRORS=30;
 const TAB_ID=(globalThis.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2);
 let errors=loadErrors(),conflict=null,lastClaim=0;
 const $id=id=>document.getElementById(id);
 const clean=(v,max=420)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
 function safeSet(key,value){try{localStorage.setItem(key,value);return true}catch(_){return false}}
 function loadErrors(){try{const x=JSON.parse(localStorage.getItem(ERROR_KEY)||'[]');return Array.isArray(x)?x.slice(-MAX_ERRORS):[]}catch(_){return[]}}
 function persistErrors(){safeSet(ERROR_KEY,JSON.stringify(errors.slice(-MAX_ERRORS)))}
 function record(kind,message,source='',line=0,col=0){
   errors.push({at:Date.now(),kind:clean(kind,24),message:clean(message)||'Unknown runtime error',source:clean(source,180),line:+line||0,col:+col||0});
   errors=errors.slice(-MAX_ERRORS);persistErrors();
   /* Deliberately do not render from the error handler. */
 }
 window.addEventListener('error',e=>record('error',e.message,e.filename,e.lineno,e.colno),true);
 window.addEventListener('unhandledrejection',e=>{const r=e.reason;record('rejection',r instanceof Error?r.message:(typeof r==='string'?r:JSON.stringify(r??'Unhandled rejection')))});
 function diagnosticPayload(){return{build:window.OSCP_BUILD||null,bootHealth:window.OSCP_BOOT_HEALTH||null,capturedAt:new Date().toISOString(),runtimeErrors:[...errors],multiTabConflict:conflict,storageRecoveryCount:Array.isArray(window.__OSCP_CORRUPT_STORAGE__)?window.__OSCP_CORRUPT_STORAGE__.length:0}}
 function make(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
 function renderErrors(){
   const root=$id('runtimeErrorList');if(!root)return;root.replaceChildren();
   if(!errors.length){root.appendChild(make('div','muted','No captured runtime errors in this browser profile.'));return}
   for(const e of [...errors].reverse()){const row=make('div','runtimeDiagError');row.appendChild(make('span','type',e.kind));const loc=e.source?(' · '+e.source.split('/').pop()+(e.line?':'+e.line:'')):'';row.appendChild(make('span','msg',e.message+loc));row.appendChild(make('span','at',new Date(e.at).toLocaleString()));root.appendChild(row)}
 }
 function render(){
   const build=$id('runtimeDiagBuild'),err=$id('runtimeDiagErrorCount'),tab=$id('runtimeDiagTabStatus'),warn=$id('multiTabWarning'),warnText=$id('multiTabWarningText');
   if(build)build.textContent=(window.OSCP_BUILD?.label||'build?')+' · '+(window.OSCP_BUILD?.version||'unknown');
   if(err)err.textContent=errors.length?errors.length+' retained runtime error'+(errors.length===1?'':'s'):'No retained runtime errors';
   if(tab)tab.textContent=conflict?('Another tab/window was active at '+new Date(conflict.at).toLocaleTimeString()):'No competing tab/window observed this session';
   if(warn){warn.hidden=!conflict;if(warnText&&conflict)warnText.textContent='Another OSCP Exam OS tab/window became active at '+new Date(conflict.at).toLocaleTimeString()+'. Avoid editing exam state in two tabs.'}
   renderErrors();
 }
 function claim(reason){const now=Date.now();if(now-lastClaim<900)return;lastClaim=now;safeSet(TAB_KEY,JSON.stringify({id:TAB_ID,at:now,reason:clean(reason,30),build:window.OSCP_BUILD?.version||''}))}
 window.addEventListener('storage',e=>{if(e.key!==TAB_KEY||!e.newValue)return;try{const x=JSON.parse(e.newValue);if(x&&x.id&&x.id!==TAB_ID&&document.visibilityState==='visible'){conflict={at:+x.at||Date.now(),reason:clean(x.reason,30),build:clean(x.build,30)};queueMicrotask(render)}}catch(_){}});
 window.addEventListener('focus',()=>claim('focus'));
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')claim('visible')});
 function start(){
   $id('runtimeDiagRefresh')?.addEventListener('click',render);
   $id('runtimeDiagClear')?.addEventListener('click',()=>{if(!confirm('Clear the retained runtime error log?'))return;errors=[];persistErrors();render()});
   $id('runtimeDiagCopy')?.addEventListener('click',async()=>{const text=JSON.stringify(diagnosticPayload(),null,2);const ok=typeof copyText==='function'?await copyText(text):false;if(typeof toast==='function')toast(ok?'Diagnostics copied':'Copy blocked')});
   $id('multiTabDismiss')?.addEventListener('click',()=>{conflict=null;render()});
   claim('startup');render();
   try{if(typeof V16_SELF_TESTS!=='undefined')V16_SELF_TESTS.push(['V34 runtime diagnostics',()=>[!!$id('runtimeDiagSummary')&&typeof diagnosticPayload==='function','diagnostics panel']],['V34 multi-tab warning',()=>[!!$id('multiTabWarning'),'event-driven tab warning']])}catch(_){}
   window.OSCP_RUNTIME_DIAGNOSTICS={errors:()=>[...errors],payload:diagnosticPayload,render,claim};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();