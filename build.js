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
  slots:{'bajo-titulo':'','junto-descarga':''}, // IDs de bloque de anuncio (data-ad-slot) de AdSense
  submit:'https://forms.gle/MRgz9tF5xXea5EAn8'   // formulario "Envía tu mod"
};
const readDir=d=>fs.existsSync(d)?fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>({...JSON.parse(fs.readFileSync(p.join(d,f),'utf8')),slug:f.slice(0,-5)})):[];
const CATS={}; // se rellena desde content/categorias (editable en /admin)
readDir('content/categorias').sort((a,b)=>(a.order??99)-(b.order??99)||String(a.name).localeCompare(String(b.name),'es')).forEach(c=>CATS[c.slug]={n:c.name,d:c.description||'',dir:c.install_dir||'graphics/'});
const catOf=s=>CATS[s]||{n:s,d:'',dir:'graphics/'};
const BADGE={};readDir('content/distintivos').forEach(b=>BADGE[b.name]=b.color||'gris');
if(!Object.keys(BADGE).length)Object.assign(BADGE,{Imprescindible:'violeta',Probado:'verde',Oficial:'amarillo'});
// ========================================
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const D='content/mods',OUT='dist';
const mods=(fs.existsSync(D)?fs.readdirSync(D).filter(f=>f.endsWith('.json')):[]).map(f=>({tags:[],badges:[],screenshots:[],...JSON.parse(fs.readFileSync(p.join(D,f),'utf8')),slug:f.slice(0,-5)}))
  .map(m=>({...m,cats:[].concat(m.categories||m.category||[]),vers:[].concat(m.fm_versions||m.fm_version||[]).sort(),upd:[].concat(m.updates||[]).filter(u=>{const ok=u&&u.date&&!isNaN(new Date(u.date));if(!ok)console.warn(`⚠ ${m.slug}: hay una actualización sin fecha válida y se ha ignorado`);return ok}).sort((a,b)=>new Date(b.date)-new Date(a.date))}))
  .sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
const verYear=v=>2000+(parseInt(String(v).replace(/\D/g,''))||26);
const installPaths=m=>m.install_path&&m.install_path.trim()?m.install_path.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(path=>({label:'',path})):
  (m.vers.length?m.vers:['FM26']).flatMap(v=>[...new Set((m.cats.length?m.cats:['graficos']).map(c=>catOf(c).dir))].map(d=>({label:m.vers.length>1?v:'',path:`Documentos/Sports Interactive/Football Manager ${verYear(v)}/${d}`})));
const W=(f,t)=>{fs.mkdirSync(p.dirname(f),{recursive:true});fs.writeFileSync(f,t)};
const XI='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
const TI='<svg class="ic-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg><svg class="ic-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
const XU=`https://x.com/${C.x}`;
const ad=l=>C.adsense&&C.slots[l]?`<aside class="ad" aria-label="Publicidad"><ins class="adsbygoogle" style="display:block;width:100%" data-ad-client="${C.adsense}" data-ad-slot="${C.slots[l]}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({})</script></aside>`:'';
const donate=()=>`<div class="box donate"><h2>¿Te gusta nuestro trabajo centralizando mods?</h2><p>Invítanos a un café ☕ y ayúdanos a mantener la web y los enlaces al día.</p><a class="btn primary" href="${C.kofi}" target="_blank" rel="noopener">Invitar a un café</a></div>`;
const xcta=()=>`<div class="box xcta"><h2>Síguenos en X</h2><p>Novedades, mods nuevos y avisos de enlaces caídos en @${C.x}.</p><a class="btn" href="${XU}" target="_blank" rel="noopener">${XI}Seguir a @${C.x}</a></div>`;
const badges=m=>m.badges.map(b=>`<span class="b b-${BADGE[b]||'gris'}">${esc(b)}</span>`).join('');
const vk=v=>String(v).replace(/\s+/g,'');
const ALLV=[...new Set([...readDir('content/versiones').map(v=>v.name),...mods.flatMap(m=>m.vers)])].sort((a,b)=>verYear(b)-verYear(a)||String(a).localeCompare(String(b)));
const LATEST=ALLV[0];
const vchips=m=>m.vers.map(v=>`<span class="vchip${v===LATEST?' new':''}">${esc(v)}</span>`).join('');
const compat=m=>{const ok=m.vers.includes(LATEST),t=[ok?`Compatible con ${LATEST}, la versión más reciente del juego.`:`Este mod no está marcado como compatible con ${LATEST}, la versión más reciente. Puede no funcionar en ella.`];
  if(m.compat_patch)t.push(`Probado con el parche ${m.compat_patch}.`);if(m.compat_note)t.push(m.compat_note);
  return `<div class="compat${ok?'':' warn'}"><div class="vc"><strong>Compatibilidad</strong>${vchips(m)}</div><p>${esc(t.join(' '))}</p></div>`};
const RELOAD=['FM24']; // versiones en las que hay que recargar el skin/caché (el resto lo hace el juego solo)
const needsReload=m=>m.vers.some(v=>RELOAD.includes(vk(v).toUpperCase()));
const UI='<svg class="ui" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"/></svg>';
const dts=d=>d?new Date(d).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'}):'';
const exc=t=>{t=String(t||'').replace(/\s+/g,' ').trim();return t.length>120?t.slice(0,117)+'…':t};
const card=(m,eager)=>`<a class="card" href="/mod/${m.slug}/" data-slug="${m.slug}" data-c="${esc(m.cats.join(' '))}" data-v="${esc(m.vers.map(vk).join(' '))}" data-t="${esc(norm([m.title,m.author,...m.vers,...m.cats.map(c=>catOf(c).n),...m.tags].join(' ')))}"><div class="ph"><img src="${esc(m.cover||'/img/placeholder.svg')}" alt="${esc(m.title)}" loading="${eager?'eager':'lazy'}" decoding="async" width="640" height="360"></div><div class="cb"><div class="bd">${badges(m)}</div><h3>${esc(m.title)}</h3><p class="by">${UI}<strong>${esc(m.author)}</strong>${m.upd[0]?`<time datetime="${esc(m.upd[0].date)}" title="Última actualización">↻ ${dts(m.upd[0].date)}</time>`:m.date?`<time datetime="${esc(m.date)}">${dts(m.date)}</time>`:''}</p><p class="meta">${esc(m.cats.map(c=>catOf(c).n).join(', '))}</p><p class="vc">${vchips(m)}</p><p class="ex">${esc(exc(m.description))}</p><p class="st" data-s="${m.slug}" hidden></p></div></a>`;

const absImg=i=>!i?C.url+'/img/og-image.jpg':/^https?:/i.test(i)?i:C.url+encodeURI(i);
const ogImg=m=>[m.cover,...m.screenshots].find(i=>i&&!/\.(avif|svg)(\?|$)/i.test(i));
const page=({title,desc,path,body,img,ld,home,type,imgAlt})=>`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${C.url}${path}">
<meta property="og:type" content="${type||'website'}"><meta property="og:site_name" content="${C.name}"><meta property="og:locale" content="es_ES"><meta property="og:url" content="${C.url}${path}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${esc(absImg(img))}"><meta property="og:image:alt" content="${esc(imgAlt||title)}">${img?'':'<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@${C.x}"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(absImg(img))}">
<link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32.png"><link rel="apple-touch-icon" href="/img/apple-touch-icon.png"><link rel="stylesheet" href="/css/style.css">
${ld?`<script type="application/ld+json">${JSON.stringify(ld)}</script>`:''}${C.adsense?`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${C.adsense}" crossorigin="anonymous"></script>`:''}
<script>try{var t=localStorage.getItem('fm_theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
<script>if(/(invite|recovery|confirmation)_token/.test(location.hash))location.replace('/admin/'+location.hash)</script></head>
<body${home?' data-home':''}>
<header class="hd"><div class="wrap hd-in"><a class="logo" href="/"><img src="/img/logo.png" width="40" height="40" alt="" style="border-radius:9px"><span>FM Mods <b>Comunidad</b></span></a>
<form class="search" action="/" role="search"><input id="q" name="q" type="search" placeholder="Buscar mod por nombre…" autocomplete="off" aria-label="Buscar mods"></form>
<button class="x tbtn" id="theme" type="button" aria-label="Cambiar a modo claro" title="Cambiar a modo claro">${TI}</button><a class="x" href="${XU}" target="_blank" rel="noopener" aria-label="X: @${C.x}">${XI}</a></div>
<nav class="wrap nav" aria-label="Categorías">${Object.entries(CATS).map(([k,v])=>`<a href="/?cat=${k}" data-cat="${k}" title="${v.d}">${v.n}</a>`).join('')}<span class="navsep" aria-hidden="true"></span><a class="nl" href="/como-instalar/">Cómo instalar</a><a class="nl" href="/envia-tu-mod/">Envía tu mod</a><a class="nl" href="/peticiones/">Peticiones</a><a class="nl" href="/novedades/">Novedades</a></nav></header>
<main>${body}</main>
<footer class="ft"><div class="wrap"><nav><a href="/como-instalar/">Cómo instalar</a><a href="/envia-tu-mod/">Envía tu mod</a><a href="/peticiones/">Peticiones</a><a href="/novedades/">Novedades</a><a href="/aviso-legal/">Aviso Legal</a><a href="/privacidad/">Política de Privacidad</a><a href="/envia-tu-mod/">Colabora</a><a href="${XU}" target="_blank" rel="noopener">@${C.x} en X</a></nav>
<p>${C.name} es un proyecto de aficionados y no está afiliado, asociado ni respaldado por SEGA ni Sports Interactive. Football Manager es marca registrada de sus respectivos propietarios. Los mods pertenecen a sus creadores; aquí solo enlazamos a descargas externas.</p></div></footer>
<script src="/js/app.js" defer></script></body></html>`;

// Reportar enlace caído: correo (mailto) con asunto y cuerpo, más alternativas web por si no hay cliente de correo
const report=m=>{const url=`${C.url}/mod/${m.slug}/`,q=encodeURIComponent,subj=`Enlace caído: ${m.title}`,
  body=`Hola,\r\n\r\nEl enlace de descarga de «${m.title}» no funciona.\r\n\r\nFicha: ${url}\r\nEnlace roto: ${m.download_url}\r\n\r\nGracias.`,
  mail=C.email&&!/tudominio/.test(C.email)?C.email:'',
  x=`https://x.com/intent/post?text=${q(`@${C.x} El enlace de «${m.title}» parece caído: ${url}`)}`,
  A=(h,t,ext)=>`<a href="${esc(h)}"${ext?' target="_blank" rel="noopener"':''}>${t}</a>`;
  if(!mail)return `<p class="rep-w">${A(x,'Reportar enlace caído (por X)',1)}</p>`;
  return `<p class="rep-w">${A(`mailto:${mail}?subject=${q(subj)}&body=${q(body)}`,'Reportar enlace caído')}<span class="rep-alt"> · ¿No se abre tu correo? ${A(`https://mail.google.com/mail/?view=cm&fs=1&to=${q(mail)}&su=${q(subj)}&body=${q(body)}`,'Gmail',1)} · ${A(`https://outlook.live.com/mail/0/deeplink/compose?to=${q(mail)}&subject=${q(subj)}&body=${q(body)}`,'Outlook',1)} · ${A(x,'Avisar por X',1)}</span></p>`};
// NOVEDADES: nuevos mods + actualizaciones registradas en cada ficha
const ups=mods.flatMap(m=>[...m.upd.map(u=>({m,date:u.date,ver:u.version,note:u.note,type:'update'})),...(m.date?[{m,date:m.date,type:'new'}]:[])]).filter(x=>x.date).sort((a,b)=>new Date(b.date)-new Date(a.date));
const upItem=(u,full)=>`<li class="${u.type==='new'?'new':''}"><time datetime="${esc(u.date)}">${dts(u.date)}</time><h3><a href="/mod/${u.m.slug}/">${esc(u.m.title)}</a> <span class="b ${u.type==='new'?'b-verde':'b-violeta'}">${u.type==='new'?'Nuevo':'Actualizado'}${u.ver?' '+esc(u.ver):''}</span></h3>${full?`<p class="by">${UI}<strong>${esc(u.m.author)}</strong></p><p class="vc">${vchips(u.m)}</p>`:''}${u.note?`<p>${esc(u.note)}</p>`:''}</li>`;
const hist=m=>m.upd.length?`<div class="desc"><h2>Historial de versiones</h2><ul class="tl">${m.upd.map(u=>`<li><time datetime="${esc(u.date)}">${dt(u.date)}</time><h3>${u.version?esc(u.version):'Actualización'}</h3>${u.note?`<p>${esc(u.note)}</p>`:''}</li>`).join('')}${m.date?`<li class="new"><time datetime="${esc(m.date)}">${dt(m.date)}</time><h3>Publicación inicial</h3></li>`:''}</ul></div>`:'';
// HOME
const feat=mods.filter(m=>m.badges.includes('Imprescindible'));
W(`${OUT}/index.html`,page({home:1,path:'/',title:`${C.name} — Mods de Football Manager: bases de datos, gráficos y skins`,
 desc:'Portal comunitario de mods para Football Manager: bases de datos, facepacks, kitpacks, logopacks, skins y elementos de día de partido. Descargas gratis.',
 ld:{'@context':'https://schema.org','@type':'WebSite',name:C.name,url:C.url,potentialAction:{'@type':'SearchAction',target:`${C.url}/?q={q}`,'query-input':'required name=q'}},
 body:`<div class="hero-w"><section class="wrap hero"><h1>Los mods de Football Manager que la comunidad realmente usa</h1><p>Bases de datos, gráficos, skins y más, reunidos y probados por aficionados. Elige una categoría o busca por nombre.</p></section></div>
<section class="wrap"><div class="box howto"><h2>Cómo instalar los mods en 4 pasos</h2><ol class="steps4"><li><b>Descarga</b> el archivo desde la ficha y descomprímelo (7-Zip o WinRAR).</li><li><b>Copia la ruta</b> de instalación con el botón de la ficha.</li><li><b>Pega</b> los archivos en esa carpeta del juego (créala si no existe).</li><li><b>Listo.</b> En FM26 y posteriores los gráficos se cargan solos (en FM24 recarga el skin en Preferencias). Las bases de datos se eligen al empezar una partida nueva.</li></ol><a class="btn" href="/como-instalar/">Ver la guía completa</a></div></section>
${feat.length?`<section class="wrap"><h2>Mods imprescindibles</h2><div class="rail-w"><button class="rail-btn prev" type="button" aria-label="Anterior" hidden>‹</button><div class="rail">${feat.map((m,i)=>card(m,i<2)).join('')}</div><button class="rail-btn next" type="button" aria-label="Siguiente">›</button></div></section>`:''}
<section class="wrap" id="ultimos"><h2>Últimos mods</h2><div class="tools"><div class="chips"><button class="on" data-cat="">Todos</button>${Object.entries(CATS).map(([k,v])=>`<button data-cat="${k}">${v.n}</button>`).join('')}</div><div class="selects"><label class="vsel"><span>Versión de FM</span><select id="ver"><option value="">Todas</option>${ALLV.map(v=>`<option value="${esc(vk(v))}">${esc(v)}</option>`).join('')}</select></label><label class="vsel"><span>Ordenar</span><select id="sort"><option value="">Más recientes</option><option value="valorados">Más valorados</option><option value="descargados">Más descargados</option><option value="gustados">Más «Me gusta»</option></select></label></div></div>
<p class="meta resline"><span id="count"></span> <button class="btn small" id="reset" type="button" hidden>Limpiar filtros</button></p>
<div class="grid" id="grid">${mods.map(m=>card(m)).join('')}</div><p id="empty" class="empty" hidden>No hay mods con ese nombre. Prueba con otra palabra o <a href="/peticiones/">pídenos el mod que echas en falta</a>.</p></section>
${ups.length?`<section class="wrap"><h2>Últimas novedades</h2><div class="box"><ul class="tl news">${ups.slice(0,4).map(u=>upItem(u)).join('')}</ul><a class="btn" href="/novedades/">Ver el historial completo</a></div></section>`:''}
<section class="wrap two">${donate()}${xcta()}</section>`}));

// FICHAS
const dt=d=>d?new Date(d).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}):'';
for(const m of mods){
 if(m.cover&&/\.avif(\?|$)/i.test(m.cover))console.warn(`⚠ ${m.slug}: la portada es AVIF y X/WhatsApp no la muestran; para la vista previa se usa otra imagen. Súbela en JPG, PNG o WebP.`);
 const cn=m.cats.map(catOf),ips=installPaths(m),shots=[m.cover,...m.screenshots].filter(Boolean),url=`/mod/${m.slug}/`;
 const paras=esc(m.description||'').split(/\n{2,}/).map(t=>`<p>${t.replace(/\n/g,'<br>')}</p>`).join('');
 const steps=(m.instructions?m.instructions.split('\n').filter(Boolean):['Descarga el archivo y descomprímelo.','Abre la carpeta de destino (copia la ruta con el botón).','Si la carpeta no existe, créala y pega dentro los archivos del mod.',...(needsReload(m)?['Abre Football Manager y recarga el skin o la caché de gráficos desde Preferencias.']:[])]).map(s=>`<li>${esc(s)}</li>`).join('');
 W(`${OUT}${url}index.html`,page({path:url,img:ogImg(m),type:'article',imgAlt:`Portada de ${m.title}`,title:`${m.title} (${m.vers.join(', ')}) — ${cn.map(x=>x.n).join(', ')} | ${C.name}`,
  desc:(m.description||'').replace(/\s+/g,' ').slice(0,155),
  ld:{'@context':'https://schema.org','@type':'CreativeWork',name:m.title,description:(m.description||'').slice(0,300),author:{'@type':'Person',name:m.author,url:m.author_url||undefined},datePublished:m.date,dateModified:(m.upd[0]&&m.upd[0].date)||m.date,image:m.cover?C.url+m.cover:undefined,genre:cn.map(x=>x.n)},
  body:`<div class="wrap"><p class="crumb"><a href="/">Inicio</a> / ${m.cats[0]?`<a href="/?cat=${m.cats[0]}">${esc(cn[0].n)}</a>`:'Mods'}</p>
<div class="bd">${badges(m)}</div><h1>${esc(m.title)}</h1>
<p class="catlinks">${m.cats.map((c,i)=>`<a href="/?cat=${c}">${esc(cn[i].n)}</a>`).join('')}</p>
<p class="byline">${UI}<span class="lbl">Creado por</span> <strong>${m.author_url?`<a href="${esc(m.author_url)}" target="_blank" rel="noopener nofollow">${esc(m.author)}</a>`:esc(m.author)}</strong>${m.date?`<time datetime="${esc(m.date)}">${dt(m.date)}</time>`:''}${m.upd[0]?`<span class="upd">Actualizado el ${dt(m.upd[0].date)}${m.upd[0].version?' ('+esc(m.upd[0].version)+')':''}</span>`:''}</p>
<div class="rate" data-rate="${m.slug}"><div class="stars" role="group" aria-label="Valora este mod de 1 a 5 estrellas">${[1,2,3,4,5].map(n=>`<button type="button" data-star="${n}" aria-label="${n} de 5" aria-pressed="false">★</button>`).join('')}</div><span class="rtxt">Sé el primero en valorar</span></div>
${compat(m)}
${ad('bajo-titulo')}
<div class="det"><div>
${shots.length?`<img class="shot" id="shot" data-zoom tabindex="0" title="Pulsa para ampliar" src="${esc(shots[0])}" alt="Captura de ${esc(m.title)}" decoding="async" fetchpriority="high" width="960" height="540">${shots.length>1?`<div class="thumbs">${shots.map((s,i)=>`<button type="button" data-src="${esc(s)}" class="${i?'':'on'}" aria-label="Ver captura ${i+1}"><img src="${esc(s)}" alt="" loading="lazy" decoding="async" width="96" height="54"></button>`).join('')}</div>`:''}`:''}
<div class="desc"><h2>Descripción</h2>${paras}${m.tags.length?`<p class="tags">${m.tags.map(t=>`<span>#${esc(t)}</span>`).join('')}</p>`:''}</div>${hist(m)}</div>
<aside><div class="box"><h2>Instalación</h2><p class="meta">Ruta predeterminada de pegado:</p>${ips.map(x=>`${x.label?`<p class="meta pl">${esc(x.label)}</p>`:''}<code class="path">${esc(x.path)}</code><button class="btn" type="button" data-copy="${esc(x.path)}">Copiar ruta de instalación</button>`).join('')}<ol class="steps">${steps}</ol><p class="meta" style="margin:12px 0 0"><a href="/como-instalar/" style="text-decoration:underline">¿Primera vez? Lee la guía completa de instalación</a></p></div><div class="box dlbox"><a class="btn primary big" data-dlc="${m.slug}" href="${esc(m.download_url)}" target="_blank" rel="nofollow noopener noreferrer">Descargar mod</a><div class="fb"><button class="btn like" type="button" data-like="${m.slug}" aria-pressed="false">👍 <span>Me gusta</span> <b></b></button><span class="dlc" data-dl="${m.slug}"></span></div>${ad('junto-descarga')}
${report(m)}</div>
${donate()}${xcta()}</aside></div></div>`}));
}


// ===== PÁGINAS DE COMUNIDAD =====
const XU2=`https://x.com/${C.x}`;
const cta=(t,p,href,label,ext=1)=>`<div class="cta"><h2>${t}</h2><p>${p}</p><a class="btn primary" href="${href}"${ext?' target="_blank" rel="noopener"':''}>${label}</a></div>`;
W(`${OUT}/envia-tu-mod/index.html`,page({path:'/envia-tu-mod/',title:`Envía tu mod de Football Manager | ${C.name}`,
 desc:'¿Creas gráficos, skins, bases de datos o elementos de día de partido para Football Manager? Envíanos tu mod y lo publicamos con tu nombre y tu enlace.',
 body:`<div class="wrap prose"><h1>Envía tu mod</h1>
<p class="lead">${C.name} es un escaparate para el trabajo de los creadores de la comunidad. Si haces gráficos, skins, bases de datos o elementos de día de partido, aquí tu mod llega a más gente y siempre con tu nombre y tu enlace por delante.</p>
${cta('¿Listo para compartirlo?','El envío se hace con un formulario externo y solo lleva unos minutos.',C.submit,'Rellenar el formulario')}
<h2>Qué estamos buscando</h2>
<div class="cards3"><div class="box"><h3>Gráficos</h3><p>Facepacks, kitpacks, logopacks y estadios.</p></div><div class="box"><h3>Skins</h3><p>Mejoras y rediseños de la interfaz.</p></div><div class="box"><h3>Bases de datos</h3><p>Ligas, parches de transferencias, nombres reales y archivos de editor data.</p></div><div class="box"><h3>Día de partido</h3><p>Marcadores, vallas, balones y otros elementos del partido.</p></div></div>
<h2>Requisitos</h2>
<ul class="checks"><li>Eres el autor del mod o tienes permiso expreso del autor para compartirlo.</li><li>Tienes un enlace de descarga estable en un servicio externo (MediaFire, MEGA, Google Drive…).</li><li>Indicas con qué versión de Football Manager es compatible (FM24, FM25, FM26…) y, si puedes, con qué parche lo has probado.</li><li>Incluyes al menos una imagen de portada y, mejor, varias capturas que muestren el resultado.</li><li>Añades una descripción clara de qué incluye el mod y qué cambia en el juego.</li><li>Explicas dónde se instala (la subcarpeta de destino) y cualquier paso especial.</li><li>Nos das el nombre con el que quieres figurar y un enlace a tu perfil (X, foro, web…).</li></ul>
<h2>Qué no publicamos</h2>
<ul class="checks no"><li>Contenido que no sea tuyo o que use material de otros autores sin su permiso.</li><li>Archivos de pago, cracks, versiones pirateadas del juego o cualquier cosa que infrinja licencias.</li><li>Enlaces que lleven a software malicioso o que obliguen a instalar programas ajenos al mod.</li></ul>
<h2>Cómo funciona</h2>
<ol class="steps4"><li><b>Envía</b> el formulario con los datos de tu mod.</li><li><b>Revisamos</b> el enlace, las imágenes y la información.</li><li><b>Publicamos</b> la ficha con tus créditos y tu enlace de creador.</li><li><b>Actualiza</b> cuando quieras: envíanos la nueva versión y aparecerá en <a href="/novedades/">Novedades</a>.</li></ol>
<h2>Si eres autor y quieres retirar o corregir una ficha</h2><p>Escríbenos a <a href="mailto:${C.email}">${C.email}</a> o por <a href="${XU2}" target="_blank" rel="noopener">X</a> y lo resolvemos.</p>
<p>¿Echas en falta un mod que nadie ha hecho todavía? Mira las <a href="/peticiones/">peticiones de la comunidad</a>.</p></div>`}));

const REQ=readDir('content/peticiones').sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
const ST={abierta:['Abierta','b-azul'],desarrollo:['En desarrollo','b-amarillo'],completada:['Completada','b-verde']};
const reqItem=r=>{const st=ST[r.status]||ST.abierta,mod=r.mod&&mods.find(m=>m.slug===r.mod);
  return `<div class="req"><div><span class="b ${st[1]}">${st[0]}</span></div><div><h3>${esc(r.title)}</h3>${r.description?`<p>${esc(r.description)}</p>`:''}${mod?`<p><a href="/mod/${mod.slug}/">Ver el mod: ${esc(mod.title)}</a></p>`:''}</div></div>`};
const reqOpen=REQ.filter(r=>r.status!=='completada'),reqDone=REQ.filter(r=>r.status==='completada');
const reqUrl=C.requests||XU2;
W(`${OUT}/peticiones/index.html`,page({path:'/peticiones/',title:`Peticiones de la comunidad: pide el mod que te falta | ${C.name}`,
 desc:'Pide el mod de Football Manager que te gustaría ver: ligas regionales, packs de gráficos, skins, estadios… Los creadores de la comunidad pueden recoger tu idea.',
 body:`<div class="wrap prose"><h1>Peticiones de la comunidad</h1>
<p class="lead">¿Hay una liga, un pack de gráficos o una skin que te gustaría tener y no encuentras? Cuéntanoslo. Publicamos las ideas aquí para que los creadores puedan verlas y animarse a hacerlas realidad.</p>
${cta('Haz tu petición',C.requests?'Rellena el formulario con lo que buscas.':'Escríbenos por X mencionando a @'+C.x+' con lo que buscas.',reqUrl,C.requests?'Enviar una petición':'Pedir por X')}
${C.requestsEmbed?`<iframe class="embed" src="${esc(C.requestsEmbed)}" title="Formulario de peticiones" loading="lazy">Cargando…</iframe>`:''}
<h2>Ejemplos de cosas que puedes pedir</h2>
<div class="cards3"><div class="box"><h3>Ligas y competiciones</h3><p>Divisiones regionales, ligas amateur o torneos que no vienen en el juego.</p></div><div class="box"><h3>Packs de gráficos</h3><p>Caras, escudos o equipaciones de una liga o de un periodo concreto.</p></div><div class="box"><h3>Skins</h3><p>Un estilo de interfaz, colores o una vista que echas en falta.</p></div><div class="box"><h3>Estadios y día de partido</h3><p>Estadios, marcadores, vallas o balones de tu competición favorita.</p></div></div>
<h2>Cómo hacer una buena petición</h2>
<ul class="checks"><li>Explica qué quieres con detalle (liga, equipos, temporada, estilo…).</li><li>Indica para qué versión de Football Manager lo necesitas.</li><li>Si puedes, añade ejemplos o imágenes de referencia.</li><li>Revisa antes la <a href="/">lista de mods</a> por si ya existe.</li></ul>
<p>Publicar una petición no garantiza que alguien la haga: dependemos de los creadores voluntarios. Si eres creador y quieres coger una, <a href="/envia-tu-mod/">envíanos tu mod</a> cuando esté listo.</p>
${reqOpen.length?`<h2>Peticiones abiertas</h2>${reqOpen.map(reqItem).join('')}`:''}
${reqDone.length?`<h2>Peticiones cumplidas</h2>${reqDone.map(reqItem).join('')}`:''}</div>`}));

const mkh=d=>new Date(d).toLocaleDateString('es-ES',{month:'long',year:'numeric'});
let grp='';const tlHtml=ups.map(u=>{const g=mkh(u.date),h=g!==grp?(grp?'</ul>':'')+`<h2 class="month">${g}</h2><ul class="tl">`:'';grp=g;return h+upItem(u,1)}).join('')+(ups.length?'</ul>':'');
W(`${OUT}/novedades/index.html`,page({path:'/novedades/',title:`Historial de actualizaciones de mods | ${C.name}`,
 desc:'Todas las novedades de FM Mods Comunidad: mods nuevos y actualizaciones de skins, packs de caras, bases de datos y más, ordenadas por fecha.',
 body:`<div class="wrap prose"><h1>Historial de actualizaciones</h1>
<p class="lead">Aquí ves de un vistazo qué mods son nuevos y cuáles han recibido una versión nueva, de lo más reciente a lo más antiguo.</p>
${tlHtml||'<p>Todavía no hay novedades registradas.</p>'}
<p class="meta">¿Eres autor y has publicado una versión nueva? <a href="/envia-tu-mod/">Avísanos</a> y la añadiremos.</p></div>`}));

// LEGALES (plantillas: revísalas y completa tus datos)
const legal=(s,t,h)=>W(`${OUT}/${s}/index.html`,page({path:`/${s}/`,title:`${t} | ${C.name}`,desc:t,body:`<div class="wrap prose"><h1>${t}</h1>${h}</div>`}));
legal('aviso-legal','Aviso Legal',`<p>Titular: [TU NOMBRE / RAZÓN SOCIAL] — Contacto: ${C.email}.</p><p>${C.name} es un directorio no oficial de mods para Football Manager. No está afiliado a SEGA ni a Sports Interactive; todas las marcas pertenecen a sus propietarios. No alojamos archivos: enlazamos a servicios externos y no somos responsables de su contenido. Si eres autor y quieres retirar o corregir una ficha, escríbenos.</p>`);
legal('privacidad','Política de Privacidad',`<p>Esta web no recoge datos personales mediante formularios propios. Los enlaces de reporte abren tu cliente de correo.</p><p>Mostramos publicidad de Google AdSense. Google y sus socios publicitarios pueden usar cookies e identificadores para mostrar y medir anuncios. Si visitas la web desde el Espacio Económico Europeo, el Reino Unido o Suiza, te mostramos un mensaje de consentimiento (Google CMP) y solo usamos esas cookies si lo aceptas; puedes cambiar tu decisión cuando quieras. Más información en <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">cómo usa Google los datos de los sitios que usan sus servicios</a>.</p><p>Los enlaces a Ko-fi, X y a las descargas externas (MediaFire, MEGA, Drive…) se rigen por las políticas de cada servicio.</p><p>Responsable: [TU NOMBRE] — ${C.email}. Puedes ejercer tus derechos de acceso, rectificación y supresión escribiéndonos.</p>`);


const rows=Object.values(CATS).map(c=>`<tr><td>${esc(c.n)}</td><td>${esc(c.d)}</td><td><code>${esc(c.dir)}</code></td></tr>`).join('');
W(`${OUT}/como-instalar/index.html`,page({path:'/como-instalar/',title:`Cómo instalar mods en Football Manager: guía paso a paso | ${C.name}`,desc:'Aprende a instalar facepacks, logos, skins, bases de datos y elementos de día de partido en Football Manager: rutas en Windows, Mac y Linux y solución a problemas.',
 body:`<div class="wrap prose"><h1>Cómo instalar mods en Football Manager</h1>
<p>Esta guía sirve para casi cualquier mod: gráficos, skins, bases de datos y elementos de día de partido. Si la ficha del mod indica una ruta o instrucciones concretas, sigue siempre las de la ficha.</p>
<h2>Antes de empezar</h2><ul><li>Cierra Football Manager.</li><li>Comprueba en la ficha que el mod es compatible con tu versión del juego (FM24, FM25, FM26…).</li><li>Necesitas un programa para descomprimir, como 7-Zip o WinRAR.</li><li>Haz una copia de seguridad de la carpeta que vayas a modificar si ya tienes otros mods.</li></ul>
<h2>Paso a paso</h2><ol class="steps">
<li><b>Descarga</b> el archivo desde el botón de la ficha. Se abrirá un servicio externo (MediaFire, MEGA, Drive…).</li>
<li><b>Descomprime</b> el archivo (clic derecho → extraer aquí).</li>
<li><b>Abre la carpeta de destino.</b> En cada ficha tienes el botón «Copiar ruta de instalación»; pégala en la barra del explorador de archivos.</li>
<li><b>Crea la carpeta si no existe</b> (por ejemplo <code>graphics</code> o <code>skins</code>) y copia dentro los archivos del mod. Si te pregunta si quieres combinar carpetas, acepta.</li>
<li><b>Abre el juego.</b> En FM26 y posteriores los gráficos se cargan automáticamente; en FM24 hay que recargar el skin (ver más abajo).</li></ol>
<h2>Dónde va cada tipo de mod</h2><div class="tbl"><table><thead><tr><th>Categoría</th><th>Qué incluye</th><th>Subcarpeta habitual</th></tr></thead><tbody>${rows}</tbody></table></div>
<p>Se cuelgan de la carpeta <code>Football Manager 20XX</code> de tu sistema. Las subcarpetas son orientativas: algunos mods (sobre todo los parches de nombres reales) indican otra ruta distinta.</p>
<h2>Rutas según tu sistema</h2><ul><li><b>Windows:</b> <code>Documentos/Sports Interactive/Football Manager 2027/</code></li><li><b>Mac:</b> <code>~/Library/Application Support/Sports Interactive/Football Manager 2027/</code></li><li><b>Linux:</b> <code>~/.local/share/Sports Interactive/Football Manager 2027/</code></li></ul><p>Cambia 2027 por el año de tu versión del juego (FM26 → 2026, FM25 → 2025…).</p>
<h2>Recargar los cambios en el juego</h2><ul><li><b>Gráficos, skins y día de partido en FM26 o posterior:</b> no tienes que hacer nada, se cargan automáticamente al abrir el juego.</li><li><b>Gráficos, skins y día de partido en FM24:</b> entra en Preferencias → Interfaz y pulsa el botón para recargar el skin. Si no ves los cambios, borra la caché desde esa misma pantalla (los nombres pueden variar según el idioma). Para cambiar de skin, elígelo en el desplegable de skins.</li><li><b>Bases de datos y parches de transferencias:</b> se eligen al crear una partida nueva, en la pantalla de selección de base de datos. Normalmente no afectan a partidas ya empezadas.</li></ul>
<h2>Problemas frecuentes</h2><ul><li><b>No veo ningún cambio:</b> revisa que la carpeta tenga el año correcto del juego y que no hayas dejado una carpeta de más (por ejemplo <code>graphics/graphics</code>).</li><li><b>Las caras o logos salen en blanco:</b> algunos packs incluyen un archivo <code>config.xml</code>; no lo borres.</li><li><b>El juego va lento tras instalar un pack grande:</b> es normal la primera vez, mientras se construye la caché.</li><li><b>El enlace no funciona:</b> usa «Reportar enlace caído» en la ficha del mod.</li></ul>
<p><a class="btn primary" href="/">Volver a los mods</a></p></div>`}));

// SEO + estáticos
W(`${OUT}/sitemap.xml`,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/',...mods.map(m=>`/mod/${m.slug}/`),'/como-instalar/','/envia-tu-mod/','/peticiones/','/novedades/','/aviso-legal/','/privacidad/'].map(u=>{const m=mods.find(x=>u==='/mod/'+x.slug+'/'),d=m&&((m.upd[0]&&m.upd[0].date)||m.date);return `<url><loc>${C.url}${u}</loc>${d?`<lastmod>${String(d).slice(0,10)}</lastmod>`:''}</url>`}).join('')}</urlset>`);
W(`${OUT}/robots.txt`,`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${C.url}/sitemap.xml\n`);
fs.cpSync('public',OUT,{recursive:true});
try{const up='public/img/uploads';fs.readdirSync(up).forEach(f=>{const sz=fs.statSync(p.join(up,f)).size;if(sz>400*1024)console.warn(`⚠ ${f} pesa ${(sz/1048576).toFixed(1)} MB: súbela más ligera (JPG o WebP, ~1200 px de ancho) para que cargue rápido`)})}catch{}
if(C.adsense)W(`${OUT}/ads.txt`,`google.com, ${C.adsense.replace(/^ca-/,'')}, DIRECT, f08c47fec0942fa0\n`);
console.log(`OK: ${mods.length} mods → ${OUT}/`);
