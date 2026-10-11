import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { decodeWav } from '../src/wav.mjs';
import { analyzeAudio } from '../src/analysis.mjs';
import { serialize } from '../src/score.mjs';
import { scoreSVG,escapeXML } from '../src/notation.mjs';
import { renderScore,encodeWav } from '../src/synth.mjs';
import { comparisonGains,signalMetrics } from '../src/comparison.mjs';
const {sources}=JSON.parse(await readFile('data/sources.json','utf8'));
for(const dir of ['examples','docs/scores','outputs/studies'])await mkdir(dir,{recursive:true});
async function analyze(path,options) {
  const data=await readFile(path),wav=decodeWav(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength));
  return {...analyzeAudio(wav.samples,wav.sampleRate,{...options,sourceHash:createHash('sha256').update(data).digest('hex')}),audio:wav};
}
for(const source of sources) {
  const input=`data/raw/${source.id}.wav`;
  const mixture=await analyze(input,{title:`${source.artist} · ${source.title}`,sourceName:source.id});
  let score=mixture.score;
  const report={mixture:mixture.report,review:'pending; not a final listening transcription'};
  if(source.id==='choice') {
    const separation=JSON.parse(await readFile('outputs/separation/choice-demucs/report.json','utf8'));
    score.lanes=[];score.provenance.layers=[];
    for(const stem of separation.stems) {
      const part=await analyze(`outputs/separation/choice-demucs/${stem.name}-22050.wav`,{sourceName:`Choice / estimated ${stem.name}`});
      const lane=part.score.lanes[0];lane.id=stem.name;lane.name=`Estimated ${stem.name}`;
      for(const e of lane.events)e.id=`${stem.name}-${e.id}`;
      score.lanes.push(lane);score.provenance.layers.push(part.score.provenance);report[stem.name]=part.report;
    }
    score.provenance.separation=separation;
  }
  score.provenance.source=source;
  score.provenance.note='Applied draft from recorded audio. Automatic suggestions require listening corrections; instrument labels describe estimated source groups.';
  await writeFile(`examples/${source.id}.json`,serialize(score));
  await writeFile(`docs/scores/${source.id}.svg`,scoreSVG(score));
  const table=score.lanes.flatMap(l=>l.events.map(e=>`<tr><td>${escapeXML(l.name)}</td><td>${e.start.toFixed(3)}</td><td>${e.duration.toFixed(3)}</td><td>${e.pitch??'unpitched'}</td><td>${e.gain}</td><td>${e.timbre.brightness.join(' → ')}</td><td>${e.timbre.noise.join(' → ')}</td><td>${e.timbre.attack}</td><td>${e.timbre.release}</td><td>${e.timbre.decay}</td></tr>`)).join('\n');
  await writeFile(`docs/scores/${source.id}.html`,`<!doctype html><html lang="en"><meta charset="utf-8"><title>${escapeXML(score.title)} — draft score</title><style>body{font:14px Arial;margin:30px;color:#243443}svg{width:100%}table{border-collapse:collapse;width:100%;font-size:11px}td,th{padding:6px;border:1px solid #bbb;text-align:left}h1{font-size:24px}@media print{thead{display:table-header-group}tr{break-inside:avoid}body{margin:0}}</style><h1>${escapeXML(score.title)}</h1><p><b>Draft — listening review pending.</b> Excerpt ${source.excerptStart}–${source.excerptEnd}s of the linked reference file. ${escapeXML(source.license)}. ${escapeXML(source.adaptation||'')}</p><p><a href="${escapeXML(source.reference)}">Original source</a> · <a href="${escapeXML(source.audio)}">Exact reference audio version</a> · <a href="${source.licenseUrl}">License</a></p>${scoreSVG(score)}<h2>Complete gesture data</h2><p>Times and entrance/release values are seconds. Brightness/noise values are 0–1. Pitch is MIDI note or unpitched. This table makes the stored scaffolding and renderer instructions explicit.</p><table><thead><tr>${['Layer','Start','Duration','Pitch','Gain','Brightness','Noise','Entrance','Release','Decay'].map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${table}</tbody></table></html>`);
  const scored=renderScore(score),neutral=renderScore(score,{neutral:true});
  const edited=structuredClone(score);const first=edited.lanes.flatMap(l=>l.events).filter(e=>e.pitch!==null).sort((a,b)=>b.duration-a.duration)[0];
  if(first)first.timbre.brightness=[1,1];
  const changed=renderScore(edited);
  const results=[scored,neutral,changed];
  const match=comparisonGains([...results.map(r=>r.metrics),signalMetrics(mixture.audio.samples)]);
  for(const [i,name] of ['score','neutral','edited'].entries()) {
    const result=results[i];await writeFile(`outputs/studies/${source.id}-${name}-raw.wav`,new Uint8Array(encodeWav(result.samples,result.sampleRate)));
    const matched=Float32Array.from(result.samples,x=>x*match.gains[i]);await writeFile(`outputs/studies/${source.id}-${name}-matched.wav`,new Uint8Array(encodeWav(matched,result.sampleRate)));
  }
  await writeFile(`outputs/studies/${source.id}-reference-matched.wav`,new Uint8Array(encodeWav(Float32Array.from(mixture.audio.samples,x=>x*match.gains[3]),mixture.audio.sampleRate)));
  report.comparison={method:'equal RMS, shared target bounded by .95 peak headroom',...match,conditions:['score','neutral','edited','reference'],editedGesture:first?.id,edit:'Longest pitched gesture brightness start/end set to 1; all scaffolding unchanged',metrics:results.map(r=>r.metrics)};
  await writeFile(`outputs/studies/${source.id}-report.json`,JSON.stringify(report,null,2));
  console.log(`${source.id}: ${score.lanes.length} lanes / ${score.lanes.reduce((n,l)=>n+l.events.length,0)} gestures; matched WAVs and draft static score exported`);
}
