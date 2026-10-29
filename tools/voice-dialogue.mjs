// Server/CLI only. Node loads .env.local; the key never enters the browser bundle.
import {ElevenLabsClient} from '@elevenlabs/elevenlabs-js';
import {parseArgs} from 'node:util';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
const {values,positionals}=parseArgs({allowPositionals:true,options:{model:{type:'string',default:'eleven_v4'},out:{type:'string'},pronunciations:{type:'string'},'spend-credits':{type:'boolean'},'align-fallback':{type:'boolean'},'max-characters':{type:'string',default:'500'}}});
const [mode,episode]=positionals;if(!episode||!values.out||!['discover','generate','assemble'].includes(mode))throw Error('Usage: npm run voice:dialogue -- discover|generate|assemble episode.json --out output/take [--model eleven_v4] [--spend-credits] [--align-fallback]');
const out=resolve(values.out);await mkdir(out,{recursive:true});const common=[episode,'--model',values.model,'--out',out,...(values.pronunciations?['--pronunciations',values.pronunciations]:[])];
function python(command,extra=[]){const r=spawnSync('python3',['tools/voice-scene.py',command,...common,...extra],{encoding:'utf8',env:process.env});if(r.stdout)process.stdout.write(r.stdout);return r;}
const prepared=python('prepare');if(prepared.status)throw Error(prepared.stderr);const manifest=JSON.parse(await readFile(join(out,'voice-request.json'),'utf8'));
const snake=value=>Array.isArray(value)?value.map(snake):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k.replace(/[A-Z]/g,c=>'_'+c.toLowerCase()),snake(v)])):value;
const file=join(out,'response.json'),audio=join(out,'dialogue.mp3');
if(mode==='generate'){
 const limit=Number(values['max-characters']),characters=manifest.request.inputs.reduce((n,i)=>n+i.text.length,0);if(!Number.isInteger(limit)||limit<1||characters>limit)throw Error(`Request has ${characters} characters, above the ${limit}-character cap. Raise --max-characters explicitly only for an approved production take.`);
 if(!values['spend-credits'])throw Error('Generation consumes credits; supply --spend-credits only with user authorization.');
}
if(mode!=='assemble'){
 if(!process.env.ELEVENLABS_API_KEY)throw Error('Connect ElevenLabs, then run Node with --env-file=.env.local. Never paste the key in chat.');
 const client=new ElevenLabsClient({maxRetries:0});const models=await client.models.list();const cast=[];for(const id of new Set(manifest.request.inputs.map(i=>i.voice_id))){const voice=await client.voices.get(id);cast.push({voiceId:voice.voiceId,name:voice.name});}
 await writeFile(join(out,'discovery.json'),JSON.stringify({models:models.map(m=>({id:m.modelId,tts:m.canDoTextToSpeech})),cast},null,2));console.log('Verified cast: '+cast.map(v=>v.name).join(' + '));
 if(mode==='discover'){console.log('Saved available model IDs; no generation credits used.');process.exit(0);}
 if(!models.some(m=>m.modelId===values.model&&m.canDoTextToSpeech))throw Error('Requested model is unavailable; choose explicitly. No fallback model was selected.');

 let exists=false;try{await access(file);exists=true;}catch{}if(exists)throw Error('A saved take exists. Assemble it; use a new directory for an authorized new take.');
 const {data,rawResponse}=await client.textToDialogue.convertWithTimestamps({modelId:values.model,inputs:manifest.request.inputs.map(i=>({text:i.text,voiceId:i.voice_id})),outputFormat:'mp3_44100_128'},{maxRetries:0,timeoutInSeconds:240}).withRawResponse();
 // Save the charged take before validating anything. No automatic generation retry.
 const result=snake(data);await writeFile(file,JSON.stringify(result));await writeFile(audio,Buffer.from(result.audio_base64,'base64'));
 await writeFile(join(out,'provenance.json'),JSON.stringify({model:values.model,requestId:rawResponse.headers.get('request-id'),characterCount:rawResponse.headers.get('x-character-count'),alignmentReturned:!!(data.alignment||data.normalizedAlignment),segments:data.voiceSegments?.length,endpoint:'text-to-dialogue/with-timestamps'},null,2));console.log('Saved scene audio and provider response.');
}
let assembled=python('assemble',['--response',file,'--audio',audio]);
await writeFile(join(out,'native-validation.json'),JSON.stringify({passed:assembled.status===0,message:assembled.stderr.trim()||null},null,2));
if(assembled.status&&values['align-fallback']){
 if(!values['spend-credits'])throw Error('Provider alignment also needs authorized credits.');
 console.log('Native timing did not validate. Aligning the saved take; speech will not be regenerated.');
 const forcedFile=join(out,'forced-response.json');let result;try{result=JSON.parse(await readFile(forcedFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;const client=new ElevenLabsClient({maxRetries:0});const forced=await client.forcedAlignment.create({file:createReadStream(audio),text:manifest.mapping.map(x=>x.spoken).join(' ')},{maxRetries:0,timeoutInSeconds:240});const f=snake(forced);result={alignment:{characters:f.characters.map(c=>c.text),character_start_times_seconds:f.characters.map(c=>c.start),character_end_times_seconds:f.characters.map(c=>c.end)},forced_alignment:f};await writeFile(forcedFile,JSON.stringify(result));}
 assembled=python('assemble',['--response',forcedFile,'--audio',audio]);
}
if(assembled.status)throw Error(assembled.stderr.trim()||'Alignment failed; saved take retained.');console.log('Scene ready: '+join(out,'voiced.episode.json'));
