// Editor de texto enriquecido del panel (V1.9): conversión marcado ⇄ HTML del editor. Necesita jsdom (la acción «Comprobar» lo instala; sin él se omite).
const test=require('node:test'),assert=require('node:assert/strict');
let JSDOM=null;try{({JSDOM}=require('jsdom'))}catch{}
const R=require('../public/admin/richtext.js');
const d=JSDOM?new JSDOM('<body></body>').window.document:null;
const skip=JSDOM?false:'jsdom no instalado (npm i --no-save jsdom)';
const el=html=>{const e=d.createElement('div');e.innerHTML=html;return e};
test('ida y vuelta: el marcado no cambia al pasar por el editor',{skip},()=>{
  for(const m of ['Hola mundo','L1\nL2\n\nPárrafo **negrita** y [color=#ff0000]rojo[/color]','- uno\n- dos **b**\n- [color=#00aa00]verde[/color]\n\nTras la lista','Intro:\n- a\n- b\nFin','[color=#ff0000]**rojo negrita**[/color] normal','a < b & c > d "q"'])
    assert.equal(R.toMarkup(el(R.toHtml(m))),m)});
test('entiende el HTML que generan Chrome y Firefox con execCommand',{skip},()=>{
  const t=(h,e)=>assert.equal(R.toMarkup(el(h)),e,h);
  t('abc<div>def</div><div><br></div><div>ghi</div>','abc\ndef\n\nghi');
  t('<div>abc<br></div>','abc');
  t('<b>hola</b> mundo','**hola** mundo');
  t('<font color="#ff0000">rojo</font> y <span style="color: rgb(0, 128, 0);">verde</span>','[color=#ff0000]rojo[/color] y [color=#008000]verde[/color]');
  t('<span style="font-weight: bold;">x</span>','**x**');
  t('<ul><li>uno</li><li><b>dos</b></li></ul><div>fin</div>','- uno\n- **dos**\nfin');
  t('<font color="#ff0000"><b>a</b> b<br>c</font>','[color=#ff0000]**a** b[/color]\n[color=#ff0000]c[/color]');
  t('<font color="#f00">a<font color="#00f">b</font>c</font>','[color=#ff0000]a[/color][color=#0000ff]b[/color][color=#ff0000]c[/color]');
  t('<p>x&nbsp;y</p>','x y');t('','')});
test('el HTML del editor escapa el texto (nada de inyección)',()=>{assert.ok(!R.toHtml('<img src=x onerror=1>').includes('<img'))});

test('V2.6 · listas numeradas: ida y vuelta, mezcla con guiones y numeración que continúa tras un texto intermedio',{skip},()=>{
  const rt=m=>R.toMarkup(el(R.toHtml(m)));
  for(const m of ['1. uno\n2. dos\n3. tres','Antes\n\n1. a\n2. b\n\nDespués','- a\n- b\n\n1. c\n2. d','1. uno\n2. dos: con subpuntos\nSteam: ruta\n3. tres\n4. cuatro'])assert.equal(rt(m),m,m);
  assert.match(R.toHtml('1. a\n2. b'),/^<ol><li>a<\/li><li>b<\/li><\/ol>$/);
  assert.match(R.toHtml('3. c\n4. d'),/^<ol start="3"><li>c<\/li><li>d<\/li><\/ol>$/);
  assert.match(R.toHtml('- a\n1. b'),/^<ul><li>a<\/li><\/ul><ol><li>b<\/li><\/ol>$/);
});
test('V2.6 · entiende el <ol> que genera el navegador con execCommand (insertOrderedList) y se renumera',{skip},()=>{
  assert.equal(R.toMarkup(el('<ol><li>a</li><li>b</li><li>c</li></ol>')),'1. a\n2. b\n3. c');
  assert.equal(R.toMarkup(el('<div>texto</div><ol><li><b>negrita</b> y más</li></ol>')),'texto\n1. **negrita** y más');
  assert.equal(R.toMarkup(el('<ul><li>x</li></ul><ol><li>y</li><li>z</li></ol>')),'- x\n1. y\n2. z');
});
test('V2.6 · el HTML del editor sigue escapando el texto en las listas numeradas',{skip},()=>{
  assert.ok(!R.toHtml('1. <img src=x onerror=alert(1)>').includes('<img'));
});
