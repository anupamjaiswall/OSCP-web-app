/* V34.50: transactional import safety — validate first, require a recovery snapshot, rollback automatically on restore failure. */
(function(root){
 'use strict';
 const MAX_IMPORT_BYTES=50_000_000;
 const SUPPORTED_SCHEMA_MAX=19;
 const isRecord=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
 function utf8Bytes(value){
  const s=String(value??'');
  try{return typeof TextEncoder!=='undefined'?new TextEncoder().encode(s).length:s.length*2}catch(_){return s.length*2}
 }
 function inspectBackupObject(obj){
  const issues=[],warnings=[];
  if(!isRecord(obj))return Object.freeze({ok:false,issues:Object.freeze(['backup must be a JSON object']),warnings:Object.freeze([]),stats:Object.freeze({app:'unknown',version:'unknown',targets:0,credentials:0,evidence:0})});
  const version=obj.version===undefined?null:Number(obj.version);
  if(version!==null&&(!Number.isFinite(version)||version<1))issues.push('backup version is invalid');
  if(Number.isFinite(version)&&version>SUPPORTED_SCHEMA_MAX)issues.push(`backup schema ${version} is newer than supported schema ${SUPPORTED_SCHEMA_MAX}`);
  if(version===null)warnings.push('backup has no explicit schema version; legacy compatibility rules will be used');
  if(!Array.isArray(obj.targets))issues.push('targets array missing');
  if(Array.isArray(obj.targets)){
   const ids=obj.targets.map(x=>String(x?.id||''));
   if(obj.targets.some(x=>!isRecord(x)))issues.push('target entry must be an object');
   if(ids.some(x=>!x.trim()))issues.push('target with missing ID');
   if(new Set(ids).size!==ids.length)issues.push('duplicate target IDs');
  }
  if(obj.credentials!==undefined&&!Array.isArray(obj.credentials))issues.push('credentials must be an array');
  if(obj.evidenceVault!==undefined&&!Array.isArray(obj.evidenceVault))issues.push('evidenceVault must be an array');
  if(Array.isArray(obj.targets)&&obj.activeTargetId&&!obj.targets.some(t=>t?.id===obj.activeTargetId))issues.push('activeTargetId is orphaned');
  const stats=Object.freeze({app:String(obj.app||'unknown'),version:version===null?'legacy':version,targets:Array.isArray(obj.targets)?obj.targets.length:0,credentials:Array.isArray(obj.credentials)?obj.credentials.length:0,evidence:Array.isArray(obj.evidenceVault)?obj.evidenceVault.length:0});
  return Object.freeze({ok:issues.length===0,issues:Object.freeze(issues),warnings:Object.freeze(warnings),stats});
 }
 function parseBackupText(text,maxBytes=MAX_IMPORT_BYTES){
  const raw=String(text??''),bytes=utf8Bytes(raw);
  if(bytes>maxBytes)return Object.freeze({ok:false,code:'oversized',bytes,issues:Object.freeze([`backup text exceeds ${maxBytes} byte safety limit`]),warnings:Object.freeze([]),object:null,stats:null});
  let obj;try{obj=JSON.parse(raw)}catch(e){return Object.freeze({ok:false,code:'json',bytes,issues:Object.freeze(['invalid or truncated JSON: '+e.message]),warnings:Object.freeze([]),object:null,stats:null})}
  const inspected=inspectBackupObject(obj);
  return Object.freeze({...inspected,code:inspected.ok?'ok':'schema',bytes,object:obj});
 }
 async function transactionalApply(candidate,ops){
  if(!ops||typeof ops.capture!=='function'||typeof ops.snapshot!=='function'||typeof ops.apply!=='function'||typeof ops.rollback!=='function')throw new Error('transaction operations are incomplete');
  const before=await ops.capture();
  const snap=await ops.snapshot();
  if(snap===false)throw new Error('Pre-restore recovery snapshot failed; import aborted before changing state.');
  try{
   await ops.apply(candidate);
   if(typeof ops.verify==='function')await ops.verify(candidate);
   return Object.freeze({ok:true,rolledBack:false,error:null});
  }catch(error){
   try{
    await ops.rollback(before);
    return Object.freeze({ok:false,rolledBack:true,error});
   }catch(rollbackError){
    const e=new Error('Restore failed and automatic rollback also failed. Use the pre-restore recovery snapshot. Restore error: '+(error?.message||error)+'; rollback error: '+(rollbackError?.message||rollbackError));
    e.restoreError=error;e.rollbackError=rollbackError;throw e;
   }
  }
 }
 root.OSCP_IMPORT_SAFETY_CORE=Object.freeze({MAX_IMPORT_BYTES,SUPPORTED_SCHEMA_MAX,utf8Bytes,inspectBackupObject,parseBackupText,transactionalApply});
 if(typeof document==='undefined')return;
 const $=id=>document.getElementById(id);
 function currentSessionWithSecrets(){
  if(typeof sessionPayload!=='function')throw new Error('session capture is unavailable');
  return JSON.parse(JSON.stringify(sessionPayload(true)));
 }
 function requireSnapshot(label){
  if(typeof snapshotNow!=='function')throw new Error('recovery snapshot function is unavailable');
  return snapshotNow(label);
 }
 function verifyRestoredSession(){
  if(typeof sessionPayload!=='function'||typeof v15BackupValidate!=='function')return true;
  const r=v15BackupValidate(sessionPayload(false));
  if(!r?.ok)throw new Error('post-restore state failed validation: '+(r?.issues||[]).join('; '));
  return true;
 }
 async function restoreSessionObject(obj,label){
  const tx=await transactionalApply(obj,{
   capture:currentSessionWithSecrets,
   snapshot:()=>requireSnapshot('before '+label),
   apply:o=>restoreV9Payload(o),
   verify:verifyRestoredSession,
   rollback:before=>restoreV9Payload(before)
  });
  if(!tx.ok){const msg='Restore failed; previous in-memory session was automatically restored and the pre-restore snapshot was retained. '+(tx.error?.message||tx.error||'');throw new Error(msg.trim())}
  return tx;
 }
 async function handleSessionImport(e){
  const input=e.currentTarget||e.target,file=input?.files?.[0];if(!file)return;
  try{
   if(typeof assertImportFileSize==='function')assertImportFileSize(file,'Session backup');
   const parsed=parseBackupText(await file.text());if(!parsed.ok)throw new Error(parsed.issues.join('; '));
   const integrity=typeof verifyBackupIntegrity==='function'?await verifyBackupIntegrity(parsed.object):{present:false};
   const obj=typeof assertRestorableBackup==='function'?assertRestorableBackup(parsed.object):parsed.object;
   await restoreSessionObject(obj,'session import');
   if(typeof toast==='function')toast(integrity?.present?'Session restored transactionally · SHA-256 verified':'Session restored transactionally · legacy/no checksum');
  }catch(err){alert('Invalid OSCP session JSON: '+(err?.message||err))}finally{if(input)input.value=''}
 }
 async function handleEncryptedImport(e){
  const input=e.currentTarget||e.target,file=input?.files?.[0],pass=$('encPassphrase')?.value||'';if(!file)return;
  if(!pass){alert('Enter the backup passphrase first.');input.value='';return}
  try{
   if(typeof assertImportFileSize==='function')assertImportFileSize(file,'Encrypted backup');
   let container;try{container=JSON.parse(await file.text())}catch(err){throw new Error('invalid or truncated encrypted JSON: '+err.message)}
   const decrypted=await decryptPayload(container,pass);
   const inspected=inspectBackupObject(decrypted);if(!inspected.ok)throw new Error(inspected.issues.join('; '));
   const obj=typeof assertRestorableBackup==='function'?assertRestorableBackup(decrypted):decrypted;
   await restoreSessionObject(obj,'encrypted restore');
   if(typeof toast==='function')toast('Encrypted backup restored transactionally');
  }catch(err){alert('Unable to decrypt/restore: '+(err?.message||err))}finally{input.value=''}
 }
 async function handleTargetImport(e){
  const input=e.currentTarget||e.target,file=input?.files?.[0];if(!file)return;
  try{
   if(typeof assertImportFileSize==='function')assertImportFileSize(file,'Target backup');
   const parsed=parseBackupText(await file.text());if(!parsed.ok)throw new Error(parsed.issues.join('; '));
   const incoming=typeof validateTargetImportObject==='function'?validateTargetImportObject(parsed.object):parsed.object.targets;
   const tx=await transactionalApply(incoming,{
    capture:currentSessionWithSecrets,
    snapshot:()=>requireSnapshot('before target-only import'),
    apply:list=>{const prepared=prepareTargetImport(list);sessionSecrets=prepared.secrets;targets=prepared.targets;activeTargetId=targets[0]?.id||'';saveTargets();renderTargets();renderAllV7()},
    verify:()=>{const r=inspectBackupObject({version:Math.min(SUPPORTED_SCHEMA_MAX,16),targets});if(!r.ok)throw new Error(r.issues.join('; '));return true},
    rollback:before=>restoreV9Payload(before)
   });
   if(!tx.ok)throw new Error('Target import failed; previous session was automatically restored. '+(tx.error?.message||tx.error||''));
   if(typeof toast==='function')toast('Targets imported transactionally');
  }catch(err){alert('Invalid target JSON: '+(err?.message||err))}finally{input.value=''}
 }
 function installStatus(){
  const card=$('reliabilitySafetyCard');if(!card||$('importSafetyStatus'))return false;
  const d=document.createElement('div');d.id='importSafetyStatus';d.className='tiny';d.style.marginTop='8px';d.textContent='Import guard: validate → require pre-restore snapshot → apply → verify → automatic rollback on restore error.';card.appendChild(d);return true;
 }
 function install(){
  const s=$('importSession'),e=$('importEncrypted'),t=$('importTargets');
  if(s){s.onchange=handleSessionImport;s.dataset.transactional='1'}
  if(e){e.onchange=handleEncryptedImport;e.dataset.transactional='1'}
  if(t){t.onchange=handleTargetImport;t.dataset.transactional='1'}
  if(!installStatus())setTimeout(installStatus,50);
  try{if(typeof V16_SELF_TESTS!=='undefined')V16_SELF_TESTS.push(
   ['V34.50 session imports are transactional',()=>[$('importSession')?.dataset.transactional==='1','session='+$('importSession')?.dataset.transactional]],
   ['V34.50 encrypted imports are transactional',()=>[$('importEncrypted')?.dataset.transactional==='1','encrypted='+$('importEncrypted')?.dataset.transactional]],
   ['V34.50 target imports are transactional',()=>[$('importTargets')?.dataset.transactional==='1','targets='+$('importTargets')?.dataset.transactional]]
  )}catch(_){}
 }
 root.OSCP_IMPORT_SAFETY=Object.freeze({inspect:inspectBackupObject,parse:parseBackupText,restoreObject:restoreSessionObject,status:()=>Object.freeze({session:$('importSession')?.dataset.transactional==='1',encrypted:$('importEncrypted')?.dataset.transactional==='1',targets:$('importTargets')?.dataset.transactional==='1'})});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0),{once:true});else setTimeout(install,0);
})(typeof window!=='undefined'?window:globalThis);
