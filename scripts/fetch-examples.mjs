import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const {sources}=JSON.parse(await readFile('data/sources.json','utf8'));
await mkdir('data/raw',{recursive:true});
for(const s of sources) {
  const response=await fetch(s.audio);if(!response.ok)throw new Error(`${s.id}: HTTP ${response.status}`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(createHash('sha256').update(bytes).digest('hex')!==s.sha256)throw new Error(`${s.id}: source checksum changed; inspect before accepting`);
  const input=`data/raw/${s.id}.ogg`;await writeFile(input,bytes);
  const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',input,'-ss',String(s.excerptStart),'-t',String(s.excerptEnd-s.excerptStart),'-ac','1','-ar','22050','-c:a','pcm_s16le',`data/raw/${s.id}.wav`],{stdio:'inherit'});
  if(result.error||result.status!==0)throw new Error('FFmpeg is required to prepare excerpts. Install it and put it on PATH.');
  console.log(`${s.id}: checksum verified, excerpt prepared; ${s.license}`);
}
