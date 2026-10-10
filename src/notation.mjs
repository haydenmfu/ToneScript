import { assertScore } from './score.mjs';
export const escapeXML = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const color = v => `hsl(${Math.round(225 - 185 * v)},65%,${Math.round(30 + 35 * v)}%)`;
export function scoreSVG(score, { selected = null } = {}) {
  assertScore(score);
  const width = 1200, left = 190, right = 35, laneH = 130, top = 130;
  const bottom = top + Math.max(1, score.lanes.length) * laneH;
  const height = bottom + 150;
  const x = t => left + t / score.duration * (width - left - right);
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXML(score.title)} timbre score">`,
    '<rect width="100%" height="100%" fill="#faf8f1"/>',
    '<style>text{font-family:Arial,sans-serif;fill:#222a36}.tick{font-size:13px}.name{font-size:16px;font-weight:bold}.small{font-size:12px}</style>',
    `<text x="30" y="40" font-size="27" font-weight="bold">${escapeXML(score.title)}</text>`,
    '<text x="30" y="67" font-size="14">ToneScript / timbre over time · fixed row position does not indicate pitch</text>',
    '<defs>'];
  let index = 0;
  for (const lane of score.lanes) for (const e of lane.events) {
    out.push(`<linearGradient id="g${index}"><stop stop-color="${color(e.timbre.brightness[0])}"/><stop offset="1" stop-color="${color(e.timbre.brightness[1])}"/></linearGradient>`);
    index++;
  }
  out.push('</defs>');
  const step = score.duration <= 12 ? 1 : score.duration <= 60 ? 5 : 15;
  for (let t = 0; t <= score.duration; t += step) {
    out.push(`<path d="M${x(t)} 110V${bottom}" stroke="#dcdedb"/><text class="tick" x="${x(t)}" y="100" text-anchor="middle">${t}s</text>`);
  }
  index = 0;
  score.lanes.forEach((lane, li) => {
    const y = top + li * laneH;
    out.push(`<text class="name" x="25" y="${y + 20}">${escapeXML(lane.name.slice(0, 21))}</text><text class="small" x="25" y="${y + 41}">${lane.events.length} gestures</text>`);
    out.push(`<path d="M${left} ${y + 71}H${width - right}" stroke="#dcdedb"/>`);
    for (const e of lane.events) {
      const xx = x(e.start), w = x(e.start + e.duration) - xx;
      const attack = Math.min(w / 2, (e.timbre.attack / e.duration) * w);
      const release = Math.min(w / 2, (e.timbre.release / e.duration) * w);
      out.push(`<g data-event="${escapeXML(e.id)}" tabindex="0" role="button" aria-label="${escapeXML(lane.name)} at ${e.start}s; brightness ${e.timbre.brightness.join(' to ')}; noise ${e.timbre.noise.join(' to ')}">`);
      out.push(`<title>${escapeXML(e.label || e.id)} · ${e.start}s–${+(e.start + e.duration).toFixed(3)}s · pitch ${e.pitch === null ? 'unpitched' : e.pitch} · gain ${e.gain} · decay ${e.timbre.decay}</title>`);
      out.push(`<path d="M${xx} ${y + 65}L${xx + attack} ${y + 8}H${xx + w - release}L${xx + w} ${y + 65}Z" fill="url(#g${index})" stroke="${selected === e.id ? '#ee5a32' : '#38485d'}" stroke-width="${selected === e.id ? 4 : 1}"/>`);
      // Dot density samples the same linear noise gesture used by the renderer.
      for (let col = 0; col < Math.floor(w / 10); col++) {
        const pos = (col + .5) * 10 / w;
        const noisy = e.timbre.noise[0] + (e.timbre.noise[1] - e.timbre.noise[0]) * pos;
        for (let row = 0; row < Math.round(noisy * 4); row++) {
          const dotX = xx + (col + .5) * 10, dotY = y + 52 - row * 9;
          const boundary = Math.max(attack ? 65 - (dotX - xx) / attack * 57 : 8, release ? 65 - (xx + w - dotX) / release * 57 : 8);
          if (dotY - y > boundary) out.push(`<circle cx="${dotX}" cy="${dotY}" r="1.5" fill="#fff"/>`);
        }
      }
      if (w > 58) out.push(`<text class="small" x="${xx + 2}" y="${y + 85}">B ${e.timbre.brightness.map(v => Math.round(v * 100)).join('→')}</text>`);
      if (w > 58) out.push(`<text class="small" x="${xx + 2}" y="${y + 101}">N ${e.timbre.noise.map(v => Math.round(v * 100)).join('→')}</text>`);
      out.push('</g>'); index++;
    }
  });
  out.push(`<text x="30" y="${bottom + 25}" font-size="16" font-weight="bold">Read the sound</text>`);
  out.push(`<text x="30" y="${bottom + 51}" font-size="14">B / blue → gold: dark → bright. N / more dots: tonal → noise-like. Values 0–100; transitions are linear.</text>`);
  out.push(`<text x="30" y="${bottom + 76}" font-size="14">Left slope: entrance time. Right slope: release time. Empty space: silence. Height is fixed, not loudness.</text>`);
  out.push(`<text x="30" y="${bottom + 101}" font-size="13">The stored score also carries pitch, gain, and decay. This visual projection alone does not encode every synthesis parameter.</text>`);
  out.push(`<text x="30" y="${bottom + 126}" font-size="12">Score ${escapeXML(score.version)} · renderer ${escapeXML(score.renderer)} · ${escapeXML(score.provenance.kind || 'unspecified provenance')}</text></svg>`);
  return out.join('\n');
}
