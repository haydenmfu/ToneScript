import test from 'node:test';
import assert from 'node:assert/strict';
import { examples } from '../src/examples.mjs';
import { layoutScore,scoreSVG } from '../src/notation.mjs';

function gesture(id,start,duration,noise=0) {
  return {id,start,duration,pitch:60,gain:.3,timbre:{brightness:[.5,.5],noise:[noise,noise],attack:duration*.8,release:duration*.2,decay:0}};
}
function study(events){const score=structuredClone(examples[0]);score.duration=20;score.lanes=[{id:'one',name:'One layer',events}];return score;}

test('a sub-ten-pixel pure-noise gesture has visible dots inside its sloping envelope; tonal has none',()=>{
  const score=study([gesture('noise',0,.1,1),gesture('tonal',1,.1,0)]),svg=scoreSVG(score);
  const noisy=svg.match(/<g data-event="noise"[\s\S]*?<\/g>/)[0];
  const tonal=svg.match(/<g data-event="tonal"[\s\S]*?<\/g>/)[0];
  assert.equal((noisy.match(/<circle /g)||[]).length,4);
  assert.match(noisy,/<g clip-path="url\(#texture0\)">/,'texture is clipped to the gesture outline, including steep narrow slopes');
  assert.equal((tonal.match(/<circle /g)||[]).length,0);
  const width=.1/20*975,center=190+width/2,boundary=130+65-.5/.8*57;
  for(const match of noisy.matchAll(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/g)){
    const [,x,y,r]=match.map(Number);
    assert.ok(Math.abs(x-center)<1e-8,'short gesture gets a centered texture column');
    assert.ok(r>=1,'dots remain visible at normal score resolution');
    assert.ok(y-r>boundary&&y+r<195,'dots fit between the local slope and baseline');
  }
});

test('noise density remains bounded and rises from tonal entrance to noisy end',()=>{
  const event=gesture('ramp',0,4,0);event.timbre.noise=[0,1];
  const svg=scoreSVG(study([event]));const counts=new Map();
  for(const [,x] of svg.matchAll(/<circle cx="([^"]+)"/g))counts.set(+x,(counts.get(+x)||0)+1);
  assert.ok(counts.size>1);assert.ok([...counts.values()].every(count=>count>=1&&count<=4));
  const columns=[...counts.entries()].sort((a,b)=>a[0]-b[0]);assert.ok(columns[0][1]<columns.at(-1)[1]);
});

test('microsecond rounding seams share a row but genuine overlaps keep separate rows',()=>{
  const first=gesture('a',0,1);
  for(const overlap of [0,1e-10,5e-7,9e-7,1e-6]){
    const row=layoutScore(study([first,gesture('b',1-overlap,1)])).rows[0];
    assert.equal(row.slots.get('a'),row.slots.get('b'));
  }
  for(const overlap of [2e-6,.001,.2]){
    const row=layoutScore(study([first,gesture('b',1-overlap,1)])).rows[0];
    assert.notEqual(row.slots.get('a'),row.slots.get('b'));
  }
});

test('long lane labels wrap completely inside the gutter without moving musical rows',()=>{
  const score=study([gesture('one',0,1)]);score.lanes[0].name='Mixture · suggested gestures';
  const before=layoutScore(score),svg=scoreSVG(score);
  const labels=[...svg.matchAll(/<text class="name"[^>]*textLength="([^"]+)"[^>]*>([^<]*)<\/text>/g)];
  assert.equal(labels.map(match=>match[2]).join(' '),score.lanes[0].name);
  assert.ok(labels.length>1);assert.ok(labels.every(match=>Number(match[1])<=150));
  assert.deepEqual(layoutScore(score),before);
  assert.match(svg,/<text class="small" x="25" y="191">1 gestures<\/text>/);
});
