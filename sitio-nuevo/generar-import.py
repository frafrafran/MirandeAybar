# -*- coding: utf-8 -*-
"""Convierte el Excel de propiedades al esquema real de Supabase."""
import sys, io, re, csv, json, openpyxl
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

XLSX = sys.argv[1]
wb = openpyxl.load_workbook(XLSX, data_only=True)
ws = wb.active
rows = list(ws.iter_rows(values_only=True))
hdr = [('' if c is None else str(c).strip()) for c in rows[1]]
IX = {h: i for i, h in enumerate(hdr) if h}
data = [r for r in rows[2:] if r and r[0]]


def g(r, k):
    i = IX.get(k)
    if i is None or i >= len(r) or r[i] is None:
        return ''
    return re.sub(r'\s+', ' ', str(r[i])).strip()


def precio(s):
    """Devuelve (minimo_usd, es_por_unidad, nota). Toma el minimo si hay rango."""
    t = s.upper()
    cu = 'C/U' in t.replace(' ', '')
    t = t.replace('C/U', ' ')
    if re.search(r'[\d.,]+\s*MM', t):
        v = re.findall(r'([\d.,]+)\s*MM', t)[0].replace(',', '.')
        return int(float(v) * 1_000_000), cu, ''
    nums = []
    for grupo in re.findall(r'([\d.,/]+)\s*MIL', t):
        for part in grupo.split('/'):
            part = part.replace('.', '').replace(',', '').strip()
            if part.isdigit():
                nums.append(int(part) * 1000)
    if nums:
        return min(nums), cu, ('rango' if len(set(nums)) > 1 else '')
    plano = re.findall(r'([\d]{1,3}(?:[.,]\d{3})+)', t)
    if plano:
        return int(plano[0].replace('.', '').replace(',', '')), cu, ''
    n = re.findall(r'(\d{4,})', t)
    if n:
        return int(n[0]), cu, ''
    return None, cu, 'SIN PARSEAR'


def m2(s):
    """Metros cuadrados. Maneja HA, rangos y las unidades pegadas al numero."""
    if not s:
        return 0, ''
    t = s.upper().replace(' ', '')
    nums = []
    if 'HA' in t:
        for v in re.findall(r'([\d.,]+)HA', t):
            nums.append(int(float(v.replace(',', '.')) * 10000))
        t = re.sub(r'[\d.,]+HA', ' ', t)
    # sacar la unidad ANTES de buscar numeros: si no, el "2" de "m2" entra como valor
    t = re.sub(r'M2|M²|MTS|M\b', ' ', t)
    nums += [int(x) for x in re.findall(r'(\d+)', t)]
    if not nums:
        return 0, 'SIN PARSEAR'
    return min(nums), ('rango' if len(set(nums)) > 1 else '')


TIPOS = {
    'LOTES': 'Lote', 'LOTES / CHACRAS': 'Lote', 'MACROLOTES': 'Macrolote',
    'CABAÑAS': 'Cabaña', 'COMPLEJO CABAÑAS': 'Complejo de cabañas',
    'CASA': 'Casa', 'CASA CAMPO': 'Casa de campo', 'CAMPO': 'Campo',
    'CHACRA': 'Chacra', 'HOUSING': 'Housing',
    'LOCAL COMERCIAL': 'Local comercial', 'SALON DE FIESTAS': 'Salón de fiestas',
}
TIPOS_EN = {
    'Lote': 'Lot', 'Macrolote': 'Large lot', 'Cabaña': 'Cabin',
    'Complejo de cabañas': 'Cabin complex', 'Casa': 'House',
    'Casa de campo': 'Country house', 'Campo': 'Farmland', 'Chacra': 'Smallholding',
    'Housing': 'Housing', 'Local comercial': 'Commercial unit',
    'Salón de fiestas': 'Event venue',
}
SIN_CUBIERTO = {'Lote', 'Macrolote', 'Campo', 'Chacra'}
LOC = {
    'CUMBRECITA': 'La Cumbrecita', 'EL DURAZNO': 'El Durazno',
    'LOS REARTES': 'Los Reartes', 'VILLA BERNA': 'Villa Berna',
    'VILLA CIUDAD PARQUE': 'Villa Ciudad Parque',
    'VILLA GENERAL BELGRANO': 'Villa General Belgrano',
    'VILLA LOS AROMOS': 'Villa Los Aromos', 'VILLA YACANTO': 'Villa Yacanto',
}
DOC_EN = {'ESCRITURA': 'Deed', 'BOLETO': 'Purchase agreement',
          'POSESION/ESCRITURA': 'Possession / deed', 'FIDEICOMISO': 'Trust'}

# vocabulario recurrente de la columna SERVICIOS, que es casi formulaica
FRASES = [
    ('AGUA y LUZ funcionando', 'water and electricity connected'),
    ('AGUA y LUZ en puerta', 'water and electricity at the plot line'),
    ('AGUA y LUZ', 'water and electricity'),
    ('AGUA en puerta', 'water at the plot line'),
    ('AGUA por perforacion', 'well water'),
    ('AGUA natural vertiente y arroyo', 'spring and creek water'),
    ('AGUA natural vertiente', 'spring water'),
    ('LUZ paneles solares', 'solar power'),
    ('LUZ de red', 'grid electricity'),
    ('GAS NATURAL', 'mains gas'),
    ('GAS envasado', 'bottled gas'),
    ('Sin expensas', 'no service charges'),
    ('EXPENSAS', 'service charge'),
    ('Coop', 'utility co-op'),
    ('APTO DESARROLLO TURISTICO', 'suitable for tourism development'),
    ('IDEAL DESARROLLO HABITACIONAL', 'ideal for residential development'),
    ('Internet propio', 'own internet'),
    ('Pileta', 'pool'),
    ('Posada', 'guesthouse'),
]


def a_ingles(s):
    out = s
    for es, en in FRASES:
        out = re.sub(re.escape(es), en, out, flags=re.I)
    return out


MENORES = {'de','del','y','en','con','sobre','a','al','para'}


def bonito(t):
    """Title case respetando preposiciones y siglas cortas entre parentesis."""
    palabras = t.strip().split()
    salida = []
    for i, w in enumerate(palabras):
        bajo = w.lower()
        if i > 0 and bajo in MENORES:
            salida.append(bajo)
        elif re.fullmatch(r'\(\d+\)', w):
            salida.append(w)
        else:
            salida.append(bajo[:1].upper() + bajo[1:])
    return ' '.join(salida)


def titulo_es(prop, loc):
    """Usa el nombre que la inmobiliaria ya le puso, y agrega la localidad
    solo si no esta mencionada. Intentar deducir el barrio de OBSERVACIONES
    generaba titulos como «6 Lotes Cacique Yam En Camino Jesus De L»."""
    t = bonito(prop)
    if loc.lower() not in t.lower():
        t += f' en {loc}'
    return t



# nombres propios que no deben pasar a minuscula al bajar las MAYUSCULAS
PROPIOS = set()
ARTICULOS = {'el','la','los','las','de','del','y'}
for _l in LOC.values():
    # sin los articulos: 'El Durazno' metia 'el' y despues capitalizaba
    # cualquier "el" suelto del texto
    PROPIOS.update(w.lower() for w in _l.split() if w.lower() not in ARTICULOS)
PROPIOS |= {'cordoba','córdoba','calamuchita','champaqui','champaquí','yacanto',
            'reartes','cumbrecita','berna','belgrano','aromos','durazno','molinos',
            'embalse','anisacate','maderhaus','quellen','yam','irene','gloria',
            'sereno','tigre','sauce','cedron','cedrón','corral','arcos','libertador',
            'cajones','india','aldea','linderos','guayabos','ruta','pcial',
            'provincial','jesus','jesús','cacique','pueblo','puro','loft','lofts'}
TRAS = {'barrio','loteo','complejo','villa','paraje','balneario','camino','calle','ruta'}
UNIDADES = {'m2','ha','usd','ars','mz','mts','tv','wifi'}
SIGLAS = {'coop'}


def humanizar(t):
    """De MAYUSCULA SOSTENIDA a texto leible, sin perder nombres propios.
    Titulizar todo daria 'Cabañas De Montaña Con Vista'; pasarlo todo a
    minuscula perderia 'Villa Yacanto'. Se baja el caso y se recuperan
    los nombres propios, las unidades y el arranque de cada frase."""
    if not t:
        return t
    palabras = re.split(r'(\s+)', t)
    salida, arranque = [], True
    for w in palabras:
        if not w.strip():
            salida.append(w)
            continue
        limpio = re.sub(r'[^\wáéíóúñ]', '', w.lower())
        if any(c.isdigit() for c in w):          # 100M2, 2700MZ, $35.000
            nuevo = w.upper() if limpio.rstrip('0123456789') in UNIDADES or re.search(r'\d(M2|HA|MTS)', w.upper()) else w
        elif limpio in UNIDADES:
            nuevo = w.upper()
        elif limpio in SIGLAS:
            nuevo = w[:1].upper() + w[1:].lower()
        elif limpio in PROPIOS or (salida and re.sub(r'[^\w]', '', salida[-2].lower() if len(salida) > 1 else '') in TRAS):
            nuevo = w[:1].upper() + w[1:].lower()
        else:
            nuevo = w.lower()
        if arranque:
            nuevo = nuevo[:1].upper() + nuevo[1:]
            arranque = False
        if nuevo.rstrip().endswith(('.', '/')):
            arranque = True
        salida.append(nuevo)
    return ''.join(salida)


out, revisar = [], []
for r in data:
    cod = g(r, 'COD')
    prop = g(r, 'PROPIEDAD')
    obs = g(r, 'OBSERVACIONES')
    serv = g(r, 'SERVICIOS')
    doc = g(r, 'DOCUMENTAL')
    tipo = TIPOS.get(g(r, 'TIPO PROPIEDAD').upper(), g(r, 'TIPO PROPIEDAD').title())
    loc = LOC.get(g(r, 'LOCALIDAD').upper(), g(r, 'LOCALIDAD').title())

    p, cu, pn = precio(g(r, 'PRECIO'))
    lote, ln = m2(g(r, 'M2 TERRENO'))
    sup, sn = m2(g(r, 'M2 CUB'))
    if tipo in SIN_CUBIERTO:
        sup = 0                      # un lote no tiene metros cubiertos

    mc = re.match(r'^\s*(\d+)\s', prop)
    cant = int(mc.group(1)) if mc else 1

    dorm = re.findall(r'(\d+)\s*DORMITORIO', obs.upper())
    ban = re.findall(r'(\d+)\s*BA[ÑN]O', obs.upper())

    partes = [humanizar(obs.rstrip(' /'))]
    if serv:
        partes.append('Servicios: ' + humanizar(serv.rstrip(' /')) + '.')
    if doc:
        partes.append('Documentación: ' + doc.title() + '.')
    if cu:
        partes.append('Precio por unidad.')
    if pn == 'rango':
        partes.append(f'Valores desde USD {p:,}'.replace(',', '.') + ' según la unidad.')
    desc = ' '.join(x for x in partes if x)

    partes_en = [a_ingles(humanizar(obs.rstrip(' /')))]
    if serv:
        partes_en.append('Utilities: ' + a_ingles(humanizar(serv.rstrip(' /'))) + '.')
    if doc:
        partes_en.append('Title: ' + DOC_EN.get(doc.upper(), doc.title()) + '.')
    if cu:
        partes_en.append('Price per unit.')
    desc_en = ' '.join(x for x in partes_en if x)

    t_es = titulo_es(prop, loc)
    t_en = f'{cant} {TIPOS_EN.get(tipo,tipo)}s in {loc}' if cant > 1         else f'{TIPOS_EN.get(tipo,tipo)} in {loc}' 

    fila = {
        'publicada': 'false',           # entran despublicadas: las revisas y las activas
        'titulo': t_es, 'titulo_en': t_en,
        'tipo': tipo, 'operacion': 'venta',
        'precio': p if p is not None else '', 'moneda': 'USD',
        'localidad': loc,
        'dormitorios': int(dorm[0]) if dorm else 0,
        'banos': int(ban[0]) if ban else 0,
        'superficie': sup, 'lote': lote,
        'descripcion': desc, 'descripcion_en': desc_en,
        'destacada': 'false', 'nuevo': 'true',
        'imagen': '',
    }
    out.append(fila)

    motivos = []
    if pn:
        motivos.append(f"precio «{g(r,'PRECIO')}» → se toma el mínimo {p}")
    if ln:
        motivos.append(f"terreno «{g(r,'M2 TERRENO')}» → se toma el mínimo {lote}")
    if sn and tipo not in SIN_CUBIERTO:
        motivos.append(f"cubierto «{g(r,'M2 CUB')}» → se toma el mínimo {sup}")
    if tipo in SIN_CUBIERTO and g(r, 'M2 CUB'):
        motivos.append(f"«{g(r,'M2 CUB')}» venía en M2 CUB pero es un {tipo.lower()}: se pone 0")
    if p is None:
        motivos.append('PRECIO no se pudo interpretar')
    if motivos:
        revisar.append((cod, t_es, motivos))

vistos = {}
for f in out:
    t = f['titulo']
    if t in vistos:
        vistos[t] += 1
        f['titulo'] = f'{t} ({vistos[t]})'
    else:
        vistos[t] = 1

CAMPOS = ['publicada', 'titulo', 'titulo_en', 'tipo', 'operacion', 'precio', 'moneda',
          'localidad', 'dormitorios', 'banos', 'superficie', 'lote',
          'descripcion', 'descripcion_en', 'destacada', 'nuevo', 'imagen']

with open('propiedades-import.csv', 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=CAMPOS)
    w.writeheader()
    w.writerows(out)


def sq(v):
    if v == '' or v is None:
        return 'null'
    if isinstance(v, int):
        return str(v)
    if v in ('true', 'false'):
        return v
    return "'" + str(v).replace("'", "''") + "'"


with open('propiedades-import.sql', 'w', encoding='utf-8') as f:
    f.write('-- 30 propiedades del Excel «PROPIEDADES MIRANDEAYBAR 2026».\n')
    f.write('-- Entran con publicada = false: las revisás, les cargás la foto y recién\n')
    f.write('-- ahí las activás. Pegar en Supabase → SQL Editor → Run.\n\n')
    f.write('insert into public.propiedades\n  (' + ', '.join(CAMPOS) + ')\nvalues\n')
    f.write(',\n'.join('  (' + ', '.join(sq(r[c]) for c in CAMPOS) + ')' for r in out))
    f.write(';\n')

json.dump({'filas': out, 'revisar': revisar}, open('.import.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)

print(f'generadas {len(out)} filas\n')
print(f'{"COD":<6}{"PRECIO":>10}  {"LOTE":>8} {"CUB":>6}  TITULO')
print('-' * 96)
for r, o in zip(data, out):
    print(f'{g(r,"COD"):<6}{o["precio"]:>10}  {o["lote"]:>8} {o["superficie"]:>6}  {o["titulo"][:52]}')
print(f'\nfilas que conviene revisar a mano: {len(revisar)}')
