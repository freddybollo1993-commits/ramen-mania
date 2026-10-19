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
    ic: ['arco_ramen', 'arco_salteado', 'arco_makis', 'arco_frituras', 'arco_maestria', 'rash_record', 'rash_etapas', 'online_arrebato', 'online_coop', 'candado', 'estrella', 'trofeo', 'libre_ramen', 'libre_salteado', 'libre_makis', 'libre_frituras', 'libre_todo', 'reconocer', 'leccion_ramen', 'leccion_salteado', 'leccion_makis', 'leccion_frituras', 'repaso_recetario', 'repaso_despensa', 'tokio', 'yokohama', 'osaka', 'nagoya', 'sapporo', 'kioto', 'fukuoka', 'kanazawa', 'nagasaki', 'ciudad_cerrada', 'soles', 'restaurante', 'btn_recetario', 'btn_tienda', 'btn_aprender', 'btn_ranking', 'btn_misiones', 'btn_ajustes', 'btn_perfil', 'propinas', 'cofre_dia', 'racha', 'btn_modos', 'btn_jugar', 'tienda_mejoras', 'tienda_secretos', 'tienda_activas', 'tienda_japon', 'mision_diaria', 'mision_semanal', 'mision_temporada', 'cofre_misiones', 'reto_medalla', 'reto_reloj', 'etapa_producir'],
    esc: ['rash', 'japon', 'zen', 'online', 'aula', 'retos', 'repaso', 'camp'],
    pl: []            // platos terminados (assets/platos/plato_<área>_<nombre>.webp): se añade «<área>_<nombre>» al llegar cada hoja
  };
  function has(tipo, id) { return HAY[tipo] && HAY[tipo].indexOf(id) >= 0; }
  /** HTML de la ilustración de una tarjeta; devuelve respaldo si aún no existe. */
  function icon(id, respaldo) { return has('ic', id) ? '<img class="ui-ic" src="' + BASE + 'ui_' + id + '.webp" alt="" draggable="false">' : respaldo; }
  /** Fondo CSS de una tarjeta grande: la escena con un degradado abajo para que el texto se lea. */
  function bg(id, respaldo) {
    return has('esc', id) ? "linear-gradient(180deg, rgba(10,6,3,0) 32%, rgba(10,6,3,.82) 100%), url('" + BASE + 'escena_' + id + ".webp') center / cover no-repeat" : respaldo;
  }
  function slug(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); }
  /** Imagen del plato terminado de una receta (área y nombre tal cual están en el juego); devuelve el respaldo si aún no existe su arte. */
  function dish(area, name, respaldo) { var k = area + '_' + slug(name); return has('pl', k) ? '<img class="ui-dish" src="assets/platos/plato_' + k + '.webp" alt="" draggable="false">' : respaldo; }
  window.ArteUI = { icon: icon, bg: bg, has: has, dish: dish, slug: slug, HAY: HAY };
})();
