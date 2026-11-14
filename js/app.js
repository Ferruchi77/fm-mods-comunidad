(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
// Imprescindibles: plegar / desplegar (se recuerda en localStorage; el estado inicial lo pone un script del <head> para que no parpadee)
(()=>{const bt=document.getElementById('feat-toggle');if(!bt)return;const root=document.documentElement;
  const paint=()=>{const open=root.getAttribute('data-feat')!=='0',k=open?'feat_hide':'feat_show';bt.setAttribute('aria-expanded',open);bt.dataset.i18n=k;bt.textContent=window.FMi18n?FMi18n.t(k):k;bt.classList.toggle('closed',!open)};
  bt.addEventListener('click',()=>{const open=root.getAttribute('data-feat')!=='0';root.setAttribute('data-feat',open?'0':'1');try{localStorage.setItem('fm_feat',open?'0':'1')}catch{}paint()});
  paint();addEventListener('fm:lang',paint)})();
// i18n (public/js/i18n.js se carga antes): tr = texto traducido, trp = con plural (clave_one / clave_other)
const i18n=window.FMi18n||{t:k=>k,tp:k=>k,locale:'es-ES',base:'',lang:'es'},B=i18n.base,tr=(k,v)=>i18n.t(k,v),trp=(k,n,v)=>i18n.tp(k,n,v);
const q=$('#q'),grid=$('#grid'),norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
$$('[data-copy]').forEach(b=>b.setAttribute('aria-live','polite'));
let syncTheme=()=>{};
const th=$('#theme');
if(th){const cur=()=>document.documentElement.getAttribute('data-theme')==='light'?'light':'dark';
  const sync=()=>{const l=cur()==='light';th.setAttribute('aria-label',tr(l?'theme_to_dark':'theme_to_light'));th.title=th.getAttribute('aria-label')};
  syncTheme=sync;sync();th.addEventListener('click',()=>{const t=cur()==='light'?'dark':'light';document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('fm_theme',t)}catch{}sync()})}
const ls={get:(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const FAV='fm_favs',favs=()=>{const v=ls.get(FAV,[]);return Array.isArray(v)?v:[]};
const DAY=864e5,ago=d=>d?(Date.now()-new Date(d+'T00:00:00').getTime())/DAY:1e9;
// Insignias «Nuevo» (≤14 días desde su publicación) y «Actualizado» (≤14 días desde su última actualización); se calculan al abrir la página
$$('.card').forEach(c=>{const box=$('.ph-b',c);if(!box||$('.b-dyn',box))return;
  const k=ago(c.dataset.nw)<=14?'b_new':(ago(c.dataset.lm)<=14&&c.dataset.lm!==c.dataset.nw?'b_upd':'');
  if(k)box.insertAdjacentHTML('afterbegin',`<span class="b b-dyn ${k==='b_new'?'b-nuevo':'b-upd'}">${tr(k)}</span>`)});
const markFavs=()=>{const F=favs();$$('.card').forEach(c=>c.classList.toggle('is-fav',F.includes(c.dataset.slug)))};markFavs();
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
  const ttl=m=>(m.tt&&m.tt[i18n.lang])||m.t;   // nombre del mod en el idioma de la página (v.19)
  const eh=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const load=()=>idx||(idx=fetch('/data/search.json').then(r=>r.ok?r.json():[]).catch(()=>[]));
  const hl=(t,w)=>{const n=norm(t);if(!w||n.length!==t.length)return eh(t);const i=n.indexOf(w);return i<0?eh(t):eh(t.slice(0,i))+'<mark>'+eh(t.slice(i,i+w.length))+'</mark>'+eh(t.slice(i+w.length))};
  const close=()=>{sg.hidden=true;q.setAttribute('aria-expanded','false');q.removeAttribute('aria-activedescendant');act=-1};
  const mark=n=>{act=n;$$('.sg-i',sg).forEach((el,i)=>{el.classList.toggle('on',i===n);el.setAttribute('aria-selected',i===n)});const el=$$('.sg-i',sg)[n];if(el){q.setAttribute('aria-activedescendant',el.id);el.scrollIntoView({block:'nearest'})}else q.removeAttribute('aria-activedescendant')};
  const run=async()=>{const v=q.value.trim(),t=norm(v);if(t.length<2){close();return}
    const all=await load();if(q.value.trim()!==v)return;
    const w=t.split(/\s+/).filter(Boolean);
    items=all.filter(m=>w.every(x=>m.n.includes(x))).map(m=>{const nt=norm(ttl(m));return{m,sc:nt.startsWith(w[0])?0:nt.includes(w[0])?1:2}}).sort((x,y)=>x.sc-y.sc).map(x=>x.m);
    const top=items.slice(0,6);
    sg.innerHTML=top.length?top.map((m,i)=>`<a class="sg-i" role="option" id="sg-${i}" aria-selected="false" href="${B}/mod/${eh(m.s)}/"><img src="${eh(m.i||'/img/placeholder.svg')}" alt="" loading="lazy" width="64" height="36"><span class="sg-t"><b>${hl(ttl(m),w[0])}</b><small>${eh(m.a)}${m.c.length?' · '+eh(m.c.map((x,i)=>(m.cx&&m.cx[i]&&m.cx[i][i18n.lang])||x).join(', ')):''}</small></span><span class="sg-v">${m.v.map(x=>`<i>${eh(x)}</i>`).join('')}</span></a>`).join('')+`<a class="sg-all" href="${B}/?q=${encodeURIComponent(v)}">${eh(trp('sg_all',items.length,{q:v}))}</a>`
      :`<div class="sg-no"><b>${eh(tr('sg_none',{q:v}))}</b><span>${tr('sg_none_hint').replace('href="/','href="'+B+'/')}</span></div>`;
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
// Novedades (v.19): «hace N días», resumen de 30 días, texto recortado con «Leer más» y, en /novedades/, filtros (tipo, periodo, versión) y salto por meses
{const rtf=typeof Intl.RelativeTimeFormat==='function'?new Intl.RelativeTimeFormat(i18n.locale,{numeric:'auto'}):null;
  const agoTxt=d=>{const n=Math.floor(ago(d));if(!rtf||!(n>=0))return '';return n<14?rtf.format(-n,'day'):n<60?rtf.format(-Math.floor(n/7),'week'):n<365?rtf.format(-Math.floor(n/30),'month'):rtf.format(-Math.floor(n/365),'year')};
  $$('.nv-ago').forEach(e=>{e.textContent=agoTxt(e.dataset.ago)});
  const notes=()=>$$('.nv-note');
  const measure=()=>notes().forEach(n=>{const b=$('.nv-more',n.parentElement),open=n.classList.contains('open');
    if(!open&&n.offsetParent!==null)n.classList.toggle('clip',n.scrollHeight>n.clientHeight+2);
    if(b&&(open||n.offsetParent!==null))b.hidden=!(open||n.classList.contains('clip'))});
  document.addEventListener('click',e=>{const b=e.target.closest('.nv-more');if(!b)return;const n=$('.nv-note',b.parentElement),o=!n.classList.contains('open');
    n.classList.toggle('open',o);b.setAttribute('aria-expanded',o);b.textContent=tr(o?'nv_less':'nv_more')});
  let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(measure,150)});
  const list=$('#nv-list');
  if(list){
    const items=$$('.nv',list),secs=$$('.nv-m',list),jump=$$('.nv-jump a'),seg=$$('.nv-seg [data-nt]'),per=$('#nv-per'),ver=$('#nv-ver'),cnt=$('#nv-count'),rst=$('#nv-reset'),emp=$('#nv-empty'),sum=$('#nv-sum'),u=new URLSearchParams(location.search);
    const okv=(el,v)=>[...el.options].some(o=>o.value===v)?v:'';
    let nt=['new','update'].includes(u.get('t'))?u.get('t'):'';per.value=okv(per,u.get('p')||'');ver.value=okv(ver,u.get('v')||'');
    const a30=items.filter(i=>ago(i.dataset.dt)<=30),n30=a30.filter(i=>i.dataset.nt==='new').length,u30=a30.length-n30;
    if(sum&&a30.length){sum.textContent=tr('nv_sum',{a:n30,b:u30});sum.hidden=false}
    const apply=()=>{let n=0;
      items.forEach(i=>{const ok=(!nt||i.dataset.nt===nt)&&(!per.value||ago(i.dataset.dt)<=+per.value)&&(!ver.value||i.dataset.v.split(' ').includes(ver.value));i.hidden=!ok;n+=ok});
      secs.forEach(sc=>{const k=$$('.nv:not([hidden])',sc).length,j=jump.find(a=>a.getAttribute('href')==='#'+sc.id);sc.hidden=!k;if(j){j.hidden=!k;const c=$('i',j);if(c)c.textContent=k}});
      seg.forEach(b=>{const on=b.dataset.nt===nt;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
      cnt.textContent=trp('nv_count',n);emp.hidden=n>0;rst.hidden=!(nt||per.value||ver.value);
      const s=new URLSearchParams();if(nt)s.set('t',nt);if(per.value)s.set('p',per.value);if(ver.value)s.set('v',ver.value);
      history.replaceState(null,'',(s.toString()?'?'+s:location.pathname)+location.hash);measure()};
    seg.forEach(b=>b.addEventListener('click',()=>{nt=b.dataset.nt;apply()}));[per,ver].forEach(e=>e.addEventListener('change',apply));
    rst.addEventListener('click',()=>{nt='';per.value='';ver.value='';apply()});
    apply();
  }else measure();
  addEventListener('load',measure);
}
// Si una portada falla (enlace externo caído), se muestra la imagen de reserva
const fb=i=>{if(i.dataset.fb)return;i.dataset.fb=1;i.src='/img/placeholder.svg'};
document.addEventListener('error',e=>{const i=e.target;if(i&&i.tagName==='IMG'&&i.closest('.ph,.sg-i'))fb(i)},true);
$$('.ph img,.sg-i img').forEach(i=>{if(i.complete&&i.naturalWidth===0)fb(i)});
$$('.ph img').forEach(i=>{const d=()=>i.closest('.ph').classList.add('ld');if(i.complete)d();else{i.addEventListener('load',d,{once:true});i.addEventListener('error',d,{once:true})}});
if(grid){
  const cards=$$('.card',grid),empty=$('#empty'),emsg=$('#empty-msg'),erst=$('#empty-reset'),u=new URLSearchParams(location.search);
  const sel=$('#ver'),srt=$('#sort'),aut=$('#aut'),price=$('#price'),show=$('#show'),vw=$('#view'),fbar=$('#favbar'),cnt=$('#count'),rs=$('#reset'),pos=new Map(cards.map((c,i)=>[c,i]));let cat=u.get('cat')||'';sel.value=u.get('ver')||'';
  const okOpt=(el,v)=>[...el.options].some(o=>o.value===v)?v:'';
  srt.value=okOpt(srt,u.has('sort')?u.get('sort'):ls.get('fm_sort',''));   // el orden elegido se recuerda entre visitas
  aut.value=okOpt(aut,u.get('aut')||'');price.value=okOpt(price,u.get('price')||'');show.value=okOpt(show,u.get('show')||'');q.value=u.get('q')||'';
  const showOk=c=>{const v=show.value;return !v||(v==='favs'?favs().includes(c.dataset.slug):v==='recent'?ago(c.dataset.lm)<=30:c.dataset.ss==='1')};
  // vista en cuadrícula o en lista (se recuerda)
  const paintView=()=>{const l=ls.get('fm_view','grid')==='list';grid.classList.toggle('list',l);if(vw){vw.textContent=tr(l?'view_grid':'view_list');vw.setAttribute('aria-pressed',l)}};
  if(vw)vw.addEventListener('click',()=>{ls.set('fm_view',ls.get('fm_view','grid')==='list'?'grid':'list');paintView()});paintView();
  // orden: «valorados» usa una media ponderada (así 1 voto de 5★ no gana a 50 votos de 4,8★)
  const SCORE={valorados:s=>s.ratingCount?(s.ratingSum+3*3.5)/(s.ratingCount+3):0,descargados:s=>s.downloads,gustados:s=>s.likes};
  const lmv=c=>Date.parse(c.dataset.lm)||0;
  const sorted=()=>{if(srt.value==='actualizados')return [...cards].sort((a,b)=>lmv(b)-lmv(a)||pos.get(a)-pos.get(b));const f=SCORE[srt.value];return [...cards].sort((a,b)=>(f?f(stat(b.dataset.slug))-f(stat(a.dataset.slug)):0)||pos.get(a)-pos.get(b))};
  const PAGE=50,more=$('#more'),mw=$('#more-w'),mn=$('#more-n');let limit=PAGE;
  const apply=()=>{const t=norm(q.value.trim());let n=0,k=0;
    sorted().forEach(c=>{const ok=(!cat||c.dataset.c.split(' ').includes(cat))&&(!sel.value||c.dataset.v.split(' ').includes(sel.value))&&(!aut.value||c.dataset.a.split('|').includes(aut.value))&&(!price.value||(price.value==='paid')===(c.dataset.p==='1'))&&showOk(c)&&(!t||c.dataset.t.includes(t));n+=ok;const vis=ok&&k<limit;if(vis)k++;c.hidden=!vis;grid.append(c)});
    if(mw){mw.hidden=n<=k;if(n>k){more.textContent=tr('more',{n:Math.min(PAGE,n-k)});mn.textContent=tr('showing',{k,n})}}
    empty.hidden=n>0;if(!n&&emsg){const qq=q.value.trim(),vv=sel.value&&sel.options[sel.selectedIndex].text;emsg.textContent=show.value==='favs'&&!favs().length?tr('empty_favs'):qq&&vv?tr('empty_qv',{q:qq,v:vv}):qq?tr('empty_q',{q:qq}):vv?tr('empty_v',{v:vv}):tr('empty_f');if(erst)erst.hidden=!(cat||sel.value||srt.value||aut.value||price.value||show.value||qq)}cnt.textContent=trp('count',n)+(['valorados','descargados','gustados'].includes(srt.value)&&!loaded?' · '+tr('no_stats'):'');rs.hidden=!(cat||sel.value||srt.value||aut.value||price.value||show.value||q.value.trim());
    if(fbar)fbar.hidden=show.value!=='favs';ls.set('fm_sort',srt.value);
    $$('[data-cat]').forEach(b=>b.classList.toggle('on',b.dataset.cat===cat));
    const s=new URLSearchParams();if(cat)s.set('cat',cat);if(q.value.trim())s.set('q',q.value.trim());if(sel.value)s.set('ver',sel.value);if(srt.value)s.set('sort',srt.value);if(aut.value)s.set('aut',aut.value);if(price.value)s.set('price',price.value);if(show.value)s.set('show',show.value);
    history.replaceState(null,'',s.toString()?'?'+s:location.pathname)};
  const fresh=()=>{limit=PAGE;apply()};let dbt;q.addEventListener('input',()=>{clearTimeout(dbt);dbt=setTimeout(fresh,120)});sel.addEventListener('change',fresh);srt.addEventListener('change',fresh);[aut,price,show].forEach(e=>e.addEventListener('change',fresh));if(more)more.addEventListener('click',()=>{const before=$$('.card:not([hidden])',grid).length;limit+=PAGE;apply();const v=$$('.card:not([hidden])',grid)[before];if(v)v.focus()});const clr=()=>{cat='';q.value='';sel.value='';srt.value='';aut.value='';price.value='';show.value='';fresh();q.dispatchEvent(new Event('input'));q.focus()};rs.addEventListener('click',clr);if(erst)erst.addEventListener('click',clr);
  q.form.addEventListener('submit',e=>{e.preventDefault();fresh();$('#ultimos').scrollIntoView()});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;e.preventDefault();cat=b.dataset.cat;fresh();if(b.tagName==='A')$('#ultimos').scrollIntoView()});
  onStats=apply;apply();
  // exportar / importar favoritos (viajan en un .json)
  const fm=document.createElement('span');fm.className='meta';fm.setAttribute('role','status');if(fbar)fbar.append(fm);
  const ex=$('#fav-exp'),im=$('#fav-imp'),fi=$('#fav-file');
  if(ex)ex.addEventListener('click',()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({fm_favs:favs()},null,1)],{type:'application/json'}));a.download='fm-mods-favoritos.json';document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)});
  if(im&&fi){im.addEventListener('click',()=>fi.click());
    fi.addEventListener('change',async()=>{const f=fi.files[0];fi.value='';if(!f)return;
      try{const j=JSON.parse(await f.text()),L=(Array.isArray(j)?j:j.fm_favs);if(!Array.isArray(L))throw 0;
        const ok=L.filter(x=>typeof x==='string'&&/^[a-z0-9][a-z0-9-]{0,119}$/.test(x)),all=[...new Set([...favs(),...ok])];ls.set(FAV,all);markFavs();apply();fm.textContent=tr('fav_import_ok',{n:ok.length})}
      catch{fm.textContent=tr('fav_import_err')}})}
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-copy]');
  if(b){let ok=true;
    try{await navigator.clipboard.writeText(b.dataset.copy)}catch{try{const t=document.createElement('textarea');t.value=b.dataset.copy;document.body.append(t);t.select();ok=document.execCommand('copy');t.remove()}catch{ok=false}}
    clearTimeout(b._t);b.classList.remove('ok');void b.offsetWidth;
    b.textContent=ok?tr('copy_ok'):tr('copy_fail');b.classList.toggle('ok',ok);
    const pth=b.previousElementSibling;if(ok&&pth&&pth.classList.contains('path')){pth.classList.remove('flash');void pth.offsetWidth;pth.classList.add('flash')}
    b._t=setTimeout(()=>{let v=null;try{v=b.dataset.p?JSON.parse(b.dataset.p):null}catch{}b.textContent=tr(b.dataset.i18n||'copy_btn',v);b.classList.remove('ok')},1800)}
  const t=e.target.closest('.thumbs button');
  if(t){const sh=$('#shot');if(t.dataset.srcset)sh.srcset=t.dataset.srcset;else sh.removeAttribute('srcset');sh.src=t.dataset.src;$$('.thumbs button').forEach(x=>x.classList.toggle('on',x===t))}
});
$$('.rail-w').forEach(w=>{const r=$('.rail',w),p=$('.prev',w),n=$('.next',w);
  const up=()=>{p.hidden=r.scrollLeft<8;n.hidden=r.scrollLeft+r.clientWidth>=r.scrollWidth-8};
  p.onclick=()=>r.scrollBy({left:-r.clientWidth*.8,behavior:'smooth'});n.onclick=()=>r.scrollBy({left:r.clientWidth*.8,behavior:'smooth'});
  r.addEventListener('scroll',up,{passive:true});addEventListener('resize',up);up()});
// Me gusta, descargas y valoraciones. Los controles se ven siempre y el voto se guarda en el navegador;
// los totales de la comunidad se sincronizan con /api/stats cuando el servicio responde.
const renderDetail=()=>{
  if(typeof renderWorks==='function')renderWorks();
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
// Favorito (botón de la ficha)
const favBtn=$('[data-fav]');
const paintFav=()=>{if(!favBtn)return;const on=favs().includes(favBtn.dataset.fav);favBtn.classList.toggle('on',on);favBtn.setAttribute('aria-pressed',on);$('.fav-ic',favBtn).textContent=on?'♥':'♡';favBtn.title=tr(on?'fav_remove':'fav_add')};
if(favBtn)favBtn.addEventListener('click',()=>{const sl=favBtn.dataset.fav,L=favs();ls.set(FAV,L.includes(sl)?L.filter(x=>x!==sl):[...L,sl]);paintFav();markFavs()});
paintFav();
// «¿Te funciona con FMxx?»: un voto por versión (se puede cambiar); los totales vienen de /api/stats
const wk=$('[data-works]');
const renderWorks=()=>{if(!wk)return;const slug=wk.dataset.works,s=stat(slug),mine=ls.get('fm_works',{})[slug]||{};
  $$('.wk',wk).forEach(r=>{const v=r.dataset.ver,c=(s.works&&s.works[v])||{ok:0,ko:0},m=mine[v]||'';
    $('[data-wsum]',r).textContent=c.ok+c.ko?tr('works_sum',{ok:c.ok,ko:c.ko}):tr('works_none');
    $$('[data-w]',r).forEach(b=>{b.classList.toggle('on',b.dataset.w===m);b.setAttribute('aria-pressed',b.dataset.w===m)})})};
if(wk)wk.addEventListener('click',e=>{const b=e.target.closest('[data-w]');if(!b)return;
  const slug=wk.dataset.works,v=b.closest('.wk').dataset.ver,val=b.dataset.w,W=ls.get('fm_works',{}),mine=W[slug]||{},prev=mine[v];if(prev===val)return;
  mine[v]=val;W[slug]=mine;ls.set('fm_works',W);
  const s=stat(slug),w={...(s.works||{})},c={...(w[v]||{ok:0,ko:0})};if(prev)c[prev]=Math.max(0,c[prev]-1);c[val]++;w[v]=c;S[slug]={...s,works:w};renderWorks();
  const th=$('.wk-thx',wk);if(th)th.hidden=false;
  post(slug,'works',{ver:v,value:val}).then(r=>{if(r){S[slug]=r;renderWorks()}})});
renderWorks();
renderDetail();
addEventListener('fm:lang',()=>{syncTheme();renderCards();renderDetail();onStats()});
if($('[data-s]')||likeBtn||rb){const off=()=>$$('[data-stats-off]').forEach(e=>{e.hidden=false});
  if($('[data-s]')||likeBtn||rb)fetch('/api/stats').then(r=>r.ok?r.json():null).then(d=>{if(!d){off();return}S=d;loaded=true;renderCards();renderDetail();onStats()}).catch(off)}
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
// PWA básica: el service worker (/sw.js) guarda lo ya visitado para abrir más rápido y funcionar sin conexión
if('serviceWorker' in navigator&&location.protocol==='https:')addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})});
})();
