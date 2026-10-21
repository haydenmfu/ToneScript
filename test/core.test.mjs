import test from 'node:test';
import assert from 'node:assert/strict';
import { examples } from '../src/examples.mjs';
import { assertScore, validateScore, serialize, parseScore, neutralScore } from '../src/score.mjs';
import { renderScore, encodeWav } from '../src/synth.mjs';
import { scoreSVG,layoutScore } from '../src/notation.mjs';
const fixture = () => structuredClone(examples[0]);
test('score round trip preserves the complete musical document', () => {
  for (const s of examples) assert.deepEqual(parseScore(serialize(s)), s);
});
test('reject unsupported versions, nonfinite values, out-of-bounds time and duplicate ids', () => {
  for (const mutate of [s=>s.version='9',s=>s.duration=NaN,s=>s.lanes[0].events[0].start=-1,s=>s.lanes[0].events[0].duration=10,s=>s.lanes[0].events[0].timbre.noise=[0,2],s=>s.lanes[0].events[0].timbre.attack=3.4,s=>s.lanes[0].events[1].id='s1']) {
    const s=fixture(); mutate(s); assert.ok(validateScore(s).length); assert.throws(()=>assertScore(s));
  }
});
test('silence is valid and renders as exact zero', () => {
  const s=fixture(); s.lanes=[]; const r=renderScore(s,{sampleRate:8000});
  assert.equal(r.samples.length,64000); assert.ok(r.samples.every(x=>x===0));
});
test('renderer is deterministic, finite, within range, and uses score only', () => {
  const s=fixture(), a=renderScore(s,{sampleRate:8000}), b=renderScore(parseScore(serialize(s)),{sampleRate:8000});
  assert.deepEqual(a.samples,b.samples); assert.equal(a.samples.length,64000);
  assert.ok(a.samples.every(Number.isFinite)); assert.ok(a.metrics.peak<1); assert.equal(a.metrics.limitedSamples,0);
  assert.ok(a.samples.slice(28000,32000).every(x=>x===0),'gap between gestures remains silent');
});
test('one-event edit leaves other event and preceding silence unchanged', () => {
  const s=fixture(), a=renderScore(s,{sampleRate:8000}); s.lanes[0].events[1].timbre.brightness=[1,1];
  const b=renderScore(s,{sampleRate:8000}); assert.deepEqual(a.samples.slice(0,32000),b.samples.slice(0,32000)); assert.notDeepEqual(a.samples.slice(32000),b.samples.slice(32000));
});
test('attack changes the onset envelope in its intended direction', () => {
  const s=fixture(); s.lanes[0].events[0].timbre.noise=[0,0]; s.lanes[0].events[0].timbre.attack=.01;
  const fast=renderScore(s,{sampleRate:8000}).samples; s.lanes[0].events[0].timbre.attack=.8;
  const slow=renderScore(s,{sampleRate:8000}).samples;
  const energy=a=>a.slice(0,800).reduce((n,x)=>n+x*x,0);
  assert.ok(energy(fast)>energy(slow)*10);
});
test('neutral condition preserves musical scaffolding without mutating original', () => {
  const s=fixture(), original=serialize(s), n=neutralScore(s);
  assert.equal(serialize(s),original);
  for (let i=0;i<n.lanes[0].events.length;i++) for (const key of ['start','duration','gain','pitch']) assert.equal(n.lanes[0].events[i][key],s.lanes[0].events[i][key]);
  assert.notDeepEqual(renderScore(s,{sampleRate:8000}).samples,renderScore(n,{sampleRate:8000}).samples);
});
test('polyphony sums isolated lanes with the same master gain below limiter', () => {
  const s=structuredClone(examples[1]); const all=renderScore(s,{sampleRate:8000});
  const parts=s.lanes.map(l=>renderScore(s,{sampleRate:8000,laneId:l.id}).samples);
  for(let i=0;i<all.samples.length;i++) assert.ok(Math.abs(all.samples[i]-parts.reduce((n,a)=>n+a[i],0))<1e-7);
});
test('unpitched events remain unpitched, deterministic and audible', () => {
  const s=structuredClone(examples[1]); s.lanes=s.lanes.filter(l=>l.id==='grain');
  assert.ok(renderScore(s,{sampleRate:8000}).metrics.rms>0); assert.equal(neutralScore(s).lanes[0].events[0].pitch,null);
});
test('WAV header and byte count match output, and invalid samples are rejected', () => {
  const r=renderScore(fixture(),{sampleRate:8000}), wav=encodeWav(r.samples,r.sampleRate), v=new DataView(wav);
  assert.equal(new TextDecoder().decode(wav.slice(0,4)),'RIFF'); assert.equal(v.getUint32(24,true),8000); assert.equal(wav.byteLength,44+64000*2);
  assert.throws(()=>encodeWav(new Float32Array([NaN]),8000));
});
test('SVG escapes user text and retains legend, time and accessible events', () => {
  const s=fixture(); s.title='<script>alert(1)</script>'; const svg=scoreSVG(s);
  assert.ok(!svg.includes('<script>')); assert.ok(svg.includes('&lt;script&gt;')); assert.ok(svg.includes('data-event="s1"')); assert.ok(svg.includes('Read the sound')); assert.ok(svg.includes('8s'));
});
test('overlapping events receive distinct visual subrows without inventing pitch positions',()=>{
  const s=fixture();s.lanes[0].events[1].start=1;
  const layout=layoutScore(s);assert.notEqual(layout.rows[0].slots.get('s1'),layout.rows[0].slots.get('s2'));assert.equal(layout.rows[0].height,260);
  assert.ok(scoreSVG(s,{interactive:true}).includes('role="group"'));
});
test('notation preserves an entrance longer than half a gesture',()=>{
  const s=fixture();s.duration=10;s.lanes[0].events=[{...s.lanes[0].events[0],start:0,duration:10,timbre:{brightness:[0,1],noise:[0,0],attack:8,release:1,decay:0}}];
  const svg=scoreSVG(s);assert.ok(svg.includes('M190 195L970 138H1067.5'),'80% entrance must extend to x970, not midpoint');
});
