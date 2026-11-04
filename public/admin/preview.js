/* Vista previa de la ficha dentro del panel: mismo código (ficha.js) y estilos que la web, más:
   · avisos de campos obligatorios, enlaces rotos y miniaturas de imágenes comprobadas en vivo. */
(function(){
  const H=window.h||(window.CMS&&window.CMS.h)||(window.React&&window.React.createElement);
  if(!window.CMS||!H||!window.FMFicha){console.warn('Vista previa de la ficha no disponible');return}
  let META=null;
  fetch('/data/meta.json').then(r=>r.json()).then(m=>{META=m}).catch(()=>{});
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isUrl=u=>/^https?:\/\/[^\s/$.?#][^\s]*$/i.test(u);
  const isImg=u=>isUrl(u)||/^(\/|blob:|data:image)/i.test(u);
  const host=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return u}};
  const TXT={pending:'⏳ Comprobando si el servidor responde…',ok:'✓ El servidor responde (no se puede comprobar si el archivo existe)',bad:'⚠ El servidor no responde: el enlace puede estar caído o mal escrito'};
  // Comprobación de enlaces: una petición «no-cors» solo falla si el servidor no existe / no responde
  const CK=window.FMLK=window.FMLK||new Map();
  const probe=u=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),7000);return fetch(u,{mode:'no-cors',cache:'no-store',signal:c.signal}).then(()=>'ok',()=>'bad').finally(()=>clearTimeout(t))};
  const paint=(el,st)=>{el.className='fmx-st fmx-'+st;el.textContent=TXT[st]};
  window.FMLinkCheck=function(img){
    const d=img.ownerDocument,all=()=>d.querySelectorAll('[data-u]');
    all().forEach(el=>{const u=el.getAttribute('data-u'),st=CK.get(u);
      paint(el,st||'pending');
      if(!st){CK.set(u,'pending');probe(u).then(r=>{CK.set(u,r);all().forEach(e=>e.getAttribute('data-u')===u&&paint(e,r))})}});
  };
  const GIF='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const row=(label,u,required)=>{
    if(!u)return required?`<li class="fmx-row bad"><b>${label}</b><span>⛔ Falta el enlace</span></li>`:'';
    if(!isUrl(u))return `<li class="fmx-row bad"><b>${label}</b><span>⛔ No es una URL válida (debe empezar por http:// o https://): <code>${esc(u)}</code></span></li>`;
    const st=CK.get(u)||'pending';
    return `<li class="fmx-row"><b>${label}</b><a href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))}</a><span class="fmx-st fmx-${st}" data-u="${esc(u)}">${TXT[st]}</span></li>`};
  const thumb=(label,u)=>{
    if(!u)return '';
    if(!isImg(u))return `<figure class="fmx-img bad"><div class="fmx-ph">⛔</div><figcaption>${label}<span class="s-bad">URL no válida: <code>${esc(u)}</code></span></figcaption></figure>`;
    return `<figure class="fmx-img"><img src="${esc(u)}" alt="" onload="this.parentNode.classList.add('ok')" onerror="this.parentNode.classList.add('bad')"><figcaption>${label}<span class="s-ok">✓ Carga bien</span><span class="s-bad">✕ No carga: revisa la URL</span></figcaption></figure>`};

  const panel=(raw,m)=>{
    const miss=[];
    if(!String(raw.title||'').trim())miss.push('Título');
    if(!m.cats.length)miss.push('Categoría');
    if(!m.vers.length)miss.push('al menos una Versión de FM');
    if(!String(raw.download_url||'').trim())miss.push('Enlace de descarga');
    else if(!isUrl(String(raw.download_url).trim()))miss.push('Enlace de descarga válido (http:// o https://)');
    if(!String(raw.description||'').trim())miss.push('Descripción');
    const st=String(raw.status||'');
    let h='<div class="fmx">';
    h+=miss.length?`<div class="fmx-alert err"><b>⛔ Ficha incompleta: no se podrá guardar.</b> Falta: ${miss.map(esc).join(' · ')}.</div>`
                  :'<div class="fmx-alert ok">✓ Campos obligatorios completos</div>';
    if(/borrador|revisi[oó]n/i.test(st))h+='<div class="fmx-alert warn">🟡 Estado «Borrador / En revisión»: esta ficha <b>no se publicará</b> en la web.</div>';
    else if(/pendiente/i.test(st))h+='<div class="fmx-alert bad">🔴 Estado «Pendiente de actualización».</div>';
    else if(/incompatible/i.test(st))h+='<div class="fmx-alert gray">⚪ Estado «Incompatible».</div>';
    h+='<ul class="fmx-links">'+row('Descarga',String(raw.download_url||'').trim(),true)
      +m.auth.map(a=>row('Autor: '+esc(a.name),a.url,false)).join('')+'</ul>';
    const th=thumb('Portada',raw.cover)+(raw.screenshots||[]).map((u,i)=>thumb('Captura '+(i+1),u)).join('');
    if(th)h+='<div class="fmx-imgs">'+th+'</div>';
    // dispara la comprobación de enlaces dentro del iframe de la vista previa
    h+=`<img src="${GIF}" alt="" width="1" height="1" style="position:absolute;opacity:0" onload="parent.FMLinkCheck&&parent.FMLinkCheck(this)">`;
    return h+'</div>';
  };

  const Preview=({entry,getAsset})=>{
    const asset=p=>{if(!p)return p;try{const a=getAsset(p);return a?a.toString():p}catch(e){return p}};
    const raw=entry.get('data').toJS();
    raw.cover=asset(raw.cover);raw.screenshots=(raw.screenshots||[]).map(asset);
    const meta=META||{C:{url:'',email:'',x:'FMModsComunidad',reload:['FM24']},CATS:{},BADGE:{},LATEST:''};
    const T=(k,v)=>String((meta.ES||{})[k]??k).replace(/\{(\w+)\}/g,(_,n)=>v&&v[n]!=null?v[n]:'');
    const F=FMFicha.make({C:meta.C,CATS:meta.CATS,BADGE:meta.BADGE,LATEST:meta.LATEST,ad:()=>'',T});
    const m=FMFicha.normalize(raw,entry.get('slug')||'vista-previa',null,meta.AUTHORS||{});
    return H('div',{className:'fm-preview',dangerouslySetInnerHTML:{__html:panel(raw,m)+F.detail(m,{extras:''})}});
  };
  CMS.registerPreviewStyle('/css/style.css');
  CMS.registerPreviewStyle('/admin/preview.css');
  CMS.registerPreviewTemplate('mods',Preview);
})();
