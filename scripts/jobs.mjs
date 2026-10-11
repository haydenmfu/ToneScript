import { spawn } from 'node:child_process';
import { randomUUID, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { analyzeAudio } from '../src/analysis.mjs';
import { decodeWav } from '../src/wav.mjs';
import { assertScore } from '../src/score.mjs';
export const MAX_AUDIO_BYTES = 22050 * 2 * 120 + 4096;
export function validateUpload(data) {
  if (data.length > MAX_AUDIO_BYTES || data.length < 44) throw new Error('Use a WAV excerpt of at most 120 seconds');
  if (data.toString('ascii',0,4)!=='RIFF' || data.toString('ascii',8,12)!=='WAVE' || data.readUInt32LE(4)+8!==data.length) throw new Error('Invalid WAV container');
  let format=false, frames=null;
  for(let at=12;at<data.length;) {
    if(at+8>data.length) throw new Error('Truncated WAV chunk');
    const name=data.toString('ascii',at,at+4),size=data.readUInt32LE(at+4),start=at+8;
    if(start+size+(size%2)>data.length) throw new Error('Truncated WAV chunk');
    if(name==='fmt ') {
      if(format || size!==16 || data.readUInt16LE(start)!==1 || data.readUInt16LE(start+2)!==1 || data.readUInt32LE(start+4)!==22050 || data.readUInt32LE(start+8)!==44100 || data.readUInt16LE(start+12)!==2 || data.readUInt16LE(start+14)!==16) throw new Error('Use mono PCM16 WAV at 22050 Hz');
      format=true;
    }
    if(name==='data') { if(frames!==null || size%2) throw new Error('Invalid audio samples'); frames=size/2; }
    at=start+size+(size%2);
  }
  if(!format || !frames || frames>22050*120) throw new Error('Use nonempty audio of at most 120 seconds');
  return frames/22050;
}
export function runPython({root,input,output,method,signal}) {
  return new Promise((resolve,reject)=>{
    const python=path.join(root,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
    const child=spawn(python,[path.join(root,'scripts/separate.py'),input,output,'--method',method],{cwd:root,shell:false,windowsHide:true,signal,stdio:['ignore','pipe','pipe']});
    let diagnostic=''; const collect=chunk=>{diagnostic=(diagnostic+chunk.toString()).slice(-6000);};
    let failure;
    child.stdout.on('data',collect);child.stderr.on('data',collect);child.once('error',error=>{failure=error;});
    // Wait for close even on abort, so a second job cannot overlap a dying child.
    child.once('close',code=>failure?reject(failure):code===0?resolve():reject(new Error(`Separation exited (${code}). ${diagnostic}`)));
  });
}
export async function assembleScore(output,{title,sourceHash}) {
  const report=JSON.parse(await readFile(path.join(output,'report.json'),'utf8'));
  const expected=report.method==='demucs'?['drums','bass','other','vocals']:['harmonic','percussive'];
  if(!Array.isArray(report.stems) || report.stems.length!==expected.length || new Set(report.stems.map(s=>s.name)).size!==expected.length || report.stems.some(s=>!expected.includes(s.name))) throw new Error('Unexpected separation outputs');
  let score; const analyses=[];
  for(const stem of report.stems) {
    const data=await readFile(path.join(output,`${stem.name}-22050.wav`));
    const {samples,sampleRate}=decodeWav(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength));
    const analyzed=analyzeAudio(samples,sampleRate,{title,sourceName:'uploaded excerpt',sourceHash,laneName:`${stem.name} · estimated`});
    if(!score) score={...analyzed.score,lanes:[]};
    score.duration=Math.max(score.duration,analyzed.score.duration);
    const lane=analyzed.score.lanes[0];lane.id=stem.name;
    for(const event of lane.events) event.id=`${stem.name}-${event.id}`;
    score.lanes.push(lane);analyses.push({stem:stem.name,...analyzed.report});
  }
  score.provenance={...score.provenance,kind:'separation-assisted automatic suggestions; not listening-reviewed',separation:report,stemAnalyses:analyses,note:'Named estimated lanes do not prove an instrument is present. Separation artifacts and dominant-pitch limitations require listening review. Stem audio is reference playback, not reconstruction from notation.'};
  assertScore(score);await writeFile(path.join(output,'score.json'),JSON.stringify(score,null,2));
  return {report,stems:report.stems.map(s=>s.name)};
}
function assembleInWorker(output,options,signal) {
  return new Promise((resolve,reject)=>{
    if(signal.aborted){reject(new Error('Separation cancelled'));return;}
    const worker=new Worker(new URL(import.meta.url),{workerData:{toneScriptAssembly:true,output,options},execArgv:[]});
    let result,failure;
    const abort=()=>{failure=new Error('Separation cancelled');void worker.terminate();};
    signal.addEventListener('abort',abort,{once:true});
    worker.once('message',message=>{if(message.error)failure=new Error(message.error);else result=message.result;});
    worker.once('error',error=>{failure=error;});
    worker.once('exit',code=>{signal.removeEventListener('abort',abort);if(failure)reject(failure);else if(code!==0||!result)reject(new Error('Score analysis worker failed'));else resolve(result);});
  });
}
if(!isMainThread && workerData?.toneScriptAssembly) {
  assembleScore(workerData.output,workerData.options).then(result=>parentPort.postMessage({result}),error=>parentPort.postMessage({error:error.message}));
}
export class JobManager {
  constructor(root,{runner=runPython,assemble=assembleInWorker,timeoutMs=10*60*1000}={}) {this.root=root;this.runner=runner;this.assemble=assemble;this.timeoutMs=timeoutMs;this.jobs=new Map();this.active=null;this.closed=false;}
  async start(data,method,title='Separated audio study') {
    if(this.closed) throw Object.assign(new Error('Server is shutting down'),{status:503});
    if(this.active) throw Object.assign(new Error('A separation job is already running'),{status:409});
    if(!['demucs','hpss'].includes(method)) throw Object.assign(new Error('Choose demucs or hpss'),{status:400});
    validateUpload(data);
    const id=randomUUID(),output=path.join(this.root,'outputs','jobs',id),controller=new AbortController();
    const job={id,status:'running',method,createdAt:new Date().toISOString(),output,controller};
    this.active=id;this.jobs.set(id,job);
    if(this.jobs.size>50) {const oldest=[...this.jobs.values()].find(j=>j.status!=='running');if(oldest)this.jobs.delete(oldest.id);}
    job.done=(async()=>{
      const timer=setTimeout(()=>{job.error='Separation timed out';controller.abort();},this.timeoutMs);timer.unref();
      try {
        await mkdir(output,{recursive:true});const input=path.join(output,'input.wav');await writeFile(input,data);
        if(controller.signal.aborted)throw new Error(job.error||'Separation cancelled');
        await this.runner({root:this.root,input,output,method,signal:controller.signal});
        if(controller.signal.aborted) throw new Error(job.error||'Separation cancelled');
        Object.assign(job,await this.assemble(output,{title,sourceHash:createHash('sha256').update(data).digest('hex')},controller.signal));
        if(controller.signal.aborted)throw new Error(job.error||'Separation cancelled');
        job.status='completed';
      } catch(error) {job.status='failed';job.error=job.error||error.message;} finally {clearTimeout(timer);this.active=null;job.finishedAt=new Date().toISOString();}
    })();
    return this.status(id);
  }
  status(id) {
    const j=this.jobs.get(id);if(!j)return null;
    return {id:j.id,status:j.status,method:j.method,createdAt:j.createdAt,finishedAt:j.finishedAt,error:j.error,statusUrl:`/api/jobs/${id}`,...(j.status==='completed'?{scoreUrl:`/api/jobs/${id}/score`,stems:j.stems.map(name=>({name,url:`/api/jobs/${id}/stems/${name}.wav`})),report:j.report}:{})};
  }
  cancel(id) {const j=this.jobs.get(id);if(!j)return false;if(j.status==='running'){j.error='Separation cancelled';j.controller.abort();}return true;}
  async close() {this.closed=true;for(const job of this.jobs.values())if(job.status==='running'){job.error='Server shut down';job.controller.abort();}await Promise.all([...this.jobs.values()].map(j=>j.done));}
}
