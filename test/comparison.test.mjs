import test from 'node:test';
import assert from 'node:assert/strict';
import { comparisonGains,signalMetrics } from '../src/comparison.mjs';
test('comparison gains equalize RMS and preserve peak headroom',()=>{
  const m=[{rms:.1,peak:.3},{rms:.02,peak:.9},{rms:0,peak:0}],r=comparisonGains(m);
  assert.ok(Math.abs(m[0].rms*r.gains[0]-m[1].rms*r.gains[1])<1e-12);
  for(let i=0;i<m.length;i++)assert.ok(m[i].peak*r.gains[i]<=.95+1e-9);
  assert.equal(r.gains[2],1);
});
test('metrics handle silence and empty input without nonfinite output',()=>{
  assert.deepEqual(signalMetrics(new Float32Array()),{rms:0,peak:0});
  assert.deepEqual(comparisonGains([{rms:0,peak:0}]),{target:0,gains:[1]});
});
