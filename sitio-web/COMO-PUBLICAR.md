# 🌐 Cómo publicar tu sitio (gratis)

Tu sitio es un conjunto de archivos que se pueden subir a internet **gratis** y
tener tu propia dirección web. Acá tenés dos formas, de la más fácil a la más completa.

Los archivos de tu sitio son:

```
sitio-web/
├── index.html          ← la página
├── app.js              ← funcionamiento
├── config.js           ← tus datos (WhatsApp, redes, Supabase)
└── assets/             ← logos y fotos
```

> Antes de publicar, revisá **config.js** y completá tus links de **Instagram** y
> **TikTok** (ver más abajo, sección "Antes de publicar").

---

## Opción A — Netlify (la más fácil, recomendada) ⭐

No requiere instalar nada. Se sube arrastrando una carpeta.

1. Entrá a **https://www.netlify.com** y creá una cuenta gratis (con Google o email).
2. Una vez adentro, buscá la sección **Sites** y la zona que dice
   **"Drag and drop your site output folder here"** (Arrastrá tu carpeta aquí).
3. Desde tu computadora, arrastrá la carpeta **`sitio-web`** completa a esa zona.
4. Esperá unos segundos. Netlify te va a dar una dirección tipo
   `https://nombre-al-azar.netlify.app`. **¡Tu sitio ya está online!**
5. (Opcional) En **Site settings → Change site name** podés poner algo como
   `mirandeaybar` y quedaría `https://mirandeaybar.netlify.app`.

**Para actualizar el sitio** (por ejemplo, después de cargar propiedades o cambiar
config.js): volvés a Netlify, entrás a tu sitio → pestaña **Deploys** → arrastrás
de nuevo la carpeta `sitio-web`. Reemplaza la versión anterior.

---

## Opción B — Tu propio dominio (ej: www.mirandeaybar.com)

Si querés una dirección profesional propia:

1. Comprá el dominio en un proveedor (por ejemplo **nic.ar** para `.com.ar`, o
   Namecheap / GoDaddy para `.com`). Cuesta unos pocos dólares al año.
2. En Netlify: **Site settings → Domain management → Add custom domain** y pegá tu dominio.
3. Netlify te muestra qué datos (DNS) cargar en el panel de tu proveedor de dominio.
   Seguí esas instrucciones (o pasámelas y te ayudo).
4. En unas horas tu sitio queda en `www.mirandeaybar.com` con candado de seguridad (HTTPS) incluido.

---

## Antes de publicar: completá tus datos

Abrí **`config.js`** con el Bloc de notas y revisá que estén tus datos reales:

```js
whatsapp:  "5493512729721",              // ✅ ya cargado
email:     "mirandeaybar@gmail.com",     // ✅ ya cargado
instagram: "https://www.instagram.com/TU_USUARIO",   // ⚠️ REEMPLAZAR
tiktok:    "https://www.tiktok.com/@TU_USUARIO",      // ⚠️ REEMPLAZAR
```

- Reemplazá `TU_USUARIO` por el usuario real de Instagram y TikTok de la empresa.
- Los links de **WhatsApp** y **Email** ya están funcionando en todo el sitio.

### Fotos del equipo (opcional pero recomendado)
Ahora las tarjetas del equipo muestran las iniciales (SM y MA) sobre fondo azul.
Para poner las fotos reales:

1. Guardá las fotos en `sitio-web/assets/equipo/` con estos nombres exactos:
   `sebastian.jpg` y `mario.jpg`.
2. En `index.html`, buscá la sección del equipo (buscá `member-photo`) y reemplazá:
   ```html
   <span class="initials">SM</span>
   ```
   por:
   ```html
   <img src="assets/equipo/sebastian.jpg" alt="Sebastián Mirande">
   ```
   (y lo mismo para Mario con `mario.jpg`).

---

## Probar el sitio en tu computadora (antes de publicar)

Simplemente hacé **doble clic en `index.html`** y se abre en tu navegador.

> Nota: si abrís el archivo con doble clic, las **propiedades de Supabase** podrían
> no cargar por seguridad del navegador (verás las de ejemplo). Eso es normal y
> **se soluciona solo cuando publicás el sitio** (Opción A). Todo lo demás —diseño,
> 3D, idiomas, WhatsApp, formulario— funciona igual con doble clic.

---

## Resumen rápido

1. Completar Instagram y TikTok en `config.js`.
2. (Opcional) Crear la base de datos → ver **GUIA-BASE-DE-DATOS.md**.
3. Subir la carpeta `sitio-web` a Netlify arrastrándola.
4. ¡Listo, tu inmobiliaria está online! 🎉

¿Necesitás ayuda con algún paso o con conectar tu dominio? Avisame y lo vemos juntos.
