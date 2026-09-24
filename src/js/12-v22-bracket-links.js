
(()=>{
  'use strict';
  const TAG_RE=/\[(?:[A-Z][A-Z0-9_-]*)(?::[A-Z0-9_.-]+)+\]/g;
  const SKIP='script,style,noscript,textarea,input,select,option,a,button,[contenteditable="true"],[data-tag],[data-open],[data-q]';

  function canLink(node){
    const p=node&&node.parentElement;
    return !!p&&!p.closest(SKIP)&&TAG_RE.test(node.nodeValue||'');
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
    if(!node||node.nodeType!==Node.TEXT_NODE)return 0;
    TAG_RE.lastIndex=0;
    if(!canLink(node)){TAG_RE.lastIndex=0;return 0;}
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
    if(!count)return 0;
    if(last<text.length)frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag,node);
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

  function exactTagMatches(tag){
    try{
      if(typeof SEARCH_ITEMS==='undefined'||!Array.isArray(SEARCH_ITEMS))return [];
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
    const linked=linkify(root);
    const observer=new MutationObserver(records=>{
      for(const record of records){
        for(const node of record.addedNodes){
          if(node.nodeType===Node.TEXT_NODE)linkText(node);
          else if(node.nodeType===Node.ELEMENT_NODE)linkify(node);
        }
      }
    });
    observer.observe(root,{childList:true,subtree:true});
    window.OSCP_TAG_LINKS={linkify,goToTag,exactTagMatches,initialLinked:linked};
    try{
      if(typeof V16_SELF_TESTS!=='undefined'){
        V16_SELF_TESTS.push(['Clickable bracket reference tags',()=>[
          !!document.querySelector('.tagRefLink')&&typeof window.OSCP_TAG_LINKS.goToTag==='function',
          document.querySelectorAll('.tagRefLink').length+' linked tags'
        ]]);
      }
    }catch(_){}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
