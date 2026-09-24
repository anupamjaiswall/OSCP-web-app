import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=fs.readFileSync(path.join(root,'index.html'));
console.log(createHash('sha256').update(data).digest('hex')+'  index.html');
