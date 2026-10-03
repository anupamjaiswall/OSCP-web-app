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

// Windows Strategy is a large exam-time decision module. Keep direct contracts on
// its critical deterministic data/functions so refactors cannot silently erase a
// workflow that browser smoke tests only reach incidentally.
test('Windows strategy keeps deterministic AD failure classifier',()=>{
  const b=block(windows,'const AD_FAILURE_RULES=','function classifyAdFailure');
  for(const needle of ['KRB_AP_ERR_SKEW','STATUS_ACCOUNT_LOCKED_OUT','STATUS_LOGON_FAILURE','Pwn3d','admin'])ok(b.includes(needle),'missing classifier signal '+needle);
  ok(windows.includes('function classifyAdFailure(value)'),'classifyAdFailure missing');
});

test('Windows strategy preserves ordered post-shell methodology',()=>{
  const b=block(windows,'const WINDOWS_STRATEGY_STEPS=','const WINDOWS_STRATEGY_BY_ID');
  const ids=[...b.matchAll(/\bid:'([^']+)'/g)].map(m=>m[1]);
  ok(ids.length>=10,'too few Windows strategy steps: '+ids.length);
  for(const id of ['baseline','creds','privileges','services','tasks','cve'])ok(ids.includes(id),'missing Windows step '+id);
  ok(ids.indexOf('cve')>ids.indexOf('services'),'CVE step must remain after configuration paths');
});

test('Windows strategy retains high-signal privilege branches',()=>{
  for(const tag of ['[WIN:SEIMPERSONATE]','[WIN:SERVICE]','[WIN:TASK]','[WIN:DPAPI]'])ok(windows.includes(tag),'missing '+tag);
  ok(windows.includes('V16_SELF_TESTS.push'),'embedded browser self-tests missing');
});

// Handoff/Access Truth owns resume-packet safety and access-state semantics. These
// contracts intentionally reference the module directly rather than relying on an
// incidental mention in the monolithic regression file.
test('Handoff resume packet fields stay complete',()=>{
  const b=block(handoff,'const V19_RESUME_FIELDS=','const ACCESS_OUTCOMES');
  for(const key of ['target','access','working','failures','next','evidence'])ok(b.includes("'"+key+"'"),'missing resume field '+key);
  ok(handoff.includes('function resumePacketCompleteness(packet)'),'resume completeness function missing');
  ok(handoff.includes('function resumePacketSecretRisks(value)'),'resume secret scanner missing');
});

test('Handoff secret scanner retains high-risk material detectors',()=>{
  const b=block(handoff,'function resumePacketSecretRisks(value)','function resumePacketCompleteness');
  for(const signal of ['PRIVATE KEY','NTLM','password','token'])ok(b.toLowerCase().includes(signal.toLowerCase()),'missing secret-risk signal '+signal);
});

test('Access truth keeps ordered outcomes and stale-state guard',()=>{
  const b=block(handoff,'const ACCESS_OUTCOMES=','const ACCESS_PROTOCOLS');
  for(const state of ['untested','failed','valid','admin'])ok(b.includes("id:'"+state+"'"),'missing access outcome '+state);
  ok(handoff.includes('function accessOutcomeRank(id)'),'accessOutcomeRank missing');
  ok(handoff.includes('function accessRecordStale(record,target)'),'accessRecordStale missing');
  ok(handoff.includes('function accessLadderNext'),'accessLadderNext missing');
});

test('Access truth retains core remote-access protocols',()=>{
  const b=block(handoff,'const ACCESS_PROTOCOLS=','function v19Text');
  for(const p of ['SMB','WINRM','RDP','SSH','MSSQL','LDAP','KERBEROS'])ok(b.includes("'"+p+"'"),'missing protocol '+p);
});

if(!process.exitCode)console.log(`major-module tests passed (${passed})`);
