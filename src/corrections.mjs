import { assertScore } from './score.mjs';

const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const copy = value => value === undefined ? null : structuredClone(value);

function fields(before, after, location, changes, prefix='') {
  for(const key of new Set([...Object.keys(before),...Object.keys(after)])) {
    const a=before[key],b=after[key],path=prefix?`${prefix}.${key}`:key;
    if(same(a,b))continue;
    if(a!==null&&b!==null&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)) {
      fields(a,b,location,changes,path);
    } else changes.push({...location,field:path,before:copy(a),after:copy(b),beforePresent:Object.hasOwn(before,key),afterPresent:Object.hasOwn(after,key)});
  }
}

/** Record document differences, not claims that an edit was musically correct or heard. */
export function recordCorrections(before, after, {action='edit score',at=new Date().toISOString(),sourceEventIds=[]}={}) {
  assertScore(before);assertScore(after);
  const changes=[];
  const without=(object,keys)=>Object.fromEntries(Object.entries(object).filter(([key])=>!keys.includes(key)));
  fields(without(before,['lanes','provenance']),without(after,['lanes','provenance']),{scope:'score'},changes);
  const oldLanes=new Map(before.lanes.map(l=>[l.id,l])),newLanes=new Map(after.lanes.map(l=>[l.id,l]));
  const oldEvents=new Map(before.lanes.flatMap(l=>l.events.map(e=>[e.id,{laneId:l.id,event:e}])));
  const newEvents=new Map(after.lanes.flatMap(l=>l.events.map(e=>[e.id,{laneId:l.id,event:e}])));
  for(const id of new Set([...oldLanes.keys(),...newLanes.keys()])) {
    const old=oldLanes.get(id),next=newLanes.get(id);
    fields(old?without(old,['events']):{},next?without(next,['events']):{},{scope:'lane',laneId:id},changes);
  }
  for(const id of new Set([...oldEvents.keys(),...newEvents.keys()])) {
    const old=oldEvents.get(id),next=newEvents.get(id),location={scope:'event',laneId:next?.laneId||old.laneId,eventId:id};
    if(!old||!next)changes.push({...location,field:'event',before:copy(old?.event),after:copy(next?.event),beforePresent:!!old,afterPresent:!!next});
    else {
      if(old.laneId!==next.laneId)changes.push({...location,field:'laneId',before:old.laneId,after:next.laneId,beforePresent:true,afterPresent:true});
      fields(old.event,next.event,location,changes);
    }
  }
  if(!changes.length)return false;
  if(after.provenance.manualEdits!==undefined&&!Array.isArray(after.provenance.manualEdits))throw new Error('Existing correction history must be an array; it has not been overwritten.');
  const affected=new Set(changes.filter(c=>c.scope==='event').map(c=>c.eventId));
  const sources=[...new Set([...sourceEventIds,...[...affected].filter(id=>oldEvents.has(id))])];
  const entry={version:1,at,action,sourceEventIds:sources,changes};
  if(changes.some(c=>c.field==='reviewed'))entry.reviewMeaning='Self-reported editor review status; listening and musical correctness are not independently verified.';
  after.provenance.manualEdits=[...(after.provenance.manualEdits||[]),entry];
  return true;
}
