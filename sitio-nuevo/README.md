# Mirande Aybar — sitio

Inmobiliaria en Villa General Belgrano, Valle de Calamuchita, Córdoba.

Sin build, sin dependencias, sin framework: `index.html`, `styles.css`,
`main.js`, `propiedades.js` y `config.js`. Las fotos y logos reales están en
`assets/` (copiados desde `sitio-web/assets/` del proyecto original).

El listado de propiedades **se lee de Supabase** en cada carga; el resto de la
página es estática.

## Cómo abrirlo

**La forma simple:** doble clic en `index.html`. No hay módulos ES ni nada que
exija un servidor. El listado de propiedades sí sale a la red a buscar los datos
a Supabase, y eso funciona igual desde `file://`: el preflight con `Origin: null`
responde `Access-Control-Allow-Origin: *` (verificado contra la API real).

**Si preferís servidor local:** doble clic en `ABRIR-SITIO.bat`. Levanta
`http://localhost:5273` y abre el navegador solo. Mientras la ventana negra esté
abierta, el sitio anda; al cerrarla, se apaga.

O a mano:

```bash
python -m http.server 5273 --directory .
```

> Un `localhost` que dejó de responder casi siempre es esto: el servidor era un
> proceso que se cerró. `localhost` no es un lugar donde el sitio "queda
> guardado", es un programa que tiene que estar corriendo.

## De dónde sale cada cosa

| Capa | Origen |
| --- | --- |
| Paleta, tipografías, easing, contenido, contactos, fotos | El sitio real (`sitio-web/`) |
| Arquitectura de pines, escala tipográfica, nav pastilla, bento | La referencia MONO |
| Amanecer WebGL, spotlight, giro 3D, revelado por palabras | Construido acá |

### Marca real (respetada)

Los tres colores de marca salen de **muestrear los píxeles del isologo**, no de
copiar un CSS viejo. El navy ocupa el 59.3 % del isologo y el bronce el 40.7 %.

| Token | Valor | De dónde sale |
| --- | --- | --- |
| `--navy` | `#2B3A42` | Isologo, color dominante |
| `--bronze` | `#A68364` | Isologo |
| `--cream` | `#EFE3D2` | Isologo |
| `--ink` / `--ink-2` / `--ink-3` | `#2B3A42` / `#1F2B31` / `#161E23` | Navy y dos profundidades |
| `--ivory` / `--ivory-2` / `--ivory-3` | `#EFE3D2` / `#E4D7C4` / `#D8C9B2` | Crema y dos pasos |
| Display / cuerpo | Bricolage Grotesque / Instrument Sans | |
| Easing | `cubic-bezier(.22,1,.36,1)` | |

**El bronce de marca no sirve como texto**, y por eso hay tres dorados y no uno:

- `--gold-graphic` (`#A68364`) es el bronce tal cual: sólo filetes, íconos y
  rellenos. Nunca texto.
- `--gold` (`#C9A87E`) es el acento **sobre oscuro**: 5.25:1.
- `--gold-l` (`#7A5E40`) es el acento **sobre claro**: 4.74:1.
- `--alerta` (`#9E3B2E`) para errores de formulario: 5.32:1 sobre `--ivory`.

Cada vez que un token viaja a una superficie más oscura que aquella para la que
fue calculado (`--ivory-2`, el panel de la ficha, la caja de los filtros) hay
que volver a bajarlo: esos ajustes están scopeados dentro del componente, no
globalmente.

## Arquitectura de scroll

Cada sección con pin es un `.track` alto que envuelve un `.pin`
(`position:sticky; top:0; height:100dvh`).

| Track | Largo | Qué maneja |
| --- | --- | --- |
| Hero | 300vh | El sol sube sobre las sierras, deriva del titular, barra de avance |
| Manifiesto | 200vh | Revelado palabra por palabra + marco escalando 0.8 → 1.15 |
| El valle se abre | 260vh | La ventana de video creciendo con `clip-path` |
| Servicios | 400vh | Comprá / Vendé / Invertí / Alquiler girando en `rotateX` |

`trackProgress()` devuelve 0 cuando el pin engancha y 1 cuando se suelta; todos
los efectos son función pura de ese número.

## El amanecer sobre el Champaquí

`main.js` tiene un shader propio en GLSL ES 1.00, sin Three.js: **siete cordones
en capas** generados con fBm, con paralaje por capa, luz de canto del lado del
sol y niebla acumulada bajo cada filo. El sol sube con el scroll, de la previa
del amanecer a la mañana clara.

Salió de la propia copy del sitio: *"la luz de la mañana sobre el Champaquí"*.

Detalle técnico que importa: el color de cada cordón se deriva del **cielo de
ese mismo píxel** multiplicado por un factor menor a 1
(`skyBase * mix(0.72, 0.26, k)`). Con una mezcla fija de cielo, como estaba al
principio, la silueta quedaba *más clara* que su fondo a media salida del sol y
el horizonte se volvía una pasta. Atarlo al cielo local garantiza que la silueta
se lea a cualquier altura del sol y a cualquier altura de pantalla.

Costo medido en gráficos integrados Intel Iris Xe, a 1138×648:

- 6.5 ms en el peor caso (amanecer), ~3.5 ms de mañana → **39 % de un cuadro a 60 fps**.
- Es unas cinco veces más barato por píxel que marchar un SDF.
- Renderiza a 0.9× de los píxeles CSS; baja resolución dos escalones si no
  sostiene el cuadro.
- Se detiene por completo cuando el canvas sale del viewport.
- Si falla WebGL, no compila el shader, o se pierde el contexto, cae a
  `assets/fotos/champaqui.jpg`.

## Componentes propios

- **El valle se abre** (`#rincon`) — port a vanilla del componente React
  `ScrollExpandMedia`. El original engancha `wheel`/`touch` en `window` con
  `preventDefault` y hace `scrollTo(0,0)` en cada scroll: eso sirve cuando el
  componente **es** la página entera, pero acá es una sección en el medio y un
  hijack global rompería las otras ocho, las anclas y el teclado. Se resolvió
  con el mismo patrón de pin del resto del sitio.

  La ventana crece con `clip-path: inset(… round …)` en lugar de animar
  `width`/`height`: no toca el layout, lo compone la GPU, y el video queda
  quieto mientras se abre el encuadre en vez de reencuadrarse a cada cuadro.
  El título se parte en dos con `mix-blend-mode: difference`, así se lee tanto
  sobre cielo claro como sobre sierra oscura.

  El video (`assets/video/valle-aereo.mp4`) sale de
  [Pexels](https://www.pexels.com/video/aerial-view-of-a-village-surrounded-by-green-mountains-15543358/),
  licencia libre comercial, autor 小鱼 五. **No es Villa General Belgrano** —
  es un pueblo de montaña genérico. Reemplazalo por un dron propio del valle;
  mismo nombre de archivo y no hay que tocar código. Pesa 8,2 MB: ver
  `GUIA-PUBLICAR.md` para comprimirlo.
- **Buscador y filtros** (`#propiedades`) — port a vanilla de `ActionSearchBar`.
  Se conserva la mecánica del original (debounce, la lupa que se vuelve flecha,
  sugerencias escalonadas), pero las opciones **se derivan de Supabase**, con el
  conteo real al lado de cada una. El precio son dos montos que el cliente
  escribe, con separador de miles en vivo y los dos extremos inclusive.

  Los datos traen inconsistencias que hay que normalizar *antes* de agrupar o
  salen chips repetidos: `venta` / `Venta`, y `Cabaña` con un salto de línea al
  final. Un grupo de filtro con una sola opción se oculta solo, y reaparece solo
  cuando aparece un segundo valor.
- **Ficha de propiedad a página completa** — la imagen va con `object-fit:
  contain`, no `cover`: recortar la foto de una propiedad puede esconder justo
  lo que se está vendiendo. Detrás va la misma imagen ampliada y desenfocada
  para que no queden franjas vacías. El fondo queda `inert` mientras está
  abierta, y la ficha vive en la URL (`#propiedad-12`), así se puede compartir y
  el botón *atrás* la cierra.
- **Bento de propiedades** — tiles de propiedad mezcladas con métricas.
- **Equipo** y **Opiniones** — ports a vanilla de `TeamSection` y
  `StaggerTestimonials`, verificados contra la geometría del original.
- **Riel del valle** — 8 localidades con arrastre, snap y botones.
- **Giro 3D de servicios** — las cuatro caras centradas en `p = i/(n-1)`, para
  que la primera esté de frente cuando el pin engancha y la última cuando se
  suelta. Centrarlas en `i/n` deja la sección **en blanco** en los dos extremos.

## Formulario

Manda de verdad, no simula. Arma el mensaje y abre:

- **WhatsApp** → `https://wa.me/5493512729721?text=…` (verificado, con acentos y
  saltos de línea correctamente codificados)
- **Email** → `mailto:mirandeaybar@gmail.com?subject=…&body=…`

El camino de email quedó verificado por construcción y no por ejecución: no se
puede interceptar la asignación de `location.href` para probarlo sin navegar.
Usa el mismo constructor de mensaje que WhatsApp, que sí se verificó.

## Notas para quien siga

- `body` usa `overflow-x: clip`, **no** `hidden`. Con `hidden` el body se vuelve
  contenedor de scroll y rompe todos los `position:sticky` de la página.
- Los reveals se activan con `html.js`: el contenido es visible por defecto y
  sólo se oculta cuando el JS confirma que puede volver a mostrarlo. Un fallo de
  scripting degrada a página legible, nunca a página en blanco. Un timer de
  1.6 s fuerza el reveal de todo lo que esté sobre el pliegue.
- El canvas se dimensiona con `ResizeObserver` **y** con timers de respaldo
  (`load`, `fonts.ready`, 120/600/1800 ms). El `ResizeObserver` no dispara si el
  primer layout llega trabado; los timers sí corren.
- `prefers-reduced-motion` colapsa los tres tracks a `height:auto`, despega los
  pines, apila las caras de servicios como bloques y apaga el spotlight.
- Contraste verificado contra WCAG AA midiendo el color computado sobre el
  fondo real de cada elemento, no el fondo que uno supone. El mínimo de los
  tokens es 4.74:1.
- Los objetivos táctiles del buscador, los filtros y la ficha miden 44 px
  (WCAG 2.5.8).

## Lo que quedó afuera

- **El selector ES / EN** del sitio original no está portado. La página está
  sólo en español. La lógica bilingüe vive en `app.js` del proyecto original y
  se puede traer.
- **30 de las 32 propiedades no tienen foto** y muestran el panel "Foto en
  preparación" hasta que se carguen las imágenes en Supabase.
- **`descripcion_en` está a medio traducir**: los servicios sí, el texto libre
  sigue en español.
- **El filtro por operación no se ve** porque hoy las 32 propiedades son en
  venta. Aparece solo el día que se cargue un alquiler; no hay que tocar código.
