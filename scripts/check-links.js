#!/usr/bin/env node
// Comprueba los enlaces de descarga de content/mods/*.json y escribe link-report.md (+ link-report.json).
//   rotos   → 404/410, dominio que no existe o conexión rechazada: casi seguro caídos.
//   dudosos → 403/429/5xx o tiempo agotado: muchos hosts bloquean a los robots; conviene mirarlos a mano.
// Limitación: MEGA, Discord y Drive devuelven «200» aunque el archivo/invitación ya no exista; esos casos no se detectan.
// Uso: node scripts/check-links.js   (MODS_DIR=ruta para otra carpeta)
const fs=require('fs'),p=require('path');
const DIR=process.env.MODS_DIR||'content/mods',UA='Mozilla/5.0 (compatible; FMModsLinkCheck/1.0; +https://github.com)',TO=15000;
const mods=fs.readdirSync(DIR).filter(f=>f.endsWith('.json')).map(f=>{try{return{slug:f.slice(0,-5),...JSON.parse(fs.readFileSync(p.join(DIR,f),'utf8'))}}catch{return null}})
  .filter(m=>m&&!m.draft&&!m.borrador&&/^https?:\/\//i.test(m.download_url||''));
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
  const urls=[...byUrl.keys()],res=new Map();let i=0;
  await Promise.all(Array.from({length:6},async()=>{while(i<urls.length){const u=urls[i++];res.set(u,await check(u))}}));
  const rows=urls.map(u=>({url:u,...res.get(u),mods:byUrl.get(u).map(m=>m.slug)}));
  // si TODO falla por red, el problema es del ejecutor, no de los enlaces
  if(rows.length&&rows.every(r=>r.s!=='ok')&&rows.every(r=>/ENOTFOUND|tiempo agotado|ECONNREFUSED|fetch failed/.test(r.d))){console.error('Ningún enlace responde: parece que no hay red. No se genera informe.');process.exit(2)}
  const B=rows.filter(r=>r.s==='broken'),U=rows.filter(r=>r.s==='unsure');
  const line=r=>`- **${r.mods.join(', ')}** — ${r.d} — ${r.url}`;
  const md=B.length||U.length?`Revisión automática de enlaces de descarga (${new Date().toISOString().slice(0,10)}): ${rows.length} enlaces, ${B.length} rotos, ${U.length} dudosos.\n\n`
    +(B.length?`### Rotos\n${B.map(line).join('\n')}\n\n`:'')+(U.length?`### Dudosos (revisar a mano)\n${U.map(line).join('\n')}\n`:''):'';
  fs.writeFileSync('link-report.md',md);fs.writeFileSync('link-report.json',JSON.stringify({total:rows.length,broken:B.length,unsure:U.length,rows},null,1));
  console.log(`${rows.length} enlaces: ${rows.length-B.length-U.length} bien, ${B.length} rotos, ${U.length} dudosos`);B.concat(U).forEach(r=>console.log(line(r)));
})();
