import fs from 'node:fs';

const files=['src/js/03-core-app.js','src/js/06-handoff-access-truth.js'];
const selectors=['importSession','importEncrypted','importTargets'];
const fix=process.argv.includes('--fix');

function statementEnd(src,start){
  const brace=src.indexOf('{',start);if(brace<0)throw new Error('handler body not found');
  let depth=0,quote='',escape=false,lineComment=false,blockComment=false;
  for(let i=brace;i<src.length;i++){
    const c=src[i],n=src[i+1]||'';
    if(lineComment){if(c==='\n')lineComment=false;continue}
    if(blockComment){if(c==='*'&&n==='/'){blockComment=false;i++}continue}
    if(quote){if(escape){escape=false;continue}if(c==='\\'){escape=true;continue}if(c===quote){quote='';continue}if(quote!=='`')continue}
    if(c==='/'&&n==='/'){lineComment=true;i++;continue}
    if(c==='/'&&n==='*'){blockComment=true;i++;continue}
    if(c==='\''||c==='"'||c==='`'){quote=c;continue}
    if(c==='{')depth++;else if(c==='}'&&--depth===0){let end=i+1;while(/[ \t]/.test(src[end]||''))end++;if(src[end]===';')end++;if(src[end]==='\r')end++;if(src[end]==='\n')end++;return end}
  }
  throw new Error('unterminated handler');
}
function removeHandlers(src,id){const needle=`$('#${id}').onchange=async e=>{`;let removed=0,pos=0;while((pos=src.indexOf(needle,pos))>=0){const end=statementEnd(src,pos);src=src.slice(0,pos)+src.slice(end);removed++}return{src,removed}}
function unifySchema(src){
  let next=src;
  next=next.replaceAll('version:19','version:SESSION_SCHEMA_VERSION');
  next=next.replaceAll('o.version=19','o.version=SESSION_SCHEMA_VERSION');
  next=next.replace('o.version=16;o.ruleSnapshot=V16_RULE_VERIFIED','o.version=SESSION_SCHEMA_VERSION;o.ruleSnapshot=V16_RULE_VERIFIED');
  next=next.replace('if(o.version&&+o.version>19)issues.push(`backup schema ${o.version} is newer than supported schema 19`)','if(o.version&&+o.version>SESSION_SCHEMA_VERSION)issues.push(`backup schema ${o.version} is newer than supported schema ${SESSION_SCHEMA_VERSION}`)');
  next=next.replaceAll('sessionPayload(false).version===19','sessionPayload(false).version===SESSION_SCHEMA_VERSION');
  return next;
}
let handlerTotal=0,changedFiles=0;
for(const file of files){
  let src=fs.readFileSync(file,'utf8'),removed=0;
  for(const id of selectors){const r=removeHandlers(src,id);src=r.src;removed+=r.removed}
  handlerTotal+=removed;
  const unified=unifySchema(src),changed=unified!==fs.readFileSync(file,'utf8');
  if(fix&&changed){fs.writeFileSync(file,unified);changedFiles++}
  console.log(`${file}: handlers=${removed}, schemaRewrite=${unified!==src?'yes':'no'}, ${fix?(changed?'updated':'clean'):'checked'}`);
}
if(!fix){
  if(handlerTotal)throw new Error(`Found ${handlerTotal} legacy import onchange handler(s); only src/js/26-v35-import-safety.js may own import handlers.`);
  for(const file of files){const src=fs.readFileSync(file,'utf8');if(unifySchema(src)!==src)throw new Error(file+' still contains a current-schema literal that must use SESSION_SCHEMA_VERSION');}
}
if(fix)console.log(`Source migration complete: removed ${handlerTotal} handler(s), updated ${changedFiles} file(s).`);
