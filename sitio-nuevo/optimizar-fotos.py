# -*- coding: utf-8 -*-
"""
Prepara las fotos de las propiedades para subirlas a internet.

POR QUE HACE FALTA
Una foto de camara pesa unos 3,5 MB. En una pagina web eso es enorme: nadie
necesita 6000 pixeles de ancho para mirar una casa en el celular. Esta
herramienta la achica a 1600 px y la guarda en WebP, que pesa alrededor de
180 kB. Es veinte veces menos, y a simple vista se ve igual.

La diferencia no es estetica, es de costo: con las fotos sin optimizar el
plan gratuito de Supabase aguanta unas 73 visitas por mes. Optimizadas, unas
1.450. Y si ademas se mudan a Cloudflare R2, deja de haber tope.

COMO SE USA
    python optimizar-fotos.py "C:\\ruta\\a\\las\\fotos"

Deja los resultados en una carpeta nueva llamada "optimizadas", al lado de la
original. No toca ni borra ningun archivo tuyo.

Opciones:
    --ancho 1600     ancho maximo en pixeles (por defecto 1600)
    --calidad 82     calidad WebP de 1 a 100 (por defecto 82)
    --jpg            guarda en JPG en vez de WebP, por si algo no abre WebP
"""
import os
import sys
import argparse
import unicodedata
import re

try:
    from PIL import Image, ImageOps
except ImportError:
    print('Falta la libreria Pillow. Instalala con:')
    print('    pip install Pillow')
    raise SystemExit(1)

EXTENSIONES = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tif', '.tiff', '.heic'}


def nombre_limpio(texto):
    """Los nombres con espacios, acentos o parentesis se rompen en una URL.
       "Casa Los Reartes (1).JPG" -> "casa-los-reartes-1" """
    base = os.path.splitext(texto)[0]
    base = unicodedata.normalize('NFKD', base)
    base = base.encode('ascii', 'ignore').decode('ascii')
    base = base.lower()
    base = re.sub(r'[^a-z0-9]+', '-', base)
    return re.sub(r'-+', '-', base).strip('-') or 'foto'


def humano(n):
    for unidad in ('B', 'kB', 'MB', 'GB'):
        if n < 1024 or unidad == 'GB':
            return '%.1f %s' % (n, unidad)
        n /= 1024.0


def optimizar(origen, destino, ancho, calidad, formato):
    im = Image.open(origen)

    # Las fotos de celular guardan la rotacion como un dato aparte. Sin esto,
    # las verticales salen acostadas.
    im = ImageOps.exif_transpose(im)

    if im.mode in ('RGBA', 'LA', 'P'):
        fondo = Image.new('RGB', im.size, (255, 255, 255))
        im = im.convert('RGBA')
        fondo.paste(im, mask=im.split()[-1])
        im = fondo
    elif im.mode != 'RGB':
        im = im.convert('RGB')

    if im.width > ancho:
        alto = round(im.height * ancho / im.width)
        im = im.resize((ancho, alto), Image.LANCZOS)

    # Guardar sin EXIF: esos datos suelen incluir la ubicacion GPS de donde
    # se saco la foto, y no hay ninguna razon para publicarla.
    if formato == 'webp':
        im.save(destino, 'WEBP', quality=calidad, method=6)
    else:
        im.save(destino, 'JPEG', quality=calidad, optimize=True, progressive=True)
    return im.size


def main():
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument('carpeta', help='carpeta con las fotos originales')
    ap.add_argument('--ancho', type=int, default=1600)
    ap.add_argument('--calidad', type=int, default=82)
    ap.add_argument('--jpg', action='store_true', help='guardar en JPG en vez de WebP')
    a = ap.parse_args()

    formato = 'jpg' if a.jpg else 'webp'
    carpeta = os.path.abspath(a.carpeta)
    if not os.path.isdir(carpeta):
        print('No existe la carpeta: %s' % carpeta)
        raise SystemExit(1)

    salida = os.path.join(carpeta, 'optimizadas')
    os.makedirs(salida, exist_ok=True)

    archivos = sorted(
        f for f in os.listdir(carpeta)
        if os.path.splitext(f)[1].lower() in EXTENSIONES
        and os.path.isfile(os.path.join(carpeta, f))
    )
    if not archivos:
        print('No encontre imagenes en %s' % carpeta)
        raise SystemExit(1)

    print('Carpeta : %s' % carpeta)
    print('Salida  : %s' % salida)
    print('Ajustes : %d px de ancho, calidad %d, formato %s' % (a.ancho, a.calidad, formato))
    print('-' * 72)

    antes = despues = 0
    fallidas = []
    usados = {}

    for i, f in enumerate(archivos, 1):
        origen = os.path.join(carpeta, f)
        base = nombre_limpio(f)
        # dos fotos distintas pueden limpiar al mismo nombre
        usados[base] = usados.get(base, 0) + 1
        if usados[base] > 1:
            base = '%s-%d' % (base, usados[base])
        destino = os.path.join(salida, base + '.' + formato)

        try:
            po = os.path.getsize(origen)
            w, h = optimizar(origen, destino, a.ancho, a.calidad, formato)
            pd = os.path.getsize(destino)
            antes += po
            despues += pd
            print('  [%3d/%d] %-38s %9s -> %8s  (%dx%d)'
                  % (i, len(archivos), f[:38], humano(po), humano(pd), w, h))
        except Exception as e:
            fallidas.append((f, str(e)))
            print('  [%3d/%d] %-38s  ERROR: %s' % (i, len(archivos), f[:38], e))

    print('-' * 72)
    hechas = len(archivos) - len(fallidas)
    print('Optimizadas : %d de %d' % (hechas, len(archivos)))
    if antes:
        print('Antes       : %s' % humano(antes))
        print('Despues     : %s   (%.0f%% menos)' % (humano(despues), 100 * (1 - despues / antes)))
        if hechas:
            print('Promedio    : %s por foto' % humano(despues / hechas))
    if fallidas:
        print()
        print('No se pudieron convertir %d:' % len(fallidas))
        for f, e in fallidas:
            print('   %s  ->  %s' % (f, e))
        if any('heic' in f.lower() for f, _ in fallidas):
            print()
            print('   Las .HEIC son de iPhone. Para convertirlas:')
            print('       pip install pillow-heif')

    print()
    print('Listo. Subi el contenido de "optimizadas" a Cloudflare R2.')


if __name__ == '__main__':
    main()
