/* ============================================================
   Mirande Aybar — motor de scroll con pines + amanecer sobre las sierras
   Vanilla. Sin dependencias. Raymarcher en GLSL ES 1.00.
   ============================================================ */
(function () {
  'use strict';

  var WA = '5493512729721';
  var MAIL = 'mirandeaybar@gmail.com';

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var REDUCE = mqReduce.matches;
  mqReduce.addEventListener('change', function (e) { REDUCE = e.matches; });

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var vh = window.innerHeight, vw = window.innerWidth;

  /* progreso 0..1 a lo largo de un track con pin */
  function trackProgress(track) {
    var r = track.getBoundingClientRect();
    var travel = r.height - vh;
    if (travel <= 0) return r.top <= 0 ? 1 : 0;
    return clamp(-r.top / travel, 0, 1);
  }

  /* ---------------------------------------------------------
     1. Reveals — se ocultan solo si el JS puede mostrarlos
     --------------------------------------------------------- */
  document.documentElement.classList.add('js');

  var reveals = $$('.reveal');
  reveals.forEach(function (el) {
    var d = el.getAttribute('data-d');
    if (d) el.style.setProperty('--d', d);
  });

  function showReveal(el) {
    if (el.classList.contains('is-in')) return;
    el.classList.add('is-in');
    revealIO.unobserve(el);
    var c = $$('[data-count]', el);
    if (el.hasAttribute('data-count')) c.push(el);
    c.forEach(runCounter);
  }

  var revealIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) showReveal(e.target); });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  reveals.forEach(function (el) { revealIO.observe(el); });

  window.setTimeout(function () {
    reveals.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) showReveal(el);
    });
  }, 1600);

  function runCounter(el) {
    if (el._done) return;
    el._done = true;
    var t = parseFloat(el.getAttribute('data-count'));
    if (isNaN(t)) return;
    var pre = el.getAttribute('data-pre') || '', post = el.getAttribute('data-post') || '';
    var raw = el.getAttribute('data-count'), dot = raw.indexOf('.');
    var dec = dot === -1 ? 0 : raw.length - dot - 1;
    if (REDUCE) { el.textContent = pre + t.toFixed(dec) + post; return; }
    var t0 = performance.now();
    (function step(now) {
      var p = clamp((now - t0) / 1500, 0, 1);
      el.textContent = pre + (t * (1 - Math.pow(1 - p, 3))).toFixed(dec) + post;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------------------------------------------------------
     2. Nav
     --------------------------------------------------------- */
  var nav = $('#nav'), burger = $('#burger'), drawer = $('#drawer');
  var darkZones = $$('.pin--dark, .band--dark, .sheet, .track--reveal .pin');

  burger.addEventListener('click', function () {
    var open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    burger.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú');
    drawer.hidden = open;
    document.body.style.overflow = open ? '' : 'hidden';
  });
  $$('a', drawer).forEach(function (a) {
    a.addEventListener('click', function () {
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Abrir menú');
      drawer.hidden = true;
      document.body.style.overflow = '';
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !drawer.hidden) burger.click();
  });

  var navLinks = $$('.nav__links a');
  var secIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      navLinks.forEach(function (a) {
        a.classList.toggle('is-on', a.getAttribute('href') === '#' + e.target.id);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['propiedades', 'servicios', 'valle', 'equipo'].forEach(function (id) {
    var s = document.getElementById(id);
    if (s) secIO.observe(s);
  });

  /* ---------------------------------------------------------
     3. Manifiesto — revelado palabra por palabra
     --------------------------------------------------------- */
  var thesisTrack = $('[data-track="thesis"]'), thesisFrame = $('#thesisFrame');
  var wordEls = [];
  (function () {
    var host = $('#thesisWords');
    if (!host) return;
    var words = host.textContent.trim().split(/\s+/);
    var frag = document.createDocumentFragment();
    words.forEach(function (w, i) {
      var s = document.createElement('span');
      s.textContent = w;
      frag.appendChild(s);
      if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
      wordEls.push(s);
    });
    host.textContent = '';
    host.appendChild(frag);
  })();

  function updateThesis() {
    if (!thesisTrack) return;
    var p = trackProgress(thesisTrack);
    if (thesisFrame) {
      thesisFrame.style.transform =
        'translate3d(0,' + lerp(48, -48, p).toFixed(1) + 'px,0) scale(' + lerp(0.8, 1.15, p).toFixed(3) + ')';
    }
    if (REDUCE) return;
    var lit = (p - 0.04) / 0.62, n = wordEls.length;
    for (var i = 0; i < n; i++) wordEls[i].classList.toggle('is-lit', lit > (i + 1) / (n + 2));
  }

  /* ---------------------------------------------------------
     4. Servicios — caras girando en X
     --------------------------------------------------------- */
  var servTrack = $('[data-track="serv"]');
  var faces = $$('#stage .face');
  var servBars = $$('.serv__rail i');

  function updateServ() {
    if (!servTrack || !faces.length || REDUCE) return;
    var p = trackProgress(servTrack), n = faces.length;
    for (var i = 0; i < n; i++) {
      /* centradas en p = i/(n-1): la primera ya está de frente cuando el pin
         engancha y la última cuando se suelta. Nunca hay pantalla vacía. */
      var d = p * (n - 1) - i;
      var r = clamp(d, -1, 1);
      var e = (r < 0 ? -1 : 1) * Math.pow(Math.abs(r), 1.7);
      var op = clamp(1 - Math.abs(e) * 1.45, 0, 1);
      faces[i].style.transform = 'rotateX(' + (-e * 90).toFixed(2) + 'deg)';
      faces[i].style.opacity = op.toFixed(3);
      faces[i].style.visibility = op < 0.02 ? 'hidden' : 'visible';
      if (servBars[i]) servBars[i].style.setProperty('--p', clamp(d + 1, 0, 1).toFixed(3));
    }
  }

  /* ---------------------------------------------------------
     6. El valle se abre — port de ScrollExpandMedia

     El original engancha wheel/touch en window con preventDefault y
     hace scrollTo(0,0) en cada scroll. Eso sirve cuando el componente
     ES la pagina entera; aca es una seccion en el medio, asi que el
     progreso sale del track con pin: mismo efecto, sin secuestrar el
     scroll, y sigue andando con teclado, anclas y lectores de pantalla.
     --------------------------------------------------------- */
  var rvTrack = $('[data-track="reveal"]');
  var rvBg = $('#rvBg'), rvMedia = $('#rvMedia'), rvVideo = $('#rvVideo');
  var rvT1 = $('#rvT1'), rvT2 = $('#rvT2'), rvMeta = $('.rv__meta');
  var rvTint = $('#rvTint'), rvFoot = $('#rvFoot');

  /* El video pesa 8,2 MB. Quien navega con "ahorro de datos" activado o con
     una conexion lenta no deberia pagar eso sin haberlo pedido: en ese caso
     queda el poster, que es una foto del mismo valle y pesa 230 KB. La
     seccion se ve igual, solo que quieta.
     rvVideo se anula a proposito: todos los usos posteriores lo consultan
     con if (rvVideo), asi que la animacion simplemente no lo toca. */
  var conex = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var ahorrarDatos = !!(conex && (conex.saveData ||
      /^(2g|3g|slow-2g)$/.test(conex.effectiveType || '')));
  if (rvVideo && ahorrarDatos) {
    rvVideo.preload = 'none';
    var fuente = rvVideo.querySelector('source');
    if (fuente) fuente.removeAttribute('src');
    rvVideo = null;
  }

  /* el video solo se descarga y reproduce cuando la seccion esta cerca */
  if (rvVideo) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          if (rvVideo.preload !== 'auto') rvVideo.preload = 'auto';
          var pr = rvVideo.play();
          if (pr && pr.catch) pr.catch(function () { /* autoplay bloqueado: queda el poster */ });
        } else if (!rvVideo.paused) {
          rvVideo.pause();
        }
      });
    }, { rootMargin: '200px 0px' }).observe(rvTrack || rvVideo);
  }

  function updateReveal() {
    if (!rvTrack || !rvMedia) return;
    if (REDUCE) return;
    var p = trackProgress(rvTrack);
    /* arranca lento y abre rapido al final, como el original */
    var e = p * p * (3 - 2 * p);

    var w = vw, h = vh;
    var mob = w < 768;
    var w0 = Math.min(300, w * 0.78), h0 = Math.min(400, h * 0.46);
    var w1 = Math.min(w * 0.96, mob ? 940 : 1560);
    var h1 = Math.min(h * 0.86, mob ? 640 : 840);
    var cw = w0 + (w1 - w0) * e, chh = h0 + (h1 - h0) * e;
    var ix = Math.max(0, (w - cw) / 2), iy = Math.max(0, (h - chh) / 2);

    rvMedia.style.clipPath = 'inset(' + iy.toFixed(1) + 'px ' + ix.toFixed(1) + 'px round ' +
      (18 * (1 - e * 0.55)).toFixed(1) + 'px)';
    if (rvVideo) rvVideo.style.transform = 'scale(' + (1.06 - e * 0.06).toFixed(3) + ')';
    if (rvBg) rvBg.style.opacity = (1 - e * 0.92).toFixed(3);
    if (rvTint) rvTint.style.opacity = (0.45 - e * 0.28).toFixed(3);

    /* el titulo se parte y sale de cuadro */
    var tx = e * (mob ? 72 : 58);
    rvT1.style.transform = 'translate3d(-' + tx.toFixed(2) + 'vw,0,0)';
    rvT2.style.transform = 'translate3d(' + tx.toFixed(2) + 'vw,0,0)';
    if (rvMeta) rvMeta.style.opacity = clamp(1 - (p - 0.42) / 0.28, 0, 1).toFixed(3);

    /* Al reves que el titulo: mientras la marca sale de cuadro, entran los
       botones y los numeros. Empiezan a aparecer cuando el video ya se abrio
       lo suficiente como para que se lean sobre el. */
    if (rvFoot) {
      var f = clamp((p - 0.5) / 0.26, 0, 1);
      rvFoot.style.opacity = f.toFixed(3);
      rvFoot.style.transform = 'translate3d(0,' + ((1 - f) * 26).toFixed(1) + 'px,0)';
      rvFoot.style.pointerEvents = f > 0.55 ? 'auto' : 'none';
    }
  }

  /* ---------------------------------------------------------
     7. El valle — cinta infinita (port de InfiniteSlider)

     El original duplica {children}{children} en React y anima una
     motion value con framer-motion. Aca el clon lo hace el JS y el
     movimiento lo hace CSS: una animacion sobre transform que compone
     la GPU y no gasta un solo cuadro de JS.

     La duracion sale del ancho medido para que la velocidad sea la
     misma en cualquier pantalla: con una duracion fija, un viewport
     ancho hace que la cinta vuele.
     --------------------------------------------------------- */
  (function cintaValle() {
    var sliders = $$('.slider');
    if (!sliders.length) return;
    var valle = $('#valle');
    var base = sliders[0].querySelector('.slider__set');
    if (!base) return;

    /* deja una copia decorativa: el lector de pantalla ya leyo la fila real */
    function clonar(set) {
      var c = set.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      $$('img', c).forEach(function (im) { im.setAttribute('alt', ''); });
      $$('a,button', c).forEach(function (el) { el.setAttribute('tabindex', '-1'); });
      return c;
    }

    /* la segunda fila es puro adorno: mismos lugares, sentido inverso */
    var fila2 = sliders[1] && sliders[1].querySelector('.slider__track');
    if (fila2 && !fila2.children.length) fila2.appendChild(clonar(base));

    /* cada fila necesita su propia copia para que el bucle no tenga costura */
    sliders.forEach(function (sl) {
      var track = sl.querySelector('.slider__track');
      var set = track.querySelector('.slider__set');
      if (set && track.children.length < 2) track.appendChild(clonar(set));
    });

    function medir() {
      sliders.forEach(function (sl) {
        var set = sl.querySelector('.slider__set');
        if (!set) return;
        var ancho = set.getBoundingClientRect().width;
        if (ancho < 50) return;                       /* aun sin layout */
        var v = parseFloat(sl.getAttribute('data-speed')) || 42;
        sl.style.setProperty('--dur', (ancho / v).toFixed(1) + 's');
      });
    }
    medir();
    if (window.ResizeObserver) new ResizeObserver(medir).observe(sliders[0]);
    window.addEventListener('resize', medir);
    window.addEventListener('load', medir);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
    [150, 700, 1800].forEach(function (ms) { window.setTimeout(medir, ms); });

    /* WCAG 2.2.2: todo movimiento de mas de 5 s tiene que poder detenerse */
    var btn = $('#vallePausa'), txt = $('#vallePausaTxt');
    if (btn) {
      btn.addEventListener('click', function () {
        var pausado = valle.classList.toggle('is-paused');
        btn.setAttribute('aria-pressed', String(pausado));
        if (txt) txt.textContent = pausado ? 'Reanudar' : 'Pausar';
      });
    }

    /* fuera de pantalla no se anima: no gasta compositor de gratis */
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        sliders.forEach(function (sl) {
          sl.querySelector('.slider__track').style.animationPlayState =
            es[0].isIntersecting ? '' : 'paused';
        });
      }, { rootMargin: '150px 0px' }).observe(valle);
    }
  })();

  /* ---------------------------------------------------------
     7b. Opiniones escalonadas — port de StaggerTestimonials

     El original le pone un tempId nuevo a la tarjeta que da la vuelta,
     asi que React la desmonta y la vuelve a montar: por eso esa salta
     sin animar mientras el resto se desliza. Aca se replica creando un
     nodo nuevo para esa tarjeta y reusando los demas.
     --------------------------------------------------------- */
  var RESENAS = [
    { ini: 'LR', nombre: 'Laura Rivarola', que: 'Compró una casa en Villa General Belgrano',
      texto: 'Nos acompañaron en todo el proceso con mucha paciencia. Encontramos la casa ideal para la familia.' },
    { ini: 'MG', nombre: 'Martín Gauna', que: 'Invirtió en un terreno en Los Reartes',
      texto: 'Muy profesionales y transparentes. Conocen la zona como nadie y me asesoraron muy bien para invertir.' },
    { ini: 'CP', nombre: 'Carolina Peralta', que: 'Vendió su casa en VGB',
      texto: 'Vendí mi propiedad en tiempo récord y al valor que esperaba. Siempre disponibles para responder mis dudas.' },
    { ini: 'DB', nombre: 'Diego Bustos', que: 'Compró un lote en Los Reartes',
      texto: 'Me avisaron que el lote que quería no tenía agua de red antes de que hiciera la oferta. Esa honestidad me ahorró un problema enorme.' },
    { ini: 'SB', nombre: 'Silvana Bertello', que: 'Alquiler temporario en VGB',
      texto: 'Administran mi cabaña hace dos temporadas. Ocupación llena en enero y yo sin mover un dedo.' },
    { ini: 'HQ', nombre: 'Hernán Quiroga', que: 'Vendió un campo en Santa Rosa',
      texto: 'Tasaron el campo con criterio, sin inflar el número para engancharme. Se vendió en cuatro meses.' },
    { ini: 'MO', nombre: 'Mariela Ocampo', que: 'Compró en La Cumbrecita',
      texto: 'Nos mostraron tres cabañas, no treinta. Las tres servían. Compramos la segunda.' },
    { ini: 'FL', nombre: 'Fabián Ludueña', que: 'Inversión en Villa Berna',
      texto: 'Llevo dos operaciones con ellos. La segunda ni la dudé.' },
    { ini: 'AS', nombre: 'Andrea Suárez', que: 'Compró casa en VGB',
      texto: 'Sebastián nos hizo recorrer el barrio un sábado a la mañana para que viéramos el movimiento real. Nadie hace eso.' },
    { ini: 'RM', nombre: 'Ricardo Maldonado', que: 'Vendió un departamento en VGB',
      texto: 'Mario se ocupó de toda la escritura. Yo firmé y listo, sin una sola vuelta al registro.' },
    { ini: 'VC', nombre: 'Verónica Cabral', que: 'Alquiler anual en VGB',
      texto: 'Buscaba alquiler anual, que acá es lo más difícil de conseguir. En tres semanas tenía las llaves.' },
    { ini: 'GF', nombre: 'Gustavo Ferreyra', que: 'Compró terreno en Villa Rumipal',
      texto: 'Conocen cada loteo del valle de memoria. Te dicen cuál tiene escritura y cuál viene con boleto.' }
  ];

  (function stagger() {
    var deck = $('#stgDeck');
    if (!deck) return;
    var live = $('#stgLive');
    var cardSize = 365;
    var lista = RESENAS.slice();
    var nodos = [];
    var mq = window.matchMedia('(min-width: 640px)');

    function medir() { cardSize = mq.matches ? 365 : 290; }

    function crear(d) {
      var el = document.createElement('article');
      el.className = 'stg__card';
      el.tabIndex = 0;
      el.innerHTML =
        '<span class="stg__edge" aria-hidden="true"></span>' +
        '<div class="stg__ph" aria-hidden="true">' + d.ini + '</div>' +
        '<h3 class="stg__quote">&ldquo;' + d.texto + '&rdquo;</h3>' +
        '<p class="stg__by">' + d.nombre + ', ' + d.que + '</p>';
      return el;
    }

    function colocar(animar) {
      var n = nodos.length;
      for (var i = 0; i < n; i++) {
        /* misma formula que el original */
        var pos = (n % 2) ? i - (n + 1) / 2 : i - n / 2;
        var centro = pos === 0;
        var el = nodos[i].el;

        if (!animar) el.style.transition = 'none';
        el.classList.toggle('is-center', centro);
        el.style.width = cardSize + 'px';
        el.style.height = cardSize + 'px';
        el.style.zIndex = centro ? 10 : 0;
        el.setAttribute('aria-hidden', centro ? 'false' : 'true');
        el.style.transform =
          'translate(-50%, -50%)' +
          ' translateX(' + ((cardSize / 1.5) * pos) + 'px)' +
          ' translateY(' + (centro ? -65 : (pos % 2 ? 15 : -15)) + 'px)' +
          ' rotate(' + (centro ? 0 : (pos % 2 ? 2.5 : -2.5)) + 'deg)';
        if (!animar) {
          void el.offsetWidth;           /* fuerza reflow antes de devolver la transicion */
          el.style.transition = '';
        }
      }
      var c = nodos[(n % 2) ? (n + 1) / 2 : n / 2];
      if (live && c) live.textContent = c.data.nombre + ': ' + c.data.texto;
    }

    function mover(pasos) {
      if (!pasos) return;
      var i;
      if (pasos > 0) {
        for (i = pasos; i > 0; i--) {
          var a = nodos.shift();
          if (!a) return;
          a.el.remove();
          var nuevoA = { data: a.data, el: crear(a.data) };
          deck.appendChild(nuevoA.el);
          nodos.push(nuevoA);
        }
      } else {
        for (i = pasos; i < 0; i++) {
          var b = nodos.pop();
          if (!b) return;
          b.el.remove();
          var nuevoB = { data: b.data, el: crear(b.data) };
          deck.insertBefore(nuevoB.el, deck.firstChild);
          nodos.unshift(nuevoB);
        }
      }
      colocar(true);
    }

    medir();
    lista.forEach(function (d) {
      var el = crear(d);
      deck.appendChild(el);
      nodos.push({ data: d, el: el });
    });
    colocar(false);

    deck.addEventListener('click', function (e) {
      var card = e.target.closest('.stg__card');
      if (!card) return;
      var idx = nodos.findIndex(function (x) { return x.el === card; });
      if (idx === -1) return;
      var n = nodos.length;
      mover((n % 2) ? idx - (n + 1) / 2 : idx - n / 2);
    });
    deck.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.stg__card');
      if (!card) return;
      e.preventDefault();
      card.click();
    });

    $('#stgPrev').addEventListener('click', function () { mover(-1); });
    $('#stgNext').addEventListener('click', function () { mover(1); });
    $('#stg').addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); mover(1); }
    });

    /* remedir: el evento 'resize' no alcanza. Si el primer layout llega
       trabado (pestaña de fondo, panel oculto), medir() se queda con el
       tamaño movil y nunca se corrige. matchMedia avisa del cambio real
       de breakpoint, y los timers cubren el layout inicial demorado. */
    function remedir() {
      var antes = cardSize;
      medir();
      if (antes !== cardSize) colocar(false);
    }
    if (mq.addEventListener) mq.addEventListener('change', remedir);
    else if (mq.addListener) mq.addListener(remedir);
    window.addEventListener('resize', remedir);
    window.addEventListener('load', remedir);
    [120, 600, 1600].forEach(function (ms) { window.setTimeout(remedir, ms); });
  })();

  /* ---------------------------------------------------------
     8. Formulario → WhatsApp / Email (real, no simulado)
     --------------------------------------------------------- */
  var form = $('#form');
  var RX_MAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function setErr(inputId, errId, msg) {
    var input = document.getElementById(inputId), err = document.getElementById(errId);
    var field = input.closest('.field');
    if (msg) {
      field.classList.add('is-bad');
      err.textContent = msg; err.hidden = false; err.setAttribute('role', 'alert');
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', errId);
    } else {
      field.classList.remove('is-bad');
      err.hidden = true; err.removeAttribute('role');
      input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby');
    }
    return !msg;
  }

  ['f-name', 'f-mail', 'f-msg'].forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener('input', function () {
      if (el.closest('.field').classList.contains('is-bad')) validate(false);
    });
  });

  function validate(focus) {
    var ok = [];
    ok.push(setErr('f-name', 'e-name', $('#f-name').value.trim().length >= 2 ? '' : 'Contanos tu nombre.'));
    ok.push(setErr('f-mail', 'e-mail', RX_MAIL.test($('#f-mail').value.trim()) ? '' : 'Ingresá un email válido.'));
    ok.push(setErr('f-msg', 'e-msg', $('#f-msg').value.trim().length >= 4 ? '' : 'Escribí tu mensaje.'));
    var bad = ok.indexOf(false);
    if (bad !== -1 && focus) {
      var first = $('.field.is-bad input, .field.is-bad textarea');
      if (first) first.focus();
    }
    return bad === -1;
  }

  function buildMessage() {
    var n = $('#f-name').value.trim(), m = $('#f-mail').value.trim();
    var t = $('#f-tel').value.trim(), q = $('#f-msg').value.trim();
    var lines = ['Hola Mirande Aybar!', '', 'Nombre: ' + n, 'Email: ' + m];
    if (t) lines.push('Teléfono: ' + t);
    lines.push('', q);
    return lines.join('\n');
  }

  function send(via, btn) {
    if (!validate(true)) return;
    var body = buildMessage();
    btn.classList.add('is-pending');
    window.setTimeout(function () {
      btn.classList.remove('is-pending');
      if (via === 'wa') {
        window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(body), '_blank', 'noopener');
      } else {
        window.location.href = 'mailto:' + MAIL +
          '?subject=' + encodeURIComponent('Consulta desde la web') +
          '&body=' + encodeURIComponent(body);
      }
    }, 420);
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); send('wa', $('#sendWa')); });
  $('#sendMail').addEventListener('click', function () { send('mail', $('#sendMail')); });

  /* ---------------------------------------------------------
     9. Bucle maestro
     --------------------------------------------------------- */
  function measure() { vh = window.innerHeight; vw = window.innerWidth; }
  measure();
  window.addEventListener('resize', measure);

  function frame(now) {
    var y = window.scrollY || window.pageYOffset;
    nav.classList.toggle('is-stuck', y > 24);

    var onDark = false;
    for (var i = 0; i < darkZones.length; i++) {
      var r = darkZones[i].getBoundingClientRect();
      if (r.top <= 46 && r.bottom >= 46) { onDark = true; break; }
    }
    nav.classList.toggle('on-dark', onDark);

    updateThesis();
    updateReveal();
    updateServ();

    requestAnimationFrame(frame);
  }

  /* El amanecer WebGL se fue con el hero, y con el la funcion que
     arrancaba este bucle. Ahora arranca aca. */
  requestAnimationFrame(frame);

  /* expuesto para que propiedades.js registre las tarjetas creadas despues */
  window.MA = {
    observarReveals: function () {
      $$('.reveal').forEach(function (el) {
        if (!el.classList.contains('is-in')) revealIO.observe(el);
      });
    }
  };

})();
