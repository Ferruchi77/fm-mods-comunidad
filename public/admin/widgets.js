/* Campos propios del panel (v.12)
   · fmdate  → fecha con el selector nativo del navegador. Sustituye al «datetime» de Decap, que al escribir un «0» reiniciaba el campo y no dejaba teclear años como 2026.
              Guarda el mismo formato de siempre: YYYY-MM-DD.
   · fmpaths → una ruta de instalación por cada «Versión de FM» elegida en el mod. Guarda una lista [{version, path}].
   · fmrich  → (v.19) editor de texto enriquecido para la descripción y los cambios de cada versión: negrita, lista con guiones y color de texto.
               Guarda texto con un marcado sencillo (**negrita**, [color=#rrggbb]…[/color], líneas «- »); la conversión vive en /admin/richtext.js. */
(function(){
  const CMSx=window.CMS,h=window.h||(CMSx&&CMSx.h),mk=window.createClass||(CMSx&&CMSx.createClass);
  if(!CMSx||!h||!mk){console.warn('widgets.js: panel no disponible');return}
  const plain=v=>v&&typeof v.toJS==='function'?v.toJS():v;

  const DateControl=mk({
    render(){
      const raw=this.props.value,v=raw?String(raw).slice(0,10):'';
      return h('input',{type:'date',id:this.props.forID,className:this.props.classNameWrapper,value:v,min:'1990-01-01',max:'2100-12-31',
        onChange:e=>this.props.onChange(e.target.value),style:{maxWidth:'220px'}});
    }
  });
  const DatePreview=mk({render(){return h('span',null,String(this.props.value||''))}});
  CMSx.registerWidget('fmdate',DateControl,DatePreview);

  const PathsControl=mk({
    // Decap no vuelve a pintar este campo cuando cambias «Versiones de FM» en otro, así que se lee el borrador al día (getEntry) y se vigila cada medio segundo.
    versions(){
      const e=this.props.getEntry?this.props.getEntry():this.props.entry,d=e&&e.get&&e.get('data'),v=plain(d&&d.get&&d.get('fm_versions'));
      return Array.isArray(v)?v.filter(Boolean):[];
    },
    componentDidMount(){this._k=this.versions().join('|');this._t=setInterval(()=>{const k=this.versions().join('|');if(k!==this._k){this._k=k;this.forceUpdate()}},500)},
    componentWillUnmount(){clearInterval(this._t)},
    current(){const v=plain(this.props.value);return Array.isArray(v)?v:[]},
    set(ver,path,all){
      const keep=this.current().filter(x=>x&&x.version!==ver);
      if(path.trim())keep.push({version:ver,path});
      keep.sort((a,b)=>all.indexOf(a.version)-all.indexOf(b.version));
      this.props.onChange(keep);
    },
    render(){
      const vs=this.versions(),cur=this.current(),box={border:'1px solid #d5d9e2',borderRadius:'8px',padding:'12px',background:'#f8f9fb'};
      if(vs.length<2)return h('div',{style:box,id:this.props.forID},
        h('p',{style:{margin:0,color:'#475066'}},'Elige 2 o más «Versiones de FM» en la pestaña 1 para poder poner una ruta distinta a cada una. Con una sola versión basta el campo «Ruta de instalación» de arriba.'));
      return h('div',{style:box,id:this.props.forID},
        vs.map(ver=>{const x=cur.find(c=>c&&c.version===ver);
          return h('label',{key:ver,style:{display:'flex',alignItems:'center',gap:'10px',margin:'0 0 8px'}},
            h('b',{style:{minWidth:'62px'}},ver),
            h('input',{type:'text',value:x?x.path:'',placeholder:'Vacío = se calcula sola según la categoría',
              onChange:e=>this.set(ver,e.target.value,vs),style:{flex:1,padding:'8px 10px',border:'1px solid #c9ced8',borderRadius:'6px',font:'inherit'}}));
        }),
        h('p',{style:{margin:'6px 0 0',fontSize:'12px',color:'#6b7280'}},'Si dejas una versión vacía, esa usa la ruta automática. En la web cada ruta sale con su botón «Copiar ruta · FMxx».'));
    }
  });
  const PathsPreview=mk({render(){return h('span',null,'')}});
  CMSx.registerWidget('fmpaths',PathsControl,PathsPreview);

  // ───── fmrich · editor de texto enriquecido (justificado) ─────
  const RT=window.FMRich;
  if(RT){
    const COLORS=['#dc2626','#ea580c','#ca8a04','#16a34a','#2563eb','#7c3aed','#db2777','#475569'];
    const RichControl=mk({
      getInitialState(){return{src:false,color:'#2563eb'}},
      value(){const v=this.props.value;return v==null?'':String(v)},
      paint(){const ed=this.ed;if(ed)ed.innerHTML=RT.toHtml(this._last)},
      componentDidMount(){this._last=this.value();this.paint();
        this._sel=()=>{const s=window.getSelection&&window.getSelection();if(s&&s.rangeCount&&this.ed&&this.ed.contains(s.anchorNode))this._rng=s.getRangeAt(0).cloneRange()};
        document.addEventListener('selectionchange',this._sel)},
      componentDidUpdate(){   // un cambio que no viene de este editor (otra entrada, deshacer…): se vuelve a pintar
        const v=this.value();if(v!==this._last&&!this.state.src){this._last=v;if(this.ed&&document.activeElement!==this.ed)this.paint()}},
      componentWillUnmount(){document.removeEventListener('selectionchange',this._sel)},
      push(md){if(md===this._last)return;this._last=md;this.props.onChange(md)},
      fromEditor(){if(this.ed)this.push(RT.toMarkup(this.ed))},
      focusEd(){const ed=this.ed;if(!ed)return;ed.focus();
        if(this._rng){const s=window.getSelection();s.removeAllRanges();s.addRange(this._rng)}},
      cmd(name,val){this.focusEd();try{document.execCommand(name,false,val)}catch(e){}this.fromEditor()},
      color(c){this.focusEd();
        try{document.execCommand('styleWithCSS',false,true);document.execCommand('foreColor',false,c);document.execCommand('styleWithCSS',false,false)}catch(e){}
        this.fromEditor()},
      toggleSrc(){
        if(this.state.src){this.setState({src:false},()=>this.paint())}   // del marcado al editor
        else{this.fromEditor();this.setState({src:true})}},
      render(){
        const T=this,st=this.state,field=this.props.field,mh=+((field&&field.get&&field.get('min_height'))||180);
        const btn=(label,title,onClick,extra)=>h('button',{type:'button',title,'aria-label':title,className:'fmr-b',onMouseDown:e=>e.preventDefault(),onClick,...extra},label);
        return h('div',{id:this.props.forID,className:'fmr'},
          h('div',{className:'fmr-bar',role:'toolbar'},
            btn(h('b',null,'N'),'Negrita',()=>T.cmd('bold'),{disabled:st.src}),
            btn('• Lista','Lista con guiones (cada línea empieza por «- »)',()=>T.cmd('insertUnorderedList'),{disabled:st.src}),
            h('span',{className:'fmr-sep'}),
            h('span',{className:'fmr-lbl'},'Color:'),
            COLORS.map(c=>h('button',{key:c,type:'button',className:'fmr-sw',title:'Color '+c,'aria-label':'Color '+c,disabled:st.src,style:{background:c},onMouseDown:e=>e.preventDefault(),onClick:()=>T.color(c)})),
            h('input',{type:'color',className:'fmr-col',title:'Elegir otro color',value:st.color,disabled:st.src,
              onMouseDown:()=>T._sel&&T._sel(),
              onChange:e=>{T.setState({color:e.target.value});T.color(e.target.value)}}),
            btn('Quitar formato','Quita negrita y color del texto seleccionado',()=>T.cmd('removeFormat'),{disabled:st.src}),
            h('span',{className:'fmr-grow'}),
            btn(st.src?'✎ Editor':'</> Código',st.src?'Volver al editor visual':'Ver y editar el marcado en bruto',()=>T.toggleSrc(),{className:'fmr-b fmr-code'})),
          st.src
            ?h('textarea',{className:'fmr-ed fmr-ta',style:{minHeight:mh+'px'},value:this.value(),spellCheck:true,onChange:e=>T.push(e.target.value)})
            :h('div',{className:'fmr-ed',contentEditable:true,suppressContentEditableWarning:true,spellCheck:true,style:{minHeight:mh+'px'},
                ref:el=>{T.ed=el},role:'textbox','aria-multiline':'true',
                onInput:()=>T.fromEditor(),
                onBlur:()=>T.fromEditor(),
                onPaste:e=>{e.preventDefault();const t=(e.clipboardData||window.clipboardData).getData('text/plain');document.execCommand('insertText',false,t)}}),
          h('p',{className:'fmr-help'},'Selecciona un texto y usa los botones. Se ve justificado, como en la ficha. Elige colores que se lean bien tanto en el tema claro como en el oscuro.'));
      }
    });
    const RichPreview=mk({render(){return h('div',{dangerouslySetInnerHTML:{__html:window.FMFicha?FMFicha.rich(this.props.value):''}})}});
    CMSx.registerWidget('fmrich',RichControl,RichPreview);
  }else console.warn('widgets.js: richtext.js no cargado; se usa el campo de texto normal');
})();
