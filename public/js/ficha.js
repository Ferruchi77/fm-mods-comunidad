/* Lógica de la ficha de mod, compartida por build.js (Node) y por la vista previa del panel /admin (navegador).
   Así la previsualización usa exactamente el mismo código que la web publicada. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FMFicha=factory()})(typeof self!=='undefined'?self:this,function(){
'use strict';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const vk=v=>String(v).replace(/\s+/g,'');
const verYear=v=>2000+(parseInt(String(v).replace(/\D/g,''))||26);
const list=x=>x==null||x===''?[]:[].concat(x);
const iso=d=>!d?'':typeof d==='string'?d:d.toISOString?d.toISOString().slice(0,10):String(d);
const dt=d=>d?new Date(d).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}):'';
const UI='<svg class="ui" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z"/></svg>';
const http=u=>/^https?:\/\//i.test(String(u||''));

// Datos crudos de la ficha (JSON del CMS) -> estructura lista para pintar. Acepta fichas antiguas (author/category/fm_version).
const normalize=(raw,slug,warn,db)=>{
  const m={...raw,slug};
  m.date=iso(m.date);m.tags=list(m.tags);m.badges=list(m.badges);if((m.featured===true||m.featured==='true')&&!m.badges.includes('Imprescindible'))m.badges.push('Imprescindible');m.screenshots=list(m.screenshots).filter(Boolean);
  m.cats=list(m.categories||m.category);m.vers=list(m.fm_versions||m.fm_version).filter(v=>String(v).replace(/\s+/g,'').toUpperCase()!=='FM25').sort();
  // Cada autor puede venir de la lista global (campo ref) y/o escrito a mano; lo escrito a mano manda. Resultado: siempre {name,url}.
  const A=list(m.authors).map(a=>{if(typeof a==='string')return{name:a};if(!a)return null;const d=a.ref&&db&&db[a.ref];if(a.ref&&!d&&warn&&!String(a.name||'').trim())warn(`⚠ ${slug}: el autor "${a.ref}" ya no existe en Autores`);const name=String(a.name||'').trim()||(d&&d.name)||'',url=String(a.url||'').trim()||(d&&d.url)||'';return{name,url}}).filter(a=>a&&a.name);
  m.auth=A.length?A:[m.author?{name:m.author,url:m.author_url}:{name:'Autor desconocido'}];
  m.upd=list(m.updates).map(u=>u&&{...u,date:iso(u.date)}).filter(u=>{const ok=u&&u.date&&!isNaN(new Date(u.date));if(!ok&&warn)warn(`⚠ ${slug}: hay una actualización sin fecha válida y se ha ignorado`);return ok}).sort((a,b)=>new Date(b.date)-new Date(a.date));
  return m;
};

const make=ctx=>{
  const {C,CATS,BADGE}=ctx;
  const catOf=s=>CATS[s]||{n:s,d:'',dir:'graphics/'};
  const lum=h=>{const n=parseInt(h.slice(1),16);return(0.299*(n>>16)+0.587*((n>>8)&255)+0.114*(n&255))/255};
  const badge=b=>{const i=typeof BADGE[b]==='string'?{color:BADGE[b]}:(BADGE[b]||{}),hex=/^#[0-9a-f]{6}$/i.test(i.hex||'')?i.hex:'';
    return `<span class="b b-${i.color||'gris'}"${hex?` style="background:${hex};border-color:${hex};color:${lum(hex)>.55?'#111':'#fff'}"`:''}>${i.icon?esc(i.icon)+' ':''}${esc(b)}</span>`};
  const badges=m=>m.badges.map(badge).join('');
  const join=a=>a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+' y '+a[a.length-1];
  const authText=m=>join(m.auth.map(a=>a.name));
  const authHtml=m=>join(m.auth.map(a=>http(a.url)?`<a href="${esc(a.url)}" target="_blank" rel="noopener nofollow">${esc(a.name)}</a>`:esc(a.name)));
  const vchips=m=>m.vers.map(v=>`<span class="vchip${v===ctx.LATEST?' new':''}">${esc(v)}</span>`).join('');
  const compat=m=>{const L=ctx.LATEST,ok=!L||m.vers.includes(L),t=[ok?(L?`Compatible con ${L}, la versión más reciente del juego.`:'Compatibilidad indicada por el autor.'):`Este mod no está marcado como compatible con ${L}, la versión más reciente. Puede no funcionar en ella.`];
    if(m.compat_patch)t.push(`Probado con el parche ${m.compat_patch}.`);if(m.compat_note)t.push(m.compat_note);
    return `<div class="compat${ok?'':' warn'}"><div class="vc"><strong>Compatibilidad</strong>${vchips(m)}</div><p>${esc(t.join(' '))}</p></div>`};
  const reload=C.reload||['FM24'];
  const needsReload=m=>m.vers.some(v=>reload.includes(vk(v).toUpperCase()));
  const installPaths=m=>m.install_path&&String(m.install_path).trim()?String(m.install_path).split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(path=>({label:'',path})):
    (m.vers.length?m.vers:['FM26']).flatMap(v=>[...new Set((m.cats.length?m.cats:['graficos']).map(c=>catOf(c).dir))].map(d=>({label:m.vers.length>1?v:'',path:`Documentos/Sports Interactive/Football Manager ${verYear(v)}/${d}`})));
  const hist=m=>m.upd.length?`<div class="desc"><h2>Historial de versiones</h2><ul class="tl">${m.upd.map(u=>`<li><time datetime="${esc(u.date)}">${dt(u.date)}</time><h3>${u.version?esc(u.version):'Actualización'}</h3>${u.note?`<p>${esc(u.note)}</p>`:''}</li>`).join('')}${m.date?`<li class="new"><time datetime="${esc(m.date)}">${dt(m.date)}</time><h3>Publicación inicial</h3></li>`:''}</ul></div>`:'';
  // Reportar enlace caído: correo (mailto) con asunto y cuerpo, más alternativas web por si no hay cliente de correo
  const report=m=>{const url=`${C.url}/mod/${m.slug}/`,q=encodeURIComponent,subj=`Enlace caído: ${m.title}`,
    body=`Hola,\r\n\r\nEl enlace de descarga de «${m.title}» no funciona.\r\n\r\nFicha: ${url}\r\nEnlace roto: ${m.download_url}\r\n\r\nGracias.`,
    mail=C.email&&!/tudominio/.test(C.email)?C.email:'',
    x=`https://x.com/intent/post?text=${q(`@${C.x} El enlace de «${m.title}» parece caído: ${url}`)}`,
    A=(h,t,ext)=>`<a href="${esc(h)}"${ext?' target="_blank" rel="noopener"':''}>${t}</a>`;
    if(!mail)return `<p class="rep-w">${A(x,'Reportar enlace caído (por X)',1)}</p>`;
    return `<p class="rep-w">${A(`mailto:${mail}?subject=${q(subj)}&body=${q(body)}`,'Reportar enlace caído')}<span class="rep-alt"> · ¿No se abre tu correo? ${A(`https://mail.google.com/mail/?view=cm&fs=1&to=${q(mail)}&su=${q(subj)}&body=${q(body)}`,'Gmail',1)} · ${A(`https://outlook.live.com/mail/0/deeplink/compose?to=${q(mail)}&subject=${q(subj)}&body=${q(body)}`,'Outlook',1)} · ${A(x,'Avisar por X',1)}</span></p>`};

  // Cuerpo completo de la ficha (sin cabecera ni pie de la web)
  const detail=(m,opt={})=>{
    const ad=opt.ad||ctx.ad||(()=>''),cn=m.cats.map(catOf),ips=installPaths(m),shots=[m.cover,...m.screenshots].filter(Boolean);
    const appOnly=m.cats.length>0&&m.cats.every(c=>c==='app-externa');
    const paras=esc(m.description||'').split(/\n{2,}/).map(t=>`<p>${t.replace(/\n/g,'<br>')}</p>`).join('');
    const steps=(m.instructions?String(m.instructions).split('\n').filter(Boolean):appOnly?['Descarga el archivo.','Descomprímelo.','Instala el ejecutable (.exe).']:['Descarga el archivo y descomprímelo.','Abre la carpeta de destino (copia la ruta con el botón).','Si la carpeta no existe, créala y pega dentro los archivos del mod.',...(needsReload(m)?['Abre Football Manager y recarga el skin o la caché de gráficos desde Preferencias (solo si es FM24).']:[])]).map(s=>`<li>${esc(s)}</li>`).join('');
    return `<div class="wrap"><p class="crumb"><a href="/">Inicio</a> / ${m.cats[0]?`<a href="/?cat=${m.cats[0]}">${esc(cn[0].n)}</a>`:'Mods'}</p>
<div class="bd">${badges(m)}</div><h1>${esc(m.title)}</h1>
<p class="catlinks">${m.cats.map((c,i)=>`<a href="/?cat=${c}">${esc(cn[i].n)}</a>`).join('')}</p>
<p class="byline">${UI}<span class="lbl">Creado por</span> <strong>${authHtml(m)}</strong>${m.date?`<time datetime="${esc(m.date)}">${dt(m.date)}</time>`:''}${m.upd[0]?`<span class="upd">Actualizado el ${dt(m.upd[0].date)}${m.upd[0].version?' ('+esc(m.upd[0].version)+')':''}</span>`:''}</p>
<div class="rate" data-rate="${m.slug}"><div class="stars" role="group" aria-label="Valora este mod de 1 a 5 estrellas">${[1,2,3,4,5].map(n=>`<button type="button" data-star="${n}" aria-label="${n} de 5 (mitad izquierda: media estrella)" aria-pressed="false">★</button>`).join('')}</div><span class="rtxt">Sé el primero en valorar</span></div>
${compat(m)}
${ad('bajo-titulo')}
<div class="det"><div>
${shots.length?`<img class="shot" id="shot" data-zoom tabindex="0" title="Pulsa para ampliar" src="${esc(shots[0])}" alt="Captura de ${esc(m.title)}" decoding="async" fetchpriority="high" width="960" height="540">${shots.length>1?`<div class="thumbs">${shots.map((s,i)=>`<button type="button" data-src="${esc(s)}" class="${i?'':'on'}" aria-label="Ver captura ${i+1}"><img src="${esc(s)}" alt="" loading="lazy" decoding="async" width="96" height="54"></button>`).join('')}</div>`:''}`:''}
<div class="desc"><h2>Descripción</h2>${paras}${m.tags.length?`<p class="tags">${m.tags.map(t=>`<span>#${esc(t)}</span>`).join('')}</p>`:''}</div>${hist(m)}</div>
<aside><div class="box"><h2>Instalación</h2>${appOnly?'':`<p class="meta">Ruta predeterminada de pegado:</p>${ips.map(x=>`${x.label?`<p class="meta pl">${esc(x.label)}</p>`:''}<code class="path">${esc(x.path)}</code><button class="btn" type="button" data-copy="${esc(x.path)}">Copiar ruta de instalación</button>`).join('')}`}<ol class="steps">${steps}</ol><p class="meta" style="margin:12px 0 0"><a href="/como-instalar/" style="text-decoration:underline">¿Primera vez? Lee la guía completa de instalación</a></p></div><div class="box dlbox"><a class="btn primary big" data-dlc="${m.slug}" href="${esc(m.download_url)}" target="_blank" rel="nofollow noopener noreferrer">Descargar mod</a><div class="fst"><span class="fr" data-fr>★ Sin valoraciones</span><span class="fl" data-fl>👍 0</span><span class="dlc" data-dl="${m.slug}"></span></div><div class="fb"><button class="btn like" type="button" data-like="${m.slug}" aria-pressed="false">👍 <span>Me gusta</span> <b></b></button></div>${ad('junto-descarga')}
${report(m)}</div>
${opt.extras||''}</aside></div></div>`;
  };
  return {catOf,badges,authText,authHtml,vchips,compat,needsReload,installPaths,hist,report,detail};
};
return {esc,vk,verYear,dt,UI,normalize,make};
});
