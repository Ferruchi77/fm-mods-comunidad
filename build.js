// Generador estático sin dependencias: lee content/mods/*.json y crea /dist
const fs=require('fs'),p=require('path');
// ====== AJUSTES (edita solo esto) ======
const C={
  name:'FM Mods Comunidad',
  url:process.env.URL||(process.env.VERCEL_PROJECT_PRODUCTION_URL&&'https://'+process.env.VERCEL_PROJECT_PRODUCTION_URL)||'https://fm-mods-comunidad.netlify.app',
  x:'FMModsComunidad',
  kofi:'https://ko-fi.com/fmmodscomunidad',      // Ko-fi / Buy Me a Coffee / PayPal.me
  adsense:'',                                // 'ca-pub-XXXXXXXXXXXXXXXX' cuando te aprueben AdSense
  email:'fmmodscomunidad@gmail.com',            // recibe los "enlace caído"
  requests:'',       // formulario de peticiones (otro Google Form). Si lo dejas vacío, se pide por X
  requestsEmbed:'',  // opcional: URL de "incrustar" del formulario para verlo dentro de la página
  version:'v.19',   // versión del proyecto: súbela +1 en cada entrega (sale en el pie de la web y en el panel)
  reload:['FM24'],   // versiones de FM en las que hay que recargar el skin/caché (en el resto el juego lo hace solo)
  slots:{'bajo-titulo':'','junto-descarga':''}, // IDs de bloque de anuncio (data-ad-slot) de AdSense
  submit:'https://forms.gle/MRgz9tF5xXea5EAn8'   // formulario "Envía tu mod"
};
const readDir=d=>fs.existsSync(d)?fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>({...JSON.parse(fs.readFileSync(p.join(d,f),'utf8')),slug:f.slice(0,-5)})):[];
const CATS={}; // se rellena desde content/categorias (editable en /admin)
readDir('content/categorias').sort((a,b)=>(a.order??99)-(b.order??99)||String(a.name).localeCompare(String(b.name),'es')).forEach(c=>{const t={es:c.name};['en','ca','fr','pt','it'].forEach(l=>{const v=String(c['name_'+l]||'').trim();if(v)t[l]=v});CATS[c.slug]={n:c.name,n0:c.name,d:c.description||'',dir:String(c.install_dir==null?'graphics/':c.install_dir).trim(),...(Object.keys(t).length>1?{t}:{})}});
const BADGE={};readDir('content/distintivos').forEach(b=>BADGE[b.name]={color:b.color||'gris',hex:b.hex||'',icon:b.icon||'',featured:!!b.featured});
if(!Object.keys(BADGE).length)Object.assign(BADGE,{Imprescindible:{color:'violeta',featured:true},Probado:{color:'verde'},Oficial:{color:'amarillo'}});
const FEAT=Object.keys(BADGE).filter(k=>BADGE[k].featured);if(BADGE.Imprescindible&&!FEAT.includes('Imprescindible'))FEAT.push('Imprescindible'); // distintivos que llevan al carrusel de la portada
// La lógica de la ficha vive en public/js/ficha.js (la comparte la vista previa del panel)
const hv=f=>require('crypto').createHash('md5').update(fs.readFileSync(f)).digest('hex').slice(0,8);
const V={css:hv('public/css/style.css'),app:hv('public/js/app.js'),ficha:hv('public/js/ficha.js')};
const F=require('./public/js/ficha.js'),{esc,vk,verYear,dt,UI,normalize,rich,plain}=F;
// ===== i18n =====
// Diccionarios en locales/*.json (es = texto base del HTML). Se incrustan en dist/js/i18n.js; el navegador traduce lo marcado con data-i18n.
const LANGS=['es','en','ca','fr','pt','it'],DICT={};
// Una URL por idioma: español en la raíz (/) y el resto bajo /en/, /ca/, /fr/, /pt-br/, /it/.
// «pt» es portugués de Brasil (pt-BR): la dirección es /pt-br/ y el atributo lang es pt-BR.
const LM={es:{slug:'',html:'es',hl:'es',loc:'es-ES',og:'es_ES',name:'Español',code:'ES'},en:{slug:'en',html:'en',hl:'en',loc:'en-GB',og:'en_GB',name:'English',code:'EN'},
ca:{slug:'ca',html:'ca',hl:'ca',loc:'ca-ES',og:'ca_ES',name:'Català',code:'CA'},fr:{slug:'fr',html:'fr',hl:'fr',loc:'fr-FR',og:'fr_FR',name:'Français',code:'FR'},
pt:{slug:'pt-br',html:'pt-BR',hl:'pt-BR',loc:'pt-BR',og:'pt_BR',name:'Português (Brasil)',code:'PT-BR'},it:{slug:'it',html:'it',hl:'it',loc:'it-IT',og:'it_IT',name:'Italiano',code:'IT'}};
let CUR='es',BASE='';   // idioma que se está generando y su prefijo de URL
const strictW=[],sw=x=>{console.warn(x);strictW.push(x)};   // avisos que con STRICT=1 son errores (los usa la acción de GitHub «Comprobar»)
LANGS.forEach(l=>{try{DICT[l]=JSON.parse(fs.readFileSync(`locales/${l}.json`,'utf8'))}catch(e){console.warn(`⚠ locales/${l}.json: ${e.message}`);DICT[l]={}}});
LANGS.slice(1).forEach(l=>{Object.keys(DICT.es).forEach(k=>{if(!(k in DICT[l]))sw(`⚠ locales/${l}.json: falta «${k}» (se mostrará en español)`)});Object.keys(DICT[l]).forEach(k=>{if(!(k in DICT.es))sw(`⚠ locales/${l}.json: «${k}» no existe en es.json`)})});
const I18N_JS='window.FM_DICT='+JSON.stringify(DICT)+';window.FM_LM='+JSON.stringify(LM)+';\n'+fs.readFileSync('public/js/i18n.js','utf8');
V.i18n=require('crypto').createHash('md5').update(I18N_JS).digest('hex').slice(0,8);
const fmtT=(s,v)=>String(s).replace(/\{(\w+)\}/g,(_,k)=>v&&v[k]!=null?v[k]:'');
const T=(k,v)=>k in DICT.es?fmtT((DICT[CUR]&&DICT[CUR][k])??DICT.es[k],v):(console.warn('⚠ clave i18n sin definir: '+k),k);
const pj=v=>v?` data-p="${esc(JSON.stringify(v))}"`:'';
const I=(k,v)=>` data-i18n="${k}"${pj(v)}`;                                                    // atributo para un elemento que solo lleva texto
const S=(k,v,tag='span',cls='')=>`<${tag}${cls?` class="${cls}"`:''}${I(k,v)}>${esc(T(k,v))}</${tag}>`;
const SH=(k,v,tag='span',cls='')=>`<${tag}${cls?` class="${cls}"`:''} data-i18n-html="${k}"${pj(v)}>${T(k,v)}</${tag}>`;  // textos propios con <b>/<a>
const AM=(a,v)=>Object.entries(a).map(([n,k])=>`${n}="${esc(T(k,v))}"`).join(' ')+` data-i18n-attr="${Object.entries(a).map(([n,k])=>n+':'+k).join(';')}"${pj(v)}`;
// Textos libres de los editores (novedades, texto breve) traducidos por scripts/translate.js → content/traducciones.json
let TRC={};try{TRC=JSON.parse(fs.readFileSync('content/traducciones.json','utf8'))}catch{}
const trMissing=new Set();
// Devuelve el texto libre del editor en el idioma de la página (si aún no está traducido, el original en español)
const sha=x=>require('crypto').createHash('sha1').update(x,'utf8').digest('hex').slice(0,12);
const tx=t=>{if(CUR==='es')return t;const x=String(t||'').trim();if(!x)return t;const h=sha(x),e=TRC[h];
  if(e&&e[CUR])return e[CUR];trMissing.add(h);return t};
// Nombre del mod en cada idioma (v.19): usa las mismas traducciones (content/traducciones.json) y, si falta, el original.
const trTo=(t,l)=>{const x=String(t||'').trim(),e=l==='es'||!x?null:TRC[sha(x)];return e&&e[l]?e[l]:x};
const titles=m=>[...new Set([String(m.title||'').trim(),...LANGS.slice(1).map(l=>trTo(m.title,l))].filter(Boolean))];   // el nombre en todos los idiomas (para que el buscador lo encuentre en cualquiera)
const ctx={C,CATS,BADGE,LATEST:'',ad:null,T,tx},R=F.make(ctx);
const {catOf,badges,authText,vchips,compat,needsReload,installPaths,hist,report,trAttr,mt}=R;
// ========================================
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const D='content/mods',OUT=process.env.OUT_DIR||'dist';
// ===== AUTORES AUTOMÁTICOS =====
// Si un mod trae un autor escrito a mano (nombre + enlace) que no existe en content/autores/, se crea su ficha JSON.
// Compara sin distinguir mayúsculas ni acentos. Si el nombre ya existe pero con otro enlace NO crea un duplicado: avisa.
// Desactivar: SYNC_AUTHORS=0.  Solo sincronizar (sin generar la web): node build.js --authors-only
const syncAuthors=()=>{
  const AD='content/autores',key=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  const slugify=s=>key(s).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60);
  const known=new Map();// nombre normalizado -> {slug,url}
  const slugs=new Set();
  if(fs.existsSync(AD))for(const f of fs.readdirSync(AD).filter(f=>f.endsWith('.json'))){
    slugs.add(f.slice(0,-5));try{const a=JSON.parse(fs.readFileSync(p.join(AD,f),'utf8'));if(key(a.name))known.set(key(a.name),{slug:f.slice(0,-5),url:String(a.url||'').trim()})}catch(e){console.warn(`⚠ autores/${f}: JSON inválido (${e.message})`)}}
  const found=new Map();// autores manuales detectados en los mods
  if(fs.existsSync(D))for(const f of fs.readdirSync(D).filter(f=>f.endsWith('.json')).sort()){
    let m;try{m=JSON.parse(fs.readFileSync(p.join(D,f),'utf8'))}catch{continue}
    const list=[].concat(m.authors==null?[]:m.authors).map(a=>typeof a==='string'?{name:a}:a).filter(a=>a&&!a.ref); // con «ref» ya viene de la lista
    if(!list.length&&m.author)list.push({name:m.author,url:m.author_url}); // fichas antiguas
    for(const a of list){const name=String(a.name||'').trim(),url=String(a.url||'').trim(),k=key(name);if(!k)continue;
      const prev=found.get(k);
      if(!prev)found.set(k,{name,url,from:f});
      else if(!prev.url&&url)prev.url=url;
      else if(prev.url&&url&&key(prev.url)!==key(url))console.warn(`⚠ autor «${name}»: enlaces distintos en ${prev.from} y ${f}; se usa el primero (${prev.url})`)}}
  let n=0;
  for(const [k,a] of found){
    const ex=known.get(k);
    if(ex){if(a.url&&ex.url&&key(a.url)!==key(ex.url))console.warn(`⚠ autor «${a.name}» (${a.from}): ya existe en Autores con otro enlace (${ex.url} ≠ ${a.url}). No se crea un duplicado; corrígelo en la sección «Autores».`);continue}
    if(a.url&&!/^https?:\/\//i.test(a.url))console.warn(`⚠ autor «${a.name}»: el enlace «${a.url}» no empieza por https:// y no se mostrará como enlace`);
    let slug=slugify(a.name)||'autor-'+require('crypto').createHash('md5').update(k).digest('hex').slice(0,6),base=slug,i=2;
    while(slugs.has(slug))slug=base+'-'+i++;
    slugs.add(slug);known.set(k,{slug,url:a.url});
    fs.mkdirSync(AD,{recursive:true});
    fs.writeFileSync(p.join(AD,slug+'.json'),JSON.stringify(a.url?{name:a.name,url:a.url}:{name:a.name},null,2)+'\n');
    console.log(`+ autor nuevo: ${a.name} → ${AD}/${slug}.json`);n++}
  return n};
if(process.env.SYNC_AUTHORS!=='0'||process.argv.includes('--authors-only')){const n=syncAuthors();if(process.argv.includes('--authors-only')){console.log(n?`OK: ${n} autor(es) creados`:'OK: no hay autores nuevos');process.exit(0)}}
const AUTHORS={};readDir('content/autores').forEach(a=>{if(String(a.name||'').trim())AUTHORS[a.slug]={name:String(a.name).trim(),url:String(a.url||'').trim()}});
const mods=(fs.existsSync(D)?fs.readdirSync(D).filter(f=>f.endsWith('.json')):[]).map(f=>normalize(JSON.parse(fs.readFileSync(p.join(D,f),'utf8')),f.slice(0,-5),console.warn,AUTHORS)).filter(m=>{if(/borrador|revisi[oó]n/i.test(String(m.status||''))){console.log('· '+m.slug+': borrador, no se publica');return false}return true})
  .sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
// ===== VALIDACIÓN: una ficha rota no se publica en silencio =====
{const errs=[];
 for(const m of mods){const e=x=>errs.push(`✖ ${m.slug}: ${x}`),w=x=>console.warn(`⚠ ${m.slug}: ${x}`);
  if(!String(m.title||'').trim())e('falta el título');
  if(!/^https?:\/\/\S+$/i.test(String(m.download_url||'').trim()))e('el enlace de descarga falta o no empieza por http:// o https://');
  if(!String(m.description||'').trim())w('no tiene descripción');
  if(!m.cats.length)w('no tiene categoría');m.cats.filter(c=>!CATS[c]).forEach(c=>{w(`la categoría «${c}» no existe`);strictW.push(`${m.slug}: la categoría «${c}» no existe`)});
  if(!m.vers.length)w('no tiene versión de FM');
  if(!m.date)w('no tiene fecha de publicación');
  if(!m.cover)w('no tiene portada')}
 if(errs.length){errs.forEach(x=>console.error(x));
  if(process.env.VALIDATE!=='warn'){console.error(`\n${errs.length} error(es): la compilación se detiene para no publicar fichas rotas (VALIDATE=warn solo avisa).`);process.exit(1)}}}
const W=(f,t)=>{fs.mkdirSync(p.dirname(f),{recursive:true});fs.writeFileSync(f,t)};
const XI='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
const TI='<svg class="ic-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg><svg class="ic-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
const KI='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h14v4.5a5.5 5.5 0 0 1-5.5 5.5h-3A5.5 5.5 0 0 1 3 13.5V9z"/><path d="M17 10.5h1.2a2.3 2.3 0 0 1 0 4.6H16.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 2.5v3M10 2.5v3M13 2.5v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const GI='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9S14.6 18.3 12 21c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
const FL={
es:'<svg viewBox="0 0 30 20" preserveAspectRatio="none"><path fill="#c60b1e" d="M0 0h30v20H0z"/><path fill="#ffc400" d="M0 5h30v10H0z"/></svg>',
en:'<svg viewBox="0 0 60 30" preserveAspectRatio="none"><clipPath id="fmuj"><path d="M30 15h30v15zv15H0zH0V15zV0h30z"/></clipPath><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30M60 0L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30M60 0L0 30" clip-path="url(#fmuj)" stroke="#c8102e" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#c8102e" stroke-width="6"/></svg>',
ca:'<svg viewBox="0 0 9 9" preserveAspectRatio="none"><path fill="#fcdd09" d="M0 0h9v9H0z"/><path stroke="#da121a" stroke-width="1" d="M0 1h9M0 3h9M0 5h9M0 7h9"/></svg>',
fr:'<svg viewBox="0 0 3 2" preserveAspectRatio="none"><path fill="#ed2939" d="M0 0h3v2H0z"/><path fill="#fff" d="M0 0h2v2H0z"/><path fill="#002395" d="M0 0h1v2H0z"/></svg>',
it:'<svg viewBox="0 0 3 2" preserveAspectRatio="none"><path fill="#ce2b37" d="M0 0h3v2H0z"/><path fill="#fff" d="M0 0h2v2H0z"/><path fill="#009246" d="M0 0h1v2H0z"/></svg>',
pt:'<svg viewBox="0 0 20 14" preserveAspectRatio="none"><rect width="20" height="14" fill="#009c3b"/><path d="M10 1.3 18.4 7 10 12.7 1.6 7z" fill="#ffdf00"/><circle cx="10" cy="7" r="3.2" fill="#002776"/><path d="M6.9 6.2c2-.5 4.3-.2 6.2 1" stroke="#fff" stroke-width=".55" fill="none"/></svg>'};
const XU=`https://x.com/${C.x}`;
const ad=l=>C.adsense&&C.slots[l]?`<aside class="ad" aria-label="Publicidad"><ins class="adsbygoogle" style="display:block;width:100%" data-ad-client="${C.adsense}" data-ad-slot="${C.slots[l]}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({})</script></aside>`:'';
const donate=()=>`<div class="box donate">${S('donate_h2',null,'h2')}${S('donate_p',null,'p')}<a class="btn primary" href="${C.kofi}" target="_blank" rel="noopener"${I('kofi_label')}>${esc(T('kofi_label'))}</a></div>`;
const xcta=()=>`<div class="box xcta">${S('xcta_h2',null,'h2')}${S('xcta_p',{x:C.x},'p')}<a class="btn" href="${XU}" target="_blank" rel="noopener">${XI}${S('xcta_btn',{x:C.x})}</a></div>`;
const ALLV=[...new Set([...readDir('content/versiones').map(v=>v.name),...mods.flatMap(m=>m.vers)])].filter(v=>vk(v).toUpperCase()!=='FM25').sort((a,b)=>verYear(b)-verYear(a)||String(a).localeCompare(String(b)));
const LATEST=ALLV[0];ctx.LATEST=LATEST;ctx.ad=ad;
const VPAGES=ALLV.filter(v=>mods.some(m=>m.vers.includes(v))),vslug=v=>vk(v).toLowerCase();   // versiones con página propia (/version/fm27/)
const variant=(u,w)=>{const x=String(u||''),t=x.replace(/\.webp$/i,`-${w}.webp`);return /^\/img\/(covers|uploads)\//.test(x)&&t!==x&&fs.existsSync(p.join('public',t))?t:''};   // miniaturas -320/-640 que crea scripts/imagenes.js
const thumb=u=>variant(u,640)||String(u||'');
// Ancho real de un WebP leyendo su cabecera (VP8, VP8L o VP8X): permite poner el descriptor «Nw» correcto a la imagen original en el srcset
const webpW=file=>{try{const fd=fs.openSync(file,'r'),b=Buffer.alloc(32);fs.readSync(fd,b,0,32,0);fs.closeSync(fd);
  if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return 0;
  const k=b.toString('ascii',12,16);
  if(k==='VP8 ')return b.readUInt16LE(26)&0x3fff;
  if(k==='VP8L')return 1+(((b[22]&0x3f)<<8)|b[21]);
  if(k==='VP8X')return 1+(b[24]|(b[25]<<8)|(b[26]<<16));
  return 0}catch{return 0}};
// srcset con las miniaturas existentes (320, 640) y la imagen original con su ancho real; `sizes` dice cuánto ocupa en pantalla para que el navegador elija la justa
const srcset=(u,sizes,max=Infinity)=>{const x=String(u||''),L=[320,640].filter(w=>w<=max&&variant(x,w)).map(w=>`${esc(variant(x,w))} ${w}w`);
  if(!L.length)return '';
  const W=/^\/img\//.test(x)?webpW(p.join('public',x)):0;if(W>640&&W<=max)L.push(`${esc(x)} ${W}w`);
  return ` srcset="${L.join(', ')}" sizes="${sizes}"`};
const SZ_CARD='(max-width:600px) 46vw, 260px',SZ_REL='96px';   // tarjeta (≤240 px en la parrilla, 2 columnas en móvil) y miniatura de «Más como este»
const lmOf=m=>[m.upd[0]&&m.upd[0].date,m.modified,m.date].filter(Boolean).map(x=>String(x).slice(0,10)).sort().pop()||'';
const isPaid=m=>m.badges.some(b=>/pago|paid|premium/i.test(b));
const AUTH_OPTS=[...new Map(mods.flatMap(m=>m.auth.map(a=>[norm(a.name).trim(),a.name]))).entries()].filter(([k])=>k&&k!=='autor desconocido').sort((a,b)=>a[1].localeCompare(b[1],'es',{sensitivity:'base'}));
// Estadísticas públicas en el momento de compilar (solo para el JSON-LD con la valoración media). Sin red, o si el sitio aún no existe, se omite sin error.
let STATS={};
if(process.env.NO_STATS_FETCH!=='1'&&/^https?:/.test(C.url)){try{STATS=JSON.parse(require('child_process').execFileSync(process.execPath,['-e',"fetch(process.argv[1],{signal:AbortSignal.timeout(7000)}).then(r=>r.ok?r.text():'{}').then(t=>process.stdout.write(t)).catch(()=>process.stdout.write('{}'))",C.url+'/api/stats'],{timeout:9000,encoding:'utf8'}))||{}}catch{STATS={}}}
const dts=d=>d?new Date(d).toLocaleDateString(LM[CUR].loc,{day:'numeric',month:'short',year:'numeric'}):'';
// Extracto de ~140 caracteres: corta en la última palabra completa (nunca a media palabra) y quita la puntuación final antes del «…»
const exc=t=>{t=plain(t);if(t.length<=140)return t;let c=t.slice(0,139);const i=c.lastIndexOf(' ');if(i>90)c=c.slice(0,i);return c.replace(/[\s,;:.\-–—(«"]+$/,'')+'…'};
const card=(m,eager)=>`<a class="card" href="/mod/${m.slug}/" data-slug="${m.slug}" data-lm="${esc(lmOf(m))}" data-nw="${esc(String(m.date||'').slice(0,10))}" data-p="${isPaid(m)?1:0}" data-ss="${m.screenshots.length?1:0}" data-h="${esc((()=>{try{return new URL(m.download_url).hostname.replace(/^www\./,'')}catch{return ''}})())}" data-a="${esc(m.auth.map(a=>norm(a.name).trim()).join('|'))}" data-c="${esc(m.cats.join(' '))}" data-v="${esc(m.vers.map(vk).join(' '))}" data-t="${esc(norm([...titles(m),...m.auth.map(a=>a.name),...m.vers,...m.cats.map(c=>catOf(c).n),...m.cats.flatMap(c=>Object.values(catOf(c).t||{})),...m.tags,m.card_text||''].join(' ')))}"><div class="ph"><img src="${esc(thumb(m.cover)||'/img/placeholder.svg')}"${srcset(m.cover,SZ_CARD)} alt="${esc(mt(m))}" loading="${eager?'eager':'lazy'}" decoding="async" width="640" height="360">${m.vers.length?`<span class="ph-v" ${AM({'aria-label':'card_vers'})}>${vchips(m)}</span>`:''}<span class="ph-b">${badges(m)}</span></div><div class="cb"><h3>${esc(mt(m))}</h3><p class="by">${UI}<strong title="${esc(authText(m))}">${esc(authText(m))}</strong></p><p class="ex${m.card_text?' hook':''}">${esc(m.card_text?tx(String(m.card_text).trim()):exc(m.description))}</p><div class="cf"><span class="cat">${m.cats.map(c=>{const x=catOf(c);return `<span${trAttr(x)}>${esc(x.n)}</span>`}).join(', ')}</span>${m.upd[0]?`<time datetime="${esc(m.upd[0].date)}" data-d="short" data-pre="↻ " ${AM({title:'card_upd'})}>↻ ${dts(m.upd[0].date)}</time>`:m.date?`<time datetime="${esc(m.date)}" data-d="short">${dts(m.date)}</time>`:''}</div><p class="st" data-s="${m.slug}" hidden></p></div></a>`;

const absImg=i=>!i?C.url+'/img/og-image.jpg':/^https?:/i.test(i)?i:C.url+encodeURI(i);
const ogImg=m=>[m.cover,...m.screenshots].find(i=>i&&!/\.(avif|svg)(\?|$)/i.test(i));
// Política de seguridad de contenido de las páginas públicas (va en <meta>; el panel /admin no la lleva). Con AdSense activo se omite: necesita muchos dominios de Google.
const frameSrc=(()=>{try{return C.requestsEmbed?new URL(C.requestsEmbed).origin:"'none'"}catch{return "'none'"}})();
const CSP=C.adsense?'':`<meta http-equiv="Content-Security-Policy" content="${["default-src 'self'","script-src 'self' 'unsafe-inline'","style-src 'self' 'unsafe-inline'","img-src 'self' data: https:","font-src 'self'","connect-src 'self'","frame-src "+frameSrc,"object-src 'none'","base-uri 'self'","form-action 'self'","manifest-src 'self'","worker-src 'self'"].join('; ')}">`;
const pageRaw=({title,desc,path,body,img,ld,home,type,imgAlt,wide,alt=true})=>`<!doctype html><html lang="${LM[CUR].html}"><head><meta charset="utf-8">${CSP}<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0e1020"><link rel="manifest" href="/manifest.webmanifest"><meta name="generator" content="${esc(C.name)} ${esc(C.version)}">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${C.url}${BASE}${path}">${alt?LANGS.map(l=>`<link rel="alternate" hreflang="${LM[l].hl}" href="${C.url}${LM[l].slug?'/'+LM[l].slug:''}${path}">`).join('')+`<link rel="alternate" hreflang="x-default" href="${C.url}${path}">`:''}
<meta property="og:type" content="${type||'website'}"><meta property="og:site_name" content="${C.name}"><meta property="og:locale" content="${LM[CUR].og}"><meta property="og:url" content="${C.url}${BASE}${path}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${esc(absImg(img))}"><meta property="og:image:alt" content="${esc(imgAlt||title)}">${img?'':'<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@${C.x}"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(absImg(img))}">
<link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32.png"><link rel="apple-touch-icon" href="/img/apple-touch-icon.png"><link rel="stylesheet" href="/css/style.css?v=${V.css}"><link rel="alternate" type="application/rss+xml" title="${esc(C.name)} — Novedades" href="/rss.xml">
${ld?`<script type="application/ld+json">${JSON.stringify(ld)}</script>`:''}${C.adsense?`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${C.adsense}" crossorigin="anonymous"></script>`:''}
${CUR==='es'&&path==='/'?`<script>try{var l=localStorage.getItem('fm_lang'),m={en:'en',ca:'ca',fr:'fr',pt:'pt-br',it:'it'};if(l&&m[l])location.replace('/'+m[l]+'/'+location.search+location.hash)}catch(e){}</script>\n`:''}<script>try{if(localStorage.getItem('fm_feat')==='0')document.documentElement.setAttribute('data-feat','0')}catch(e){}</script>
<script>try{var t=localStorage.getItem('fm_theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
<script>if(/(invite|recovery|confirmation)_token/.test(location.hash))location.replace('/admin/'+location.hash)</script></head>
<body${home?' data-home':''}${wide?' data-wide':''}>
<a class="skip" href="#main"${I('skip')}>${esc(T('skip'))}</a>
<header class="hd"><div class="wrap hd-in"><a class="logo" href="/"><img src="/img/logo.png" width="40" height="40" alt="" style="border-radius:9px"><span>FM Mods <b>Comunidad</b></span></a>
<form class="search" action="/" role="search"><input id="q" name="q" type="search" ${AM({placeholder:'search_ph','aria-label':'search_aria'})} autocomplete="off" role="combobox" aria-expanded="false" aria-controls="sg" aria-autocomplete="list"><div class="sg" id="sg" role="listbox" ${AM({'aria-label':'sg_aria'})} hidden></div></form>
<div class="lang" id="lang"><button class="x lbtn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="lang-menu" ${AM({'aria-label':'lang_label',title:'lang_label'})}><span class="lflag" aria-hidden="true">${FL[CUR]}</span><span class="lcode">${LM[CUR].code}</span></button><ul class="lmenu" id="lang-menu" hidden>${LANGS.map(l=>{const pre=LM[l].slug?'/'+LM[l].slug:'';return `<li><a href="${l==='es'?path:alt?pre+path:pre+'/'}" lang="${LM[l].html}" hreflang="${LM[l].hl}" data-lang="${l}"${l===CUR?' class="on" aria-current="true"':''}><span class="fl" aria-hidden="true">${FL[l]}</span><span>${LM[l].name}</span></a></li>`}).join('')}</ul></div>\
<button class="x tbtn" id="theme" type="button" aria-label="${esc(T('theme_to_light'))}" title="${esc(T('theme_to_light'))}">${TI}</button>\
<a class="x kofi" href="${esc(C.kofi)}" target="_blank" rel="noopener" ${AM({'aria-label':'kofi_label',title:'kofi_label'})}>${KI}<span class="kt"${I('kofi_label')}>${esc(T('kofi_label'))}</span></a>\
<a class="x" href="${XU}" target="_blank" rel="noopener" aria-label="X: @${C.x}">${XI}</a></div>
<nav class="wrap nav" ${AM({'aria-label':'cats_aria'})}>${Object.entries(CATS).map(([k,v])=>`<a href="/?cat=${k}" data-cat="${k}" title="${v.d}"${trAttr(v)}>${v.n}</a>`).join('')}<span class="navsep" aria-hidden="true"></span><a class="nl" href="/como-instalar/"${I('nav_install')}>${esc(T('nav_install'))}</a><a class="nl" href="/envia-tu-mod/"${I('nav_submit')}>${esc(T('nav_submit'))}</a><a class="nl" href="/peticiones/"${I('nav_requests')}>${esc(T('nav_requests'))}</a><a class="nl" href="/novedades/"${I('nav_news')}>${esc(T('nav_news'))}</a></nav></header>
<main id="main" tabindex="-1">${body}</main>
<footer class="ft"><div class="wrap"><nav><a href="/como-instalar/"${I('nav_install')}>${esc(T('nav_install'))}</a><a href="/envia-tu-mod/"${I('nav_submit')}>${esc(T('nav_submit'))}</a><a href="/peticiones/"${I('nav_requests')}>${esc(T('nav_requests'))}</a><a href="/novedades/"${I('nav_news')}>${esc(T('nav_news'))}</a><a href="/rss.xml"${I('ft_rss')}>RSS</a><a href="/aviso-legal/"${I('ft_legal')}>${esc(T('ft_legal'))}</a><a href="/privacidad/"${I('ft_privacy')}>${esc(T('ft_privacy'))}</a><a href="/envia-tu-mod/"${I('ft_collab')}>${esc(T('ft_collab'))}</a><a href="${XU}" target="_blank" rel="noopener"${I('ft_x',{x:C.x})}>${esc(T('ft_x',{x:C.x}))}</a></nav>
<p class="ft-v">${S('browse_ver')}: ${VPAGES.map(v=>`<a href="/version/${vslug(v)}/">${esc(v)}</a>`).join(' · ')}</p>${S('ft_disclaimer',{name:C.name},'p')}<p class="ver">${esc(C.name)} · ${esc(C.version)}</p></div></footer>
<script src="/js/i18n.js?v=${V.i18n}" defer></script><script src="/js/app.js?v=${V.app}" defer></script></body></html>`;

// Enlaces internos de cada idioma: /mod/x/ → /en/mod/x/ (los legales, RSS y recursos no cambian; el selector de idioma tampoco)
const LINK_OK=/^\/(?:$|\?|mod\/|autor\/|como-instalar\/|envia-tu-mod\/|peticiones\/|novedades\/|categoria\/|version\/)/,SITE={pages:[]};
const fin=h=>{
  if(BASE)h=h.replace(/<(?:a|form)\b[^>]*>/g,tag=>/ data-lang=/.test(tag)?tag:tag.replace(/\b(href|action)="(\/[^"]*)"/,(m,a,u)=>LINK_OK.test(u)?`${a}="${BASE}${u}"`:m));
  return h.replace(/<[a-z][^>]*\sdata-i18n[^>]*>/g,tag=>/ data-copy=|id="feat-toggle"/.test(tag)?tag:tag.replace(/\sdata-(?:i18n|i18n-html|i18n-attr|p)="[^"]*"/g,''))};
const page=o=>{if(CUR==='es')SITE.pages.push({path:o.path,alt:o.alt!==false});return fin(pageRaw(o))};
const ups=mods.flatMap(m=>[...m.upd.map(u=>({m,date:u.date,ver:u.version,note:u.note,type:'update'})),...(m.date?[{m,date:m.date,type:'new'}]:[])]).filter(x=>x.date).sort((a,b)=>new Date(b.date)-new Date(a.date));
const renderSite=L=>{
CUR=L;BASE=LM[L].slug?'/'+LM[L].slug:'';F.setLocale(LM[L].loc);const OL=OUT+BASE;
for(const c of Object.values(CATS))c.n=(c.t&&c.t[L])||c.n0;
// NOVEDADES (v.19): nuevos mods + actualizaciones registradas en cada ficha. Cada novedad es una tarjeta con portada, tipo (Nuevo / Actualizado + versión),
// fecha destacada, autor, versiones de FM y la nota (recortada con «Leer más»). La página /novedades/ añade filtros (tipo, periodo, versión) y salto por meses (app.js).
const nvItem=(u,compact)=>{const m=u.m,isNew=u.type==='new',d=String(u.date).slice(0,10),img=variant(m.cover,320)||thumb(m.cover)||'/img/placeholder.svg';
  return `<li class="nv ${isNew?'nv-new':'nv-upd'}${compact?' nv-c':''}" data-nt="${isNew?'new':'update'}" data-dt="${esc(d)}" data-v="${esc(m.vers.map(vk).join(' '))}"><a class="nv-img" href="/mod/${m.slug}/" tabindex="-1" aria-hidden="true"><img src="${esc(img)}"${srcset(m.cover,'112px',640)} alt="" loading="lazy" decoding="async" width="160" height="90"></a><div class="nv-b"><div class="nv-top"><span class="b ${isNew?'b-verde':'b-violeta'}">${S(isNew?'b_new':'b_upd')}${u.ver?' '+esc(u.ver):''}</span><time class="ud${isNew?' ud-new':''}" datetime="${esc(d)}" data-d="short">${dts(d)}</time><span class="nv-ago" data-ago="${esc(d)}"></span></div><h3><a href="/mod/${m.slug}/">${esc(mt(m))}</a></h3><p class="by">${UI}<strong>${esc(authText(m))}</strong><span class="vc">${vchips(m)}</span></p>${u.note?`<div class="rt nv-note">${rich(tx(u.note))}</div>${compact?'':`<button class="nv-more" type="button" aria-expanded="false" hidden>${esc(T('nv_more'))}</button>`}`:''}</div></li>`};
// HOME
const feat=mods.filter(m=>m.badges.some(b=>FEAT.includes(b)));
W(`${OL}/index.html`,page({home:1,path:'/',title:T('seo_home_t',{name:C.name}),
 desc:T('seo_home_d'),
 ld:{'@context':'https://schema.org','@type':'WebSite',name:C.name,url:C.url,potentialAction:{'@type':'SearchAction',target:`${C.url}/?q={q}`,'query-input':'required name=q'}},
 body:`<div class="hero-w"><section class="wrap hero">${S('hero_h1',null,'h1')}${S('hero_p',null,'p')}</section></div>
<section class="wrap"><div class="box howto">${S('howto_h2',null,'h2')}<ol class="steps4">${[1,2,3,4].map(n=>SH('howto_'+n,null,'li')).join('')}</ol><a class="btn" href="/como-instalar/"${I('howto_btn')}>${esc(T('howto_btn'))}</a></div></section>
${feat.length?`<section class="wrap feat" id="feat"><div class="feat-h">${S('feat_h2',null,'h2')}<button class="btn small feat-tg" id="feat-toggle" type="button" aria-expanded="true" aria-controls="feat-body"${I('feat_hide')}>${esc(T('feat_hide'))}</button></div><div class="grid feat-grid" id="feat-body">${feat.map((m,i)=>card(m,i<4)).join('')}</div></section>`:''}
<section class="wrap" id="ultimos">${S('latest_h2',null,'h2')}<div class="tools"><div class="chips"><button class="on" data-cat=""${I('f_all')}>${esc(T('f_all'))}</button>${Object.entries(CATS).map(([k,v])=>`<button data-cat="${k}"${trAttr(v)}>${v.n}</button>`).join('')}</div><div class="selects"><label class="vsel">${S('f_ver')}<select id="ver"><option value=""${I('f_ver_all')}>${esc(T('f_ver_all'))}</option>${ALLV.map(v=>`<option value="${esc(vk(v))}">${esc(v)}</option>`).join('')}</select></label><label class="vsel">${S('f_sort')}<select id="sort"><option value=""${I('sort_recent')}>${esc(T('sort_recent'))}</option><option value="valorados"${I('sort_rated')}>${esc(T('sort_rated'))}</option><option value="descargados"${I('sort_dl')}>${esc(T('sort_dl'))}</option><option value="actualizados"${I('sort_updated')}>${esc(T('sort_updated'))}</option><option value="gustados"${I('sort_liked')}>${esc(T('sort_liked'))}</option></select></label><label class="vsel">${S('f_author')}<select id="aut"><option value="">${esc(T('f_author_all'))}</option>${AUTH_OPTS.map(([k,n])=>`<option value="${esc(k)}">${esc(n)}</option>`).join('')}</select></label><label class="vsel">${S('f_price')}<select id="price"><option value="">${esc(T('f_price_all'))}</option><option value="free">${esc(T('f_price_free'))}</option><option value="paid">${esc(T('f_price_paid'))}</option></select></label><label class="vsel">${S('f_show')}<select id="show"><option value="">${esc(T('f_show_all'))}</option><option value="favs">${esc(T('f_show_favs'))}</option><option value="recent">${esc(T('f_show_recent'))}</option><option value="shots">${esc(T('f_show_shots'))}</option></select></label></div></div>
<p class="meta resline"><span id="count"></span> <button class="btn small" id="reset" type="button"${I('f_reset')} hidden>${esc(T('f_reset'))}</button><span class="grow"></span><button class="btn small" id="view" type="button" aria-pressed="false">${esc(T('view_list'))}</button></p>
<div class="favbar" id="favbar" hidden><span class="meta">${esc(T('fav_note'))}</span><button class="btn small" id="fav-exp" type="button">${esc(T('fav_export'))}</button><button class="btn small" id="fav-imp" type="button">${esc(T('fav_import'))}</button><input id="fav-file" type="file" accept="application/json,.json" hidden></div>
<div class="grid" id="grid">${mods.map(m=>card(m)).join('')}</div><div class="more-w" id="more-w" hidden><button class="btn" id="more" type="button">${esc(T('more',{n:''}).trim())}</button><span class="meta" id="more-n" aria-live="polite"></span></div><div id="empty" class="empty-st" role="status" hidden><svg class="empty-ic" viewBox="0 0 120 120" aria-hidden="true"><rect x="14" y="26" width="92" height="62" rx="8" fill="none" stroke="currentColor" stroke-width="3" opacity=".45"/><path d="M60 26v62" stroke="currentColor" stroke-width="3" opacity=".45"/><circle cx="60" cy="57" r="11" fill="none" stroke="currentColor" stroke-width="3" opacity=".45"/><circle cx="80" cy="72" r="22" fill="var(--bg)" stroke="var(--ac)" stroke-width="5"/><path d="M96 88l14 14" stroke="var(--ac)" stroke-width="7" stroke-linecap="round"/><path d="M73 66c0-5 14-5 14 1 0 4-7 4-7 9M80 82v1" fill="none" stroke="var(--ac)" stroke-width="4" stroke-linecap="round"/></svg>${S('empty_h3',null,'h3')}<p id="empty-msg">${esc(T('empty_p'))}</p><ul class="empty-tips">${S('empty_tip1',null,'li')}${S('empty_tip2',null,'li')}</ul><div class="empty-act"><button class="btn primary" id="empty-reset" type="button"${I('f_reset')}>${esc(T('f_reset'))}</button><a class="btn" href="/peticiones/"${I('empty_req')}>${esc(T('empty_req'))}</a></div></div></section>
${ups.length?`<section class="wrap">${S('news_h2',null,'h2')}<ul class="nvl nv-home">${ups.slice(0,6).map(u=>nvItem(u,1)).join('')}</ul><p class="nv-allw"><a class="btn" href="/novedades/"${I('news_all')}>${esc(T('news_all'))}</a></p></section>`:''}
<section class="wrap two">${donate()}${xcta()}</section>`}));

// Cajas laterales de la ficha: «¿te funciona?», compartir y relacionados
const qe=encodeURIComponent;
const worksBox=m=>m.vers.length?`<div class="box works" data-works="${m.slug}">${S('works_h',null,'h2')}${m.vers.map(v=>`<div class="wk" data-ver="${esc(vk(v).toUpperCase())}"><span class="vchip">${esc(v)}</span><span class="wk-s meta" data-wsum>${esc(T('works_none'))}</span><span class="wk-b"><button class="btn small" type="button" data-w="ok" aria-pressed="false">👍 ${S('works_yes')}</button><button class="btn small" type="button" data-w="ko" aria-pressed="false">👎 ${S('works_no')}</button></span></div>`).join('')}<p class="meta wk-thx" role="status" hidden>${S('works_thanks')}</p><p class="meta" data-stats-off hidden>${esc(T('stats_off'))}</p></div>`:'';
const shareBox=m=>{const u=C.url+BASE+'/mod/'+m.slug+'/',t=T('share_text',{t:mt(m)});
  return `<div class="box share">${S('share_h',null,'h2')}<div class="share-b"><button class="btn small" type="button" data-i18n="share_copy" data-copy="${esc(u)}">${esc(T('share_copy'))}</button><a class="btn small" href="https://x.com/intent/post?text=${qe(t)}&url=${qe(u)}" target="_blank" rel="noopener">${XI}${S('share_x')}</a><a class="btn small" href="https://wa.me/?text=${qe(t+' '+u)}" target="_blank" rel="noopener">WhatsApp</a></div></div>`};
const relatedBox=m=>{const sc=x=>x.cats.filter(c=>m.cats.includes(c)).length*2+x.auth.filter(a=>m.auth.some(b=>norm(a.name)===norm(b.name))).length*3+x.vers.filter(v=>m.vers.includes(v)).length;
  const L=mods.filter(x=>x!==m).map(x=>({x,s:sc(x)})).filter(o=>o.s>0).sort((a,b)=>b.s-a.s||new Date(b.x.date||0)-new Date(a.x.date||0)).slice(0,4).map(o=>o.x);
  // v.19: exactamente la misma tarjeta (card) y la misma parrilla (.feat-grid) que «Mods imprescindibles» de la portada
  return L.length?`<section class="rel-sec">${S('related_h',null,'h2')}<div class="grid feat-grid">${L.map(x=>card(x)).join('')}</div></section>`:''};

// FICHAS
for(const m of mods){
 if(m.cover&&/\.avif(\?|$)/i.test(m.cover))console.warn(`⚠ ${m.slug}: la portada es AVIF y X/WhatsApp no la muestran; para la vista previa se usa otra imagen. Súbela en JPG, PNG o WebP.`);
 const cn=m.cats.map(catOf),url=`/mod/${m.slug}/`;
 W(`${OL}${url}index.html`,page({path:url,img:ogImg(m),type:'article',imgAlt:T('seo_cover',{t:mt(m)}),title:`${mt(m)} (${m.vers.join(', ')}) — ${cn.map(x=>x.n).join(', ')} | ${C.name}`,
  desc:plain(m.description).slice(0,155),
  ld:[{'@context':'https://schema.org','@type':'CreativeWork',name:mt(m),description:plain(m.description).slice(0,300),author:m.auth.map(a=>({'@type':'Person',name:a.name,url:/^https?:/i.test(a.url||'')?a.url:undefined})),datePublished:m.date,dateModified:(m.upd[0]&&m.upd[0].date)||m.date,image:m.cover?absImg(m.cover):undefined,genre:cn.map(x=>x.n),url:C.url+BASE+url,...(()=>{const st=STATS[m.slug];return st&&st.ratingCount>=3?{aggregateRating:{'@type':'AggregateRating',ratingValue:+(st.ratingSum/st.ratingCount).toFixed(1),ratingCount:st.ratingCount,bestRating:5,worstRating:0.5}}:{}})()},
   {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:T('crumb_home'),item:C.url+BASE+'/'},...(m.cats[0]?[{'@type':'ListItem',position:2,name:cn[0].n,item:C.url+BASE+'/categoria/'+m.cats[0]+'/'}]:[]),{'@type':'ListItem',position:m.cats[0]?3:2,name:mt(m)}]}],
  body:R.detail(m,{extras:worksBox(m)+shareBox(m)+donate()+xcta(),below:relatedBox(m)})}));
}

// AUTORES: una página por autor de la colección «Autores» que tenga mods publicados (/autor/<slug>/)
const nk=s=>norm(String(s||'').trim());
const authPages=Object.entries(AUTHORS).map(([slug,a])=>({slug,a,ms:mods.filter(m=>m.auth.some(x=>nk(x.name)===nk(a.name)))})).filter(x=>x.ms.length);
SITE.authPages=authPages;
for(const {slug,a,ms} of authPages){
 const url=`/autor/${slug}/`,ext=/^https?:/i.test(a.url||'');
 W(`${OL}${url}index.html`,page({path:url,title:T('seo_auth_t',{a:a.name,name:C.name}),
  desc:T(ms.length===1?'seo_auth_d_one':'seo_auth_d_other',{n:ms.length,a:a.name,l:ms.slice(0,3).map(mt).join(', ')}).slice(0,155),
  ld:{'@context':'https://schema.org','@type':'Person',name:a.name,url:ext?a.url:undefined,sameAs:ext?[a.url]:undefined},
  wide:1,body:`<div class="wrap">${S('auth_h1',{n:a.name},'h1')}<p class="meta">${S(ms.length===1?'count_one':'count_other',{n:ms.length})}${ext?` · <a href="${esc(a.url)}" target="_blank" rel="noopener nofollow"${I('auth_profile')}>${esc(T('auth_profile'))}</a>`:''}</p><div class="grid">${ms.map(m=>card(m)).join('')}</div></div>`}));
}

// CATEGORÍAS y VERSIONES: páginas propias e indexables (/categoria/skins/, /version/fm27/)
const browse=(cur)=>`<div class="browse"><p class="meta">${S('browse_cat')}</p><div class="chips">${Object.entries(CATS).filter(([k])=>mods.some(m=>m.cats.includes(k))).map(([k,v])=>`<a class="${cur==='c:'+k?'on':''}" href="/categoria/${k}/">${esc(v.n)}</a>`).join('')}</div><p class="meta">${S('browse_ver')}</p><div class="chips">${VPAGES.map(v=>`<a class="${cur==='v:'+vslug(v)?'on':''}" href="/version/${vslug(v)}/">${esc(v)}</a>`).join('')}<a href="/">${esc(T('browse_all'))}</a></div></div>`;
const listPage=({url,title,desc,h1,lead,ms,cur,name})=>W(`${OL}${url}index.html`,page({path:url,title,desc:desc.slice(0,155),wide:1,
  ld:[{'@context':'https://schema.org','@type':'CollectionPage',name:h1,url:C.url+BASE+url,numberOfItems:ms.length},{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:T('crumb_home'),item:C.url+BASE+'/'},{'@type':'ListItem',position:2,name:h1}]}],
  body:`<div class="wrap"><p class="crumb"><a href="/"${I('crumb_home')}>${esc(T('crumb_home'))}</a> / ${esc(h1)}</p><h1>${esc(h1)}</h1>${lead?`<p class="lead">${esc(lead)}</p>`:''}<p class="meta">${S(ms.length===1?'count_one':'count_other',{n:ms.length})}</p><div class="grid">${ms.map(m=>card(m)).join('')}</div>${browse(cur)}</div>`}));
for(const [slug,c] of Object.entries(CATS)){const ms=mods.filter(m=>m.cats.includes(slug));if(!ms.length)continue;
  listPage({url:`/categoria/${slug}/`,cur:'c:'+slug,ms,h1:c.n,lead:c.d,title:T('seo_cat_t',{c:c.n,name:C.name}),desc:T('seo_cat_d',{c:c.n,l:ms.slice(0,4).map(mt).join(', ')})})}
for(const v of VPAGES){const ms=mods.filter(m=>m.vers.includes(v));
  listPage({url:`/version/${vslug(v)}/`,cur:'v:'+vslug(v),ms,h1:T('ver_h1',{v}),title:T('seo_ver_t',{v,name:C.name}),desc:T('seo_ver_d',{v,l:ms.slice(0,4).map(mt).join(', ')})})}

// ===== PÁGINAS DE COMUNIDAD =====
const XU2=`https://x.com/${C.x}`;
const ctaK=(hk,pk,href,bk,{ext=1,pp=null}={})=>`<div class="cta">${S(hk,null,'h2')}${S(pk,pp,'p')}<a class="btn primary" href="${href}"${ext?' target="_blank" rel="noopener"':''}${I(bk)}>${esc(T(bk))}</a></div>`;
const nl=(p,n)=>Array.from({length:n},(_,k)=>p+(k+1));
W(`${OL}/envia-tu-mod/index.html`,page({path:'/envia-tu-mod/',title:T('seo_sub_t',{name:C.name}),
 desc:T('seo_sub_d'),
 body:`<div class="wrap prose">${S('sub_h1',null,'h1')}
${S('sub_lead',{name:C.name},'p','lead')}
${ctaK('sub_cta_h','sub_cta_p',C.submit,'sub_cta_btn')}
${S('sub_seek_h',null,'h2')}
<div class="cards3">${[1,2,3,4].map(n=>`<div class="box">${S('sub_c'+n+'_h',null,'h3')}${S('sub_c'+n+'_p',null,'p')}</div>`).join('')}</div>
${S('sub_req_h',null,'h2')}
<ul class="checks">${nl('sub_r',7).map(k=>S(k,null,'li')).join('')}</ul>
${S('sub_no_h',null,'h2')}
<ul class="checks no">${nl('sub_n',3).map(k=>S(k,null,'li')).join('')}</ul>
${S('sub_how_h',null,'h2')}
<ol class="steps4">${nl('sub_s',4).map(k=>SH(k,null,'li')).join('')}</ol>
${S('sub_fix_h',null,'h2')}${SH('sub_fix_p',{email:C.email,xurl:XU2},'p')}
${SH('sub_end',null,'p')}</div>`}));

const REQ=readDir('content/peticiones').sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
const ST={abierta:['st_open','b-azul'],desarrollo:['st_dev','b-amarillo'],completada:['st_done','b-verde']};
const reqItem=r=>{const st=ST[r.status]||ST.abierta,mod=r.mod&&mods.find(m=>m.slug===r.mod);
  return `<div class="req"><div><span class="b ${st[1]}">${S(st[0])}</span></div><div><h3>${esc(r.title)}</h3>${r.description?`<p>${esc(r.description)}</p>`:''}${mod?`<p><a href="/mod/${mod.slug}/"${I('req_see',{t:mt(mod)})}>${esc(T('req_see',{t:mt(mod)}))}</a></p>`:''}</div></div>`};
const reqOpen=REQ.filter(r=>r.status!=='completada'),reqDone=REQ.filter(r=>r.status==='completada');
const reqUrl=C.requests||XU2;
W(`${OL}/peticiones/index.html`,page({path:'/peticiones/',title:T('seo_req_t',{name:C.name}),
 desc:T('seo_req_d'),
 body:`<div class="wrap prose">${S('req_h1',null,'h1')}
${S('req_lead',null,'p','lead')}
${ctaK('req_cta_h',C.requests?'req_cta_p_form':'req_cta_p_x',reqUrl,C.requests?'req_cta_btn_form':'req_cta_btn_x',{pp:{x:C.x}})}
${C.requestsEmbed?`<iframe class="embed" src="${esc(C.requestsEmbed)}" ${AM({title:'req_form_title'})} loading="lazy">…</iframe>`:''}
${S('req_ex_h',null,'h2')}
<div class="cards3">${[1,2,3,4].map(n=>`<div class="box">${S('req_e'+n+'_h',null,'h3')}${S('req_e'+n+'_p',null,'p')}</div>`).join('')}</div>
${S('req_how_h',null,'h2')}
<ul class="checks">${[1,2,3].map(n=>S('req_t'+n,null,'li')).join('')}${SH('req_t4',null,'li')}</ul>
${SH('req_note',null,'p')}
${reqOpen.length?`${S('req_open_h',null,'h2')}${reqOpen.map(reqItem).join('')}`:''}
${reqDone.length?`${S('req_done_h',null,'h2')}${reqDone.map(reqItem).join('')}`:''}</div>`}));

// ===== NOVEDADES (v.19) =====
const mkey=d=>String(d).slice(0,7),mlbl=k=>{const [y,mo]=k.split('-').map(Number);return new Date(Date.UTC(y,mo-1,1)).toLocaleDateString(LM[CUR].loc,{month:'long',year:'numeric',timeZone:'UTC'})};
const nNew=ups.filter(u=>u.type==='new').length,nUpd=ups.length-nNew,nVers=ALLV.filter(v=>ups.some(u=>u.m.vers.includes(v)));
const nMonths=[...new Set(ups.map(u=>mkey(u.date)))].map(k=>({k,l:ups.filter(u=>mkey(u.date)===k)}));
const nvTools=`<div class="nv-tools"><div class="nv-seg" role="group" ${AM({'aria-label':'nv_filter_aria'})}><button type="button" class="on" data-nt="" aria-pressed="true">${S('nv_f_all')} <i>${ups.length}</i></button><button type="button" data-nt="new" aria-pressed="false">${S('nv_f_new')} <i>${nNew}</i></button><button type="button" data-nt="update" aria-pressed="false">${S('nv_f_upd')} <i>${nUpd}</i></button></div><div class="selects"><label class="vsel">${S('nv_per')}<select id="nv-per"><option value=""${I('nv_per_all')}>${esc(T('nv_per_all'))}</option><option value="7">${esc(T('nv_per_7'))}</option><option value="30">${esc(T('nv_per_30'))}</option></select></label><label class="vsel">${S('f_ver')}<select id="nv-ver"><option value=""${I('f_ver_all')}>${esc(T('f_ver_all'))}</option>${nVers.map(v=>`<option value="${esc(vk(v))}">${esc(v)}</option>`).join('')}</select></label></div></div>
<p class="meta resline"><span id="nv-count" aria-live="polite">${esc(T(ups.length===1?'nv_count_one':'nv_count_other',{n:ups.length}))}</span> <button class="btn small" id="nv-reset" type="button"${I('f_reset')} hidden>${esc(T('f_reset'))}</button></p>`;
W(`${OL}/novedades/index.html`,page({path:'/novedades/',title:T('seo_news_t',{name:C.name}),
 desc:T('seo_news_d',{name:C.name}),
 body:`<div class="wrap nv-page">${S('news_h1',null,'h1')}
${S('news_lead',null,'p','lead')}
<p class="nv-sum" id="nv-sum" role="status" hidden></p>
${ups.length?`${nvTools}
<nav class="nv-jump" ${AM({'aria-label':'nv_jump_aria'})}><span class="meta"${I('nv_jump')}>${esc(T('nv_jump'))}</span>${nMonths.map(g=>`<a href="#m-${g.k}">${esc(mlbl(g.k))} <i>${g.l.length}</i></a>`).join('')}</nav>
<div id="nv-list">${nMonths.map(g=>`<section class="nv-m" id="m-${g.k}"><h2 class="month">${esc(mlbl(g.k))}</h2><ul class="nvl">${g.l.map(u=>nvItem(u)).join('')}</ul></section>`).join('')}</div>
<div id="nv-empty" class="nv-empty" role="status" hidden><p>${esc(T('nv_none'))}</p></div>`:`<p>${esc(T('news_none'))}</p>`}
${SH('news_foot',null,'p','meta')}</div>`}));

// LEGALES (plantillas: revísalas y completa tus datos)
const legal=(s,t,h)=>CUR==='es'&&W(`${OL}/${s}/index.html`,page({alt:false,path:`/${s}/`,title:`${t} | ${C.name}`,desc:t,body:`<div class="wrap prose"><h1>${t}</h1>${h}</div>`}));
legal('aviso-legal','Aviso Legal',`<p>Titular: Ferran — Contacto: ${C.email}.</p><p>${C.name} es un directorio no oficial de mods para Football Manager. No está afiliado a SEGA ni a Sports Interactive; todas las marcas pertenecen a sus propietarios. No alojamos archivos: enlazamos a servicios externos y no somos responsables de su contenido. Si eres autor y quieres retirar o corregir una ficha, escríbenos.</p>`);
legal('privacidad','Política de Privacidad',`<p><b>Responsable:</b> Ferran — ${C.email}.</p><p>Esta web no tiene registro de usuarios ni formularios propios y no recoge datos que te identifiquen directamente. Los enlaces de «Reportar enlace caído» abren tu cliente de correo.</p><p>La web instala un <i>service worker</i> que guarda en tu navegador copias de las páginas y recursos ya visitados para abrir más rápido y funcionar sin conexión; puedes borrarlas desde los ajustes del navegador.</p>
<h2>Datos que se guardan en tu navegador</h2><p>Guardamos en el almacenamiento local de tu navegador (localStorage) las preferencias que eliges y lo que has votado: tema claro/oscuro (<code>fm_theme</code>), idioma (<code>fm_lang</code>) y tus «me gusta», valoraciones, votos de «¿te funciona?» y descargas ya contadas (<code>fm_likes</code>, <code>fm_rate</code>, <code>fm_rate_sync</code>, <code>fm_works</code>, <code>fm_dl</code>), tus favoritos (<code>fm_favs</code>) y la vista y el orden que prefieres (<code>fm_view</code>, <code>fm_sort</code>). No se usan para publicidad ni para seguirte, y puedes borrarlas cuando quieras desde los ajustes del navegador.</p>
<h2>Valoraciones, «me gusta» y descargas</h2><p>Para que cada persona cuente una sola vez y evitar abusos, cuando valoras, das «me gusta» o pulsas «Descargar mod» nuestro servidor guarda un identificador anónimo calculado a partir de tu dirección IP con un hash con clave (no guardamos tu IP en claro), junto con la ficha y el voto. Solo se usa para contar votos y limitar abusos.</p>
<h2>Alojamiento</h2><p>La web se aloja en Netlify, que como cualquier servidor puede registrar tu dirección IP en sus registros técnicos. Más información en la <a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener">política de privacidad de Netlify</a>.</p>
${C.adsense?`<h2>Publicidad</h2><p>Mostramos publicidad de Google AdSense. Google y sus socios publicitarios pueden usar cookies e identificadores para mostrar y medir anuncios. Si visitas la web desde el Espacio Económico Europeo, el Reino Unido o Suiza, te mostramos un mensaje de consentimiento (Google CMP) y solo usamos esas cookies si lo aceptas; puedes cambiar tu decisión cuando quieras. Más información en <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">cómo usa Google los datos de los sitios que usan sus servicios</a>.</p>`:''}
<h2>Enlaces a terceros</h2><p>Los enlaces a Ko-fi, X y a las descargas externas (MediaFire, MEGA, Drive…) se rigen por las políticas de cada servicio.</p>
<h2>Tus derechos</h2><p>Puedes ejercer tus derechos de acceso, rectificación y supresión escribiendo a <a href="mailto:${C.email}">${C.email}</a>.</p>`);


const rows=Object.values(CATS).map(c=>`<tr><td${trAttr(c)}>${esc(c.n)}</td><td>${esc(c.d)}</td><td>${c.dir?`<code>${esc(c.dir)}</code>`:'—'}</td></tr>`).join('');
W(`${OL}/como-instalar/index.html`,page({path:'/como-instalar/',title:T('seo_inst_t',{name:C.name}),desc:T('seo_inst_d'),
 body:`<div class="wrap prose">${S('inst_h1',null,'h1')}
${S('inst_intro',null,'p')}
${S('inst_before_h',null,'h2')}<ul>${nl('inst_b',5).map(k=>k==='inst_b4'?SH(k,null,'li'):S(k,null,'li')).join('')}</ul>
<div class="compat warn">${SH('inst_bep',null,'p')}</div>
${S('inst_steps_h',null,'h2')}<ol class="steps">${nl('inst_p',5).map(k=>SH(k,null,'li')).join('')}</ol>
${S('inst_where_h',null,'h2')}<div class="tbl"><table><thead><tr>${S('inst_th1',null,'th')}${S('inst_th2',null,'th')}${S('inst_th3',null,'th')}</tr></thead><tbody>${rows}</tbody></table></div>
${SH('inst_where_p',null,'p')}
${S('inst_paths_h',null,'h2')}<ul>${['inst_win','inst_mac','inst_lin'].map(k=>SH(k,null,'li')).join('')}</ul>${S('inst_year',null,'p')}
${S('inst_reload_h',null,'h2')}<ul>${nl('inst_l',3).map(k=>S(k,null,'li')).join('')}</ul>
${S('inst_prob_h',null,'h2')}<ul>${nl('inst_q',4).map(k=>SH(k,null,'li')).join('')}</ul>
<p><a class="btn primary" href="/"${I('inst_back')}>${esc(T('inst_back'))}</a></p></div>`}));

};
for(const L of LANGS)renderSite(L);
CUR='es';BASE='';F.setLocale('es-ES');for(const c of Object.values(CATS))c.n=c.n0;
// SEO + estáticos
W(`${OUT}/sitemap.xml`,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${SITE.pages.map(({path:u,alt})=>{
  const m=mods.find(x=>u==='/mod/'+x.slug+'/'),ap=SITE.authPages.find(x=>u==='/autor/'+x.slug+'/'),lm=x=>(x.upd[0]&&x.upd[0].date)||x.date,d=m?lm(m):ap?ap.ms.map(lm).filter(Boolean).sort().pop():'';
  const url=l=>C.url+(LM[l].slug?'/'+LM[l].slug:'')+u,alts=alt?LANGS.map(l=>`<xhtml:link rel="alternate" hreflang="${LM[l].hl}" href="${url(l)}"/>`).join('')+`<xhtml:link rel="alternate" hreflang="x-default" href="${url('es')}"/>`:'';
  return(alt?LANGS:['es']).map(l=>`<url><loc>${url(l)}</loc>${alts}${d?`<lastmod>${String(d).slice(0,10)}</lastmod>`:''}</url>`).join('')}).join('')}</urlset>`);
const rd=d=>new Date(d).toUTCString();
W(`${OUT}/rss.xml`,`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(C.name)} — Novedades</title><link>${C.url}/</link><atom:link href="${C.url}/rss.xml" rel="self" type="application/rss+xml"/><description>Mods nuevos y actualizaciones de Football Manager publicados en ${esc(C.name)}.</description><language>es-ES</language>${ups.length?`<lastBuildDate>${rd(ups[0].date)}</lastBuildDate>`:''}${ups.slice(0,30).map(u=>{const link=`${C.url}/mod/${u.m.slug}/`,t=u.type==='new'?'Nuevo: '+u.m.title:'Actualizado: '+u.m.title+(u.ver?' '+u.ver:''),dsc=plain(u.type==='new'?(u.m.description||''):(u.note||u.m.description||''));return `<item><title>${esc(t+' ('+u.m.vers.join(', ')+')')}</title><link>${link}</link><guid isPermaLink="false">${link}#${u.type}-${String(u.date).slice(0,10)}</guid><pubDate>${rd(u.date)}</pubDate>${u.m.cats.map(c=>`<category>${esc(catOf(c).n)}</category>`).join('')}<description>${esc(String(dsc).replace(/\s+/g,' ').trim().slice(0,300))}</description></item>`}).join('')}</channel></rss>`);
W(`${OUT}/robots.txt`,`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${C.url}/sitemap.xml\n`);
W(`${OUT}/data/search.json`,JSON.stringify(mods.map(m=>({s:m.slug,t:m.title,tt:Object.fromEntries(LANGS.slice(1).map(l=>[l,trTo(m.title,l)]).filter(([l,x])=>x&&x!==String(m.title).trim())),a:authText(m),v:m.vers,c:m.cats.map(c=>catOf(c).n),cx:m.cats.map(c=>catOf(c).t||null),i:m.cover||'',n:norm([...titles(m),...m.auth.map(a=>a.name),...m.vers,...m.cats.map(c=>catOf(c).n),...m.cats.flatMap(c=>Object.values(catOf(c).t||{})),...m.tags].join(' '))}))));
W(`${OUT}/data/meta.json`,JSON.stringify({C:{url:C.url,email:C.email,x:C.x,reload:C.reload},CATS,BADGE,LATEST,versions:ALLV,AUTHORS,ES:DICT.es,version:C.version}));
fs.cpSync('public',OUT,{recursive:true});
W(`${OUT}/js/i18n.js`,I18N_JS); // el núcleo + los 5 diccionarios en un solo archivo (con hash en la URL)
// El panel carga /js/ficha.js y /css/style.css: se versionan también (esas rutas se cachean un año)
{const f=p.join(OUT,'admin/index.html'),g=p.join(OUT,'admin/preview.js');
 if(fs.existsSync(f))fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('/js/ficha.js"','/js/ficha.js?v='+V.ficha+'"'));
 if(fs.existsSync(g))fs.writeFileSync(g,fs.readFileSync(g,'utf8').replace("'/css/style.css'","'/css/style.css?v="+V.css+"'"))}
try{const up='public/img/uploads';fs.readdirSync(up).forEach(f=>{const sz=fs.statSync(p.join(up,f)).size;if(sz>400*1024)console.warn(`⚠ ${f} pesa ${(sz/1048576).toFixed(1)} MB: súbela más ligera (JPG o WebP, ~1200 px de ancho) para que cargue rápido`)})}catch{}
// Informe de calidad de las fichas (lo muestra /admin/estadisticas.html) y service worker con versión
{const miss=m=>[!m.screenshots.length&&'capturas',!String(m.card_text||'').trim()&&'texto breve',!String(m.compat_patch||'').trim()&&'parche probado',!m.modified&&'fecha de modificación',!/^\/img\//.test(String(m.cover||''))&&'portada externa'].filter(Boolean);
 const Q=mods.map(m=>({slug:m.slug,title:m.title,status:m.status||'',missing:miss(m)}));
 W(`${OUT}/admin/calidad.json`,JSON.stringify({generated:new Date().toISOString().slice(0,10),mods:Q}));
 const bad=Q.filter(q=>q.missing.length);console.log(`· calidad: ${bad.length} de ${Q.length} fichas con algún campo opcional sin rellenar (detalle en /admin/estadisticas.html)`)}
{const f=p.join(OUT,'sw.js');if(fs.existsSync(f))fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace(/__BUILD__/g,C.version+'-'+V.css+V.app+V.i18n))}
if(C.adsense)W(`${OUT}/ads.txt`,`google.com, ${C.adsense.replace(/^ca-/,'')}, DIRECT, f08c47fec0942fa0\n`);
if(trMissing.size)console.warn(`⚠ ${trMissing.size} texto(s) de novedades/tarjetas sin traducir (se ven en español en los demás idiomas). Pásaselos a Claude: node scripts/translate.js --check`);
if(strictW.length&&process.env.STRICT==='1'){console.error(`\n${strictW.length} problema(s) con STRICT=1:`);strictW.forEach(x=>console.error('  '+x));process.exit(1)}
console.log(`OK: ${mods.length} mods → ${OUT}/`);
