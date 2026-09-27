import { useEffect, useRef, useState } from 'react'
import { Menu } from 'lucide-react'

/* ============================================================
   MAPA INTERACTIVO DE VILLA GENERAL BELGRANO
   ------------------------------------------------------------
   Ambas imágenes cubren exactamente el mismo recuadro geográfico
   (mismo bbox) de Villa General Belgrano, Córdoba. Así, al mover
   el cursor, el spotlight "pela" la vista satelital (BG_IMAGE_1)
   y deja ver el mapa de calles con nombres debajo (BG_IMAGE_2).

   Servicio: ArcGIS Online (público, sin API key).
   bbox = lon_min, lat_min, lon_max, lat_max  (EPSG:4326)
   Centro ≈ -31.9772, -64.5566
   ============================================================ */
const VGB_BBOX = '-64.5731,-31.9912,-64.5401,-31.9632'
const ESRI = (service: string) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/export` +
  `?bbox=${VGB_BBOX}&bboxSR=4326&imageSR=4326&size=1280,1280&format=png&transparent=false&f=image`

// Imagen base (superficie): vista satelital de VGB
const BG_IMAGE_1 = ESRI('World_Imagery')
// Imagen revelada (debajo): mapa de calles con nombres de VGB
const BG_IMAGE_2 = ESRI('World_Street_Map')

const SPOTLIGHT_R = 260

/* ------------------------------------------------------------
   Capa de revelado: máscara circular suave dibujada en canvas
   ------------------------------------------------------------ */
function RevealLayer({
  image,
  cursorX,
  cursorY,
}: {
  image: string
  cursorX: number
  cursorY: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const divRef = useRef<HTMLDivElement>(null)

  // Ajustar el canvas al tamaño de la ventana (montaje + resize)
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current
      if (!c) return
      c.width = window.innerWidth
      c.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // En cada render: reconstruir el gradiente radial y aplicarlo como máscara
  useEffect(() => {
    const c = canvasRef.current
    const div = divRef.current
    if (!c || !div) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, c.width, c.height)

    const g = ctx.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, SPOTLIGHT_R)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.4, 'rgba(255,255,255,1)')
    g.addColorStop(0.6, 'rgba(255,255,255,0.75)')
    g.addColorStop(0.75, 'rgba(255,255,255,0.4)')
    g.addColorStop(0.88, 'rgba(255,255,255,0.12)')
    g.addColorStop(1, 'rgba(255,255,255,0)')

    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cursorX, cursorY, SPOTLIGHT_R, 0, Math.PI * 2)
    ctx.fill()

    const url = c.toDataURL()
    // setProperty evita problemas de tipado con las variantes -webkit-
    div.style.setProperty('-webkit-mask-image', `url(${url})`)
    div.style.setProperty('mask-image', `url(${url})`)
    div.style.setProperty('-webkit-mask-size', '100% 100%')
    div.style.setProperty('mask-size', '100% 100%')
    div.style.setProperty('-webkit-mask-repeat', 'no-repeat')
    div.style.setProperty('mask-repeat', 'no-repeat')
  }, [cursorX, cursorY, image])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ display: 'none' }}
      />
      <div
        ref={divRef}
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none"
        style={{ backgroundImage: `url("${image}")` }}
      />
    </>
  )
}

export default function App() {
  // Seguimiento del mouse con suavizado (lerp)
  const mouse = useRef({ x: -999, y: -999 })
  const smooth = useRef({ x: -999, y: -999 })
  const rafRef = useRef<number>()
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
    }
    window.addEventListener('mousemove', onMove)

    const loop = () => {
      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1
      setCursorPos({ x: smooth.current.x, y: smooth.current.y })
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      className="min-h-screen bg-white tracking-[-0.02em]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ---------------- Navegación fija ---------------- */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5">
        {/* Izquierda: logo + wordmark */}
        <div className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 256 256" fill="#ffffff">
            <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
          </svg>
          <span className="text-white text-2xl font-playfair italic">Lithos</span>
        </div>

        {/* Centro: pill de navegación (solo desktop) */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-2 py-2 items-center gap-1">
          <button className="text-white px-4 py-1.5 rounded-full text-sm font-medium">
            Course
          </button>
          {['Field Guides', 'Geology', 'Plans', 'Live Tour'].map((item) => (
            <button
              key={item}
              className="text-white/80 hover:bg-white/20 hover:text-white transition-colors px-4 py-1.5 rounded-full text-sm font-medium"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Derecha: Sign Up (desktop) + hamburguesa (mobile) */}
        <div className="flex items-center">
          <button className="hidden md:block bg-white text-gray-900 text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100">
            Sign Up
          </button>
          <button className="md:hidden text-white p-1" aria-label="Abrir menú">
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* ---------------- Hero ---------------- */}
      <section
        className="relative w-full overflow-hidden h-screen bg-black"
        style={{ height: '100dvh' }}
      >
        {/* 1) Imagen base (satelital) — z-10, con zoom Ken Burns */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom"
          style={{ backgroundImage: `url("${BG_IMAGE_1}")` }}
        />

        {/* 2) Capa de revelado (mapa de calles) — z-30 */}
        <RevealLayer image={BG_IMAGE_2} cursorX={cursorPos.x} cursorY={cursorPos.y} />

        {/* 3) Encabezado — z-50 */}
        <div className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50">
          <h1 className="text-white leading-[0.95]">
            <span
              className="block font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal"
              style={{ letterSpacing: '-0.05em', animationDelay: '0.25s' }}
            >
              Layers hold
            </span>
            <span
              className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal"
              style={{ letterSpacing: '-0.08em', animationDelay: '0.42s' }}
            >
              tales of time
            </span>
          </h1>
        </div>

        {/* 4) Párrafo inferior izquierdo — z-50 */}
        <div
          className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[260px] z-50 hero-anim hero-fade"
          style={{ animationDelay: '0.7s' }}
        >
          <p className="text-sm text-white/80 leading-relaxed">
            Every layer of sediment records a chapter of our planet, from ancient seabeds to
            drifting ash, layered across millions of years beneath us.
          </p>
        </div>

        {/* 5) Bloque inferior derecho — z-50 */}
        <div
          className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px] flex flex-col items-start gap-4 sm:gap-5 z-50 hero-anim hero-fade"
          style={{ animationDelay: '0.85s' }}
        >
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Our interactive maps let you peel back the crust to trace how stones, fossils, and deep
            time combine to shape the ground beneath your feet.
          </p>
          <button className="bg-[#e8702a] hover:bg-[#d2611f] text-white text-sm font-medium px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#e8702a]/30">
            Start Digging
          </button>
        </div>

        {/* Atribución del mapa (requerida por el proveedor) */}
        <div className="absolute bottom-1 right-2 z-50 text-[10px] text-white/40 pointer-events-none">
          Villa General Belgrano · Map: Esri
        </div>
      </section>
    </div>
  )
}
