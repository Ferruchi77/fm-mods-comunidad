import {createHmac} from 'node:crypto';
// Contadores públicos (descargas, me gusta, valoraciones, «funciona / no funciona») con protección contra abuso:
//  · cada persona (IP + clave secreta, en hash; nunca se guarda la IP) cuenta UNA vez por ficha: un «me gusta», una valoración (puede cambiarla),
//    un voto «funciona / no funciona» por versión de FM (puede cambiarlo) y una descarga cada 24 h;
//  · el estado «ya ha votado» lo decide el servidor, no el navegador (el `prev` que envía el cliente se ignora);
//  · máximo LIMIT acciones por hora y persona.
// Lectura barata: GET devuelve un índice único (`_index`) en vez de leer un blob por ficha. El índice se reconstruye desde las fichas
// (la fuente de verdad) como mucho cada INDEX_TTL; cada POST lo actualiza al momento. Si dos votos coinciden y uno se pisa en el índice,
// el siguiente reconstruido lo corrige.
// STATS_SALT es OBLIGATORIA (sin ella los votos devuelven 503). Defínela en Netlify (Site settings → Environment variables) con un texto largo y aleatorio.
const SLUG=/^[a-z0-9][a-z0-9-]{0,119}$/,VER=/^FM\d{2}$/,HOUR=3600e3,DAY=24*HOUR,LIMIT=40,INDEX_TTL=5*60e3,IDX='_index';
const ACTIONS=['download','like','unlike','rate','works'];
const json=(d,s=200,h={})=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json','cache-control':'no-store',...h}});
// HMAC con clave secreta (STATS_SALT): sin la clave no se puede revertir el identificador a una IP. IPv6 se agrupa por /64 para que rotar dentro de su rango no evite el límite.
const norm=ip=>{const s=String(ip||'').trim();if(!s.includes(':'))return s;const m=s.match(/^((?:[0-9a-f]{1,4}:){4})/i);return m?m[1].toLowerCase()+'/64':s.toLowerCase()};
const hid=(salt,s)=>createHmac('sha256',salt).update(norm(s)).digest('hex').slice(0,24);
const half=x=>Number.isFinite(x)&&Number.isInteger(x*2);
const blank=()=>({likes:0,downloads:0,ratingSum:0,ratingCount:0});

// Reconstruye el índice leyendo cada ficha (solo cuando el índice falta o ha caducado)
const rebuild=async(stats,now)=>{
  const {blobs}=await stats.list();const data={};
  await Promise.all(blobs.filter(b=>b.key!==IDX).map(async b=>{const v=await stats.get(b.key,{type:'json'});if(v)data[b.key]=v}));
  await stats.setJSON(IDX,{t:now,data});
  return data;
};

export const handle=async(req,ip,{stats,votes,exists,salt,now=Date.now()})=>{
  if(req.method==='GET'){
    let idx=null;try{idx=await stats.get(IDX,{type:'json'})}catch{}
    const data=idx&&idx.data&&now-idx.t<INDEX_TTL?idx.data:await rebuild(stats,now);
    return json(data,200,{'cache-control':'public, max-age=30'});
  }
  if(req.method!=='POST')return json({error:'method'},405);
  if(!salt)return json({error:'config'},503);   // sin STATS_SALT no se aceptan votos: nunca se usa una clave pública por defecto
  // Solo desde esta misma web: se rechazan peticiones entre sitios (Origin / Sec-Fetch-Site)
  const org=req.headers.get('origin'),sfs=req.headers.get('sec-fetch-site');
  if(sfs&&!['same-origin','same-site','none'].includes(sfs))return json({error:'origin'},403);
  if(org){let ok=false;try{ok=new URL(org).host===new URL(req.url).host}catch{}if(!ok)return json({error:'origin'},403)}
  if(!ip)return json({error:'ip'},400);   // sin IP no hay forma de contar a cada persona una sola vez
  let b;try{b=await req.json()}catch{return json({error:'json'},400)}
  const {slug,action}=b||{};
  if(!SLUG.test(slug||'')||!ACTIONS.includes(action))return json({error:'bad'},400);
  const me=hid(salt,ip);
  // límite por hora y persona
  const rk='rl:'+me,rl=(await votes.get(rk,{type:'json'}))||{t:now,c:0};
  if(now-rl.t>HOUR){rl.t=now;rl.c=0}
  if(rl.c>=LIMIT)return json({error:'rate'},429,{'retry-after':'3600'});
  rl.c++;await votes.setJSON(rk,rl);
  if(!(await exists(slug)))return json({error:'unknown'},404);
  const cur={...blank(),...((await stats.get(slug,{type:'json'}))||{})};
  const vk=`${slug}:${me}`,mine={like:false,rate:0,dl:0,w:{},...((await votes.get(vk,{type:'json'}))||{})};
  if(action==='download'&&now-mine.dl>DAY){cur.downloads++;mine.dl=now}
  if(action==='like'&&!mine.like){cur.likes++;mine.like=true}
  if(action==='unlike'&&mine.like){cur.likes=Math.max(0,cur.likes-1);mine.like=false}
  if(action==='rate'){
    const v=Number(b.value);
    if(!half(v)||v<.5||v>5)return json({error:'bad'},400);
    if(mine.rate&&cur.ratingCount>0)cur.ratingSum+=v-mine.rate;else{cur.ratingSum+=v;cur.ratingCount++}
    cur.ratingSum=Math.min(5*cur.ratingCount,Math.max(.5*cur.ratingCount,cur.ratingSum));
    mine.rate=v;
  }
  if(action==='works'){
    // «¿Te funciona con FMxx?»: un voto por persona y versión; se puede cambiar (ok ⇄ ko)
    const ver=String(b.ver||'').toUpperCase(),v=b.value;
    if(!VER.test(ver)||!['ok','ko'].includes(v))return json({error:'bad'},400);
    const w=cur.works=cur.works||{},c=w[ver]=w[ver]||{ok:0,ko:0},prev=mine.w[ver];
    if(prev!==v){if(prev)c[prev]=Math.max(0,c[prev]-1);c[v]++;mine.w[ver]=v}
  }
  await Promise.all([stats.setJSON(slug,cur),votes.setJSON(vk,mine)]);
  // actualiza el índice al momento (si falla, se reconstruirá solo)
  try{const idx=await stats.get(IDX,{type:'json'});if(idx&&idx.data){idx.data[slug]=cur;await stats.setJSON(IDX,idx)}}catch{}
  return json(cur);
};

// @netlify/blobs se importa aquí (y no arriba) para que las pruebas de handle() no lo necesiten
export default async (req,context)=>{const {getStore}=await import('@netlify/blobs');return handle(req,context?.ip||req.headers.get('x-nf-client-connection-ip')||'',{
  stats:getStore('mod-stats'),votes:getStore('mod-votes'),salt:process.env.STATS_SALT||undefined,
  exists:slug=>fetch(new URL(`/mod/${slug}/`,req.url),{method:'HEAD'}).then(r=>r.ok).catch(()=>false)})};
export const config={path:'/api/stats'};
