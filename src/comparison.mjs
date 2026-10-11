export function signalMetrics(samples) {
  let peak=0,energy=0;
  for(const x of samples) {if(!Number.isFinite(x)) throw new Error('Nonfinite audio');peak=Math.max(peak,Math.abs(x));energy+=x*x;}
  return {peak,rms:samples.length ? Math.sqrt(energy/samples.length) : 0};
}
/** Equal-RMS comparison; shared target lowered to preserve headroom in every member. */
export function comparisonGains(metrics,target=.08) {
  if(!metrics.length) return {target:0,gains:[]};
  for(const m of metrics) if(!Number.isFinite(m.rms)||!Number.isFinite(m.peak)||m.rms<0||m.peak<0) throw new Error('Invalid metrics');
  const audible=metrics.filter(m=>m.rms>1e-9&&m.peak>0);
  const safeTarget=audible.length ? Math.min(target,...audible.map(m=>.95*m.rms/m.peak)) : 0;
  return {target:safeTarget,gains:metrics.map(m=>m.rms>1e-9 ? safeTarget/m.rms : 1)};
}
