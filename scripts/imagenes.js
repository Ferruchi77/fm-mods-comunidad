#!/usr/bin/env node
// Optimiza y «localiza» las imágenes de las fichas (necesita `sharp`: npm i --no-save sharp; la acción de GitHub lo instala).
//   1) Portadas y capturas que son enlaces externos (hotlinking) → se descargan a public/img/covers/ en WebP.
//      Así no se rompen si el otro sitio cambia o borra la imagen (los enlaces firmados de Patreon caducan).
//   2) Imágenes subidas en public/img/uploads/ que son PNG/JPG/AVIF o pesan más de 400 KB → WebP de máx. 1600 px.
//   3) De cada portada se genera además una miniatura *-640.webp que usan las tarjetas (build.js la detecta sola).
// Reescribe las rutas en content/mods/*.json. Es idempotente: lo ya optimizado no se vuelve a tocar.
//   node scripts/imagenes.js            hace los cambios
//   node scripts/imagenes.js --dry      solo lista lo que haría
//   --no-download                       no descarga las externas (solo optimiza lo local)
// Variables: MODS_DIR (content/mods), PUBLIC_DIR (public).
const fs=require('fs'),p=require('path');
let sharp;try{sharp=require('sharp')}catch{console.error('Falta sharp: npm i --no-save sharp');process.exit(1)}
const MODS=process.env.MODS_DIR||'content/mods',PUB=process.env.PUBLIC_DIR||'public',COVERS=p.join(PUB,'img/covers');
const dry=process.argv.includes('--dry'),noDl=process.argv.includes('--no-download'),UA='Mozilla/5.0 (compatible; FMModsImages/1.0)';
const MAXW=1600,THUMB=640,BIG=400*1024;
const isExt=u=>/^https?:\/\//i.test(String(u||'')),isLocal=u=>/^\/img\/(uploads|covers)\//.test(String(u||''));
let changed=0,failed=0;
const log=(...a)=>console.log(...a);

const encode=(buf,w)=>sharp(buf,{failOn:'none'}).rotate().resize({width:w,withoutEnlargement:true}).webp({quality:80}).toBuffer();
const thumbOf=async(buf,out)=>{if(dry)return;const t=out.replace(/\.webp$/,'-640.webp');if(!fs.existsSync(t))fs.writeFileSync(t,await encode(buf,THUMB))};

async function download(url){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),20000);
  try{const r=await fetch(url,{signal:c.signal,headers:{'user-agent':UA,accept:'image/*,*/*'}});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const type=r.headers.get('content-type')||'';if(type&&!/^image\//i.test(type))throw new Error('no es una imagen ('+type+')');
    return Buffer.from(await r.arrayBuffer())}
  finally{clearTimeout(t)}}

// Devuelve la ruta nueva (o la misma si no hay nada que hacer)
async function handle(u,name,isCover){
  if(isExt(u)){
    if(noDl)return u;
    const rel=`/img/covers/${name}.webp`,out=p.join(PUB,rel);
    try{
      if(!fs.existsSync(out)){log(`↓ ${name}: descarga ${u.slice(0,80)}…`);if(dry)return u;
        const buf=await download(u);fs.mkdirSync(COVERS,{recursive:true});fs.writeFileSync(out,await encode(buf,MAXW));if(isCover)await thumbOf(buf,out)}
      else if(isCover&&!dry&&!fs.existsSync(out.replace(/\.webp$/,'-640.webp')))await thumbOf(fs.readFileSync(out),out);
      changed++;return rel;
    }catch(e){failed++;log(`⚠ ${name}: no se pudo descargar (${e.message}); se deja el enlace original`);return u}
  }
  if(/^\/img\/uploads\//.test(u||'')){
    const file=p.join(PUB,u);if(!fs.existsSync(file))return u;
    const size=fs.statSync(file).size,isWebp=/\.webp$/i.test(u);
    if(isWebp&&size<=BIG){if(isCover&&!dry)await thumbOf(fs.readFileSync(file),file);return u}
    const rel=u.replace(/\.[a-z0-9]+$/i,'.webp'),out=p.join(PUB,rel);
    log(`⚙ ${name}: ${u} (${Math.round(size/1024)} KB) → WebP`);if(dry)return u;
    const buf=fs.readFileSync(file),webp=await encode(buf,MAXW);
    if(rel===u&&webp.length>=size){if(isCover)await thumbOf(buf,file);return u}   // ya estaba bien: no empeorarlo
    fs.writeFileSync(out,webp);if(isCover)await thumbOf(buf,out);
    if(rel!==u)fs.unlinkSync(file);
    changed++;return rel;
  }
  return u;
}

(async()=>{
  const used=new Set();
  for(const f of fs.readdirSync(MODS).filter(f=>f.endsWith('.json'))){
    const file=p.join(MODS,f),slug=f.slice(0,-5);let m;try{m=JSON.parse(fs.readFileSync(file,'utf8'))}catch{continue}
    const before=JSON.stringify(m);
    if(m.cover)m.cover=await handle(m.cover,`${slug}-cover`,true);
    if(Array.isArray(m.screenshots)){const out=[];for(let i=0;i<m.screenshots.length;i++)out.push(await handle(m.screenshots[i],`${slug}-s${i+1}`,false));m.screenshots=out}
    [m.cover,...(m.screenshots||[])].forEach(u=>u&&used.add(String(u)));
    if(!dry&&JSON.stringify(m)!==before)fs.writeFileSync(file,JSON.stringify(m,null,2)+'\n');
  }
  log(dry?'(simulación: no se ha escrito nada)':`Listo: ${changed} imagen(es) procesada(s)${failed?`, ${failed} con error`:''}.`);
})();
