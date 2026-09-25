import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=fs.readFileSync(path.join(root,'src/styles/00-base.css'),'utf8');
const rootBlock=css.match(/:root\{([^}]*)\}/)?.[1]||'';
const vars=Object.fromEntries([...rootBlock.matchAll(/--([a-z0-9_-]+):\s*(#[0-9a-f]{6})/gi)].map(m=>[m[1],m[2].toLowerCase()]));
function luminance(hex){const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4));return 0.2126*rgb[0]+0.7152*rgb[1]+0.0722*rgb[2]}
function ratio(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)}
function need(name){if(!vars[name])throw new Error('Missing CSS color variable --'+name);return vars[name]}
const pairs=[['text/bg',need('text'),need('bg'),4.5],['text/panel',need('text'),need('panel'),4.5],['muted/bg',need('muted'),need('bg'),4.5],['muted/panel',need('muted'),need('panel'),4.5],['muted/chip',need('muted'),need('chip'),4.5],['accent/bg',need('accent'),need('bg'),4.5],['good/bg',need('good'),need('bg'),4.5],['warn/bg',need('warn'),need('bg'),4.5],['bad/bg',need('bad'),need('bg'),4.5],['primary button','#dff6ff','#143347',4.5],['good button','#dcffeb','#153929',4.5],['danger button','#ffdce0','#3b1d22',4.5]];
let failed=0;
for(const [name,fg,bg,min] of pairs){const r=ratio(fg,bg);console.log((r>=min?'✓':'✗')+' '+name+' '+r.toFixed(2)+':1 (min '+min+':1)');if(r<min)failed++}
if(failed)throw new Error(failed+' contrast pair(s) below required WCAG AA text threshold');
console.log('Contrast audit passed: '+pairs.length+' critical foreground/background pairs.');