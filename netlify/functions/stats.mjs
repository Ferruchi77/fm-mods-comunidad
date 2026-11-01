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
  if(!SLUG.test(slug||'')||!['download','like','unlike','rate'].includes(action))return json({error:'bad'},400);
  // solo cuenta fichas que existen de verdad
  const ok=await fetch(new URL(`/mod/${slug}/`,req.url),{method:'HEAD'}).then(r=>r.ok).catch(()=>false);
  if(!ok)return json({error:'unknown'},404);
  const cur={likes:0,downloads:0,ratingSum:0,ratingCount:0,...((await store.get(slug,{type:'json'}))||{})};
  if(action==='download')cur.downloads++;
  if(action==='like')cur.likes++;
  if(action==='unlike')cur.likes=Math.max(0,cur.likes-1);
  if(action==='rate'){
    const v=Number(b.value),p=Number(b.prev)||0;
    const half=x=>Number.isFinite(x)&&Number.isInteger(x*2);
    if(!half(v)||v<.5||v>5||!half(p)||p<0||p>5)return json({error:'bad'},400);
    if(p&&cur.ratingCount>0)cur.ratingSum+=v-p; else{cur.ratingSum+=v;cur.ratingCount++}
    cur.ratingSum=Math.min(5*cur.ratingCount,Math.max(.5*cur.ratingCount,cur.ratingSum));
  }
  await store.setJSON(slug,cur);
  return json(cur);
};
export const config={path:'/api/stats'};
