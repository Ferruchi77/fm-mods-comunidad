/* Vista previa de la ficha dentro del panel: usa el mismo código (ficha.js) y los mismos estilos que la web publicada. */
(function(){
  const H=window.h||(window.CMS&&window.CMS.h)||(window.React&&window.React.createElement);
  if(!window.CMS||!H||!window.FMFicha){console.warn('Vista previa de la ficha no disponible');return}
  let META=null;
  fetch('/data/meta.json').then(r=>r.json()).then(m=>{META=m}).catch(()=>{});
  const Preview=({entry,getAsset})=>{
    const asset=p=>{if(!p)return p;try{const a=getAsset(p);return a?a.toString():p}catch(e){return p}};
    const raw=entry.get('data').toJS();
    raw.cover=asset(raw.cover);raw.screenshots=(raw.screenshots||[]).map(asset);
    const meta=META||{C:{url:'',email:'',x:'FMModsComunidad',reload:['FM24']},CATS:{},BADGE:{},LATEST:''};
    const F=FMFicha.make({C:meta.C,CATS:meta.CATS,BADGE:meta.BADGE,LATEST:meta.LATEST,ad:()=>''});
    const m=FMFicha.normalize(raw,entry.get('slug')||'vista-previa',null,meta.AUTHORS||{});
    return H('div',{className:'fm-preview',dangerouslySetInnerHTML:{__html:F.detail(m,{extras:''})}});
  };
  CMS.registerPreviewStyle('/css/style.css');
  CMS.registerPreviewTemplate('mods',Preview);
})();
