import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {describeFrame} from '../src/analysis.mjs';
import {assertScore,neutralScore} from '../src/score.mjs';
import {renderScore} from '../src/synth.mjs';
const score=(patch={})=>({version:'1.0',renderer:'harmonic-noise-v1',title:'Independent review fixture',duration:1,seed:12,provenance:{kind:'synthetic test'},lanes:[{id:'tone',name:'Tone',events:[{id:'tone-1',start:0,duration:1,pitch:69,gain:.7,timbre:{brightness:[.4,.4],noise:[0,0],attack:.01,release:.01,decay:0},...patch}]}]});
const frame=f=>Float32Array.from({length:2048},(_,i)=>.3*Math.sin(2*Math.PI*f*i/22050));

test('review: upper supported pure tone does not become a subharmonic',()=>{
  const expected=69+12*Math.log2(1200/440),actual=describeFrame(frame(1200),22050).pitch;
  assert.ok(actual!==null&&Math.abs(actual-expected)<.3,`1200 Hz expected MIDI ${expected}, got ${actual}`);
});
test('review: out-of-range high tone must not become a confident aliased low note',()=>{
  const actual=describeFrame(frame(6000),22050).pitch;
  assert.equal(actual,null,`6000 Hz exceeds score pitch range; got spurious MIDI ${actual}`);
});
test('review: lowest supported score pitch is recognized rather than converted to noise',()=>{
  const actual=describeFrame(frame(440*2**((24-69)/12)),22050).pitch;
  assert.ok(actual!==null&&Math.abs(actual-24)<.2,`MIDI24 sine returned ${actual}`);
});
test('review: neutralization preserves validity of the shortest valid gesture',()=>{
  const s=score({duration:.004,timbre:{brightness:[.4,.4],noise:[0,0],attack:.002,release:.002,decay:0}});
  assertScore(s);assert.doesNotThrow(()=>assertScore(neutralScore(s)));
});
test('review: renderer rejects sample rates that would silently remove a pitched event',()=>{
  assert.throws(()=>renderScore(score({pitch:108}),{sampleRate:8000}));
});
test('review: reconstruction ignores original audio paths and separation provenance',()=>{
  const a=score(),b=structuredClone(a);
  b.provenance={sourceName:'nonexistent.wav',sourceHash:'different',separation:{stems:[{name:'vocals',path:'nonexistent-stem.wav'}]},hiddenSpectrum:[99,99]};
  assert.deepEqual(renderScore(a).samples,renderScore(b).samples);
});
test('review: applied drafts retain valid boundaries and render without clipping',async()=>{
  for(const name of ['trumpet','choice']){
    const s=JSON.parse(await readFile(new URL(`../examples/${name}.json`,import.meta.url),'utf8'));
    assertScore(s);const rendered=renderScore(s);
    assert.equal(rendered.samples.length,Math.ceil(s.duration*22050));
    assert.equal(rendered.metrics.limitedSamples,0);assert.ok(rendered.metrics.rms>0);
    if(name==='choice')assert.equal(s.lanes.length,4,'Keep even empty estimated source groups');
  }
});
