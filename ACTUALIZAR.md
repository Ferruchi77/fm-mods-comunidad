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
- **Traducciones pendientes: avisar, nunca fallar.** Que falten traducciones (novedades, textos breves, descripciones) **no puede poner el CI en rojo ni romper una prueba**: se avisa con la advertencia amarilla del CI («Traducciones pendientes») y con el issue del mismo nombre, y se traducen después (`node scripts/translate.js --import`). Al preparar una versión nueva **no añadas pruebas que exijan «0 pendientes»**: la prueba de `tests/auditoria.test.js` lo comprueba y fallaría.
- La versión actual es **V2.8**: se ve en el pie de la web (`V2.8`, desde `build.js`) y en `package.json` (`2.8.0`), y debe coincidir con la primera entrada de `CHANGELOG.md`.
- **V2.8 sube estos archivos:** `build.js`, `package.json`, `CHANGELOG.md`, `README.md`, `ACTUALIZAR.md`, `public/css/style.css`, `public/js/ficha.js`, `public/admin/config.yml` y `tests/build.test.js`. No hay archivos que borrar.
