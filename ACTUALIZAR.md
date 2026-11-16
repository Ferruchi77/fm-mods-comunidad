# Cómo subir una versión nueva a GitHub (sin errores)

El zip de cada versión trae **solo los archivos que cambian**, con su ruta real (`public/css/style.css`, `locales/es.json`…).

## Pasos
1. Descomprime el zip en tu ordenador. Verás carpetas como `public/`, `locales/`, `tests/`, `scripts/` y archivos sueltos (`build.js`, `package.json`, `CHANGELOG.md`…).
2. En GitHub: **Add file → Upload files**.
3. Arrastra **las carpetas y archivos tal cual** (no sus contenidos por separado). Así `public/css/style.css` se queda en `public/css/` y no se crea un `css/` suelto en la raíz.
4. Mensaje de commit, por ejemplo `V2.3`, y **Commit changes**.
5. **Borra lo obsoleto** (GitHub no borra lo que ya no está en el zip). La lista actual está en `scripts/obsoletos.json` y, además, el CI la imprime como aviso amarillo (`BORRA …`) en la pestaña *Actions*. Para borrar: abre el archivo → `⋯` → *Delete file*; una carpeta se borra archivo a archivo, o desde el botón `⋯` de la carpeta en GitHub Desktop.
6. Espera a que *Actions → Comprobar* salga en verde. Netlify despliega solo después.

## Reglas de oro
- **No subas nunca** `content/` ni `public/img/` desde un zip salvo que te lo indique expresamente (por ejemplo, para traducciones o para renombrar fichas): ahí está lo que el panel y las acciones van guardando (fichas, capturas…) y lo pisarías. Si vas a subir fichas, hazlo **justo después de descargar el zip** y antes de editar nada en el panel, para no pisar cambios.
- **Renombrar una ficha:** se sube el archivo nuevo, se borra el antiguo y se añade el par a `scripts/renombrados.json` (así se conservan enlaces, estadísticas y favoritos).
- Sube **todos** los archivos del zip, aunque algunos parezcan no tener que ver: los tests comprueban que van juntos (por ejemplo `build.js` + `public/js/ficha.js` + `tests/`).
- Si solo cambian los textos (`locales/*.json`), sube solo esa carpeta.
- Los avisos amarillos del CI (`::warning`) no bloquean nada; los rojos sí.
- La versión se ve en el pie de la web (`V2.3`) y en `package.json` (`2.3.0`).
