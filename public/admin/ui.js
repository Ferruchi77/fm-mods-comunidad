/* Mejoras de interfaz del panel:
   1) Formulario de mods en 3 pestañas.  2) Etiquetas de color de estado en la lista de mods.
   Solo cambia lo que se ve: no toca los datos que se guardan. */
(function(){
  const TABS=[
    {n:1,t:'1 · Información principal',f:['title','card_text','status','categories','fm_versions','badges','featured','tags','compat_patch','compat_note','date','modified']},
    {n:2,t:'2 · Autores y enlaces',f:['authors','download_url']},
    {n:3,t:'3 · Contenido y multimedia',f:['cover','screenshots','description','install_path','install_paths','instructions','updates']}
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
  // Aviso flotante de error: Decap solo dice «falta un campo obligatorio». Aquí se añade QUÉ campos faltan y en qué pestaña.
  const clean=s=>String(s||'').replace(/\*/g,'').replace(/\s*\([^)]*\)/g,'').replace(/\s+/g,' ').trim();
  function missingList(){
    const out=[],seen=new Set();
    document.querySelectorAll('[class*="ControlErrorsList"] li').forEach(li=>{
      const top=li.closest('[class*="ControlTopbar"]'),lab=top&&top.querySelector('label'),name=clean(lab&&lab.textContent)||'Campo';
      const txt=li.textContent.trim(),req=/obligatori|required|empty/i.test(txt),tab=(li.closest('[data-fmt]')||{dataset:{}}).dataset.fmt;
      const msg=req?name:name+': '+clean(txt.replace(lab?lab.textContent:'','')).replace(/^[:\s-]+/,'');
      const key=msg+'|'+tab;if(seen.has(key))return;seen.add(key);out.push({msg,tab,req})});
    return out}
  function toasts(){
    let shown=false;
    document.querySelectorAll('.Toastify__toast--error').forEach(t=>{
      if(t.dataset.fmDone){return}
      const body=t.querySelector('.Toastify__toast-body');if(!body)return;
      if(!/obligatori|required field|campo/i.test(body.textContent))return;
      if(shown){t.style.display='none';t.dataset.fmDone='dup';return}   // Decap lanza el mismo aviso varias veces
      const L=missingList();if(!L.length)return;
      shown=true;t.dataset.fmDone='1';
      const d=document.createElement('div');d.className='fm-miss';
      d.innerHTML='<b>Falta por revisar ('+L.length+'):</b><ul>'+L.map(x=>'<li>'+x.msg.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+(x.tab?' <i>· pestaña '+x.tab+'</i>':'')+'</li>').join('')+'</ul>';
      body.appendChild(d)});
  }
  // Insignia de versión del proyecto (sale de /data/meta.json)
  fetch('/data/meta.json').then(r=>r.json()).then(m=>{if(!m.version)return;const v=document.createElement('div');v.className='fm-ver';v.textContent='Panel '+m.version;document.body.appendChild(v)}).catch(()=>{});
  const run=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{try{tabs();list();toasts()}catch(e){console.warn('ui.js',e)}})};
  new MutationObserver(run).observe(document.body,{childList:true,subtree:true,characterData:true});
  run();
})();
