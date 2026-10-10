import { examples } from './examples.mjs';
import { parseScore, serialize, assertScore } from './score.mjs';
import { encodeWav } from './synth.mjs';
import { scoreSVG } from './notation.mjs';
import { comparisonGains, signalMetrics } from './comparison.mjs';
import { recordCorrections } from './corrections.mjs';
const $ = id => document.getElementById(id);
let score = structuredClone(examples[0]);
let selected = score.lanes[0].events[0].id;
let history = [], context, source, reference, referenceName = '', referenceHash = '', started = 0, offset = 0, playing = false, raf, epoch = 0;
let referenceStart = 0, dirty = false;
let activeJob = null, referenceAttribution = null;
const builtInAudio = new Map();
let estimatedSources = new Map();
const studies = [...examples];
const autosaveKey = 'tonescript.editor.v1';
function persist() { try { localStorage.setItem(autosaveKey, serialize(score)); dirty = false; } catch { dirty = true; status('Browser storage is full or unavailable. Save the score before closing.', true); } }
function remember() { history.push({score:serialize(score),reference,referenceName,referenceHash,referenceAttribution,referenceStart,estimatedSources});if(history.length>100)history.shift(); }
function clearReference() { reference=null;referenceName='';referenceHash='';referenceAttribution=null;referenceStart=0;estimatedSources=new Map();$('reference-start').value=0; }
function replaceScore(next, message, keepReference=false) {stop(true);remember();score=assertScore(next);selected=score.lanes[0]?.events[0]?.id;estimatedSources=new Map();if(!keepReference)clearReference();persist();draw();status(message);}
function bufferMetrics(buffer) {
  let energy=0,peak=0;
  for(let c=0;c<buffer.numberOfChannels;c++){const metrics=signalMetrics(buffer.getChannelData(c));energy+=metrics.rms**2;peak=Math.max(peak,metrics.peak);}
  return {rms:Math.sqrt(energy/buffer.numberOfChannels),peak};
}
function referenceExcerpt() {
  if(!reference)throw new Error('Load a reference recording first.');
  const length=Math.min(score.duration,reference.duration-referenceStart);
  if(length<=0)throw new Error('The excerpt begins after the recording ends.');
  const buffer=context.createBuffer(reference.numberOfChannels,Math.max(1,Math.floor(length*reference.sampleRate)),reference.sampleRate);
  for(let c=0;c<reference.numberOfChannels;c++)buffer.copyToChannel(reference.getChannelData(c).subarray(Math.floor(referenceStart*reference.sampleRate),Math.floor(referenceStart*reference.sampleRate)+buffer.length),c);
  return buffer;
}
const worker = new Worker(new URL('./audio-worker.mjs', import.meta.url),{type:'module'});
const jobs = new Map(); let sequence = 0;
worker.onmessage = ({data}) => { const job=jobs.get(data.id);if(!job)return;jobs.delete(data.id);if(data.error)job.reject(new Error(data.error));else job.resolve(data.result); };
worker.onerror = () => { for(const job of jobs.values())job.reject(new Error('Audio worker failed. Reload to restart.'));jobs.clear(); };
function work(payload) {return new Promise((resolve,reject)=>{const id=++sequence;jobs.set(id,{resolve,reject});worker.postMessage({...payload,id});});}
async function mono22050(buffer) {
  if(buffer.sampleRate===22050) {const mono=new Float32Array(buffer.length);for(let c=0;c<buffer.numberOfChannels;c++){const a=buffer.getChannelData(c);for(let i=0;i<mono.length;i++)mono[i]+=a[i]/buffer.numberOfChannels;}return mono;}
  const offline=new OfflineAudioContext(1,Math.ceil(buffer.duration*22050),22050);
  const node=offline.createBufferSource();node.buffer=buffer;node.connect(offline.destination);node.start();
  return (await offline.startRendering()).getChannelData(0);
}
const sha256 = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
const status = (message, error = false) => { $('status').textContent = message; $('status').classList.toggle('error', error); };
const currentEvent = () => score.lanes.flatMap(l => l.events).find(e => e.id === selected);
const fields = [
  ['start', 'Start / seconds', 0, 300, .01], ['duration', 'Duration / seconds', .01, 300, .01],
  ['pitch', 'Pitch / MIDI, blank = unpitched', 24, 108, .01], ['gain', 'Level / 0–1', 0, 1, .01],
  ['brightness.0', 'Brightness / entrance', 0, 1, .01], ['brightness.1', 'Brightness / end', 0, 1, .01],
  ['noise.0', 'Noise / entrance', 0, 1, .01], ['noise.1', 'Noise / end', 0, 1, .01],
  ['attack', 'Entrance / seconds', .002, 300, .001], ['release', 'Release / seconds', .002, 300, .001],
  ['decay', 'Decay / 0–12', 0, 12, .1]
];
function valueAt(event, key) {
  if (['start','duration','pitch','gain'].includes(key)) return event[key];
  const [name, index] = key.split('.');
  return index === undefined ? event.timbre[name] : event.timbre[name][index];
}
function setValue(event, key, value) {
  if (['start','duration','pitch','gain'].includes(key)) event[key] = value;
  else {
    const [name, index] = key.split('.');
    if (index === undefined) event.timbre[name] = value; else event.timbre[name][index] = value;
  }
}
function draw() {
  $('score-title').textContent = score.title;
  $('provenance').textContent = score.provenance.note || score.provenance.kind;
  $('score').innerHTML = scoreSVG(score, {selected,interactive:true});
  $('score').style.width=`${+$('zoom').value*100}%`;
  $('gesture').replaceChildren(new Option('Select…',''),...score.lanes.flatMap(l=>l.events.map(e=>new Option(`${l.name} · ${e.start.toFixed(2)}s`,e.id))));
  $('gesture').value=selected || '';
  $('seek').max = score.duration;
  $('score-duration').value=score.duration;
  $('undo').disabled = history.length === 0;
  $('analyze').disabled = !reference;
  $('separate').disabled = !reference;
  $('reference-info').textContent=reference ? `${referenceName} · using ${referenceStart.toFixed(2)}–${Math.min(reference.duration,referenceStart+score.duration).toFixed(2)}s of the file. Score time starts at zero.${reference.duration-referenceStart<score.duration?' Recording ends before the score.':''}` : 'No reference loaded. Load the matching recording before comparing.';
  $('source-links').replaceChildren();
  const p=score.provenance;
  $('load-example-audio').hidden=!builtInAudio.has(p.source?.reference||score.title);
  for(const [label,url] of [['Recording source',p.sourceUrl||p.url||p.source?.reference||p.source?.url],['Rights / access',p.licenseUrl||p.source?.licenseUrl]]) {if(typeof url==='string'&&/^https?:\/\//i.test(url)){const a=document.createElement('a');a.href=url;a.textContent=label;a.target='_blank';a.rel='noopener noreferrer';$('source-links').append(a);}}
  if(p.source?.title){const text=document.createElement('small');text.textContent=`${p.source.artist||''} · ${p.source.title} · ${p.source.excerptStart??0}–${p.source.excerptEnd??score.duration}s · ${p.source.license||''}`;$('source-links').append(text);}
  if(p.excerpt){const text=document.createElement('small');text.textContent=`Source excerpt: ${typeof p.excerpt==='string'?p.excerpt:JSON.stringify(p.excerpt)}`;$('source-links').append(text);}
  const solo = $('solo').value;
  $('solo').replaceChildren(new Option('All layers', ''), ...score.lanes.map(l => new Option(l.name, l.id)));
  if (score.lanes.some(l => l.id === solo)) $('solo').value = solo;
  const event = currentEvent();
  $('gesture-name').value=event?.label||'';$('gesture-note').value=event?.reviewNote||'';$('reviewed').checked=event?.reviewed===true;
  for(const id of ['gesture-name','gesture-note','reviewed','duplicate'])$(id).disabled=!event;
  const all=score.lanes.flatMap(l=>l.events);$('review-count').textContent=`${all.filter(e=>e.reviewed).length} of ${all.length} gestures marked reviewed by the editor user. ${Array.isArray(p.manualEdits)?p.manualEdits.length:0} saved correction records. Listening is not independently verified.`;
  $('event-title').textContent = event ? event.label || `Gesture at ${event.start.toFixed(2)}s` : 'Choose a gesture';
  $('delete').disabled = !event;
  $('inspector').replaceChildren();
  if (event) for (const [key, label, min, max, step] of fields) {
    const wrapper = document.createElement('label'); wrapper.textContent = label;
    const input = document.createElement('input'); input.type = 'number'; input.min = min; input.max = max; input.step = step; input.value = valueAt(event, key) ?? ''; input.dataset.key = key;
    if(event.pitch===null && key.startsWith('noise.')) input.disabled=true;
    wrapper.append(input); $('inspector').append(wrapper);
    if(key==='pitch'&&event.pitch!==null){const note=document.createElement('small');const midi=Math.round(event.pitch);note.textContent=`${['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][midi%12]}${Math.floor(midi/12)-1} · pitch scaffolding`;wrapper.append(note);}
  }
  updateCursor(offset);
}
function mutate(fn, correction={}) {
  const next = structuredClone(score);
  fn(next);
  assertScore(next);
  if(!recordCorrections(score,next,correction))return;
  stop(); remember(); score = next; persist(); draw();
}
function updateCursor(t) {
  $('seek').value = t;
  $('clock').textContent = `${t.toFixed(2)} / ${score.duration.toFixed(2)}s`;
  const svg = $('score').querySelector('svg');
  const w = svg?.getBoundingClientRect().width || 0;
  $('playhead').style.left = `${(190 + (t / score.duration) * 975) / 1200 * w}px`;
  $('playhead').style.top = `${110 / 1200 * w}px`;
  $('playhead').style.height = `${(Number(svg?.dataset.gridBottom || 260)-110) / 1200 * w}px`;
  $('playhead').style.display = 'block';
}
function stop(reset = false) {
  epoch++;
  if (playing) offset = Math.min(score.duration, context.currentTime - started);
  playing = false;
  if (source) { source.onended = null; source.stop(); source = null; }
  cancelAnimationFrame(raf);
  if (reset) offset = 0;
  updateCursor(offset); $('play').textContent = '▶ Play';
}
function tick() { if (!playing) return; updateCursor(Math.min(score.duration, context.currentTime - started)); raf = requestAnimationFrame(tick); }
async function play() {
  if (playing) { stop(); return; }
  try {
    const request=++epoch;
    context ||= new AudioContext({sampleRate:22050}); await context.resume();
    let buffer;
    const mode=$('mode').value;
    if(mode==='estimated'&&!estimatedSources.has($('solo').value))throw new Error('Choose an estimated layer under Listen to. Estimated audio is available after separating the current reference; it is not score synthesis.');
    let result,comparison;
    if((mode!=='original'&&mode!=='estimated') || $('level-match').checked) {
      status('Rendering the saved score…');
      result=await work({kind:'render',score,options:{neutral:mode==='neutral',laneId:$('solo').value || null}});
      if($('level-match').checked) comparison=await work({kind:'render',score,options:{neutral:mode!=='neutral',laneId:$('solo').value || null}});
      if(request!==epoch)return;
    }
    if(mode==='estimated') {
      const stem=estimatedSources.get($('solo').value);
      if(!stem.buffer){status(`Loading estimated ${stem.name} audio…`);const response=await fetch(stem.url);if(!response.ok)throw new Error('Estimated audio is no longer available. Separate the reference again.');const bytes=await response.arrayBuffer();const decoded=await context.decodeAudioData(bytes);if(request!==epoch)return;stem.buffer=decoded;}
      buffer=stem.buffer;
      if(offset>=buffer.duration)offset=0;
      status(`Estimated ${stem.name} source audio · audio from separation, not reconstruction from the notation. Score edits do not change this recording.`);
    } else if (mode === 'original') {
      if (!reference) throw new Error('Load a reference audio file first. It is used only for original playback.');
      buffer = referenceExcerpt();
      if (offset >= buffer.duration) offset = 0;
      status(`Original reference: ${referenceName} · excerpt begins at ${referenceStart.toFixed(2)}s in the file. Layer solo applies only to score playback.`);
    } else {
      buffer = context.createBuffer(1, result.samples.length, result.sampleRate); buffer.copyToChannel(result.samples,0);
      status(`Score-only synthesis · peak ${result.metrics.peak.toFixed(3)} · ${result.metrics.limitedSamples} limited samples. Perceptual quality still needs listening assessment.`);
    }
    if(request!==epoch)return;
    if (offset >= score.duration) offset = 0;
    let playbackGain=1;
    if($('level-match').checked) {
      const referenceMetrics=reference ? bufferMetrics(referenceExcerpt()) : null;
      if(request!==epoch)return;
      const metrics=[result.metrics,comparison.metrics,...(referenceMetrics?[referenceMetrics]:[])];
      const playbackIndex=mode==='estimated'?metrics.push(bufferMetrics(buffer))-1:mode==='original'?2:0;
      const match=comparisonGains(metrics);playbackGain=match.gains[playbackIndex];
      const limited=Math.max(result.metrics.limitedSamples||0,comparison.metrics.limitedSamples||0);
      status(`${mode==='original'?'Original reference':mode==='estimated'?'Estimated source audio (not score reconstruction)':'Score-only synthesis'} · equal-RMS comparison target ${match.target.toFixed(4)}. Stereo peak headroom is preserved; RMS is approximate perceived-loudness matching.${limited?` Warning: the score limiter changed up to ${limited} samples; reduce gesture levels for a cleaner comparison.`:''}`,limited>0);
    }
    source = context.createBufferSource(); source.buffer = buffer;
    const volume=context.createGain();volume.gain.value=playbackGain;source.connect(volume);volume.connect(context.destination);
    started = context.currentTime - offset; playing = true;
    source.onended = () => { playing = false; source = null; offset = 0; cancelAnimationFrame(raf); updateCursor(0); $('play').textContent = '▶ Play'; };
    source.start(0,offset, Math.min(buffer.duration - offset, score.duration - offset));
    $('play').textContent = 'Ⅱ Pause'; tick();
  } catch (error) { status(error.message, true); }
}
function download(data, name, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
}
$('example').replaceChildren(...studies.map((s,i) => new Option(s.title,i)));
$('example').onchange = () => { replaceScore(structuredClone(studies[+$('example').value]),'Study loaded. Undo restores your previous score. Load its matching recording to compare.'); };
$('reset').onclick = () => $('example').onchange();
$('zoom').onchange = () => draw();
$('gesture').onchange = () => {selected=$('gesture').value;draw();};
$('score').onclick = event => { const target = event.target.closest('[data-event]'); if (target) { selected = target.dataset.event; draw(); } };
$('score').onkeydown = event => { if (['Enter',' '].includes(event.key) && event.target.dataset.event) { event.preventDefault(); selected = event.target.dataset.event; draw(); } };
$('inspector').onsubmit = e => e.preventDefault();
$('inspector').onchange = event => {
  const key = event.target.dataset.key; if (!key) return;
  const value = key === 'pitch' && event.target.value === '' ? null : Number(event.target.value);
  try { mutate(next => { const e=next.lanes.flatMap(l => l.events).find(e => e.id === selected);if(valueAt(e,key)===value)return;setValue(e,key,value);e.reviewed=false;if(key==='pitch'&&value===null)e.timbre.noise=[1,1]; },{action:`edit gesture ${key}`}); status('Gesture saved. Play to compare and review any changed sound.'); }
  catch (error) { status(error.message,true); draw(); }
};
$('undo').onclick = () => { if (!history.length) return; stop();const previous=history.pop();score=parseScore(previous.score);reference=previous.reference;referenceName=previous.referenceName;referenceHash=previous.referenceHash;referenceAttribution=previous.referenceAttribution;referenceStart=previous.referenceStart;estimatedSources=previous.estimatedSources;$('reference-start').value=referenceStart;offset=Math.min(offset,score.duration);selected=score.lanes[0]?.events[0]?.id;persist();draw();status('Previous score restored with its matching reference and estimated layers.'); };
$('add').onclick = () => {
  const start = Math.min(offset, Math.max(0, score.duration - .5));
  const duration = Math.min(1, score.duration-start);
  const id = crypto.randomUUID();
  try { mutate(next => {
    if (!next.lanes.length) next.lanes.push({id:'layer-1',name:'New layer',events:[]});
    const lane=next.lanes.find(l=>l.id===$('solo').value)||next.lanes.find(l=>l.events.some(e=>e.id===selected))||next.lanes[0];
    lane.events.push({id,start,duration,pitch:60,gain:.5,timbre:{brightness:[.3,.6],noise:[0,0],attack:Math.min(.03,duration/4),release:Math.min(.15,duration/4),decay:0}});
  },{action:'add gesture'}); selected = id; draw(); } catch (error) { status(error.message,true); }
};
$('add-lane').onclick = () => {try{const id=crypto.randomUUID();mutate(next=>next.lanes.push({id,name:`Layer ${next.lanes.length+1}`,events:[]}),{action:'add layer'});$('solo').value=id;status('Layer added. Add a gesture to populate it.');}catch(error){status(error.message,true);}};
$('delete').onclick = () => {try{mutate(next => { for (const lane of next.lanes) lane.events = lane.events.filter(e => e.id !== selected); },{action:'delete gesture'}); selected = null; draw();}catch(error){status(error.message,true);} };
$('play').onclick = play; $('stop').onclick = () => stop(true);
$('mode').onchange = () => stop(); $('solo').onchange = () => stop(); $('level-match').onchange = () => stop();
$('seek').oninput = () => { const next = +$('seek').value; stop(); offset = next; updateCursor(offset); };
$('save').onclick = () => download(serialize(score),'tonescript.score.json','application/json');
$('svg').onclick = () => download(scoreSVG(score),'tonescript.score.svg','image/svg+xml');
$('wav').onclick = async () => {
  try { const result = await work({kind:'render',score,options:{neutral:$('mode').value === 'neutral',laneId:$('solo').value || null}}); download(encodeWav(result.samples,result.sampleRate),'tonescript.reconstruction.wav','audio/wav'); status('Exported unadjusted score reconstruction (never the reference recording).'); }
  catch (error) { status(error.message,true); }
};
$('open-score').onchange = async event => {
  stop(true);const request=epoch;
  try { const file = event.target.files[0]; if (!file) return; if (file.size > 5e6) throw new Error('Score file exceeds 5 MB limit'); const next = parseScore(await file.text());if(request!==epoch)return;replaceScore(next,'Score loaded and validated.'); } catch (error) { if(request===epoch)status(error.message,true); } finally { event.target.value = ''; }
};
$('open-audio').onchange = async event => {
  stop(true);const request=epoch;
  try { const file = event.target.files[0]; if (!file) return; if (file.size > 100e6) throw new Error('Use a short excerpt under 100 MB'); context ||= new AudioContext({sampleRate:22050}); const bytes=await file.arrayBuffer(),hash=await sha256(bytes);const decoded = await context.decodeAudioData(bytes); if(decoded.duration>120)throw new Error('Trim the recording to at most 120 seconds before loading.');if(request!==epoch)return;clearReference(); reference = decoded; referenceName=file.name;referenceHash=hash;draw();status(`Loaded ${file.name} (${decoded.duration.toFixed(2)}s). Analysis uses the displayed excerpt boundaries; change score length or excerpt start if needed.`); } catch (error) { if(request===epoch)status(error.message,true); } finally { event.target.value = ''; }
};
$('analyze').onclick = async () => {
  if(!reference)return;
  stop(true);const request=epoch;$('analyze').disabled=true;
  try {
    status('Analyzing the reference locally…');const samples=await mono22050(referenceExcerpt());if(request!==epoch)return;
    const result=await work({kind:'analyze',samples,sampleRate:22050,options:{title:referenceName.replace(/\.[^.]+$/,''),sourceName:referenceName,sourceHash:referenceHash}});
    if(request!==epoch)return;
    if(referenceAttribution)result.score.provenance.source=structuredClone(referenceAttribution);
    result.score.provenance.excerptStart=referenceStart;result.score.provenance.excerptEnd=referenceStart+samples.length/22050;remember();estimatedSources=new Map();score=result.score;selected=score.lanes[0]?.events[0]?.id;persist();draw();
    status(`Created ${result.report.events} unreviewed gestures. Dominant pitch can be wrong in mixtures; correct suggestions by listening.`);
  }catch(error){if(request===epoch)status(error.message,true);}finally{$('analyze').disabled=!reference;}
};
$('open-stems').onchange = async event => {
  const files=[...event.target.files];if(!files.length)return;
  stop(true);const request=epoch;
  try {
    if(files.length>8)throw new Error('Import at most eight short layers at once.');
    const next={...structuredClone(score),lanes:[],provenance:{kind:'imported audio layers; automatic unreviewed suggestions',analyzer:'spectral-gesture-v1',sources:[],manualEdits:[]}};
    let duration=null;context ||= new AudioContext({sampleRate:22050});
    for(const [i,file] of files.entries()) {
      if(request!==epoch)return;
      if(file.size>100e6)throw new Error('Each layer must be below 100 MB.');
      status(`Analyzing layer ${i+1} of ${files.length}: ${file.name}`);
      const bytes=await file.arrayBuffer(),hash=await sha256(bytes),buffer=await context.decodeAudioData(bytes);
      if(buffer.duration>120)throw new Error('Each layer must be at most 120 seconds.');
      if(duration!==null&&Math.abs(duration-buffer.duration)>.05)throw new Error('Layers must have matching durations and start at the same excerpt boundary.');
      duration=buffer.duration;const samples=await mono22050(buffer);
      const {score:part}=await work({kind:'analyze',samples,sampleRate:22050,options:{sourceName:file.name,sourceHash:hash}});
      const lane=part.lanes[0];lane.id=`import-${i}`;lane.name=file.name.replace(/\.[^.]+$/,'').slice(0,40);
      for(const e of lane.events)e.id=`layer-${i}-${e.id}`;
      next.lanes.push(lane);next.provenance.sources.push(part.provenance);next.duration=Math.max(next.lanes.length===1?0:next.duration,part.duration);
    }
    if(request!==epoch)return;replaceScore(next,'Aligned layers imported. Load their matching mix to compare. Labels are estimates; review every suggestion.');
  }catch(error){if(request===epoch)status(error.message,true);}finally{event.target.value='';}
};
window.addEventListener('resize', () => updateCursor(offset));
$('score-duration').onchange=()=>{try{mutate(next=>next.duration=Number($('score-duration').value),{action:'change score length'});offset=Math.min(offset,score.duration);draw();}catch(error){status(`Length must include every gesture. ${error.message}`,true);draw();}};
$('reference-start').onchange=()=>{stop(true);const value=Number($('reference-start').value);if(!Number.isFinite(value)||value<0||(reference&&value>=reference.duration)){$('reference-start').value=referenceStart;status('Choose a start time inside the recording.',true);return;}if(value!==referenceStart)estimatedSources=new Map();referenceStart=value;draw();};
$('cancel-analysis').onclick=async()=>{stop();draw();const job=activeJob;activeJob=null;status('Pending analysis results dismissed.');if(job){try{const response=await fetch(`/api/jobs/${encodeURIComponent(job)}`,{method:'DELETE'});if(!response.ok)throw new Error('The server job could not be cancelled; its result will be ignored. You can retry Cancel analysis.');status('Analysis cancelled.');}catch(error){activeJob ||= job;status(error.message,true);}}};
$('load-example-audio').onclick=async()=>{const name=builtInAudio.get(score.provenance.source?.reference||score.title);if(!name)return;stop(true);const request=epoch;try{status('Loading the matching reference from the local server…');const response=await fetch(`/api/examples/${name}/audio`);if(!response.ok)throw new Error('This recording is not installed locally. Use Load reference audio to open your copy.');const bytes=await response.arrayBuffer(),hash=await sha256(bytes);context ||= new AudioContext({sampleRate:22050});const decoded=await context.decodeAudioData(bytes);if(request!==epoch)return;clearReference();reference=decoded;referenceHash=hash;referenceName=`${name}.wav`;referenceAttribution=structuredClone(score.provenance.source||null);draw();status('Matching reference loaded. Compare original, neutral tone, and your timbre score.');}catch(error){if(request===epoch)status(error.message,true);}};
for(const [id,key] of [['gesture-name','label'],['gesture-note','reviewNote'],['reviewed','reviewed']])$(id).onchange=()=>{try{mutate(next=>{const e=next.lanes.flatMap(l=>l.events).find(e=>e.id===selected);e[key]=id==='reviewed'?$(id).checked:$(id).value;},{action:key==='reviewed'?'change self-reported review status':`edit gesture ${key}`});status('Listening notes saved in your score.');}catch(error){status(error.message,true);}};
$('duplicate').onclick=()=>{const original=currentEvent();if(!original)return;const id=crypto.randomUUID();try{mutate(next=>{const lane=next.lanes.find(l=>l.events.some(e=>e.id===selected));const e=structuredClone(original);e.id=id;e.start=Math.min(original.start+original.duration,score.duration-original.duration);e.reviewed=false;delete e.reviewNote;lane.events.push(e);},{action:'duplicate gesture',sourceEventIds:[original.id]});selected=id;draw();status('Gesture duplicated without its prior listening notes. Adjust its start and review it.');}catch(error){status(error.message,true);}};
$('png').onclick=async()=>{
  let url;
  try{
    const doc=new DOMParser().parseFromString(scoreSVG(score),'image/svg+xml');const svg=doc.documentElement;const box=svg.getAttribute('viewBox').split(/\s+/).map(Number);
    svg.setAttribute('width',box[2]);svg.setAttribute('height',box[3]);url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
    const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Could not render notation image'));img.src=url;});
    const canvas=document.createElement('canvas');canvas.width=2400;canvas.height=Math.round(2400*box[3]/box[2]);const ctx=canvas.getContext('2d');ctx.fillStyle='#faf8f1';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Image export failed');download(blob,'tonescript.score.png','image/png');status('Notation exported as a PNG image.');
  }catch(error){status(error.message,true);}finally{if(url)URL.revokeObjectURL(url);}
};
$('separate').onclick=async()=>{
  if(!reference)return;stop(true);const request=epoch;$('separate').disabled=true;
  try{
    status('Preparing the selected excerpt for local separation…');const samples=await mono22050(referenceExcerpt());if(request!==epoch)return;
    const response=await fetch(`/api/separate?method=${encodeURIComponent($('separation-method').value)}&title=${encodeURIComponent(referenceName.slice(0,160))}`,{method:'POST',headers:{'Content-Type':'audio/wav'},body:encodeWav(samples,22050)});
    const job=await response.json();if(!response.ok)throw new Error(job.error||'Local separation server is unavailable.');activeJob=job.id;if(request!==epoch){await fetch(`/api/jobs/${encodeURIComponent(job.id)}`,{method:'DELETE'});activeJob=null;return;}
    while(request===epoch){
      await new Promise(resolve=>setTimeout(resolve,1200));if(request!==epoch)return;
      const response=await fetch(job.statusUrl);const state=await response.json();
      if(!response.ok||state.status==='failed'){activeJob=null;throw new Error(state.error||'Separation failed');}
      if(request!==epoch)return;
      if(state.status==='completed'){
        activeJob=null;const result=await fetch(state.scoreUrl);if(!result.ok)throw new Error('Could not load the separated score.');const next=parseScore(await result.text());if(request!==epoch)return;
        if(referenceAttribution)next.provenance.source=structuredClone(referenceAttribution);
        next.provenance.excerptStart=referenceStart;next.provenance.excerptEnd=referenceStart+samples.length/22050;
        replaceScore(next,'Separated layers converted to unreviewed score suggestions. Choose an individual layer and Estimated source audio to audition its separation, then compare with Score reconstruction.',true);
        estimatedSources=new Map((state.stems||[]).filter(stem=>next.lanes.some(lane=>lane.id===stem.name)).map(stem=>[stem.name,{name:stem.name,url:stem.url,buffer:null}]));return;
      }
      status('Separating layers locally… You can cancel to dismiss the result.');
    }
  }catch(error){if(request===epoch)status(error.message,true);}finally{$('separate').disabled=!reference;}
};
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
try{const saved=localStorage.getItem(autosaveKey);if(saved){score=parseScore(saved);selected=score.lanes[0]?.events[0]?.id;status('Recovered your last score. Load its matching recording to compare; recordings are not autosaved.');}}catch{status('Could not restore the last browser draft. You can open a saved score.',true);}
draw();
Promise.allSettled(['trumpet','choice'].map(async name=>{const response=await fetch(`/examples/${name}.json`);if(!response.ok)return;const study=parseScore(await response.text());studies.push(study);builtInAudio.set(study.provenance.source?.reference||study.title,name);$('example').append(new Option(`${study.title} · draft`,studies.length-1));$('load-example-audio').hidden=!builtInAudio.has(score.provenance.source?.reference||score.title);}));
