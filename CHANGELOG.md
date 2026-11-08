# Cambios

## v.16
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

## v.15 (incluye v.13 y v.14)
- Una URL por idioma: español en la raíz (`/`) y el resto en `/en/`, `/ca/`, `/fr/`, `/pt-br/`, `/it/`. Cada página se genera ya traducida (título, descripción, `<html lang>`, `canonical`, `hreflang`, `x-default`) y el `sitemap.xml` lista todas con sus alternativas.
- El selector de idioma son enlaces a la misma página en cada idioma. Al elegir uno se recuerda y, si abres la portada en español (`/`), se salta al idioma guardado. Elegir «Español» lo desactiva.
- Aviso Legal y Privacidad siguen solo en español (`/aviso-legal/`, `/privacidad/`); el RSS también.
- Portugués: pasa a ser portugués de Brasil de forma explícita: nombre «Português (Brasil)», bandera de Brasil, URL `/pt-br/`, `lang="pt-BR"`.
- Las traducciones de las novedades (y del texto breve de las tarjetas) las hace Claude: `node scripts/translate.js --check` lista lo que falta; Claude devuelve el JSON y se añade con `--import`. Se retiran las claves de API.
- Italiano (`locales/it.json`).

## v.13
- Nuevo idioma: italiano (`locales/it.json`, bandera, nombre de categoría opcional en el panel).
- Novedades: el texto de cada novedad (y el texto breve de las tarjetas) se muestra en el idioma del visitante.
  - Las 8 novedades actuales ya están traducidas (`content/traducciones.json`).
  - Los textos nuevos o editados los traduce solos `scripts/translate.js` desde la acción de GitHub (secreto con la clave de la API).
  - Sin el secreto no falla: esos textos se ven en español. `node scripts/translate.js --check` lista lo pendiente.
  - Una traducción se puede corregir a mano en `content/traducciones.json`; no se toca mientras el texto original no cambie.

## v.12
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
