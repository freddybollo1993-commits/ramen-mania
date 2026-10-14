# PixiJS: dónde sí y dónde no (evaluación, v151)

**Conclusión:** hoy no hace falta migrar nada a PixiJS. La única escena donde puede compensar es la del restaurante de Japón, y solo cuando tenga arte final en sprites (Gemini). Se deja una prueba para medirlo en el celular real antes de decidir.

## Por qué no ahora
- Casi todo el juego es interfaz (cocinas, paneles, modales, texto): el DOM es lo adecuado y migrarlo a canvas empeoraría texto, accesibilidad y depuración.
- Las escenas animadas (Japón) mueven ~20–60 personas; medido en el navegador con la escena de 22 personas: ≈0,06 ms por tick de lógica. Con figuras vectoriales no hay nada que acelerar.
- El inicio ya no usa escena isométrica (solo la de Japón).
- Coste de PixiJS 8.6.6: ≈666 KB sin comprimir (~190 KB comprimido), más una copia local en el service worker para abrir sin conexión.

## Dónde sí podría ayudar
1. **Escena de Japón con sprites finales** (muchas personas animadas por atlas, zoom/arrastre, luces y partículas): una `AnimatedSprite` por persona con textura compartida va por GPU en un solo lote.
2. **Partículas** (vapor, chispas, llamas) si algún día se quieren cientos a la vez.

## Cómo decidirlo (con datos del Redmi)
Abre `https://ramen-mania.vercel.app/tools/bench-pixi` en el celular, elige 80 y 150 personas y pulsa «Empezar» (≈14 s por prueba, no toques la pantalla). Compara el mismo sprite del Maestro andando con DOM + CSS (como hoy) y con PixiJS.
- Si el DOM llega a ≥55 fps sin fotogramas lentos con el número de personas que usaremos → **se queda el DOM**.
- Si el DOM baja de ~45 fps y Pixi se mantiene → **se migra solo la escena de Japón** (capa de dibujo nueva, la lógica de `japon-scene.js` no cambia), con Pixi copiado a `assets/vendor/`.

Nota técnica: las páginas de `/tools/` y `/dashboard` ya no las intercepta el service worker (antes devolvía siempre el juego).
