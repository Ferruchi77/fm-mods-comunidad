const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const F=require('../public/js/ficha.js');
test('rich/plain: cursiva y código sin dejar símbolos',()=>{
  assert.equal(F.rich('Usa *skins* y `.dll`'),'<p>Usa <em>skins</em> y <code>.dll</code></p>');
  assert.equal(F.plain('Usa *skins* y `.dll` con **negrita**'),'Usa skins y .dll con negrita');
  assert.ok(!F.rich('<script>*x*</script>').includes('<script>'));
});
test('versión coherente (formato V2.3) entre package.json, build.js y CHANGELOG',()=>{
  const pk=JSON.parse(fs.readFileSync('package.json','utf8')).version,b=fs.readFileSync('build.js','utf8').match(/version:'V(\d+)\.(\d+)'/),cl=fs.readFileSync('CHANGELOG.md','utf8').match(/^## V(\d+)\.(\d+)/m);
  assert.ok(b&&cl,'el formato debe ser V<mayor>.<menor>');
  assert.equal(pk,`${b[1]}.${b[2]}.0`);   // build.js «V2.3» ⇄ package.json 2.3.0 ⇄ CHANGELOG «## V2.3»
  assert.equal(`${cl[1]}.${cl[2]}`,`${b[1]}.${b[2]}`);
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
test('workflows: parche.yml no interpola entradas en el script',()=>{
  const y=fs.readFileSync('.github/workflows/parche.yml','utf8');
  assert.ok(!/run:[\s\S]*\$\{\{\s*inputs\./.test(y.replace(/env:[\s\S]*?run:/g,'run:')));
});
// El contenido lo edita el panel (Decap): un dato raro en una ficha NUNCA debe tumbar el CI. Aquí solo se avisa (anotación ::warning en GitHub).
test('fichas: avisa (sin fallar) de datos legados: install_path sin ruta, utm_ o campo author antiguo',()=>{
  const avisos=[];
  for(const f of fs.readdirSync('content/mods')){const m=JSON.parse(fs.readFileSync('content/mods/'+f,'utf8'));
    if(m.install_path&&!/[\\/]/.test(m.install_path))avisos.push(`${f}: install_path no parece una ruta`);
    if(/utm_/.test(m.download_url||''))avisos.push(`${f}: la URL de descarga lleva parámetros utm_`);
    if(m.author&&!m.authors)avisos.push(`${f}: usa el campo antiguo author (mejor authors)`)}
  for(const a of avisos)console.log(`::warning file=content/mods/${a.split(':')[0]}::${a}`);
  assert.ok(true);
});
// Archivos que ya no hacen falta (la subida web de GitHub no borra lo que desaparece de un zip): se avisa, no se falla.
test('obsoletos: avisa (sin fallar) de archivos o carpetas que conviene borrar (scripts/obsoletos.json)',()=>{
  const lista=JSON.parse(fs.readFileSync('scripts/obsoletos.json','utf8')).borrar;
  assert.ok(Array.isArray(lista)&&lista.every(x=>x.ruta));
  for(const x of lista)if(fs.existsSync(x.ruta))console.log(`::warning file=${x.ruta}::BORRA ${x.ruta} (${x.motivo})`);
});

// El nombre del archivo (slug) debería parecerse al título. Solo avisa: el panel puede cambiar títulos y no debe tumbar el CI. Para renombrar de forma segura usa scripts/renombrados.json.
test('fichas: avisa (sin fallar) si el nombre del archivo no coincide con el título',()=>{
  const sl=t=>String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  for(const f of fs.readdirSync('content/mods')){const m=JSON.parse(fs.readFileSync('content/mods/'+f,'utf8')),s=f.replace(/\.json$/,'');
    if(sl(m.title)!==s)console.log(`::warning file=content/mods/${f}::El archivo se llama «${s}» pero el título «${m.title}» daría «${sl(m.title)}». Si quieres renombrarlo, añádelo a scripts/renombrados.json (conserva enlaces y estadísticas).`)}
  assert.ok(true);
});
