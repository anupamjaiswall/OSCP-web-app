/* V30 shared pure utilities. Keep this file DOM-free so CI can execute it in Node. */
(function(root){
  'use strict';
  function escapeHtml(value){
    return String(value ?? '').replace(/[&<>"']/g,c=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }
  function clampExamPoints(value){
    const n=Number(value);
    return Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):0;
  }
  function examScore(adPoints,standalonePoints,passTarget=70){
    const ad=clampExamPoints(adPoints);
    const standalone=(Array.isArray(standalonePoints)?standalonePoints:[]).map(clampExamPoints);
    const total=clampExamPoints(ad+standalone.reduce((a,b)=>a+b,0));
    const target=clampExamPoints(passTarget);
    return {ad,standalone,total,target,need:Math.max(0,target-total),passed:total>=target};
  }
  function evidenceClaims(target){
    const e=target?.evidence||{},st=target?.status||{};
    const local=!!(st.foothold||st.local||e.footholdRecorded||e.localRead||e.localSubmitted||e.localScreenshot);
    const proof=!!(st.privesc||st.proof||e.privescRecorded||e.proofRead||e.proofSubmitted||e.proofScreenshot||e.reproducible);
    return {local,proof};
  }
  function requiredEvidence(target){
    const c=evidenceClaims(target);
    const req=[['enumRecorded','Enumeration recorded'],['commandsRecorded','Exact commands recorded']];
    if(c.local) req.push(
      ['footholdRecorded','Foothold/vector recorded'],
      ['localRead','local.txt read at original location'],
      ['localSubmitted','local flag submitted'],
      ['localScreenshot','Local screenshot has proof + IP']
    );
    if(c.proof) req.push(
      ['privescRecorded','PrivEsc reasoning recorded'],
      ['proofRead','proof.txt read at original location'],
      ['proofSubmitted','proof flag submitted'],
      ['proofScreenshot','Proof screenshot has proof + IP'],
      ['reproducible','Steps reproducible without memory']
    );
    return req;
  }
  function evidenceMissing(target){
    const t=target||{},missing=[];
    if(!t.ip) missing.push('Target IP');
    const c=evidenceClaims(t);
    if(!c.local&&!c.proof) missing.push('No point-bearing objective marked as obtained');
    requiredEvidence(t).forEach(([key,label])=>{if(!t.evidence?.[key])missing.push(label)});
    if(!t.report?.title) missing.push('Report title/finding');
    if(!t.report?.commands) missing.push('Exact commands/reproducibility notes');
    return missing;
  }
  root.OSCP_UTILS=Object.freeze({
    escapeHtml,clampExamPoints,examScore,evidenceClaims,requiredEvidence,evidenceMissing
  });
})(typeof window!=='undefined'?window:globalThis);