/* Multi-idioma del lado del cliente.
   · Los diccionarios viven en /locales/*.json; build.js los incrusta delante de este archivo (window.FM_DICT).
   · El HTML se genera en español (SEO y fallback sin JS). Aquí se traduce lo marcado con:
       data-i18n="clave"              → textContent
       data-i18n-html="clave"         → innerHTML (solo textos propios con <b>/<a>)
       data-i18n-attr="attr:clave;…"  → atributos (placeholder, aria-label, title, alt…)
       data-p='{"n":3}'               → variables {n} del texto
       <time datetime data-d="long|short">  → fecha con el formato del idioma
       data-tr='{"es":"…","en":"…"}'  → nombre traducido (categorías del CMS); si falta el idioma, se queda el español
   · El idioma elegido se guarda en localStorage (fm_lang). Sin elección, se usa el del navegador y, si no, español. */
(()=>{
const LANGS=[['es','Español'],['en','English'],['ca','Català'],['fr','Français'],['pt','Português']];
const LOC={es:'es-ES',en:'en-GB',ca:'ca-ES',fr:'fr-FR',pt:'pt-BR'};
const D=window.FM_DICT||{};
const ok=l=>LANGS.some(x=>x[0]===l);
const stored=()=>{try{return localStorage.getItem('fm_lang')}catch{return null}};
// Prioridad: ?lang=xx del enlace (se recuerda) > elección guardada > idioma del navegador > español
const urlLang=()=>{try{const l=new URLSearchParams(location.search).get('lang');return ok(l)?l:null}catch{return null}};
const detect=()=>{const u=urlLang();if(u){try{localStorage.setItem('fm_lang',u)}catch{}return u}const s=stored();if(ok(s))return s;
  for(const n of (navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''])){const l=String(n).slice(0,2).toLowerCase();if(ok(l))return l}
  return 'es'};
let lang=detect();
const fmt=(s,v)=>String(s).replace(/\{(\w+)\}/g,(_,k)=>v&&v[k]!=null?v[k]:'');
const t=(k,v)=>{const s=(D[lang]&&D[lang][k])??(D.es&&D.es[k]);return s==null?k:fmt(s,v)};
// plural sencillo: clave_one si n===1, clave_other en el resto
const tp=(k,n,v)=>t(k+(n===1?'_one':'_other'),{n,...v});
const pv=e=>{try{return e.dataset.p?JSON.parse(e.dataset.p):null}catch{return null}};
const DATE={long:{day:'numeric',month:'long',year:'numeric'},short:{day:'numeric',month:'short',year:'numeric'}};
const date=(d,kind)=>{const x=new Date(d);return isNaN(x)?'':x.toLocaleDateString(LOC[lang],DATE[kind||'long'])};

const apply=(root=document)=>{
  root.querySelectorAll('[data-i18n]').forEach(e=>{e.textContent=t(e.dataset.i18n,pv(e))});
  root.querySelectorAll('[data-i18n-html]').forEach(e=>{e.innerHTML=t(e.dataset.i18nHtml,pv(e))});
  root.querySelectorAll('[data-i18n-attr]').forEach(e=>{const v=pv(e);e.dataset.i18nAttr.split(';').forEach(p=>{const[a,k]=p.split(':');if(a&&k)e.setAttribute(a,t(k,v))})});
  root.querySelectorAll('[data-tr]').forEach(e=>{try{const m=JSON.parse(e.dataset.tr);e.textContent=m[lang]||m.es||e.textContent}catch{}});
  root.querySelectorAll('time[data-d]').forEach(e=>{const s=date(e.getAttribute('datetime'),e.dataset.d);if(s)e.textContent=(e.dataset.pre||'')+s});
  document.documentElement.lang=lang;
  ui()};

// Selector de idioma (cabecera)
const box=()=>document.getElementById('lang');
const ui=()=>{const b=box();if(!b)return;
  const c=b.querySelector('.lcode');if(c)c.textContent=lang.toUpperCase();
  b.querySelectorAll('[data-lang]').forEach(x=>{const on=x.dataset.lang===lang;x.classList.toggle('on',on);if(on)x.setAttribute('aria-current','true');else x.removeAttribute('aria-current')})};
const menu=(open)=>{const b=box();if(!b)return;const m=b.querySelector('.lmenu'),btn=b.querySelector('.lbtn');
  m.hidden=!open;btn.setAttribute('aria-expanded',open)};
const set=l=>{if(!ok(l))return;lang=l;try{localStorage.setItem('fm_lang',l)}catch{}
  try{const u=new URL(location.href);if(u.searchParams.has('lang')){u.searchParams.set('lang',l);history.replaceState(null,'',u)}}catch{}
  apply();window.dispatchEvent(new CustomEvent('fm:lang',{detail:l}))};

const b=box();
if(b){
  const btn=b.querySelector('.lbtn');
  btn.addEventListener('click',()=>menu(b.querySelector('.lmenu').hidden));
  b.addEventListener('click',async e=>{
    const sh=e.target.closest('[data-share]');
    if(sh){const u=new URL(location.href);u.searchParams.set('lang',lang);u.hash='';
      try{await navigator.clipboard.writeText(u.href)}catch{const a=document.createElement('textarea');a.value=u.href;document.body.append(a);a.select();try{document.execCommand('copy')}catch{}a.remove()}
      sh.textContent=t('lang_copied');clearTimeout(sh._t);sh._t=setTimeout(()=>{sh.textContent=t('lang_share')},1600);return}
    const x=e.target.closest('[data-lang]');if(x){set(x.dataset.lang);menu(false);btn.focus()}});
  document.addEventListener('click',e=>{if(!e.target.closest('#lang'))menu(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!b.querySelector('.lmenu').hidden){menu(false);btn.focus()}});
}
// Sin elección previa y con idioma de navegador distinto de «es», se traduce al cargar; en español el HTML ya está listo.
if(lang!=='es')apply();else ui();

window.FMi18n={t,tp,set,date,apply,get lang(){return lang},get locale(){return LOC[lang]},LANGS};
})();
