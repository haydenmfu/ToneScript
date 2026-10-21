import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {decodeWav} from '../src/wav.mjs';
import {describeFrame} from '../src/analysis.mjs';
const results=[];
for(const [study,lane,path] of [['trumpet','analysis','data/raw/trumpet.wav'],['choice','bass','outputs/separation/choice-demucs/bass-22050.wav'],['choice','drums','outputs/separation/choice-demucs/drums-22050.wav']]) {
 const bytes=await readFile(path),{samples,sampleRate}=decodeWav(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
 const score=JSON.parse(await readFile(`examples/${study}.json`,'utf8'));
 const events=score.lanes.find(l=>l.id===lane).events;
 const frames=[];
 for(let i=0;i+2048<samples.length;i+=256) {
  const f=describeFrame(samples.subarray(i,i+2048),sampleRate),time=(i+1024)/sampleRate;
  const event=events.find(e=>e.start<=time&&e.start+e.duration>time);
  frames.push({time:+time.toFixed(4),pitch:f.pitch,rms:f.rms,scorePitch:event?.pitch??null,event:event?.id??null});
 }
 const peak=Math.max(...frames.map(f=>f.rms));
 const active=frames.filter(f=>f.rms>peak*.025&&f.rms>.002&&f.pitch!==null);
 const missed=active.filter(f=>f.scorePitch===null||Math.abs(f.pitch-f.scorePitch)>.7);
 const spans=[];
 for(const f of missed) {
  const last=spans.at(-1);
  if(last&&f.time-last.end<.025){last.end=f.time;last.frames++;}
  else spans.push({start:f.time,end:f.time,frames:1});
 }
 results.push({study,lane,method:'Centered 2048-sample diagnostic frames, 256-sample hop; same pitch estimator as analyzer, NOT independent ground truth',activePitchedFrames:active.length,mismatchedFrames:missed.length,spans:spans.filter(s=>s.frames>=3),frames});
}
await mkdir('outputs/diagnostics',{recursive:true});
await writeFile('outputs/diagnostics/note-coverage.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(({frames:_frames,...r})=>r),null,2));

