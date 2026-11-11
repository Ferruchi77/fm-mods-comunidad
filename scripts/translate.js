#!/usr/bin/env node
// Traducciones de los textos libres que escriben los editores en español:
//   · el texto de cada novedad (updates[].note)   · el texto breve de la tarjeta (card_text)   · el nombre del mod (title, v.19)
// Se guardan en content/traducciones.json  { "<hash del texto>": { en, ca, fr, pt, it } }  y build.js los usa en cada idioma.
// Las traducciones las hace Claude (no hay servicio de pago): tú solo le pasas lo que falta.
//
//   node scripts/translate.js --check              lista los textos que faltan por traducir (cópialos y pégalos en el chat)
//   node scripts/translate.js --import nuevas.json  añade las traducciones que te devuelva Claude: { "<hash>": { "en": "...", "ca": "...", "fr": "...", "pt": "...", "it": "..." } }
//
// Si un texto aún no está traducido, la web lo muestra en español en los demás idiomas (no se rompe nada).
// Para corregir una traducción a mano, edita su entrada en content/traducciones.json; no se toca mientras el texto original no cambie.
// «pt» = portugués de Brasil.
const fs=require('fs'),p=require('path'),crypto=require('crypto');
const LANGS=['en','ca','fr','pt','it'];
const DIR=process.env.MODS_DIR||'content/mods',FILE=process.env.TR_FILE||'content/traducciones.json';
const hash=t=>crypto.createHash('sha1').update(String(t).trim(),'utf8').digest('hex').slice(0,12);

const src=new Map();
for(const f of fs.existsSync(DIR)?fs.readdirSync(DIR).filter(f=>f.endsWith('.json')):[]){
  let m;try{m=JSON.parse(fs.readFileSync(p.join(DIR,f),'utf8'))}catch{continue}
  const add=t=>{t=String(t||'').trim();if(t)src.set(hash(t),t)};
  add(m.title);add(m.card_text);(m.updates||[]).forEach(u=>add(u&&u.note))}
let cache={};try{cache=JSON.parse(fs.readFileSync(FILE,'utf8'))}catch{}
const done=e=>e&&LANGS.every(l=>typeof e[l]==='string'&&e[l].trim());
const save=()=>{for(const h of Object.keys(cache))if(!src.has(h))delete cache[h];   // limpia lo que ya no se usa
  const out=JSON.stringify(Object.fromEntries(Object.entries(cache).sort()),null,2)+'\n';
  if(!fs.existsSync(FILE)||fs.readFileSync(FILE,'utf8')!==out){fs.mkdirSync(p.dirname(FILE),{recursive:true});fs.writeFileSync(FILE,out);console.log('Guardado',FILE)}else console.log('Sin cambios en',FILE)};

const a=process.argv.slice(2),i=a.indexOf('--import');
if(i>-1){
  let inc;try{inc=JSON.parse(fs.readFileSync(a[i+1],'utf8'))}catch(e){console.error('No se pudo leer el archivo de traducciones:',e.message);process.exit(1)}
  let n=0;
  for(const [h,e] of Object.entries(inc)){
    if(!src.has(h)){console.warn('⚠ ',h,'no corresponde a ningún texto actual: se ignora');continue}
    if(!done(e)){console.warn('⚠ ',h,'incompleto (faltan idiomas): se ignora');continue}
    cache[h]=Object.fromEntries(LANGS.map(l=>[l,String(e[l]).trim()]));n++}
  console.log(`Importadas ${n} traducción(es)`);save();
}else{
  const todo=[...src].filter(([h])=>!done(cache[h]));
  console.log(`Textos: ${src.size} · traducidos: ${src.size-todo.length} · pendientes: ${todo.length}`);
  if(todo.length){console.log('\nPásale esto a Claude para que lo traduzca a en, ca, fr, pt (Brasil) e it:\n');console.log(JSON.stringify(Object.fromEntries(todo),null,2))}
  // --report: deja trad-report.md y trad-report.json para la acción de GitHub «Traducciones pendientes» (abre/cierra un issue)
  if(a.includes('--report')){
    fs.writeFileSync('trad-report.json',JSON.stringify({pending:todo.length,total:src.size}));
    fs.writeFileSync('trad-report.md',todo.length?`Hay **${todo.length}** texto(s) de novedades o tarjetas sin traducir (se ven en español en en, ca, fr, pt-br e it).\n\n**Cómo resolverlo:** pega el JSON de abajo en un chat con Claude, pídele que lo traduzca a en, ca, fr, pt (Brasil) e it manteniendo las claves, guarda su respuesta como \`nuevas.json\` y ejecuta \`node scripts/translate.js --import nuevas.json\`.\n\n\`\`\`json\n${JSON.stringify(Object.fromEntries(todo),null,2).slice(0,55000)}\n\`\`\`\n`:'');
  }
  if(!a.includes('--check'))save();
}
