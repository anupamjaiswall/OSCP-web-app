/* V34.62: dedicated fullscreen Reference reader and searchable left TOC. */
(()=>{
 'use strict';
 if(window.OSCP_REF_READER)return;
 const $=id=>document.getElementById(id);
 const view=$('referenceView'),root=$('referenceRoot'),toc=$('refReaderToc');
 if(!view||!root||!toc)return;
 const mode=$('refReaderFullscreen'),close=$('refReaderExit'),toggle=$('refReaderTocToggle'),filter=$('refReaderFilter');
 let built=false,native=false,entries=[],active='',allGroups=[];
 const store='oscp:reference-reader:v1';
 function isActive(){return view.classList.contains('active')}
 function setToc(open){
   view.classList.toggle('refTocOpen',!!open);
   toggle?.setAttribute('aria-expanded',String(!!open));
 }
 function activeLink(anchor){
   active=anchor;
   toc.querySelectorAll('button[data-ref-id]').forEach(b=>{
     const on=b.dataset.refId===anchor;
     b.classList.toggle('active',on);
     if(on)b.setAttribute('aria-current','location');else b.removeAttribute('aria-current');
   });
 }
 function jump(anchor){
   const el=$(anchor);if(!el)return;
   activeLink(anchor);
   if(typeof window.openRef==='function')window.openRef(anchor);
   else {
     let p=el.closest('details');while(p){p.open=true;p=p.parentElement?.closest('details')}
     el.scrollIntoView({block:'start',behavior:'auto'});
   }
   if(window.matchMedia('(max-width:900px)').matches)setToc(false);
 }
 function makeButton(anchor,title,cls=''){
   const b=document.createElement('button');
   b.type='button';b.className='refReaderLink '+cls;
   b.dataset.refId=anchor;b.textContent=title;
   b.title=title;b.addEventListener('click',()=>jump(anchor));
   return b;
 }
 function build(){
   if(!window.OSCP_REFERENCE_READY||!root.querySelector('h2[id]'))return false;
   toc.replaceChildren();entries=[];allGroups=[];
   const headings=[...root.querySelectorAll('h2[id], details[id]')];
   let group=null,count=0;
   for(const node of headings){
     if(node.matches('h2[id]')){
       group=document.createElement('details');group.className='refReaderGroup';group.open=count<3;
       const sum=document.createElement('summary');sum.textContent=(node.textContent||'Section').trim().slice(0,88);group.append(sum);
       toc.append(group);allGroups.push(group);count++;
       const anchor=node.id;
       const headingLink=makeButton(anchor,'↳ Open section','refReaderHeadingLink');
       group.append(headingLink);
       entries.push({anchor,group,button:headingLink,top:true,text:sum.textContent.toLowerCase()});
     }else if(node.matches('details[id]')){
       if(!group){
         group=document.createElement('details');group.className='refReaderGroup';group.open=true;
         const sum=document.createElement('summary');sum.textContent='Reference';group.append(sum);
         toc.append(group);allGroups.push(group);
       }
       const title=(node.querySelector(':scope > summary')?.textContent||node.id).replace(/\s+/g,' ').trim();
       const btn=makeButton(node.id,title);
       group.append(btn);entries.push({anchor:node.id,group,button:btn,text:title.toLowerCase(),top:false});
     }
   }
   built=!!entries.length;
   $('refReaderCount').textContent=entries.length+' sections';
   applyFilter();return built;
 }
 function applyFilter(){
   const q=(filter?.value||'').trim().toLowerCase();
   let visible=0;
   for(const e of entries){
     if(e.button){
       const hit=!q||e.text.includes(q);
       e.button.hidden=!hit;
       if(hit)visible++;
     }
   }
   for(const group of allGroups){
     const head=group.querySelector('summary');
     const headMatch=q&&head.textContent.toLowerCase().includes(q);
     if(headMatch)group.querySelectorAll('button[data-ref-id]').forEach(b=>b.hidden=false);
     const any=[...group.querySelectorAll('button[data-ref-id]')].some(b=>!b.hidden);
     group.hidden=!!q&&!headMatch&&!any;
     if(q&&(!group.hidden))group.open=true;
   }
   $('refReaderCount').textContent=q?(toc.querySelectorAll('button:not([hidden])').length+' matches'):entries.length+' sections';
 }
 async function leave(){
   document.body.classList.remove('referenceReaderMode');
   mode.textContent='⛶ Full screen';
   mode.setAttribute('aria-pressed','false');
   if(native&&document.fullscreenElement){
     try{await document.exitFullscreen()}catch(_){}
   }
   native=false;
 }
 async function enter(){
   if(!isActive())window.switchView?.('referenceView');
   document.body.classList.add('referenceReaderMode');
   mode.textContent='Exit full screen';
   mode.setAttribute('aria-pressed','true');
   try{
     if(document.documentElement.requestFullscreen&&!document.fullscreenElement){
       await document.documentElement.requestFullscreen();
       native=true;
     }
   }catch(_){native=false;} // CSS immersive mode remains usable for file:// or denied fullscreen.
 }
 mode.addEventListener('click',()=>document.body.classList.contains('referenceReaderMode')?leave():enter());
 close.addEventListener('click',leave);
 toggle.addEventListener('click',()=>setToc(!view.classList.contains('refTocOpen')));
 filter.addEventListener('input',applyFilter);
 $('refReaderClear')?.addEventListener('click',()=>{filter.value='';applyFilter();filter.focus();});
 $('refReaderStart')?.addEventListener('click',()=>jump('ref-0-v5-navigation-note'));
 $('refReaderPre')?.addEventListener('click',()=>jump('ref-1-3-tmux-setup-never-work-without-it'));
 $('refReaderDuring')?.addEventListener('click',()=>jump('ref-exam-tmux-operator-runbook'));
 document.addEventListener('fullscreenchange',()=>{
   if(!document.fullscreenElement&&native){native=false;leave();}
 });
 document.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&document.body.classList.contains('referenceReaderMode')&&!document.fullscreenElement)leave();
 });
 document.addEventListener('oscp-reference-ready',build);
 const observe=new MutationObserver(()=>{if(!isActive()&&document.body.classList.contains('referenceReaderMode'))leave()});
 observe.observe(view,{attributes:true,attributeFilter:['class']});
 const boot=()=>{if(window.OSCP_REFERENCE_READY)build();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.OSCP_REF_READER={build,jump,enter,leave,entries:()=>entries.length};
})();
