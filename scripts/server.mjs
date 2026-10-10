import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JobManager, MAX_AUDIO_BYTES } from './jobs.mjs';
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const types={'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.wav':'audio/wav'};
const jobRoute=/^\/api\/jobs\/([0-9a-f-]{36})(?:\/(score|stems\/(drums|bass|other|vocals|harmonic|percussive)\.wav))?$/;
function fail(message,status=400) {return Object.assign(new Error(message),{status});}
function json(res,status,value) {res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));}
async function body(req) {
  if(req.headers['content-type']?.split(';')[0]!=='audio/wav')throw fail('Send audio/wav',415);
  if(req.headers['content-encoding'])throw fail('Compressed uploads are unsupported',415);
  if(Number(req.headers['content-length'])>MAX_AUDIO_BYTES)throw fail('Excerpt is too large',413);
  const chunks=[];let total=0;
  for await(const chunk of req){total+=chunk.length;if(total>MAX_AUDIO_BYTES)throw fail('Excerpt is too large',413);chunks.push(chunk);}
  return Buffer.concat(chunks);
}
export function createServer({jobs=new JobManager(root)}={}) {
  const server=http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    try {
      const port=server.address()?.port,hosts=[`127.0.0.1:${port}`,`localhost:${port}`];
      if(!hosts.includes(req.headers.host))throw fail('Invalid local host',403);
      if(!['GET','HEAD'].includes(req.method)) {
        if(req.headers.origin && !hosts.map(h=>`http://${h}`).includes(req.headers.origin))throw fail('Use the local ToneScript page',403);
        if(req.headers['sec-fetch-site']==='cross-site')throw fail('Cross-site request denied',403);
      }
      const url=new URL(req.url,`http://${req.headers.host}`),pathname=decodeURIComponent(url.pathname);
      if(req.method==='POST' && pathname==='/api/separate') {
        const method=url.searchParams.get('method'),title=url.searchParams.get('title')||'Separated audio study';
        if(!['demucs','hpss'].includes(method)||title.length>160)throw fail('Invalid separation method or title');
        if(jobs.active)throw fail('A separation job is already running',409);
        const data=await body(req);let result;
        try {result=await jobs.start(data,method,title);}catch(error){throw fail(error.message,error.status||400);}
        json(res,202,result);return;
      }
      const match=pathname.match(jobRoute);
      if(match) {
        const [,id,resource,stem]=match,j=jobs.jobs.get(id);if(!j)throw fail('Unknown job',404);
        if(req.method==='DELETE'&&!resource){jobs.cancel(id);json(res,202,jobs.status(id));return;}
        if(req.method!=='GET')throw fail('Method not allowed',405);
        if(!resource){json(res,200,jobs.status(id));return;}
        if(j.status!=='completed')throw fail('Job has no completed result',409);
        if(stem&&!j.stems.includes(stem))throw fail('Unknown stem',404);
        const data=await readFile(path.join(j.output,stem?`${stem}-22050.wav`:'score.json'));
        res.writeHead(200,{'Content-Type':stem?'audio/wav':'application/json'});res.end(data);return;
      }
      const example=pathname.match(/^\/api\/examples\/(trumpet|choice)\/audio$/);
      if(example && req.method==='GET') {
        let data;try{data=await readFile(path.join(root,'data','raw',`${example[1]}.wav`));}catch{throw fail('Example audio is not installed. Run the documented example download first.',404);}
        res.writeHead(200,{'Content-Type':'audio/wav'});res.end(data);return;
      }
      if(req.method!=='GET'&&req.method!=='HEAD')throw fail('Method not allowed',405);
      const relative=pathname==='/'?'index.html':pathname.slice(1);
      if(!/^(index\.html|styles\.css|src\/[a-z0-9-]+\.mjs|examples\/[a-z0-9-]+\.json)$/.test(relative))throw fail('Not found',404);
      const data=await readFile(path.join(root,relative));res.writeHead(200,{'Content-Type':`${types[path.extname(relative)]}; charset=utf-8`});res.end(req.method==='HEAD'?undefined:data);
    }catch(error){if(!res.headersSent)json(res,error.status||(error.code==='ENOENT'?404:400),{error:error.message});else res.end();}
  });
  server.requestTimeout=30000;server.headersTimeout=10000;
  server.shutdown=async()=>{const closing=new Promise(resolve=>server.close(resolve));server.closeIdleConnections();await jobs.close();await closing;};
  return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const server=createServer();server.listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log(`ToneScript ready at http://127.0.0.1:${server.address().port}`));
  let stopping=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{if(!stopping){stopping=true;void server.shutdown();}});
}
