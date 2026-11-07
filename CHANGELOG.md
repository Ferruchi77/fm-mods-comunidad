# Cambios

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
