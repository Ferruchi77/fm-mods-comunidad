/* Conversión entre el marcado de texto enriquecido de las fichas y el HTML del editor del panel (v.19).
   Marcado (lo que se guarda en el JSON; lo pinta rich() de /js/ficha.js escapando siempre antes):
     **negrita**   ·   [color=#rrggbb]texto con color[/color]   ·   líneas que empiezan por «- » = lista con guiones
   · toHtml(marcado)  → HTML para el editor (una línea de marcado = un <div>; las listas son <ul><li>)
   · toMarkup(raíz)   → marcado a partir del DOM del editor (admite <b>/<strong>, <font color>, <span style="color">, <div>, <p>, <br>, <ul>/<ol>)
   Se usa en el navegador (widgets.js) y en las pruebas (con jsdom). */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FMRich=factory()})(typeof self!=='undefined'?self:this,function(){
'use strict';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const inlineHtml=s=>esc(s)
  .replace(/\[color=(#[0-9a-fA-F]{6})\]([\s\S]*?)\[\/color\]/g,(_,c,t)=>`<span style="color:${c.toLowerCase()}">${t}</span>`)
  .replace(/\*\*([^*\n]+?)\*\*/g,'<b>$1</b>');

const toHtml=text=>{
  const out=[];let ul=null;
  const flush=()=>{if(ul){out.push('<ul>'+ul.map(x=>'<li>'+inlineHtml(x)+'</li>').join('')+'</ul>');ul=null}};
  for(const raw of String(text==null?'':text).replace(/\r\n?/g,'\n').split('\n')){
    const li=/^\s*[-•]\s+(\S.*)$/.exec(raw);
    if(li){(ul=ul||[]).push(li[1].trim());continue}
    flush();
    out.push('<div>'+(raw.trim()?inlineHtml(raw.trim()):'<br>')+'</div>');
  }
  flush();
  return out.join('');
};

// «rgb(255, 0, 0)», «#f00», «#ff0000» → «#ff0000» (si no se reconoce, '')
const hex=c=>{
  c=String(c||'').trim().toLowerCase();let m;
  if((m=/^#([0-9a-f]{6})$/.exec(c)))return '#'+m[1];
  if((m=/^#([0-9a-f]{3})$/.exec(c)))return '#'+m[1].split('').map(x=>x+x).join('');
  if((m=/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(c)))return '#'+[m[1],m[2],m[3]].map(n=>Math.min(255,+n).toString(16).padStart(2,'0')).join('');
  return '';
};

const BLOCK=/^(div|p|h[1-6]|blockquote|pre|section|article)$/;
const toMarkup=rootEl=>{
  const L=[];                       // líneas ya cerradas: {li, t}
  let cur='',colorE=null,boldE=false,colorD=null,boldD=false;   // E = marcas ya escritas en la línea · D = formato deseado en este punto del DOM
  const sync=()=>{                  // deja escritas las marcas que toca, siempre con el color por fuera y la negrita por dentro
    if(boldE&&(!boldD||colorE!==colorD)){cur+='**';boldE=false}
    if(colorE&&colorE!==colorD){cur+='[/color]';colorE=null}
    if(colorD&&!colorE){cur+='[color='+colorD+']';colorE=colorD}
    if(boldD&&!boldE){cur+='**';boldE=true}};
  const emit=t=>{t=String(t).replace(/\u00a0/g,' ').replace(/[\r\n]+/g,' ');if(!t)return;if(t.trim())sync();cur+=t};
  const endLine=li=>{if(boldE){cur+='**';boldE=false}if(colorE){cur+='[/color]';colorE=null}L.push({li:!!li,t:cur.replace(/\s+$/,'').replace(/^\s+/,'')});cur=''};
  const prevEl=n=>{let p=n.previousSibling;while(p&&p.nodeType===3&&!p.nodeValue)p=p.previousSibling;return p};

  const block=(el,li)=>{
    if(cur!=='')endLine(false);
    const start=L.length;
    walk(el,li);
    if(cur!=='')endLine(li);else if(L.length===start)L.push({li:!!li,t:''});   // bloque vacío o solo con <br> = línea en blanco
  };
  const walk=(node,li)=>{
    for(const n of Array.from(node.childNodes)){
      if(n.nodeType===3){emit(n.nodeValue);continue}
      if(n.nodeType!==1)continue;
      const tag=n.tagName.toLowerCase();
      if(tag==='br'){
        const last=!n.nextSibling,p=prevEl(n);
        if(last&&!(p&&p.nodeType===1&&p.tagName.toLowerCase()==='br'))continue;   // <br> final de un bloque: solo marca de posición
        endLine(li);continue}
      if(tag==='ul'||tag==='ol'){if(cur!=='')endLine(false);for(const c of Array.from(n.childNodes))if(c.nodeType===1)block(c,true);continue}
      if(tag==='li'){block(n,true);continue}
      if(BLOCK.test(tag)){block(n,li);continue}
      if(tag==='script'||tag==='style')continue;
      // línea: aplica negrita/color de este elemento a sus hijos y luego los restaura
      const pb=boldD,pc=colorD;
      if(tag==='b'||tag==='strong')boldD=true;
      const st=n.style;
      if(st){
        const w=String(st.fontWeight||'').toLowerCase();
        if(w==='bold'||w==='bolder'||(+w>=600))boldD=true;else if(w==='normal'||(w&&+w<600))boldD=false;
        const c=hex(st.color);if(c)colorD=c;
      }
      if(tag==='font'&&n.getAttribute){const c=hex(n.getAttribute('color'));if(c)colorD=c}
      walk(n,li);
      boldD=pb;colorD=pc;
    }
  };

  walk(rootEl,false);
  if(cur!=='')endLine(false);

  // une las líneas: las de lista llevan «- » y las demás se separan con un salto de línea
  const out=L.map(x=>x.li?(x.t?'- '+x.t:''):x.t);
  while(out.length&&!out[out.length-1].trim())out.pop();
  return out.join('\n');
};

return {toHtml,toMarkup,hex,inlineHtml};
});
