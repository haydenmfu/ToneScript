/** Decode uncompressed mono/stereo PCM16 or IEEE float32 WAV for the CLI. */
export function decodeWav(buffer) {
  const v=new DataView(buffer), text=(at,n)=>new TextDecoder().decode(buffer.slice(at,at+n));
  if(v.byteLength<44 || text(0,4)!=='RIFF' || text(8,4)!=='WAVE') throw new Error('Not a WAV file');
  let format,channels,sampleRate,bits,dataStart,dataSize;
  for(let at=12;at+8<=v.byteLength;) {
    const name=text(at,4),size=v.getUint32(at+4,true),start=at+8;
    if(start+size>v.byteLength) throw new Error('Truncated WAV chunk');
    if(name==='fmt ') {if(size<16) throw new Error('Invalid WAV format');format=v.getUint16(start,true);channels=v.getUint16(start+2,true);sampleRate=v.getUint32(start+4,true);bits=v.getUint16(start+14,true);}
    if(name==='data') {dataStart=start;dataSize=size;}
    at=start+size+(size%2);
  }
  if(![1,2].includes(channels) || !sampleRate || dataStart===undefined || !((format===1 && bits===16)||(format===3 && bits===32))) throw new Error('Use PCM16 or float32 mono/stereo WAV');
  const bytes=bits/8,block=bytes*channels;
  if(dataSize%block) throw new Error('Incomplete WAV sample');
  const samples=new Float32Array(dataSize/block);
  for(let i=0;i<samples.length;i++) {
    for(let c=0;c<channels;c++) {const at=dataStart+i*block+c*bytes;samples[i]+=(format===1 ? v.getInt16(at,true)/32768 : v.getFloat32(at,true))/channels;}
  }
  return {samples,sampleRate};
}
