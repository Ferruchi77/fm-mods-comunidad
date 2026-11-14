/* Service worker de FM Mods Comunidad (PWA básica). __BUILD__ lo sustituye build.js, así cada despliegue renueva la caché.
   · Páginas (navegación): red primero; si no hay conexión, la última copia guardada o la portada. Se guardan como máximo MAX_PAGES (las más recientes).
   · Estáticos del sitio (css, js, imágenes): se sirven de la caché y se actualizan en segundo plano.
   · NO toca /api/ (estadísticas y votos), /admin/ ni nada de otros dominios. */
const V='fm-__BUILD__',SHELL=['/'],MAX_PAGES=40;
const trim=c=>c.keys().then(ks=>{const pg=ks.filter(k=>{const p=new URL(k.url).pathname;return !/^\/(css|js|img|assets|data)\//.test(p)&&p!=='/manifest.webmanifest'});return Promise.all(pg.slice(0,Math.max(0,pg.length-MAX_PAGES)).filter(k=>new URL(k.url).pathname!=='/').map(k=>c.delete(k)))});
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||/^\/(api|admin|\.netlify)\//.test(u.pathname)||u.pathname==='/sw.js')return;
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c).then(()=>trim(x)))}return res})
      .catch(()=>caches.match(r).then(m=>m||caches.match('/'))));
    return}
  if(/^\/(css|js|img|assets)\//.test(u.pathname)||u.pathname==='/manifest.webmanifest'||/^\/data\/(search|meta)\.json$/.test(u.pathname)){
    e.respondWith(caches.open(V).then(c=>c.match(r).then(m=>{
      const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>m);
      return m||net})))}
});
