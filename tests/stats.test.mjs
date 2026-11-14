import test from 'node:test';
import assert from 'node:assert/strict';
import {handle} from '../netlify/functions/stats.mjs';

// Almacén en memoria con la misma interfaz que @netlify/blobs que usa stats.mjs
const store=()=>{const m=new Map();return{m,
  get:async(k)=>m.has(k)?JSON.parse(m.get(k)):null,
  setJSON:async(k,v)=>{m.set(k,JSON.stringify(v))},
  list:async()=>({blobs:[...m.keys()].map(key=>({key}))})}};
const mk=()=>({stats:store(),votes:store(),exists:async s=>s!=='nope',salt:'t'});
const post=(env,ip,body,now)=>handle(new Request('http://x/api/stats',{method:'POST',body:JSON.stringify(body)}),ip,{...env,now});
const get=(env,now)=>handle(new Request('http://x/api/stats'),'1.1.1.1',{...env,now});
const j=r=>r.json();

test('me gusta: una vez por persona, y se puede quitar',async()=>{
  const e=mk();
  assert.equal((await j(await post(e,'a',{slug:'m1',action:'like'}))).likes,1);
  assert.equal((await j(await post(e,'a',{slug:'m1',action:'like'}))).likes,1);
  assert.equal((await j(await post(e,'b',{slug:'m1',action:'like'}))).likes,2);
  assert.equal((await j(await post(e,'a',{slug:'m1',action:'unlike'}))).likes,1);
});
test('valoración: se puede cambiar y se mantiene la media',async()=>{
  const e=mk();
  await post(e,'a',{slug:'m1',action:'rate',value:5});
  const r=await j(await post(e,'a',{slug:'m1',action:'rate',value:3}));
  assert.equal(r.ratingCount,1);assert.equal(r.ratingSum,3);
  assert.equal((await post(e,'a',{slug:'m1',action:'rate',value:5.3})).status,400);
  assert.equal((await post(e,'a',{slug:'m1',action:'rate',value:0})).status,400);
});
test('descarga: una cada 24 h por persona',async()=>{
  const e=mk(),t=1e12;
  await post(e,'a',{slug:'m1',action:'download'},t);
  assert.equal((await j(await post(e,'a',{slug:'m1',action:'download'},t+1000))).downloads,1);
  assert.equal((await j(await post(e,'a',{slug:'m1',action:'download'},t+25*3600e3))).downloads,2);
});
test('«funciona / no funciona»: un voto por versión, cambiable',async()=>{
  const e=mk();
  let r=await j(await post(e,'a',{slug:'m1',action:'works',ver:'FM27',value:'ok'}));
  assert.deepEqual(r.works.FM27,{ok:1,ko:0});
  r=await j(await post(e,'a',{slug:'m1',action:'works',ver:'FM27',value:'ok'}));
  assert.deepEqual(r.works.FM27,{ok:1,ko:0});
  r=await j(await post(e,'a',{slug:'m1',action:'works',ver:'FM27',value:'ko'}));
  assert.deepEqual(r.works.FM27,{ok:0,ko:1});
  r=await j(await post(e,'b',{slug:'m1',action:'works',ver:'FM26',value:'ok'}));
  assert.deepEqual(r.works,{FM27:{ok:0,ko:1},FM26:{ok:1,ko:0}});
  assert.equal((await post(e,'a',{slug:'m1',action:'works',ver:'27',value:'ok'})).status,400);
  assert.equal((await post(e,'a',{slug:'m1',action:'works',ver:'FM27',value:'x'})).status,400);
});
test('fichas inexistentes, slug o acción inválidos',async()=>{
  const e=mk();
  assert.equal((await post(e,'a',{slug:'nope',action:'like'})).status,404);
  assert.equal((await post(e,'a',{slug:'../x',action:'like'})).status,400);
  assert.equal((await post(e,'a',{slug:'m1',action:'hack'})).status,400);
  assert.equal((await handle(new Request('http://x/api/stats',{method:'DELETE'}),'a',e)).status,405);
});
test('límite de 40 acciones por hora',async()=>{
  const e=mk(),t=1e12;let last;
  for(let i=0;i<41;i++)last=await post(e,'a',{slug:'m1',action:'like'},t+i);
  assert.equal(last.status,429);
  assert.equal((await post(e,'a',{slug:'m1',action:'like'},t+3601e3)).status,200);
});
test('GET devuelve todas las fichas desde el índice y lo reconstruye al caducar',async()=>{
  const e=mk(),t=1e12;
  await post(e,'a',{slug:'m1',action:'like'},t);await post(e,'a',{slug:'m2',action:'like'},t);
  let d=await j(await get(e,t+1000));
  assert.deepEqual(Object.keys(d).sort(),['m1','m2']);
  assert.ok(e.stats.m.has('_index'));
  // el índice no se incluye como ficha
  assert.ok(!('_index' in d));
  // un voto nuevo se refleja al instante
  await post(e,'b',{slug:'m1',action:'like'},t+2000);
  assert.equal((await j(await get(e,t+3000))).m1.likes,2);
  // si el índice se pierde, se reconstruye desde las fichas
  e.stats.m.delete('_index');
  assert.equal((await j(await get(e,t+4000))).m1.likes,2);
});

test('seguridad: sin salt, sin IP y desde otro sitio se rechaza; IPv6 cuenta por /64', async()=>{
  const e=mk();
  assert.equal((await post({...e,salt:undefined},'1.1.1.1',{slug:'a',action:'like'})).status,503);
  assert.equal((await post(e,'',{slug:'a',action:'like'})).status,400);
  const x=await handle(new Request('http://x/api/stats',{method:'POST',headers:{origin:'https://malo.example'},body:JSON.stringify({slug:'a',action:'like'})}),'1.1.1.1',{...e,now:1});
  assert.equal(x.status,403);
  const y=await handle(new Request('http://x/api/stats',{method:'POST',headers:{'sec-fetch-site':'cross-site'},body:JSON.stringify({slug:'a',action:'like'})}),'1.1.1.1',{...e,now:1});
  assert.equal(y.status,403);
  await post(e,'2001:db8:1:2:aaaa::1',{slug:'a',action:'like'},1);
  const r=await post(e,'2001:db8:1:2:bbbb::2',{slug:'a',action:'like'},2);
  assert.equal((await r.json()).likes,1);   // misma /64 = la misma persona
});
