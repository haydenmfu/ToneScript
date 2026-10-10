import { assertScore, VERSION, RENDERER } from './score.mjs';
export const ANALYZER = 'spectral-gesture-v2';
const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
const median = a => a.length ? [...a].sort((a,b)=>a-b)[Math.floor(a.length/2)] : 0;

/** Radix-2 FFT for descriptor extraction; inputs are real, outputs magnitudes. */
export function spectrum(input) {
  const n=input.length;
  if (n<2 || (n & (n-1))) throw new Error('FFT length must be a power of two');
  const re=Float64Array.from(input), im=new Float64Array(n);
  for(let i=1,j=0;i<n;i++) {
    let bit=n>>1; for(;j&bit;bit>>=1) j^=bit; j^=bit;
    if(i<j) [re[i],re[j]]=[re[j],re[i]];
  }
  for(let size=2;size<=n;size*=2) {
    const angle=-2*Math.PI/size;
    for(let start=0;start<n;start+=size) {
      for(let j=0;j<size/2;j++) {
        const c=Math.cos(angle*j),s=Math.sin(angle*j),k=start+j,h=k+size/2;
        const tr=re[h]*c-im[h]*s,ti=re[h]*s+im[h]*c;
        re[h]=re[k]-tr;im[h]=im[k]-ti;re[k]+=tr;im[k]+=ti;
      }
    }
  }
  return Float64Array.from({length:n/2+1},(_,i)=>Math.hypot(re[i],im[i]));
}

export function describeFrame(frame, sampleRate) {
  let sum=0;
  const windowed=Float64Array.from(frame,(v,i)=>{sum+=v*v;return v*(.5-.5*Math.cos(2*Math.PI*i/(frame.length-1)));});
  const mag=spectrum(windowed), rms=Math.sqrt(sum/frame.length);
  let mass=0,weighted=0,power=0,logs=0;
  for(let i=1;i<mag.length;i++) {mass+=mag[i]; weighted+=mag[i]*i*sampleRate/frame.length;const p=mag[i]**2+1e-20;power+=p;logs+=Math.log(p);}
  const centroid=mass>1e-10 ? weighted/mass : 0;
  const flatness=power>1e-12 ? Math.exp(logs/(mag.length-1))/(power/(mag.length-1)) : 0;
  // Full-rate YIN-style cumulative normalized squared difference. Keeping every
  // sample avoids the aliases introduced by the former unfiltered decimation.
  // This estimates one periodic source, not polyphonic note transcription.
  let pitch=null,best=0;
  if(rms>.002) {
    const maxLag=Math.min(Math.ceil(sampleRate/32)+1,Math.floor(frame.length/2)-1);
    const width=frame.length-maxLag;
    const difference=new Float64Array(maxLag+1),normalized=new Float64Array(maxLag+1);
    let cumulative=0;
    // A narrow isolated spectral peak outside the supported band must not be
    // accepted through a multiple-period YIN minimum (an octave/subharmonic).
    let peakBin=1,peakPower=0,totalPower=0;
    for(let k=1;k<mag.length;k++){const p=mag[k]**2;totalPower+=p;if(p>peakPower){peakPower=p;peakBin=k;}}
    let nearby=0;for(let k=Math.max(1,peakBin-3);k<=Math.min(mag.length-1,peakBin+3);k++)nearby+=mag[k]**2;
    const isolatedAboveRange=nearby>totalPower*.995 && peakBin*sampleRate/frame.length>440*2**((108-69)/12)+sampleRate/frame.length;
    if(!isolatedAboveRange) for(let lag=1;lag<=maxLag;lag++) {
      let d=0;
      for(let i=0;i<width;i++){const delta=frame[i]-frame[i+lag];d+=delta*delta;}
      difference[lag]=d;cumulative+=d;
      normalized[lag]=cumulative>1e-20 ? d*lag/cumulative : 1;
      const candidate=lag-1;
      if(candidate>=2 && normalized[candidate]<.12 && normalized[candidate]<=normalized[candidate-1] && normalized[candidate]<normalized[lag]) {
        // Refine the raw difference, whose minimum is less skewed by cumulative
        // normalization. A small boundary allowance handles numerical C1/C8 error.
        const l=difference[candidate-1],m=difference[candidate],r=difference[lag];
        const shift=clamp(.5*(l-r)/(l-2*m+r||1),-.5,.5);
        const estimate=69+12*Math.log2(sampleRate/(candidate+shift)/440);
        if(estimate>=23.85 && estimate<=108.15){pitch=clamp(estimate,24,108);best=1-normalized[candidate];}
        break;
      }
    }
  }
  return {rms,centroid,flatness,pitch,periodicity:best};
}

/** Suggestions, not a perceptual transcription or a polyphonic note recognizer. */
export function analyzeAudio(samples,sampleRate,{title='Audio study',sourceName='local audio',sourceHash=null,laneName='Mixture · suggested gestures',seed=42}={}) {
  if(!(samples instanceof Float32Array) || !samples.length || !samples.every(Number.isFinite)) throw new Error('Finite mono audio required');
  if(sampleRate!==22050) throw new Error('Analysis requires mono audio at 22050 Hz');
  const duration=samples.length/sampleRate;
  if(duration>120) throw new Error('Analyze an excerpt of at most 120 seconds');
  const size=2048,hop=512,frames=[];
  for(let start=0;start<samples.length;start+=hop) {
    const frame=new Float32Array(size);frame.set(samples.subarray(start,start+size));
    frames.push({...describeFrame(frame,sampleRate),time:start/sampleRate});
  }
  const peak=Math.max(...frames.map(f=>f.rms));
  const threshold=Math.max(.002,peak*.025);
  const ranges=[]; let start=null;
  for(let i=0;i<frames.length;i++) {
    const f=frames[i],previous=frames[i-1];
    const active=f.rms>threshold;
    const elapsed=start===null ? 0 : f.time-frames[start].time;
    const attack=previous && f.rms>previous.rms*1.75 && f.rms>peak*.12;
    const pitchChange=previous?.pitch!==null && previous?.pitch!==undefined && f.pitch!==null && Math.abs(f.pitch-previous.pitch)>1.8;
    if(start!==null && (!active || (elapsed>.12 && (attack || pitchChange || elapsed>1.5)))) {
      ranges.push([start,i]);start=null;
    }
    if(active && start===null) start=i;
  }
  if(start!==null) ranges.push([start,frames.length]);
  const events=[];
  for(const [a,b] of ranges) {
    const group=frames.slice(a,b),start=frames[a].time,end=Math.min(duration,b*hop/sampleRate),length=end-start;
    if(length<.055) continue;
    const pitches=group.map(f=>f.pitch).filter(p=>p!==null);
    const pitch=pitches.length>=group.length*.45 ? Math.round(median(pitches)*10)/10 : null;
    const half=Math.max(1,Math.floor(group.length/2));
    const bright=g=>clamp(Math.log2(Math.max(250,median(g.map(f=>f.centroid)))/250)/5);
    const noise=g=>pitch===null ? 1 : clamp(Math.sqrt(median(g.map(f=>f.flatness)))*2);
    const first=group.slice(0,half),last=group.slice(-half);
    const maxRms=Math.max(...group.map(f=>f.rms));
    const peakIndex=group.findIndex(f=>f.rms>=maxRms*.9);
    const attack=clamp(peakIndex*hop/sampleRate,.005,length*.35);
    const release=Math.min(.08,length*.25);
    events.push({id:`suggested-${events.length+1}`,start:+start.toFixed(6),duration:+length.toFixed(6),pitch,gain:+clamp(maxRms*3,.08,1).toFixed(4),
      label:'Unreviewed audio-analysis suggestion',timbre:{brightness:[bright(first),bright(last)].map(x=>+x.toFixed(3)),noise:[noise(first),noise(last)].map(x=>+x.toFixed(3)),attack:+attack.toFixed(6),release:+release.toFixed(6),decay:0}});
  }
  const score={version:VERSION,renderer:RENDERER,title,duration:+duration.toFixed(6),seed,
    provenance:{kind:'automatic suggestions; not listening-reviewed',sourceName,sourceHash,analyzer:ANALYZER,sampleRate,frameSize:size,hopSize:hop,
      pitchEstimator:{method:'full-rate YIN-style difference with raw-minimum interpolation',threshold:.12,midiRange:[24,108],boundaryAllowanceSemitones:.15},
      note:'Approximate single periodic pitch and spectral descriptors. Polyphonic notes are not recovered. Unknown pitch maps to a noise carrier; this is not proof of noisy timbre. Forward windows can anticipate onsets by up to one frame. Correct by listening before submission.',manualEdits:[]},
    lanes:[{id:'analysis',name:laneName,events}]};
  assertScore(score);
  return {score,report:{analyzer:ANALYZER,frames:frames.length,events:events.length,threshold,peakRms:peak,duration,warnings:['Spectral centroid depends on pitch and recording conditions.','Flatness is a noise proxy, not a direct measure of breathiness or roughness.','Dominant-pitch estimates are unreliable for polyphonic mixtures.','All gestures require listening review.']}};
}
