// Prueba scripts/imagenes.js de punta a punta con un servidor HTTP local: descarga → WebP (320/640/original) → ficha reescrita,
// sin romper nada cuando la descarga falla. Se omite si `sharp` no está instalado (el CI lo instala).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),p=require('path'),http=require('http'),cp=require('child_process');
let sharp;try{sharp=require('sharp')}catch{}
const skip=!sharp&&'sharp no instalado';
const SCRIPT=p.resolve('scripts/imagenes.js');

const run=(env,args=[])=>new Promise(res=>{
  const c=cp.spawn(process.execPath,[SCRIPT,...args],{env:{...process.env,...env},encoding:'utf8'});let out='';
  c.stdout.on('data',d=>out+=d);c.stderr.on('data',d=>out+=d);c.on('close',code=>res({code,out}))});

async function sandbox(mods,files={}){
  const dir=fs.mkdtempSync(p.join(os.tmpdir(),'img-')),M=p.join(dir,'content/mods'),P=p.join(dir,'public');
  fs.mkdirSync(M,{recursive:true});fs.mkdirSync(p.join(P,'img/uploads'),{recursive:true});
  for(const [n,m] of Object.entries(mods))fs.writeFileSync(p.join(M,n+'.json'),JSON.stringify(m,null,2));
  for(const [n,b] of Object.entries(files))fs.writeFileSync(p.join(P,'img/uploads',n),b);
  return{dir,M,P,env:{MODS_DIR:M,PUBLIC_DIR:P},mod:n=>JSON.parse(fs.readFileSync(p.join(M,n+'.json'),'utf8'))}}

async function server(){
  const png=await sharp({create:{width:2000,height:1000,channels:3,background:{r:200,g:30,b:90}}}).png().toBuffer();
  const srv=http.createServer((q,r)=>{
    if(q.url==='/ok.png'){r.writeHead(200,{'content-type':'image/png'});return r.end(png)}
    if(q.url==='/notimg'){r.writeHead(200,{'content-type':'text/html'});return r.end('<html>hola</html>')}
    if(q.url==='/fakeimg'){r.writeHead(200,{'content-type':'image/png'});return r.end(Buffer.from('esto no es una imagen'))}
    r.writeHead(404);r.end()});
  await new Promise(r=>srv.listen(0,'127.0.0.1',r));return{srv,base:`http://127.0.0.1:${srv.address().port}`}}

test('descarga la portada externa a WebP con variantes 320/640 y reescribe la ficha',{skip},async()=>{
  const {srv,base}=await server();
  try{
    const sb=await sandbox({uno:{cover:base+'/ok.png',screenshots:[base+'/ok.png']}});
    const r=await run(sb.env);assert.equal(r.code,0,r.out);
    const m=sb.mod('uno');
    assert.match(m.cover,/^\/img\/covers\/uno-cover-[0-9a-f]{8}\.webp$/);assert.match(m.screenshots[0],/^\/img\/covers\/uno-s1-[0-9a-f]{8}\.webp$/);
    const f=u=>p.join(sb.P,u),W=u=>sharp(fs.readFileSync(f(u))).metadata().then(x=>x.width);
    assert.equal(await W(m.cover),1200);assert.equal(await W(m.cover.replace('.webp','-640.webp')),640);assert.equal(await W(m.cover.replace('.webp','-320.webp')),320);
    assert.equal(await W(m.screenshots[0]),1600);
    assert.ok(!fs.readdirSync(p.join(sb.P,'img/covers')).some(x=>x.endsWith('.tmp')),'quedó un .tmp');
    // idempotente: una segunda pasada no cambia nada
    const before=fs.readFileSync(p.join(sb.M,'uno.json'),'utf8'),r2=await run(sb.env);assert.equal(r2.code,0);assert.equal(fs.readFileSync(p.join(sb.M,'uno.json'),'utf8'),before);
    // --check confirma que no hay enlaces rotos
    assert.equal((await run(sb.env,['--check'])).code,0);
  }finally{srv.close()}});

test('si la descarga falla (404, HTML o imagen corrupta) la ficha conserva el enlace original',{skip},async()=>{
  const {srv,base}=await server();
  try{
    const mod={cover:base+'/missing.png',screenshots:[base+'/notimg',base+'/fakeimg',base+'/ok.png']};
    const sb=await sandbox({dos:mod});const r=await run(sb.env);assert.equal(r.code,0,r.out);
    const m=sb.mod('dos');
    assert.equal(m.cover,mod.cover);assert.equal(m.screenshots[0],mod.screenshots[0]);assert.equal(m.screenshots[1],mod.screenshots[1]);
    assert.match(m.screenshots[2],/^\/img\/covers\/dos-s3-/);   // la que sí funcionaba se localiza igualmente
    assert.match(r.out,/no se pudo descargar/);
    assert.equal((await run(sb.env,['--check'])).code,0);
  }finally{srv.close()}});

test('una subida PNG compartida por dos fichas pasa a WebP en ambas y no deja enlaces rotos',{skip},async()=>{
  const png=await sharp({create:{width:900,height:500,channels:3,background:{r:10,g:130,b:90}}}).png().toBuffer();
  const sb=await sandbox({a:{cover:'/img/uploads/x.png',screenshots:[]},b:{cover:'/img/uploads/x.png',screenshots:[]}},{'x.png':png});
  const r=await run(sb.env);assert.equal(r.code,0,r.out);
  assert.equal(sb.mod('a').cover,'/img/uploads/x.webp');assert.equal(sb.mod('b').cover,'/img/uploads/x.webp');
  assert.ok(!fs.existsSync(p.join(sb.P,'img/uploads/x.png')),'el PNG original debería haberse borrado');
  assert.ok(fs.existsSync(p.join(sb.P,'img/uploads/x-320.webp')));
  assert.equal((await run(sb.env,['--check'])).code,0);
});

test('no borra el original si otro contenido (fuera de las fichas) aún lo usa',{skip},async()=>{
  const png=await sharp({create:{width:900,height:500,channels:3,background:{r:10,g:130,b:90}}}).png().toBuffer();
  const sb=await sandbox({a:{cover:'/img/uploads/x.png',screenshots:[]}},{'x.png':png});
  fs.mkdirSync(p.join(sb.dir,'content/autores'),{recursive:true});fs.writeFileSync(p.join(sb.dir,'content/autores/ana.json'),JSON.stringify({avatar:'/img/uploads/x.png'}));
  const r=await run(sb.env);assert.equal(r.code,0,r.out);
  assert.ok(fs.existsSync(p.join(sb.P,'img/uploads/x.png')),'se borró un archivo que aún se usa');assert.match(r.out,/se conserva/);
});

test('--check falla si una ficha apunta a una imagen local que no existe',async()=>{
  const sb=await sandbox({a:{cover:'/img/covers/no-existe.webp',screenshots:[]}});
  const r=await run(sb.env,['--check']);assert.equal(r.code,1);assert.match(r.out,/falta \/img\/covers\/no-existe\.webp/)});
