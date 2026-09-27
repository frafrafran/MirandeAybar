# Publicar la web

La web **ya está publicada** en:

**https://mirandeaybar.franciscoaybar2110.workers.dev**

Cómo está armado, en una línea: el código vive en GitHub
(`github.com/frafrafran/MirandeAybar`), y Cloudflare publica solo, en uno o dos
minutos, cada cambio que llega a la rama `main`. No hay que "subir" nada a
Cloudflare a mano.

| Qué cambia | Dónde se cambia | Hay que publicar |
|---|---|---|
| Propiedades, precios, fotos, vendidas | Supabase (ver `GUIA-FOTOS-Y-PROPIEDADES.md`) | **No.** Se ve al recargar la página. |
| Textos, diseño, teléfonos, secciones | Archivos de `sitio-nuevo/` en GitHub | **Sí**, con un commit (parte 1). |
| Dominio propio | Cloudflare | Una sola vez (parte 3). |

---

## 1. Publicar un cambio en el diseño o los textos

### Una sola vez: instalar GitHub Desktop y bajar el repositorio

1. Bajá **GitHub Desktop** de https://desktop.github.com e instalalo.
2. Abrilo → **Sign in to GitHub.com** → entrá con la cuenta `frafrafran`.
3. **File → Clone repository** → pestaña *GitHub.com* → elegí
   `frafrafran/MirandeAybar`.
4. En *Local path* dejá `C:\Users\ASUS\Documents\GitHub\MirandeAybar` → **Clone**.

Esa carpeta es tu copia del repositorio. El sitio está en `sitio-nuevo\`.

### Cada vez que quieras cambiar algo

1. Abrí GitHub Desktop y tocá **Fetch origin** (arriba). Si aparece
   **Pull origin**, tocalo: trae lo último que haya subido otro (por ejemplo, yo).
   *Siempre antes de editar*, así no se pisan los cambios.
2. Editá los archivos dentro de `sitio-nuevo\` (con el Bloc de notas o VS Code).
   Lo más común está en:
   - `index.html` → textos, teléfonos, secciones.
   - `config.js` → WhatsApp general, email, ubicación de la oficina.
3. Probalo en tu PC antes de publicar: doble clic en `sitio-nuevo\ABRIR-SITIO.bat`.
   Se abre en `http://localhost:5273`.
4. Volvé a GitHub Desktop. A la izquierda aparecen los archivos cambiados.
   Revisá que sean solo los que tocaste.
5. Abajo a la izquierda, en *Summary*, escribí qué cambiaste
   (ej.: `Cambia el horario de atención`) → **Commit to main**.
6. Arriba, **Push origin**.

Listo. En uno o dos minutos está en la web.

> Si cambiaste `styles.css` o algún `.js` y en la web publicada no se ve, es la
> memoria del navegador. En `index.html`, cambiá el número que va después de
> `?v=` en las cuatro líneas que lo tienen (cualquier número nuevo sirve) y
> volvé a publicar.

### Verificar que se publicó

1. https://dash.cloudflare.com → **Workers & Pages** → `mirandeaybar`.
2. Pestaña **Deployments**: arriba de todo tiene que estar tu commit, con
   estado *Success* (o *Active*).
3. Abrí la web y recargá con **Ctrl + F5**.

Si el despliegue dice *Failed*, no se rompe nada: la web sigue mostrando la
versión anterior. Tocá el despliegue, copiá el error y pasámelo.

---

## 2. Qué NO se sube nunca

- El Excel de propiedades (tiene nombres de dueños). Está bloqueado en
  `.gitignore`, pero no lo copies dentro de la carpeta del repositorio.
- La clave `service_role` de Supabase, en ningún archivo. En `config.js` va
  solo la `anon`, que es pública por diseño.
- El repositorio es **público**: todo lo que se sube, cualquiera lo puede leer.

---

## 3. Dominio propio (`mirandeaybar.com.ar` o `.com`)

Es lo único que cuesta plata. Todo lo demás es gratis.

### Opción A — `.com` comprado en Cloudflare (la más simple)

1. https://dash.cloudflare.com → **Domain Registration → Register Domains**.
2. Buscá `mirandeaybar.com` → comprálo (precio de costo, unos USD 10 por año).
   Queda conectado a Cloudflare automáticamente.
3. Seguí en **Conectar el dominio a la web**.

### Opción B — `.com.ar` comprado en NIC Argentina

1. https://nic.ar → ingresá con tu **CUIT y Clave Fiscal** → registrá
   `mirandeaybar.com.ar`.
2. En Cloudflare: **Add a domain** (o *Add a site*) → escribí
   `mirandeaybar.com.ar` → elegí el plan **Free** → *Continue*.
3. Cloudflare te muestra **dos nameservers** (algo como
   `ana.ns.cloudflare.com` y `bob.ns.cloudflare.com`). Copialos.
4. En nic.ar → **Mis dominios** → `mirandeaybar.com.ar` → **Delegaciones** →
   borrá las que haya y cargá los dos de Cloudflare → guardar.
5. Esperá el mail de Cloudflare avisando que el dominio está activo
   (de minutos a 24 h).
6. Seguí en **Conectar el dominio a la web**.

### Conectar el dominio a la web

1. **Workers & Pages** → `mirandeaybar` → **Settings** → **Domains & Routes**
   → **+ Add** → **Custom domain**.
2. Escribí `mirandeaybar.com.ar` (o `.com`) → **Add domain**.
3. Repetí con `www.mirandeaybar.com.ar`.
4. Cloudflare crea el DNS y el certificado HTTPS solo. En unos minutos la
   web abre en el dominio nuevo, con candado.

### Después: avisame para cambiar las direcciones del código

Varios archivos (la vista previa de WhatsApp en `index.html`, `robots.txt`,
`sitemap.xml`, los datos para Google) todavía dicen `workers.dev`. Se cambian
todos juntos en un solo commit. La dirección `workers.dev` sigue andando igual.

---

## 4. Que Google la encuentre

1. **Search Console**: https://search.google.com/search-console → *Agregar
   propiedad* → **Dominio** → escribí el dominio → te da un registro `TXT`.
   En Cloudflare: el dominio → **DNS** → **Add record** → tipo `TXT`, nombre
   `@`, pegás el valor → *Save*. Volvés a Search Console → **Verificar**.
2. En Search Console → **Sitemaps** → escribí `sitemap.xml` → *Enviar*.
3. **Google Business Profile**: https://business.google.com → la ficha de la
   inmobiliaria (Paseo Los Troncos, Av. J. A. Roca 95) → en *Sitio web* poné el
   dominio nuevo. Para una inmobiliaria local esto trae más consultas que
   cualquier otra cosa.

---

## 5. Antes de anunciarla

- [ ] Abrirla en el celular y en la computadora.
- [ ] Tocar el WhatsApp flotante, el de cada socio y el de una ficha: que abran
      el número correcto.
- [ ] Abrir tres o cuatro propiedades: fotos, mapa y precio correctos.
- [ ] Mandarse el link por WhatsApp y ver que salga la tarjeta con imagen.
- [ ] Confirmar en Supabase que no quede ninguna propiedad publicada que ya no
      esté a la venta (`publicada = false` o `vendido = true`).
