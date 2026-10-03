import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const windows=read('src/js/05-windows-strategy.js');
const handoff=read('src/js/06-handoff-access-truth.js');
let passed=0;
function test(name,fn){try{fn();passed++;console.log('✓ '+name)}catch(e){console.error('✗ '+name+' — '+e.message);process.exitCode=1}}
function ok(v,m='assertion failed'){if(!v)throw new Error(m)}
function block(src,start,end){const a=src.indexOf(start);ok(a>=0,'missing '+start);const b=src.indexOf(end,a+start.length);ok(b>a,'missing block end for '+start);return src.slice(a,b)}

// Direct contracts for the large Windows strategy module.
test('Windows strategy keeps deterministic AD failure classifier',()=>{
  const b=block(windows,'const AD_FAILURE_RULES=','function classifyAdFailure');
  for(const needle of ['KRB_AP_ERR_SKEW','STATUS_ACCOUNT_LOCKED_OUT','STATUS_LOGON_FAILURE','Pwn3d!','STATUS_ACCESS_DENIED'])ok(b.includes(needle),'missing classifier signal '+needle);
  ok(windows.includes('function classifyAdFailure(value)'),'classifyAdFailure missing');
  ok(windows.includes('unicodeProblems(raw)'),'Unicode guard missing from classifier');
  ok(windows.includes('sanitizeUnicode(raw)'),'Unicode sanitization missing from classifier');
});

test('Windows strategy preserves AD edge planning and rollback discipline',()=>{
  const b=block(windows,'const AD_EDGE_PLANS=','function ');
  for(const id of ['generic-user','write-spn','add-member','force-password','write-dacl'])ok(b.includes("id:'"+id+"'"),'missing AD edge plan '+id);
  for(const field of ['prereq:','read:','action:','verify:','rollback:','caveat:'])ok(b.includes(field),'missing AD edge plan field '+field);
  ok(b.includes('NO SAFE GENERIC ROLLBACK'),'high-risk password-reset warning missing');
});

test('Windows strategy keeps exact release and failure-decoder integration',()=>{
  ok(windows.includes("const OSCP_RELEASE_VERSION='V19'"),'release marker missing');
  ok(windows.includes('function renderAdFailureDecoder()'),'failure decoder renderer missing');
  ok(windows.includes('AD_FAST_STEPS'),'AD fast-step model missing');
});

// Direct contracts for the large handoff/access-truth module.
test('Handoff resume packet fields stay complete',()=>{
  const b=block(handoff,'const V19_RESUME_FIELDS=','const ACCESS_OUTCOMES');
  for(const key of ['access','evidence','hypothesis','prerequisite','nextCommand','reentry'])ok(b.includes("['"+key+"'"),'missing resume field '+key);
  ok(handoff.includes('function resumePacketCompleteness(packet)'),'resume completeness function missing');
  ok(handoff.includes('function resumePacketSecretRisks(value)'),'resume secret scanner missing');
});

test('Handoff secret scanner retains high-risk material detectors',()=>{
  const b=block(handoff,'function resumePacketSecretRisks(value)','function upgradeV19Target');
  for(const signal of ['PRIVATE KEY','krb5tgs','NTLM','inline secret assignment','literal command-line password'])ok(b.toLowerCase().includes(signal.toLowerCase()),'missing secret-risk signal '+signal);
});

test('Access truth keeps ordered outcomes and stale-state guard',()=>{
  const b=block(handoff,'const ACCESS_OUTCOMES=','const ACCESS_PROTOCOLS');
  for(const state of ['untested','transport','rejected','authenticated','resource','command','shell','admin'])ok(b.includes("id:'"+state+"'"),'missing access outcome '+state);
  ok(handoff.includes('function accessOutcomeRank(id)'),'accessOutcomeRank missing');
  ok(handoff.includes('function accessRecordStale(record,t)'),'accessRecordStale missing');
  ok(handoff.includes('function accessLadderNext(protocolId,status)'),'accessLadderNext missing');
});

test('Access truth retains core Windows/domain remote-access protocols',()=>{
  const b=block(handoff,'const ACCESS_PROTOCOLS=','function v19Text');
  for(const p of ['SMB','LDAP','WinRM','RDP','MSSQL','WMI'])ok(b.includes("label:'"+p+"'"),'missing protocol '+p);
  for(const port of ['445','389','5985','3389','1433','135'])ok(b.includes(port),'missing expected access port '+port);
});

if(!process.exitCode)console.log(`major-module tests passed (${passed})`);
