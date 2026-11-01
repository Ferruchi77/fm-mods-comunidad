(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const q=$('#q'),grid=$('#grid'),norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const th=$('#theme');
if(th){const cur=()=>document.documentElement.getAttribute('data-theme')==='light'?'light':'dark';
  const sync=()=>{const l=cur()==='light';th.setAttribute('aria-label',l?'Cambiar a modo oscuro':'Cambiar a modo claro');th.title=th.getAttribute('aria-label')};
  sync();th.addEventListener('click',()=>{const t=cur()==='light'?'dark':'light';document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('fm_theme',t)}catch{}sync()})}
if(grid){
  const cards=$$('.card',grid),empty=$('#empty'),u=new URLSearchParams(location.search);
  const sel=$('#ver'),cnt=$('#count'),rs=$('#reset');let cat=u.get('cat')||'';sel.value=u.get('ver')||'';q.value=u.get('q')||'';
  const apply=()=>{const t=norm(q.value.trim());let n=0;
    cards.forEach(c=>{const ok=(!cat||c.dataset.c.split(' ').includes(cat))&&(!sel.value||c.dataset.v.split(' ').includes(sel.value))&&(!t||c.dataset.t.includes(t));c.hidden=!ok;n+=ok});
    empty.hidden=n>0;cnt.textContent=n+(n===1?' mod':' mods');rs.hidden=!(cat||sel.value||q.value.trim());
    $$('[data-cat]').forEach(b=>b.classList.toggle('on',b.dataset.cat===cat));
    const s=new URLSearchParams();if(cat)s.set('cat',cat);if(q.value.trim())s.set('q',q.value.trim());if(sel.value)s.set('ver',sel.value);
    history.replaceState(null,'',s.toString()?'?'+s:location.pathname)};
  q.addEventListener('input',apply);sel.addEventListener('change',apply);rs.addEventListener('click',()=>{cat='';q.value='';sel.value='';apply()});
  q.form.addEventListener('submit',e=>{e.preventDefault();apply();$('#ultimos').scrollIntoView()});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;e.preventDefault();cat=b.dataset.cat;apply();if(b.tagName==='A')$('#ultimos').scrollIntoView()});
  apply();
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-copy]');
  if(b){try{await navigator.clipboard.writeText(b.dataset.copy)}catch{const t=document.createElement('textarea');t.value=b.dataset.copy;document.body.append(t);t.select();document.execCommand('copy');t.remove()}
    const o=b.textContent;b.textContent='¡Ruta copiada!';b.classList.add('ok');setTimeout(()=>{b.textContent=o;b.classList.remove('ok')},1800)}
  const t=e.target.closest('.thumbs button');
  if(t){$('#shot').src=t.dataset.src;$$('.thumbs button').forEach(x=>x.classList.toggle('on',x===t))}
});
$$('.rail-w').forEach(w=>{const r=$('.rail',w),p=$('.prev',w),n=$('.next',w);
  const up=()=>{p.hidden=r.scrollLeft<8;n.hidden=r.scrollLeft+r.clientWidth>=r.scrollWidth-8};
  p.onclick=()=>r.scrollBy({left:-r.clientWidth*.8,behavior:'smooth'});n.onclick=()=>r.scrollBy({left:r.clientWidth*.8,behavior:'smooth'});
  r.addEventListener('scroll',up,{passive:true});addEventListener('resize',up);up()});
// Me gusta, descargas y valoraciones. Los controles se ven siempre y el voto se guarda en el navegador;
// los totales de la comunidad se sincronizan con /api/stats cuando el servicio responde.
const ls={get:(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const post=(slug,action,extra={})=>fetch('/api/stats',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,action,...extra}),keepalive:true}).then(r=>r.ok?r.json():null).catch(()=>null);
const fmt=n=>new Intl.NumberFormat('es').format(n);
const likeBtn=$('[data-like]'),dlLink=$('[data-dlc]'),rb=$('[data-rate]');
let S={},hov=0;
const stat=slug=>({likes:0,downloads:0,ratingSum:0,ratingCount:0,...(S[slug]||{})});
const avg=s=>(s.ratingSum/s.ratingCount).toFixed(1).replace('.',',');
const renderCards=()=>$$('[data-s]').forEach(el=>{const s=stat(el.dataset.s),t=[];
  if(s.downloads)t.push('↓ '+fmt(s.downloads));if(s.likes)t.push('👍 '+fmt(s.likes));if(s.ratingCount)t.push('★ '+avg(s)+' ('+s.ratingCount+')');
  el.textContent=t.join('   ');el.hidden=!t.length});
const renderDetail=()=>{
  if(likeBtn){const slug=likeBtn.dataset.like,s=stat(slug),on=ls.get('fm_likes',[]).includes(slug),d=$('[data-dl]');
    likeBtn.classList.toggle('on',on);likeBtn.setAttribute('aria-pressed',on);$('b',likeBtn).textContent=s.likes?fmt(s.likes):'';
    if(d)d.textContent=s.downloads?fmt(s.downloads)+' descargas':''}
  if(rb){const slug=rb.dataset.rate,s=stat(slug),mine=ls.get('fm_rate',{})[slug]||0,v=hov||mine;
    $$('[data-star]',rb).forEach((b,i)=>{b.classList.toggle('on',i<v);b.setAttribute('aria-pressed',mine===i+1)});
    $('.rtxt',rb).textContent=hov?'Valorar con '+hov+(hov===1?' estrella':' estrellas'):s.ratingCount?avg(s)+' de 5 · '+s.ratingCount+(s.ratingCount===1?' voto':' votos')+(mine?' · Tu voto: '+mine:''):mine?'Tu voto: '+mine+' · totales no disponibles ahora':'Sé el primero en valorar'}};
if(likeBtn)likeBtn.addEventListener('click',()=>{const slug=likeBtn.dataset.like,L=ls.get('fm_likes',[]),on=L.includes(slug),s=stat(slug);
  ls.set('fm_likes',on?L.filter(x=>x!==slug):[...L,slug]);S[slug]={...s,likes:Math.max(0,s.likes+(on?-1:1))};renderDetail();
  post(slug,on?'unlike':'like').then(r=>{if(r){S[slug]=r;renderDetail()}})});
if(rb){
  $$('[data-star]',rb).forEach(b=>{const v=+b.dataset.star;
    b.addEventListener('mouseenter',()=>{hov=v;renderDetail()});
    b.addEventListener('click',()=>{const slug=rb.dataset.rate,R=ls.get('fm_rate',{}),SY=ls.get('fm_rate_sync',{}),prev=R[slug]||0,s=stat(slug);
      R[slug]=v;ls.set('fm_rate',R);hov=0;
      S[slug]=prev?{...s,ratingSum:s.ratingSum+v-prev}:{...s,ratingSum:s.ratingSum+v,ratingCount:s.ratingCount+1};renderDetail();
      post(slug,'rate',{value:v,prev:SY[slug]?prev:0}).then(r=>{if(r){S[slug]=r;SY[slug]=1;ls.set('fm_rate_sync',SY);renderDetail()}})})});
  rb.addEventListener('mouseleave',()=>{hov=0;renderDetail()})}
if(dlLink)dlLink.addEventListener('click',()=>{const slug=dlLink.dataset.dlc,D=ls.get('fm_dl',[]);if(!D.includes(slug)){ls.set('fm_dl',[...D,slug]);post(slug,'download')}});
renderDetail();
if($('[data-s]')||likeBtn||rb)fetch('/api/stats').then(r=>r.ok?r.json():null).then(d=>{if(!d)return;S=d;renderCards();renderDetail()}).catch(()=>{});
// Visor de imágenes (lightbox)
const shot=$('#shot');
if(shot){let idx=0,ov,img,cnt,pv,nx,last;
  const list=()=>{const t=$$('.thumbs button');return t.length?t.map(b=>b.dataset.src):[shot.getAttribute('src')]};
  const show=i=>{const L=list();idx=(i+L.length)%L.length;img.src=L[idx];cnt.textContent=L.length>1?(idx+1)+' / '+L.length:'';pv.hidden=nx.hidden=L.length<2};
  const close=()=>{ov.hidden=true;document.documentElement.style.overflow='';if(last)last.focus()};
  const build=()=>{ov=document.createElement('div');ov.className='lb';ov.hidden=true;ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Visor de imágenes');
    ov.innerHTML='<button class="lb-x" type="button" aria-label="Cerrar">×</button><button class="lb-p" type="button" aria-label="Anterior">‹</button><img alt=""><button class="lb-nx" type="button" aria-label="Siguiente">›</button><span class="lb-c"></span>';
    document.body.append(ov);img=$('img',ov);cnt=$('.lb-c',ov);pv=$('.lb-p',ov);nx=$('.lb-nx',ov);
    ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('.lb-x'))close()});pv.onclick=()=>show(idx-1);nx.onclick=()=>show(idx+1)};
  const open=()=>{if(!ov)build();last=document.activeElement;show(Math.max(0,list().indexOf(shot.getAttribute('src'))));ov.hidden=false;document.documentElement.style.overflow='hidden';$('.lb-x',ov).focus()};
  shot.addEventListener('click',open);shot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
  document.addEventListener('keydown',e=>{if(!ov||ov.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(idx-1);if(e.key==='ArrowRight')show(idx+1)});
}
})();
