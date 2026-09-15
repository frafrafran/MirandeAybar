# -*- coding: utf-8 -*-
"""
Toma un chat de WhatsApp exportado con archivos y separa las fotos por
propiedad, listas para subir a Cloudflare R2 y enganchar con Supabase.

COMO EXPORTAR EL CHAT (lo hace Francisco, yo no toco WhatsApp)
  Android: abrir el chat -> tres puntos -> Mas -> Exportar chat -> Incluir archivos
  iPhone:  tocar el nombre del contacto -> Exportar chat -> Adjuntar archivos
  Queda un .zip. Guardalo y pasale la ruta a esta herramienta.

COMO AGRUPA
  En el chat, el cliente manda una tanda de fotos y al final escribe el nombre
  de la propiedad. La herramienta lee el texto exportado en orden: cada vez
  que encuentra un mensaje de texto, se lo asigna a todas las fotos que
  vinieron antes desde el texto anterior. Si el mismo nombre aparece en dos
  tandas distintas, las junta.

COMO SE USA
  python separar-fotos-whatsapp.py "C:\\ruta\\Chat de WhatsApp con Cliente.zip"

QUE DEJA
  listo-para-r2/
    casa-2-dormitorios-los-reartes/
      casa-2-dormitorios-los-reartes-01.webp
      casa-2-dormitorios-los-reartes-02.webp
    ...
  revision.csv          que grupo quedo emparejado con que propiedad, y con
                        cuanta seguridad. REVISALO antes de subir nada.
  actualizar-fotos.sql  el comando para cargar las direcciones en la base,
                        para correr cuando las fotos ya esten en R2.

NO toca ni borra el zip ni las fotos originales.
"""
import os
import re
import sys
import csv
import json
import zipfile
import argparse
import unicodedata
import difflib
from collections import OrderedDict

sys.stdout = __import__('io').TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

try:
    from PIL import Image, ImageOps
except ImportError:
    print('Falta Pillow. Instalala con:  pip install Pillow')
    raise SystemExit(1)

AQUI = os.path.dirname(os.path.abspath(__file__))
IMG_EXT = ('.jpg', '.jpeg', '.png', '.webp', '.heic')

# --- formatos de linea del export --------------------------------------
# Android:  "12/9/2026, 14:03 - Juan Perez: texto"
#           "12/9/2026 14:03 - Juan Perez: texto"   (algunas versiones)
# iPhone:   "[12/9/26, 14:03:22] Juan Perez: texto"
RE_ANDROID = re.compile(r'^(\d{1,2}/\d{1,2}/\d{2,4}),?\s+(\d{1,2}:\d{2}(?:\s?[ap]\.?\s?m\.?)?)\s+-\s+([^:]+?):\s(.*)$', re.I)
RE_IPHONE = re.compile(r'^\[(\d{1,2}/\d{1,2}/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[ap]\.?\s?m\.?)?)\]\s+([^:]+?):\s(.*)$', re.I)

# como nombra los adjuntos en cada idioma / plataforma
RE_ADJUNTO = re.compile(
    r'(?:\u200e)?(?:<adjunto:\s*|<attached:\s*|\u200e)?'
    r'([A-Za-z0-9_\-. ]+?\.(?:jpe?g|png|webp|heic))'
    r'(?:\s*\(archivo adjunto\)|\s*\(file attached\)|>)?',
    re.I)

# mensajes que no son nombre de propiedad ni foto: se ignoran
RUIDO = re.compile(
    r'^(?:\u200e)?(?:'
    r'<multimedia omitido>|<media omitted>|'
    r'los mensajes y las llamadas est[aá]n cifrados|messages and calls are end-to-end|'
    r'se elimin[oó] este mensaje|this message was deleted|'
    r'eliminaste este mensaje|you deleted this message|'
    r'.*\.(?:mp4|opus|pdf|vcf|docx?)\b.*'
    r')', re.I)


def slug(t):
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode('ascii').lower()
    t = re.sub(r'[^a-z0-9]+', '-', t)
    return re.sub(r'-+', '-', t).strip('-') or 'propiedad'


def norm(t):
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode('ascii').lower()
    return re.sub(r'[^a-z0-9 ]+', ' ', t).split()


# --- 1. leer el chat ---------------------------------------------------
def leer_mensajes(txt):
    """Devuelve una lista de (autor, texto, [adjuntos]) en orden."""
    mensajes = []
    actual = None
    for linea in txt.splitlines():
        linea = linea.replace('\u202f', ' ').replace('\u00a0', ' ').rstrip('\n')
        m = RE_ANDROID.match(linea) or RE_IPHONE.match(linea)
        if m:
            if actual:
                mensajes.append(actual)
            actual = {'fecha': m.group(1), 'hora': m.group(2),
                      'autor': m.group(3).strip(), 'texto': m.group(4)}
        elif actual is not None and linea.strip():
            # continuacion de un mensaje de varias lineas
            actual['texto'] += '\n' + linea
    if actual:
        mensajes.append(actual)

    for msg in mensajes:
        adj = RE_ADJUNTO.findall(msg['texto'])
        msg['adjuntos'] = [a.strip() for a in adj if a.lower().endswith(IMG_EXT)]
        limpio = RE_ADJUNTO.sub('', msg['texto'])
        limpio = re.sub(r'\(archivo adjunto\)|\(file attached\)', '', limpio, flags=re.I)
        msg['limpio'] = limpio.replace('\u200e', '').strip()
        msg['es_ruido'] = bool(RUIDO.match(msg['texto'].strip()))
    return mensajes


# --- 2. agrupar: las fotos toman el nombre del texto que las sigue ------
def agrupar(mensajes):
    """El nombre de la propiedad solo vale si lo escribe la misma persona que
       mando las fotos. Si Francisco contesta "dale" en el medio, ese mensaje
       no se roba la tanda: las fotos siguen esperando el nombre del cliente."""
    grupos = OrderedDict()
    pendientes = []
    autor_pendiente = None
    sin_nombre = []
    for msg in mensajes:
        if msg['adjuntos']:
            if autor_pendiente and msg['autor'] != autor_pendiente and pendientes:
                # otra persona empieza a mandar fotos: lo anterior queda sin nombre
                sin_nombre.extend(pendientes)
                pendientes = []
            pendientes.extend(msg['adjuntos'])
            autor_pendiente = msg['autor']
            continue
        if msg['es_ruido'] or not msg['limpio']:
            continue
        if not pendientes or msg['autor'] != autor_pendiente:
            continue
        nombre = msg['limpio'].splitlines()[0].strip()
        grupos.setdefault(nombre, []).extend(pendientes)
        pendientes = []
        autor_pendiente = None
    if pendientes:
        sin_nombre.extend(pendientes)
    return grupos, sin_nombre


# --- 3. emparejar con los titulos de la base ---------------------------
def cargar_titulos(ruta):
    if ruta and os.path.exists(ruta):
        return json.load(open(ruta, encoding='utf-8'))
    # si no se paso archivo, intenta bajarlos con la clave publica del sitio
    cfg = os.path.join(AQUI, 'config.js')
    if not os.path.exists(cfg):
        return []
    s = open(cfg, encoding='utf-8').read()
    url = re.search(r"supabaseUrl:\s*'([^']+)'", s)
    key = re.search(r"supabaseKey:\s*'([^']+)'", s)
    if not (url and key):
        return []
    try:
        import urllib.request
        req = urllib.request.Request(
            url.group(1) + '/rest/v1/propiedades?select=id,titulo,localidad,tipo&order=id.asc',
            headers={'apikey': key.group(1), 'Authorization': 'Bearer ' + key.group(1)})
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception as e:
        print('  (no pude bajar los titulos de Supabase: %s)' % e)
        return []


def parecido(nombre, prop):
    """0..1. Mezcla de similitud de texto y palabras en comun; las
       palabras del cliente que aparecen en el titulo pesan mucho."""
    a = ' '.join(norm(nombre))
    b = ' '.join(norm(prop['titulo'] + ' ' + (prop.get('localidad') or '')))
    seq = difflib.SequenceMatcher(None, a, b).ratio()
    pa, pb = set(norm(nombre)), set(norm(prop['titulo'] + ' ' + (prop.get('localidad') or '')))
    pa = {w for w in pa if len(w) > 2}
    cobertura = len(pa & pb) / len(pa) if pa else 0
    return round(0.4 * seq + 0.6 * cobertura, 3)


def emparejar(nombre, titulos):
    if not titulos:
        return None, 0
    mejor = max(titulos, key=lambda p: parecido(nombre, p))
    return mejor, parecido(nombre, mejor)


# --- 4. optimizar y guardar --------------------------------------------
def optimizar(origen, destino, ancho=1600, calidad=82):
    im = Image.open(origen)
    im = ImageOps.exif_transpose(im)
    if im.mode in ('RGBA', 'LA', 'P'):
        fondo = Image.new('RGB', im.size, (255, 255, 255))
        im = im.convert('RGBA')
        fondo.paste(im, mask=im.split()[-1])
        im = fondo
    elif im.mode != 'RGB':
        im = im.convert('RGB')
    if im.width > ancho:
        im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    im.save(destino, 'WEBP', quality=calidad, method=6)   # sin EXIF, sin GPS


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('zip', help='el .zip que exporta WhatsApp')
    ap.add_argument('--titulos', help='JSON con los titulos de la base (si no, los baja)')
    ap.add_argument('--salida', default=None, help='carpeta de salida (por defecto, al lado del zip)')
    ap.add_argument('--r2', default='https://pub-XXXX.r2.dev', help='direccion publica del bucket, para el SQL')
    a = ap.parse_args()

    if not zipfile.is_zipfile(a.zip):
        print('Eso no es un .zip valido: %s' % a.zip)
        raise SystemExit(1)

    base = a.salida or os.path.join(os.path.dirname(os.path.abspath(a.zip)), 'listo-para-r2')
    os.makedirs(base, exist_ok=True)

    z = zipfile.ZipFile(a.zip)
    nombres = z.namelist()
    txts = [n for n in nombres if n.lower().endswith('.txt')]
    if not txts:
        print('El zip no trae el .txt del chat. Exportalo de nuevo con "Incluir archivos".')
        raise SystemExit(1)
    txt = z.read(txts[0]).decode('utf-8', errors='replace')
    if txt.startswith('\ufeff'):
        txt = txt[1:]

    mensajes = leer_mensajes(txt)
    fotos_en_zip = {os.path.basename(n): n for n in nombres if n.lower().endswith(IMG_EXT)}
    grupos, sin_nombre = agrupar(mensajes)
    titulos = cargar_titulos(a.titulos)

    print('Chat     : %s' % txts[0])
    print('Mensajes : %d   fotos en el zip: %d   grupos: %d' % (len(mensajes), len(fotos_en_zip), len(grupos)))
    print('Titulos de la base: %d' % len(titulos))
    print('-' * 78)

    filas = []
    sql = []
    total_ok = total_falta = 0
    for nombre, fotos in grupos.items():
        prop, score = emparejar(nombre, titulos)
        carpeta_slug = slug(prop['titulo']) if prop and score >= 0.6 else slug(nombre)
        carpeta = os.path.join(base, carpeta_slug)
        os.makedirs(carpeta, exist_ok=True)

        hechas = []
        for i, f in enumerate(fotos, 1):
            if f not in fotos_en_zip:
                total_falta += 1
                continue
            destino = os.path.join(carpeta, '%s-%02d.webp' % (carpeta_slug, i))
            with z.open(fotos_en_zip[f]) as src, open(destino + '.tmp', 'wb') as tmp:
                tmp.write(src.read())
            try:
                optimizar(destino + '.tmp', destino)
                hechas.append(os.path.basename(destino))
                total_ok += 1
            except Exception as e:
                print('   ! %s: %s' % (f, e))
            finally:
                os.remove(destino + '.tmp')

        seguridad = 'alta' if score >= 0.8 else ('media' if score >= 0.6 else 'REVISAR')
        filas.append({
            'nombre_en_el_chat': nombre,
            'fotos': len(hechas),
            'carpeta': carpeta_slug,
            'propiedad_en_la_base': prop['titulo'] if prop else '',
            'id': prop['id'] if prop else '',
            'seguridad': seguridad,
            'puntaje': score,
        })
        print('  %-38s %2d fotos  ->  %-34s [%s %.2f]'
              % (nombre[:38], len(hechas), (prop['titulo'][:34] if prop else '(sin pareja)'), seguridad, score))

        if prop and score >= 0.6 and hechas:
            urls = ['%s/%s/%s' % (a.r2.rstrip('/'), carpeta_slug, h) for h in hechas]
            sql.append("-- %s  (%s)\nupdate public.propiedades set imagen = '%s', imagenes = '%s' where id = %d;"
                       % (nombre, seguridad, urls[0], json.dumps(urls, ensure_ascii=False).replace("'", "''"), prop['id']))

    with open(os.path.join(base, 'revision.csv'), 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=list(filas[0].keys()) if filas else ['nombre_en_el_chat'])
        w.writeheader()
        w.writerows(filas)

    with open(os.path.join(base, 'actualizar-fotos.sql'), 'w', encoding='utf-8') as f:
        f.write('-- Generado por separar-fotos-whatsapp.py\n')
        f.write('-- 1) Subi las carpetas de listo-para-r2/ al bucket de R2.\n')
        f.write('-- 2) Reemplaza pub-XXXX.r2.dev por la direccion real del bucket.\n')
        f.write('-- 3) Revisa revision.csv: los grupos marcados REVISAR no estan aca.\n')
        f.write('-- 4) Pegalo en el SQL Editor de Supabase.\n\n')
        f.write('\n\n'.join(sql) + '\n')

    print('-' * 78)
    print('Fotos optimizadas : %d' % total_ok)
    if total_falta:
        print('Fotos citadas en el chat pero ausentes del zip: %d  (exporta con "Incluir archivos")' % total_falta)
    if sin_nombre:
        print('Fotos al final sin nombre despues: %d  (quedaron fuera; el cliente no escribio la propiedad)' % len(sin_nombre))
    revisar = [f for f in filas if f['seguridad'] == 'REVISAR']
    if revisar:
        print('Grupos que no pude emparejar con seguridad: %d  -> mira revision.csv' % len(revisar))
    print()
    print('Salida: %s' % base)
    print('  revision.csv          <- revisar primero')
    print('  actualizar-fotos.sql  <- correr despues de subir a R2')


if __name__ == '__main__':
    main()
