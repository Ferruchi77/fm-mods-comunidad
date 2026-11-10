// Compila la web en una carpeta temporal y comprueba lo esencial de cada idioma y de las páginas nuevas.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),p=require('path'),cp=require('child_process');
const OUT=fs.mkdtempSync(p.join(os.tmpdir(),'fm-'));
const r=cp.spawnSync(process.execPath,['build.js'],{env:{...process.env,OUT_DIR:OUT,SYNC_AUTHORS:'0',NO_STATS_FETCH:'1',STRICT:'1'},encoding:'utf8'});
const rd=f=>fs.readFileSync(p.join(OUT,f),'utf8');
const slugs=fs.readdirSync('content/mods').filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5));
const PREF={es:'',en:'en/',ca:'ca/',fr:'fr/',pt:'pt-br/',it:'it/'};
const wW=f=>fs.readFileSync(p.join('public',f)).readUInt16LE(26)&0x3fff;   // ancho real del WebP (VP8) para no fijar cifras que cambian al sustituir la imagen
test('la compilación estricta termina sin errores',()=>{assert.equal(r.status,0,r.stderr+r.stdout)});
test('cada idioma genera portada, ficha de cada mod, categorías y versiones',()=>{
  for(const [l,pre] of Object.entries(PREF)){
    assert.ok(fs.existsSync(p.join(OUT,pre,'index.html')),`${l}: portada`);
    assert.ok(fs.existsSync(p.join(OUT,pre,'novedades/index.html')),`${l}: novedades`);
    for(const s of slugs)assert.ok(fs.existsSync(p.join(OUT,pre,'mod',s,'index.html')),`${l}: mod ${s}`);
    assert.ok(fs.existsSync(p.join(OUT,pre,'categoria/skins/index.html')),`${l}: categoría`);
    assert.ok(fs.readdirSync(p.join(OUT,pre,'version')).length>0,`${l}: versiones`)}});
test('las páginas ya traducidas no dejan atributos data-i18n sueltos ni textos {x} sin sustituir',()=>{
  for(const pre of Object.values(PREF)){const h=rd(p.join(pre,'mod',slugs[0],'index.html'));
    assert.ok(!/data-i18n="/.test(h.replace(/<[^>]*data-copy[^>]*>/g,'')),'data-i18n sobrante');
    assert.ok(!/\{(h|n|v|t|x|ok|ko)\}/.test(h),'marcador sin sustituir')}});
test('hay enlace «saltar al contenido», manifest, CSP y rating de accesibilidad básico',()=>{
  const h=rd('index.html');
  assert.match(h,/class="skip"/);assert.match(h,/rel="manifest"/);assert.match(h,/Content-Security-Policy/);assert.match(h,/<main id="main"/)});
test('la ficha incluye ¿te funciona?, compartir, favorito y migas con JSON-LD',()=>{
  const h=rd(`mod/${slugs[0]}/index.html`);
  assert.match(h,/data-works=/);assert.match(h,/class="box share"/);assert.match(h,/data-fav=/);assert.match(h,/BreadcrumbList/)});
test('en inglés el listado de autores usa «and», no «y»',()=>{
  const multi=slugs.find(s=>JSON.parse(fs.readFileSync(`content/mods/${s}.json`,'utf8')).authors?.length>1);
  if(!multi)return;const h=rd(`en/mod/${multi}/index.html`);assert.ok(!/<strong>[^<]*<\/a> y /.test(h))});
test('sitemap con hreflang, calidad.json y service worker versionado',()=>{
  assert.match(rd('sitemap.xml'),/hreflang="pt-BR"/);assert.match(rd('sitemap.xml'),/\/categoria\/skins\//);
  assert.ok(JSON.parse(rd('admin/calidad.json')).mods.length===slugs.length);
  assert.ok(!/__BUILD__/.test(rd('sw.js')))});
test('las portadas locales de las fichas existen en disco',()=>{
  for(const s of slugs){const c=JSON.parse(fs.readFileSync(`content/mods/${s}.json`,'utf8')).cover;if(c&&c.startsWith('/img/'))assert.ok(fs.existsSync(p.join('public',c)),`${s}: falta ${c}`)}});
test('las tarjetas con portada local usan srcset 320/640',()=>{
  const h=rd('index.html');assert.match(h,/srcset="\/img\/uploads\/df11-faces-320\.webp 320w, \/img\/uploads\/df11-faces-640\.webp 640w, \/img\/uploads\/df11-faces\.webp 740w"/)});
test('netlify.toml: salta builds sin cambios publicables y no despliega previews',()=>{
  const t=fs.readFileSync('netlify.toml','utf8');
  assert.match(t,/ignore = "git diff --quiet \$CACHED_COMMIT_REF \$COMMIT_REF -- content/);
  assert.match(t,/\[context\.deploy-preview\]\s+ignore = "exit 0"/);assert.match(t,/\[context\.branch-deploy\]\s+ignore = "exit 0"/)});
test('los workflows que hacen commits automáticos que no cambian la web llevan [skip netlify]',()=>{
  assert.match(fs.readFileSync('.github/workflows/sync-autores.yml','utf8'),/autores nuevos detectados en los mods \[skip ci\] \[skip netlify\]/);
  assert.match(fs.readFileSync('.github/workflows/comprobar-enlaces.yml','utf8'),/\[skip netlify\]/)});
test('ficha: la valoración con estrellas va dentro de la caja de descarga, tras las métricas y antes de «Me gusta»',()=>{
  const h=rd(`mod/${slugs[0]}/index.html`),box=h.slice(h.indexOf('class="box dlbox"'));
  assert.equal((h.match(/data-rate=/g)||[]).length,1,'solo debe haber un selector de valoración');
  const iBtn=box.indexOf('data-dlc='),iFst=box.indexOf('class="fst"'),iRate=box.indexOf('data-rate='),iLike=box.indexOf('data-like=');
  assert.ok(iBtn>=0&&iBtn<iFst&&iFst<iRate&&iRate<iLike,`orden incorrecto ${iBtn},${iFst},${iRate},${iLike}`);
  assert.equal((box.match(/data-star="/g)||[]).length,5)});
test('ficha: el contador de «me gusta» ya no usa la clase .fl de las banderas de idioma',()=>{
  const h=rd(`mod/${slugs[0]}/index.html`);assert.match(h,/class="flk" data-fl/);assert.ok(!/class="fl" data-fl/.test(h))});
test('tarjetas: el texto breve no se recorta con CSS',()=>{
  const css=fs.readFileSync('public/css/style.css','utf8');
  assert.match(css,/\.ex\.hook,\.feat-grid \.ex\.hook,\.grid\.list \.ex\.hook\{[^}]*-webkit-line-clamp:unset/);
  // ninguna regla posterior vuelve a limitar las líneas de .ex.hook
  assert.ok(!/\.ex\.hook\{[^}]*-webkit-line-clamp:\d/.test(css.slice(css.indexOf('===== v.18 ====='))))});
test('srcset: tarjetas con 320/640 y ancho real del original; «Más como este» sin el original',()=>{
  const h=rd('index.html');
  assert.ok(h.includes(`srcset="/img/uploads/realnamefix27_1-320.webp 320w, /img/uploads/realnamefix27_1-640.webp 640w, /img/uploads/realnamefix27_1.webp ${wW('img/uploads/realnamefix27_1.webp')}w" sizes="(max-width:600px) 46vw, 260px"`));
  const all=slugs.map(s=>rd(`mod/${s}/index.html`)).join('\n');
  for(const m of all.matchAll(/<li><a href="\/mod\/[^"]+"><img [^>]*srcset="([^"]+)" sizes="96px"/g))assert.ok(!/1200w|740w/.test(m[1]),m[1])});
