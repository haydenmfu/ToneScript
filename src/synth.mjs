import { assertScore, neutralScore } from './score.mjs';

const lerp = (a, b, t) => a + (b - a) * t;
function random(seed) {
  let x = seed >>> 0 || 1;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 2147483648 - 1; };
}
function eventSeed(seed, id) {
  let h = seed;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** No file access, audio samples, model, or hidden reference inputs. */
export function renderScore(input, { sampleRate = 22050, neutral = false, laneId = null } = {}) {
  const score = neutral ? neutralScore(input) : assertScore(input);
  if (!Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 96000) throw new Error('Unsupported sample rate');
  if (laneId !== null && !score.lanes.some(l => l.id === laneId)) throw new Error('Unknown lane');
  const samples = new Float32Array(Math.ceil(score.duration * sampleRate));
  for (const lane of score.lanes) {
    if (laneId !== null && lane.id !== laneId) continue;
    for (const e of lane.events) {
      const offset = Math.round(e.start * sampleRate);
      const n = Math.min(Math.round(e.duration * sampleRate), samples.length - offset);
      const freq = e.pitch === null ? 0 : 440 * 2 ** ((e.pitch - 69) / 12);
      if(freq>sampleRate*.45) throw new Error(`Pitch ${e.pitch} exceeds the supported tonal band at ${sampleRate} Hz; choose a higher sample rate`);
      const harmonics = freq ? Math.min(16, Math.floor(sampleRate * .45 / freq)) : 0;
      const noise = random(eventSeed(score.seed, e.id));
      let low = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sampleRate;
        const position = n <= 1 ? 0 : i / (n - 1);
        const bright = lerp(...e.timbre.brightness, position);
        const noisy = e.pitch === null ? 1 : lerp(...e.timbre.noise, position);
        let tone = 0, weight = 0;
        const phase = 2 * Math.PI * freq * t;
        for (let h = 1; h <= harmonics; h++) {
          const amplitude = 1 / h ** (3.5 - bright * 3);
          tone += Math.sin(phase * h) * amplitude;
          weight += amplitude;
        }
        if (weight) tone /= weight;
        const cutoff = Math.min(sampleRate * .4, 300 + bright * 9000);
        const alpha = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
        low += alpha * (noise() - low);
        const attack = Math.min(1, t / e.timbre.attack);
        const release = Math.min(1, Math.max(0, (n - 1 - i) / sampleRate) / e.timbre.release);
        const envelope = attack * release * Math.exp(-e.timbre.decay * position);
        samples[offset + i] += e.gain * envelope * ((1 - noisy) * tone + noisy * low);
      }
    }
  }
  // Fixed headroom, independent of score edits. No per-render peak normalization.
  const masterGain = .25;
  let rawPeak = 0, peak = 0, sum = 0, limited = 0;
  for (let i = 0; i < samples.length; i++) {
    const raw = samples[i] * masterGain;
    rawPeak = Math.max(rawPeak, Math.abs(raw));
    if (Math.abs(raw) > .98) limited++;
    samples[i] = Math.max(-.98, Math.min(.98, raw));
    peak = Math.max(peak, Math.abs(samples[i]));
    sum += samples[i] ** 2;
  }
  return { samples, sampleRate, metrics: { peak, rawPeak, rms: Math.sqrt(sum / samples.length), limitedSamples: limited, masterGain } };
}

export function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const str = (at, value) => { for (let i = 0; i < value.length; i++) view.setUint8(at + i, value.charCodeAt(i)); };
  str(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  str(36, 'data'); view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    if (!Number.isFinite(samples[i])) throw new Error('Cannot encode nonfinite samples');
    const x = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, Math.round(x * (x < 0 ? 32768 : 32767)), true);
  }
  return buffer;
}
