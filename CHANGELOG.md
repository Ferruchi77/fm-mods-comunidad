# Cambios

*Formato de versión: **V2.3** (mayor.menor). La siguiente será V2.4, y así sucesivamente.*

## V2.5 (descripciones traducidas, enlaces por versión y descargas en verde)
- **Descripciones traducidas en los 6 idiomas.** El texto completo de cada mod (`description`), sus pasos de instalación (`instructions`) y el aviso de compatibilidad (`compat_note`) pasan por `content/traducciones.json` igual que el nombre y el texto breve: se ven en la ficha, en la meta descripción (SEO) y en el JSON-LD de cada idioma. 60 textos nuevos traducidos (nombres propios, rutas y nombres de archivo se mantienen). `scripts/translate.js --check` ya los incluye como pendientes cuando añadas o cambies una descripción.
- **Limpieza de formato en español** (entrada `es`, sin tocar las fichas): se quitan las marcas `[cite:]` sueltas de *Dressing Room Kit Fix*, *wfm18 3D Sleeves Megapack* y *MVP Graphics JGT*; se arreglan los saltos de línea de *Kojuro Skin* y *FM Kit Switcher*, y los pasos de instalación de *Kit Converter*.
- **Enlaces de descarga por versión de FM (opcional).** Nuevo campo del panel *Enlaces de descarga por versión de FM*, pestaña «2 · Autores y enlaces»: sale una casilla por cada versión marcada en «Versiones de FM» (solo si el mod tiene 2 o más). Lo que dejes vacío usa el enlace de descarga general; si no rellenas ninguna, la ficha es la de siempre (un solo botón). Si rellenas alguna, la web muestra **un botón «Descargar para FMxx» por versión**, la más reciente primero y destacada. Se guarda como `download_urls: [{version, url}]`; el build avisa (sin fallar) de enlaces mal escritos o de versiones no marcadas. Una descarga cuenta una vez por persona y mod, sea cual sea el botón.
- **Número de descargas en el verde de acento** de la web (tarjetas y ficha).
- Textos del botón en los 6 idiomas (`dl_btn_ver`: «Descargar para {v}»).

## V2.4 (correcciones de texto)
- Corregidos tres textos en la web en español sin tocar las fichas (entrada `es` de `content/traducciones.json`): «Megapack Chándales» (faltaba el acento), «Medios de Comunicación Reales» (faltaba el *de*) y «Megapack de realismo» en la descripción breve de *Increase Realism Megapack* (decía «realism»). En el resto de idiomas no cambia nada.

## V2.3 (página de Inicio, textos nuevos y CI que no se rompe al actualizar)
- **Página de Inicio (`/`) nueva** y **catálogo en `/mods/`**. Inicio: hero con el buscador al centro y dos botones (*Ver todos los mods* / *Cómo instalar*), guía de instalación plegable, **categorías como teselas** (con icono, descripción y nº de mods; enlazan a las páginas de categoría), imprescindibles, últimos 8 mods, novedades y los bloques de café y X. Catálogo: el listado completo con todos los filtros, píldoras de versión, orden y vista en lista (sin cambios de comportamiento).
- **Menú:** nuevos enlaces *Inicio* y *Mods* (la página actual queda subrayada) y las categorías ahora apuntan a `/mods/?cat=…`. También en el pie.
- **Enlaces antiguos:** `/?cat=skins`, `/?q=…`, `/?ver=FM27`… redirigen solos a `/mods/…` (en cada idioma). El buscador de cualquier página envía a `/mods/?q=…`. El `sitemap.xml`, los `hreflang` y el JSON-LD de búsqueda incluyen `/mods/`.
- **Texto de la portada más atractivo** en los 6 idiomas: *«Dale otra cara a tu Football Manager»* + *«Skins, caras, estadios, bases de datos y plugins elegidos por la comunidad. Cada mod con su versión compatible y la ruta de instalación lista para copiar.»*
- **Claves nuevas** en `locales/*.json` (los 6 idiomas): `nav_home`, `nav_mods`, `mods_h1`, `mods_p`, `seo_mods_t`, `seo_mods_d`, `cats_h2`, `mods_all`; `hero_h1` y `hero_p` reescritas.
- **Versiones con el formato V2.3** (antes `v.23`): también en el pie de la web, en `package.json` (2.3.0) y en todo el historial de este archivo (V1.9, V2.0, V2.1, V2.2…).
- **CI (GitHub Actions) que no se rompe al actualizar:** los tests de *contenido* (fichas con `install_path` sin ruta, `utm_`, campo `author` antiguo) pasan a **avisar sin fallar**, porque lo que guarda el panel no debe tumbar el despliegue. Desaparece el test que exigía borrar `imagenes.yml`; en su lugar, `scripts/obsoletos.json` lista los archivos que ya no hacen falta y el CI los **avisa** (`::warning`) sin fallar. En cada entrega nueva se añaden ahí los archivos que haya que borrar.
- **Nombres de mod traducidos en cada idioma** (`content/traducciones.json`): los nombres descriptivos se traducen (p. ej. *Stadium Megapack* → «Megapack de Estadios», «Megapack d'Estadis», «Mégapack de Stades»…) y los nombres propios o de marca se mantienen (*FaceDrop*, *TCM Logos*, *Regenesis 27*…). Además, un mod con el título escrito en inglés **ahora también sale con su nombre en español en la web en español** (entrada opcional `es` en `traducciones.json`; `translate.js --import` la acepta). El buscador propone el nombre en el idioma de la página y sigue encontrando el original.
- **Fichas renombradas** para que el archivo coincida con el título: `marcador-pro-fm26` → `tcm-logos`, `megapack-caras-fm26` → `megapack-de-caras-df11`, `panda-individual` → `fmdestiny-con-modo-propietario`, `skin-darkflow-fm26` → `balones-3d-temporada-26-27`, `bd-nombres-reales-fm27` → `nombres-reales`, `nombre-jugadores` → `nombre-jugadores-en-partido`, `actionlink-kits-3d` → `fm-actionlink-kits-3d`, `fm27-bootpack` → `fm-bootpack`, `stadium-megapack-1` → `stadium-megapack`. `scripts/renombrados.json` es la lista oficial: de ahí salen las **redirecciones 301** (`/mod/antiguo/` → `/mod/nuevo/` en los 6 idiomas), el **alias de estadísticas** (votos, valoraciones y descargas se conservan) y la migración de favoritos, «me gusta» y valoraciones guardados en el navegador. El CI avisa de las fichas antiguas que haya que borrar y de cualquier archivo que no coincida con su título (sin fallar).
- 22 traducciones de novedades y textos breves que estaban pendientes.
- Nueva guía `ACTUALIZAR.md` con los pasos para subir una versión a GitHub sin dejar archivos viejos ni carpetas fuera de sitio.

## V2.2 (interfaz: paleta, buscador, píldoras y tarjetas)
- **Paleta con variables `:root`:** fondo `#0f172a`, tarjetas `#162036`/`#1e2b45` y acento esmeralda `#10b981` reservado a botones de acción, filtros activos e insignias destacadas (Imprescindible, Nuevo). Tema claro de alto contraste (fondo `#f1f5f9`, tarjetas blancas con borde, acento `#047857`). Texto principal, secundario y texto sobre el acento cumplen WCAG AA (mínimo 5,0:1) en ambos temas.
- **CSS reescrito y ordenado** en 17 secciones con índice (fuentes, variables, base, cabecera, hero, filtros, tarjetas, ficha, novedades, bloques finales, móvil…). Sin cambios en los nombres de clase que usa el JS.
- **Hero:** titular de hasta 5,6 rem con más aire; el buscador pasa al centro de la portada (campo grande con borde que se ilumina al enfocar). En la cabecera queda una lupa que lleva a él. En el resto de páginas el buscador sigue en la cabecera.
- **Filtros:** categorías y versiones (FM27 · FM26 · FM24) como píldoras con icono SVG; el activo va relleno de acento y en negrita. Las píldoras de versión se generan desde el `<select>` (que sigue siendo la fuente de verdad: URL, reinicio y recuento) y en móvil las filas se desplazan en horizontal.
- **Tarjetas:** portada 16:9, estado e insignias arriba a la izquierda y versiones abajo a la izquierda; título de hasta 2 líneas, descripción de hasta 3 y, abajo, autor + categoría + fecha en discreto. Elevación `translateY(-4px)` con borde y brillo de acento al pasar el ratón (desactivada con `prefers-reduced-motion`).
- **Guía de instalación:** barra compacta con los cuatro pasos numerados que se despliega (`<details>`).
- **Bloques finales:** «Invitar a un café» y «Síguenos en X» como tarjetas con icono en una cuadrícula de dos columnas.
- **Corregido:** la insignia dinámica «Nuevo» había dejado de pintarse en la V2.1 (se había quitado el contenedor `.ph-b` que usa `app.js`); vuelve a aparecer.
- Tests actualizados (descripción limitada por CSS, fecha de versión neutra) y 2 nuevos.

## V2.1 (rediseño visual)
- **Tipografía propia:** Archivo (variable, licencia OFL) alojada en `/fonts/`, sin servicios externos (la CSP sigue en `font-src 'self'`). Titulares condensados tipo marcador y texto en anchura normal. Precarga de las dos fuentes principales.
- **Paleta:** azul noche sin brillos ni rejilla de fondo ni degradados; el violeta desaparece. El ámbar queda para la acción principal (descargar, botón de apoyo) y los estados activos van en gris azulado. Tema claro a juego.
- **Formas:** se acabaron las píldoras y los círculos: radios de 3–6 px, filetes finos en lugar de cajas.
- **Tarjetas:** la portada manda (3:2), sin caja, sombra ni elevación; versiones e insignias pasan debajo de la imagen como texto (✓ FM26 · FM27) y desaparece la insignia «Actualizado» (la fecha ya sale abajo). En pantallas anchas, el primer imprescindible ocupa 2×2.
- **Portada:** titular más grande, línea de datos reales (nº de mods, versiones, última actualización) y guía de instalación en una fila con números grandes, sin tarjetas.
- **Móvil:** guía compacta, cabecera sin el icono de X y datos sin separadores sueltos.
- Fichas, novedades, categorías y paneles heredan el nuevo estilo (novedades como lista con filetes, compatibilidad con barra lateral).

## V2.0 (auditoría técnica)
**Seguridad**
- `/api/stats`: `STATS_SALT` obligatoria (sin clave por defecto, 503 si falta), identificador con HMAC-SHA256, IPv6 agrupada por /64, rechazo de peticiones entre sitios (`Origin` / `Sec-Fetch-Site`) y de peticiones sin IP (antes compartían el cubo «anon»). +1 prueba.
- Panel: nuevas `netlify/functions/auth.mjs` y `callback.mjs` (login con GitHub, anti-CSRF con `state`, lista `GITHUB_ALLOWED_USERS`) y `scripts/migrar-cms.js` (con `--atras`). `local_backend` ya no está activo por defecto. *Corrección:* el CHANGELOG V1.7 las daba por existentes pero no estaban en el repositorio.
- Cabeceras: HSTS, COOP y `X-Robots-Tag: noindex` en `/admin/*`.
- Workflows: `parche.yml` recibe sus entradas por variables de entorno y las valida; `concurrency` común en los que escriben en `main`; eliminado `imagenes.yml` (duplicaba a `sync-autores.yml`).

**Rendimiento**
- Ficha: imagen principal con `srcset` y miniaturas con la variante `-320`; creadas 135 variantes `-320/-640` que faltaban en portadas y capturas.
- Logo en WebP de 80 px; iconos PNG cuantizados (512 px: 377 KB → 53 KB).
- `sw.js` limita las páginas guardadas a 40.

**SEO y contenido**
- Títulos de ficha más cortos (sin lista de categorías); metadescripción y JSON-LD recortados por palabra; `lastmod` en todo el sitemap.
- JSON-LD de ficha como `SoftwareApplication` (con `offers` si es gratuito) para que `aggregateRating` sea válido.
- `*cursiva*` y `` `código` `` se interpretan en las descripciones (antes se veían los símbolos).
- Manifiesto con iconos 192 y 512 y un icono `maskable` aparte.
- Fichas: `install_path` que eran instrucciones, parámetros `utm_*` en enlaces de Patreon y 18 fichas con el campo antiguo `author` (ahora `authors`).
- Privacidad: se indica el plazo de conservación de los identificadores de voto.

## V1.9
**Panel de administración**
- **Publicación automática:** el panel pasa a `publish_mode: simple`. Con el estado «🟢 Publicado», **Guardar** publica la ficha directamente (commit a `main`, sin ramas ni los pasos «Listo» → «Publicar»). Los «🟡 Borrador / En revisión» se guardan igual pero `build.js` no los publica en la web.
- **Editor de texto enriquecido** (`fmrich`, `public/admin/richtext.js` + `widgets.js`) en la **descripción** y en **«Qué ha cambiado»** de cada versión: **negrita**, lista con guiones, **selector de color** (paleta + color libre), «Quitar formato» y modo «</> Código». El texto se ve **justificado** en el editor y en la vista previa del panel.
  - Se guarda con un marcado simple y seguro: `**negrita**`, `[color=#rrggbb]…[/color]` y líneas `- `. `rich()` (en `ficha.js`) lo convierte en HTML escapando siempre antes; solo admite colores `#rrggbb`. Los textos antiguos sin marcado se ven igual que antes.
  - Extractos de tarjeta, SEO, JSON-LD y RSS usan `plain()` (texto limpio, sin marcas).

**Web**
- **«Últimos mods»:** las tarjetas de la parrilla pasan a **layout vertical**, idéntico al de «Mods imprescindibles»: imagen arriba a todo el ancho (16:9) → nombre → autor (con icono) → descripción (~140 caracteres, completa y también en móvil). La vista en lista (botón opcional) conserva su disposición horizontal.
- **Historial de versiones:** la fecha de actualización es ahora una «pastilla» de color con icono de calendario (`time.ud`; verde para la publicación inicial), distinta del texto de las mejoras.
- **«Más como este»:** pasa de la barra lateral a una sección a todo el ancho bajo la ficha, con **la misma tarjeta y parrilla (`.feat-grid`) que «Mods imprescindibles»** (4 mods; con valoraciones, favoritos, insignias y portada responsive).
- **50 mods de golpe** en la portada (`PAGE=50`, antes 12); «Cargar más» sigue disponible si hay más.
- **Novedades rediseñado** (`/novedades/` y bloque de la portada): tarjetas con portada, tipo (Nuevo / Actualizado + versión), **fecha destacada**, «hace N días», autor, versiones de FM y nota recortada con «Leer más»; **filtros** por tipo (con contadores), periodo (7/30 días) y versión de FM (se guardan en la URL), **salto por meses**, resumen de los últimos 30 días y aviso cuando no hay resultados.
- **Nombre del mod traducido** en cada idioma (tarjetas, ficha, título SEO, JSON-LD, buscador y sugerencias). Usa el mismo sistema que las novedades (`content/traducciones.json`, `scripts/translate.js`); si falta la traducción se ve el original. El buscador encuentra el mod con el nombre de cualquier idioma.

**Traducciones**
- 17 textos nuevos de la interfaz (Novedades) en es, en, ca, fr, pt-BR e it; `news_lead` actualizado.
- Traducidas al completo las 45 novedades/textos breves que estaban pendientes y los nombres de los 44 mods (en, ca, fr, pt-BR, it): **0 pendientes**.

**Mantenimiento**
- GitHub Actions: `actions/checkout@v7` y `actions/setup-node@v7` (runtime Node 24) en todos los workflows, y Node **22** para ejecutar los scripts (antes 20, ya sin soporte). Netlify: `NODE_VERSION = "22"`; `engines.node >= 22`.
- **Comprobar** instala también `jsdom` (solo en CI, sin tocar `package.json`) para la prueba del editor del panel.
- Pruebas: +10 (editor ⇄ marcado, texto enriquecido, tarjetas relacionadas, fecha destacada, Novedades, nombres traducidos, publicación directa, workflows).

## V1.8
**Pendientes de la V1.7**
- `srcset` completo: las tarjetas de la parrilla llevan 320 w + 640 w + la imagen original con su **ancho real** (leído de la cabecera del WebP) y `sizes="(max-width:600px) 46vw, 260px"`; «Más como este» usa 320 w/640 w con `sizes="96px"` (sin cargar nunca el original).
- Portadas externas → WebP en CI sin romper enlaces (`scripts/imagenes.js`):
  - la imagen descargada se valida (debe decodificarse, tamaño máx. 25 MB, un reintento si hay fallo de red/5xx) y se escribe en un `.tmp` que se renombra al terminar;
  - si una descarga falla, la ficha conserva el enlace original (probado con 404, HTML e imagen corrupta);
  - una subida PNG/JPG compartida por varias fichas pasa a WebP en todas y el original solo se borra si ningún JSON de `content/` lo sigue usando;
  - nuevo `--check`: falla si alguna ficha apunta a una imagen local que no existe. Se ejecuta en **Comprobar** (CI) y antes del commit de **Sincronizar autores y optimizar imágenes**.
- CI: **Comprobar** instala `sharp` para ejecutar la prueba de descarga real con un servidor local.

**Mejoras**
- Tarjetas: el texto breve (hasta 140 caracteres) se lee **completo**, sin «…»; la tarjeta crece lo necesario y toda la fila de la parrilla mantiene la misma altura. También en la vista en lista, en «Imprescindibles» y en móvil (antes se ocultaba en pantallas ≤ 420 px). Sin texto breve se mantiene el extracto automático de la descripción.
- Ficha: el selector de **valoración con estrellas** (con medias estrellas, ratón y teclado) pasa a la caja de descarga, justo debajo del botón «Descargar mod» y de las métricas, encima de «Me gusta» / «Favorito». Se elimina el duplicado que había bajo el título.
- Ficha, **icono roto corregido**: el contador «👍 N me gusta» usaba la clase `.fl`, que también es la de las banderas de idioma (caja de 22×15 px con `overflow:hidden`), por eso aparecía como un interruptor truncado entre «★ Sin valoraciones» y «↓ descargas». Ahora usa `.flk` y la barra de métricas queda alineada.
- 40 pruebas automáticas (+9): descarga a WebP, fallos de descarga, imágenes compartidas, `--check`, orden de la caja de descarga, clase `.flk`, texto sin recortar y `srcset`.

## V1.7 — menos créditos de Netlify y pendientes cerrados
**Créditos de Netlify** (en la factura de ejemplo, 495 de 524 créditos eran despliegues de producción: 33 × 15)
- `netlify.toml`: `ignore` cancela el build si el commit no toca nada que llegue a la web (workflows, pruebas, README, scripts, estado de enlaces…).
- Vistas previas de PR y de ramas desactivadas (cada una gastaba un despliegue). Flujo editorial del panel desactivado por lo mismo.
- Los commits automáticos que no cambian nada visible (autores nuevos, estado del comprobador de enlaces) llevan `[skip ci] [skip netlify]`.
- `sync-autores` y la optimización de imágenes son ahora UN solo trabajo y UN solo commit (antes eran dos pushes y dos despliegues por guardado).
- Nueva acción opcional **Desplegar (diario)**: despliega como mucho una vez al día y solo si hubo cambios (ver README, «Modo ahorro máximo»).
- `/api/stats`: el GET se cachea en el CDN (`s-maxage=60`), se evita un HEAD por voto y no se reescribe la ficha si el voto no cambia nada.
- Ancho de banda: portadas con `srcset` 320/640 (cada visitante baja solo la que necesita), WebP calidad 72, portadas descargadas con hash en el nombre y caché `immutable` de un año.

**Pendientes cerrados**
- `scripts/imagenes.js`: portadas/capturas externas → `public/img/covers/` en WebP (320, 640 y 1200/1600 px), sin hotlinking y sin tokens de Patreon que caducan. La acción lo ejecuta sola al guardar una ficha.
- Imágenes responsive: `srcset` en las tarjetas y en «Más como este».
- Login alternativo a Netlify Identity/Git Gateway (obsoletos): `netlify/functions/auth.mjs` + `callback.mjs` (OAuth de GitHub) y `node scripts/migrar-cms.js` que reconfigura el panel (con `--atras` para volver). `GITHUB_ALLOWED_USERS` limita quién entra.
- Votos simultáneos: escritura condicional con etag y reintentos (requiere `@netlify/blobs` ≥ 8.2; con versiones anteriores se comporta como antes). Si hay demasiada cola responde 503 «reintenta» en vez de pisar un voto.
- Tarjetas: al pasar el ratón (o enfocar con teclado) muestran «Actualizado hace…», votos «funciona» y el sitio de descarga.
- 30 pruebas automáticas (+11): concurrencia de votos, OAuth (CSRF, usuarios permitidos), srcset y reglas de ahorro de Netlify.

## V1.6
**Contenido y datos**
- Traducidas las 38 novedades/tarjetas que faltaban (en, ca, fr, pt-br, it): ya no queda nada pendiente.
- `skin-darkflow-fm26` apuntaba a la categoría inexistente `graficos`: ahora solo está en «Gráficos» (`dia-de-partido`). Se quita el campo antiguo `category` de 3 fichas.
- Portadas: la AVIF (`df11-faces`) y el PNG de 1,4 MB (`realnamefix27_1`) pasan a WebP; se generan miniaturas `-640.webp` que usan las tarjetas.

**Usuario**
- Favoritos (botón «Favorito» en la ficha, ♥ en la tarjeta, filtro «Mis favoritos», exportar/importar en un `.json`).
- Filtros nuevos en la portada: autor, precio (gratis/de pago) y «Mostrar» (favoritos, actualizados en 30 días, con capturas). Orden «Actualizados recientemente» y el orden elegido se recuerda.
- Vista en lista o en cuadrícula (se recuerda).
- Insignias «Nuevo» y «Actualizado» en las tarjetas (14 días).
- Ficha: aviso del sitio de descarga (y si suele pedir cuenta o pago), «¿Te funciona?» por versión de FM (Funciona / No funciona), compartir (copiar enlace, X, WhatsApp) y «Más como este».
- Páginas indexables por categoría (`/categoria/skins/`) y por versión (`/version/fm27/`), con enlaces en la ficha y en el pie.
- PWA básica: `manifest.webmanifest` y `sw.js` (abre rápido y funciona sin conexión; no toca `/api` ni `/admin`).
- Aviso cuando las estadísticas no están disponibles.

**Visual y accesibilidad**
- Esqueleto animado mientras cargan las portadas. Enlace «Saltar al contenido». Cambios de la ficha como tarjetas con la versión resaltada y respetando los saltos de línea de las notas.
- Contraste AA: texto blanco sobre botones violeta (dark) y estrellas del tema claro corregidos (`--acb`, `--act`).
- Estilos de impresión de la ficha.
- Corregido: la unión de autores decía «y» en todos los idiomas; ahora usa «and», «i», «et», «e»…

**Admin**
- Nueva página `/admin/estadisticas.html` (botón «📊» en el panel): descargas, me gusta, valoración y «No funciona» por mod, posibles problemas y calidad de las fichas (`/admin/calidad.json`).
- Flujo editorial activado (`publish_mode: editorial_workflow`): cada cambio del panel crea una rama y una vista previa de Netlify antes de publicar.
- Acciones de GitHub nuevas: **Comprobar** (pruebas + build estricto), **Traducciones pendientes** (abre/cierra un issue con el JSON listo para Claude), **Optimizar imágenes** (descarga portadas externas y convierte a WebP), **Marcar pendientes** (pasa a «Pendiente» todos los mods de una versión tras un parche).
- Comprobador de enlaces: revisa también portadas/capturas externas, cuenta semanas seguidas rotas y, tras 3, marca la ficha como «Pendiente de actualización».
- `STRICT=1 node build.js` falla si faltan claves de idioma o hay categorías inexistentes (no por traducciones pendientes).

**Técnico**
- `/api/stats`: lectura con un índice único (`_index`, se reconstruye cada 5 min) en vez de leer un blob por ficha; nueva acción `works`.
- Seguridad: CSP en las páginas públicas (omitida si hay AdSense), `X-Frame-Options`, `Permissions-Policy`.
- JSON-LD: `BreadcrumbList`, `aggregateRating` (con ≥3 valoraciones, leído de `/api/stats` al compilar) y corregida la URL de imagen para portadas externas.
- 19 pruebas automáticas (`npm test`): estadísticas, idiomas y compilación.
- `package.json` sincronizado (1.16.0) y README nuevo.

## V1.5 (incluye V1.3 y V1.4)
- Una URL por idioma: español en la raíz (`/`) y el resto en `/en/`, `/ca/`, `/fr/`, `/pt-br/`, `/it/`. Cada página se genera ya traducida (título, descripción, `<html lang>`, `canonical`, `hreflang`, `x-default`) y el `sitemap.xml` lista todas con sus alternativas.
- El selector de idioma son enlaces a la misma página en cada idioma. Al elegir uno se recuerda y, si abres la portada en español (`/`), se salta al idioma guardado. Elegir «Español» lo desactiva.
- Aviso Legal y Privacidad siguen solo en español (`/aviso-legal/`, `/privacidad/`); el RSS también.
- Portugués: pasa a ser portugués de Brasil de forma explícita: nombre «Português (Brasil)», bandera de Brasil, URL `/pt-br/`, `lang="pt-BR"`.
- Las traducciones de las novedades (y del texto breve de las tarjetas) las hace Claude: `node scripts/translate.js --check` lista lo que falta; Claude devuelve el JSON y se añade con `--import`. Se retiran las claves de API.
- Italiano (`locales/it.json`).

## V1.3
- Nuevo idioma: italiano (`locales/it.json`, bandera, nombre de categoría opcional en el panel).
- Novedades: el texto de cada novedad (y el texto breve de las tarjetas) se muestra en el idioma del visitante.
  - Las 8 novedades actuales ya están traducidas (`content/traducciones.json`).
  - Los textos nuevos o editados los traduce solos `scripts/translate.js` desde la acción de GitHub (secreto con la clave de la API).
  - Sin el secreto no falla: esos textos se ven en español. `node scripts/translate.js --check` lista lo pendiente.
  - Una traducción se puede corregir a mano en `content/traducciones.json`; no se toca mientras el texto original no cambie.

## V1.2
- Tarjetas: campo opcional «Texto breve en la tarjeta» (`card_text`) que se ve en la lista antes de entrar al mod.
- Pantallas grandes: la parrilla pasa a 4 columnas (≥1500 px) y 5 columnas (≥1900 px) y la web se ensancha.
- Imprescindibles: todos a la vista en una rejilla compacta y botón para ocultar/mostrar (se recuerda).
- Panel: la fecha usa el selector nativo (`fmdate`), ya se pueden escribir años con ceros.
- Panel: la ruta de instalación de las categorías empieza en blanco y es libre; si parece completa se usa tal cual y el año «Football Manager NN» se adapta a cada versión.
- Panel + web: ruta de instalación distinta por cada versión de FM (`install_paths`); en la ficha cada ruta lleva «Copiar ruta · FMxx».
- Panel y comprobador de enlaces: x.com / twitter.com / t.co ya no dan falso «enlace caído».
- Panel: el aviso de error al guardar lista los campos que faltan y su pestaña.
- Selector de idioma con banderas.
- Versión visible en el pie de la web, en el panel y en `<meta name="generator">` (constante `version` en `build.js`: sube +1 en cada entrega).
