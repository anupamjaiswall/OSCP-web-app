import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'src/js/25-v35-reliability-safety.js'),'utf8');
const ctx={console};vm.createContext(ctx);vm.runInContext(src,ctx);
const c=ctx.OSCP_RELIABILITY_CORE||ctx.globalThis?.OSCP_RELIABILITY_CORE;if(!c)throw new Error('reliability core missing');
const ok=(v,m)=>{if(!v)throw new Error(m)};

const usage=c.storageUsage([['other','x'.repeat(100)],['oscp_v16_a','x'.repeat(1000)],['oscp_v16_b','y'.repeat(1000)]],'oscp_v16_',10000);
ok(usage.keys===2,'prefix filtering failed');ok(usage.bytes>4000&&usage.bytes<5000,'UTF-16 byte estimate unexpected');ok(usage.warning===false,'small usage should not warn');
const high=c.storageUsage([['oscp_v16_big','x'.repeat(4000)]],'oscp_v16_',10000);ok(high.warning===true,'70% storage warning did not trigger');

const findings=c.scanSecretLikeText({notes:'password=ExampleSecret123',report:{body:'$krb5asrep$23$user@LAB:deadbeef'},safe:'10.10.10.10 nmap -sC -sV'});
ok(findings.some(x=>x.kind==='credential label'),'credential label not detected');ok(findings.some(x=>x.kind==='Kerberos hash'),'Kerberos material not detected');ok(findings.every(x=>!Object.prototype.hasOwnProperty.call(x,'value')),'secret scanner exposed matched value');
ok(c.scanSecretLikeText({notes:'nmap -p- 10.10.10.10; enumerate every service'}).length===0,'benign text false positive');

const now=1_000_000;ok(c.backupFreshness({at:now-1000,kind:'session'},now).fresh===true,'fresh backup marked stale');ok(c.backupFreshness({at:now-c.BACKUP_FRESH_MS-1,kind:'session'},now).fresh===false,'stale backup marked fresh');ok(c.backupFreshness({},now).fresh===false,'missing backup marked fresh');
const summary=c.preflightSummary([{state:'pass'},{state:'warn'},{state:'fail'},{state:'pass'}]);ok(summary.pass===2&&summary.warn===1&&summary.fail===1&&summary.ok===false,'preflight summary incorrect');

console.log('reliability-safety tests passed');
