/* Cliente de idiomas. Cada idioma tiene su propia URL y las páginas ya llegan traducidas (build.js):
     /  (español) · /en/ · /ca/ · /fr/ · /pt-br/ · /it/
   Aquí solo queda lo que necesita el navegador:
     · t / tp / date / base → para los textos que genera app.js (contadores, buscador, valoraciones…)
     · el menú del selector de idioma (los idiomas son enlaces normales)
     · recordar el idioma elegido (localStorage fm_lang): al abrir la portada en español se salta al idioma guardado */
(()=>{
const D=window.FM_DICT||{},LM=window.FM_LM||{es:{slug:'',html:'es',loc:'es-ES'}};
const h=document.documentElement.lang||'es';
const lang=Object.keys(LM).find(k=>LM[k].html===h)||'es';
const base=LM[lang].slug?'/'+LM[lang].slug:'';
const fmt=(s,v)=>String(s).replace(/\{(\w+)\}/g,(_,k)=>v&&v[k]!=null?v[k]:'');
const t=(k,v)=>{const s=(D[lang]&&D[lang][k])??(D.es&&D.es[k]);return s==null?k:fmt(s,v)};
// plural sencillo: clave_one si n===1, clave_other en el resto
const tp=(k,n,v)=>t(k+(n===1?'_one':'_other'),{n,...v});
const date=(d,kind)=>{const x=new Date(d);return isNaN(x)?'':x.toLocaleDateString(LM[lang].loc,kind==='short'?{day:'numeric',month:'short',year:'numeric'}:{day:'numeric',month:'long',year:'numeric'})};

const b=document.getElementById('lang');
if(b){
  const btn=b.querySelector('.lbtn'),menu=b.querySelector('.lmenu');
  const open=o=>{menu.hidden=!o;btn.setAttribute('aria-expanded',o)};
  btn.addEventListener('click',()=>open(menu.hidden));
  // al elegir un idioma se guarda (también «Español», para dejar de saltar a otro)
  menu.addEventListener('click',e=>{const a=e.target.closest('[data-lang]');if(a)try{localStorage.setItem('fm_lang',a.dataset.lang)}catch{}});
  document.addEventListener('click',e=>{if(!e.target.closest('#lang'))open(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){open(false);btn.focus()}});
}
window.FMi18n={t,tp,date,base,get lang(){return lang},get locale(){return LM[lang].loc},LM};
})();
