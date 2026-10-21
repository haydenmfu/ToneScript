import { mkdir,readFile,writeFile,copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { escapeXML } from '../src/notation.mjs';
const out='outputs/review';
await mkdir(out,{recursive:true});
const {sources}=JSON.parse(await readFile('data/sources.json','utf8'));
const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const dirty=execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim().length>0;
const key=[];
for(const source of sources) {
  const id=source.id;
  await copyFile(`docs/scores/${id}.svg`,`${out}/${id}.svg`);
  await copyFile(`docs/scores/${id}.html`,`${out}/${id}-table.html`);
  await copyFile(`examples/${id}.json`,`${out}/${id}.json`);
  const report=JSON.parse(await readFile(`outputs/studies/${id}-report.json`,'utf8'));
  key.push({id,comparison:report.comparison});
  for(const condition of ['reference','neutral','score','edited'])await copyFile(`outputs/studies/${id}-${condition}-matched.wav`,`${out}/${id}-${condition}.wav`);
}
const audioData=new Map();
for(const source of sources)for(const condition of ['reference','neutral','score','edited']) {
  const file=`${source.id}-${condition}.wav`;
  audioData.set(file,`data:audio/wav;base64,${(await readFile(`${out}/${file}`)).toString('base64')}`);
}
const player=(file,label)=>`<p>${label}<br><audio controls preload="metadata" src="${audioData.get(file)}"></audio></p>`;
for(const order of ['A','B']) {
  let body='';
  for(const [i,s] of sources.entries()) {
    const swap=(i+(order==='B'?1:0))%2===1;
    const conditions=swap?['score','neutral']:['neutral','score'];
    for(const [j,c] of conditions.entries()){const file=`${s.id}-${order}-${j?'Y':'X'}.wav`;await copyFile(`${out}/${s.id}-${c}.wav`,`${out}/${file}`);audioData.set(file,audioData.get(`${s.id}-${c}.wav`));}
    body+=`<section><h2>${escapeXML(s.artist)} — ${escapeXML(s.title)}</h2><p>${s.excerptStart}–${s.excerptEnd} seconds of the linked version. ${escapeXML(s.license)}. ${escapeXML(s.adaptation||'')}</p><p><a href="${escapeXML(s.reference)}">Recording source</a> · <a href="${escapeXML(s.audio)}">Exact version</a> · <a href="${s.licenseUrl}">License</a> · <a href="${s.id}-table.html">Full score and values</a></p><img src="${s.id}.svg" alt="${escapeXML(s.title)} timbre timeline"><h3>1. Follow the score</h3>${player(`${s.id}-reference.wav`,'Original reference')}<p>Describe a change you hear, give its time, and say whether the score communicates it. Note confusing marks or missing sound qualities.</p><h3>2. Compare interpretations</h3>${player(`${s.id}-${order}-X.wav`,'X')}${player(`${s.id}-${order}-Y.wav`,'Y')}<p>Which preserves the reference’s sound character better: X, Y, or no preference? Why?</p><h3>3. Identify an edit</h3>${player(`${s.id}-score.wav`,'Before')}${player(`${s.id}-edited.wav`,'After')}<p>What changed? Answer in your own words before looking at the facilitator key.</p></section>`;
  }
  await writeFile(`${out}/review-${order}.html`,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ToneScript listening review ${order}</title><style>body{max-width:1100px;margin:40px auto;padding:0 24px;font:18px/1.6 system-ui;color:#243443;background:#faf8f1}img{width:100%}section{border-top:2px solid #ccd2d2;margin-top:40px}audio{width:min(100%,500px)}h1,h2,h3{line-height:1.2}</style><h1>ToneScript listening review</h1><p>This tests an experimental notation, not your musical ability. The scores are automatic drafts; disagreement and confusion are useful. No responses are sent or stored by this page. Use the included response sheet. Start with a comfortable listening level.</p><p>Read time left to right. Rows separate sound layers. Blue → gold indicates dark → bright; dots indicate noise-like character; slopes indicate entrance and release. Empty space is silence. Row position is not pitch; height is not loudness.</p><p>First explain in your own words: time direction, empty space, color, dots, and the left slope. Then continue below. This packet is for initial review; timed recognition tasks must be defined by a facilitator after pilot listening.</p>${body}<p>Finally: Which mark is hardest to understand? Could this help you describe, rehearse, or perform a musical gesture? What would you change?</p></html>`);
}
await writeFile(`${out}/FACILITATOR-KEY.json`,JSON.stringify({revision,dirty,created:new Date().toISOString(),orders:{A:{trumpet:['neutral','score'],choice:['score','neutral']},B:{trumpet:['score','neutral'],choice:['neutral','score']}},studies:key},null,2));
await copyFile('docs/feedback/SESSION_TEMPLATE.md',`${out}/RESPONSE-SHEET.md`);
await copyFile('docs/FEEDBACK_KIT.md',`${out}/FACILITATOR-GUIDE.md`);
await copyFile('docs/DEMO.md',`${out}/DEMO.md`);
await writeFile(`${out}/START-HERE.txt`,'Extract the ZIP, then open review-A.html in Chrome or Edge. Audio is embedded in each review page; no installation or server is required. Keep the other files for score images and tables. For the next listener use review-B.html to reverse comparison order. Keep FACILITATOR-KEY.json hidden until responses are recorded. This is an initial review packet, not completed evaluation. Use RESPONSE-SHEET.md or write answers on paper. The timed-change task still needs pilot listening and predeclared targets; do not score it until those are set. Audio is RMS matched with shared peak headroom, not perceptually loudness-normalized. Source credits and licenses are on each page; Choice is for noncommercial use. Do not infer listening quality from software tests.\n');
console.log(`Review packet written to ${out}; open review-A.html. Timed targets and responses remain pending.`);
