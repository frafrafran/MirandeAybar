# -*- coding: utf-8 -*-
"""
Toma un chat de WhatsApp exportado con archivos y separa las fotos por
propiedad, listas para subir a Cloudflare R2 y enganchar con Supabase.

COMO EXPORTAR EL CHAT (lo hace Francisco, yo no toco WhatsApp)
  Android: abrir el chat -> tres puntos -> Mas -> Exportar chat -> Incluir archivos
  iPhone:  tocar el nombre del contacto -> Exportar chat -> Adjuntar archivos
  Queda un .zip. Guardalo y pasale la ruta a esta herramienta.

COMO AGRUPA
  En el chat, el cliente manda una tanda de fotos y escribe el nombre de la
  propiedad al lado: antes o despues de las fotos, las dos formas valen (y
  puede cambiar de una a otra en el mismo chat). Cada nombre se queda con la
  tanda pegada a el, y una tanda va a un solo nombre. Si el mismo codigo
  aparece en dos tandas distintas, las junta.

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

# Los planos y panoramicas que manda el cliente pueden superar el limite
# con el que Pillow se protege de archivos maliciosos. Son archivos propios.
Image.MAX_IMAGE_PIXELS = None

AQUI = os.path.dirname(os.path.abspath(__file__))
IMG_EXT = ('.jpg', '.jpeg', '.png', '.webp', '.heic')

# --- formatos de linea del export --------------------------------------
# Android:  "12/9/2026, 14:03 - Juan Perez: texto"
#           "12/9/2026 14:03 - Juan Perez: texto"   (algunas versiones)
# iPhone:   "[12/9/26, 14:03:22] Juan Perez: texto"
RE_ANDROID = re.compile(r'^(\d{1,2}/\d{1,2}/\d{2,4}),?\s+(\d{1,2}:\d{2}(?:\s?[ap]\.?\s?m\.?)?)\s+-\s+([^:]+?):\s(.*)$', re.I)
RE_IPHONE = re.compile(r'^\[(\d{1,2}/\d{1,2}/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[ap]\.?\s?m\.?)?)\]\s+([^:]+?):\s(.*)$', re.I)

# Como nombra los adjuntos cada plataforma. Van por separado porque en
# iPhone, cuando la foto viaja como documento, el mensaje trae DOS nombres:
#   IMG_20260812_143052.jpg <adjunto: 00000123-IMG_20260812_143052.jpg>
# el visible y el del archivo real. Solo el segundo existe en el zip.
RE_ADJ_IPHONE = re.compile(r'<(?:adjunto|attached):\s*([^>]+?\.(?:jpe?g|png|webp|heic))\s*>', re.I)
RE_ADJ_ANDROID = re.compile(r'([A-Za-z0-9_\-. ]+?\.(?:jpe?g|png|webp|heic))\s*\((?:archivo adjunto|file attached)\)', re.I)
RE_NOMBRE_SUELTO = re.compile(r'\b[A-Za-z0-9_\-]+\.(?:jpe?g|png|webp|heic)\b', re.I)

# mensajes que no son nombre de propiedad ni foto: se ignoran
RUIDO = re.compile(
    r'^(?:\u200e)?(?:'
    r'<?multimedia omitido>?|<?media omitted>?|<?documento omitido>?|<?document omitted>?|'
    r'los mensajes y las llamadas est[aá]n cifrados|messages and calls are end-to-end|'
    r'se elimin[oó] este mensaje|this message was deleted|'
    r'eliminaste este mensaje|you deleted this message|'
    r'llamada(?:\s+perdida)?\.|videollamada|missed (?:voice|video) call|'
    r'.*<(?:adjunto|attached):[^>]*\.(?!jpe?g|png|webp|heic)[a-z0-9]+\s*>.*|'
    r'.*\.(?:mp4|opus|pdf|vcf|docx?|xlsx?|pptx?|zip)\b.*'
    r')', re.I)


RE_CODIGO = re.compile(r'\b(MA\s?\d{1,3})\b', re.I)


def codigo_de(texto):
    """'MA4 CABAÑAS MADERHAUS' -> 'MA4'. None si no trae codigo."""
    m = RE_CODIGO.search(texto)
    return m.group(1).upper().replace(' ', '') if m else None


def slug(t):
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode('ascii').lower()
    t = re.sub(r'[^a-z0-9]+', '-', t)
    return (re.sub(r'-+', '-', t).strip('-') or 'propiedad')[:60].strip('-')


def norm(t):
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode('ascii').lower()
    return re.sub(r'[^a-z0-9 ]+', ' ', t).split()


# --- 1. leer el chat ---------------------------------------------------
def leer_mensajes(txt):
    """Devuelve una lista de (autor, texto, [adjuntos]) en orden."""
    mensajes = []
    actual = None
    for linea in txt.splitlines():
        # iPhone antepone una marca de direccion invisible (U+200E) a muchas
        # lineas y usa espacios angostos en la hora. Se limpian antes de
        # comparar, o el regex no reconoce el mensaje.
        linea = linea.replace('\u202f', ' ').replace('\u00a0', ' ').rstrip('\n').lstrip('‎')
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
        adj = RE_ADJ_IPHONE.findall(msg['texto']) or RE_ADJ_ANDROID.findall(msg['texto'])
        # los stickers tambien son .webp, pero no son fotos de nada
        msg['adjuntos'] = [x.strip() for x in adj
                           if x.lower().endswith(IMG_EXT) and 'STICKER' not in x.upper()]
        limpio = RE_ADJ_IPHONE.sub('', msg['texto'])
        limpio = RE_ADJ_ANDROID.sub('', limpio)
        # el nombre visible del documento tampoco es texto del cliente
        limpio = RE_NOMBRE_SUELTO.sub('', limpio)
        msg['limpio'] = limpio.replace('\u200e', '').strip()
        msg['es_ruido'] = bool(RUIDO.match(msg['texto'].strip())) or 'STICKER' in msg['texto'].upper()
    return mensajes


# --- 2. agrupar: cada nombre toma la tanda de al lado ---------------------
def _minutos(msg):
    """fecha+hora del mensaje en minutos, para medir distancias."""
    d = re.findall(r'\d+', msg['fecha'])
    h = re.findall(r'\d+', msg['hora'])
    if len(d) < 3 or len(h) < 2:
        return 0
    dia, mes, anio = int(d[0]), int(d[1]), int(d[2])
    hh, mm = int(h[0]), int(h[1])
    t = msg['hora'].lower().replace('.', '').replace(' ', '')
    if 'pm' in t and hh < 12:
        hh += 12
    if 'am' in t and hh == 12:
        hh = 0
    return ((anio * 12 + mes) * 31 + dia) * 1440 + hh * 60 + mm


VENTANA = 30   # minutos: mas lejos que esto, la tanda no es de ese nombre


def agrupar(mensajes):
    """El cliente manda las fotos en tandas y escribe el nombre de la propiedad
       al lado: a veces DESPUES de las fotos, a veces ANTES (en el chat de Papa
       cambio de una a la otra a mitad de camino). Regla:
         - una tanda son fotos seguidas del mismo autor, sin mas de VENTANA
           minutos entre una y otra;
         - un nombre es un texto con codigo (MA4...) o, si el chat no usa
           codigos, cualquier texto que no sea ruido;
         - cada nombre toma la tanda inmediatamente ANTERIOR si esta libre y
           cerca; si no, la inmediatamente SIGUIENTE si esta cerca y es del
           mismo autor. Una tanda va a un solo nombre.
       Lo que queda sin nombre se devuelve aparte."""
    usa_codigos = any(codigo_de(m['limpio']) for m in mensajes if m['limpio'] and not m['adjuntos'])

    # 1) fichas: ('T', tanda) y ('N', nombre) en orden
    fichas = []
    for msg in mensajes:
        if msg['adjuntos']:
            ult = fichas[-1] if fichas else None
            if (ult and ult[0] == 'T' and ult[1]['autor'] == msg['autor']
                    and _minutos(msg) - ult[1]['fin'] <= VENTANA):
                ult[1]['fotos'].extend(msg['adjuntos'])
                ult[1]['fin'] = _minutos(msg)
            else:
                fichas.append(('T', {'autor': msg['autor'], 'fotos': list(msg['adjuntos']),
                                     'ini': _minutos(msg), 'fin': _minutos(msg), 'dueno': None}))
            continue
        if msg['es_ruido'] or not msg['limpio']:
            continue
        if usa_codigos and not codigo_de(msg['limpio']):
            continue
        fichas.append(('N', {'autor': msg['autor'], 'texto': msg['limpio'].splitlines()[0].strip(),
                             'min': _minutos(msg)}))

    # 2) cada nombre elige su tanda
    grupos = OrderedDict()
    notas = []
    for i, (tipo, f) in enumerate(fichas):
        if tipo != 'N':
            continue
        elegida = None
        ant = fichas[i - 1] if i > 0 else None
        if (ant and ant[0] == 'T' and ant[1]['dueno'] is None and ant[1]['autor'] == f['autor']
                and f['min'] - ant[1]['fin'] <= VENTANA):
            elegida = ant[1]
        else:
            sig = fichas[i + 1] if i + 1 < len(fichas) else None
            if (sig and sig[0] == 'T' and sig[1]['dueno'] is None and sig[1]['autor'] == f['autor']
                    and sig[1]['ini'] - f['min'] <= VENTANA):
                elegida = sig[1]
        if elegida is None:
            notas.append(f['texto'])       # un texto con codigo pero sin fotos al lado
            continue
        elegida['dueno'] = f['texto']
        clave = codigo_de(f['texto']) or f['texto']
        grupos.setdefault(clave, {'nombre': f['texto'], 'fotos': []})['fotos'].extend(elegida['fotos'])

    sin_nombre = [x for t, f in fichas if t == 'T' and f['dueno'] is None for x in f['fotos']]
    agrupar.notas = notas
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


def cargar_codigos(ruta):
    """JSON {"MA1": {"id": 5, "titulo": "..."}, ...}: la llave exacta."""
    if ruta and os.path.exists(ruta):
        return json.load(open(ruta, encoding='utf-8'))
    return {}


TIPOS = [
    ('complejo', r'complejo|cabanas|cabañas|lofts|aldea'),
    ('casa',     r'\bcasa\b|dormitorio|housing'),
    ('chacra',   r'chacra'),
    ('campo',    r'\bcampo\b|hectarea|\bha\b'),
    ('lote',     r'lote|macrolote|terreno|loteo'),
    ('local',    r'local|deposito|salon|fiestas'),
]


def tipo_de(texto):
    t = ' '.join(norm(texto))
    for nombre, patron in TIPOS:
        if re.search(patron, t):
            return nombre
    return None


def parecido(nombre, prop):
    """0..1. Similitud de texto + palabras en comun + acuerdo en el TIPO.
       Sin el tipo, "casa en Tierras del Sauce" y "lotes en Tierras del Sauce"
       empatan por el nombre del barrio y caen en la misma propiedad."""
    a = ' '.join(norm(nombre))
    b = ' '.join(norm(prop['titulo'] + ' ' + (prop.get('localidad') or '')))
    seq = difflib.SequenceMatcher(None, a, b).ratio()
    pa = {w for w in norm(nombre) if len(w) > 2}
    pb = set(norm(prop['titulo'] + ' ' + (prop.get('localidad') or '')))
    cobertura = len(pa & pb) / len(pa) if pa else 0
    base = 0.4 * seq + 0.6 * cobertura
    ta, tb = tipo_de(nombre), tipo_de(prop['titulo'])
    if ta and tb:
        base += 0.15 if ta == tb else -0.20
    return round(max(0.0, min(1.0, base)), 3)


def ranking(nombre, titulos):
    return sorted(((p, parecido(nombre, p)) for p in titulos), key=lambda x: -x[1])


def alinear_por_orden(grupos, titulos, codigos):
    """El cliente recorre el Excel de arriba abajo y va mandando tandas, pero a
       veces saltea una fila y sigue numerando de corrido: su MA9 puede ser el
       MA10 del Excel. El numero no sirve, pero el ORDEN si. Se alinean las dos
       secuencias como hace un diff: cada tanda con a lo sumo una fila, sin
       cruzarse, maximizando el parecido de texto."""
    por_id = {p['id']: p for p in titulos}
    A = [(k, g) for k, g in grupos.items() if codigo_de(g['nombre'])]
    B = sorted(codigos.items(), key=lambda kv: int(re.sub(r'\D', '', kv[0]) or 0))
    B = [(k, v) for k, v in B if v['id'] in por_id]
    if not A or not B:
        return {}

    def sc(g, fila):
        return parecido(RE_CODIGO.sub('', g['nombre']).strip() or g['nombre'], por_id[fila['id']])

    UMBRAL = 0.45
    n, k = len(A), len(B)
    best = [[0.0] * (k + 1) for _ in range(n + 1)]
    back = [[None] * (k + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, k + 1):
            op = [(best[i - 1][j], 'tanda'), (best[i][j - 1], 'fila')]
            v = sc(A[i - 1][1], B[j - 1][1])
            if v >= UMBRAL:
                op.append((best[i - 1][j - 1] + v, 'par'))
            best[i][j], back[i][j] = max(op)
    i, j, out = n, k, {}
    while i > 0 and j > 0:
        if back[i][j] == 'par':
            kA, g = A[i - 1]
            kB, fila = B[j - 1]
            out[kA] = (por_id[fila['id']], sc(g, fila), 'orden del Excel (%s -> %s)' % (kA, kB))
            i -= 1; j -= 1
        elif back[i][j] == 'tanda':
            i -= 1
        else:
            j -= 1
    return out


def asignar(grupos, titulos, codigos, forzadas=None):
    """Tandas con codigo: alineacion por orden contra el Excel.
       Tandas sin codigo: parecido de texto, uno a uno, sobre lo que quede.
       forzadas: {'MA19': 25} para los casos que se resuelven a mano."""
    forzadas = forzadas or {}
    por_id = {p['id']: p for p in titulos}
    salida = alinear_por_orden(grupos, titulos, codigos) if codigos else {}

    for clave, idp in forzadas.items():
        if clave in grupos and idp in por_id:
            etiqueta = codigo_de(grupos[clave]['nombre']) or 'tanda sin codigo'
            salida[clave] = (por_id[idp], 1.0, 'forzada a mano: %s -> id %d' % (etiqueta, idp))

    tomadas = {v[0]['id'] for v in salida.values() if v[0]}
    libres = [p for p in titulos if p['id'] not in tomadas]
    cand = []
    for clave, g in grupos.items():
        if clave in salida:
            continue
        for prop, score in ranking(g['nombre'], libres)[:5]:
            cand.append((score, clave, prop))
    cand.sort(key=lambda x: -x[0])
    for score, clave, prop in cand:
        if clave in salida or prop['id'] in tomadas or score < 0.6:
            continue
        salida[clave] = (prop, score, 'texto')
        tomadas.add(prop['id'])
    for clave in grupos:
        salida.setdefault(clave, (None, 0.0, 'sin pareja'))
    return salida


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
    ap.add_argument('--codigos', help='JSON codigo->propiedad (MA1, MA2...) en el orden del Excel')
    ap.add_argument('--forzar', action='append', default=[],
                    help='resolver a mano una tanda: --forzar MA19=25 (codigo del chat = id en la base)')
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
    codigos = cargar_codigos(a.codigos)

    print('Chat     : %s' % txts[0])
    print('Mensajes : %d   fotos en el zip: %d   grupos: %d' % (len(mensajes), len(fotos_en_zip), len(grupos)))
    print('Titulos de la base: %d   codigos conocidos: %d' % (len(titulos), len(codigos)))
    print('-' * 78)

    filas = []
    sql = []
    total_ok = total_falta = 0
    forzadas = {}
    for f in a.forzar:
        k, v = f.split('=', 1)
        forzadas[k.strip().upper()] = int(v)
    # Las tandas sin codigo se nombran por donde cayeron entre las que si lo
    # tienen: "entre-MA17-y-MA19" dice mucho mas que el texto que las siguio,
    # que suele ser charla. Y no expone mensajes personales en nombres de carpeta.
    claves = list(grupos.keys())
    posicion = {}
    contador = 0
    for i, k in enumerate(claves):
        if codigo_de(grupos[k]['nombre']):
            continue
        contador += 1
        ant = next((c for c in reversed(claves[:i]) if codigo_de(grupos[c]['nombre'])), None)
        sig = next((c for c in claves[i + 1:] if codigo_de(grupos[c]['nombre'])), None)
        if ant and sig:
            posicion[k] = '%02d-entre-%s-y-%s' % (contador, ant, sig)
        elif sig:
            posicion[k] = '%02d-antes-de-%s' % (contador, sig)
        elif ant:
            posicion[k] = '%02d-despues-de-%s' % (contador, ant)
        else:
            posicion[k] = '%02d' % contador

    # --forzar entre-MA17-y-MA19=24  ->  una tanda sin codigo, por su posicion
    por_id = {p['id']: p for p in titulos}
    for k, nombre_pos in posicion.items():
        for f_k, f_id in list(forzadas.items()):
            if f_k.lower() in nombre_pos.lower() and f_id in por_id:
                forzadas[k] = f_id
    asignacion = asignar(grupos, titulos, codigos, forzadas)

    for clave, g in grupos.items():
        nombre, fotos = g['nombre'], g['fotos']
        cod = codigo_de(nombre)
        prop, score, via = asignacion[clave]
        if prop and score >= 0.6:
            # el codigo del Excel adelante, para encontrarla en R2 de un vistazo
            cod_excel = next((k for k, v in codigos.items() if v.get('id') == prop['id']), None)
            carpeta_slug = ((cod_excel + '-') if cod_excel else '') + slug(prop['titulo'])
            carpeta = os.path.join(base, carpeta_slug)
        elif cod:
            carpeta_slug = slug(nombre)
            carpeta = os.path.join(base, carpeta_slug)
        else:
            # sin codigo: aparte, nombradas por posicion, para revisar a mano
            carpeta_slug = posicion[clave]
            carpeta = os.path.join(base, '_sin-codigo', carpeta_slug)
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
                if os.path.exists(destino + '.tmp'):
                    os.remove(destino + '.tmp')

        seguridad = ('forzada' if via.startswith('forzada') else
                     'REVISAR' if not prop or score < 0.6 else
                     'alta' if score >= 0.8 else 'media')
        filas.append({
            'nombre_en_el_chat': nombre,
            'fotos': len(hechas),
            'carpeta': carpeta_slug,
            'propiedad_en_la_base': prop['titulo'] if prop else '',
            'id': prop['id'] if prop else '',
            'seguridad': seguridad,
            'via': via,
            'puntaje': score,
        })
        visible = nombre if cod else '(texto sin codigo, ver revision.csv)'
        print('  %-38s %2d fotos  ->  %-34s [%s]'
              % (visible[:38], len(hechas), (prop['titulo'][:34] if prop else '(sin pareja)'), seguridad))

        if prop and score >= 0.6 and hechas:
            urls = ['%s/%s/%s' % (a.r2.rstrip('/'), carpeta_slug, h) for h in hechas]
            sql.append("-- %s  (%s)\nupdate public.propiedades set imagen = '%s', imagenes = '%s' where id = %d;"
                       % (nombre, seguridad, urls[0], json.dumps(urls, ensure_ascii=False).replace("'", "''"), prop['id']))

    for n in getattr(agrupar, 'notas', []):
        print('  NOTA sin fotos al lado (revisar a mano): %s' % n)

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
