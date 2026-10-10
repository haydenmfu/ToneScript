import { examples } from './examples.mjs';
import { parseScore, serialize, assertScore } from './score.mjs';
import { renderScore, encodeWav } from './synth.mjs';
import { scoreSVG } from './notation.mjs';
const $ = id => document.getElementById(id);
let score = structuredClone(examples[0]);
let selected = score.lanes[0].events[0].id;
let history = [], context, source, reference, referenceName = '', started = 0, offset = 0, playing = false, raf;
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
  $('score').innerHTML = scoreSVG(score, {selected});
  $('seek').max = score.duration;
  $('undo').disabled = history.length === 0;
  const solo = $('solo').value;
  $('solo').replaceChildren(new Option('All layers', ''), ...score.lanes.map(l => new Option(l.name, l.id)));
  if (score.lanes.some(l => l.id === solo)) $('solo').value = solo;
  const event = currentEvent();
  $('event-title').textContent = event ? event.label || `Gesture at ${event.start.toFixed(2)}s` : 'Choose a gesture';
  $('delete').disabled = !event;
  $('inspector').replaceChildren();
  if (event) for (const [key, label, min, max, step] of fields) {
    const wrapper = document.createElement('label'); wrapper.textContent = label;
    const input = document.createElement('input'); input.type = 'number'; input.min = min; input.max = max; input.step = step; input.value = valueAt(event, key) ?? ''; input.dataset.key = key;
    wrapper.append(input); $('inspector').append(wrapper);
  }
  updateCursor(offset);
}
function mutate(fn) {
  const next = structuredClone(score);
  fn(next); assertScore(next);
  stop(); history.push(serialize(score)); if (history.length > 100) history.shift(); score = next; draw();
}
function updateCursor(t) {
  $('seek').value = t;
  $('clock').textContent = `${t.toFixed(2)} / ${score.duration.toFixed(2)}s`;
  const svg = $('score').querySelector('svg');
  const w = svg?.getBoundingClientRect().width || 0;
  $('playhead').style.left = `${(190 + (t / score.duration) * 975) / 1200 * w}px`;
  $('playhead').style.display = 'block';
}
function stop(reset = false) {
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
    context ||= new AudioContext(); await context.resume();
    let buffer;
    if ($('mode').value === 'original') {
      if (!reference) throw new Error('Load a reference audio file first. It is used only for original playback.');
      buffer = reference;
      if (offset >= buffer.duration) offset = 0;
      status(`Original reference: ${referenceName}. Starts at file time zero; load an already-trimmed excerpt for alignment.`);
    } else {
      status('Rendering the saved score…');
      await new Promise(resolve => requestAnimationFrame(resolve));
      const result = renderScore(score, { neutral: $('mode').value === 'neutral', laneId: $('solo').value || null });
      buffer = context.createBuffer(1, result.samples.length, result.sampleRate); buffer.copyToChannel(result.samples,0);
      status(`Score-only synthesis · peak ${result.metrics.peak.toFixed(3)} · ${result.metrics.limitedSamples} limited samples. Perceptual quality still needs listening assessment.`);
    }
    if (offset >= score.duration) offset = 0;
    source = context.createBufferSource(); source.buffer = buffer; source.connect(context.destination);
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
$('example').replaceChildren(...examples.map((s,i) => new Option(s.title,i)));
$('example').onchange = () => { stop(true); score = structuredClone(examples[+$('example').value]); selected = score.lanes[0]?.events[0]?.id; history = []; reference = null; draw(); status('Synthetic study loaded.'); };
$('reset').onclick = () => $('example').onchange();
$('score').onclick = event => { const target = event.target.closest('[data-event]'); if (target) { selected = target.dataset.event; draw(); } };
$('score').onkeydown = event => { if (['Enter',' '].includes(event.key) && event.target.dataset.event) { event.preventDefault(); selected = event.target.dataset.event; draw(); } };
$('inspector').onsubmit = e => e.preventDefault();
$('inspector').onchange = event => {
  const key = event.target.dataset.key; if (!key) return;
  const value = key === 'pitch' && event.target.value === '' ? null : Number(event.target.value);
  try { mutate(next => setValue(next.lanes.flatMap(l => l.events).find(e => e.id === selected), key, value)); status('Gesture updated. Play to compare.'); }
  catch (error) { status(error.message,true); draw(); }
};
$('undo').onclick = () => { if (!history.length) return; stop(); score = parseScore(history.pop()); draw(); status('Previous score restored.'); };
$('add').onclick = () => {
  const start = Math.min(offset, Math.max(0, score.duration - .5));
  const duration = Math.min(1, score.duration-start);
  const id = crypto.randomUUID();
  try { mutate(next => {
    if (!next.lanes.length) next.lanes.push({id:'layer-1',name:'New layer',events:[]});
    next.lanes[0].events.push({id,start,duration,pitch:60,gain:.5,timbre:{brightness:[.3,.6],noise:[0,0],attack:Math.min(.03,duration/4),release:Math.min(.15,duration/4),decay:0}});
  }); selected = id; draw(); } catch (error) { status(error.message,true); }
};
$('delete').onclick = () => { mutate(next => { for (const lane of next.lanes) lane.events = lane.events.filter(e => e.id !== selected); }); selected = null; draw(); };
$('play').onclick = play; $('stop').onclick = () => stop(true);
$('mode').onchange = () => stop(); $('solo').onchange = () => stop();
$('seek').oninput = () => { const next = +$('seek').value; stop(); offset = next; updateCursor(offset); };
$('save').onclick = () => download(serialize(score),'tonescript.score.json','application/json');
$('svg').onclick = () => download(scoreSVG(score),'tonescript.score.svg','image/svg+xml');
$('wav').onclick = () => {
  try { const result = renderScore(score,{neutral:$('mode').value === 'neutral',laneId:$('solo').value || null}); download(encodeWav(result.samples,result.sampleRate),'tonescript.reconstruction.wav','audio/wav'); status('Exported score reconstruction (never the reference recording).'); }
  catch (error) { status(error.message,true); }
};
$('open-score').onchange = async event => {
  try { const file = event.target.files[0]; if (!file) return; if (file.size > 5e6) throw new Error('Score file exceeds 5 MB limit'); const next = parseScore(await file.text()); stop(true); score = next; selected = score.lanes[0]?.events[0]?.id; history=[]; reference=null; draw(); status('Score loaded and validated.'); } catch (error) { status(error.message,true); } finally { event.target.value = ''; }
};
$('open-audio').onchange = async event => {
  try { const file = event.target.files[0]; if (!file) return; if (file.size > 100e6) throw new Error('Use a short excerpt under 100 MB'); context ||= new AudioContext(); const decoded = await context.decodeAudioData(await file.arrayBuffer()); stop(true); reference = decoded; referenceName=file.name; status(`Loaded ${file.name} (${decoded.duration.toFixed(2)}s). Reference audio is separate from the score and is not saved in it.`); } catch (error) { status(error.message,true); } finally { event.target.value = ''; }
};
window.addEventListener('resize', () => updateCursor(offset));
draw();
