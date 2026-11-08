// Compila la web en una carpeta temporal y comprueba lo esencial de cada idioma y de las páginas nuevas.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),p=require('path'),cp=require('child_process');
const OUT=fs.mkdtempSync(p.join(os.tmpdir(),'fm-'));
const r=cp.spawnSync(process.execPath,['build.js'],{env:{...process.env,OUT_DIR:OUT,SYNC_AUTHORS:'0',NO_STATS_FETCH:'1',STRICT:'1'},encoding:'utf8'});
const rd=f=>fs.readFileSync(p.join(OUT,f),'utf8');
const slugs=fs.readdirSync('content/mods').filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5));
const PREF={es:'',en:'en/',ca:'ca/',fr:'fr/',pt:'pt-br/',it:'it/'};
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
