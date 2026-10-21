import { mkdir, writeFile } from 'node:fs/promises';
import { examples } from '../src/examples.mjs';
import { serialize } from '../src/score.mjs';
import { renderScore, encodeWav } from '../src/synth.mjs';
import { scoreSVG } from '../src/notation.mjs';
await mkdir('outputs/fixtures', { recursive: true });
for (const [i, score] of examples.entries()) {
  const prefix = `outputs/fixtures/study-${i + 1}`;
  await writeFile(`${prefix}.json`, serialize(score));
  await writeFile(`${prefix}.svg`, scoreSVG(score));
  for (const neutral of [false, true]) {
    const result = renderScore(score, { neutral });
    await writeFile(`${prefix}-${neutral ? 'neutral' : 'score'}.wav`, new Uint8Array(encodeWav(result.samples, result.sampleRate)));
    console.log(prefix, neutral ? 'neutral' : 'score', result.metrics);
  }
}
