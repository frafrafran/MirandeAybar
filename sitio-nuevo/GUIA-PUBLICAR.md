# Publicar el sitio en internet

De la carpeta a `mirandeaybar.com.ar`, gratis, sin servidor propio.

---

## Antes de subir: tres cosas

### 1. Comprimir el video (importante)

`assets/video/valle-aereo.mp4` pesa **8,2 MB**. En una conexión móvil del valle
eso son varios segundos de espera. Si tenés ffmpeg:

```bash
ffmpeg -i assets/video/valle-aereo.mp4 -vf scale=1280:-2 -c:v libx264 -crf 30 -preset slow -an -movflags +faststart assets/video/valle-aereo-web.mp4
```

Queda en ~1,5 MB y en pantalla no se nota (va de fondo, con encima un velo
oscuro). El `-an` saca el audio, que no se usa, y `+faststart` hace que empiece
a reproducirse antes de terminar de bajar.

Después cambiá en `index.html`:

```html
<source src="assets/video/valle-aereo-web.mp4" type="video/mp4" />
```

Si no tenés ffmpeg, subilo igual y dejalo para después. No rompe nada.

### 2. Reemplazar el video por uno tuyo

Ese clip es de [Pexels](https://www.pexels.com/video/aerial-view-of-a-village-surrounded-by-green-mountains-15543358/)
(autor: 小鱼 五, licencia libre para uso comercial). Es un pueblo de montaña
genérico, **no es Villa General Belgrano**.

Sirve como ambiente, pero un dron sobre el valle de verdad vale muchísimo más
para vender propiedades acá. Cuando lo tengas, guardalo como
`assets/video/valle-aereo.mp4` y listo, no hay que tocar código.

### 3. Revisar los datos

Abrí `index.html` y confirmá que estén bien: teléfono, email, dirección,
Instagram, TikTok, y las cinco propiedades con sus precios.


### 4. Achicar las fotos del valle

La cinta infinita de "Un valle que se despliega" pinta 32 imágenes en pantalla
(2 filas × 2 copias × 8 lugares). Son sólo 8 archivos distintos, pero cada uno
pesa entre 1080 y 2048 px de ancho y se muestra a 250 px. El navegador
igual decodifica el original, y eso gasta memoria al pedo en celulares.

Si tenés ImageMagick:

```bash
mogrify -path assets/fotos -resize 720x -quality 82 assets/fotos/*.jpg
```

720 px de ancho alcanza y sobra para el tamaño en que se ven. No hace falta
tocar nada del código: mismos nombres de archivo.

---

## Opción A — Netlify Drop (la más rápida)

**No necesita cuenta para probar, ni instalar nada.**

1. Entrá a **https://app.netlify.com/drop**
2. Arrastrá la carpeta `mirandeaybar` entera a la ventana
3. En unos segundos te da una dirección tipo `random-name-123.netlify.app`

Ya está publicado. Para que no venza y poder cambiarle el nombre, creá una
cuenta gratis (con el Gmail de la inmobiliaria) y hacé *Claim this site*.

Para cambiar el nombre: **Site configuration → Change site name** →
`mirandeaybar` → queda `mirandeaybar.netlify.app`.

**Para actualizar el sitio más adelante:** volvés a arrastrar la carpeta sobre
*Deploys*. Reemplaza todo.

## Opción B — Netlify con GitHub (recomendada a la larga)

Con esto, cada cambio que guardás se publica solo.

1. Creá cuenta en **github.com**
2. Instalá **GitHub Desktop** (desktop.github.com)
3. *File → Add local repository* → elegí la carpeta `mirandeaybar`
4. *Publish repository* (podés dejarlo privado)
5. En Netlify: **Add new site → Import an existing project → GitHub** → elegí el
   repo. Dejá vacíos *build command* y *publish directory* (no hay build).
6. Cada vez que cambies algo: en GitHub Desktop escribís qué cambiaste,
   *Commit* y *Push*. Netlify lo publica solo en ~30 segundos.

## Opción C — Cloudflare Pages

Igual de gratis y con muy buena velocidad desde Argentina.

1. Cuenta en **dash.cloudflare.com**
2. **Workers & Pages → Create → Pages → Upload assets**
3. Arrastrás la carpeta

---

## El dominio propio

### Comprarlo

Para un `.com.ar` se compra en **nic.ar** (necesitás CUIT y Clave Fiscal de
AFIP). Sale muy poco por año.

Para un `.com` sirve cualquier registrador: Namecheap, Cloudflare Registrar,
Google Domains.

### Conectarlo a Netlify

1. En Netlify: **Domain management → Add a domain** → escribís tu dominio
2. Netlify te muestra qué configurar. En el panel de nic.ar (o tu registrador),
   en la sección de DNS, cargás:

| Tipo | Nombre | Valor |
|---|---|---|
| `A` | `@` | `75.2.60.5` |
| `CNAME` | `www` | `tu-sitio.netlify.app` |

3. Esperás. Puede tardar de 20 minutos a 24 horas.
4. El certificado HTTPS lo emite Netlify solo, gratis. No hay que hacer nada.

> Netlify puede cambiar esa IP. Usá siempre la que te muestre el panel, no la de
> esta tabla, si difieren.

---

## Después de publicar

### Que Google lo encuentre

1. Entrá a **search.google.com/search-console**
2. Agregá tu dominio y verificá (Netlify permite verificar por DNS)
3. *Sitemaps* → mandá `https://tudominio.com/sitemap.xml`

Creá `sitemap.xml` en la carpeta:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://TUDOMINIO/</loc><priority>1.0</priority></url>
</urlset>
```

Y `robots.txt`:

```
User-agent: *
Allow: /
Sitemap: https://TUDOMINIO/sitemap.xml
```

### Google Business (esto mueve más la aguja que el SEO)

Para una inmobiliaria local, **Google Business Profile** rinde más que
cualquier otra cosa: aparecés en el mapa cuando alguien busca
"inmobiliaria Villa General Belgrano".

**business.google.com** → cargá la dirección de Paseo Los Troncos, el teléfono,
el horario, fotos, y el link al sitio nuevo.

### Compartir por WhatsApp

Para que al pegar el link salga una tarjeta con imagen, agregá en el `<head>` de
`index.html`:

```html
<meta property="og:title" content="Mirande Aybar — Inmobiliaria en Villa General Belgrano" />
<meta property="og:description" content="Casas, campos y terrenos en el Valle de Calamuchita. Más de 15 años en la región." />
<meta property="og:image" content="https://TUDOMINIO/assets/fotos/champaqui.jpg" />
<meta property="og:url" content="https://TUDOMINIO/" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

La URL de `og:image` tiene que ser **completa** (con `https://` y el dominio),
no relativa. Es el error más común.

---

## Repaso antes de publicar

- [ ] Video comprimido (o asumido el peso)
- [ ] Teléfono, email y dirección revisados
- [ ] Links de Instagram y TikTok correctos
- [ ] Etiquetas `og:` con el dominio real
- [ ] `sitemap.xml` y `robots.txt` con el dominio real
- [ ] Probado en el celular
- [ ] Probado el botón de WhatsApp desde el celular
- [ ] Si conectaste Supabase: RLS activo y verificado (ver `GUIA-SUPABASE.md`)

## Qué NO subir

Si en algún momento agregás claves que no sean la `anon` de Supabase (por
ejemplo la `service_role`), **nunca** van en estos archivos: todo lo que está en
la carpeta es público y cualquiera lo puede leer desde el navegador.
