# Lithos · Hero con mapa interactivo de Villa General Belgrano

Hero a pantalla completa (React 18 + TypeScript + Vite + Tailwind + lucide-react)
con el efecto estrella: un **spotlight que sigue el cursor** y revela, a través de
una máscara circular suave, una **segunda imagen** sobre la base.

En esta versión, el reveal es un **mapa de Villa General Belgrano**:
- **Capa base:** vista **satelital** de la ciudad.
- **Capa revelada (bajo el spotlight):** **mapa de calles** con nombres.

Al mover el mouse "pelás la superficie" y ves las calles debajo.

## Cómo ejecutarlo

Necesitás Node.js 18+ instalado. En una terminal, dentro de esta carpeta:

```bash
npm install     # instala dependencias
npm run dev     # abre el sitio en http://localhost:5173
```

Para generar la versión de producción:

```bash
npm run build   # verifica tipos (tsc) y compila a /dist
npm run preview # previsualiza el build
```

> Nota: el proyecto se entregó sin la carpeta `node_modules`. El paso
> `npm install` la crea automáticamente (requiere conexión a internet).

## Dónde está el código

- `src/App.tsx` — todo el hero: navegación, encabezado, textos, botón, y el
  componente `RevealLayer` que dibuja la máscara del spotlight en un `<canvas>`.
- `src/index.css` — fuentes (Inter + Playfair Display) y animaciones de entrada.

## Cambiar la zona del mapa

En `src/App.tsx`, arriba de todo, está `VGB_BBOX` (el recuadro geográfico en
formato `lon_min,lat_min,lon_max,lat_max`). Cambiá esos valores para mostrar otra
zona o acercar/alejar. Las dos capas usan el mismo bbox para quedar alineadas.

Si preferís invertir el efecto (base = calles, reveal = satelital), intercambiá
`BG_IMAGE_1` y `BG_IMAGE_2`.

Los mapas provienen de **ArcGIS Online (Esri)**, servicios públicos sin API key.
