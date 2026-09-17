# -*- coding: utf-8 -*-
"""
Sube una carpeta entera a Cloudflare R2 conservando la estructura.

El panel de Cloudflare solo deja subir 100 archivos por vez. Esta herramienta
usa wrangler, la linea de comandos oficial, que no tiene ese tope.

ANTES DE USARLA, una sola vez, hay que iniciar sesion:
    npx wrangler login
Abre el navegador, tocas "Allow", y listo. Guarda el permiso en tu PC.

COMO SE USA
    python subir-a-r2.py "C:\\Users\\ASUS\\OneDrive\\Documentos\\SUBIR-A-R2" mirandeaybar-fotos

Recorre la carpeta y sube cada archivo como <carpeta>/<archivo>, que es lo
que el SQL espera. Si le pasas --publico con la direccion del bucket, antes
de subir cada archivo comprueba si ya esta con el mismo tamano y lo saltea:
se puede cortar y volver a correr sin subir todo de nuevo.
"""
import os
import sys
import subprocess
import argparse

sys.stdout = __import__('io').TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('carpeta', help='carpeta con las subcarpetas de propiedades')
    ap.add_argument('bucket', help='nombre del bucket en R2')
    ap.add_argument('--tipo', default='image/webp', help='content-type (por defecto image/webp)')
    ap.add_argument('--publico', default='', help='https://pub-xxxx.r2.dev, para saltear lo ya subido')
    ap.add_argument('--hilos', type=int, default=5, help='subidas en paralelo (por defecto 5)')
    a = ap.parse_args()

    raiz = os.path.abspath(a.carpeta)
    if not os.path.isdir(raiz):
        print('No existe la carpeta: %s' % raiz)
        raise SystemExit(1)

    archivos = []
    for dp, _, fs in os.walk(raiz):
        for f in fs:
            if f.lower().endswith(('.webp', '.jpg', '.jpeg', '.png')):
                ruta = os.path.join(dp, f)
                # clave en R2: la ruta relativa con barras normales
                clave = os.path.relpath(ruta, raiz).replace(os.sep, '/')
                # si las carpetas estan dentro de tanda-1, tanda-2...: se salta ese nivel
                partes = clave.split('/')
                if partes[0].startswith('tanda-'):
                    clave = '/'.join(partes[1:])
                archivos.append((ruta, clave))
    archivos.sort(key=lambda x: x[1])

    print('Carpeta : %s' % raiz)
    print('Bucket  : %s' % a.bucket)
    print('Archivos: %d' % len(archivos))
    print('-' * 72)

    def ya_esta(clave, tamano):
        if not a.publico:
            return False
        try:
            import urllib.request
            # sin User-Agent, Cloudflare rechaza la peticion y todo parece "no subido"
            req = urllib.request.Request(a.publico.rstrip('/') + '/' + clave, method='HEAD',
                                         headers={'User-Agent': 'mirandeaybar-subir-a-r2/1.0'})
            with urllib.request.urlopen(req, timeout=15) as r:
                return int(r.headers.get('Content-Length', -1)) == tamano
        except Exception:
            return False

    # Cada subida lanza un proceso de wrangler (~10 s). En serie, 272 fotos son
    # casi una hora; con cinco a la vez, unos diez minutos.
    import concurrent.futures, threading
    lock = threading.Lock()
    cuenta = {'ok': 0, 'fallos': 0, 'saltados': 0, 'hechos': 0}

    def subir(par):
        ruta, clave = par
        if ya_esta(clave, os.path.getsize(ruta)):
            with lock:
                cuenta['saltados'] += 1; cuenta['hechos'] += 1
                print('  [%3d/%d] ya estaba  %s' % (cuenta['hechos'], len(archivos), clave), flush=True)
            return
        cmd = ['npx', '--yes', 'wrangler', 'r2', 'object', 'put',
               '%s/%s' % (a.bucket, clave), '--file', ruta,
               '--content-type', a.tipo, '--remote']
        # utf-8 explicito: wrangler imprime simbolos que la consola de Windows
        # (cp1252) no sabe decodificar y el hilo que lee la salida se caia
        r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8',
                           errors='replace', shell=(os.name == 'nt'))
        with lock:
            cuenta['hechos'] += 1
            if r.returncode == 0:
                cuenta['ok'] += 1
                print('  [%3d/%d] %s' % (cuenta['hechos'], len(archivos), clave), flush=True)
            else:
                cuenta['fallos'] += 1
                err = (r.stderr or r.stdout).strip().splitlines()
                print('  [%3d/%d] ERROR %s\n          %s' % (cuenta['hechos'], len(archivos), clave, err[-1] if err else '?'), flush=True)

    with concurrent.futures.ThreadPoolExecutor(max_workers=a.hilos) as ex:
        list(ex.map(subir, archivos))
    ok, fallos, saltados = cuenta['ok'], cuenta['fallos'], cuenta['saltados']

    print('-' * 72)
    print('Subidos: %d   Ya estaban: %d   Fallidos: %d' % (ok, saltados, fallos))
    if fallos:
        print('Volve a correr el comando: los que ya estan se saltean.')


if __name__ == '__main__':
    main()
