#!/usr/bin/env node
// Comprueba los enlaces de descarga de content/mods/*.json y escribe link-report.md (+ link-report.json).
//   rotos   → 404/410, dominio que no existe o conexión rechazada: casi seguro caídos.
//   dudosos → 403/429/5xx o tiempo agotado: muchos hosts bloquean a los robots; conviene mirarlos a mano.
// Limitación: MEGA, Discord y Drive devuelven «200» aunque el archivo/invitación ya no exista; esos casos no se detectan.
// Además:
//   · comprueba las portadas y capturas que son enlaces externos (si caen, la tarjeta se queda sin imagen; scripts/imagenes.js las descarga al repo);
//   · lleva la cuenta de semanas seguidas con el enlace roto en .github/link-state.json y, con AUTO_MARK=1, pasa la ficha a
//     «🔴 Pendiente de actualización» al llegar a MARK_AFTER semanas (3 por defecto). Un enlace dudoso nunca cuenta como roto.
// Uso: node scripts/check-links.js   (MODS_DIR=ruta para otra carpeta; STATE_FILE=ruta del estado)
const fs=require('fs'),p=require('path');
const DIR=process.env.MODS_DIR||'content/mods',UA='Mozilla/5.0 (compatible; FMModsLinkCheck/1.0; +https://github.com)',TO=15000;
const mods=fs.readdirSync(DIR).filter(f=>f.endsWith('.json')).map(f=>{try{return{slug:f.slice(0,-5),...JSON.parse(fs.readFileSync(p.join(DIR,f),'utf8'))}}catch{return null}})
  .filter(m=>m&&!m.draft&&!m.borrador&&/^https?:\/\//i.test(m.download_url||''));
const all=fs.readdirSync(DIR).filter(f=>f.endsWith('.json')).map(f=>{try{return{slug:f.slice(0,-5),file:p.join(DIR,f),...JSON.parse(fs.readFileSync(p.join(DIR,f),'utf8'))}}catch{return null}}).filter(m=>m&&!m.draft&&!m.borrador);
const imgUrls=new Map();for(const m of all)for(const u of [m.cover,...(Array.isArray(m.screenshots)?m.screenshots:[])])if(/^https?:\/\//i.test(u||''))(imgUrls.get(u)||imgUrls.set(u,[]).get(u)).push(m.slug);
const byUrl=new Map();for(const m of mods){const u=m.download_url.trim();(byUrl.get(u)||byUrl.set(u,[]).get(u)).push(m)}
const req=async(url,method)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),TO);
  try{return await fetch(url,{method,redirect:'follow',signal:c.signal,headers:{'user-agent':UA,accept:'text/html,*/*','accept-language':'es,en;q=0.8',...(method==='GET'?{range:'bytes=0-0'}:{})}})}finally{clearTimeout(t)}};
// Webs que bloquean a los robots aunque el enlace sea correcto (X/Twitter): se dan por buenas para no abrir falsos avisos
const SKIP=/(^|\.)(x\.com|twitter\.com|t\.co)$/i;
const check=async url=>{
  try{if(SKIP.test(new URL(url).hostname))return{s:'ok',d:'omitido (X bloquea robots)'};let r=await req(url,'HEAD');if(r.status>=400&&r.status!==404&&r.status!==410)r=await req(url,'GET');
    if(r.status===404||r.status===410)return{s:'broken',d:'HTTP '+r.status};
    if(r.status<400)return{s:'ok',d:'HTTP '+r.status};
    return{s:'unsure',d:'HTTP '+r.status}}
  catch(e){const c=(e.cause&&e.cause.code)||e.code||'';
    if(['ENOTFOUND','ECONNREFUSED','ERR_INVALID_URL'].includes(c))return{s:'broken',d:c};
    return{s:'unsure',d:e.name==='AbortError'?'tiempo agotado':(c||e.message)}}};
(async()=>{
  const urls=[...byUrl.keys(),...[...imgUrls.keys()].filter(u=>!byUrl.has(u))],res=new Map();let i=0;
  await Promise.all(Array.from({length:6},async()=>{while(i<urls.length){const u=urls[i++];res.set(u,await check(u))}}));
  const imgRows=[...imgUrls.keys()].map(u=>({url:u,...res.get(u),mods:[...new Set(imgUrls.get(u))]})).filter(r=>r.s==='broken');
  const rows=[...byUrl.keys()].map(u=>({url:u,...res.get(u),mods:byUrl.get(u).map(m=>m.slug)}));
  // si TODO falla por red, el problema es del ejecutor, no de los enlaces
  if(rows.length&&rows.every(r=>r.s!=='ok')&&rows.every(r=>/ENOTFOUND|tiempo agotado|ECONNREFUSED|fetch failed/.test(r.d))){console.error('Ningún enlace responde: parece que no hay red. No se genera informe.');process.exit(2)}
  const B=rows.filter(r=>r.s==='broken'),U=rows.filter(r=>r.s==='unsure');
  // semanas seguidas con el enlace roto
  const STATE=process.env.STATE_FILE||'.github/link-state.json',AFTER=+process.env.MARK_AFTER||3;let st={};try{st=JSON.parse(fs.readFileSync(STATE,'utf8'))}catch{}
  const next={};for(const r of B)next[r.url]={fails:((st[r.url]&&st[r.url].fails)||0)+1};
  const marked=[];
  if(process.env.AUTO_MARK==='1')for(const r of B.filter(r=>next[r.url].fails>=AFTER))for(const sl of r.mods){const m=all.find(x=>x.slug===sl);
    if(m&&/Publicado/.test(m.status||'')){const {slug,file,...raw}=m;raw.status='🔴 Pendiente de actualización';fs.writeFileSync(file,JSON.stringify(raw,null,2)+'\n');marked.push(sl)}}
  fs.mkdirSync(p.dirname(STATE),{recursive:true});fs.writeFileSync(STATE,JSON.stringify(next,null,1)+'\n');
  const line=r=>`- **${r.mods.join(', ')}** — ${r.d} — ${r.url}`;
  const wk=r=>` (${next[r.url]?next[r.url].fails:0} semana(s) seguida(s))`;
  const md=B.length||U.length||imgRows.length?`Revisión automática de enlaces de descarga (${new Date().toISOString().slice(0,10)}): ${rows.length} enlaces, ${B.length} rotos, ${U.length} dudosos, ${imgRows.length} imagen(es) externa(s) caída(s).\n\n`
    +(B.length?`### Rotos\n${B.map(r=>line(r)+wk(r)).join('\n')}\n\n`:'')+(marked.length?`### Marcados automáticamente como «Pendiente de actualización»\n${marked.map(x=>'- '+x).join('\n')}\n\n`:'')
    +(imgRows.length?`### Imágenes externas caídas (ejecuta scripts/imagenes.js o sube otra imagen)\n${imgRows.map(line).join('\n')}\n\n`:'')+(U.length?`### Dudosos (revisar a mano)\n${U.map(line).join('\n')}\n`:''):'';
  fs.writeFileSync('link-report.md',md);fs.writeFileSync('link-report.json',JSON.stringify({total:rows.length,broken:B.length,unsure:U.length,imgBroken:imgRows.length,marked,rows},null,1));
  console.log(`${rows.length} enlaces: ${rows.length-B.length-U.length} bien, ${B.length} rotos, ${U.length} dudosos · ${imgRows.length} imagen(es) externa(s) caída(s)${marked.length?` · marcados: ${marked.join(', ')}`:''}`);B.concat(U,imgRows).forEach(r=>console.log(line(r)));
})();
