/* V34.37: typo-tolerant, exam-language-aware search scoring. */
(function(root){
  'use strict';
  const SEARCH_ALIASES=Object.freeze({
    subdomain:['vhost','virtual host','dns','hosts'],
    vhost:['subdomain','virtual host','hosts'],
    privesc:['privilege escalation','sudo','suid','seimpersonate'],
    'priv esc':['privilege escalation','sudo','suid','seimpersonate'],
    foothold:['initial access','shell','rce'],
    'reverse shell':['shell','callback','listener'],
    revshell:['reverse shell','shell','listener'],
    'password spray':['spray','credential reuse','kerbrute'],
    spray:['password spray','credential reuse','kerbrute'],
    lateral:['lateral movement','winrm','smb','rdp'],
    pivot:['tunnel','port forward','ligolo','sshuttle','chisel'],
    tunnel:['pivot','port forward','ligolo','sshuttle','chisel'],
    bloodhound:['rusthound','sharphound','active directory'],
    kerberoast:['kerberoasting','spn','tgs'],
    asrep:['as-rep','asreproast','preauth'],
    'as-rep':['asrep','asreproast','preauth'],
    secretsdump:['ntds','sam','lsa','impacket'],
    'web enum':['web enumeration','feroxbuster','gobuster','ffuf'],
    upload:['file upload','transfer','certutil','powershell'],
    transfer:['file transfer','upload','download','certutil'],
    hosts:['/etc/hosts','vhost','subdomain','dns']
  });
  function norm(value){
    return String(value||'').toLowerCase().replace(/[^a-z0-9:_\-\[\]\.\/ ]+/g,' ').replace(/\s+/g,' ').trim();
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
  function aliasesFor(q){
    q=norm(q);if(!q)return [];
    const out=[];
    for(const [key,values] of Object.entries(SEARCH_ALIASES)){
      if(q===key||q.includes(key)||key.includes(q))out.push(...values);
    }
    return [...new Set(out.map(norm).filter(Boolean))];
  }
  function scoreTerm(title,tags,body,term,weight){
    let score=0;
    if(title===term)score+=100*weight;
    if(tags.includes(term))score+=80*weight;
    if(title.includes(term))score+=55*weight;
    if(body.includes(term))score+=20*weight;
    const toks=term.split(/\s+/).filter(Boolean);
    const strongWords=[...new Set((title+' '+tags).split(/\s+/).filter(Boolean))];
    for(const t of toks){
      let direct=false;
      if(tags.includes(t)){score+=25*weight;direct=true}
      if(title.includes(t)){score+=18*weight;direct=true}
      if(body.includes(t)){score+=5*weight;direct=true}
      if(!direct&&strongWords.some(w=>nearToken(t,w)))score+=12*weight;
    }
    return score;
  }
  function fuzzyScore(item,q){
    q=norm(q);if(!q)return 0;
    const title=norm(item?.title),tags=norm((item?.tags||[]).join(' ')),body=norm(item?.text);
    let score=scoreTerm(title,tags,body,q,1);
    for(const alias of aliasesFor(q))score+=scoreTerm(title,tags,body,alias,0.34);
    return Math.round(score*100)/100;
  }
  root.OSCP_SEARCH_CORE=Object.freeze({norm,withinOneEdit,nearToken,aliasesFor,fuzzyScore});
})(typeof window!=='undefined'?window:globalThis);
