// Generador estático sin dependencias: lee content/mods/*.json y crea /dist
const fs=require('fs'),p=require('path');
// ====== AJUSTES (edita solo esto) ======
const C={
  name:'FM Mods Comunidad',
  url:process.env.URL||(process.env.VERCEL_PROJECT_PRODUCTION_URL&&'https://'+process.env.VERCEL_PROJECT_PRODUCTION_URL)||'https://fm-mods-comunidad.netlify.app',
  x:'FMModsComunidad',
  kofi:'https://ko-fi.com/fmmodscomunidad',
  adsense:'',                                // 'ca-pub-XXXXXXXXXXXXXXXX' cuando te aprueben AdSense
  email:'fmmodscomunidad@gmail.com',
  submit:'https://forms.gle/TU_FORMULARIO'   // formulario "Envía tu mod"
};
const CATS={
  'bases-de-datos':{n:'Bases de Datos',d:'Ligas, parches de transferencias, nombres reales',dir:'editor data/'},
  'graficos':{n:'Gráficos',d:'Facepacks, kitpacks, logopacks, estadios',dir:'graphics/'},
  'skins':{n:'Skins',d:'Interfaz visual',dir:'skins/'},
  'dia-de-partido':{n:'Día de Partido',d:'Marcadores, vallas, balones',dir:'graphics/'}
};
const BADGE={Imprescindible:'b-must',Probado:'b-ok',Oficial:'b-off'};
// ========================================
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const D='content/mods',OUT='dist';
const mods=(fs.existsSync(D)?fs.readdirSync(D).filter(f=>f.endsWith('.json')):[]).map(f=>({tags:[],badges:[],screenshots:[],category:'graficos',fm_version:'FM26',...JSON.parse(fs.readFileSync(p.join(D,f),'utf8')),slug:f.slice(0,-5)}))
  .sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
const installPath=m=>m.install_path||`Documentos/Sports Interactive/Football Manager ${2000+(parseInt(String(m.fm_version).replace(/\D/g,''))||26)}/${(CATS[m.category]||CATS.graficos).dir}`;
const W=(f,t)=>{fs.mkdirSync(p.dirname(f),{recursive:true});fs.writeFileSync(f,t)};
const XI='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
const XU=`https://x.com/${C.x}`;
const ad=l=>`<aside class="ad" aria-label="Publicidad" data-slot="${l}"><span>Publicidad</span><!-- Pega aquí tu bloque de Google AdSense (${l}) --></aside>`;
const donate=()=>`<div class="box donate"><h2>¿Te gusta nuestro trabajo centralizando mods?</h2><p>Invítanos a un café ☕ y ayúdanos a mantener la web y los enlaces al día.</p><a class="btn primary" href="${C.kofi}" target="_blank" rel="noopener">Invitar a un café</a></div>`;
const xcta=()=>`<div class="box xcta"><h2>Síguenos en X</h2><p>Novedades, mods nuevos y avisos de enlaces caídos en @${C.x}.</p><a class="btn" href="${XU}" target="_blank" rel="noopener">${XI}Seguir a @${C.x}</a></div>`;
const badges=m=>m.badges.map(b=>`<span class="b ${BADGE[b]||''}">${esc(b)}</span>`).join('');
const card=m=>`<a class="card" href="/mod/${m.slug}/" data-c="${m.category}" data-t="${esc(norm([m.title,m.author,m.fm_version,...m.tags].join(' ')))}"><img src="${esc(m.cover||'/img/placeholder.svg')}" alt="${esc(m.title)}" loading="lazy" width="640" height="360"><div class="cb"><div class="bd">${badges(m)}</div><h3>${esc(m.title)}</h3><p class="meta">${(CATS[m.category]||{}).n} — ${esc(m.fm_version)}</p></div></a>`;

const page=({title,desc,path,body,img,ld,home})=>`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${C.url}${path}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${C.name}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${/^http/.test(img||'')?img:C.url+(img||'/img/placeholder.svg')}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@${C.x}">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/css/style.css">
${ld?`<script type="application/ld+json">${JSON.stringify(ld)}</script>`:''}${C.adsense?`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${C.adsense}" crossorigin="anonymous"></script>`:''}
<script>if(/(invite|recovery|confirmation)_token/.test(location.hash))location.replace('/admin/'+location.hash)</script></head>
<body${home?' data-home':''}>
<header class="hd"><div class="wrap hd-in"><a class="logo" href="/"><svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#8b6bff"/><path d="M5 17V7l7 6 7-6v10" stroke="#fff" stroke-width="2" fill="none"/></svg><span>FM Mods <b>Comunidad</b></span></a>
<form class="search" action="/" role="search"><input id="q" name="q" type="search" placeholder="Buscar mod por nombre…" autocomplete="off" aria-label="Buscar mods"></form>
<a class="x" href="${XU}" target="_blank" rel="noopener" aria-label="X: @${C.x}">${XI}</a></div>
<nav class="wrap nav" aria-label="Categorías">${Object.entries(CATS).map(([k,v])=>`<a href="/?cat=${k}" data-cat="${k}" title="${v.d}">${v.n}</a>`).join('')}</nav></header>
<main>${body}</main>
<footer class="ft"><div class="wrap"><nav><a href="/aviso-legal/">Aviso Legal</a><a href="/privacidad/">Política de Privacidad</a><a href="${C.submit}" target="_blank" rel="noopener">Envía tu Mod / Colabora</a><a href="${XU}" target="_blank" rel="noopener">@${C.x} en X</a></nav>
<p>${C.name} es un proyecto de aficionados y no está afiliado, asociado ni respaldado por SEGA ni Sports Interactive. Football Manager es marca registrada de sus respectivos propietarios. Los mods pertenecen a sus creadores; aquí solo enlazamos a descargas externas.</p></div></footer>
<script src="/js/app.js" defer></script></body></html>`;

// HOME
const feat=mods.filter(m=>m.badges.length).slice(0,8);
W(`${OUT}/index.html`,page({home:1,path:'/',title:`${C.name} — Mods de Football Manager: bases de datos, gráficos y skins`,
 desc:'Portal comunitario de mods para Football Manager: bases de datos, facepacks, kitpacks, logopacks, skins y elementos de día de partido. Descargas gratis.',
 ld:{'@context':'https://schema.org','@type':'WebSite',name:C.name,url:C.url,potentialAction:{'@type':'SearchAction',target:`${C.url}/?q={q}`,'query-input':'required name=q'}},
 body:`<div class="hero-w"><section class="wrap hero"><h1>Los mods de Football Manager que la comunidad realmente usa</h1><p>Bases de datos, gráficos, skins y más, reunidos y probados por aficionados. Elige una categoría o busca por nombre.</p></section></div>
<section class="wrap"><h2>Mods imprescindibles</h2><div class="rail">${(feat.length?feat:mods.slice(0,4)).map(card).join('')}</div></section>
<section class="wrap" id="ultimos"><h2>Últimos mods</h2><div class="chips"><button class="on" data-cat="">Todos</button>${Object.entries(CATS).map(([k,v])=>`<button data-cat="${k}">${v.n}</button>`).join('')}</div>
<div class="grid" id="grid">${mods.map(card).join('')}</div><p id="empty" class="empty" hidden>No hay mods con ese nombre. Prueba con otra palabra o <a href="${C.submit}">envíanos el que echas en falta</a>.</p></section>
<section class="wrap two">${donate()}${xcta()}</section>`}));

// FICHAS
const dt=d=>d?new Date(d).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}):'';
for(const m of mods){
 const c=CATS[m.category]||CATS.graficos,ip=installPath(m),shots=[m.cover,...m.screenshots].filter(Boolean),url=`/mod/${m.slug}/`;
 const paras=esc(m.description||'').split(/\n{2,}/).map(t=>`<p>${t.replace(/\n/g,'<br>')}</p>`).join('');
 const steps=(m.instructions?m.instructions.split('\n').filter(Boolean):['Descarga el archivo y descomprímelo.','Abre la carpeta de destino (copia la ruta con el botón).','Si la carpeta no existe, créala y pega dentro los archivos del mod.','Abre Football Manager y recarga el skin o la caché de gráficos desde Preferencias.']).map(s=>`<li>${esc(s)}</li>`).join('');
 W(`${OUT}${url}index.html`,page({path:url,img:m.cover,title:`${m.title} (${m.fm_version}) — ${c.n} | ${C.name}`,
  desc:(m.description||'').replace(/\s+/g,' ').slice(0,155),
  ld:{'@context':'https://schema.org','@type':'CreativeWork',name:m.title,description:(m.description||'').slice(0,300),author:{'@type':'Person',name:m.author,url:m.author_url||undefined},datePublished:m.date,image:m.cover?C.url+m.cover:undefined,genre:c.n},
  body:`<div class="wrap"><p class="crumb"><a href="/">Inicio</a> / <a href="/?cat=${m.category}">${c.n}</a></p>
<div class="bd">${badges(m)}</div><h1>${esc(m.title)}</h1>
<p class="meta big-meta">Compatible con <strong>${esc(m.fm_version)}</strong> — Autor: ${m.author_url?`<a href="${esc(m.author_url)}" target="_blank" rel="noopener nofollow">${esc(m.author)}</a>`:esc(m.author)}${m.date?` — Publicado el ${dt(m.date)}`:''}</p>
${ad('bajo-titulo')}
<div class="det"><div>
${shots.length?`<img class="shot" id="shot" src="${esc(shots[0])}" alt="Captura de ${esc(m.title)}" width="960" height="540">${shots.length>1?`<div class="thumbs">${shots.map((s,i)=>`<button type="button" data-src="${esc(s)}" class="${i?'':'on'}" aria-label="Ver captura ${i+1}"><img src="${esc(s)}" alt="" loading="lazy" width="96" height="54"></button>`).join('')}</div>`:''}`:''}
<div class="desc"><h2>Descripción</h2>${paras}${m.tags.length?`<p class="tags">${m.tags.map(t=>`<span>#${esc(t)}</span>`).join('')}</p>`:''}</div></div>
<aside><div class="box"><h2>Instalación</h2><p class="meta">Ruta predeterminada de pegado:</p><code class="path">${esc(ip)}</code>
<button class="btn" type="button" data-copy="${esc(ip)}">Copiar ruta de instalación</button><ol class="steps">${steps}</ol></div>
<div class="box dlbox"><a class="btn primary big" href="${esc(m.download_url)}" target="_blank" rel="nofollow noopener noreferrer">Descargar mod</a>${ad('junto-descarga')}
<a class="rep" href="mailto:${C.email}?subject=${encodeURIComponent('Enlace caído: '+m.title)}&body=${encodeURIComponent(C.url+url)}">Reportar enlace caído</a></div>
${donate()}${xcta()}</aside></div></div>`}));
}

// LEGALES (plantillas: revísalas y completa tus datos)
const legal=(s,t,h)=>W(`${OUT}/${s}/index.html`,page({path:`/${s}/`,title:`${t} | ${C.name}`,desc:t,body:`<div class="wrap prose"><h1>${t}</h1>${h}</div>`}));
legal('aviso-legal','Aviso Legal',`<p>Titular: [TU NOMBRE / RAZÓN SOCIAL] — Contacto: ${C.email}.</p><p>${C.name} es un directorio no oficial de mods para Football Manager. No está afiliado a SEGA ni a Sports Interactive; todas las marcas pertenecen a sus propietarios. No alojamos archivos: enlazamos a servicios externos y no somos responsables de su contenido. Si eres autor y quieres retirar o corregir una ficha, escríbenos.</p>`);
legal('privacidad','Política de Privacidad',`<p>Esta web no recoge datos personales mediante formularios propios. Los enlaces de reporte abren tu cliente de correo.</p><p>Si se activan, Google AdSense y servicios de terceros (Ko-fi, X, hosting) pueden usar cookies o identificadores según sus propias políticas. Te informaremos y pediremos tu consentimiento cuando sea necesario.</p><p>Responsable: [TU NOMBRE] — ${C.email}. Puedes ejercer tus derechos de acceso, rectificación y supresión escribiéndonos.</p>`);

// SEO + estáticos
W(`${OUT}/sitemap.xml`,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/',...mods.map(m=>`/mod/${m.slug}/`),'/aviso-legal/','/privacidad/'].map(u=>`<url><loc>${C.url}${u}</loc></url>`).join('')}</urlset>`);
W(`${OUT}/robots.txt`,`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${C.url}/sitemap.xml\n`);
fs.cpSync('public',OUT,{recursive:true});
console.log(`OK: ${mods.length} mods → ${OUT}/`);
