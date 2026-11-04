(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
// i18n (public/js/i18n.js se carga antes): tr = texto traducido, trp = con plural (clave_one / clave_other)
const i18n=window.FMi18n||{t:k=>k,tp:k=>k,locale:'es-ES'},tr=(k,v)=>i18n.t(k,v),trp=(k,n,v)=>i18n.tp(k,n,v);
const q=$('#q'),grid=$('#grid'),norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
$$('[data-copy]').forEach(b=>b.setAttribute('aria-live','polite'));
let syncTheme=()=>{};
const th=$('#theme');
if(th){const cur=()=>document.documentElement.getAttribute('data-theme')==='light'?'light':'dark';
  const sync=()=>{const l=cur()==='light';th.setAttribute('aria-label',tr(l?'theme_to_dark':'theme_to_light'));th.title=th.getAttribute('aria-label')};
  syncTheme=sync;sync();th.addEventListener('click',()=>{const t=cur()==='light'?'dark':'light';document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('fm_theme',t)}catch{}sync()})}
const ls={get:(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const post=(slug,action,extra={})=>fetch('/api/stats',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,action,...extra}),keepalive:true}).then(r=>r.ok?r.json():null).catch(()=>null);
const fmt=n=>new Intl.NumberFormat(i18n.locale).format(n);
const DL='<svg class="dl-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v10m0 0l-4-4m4 4l4-4M4 15v3a3 3 0 003 3h10a3 3 0 003-3v-3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const likeBtn=$('[data-like]'),dlLink=$('[data-dlc]'),rb=$('[data-rate]');
let S={},hov=0,loaded=false,onStats=()=>{};
const stat=slug=>({likes:0,downloads:0,ratingSum:0,ratingCount:0,...(S[slug]||{})});
const avg=s=>new Intl.NumberFormat(i18n.locale,{minimumFractionDigits:1,maximumFractionDigits:1}).format(s.ratingSum/s.ratingCount);
const nf=v=>new Intl.NumberFormat(i18n.locale).format(v);
const renderCards=()=>$$('[data-s]').forEach(el=>{const s=stat(el.dataset.s),t=[];
  if(s.ratingCount)t.push(`<span class="r" title="${tr('st_rating')}">★ ${avg(s)} <i>(${s.ratingCount})</i></span>`);
  if(s.downloads)t.push(`<span class="dl" title="${tr('st_dl')}">${DL}${fmt(s.downloads)}</span>`);
  if(s.likes)t.push(`<span title="${tr('st_like')}">👍 ${fmt(s.likes)}</span>`);
  el.innerHTML=t.join('');el.hidden=!t.length});

// Búsqueda en vivo: sugerencias al escribir (en todas las páginas) con retardo corto y teclado
const sg=$('#sg');
if(q&&sg){let idx=null,items=[],act=-1,tm;
  const eh=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const load=()=>idx||(idx=fetch('/data/search.json').then(r=>r.ok?r.json():[]).catch(()=>[]));
  const hl=(t,w)=>{const n=norm(t);if(!w||n.length!==t.length)return eh(t);const i=n.indexOf(w);return i<0?eh(t):eh(t.slice(0,i))+'<mark>'+eh(t.slice(i,i+w.length))+'</mark>'+eh(t.slice(i+w.length))};
  const close=()=>{sg.hidden=true;q.setAttribute('aria-expanded','false');q.removeAttribute('aria-activedescendant');act=-1};
  const mark=n=>{act=n;$$('.sg-i',sg).forEach((el,i)=>{el.classList.toggle('on',i===n);el.setAttribute('aria-selected',i===n)});const el=$$('.sg-i',sg)[n];if(el){q.setAttribute('aria-activedescendant',el.id);el.scrollIntoView({block:'nearest'})}else q.removeAttribute('aria-activedescendant')};
  const run=async()=>{const v=q.value.trim(),t=norm(v);if(t.length<2){close();return}
    const all=await load();if(q.value.trim()!==v)return;
    const w=t.split(/\s+/).filter(Boolean);
    items=all.filter(m=>w.every(x=>m.n.includes(x))).map(m=>{const nt=norm(m.t);return{m,sc:nt.startsWith(w[0])?0:nt.includes(w[0])?1:2}}).sort((x,y)=>x.sc-y.sc).map(x=>x.m);
    const top=items.slice(0,6);
    sg.innerHTML=top.length?top.map((m,i)=>`<a class="sg-i" role="option" id="sg-${i}" aria-selected="false" href="/mod/${eh(m.s)}/"><img src="${eh(m.i||'/img/placeholder.svg')}" alt="" loading="lazy" width="64" height="36"><span class="sg-t"><b>${hl(m.t,w[0])}</b><small>${eh(m.a)}${m.c.length?' · '+eh(m.c.map((x,i)=>(m.cx&&m.cx[i]&&m.cx[i][i18n.lang])||x).join(', ')):''}</small></span><span class="sg-v">${m.v.map(x=>`<i>${eh(x)}</i>`).join('')}</span></a>`).join('')+`<a class="sg-all" href="/?q=${encodeURIComponent(v)}">${eh(trp('sg_all',items.length,{q:v}))}</a>`
      :`<div class="sg-no"><b>${eh(tr('sg_none',{q:v}))}</b><span>${tr('sg_none_hint')}</span></div>`;
    sg.hidden=false;q.setAttribute('aria-expanded','true');act=-1};
  q.addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(run,120)});
  q.addEventListener('focus',()=>{load();if(q.value.trim().length>1)run()});
  q.addEventListener('keydown',e=>{const n=$$('.sg-i',sg).length;
    if(e.key==='Escape'){close();return}
    if(sg.hidden||!n)return;
    if(e.key==='ArrowDown'){e.preventDefault();mark((act+1)%n)}
    else if(e.key==='ArrowUp'){e.preventDefault();mark((act-1+n)%n)}
    else if(e.key==='Enter'&&act>-1){e.preventDefault();location.href=$$('.sg-i',sg)[act].href}});
  document.addEventListener('click',e=>{if(!e.target.closest('.search'))close()});
  sg.addEventListener('mousemove',e=>{const el=e.target.closest('.sg-i');if(el)mark($$('.sg-i',sg).indexOf(el))});
  q.form.addEventListener('submit',close);
}
// Si una portada falla (enlace externo caído), se muestra la imagen de reserva
const fb=i=>{if(i.dataset.fb)return;i.dataset.fb=1;i.src='/img/placeholder.svg'};
document.addEventListener('error',e=>{const i=e.target;if(i&&i.tagName==='IMG'&&i.closest('.ph,.sg-i'))fb(i)},true);
$$('.ph img,.sg-i img').forEach(i=>{if(i.complete&&i.naturalWidth===0)fb(i)});
if(grid){
  const cards=$$('.card',grid),empty=$('#empty'),emsg=$('#empty-msg'),erst=$('#empty-reset'),u=new URLSearchParams(location.search);
  const sel=$('#ver'),srt=$('#sort'),cnt=$('#count'),rs=$('#reset'),pos=new Map(cards.map((c,i)=>[c,i]));let cat=u.get('cat')||'';sel.value=u.get('ver')||'';srt.value=u.get('sort')||'';q.value=u.get('q')||'';
  // orden: «valorados» usa una media ponderada (así 1 voto de 5★ no gana a 50 votos de 4,8★)
  const SCORE={valorados:s=>s.ratingCount?(s.ratingSum+3*3.5)/(s.ratingCount+3):0,descargados:s=>s.downloads,gustados:s=>s.likes};
  const sorted=()=>{const f=SCORE[srt.value];return [...cards].sort((a,b)=>(f?f(stat(b.dataset.slug))-f(stat(a.dataset.slug)):0)||pos.get(a)-pos.get(b))};
  const PAGE=12,more=$('#more'),mw=$('#more-w'),mn=$('#more-n');let limit=PAGE;
  const apply=()=>{const t=norm(q.value.trim());let n=0,k=0;
    sorted().forEach(c=>{const ok=(!cat||c.dataset.c.split(' ').includes(cat))&&(!sel.value||c.dataset.v.split(' ').includes(sel.value))&&(!t||c.dataset.t.includes(t));n+=ok;const vis=ok&&k<limit;if(vis)k++;c.hidden=!vis;grid.append(c)});
    if(mw){mw.hidden=n<=k;if(n>k){more.textContent=tr('more',{n:Math.min(PAGE,n-k)});mn.textContent=tr('showing',{k,n})}}
    empty.hidden=n>0;if(!n&&emsg){const qq=q.value.trim(),vv=sel.value&&sel.options[sel.selectedIndex].text;emsg.textContent=qq&&vv?tr('empty_qv',{q:qq,v:vv}):qq?tr('empty_q',{q:qq}):vv?tr('empty_v',{v:vv}):tr('empty_f');if(erst)erst.hidden=!(cat||sel.value||srt.value||qq)}cnt.textContent=trp('count',n)+(srt.value&&!loaded?' · '+tr('no_stats'):'');rs.hidden=!(cat||sel.value||srt.value||q.value.trim());
    $$('[data-cat]').forEach(b=>b.classList.toggle('on',b.dataset.cat===cat));
    const s=new URLSearchParams();if(cat)s.set('cat',cat);if(q.value.trim())s.set('q',q.value.trim());if(sel.value)s.set('ver',sel.value);if(srt.value)s.set('sort',srt.value);const lp=new URLSearchParams(location.search).get('lang');if(lp)s.set('lang',lp);
    history.replaceState(null,'',s.toString()?'?'+s:location.pathname)};
  const fresh=()=>{limit=PAGE;apply()};let dbt;q.addEventListener('input',()=>{clearTimeout(dbt);dbt=setTimeout(fresh,120)});sel.addEventListener('change',fresh);srt.addEventListener('change',fresh);if(more)more.addEventListener('click',()=>{const before=$$('.card:not([hidden])',grid).length;limit+=PAGE;apply();const v=$$('.card:not([hidden])',grid)[before];if(v)v.focus()});const clr=()=>{cat='';q.value='';sel.value='';srt.value='';fresh();q.dispatchEvent(new Event('input'));q.focus()};rs.addEventListener('click',clr);if(erst)erst.addEventListener('click',clr);
  q.form.addEventListener('submit',e=>{e.preventDefault();fresh();$('#ultimos').scrollIntoView()});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;e.preventDefault();cat=b.dataset.cat;fresh();if(b.tagName==='A')$('#ultimos').scrollIntoView()});
  onStats=apply;apply();
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-copy]');
  if(b){let ok=true;
    try{await navigator.clipboard.writeText(b.dataset.copy)}catch{try{const t=document.createElement('textarea');t.value=b.dataset.copy;document.body.append(t);t.select();ok=document.execCommand('copy');t.remove()}catch{ok=false}}
    clearTimeout(b._t);b.classList.remove('ok');void b.offsetWidth;
    b.textContent=ok?tr('copy_ok'):tr('copy_fail');b.classList.toggle('ok',ok);
    const pth=b.previousElementSibling;if(ok&&pth&&pth.classList.contains('path')){pth.classList.remove('flash');void pth.offsetWidth;pth.classList.add('flash')}
    b._t=setTimeout(()=>{b.textContent=tr('copy_btn');b.classList.remove('ok')},1800)}
  const t=e.target.closest('.thumbs button');
  if(t){$('#shot').src=t.dataset.src;$$('.thumbs button').forEach(x=>x.classList.toggle('on',x===t))}
});
$$('.rail-w').forEach(w=>{const r=$('.rail',w),p=$('.prev',w),n=$('.next',w);
  const up=()=>{p.hidden=r.scrollLeft<8;n.hidden=r.scrollLeft+r.clientWidth>=r.scrollWidth-8};
  p.onclick=()=>r.scrollBy({left:-r.clientWidth*.8,behavior:'smooth'});n.onclick=()=>r.scrollBy({left:r.clientWidth*.8,behavior:'smooth'});
  r.addEventListener('scroll',up,{passive:true});addEventListener('resize',up);up()});
// Me gusta, descargas y valoraciones. Los controles se ven siempre y el voto se guarda en el navegador;
// los totales de la comunidad se sincronizan con /api/stats cuando el servicio responde.
const renderDetail=()=>{
  if(likeBtn){const slug=likeBtn.dataset.like,s=stat(slug),on=ls.get('fm_likes',[]).includes(slug),d=$('[data-dl]');
    likeBtn.classList.toggle('on',on);likeBtn.setAttribute('aria-pressed',on);$('b',likeBtn).textContent=s.likes?fmt(s.likes):'';
    if(d)d.innerHTML=DL+trp('dl',s.downloads,{n:fmt(s.downloads)});
    const fr=$('[data-fr]'),fl=$('[data-fl]');if(fr)fr.innerHTML=s.ratingCount?'★ <b>'+avg(s)+'</b> <i>('+trp('vote',s.ratingCount)+')</i>':'★ '+tr('fr_none');if(fl)fl.innerHTML='👍 <b>'+fmt(s.likes)+'</b> '+trp('likes',s.likes)}
  if(rb){const slug=rb.dataset.rate,s=stat(slug),mine=ls.get('fm_rate',{})[slug]||0,v=hov||mine;
    $$('[data-star]',rb).forEach((b,i)=>{b.classList.toggle('on',v>=i+1);b.classList.toggle('half',v===i+.5);b.setAttribute('aria-pressed',mine>=i+1||mine===i+.5)});
    $('.rtxt',rb).textContent=hov?trp('rate_hover',hov,{n:nf(hov)}):s.ratingCount?trp('rate_sum',s.ratingCount,{a:avg(s),n:s.ratingCount})+(mine?' · '+tr('rate_mine',{n:nf(mine)}):''):mine?tr('rate_mine_off',{n:nf(mine)}):tr('rate_none')}};
if(likeBtn)likeBtn.addEventListener('click',()=>{const slug=likeBtn.dataset.like,L=ls.get('fm_likes',[]),on=L.includes(slug),s=stat(slug);
  ls.set('fm_likes',on?L.filter(x=>x!==slug):[...L,slug]);S[slug]={...s,likes:Math.max(0,s.likes+(on?-1:1))};renderDetail();
  post(slug,on?'unlike':'like').then(r=>{if(r){S[slug]=r;renderDetail()}})});
if(rb){
  $$('[data-star]',rb).forEach(b=>{const n=+b.dataset.star;
    // mitad izquierda de la estrella = media estrella (con teclado, estrella completa; Mayús = media)
    const val=e=>{const r=b.getBoundingClientRect();return e.clientX||e.clientY?(e.clientX-r.left<r.width/2?n-.5:n):(e.shiftKey?n-.5:n)};
    b.addEventListener('mousemove',e=>{const x=val(e);if(x!==hov){hov=x;renderDetail()}});
    b.addEventListener('click',e=>{const v=val(e);const slug=rb.dataset.rate,R=ls.get('fm_rate',{}),SY=ls.get('fm_rate_sync',{}),prev=R[slug]||0,s=stat(slug);
      R[slug]=v;ls.set('fm_rate',R);hov=0;
      S[slug]=prev?{...s,ratingSum:s.ratingSum+v-prev}:{...s,ratingSum:s.ratingSum+v,ratingCount:s.ratingCount+1};renderDetail();
      post(slug,'rate',{value:v,prev:SY[slug]?prev:0}).then(r=>{if(r){S[slug]=r;SY[slug]=1;ls.set('fm_rate_sync',SY);renderDetail()}})})});
  rb.addEventListener('mouseleave',()=>{hov=0;renderDetail()})}
if(dlLink)dlLink.addEventListener('click',()=>{const slug=dlLink.dataset.dlc,D=ls.get('fm_dl',[]);if(!D.includes(slug)){ls.set('fm_dl',[...D,slug]);post(slug,'download')}});
renderDetail();
addEventListener('fm:lang',()=>{syncTheme();renderCards();renderDetail();onStats()});
if($('[data-s]')||likeBtn||rb)fetch('/api/stats').then(r=>r.ok?r.json():null).then(d=>{if(!d)return;S=d;loaded=true;renderCards();renderDetail();onStats()}).catch(()=>{});
// Visor de imágenes (lightbox)
const shot=$('#shot');
if(shot){let idx=0,ov,img,cnt,pv,nx,last;
  const list=()=>{const t=$$('.thumbs button');return t.length?t.map(b=>b.dataset.src):[shot.getAttribute('src')]};
  const show=i=>{const L=list();idx=(i+L.length)%L.length;img.src=L[idx];cnt.textContent=L.length>1?(idx+1)+' / '+L.length:'';pv.hidden=nx.hidden=L.length<2};
  const close=()=>{ov.hidden=true;document.documentElement.style.overflow='';if(last)last.focus()};
  const build=()=>{ov=document.createElement('div');ov.className='lb';ov.hidden=true;ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.innerHTML='<button class="lb-x" type="button">×</button><button class="lb-p" type="button">‹</button><img alt=""><button class="lb-nx" type="button">›</button><span class="lb-c"></span>';
    document.body.append(ov);img=$('img',ov);cnt=$('.lb-c',ov);pv=$('.lb-p',ov);nx=$('.lb-nx',ov);
    ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('.lb-x'))close()});pv.onclick=()=>show(idx-1);nx.onclick=()=>show(idx+1)};
  const labels=()=>{ov.setAttribute('aria-label',tr('lb_aria'));$('.lb-x',ov).setAttribute('aria-label',tr('lb_close'));pv.setAttribute('aria-label',tr('prev'));nx.setAttribute('aria-label',tr('next'))};
  const open=()=>{if(!ov)build();labels();last=document.activeElement;show(Math.max(0,list().indexOf(shot.getAttribute('src'))));ov.hidden=false;document.documentElement.style.overflow='hidden';$('.lb-x',ov).focus()};
  shot.addEventListener('click',open);shot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
  document.addEventListener('keydown',e=>{if(!ov||ov.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(idx-1);if(e.key==='ArrowRight')show(idx+1)});
}
})();
