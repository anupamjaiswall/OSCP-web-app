/* V34.55 exam freeze: make encrypted-backup authentication failures actionable. */
(function(){
 if(typeof decryptPayload!=='function')return;
 const base=decryptPayload;
 decryptPayload=async function(container,pass){
  try{return await base(container,pass)}
  catch(e){
   if(e?.name==='OperationError')throw new Error('Wrong passphrase or corrupted backup file.');
   throw e;
  }
 };
})();
