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
test('srcset: tarjetas con 320/640 y ancho real del original',()=>{
  const h=rd('index.html');
  assert.ok(h.includes(`srcset="/img/uploads/realnamefix27_1-320.webp 320w, /img/uploads/realnamefix27_1-640.webp 640w, /img/uploads/realnamefix27_1.webp ${wW('img/uploads/realnamefix27_1.webp')}w" sizes="(max-width:600px) 46vw, 260px"`));
});

// ===== v.19 =====
const FM=require('../public/js/ficha.js'),read=f=>fs.readFileSync(f,'utf8');
test('v.19 · «Más como este» usa las mismas tarjetas y parrilla que «Imprescindibles», fuera de la barra lateral',()=>{
  const all=slugs.map(s=>rd(`mod/${s}/index.html`)).join('\n');
  assert.ok(/<section class="rel-sec"><h2[^>]*>[^<]+<\/h2><div class="grid feat-grid"><a class="card"/.test(all));
  assert.ok(!/class="box rel"/.test(all));
  const h=rd('mod/regenesis-27/index.html'),aside=h.slice(h.indexOf('<aside>'),h.indexOf('</aside>'));
  assert.ok(!aside.includes('rel-sec'),'los relacionados no van dentro de la barra lateral')});
test('v.19 · la fecha del historial de versiones está destacada (clase ud) y el CSS la define',()=>{
  const h=rd('mod/regenesis-27/index.html');
  assert.ok(/<time class="ud" datetime="2026-11-10"/.test(h)&&/<time class="ud ud-new"/.test(h));
  assert.ok(/time\.ud[^{]*\{[^}]*background:var\(--acb\)/.test(read('public/css/style.css')))});
test('v.19 · la portada muestra 50 mods de golpe',()=>{assert.ok(/const PAGE=50,/.test(read('public/js/app.js')))});
test('v.19 · Novedades: filtros, salto por meses y tarjetas con fecha, tipo y portada (y la portada usa las mismas tarjetas)',()=>{
  for(const l of Object.keys(PREF)){
    const h=rd(PREF[l]+'novedades/index.html');
    for(const id of ['nv-list','nv-per','nv-ver','nv-count','nv-reset','nv-empty'])assert.ok(h.includes(`id="${id}"`),`${l}: falta #${id}`);
    assert.ok(/class="nv-seg"/.test(h)&&/class="nv-jump"/.test(h)&&/<section class="nv-m" id="m-\d{4}-\d{2}">/.test(h));
    assert.ok(/<li class="nv nv-(new|upd)"[^>]*data-nt="(new|update)"[^>]*data-dt="\d{4}-\d{2}-\d{2}"/.test(h));
    assert.ok(/<time class="ud/.test(h),l)}
  assert.ok(/<ul class="nvl nv-home"><li class="nv/.test(rd('index.html')))});
test('v.19 · el nombre del mod se traduce en cada idioma (tarjeta, ficha, SEO y buscador)',()=>{
  const T=JSON.parse(read('content/traducciones.json')),sha=t=>require('crypto').createHash('sha1').update(t.trim(),'utf8').digest('hex').slice(0,12);
  const e=T[sha('Megapack de Caras 3D')];assert.ok(e);
  for(const l of ['en','ca','fr','pt','it']){
    const h=rd(PREF[l]+'mod/megapack-de-caras-3d/index.html');
    assert.ok(h.includes(`<h1>${FM.esc(e[l])}</h1>`),`${l}: h1`);assert.ok(h.includes(`<title>${FM.esc(e[l])} (`),`${l}: title`);
    assert.ok(rd(PREF[l]+'index.html').includes(`<h3>${FM.esc(e[l])}</h3>`),`${l}: tarjeta`)}
  assert.ok(rd('mod/megapack-de-caras-3d/index.html').includes('<h1>Megapack de Caras 3D</h1>'));
  const s=JSON.parse(rd('data/search.json')).find(x=>x.s==='megapack-de-caras-3d');
  assert.equal(s.tt.en,e.en);assert.ok(s.n.includes('3d faces megapack')&&s.n.includes('megapack de caras 3d'));
  assert.ok(/ttl=m=>\(m\.tt&&m\.tt\[i18n\.lang\]\)/.test(read('public/js/app.js')))});
test('v.19 · todos los nombres de mod y textos de novedades tienen traducción (nada pendiente)',()=>{
  const o=cp.spawnSync(process.execPath,['scripts/translate.js','--check'],{encoding:'utf8'});assert.match(o.stdout,/pendientes: 0/)});
test('v.19 · texto enriquecido: negrita, color y listas con guiones; escapa HTML y se limpia en extractos',()=>{
  assert.equal(FM.rich('Hola **mundo** [color=#ff0000]rojo[/color]\nlinea2\n\n- uno\n- dos <b>x</b>\n\nFin <script>'),
    '<p>Hola <strong>mundo</strong> <span style="color:#ff0000">rojo</span><br>linea2</p><ul><li>uno</li><li>dos &lt;b&gt;x&lt;/b&gt;</li></ul><p>Fin &lt;script&gt;</p>');
  assert.ok(!FM.rich('[color=red;x:y]a[/color]').includes('<span'),'solo colores #rrggbb');
  assert.equal(FM.rich('Texto antiguo\nsin marcado'),'<p>Texto antiguo<br>sin marcado</p>');
  assert.equal(FM.plain('**a** [color=#00ff00]b[/color]\n- c'),'a b c')});
test('v.19 · panel: guardar publica directo (sin flujo editorial) y descripción/cambios usan el editor enriquecido',()=>{
  const c=read('public/admin/config.yml'),ix=read('public/admin/index.html');
  assert.ok(/^publish_mode: simple$/m.test(c)&&!/^publish_mode: editorial_workflow/m.test(c));
  assert.ok(/name: description, widget: fmrich/.test(c)&&/name: note, widget: fmrich/.test(c));
  assert.ok(/registerWidget\('fmrich'/.test(read('public/admin/widgets.js')));
  assert.ok(ix.indexOf('richtext.js')>-1&&ix.indexOf('richtext.js')<ix.indexOf('widgets.js'));
  assert.ok(/text-align:justify/.test(read('public/admin/admin.css'))&&/text-align:justify/.test(read('public/admin/preview.css')))});
test('v.19 · GitHub Actions: sin acciones de Node 20 y con Node moderno',()=>{
  for(const f of fs.readdirSync('.github/workflows')){const y=read('.github/workflows/'+f);
    assert.ok(!/actions\/(checkout|setup-node)@v[1-5]\b/.test(y),`${f}: acción antigua`);
    for(const m of y.matchAll(/node-version:\s*(\d+)/g))assert.ok(+m[1]>=22,`${f}: node ${m[1]}`)}
  assert.ok(/NODE_VERSION = "(2[2-9]|[3-9]\d)"/.test(read('netlify.toml')))});
