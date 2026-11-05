# Cambios

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
