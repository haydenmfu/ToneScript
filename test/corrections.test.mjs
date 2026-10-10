import test from 'node:test';
import assert from 'node:assert/strict';
import { examples } from '../src/examples.mjs';
import { parseScore,serialize } from '../src/score.mjs';
import { recordCorrections } from '../src/corrections.mjs';

const fixture=()=>structuredClone(examples[0]);
const at='2026-10-10T12:00:00.000Z';
test('corrections retain exact musical changes and legacy history through score serialization',()=>{
  const before=fixture();before.provenance.manualEdits=[{eventId:'old',action:'editor modification'}];
  const after=structuredClone(before),event=after.lanes[0].events[0],original=before.lanes[0].events[0];
  event.pitch=null;event.timbre.noise=[1,1];event.reviewed=false;
  assert.equal(recordCorrections(before,after,{action:'edit pitch',at}),true);
  const log=after.provenance.manualEdits.at(-1);
  assert.deepEqual(log.sourceEventIds,[event.id]);
  assert.deepEqual(log.changes.find(c=>c.field==='pitch'),{scope:'event',laneId:after.lanes[0].id,eventId:event.id,field:'pitch',before:original.pitch,after:null,beforePresent:true,afterPresent:true});
  assert.ok(log.changes.some(c=>c.field==='timbre.noise.0'&&c.after===1));
  assert.deepEqual(after.provenance.manualEdits[0],before.provenance.manualEdits[0]);
  assert.equal(before.provenance.manualEdits.length,1);
  assert.deepEqual(parseScore(serialize(after)),after);
});
test('adding, duplicating, and deleting gestures identify real targets and preserve lost data',()=>{
  const before=fixture(),after=structuredClone(before),source=before.lanes[0].events[0];
  const duplicated={...structuredClone(source),id:'duplicate',reviewed:false};after.lanes[0].events.push(duplicated);
  recordCorrections(before,after,{action:'duplicate gesture',sourceEventIds:[source.id],at});
  const added=after.provenance.manualEdits.at(-1);
  assert.deepEqual(added.sourceEventIds,[source.id]);assert.equal(added.changes[0].eventId,'duplicate');assert.deepEqual(added.changes[0].after,duplicated);
  const removed=structuredClone(after);removed.lanes[0].events=removed.lanes[0].events.filter(e=>e.id!==source.id);
  recordCorrections(after,removed,{action:'delete gesture',at});
  const deleted=removed.provenance.manualEdits.at(-1);
  assert.deepEqual(deleted.sourceEventIds,[source.id]);assert.deepEqual(deleted.changes[0].before,source);assert.equal(deleted.changes[0].afterPresent,false);
  assert.deepEqual(parseScore(serialize(removed)),removed);
});
test('review status is explicitly self-reported and a no-op creates no correction',()=>{
  const before=fixture(),after=structuredClone(before);
  assert.equal(recordCorrections(before,after,{at}),false);assert.deepEqual(after,before);
  after.lanes[0].events[0].reviewed=true;after.lanes[0].events[0].reviewNote='Compare entrance again';
  recordCorrections(before,after,{action:'change review status',at});
  const entry=after.provenance.manualEdits.at(-1);
  assert.match(entry.reviewMeaning,/not independently verified/);
  assert.ok(entry.changes.some(c=>c.field==='reviewNote'&&c.beforePresent===false));
  assert.deepEqual(parseScore(serialize(after)),after);
});
test('score and lane edits are logged without attributing them to an unrelated gesture',()=>{
  const before=fixture(),after=structuredClone(before);after.duration+=1;after.lanes.push({id:'empty',name:'New layer',events:[]});
  recordCorrections(before,after,{at});const entry=after.provenance.manualEdits.at(-1);
  assert.deepEqual(entry.sourceEventIds,[]);assert.ok(entry.changes.some(c=>c.scope==='score'&&c.field==='duration'));
  assert.ok(entry.changes.some(c=>c.scope==='lane'&&c.laneId==='empty'));
});
