# -*- coding: utf-8 -*-
"""
Borra de Cloudflare R2 los archivos de una lista, en paralelo.

Sirve para limpiar una tanda que se subio mal (por ejemplo, fotos que
quedaron en la carpeta de otra propiedad). Las direcciones publicas de la
web NO se tocan aca: primero cambia la base (actualizar-fotos.sql), despues
borra lo viejo.

COMO SE USA
    python borrar-de-r2.py mirandeaybar-fotos claves.txt

claves.txt: una clave por linea, tal como se ve en el bucket, por ejemplo
    casa-2-dormitorios-en-los-reartes/casa-2-dormitorios-en-los-reartes-01.webp

Hace falta haber iniciado sesion una vez con:  npx wrangler login
"""
import os
import sys
import subprocess
import argparse
import concurrent.futures
import threading

sys.stdout = __import__('io').TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('bucket', help='nombre del bucket en R2')
    ap.add_argument('lista', help='archivo de texto con una clave por linea')
    ap.add_argument('--hilos', type=int, default=6, help='borrados en paralelo (por defecto 6)')
    a = ap.parse_args()

    claves = [l.strip() for l in open(a.lista, encoding='utf-8') if l.strip() and not l.startswith('#')]
    print('Bucket : %s' % a.bucket)
    print('Claves : %d' % len(claves))
    print('-' * 72)

    lock = threading.Lock()
    cuenta = {'ok': 0, 'fallos': 0, 'hechos': 0}

    def borrar(clave):
        cmd = ['npx', '--yes', 'wrangler', 'r2', 'object', 'delete',
               '%s/%s' % (a.bucket, clave), '--remote']
        r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8',
                           errors='replace', shell=(os.name == 'nt'))
        with lock:
            cuenta['hechos'] += 1
            if r.returncode == 0:
                cuenta['ok'] += 1
                print('  [%3d/%d] borrado  %s' % (cuenta['hechos'], len(claves), clave), flush=True)
            else:
                cuenta['fallos'] += 1
                err = (r.stderr or r.stdout).strip().splitlines()
                print('  [%3d/%d] ERROR %s\n          %s' % (cuenta['hechos'], len(claves), clave, err[-1] if err else '?'), flush=True)

    with concurrent.futures.ThreadPoolExecutor(max_workers=a.hilos) as ex:
        list(ex.map(borrar, claves))

    print('-' * 72)
    print('Borrados: %d   Fallidos: %d' % (cuenta['ok'], cuenta['fallos']))
    if cuenta['fallos']:
        print('Volve a correr el comando con las que fallaron.')


if __name__ == '__main__':
    main()
