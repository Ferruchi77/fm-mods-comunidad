/* Campos propios del panel (v.12)
   · fmdate  → fecha con el selector nativo del navegador. Sustituye al «datetime» de Decap, que al escribir un «0» reiniciaba el campo y no dejaba teclear años como 2026.
              Guarda el mismo formato de siempre: YYYY-MM-DD.
   · fmpaths → una ruta de instalación por cada «Versión de FM» elegida en el mod. Guarda una lista [{version, path}]. */
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
})();
