import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../src/content/12-online-resources.html',import.meta.url),'utf8');
const manifest=JSON.parse(fs.readFileSync(new URL('../src/content/manifest.json',import.meta.url),'utf8'));

assert.ok(manifest.files.includes('12-online-resources.html'),'online resources must be part of the generated reference');
assert.match(html,/id="ref-22-online-resources"/,'online resource desk anchor must remain stable');

const required=[
 'https://help.offsec.com/hc/en-us/articles/360040165632-OSCP-Exam-Guide',
 'https://help.offsec.com/hc/en-us/articles/4412170923924-OSCP-Exam-FAQ',
 'https://help.offsec.com/hc/en-us/articles/35549468971156-AI-Usage-Policy-in-OffSec-Exams',
 'https://gtfobins.org/',
 'https://lolbas-project.github.io/',
 'https://wadcoms.github.io/',
 'https://bloodhound.specterops.io/home',
 'https://github.com/ly4k/Certipy/wiki',
 'https://www.netexec.wiki/',
 'https://portswigger.net/web-security',
 'https://github.com/swisskyrepo/PayloadsAllTheThings',
 'https://docs.ligolo.ng/',
 'https://www.revshells.com/',
 'https://www.exploit-db.com/',
 'https://packetstorm.news/',
 'https://nvd.nist.gov/vuln/search',
 'https://oscpdb.vercel.app/'
];
for(const url of required)assert.ok(html.includes(url),'missing required online resource: '+url);

const links=[...html.matchAll(/<a\s+[^>]*href="([^"]+)"[^>]*>/g)];
assert.ok(links.length>=17,'expected a useful but bounded resource list');
for(const match of links){
 const tag=match[0];
 assert.match(tag,/target="_blank"/,'external link must open separately: '+match[1]);
 assert.match(tag,/rel="noopener noreferrer"/,'external link must isolate opener: '+match[1]);
}

assert.doesNotMatch(html,/crackstation\.net|hashes\.com/i,'do not encourage uploading captured hashes to online cracking services');
assert.match(html,/Do not paste flags, credentials, hashes, tickets, dumps/i,'privacy warning must remain explicit');
assert.match(html,/AI\/LLM chatbots with direct prompt access are prohibited/i,'exam AI boundary must remain visible');
assert.match(html,/installed <code>-h\/-{2}help<\/code>/,'installed help should remain syntax authority');

console.log('online-resources tests passed');

assert.match(html,/\[ONLINE:OSCPDB\]/,'OSCPDB search tag must remain available');
assert.match(html,/pre-exam research resource/i,'OSCPDB must stay pre-exam rather than an exam-time AI dependency');
assert.match(html,/AI Reasoning/i,'OSCPDB AI boundary warning must remain visible');
assert.match(html,/does not make every feature exam-safe/i,'OSCPDB must not be presented as an OffSec whitelist');
