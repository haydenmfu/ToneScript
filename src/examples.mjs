const timbre = (brightness, noise, attack, release, decay = 0) => ({ brightness, noise, attack, release, decay });
export const examples = [
  {
    version: '1.0', renderer: 'harmonic-noise-v1', seed: 42,
    title: 'Study 01 · held light', duration: 8,
    provenance: { kind: 'synthetic test composition', creator: 'ToneScript project', note: 'Software fixture; not an assignment recording or claimed listening transcription.' },
    lanes: [{ id: 'held', name: 'Sustained tone', events: [
      { id: 's1', start: 0, duration: 3.5, pitch: 60, gain: .7, label: 'Slowly brighten', timbre: timbre([.1,.75], [0,.12], .65,.6) },
      { id: 's2', start: 4, duration: 4, pitch: 67, gain: .7, label: 'Dissolve into air', timbre: timbre([.65,.3], [.1,.85], .4,1.2) }
    ] }]
  },
  {
    version: '1.0', renderer: 'harmonic-noise-v1', seed: 103,
    title: 'Study 02 · grain and pulse', duration: 8,
    provenance: { kind: 'synthetic test composition', creator: 'ToneScript project', note: 'Contrasting polyphonic fixture; not an assignment recording.' },
    lanes: [
      { id: 'pulse', name: 'Rounded pulse', events: Array.from({length: 8}, (_,i) => ({ id: `p${i}`, start: i, duration: .75, pitch: [48,48,55,53][i%4], gain: .7, timbre: timbre([.55,.1],[0,0],.005,.25,4) })) },
      { id: 'grain', name: 'Grain accents', events: Array.from({length: 8}, (_,i) => ({ id: `n${i}`, start: i+.45, duration: .25, pitch: null, gain: .5, timbre: timbre([.85,.35],[1,1],.003,.12,2) })) },
      { id: 'line', name: 'Upper line', events: [0,2,4,6].map((start,i) => ({ id: `l${i}`, start, duration: 1.8, pitch: [72,74,79,76][i], gain: .45, timbre: timbre([.25,.65],[.05,.2],.1,.4) })) }
    ]
  }
];
