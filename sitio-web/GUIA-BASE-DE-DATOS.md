# 🏠 Guía: Base de datos gratuita de propiedades (Supabase)

Esta guía te explica, paso a paso y sin conocimientos técnicos, cómo crear una
**base de datos gratuita** para cargar tus propiedades (información + fotos) y
conectarla a tu sitio web. Vas a poder subir, editar y borrar propiedades vos
mismo, desde cualquier computadora, sin tocar el código.

Usamos **Supabase**, una plataforma gratuita y profesional. El plan gratis
alcanza de sobra para una inmobiliaria (500 MB de base de datos + 1 GB de fotos).

> ⏱️ Tiempo estimado: 20–30 minutos, una sola vez.

---

## Antes de empezar: ¿cómo funciona?

Mientras no configures la base de datos, tu sitio **ya funciona** y muestra
propiedades de ejemplo. Cuando termines esta guía, el sitio va a mostrar
**tus** propiedades reales automáticamente.

El sitio tiene tres partes:
1. **Supabase** → donde viven tus propiedades y fotos (lo que arma esta guía).
2. **El archivo `config.js`** → donde pegás 2 claves para conectar el sitio a Supabase.
3. **El sitio (`index.html`)** → muestra las propiedades solo.

---

## PASO 1 — Crear tu cuenta en Supabase

1. Entrá a **https://supabase.com** y hacé clic en **Start your project**.
2. Registrate con tu cuenta de Google (la de `mirandeaybar@gmail.com` sirve) o con email.
3. Ya dentro, hacé clic en **New project**.
4. Completá:
   - **Name:** `mirandeaybar`
   - **Database Password:** poné una contraseña y **guardala** (la anotás en un papel; no la vas a necesitar todos los días pero no la pierdas).
   - **Region:** elegí **South America (São Paulo)** (es la más cercana a Argentina).
5. Clic en **Create new project** y esperá 1–2 minutos a que se cree.

---

## PASO 2 — Crear la tabla de propiedades

1. En el menú de la izquierda, entrá a **SQL Editor** (ícono `</>`).
2. Clic en **+ New query**.
3. Copiá y pegá **todo** este bloque y hacé clic en **Run** (abajo a la derecha):

```sql
-- Tabla de propiedades
create table propiedades (
  id           bigint generated always as identity primary key,
  created_at   timestamptz default now(),
  publicada    boolean default true,       -- si está en false, no aparece en la web
  titulo       text not null,              -- ej: "Casa serrana con vista"
  titulo_en    text,                       -- (opcional) título en inglés
  tipo         text default 'casa',        -- casa | terreno | departamento | local
  operacion    text default 'venta',       -- venta | alquiler | temporario
  precio       numeric,                    -- solo el número, ej: 145000
  moneda       text default 'USD',         -- USD o ARS
  localidad    text,                        -- ej: "Villa General Belgrano"
  dormitorios  int default 0,
  banos        int default 0,
  superficie   int default 0,              -- m² cubiertos
  lote         int default 0,              -- m² del terreno
  descripcion  text,
  descripcion_en text,                     -- (opcional) descripción en inglés
  destacada    boolean default false,      -- muestra la etiqueta "Destacada"
  nuevo        boolean default false,      -- muestra la etiqueta "Nuevo"
  imagen       text,                        -- (opcional) foto principal
  imagenes     text                         -- galería: varios links separados por coma o salto de línea
);

-- Permitir que la web lea las propiedades publicadas (seguro: solo lectura)
alter table propiedades enable row level security;

create policy "Lectura publica de propiedades publicadas"
  on propiedades for select
  using ( publicada = true );
```

4. Si ves **"Success. No rows returned"**, ¡listo! La tabla se creó.

---

## PASO 3 — Preparar el lugar para las fotos (Storage)

1. En el menú izquierdo, entrá a **Storage**.
2. Clic en **New bucket**.
3. Nombre del bucket: `fotos`
4. Activá la opción **Public bucket** (importante: así las fotos se ven en la web).
5. Clic en **Create bucket**.

---

## PASO 4 — Cargar tu primera propiedad (con foto)

### 4.1 Subir la foto
1. Entrá a **Storage → fotos**.
2. Clic en **Upload file** y subí la foto de la propiedad (JPG o PNG).
3. Cuando termine, hacé clic en la foto subida → botón **Get URL** (o "Copy URL").
4. Copiá ese link. Se ve parecido a:
   `https://xxxx.supabase.co/storage/v1/object/public/fotos/mi-casa.jpg`

> 💡 Consejo: subí las fotos ya recortadas y livianas (menos de 1 MB cada una)
> para que el sitio cargue rápido. Formato horizontal se ve mejor en las tarjetas.

### 4.2 Cargar los datos
1. Entrá a **Table Editor** (menú izquierdo) → elegí la tabla **propiedades**.
2. Clic en **+ Insert → Insert row**.
3. Completá los campos:
   - **titulo:** `Casa serrana con vista`
   - **tipo:** `casa` (o `terreno`, `departamento`, `local`)
   - **operacion:** `venta` (o `alquiler`, `temporario`)
   - **precio:** `145000` (solo números, sin puntos ni símbolos)
   - **moneda:** `USD` o `ARS`
   - **localidad:** `Villa General Belgrano`
   - **dormitorios / banos / superficie / lote:** los números que correspondan (0 si no aplica)
   - **descripcion:** el texto que quieras mostrar
   - **imagen:** (opcional) el link de la foto principal
   - **imagenes:** pegá **varios links de fotos** separados por coma o por salto de
     línea. Ese es el orden en que aparecen en el carrusel de la ficha. Ejemplo:
     ```
     https://xxxx.supabase.co/.../fotos/casa-1.jpg,
     https://xxxx.supabase.co/.../fotos/casa-2.jpg,
     https://xxxx.supabase.co/.../fotos/casa-3.jpg
     ```
   - **destacada:** poné `true` para mostrar la etiqueta dorada "Destacada".
   - **nuevo:** poné `true` para mostrar la etiqueta verde "Nuevo".
   - **publicada:** dejá `true`
4. Clic en **Save**.

> 📸 **Galería de fotos:** subí todas las fotos de la propiedad al bucket `fotos`
> (Paso 3–4.1), copiá el link de cada una y pegalas todas juntas en el campo
> **imagenes**, separadas por coma. La ficha las muestra en un carrusel con flechas.

Repetí para cada propiedad. Para **editar** una propiedad, hacé doble clic sobre
la celda. Para **ocultarla** de la web sin borrarla, cambiá **publicada** a `false`.

---

## PASO 5 — Conectar el sitio a tu base de datos

1. En Supabase, andá a **Project Settings** (ícono de engranaje, abajo a la izquierda).
2. Necesitás copiar dos datos:
   - **Project URL**: entrá a **Data API** (sección Integrations del menú). Es algo como
     `https://xxxx.supabase.co` (la "xxxx" es tu Project ID, que también figura en General).
   - **La clave**: entrá a **API Keys** (sección Configuration del menú).
     - Si hay una pestaña **Legacy API keys**, copiá la clave **`anon` `public`** (empieza con `eyJ...`).
     - Si ves **Publishable key** (empieza con `sb_publishable_...`), esa también sirve.

   > ✅ Usá siempre la `anon public` o la `publishable`. **Nunca** uses la
   > `service_role` ni una clave "secret" (esas no deben ir en un sitio web).

3. Abrí el archivo **`config.js`** de tu sitio con el Bloc de notas (o cualquier editor).
4. Pegá los dos datos entre las comillas:

```js
  supabaseUrl:  "https://xxxx.supabase.co",
  supabaseKey:  "eyJhbGciOi... (tu clave anon public completa)"
```

5. Guardá el archivo. Si el sitio ya está publicado, volvé a subir el `config.js`
   (ver **COMO-PUBLICAR.md**). ¡Listo! El sitio ahora muestra tus propiedades reales.

---

## PASO 6 — (Opcional) Guardar las consultas del formulario

Si querés que cada mensaje enviado desde el formulario de contacto quede guardado
en tu base de datos (además de llegarte por WhatsApp/email), creá esta tabla.

1. Entrá a **SQL Editor → + New query**, pegá esto y hacé **Run**:

```sql
create table consultas (
  id         bigint generated always as identity primary key,
  created_at timestamptz default now(),
  nombre     text,
  email      text,
  telefono   text,
  mensaje    text,
  agendar    boolean default false,
  fecha      date,
  hora       time,
  idioma     text
);

-- Permitir que la web GUARDE consultas (solo insertar, nunca leer)
alter table consultas enable row level security;

create policy "Cualquiera puede enviar una consulta"
  on consultas for insert
  with check ( true );
```

2. Listo. Con la conexión a Supabase ya configurada (Paso 5), cada consulta se
   guarda automáticamente. Para verlas, entrá a **Table Editor → consultas**.

> 🔒 La política solo permite **insertar** (enviar) consultas, no leerlas desde la
> web. Vos las ves logueado en el panel de Supabase. Tus datos quedan privados.

---

## Preguntas frecuentes

**¿Es realmente gratis?**
Sí. El plan gratuito de Supabase incluye 500 MB de base de datos y 1 GB de fotos,
más que suficiente para cientos de propiedades. No pide tarjeta de crédito.

**¿Puedo cargar propiedades desde el celular?**
Sí, entrando a supabase.com desde el navegador del celular. Se usa mejor desde
una computadora, pero funciona en ambos.

**¿Se pueden mostrar varias fotos por propiedad?**
Sí. Pegá todos los links de fotos en el campo **imagenes**, separados por coma
o salto de línea (ver Paso 4.2). La ficha de la propiedad las muestra en un
carrusel con flechas y puntos. La tarjeta muestra un contador con la cantidad de fotos.

**¿Y si me equivoco en algo?**
No pasa nada: podés editar o borrar cualquier propiedad desde el **Table Editor**.
La base de datos no afecta el diseño del sitio.

**¿Necesito saber programar?**
No. Solo copiás y pegás una vez el bloque del Paso 2, y después cargás
propiedades desde la pantalla de Supabase como si fuera una planilla.

---

¿Dudas con algún paso? Guardá esta guía y seguila con calma. Todo es reversible.
