const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const L=['es','en','ca','fr','pt','it'],D=Object.fromEntries(L.map(l=>[l,JSON.parse(fs.readFileSync(`locales/${l}.json`,'utf8'))]));
const vars=t=>[...String(t).matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort().join(',');
test('todos los idiomas tienen exactamente las mismas claves que es.json',()=>{
  for(const l of L.slice(1)){
    const miss=Object.keys(D.es).filter(k=>!(k in D[l])),extra=Object.keys(D[l]).filter(k=>!(k in D.es));
    assert.deepEqual(miss,[],`${l}: faltan claves`);assert.deepEqual(extra,[],`${l}: sobran claves`)}});
test('los marcadores {x} de cada texto coinciden con el español',()=>{
  for(const l of L.slice(1))for(const k of Object.keys(D.es))if(k in D[l])assert.equal(vars(D[l][k]),vars(D.es[k]),`${l}.${k}`)});
test('ningún texto está vacío',()=>{for(const l of L)for(const [k,v] of Object.entries(D[l]))assert.ok(String(v).trim(),`${l}.${k} vacío`)});
test('las traducciones de novedades están completas',()=>{
  const t=JSON.parse(fs.readFileSync('content/traducciones.json','utf8'));
  for(const [h,e] of Object.entries(t))for(const l of ['en','ca','fr','pt','it'])assert.ok(e[l]&&e[l].trim(),`${h}.${l}`)});
