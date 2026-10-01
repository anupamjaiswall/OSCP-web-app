/* V34.38: interactive proof-closure guard based on current OffSec proof requirements. */
(function(root){
 'use strict';
 const ITEMS=Object.freeze([
  'Interactive target shell is still open.',
  'Proof was read with cat/type from its original location.',
  'Screenshot contains the target IP and full proof contents.',
  'Exact proof value was submitted in the Exam Control Panel.',
  'Proof path, commands, screenshot filename and shell path were recorded.'
 ]);
 const COMMANDS=Object.freeze({
  linux:"ip addr; cat /absolute/path/to/local-or-proof.txt",
  windows:"ipconfig & type C:\\absolute\\path\\to\\local-or-proof.txt"
 });
 function closureStatus(values){
  const list=Array.from(values||[]);
  const checked=list.filter(Boolean).length;
  return Object.freeze({checked,total:ITEMS.length,complete:checked===ITEMS.length});
 }
 root.OSCP_PROOF_BANK_CORE=Object.freeze({ITEMS,COMMANDS,closureStatus});
 if(typeof document==='undefined')return;

 const m=document.getElementById('examBankModal');
 const b=document.getElementById('examBankBtn');
 const c=document.getElementById('examBankClose');
 if(!m||!b||!c)return;
 const dialog=m.querySelector('.examBankDialog');
 const actions=m.querySelector('.examBankActions');
 let checks=[];
 let statusNode=null;

 function el(tag,className,text){
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=text;
  return node;
 }
 function toastSafe(message){
  if(typeof root.toast==='function')root.toast(message);
 }
 async function copyCommand(kind){
  const command=COMMANDS[kind];
  const ok=typeof root.copyText==='function'?await root.copyText(command):false;
  toastSafe(ok?(kind==='linux'?'Linux proof command copied':'Windows proof command copied'):'Copy blocked — command remains visible below');
  return ok;
 }
 function resetChecklist(){
  checks.forEach(input=>{input.checked=false});
  updateStatus();
 }
 function updateStatus(){
  if(!statusNode)return;
  const state=closureStatus(checks.map(input=>input.checked));
  statusNode.className='examBankClosureStatus '+(state.complete?'complete':'pending');
  statusNode.textContent=state.complete
   ? state.checked+'/'+state.total+' checked · MANUALLY VERIFY'
   : state.checked+'/'+state.total+' checked · NOT CLOSED';
 }
 function installClosureGuard(){
  if(!dialog||document.getElementById('examBankClosure'))return;
  const box=el('section','examBankClosure');
  box.id='examBankClosure';
  box.setAttribute('aria-labelledby','examBankClosureTitle');

  const head=el('div','examBankClosureHead');
  const titleWrap=el('div');
  const title=el('h3','', 'Proof closure checklist');
  title.id='examBankClosureTitle';
  const subtitle=el('div','muted','Use this as a temporary closure guard only. The app never certifies or awards points.');
  titleWrap.append(title,subtitle);
  statusNode=el('span','examBankClosureStatus pending','0/'+ITEMS.length+' checked · NOT CLOSED');
  statusNode.setAttribute('role','status');
  statusNode.setAttribute('aria-live','polite');
  head.append(titleWrap,statusNode);

  const list=el('div','examBankClosureGrid');
  checks=ITEMS.map((text,index)=>{
   const label=el('label','examBankClosureItem');
   const input=document.createElement('input');
   input.type='checkbox';
   input.dataset.proofBankCheck=String(index+1);
   input.addEventListener('change',updateStatus);
   const span=el('span','',text);
   label.append(input,span);
   list.append(label);
   return input;
  });

  const commandBox=el('div','examBankCaptureBox');
  const commandHead=el('div','examBankCaptureHead');
  const commandTitle=el('div');
  commandTitle.append(el('b','', 'Fast proof capture'),el('div','tiny','Replace the placeholder with the exact original proof path. Keep IP + proof output visible for the screenshot.'));
  const commandActions=el('div','examBankCaptureActions');
  const linuxBtn=el('button','btn','Copy Linux');linuxBtn.type='button';linuxBtn.id='examBankCopyLinux';
  const windowsBtn=el('button','btn','Copy Windows');windowsBtn.type='button';windowsBtn.id='examBankCopyWindows';
  const resetBtn=el('button','btn','Reset checklist');resetBtn.type='button';resetBtn.id='examBankResetChecklist';
  linuxBtn.addEventListener('click',()=>{void copyCommand('linux')});
  windowsBtn.addEventListener('click',()=>{void copyCommand('windows')});
  resetBtn.addEventListener('click',resetChecklist);
  commandActions.append(linuxBtn,windowsBtn,resetBtn);
  commandHead.append(commandTitle,commandActions);
  const commands=el('div','examBankCommandGrid');
  const linuxPre=el('pre','examBankCommand',COMMANDS.linux);
  const windowsPre=el('pre','examBankCommand',COMMANDS.windows);
  commands.append(linuxPre,windowsPre);
  commandBox.append(commandHead,commands);

  const ruleNote=el('div','examBankRuleNote');
  ruleNote.append(el('b','', 'Rules snapshot · 1 Oct 2026: '),document.createTextNode('proof must be read in an interactive shell with cat/type from the original location; the screenshot must include target IP + proof contents; Control Panel submission is required before the exam ends. The live OffSec guide and your Exam Control Panel always override this offline snapshot.'));

  box.append(head,list,commandBox,ruleNote);
  if(actions)dialog.insertBefore(box,actions);else dialog.append(box);
  updateStatus();
 }

 const open=()=>{
  installClosureGuard();
  resetChecklist();
  m.classList.add('open');
  m.setAttribute('aria-hidden','false');
  c.focus();
 };
 const close=()=>{
  m.classList.remove('open');
  m.setAttribute('aria-hidden','true');
  b.focus();
 };
 b.onclick=open;
 c.onclick=close;
 m.onclick=e=>{if(e.target===m)close()};
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&m.classList.contains('open')){e.preventDefault();close()}
  else if(e.altKey&&!e.ctrlKey&&!e.metaKey&&String(e.key).toLowerCase()==='b'){e.preventDefault();open()}
 });
 document.getElementById('examBankTarget')?.addEventListener('click',()=>{close();try{root.switchView('workspaceView')}catch(e){}});
 document.getElementById('examBankEvidence')?.addEventListener('click',()=>{
  close();
  const q=document.getElementById('globalSearch');
  if(!q)return;
  q.value='[EVIDENCE:PACKET]';
  try{root.switchView('searchView');root.renderSearch(q.value)}catch(e){q.dispatchEvent(new Event('input',{bubbles:true}))}
 });
 document.getElementById('examBankVerify')?.addEventListener('click',()=>{
  close();
  try{root.switchView('reportsView');root.renderReport();toastSafe('Verify the report/evidence gate — this dialog never marks points as banked')}catch(e){}
 });
 installClosureGuard();
 root.OSCP_PROOF_BANK=Object.freeze({open,close,resetChecklist,updateStatus});
})(typeof window!=='undefined'?window:globalThis);
