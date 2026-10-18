/* Arte de la interfaz: ilustraciones de las tarjetas (íconos) y de los fondos de cada modo (escenas).
   Cada tarjeta pide su ilustración por nombre; si el archivo ya existe en assets/ui/ la usa y, si no, deja el emoji o el degradado de siempre,
   así las imágenes nuevas se pueden publicar por tandas sin tocar nada más (solo añadir su nombre a HAY).
   Convención de archivos: assets/ui/ui_<id>.webp (íconos, ≈160 px) y assets/ui/escena_<id>.webp (escenas verticales 3:4, ≈540×720).
   Script clásico. API: ArteUI.icon(id, respaldoHtml) → html · ArteUI.bg(id, respaldoCss) → css · ArteUI.has(tipo, id). */
(function () {
  'use strict';
  var BASE = 'assets/ui/';
  // ids que ya tienen archivo (se rellena al llegar cada hoja o escena)
  var HAY = {
    ic: [],        // p. ej. 'arco_ramen', 'tokio', 'libre_todo'
    esc: ['rash', 'japon', 'zen', 'online', 'aula', 'retos', 'repaso', 'camp']
  };
  function has(tipo, id) { return HAY[tipo] && HAY[tipo].indexOf(id) >= 0; }
  /** HTML de la ilustración de una tarjeta; devuelve respaldo si aún no existe. */
  function icon(id, respaldo) { return has('ic', id) ? '<img class="ui-ic" src="' + BASE + 'ui_' + id + '.webp" alt="" draggable="false">' : respaldo; }
  /** Fondo CSS de una tarjeta grande: la escena con un degradado abajo para que el texto se lea. */
  function bg(id, respaldo) {
    return has('esc', id) ? "linear-gradient(180deg, rgba(10,6,3,0) 32%, rgba(10,6,3,.82) 100%), url('" + BASE + 'escena_' + id + ".webp') center / cover no-repeat" : respaldo;
  }
  window.ArteUI = { icon: icon, bg: bg, has: has, HAY: HAY };
})();
