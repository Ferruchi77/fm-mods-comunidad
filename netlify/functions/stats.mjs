import {getStore} from '@netlify/blobs';
import {createHash} from 'node:crypto';
// Contadores públicos (descargas, me gusta, valoraciones) con protección contra abuso:
//  · cada persona (IP + clave secreta, en hash; nunca se guarda la IP) cuenta UNA vez por ficha: un «me gusta», una valoración (puede cambiarla) y una descarga cada 24 h;
//  · el estado «ya ha votado» lo decide el servidor, no el navegador (el `prev` que envía el cliente se ignora);
//  · máximo LIMIT acciones por hora y persona.
// Define STATS_SALT en Netlify (Site settings → Environment variables) con un texto largo y aleatorio.
const SLUG=/^[a-z0-9][a-z0-9-]{0,119}$/,HOUR=3600e3,DAY=24*HOUR,LIMIT=40;
const json=(d,s=200,h={})=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json','cache-control':'no-store',...h}});
const hid=(salt,s)=>createHash('sha256').update(salt+'|'+s).digest('hex').slice(0,24);
const half=x=>Number.isFinite(x)&&Number.isInteger(x*2);

export const handle=async(req,ip,{stats,votes,exists,salt='fm-mods-comunidad',now=Date.now()})=>{
  if(req.method==='GET'){
    const {blobs}=await stats.list();const out={};
    await Promise.all(blobs.map(async b=>{const v=await stats.get(b.key,{type:'json'});if(v)out[b.key]=v}));
    return json(out,200,{'cache-control':'public, max-age=30'});
  }
  if(req.method!=='POST')return json({error:'method'},405);
  let b;try{b=await req.json()}catch{return json({error:'json'},400)}
  const {slug,action}=b||{};
  if(!SLUG.test(slug||'')||!['download','like','unlike','rate'].includes(action))return json({error:'bad'},400);
  const me=hid(salt,ip||'anon');
  // límite por hora y persona
  const rk='rl:'+me,rl=(await votes.get(rk,{type:'json'}))||{t:now,c:0};
  if(now-rl.t>HOUR){rl.t=now;rl.c=0}
  if(rl.c>=LIMIT)return json({error:'rate'},429,{'retry-after':'3600'});
  rl.c++;await votes.setJSON(rk,rl);
  if(!(await exists(slug)))return json({error:'unknown'},404);
  const cur={likes:0,downloads:0,ratingSum:0,ratingCount:0,...((await stats.get(slug,{type:'json'}))||{})};
  const vk=`${slug}:${me}`,mine={like:false,rate:0,dl:0,...((await votes.get(vk,{type:'json'}))||{})};
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
  await Promise.all([stats.setJSON(slug,cur),votes.setJSON(vk,mine)]);
  return json(cur);
};

export default async (req,context)=>handle(req,context?.ip||req.headers.get('x-nf-client-connection-ip')||'',{
  stats:getStore('mod-stats'),votes:getStore('mod-votes'),salt:process.env.STATS_SALT||undefined,
  exists:slug=>fetch(new URL(`/mod/${slug}/`,req.url),{method:'HEAD'}).then(r=>r.ok).catch(()=>false)});
export const config={path:'/api/stats'};
