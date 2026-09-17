# Conectar las propiedades a Supabase

Hoy las cinco propiedades del sitio están escritas a mano dentro de `index.html`.
Esta guía las pasa a tu base de Supabase, para que puedas cargar y editar
propiedades sin tocar código.

> **Mandame cómo tenés armada la base y adapto el código exacto.** Mientras
> tanto, esto asume la misma forma de datos que ya usaba tu `app.js` anterior,
> que es la más probable.

---

## Paso 1 — La tabla

En Supabase: **SQL Editor → New query**, pegá esto y dale **Run**.

```sql
create table if not exists propiedades (
  id            bigint generated always as identity primary key,
  creado        timestamptz not null default now(),

  titulo        text    not null,
  tipo          text    not null,          -- casa | terreno | departamento | local
  operacion     text    not null,          -- venta | alquiler | temporario
  localidad     text    not null,

  precio        numeric,
  moneda        text    default 'USD',     -- USD | ARS

  dormitorios   int     default 0,
  banos         int     default 0,
  superficie    int     default 0,         -- m² cubiertos
  lote          int     default 0,         -- m² de terreno

  descripcion   text,
  imagenes      text[]  default '{}',      -- lista de URLs

  destacada     boolean default false,
  nuevo         boolean default false,
  publicada     boolean default true       -- desmarcá para ocultar sin borrar
);

create index if not exists propiedades_orden
  on propiedades (publicada, destacada desc, creado desc);
```

## Paso 2 — Seguridad (este paso NO es opcional)

Tu clave `anon` va escrita en el HTML, o sea que **cualquiera que abra el sitio
puede verla**. Eso es normal y está bien diseñado así, *pero sólo si activás
Row Level Security*. Sin RLS, esa clave pública permite además **escribir y
borrar** tu tabla.

Corré esto:

```sql
alter table propiedades enable row level security;

-- cualquiera puede LEER las publicadas
create policy "lectura publica"
  on propiedades for select
  to anon
  using (publicada = true);

-- nadie puede escribir con la clave anon.
-- Vos cargás propiedades desde el panel de Supabase (Table Editor),
-- que usa tu sesión de administrador, no la clave anon.
```

Para comprobar que quedó bien, desde una terminal:

```bash
curl -X POST "https://TU-PROYECTO.supabase.co/rest/v1/propiedades" -H "apikey: TU_CLAVE_ANON" -H "Content-Type: application/json" -d "{\"titulo\":\"prueba\",\"tipo\":\"casa\",\"operacion\":\"venta\",\"localidad\":\"VGB\"}"
```

Tiene que responder un error de permisos. **Si crea la fila, RLS no está
activo** y hay que volver al paso anterior.

## Paso 3 — Las fotos

En Supabase: **Storage → New bucket**, nombre `propiedades`, marcalo **Public**.
Subís las fotos ahí y copiás la URL pública de cada una (botón *Copy URL*) al
campo `imagenes`.

En el Table Editor, `imagenes` se carga así:

```
["https://TU-PROYECTO.supabase.co/storage/v1/object/public/propiedades/casa1-a.jpg","https://TU-PROYECTO.supabase.co/storage/v1/object/public/propiedades/casa1-b.jpg"]
```

## Paso 4 — El código

Creá `config.js` al lado de `index.html`:

```js
window.CONFIG = {
  supabaseUrl: "https://TU-PROYECTO.supabase.co",
  supabaseKey: "TU_CLAVE_ANON_PUBLICA"
};
```

Creá `propiedades.js`:

```js
/* Carga las propiedades desde Supabase y las dibuja en el bento.
   Sin librerías: la API REST de Supabase es fetch común. */
(function () {
  'use strict';

  var CFG = window.CONFIG || {};
  var grid = document.querySelector('.bento');
  if (!grid || !CFG.supabaseUrl || !CFG.supabaseKey) return;   // sin config, quedan las de ejemplo

  var money = function (p, m) {
    if (p == null) return 'Consultar';
    return (m || 'USD') + ' ' + Number(p).toLocaleString('es-AR');
  };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  /* --- estado de carga: esqueletos del mismo tamaño que las tarjetas --- */
  function skeletons(n) {
    var h = '';
    for (var i = 0; i < n; i++) {
      h += '<article class="tile ' + (i % 3 === 0 ? 'tile--2x2' : 'tile--2x1') +
           ' tile--skel" aria-hidden="true"></article>';
    }
    grid.innerHTML = h;
  }

  function estadoVacio() {
    grid.innerHTML =
      '<article class="tile tile--2x2 tile--cta">' +
        '<p class="label">Sin propiedades cargadas</p>' +
        '<p class="cta__copy">Todavía no hay publicaciones activas. Escribinos y te contamos qué tenemos disponible.</p>' +
        '<a class="btn btn--ivory" href="#contacto">Consultar</a>' +
      '</article>';
  }

  function estadoError() {
    grid.innerHTML =
      '<article class="tile tile--2x2 tile--cta">' +
        '<p class="label">No pudimos cargar el listado</p>' +
        '<p class="cta__copy">Probá recargar la página. Si sigue igual, escribinos por WhatsApp y te pasamos las propiedades.</p>' +
        '<a class="btn btn--ivory" href="https://wa.me/5493512729721" target="_blank" rel="noopener">Escribir por WhatsApp</a>' +
      '</article>';
  }

  function tarjeta(p, i) {
    var grande = i === 0 || i % 4 === 0;
    var foto = (p.imagenes && p.imagenes[0]) || 'assets/fotos/pueblo-aerea.jpg';
    var specs = [];
    if (p.dormitorios) specs.push(p.dormitorios + ' dorm.');
    if (p.banos) specs.push(p.banos + (p.banos === 1 ? ' baño' : ' baños'));
    if (p.superficie) specs.push(p.superficie + ' m²');
    if (p.lote) specs.push('lote ' + p.lote + ' m²');

    return '' +
    '<article class="tile ' + (grande ? 'tile--2x2' : 'tile--2x1') + ' tile--photo reveal">' +
      '<img src="' + esc(foto) + '" alt="' + esc(p.titulo) + '" loading="lazy" decoding="async" />' +
      '<div class="tile__grad" aria-hidden="true"></div>' +
      '<div class="tile__body">' +
        '<p class="label tile__tag">' + esc(p.tipo) + ' &middot; ' + esc(p.operacion) + '</p>' +
        '<h3>' + esc(p.titulo) + '</h3>' +
        '<p class="tile__loc">' + esc(p.localidad) + '</p>' +
        (specs.length ? '<ul class="tile__specs">' +
          specs.map(function (s) { return '<li class="num">' + esc(s) + '</li>'; }).join('') +
        '</ul>' : '') +
        '<p class="tile__price num">' + esc(money(p.precio, p.moneda)) + '</p>' +
      '</div>' +
      (p.destacada ? '<span class="tile__flag label">Destacada</span>' :
       p.nuevo ? '<span class="tile__flag tile__flag--new label">Nuevo</span>' : '') +
    '</article>';
  }

  function cierre() {
    return '' +
    '<article class="tile tile--2x2 tile--cta reveal">' +
      '<p class="label">¿No ves lo que buscás?</p>' +
      '<p class="cta__copy">Tenemos propiedades que no publicamos. Contanos qué necesitás.</p>' +
      '<a class="btn btn--ivory" href="#contacto">Pedir la lista completa</a>' +
    '</article>';
  }

  skeletons(6);

  var url = CFG.supabaseUrl.replace(/\/$/, '') +
    '/rest/v1/propiedades' +
    '?select=*' +
    '&publicada=eq.true' +
    '&order=destacada.desc,creado.desc' +
    '&limit=9';

  fetch(url, {
    headers: {
      apikey: CFG.supabaseKey,
      Authorization: 'Bearer ' + CFG.supabaseKey
    }
  })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (filas) {
      if (!filas || !filas.length) { estadoVacio(); return; }
      grid.innerHTML = filas.map(tarjeta).join('') + cierre();
      /* volver a enganchar las animaciones de aparición en lo recién creado */
      if (window.MA && window.MA.observarReveals) window.MA.observarReveals();
    })
    .catch(function (e) {
      console.error('Supabase:', e);
      estadoError();
    });
})();
```

En `index.html`, justo antes de `</body>`:

```html
<script src="config.js"></script>
<script src="main.js"></script>
<script src="propiedades.js"></script>
```

Y agregá el estilo del esqueleto al final de `styles.css`:

```css
.tile--skel{background:var(--ivory-2);position:relative;overflow:hidden;}
.tile--skel::after{content:'';position:absolute;inset:0;
  background:linear-gradient(100deg,transparent 20%,rgba(255,255,255,.5) 50%,transparent 80%);
  background-size:220% 100%;animation:shimmer 1.3s linear infinite;}
```

## Paso 5 — Reenganchar las animaciones

Las tarjetas nuevas nacen después de que `main.js` ya registró los `.reveal`,
así que quedarían invisibles. Agregá esto **al final** de `main.js`, justo antes
del `})();` que cierra todo:

```js
  /* expuesto para que propiedades.js pueda registrar tarjetas creadas después */
  window.MA = {
    observarReveals: function () {
      $$('.reveal').forEach(function (el) {
        if (!el.classList.contains('is-in')) revealIO.observe(el);
      });
    }
  };
```

## Si algo falla

| Síntoma | Causa casi siempre |
|---|---|
| Quedan los esqueletos para siempre | URL o clave mal copiadas en `config.js` |
| `401` en la consola | Falta la política de lectura, o RLS quedó sin política |
| Devuelve `[]` vacío | Las filas tienen `publicada = false` |
| Las fotos no cargan | El bucket de Storage no es público |
| Error de CORS | Estás abriendo con doble clic (`file://`). Supabase necesita `http://`. Usá `ABRIR-SITIO.bat` |

Ese último es importante: **con la base conectada ya no alcanza el doble clic**,
hay que servir el sitio por HTTP. Publicado en internet no es problema, porque
ahí ya es `https://`.
