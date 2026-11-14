# FM Mods Comunidad

Directorio no oficial de mods de Football Manager. Web estática generada con `node build.js` (sin dependencias de build), panel de edición con Decap CMS en `/admin/` y una función de Netlify (`/api/stats`) para descargas, «me gusta», valoraciones y «¿te funciona?».

## Estructura
| Ruta | Contenido |
|---|---|
| `content/mods/*.json` | Una ficha por mod (se edita desde el panel) |
| `content/{categorias,versiones,distintivos,autores}` (y `peticiones`, opcional) | Datos auxiliares |
| `content/traducciones.json` | Traducciones de novedades, textos breves y nombres de los mods |
| `locales/*.json` | Textos de la interfaz (es, en, ca, fr, pt, it; deben tener las mismas claves) |
| `public/` | Estáticos (css, js, imágenes, `sw.js`, `manifest.webmanifest`, panel `admin/`) |
| `netlify/functions/stats.mjs` | API de estadísticas (Netlify Blobs) |
| `netlify/functions/auth.mjs`, `callback.mjs` | Login del panel con GitHub OAuth (alternativa a Identity) |
| `scripts/` | Utilidades (traducciones, imágenes, enlaces, pendientes) |
| `tests/` | Pruebas (`npm test`) |

## Desarrollo
```
node build.js                       # genera dist/
npm test                            # estadísticas, idiomas y compilación
STRICT=1 node build.js              # como CI: falla con claves de idioma o categorías erróneas
```
Variables útiles: `OUT_DIR` (carpeta de salida), `SYNC_AUTHORS=0`, `VALIDATE=warn`, `NO_STATS_FETCH=1` (no consulta `/api/stats` al compilar).

## Despliegue (Netlify)
1. Conecta el repositorio (`netlify.toml` ya define build y funciones).
2. Variable de entorno `STATS_SALT`: **obligatoria**, texto largo y aleatorio (clave del HMAC que anonimiza los votos). Sin ella `/api/stats` responde 503 a los votos.
3. Panel: o bien Identity + Git Gateway, o (recomendado) login con GitHub: crea una OAuth App (callback `https://TU-SITIO/api/callback`), define `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` y `GITHUB_ALLOWED_USERS` en Netlify y ejecuta `node scripts/migrar-cms.js USUARIO/REPO` (con `--atras` para volver). *Nota:* Netlify marcó Identity/Git Gateway como obsoletos; si deja de funcionar, cambia el `backend` de `public/admin/config.yml` a `github` con un proxy OAuth (hay un comentario con el ejemplo).
4. GitHub → Settings → Actions → General → Workflow permissions → **Read and write**.
5. El panel guarda directo en `main` (`publish_mode: simple`): con el estado «Publicado», **Guardar** publica la ficha; los «Borrador / En revisión» se guardan pero no salen en la web.

## Flujos habituales
- **Traducir novedades nuevas:** la acción *Traducciones pendientes* abre un issue con el JSON. Pásalo a Claude (en, ca, fr, pt-BR, it) y ejecuta `node scripts/translate.js --import nuevas.json`.
- **Añadir un idioma:** crea `locales/xx.json` con todas las claves de `es.json` y registra el idioma en `build.js`.
- **Imágenes:** la acción *Optimizar imágenes* (o `npm run imagenes`) descarga las portadas externas a `public/img/covers/` y convierte a WebP. Las tarjetas usan la miniatura `-640.webp` si existe.
- **Salió un parche del juego:** Actions → *Marcar pendientes* → versión (p. ej. FM27). Para liberar los ya revisados, acción «liberar».
- **Enlaces caídos:** *Comprobar enlaces* (lunes) abre un issue y, tras 3 semanas rotos, marca la ficha como pendiente.
- **Estadísticas y calidad:** `/admin/estadisticas.html`.

## Limitaciones conocidas
- Los contadores de `/api/stats` usan «última escritura gana»: con votos simultáneos puede perderse alguno (se corrige al reconstruir el índice). Los registros de «ya votó» no caducan.
- `/api/stats` rechaza votos de otros sitios (`Origin`/`Sec-Fetch-Site`), sin IP o sin `STATS_SALT`; las IPv6 cuentan por /64.
- Las capturas externas (fmsite.net…) pasan a `public/img/covers/` cuando corre la acción *Sincronizar autores y optimizar imágenes*; hasta entonces se enlazan.
- Una IP compartida (campus, datos móviles) cuenta como una sola persona.
- La CSP va en `<meta>` (no admite `frame-ancestors`; eso lo cubre `X-Frame-Options` en `_headers`). Con AdSense activo la CSP se omite.
