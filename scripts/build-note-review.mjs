import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { escapeXML } from '../src/notation.mjs';

// The baseline is intentionally retained before regeneration, never silently
// recreated from the current analyzer. Missing baseline files must fail loudly.
const baseline='outputs/baseline-v2-note-loss';
const out='outputs/review';
await mkdir(out,{recursive:true});
const {sources}=JSON.parse(await readFile('data/sources.json','utf8'));
let body='';
for(const source of sources) {
  body+=`<section><h2>${escapeXML(source.title)}</h2><p><a href="${escapeXML(source.reference)}">Source and attribution</a> · ${escapeXML(source.artist)} · ${escapeXML(source.license)}</p>`;
  for(const [label,path] of [
    ['Original reference',`outputs/studies/${source.id}-reference-matched.wav`],
    ['Previous reconstruction — before note recovery',`${baseline}/${source.id}-score-matched.wav`],
    ['Revised reconstruction — note recovery candidate',`outputs/studies/${source.id}-score-matched.wav`]
  ]) {
    const data=(await readFile(path)).toString('base64');
    body+=`<p><strong>${label}</strong><br><audio controls preload="metadata" src="data:audio/wav;base64,${data}"></audio></p>`;
  }
  body+='</section>';
}
await writeFile(`${out}/note-recovery.html`,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ToneScript note recovery</title><style>body{max-width:850px;margin:40px auto;padding:0 24px;font:18px/1.6 system-ui;background:#faf8f1;color:#243443}section{border-top:1px solid #999;margin-top:32px}audio{width:100%}h1,h2{line-height:1.2}</style><h1>Are the missing notes back?</h1><p>Compare the original with the previous and revised reconstructions. Focus first on the sequence of notes and attacks, then rhythm. The synthetic instrument sound is still approximate. This is an unblinded diagnostic comparison, not the timbre preference experiment.</p><ol><li>Listen to the original, then the revised version in short phrases.</li><li>Does the revised version follow the melody and repeated attacks more closely?</li><li>Give a timestamp for a missing, extra, wrong, or badly timed note. “Still mostly missing” is a useful answer too.</li></ol><p>Files are level matched within their study builds; the old and new builds may use different gain factors. Do not judge improvement by loudness. This page records nothing and sends nothing. Pause one player before starting another.</p>${body}</html>`);
console.log('Wrote outputs/review/note-recovery.html with embedded source, baseline and revised audio.');
