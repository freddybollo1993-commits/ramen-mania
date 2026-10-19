#!/usr/bin/env python3
"""Corta una hoja de arte generada con Gemini (fondo magenta liso) en piezas sueltas con fondo transparente y las guarda como WebP.

Uso:
  python tools/cortar-hoja.py <hoja.png> <especificacion.json> [--dry] [--calidad 88]

La especificación (tools/hojas/*.json) dice la cuadrícula, el tamaño de salida y el nombre de cada pieza, en orden de lectura:
  { "filas": 3, "columnas": 4, "salida": "assets/ingredients/v2", "tamano": [160, 160], "relleno": 0.06,
    "piezas": ["ing_109.webp", "ing_110.webp", ...] }          (null = celda vacía)

Cómo funciona: quita el magenta (clave de croma con borde suave y sin halo rosado), detecta las figuras por componentes conexos (así aguanta
que una figura se salga un poco de su celda), asigna cada figura a la celda donde está su centro, recorta, centra en un lienzo del tamaño pedido y exporta.
Además deja una hoja de contacto en assets/gen/cortes/<hoja>_vista.png (carpeta ignorada por git) para revisar antes de publicar.
Solo usa Pillow (pip install --user pillow).
"""
import json
import os
import sys
from PIL import Image, ImageChops

MAGENTA_MIN, MAGENTA_MAX = 70, 160          # m = min(r,b) - g: por debajo es figura, por encima es fondo; entre ambos, borde suave


def clave_croma(img):
    """Devuelve (RGBA sin magenta, máscara alfa)."""
    r, g, b = img.convert('RGB').split()
    m = ImageChops.subtract(ImageChops.darker(r, b), g)
    alfa = m.point(lambda v: 255 - min(255, max(0, int((v - MAGENTA_MIN) * 255 / (MAGENTA_MAX - MAGENTA_MIN)))))
    quita = m.point(lambda v: int(max(0, v) * 0.85))                       # limpia el halo rosado de los bordes
    borde = alfa.point(lambda a: 255 if a < 250 else 0)
    r2 = Image.composite(ImageChops.subtract(r, quita), r, borde)
    b2 = Image.composite(ImageChops.subtract(b, quita), b, borde)
    return Image.merge('RGBA', (r2, g, b2, alfa)), alfa


def componentes(alfa, ancho_trabajo=640):
    """Figuras (cajas) de la máscara, calculadas sobre una copia reducida. Devuelve [(x0, y0, x1, y1, area)] en coordenadas de la imagen original."""
    w, h = alfa.size
    k = max(1, round(w / ancho_trabajo))
    chica = alfa.resize((max(1, w // k), max(1, h // k)), Image.BILINEAR).point(lambda a: 255 if a > 60 else 0)
    cw, ch = chica.size
    px = chica.tobytes()
    visto = bytearray(cw * ch)
    out = []
    for i0 in range(cw * ch):
        if not px[i0] or visto[i0]:
            continue
        pila = [i0]; visto[i0] = 1
        x0 = y0 = 10 ** 9; x1 = y1 = -1; area = 0
        while pila:
            i = pila.pop(); y, x = divmod(i, cw); area += 1
            if x < x0: x0 = x
            if x > x1: x1 = x
            if y < y0: y0 = y
            if y > y1: y1 = y
            for dy in (-1, 0, 1):
                ny = y + dy
                if ny < 0 or ny >= ch: continue
                for dx in (-1, 0, 1):
                    nx = x + dx
                    if nx < 0 or nx >= cw: continue
                    j = ny * cw + nx
                    if px[j] and not visto[j]:
                        visto[j] = 1; pila.append(j)
        out.append((x0 * k, y0 * k, (x1 + 1) * k, (y1 + 1) * k, area * k * k))
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) < 2:
        print(__doc__); sys.exit(1)
    dry = '--dry' in sys.argv
    calidad = 88
    if '--calidad' in sys.argv:
        calidad = int(sys.argv[sys.argv.index('--calidad') + 1]); args = [a for a in args if a != str(calidad)]
    hoja, espec = args[0], json.load(open(args[1], encoding='utf-8'))
    filas, cols = espec['filas'], espec['columnas']
    tw, th = espec['tamano']; relleno = espec.get('relleno', 0.06)
    salida = espec['salida']; piezas = espec['piezas']
    if len(piezas) != filas * cols:
        print('La especificación tiene %d piezas y la cuadrícula %d celdas' % (len(piezas), filas * cols)); sys.exit(1)
    img = Image.open(hoja).convert('RGB')
    rgba, alfa = clave_croma(img)
    W, H = img.size
    cw, ch = W / cols, H / filas
    comps = [c for c in componentes(alfa) if c[4] > 0.0004 * W * H]       # descarta motas
    celdas = {}
    for c in comps:
        cx, cy = (c[0] + c[2]) / 2, (c[1] + c[3]) / 2
        celda = (min(filas - 1, int(cy // ch)), min(cols - 1, int(cx // cw)))
        celdas.setdefault(celda, []).append(c)
    hecho, vacias = [], []
    for idx, nombre in enumerate(piezas):
        f, c = divmod(idx, cols)
        if nombre is None:
            continue
        figs = celdas.get((f, c))
        if not figs:
            vacias.append(nombre); continue
        x0 = min(a[0] for a in figs); y0 = min(a[1] for a in figs); x1 = max(a[2] for a in figs); y1 = max(a[3] for a in figs)
        m = 3
        caja = (max(0, x0 - m), max(0, y0 - m), min(W, x1 + m), min(H, y1 + m))
        pieza = rgba.crop(caja)
        bb = pieza.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
        if bb: pieza = pieza.crop(bb)
        iw, ih = pieza.size
        escala = min(tw * (1 - 2 * relleno) / iw, th * (1 - 2 * relleno) / ih)
        nuevo = pieza.resize((max(1, round(iw * escala)), max(1, round(ih * escala))), Image.LANCZOS)
        lienzo = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
        lienzo.paste(nuevo, ((tw - nuevo.width) // 2, (th - nuevo.height) // 2), nuevo)
        hecho.append((nombre, lienzo))
    base = os.path.splitext(os.path.basename(hoja))[0]
    os.makedirs('assets/gen/cortes', exist_ok=True)
    vista = Image.new('RGB', (cols * tw, filas * th), (70, 48, 36))
    for idx, nombre in enumerate(piezas):
        for n, l in hecho:
            if n == nombre:
                f, c = divmod(idx, cols); vista.paste(l, (c * tw, f * th), l)
    vista.save('assets/gen/cortes/%s_vista.png' % base)
    if not dry:
        os.makedirs(salida, exist_ok=True)
        for n, l in hecho:
            l.save(os.path.join(salida, n), 'WEBP', quality=calidad, method=6)
    print('%s: %d piezas %s en %s' % (base, len(hecho), 'listas (sin guardar: --dry)' if dry else 'guardadas', salida))
    if vacias:
        print('SIN FIGURA en su celda: ' + ', '.join(vacias))
    print('Revisa assets/gen/cortes/%s_vista.png' % base)


if __name__ == '__main__':
    main()
