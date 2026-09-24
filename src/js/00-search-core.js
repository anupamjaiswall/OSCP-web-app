/* V34.1 batch 1: pure typo-tolerant search scoring. */
(function(root){
  'use strict';
  function norm(value){
    return String(value||'').toLowerCase().replace(/[^a-z0-9:_\-\[\]\. ]+/g,' ').replace(/\s+/g,' ').trim();
  }
  function withinOneEdit(a,b){
    a=String(a||'');b=String(b||'');
    if(a===b)return true;
    if(Math.abs(a.length-b.length)>1)return false;
    let i=0,j=0,edits=0;
    while(i<a.length&&j<b.length){
      if(a[i]===b[j]){i++;j++;continue}
      if(++edits>1)return false;
      if(a.length>b.length)i++;
      else if(b.length>a.length)j++;
      else{i++;j++}
    }
    if(i<a.length||j<b.length)edits++;
    return edits<=1;
  }
  function nearToken(queryToken,word){
    if(queryToken.length<4||word.length<4)return false;
    if(withinOneEdit(queryToken,word))return true;
    const prefix=word.slice(0,Math.min(word.length,queryToken.length+1));
    return prefix.length>=4&&withinOneEdit(queryToken,prefix);
  }
  function fuzzyScore(item,q){
    q=norm(q);if(!q)return 0;
    const title=norm(item?.title),tags=norm((item?.tags||[]).join(' ')),body=norm(item?.text);
    let score=0;
    if(title===q)score+=100;
    if(tags.includes(q))score+=80;
    if(title.includes(q))score+=55;
    if(body.includes(q))score+=20;
    const toks=q.split(/\s+/).filter(Boolean);
    const strongWords=[...new Set((title+' '+tags).split(/\s+/).filter(Boolean))];
    for(const t of toks){
      let direct=false;
      if(tags.includes(t)){score+=25;direct=true}
      if(title.includes(t)){score+=18;direct=true}
      if(body.includes(t)){score+=5;direct=true}
      if(!direct&&strongWords.some(w=>nearToken(t,w)))score+=12;
    }
    return score;
  }
  root.OSCP_SEARCH_CORE=Object.freeze({norm,withinOneEdit,nearToken,fuzzyScore});
})(typeof window!=='undefined'?window:globalThis);
