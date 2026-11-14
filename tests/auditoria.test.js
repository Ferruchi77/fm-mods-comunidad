const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const F=require('../public/js/ficha.js');
test('rich/plain: cursiva y código sin dejar símbolos',()=>{
  assert.equal(F.rich('Usa *skins* y `.dll`'),'<p>Usa <em>skins</em> y <code>.dll</code></p>');
  assert.equal(F.plain('Usa *skins* y `.dll` con **negrita**'),'Usa skins y .dll con negrita');
  assert.ok(!F.rich('<script>*x*</script>').includes('<script>'));
});
test('versión coherente entre package.json, build.js y CHANGELOG',()=>{
  const pk=JSON.parse(fs.readFileSync('package.json','utf8')).version,b=fs.readFileSync('build.js','utf8').match(/version:'v\.(\d+)'/)[1],cl=fs.readFileSync('CHANGELOG.md','utf8').match(/^## v\.(\d+)\.(\d+)/m);
  assert.equal(pk,`1.${b}.0`);   // build.js «v.20» ⇄ package.json 1.20.0 ⇄ CHANGELOG «v.2.0»
  assert.equal(`${cl[1]}${cl[2]}`,b);
});
test('manifiesto: iconos 192 y 512 y maskable separado; los archivos existen',()=>{
  const m=JSON.parse(fs.readFileSync('public/manifest.webmanifest','utf8'));
  assert.ok(m.icons.some(i=>i.sizes==='192x192')&&m.icons.some(i=>i.sizes==='512x512'&&i.purpose==='any')&&m.icons.some(i=>i.purpose==='maskable'));
  assert.ok(!m.icons.some(i=>/any maskable/.test(i.purpose||'')));
  m.icons.forEach(i=>assert.ok(fs.existsSync('public'+i.src),i.src));
});
test('cabeceras: HSTS y noindex en /admin',()=>{
  const h=fs.readFileSync('public/_headers','utf8');
  assert.match(h,/Strict-Transport-Security/);assert.match(h,/\/admin\/\*\n\s+X-Robots-Tag: noindex/);
});
test('login con GitHub: solo usuarios permitidos',async()=>{
  const {allowed}=await import('../netlify/functions/callback.mjs');
  assert.equal(allowed('Ana, luis','ana'),true);assert.equal(allowed('ana','eva'),false);assert.equal(allowed('','ana'),false);
});
test('workflows: parche.yml no interpola entradas en el script y no hay imagenes.yml duplicado',()=>{
  const y=fs.readFileSync('.github/workflows/parche.yml','utf8');
  assert.ok(!/run:[\s\S]*\$\{\{\s*inputs\./.test(y.replace(/env:[\s\S]*?run:/g,'run:')));
  assert.ok(!fs.existsSync('.github/workflows/imagenes.yml'));
});
test('fichas: ninguna con install_path que no sea una ruta ni URL de descarga con utm_',()=>{
  for(const f of fs.readdirSync('content/mods')){const m=JSON.parse(fs.readFileSync('content/mods/'+f,'utf8'));
    if(m.install_path)assert.match(m.install_path,/[\\/]/,f);assert.ok(!/utm_/.test(m.download_url),f);assert.ok(!m.author||m.authors,f)}
});
