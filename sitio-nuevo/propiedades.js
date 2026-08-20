/* ============================================================
   Propiedades desde Supabase + ficha ampliada.

   Sin librerías: la API REST de Supabase es fetch común.
   La ficha replica la del sitio anterior (scrim, panel, cerrar,
   kicker, título, ubicación, precio, specs, descripción y CTA a
   WhatsApp) con el sistema visual actual.
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.CONFIG || {};
  var grid = document.querySelector('.bento');
  if (!grid) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var PROPS = [];          // todas las que llegaron
  var VISTA = [];          // las que pasan los filtros
  var mostradas = 0;
  var POR_TANDA = CFG.porTanda || 8;

  /* ---------- utilidades ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function plata(p, m) {
    if (p == null || p === '') return 'Consultar';
    return (m || 'USD') + ' ' + Number(p).toLocaleString('es-AR');
  }

  function metros(n) {
    if (!n) return null;
    if (n >= 10000) return (n / 10000).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + ' ha';
    return Number(n).toLocaleString('es-AR') + ' m²';
  }

  var SIN_CUBIERTO = ['lote', 'macrolote', 'campo', 'chacra'];

  /* Las 2 filas originales traen superficie cargada aunque sean lotes, y
     mostrar "1.200 m2 cubiertos" para un terreno es informacion falsa para
     el comprador. Si el tipo es de tierra y no hay lote, ese numero es el
     terreno. */
  function areas(p) {
    var tipo = String(p.tipo || '').toLowerCase();
    var tierra = SIN_CUBIERTO.indexOf(tipo) !== -1;
    var cub = p.superficie || 0, terreno = p.lote || 0;
    if (tierra && cub && !terreno) { terreno = cub; cub = 0; }
    if (tierra) cub = 0;
    return { cubierto: cub, terreno: terreno };
  }

  function specs(p) {
    var s = [];
    if (p.dormitorios) s.push(p.dormitorios + (p.dormitorios === 1 ? ' dorm.' : ' dorm.'));
    if (p.banos) s.push(p.banos + (p.banos === 1 ? ' baño' : ' baños'));
    var a = areas(p);
    if (a.cubierto) s.push(metros(a.cubierto) + ' cub.');
    if (a.terreno) s.push('lote ' + metros(a.terreno));
    return s;
  }

  function waLink(p) {
    var txt = 'Hola! Me interesa: ' + p.titulo + ' (' + plata(p.precio, p.moneda) + ').';
    return 'https://wa.me/' + (CFG.whatsapp || '') + '?text=' + encodeURIComponent(txt);
  }

  /* Sin foto cargada no se pone una imagen genérica del valle: daría a
     entender que es la foto de ESA propiedad. Va un panel tipográfico
     que se lee claramente como pendiente. */
  function medio(p, grande) {
    if (p.imagen) {
      return '<img src="' + esc(p.imagen) + '" alt="' + esc(p.titulo) + '"' +
             (grande ? '' : ' loading="lazy"') + ' decoding="async" />' +
             '<div class="tile__grad" aria-hidden="true"></div>';
    }
    return '<div class="tile__nofoto" aria-hidden="true">' +
             '<span class="tile__nofoto-tipo">' + esc(p.tipo || 'Propiedad') + '</span>' +
             '<span class="tile__nofoto-nota">Foto en preparación</span>' +
           '</div>' +
           '<div class="tile__grad" aria-hidden="true"></div>';
  }

  /* ---------- tarjetas del bento ---------- */
  function tarjeta(p, i) {
    var grande = (i % 4 === 0);
    var sp = specs(p);
    return '' +
    '<article class="tile ' + (grande ? 'tile--2x2' : 'tile--2x1') + ' tile--photo tile--prop reveal"' +
            ' data-id="' + p.id + '" tabindex="0" role="button"' +
            ' aria-label="Ver ficha de ' + esc(p.titulo) + '">' +
      medio(p, grande) +
      '<div class="tile__body">' +
        '<p class="label tile__tag">' + esc(p.tipo) + ' &nbsp;·&nbsp; ' + esc(p.operacion) + '</p>' +
        '<h3>' + esc(p.titulo) + '</h3>' +
        '<p class="tile__loc">' + esc(p.localidad) + '</p>' +
        (sp.length ? '<ul class="tile__specs">' +
          sp.map(function (x) { return '<li class="num">' + esc(x) + '</li>'; }).join('') +
        '</ul>' : '') +
        '<p class="tile__price num">' + esc(plata(p.precio, p.moneda)) + '</p>' +
      '</div>' +
      (p.destacada ? '<span class="tile__flag label">Destacada</span>'
       : p.nuevo ? '<span class="tile__flag tile__flag--new label">Nuevo</span>' : '') +
    '</article>';
  }

  function esqueleto(n) {
    var h = '';
    for (var i = 0; i < n; i++) {
      h += '<article class="tile ' + (i % 4 === 0 ? 'tile--2x2' : 'tile--2x1') +
           ' tile--skel" aria-hidden="true"></article>';
    }
    return h;
  }

  var TILES_FIJOS = grid.innerHTML;   // las de estadísticas y el CTA, que no salen de la base

  function pintar() {
    var tanda = VISTA.slice(0, mostradas);
    var html = tanda.map(tarjeta).join('') + TILES_FIJOS;
    grid.innerHTML = html;
    if (window.MA && window.MA.observarReveals) window.MA.observarReveals();
    var btn = $('#verMas');
    if (btn) {
      var faltan = VISTA.length - mostradas;
      btn.hidden = faltan <= 0;
      btn.textContent = faltan > 0 ? 'Ver ' + Math.min(faltan, POR_TANDA) + ' más de ' + faltan : '';
    }
    var cont = $('#propCount');
    if (cont) cont.textContent = PROPS.length;
  }

  function estado(titulo, texto, cta) {
    grid.innerHTML =
      '<article class="tile tile--2x2 tile--cta">' +
        '<p class="label">' + esc(titulo) + '</p>' +
        '<p class="cta__copy">' + esc(texto) + '</p>' +
        (cta || '') +
      '</article>' + TILES_FIJOS;
  }

  /* ---------- buscador y filtros (port de ActionSearchBar) ----------
     Del original se conserva la mecanica: debounce sobre lo tecleado, icono
     que cambia de lupa a flecha cuando hay texto, y sugerencias que entran
     escalonadas. El filtrado, en cambio, sale de Supabase y no de una lista
     fija en memoria.

     Los datos traen inconsistencias reales que hay que normalizar ANTES de
     agrupar, o el filtro muestra chips duplicados:
       operacion: 'venta' (31) y 'Venta' (1)
       tipo:      'Cabana' con salto de linea al final, separada de 'Cabana'
       localidad: 'Villa Yacanto' y 'Villa Yacanto de Calamuchita'
     Se normaliza solo para agrupar y comparar; en pantalla se muestra el
     dato tal como esta cargado.                                            */

  var filtro = { q: '', operacion: null, tipo: null, min: null, max: null };

  function norm(v) {
    return String(v == null ? '' : v).trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function bonito(v) {
    var t = String(v == null ? '' : v).trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
  }

  function iconoTipo(tipo) {
    var t = norm(tipo);
    if (t.indexOf('lote') !== -1 || t.indexOf('campo') !== -1 || t.indexOf('chacra') !== -1)
      return '<path d="M3 20h18"/><path d="m3 20 9-14 9 14"/>';
    if (t.indexOf('cabana') !== -1 || t.indexOf('complejo') !== -1)
      return '<path d="M3 21h18"/><path d="M6 21V10l6-6 6 6v11"/><path d="M10 21v-6h4v6"/>';
    if (t.indexOf('local') !== -1 || t.indexOf('salon') !== -1)
      return '<path d="M3 9h18l-1.5 12h-15z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/>';
    return '<path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10"/><path d="M10 21v-6h4v6"/>';
  }

  /* ---- opciones de filtro derivadas de los propios datos ---- */
  function opciones(campo) {
    var m = {};
    PROPS.forEach(function (p) {
      var k = norm(p[campo]);
      if (!k) return;
      if (!m[k]) m[k] = { clave: k, etiqueta: bonito(String(p[campo]).trim()), n: 0 };
      m[k].n++;
    });
    return Object.keys(m).map(function (k) { return m[k]; })
      .sort(function (a, b) { return b.n - a.n || a.etiqueta.localeCompare(b.etiqueta); });
  }

  function pintarChips(cont, opts, campo) {
    if (!cont) return;
    /* Un filtro con una sola opcion no filtra nada: hoy las 32 propiedades
       son en venta, asi que el grupo "Operacion" seria un boton decorativo.
       Se oculta solo, y el dia que carguen un alquiler reaparece sin tocar
       nada. */
    var grupo = cont.closest('.filtro');
    if (grupo) grupo.hidden = opts.length < 2;
    if (opts.length < 2) { cont.innerHTML = ''; return; }
    cont.innerHTML = opts.map(function (o) {
      return '<button class="chip" type="button" aria-pressed="false"' +
             ' data-campo="' + campo + '" data-valor="' + esc(o.clave) + '">' +
             esc(o.etiqueta) + '<span class="chip__n">' + o.n + '</span></button>';
    }).join('');
  }

  /* ---------- filtro de precio: dos campos escribibles ----------
     El cliente escribe desde cuanto y hasta cuanto. Los dos campos son
     opcionales: solo "desde" es un piso sin techo, solo "hasta" es un techo
     sin piso, y vacios los dos no filtran nada.

     Van como type="text" con inputmode="numeric" y no como type="number":
     number no admite separador de miles (escribir 1.500.000 lo invalida) y
     ademas no deja mover el cursor con setSelectionRange, que es justo lo
     que hace falta para ir formateando mientras se escribe.               */

  var LIMITES = { min: null, max: null };

  function aNumero(v) {
    var d = String(v == null ? '' : v).replace(/\D/g, '');
    return d ? Number(d) : null;
  }

  function miles(n) {
    return Number(n).toLocaleString('es-AR');
  }

  /* Formatea mientras se escribe sin que el cursor salte: cuenta cuantos
     digitos hay antes del cursor, reescribe el valor con los puntos de
     miles y vuelve a dejar el cursor despues de ese mismo digito. */
  function formatearMiles(el) {
    var pos = el.selectionStart == null ? el.value.length : el.selectionStart;
    var digitosAntes = el.value.slice(0, pos).replace(/\D/g, '').length;
    var d = el.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    if (d.length > 9) d = d.slice(0, 9);
    var txt = d ? miles(Number(d)) : '';
    if (txt === el.value) return;
    el.value = txt;
    var i = 0, c = 0;
    while (i < txt.length && c < digitosAntes) {
      if (txt.charCodeAt(i) >= 48 && txt.charCodeAt(i) <= 57) c++;
      i++;
    }
    try { el.setSelectionRange(i, i); } catch (e) { /* el navegador no lo permite */ }
  }

  function iniciarRango() {
    var iMin = $('#pMin'), iMax = $('#pMax');
    var ayuda = $('#pAyuda'), error = $('#pError');
    if (!iMin || !iMax) return;

    var precios = PROPS.map(function (p) { return p.precio; })
      .filter(function (v) { return typeof v === 'number' && isFinite(v); });
    if (!precios.length) { var f = iMin.closest('.filtro'); if (f) f.hidden = true; return; }

    LIMITES.min = Math.min.apply(null, precios);
    LIMITES.max = Math.max.apply(null, precios);
    var mon = (PROPS[0] && PROPS[0].moneda) || 'USD';

    /* el placeholder y la ayuda salen de los datos, no escritos a mano:
       si mañana cargan una propiedad mas cara, se actualizan solos */
    iMin.placeholder = miles(LIMITES.min);
    iMax.placeholder = miles(LIMITES.max);
    if (ayuda) {
      ayuda.textContent = 'Hay propiedades entre ' + mon + ' ' + miles(LIMITES.min) +
                          ' y ' + mon + ' ' + miles(LIMITES.max) + '.';
    }

    function validar() {
      var mal = filtro.min != null && filtro.max != null && filtro.min > filtro.max;
      if (error) {
        error.textContent = mal ? 'El monto de "Desde" es mayor que el de "Hasta".' : '';
        error.hidden = !mal;
      }
      iMin.setAttribute('aria-invalid', String(mal));
      iMax.setAttribute('aria-invalid', String(mal));
      return !mal;
    }

    var t = null;

    /* el temporizador es uno solo para los dos campos, asi que al vencer
       tiene que leer los dos. Si solo guardara el campo recien tocado, quien
       escribe el minimo y salta al maximo antes de los 300 ms perderia el
       minimo: el segundo input cancela el temporizador del primero. */
    function commit() {
      filtro.min = aNumero(iMin.value);
      filtro.max = aNumero(iMax.value);
      validar();
      aplicar();
    }

    function alEscribir(el) {
      formatearMiles(el);
      window.clearTimeout(t);
      t = window.setTimeout(commit, 300);
    }

    iMin.addEventListener('input', function () { alEscribir(iMin); });
    iMax.addEventListener('input', function () { alEscribir(iMax); });

    /* al salir del campo se aplica ya, sin esperar el debounce */
    [iMin, iMax].forEach(function (el) {
      el.addEventListener('blur', function () { window.clearTimeout(t); commit(); });
    });

    /* Enter no debe recargar nada: solo aplica lo escrito ya mismo */
    [iMin, iMax].forEach(function (el) {
      el.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        window.clearTimeout(t);
        commit();
        el.blur();
      });
    });
  }

  function limpiarRango() {
    var iMin = $('#pMin'), iMax = $('#pMax'), error = $('#pError');
    if (iMin) { iMin.value = ''; iMin.setAttribute('aria-invalid', 'false'); }
    if (iMax) { iMax.value = ''; iMax.setAttribute('aria-invalid', 'false'); }
    if (error) { error.textContent = ''; error.hidden = true; }
  }

  /* ---- filtrado ---- */
  function filtradas() {
    var q = norm(filtro.q);
    return PROPS.filter(function (p) {
      if (filtro.operacion && norm(p.operacion) !== filtro.operacion) return false;
      if (filtro.tipo && norm(p.tipo) !== filtro.tipo) return false;
      /* los dos extremos son inclusive: quien escribe "hasta 100.000"
         espera ver la de 100.000 */
      if (filtro.min != null || filtro.max != null) {
        if (p.precio == null) return false;
        if (filtro.min != null && p.precio < filtro.min) return false;
        if (filtro.max != null && p.precio > filtro.max) return false;
      }
      if (q) {
        var texto = norm([p.titulo, p.localidad, p.tipo, p.descripcion].join(' '));
        if (texto.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function hayFiltros() {
    return !!(filtro.q || filtro.operacion || filtro.tipo ||
             filtro.min != null || filtro.max != null);
  }

  function aplicar() {
    VISTA = filtradas();
    mostradas = Math.min(POR_TANDA, VISTA.length);
    pintar();
    var c = $('#buscCuenta');
    if (c) {
      c.innerHTML = VISTA.length === PROPS.length
        ? '<b>' + PROPS.length + '</b> propiedades publicadas'
        : '<b>' + VISTA.length + '</b> de ' + PROPS.length + ' propiedades';
    }
    var r = $('#buscReset');
    if (r) r.hidden = !hayFiltros();
  }

  /* ---- sugerencias ---- */
  var caja = $('#buscSug'), input = $('#buscar'), busc = $('.busc');

  function cerrarSug() {
    if (!caja) return;
    caja.hidden = true;
    caja.innerHTML = '';
    if (input) input.setAttribute('aria-expanded', 'false');
  }

  function pintarSug() {
    if (!caja || !input) return;
    var lista = filtradas().slice(0, 6);
    if (!lista.length) {
      caja.innerHTML = '<li class="sug__vacio" role="option" aria-selected="false">' +
        'No hay propiedades con ese criterio. Proba con menos filtros.</li>';
      caja.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      return;
    }
    caja.innerHTML = lista.map(function (p, i) {
      return '<li role="option" aria-selected="false" data-id="' + p.id + '" style="--i:' + i + '">' +
        '<span class="sug__ico" aria-hidden="true"><svg viewBox="0 0 24 24">' + iconoTipo(p.tipo) + '</svg></span>' +
        '<span class="sug__txt">' +
          '<span class="sug__tit">' + esc(p.titulo) + '</span>' +
          '<span class="sug__sub">' + esc(bonito(p.tipo)) + ' &middot; ' + esc(p.localidad) + '</span>' +
        '</span>' +
        '<span class="sug__precio num">' + esc(plata(p.precio, p.moneda)) + '</span>' +
      '</li>';
    }).join('') +
    '<li class="sug__pie" aria-hidden="true"><span>Enter abre la primera</span><span>Esc cierra</span></li>';
    caja.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function iniciarBuscador() {
    if (!input) return;
    pintarChips($('#fOperacion'), opciones('operacion'), 'operacion');
    pintarChips($('#fTipo'), opciones('tipo'), 'tipo');
    iniciarRango();

    var t = null;
    input.addEventListener('input', function () {
      var v = input.value;
      busc.classList.toggle('has-texto', v.length > 0);
      $('#buscLimpiar').hidden = v.length === 0;
      window.clearTimeout(t);
      t = window.setTimeout(function () {
        filtro.q = v;
        aplicar();
        if (document.activeElement === input) pintarSug();
      }, 200);
    });

    input.addEventListener('focus', function () { if (PROPS.length) pintarSug(); });
    input.addEventListener('blur', function () { window.setTimeout(cerrarSug, 180); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { cerrarSug(); input.blur(); }
      if (e.key === 'Enter') {
        var primera = caja && caja.querySelector('li[data-id]');
        if (primera) { e.preventDefault(); abrir(primera.getAttribute('data-id')); cerrarSug(); }
      }
    });

    caja.addEventListener('mousedown', function (e) {
      var li = e.target.closest('li[data-id]');
      if (!li) return;
      e.preventDefault();
      abrir(li.getAttribute('data-id'));
      cerrarSug();
    });

    $('#buscLimpiar').addEventListener('click', function () {
      input.value = '';
      filtro.q = '';
      busc.classList.remove('has-texto');
      $('#buscLimpiar').hidden = true;
      cerrarSug();
      aplicar();
      input.focus();
    });

    document.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (chip) {
        var campo = chip.getAttribute('data-campo');
        var valor = chip.getAttribute('data-valor');
        var activo = filtro[campo] === valor;
        filtro[campo] = activo ? null : valor;
        $$('.chip[data-campo="' + campo + '"]').forEach(function (c) {
          c.setAttribute('aria-pressed', String(c === chip && !activo));
        });
        aplicar();
        return;
      }
      if (e.target.closest('#buscReset')) {
        filtro = { q: '', operacion: null, tipo: null, min: null, max: null };
        input.value = '';
        busc.classList.remove('has-texto');
        $('#buscLimpiar').hidden = true;
        $$('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        limpiarRango();
        aplicar();
      }
    });
  }

  /* ---------- vista de propiedad, a pagina completa ---------- */
  var vista, ultimoFoco = null;

  function fila(dt, dd) {
    if (dd == null || dd === '' || dd === 0) return '';
    return '<div><dt>' + esc(dt) + '</dt><dd>' + esc(dd) + '</dd></div>';
  }

  function crearVista() {
    var d = document.createElement('div');
    d.className = 'pv';
    d.id = 'pv';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-modal', 'true');
    d.setAttribute('aria-labelledby', 'pvTitulo');
    d.hidden = true;
    d.innerHTML =
      '<header class="pv__bar">' +
        '<button class="pv__volver" type="button" data-cerrar>' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>' +
          'Volver' +
        '</button>' +
        '<span class="pv__marca" aria-hidden="true">Mirande<em>Aybar</em></span>' +
      '</header>' +
      '<div class="pv__scroll" id="pvScroll">' +
        '<div class="pv__hero" id="pvHero"></div>' +
        '<div class="pv__wrap">' +
          '<div class="pv__main">' +
            '<p class="label pv__kicker" id="pvKicker"></p>' +
            '<h2 class="pv__titulo" id="pvTitulo"></h2>' +
            '<p class="pv__loc" id="pvLoc"></p>' +
            '<p class="pv__desc" id="pvDesc"></p>' +
            '<h2 class="pv__h">Ficha técnica</h2>' +
            '<dl class="pv__datos" id="pvDatos"></dl>' +
          '</div>' +
          '<aside class="pv__side">' +
            '<p class="pv__precio num" id="pvPrecio"></p>' +
            '<p class="label pv__op" id="pvOp"></p>' +
            '<a class="btn btn--primary" id="pvWa" target="_blank" rel="noopener">Consultar por WhatsApp</a>' +
            '<a class="btn btn--ghost" id="pvMail">Consultar por email</a>' +
            '<div class="pv__contacto">' +
              '<p class="label">Mirande Aybar</p>' +
              '<a href="https://wa.me/' + (CFG.whatsapp || '') + '" target="_blank" rel="noopener">+54 9 3512 72-9721</a>' +
              '<a href="mailto:' + (CFG.email || '') + '">' + (CFG.email || '') + '</a>' +
              '<p>Paseo Los Troncos, Av. J. A. Roca 95<br />Villa General Belgrano, Córdoba</p>' +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</div>';
    document.body.appendChild(d);
    d.addEventListener('click', function (e) {
      if (e.target.closest('[data-cerrar]')) cerrar();
    });
    return d;
  }

  function fondoInerte(activo) {
    ['header.nav', '#main', 'footer.sheet', '.wa', '#drawer'].forEach(function (sel) {
      var el = $(sel);
      if (!el) return;
      if (activo) el.setAttribute('inert', '');
      else el.removeAttribute('inert');
    });
  }

  var FOCALIZABLES = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
    if (e.key !== 'Tab') return;
    var f = $$(FOCALIZABLES, vista).filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var primero = f[0], ultimo = f[f.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  }

  function abrir(id, empujarHistorial) {
    var p = PROPS.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!p) return;
    if (!vista) vista = crearVista();
    ultimoFoco = document.activeElement;

    var hero = $('#pvHero', vista);
    hero.innerHTML = medio(p, true);
    var himg = hero.querySelector('img');
    if (himg) {
      /* fundido al terminar de cargar; si viene de cache ya esta completa
         y el evento load nunca dispara */
      if (himg.complete) himg.classList.add('cargada');
      else himg.addEventListener('load', function () { himg.classList.add('cargada'); }, { once: true });
    }
    if (p.imagen) {
      hero.classList.remove('sin-foto');
      hero.style.setProperty('--foto', 'url("' + String(p.imagen).replace(/"/g, '%22') + '")');
    } else {
      hero.classList.add('sin-foto');
      hero.style.removeProperty('--foto');
    }
    $('#pvKicker', vista).textContent = (p.tipo || '') + ' · ' + (p.operacion || '');
    $('#pvTitulo', vista).textContent = p.titulo || '';
    $('#pvLoc', vista).textContent = p.localidad || '';
    $('#pvDesc', vista).textContent = p.descripcion || '';
    $('#pvPrecio', vista).textContent = plata(p.precio, p.moneda);
    $('#pvOp', vista).textContent = (p.operacion || '') + (p.moneda ? ' · ' + p.moneda : '');

    $('#pvDatos', vista).innerHTML =
      fila('Tipo', p.tipo) +
      fila('Operación', p.operacion) +
      fila('Localidad', p.localidad) +
      fila('Dormitorios', p.dormitorios) +
      fila('Baños', p.banos) +
      fila('Cubiertos', areas(p).cubierto ? metros(areas(p).cubierto) : '') +
      fila('Terreno', areas(p).terreno ? metros(areas(p).terreno) : '') +
      fila('Referencia', 'MA-' + p.id);

    $('#pvWa', vista).href = waLink(p);
    $('#pvMail', vista).href = 'mailto:' + (CFG.email || '') +
      '?subject=' + encodeURIComponent('Consulta: ' + p.titulo) +
      '&body=' + encodeURIComponent('Hola! Me interesa ' + p.titulo + '.');

    vista.hidden = false;
    document.body.classList.add('sin-scroll');
    /* el fondo queda inerte: ni foco ni lectores de pantalla entran ahi
       mientras la vista esta abierta */
    fondoInerte(true);
    document.addEventListener('keydown', onKey);
    $('#pvScroll', vista).scrollTop = 0;
    /* un reflow forzado, no requestAnimationFrame: hace falta un frame entre
       quitar [hidden] y agregar la clase para que la transicion arranque, y
       rAF no corre en pestañas de fondo. Ahi la vista se abriria invisible. */
    void vista.offsetWidth;
    vista.classList.add('is-open');
    var v = $('.pv__volver', vista);
    if (v) v.focus();

    if (empujarHistorial !== false) {
      history.pushState({ ficha: p.id }, '', '#propiedad-' + p.id);
    }
  }

  function cerrar(desdeHistorial) {
    if (!vista || vista.hidden) return;
    vista.classList.remove('is-open');
    fondoInerte(false);
    document.removeEventListener('keydown', onKey);
    document.body.classList.remove('sin-scroll');
    window.setTimeout(function () { vista.hidden = true; }, 220);
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
    if (!desdeHistorial && /^#propiedad-/.test(location.hash)) history.back();
  }

  /* la vista vive en la URL: se puede compartir y el boton atras la cierra */
  window.addEventListener('popstate', function () {
    var m = /^#propiedad-(\d+)$/.exec(location.hash);
    if (m) abrir(m[1], false); else cerrar(true);
  });

  grid.addEventListener('click', function (e) {
    var t = e.target.closest('.tile--prop');
    if (t) abrir(t.getAttribute('data-id'));
  });
  grid.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target.closest('.tile--prop');
    if (!t) return;
    e.preventDefault();
    abrir(t.getAttribute('data-id'));
  });

  /* ---------- carga ---------- */
  grid.innerHTML = esqueleto(6) + TILES_FIJOS;

  if (!CFG.supabaseUrl || !CFG.supabaseKey) {
    estado('Falta configurar la base', 'Cargá supabaseUrl y supabaseKey en config.js.', '');
    return;
  }

  var url = CFG.supabaseUrl.replace(/\/$/, '') +
    '/rest/v1/propiedades?select=*&publicada=eq.true&order=destacada.desc,id.desc';

  var listo = false;
  var corte = window.setTimeout(function () {
    if (listo) return; listo = true;
    estado('La conexión está lenta', 'No pudimos traer el listado a tiempo. Escribinos y te lo pasamos.',
      '<a class="btn btn--ivory" href="https://wa.me/' + (CFG.whatsapp || '') + '" target="_blank" rel="noopener">Escribir por WhatsApp</a>');
  }, 8000);

  fetch(url, { headers: { apikey: CFG.supabaseKey, Authorization: 'Bearer ' + CFG.supabaseKey } })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (filas) {
      if (listo) return; listo = true; window.clearTimeout(corte);
      if (!filas || !filas.length) {
        estado('Sin propiedades publicadas',
          'Todavía no hay publicaciones activas. Escribinos y te contamos qué tenemos disponible.',
          '<a class="btn btn--ivory" href="#contacto">Consultar</a>');
        return;
      }
      PROPS = filas;
      iniciarBuscador();
      aplicar();
      var m = /^#propiedad-(\d+)$/.exec(location.hash);
      if (m) abrir(m[1], false);
    })
    .catch(function (e) {
      if (listo) return; listo = true; window.clearTimeout(corte);
      console.error('Propiedades:', e);
      estado('No pudimos cargar el listado',
        'Probá recargar la página. Si sigue igual, escribinos por WhatsApp y te pasamos las propiedades.',
        '<a class="btn btn--ivory" href="https://wa.me/' + (CFG.whatsapp || '') + '" target="_blank" rel="noopener">Escribir por WhatsApp</a>');
    });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('#verMas')) return;
    mostradas = Math.min(mostradas + POR_TANDA, VISTA.length);
    pintar();
  });
})();
