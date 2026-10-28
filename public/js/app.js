(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const q=$('#q'),grid=$('#grid'),norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
if(grid){
  const cards=$$('.card',grid),empty=$('#empty'),u=new URLSearchParams(location.search);
  let cat=u.get('cat')||'';q.value=u.get('q')||'';
  const apply=()=>{const t=norm(q.value.trim());let n=0;
    cards.forEach(c=>{const ok=(!cat||c.dataset.c===cat)&&(!t||c.dataset.t.includes(t));c.hidden=!ok;n+=ok});
    empty.hidden=n>0;
    $$('[data-cat]').forEach(b=>b.classList.toggle('on',b.dataset.cat===cat));
    const s=new URLSearchParams();if(cat)s.set('cat',cat);if(q.value.trim())s.set('q',q.value.trim());
    history.replaceState(null,'',s.toString()?'?'+s:location.pathname)};
  q.addEventListener('input',apply);
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
})();
