import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { decodeWav } from '../src/wav.mjs';
import { analyzeAudio } from '../src/analysis.mjs';
import { serialize } from '../src/score.mjs';
import { scoreSVG } from '../src/notation.mjs';
import { renderScore,encodeWav } from '../src/synth.mjs';
const [input,out='outputs/analysis/study',title='Audio study']=process.argv.slice(2);
if(!input) {console.error('Usage: node scripts/analyze.mjs input-22050hz.wav output-prefix "Title"');process.exit(1);}
const raw=await readFile(input),{samples,sampleRate}=decodeWav(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));
const begin=performance.now();
const {score,report}=analyzeAudio(samples,sampleRate,{title,sourceName:path.basename(input),sourceHash:createHash('sha256').update(raw).digest('hex')});
report.elapsedMs=Math.round(performance.now()-begin);
await mkdir(path.dirname(out),{recursive:true});
await writeFile(`${out}.json`,serialize(score));await writeFile(`${out}.svg`,scoreSVG(score));
for(const neutral of [false,true]) {const r=renderScore(score,{neutral});await writeFile(`${out}-${neutral?'neutral':'score'}.wav`,new Uint8Array(encodeWav(r.samples,r.sampleRate)));report[neutral?'neutralMetrics':'scoreMetrics']=r.metrics;}
await writeFile(`${out}-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
