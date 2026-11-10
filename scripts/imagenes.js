#!/usr/bin/env node
// Optimiza y «localiza» las imágenes de las fichas (necesita `sharp`: npm i --no-save sharp; la acción de GitHub lo instala).
//   1) Portadas y capturas que son enlaces externos (hotlinking) → se descargan a public/img/covers/ en WebP.
//      Así no se rompen si el otro sitio cambia o borra la imagen (los enlaces firmados de Patreon caducan).
//   2) Imágenes subidas en public/img/uploads/ que son PNG/JPG/AVIF o pesan más de 400 KB → WebP de máx. 1600 px.
//   3) De cada portada se generan además *-320.webp y *-640.webp: las tarjetas las usan con srcset y cada visitante descarga solo la que necesita
//      (menos ancho de banda = menos créditos de Netlify). build.js las detecta solo.
//      Las portadas descargadas llevan un hash de su URL en el nombre (slug-cover-1a2b3c4d.webp): si la imagen cambia, el nombre cambia, y por eso
//      public/_headers puede cachearlas «para siempre» (immutable).
// Reescribe las rutas en content/mods/*.json. Es idempotente: lo ya optimizado no se vuelve a tocar.
//   node scripts/imagenes.js            hace los cambios
//   node scripts/imagenes.js --dry      solo lista lo que haría
//   --no-download                       no descarga las externas (solo optimiza lo local)
//   --check                             no toca nada: comprueba que TODA ruta local (/img/...) de las fichas existe en disco (sale con error si falta alguna;
//                                       la acción de GitHub lo ejecuta antes de hacer commit para no publicar enlaces rotos)
// Garantías para no romper enlaces: una imagen descargada se valida (debe ser decodificable) y se escribe en un archivo temporal que se renombra al
// terminar; la ficha solo se reescribe con las rutas que han salido bien (si falla una descarga se queda el enlace original); una subida convertida
// solo se borra si NINGÚN JSON de content/ la sigue usando, y si varias fichas la comparten todas pasan a la ruta nueva.
// Variables: MODS_DIR (content/mods), PUBLIC_DIR (public).
const fs=require('fs'),p=require('path');
const crypto=require('crypto');
let _sharp;const sharp=(...a)=>{if(!_sharp){try{_sharp=require('sharp')}catch{console.error('Falta sharp: npm i --no-save sharp');process.exit(1)}}return _sharp(...a)};   // se carga solo si hace falta (--dry no lo necesita)
const MODS=process.env.MODS_DIR||'content/mods',PUB=process.env.PUBLIC_DIR||'public',COVERS=p.join(PUB,'img/covers');
const dry=process.argv.includes('--dry'),check=process.argv.includes('--check'),noDl=process.argv.includes('--no-download'),UA='Mozilla/5.0 (compatible; FMModsImages/1.0)';
const MAXW=1600,COVERW=1200,WIDTHS=[320,640],BIG=400*1024,Q=72;
const isExt=u=>/^https?:\/\//i.test(String(u||'')),isLocal=u=>/^\/img\/(uploads|covers)\//.test(String(u||''));
let changed=0,failed=0;
const log=(...a)=>console.log(...a);

const encode=(buf,w)=>sharp(buf,{failOn:'none'}).rotate().resize({width:w,withoutEnlargement:true}).webp({quality:Q,effort:5}).toBuffer();
const writeAtomic=(file,data)=>{fs.mkdirSync(p.dirname(file),{recursive:true});const t=file+'.tmp';fs.writeFileSync(t,data);fs.renameSync(t,file);if(!fs.existsSync(file)||!fs.statSync(file).size)throw new Error('no se pudo escribir '+file)};
const thumbOf=async(buf,out)=>{if(dry)return;for(const w of WIDTHS){const t=out.replace(/\.webp$/,`-${w}.webp`);if(!fs.existsSync(t))writeAtomic(t,await encode(buf,w))}};
const MAXBYTES=25*1024*1024;

async function download(url,tries=2){
  let last;
  for(let i=0;i<tries;i++){
    const c=new AbortController(),t=setTimeout(()=>c.abort(),20000);
    try{const r=await fetch(url,{signal:c.signal,headers:{'user-agent':UA,accept:'image/*,*/*'}});
      if(!r.ok){const e=new Error('HTTP '+r.status);e.retry=r.status>=500||r.status===429;throw e}
      const type=r.headers.get('content-type')||'';if(type&&!/^image\//i.test(type))throw new Error('no es una imagen ('+type+')');
      if(+r.headers.get('content-length')>MAXBYTES)throw new Error('imagen demasiado grande');
      const buf=Buffer.from(await r.arrayBuffer());
      if(buf.length>MAXBYTES)throw new Error('imagen demasiado grande');
      const meta=await sharp(buf,{failOn:'none'}).metadata();   // debe poder decodificarse como imagen
      if(!meta||!meta.width||meta.width<16||!meta.height||meta.height<16)throw new Error('imagen no válida');
      return buf;
    }catch(e){last=e;if(!(e.retry||e.name==='AbortError'||e.cause))break}   // reintenta solo fallos de red o 5xx/429
    finally{clearTimeout(t)}
  }
  throw last;
}

const converted=new Map();   // subida original → ruta nueva (una misma imagen puede estar en varias fichas)
const renamedOld=new Set();

// Devuelve la ruta nueva (o la misma si no hay nada que hacer)
async function handle(u,name,isCover){
  if(isExt(u)){
    if(noDl)return u;
    const rel=`/img/covers/${name}-${crypto.createHash('sha1').update(u).digest('hex').slice(0,8)}.webp`,out=p.join(PUB,rel);
    try{
      if(!fs.existsSync(out)){log(`↓ ${name}: descarga ${u.slice(0,80)}…`);if(dry)return u;
        const buf=await download(u);writeAtomic(out,await encode(buf,isCover?COVERW:MAXW));if(isCover)await thumbOf(buf,out)}
      else if(isCover&&!dry)await thumbOf(fs.readFileSync(out),out);
      changed++;return rel;
    }catch(e){failed++;log(`⚠ ${name}: no se pudo descargar (${e.message}); se deja el enlace original`);return u}
  }
  if(/^\/img\/uploads\//.test(u||'')){
    const file=p.join(PUB,u);if(!fs.existsSync(file))return u;
    if(converted.has(u)){const n=converted.get(u);if(isCover&&!dry&&n===u)await thumbOf(fs.readFileSync(file),file);return n}
    const size=fs.statSync(file).size,isWebp=/\.webp$/i.test(u);
    if(isWebp&&size<=BIG){if(isCover&&!dry)await thumbOf(fs.readFileSync(file),file);converted.set(u,u);return u}
    const rel=u.replace(/\.[a-z0-9]+$/i,'.webp'),out=p.join(PUB,rel);
    log(`⚙ ${name}: ${u} (${Math.round(size/1024)} KB) → WebP`);if(dry)return u;
    try{
      const buf=fs.readFileSync(file),webp=await encode(buf,isCover?COVERW:MAXW);
      if(rel===u&&webp.length>=size){if(isCover)await thumbOf(buf,file);converted.set(u,u);return u}   // ya estaba bien: no empeorarlo
      writeAtomic(out,webp);if(isCover)await thumbOf(buf,out);
      if(rel!==u)renamedOld.add(u);
      converted.set(u,rel);changed++;return rel;
    }catch(e){failed++;log(`⚠ ${name}: no se pudo convertir ${u} (${e.message}); se deja como estaba`);converted.set(u,u);return u}
  }
  return u;
}

const listJson=d=>fs.existsSync(d)?fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?listJson(p.join(d,e.name)):e.name.endsWith('.json')?[p.join(d,e.name)]:[]):[];
const refsOf=m=>[m.cover,...(Array.isArray(m.screenshots)?m.screenshots:[])].filter(u=>typeof u==='string'&&u);

(async()=>{
  const files=fs.readdirSync(MODS).filter(f=>f.endsWith('.json'));
  if(check){   // --check: solo comprueba, no escribe nada
    let bad=0,n=0;
    for(const f of files){let m;try{m=JSON.parse(fs.readFileSync(p.join(MODS,f),'utf8'))}catch{console.error(`✗ ${f}: JSON no válido`);bad++;continue}
      for(const u of refsOf(m).filter(isLocal)){n++;const file=p.join(PUB,u);if(!fs.existsSync(file)||!fs.statSync(file).size){bad++;console.error(`✗ ${f.slice(0,-5)}: falta ${u}`)}}}
    log(bad?`${bad} imagen(es) locales rotas de ${n}.`:`OK: ${n} imágenes locales referenciadas, todas existen.`);process.exit(bad?1:0)}
  for(const f of files){
    const file=p.join(MODS,f),slug=f.slice(0,-5);let m;try{m=JSON.parse(fs.readFileSync(file,'utf8'))}catch{continue}
    const before=JSON.stringify(m);
    if(m.cover)m.cover=await handle(m.cover,`${slug}-cover`,true);
    if(Array.isArray(m.screenshots)){const out=[];for(let i=0;i<m.screenshots.length;i++)out.push(await handle(m.screenshots[i],`${slug}-s${i+1}`,false));m.screenshots=out}
    if(!dry&&JSON.stringify(m)!==before)fs.writeFileSync(file,JSON.stringify(m,null,2)+'\n');
  }
  // Una subida convertida solo se borra si ningún JSON de content/ la sigue usando (otras fichas, autores, distintivos…)
  if(!dry&&renamedOld.size){
    const all=listJson(p.dirname(MODS)).map(f=>fs.readFileSync(f,'utf8'));
    for(const old of renamedOld){if(!all.some(t=>t.includes(old)))try{fs.unlinkSync(p.join(PUB,old))}catch{}else log(`· se conserva ${old} (aún lo usa otro contenido)`)}}
  log(dry?'(simulación: no se ha escrito nada)':`Listo: ${changed} imagen(es) procesada(s)${failed?`, ${failed} con error (sus fichas conservan el enlace original)`:''}.`);
})();
