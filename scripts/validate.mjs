import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=m=>{throw new Error(m)};
const html=read('index.html');
const meta=JSON.parse(read('src/meta/build.json'));
const quality=JSON.parse(read('src/meta/quality.json'));
const pkg=JSON.parse(read('package.json'));
const readme=read('README.md');
const changelog=read('CHANGELOG.md');

if(pkg.version!==meta.version) fail('package.json version does not match build metadata');
const expectedReadme='<!-- build-version:start -->\n**V'+meta.version+' — exam-time, offline-first OSCP/OSCP+ methodology and decision-support app.**\n<!-- build-version:end -->';
if(!readme.includes(expectedReadme))fail('README build version does not match build metadata; run npm run build');
const readmeReleaseHeads=[...readme.matchAll(/^### V\d+\.\d+\.\d+\b/gm)];
if(readmeReleaseHeads.length>3)fail('README release history exceeded the three-version limit; move older entries to CHANGELOG.md');
const changeHeads=[...changelog.matchAll(/^## V(\d+\.\d+\.\d+) — (\d{4}-\d{2}-\d{2})$/gm)];
if(!changeHeads.length||changeHeads[0][1]!==meta.version||changeHeads[0][2]!==meta.date)fail('CHANGELOG.md first release entry must match current build version/date');

if(!Number.isInteger(quality.artifactSoftLimitBytes)||!Number.isInteger(quality.artifactHardLimitBytes)||quality.artifactSoftLimitBytes<=0||quality.artifactHardLimitBytes<=quality.artifactSoftLimitBytes)fail('Invalid artifact size policy');
if(quality.artifactSoftLimitBytes>1_500_000)fail('Artifact soft-limit ratchet may not exceed 1.5 MB');
if(quality.artifactHardLimitBytes>1_750_000)fail('Artifact hard-limit ratchet may not exceed 1.75 MB without an explicit validator change');
const artifactBytes=Buffer.byteLength(html);
if(artifactBytes>quality.artifactHardLimitBytes)fail('Generated index.html exceeds hard size budget: '+artifactBytes+' > '+quality.artifactHardLimitBytes);
if(artifactBytes>quality.artifactSoftLimitBytes)console.warn('WARNING: generated index.html is above the soft size budget: '+artifactBytes+' > '+quality.artifactSoftLimitBytes);

if(/@inject:|__(?:OSCP_VERSION|OSCP_VERSION_LABEL|OSCP_BUILD_DATE)__/.test(html)) fail('Unresolved build marker');
for(const directive of ["default-src 'none'","connect-src 'none'","object-src 'none'","frame-src 'none'","form-action 'none'","base-uri 'none'"]){
  if(!html.includes(directive))fail('CSP directive missing: '+directive);
}
if(/<script\b[^>]*\bsrc\s*=/i.test(html)) fail('Runtime script source detected');
if(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref\s*=/i.test(html)) fail('Runtime stylesheet detected');
if(/<(?:script|img|link)\b[^>]*(?:src|href)=["']https?:\/\//i.test(html)) fail('Remote runtime resource detected');
const structuralEscapedNewline=/<\/script>\\n(?=<(?:main|section)\b)/i;
if(structuralEscapedNewline.test(html)) fail('Literal \\n found between a parser-stage script and structural content');
if(structuralEscapedNewline.test(read('src/index.template.html'))) fail('Template contains a structural literal \\n after a parser-stage script');

const idManifest=JSON.parse(read('src/content/manifest.json'));
const idReference=idManifest.files.map(f=>read('src/content/'+f)).join('');
const staticAuditHtml=read('src/index.template.html')+idReference;
const baseCss=read('src/styles/00-base.css');
const usedGridSpans=[...new Set([...staticAuditHtml.matchAll(/\bclass=["'][^"']*\b(span\d+)\b[^"']*["']/gi)].map(m=>m[1].toLowerCase()))];
const missingGridSpans=usedGridSpans.filter(cls=>{const n=cls.replace('span','');return !baseCss.includes('.'+cls+'{grid-column:span '+n+'}')});
if(missingGridSpans.length) fail('Undefined base grid span class(es): '+missingGridSpans.join(', '));
const idMatches=[...staticAuditHtml.matchAll(/\bid=["']([^"']+)["']/gi)],ids=idMatches.map(m=>m[1]),seen=new Set(),dupes=[];
for(const id of ids){if(seen.has(id))dupes.push(id);seen.add(id)}
if(dupes.length) fail('Duplicate static IDs: '+[...new Set(dupes)].join(', '));
const hrefs=[...staticAuditHtml.matchAll(/\bhref=["']#([^"']+)["']/gi)].map(m=>m[1]);
const missing=[...new Set(hrefs.filter(id=>!seen.has(id)))];
if(missing.length) fail('Broken anchors: '+missing.join(', '));

const jsFiles=fs.readdirSync(path.join(root,'src/js')).filter(x=>x.endsWith('.js')).sort();
const js=jsFiles.map(f=>read('src/js/'+f)).join('\n');
const templateHtml=read('src/index.template.html');
const callableStatic=templateHtml+'\n'+js;
const viewIds=new Set([...templateHtml.matchAll(/<section\b[^>]*>/gi)].map(m=>{const tag=m[0],id=tag.match(/\bid=["']([^"']+)["']/i)?.[1]||'',cls=tag.match(/\bclass=["']([^"']+)["']/i)?.[1]||'';return /(?:^|\s)view(?:\s|$)/.test(cls)?id:''}).filter(Boolean));
const literalViewTargets=[...new Set([...callableStatic.matchAll(/\bswitchView\(\s*["']([^"']+)["']/g)].map(m=>m[1]))];
const brokenViewTargets=literalViewTargets.filter(id=>!viewIds.has(id));
if(brokenViewTargets.length) fail('Broken switchView target(s): '+brokenViewTargets.join(', '));
const literalRefTargets=[...new Set([...callableStatic.matchAll(/\bopenRef\(\s*["']([^"']+)["']/g)].map(m=>m[1]))];
const brokenRefTargets=literalRefTargets.filter(id=>!seen.has(id));
if(brokenRefTargets.length) fail('Broken openRef target(s): '+brokenRefTargets.join(', '));
const ariaIdRefs=[...staticAuditHtml.matchAll(/\b(?:aria-controls|aria-labelledby|aria-describedby|for)=["']([^"']+)["']/gi)].flatMap(m=>m[1].split(/\s+/).filter(Boolean));
const brokenAriaRefs=[...new Set(ariaIdRefs.filter(id=>!seen.has(id)))];
if(brokenAriaRefs.length) fail('Broken ARIA/label target(s): '+brokenAriaRefs.join(', '));

if(!Number.isInteger(quality.maxInnerHTMLAssignments)||quality.maxInnerHTMLAssignments<0)fail('Invalid innerHTML ratchet');
if(quality.maxInnerHTMLAssignments>174)fail('innerHTML ratchet may only move downward from the V34.46 baseline of 174');
const inner=(js.match(/\.innerHTML\s*=/g)||[]).length;
if(inner>quality.maxInnerHTMLAssignments) fail('innerHTML assignments exceed ratchet: '+inner+' > '+quality.maxInnerHTMLAssignments);
if(!Number.isInteger(quality.maxCoreAppBytes)||quality.maxCoreAppBytes<=0)fail('Invalid legacy-core size ratchet');
if(quality.maxCoreAppBytes>340_000)fail('Legacy-core size ratchet may only move downward from 340000 bytes');
const coreBytes=Buffer.byteLength(read('src/js/03-core-app.js'));
if(coreBytes>quality.maxCoreAppBytes)fail('03-core-app.js exceeded ratchet: '+coreBytes+' > '+quality.maxCoreAppBytes+'; extract logic instead of growing the legacy core');

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
let renderedReference='';try{renderedReference=JSON.parse(payloadText.trim())}catch(e){fail('Reference payload JSON is invalid')}
if(typeof renderedReference!=='string'||!renderedReference.length)fail('Reference payload is empty');
const renderedH2=(renderedReference.match(/<h2\s+id=/g)||[]).length;
if(renderedH2!==sourceH2) fail('Generated reference payload section count differs from source: '+renderedH2+' vs '+sourceH2);
const liveReference=html.match(/<article class="reference" id="referenceRoot">([\s\S]*?)<\/article>/i)?.[1]||'';
if(/<h2\s+id=/i.test(liveReference))fail('Deep reference returned to parser-critical DOM');

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
console.log('Validation passed: '+meta.label+' '+meta.version+', '+ids.length+' IDs, '+sourceH2+' reference sections, '+inner+'/'+quality.maxInnerHTMLAssignments+' innerHTML, core '+coreBytes+'/'+quality.maxCoreAppBytes+' bytes, artifact '+artifactBytes+'/'+quality.artifactHardLimitBytes+' bytes');
