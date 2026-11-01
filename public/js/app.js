(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const q=$('#q'),grid=$('#grid'),norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
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
// Me gusta y descargas (necesita /api/stats; si no existe, no se muestra nada)
const store=(k,v)=>{try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'[]');localStorage.setItem(k,JSON.stringify(v))}catch{return[]}};
const post=(slug,action,extra={})=>fetch('/api/stats',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,action,...extra}),keepalive:true}).then(r=>r.ok?r.json():null).catch(()=>null);
const fmt=n=>new Intl.NumberFormat('es').format(n);
const likeBtn=$('[data-like]'),dlLink=$('[data-dlc]');
if($('[data-s]')||likeBtn)fetch('/api/stats').then(r=>r.ok?r.json():null).then(S=>{
  if(!S)return;
  $$('[data-s]').forEach(el=>{const s=S[el.dataset.s]||{},t=[];if(s.downloads)t.push('↓ '+fmt(s.downloads));if(s.likes)t.push('👍 '+fmt(s.likes));if(s.ratingCount)t.push('★ '+(s.ratingSum/s.ratingCount).toFixed(1).replace('.',',')+' ('+s.ratingCount+')');if(t.length){el.textContent=t.join('   ');el.hidden=false}});
  if(likeBtn){const slug=likeBtn.dataset.like,s=S[slug]||{likes:0,downloads:0};let likes=s.likes||0;
    const paint=()=>{const on=store('fm_likes').includes(slug);likeBtn.classList.toggle('on',on);likeBtn.setAttribute('aria-pressed',on);$('b',likeBtn).textContent=likes?fmt(likes):''};
    paint();$('[data-dl]').textContent=s.downloads?fmt(s.downloads)+' descargas':'';likeBtn.parentElement.hidden=false;
    likeBtn.addEventListener('click',()=>{const L=store('fm_likes'),on=L.includes(slug);store('fm_likes',on?L.filter(x=>x!==slug):[...L,slug]);likes=Math.max(0,likes+(on?-1:1));paint();post(slug,on?'unlike':'like')})}
  const rb=$('[data-rate]');
  if(rb){const slug=rb.dataset.rate,s=S[slug]||{};let sum=s.ratingSum||0,n=s.ratingCount||0;
    const R=()=>{try{return JSON.parse(localStorage.getItem('fm_rate')||'{}')}catch{return{}}},stars=$$('[data-star]',rb),txt=$('.rtxt',rb);
    const paint=h=>{const mine=R()[slug]||0,v=h||mine;stars.forEach((b,i)=>b.classList.toggle('on',i<v));
      txt.textContent=(n?`${(sum/n).toFixed(1).replace('.',',')} de 5 · ${n} ${n===1?'voto':'votos'}`:'Sé el primero en valorar')+(mine&&!h?` · Tu voto: ${mine}`:'')};
    paint(0);rb.hidden=false;
    stars.forEach(b=>{const v=+b.dataset.star;b.addEventListener('mouseenter',()=>paint(v));b.addEventListener('click',()=>{const r=R(),prev=r[slug]||0;if(prev){sum+=v-prev}else{sum+=v;n++}r[slug]=v;try{localStorage.setItem('fm_rate',JSON.stringify(r))}catch{}paint(0);post(slug,'rate',{value:v,prev})})});
    rb.addEventListener('mouseleave',()=>paint(0))}
}).catch(()=>{});
if(dlLink)dlLink.addEventListener('click',()=>{const slug=dlLink.dataset.dlc,D=store('fm_dl');if(!D.includes(slug)){store('fm_dl',[...D,slug]);post(slug,'download')}});
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
