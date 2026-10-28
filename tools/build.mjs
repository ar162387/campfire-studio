import {build} from 'esbuild';
import {cp,mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await build({entryPoints:['src/puppet/Studio.tsx'],outfile:'dist/studio.js',bundle:true,minify:true,format:'iife',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
await cp('public','dist',{recursive:true});
for(const name of ['index.html','studio.css'])await copyFile('studio/'+name,'dist/'+name);
console.log('Built local studio in dist/. Run npm start.');
