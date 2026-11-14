# Cambios

## v.2.0 (auditoría técnica)
**Seguridad**
- `/api/stats`: `STATS_SALT` obligatoria (sin clave por defecto, 503 si falta), identificador con HMAC-SHA256, IPv6 agrupada por /64, rechazo de peticiones entre sitios (`Origin` / `Sec-Fetch-Site`) y de peticiones sin IP (antes compartían el cubo «anon»). +1 prueba.
- Panel: nuevas `netlify/functions/auth.mjs` y `callback.mjs` (login con GitHub, anti-CSRF con `state`, lista `GITHUB_ALLOWED_USERS`) y `scripts/migrar-cms.js` (con `--atras`). `local_backend` ya no está activo por defecto. *Corrección:* el CHANGELOG v.1.7 las daba por existentes pero no estaban en el repositorio.
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

## v.1.9
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

## v.1.8
**Pendientes de la v.17**
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

## v.1.7 — menos créditos de Netlify y pendientes cerrados
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

## v.1.6
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

## v.1.5 (incluye v.1.3 y v.1.4)
- Una URL por idioma: español en la raíz (`/`) y el resto en `/en/`, `/ca/`, `/fr/`, `/pt-br/`, `/it/`. Cada página se genera ya traducida (título, descripción, `<html lang>`, `canonical`, `hreflang`, `x-default`) y el `sitemap.xml` lista todas con sus alternativas.
- El selector de idioma son enlaces a la misma página en cada idioma. Al elegir uno se recuerda y, si abres la portada en español (`/`), se salta al idioma guardado. Elegir «Español» lo desactiva.
- Aviso Legal y Privacidad siguen solo en español (`/aviso-legal/`, `/privacidad/`); el RSS también.
- Portugués: pasa a ser portugués de Brasil de forma explícita: nombre «Português (Brasil)», bandera de Brasil, URL `/pt-br/`, `lang="pt-BR"`.
- Las traducciones de las novedades (y del texto breve de las tarjetas) las hace Claude: `node scripts/translate.js --check` lista lo que falta; Claude devuelve el JSON y se añade con `--import`. Se retiran las claves de API.
- Italiano (`locales/it.json`).

## v.1.3
- Nuevo idioma: italiano (`locales/it.json`, bandera, nombre de categoría opcional en el panel).
- Novedades: el texto de cada novedad (y el texto breve de las tarjetas) se muestra en el idioma del visitante.
  - Las 8 novedades actuales ya están traducidas (`content/traducciones.json`).
  - Los textos nuevos o editados los traduce solos `scripts/translate.js` desde la acción de GitHub (secreto con la clave de la API).
  - Sin el secreto no falla: esos textos se ven en español. `node scripts/translate.js --check` lista lo pendiente.
  - Una traducción se puede corregir a mano en `content/traducciones.json`; no se toca mientras el texto original no cambie.

## v.1.2
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
