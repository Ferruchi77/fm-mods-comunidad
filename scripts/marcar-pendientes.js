#!/usr/bin/env node
// Cuando sale un parche del juego, los mods de esa versión pueden dejar de funcionar. Este script los marca en bloque como
// «🔴 Pendiente de actualización» (y los devuelve a «🟢 Publicado» cuando ya están revisados).
//   node scripts/marcar-pendientes.js FM27            muestra qué cambiaría (no escribe nada)
//   node scripts/marcar-pendientes.js FM27 --apply    marca como pendientes los mods «🟢 Publicado» de FM27
//   node scripts/marcar-pendientes.js FM27 --clear --apply   devuelve a «🟢 Publicado» los que estén pendientes
//   --only=slug1,slug2   limita la operación a esos mods (por ejemplo, para liberar solo los ya revisados)
// Variables: MODS_DIR (carpeta de fichas, por defecto content/mods).
const fs=require('fs'),p=require('path');
const DIR=process.env.MODS_DIR||'content/mods',PUB='🟢 Publicado',PEND='🔴 Pendiente de actualización';
const a=process.argv.slice(2),ver=(a.find(x=>/^fm\s*\d{2}$/i.test(x))||'').replace(/\s+/g,'').toUpperCase();
const apply=a.includes('--apply'),clear=a.includes('--clear'),only=(a.find(x=>x.startsWith('--only='))||'').slice(7).split(',').filter(Boolean);
if(!ver){console.error('Uso: node scripts/marcar-pendientes.js FM27 [--apply] [--clear] [--only=slug,slug]');process.exit(1)}
let n=0;
for(const f of fs.readdirSync(DIR).filter(f=>f.endsWith('.json'))){
  const file=p.join(DIR,f),slug=f.slice(0,-5);let m;try{m=JSON.parse(fs.readFileSync(file,'utf8'))}catch{continue}
  if(only.length&&!only.includes(slug))continue;
  const vers=[].concat(m.fm_versions||m.fm_version||[]).map(v=>String(v).replace(/\s+/g,'').toUpperCase());
  if(!vers.includes(ver))continue;
  const from=clear?PEND:PUB,to=clear?PUB:PEND;
  if(!String(m.status||'').includes(from.slice(2).split(' ')[0]))continue;   // «Publicado» / «Pendiente»
  console.log(`${apply?'✓':'·'} ${slug}: ${m.status} → ${to}`);n++;
  if(apply){m.status=to;fs.writeFileSync(file,JSON.stringify(m,null,2)+'\n')}
}
console.log(n?`${apply?'Cambiados':'Se cambiarían'} ${n} mod(s).${apply?'':' Añade --apply para guardar.'}`:'No hay mods que cambiar.');
