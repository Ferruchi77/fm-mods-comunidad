// Editor de texto enriquecido del panel (v.19): conversión marcado ⇄ HTML del editor. Necesita jsdom (la acción «Comprobar» lo instala; sin él se omite).
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
