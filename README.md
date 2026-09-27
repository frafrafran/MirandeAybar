# Mirande Aybar

Inmobiliaria en **Villa General Belgrano**, Valle de Calamuchita, Córdoba.

Este repositorio guarda todo el material web de la inmobiliaria. Son tres
proyectos independientes, cada uno con su propio README:

| Carpeta | Qué es | Estado |
| --- | --- | --- |
| [`sitio-nuevo/`](sitio-nuevo/) | **El sitio actual.** HTML, CSS y JS planos, sin build ni dependencias. Listado de propiedades leído de Supabase, con buscador y filtros. | En uso |
| [`sitio-web/`](sitio-web/) | El sitio anterior, con selector ES/EN. Se conserva como referencia: de acá salieron la paleta, los contactos y las fotos. | Histórico |
| [`lithos-mapa/`](lithos-mapa/) | Prueba aparte: un hero en React + Vite con un spotlight que sigue el cursor y revela el mapa de calles sobre la vista satelital. | Experimento |

## Para ver el sitio

Doble clic en **`sitio-nuevo/index.html`**. No hace falta instalar nada.

Si preferís levantarlo con un servidor local, doble clic en
`sitio-nuevo/ABRIR-SITIO.bat`.

## Base de datos

Las propiedades viven en Supabase y se leen en cada carga. `config.js` lleva
únicamente la clave **`anon`**, que es pública por diseño: va escrita en el HTML
y cualquiera puede verla con *Ver código fuente*. Eso es seguro mientras Row
Level Security esté encendido, que es el caso — sólo permite **leer** las
propiedades publicadas.

La clave `service_role` **nunca** va en este repositorio ni en ningún archivo
del sitio. Ver [`sitio-nuevo/SEGURIDAD-Y-DATOS.sql`](sitio-nuevo/SEGURIDAD-Y-DATOS.sql).

## Guías

Están todas en `sitio-nuevo/`, escritas paso a paso:

- **`GUIA-SUPABASE.md`** — cómo está armada la base y cómo cargar propiedades.
- **`GUIA-PUBLICAR.md`** — cómo poner el sitio en internet.
- **`GUIA-RESENAS.md`** — cómo guardar las reseñas que deja cada visitante.
- **`REVISAR-IMPORTACION.md`** — qué se importó del Excel y qué se dejó afuera.

> El Excel original de propiedades **no está en el repositorio**, a propósito:
> su columna `CLIENTE` tiene 18 nombres reales de propietarios y este repo es
> público.
