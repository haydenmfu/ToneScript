import test from 'node:test';
import assert from 'node:assert/strict';
import { spectrum,describeFrame,analyzeAudio } from '../src/analysis.mjs';
import { encodeWav } from '../src/synth.mjs';
import { decodeWav } from '../src/wav.mjs';
test('FFT resolves a known bin-centered tone',()=>{
  const n=2048,k=40,signal=Float32Array.from({length:n},(_,i)=>Math.sin(2*Math.PI*k*i/n));
  const s=spectrum(signal);assert.equal(s.indexOf(Math.max(...s)),k);assert.throws(()=>spectrum(new Float32Array(30)));
});
test('descriptors distinguish tonal and seeded broadband inputs; pitch tracks A4',()=>{
  const tone=Float32Array.from({length:2048},(_,i)=>.4*Math.sin(2*Math.PI*440*i/22050));
  let seed=10;const noise=Float32Array.from({length:2048},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;});
  const t=describeFrame(tone,22050),n=describeFrame(noise,22050);
  assert.ok(Math.abs(t.pitch-69)<.15,`pitch ${t.pitch}`);assert.ok(n.flatness>t.flatness);assert.ok(n.centroid>t.centroid);
});
test('silent recording produces no invented gestures',()=>{
  const {score}=analyzeAudio(new Float32Array(22050),22050);assert.deepEqual(score.lanes[0].events,[]);
});
test('dominant pitch estimator includes low bass notes',()=>{
  const frame=Float32Array.from({length:2048},(_,i)=>.4*Math.sin(2*Math.PI*55*i/22050));
  assert.ok(Math.abs(describeFrame(frame,22050).pitch-33)<.2);
});

test('pitch sweep covers the score range without octave errors at different phases',()=>{
  for(let midi=24;midi<=108;midi++) for(const phase of [0,.7]) {
    const frequency=440*2**((midi-69)/12);
    const frame=Float32Array.from({length:2048},(_,i)=>.3*Math.sin(2*Math.PI*frequency*i/22050+phase));
    const actual=describeFrame(frame,22050).pitch;
    assert.ok(actual!==null&&Math.abs(actual-midi)<.15,`MIDI ${midi}, phase ${phase}: ${actual}`);
  }
});

test('harmonic mixtures retain the common period even with the fundamental missing',()=>{
  for(const frequency of [55,110,440,1200]) for(const fundamental of [0,.15]) {
    const frame=Float32Array.from({length:2048},(_,i)=>{
      const p=2*Math.PI*frequency*i/22050;
      return fundamental*Math.sin(p)+.3*Math.sin(2*p)+.2*Math.sin(3*p);
    });
    const actual=describeFrame(frame,22050).pitch,expected=69+12*Math.log2(frequency/440);
    assert.ok(actual!==null&&Math.abs(actual-expected)<.15,`${frequency} Hz common period: ${actual}`);
  }
});

test('isolated pitches outside the supported band and DC do not invent a supported note',()=>{
  for(const frequency of [20,25,30,4300,4500,6000,8000,10000]) {
    const frame=Float32Array.from({length:2048},(_,i)=>.3*Math.sin(2*Math.PI*frequency*i/22050));
    assert.equal(describeFrame(frame,22050).pitch,null,`${frequency} Hz`);
  }
  assert.equal(describeFrame(new Float32Array(2048).fill(.2),22050).pitch,null);
});
test('analysis estimates two separated notes and retains provenance',()=>{
  const a=new Float32Array(22050*2);
  for(let i=2205;i<17640;i++)a[i]=.2*Math.sin(2*Math.PI*440*i/22050);
  for(let i=26460;i<41895;i++)a[i]=.2*Math.sin(2*Math.PI*523.25*i/22050);
  const {score}=analyzeAudio(a,22050,{sourceHash:'fixture'});
  assert.equal(score.provenance.sourceHash,'fixture');assert.ok(score.lanes[0].events.some(e=>Math.abs(e.pitch-69)<.3));assert.ok(score.lanes[0].events.some(e=>Math.abs(e.pitch-72)<.3));
  assert.ok(score.lanes[0].events.every(e=>e.start+e.duration<=2+1e-6));
});
test('WAV codec round trip stays within PCM quantization error',()=>{
  const a=Float32Array.from([0,.1,-.9,.9]);const r=decodeWav(encodeWav(a,22050));assert.equal(r.sampleRate,22050);
  for(let i=0;i<a.length;i++)assert.ok(Math.abs(a[i]-r.samples[i])<.00006);
  assert.throws(()=>decodeWav(new ArrayBuffer(44)));
});
