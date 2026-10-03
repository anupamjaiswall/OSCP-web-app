import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const qualityPath=path.join(root,'src/meta/quality.json'),quality=JSON.parse(fs.readFileSync(qualityPath,'utf8'));
const jsDir=path.join(root,'src/js'),files=fs.readdirSync(jsDir).filter(x=>x.endsWith('.js'));
const inner=files.reduce((n,f)=>n+(fs.readFileSync(path.join(jsDir,f),'utf8').match(/\.innerHTML\s*=/g)||[]).length,0);
const core=fs.statSync(path.join(jsDir,'03-core-app.js')).size;
const write=process.argv.includes('--write');
if(write){
 if(inner>quality.maxInnerHTMLAssignments)throw new Error(`innerHTML regression ${inner}>${quality.maxInnerHTMLAssignments}; migrate sinks instead of raising the ratchet`);
 if(core>quality.maxCoreAppBytes)throw new Error(`legacy core regression ${core}>${quality.maxCoreAppBytes}; extract logic instead of raising the ratchet`);
 quality.maxInnerHTMLAssignments=inner;quality.maxCoreAppBytes=core;fs.writeFileSync(qualityPath,JSON.stringify(quality,null,2)+'\n');console.log(`Quality ratchets lowered/confirmed: innerHTML=${inner}, core=${core} bytes`);
}else{
 if(quality.maxInnerHTMLAssignments!==inner)throw new Error(`quality.json innerHTML ratchet must equal current count ${inner}; run npm run ratchet after reducing it`);
 if(quality.maxCoreAppBytes!==core)throw new Error(`quality.json core ratchet must equal current size ${core}; run npm run ratchet after reducing it`);
 console.log(`Quality ratchets exact: innerHTML=${inner}, core=${core} bytes`);
}
