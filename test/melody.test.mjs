import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeAudio } from '../src/analysis.mjs';

// Continuous, equal-level semitone motion: no silence or loudness cue can
// substitute for detecting the actual melodic changes.
test('legato semitone melody retains every note without extra attacks', () => {
  const notes=[69,70,71,72,71,70,69], seconds=.24, sr=22050;
  let phase=0;
  const samples=Float32Array.from({length:Math.round(notes.length*seconds*sr)},(_,i)=>{
    const pitch=notes[Math.min(notes.length-1,Math.floor(i/sr/seconds))];
    phase+=2*Math.PI*440*2**((pitch-69)/12)/sr;
    return .25*Math.sin(phase);
  });
  const events=analyzeAudio(samples,sr).score.lanes[0].events;
  assert.equal(events.length,notes.length,JSON.stringify(events.map(e=>[e.start,e.pitch])));
  for(let i=0;i<notes.length;i++) {
    assert.ok(Math.abs(events[i].pitch-notes[i])<.3,`note ${i}: ${events[i].pitch}`);
    assert.ok(Math.abs(events[i].start-i*seconds)<.055,`onset ${i}: ${events[i].start}`);
  }
});

test('a sustained note with vibrato is not split into invented repeated notes',()=>{
  const sr=22050;let phase=0;
  const samples=Float32Array.from({length:sr*2},(_,i)=>{
    const pitch=69+.3*Math.sin(2*Math.PI*5*i/sr);
    phase+=2*Math.PI*440*2**((pitch-69)/12)/sr;
    return .25*Math.sin(phase);
  });
  const events=analyzeAudio(samples,sr).score.lanes[0].events;
  assert.equal(events.length,1);
  assert.ok(Math.abs(events[0].pitch-69)<.3);
});
