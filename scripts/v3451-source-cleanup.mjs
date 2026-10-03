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
    if(c==='{')depth++;
    else if(c==='}'&&--depth===0){let end=i+1;while(/[ \t]/.test(src[end]||''))end++;if(src[end]===';')end++;if(src[end]==='\r')end++;if(src[end]==='\n')end++;return end}
  }
  throw new Error('unterminated handler');
}
function removeHandlers(src,id){
  const needle=`$('#${id}').onchange=async e=>{`;let removed=0,pos=0;
  while((pos=src.indexOf(needle,pos))>=0){const end=statementEnd(src,pos);src=src.slice(0,pos)+src.slice(end);removed++}
  return{src,removed};
}
let total=0;
for(const file of files){let src=fs.readFileSync(file,'utf8'),removed=0;for(const id of selectors){const r=removeHandlers(src,id);src=r.src;removed+=r.removed}total+=removed;if(fix&&removed)fs.writeFileSync(file,src);console.log(`${file}: ${removed} legacy import handler(s) ${fix?'removed':'found'}`)}
if(!fix&&total)throw new Error(`Found ${total} legacy import onchange handler(s); only src/js/26-v35-import-safety.js may own import handlers.`);
if(fix)console.log(`Removed ${total} legacy handler(s).`);
