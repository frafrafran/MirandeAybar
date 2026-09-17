# Base de datos para las reseñas

Hoy las doce opiniones del carrusel están escritas a mano en `main.js` (el array
`RESENAS`). Son **inventadas**, para ver cómo funciona el componente.

Esta guía las pasa a Supabase y agrega un formulario para que los clientes dejen
la suya.

---

## Lo primero, porque cambia todo el diseño

Guardar reseñas es distinto de mostrar propiedades. En las propiedades **vos**
escribís y el público sólo lee. Acá **cualquiera escribe**.

Tu clave `anon` está a la vista en el HTML. Cualquiera puede abrir la consola y
mandar filas a esa tabla, todas las que quiera. No hay forma de evitarlo con una
clave pública, es así por diseño.

Por eso la regla es una sola:

> **Ninguna reseña se muestra hasta que vos la aprobás.**

Con eso, lo peor que puede hacer un abusador es llenarte una tabla que nadie ve.
Sin eso, te publican cualquier cosa en la home.

---

## Paso 1 — La tabla

**SQL Editor → New query** en Supabase:

```sql
create table if not exists resenas (
  id         bigint generated always as identity primary key,
  creada     timestamptz not null default now(),

  nombre     text not null,
  iniciales  text,                        -- se calcula solo, ver trigger
  contexto   text,                        -- "Compró una casa en VGB"
  texto      text not null,
  puntaje    int  not null default 5,

  aprobada   boolean not null default false,   -- clave: arranca en false
  orden      int     not null default 0,       -- para ordenarlas a mano

  -- límites para que no te manden una novela ni una fila vacía
  constraint nombre_largo   check (char_length(nombre)  between 2 and 60),
  constraint texto_largo    check (char_length(texto)   between 20 and 400),
  constraint contexto_largo check (contexto is null or char_length(contexto) <= 80),
  constraint puntaje_rango  check (puntaje between 1 and 5)
);

create index if not exists resenas_publicas
  on resenas (aprobada, orden desc, creada desc);
```

Las iniciales se arman solas a partir del nombre:

```sql
create or replace function set_iniciales() returns trigger as $$
begin
  new.iniciales := upper(
    substr(split_part(new.nombre, ' ', 1), 1, 1) ||
    coalesce(nullif(substr(split_part(new.nombre, ' ', 2), 1, 1), ''), '')
  );
  return new;
end $$ language plpgsql;

drop trigger if exists resenas_iniciales on resenas;
create trigger resenas_iniciales
  before insert or update of nombre on resenas
  for each row execute function set_iniciales();
```

## Paso 2 — Permisos (lo más importante)

```sql
alter table resenas enable row level security;

-- 1. el público SOLO ve las aprobadas
create policy "lectura de aprobadas"
  on resenas for select
  to anon
  using (aprobada = true);

-- 2. el público puede DEJAR una reseña, pero nunca aprobada
create policy "alta publica sin aprobar"
  on resenas for insert
  to anon
  with check (aprobada = false and orden = 0);

-- 3. nadie del público puede editar ni borrar
--    (al no crear políticas de update/delete, quedan prohibidas)
```

La política 2 es la que importa: el `with check` impide que alguien mande una
fila ya marcada como `aprobada = true` y se auto-publique.

### Comprobalo antes de seguir

```bash
curl -X POST "https://TU-PROYECTO.supabase.co/rest/v1/resenas" -H "apikey: TU_CLAVE_ANON" -H "Content-Type: application/json" -d "{\"nombre\":\"Test\",\"texto\":\"Intento publicarme solo sin que nadie me apruebe.\",\"aprobada\":true}"
```

Tiene que **fallar**. Si crea la fila con `aprobada = true`, la política 2 está
mal y cualquiera puede publicar en tu sitio.

Después probá el mismo `curl` sin `aprobada` — ese sí tiene que funcionar.

## Paso 3 — Aprobar reseñas

En Supabase: **Table Editor → resenas**. Las nuevas aparecen con `aprobada` en
`false`. Leés, y si está bien, tildás la casilla. Listo, ya se ve en el sitio.

Para que te avise cuando llega una: **Database → Webhooks → Create**, evento
`INSERT` en `resenas`, y apuntalo a tu email con un servicio como Zapier o Make.
No es imprescindible; también podés mirar la tabla cada tanto.

## Paso 4 — Mostrarlas en el carrusel

En `main.js`, el array `RESENAS` pasa a ser el respaldo. Agregá esto **justo
antes** del bloque `(function stagger() {`:

```js
  /* Si hay Supabase configurado, las reseñas salen de ahí.
     Si no responde o no hay ninguna aprobada, quedan las de RESENAS. */
  function cargarResenas(cb) {
    var CFG = window.CONFIG || {};
    if (!CFG.supabaseUrl || !CFG.supabaseKey) { cb(RESENAS); return; }

    var url = CFG.supabaseUrl.replace(/\/$/, '') +
      '/rest/v1/resenas?select=nombre,iniciales,contexto,texto' +
      '&aprobada=eq.true&order=orden.desc,creada.desc&limit=20';

    var listo = false;
    var fallback = window.setTimeout(function () {
      if (!listo) { listo = true; cb(RESENAS); }   // si tarda, no dejamos la sección vacía
    }, 4000);

    fetch(url, { headers: { apikey: CFG.supabaseKey, Authorization: 'Bearer ' + CFG.supabaseKey } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (filas) {
        if (listo) return;
        listo = true; window.clearTimeout(fallback);
        if (!filas || filas.length < 3) { cb(RESENAS); return; }  // con menos de 3 el carrusel queda pobre
        cb(filas.map(function (f) {
          return { ini: f.iniciales || '··', nombre: f.nombre,
                   que: f.contexto || '', texto: f.texto };
        }));
      })
      .catch(function (e) {
        if (listo) return;
        listo = true; window.clearTimeout(fallback);
        console.error('Reseñas:', e);
        cb(RESENAS);
      });
  }
```

Y cambiá el arranque del carrusel. Donde dice:

```js
    medir();
    lista.forEach(function (d) { ... });
    colocar(false);
```

poné:

```js
    medir();
    cargarResenas(function (datos) {
      lista = datos;
      lista.forEach(function (d) {
        var el = crear(d);
        deck.appendChild(el);
        nodos.push({ data: d, el: el });
      });
      colocar(false);
    });
```

## Paso 5 — El formulario

En `index.html`, dentro de la sección `#opiniones`, después del `</div>` que
cierra `.stg`:

```html
<div class="wrap res-form-wrap">
  <details class="res-det">
    <summary class="btn btn--ghost">Dejá tu opinión</summary>
    <form class="res-form" id="resForm" novalidate>
      <div class="field">
        <label for="r-nombre">Tu nombre <span class="req">*</span></label>
        <input id="r-nombre" name="nombre" type="text" maxlength="60" placeholder="Nombre y apellido" />
        <p class="err" id="r-e-nombre" hidden></p>
      </div>
      <div class="field">
        <label for="r-ctx">¿Qué hiciste con nosotros? <span class="opt">(opcional)</span></label>
        <input id="r-ctx" name="contexto" type="text" maxlength="80" placeholder="Compré una casa en VGB" />
      </div>
      <div class="field">
        <label for="r-texto">Tu opinión <span class="req">*</span></label>
        <textarea id="r-texto" name="texto" rows="4" maxlength="400" placeholder="Contanos cómo fue tu experiencia."></textarea>
        <p class="help"><span id="r-cuenta">0</span>/400 · mínimo 20 caracteres</p>
        <p class="err" id="r-e-texto" hidden></p>
      </div>
      <!-- trampa para robots: una persona nunca lo ve ni lo completa -->
      <div class="res-trampa" aria-hidden="true">
        <label>No completar<input type="text" id="r-web" name="web" tabindex="-1" autocomplete="off" /></label>
      </div>
      <button class="btn btn--gold btn--wide" type="submit" id="resEnviar">Enviar opinión</button>
      <p class="help">La publicamos después de leerla. No mostramos tu email ni tu teléfono.</p>
      <div class="res-ok" id="resOk" hidden>
        <p class="done__h">¡Gracias!</p>
        <p class="note">La leemos y la publicamos en los próximos días.</p>
      </div>
    </form>
  </details>
</div>
```

Al final de `main.js`, antes del `})();` que cierra todo:

```js
  (function formResenas() {
    var f = $('#resForm');
    if (!f) return;
    var CFG = window.CONFIG || {};
    var txt = $('#r-texto'), cuenta = $('#r-cuenta');

    txt.addEventListener('input', function () { cuenta.textContent = txt.value.length; });

    function err(id, eid, msg) {
      var i = document.getElementById(id), e = document.getElementById(eid);
      i.closest('.field').classList.toggle('is-bad', !!msg);
      e.textContent = msg || ''; e.hidden = !msg;
      if (msg) e.setAttribute('role', 'alert'); else e.removeAttribute('role');
      return !msg;
    }

    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if ($('#r-web').value) return;                       // robot: se descarta en silencio

      var nombre = $('#r-nombre').value.trim();
      var texto = txt.value.trim();
      var ok = [
        err('r-nombre', 'r-e-nombre', nombre.length >= 2 ? '' : 'Poné tu nombre.'),
        err('r-texto', 'r-e-texto',
            texto.length >= 20 ? '' : 'Contanos un poco más (mínimo 20 caracteres).')
      ];
      if (ok.indexOf(false) !== -1) return;

      if (!CFG.supabaseUrl || !CFG.supabaseKey) {
        alert('Falta configurar config.js'); return;
      }

      var btn = $('#resEnviar');
      btn.classList.add('is-pending'); btn.disabled = true;

      fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/resenas', {
        method: 'POST',
        headers: {
          apikey: CFG.supabaseKey,
          Authorization: 'Bearer ' + CFG.supabaseKey,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          nombre: nombre,
          contexto: $('#r-ctx').value.trim() || null,
          texto: texto
          /* aprobada y orden NO se mandan: los pone la base en false/0,
             y la política los exige así */
        })
      })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); })
        .then(function () {
          f.querySelectorAll('.field, #resEnviar, .help').forEach(function (n) { n.style.display = 'none'; });
          $('#resOk').hidden = false;
        })
        .catch(function (e) {
          console.error(e);
          btn.classList.remove('is-pending'); btn.disabled = false;
          err('r-texto', 'r-e-texto', 'No pudimos enviarla. Probá de nuevo o escribinos por WhatsApp.');
        });
    });
  })();
```

Y al final de `styles.css`:

```css
.res-form-wrap{margin-top:clamp(2rem,4vw,3rem);}
.res-det{max-width:560px;margin-inline:auto;}
.res-det summary{list-style:none;cursor:pointer;display:inline-flex;}
.res-det summary::-webkit-details-marker{display:none;}
.res-det[open] summary{margin-bottom:1.5rem;}
.res-form{display:grid;gap:1.1rem;background:var(--ivory);
  border:1px solid var(--line-l);border-radius:var(--r);
  padding:clamp(1.25rem,3vw,2rem);text-align:left;}
.res-form .field label{color:var(--muted-l);}
.res-form input,.res-form textarea{border-bottom-color:var(--line-l);color:var(--ink);}
.res-form input::placeholder,.res-form textarea::placeholder{color:#A9A499;}
.res-form .help{color:var(--muted-l);text-align:left;}
/* la trampa se saca de la vista sin usar display:none, que los robots detectan */
.res-trampa{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;}
.res-ok{text-align:center;padding:1rem 0;}
```

---

## Sobre el spam

Lo que hay puesto alcanza para un sitio local:

| Defensa | Qué frena |
|---|---|
| `aprobada = false` obligatorio | Que se publiquen solas. **Ésta es la que importa.** |
| `CHECK` de longitud | Filas vacías y textos de 10.000 caracteres |
| Trampa oculta (honeypot) | Los robots simples, que completan todos los campos |
| Sin `update` ni `delete` | Que te borren o editen reseñas |

Lo que **no** frena: alguien decidido puede llenarte la tabla de basura desde la
consola. No se puede impedir con una clave pública. Si algún día pasa:

1. En Supabase, borrás las filas con `aprobada = false` de un saque:
   `delete from resenas where aprobada = false;`
2. Agregás un captcha. Supabase se integra con **hCaptcha** y **Cloudflare
   Turnstile**; Turnstile es gratis e invisible para el visitante.

Para una inmobiliaria de Villa General Belgrano, lo más probable es que esto
nunca haga falta.

## Si algo falla

| Síntoma | Causa casi siempre |
|---|---|
| El carrusel muestra siempre las 12 inventadas | No hay 3 reseñas aprobadas, o falta `config.js` |
| `401` al enviar | Falta la política de `insert` |
| `403` al enviar | Estás mandando `aprobada: true`; sacalo del `body` |
| `400` al enviar | El texto no llega a 20 caracteres o pasa de 400 |
| Error de CORS | Abriste con doble clic (`file://`). Usá `ABRIR-SITIO.bat` |
