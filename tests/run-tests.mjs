import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
let passed=0;
const ok=(v,m='assertion failed')=>{if(!v)throw new Error(m)};
const eq=(a,b)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Error('expected '+JSON.stringify(b)+' got '+JSON.stringify(a))};
function test(n,fn){fn();passed++;console.log('✓ '+n)}

const sandbox={window:{}};vm.createContext(sandbox);
vm.runInContext(read('src/js/00-core-utils.js'),sandbox);
vm.runInContext(read('src/js/00-search-core.js'),sandbox);
vm.runInContext(read('src/js/00-service-router-core.js'),sandbox);
const u=sandbox.window.OSCP_UTILS,s=sandbox.window.OSCP_SEARCH_CORE,r=sandbox.window.OSCP_SERVICE_CORE;

test('build version consistency',()=>{const m=JSON.parse(read('src/meta/build.json')),p=JSON.parse(read('package.json'));eq(p.version,m.version);eq(m.label,'V'+m.version.split('.')[0])});
test('escapeHtml',()=>eq(u.escapeHtml(`<a x='y'>&"`),'&lt;a x=&#39;y&#39;&gt;&amp;&quot;'));
test('escapeHtml null-safe',()=>eq(u.escapeHtml(null),''));
test('clampExamPoints',()=>eq([u.clampExamPoints(-2),u.clampExamPoints(69.6),u.clampExamPoints(120),u.clampExamPoints('x')],[0,70,100,0]));
test('70-point threshold',()=>{const a=u.examScore(40,[10,10,10],70),b=u.examScore(0,[20,20,20],70);ok(a.passed&&a.total===70&&a.need===0);ok(!b.passed&&b.need===10)});
test('complete local evidence',()=>eq(u.evidenceMissing({ip:'10.10.10.10',status:{foothold:true},evidence:{enumRecorded:true,commandsRecorded:true,footholdRecorded:true,localRead:true,localSubmitted:true,localScreenshot:true},report:{title:'Initial access',commands:'exact commands'}}),[]));
test('proof evidence requirements',()=>{const m=u.evidenceMissing({ip:'10.10.10.10',status:{privesc:true},evidence:{enumRecorded:true,commandsRecorded:true},report:{title:'Root',commands:'steps'}});for(const x of ['PrivEsc reasoning recorded','proof.txt read at original location','proof flag submitted','Proof screenshot has proof + IP','Steps reproducible without memory'])ok(m.includes(x),x)});
test('empty target gate',()=>{const m=u.evidenceMissing({});ok(m.includes('Target IP'));ok(m.includes('No point-bearing objective marked as obtained'));ok(m.includes('Report title/finding'))});

test('Service Router parses Nmap TCP/UDP',()=>{const x=r.parseServices('22/tcp open ssh OpenSSH 8.9p1\n53/udp open domain\n161/udp open|filtered snmp');ok(x.mode==='Nmap normal');eq(x.endpoints.map(e=>e.port+'/'+e.proto),['22/tcp','53/udp','161/udp'])});
test('Service Router parses grepable Nmap',()=>{const x=r.parseServices('Host: 10.10.10.10 () Ports: 22/open/tcp//ssh///, 80/open/tcp//http///');ok(x.recognized);eq(x.endpoints.map(e=>e.port),[22,80])});
test('Service Router parses Masscan and RustScan',()=>{eq(r.parsePorts('Discovered open port 445/tcp on 10.0.0.2'),[445]);eq(r.parsePorts('Open 10.0.0.2:8080'),[8080])});
test('Service Router strict list ignores numeric prose',()=>{eq(r.parsePorts('22,80,445'),[22,80,445]);eq(r.parsePorts('target 10.10.10.10 latency 21 ms version 8.9'),[])});
test('Service Router rejects invalid/closed endpoints',()=>{eq(r.parsePorts('0,70000'),[]);eq(r.parsePorts('22/tcp filtered ssh'),[])});
test('Service Router prioritizes SMB before SSH',()=>eq(r.classify([22,445]).map(x=>x.name)[0],'RPC/SMB'));
test('Service Router leaves unknown ports unclassified',()=>eq(r.classify([31337]).length,0));

test('typo-tolerant search catches one-edit mistakes',()=>{ok(s.fuzzyScore({title:'SeImpersonate privilege',tags:['[WIN:SEIMPERSONATE]'],text:''},'seimpersonte')>0);ok(s.fuzzyScore({title:'Kerberoasting workflow',tags:['[AD:KERBEROS]'],text:''},'kerberost')>0)});
test('search typo tolerance does not match unrelated short noise',()=>eq(s.fuzzyScore({title:'SMB enumeration',tags:['[PORT:445]'],text:''},'xyz'),0));
test('Service Router degrades safely on truncated scan output',()=>{const x=r.parseServices('Nmap scan report for 10.10.10.10\\n22/tcp open ssh OpenSSH 9.2\\n80/tcp op');eq(x.endpoints.map(e=>e.port),[22])});
test('Service Router ignores numeric VPN/noise prose',()=>eq(r.parsePorts('Host 10.10.10.10 via tun0 latency 31 ms retry 2'),[]));
test('every reference fragment contributes structured IDs',()=>{const m=JSON.parse(read('src/content/manifest.json'));for(const f of m.files)ok(/<(?:h2|details)\\b[^>]*id=/.test(read('src/content/'+f)),f+' lacks structured reference IDs')});
test('critical exam reference anchors remain present',()=>{const all=JSON.parse(read('src/content/manifest.json')).files.map(f=>read('src/content/'+f)).join('\\n');for(const id of ['ref-read-this-first-2026-oscp-exam-operating-system','ref-9-6-ad-attack-path-methodology-build-the-graph-don-t-just-run-tools','ref-9-7-ad-cs-esc1-esc17-decision-tree'])ok(all.includes('id="'+id+'"'),id)});
test('V34 resilience and pure search layers are injected',()=>{const t=read('src/index.template.html');ok(t.includes('@inject:script:00-search-core.js'));ok(t.includes('@inject:style:14-v34-resilience.css'));ok(t.includes('@inject:script:20-v34-resilience.js'))});

test('generated artifact',()=>{const m=JSON.parse(read('src/meta/build.json')),h=read('index.html');ok(!/@inject:|__(?:OSCP_VERSION|OSCP_VERSION_LABEL|OSCP_BUILD_DATE)__/.test(h));ok(h.includes(m.label+' · EXAM ONLY · OFFLINE · NO AI'))});
test('browser Service Router delegates pure core',()=>ok(read('src/js/09-v20-service-router.js').includes('window.OSCP_SERVICE_CORE')));
test('research-backed scan workflow stays two-pass',()=>{
  const s=read('src/content/02-enumeration.html');
  ok(s.includes('Reliable Two-Pass Baseline'));
  ok(s.includes('CLEAN FULL-TCP DISCOVERY'));
  ok(!s.includes('Meanwhile, top 1000 with scripts'));
});
test('pivot proof ladder stays present',()=>ok(read('src/content/07-pivot-transfer-execution.html').includes('[PIVOT:PROOF]')));
test('output triage stays present',()=>ok(read('src/content/01-cockpit.html').includes('[OUTPUT:TRIAGE]')));
test('V33 integration source stays connected to live state',()=>{
  const s=read('src/js/19-v33-exam-integration.js');
  ok(s.includes('OSCP_SERVICE_CORE'));
  ok(s.includes('scanPreviewHosts'));
  ok(s.includes('importHostAndRoute'));
  ok(s.includes('preflightChecks'));
});
test('V33 template injects integration layer',()=>{
  const t=read('src/index.template.html');
  ok(t.includes('@inject:style:13-v33-exam-integration.css'));
  ok(t.includes('@inject:script:19-v33-exam-integration.js'));
});
console.log('\n'+passed+' tests passed');