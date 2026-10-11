import { renderScore } from './synth.mjs';
import { analyzeAudio } from './analysis.mjs';
self.onmessage = ({data}) => {
  try {
    const result=data.kind==='analyze' ? analyzeAudio(data.samples,data.sampleRate,data.options) : renderScore(data.score,data.options);
    self.postMessage({id:data.id,result},result.samples ? [result.samples.buffer] : []);
  } catch(error) {self.postMessage({id:data.id,error:error.message});}
};
