/* Mejoras de interfaz del panel:
   1) Formulario de mods en 3 pestañas.  2) Etiquetas de color de estado en la lista de mods.
   Solo cambia lo que se ve: no toca los datos que se guardan. */
(function(){
  const TABS=[
    {n:1,t:'1 · Información principal',f:['title','status','categories','fm_versions','badges','featured','tags','compat_patch','compat_note','date','modified']},
    {n:2,t:'2 · Autores y enlaces',f:['authors','download_url']},
    {n:3,t:'3 · Contenido y multimedia',f:['cover','screenshots','description','install_path','instructions','updates']}
  ];
  const q=(s,r)=>(r||document).querySelector(s);
  const inForm=()=>/#\/collections\/mods\/(new|entries\/)/.test(location.hash);
  const fieldEl=n=>q('[id^="'+n+'-field-"]');
  let cur=1,raf=0;

  // contenedor de un campo = el ancestro más alto que no contiene a ningún otro campo
  const boxOf=(el,others)=>{let e=el,p;while((p=e.parentElement)&&!others.some(o=>o!==el&&p.contains(o)))e=p;return e};

  function tabs(){
    const body=document.body;
    if(!inForm()){const b=q('.fm-tabs');if(b)b.remove();delete body.dataset.fmTab;return}
    const found=[];
    TABS.forEach(t=>t.f.forEach(n=>{const el=fieldEl(n);if(el)found.push({n,t:t.n,el})}));
    if(!found.length)return;
    const els=found.map(x=>x.el),boxes={};
    found.forEach(x=>{const b=boxOf(x.el,els);b.dataset.fmt=x.t;(boxes[x.t]=boxes[x.t]||[]).push(b)});
    body.dataset.fmTab=cur;
    let bar=q('.fm-tabs');
    if(!bar){
      bar=document.createElement('div');bar.className='fm-tabs';bar.setAttribute('role','tablist');
      bar.innerHTML=TABS.map(t=>'<button type="button" role="tab" data-t="'+t.n+'">'+t.t+'</button>').join('');
      bar.addEventListener('click',e=>{const b=e.target.closest('button[data-t]');if(b)go(+b.dataset.t)});
      const first=boxes[1]&&boxes[1][0];if(first&&first.parentElement)first.parentElement.insertBefore(bar,first);
    }
    TABS.forEach(t=>{const b=q('button[data-t="'+t.n+'"]',bar);if(!b)return;
      b.classList.toggle('on',t.n===cur);b.setAttribute('aria-selected',t.n===cur);
      b.classList.toggle('err',(boxes[t.n]||[]).some(x=>q('[class*="ControlError"]',x)))});
  }
  function go(n){cur=n;document.body.dataset.fmTab=n;tabs();window.scrollTo({top:0})}

  // Si al guardar hay un campo obligatorio vacío en otra pestaña, salta a ella
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||!inForm())return;
    if(!/guardar|publicar|save|publish|actualiz/i.test(b.textContent))return;
    setTimeout(()=>{tabs();const bad=q('.fm-tabs button.err');if(bad&&!bad.classList.contains('on'))go(+bad.dataset.t)},500);
  },true);
  window.addEventListener('hashchange',()=>{cur=1});

  // Lista de mods: etiqueta de color según el estado
  const ST=[['borrador','draft','Borrador / En revisión'],['revisi','draft','Borrador / En revisión'],['pendiente','pend','Pendiente de actualización'],['incompatible','inc','Incompatible'],['publicado','pub','Publicado']];
  function list(){
    document.querySelectorAll('a[href*="#/collections/mods/entries/"],a[href*="/collections/mods/entries/"]').forEach(a=>{
      if(a.dataset.fmDone===a.textContent)return;a.dataset.fmDone=a.textContent;
      const t=a.textContent.toLowerCase(),s=ST.find(x=>t.includes(x[0]));
      if(s){a.dataset.fmSt=s[1];a.dataset.fmLbl=s[2]}else{delete a.dataset.fmSt;delete a.dataset.fmLbl}
    });
  }
  const run=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{try{tabs();list()}catch(e){console.warn('ui.js',e)}})};
  new MutationObserver(run).observe(document.body,{childList:true,subtree:true,characterData:true});
  run();
})();
