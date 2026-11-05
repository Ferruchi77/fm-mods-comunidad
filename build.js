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
  reload:['FM24'],   // versiones de FM en las que hay que recargar el skin/caché (en el resto el juego lo hace solo)
  slots:{'bajo-titulo':'','junto-descarga':''}, // IDs de bloque de anuncio (data-ad-slot) de AdSense
  submit:'https://forms.gle/MRgz9tF5xXea5EAn8'   // formulario "Envía tu mod"
};
const readDir=d=>fs.existsSync(d)?fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>({...JSON.parse(fs.readFileSync(p.join(d,f),'utf8')),slug:f.slice(0,-5)})):[];
const CATS={}; // se rellena desde content/categorias (editable en /admin)
readDir('content/categorias').sort((a,b)=>(a.order??99)-(b.order??99)||String(a.name).localeCompare(String(b.name),'es')).forEach(c=>{const t={es:c.name};['en','ca','fr','pt'].forEach(l=>{const v=String(c['name_'+l]||'').trim();if(v)t[l]=v});CATS[c.slug]={n:c.name,d:c.description||'',dir:c.install_dir||'graphics/',...(Object.keys(t).length>1?{t}:{})}});
const BADGE={};readDir('content/distintivos').forEach(b=>BADGE[b.name]={color:b.color||'gris',hex:b.hex||'',icon:b.icon||'',featured:!!b.featured});
if(!Object.keys(BADGE).length)Object.assign(BADGE,{Imprescindible:{color:'violeta',featured:true},Probado:{color:'verde'},Oficial:{color:'amarillo'}});
const FEAT=Object.keys(BADGE).filter(k=>BADGE[k].featured);if(BADGE.Imprescindible&&!FEAT.includes('Imprescindible'))FEAT.push('Imprescindible'); // distintivos que llevan al carrusel de la portada
// La lógica de la ficha vive en public/js/ficha.js (la comparte la vista previa del panel)
const hv=f=>require('crypto').createHash('md5').update(fs.readFileSync(f)).digest('hex').slice(0,8);
const V={css:hv('public/css/style.css'),app:hv('public/js/app.js'),ficha:hv('public/js/ficha.js')};
const F=require('./public/js/ficha.js'),{esc,vk,verYear,dt,UI,normalize}=F;
// ===== i18n =====
// Diccionarios en locales/*.json (es = texto base del HTML). Se incrustan en dist/js/i18n.js; el navegador traduce lo marcado con data-i18n.
const LANGS=['es','en','ca','fr','pt'],DICT={};
LANGS.forEach(l=>{try{DICT[l]=JSON.parse(fs.readFileSync(`locales/${l}.json`,'utf8'))}catch(e){console.warn(`⚠ locales/${l}.json: ${e.message}`);DICT[l]={}}});
LANGS.slice(1).forEach(l=>{Object.keys(DICT.es).forEach(k=>{if(!(k in DICT[l]))console.warn(`⚠ locales/${l}.json: falta «${k}» (se mostrará en español)`)});Object.keys(DICT[l]).forEach(k=>{if(!(k in DICT.es))console.warn(`⚠ locales/${l}.json: «${k}» no existe en es.json`)})});
const I18N_JS='window.FM_DICT='+JSON.stringify(DICT)+';\n'+fs.readFileSync('public/js/i18n.js','utf8');
V.i18n=require('crypto').createHash('md5').update(I18N_JS).digest('hex').slice(0,8);
const fmtT=(s,v)=>String(s).replace(/\{(\w+)\}/g,(_,k)=>v&&v[k]!=null?v[k]:'');
const T=(k,v)=>k in DICT.es?fmtT(DICT.es[k],v):(console.warn('⚠ clave i18n sin definir: '+k),k);
const pj=v=>v?` data-p="${esc(JSON.stringify(v))}"`:'';
const I=(k,v)=>` data-i18n="${k}"${pj(v)}`;                                                    // atributo para un elemento que solo lleva texto
const S=(k,v,tag='span',cls='')=>`<${tag}${cls?` class="${cls}"`:''}${I(k,v)}>${esc(T(k,v))}</${tag}>`;
const SH=(k,v,tag='span',cls='')=>`<${tag}${cls?` class="${cls}"`:''} data-i18n-html="${k}"${pj(v)}>${T(k,v)}</${tag}>`;  // textos propios con <b>/<a>
const AM=(a,v)=>Object.entries(a).map(([n,k])=>`${n}="${esc(T(k,v))}"`).join(' ')+` data-i18n-attr="${Object.entries(a).map(([n,k])=>n+':'+k).join(';')}"${pj(v)}`;
const ctx={C,CATS,BADGE,LATEST:'',ad:null,T},R=F.make(ctx);
const {catOf,badges,authText,vchips,compat,needsReload,installPaths,hist,report,trAttr}=R;
// ========================================
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const D='content/mods',OUT='dist';
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
  if(!m.cats.length)w('no tiene categoría');m.cats.filter(c=>!CATS[c]).forEach(c=>w(`la categoría «${c}» no existe`));
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
const XU=`https://x.com/${C.x}`;
const ad=l=>C.adsense&&C.slots[l]?`<aside class="ad" aria-label="Publicidad"><ins class="adsbygoogle" style="display:block;width:100%" data-ad-client="${C.adsense}" data-ad-slot="${C.slots[l]}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({})</script></aside>`:'';
const donate=()=>`<div class="box donate">${S('donate_h2',null,'h2')}${S('donate_p',null,'p')}<a class="btn primary" href="${C.kofi}" target="_blank" rel="noopener"${I('kofi_label')}>${esc(T('kofi_label'))}</a></div>`;
const xcta=()=>`<div class="box xcta">${S('xcta_h2',null,'h2')}${S('xcta_p',{x:C.x},'p')}<a class="btn" href="${XU}" target="_blank" rel="noopener">${XI}${S('xcta_btn',{x:C.x})}</a></div>`;
const ALLV=[...new Set([...readDir('content/versiones').map(v=>v.name),...mods.flatMap(m=>m.vers)])].filter(v=>vk(v).toUpperCase()!=='FM25').sort((a,b)=>verYear(b)-verYear(a)||String(a).localeCompare(String(b)));
const LATEST=ALLV[0];ctx.LATEST=LATEST;ctx.ad=ad;
const dts=d=>d?new Date(d).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'}):'';
const exc=t=>{t=String(t||'').replace(/\s+/g,' ').trim();return t.length>120?t.slice(0,117)+'…':t};
const card=(m,eager)=>`<a class="card" href="/mod/${m.slug}/" data-slug="${m.slug}" data-c="${esc(m.cats.join(' '))}" data-v="${esc(m.vers.map(vk).join(' '))}" data-t="${esc(norm([m.title,...m.auth.map(a=>a.name),...m.vers,...m.cats.map(c=>catOf(c).n),...m.cats.flatMap(c=>Object.values(catOf(c).t||{})),...m.tags].join(' ')))}"><div class="ph"><img src="${esc(m.cover||'/img/placeholder.svg')}" alt="${esc(m.title)}" loading="${eager?'eager':'lazy'}" decoding="async" width="640" height="360">${m.vers.length?`<span class="ph-v" ${AM({'aria-label':'card_vers'})}>${vchips(m)}</span>`:''}${m.badges.length?`<span class="ph-b">${badges(m)}</span>`:''}</div><div class="cb"><h3>${esc(m.title)}</h3><p class="by">${UI}<strong title="${esc(authText(m))}">${esc(authText(m))}</strong></p><p class="ex">${esc(exc(m.description))}</p><div class="cf"><span class="cat">${m.cats.map(c=>{const x=catOf(c);return `<span${trAttr(x)}>${esc(x.n)}</span>`}).join(', ')}</span>${m.upd[0]?`<time datetime="${esc(m.upd[0].date)}" data-d="short" data-pre="↻ " ${AM({title:'card_upd'})}>↻ ${dts(m.upd[0].date)}</time>`:m.date?`<time datetime="${esc(m.date)}" data-d="short">${dts(m.date)}</time>`:''}</div><p class="st" data-s="${m.slug}" hidden></p></div></a>`;

const absImg=i=>!i?C.url+'/img/og-image.jpg':/^https?:/i.test(i)?i:C.url+encodeURI(i);
const ogImg=m=>[m.cover,...m.screenshots].find(i=>i&&!/\.(avif|svg)(\?|$)/i.test(i));
const page=({title,desc,path,body,img,ld,home,type,imgAlt})=>`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${C.url}${path}">
<meta property="og:type" content="${type||'website'}"><meta property="og:site_name" content="${C.name}"><meta property="og:locale" content="es_ES"><meta property="og:url" content="${C.url}${path}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${esc(absImg(img))}"><meta property="og:image:alt" content="${esc(imgAlt||title)}">${img?'':'<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@${C.x}"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(absImg(img))}">
<link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32.png"><link rel="apple-touch-icon" href="/img/apple-touch-icon.png"><link rel="stylesheet" href="/css/style.css?v=${V.css}"><link rel="alternate" type="application/rss+xml" title="${esc(C.name)} — Novedades" href="/rss.xml">
${ld?`<script type="application/ld+json">${JSON.stringify(ld)}</script>`:''}${C.adsense?`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${C.adsense}" crossorigin="anonymous"></script>`:''}
<script>try{var t=localStorage.getItem('fm_theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
<script>if(/(invite|recovery|confirmation)_token/.test(location.hash))location.replace('/admin/'+location.hash)</script></head>
<body${home?' data-home':''}>
<header class="hd"><div class="wrap hd-in"><a class="logo" href="/"><img src="/img/logo.png" width="40" height="40" alt="" style="border-radius:9px"><span>FM Mods <b>Comunidad</b></span></a>
<form class="search" action="/" role="search"><input id="q" name="q" type="search" ${AM({placeholder:'search_ph','aria-label':'search_aria'})} autocomplete="off" role="combobox" aria-expanded="false" aria-controls="sg" aria-autocomplete="list"><div class="sg" id="sg" role="listbox" ${AM({'aria-label':'sg_aria'})} hidden></div></form>
<div class="lang" id="lang"><button class="x lbtn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="lang-menu" ${AM({'aria-label':'lang_label',title:'lang_label'})}>${GI}<span class="lcode">ES</span></button><ul class="lmenu" id="lang-menu" hidden>${[['es','Español'],['en','English'],['ca','Català'],['fr','Français'],['pt','Português']].map(([c,n])=>`<li><button type="button" lang="${c}" data-lang="${c}">${n}</button></li>`).join('')}<li class="lsep"><button type="button" class="lshare" data-share${I('lang_share')}>${esc(T('lang_share'))}</button></li></ul></div>\
<button class="x tbtn" id="theme" type="button" aria-label="${esc(T('theme_to_light'))}" title="${esc(T('theme_to_light'))}">${TI}</button>\
<a class="x kofi" href="${esc(C.kofi)}" target="_blank" rel="noopener" ${AM({'aria-label':'kofi_label',title:'kofi_label'})}>${KI}<span class="kt"${I('kofi_label')}>${esc(T('kofi_label'))}</span></a>\
<a class="x" href="${XU}" target="_blank" rel="noopener" aria-label="X: @${C.x}">${XI}</a></div>
<nav class="wrap nav" ${AM({'aria-label':'cats_aria'})}>${Object.entries(CATS).map(([k,v])=>`<a href="/?cat=${k}" data-cat="${k}" title="${v.d}"${trAttr(v)}>${v.n}</a>`).join('')}<span class="navsep" aria-hidden="true"></span><a class="nl" href="/como-instalar/"${I('nav_install')}>${esc(T('nav_install'))}</a><a class="nl" href="/envia-tu-mod/"${I('nav_submit')}>${esc(T('nav_submit'))}</a><a class="nl" href="/peticiones/"${I('nav_requests')}>${esc(T('nav_requests'))}</a><a class="nl" href="/novedades/"${I('nav_news')}>${esc(T('nav_news'))}</a></nav></header>
<main>${body}</main>
<footer class="ft"><div class="wrap"><nav><a href="/como-instalar/"${I('nav_install')}>${esc(T('nav_install'))}</a><a href="/envia-tu-mod/"${I('nav_submit')}>${esc(T('nav_submit'))}</a><a href="/peticiones/"${I('nav_requests')}>${esc(T('nav_requests'))}</a><a href="/novedades/"${I('nav_news')}>${esc(T('nav_news'))}</a><a href="/rss.xml"${I('ft_rss')}>RSS</a><a href="/aviso-legal/"${I('ft_legal')}>${esc(T('ft_legal'))}</a><a href="/privacidad/"${I('ft_privacy')}>${esc(T('ft_privacy'))}</a><a href="/envia-tu-mod/"${I('ft_collab')}>${esc(T('ft_collab'))}</a><a href="${XU}" target="_blank" rel="noopener"${I('ft_x',{x:C.x})}>${esc(T('ft_x',{x:C.x}))}</a></nav>
${S('ft_disclaimer',{name:C.name},'p')}</div></footer>
<script src="/js/i18n.js?v=${V.i18n}" defer></script><script src="/js/app.js?v=${V.app}" defer></script></body></html>`;

// NOVEDADES: nuevos mods + actualizaciones registradas en cada ficha
const ups=mods.flatMap(m=>[...m.upd.map(u=>({m,date:u.date,ver:u.version,note:u.note,type:'update'})),...(m.date?[{m,date:m.date,type:'new'}]:[])]).filter(x=>x.date).sort((a,b)=>new Date(b.date)-new Date(a.date));
const upItem=(u,full)=>`<li class="${u.type==='new'?'new':''}"><time datetime="${esc(u.date)}" data-d="short">${dts(u.date)}</time><h3><a href="/mod/${u.m.slug}/">${esc(u.m.title)}</a> <span class="b ${u.type==='new'?'b-verde':'b-violeta'}">${S(u.type==='new'?'b_new':'b_upd')}${u.ver?' '+esc(u.ver):''}</span></h3>${full?`<p class="by">${UI}<strong>${esc(authText(u.m))}</strong></p><p class="vc">${vchips(u.m)}</p>`:''}${u.note?`<p>${esc(u.note)}</p>`:''}</li>`;
// HOME
const feat=mods.filter(m=>m.badges.some(b=>FEAT.includes(b)));
W(`${OUT}/index.html`,page({home:1,path:'/',title:`${C.name} — Mods de Football Manager: bases de datos, gráficos y skins`,
 desc:'Portal comunitario de mods para Football Manager: bases de datos, facepacks, kitpacks, logopacks, skins y elementos de día de partido. Descargas gratis.',
 ld:{'@context':'https://schema.org','@type':'WebSite',name:C.name,url:C.url,potentialAction:{'@type':'SearchAction',target:`${C.url}/?q={q}`,'query-input':'required name=q'}},
 body:`<div class="hero-w"><section class="wrap hero">${S('hero_h1',null,'h1')}${S('hero_p',null,'p')}</section></div>
<section class="wrap"><div class="box howto">${S('howto_h2',null,'h2')}<ol class="steps4">${[1,2,3,4].map(n=>SH('howto_'+n,null,'li')).join('')}</ol><a class="btn" href="/como-instalar/"${I('howto_btn')}>${esc(T('howto_btn'))}</a></div></section>
${feat.length?`<section class="wrap">${S('feat_h2',null,'h2')}<div class="rail-w"><button class="rail-btn prev" type="button" ${AM({'aria-label':'prev'})} hidden>‹</button><div class="rail">${feat.map((m,i)=>card(m,i<2)).join('')}</div><button class="rail-btn next" type="button" ${AM({'aria-label':'next'})}>›</button></div></section>`:''}
<section class="wrap" id="ultimos">${S('latest_h2',null,'h2')}<div class="tools"><div class="chips"><button class="on" data-cat=""${I('f_all')}>${esc(T('f_all'))}</button>${Object.entries(CATS).map(([k,v])=>`<button data-cat="${k}"${trAttr(v)}>${v.n}</button>`).join('')}</div><div class="selects"><label class="vsel">${S('f_ver')}<select id="ver"><option value=""${I('f_ver_all')}>${esc(T('f_ver_all'))}</option>${ALLV.map(v=>`<option value="${esc(vk(v))}">${esc(v)}</option>`).join('')}</select></label><label class="vsel">${S('f_sort')}<select id="sort"><option value=""${I('sort_recent')}>${esc(T('sort_recent'))}</option><option value="valorados"${I('sort_rated')}>${esc(T('sort_rated'))}</option><option value="descargados"${I('sort_dl')}>${esc(T('sort_dl'))}</option><option value="gustados"${I('sort_liked')}>${esc(T('sort_liked'))}</option></select></label></div></div>
<p class="meta resline"><span id="count"></span> <button class="btn small" id="reset" type="button"${I('f_reset')} hidden>${esc(T('f_reset'))}</button></p>
<div class="grid" id="grid">${mods.map(m=>card(m)).join('')}</div><div class="more-w" id="more-w" hidden><button class="btn" id="more" type="button">${esc(T('more',{n:''}).trim())}</button><span class="meta" id="more-n" aria-live="polite"></span></div><div id="empty" class="empty-st" role="status" hidden><svg class="empty-ic" viewBox="0 0 120 120" aria-hidden="true"><rect x="14" y="26" width="92" height="62" rx="8" fill="none" stroke="currentColor" stroke-width="3" opacity=".45"/><path d="M60 26v62" stroke="currentColor" stroke-width="3" opacity=".45"/><circle cx="60" cy="57" r="11" fill="none" stroke="currentColor" stroke-width="3" opacity=".45"/><circle cx="80" cy="72" r="22" fill="var(--bg)" stroke="var(--ac)" stroke-width="5"/><path d="M96 88l14 14" stroke="var(--ac)" stroke-width="7" stroke-linecap="round"/><path d="M73 66c0-5 14-5 14 1 0 4-7 4-7 9M80 82v1" fill="none" stroke="var(--ac)" stroke-width="4" stroke-linecap="round"/></svg>${S('empty_h3',null,'h3')}<p id="empty-msg">${esc(T('empty_p'))}</p><ul class="empty-tips">${S('empty_tip1',null,'li')}${S('empty_tip2',null,'li')}</ul><div class="empty-act"><button class="btn primary" id="empty-reset" type="button"${I('f_reset')}>${esc(T('f_reset'))}</button><a class="btn" href="/peticiones/"${I('empty_req')}>${esc(T('empty_req'))}</a></div></div></section>
${ups.length?`<section class="wrap">${S('news_h2',null,'h2')}<div class="box"><ul class="tl news">${ups.slice(0,4).map(u=>upItem(u)).join('')}</ul><a class="btn" href="/novedades/"${I('news_all')}>${esc(T('news_all'))}</a></div></section>`:''}
<section class="wrap two">${donate()}${xcta()}</section>`}));

// FICHAS
for(const m of mods){
 if(m.cover&&/\.avif(\?|$)/i.test(m.cover))console.warn(`⚠ ${m.slug}: la portada es AVIF y X/WhatsApp no la muestran; para la vista previa se usa otra imagen. Súbela en JPG, PNG o WebP.`);
 const cn=m.cats.map(catOf),url=`/mod/${m.slug}/`;
 W(`${OUT}${url}index.html`,page({path:url,img:ogImg(m),type:'article',imgAlt:`Portada de ${m.title}`,title:`${m.title} (${m.vers.join(', ')}) — ${cn.map(x=>x.n).join(', ')} | ${C.name}`,
  desc:(m.description||'').replace(/\s+/g,' ').slice(0,155),
  ld:{'@context':'https://schema.org','@type':'CreativeWork',name:m.title,description:(m.description||'').slice(0,300),author:m.auth.map(a=>({'@type':'Person',name:a.name,url:/^https?:/i.test(a.url||'')?a.url:undefined})),datePublished:m.date,dateModified:(m.upd[0]&&m.upd[0].date)||m.date,image:m.cover?C.url+m.cover:undefined,genre:cn.map(x=>x.n)},
  body:R.detail(m,{extras:donate()+xcta()})}));
}

// AUTORES: una página por autor de la colección «Autores» que tenga mods publicados (/autor/<slug>/)
const nk=s=>norm(String(s||'').trim());
const authPages=Object.entries(AUTHORS).map(([slug,a])=>({slug,a,ms:mods.filter(m=>m.auth.some(x=>nk(x.name)===nk(a.name)))})).filter(x=>x.ms.length);
for(const {slug,a,ms} of authPages){
 const url=`/autor/${slug}/`,ext=/^https?:/i.test(a.url||'');
 W(`${OUT}${url}index.html`,page({path:url,title:`Mods de ${a.name} para Football Manager | ${C.name}`,
  desc:`${ms.length} mod${ms.length===1?'':'s'} de ${a.name} para Football Manager: ${ms.slice(0,3).map(m=>m.title).join(', ')}.`.slice(0,155),
  ld:{'@context':'https://schema.org','@type':'Person',name:a.name,url:ext?a.url:undefined,sameAs:ext?[a.url]:undefined},
  body:`<div class="wrap">${S('auth_h1',{n:a.name},'h1')}<p class="meta">${S(ms.length===1?'count_one':'count_other',{n:ms.length})}${ext?` · <a href="${esc(a.url)}" target="_blank" rel="noopener nofollow"${I('auth_profile')}>${esc(T('auth_profile'))}</a>`:''}</p><div class="grid">${ms.map(m=>card(m)).join('')}</div></div>`}));
}

// ===== PÁGINAS DE COMUNIDAD =====
const XU2=`https://x.com/${C.x}`;
const ctaK=(hk,pk,href,bk,{ext=1,pp=null}={})=>`<div class="cta">${S(hk,null,'h2')}${S(pk,pp,'p')}<a class="btn primary" href="${href}"${ext?' target="_blank" rel="noopener"':''}${I(bk)}>${esc(T(bk))}</a></div>`;
const nl=(p,n)=>Array.from({length:n},(_,k)=>p+(k+1));
W(`${OUT}/envia-tu-mod/index.html`,page({path:'/envia-tu-mod/',title:`Envía tu mod de Football Manager | ${C.name}`,
 desc:'¿Creas gráficos, skins, bases de datos o elementos de día de partido para Football Manager? Envíanos tu mod y lo publicamos con tu nombre y tu enlace.',
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
  return `<div class="req"><div><span class="b ${st[1]}">${S(st[0])}</span></div><div><h3>${esc(r.title)}</h3>${r.description?`<p>${esc(r.description)}</p>`:''}${mod?`<p><a href="/mod/${mod.slug}/"${I('req_see',{t:mod.title})}>${esc(T('req_see',{t:mod.title}))}</a></p>`:''}</div></div>`};
const reqOpen=REQ.filter(r=>r.status!=='completada'),reqDone=REQ.filter(r=>r.status==='completada');
const reqUrl=C.requests||XU2;
W(`${OUT}/peticiones/index.html`,page({path:'/peticiones/',title:`Peticiones de la comunidad: pide el mod que te falta | ${C.name}`,
 desc:'Pide el mod de Football Manager que te gustaría ver: ligas regionales, packs de gráficos, skins, estadios… Los creadores de la comunidad pueden recoger tu idea.',
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

const mkh=d=>new Date(d).toLocaleDateString('es-ES',{month:'long',year:'numeric'});
let grp='';const tlHtml=ups.map(u=>{const g=mkh(u.date),h=g!==grp?(grp?'</ul>':'')+`<h2 class="month">${g}</h2><ul class="tl">`:'';grp=g;return h+upItem(u,1)}).join('')+(ups.length?'</ul>':'');
W(`${OUT}/novedades/index.html`,page({path:'/novedades/',title:`Historial de actualizaciones de mods | ${C.name}`,
 desc:'Todas las novedades de FM Mods Comunidad: mods nuevos y actualizaciones de skins, packs de caras, bases de datos y más, ordenadas por fecha.',
 body:`<div class="wrap prose">${S('news_h1',null,'h1')}
${S('news_lead',null,'p','lead')}
${tlHtml||'<p>Todavía no hay novedades registradas.</p>'}
${SH('news_foot',null,'p','meta')}</div>`}));

// LEGALES (plantillas: revísalas y completa tus datos)
const legal=(s,t,h)=>W(`${OUT}/${s}/index.html`,page({path:`/${s}/`,title:`${t} | ${C.name}`,desc:t,body:`<div class="wrap prose"><h1>${t}</h1>${h}</div>`}));
legal('aviso-legal','Aviso Legal',`<p>Titular: Ferran — Contacto: ${C.email}.</p><p>${C.name} es un directorio no oficial de mods para Football Manager. No está afiliado a SEGA ni a Sports Interactive; todas las marcas pertenecen a sus propietarios. No alojamos archivos: enlazamos a servicios externos y no somos responsables de su contenido. Si eres autor y quieres retirar o corregir una ficha, escríbenos.</p>`);
legal('privacidad','Política de Privacidad',`<p><b>Responsable:</b> Ferran — ${C.email}.</p><p>Esta web no tiene registro de usuarios ni formularios propios y no recoge datos que te identifiquen directamente. Los enlaces de «Reportar enlace caído» abren tu cliente de correo.</p>
<h2>Datos que se guardan en tu navegador</h2><p>Guardamos en el almacenamiento local de tu navegador (localStorage) las preferencias que eliges y lo que has votado: tema claro/oscuro (<code>fm_theme</code>), idioma (<code>fm_lang</code>) y tus «me gusta», valoraciones y descargas ya contadas (<code>fm_likes</code>, <code>fm_rate</code>, <code>fm_rate_sync</code>, <code>fm_dl</code>). No se usan para publicidad ni para seguirte, y puedes borrarlas cuando quieras desde los ajustes del navegador.</p>
<h2>Valoraciones, «me gusta» y descargas</h2><p>Para que cada persona cuente una sola vez y evitar abusos, cuando valoras, das «me gusta» o pulsas «Descargar mod» nuestro servidor guarda un identificador anónimo calculado a partir de tu dirección IP con un hash con clave (no guardamos tu IP en claro), junto con la ficha y el voto. Solo se usa para contar votos y limitar abusos.</p>
<h2>Alojamiento</h2><p>La web se aloja en Netlify, que como cualquier servidor puede registrar tu dirección IP en sus registros técnicos. Más información en la <a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener">política de privacidad de Netlify</a>.</p>
${C.adsense?`<h2>Publicidad</h2><p>Mostramos publicidad de Google AdSense. Google y sus socios publicitarios pueden usar cookies e identificadores para mostrar y medir anuncios. Si visitas la web desde el Espacio Económico Europeo, el Reino Unido o Suiza, te mostramos un mensaje de consentimiento (Google CMP) y solo usamos esas cookies si lo aceptas; puedes cambiar tu decisión cuando quieras. Más información en <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">cómo usa Google los datos de los sitios que usan sus servicios</a>.</p>`:''}
<h2>Enlaces a terceros</h2><p>Los enlaces a Ko-fi, X y a las descargas externas (MediaFire, MEGA, Drive…) se rigen por las políticas de cada servicio.</p>
<h2>Tus derechos</h2><p>Puedes ejercer tus derechos de acceso, rectificación y supresión escribiendo a <a href="mailto:${C.email}">${C.email}</a>.</p>`);


const rows=Object.values(CATS).map(c=>`<tr><td${trAttr(c)}>${esc(c.n)}</td><td>${esc(c.d)}</td><td><code>${esc(c.dir)}</code></td></tr>`).join('');
W(`${OUT}/como-instalar/index.html`,page({path:'/como-instalar/',title:`Cómo instalar mods en Football Manager: guía paso a paso | ${C.name}`,desc:'Aprende a instalar facepacks, logos, skins, bases de datos y elementos de día de partido en Football Manager: rutas en Windows, Mac y Linux y solución a problemas.',
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

// SEO + estáticos
W(`${OUT}/sitemap.xml`,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/',...mods.map(m=>`/mod/${m.slug}/`),...authPages.map(x=>`/autor/${x.slug}/`),'/como-instalar/','/envia-tu-mod/','/peticiones/','/novedades/','/aviso-legal/','/privacidad/'].map(u=>{const m=mods.find(x=>u==='/mod/'+x.slug+'/'),ap=authPages.find(x=>u==='/autor/'+x.slug+'/'),lm=x=>(x.upd[0]&&x.upd[0].date)||x.date,d=m?lm(m):ap?ap.ms.map(lm).filter(Boolean).sort().pop():'';return `<url><loc>${C.url}${u}</loc>${d?`<lastmod>${String(d).slice(0,10)}</lastmod>`:''}</url>`}).join('')}</urlset>`);
const rd=d=>new Date(d).toUTCString();
W(`${OUT}/rss.xml`,`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(C.name)} — Novedades</title><link>${C.url}/</link><atom:link href="${C.url}/rss.xml" rel="self" type="application/rss+xml"/><description>Mods nuevos y actualizaciones de Football Manager publicados en ${esc(C.name)}.</description><language>es-ES</language>${ups.length?`<lastBuildDate>${rd(ups[0].date)}</lastBuildDate>`:''}${ups.slice(0,30).map(u=>{const link=`${C.url}/mod/${u.m.slug}/`,t=u.type==='new'?'Nuevo: '+u.m.title:'Actualizado: '+u.m.title+(u.ver?' '+u.ver:''),dsc=u.type==='new'?(u.m.description||''):(u.note||u.m.description||'');return `<item><title>${esc(t+' ('+u.m.vers.join(', ')+')')}</title><link>${link}</link><guid isPermaLink="false">${link}#${u.type}-${String(u.date).slice(0,10)}</guid><pubDate>${rd(u.date)}</pubDate>${u.m.cats.map(c=>`<category>${esc(catOf(c).n)}</category>`).join('')}<description>${esc(String(dsc).replace(/\s+/g,' ').trim().slice(0,300))}</description></item>`}).join('')}</channel></rss>`);
W(`${OUT}/robots.txt`,`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${C.url}/sitemap.xml\n`);
W(`${OUT}/data/search.json`,JSON.stringify(mods.map(m=>({s:m.slug,t:m.title,a:authText(m),v:m.vers,c:m.cats.map(c=>catOf(c).n),cx:m.cats.map(c=>catOf(c).t||null),i:m.cover||'',n:norm([m.title,...m.auth.map(a=>a.name),...m.vers,...m.cats.map(c=>catOf(c).n),...m.cats.flatMap(c=>Object.values(catOf(c).t||{})),...m.tags].join(' '))}))));
W(`${OUT}/data/meta.json`,JSON.stringify({C:{url:C.url,email:C.email,x:C.x,reload:C.reload},CATS,BADGE,LATEST,versions:ALLV,AUTHORS,ES:DICT.es}));
fs.cpSync('public',OUT,{recursive:true});
W(`${OUT}/js/i18n.js`,I18N_JS); // el núcleo + los 5 diccionarios en un solo archivo (con hash en la URL)
// El panel carga /js/ficha.js y /css/style.css: se versionan también (esas rutas se cachean un año)
{const f=p.join(OUT,'admin/index.html'),g=p.join(OUT,'admin/preview.js');
 if(fs.existsSync(f))fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('/js/ficha.js"','/js/ficha.js?v='+V.ficha+'"'));
 if(fs.existsSync(g))fs.writeFileSync(g,fs.readFileSync(g,'utf8').replace("'/css/style.css'","'/css/style.css?v="+V.css+"'"))}
try{const up='public/img/uploads';fs.readdirSync(up).forEach(f=>{const sz=fs.statSync(p.join(up,f)).size;if(sz>400*1024)console.warn(`⚠ ${f} pesa ${(sz/1048576).toFixed(1)} MB: súbela más ligera (JPG o WebP, ~1200 px de ancho) para que cargue rápido`)})}catch{}
if(C.adsense)W(`${OUT}/ads.txt`,`google.com, ${C.adsense.replace(/^ca-/,'')}, DIRECT, f08c47fec0942fa0\n`);
console.log(`OK: ${mods.length} mods → ${OUT}/`);
