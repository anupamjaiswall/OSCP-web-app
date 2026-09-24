(()=>{
  'use strict';
  const TAG_RE=/\[(?:[A-Z][A-Z0-9_-]*)(?::[A-Z0-9_.-]+)+\]/g;
  const TAG_TEST=/\[(?:[A-Z][A-Z0-9_-]*)(?::[A-Z0-9_.-]+)+\]/;
  const SKIP='script,style,noscript,textarea,input,select,option,a,button,[contenteditable="true"],[data-tag],[data-open],[data-q]';

  function canLink(node){
    const p=node&&node.parentElement;
    return !!p&&!p.closest(SKIP)&&TAG_TEST.test(node.nodeValue||'');
  }

  function tagLink(tag){
    const a=document.createElement('a');
    a.href='#';
    a.className='tagRefLink';
    a.dataset.tagRef=tag;
    a.textContent=tag;
    a.title='Open reference for '+tag;
    a.setAttribute('aria-label','Open reference for '+tag);
    return a;
  }

  function linkText(node){
    if(!node||node.nodeType!==Node.TEXT_NODE||!canLink(node))return 0;
    const text=node.nodeValue||'';
    TAG_RE.lastIndex=0;
    let m,last=0,count=0;
    const frag=document.createDocumentFragment();
    while((m=TAG_RE.exec(text))){
      if(m.index>last)frag.appendChild(document.createTextNode(text.slice(last,m.index)));
      frag.appendChild(tagLink(m[0]));
      last=m.index+m[0].length;
      count++;
    }
    TAG_RE.lastIndex=0;
    if(!count)return 0;
    if(last<text.length)frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode?.replaceChild(frag,node);
    return count;
  }

  function linkify(root){
    if(!root)return 0;
    if(root.nodeType===Node.TEXT_NODE)return linkText(root);
    if(![Node.ELEMENT_NODE,Node.DOCUMENT_NODE,Node.DOCUMENT_FRAGMENT_NODE].includes(root.nodeType))return 0;
    if(root.nodeType===Node.ELEMENT_NODE&&root.matches(SKIP))return 0;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    return nodes.reduce((n,x)=>n+linkText(x),0);
  }

  function linkifyIncremental(root,{chunkSize=160,onDone}={}){
    if(!root)return;
    const iterator=document.createNodeIterator(root,NodeFilter.SHOW_TEXT);
    let total=0,finished=false;
    function pump(){
      if(finished)return;
      let processed=0,node;
      while(processed<chunkSize&&(node=iterator.nextNode())){
        total+=linkText(node);
        processed++;
      }
      if(!node){
        finished=true;
        if(window.OSCP_TAG_LINKS){
          window.OSCP_TAG_LINKS.initialLinked=total;
          window.OSCP_TAG_LINKS.complete=true;
        }
        if(typeof onDone==='function')onDone(total);
        return;
      }
      setTimeout(pump,0);
    }
    setTimeout(pump,0);
  }

  function exactTagMatches(tag){
    try{
      if(typeof SEARCH_ITEMS==='undefined'||!Array.isArray(SEARCH_ITEMS))return [];
      if(typeof ensureSearchItems==='function')ensureSearchItems();
      const wanted=String(tag||'').toUpperCase();
      return SEARCH_ITEMS.filter(item=>(item.tags||[]).some(t=>String(t).toUpperCase()===wanted));
    }catch(_){return [];}
  }

  function goToTag(tag){
    tag=String(tag||'').trim();
    if(!tag)return;
    const exact=exactTagMatches(tag);
    if(exact.length===1&&exact[0].anchor&&document.getElementById(exact[0].anchor)){
      openRef(exact[0].anchor);
      return;
    }
    const input=document.getElementById('globalSearch');
    if(input)input.value=tag;
    if(typeof switchView==='function')switchView('searchView');
    if(typeof renderSearch==='function')renderSearch(tag);
  }

  document.addEventListener('click',e=>{
    const a=e.target&&e.target.closest?e.target.closest('.tagRefLink'):null;
    if(!a)return;
    e.preventDefault();
    e.stopPropagation();
    goToTag(a.dataset.tagRef||a.textContent);
  });

  document.addEventListener('keydown',e=>{
    const a=e.target&&e.target.closest?e.target.closest('.tagRefLink'):null;
    if(!a||e.key!==' ')return;
    e.preventDefault();
    goToTag(a.dataset.tagRef||a.textContent);
  });

  function start(){
    const root=document.querySelector('.main')||document.body;
    window.OSCP_TAG_LINKS={linkify,linkifyIncremental,goToTag,exactTagMatches,initialLinked:0,complete:false};

    linkifyIncremental(root,{onDone:linked=>{
      const observer=new MutationObserver(records=>{
        for(const record of records){
          for(const added of record.addedNodes){
            if(added.nodeType===Node.TEXT_NODE)linkText(added);
            else if(added.nodeType===Node.ELEMENT_NODE)linkify(added);
          }
        }
      });
      observer.observe(root,{childList:true,subtree:true});
      window.OSCP_TAG_LINKS.observer=observer;
      window.OSCP_TAG_LINKS.initialLinked=linked;
      window.OSCP_TAG_LINKS.complete=true;
    }});

    try{
      if(typeof V16_SELF_TESTS!=='undefined'){
        V16_SELF_TESTS.push(['Clickable bracket reference tags',()=>[
          typeof window.OSCP_TAG_LINKS.goToTag==='function'&&typeof window.OSCP_TAG_LINKS.linkifyIncremental==='function',
          (window.OSCP_TAG_LINKS.initialLinked||0)+' linked tags · '+(window.OSCP_TAG_LINKS.complete?'complete':'linking')
        ]]);
      }
    }catch(_){}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
