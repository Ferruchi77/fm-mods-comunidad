/* Lógica de la ficha de mod, compartida por build.js (Node) y por la vista previa del panel /admin (navegador).
   Así la previsualización usa exactamente el mismo código que la web publicada. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FMFicha=factory()})(typeof self!=='undefined'?self:this,function(){
'use strict';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const vk=v=>String(v).replace(/\s+/g,'');
const verYear=v=>2000+(parseInt(String(v).replace(/\D/g,''))||26);
const list=x=>x==null||x===''?[]:[].concat(x);
const iso=d=>!d?'':typeof d==='string'?d:d.toISOString?d.toISOString().slice(0,10):String(d);
let LOCALE='es-ES';const setLocale=l=>{LOCALE=l};  // idioma de las fechas (build.js lo cambia en cada idioma)
  const dt=d=>d?new Date(d).toLocaleDateString(LOCALE,{day:'numeric',month:'long',year:'numeric'}):'';
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
  // i18n: ctx.T(clave,vars) devuelve el texto en español (lo pone build.js o la vista previa). El navegador lo traduce con /js/i18n.js
  const T=ctx.T||(k=>k);
  const tx=ctx.tx||(t=>t);  // texto libre del editor en el idioma de la página (lo pone build.js; en el panel, el original)
  const pj=v=>v?` data-p="${esc(JSON.stringify(v))}"`:'';
  const I=(k,v)=>` data-i18n="${k}"${pj(v)}`;
  const S=(k,v,tag='span',cls='')=>`<${tag}${cls?` class="${cls}"`:''}${I(k,v)}>${esc(T(k,v))}</${tag}>`;
  const AM=(a,v)=>Object.entries(a).map(([n,k])=>`${n}="${esc(T(k,v))}"`).join(' ')+` data-i18n-attr="${Object.entries(a).map(([n,k])=>n+':'+k).join(';')}"${pj(v)}`;
  const catOf=s=>CATS[s]||{n:s,d:'',dir:'graphics/'};
  const trAttr=()=>''; // (antes marcaba el nombre traducido; ahora build.js escribe cada página ya en su idioma)
  const lum=h=>{const n=parseInt(h.slice(1),16);return(0.299*(n>>16)+0.587*((n>>8)&255)+0.114*(n&255))/255};
  const badge=b=>{const i=typeof BADGE[b]==='string'?{color:BADGE[b]}:(BADGE[b]||{}),hex=/^#[0-9a-f]{6}$/i.test(i.hex||'')?i.hex:'';
    return `<span class="b b-${i.color||'gris'}"${hex?` style="background:${hex};border-color:${hex};color:${lum(hex)>.55?'#111':'#fff'}"`:''}>${i.icon?esc(i.icon)+' ':''}${esc(b)}</span>`};
  const badges=m=>m.badges.map(badge).join('');
  const join=a=>a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+' y '+a[a.length-1];
  const authText=m=>join(m.auth.map(a=>a.name));
  const authHtml=m=>join(m.auth.map(a=>http(a.url)?`<a href="${esc(a.url)}" target="_blank" rel="noopener nofollow">${esc(a.name)}</a>`:esc(a.name)));
  const vchips=m=>m.vers.map(v=>`<span class="vchip${v===ctx.LATEST?' new':''}">${esc(v)}</span>`).join('');
  const compat=m=>{const L=ctx.LATEST,ok=!L||m.vers.includes(L),
    t=[ok?(L?S('compat_latest',{v:L}):S('compat_noinfo')):S('compat_warn',{v:L})];
    if(m.compat_patch)t.push(S('compat_patch',{p:m.compat_patch}));if(m.compat_note)t.push(esc(m.compat_note));
    return `<div class="compat${ok?'':' warn'}"><div class="vc">${S('compat_h',null,'strong')}${vchips(m)}</div><p>${t.join(' ')}</p></div>`};
  const reload=C.reload||['FM24'];
  const needsReload=m=>m.vers.some(v=>reload.includes(vk(v).toUpperCase()));
  // Rutas de instalación. Prioridad: 1) una ruta por versión de FM (campo install_paths) · 2) texto libre (install_path, una por línea) · 3) automática según la categoría.
  // La ruta de la categoría es libre: si parece completa (Steam…, Documents…, C:\…, «Football Manager NN») se usa tal cual, cambiando el año por el de cada versión; si no, se cuelga de la carpeta de documentos de FM.
  const isFull=d=>/^([a-z]:|\\|\/|~|%)|football manager|steamapps|documents|documentos/i.test(d);
  const forVer=(d,v)=>{const y=String(verYear(v));return d.replace(/Football Manager (\d{4}|\d{2})/gi,(_,n)=>'Football Manager '+(n.length===4?y:y.slice(-2)))};
  const autoPaths=(m,vs)=>{const dirs=[...new Set((m.cats.length?m.cats:['graficos']).map(c=>String(catOf(c).dir||'').trim()).filter(Boolean))];
    return vs.flatMap(v=>dirs.map(d=>({label:m.vers.length>1?v:'',path:isFull(d)?forVer(d,v):`Documentos/Sports Interactive/Football Manager ${verYear(v)}/${d}`})))};
  const installPaths=m=>{
    const vs=m.vers.length?m.vers:['FM26'];
    const cp=list(m.install_paths).map(x=>x&&{label:String(x.version||'').trim(),path:String(x.path||'').trim()}).filter(x=>x&&x.path&&(!x.label||m.vers.includes(x.label))).sort((a,b)=>m.vers.indexOf(a.label)-m.vers.indexOf(b.label));
    if(cp.length){const have=new Set(cp.map(x=>x.label));return [...cp,...autoPaths(m,vs.filter(v=>!have.has(v)))]}
    if(m.install_path&&String(m.install_path).trim())return String(m.install_path).split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(path=>({label:'',path}));
    return autoPaths(m,vs)};
  const hist=m=>m.upd.length?`<div class="desc">${S('hist_h',null,'h2')}<ul class="tl">${m.upd.map(u=>`<li><time datetime="${esc(u.date)}" data-d="long">${dt(u.date)}</time>${u.version?`<h3>${esc(u.version)}</h3>`:S('hist_upd',null,'h3')}${u.note?`<p>${esc(tx(u.note))}</p>`:''}</li>`).join('')}${m.date?`<li class="new"><time datetime="${esc(m.date)}" data-d="long">${dt(m.date)}</time>${S('hist_init',null,'h3')}</li>`:''}</ul></div>`:'';
  // Reportar enlace caído: correo (mailto) con asunto y cuerpo, más alternativas web por si no hay cliente de correo
  const report=m=>{const url=`${C.url}/mod/${m.slug}/`,q=encodeURIComponent,subj=`Enlace caído: ${m.title}`,
    body=`Hola,\r\n\r\nEl enlace de descarga de «${m.title}» no funciona.\r\n\r\nFicha: ${url}\r\nEnlace roto: ${m.download_url}\r\n\r\nGracias.`,
    mail=C.email&&!/tudominio/.test(C.email)?C.email:'',
    x=`https://x.com/intent/post?text=${q(`@${C.x} El enlace de «${m.title}» parece caído: ${url}`)}`,
    // el asunto y el cuerpo del correo van siempre en español: es el idioma de quien los recibe
    A=(h,t,ext,k)=>`<a${k?I(k):''} href="${esc(h)}"${ext?' target="_blank" rel="noopener"':''}>${k?esc(T(k)):t}</a>`;
    if(!mail)return `<p class="rep-w">${A(x,'',1,'rep_x')}</p>`;
    return `<p class="rep-w">${A(`mailto:${mail}?subject=${q(subj)}&body=${q(body)}`,'',0,'rep')}<span class="rep-alt"> · ${S('rep_alt')} ${A(`https://mail.google.com/mail/?view=cm&fs=1&to=${q(mail)}&su=${q(subj)}&body=${q(body)}`,'Gmail',1)} · ${A(`https://outlook.live.com/mail/0/deeplink/compose?to=${q(mail)}&subject=${q(subj)}&body=${q(body)}`,'Outlook',1)} · ${A(x,'',1,'rep_xalt')}</span></p>`};

  // Cuerpo completo de la ficha (sin cabecera ni pie de la web)
  const detail=(m,opt={})=>{
    const ad=opt.ad||ctx.ad||(()=>''),cn=m.cats.map(catOf),ips=installPaths(m),shots=[m.cover,...m.screenshots].filter(Boolean);
    const appOnly=m.cats.length>0&&m.cats.every(c=>c==='app-externa');
    const paras=esc(m.description||'').split(/\n{2,}/).map(t=>`<p>${t.replace(/\n/g,'<br>')}</p>`).join('');
    const steps=(m.instructions?String(m.instructions).split('\n').filter(Boolean).map(s=>`<li>${esc(s)}</li>`):(appOnly?['st_app1','st_app2','st_app3']:['st_def1','st_def2','st_def3',...(needsReload(m)?['st_def4']:[])]).map(k=>S(k,null,'li'))).join('');
    return `<div class="wrap"><p class="crumb"><a href="/"${I('crumb_home')}>${esc(T('crumb_home'))}</a> / ${m.cats[0]?`<a href="/?cat=${m.cats[0]}"${trAttr(cn[0])}>${esc(cn[0].n)}</a>`:S('crumb_mods')}</p>
<div class="bd">${badges(m)}</div><h1>${esc(m.title)}</h1>
<p class="catlinks">${m.cats.map((c,i)=>`<a href="/?cat=${c}"${trAttr(cn[i])}>${esc(cn[i].n)}</a>`).join('')}</p>
<p class="byline">${UI}${S('byline',null,'span','lbl')} <strong>${authHtml(m)}</strong>${m.date?`<time datetime="${esc(m.date)}" data-d="long">${dt(m.date)}</time>`:''}${m.upd[0]?`<span class="upd">${S('upd_on')} <time datetime="${esc(m.upd[0].date)}" data-d="long">${dt(m.upd[0].date)}</time>${m.upd[0].version?' ('+esc(m.upd[0].version)+')':''}</span>`:''}</p>
<div class="rate" data-rate="${m.slug}"><div class="stars" role="group" ${AM({'aria-label':'rate_aria'})}>${[1,2,3,4,5].map(n=>`<button type="button" data-star="${n}" ${AM({'aria-label':'star_aria'},{n})} aria-pressed="false">★</button>`).join('')}</div><span class="rtxt">Sé el primero en valorar</span></div>
${compat(m)}
${ad('bajo-titulo')}
<div class="det"><div>
${shots.length?`<img class="shot" id="shot" data-zoom tabindex="0" ${AM({title:'shot_title',alt:'shot_alt'},{t:m.title})} src="${esc(shots[0])}" decoding="async" fetchpriority="high" width="960" height="540">${shots.length>1?`<div class="thumbs">${shots.map((s,i)=>`<button type="button" data-src="${esc(s)}" class="${i?'':'on'}" ${AM({'aria-label':'shot_n'},{n:i+1})}><img src="${esc(s)}" alt="" loading="lazy" decoding="async" width="96" height="54"></button>`).join('')}</div>`:''}`:''}
<div class="desc">${S('desc_h',null,'h2')}${paras}${m.tags.length?`<p class="tags">${m.tags.map(t=>`<span>#${esc(t)}</span>`).join('')}</p>`:''}</div>${hist(m)}</div>
<aside><div class="box">${S('inst_h',null,'h2')}${appOnly||!ips.length?'':`${S('inst_path',null,'p','meta')}${ips.map((x,i)=>{const k=x.label?'copy_btn_ver':ips.length>1?'copy_btn_n':'copy_btn',v=x.label?{v:x.label}:ips.length>1?{n:i+1}:null;return `<div class="pr"><code class="path">${esc(x.path)}</code><button class="btn" type="button"${I(k,v)} data-copy="${esc(x.path)}">${esc(T(k,v))}</button></div>`}).join('')}`}<ol class="steps">${steps}</ol><p class="meta" style="margin:12px 0 0"><a href="/como-instalar/"${I('inst_guide')} style="text-decoration:underline">${esc(T('inst_guide'))}</a></p></div><div class="box dlbox"><a class="btn primary big" data-dlc="${m.slug}" href="${esc(m.download_url)}" target="_blank" rel="nofollow noopener noreferrer"${I('dl_btn')}>${esc(T('dl_btn'))}</a><div class="fst"><span class="fr" data-fr>★ Sin valoraciones</span><span class="fl" data-fl>👍 0</span><span class="dlc" data-dl="${m.slug}"></span></div><div class="fb"><button class="btn like" type="button" data-like="${m.slug}" aria-pressed="false">👍 ${S('like_btn')} <b></b></button></div>${ad('junto-descarga')}
${report(m)}</div>
${opt.extras||''}</aside></div></div>`;
  };
  return {trAttr,catOf,badges,authText,authHtml,vchips,compat,needsReload,installPaths,hist,report,detail};
};
return {esc,vk,verYear,dt,setLocale,UI,normalize,make};
});
