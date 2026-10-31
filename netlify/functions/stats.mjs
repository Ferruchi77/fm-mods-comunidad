import {getStore} from '@netlify/blobs';
const SLUG=/^[a-z0-9][a-z0-9-]{0,119}$/;
const json=(d,s=200,h={})=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json','cache-control':'no-store',...h}});
export default async req=>{
  const store=getStore('mod-stats');
  if(req.method==='GET'){
    const {blobs}=await store.list();const out={};
    await Promise.all(blobs.map(async b=>{const v=await store.get(b.key,{type:'json'});if(v)out[b.key]=v}));
    return json(out,200,{'cache-control':'public, max-age=30'});
  }
  if(req.method!=='POST')return json({error:'method'},405);
  let b;try{b=await req.json()}catch{return json({error:'json'},400)}
  const {slug,action}=b||{};
  if(!SLUG.test(slug||'')||!['download','like','unlike'].includes(action))return json({error:'bad'},400);
  // solo cuenta fichas que existen de verdad
  const ok=await fetch(new URL(`/mod/${slug}/`,req.url),{method:'HEAD'}).then(r=>r.ok).catch(()=>false);
  if(!ok)return json({error:'unknown'},404);
  const cur=(await store.get(slug,{type:'json'}))||{likes:0,downloads:0};
  if(action==='download')cur.downloads++;
  if(action==='like')cur.likes++;
  if(action==='unlike')cur.likes=Math.max(0,cur.likes-1);
  await store.setJSON(slug,cur);
  return json(cur);
};
export const config={path:'/api/stats'};
