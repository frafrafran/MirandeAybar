# Mirande Aybar — sitio

Inmobiliaria en Villa General Belgrano, Valle de Calamuchita, Córdoba.

Tres archivos, sin build, sin dependencias. Las fotos y logos reales están en
`assets/` (copiados desde `sitio-web/assets/` del proyecto original).

## Cómo abrirlo

**La forma simple:** doble clic en `index.html`. Funciona tal cual, igual que el
sitio original. No hay `fetch`, ni módulos ES, ni nada que necesite servidor.

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

| Token | Valor |
| --- | --- |
| `--ink` / `--ink-2` | `#0B0A08` / `#14120E` |
| `--ivory` / `--ivory-2` | `#F2EFE9` / `#E9E4DA` |
| `--gold` / `--gold-deep` | `#C2A05C` / `#A8863F` |
| Display / cuerpo | Bricolage Grotesque / Instrument Sans |
| Easing | `cubic-bezier(.22,1,.36,1)` |

**Dos tokens tuvieron que corregirse por contraste**, y conviene saber por qué:

- `--gold` (`#C2A05C`) da **2.16:1 sobre marfil**. Es inservible como texto en
  fondo claro, incluso para títulos grandes. Se agregó `--gold-l` (`#7A5E22`,
  5.31:1) para texto dorado sobre claro. El dorado de marca se usa sólo sobre
  `--ink`, donde da 7.99:1, y como color gráfico.
- `--muted-l` original (`#7A736A`) daba **4.08:1**. Se oscureció a `#6F6960`
  (4.73:1).

Las estrellas de las opiniones usaban `--gold-deep` (2.98:1) y pasaron a
`--gold-l`.

## Arquitectura de scroll

Cada sección con pin es un `.track` alto que envuelve un `.pin`
(`position:sticky; top:0; height:100dvh`). 19.6 alturas de viewport en total.

| Track | Largo | Qué maneja |
| --- | --- | --- |
| Hero | 300vh | El sol sube sobre las sierras, deriva del titular, barra de avance |
| Manifiesto | 200vh | Revelado palabra por palabra + marco escalando 0.8 → 1.15 |
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
- **Bento de propiedades** — 10 tiles, mezcla de fotos reales y métricas.
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
- Contraste verificado contra WCAG AA en 29 pares: el mínimo es 4.73:1.

## Lo que quedó afuera

- **El selector ES / EN** del sitio original no está portado. La página está
  sólo en español. La lógica bilingüe vive en `app.js` del proyecto original y
  se puede traer.
- **Supabase**: las propiedades están escritas a mano en el HTML, no leídas de
  la base. `config.js` del proyecto original ya tiene URL y clave `anon`;
  conectar el fetch es el paso siguiente si querés que el listado sea dinámico.
- Los filtros de propiedades (tipo, dormitorios, precio) tampoco están: el bento
  es una selección curada de 5 propiedades, no el listado completo.
