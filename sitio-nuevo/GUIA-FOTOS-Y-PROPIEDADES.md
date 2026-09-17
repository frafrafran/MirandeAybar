# Cómo cargar fotos nuevas y propiedades nuevas

Todo lo que hay que hacer para mantener la web al día. No hace falta tocar
código ni volver a publicar nada: la web lee la base cada vez que alguien la
abre.

Las tres piezas, para ubicarse:

| Pieza | Qué guarda | Dónde se entra |
|---|---|---|
| **Supabase** | La ficha de cada propiedad y los *links* a sus fotos | supabase.com → proyecto `mirandeaybar` → **Table Editor** → `propiedades` |
| **Cloudflare R2** | Los archivos de las fotos, en una carpeta por propiedad | dash.cloudflare.com → **R2** → `mirandeaybar-fotos` |
| **La web** | Muestra lo que hay en Supabase | https://mirandeaybar.franciscoaybar2110.workers.dev |

Las herramientas (`separar-fotos-whatsapp.py`, `subir-a-r2.py`,
`borrar-de-r2.py`) están en la carpeta del sitio, junto a este archivo.
Se corren desde la **terminal** (PowerShell o la pestaña Terminal de esta
app), parados en esa carpeta:

```powershell
cd C:\Users\ASUS\Projects\mirandeaybar
```

Una sola vez por computadora hace falta haber hecho `npx wrangler login`
(ya está hecho en esta PC).

---

## A. Dar de alta una propiedad nueva

### 1. Crear la fila en Supabase

Table Editor → tabla `propiedades` → **Insert row**. Campos:

| Campo | Qué poner | Ejemplo |
|---|---|---|
| `codigo` | El código del Excel, **único**. El siguiente libre. | `MA31` |
| `titulo` | Cómo se ve en la web. Poner la localidad al final ayuda a las fotos. | `Casa 3 Dormitorios en Los Reartes` |
| `tipo` | Uno de los que ya existen, para que el filtro funcione: `Casa`, `Lote`, `Cabaña`, `Complejo de cabañas`, `Macrolote`, `Chacra`, `Campo`, `Local comercial`, `Salón de fiestas`, `Housing` | `Casa` |
| `operacion` | `venta` o `alquiler` (minúsculas) | `venta` |
| `precio` | Solo el número, sin puntos ni símbolo | `85000` |
| `moneda` | `USD` o `ARS` | `USD` |
| `localidad` | Igual que las demás: `Villa General Belgrano`, `Los Reartes`, `La Cumbrecita`, `Villa Yacanto`, `Villa Ciudad Parque`, `El Durazno`, `Villa Los Aromos`, `Villa Berna` | `Los Reartes` |
| `dormitorios`, `banos` | Números. Para lotes, `0`. | `3`, `2` |
| `superficie` | m² cubiertos | `120` |
| `lote` | m² del terreno | `800` |
| `descripcion` | El texto largo de la ficha. Sin datos del dueño. | |
| `publicada` | `true` para que se vea. `false` la esconde sin borrarla. | `true` |
| `destacada` | `true` la muestra arriba de todo | `false` |
| `nuevo` | `true` le pone la etiqueta "Nuevo" | `true` |
| `lat`, `lng` | Coordenadas para el mapa. Google Maps → clic derecho en el lugar → copiar el primer renglón. | `-31.9182`, `-64.5789` |
| `imagen`, `imagenes` | **Dejar vacíos.** Los completa la herramienta de fotos. | |

Guardar. La propiedad ya aparece en la web con "Foto en preparación".

### 2. Cargar las fotos

Seguir la parte B. La herramienta reconoce `MA31` y arma todo.

### Para cambiar algo de una propiedad existente

Table Editor → doble clic en la celda → editar → Enter. Listo. Para sacar una
de la web sin borrarla, `publicada` = `false`. Para venderla, lo mismo.

---

## B. Fotos nuevas desde WhatsApp

### Cómo tiene que mandarlas Papá

Por el chat, así:

1. Escribe el código y una descripción corta: **`MA31 CASA 3 DORMITORIOS LOS REARTES`**
2. Manda las fotos de esa propiedad, todas seguidas.
3. Siguiente propiedad: otra vez el código y las fotos.

También vale al revés (primero las fotos, después el código). Lo único que
importa es que el código esté **pegado** a su tanda de fotos, sin otra tanda
en el medio, y que cada código sea el de la fila en Supabase.

### 1. Exportar el chat (en el celular)

- **iPhone**: abrir el chat → tocar el nombre arriba → bajar hasta *Exportar chat* → **Adjuntar archivos** → guardar en Archivos, o mandarlo por AirDrop/Drive a la PC.
- **Android**: abrir el chat → ⋮ → *Más* → *Exportar chat* → **Incluir archivos**.

Queda un `.zip`. Copiarlo a la PC, por ejemplo a `C:\Users\ASUS\OneDrive\Documentos\`.

Si el chat es muy largo el zip puede ser grande; no importa, la herramienta
solo usa las fotos que están pegadas a un código.

### 2. Separar las fotos

```powershell
python separar-fotos-whatsapp.py "C:\Users\ASUS\OneDrive\Documentos\WhatsApp Chat - Papa.zip" --r2 https://pub-80c8232a5cae49bdb5c7fa00acf6dfb6.r2.dev
```

Tarda uno o dos minutos. Baja solo los títulos y códigos de Supabase, agrupa,
achica cada foto (1600 px, WebP, sin datos de GPS) y deja al lado del zip la
carpeta **`listo-para-r2\`**:

```
listo-para-r2\
  MA31-casa-3-dormitorios-en-los-reartes\
    MA31-casa-3-dormitorios-en-los-reartes-01.webp
    MA31-casa-3-dormitorios-en-los-reartes-02.webp
  _sin-codigo\            <- fotos que no tenían código al lado
  revision.csv            <- qué tanda fue a qué propiedad y con qué seguridad
  actualizar-fotos.sql    <- el comando para la base
```

**Mirar la pantalla y el `revision.csv`** antes de seguir:

- `alta` / `media`: bien.
- `REVISAR`: no encontró con seguridad la propiedad. Se resuelve a mano
  diciéndole el `id` de la fila en Supabase:
  ```powershell
  python separar-fotos-whatsapp.py "...zip" --r2 https://pub-80c8232a5cae49bdb5c7fa00acf6dfb6.r2.dev --forzar MA31=35
  ```
  (`MA31` = lo que escribió Papá, `35` = el `id` de la fila).
- `NOTA sin fotos al lado`: escribió un código pero no hay fotos pegadas.
  Avisarle.

Si ya cargaste fotos de un chat anterior, no pasa nada: la herramienta
procesa todo de nuevo pero después `subir-a-r2.py` saltea lo que ya está y
el SQL solo cambia lo que corresponda. Si preferís que no toque las viejas,
exportá el chat después de borrar los mensajes anteriores... o simplemente
corré el SQL solo para las filas nuevas (cada `update` es una línea
independiente).

### 3. Subir a R2

```powershell
python subir-a-r2.py "C:\Users\ASUS\OneDrive\Documentos\listo-para-r2" mirandeaybar-fotos --publico https://pub-80c8232a5cae49bdb5c7fa00acf6dfb6.r2.dev
```

Sube seis fotos a la vez; unos 2 segundos por foto. Al final dice
`Subidos: N   Ya estaban: M   Fallidos: 0`. Si hay fallidos, correr el mismo
comando otra vez: los que ya están se saltean.

La carpeta `_sin-codigo` **no se sube** (no tiene `.webp` con propiedad); si
alguna de esas fotos es de una propiedad, pedirle a Papá que la mande de
nuevo con el código.

### 4. Cargar los links en Supabase

Abrir `listo-para-r2\actualizar-fotos.sql` con el Bloc de notas, copiar
todo, y en supabase.com → **SQL Editor** → *New query* → pegar → **Run**.

Dice `Success` y cuántas filas cambió. Abrir la web: las fotos ya están.

Cada `update` del archivo es independiente: si solo querés cargar una
propiedad, pegá solo esa línea.

---

## C. Si algo salió mal

| Problema | Qué hacer |
|---|---|
| Las fotos de una propiedad son de otra | Corregir el `codigo` en Supabase o usar `--forzar`, repetir B.2 a B.4. Las fotos viejas quedan en R2 sin usarse; para limpiarlas: `python borrar-de-r2.py mirandeaybar-fotos lista.txt` con las claves (carpeta/archivo) una por línea. |
| "No pude bajar los títulos de Supabase" | Sin internet, o Supabase pausada (ver abajo). |
| La web dice "no se pudieron cargar las propiedades" | Supabase se pausó por inactividad. supabase.com → el proyecto → **Restore**. Un minuto. |
| `npx` da error de *execution policy* en PowerShell | Correr el comando en la pestaña Terminal de la app de Claude, o en `cmd`. Las herramientas llaman a wrangler por `cmd`, así que desde Python no molesta. |
| Una foto sale girada | Mandarla de nuevo por el chat; la herramienta respeta la orientación con la que llegó. |

## D. Qué NO subir nunca

- El Excel de propiedades (tiene la columna CLIENTE con nombres reales). Está
  bloqueado en `.gitignore`.
- Nombres, teléfonos o direcciones de los dueños en `descripcion`.
- La clave `service_role` de Supabase, en ningún lado. En `config.js` va
  solo la `anon`.
