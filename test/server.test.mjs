import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm,writeFile,readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { JobManager,validateUpload,MAX_AUDIO_BYTES } from '../scripts/jobs.mjs';
import { createServer } from '../scripts/server.mjs';
import { encodeWav } from '../src/synth.mjs';
const wav=()=>Buffer.from(encodeWav(Float32Array.from({length:4410},(_,i)=>.2*Math.sin(i*2*Math.PI*440/22050)),22050));
const fakeRunner=async({input,output,method})=>{
  const audio=await readFile(input);
  const names=method==='demucs'?['drums','bass','other','vocals']:['harmonic','percussive'];
  await writeFile(path.join(output,'report.json'),JSON.stringify({method,interpretation:'Estimated only',stems:names.map(name=>({name}))}));
  for(const name of names)await writeFile(path.join(output,`${name}-22050.wav`),audio);
};
test('upload rejects stereo, rate mismatch, truncation, empty and oversized audio',()=>{
  assert.equal(validateUpload(wav()),.2);
  for(const mutate of [b=>{b.writeUInt16LE(2,22);return b;},b=>{b.writeUInt32LE(44100,24);return b;},b=>b.subarray(0,b.length-1),()=>Buffer.alloc(44),()=>Buffer.alloc(MAX_AUDIO_BYTES+1)]) assert.throws(()=>validateUpload(mutate(wav())));
});
test('HTTP separation retains every lane and provenance while enforcing local/path restrictions',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'tonescript-job-'));
  const jobs=new JobManager(root,{runner:fakeRunner}),server=createServer({jobs});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  try {
    const post=(suffix='',headers={})=>fetch(`${base}/api/separate?method=hpss${suffix}`,{method:'POST',headers:{'Content-Type':'audio/wav',...headers},body:wav()});
    assert.equal((await post('',{Origin:'https://evil.invalid'})).status,403);
    const badHost=await new Promise((resolve,reject)=>{const req=http.get(base+'/',{headers:{Host:'evil.invalid'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);});
    assert.equal(badHost,403);
    assert.equal((await post('',{'Sec-Fetch-Site':'cross-site'})).status,403);
    assert.equal((await post('',{'Content-Type':'text/plain'})).status,415);
    assert.equal((await post('&title='+ 'x'.repeat(161))).status,400);
    assert.equal((await fetch(`${base}/scripts/separate.py`)).status,404);
    assert.equal((await fetch(`${base}/api/examples/unknown/audio`)).status,404);
    const response=await post();assert.equal(response.status,202);const first=await response.json();
    await jobs.jobs.get(first.id).done;
    const result=await (await fetch(base+first.statusUrl)).json();assert.equal(result.status,'completed');assert.equal(result.stems.length,2);
    const score=await(await fetch(base+result.scoreUrl)).json();assert.deepEqual(score.lanes.map(l=>l.id),['harmonic','percussive']);
    assert.equal(new Set(score.lanes.flatMap(l=>l.events.map(e=>e.id))).size,score.lanes.flatMap(l=>l.events).length);
    assert.match(score.provenance.sourceHash,/^[a-f0-9]{64}$/);assert.equal(score.provenance.separation.method,'hpss');
    assert.equal((await fetch(base+result.stems[0].url)).headers.get('content-type'),'audio/wav');
    assert.equal((await fetch(`${base}/api/jobs/${first.id}/stems/vocals.wav`)).status,404);
    assert.equal((await fetch(`${base}/api/jobs/${first.id}/stems/..%2finput.wav`)).status,404);
  }finally{await server.shutdown();await rm(root,{recursive:true,force:true});}
});
test('single active job, cancellation, timeouts and shutdown release resources',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'tonescript-abort-'));
  let entered;const ready=new Promise(resolve=>{entered=resolve;});
  const runner=({signal})=>new Promise((resolve,reject)=>{entered();signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true});});
  const jobs=new JobManager(root,{runner,timeoutMs:10000});
  try{
    const first=await jobs.start(wav(),'demucs');await ready;
    await assert.rejects(jobs.start(wav(),'hpss'),{status:409});jobs.cancel(first.id);await jobs.jobs.get(first.id).done;
    assert.equal(jobs.status(first.id).status,'failed');assert.equal(jobs.status(first.id).error,'Separation cancelled');assert.equal(jobs.active,null);
    const second=await jobs.start(wav(),'hpss');await jobs.close();assert.equal(jobs.status(second.id).status,'failed');
    await assert.rejects(jobs.start(wav(),'hpss'),{status:503});
    const timed=new JobManager(root,{runner,timeoutMs:15});const third=await timed.start(wav(),'hpss');
    const keepAlive=setTimeout(()=>{},1000);await timed.jobs.get(third.id).done;clearTimeout(keepAlive);
    assert.equal(timed.status(third.id).error,'Separation timed out');await timed.close();
  }finally{await jobs.close();await rm(root,{recursive:true,force:true});}
});
