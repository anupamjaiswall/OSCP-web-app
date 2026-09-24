(()=>{
'use strict';
const MAX_EXTERNAL_AGE=2*60*60*1000;
const $id=id=>document.getElementById(id);
function snapshot(){
  let dirty=false,lastSnapshot=0,backupAt=0,backupKind='backup',storageFailed=false;
  try{dirty=!!v9Dirty}catch(_){}
  try{lastSnapshot=Number(lastSnapshotAt)||0}catch(_){}
  try{backupAt=Number(externalBackupMeta?.at)||0;backupKind=String(externalBackupMeta?.kind||'backup')}catch(_){}
  try{storageFailed=!!__oscpStorageWriteWarned}catch(_){}
  const backupFresh=!!backupAt&&Date.now()-backupAt<=MAX_EXTERNAL_AGE;
  return{dirty,lastSnapshot,backupAt,backupKind,backupFresh,storageFailed};
}
function latestSafetySnapshot(){
  try{return autosnapshots.find(s=>/^before\b/i.test(String(s?.reason||'')))||null}catch(_){return null}
}
function renderUndo(){
  const b=$id('undoSafetySnapshot'),meta=$id('undoSafetyMeta');if(!b||!meta)return;
  const s=latestSafetySnapshot();b.disabled=!s;
  meta.textContent=s?'Latest safety point: '+new Date(Number(s.at)||0).toLocaleString()+' · '+String(s.reason||'pre-change snapshot'):'No pre-destructive safety snapshot is currently retained.';
}
function restoreLatestSafety(){
  const s=latestSafetySnapshot();if(!s){renderUndo();return false}
  const when=new Date(Number(s.at)||0).toLocaleString(),reason=String(s.reason||'pre-change snapshot');
  if(!confirm('Restore the latest pre-destructive safety snapshot?\n\n'+when+' · '+reason+'\n\nCurrent state will first receive its own recovery snapshot, then live state will be replaced.'))return false;
  try{
    assertRestorableBackup(s.payload);
    const payload=s.payload;
    if(snapshotNow('before quick safety restore')===false)throw new Error('Could not create the pre-restore recovery point');
    restoreV9Payload(payload);render();toast('Latest safety snapshot restored');return true;
  }catch(err){alert('Safety restore blocked: '+(err?.message||err));render();return false}
}
function render(){
  renderUndo();
  const el=$id('recoveryFreshness');if(!el)return;
  const s=snapshot(),snap=s.lastSnapshot?new Date(s.lastSnapshot).toLocaleString():'none yet';
  if(s.storageFailed){el.dataset.state='bad';el.textContent='Recovery risk: browser storage reported a write failure. Export a full session backup now.';return}
  if(s.dirty&&!s.backupFresh){el.dataset.state='warn';el.textContent='Recovery risk: core state changed since the last restore point and the external backup is stale or missing. Last restore point: '+snap+'.';return}
  if(s.dirty){el.dataset.state='warn';el.textContent='Core state changed since the last restore point. External '+s.backupKind+' backup is fresh. Last restore point: '+snap+'.';return}
  el.dataset.state=s.backupFresh?'good':'warn';
  el.textContent='Core target/operations state matches the latest restore point ('+snap+'). '+(s.backupFresh?'External '+s.backupKind+' backup is fresh.':'External backup is stale or missing.');
}
function wrap(name,after){
  try{
    const base=globalThis[name];
    if(typeof base!=='function'||base.__oscpRecoveryWrapped)return;
    const wrapped=function(...args){const out=base.apply(this,args);after();return out};
    wrapped.__oscpRecoveryWrapped=true;globalThis[name]=wrapped;
  }catch(_){}
}
function install(){
  wrap('saveTargets',render);wrap('saveOps',render);wrap('snapshotNow',render);wrap('markExternalBackup',render);
  const baseSwitch=globalThis.switchView;
  if(typeof baseSwitch==='function'&&!baseSwitch.__oscpRecoveryWrapped){
    const wrapped=function(id,...args){const out=baseSwitch.call(this,id,...args);if(id==='sessionView')render();return out};
    wrapped.__oscpRecoveryWrapped=true;globalThis.switchView=wrapped;
  }
  $id('undoSafetySnapshot')?.addEventListener('click',restoreLatestSafety);
  document.addEventListener('visibilitychange',render,{passive:true});
  window.addEventListener('beforeunload',e=>{
    const s=snapshot();
    if(s.storageFailed||(s.dirty&&!s.backupFresh)){e.preventDefault();e.returnValue=''}
  },{capture:true});
  render();
  window.OSCP_RECOVERY_STATUS={snapshot,render,latestSafetySnapshot,restoreLatestSafety};
}
install();
})();