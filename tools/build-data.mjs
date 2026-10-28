import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await build({entryPoints:['tools/render-data.ts'],outfile:'dist/render-data.mjs',bundle:true,minify:true,format:'esm',platform:'node'});
