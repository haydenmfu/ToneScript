/** The versioned score is the only musical input to the renderer. Time is seconds. */
export const VERSION = '1.0';
export const RENDERER = 'harmonic-noise-v1';
const finite = (v) => typeof v === 'number' && Number.isFinite(v);

export function validateScore(score) {
  const errors = [];
  const require = (ok, message) => { if (!ok) errors.push(message); };
  if (!score || typeof score !== 'object' || Array.isArray(score)) return ['Score must be an object'];
  require(score.version === VERSION, `Unsupported score version: ${score.version}`);
  require(score.renderer === RENDERER, `Unsupported renderer: ${score.renderer}`);
  require(typeof score.title === 'string' && score.title.trim().length > 0, 'Title is required');
  require(finite(score.duration) && score.duration > 0 && score.duration <= 300, 'Duration must be in (0, 300] seconds');
  require(Number.isInteger(score.seed) && score.seed >= 0 && score.seed <= 0xffffffff, 'Seed must be an unsigned 32-bit integer');
  require(score.provenance && typeof score.provenance === 'object', 'Provenance is required');
  if (!Array.isArray(score.lanes) || score.lanes.length > 16) return [...errors, 'At most 16 lanes are supported'];
  const ids = new Set();
  const events = new Set();
  let count = 0;
  for (const [li, lane] of score.lanes.entries()) {
    const p = `Lane ${li + 1}`;
    if (!lane || typeof lane !== 'object') { errors.push(`${p} must be an object`); continue; }
    require(typeof lane.id === 'string' && lane.id.length > 0 && !ids.has(lane.id), `${p}: unique id required`);
    ids.add(lane.id);
    require(typeof lane.name === 'string' && lane.name.length > 0, `${p}: name required`);
    if (!Array.isArray(lane.events)) { errors.push(`${p}: events must be an array`); continue; }
    count += lane.events.length;
    for (const [ei, event] of lane.events.entries()) {
      const q = `${p}, event ${ei + 1}`;
      if (!event || typeof event !== 'object') { errors.push(`${q}: object required`); continue; }
      require(typeof event.id === 'string' && event.id.length > 0 && !events.has(event.id), `${q}: unique id required`);
      events.add(event.id);
      require(finite(event.start) && event.start >= 0, `${q}: start must be nonnegative`);
      require(finite(event.duration) && event.duration > 0 && event.start + event.duration <= score.duration + 1e-9, `${q}: duration must fit inside score`);
      require(event.pitch === null || (finite(event.pitch) && event.pitch >= 24 && event.pitch <= 108), `${q}: pitch must be MIDI 24–108 or null for unpitched`);
      require(finite(event.gain) && event.gain >= 0 && event.gain <= 1, `${q}: gain must be 0–1`);
      const t = event.timbre;
      if (!t || typeof t !== 'object') { errors.push(`${q}: timbre is required`); continue; }
      for (const key of ['brightness', 'noise']) {
        require(Array.isArray(t[key]) && t[key].length === 2 && t[key].every(v => finite(v) && v >= 0 && v <= 1), `${q}: ${key} needs start/end values in 0–1`);
      }
      require(event.pitch !== null || (Array.isArray(t.noise) && t.noise.every(v => v === 1)), `${q}: unpitched noise events require noise [1,1]`);
      for (const key of ['attack', 'release']) require(finite(t[key]) && t[key] >= 0.002 && t[key] <= event.duration, `${q}: ${key} must fit event and be at least .002 seconds`);
      require(finite(t.attack) && finite(t.release) && t.attack + t.release <= event.duration + 1e-9, `${q}: attack + release exceeds duration`);
      require(finite(t.decay) && t.decay >= 0 && t.decay <= 12, `${q}: decay must be 0–12`);
    }
  }
  require(count <= 2000, 'At most 2000 events are supported');
  return errors;
}

export function assertScore(score) {
  const errors = validateScore(score);
  if (errors.length) throw new Error(errors.join('\n'));
  return score;
}
export function serialize(score) { return JSON.stringify(assertScore(score), null, 2); }
export function parseScore(text) { return assertScore(JSON.parse(text)); }
export function neutralScore(score) {
  const copy = structuredClone(assertScore(score));
  for (const lane of copy.lanes) for (const e of lane.events) {
    e.timbre = { brightness: [0.25, 0.25], noise: [0, 0], attack: Math.max(.002, Math.min(.02, e.duration / 4)), release: Math.max(.002, Math.min(.08, e.duration / 4)), decay: 0 };
    // Unpitched events retain a noise carrier, rather than inventing a pitched note.
    if (e.pitch === null) e.timbre.noise = [1, 1];
  }
  return copy;
}
