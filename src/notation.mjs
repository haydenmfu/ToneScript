import { assertScore } from './score.mjs';
export const escapeXML = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const color = v => `hsl(${Math.round(225 - 185 * v)},65%,${Math.round(30 + 35 * v)}%)`;
export function layoutScore(score) {
  let y=130;
  const rows=score.lanes.map(lane=>{
    const ends=[],slots=new Map();
    for(const e of [...lane.events].sort((a,b)=>a.start-b.start)) {
      // Independently rounded six-decimal start/duration values can meet one
      // microsecond apart. Allow that seam plus arithmetic epsilon, not real overlap.
      let slot=ends.findIndex(end=>end-e.start<=1e-6+Number.EPSILON*8*Math.max(1,end,e.start));if(slot===-1)slot=ends.length;
      ends[slot]=e.start+e.duration;slots.set(e.id,slot);
    }
    const row={y,height:Math.max(1,ends.length)*130,slots};y+=row.height;return row;
  });
  return {rows,bottom:Math.max(260,y)};
}
export function scoreSVG(score, { selected = null, interactive = false } = {}) {
  assertScore(score);
  const width = 1200, left = 190, right = 35;
  const {rows,bottom}=layoutScore(score);
  const height = bottom + 150;
  const x = t => left + t / score.duration * (width - left - right);
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" data-grid-bottom="${bottom}" role="${interactive?'group':'img'}" aria-label="${escapeXML(score.title)} timbre score">`,
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
    const row=rows[li];
    out.push(`<text class="name" x="25" y="${row.y + 20}">${escapeXML(lane.name.slice(0, 21))}</text><text class="small" x="25" y="${row.y + 41}">${lane.events.length} gestures</text>`);
    out.push(`<path d="M${left} ${row.y + 71}H${width - right}" stroke="#dcdedb"/>`);
    for (const e of lane.events) {
      const y=row.y+row.slots.get(e.id)*130;
      const xx = x(e.start), w = x(e.start + e.duration) - xx;
      const attack = (e.timbre.attack / e.duration) * w;
      const release = (e.timbre.release / e.duration) * w;
      const outline=`M${xx} ${y + 65}L${xx + attack} ${y + 8}H${xx + w - release}L${xx + w} ${y + 65}Z`;
      out.push(`<g data-event="${escapeXML(e.id)}" ${interactive?'tabindex="0" role="button"':''} aria-label="${escapeXML(lane.name)} at ${e.start}s; brightness ${e.timbre.brightness.join(' to ')}; noise ${e.timbre.noise.join(' to ')}">`);
      out.push(`<title>${escapeXML(e.label || e.id)} · ${e.start}s–${+(e.start + e.duration).toFixed(3)}s · pitch ${e.pitch === null ? 'unpitched' : e.pitch} · gain ${e.gain} · decay ${e.timbre.decay}</title>`);
      out.push(`<path d="${outline}" fill="url(#g${index})" stroke="${selected === e.id ? '#ee5a32' : '#38485d'}" stroke-width="${selected === e.id ? 4 : 1}"/>`);
      out.push(`<clipPath id="texture${index}"><path d="${outline}"/></clipPath><g clip-path="url(#texture${index})">`);
      // Keep at least one centered column for short gestures. Place dots inside the
      // local envelope instead of dropping them where a long slope meets a fixed grid.
      const columns = Math.max(1, Math.floor(w / 10));
      for (let col = 0; col < columns; col++) {
        const pos = (col + .5) / columns;
        const noisy = e.timbre.noise[0] + (e.timbre.noise[1] - e.timbre.noise[0]) * pos;
        const count = Math.round(noisy * 4);
        const dotX = xx + pos * w;
        const boundary = Math.max(8, attack ? 65 - pos * w / attack * 57 : 8, release ? 65 - (1-pos) * w / release * 57 : 8);
        const radius = Math.min(1.5, w / (columns * 3), (65-boundary) / 12);
        for (let row = 0; row < count; row++) {
          const dotY = y + 65 - (row+1) * (65-boundary) / 5;
          out.push(`<circle cx="${dotX}" cy="${dotY}" r="${radius}" fill="#fff"/>`);
        }
      }
      out.push('</g>');
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
