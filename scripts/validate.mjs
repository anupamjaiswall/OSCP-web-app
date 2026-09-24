import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=m=>{throw new Error(m)};
const html=read('index.html');
const meta=JSON.parse(read('src/meta/build.json'));
const pkg=JSON.parse(read('package.json'));

if(pkg.version!==meta.version) fail('package.json version does not match build metadata');
if(/@inject:|__(?:OSCP_VERSION|OSCP_VERSION_LABEL|OSCP_BUILD_DATE)__/.test(html)) fail('Unresolved build marker');
for(const directive of ["default-src 'none'","connect-src 'none'","object-src 'none'","frame-src 'none'","form-action 'none'","base-uri 'none'"]){
  if(!html.includes(directive))fail('CSP directive missing: '+directive);
}
if(Buffer.byteLength(html)>1_500_000)fail('Generated index.html exceeds 1.5 MB size budget');
if(/<script\b[^>]*\bsrc\s*=/i.test(html)) fail('Runtime script source detected');
if(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref\s*=/i.test(html)) fail('Runtime stylesheet detected');
if(/<(?:script|img|link)\b[^>]*(?:src|href)=["']https?:\/\//i.test(html)) fail('Remote runtime resource detected');

const payloadStart='<script type="application/json" id="referencePayload">';
const payloadAt=html.indexOf(payloadStart),payloadEnd=payloadAt>=0?html.indexOf('</script>',payloadAt):-1;
const structuralHtml=payloadAt>=0&&payloadEnd>=0?html.slice(0,payloadAt)+html.slice(payloadEnd+9):html;
const domAuditHtml=structuralHtml
  .replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi,'$1</script>')
  .replace(/(<style\b[^>]*>)[\s\S]*?<\/style>/gi,'$1</style>');
const ids=[...domAuditHtml.matchAll(/\bid=["']([^"']+)["']/gi)].map(m=>m[1]),seen=new Set(),dupes=[];
for(const id of ids){if(seen.has(id))dupes.push(id);seen.add(id)}
if(dupes.length) fail('Duplicate IDs: '+[...new Set(dupes)].join(', '));
const hrefs=[...domAuditHtml.matchAll(/\bhref=["']#([^"']+)["']/gi)].map(m=>m[1]);
const missing=[...new Set(hrefs.filter(id=>!seen.has(id)))];
if(missing.length) fail('Broken anchors: '+missing.join(', '));

const jsFiles=fs.readdirSync(path.join(root,'src/js')).filter(x=>x.endsWith('.js')).sort();
const js=jsFiles.map(f=>read('src/js/'+f)).join('\n');
const inner=(js.match(/\.innerHTML\s*=/g)||[]).length;
if(inner>174) fail('innerHTML assignments increased above audited baseline: '+inner);

const util=read('src/js/00-core-utils.js');
if(!util.includes("'&#39;'")) fail('Single-quote escaping missing');
for(const f of jsFiles.filter(x=>x!=='00-core-utils.js')) if(/replace\(\/\[&<>/.test(read('src/js/'+f))) fail('Local HTML escaping remains in '+f);
const aliases=(js.match(/function\s+esc\(s\)\{return window\.OSCP_UTILS\.escapeHtml\(s\)\}/g)||[]).length;
if(aliases!==4) fail('Expected 4 legacy esc aliases, got '+aliases);

if(!read('src/js/09-v20-service-router.js').includes('window.OSCP_SERVICE_CORE')) fail('Service Router browser layer is not delegating to pure core');
if(!read('src/js/00-service-router-core.js').includes('root.OSCP_SERVICE_CORE')) fail('Service Router pure core export missing');

const manifest=JSON.parse(read('src/content/manifest.json'));
const reference=manifest.files.map(f=>read('src/content/'+f)).join('');
const sourceH2=(reference.match(/<h2\s+id=/g)||[]).length;
if(sourceH2<39) fail('Reference section count dropped below baseline: '+sourceH2);
const payloadText=html.match(/<script type="application\/json" id="referencePayload">([\s\S]*?)<\/script>/i)?.[1]||'';
let renderedReference='';try{renderedReference=JSON.parse(payloadText)}catch(e){fail('Reference payload JSON is invalid')}
if(typeof renderedReference!=='string'||!renderedReference.length)fail('Reference payload is empty');
const renderedH2=(renderedReference.match(/<h2\s+id=/g)||[]).length;
if(renderedH2!==sourceH2) fail('Generated reference payload section count differs from source: '+renderedH2+' vs '+sourceH2);
if(/<article class="reference" id="referenceRoot">[\s\S]*?<h2\s+id=/i.test(html))fail('Deep reference returned to parser-critical DOM');

if(!html.includes(meta.label+' · EXAM ONLY · OFFLINE · NO AI')) fail('Build badge/version mismatch');
if(!html.includes('name="oscp-build-version" content="'+meta.version+'"')) fail('Build version meta missing');
if(!html.includes('name="oscp-build-date" content="'+meta.date+'"')) fail('Build date meta missing');
if(!html.includes("version:'"+meta.version+"'")||!html.includes("label:'"+meta.label+"'")) fail('OSCP_BUILD runtime metadata mismatch');
if(!html.includes('window.OSCP_UTILS.examScore(ad,ss,70)')) fail('Score utility not wired');
if(!html.includes('window.OSCP_UTILS.evidenceMissing(t)')) fail('Evidence utility not wired');

for(const id of ['toast','serviceParseSummary','scoreSummary','attemptDuplicateHint']){
  const tag=html.match(new RegExp('<[^>]+id="'+id+'"[^>]*>','i'))?.[0]||'';
  if(!/aria-live=["']polite["']/i.test(tag)) fail('Accessibility live-region missing for #'+id);
}
console.log('Validation passed: '+meta.label+', '+ids.length+' IDs, '+sourceH2+' reference sections, '+inner+' innerHTML assignments');
