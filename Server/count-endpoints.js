import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Swagger coverage ---
const { swaggerOptions } = await import('./configs/swaggerConfig.js');
const spec = swaggerJsdoc(swaggerOptions);
const paths = Object.keys(spec.paths || {});
const ops = Object.values(spec.paths||{}).reduce((a,m)=>a+Object.keys(m).length,0);

console.log('=== SWAGGER DOCUMENTATION ===');
console.log('Unique paths documented:', paths.length);
console.log('Total HTTP operations:  ', ops);

const byTag = {};
Object.values(spec.paths).forEach(methods => Object.values(methods).forEach(op => {
  (op.tags||['[untagged]']).forEach(t => { byTag[t] = (byTag[t]||0)+1; });
}));
console.log('\nBy tag:');
Object.entries(byTag).sort((a,b)=>b[1]-a[1]).forEach(([t,c]) => console.log('  '+c+'\t'+t));

// --- Actual routes in codebase ---
let routeCount = 0;
function scan(dir) {
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir,f);
    if (fs.statSync(fp).isDirectory() && !['node_modules','configs','middleware','utils','models'].includes(f)) scan(fp);
    else if (fp.endsWith('.js')) {
      const c = fs.readFileSync(fp,'utf-8');
      routeCount += (c.match(/\.(get|post|put|patch|delete)\s*\(\s*['"`]\//g)||[]).length;
    }
  }
}
scan(__dirname);

console.log('\n=== CODEBASE ===');
console.log('Actual routes in codebase:', routeCount);
console.log('Swagger coverage:         ', Math.round(ops/routeCount*100)+'%');
