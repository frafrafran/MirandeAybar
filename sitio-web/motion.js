/* ============================================================
   MIRANDE AYBAR — Animaciones de scroll (GSAP)
   Progresivo: si GSAP no carga o el usuario pide "reducir
   movimiento", el sitio se ve completo igual (sin animación).
   ============================================================ */
(function () {
  const body = document.body;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);

  /* ---- Count-up de números (funciona con o sin GSAP) ---- */
  function countUp(el) {
    const target = parseFloat(el.getAttribute('data-count')) || 0;
    const dur = 1500, start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toString();
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toString();
    }
    requestAnimationFrame(tick);
  }
  function observeCounts() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-count]').forEach(el => el.textContent = el.getAttribute('data-count'));
      return;
    }
    const io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { countUp(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    document.querySelectorAll('[data-count]').forEach(el => io.observe(el));
  }

  /* ---- FALLBACK: sin GSAP o con reduce-motion ---- */
  if (!hasGSAP || reduce) {
    document.querySelectorAll('[data-anim]').forEach(el => { el.style.transform = 'none'; });
    body.classList.remove('pre-anim');
    observeCounts();
    return;
  }

  /* ============================================================
     GSAP disponible
     ============================================================ */
  gsap.registerPlugin(ScrollTrigger);

  // Convertir el estado oculto (CSS .pre-anim) a control de GSAP sin parpadeo
  gsap.utils.toArray('[data-anim]').forEach(el => {
    gsap.set(el, { yPercent: el.closest('.hero') ? 112 : 105 });
  });
  body.classList.remove('pre-anim');

  // HERO: reveal de líneas al cargar
  gsap.to('.hero [data-anim]', { yPercent: 0, duration: 1.15, ease: 'power4.out', stagger: 0.12, delay: 0.15 });

  // MANIFIESTO: reveal línea por línea
  gsap.utils.toArray('.man-line [data-anim]').forEach(el => {
    gsap.to(el, { yPercent: 0, duration: 1.1, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  // Parallax de imágenes (nosotros + banda CTA)
  const aboutImg = document.querySelector('.about-media img');
  if (aboutImg) gsap.fromTo(aboutImg, { yPercent: -8 }, { yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: '.about-media', start: 'top bottom', end: 'bottom top', scrub: true } });
  const ctaBg = document.querySelector('.cta-band .bg');
  if (ctaBg) gsap.fromTo(ctaBg, { yPercent: -12 }, { yPercent: 12, ease: 'none',
    scrollTrigger: { trigger: '.cta-band', start: 'top bottom', end: 'bottom top', scrub: true } });

  // (El showcase 3D de la portada se maneja aparte, sin depender de GSAP — ver abajo)

  // GALERÍA horizontal pinned (solo desktop; en mobile queda scroll nativo)
  const panSection = document.querySelector('[data-pan]');
  const panTrack = document.getElementById('panTrack');
  if (panSection && panTrack && window.innerWidth > 900) {
    panSection.classList.add('is-pinned');
    const distance = () => Math.max(0, panTrack.scrollWidth - window.innerWidth + 80);
    gsap.to(panTrack, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: panSection,
        start: 'top top',
        end: () => '+=' + distance(),
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });
  }

  // Count-up
  observeCounts();

  // Botones magnéticos (solo dispositivos con hover real)
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.magnetic').forEach(btn => {
      const S = 16;
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const mx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        const my = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        gsap.to(btn, { x: mx * S, y: my * S, duration: 0.4, ease: 'power3.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  // Recalcular medidas cuando cargan imágenes (galería)
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();

/* ============================================================
   SHOWCASE 3D de la portada — SIN dependencias (funciona siempre,
   aunque GSAP no cargue o no haya internet).
   La tarjeta arranca inclinada en 3D y se endereza + escala a
   medida que entra en pantalla; el título sube un poco.
   ============================================================ */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cs = document.querySelector('.cscroll');
  if (!cs) return;
  const card = cs.querySelector('.cscroll-card');
  const title = cs.querySelector('.cscroll-title');
  if (!card) return;

  // Respeta "reducir movimiento": muestra la tarjeta plana, sin animar.
  if (reduce) { card.style.transform = 'none'; return; }

  let ticking = false;
  function update() {
    ticking = false;
    const r = cs.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // progreso 0 → 1 mientras la sección sube por la pantalla
    const startY = vh * 0.90, endY = vh * 0.30;
    let p = (startY - r.top) / (startY - endY);
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    const mob = window.innerWidth <= 768;
    const rot = (18 * (1 - p)).toFixed(2);
    const scl = (mob ? (0.92 + 0.08 * p) : (1.05 - 0.05 * p)).toFixed(3);
    card.style.transform = 'rotateX(' + rot + 'deg) scale(' + scl + ')';
    if (title) title.style.transform = 'translateY(' + (-40 * p).toFixed(1) + 'px)';
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('load', update);
  update();
})();

/* ============================================================
   HERO SPOTLIGHT — SIN dependencias.
   Al mover el cursor, se revela la segunda imagen (vista aérea del
   pueblo) a través de un círculo suave sobre la imagen base (sierras).
   La máscara se dibuja en un canvas oculto y se aplica al reveal.
   ============================================================ */
(function () {
  const reveal = document.getElementById('heroReveal');
  const canvas = document.getElementById('heroCanvas');
  if (!reveal || !canvas) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const R = 260;
  let W = 0, H = 0;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const mouse = { x: -999, y: -999 }, smooth = { x: -999, y: -999 };
  window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  window.addEventListener('touchmove', function (e) { if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; } }, { passive: true });

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(smooth.x, smooth.y, 0, smooth.x, smooth.y, R);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,1)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.75)');
    g.addColorStop(0.75, 'rgba(255,255,255,0.4)');
    g.addColorStop(0.88, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(smooth.x, smooth.y, R, 0, Math.PI * 2);
    ctx.fill();
    const url = canvas.toDataURL();
    reveal.style.webkitMaskImage = 'url(' + url + ')';
    reveal.style.maskImage = 'url(' + url + ')';
    reveal.style.webkitMaskSize = '100% 100%';
    reveal.style.maskSize = '100% 100%';
    reveal.style.webkitMaskRepeat = 'no-repeat';
    reveal.style.maskRepeat = 'no-repeat';
  }
  function loop() {
    smooth.x += (mouse.x - smooth.x) * 0.1;
    smooth.y += (mouse.y - smooth.y) * 0.1;
    draw();
    requestAnimationFrame(loop);
  }
  if (reduce) {
    reveal.style.opacity = '0';  // sin animación: se ve solo la imagen base
  } else {
    requestAnimationFrame(loop);
  }
})();

/* ============================================================
   GALERÍA "El valle en detalle" — pasarela + ampliar al mantener
   presionado (clic sostenido en desktop, dedo apoyado en mobile).
   ============================================================ */
(function () {
  const track = document.getElementById('panTrack');
  if (!track) return;
  let active = null;

  function expand(panel) {
    active = panel;
    track.classList.add('paused', 'holding');
    panel.classList.add('expanded');
  }
  function reset() {
    if (active) { active.classList.remove('expanded'); active = null; }
    track.classList.remove('paused', 'holding');
  }

  track.querySelectorAll('.panel').forEach(function (p) {
    p.addEventListener('pointerdown', function () { expand(p); });
    // si el puntero entra en otra imagen mientras se mantiene presionado, cambia el foco
    p.addEventListener('pointerenter', function (e) {
      if (active && e.pressure > 0) { active.classList.remove('expanded'); expand(p); }
    });
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
    window.addEventListener(ev, reset);
  });
  // Evita el menú de "guardar imagen" al mantener presionado en el celular
  track.addEventListener('contextmenu', function (e) { e.preventDefault(); });
})();

/* ============================================================
   NOSOTROS — scroll "sticky": la imagen queda fija y se resalta
   cada capítulo a medida que pasa por el centro de la pantalla,
   cambiando la imagen de fondo. CSS position:sticky + IO.
   ============================================================ */
(function () {
  const steps = document.querySelectorAll('.sa-step');
  const imgs = document.querySelectorAll('.sa-img');
  if (!steps.length || !('IntersectionObserver' in window)) return;

  function setActive(idx) {
    steps.forEach(function (s) { s.classList.toggle('active', s.dataset.idx === String(idx)); });
    imgs.forEach(function (im) { im.classList.toggle('active', im.dataset.idx === String(idx)); });
  }
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) setActive(e.target.dataset.idx);
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  steps.forEach(function (s) { io.observe(s); });
})();


