/* ============================================================
   MIRANDE AYBAR — Lógica del sitio
   ============================================================ */
const CFG = window.CONFIG || {};
const WA = (CFG.whatsapp || '').replace(/\D/g, '');
const waLink = (msg) => `https://wa.me/${WA}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;
const waShare = (msg) => `https://wa.me/?text=${encodeURIComponent(msg)}`; // elegir contacto
const mailLink = (subj, body) =>
  `mailto:${CFG.email}?subject=${encodeURIComponent(subj || '')}&body=${encodeURIComponent(body || '')}`;

/* ---------- Enlaces globales de contacto ---------- */
document.getElementById('year').textContent = new Date().getFullYear();
const setHref = (id, href) => { const el = document.getElementById(id); if (el) el.href = href; };
const defaultWaMsg = 'Hola Mirande Aybar, quería hacerles una consulta.';
setHref('nav-wa', waLink(defaultWaMsg));
setHref('cta-wa', waLink(defaultWaMsg));
setHref('wa-float', waLink(defaultWaMsg));
setHref('info-wa', waLink(defaultWaMsg));
setHref('foot-wa', waLink(defaultWaMsg));
setHref('cta-mail', mailLink('Consulta desde la web', ''));
setHref('foot-ig', CFG.instagram || '#');
setHref('foot-tt', CFG.tiktok || '#');
document.querySelectorAll('.member .m-wa').forEach(a => a.href = waLink(defaultWaMsg));

/* ---------- Cliente Supabase (si está configurado) ---------- */
let SB = null;
if (CFG.supabaseUrl && CFG.supabaseKey && window.supabase) {
  try { SB = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey); }
  catch (e) { console.warn('Supabase no inicializado:', e.message); }
}

/* ============================================================
   1) TRADUCCIONES (i18n) ES / EN
   ============================================================ */
const I18N = {
  es: {
    nav_home:'Inicio', nav_props:'Propiedades', nav_about:'Nosotros', nav_team:'Equipo', nav_reviews:'Opiniones', nav_contact:'Contacto', nav_consult:'Consultar', nav_gallery:'Galería',
    hero_l1:'Villa General Belgrano', hero_l2:'en cada capa del tiempo',
    hero_cta1:'Comenzar a explorar', hero_cta2:'Consultar', scroll:'Scroll',
    hero_hint:'Mové el cursor sobre el paisaje',
    hero_para_l:'Recorré cada capa de historia y naturaleza que hizo de este lugar un destino único. Propiedades, paisajes y secretos que esperan ser descubiertos.',
    hero_para_r:'Descubrí las Sierras de Calamuchita, trazá tu camino y encontrá la propiedad que se esconde en cada rincón del valle.',
    man1:'Diseño.', man2:'Naturaleza.', man3:'Tu próximo hogar.',
    man_lead:'No vendemos propiedades: acompañamos decisiones. Conocemos cada camino, cada barrio y cada rincón de las sierras, y ponemos ese conocimiento al servicio de tu inversión o tu nuevo hogar.',
    gal_title:'El valle, en detalle', gal_sub:'Un recorrido por los paisajes que rodean cada propiedad.', gal_hint:'Mantené presionado una imagen para ampliarla',
    show_kicker:'Propiedad destacada', show_title:'Nuestra <em>selección</em>', show_cta:'Ver propiedad',
    ph_name:'Tu nombre', ph_email:'Tu email', ph_msg:'Contanos sobre la propiedad de tus sueños...',
    stat1:'Años en la región', stat2:'Operaciones concretadas', stat3:'Atención personalizada', stat4:'Localidades del valle',
    about_eyebrow:'Sobre nosotros', about_title:'Una inmobiliaria <b>de la zona, para la zona</b>',
    about_p1:'Mirande Aybar nació con el objetivo de acompañar a quienes buscan un lugar en las Sierras de Calamuchita. Conocemos cada rincón de Villa General Belgrano y la región, y ponemos ese conocimiento al servicio de cada cliente.',
    about_p2:'Trabajamos con transparencia, cercanía y compromiso, ya sea que quieras comprar tu primera casa, invertir en un terreno o vender tu propiedad al mejor valor. Nuestro equipo te guía en cada paso del proceso.',
    about_badge_b:'Villa General Belgrano', about_badge_s:'Corazón del Valle de Calamuchita',
    about_s1t:'De la <b>zona</b>', about_s1p:'Nacimos y trabajamos en Villa General Belgrano. Conocemos cada barrio, cada camino y cada rincón de las Sierras de Calamuchita.',
    about_s2t:'Para la <b>zona</b>', about_s2p:'Acompañamos a cada cliente con cercanía, transparencia y compromiso: comprar tu primera casa, invertir en un terreno o vender al mejor valor.',
    about_s3t:'Con <b>resultados</b>', about_s3p:'Más de 15 años en la región y 200 operaciones concretadas nos respaldan, con atención 100% personalizada de principio a fin.',
    about_v1:'Años de experiencia', about_v2:'Operaciones concretadas', about_v3:'Atención personalizada',
    props_eyebrow:'Nuestro portafolio', props_title:'Propiedades <b>destacadas</b>',
    props_sub:'Explorá nuestra selección de propiedades en las sierras. Filtrá, buscá y encontrá la tuya.',
    search_ph:'Buscar por nombre, localidad...',
    sort_featured:'Destacadas primero', sort_asc:'Precio: menor a mayor', sort_desc:'Precio: mayor a menor', sort_recent:'Más recientes',
    filter_all:'Todas', filter_house:'Casas', filter_land:'Terrenos', filter_apt:'Departamentos', filter_commercial:'Comerciales',
    loc_all:'Todas las localidades', bed_any:'Dormitorios: cualquiera', price_min:'Mín', price_max:'Máx',
    results_one:'propiedad', results_many:'propiedades',
    team_eyebrow:'Quiénes somos', team_title:'Nuestro <b>equipo</b>',
    team_sub:'Conocé a las personas que te acompañan. Cercanía, experiencia y compromiso con cada cliente.',
    role_agent:'Asesor Inmobiliario',
    bio_seba:'Especialista en propiedades de Villa General Belgrano y alrededores. Atención cercana y personalizada.',
    bio_mario:'Acompaña a compradores e inversores en cada etapa. Conocimiento profundo del mercado local.',
    testi_eyebrow:'Opiniones', testi_title:'Lo que dicen <b>nuestros clientes</b>', testi_sub:'La confianza de quienes ya encontraron su lugar con nosotros.',
    faq_eyebrow:'Preguntas frecuentes', faq_title:'¿Tenés <b>dudas</b>?', faq_sub:'Respondemos las consultas más comunes. Si te queda alguna, escribinos.',
    cta_title:'¿Buscás una propiedad o querés <b>vender la tuya</b>?',
    cta_sub:'Escribinos por WhatsApp o email y coordinamos una consulta sin compromiso.',
    cta_wa:'Escribir por WhatsApp', cta_mail:'Enviar un email',
    contact_eyebrow:'Hablemos', contact_title:'Estamos para <b>ayudarte</b>',
    contact_sub:'Dejanos tu consulta y te respondemos a la brevedad. También podés visitarnos en nuestra oficina.',
    contact_addr:'Dirección',
    form_title:'Envianos tu consulta', form_sub:'Completá tus datos y elegí cómo querés enviarlo.',
    form_name:'Nombre y apellido <span class="req">*</span>', form_phone:'Teléfono',
    form_email:'Email <span class="req">*</span>', form_msg:'Mensaje <span class="req">*</span>',
    visit_toggle:'Quiero agendar una visita', visit_date:'Día preferido', visit_time:'Horario preferido',
    form_send_wa:'Enviar por WhatsApp', form_send_mail:'Enviar por Email',
    form_note:'Se abrirá WhatsApp o tu correo con el mensaje ya escrito.',
    form_saved:'¡Gracias! Recibimos tu consulta.',
    err_name:'Ingresá tu nombre.', err_email:'Ingresá un email válido.', err_msg:'Escribí tu mensaje.',
    foot_about:'Inmobiliaria en Villa General Belgrano. Te ayudamos a encontrar o vender tu propiedad en las Sierras de Calamuchita.',
    foot_nav:'Navegación', foot_contact:'Contacto', foot_addr:'Villa General Belgrano, Córdoba',
    foot_rights:'Todos los derechos reservados.', foot_made:'Villa General Belgrano · Sierras de Calamuchita',
    modal_consult:'Consultar por esta propiedad', modal_share:'Compartir',
    op_venta:'Venta', op_alquiler:'Alquiler', op_temporario:'Alquiler temporario',
    badge_featured:'Destacada', badge_new:'Nuevo',
    spec_beds:'dorm.', spec_baths:'baños', spec_area:'m²', spec_land:'m² lote',
    empty:'No hay propiedades que coincidan con tu búsqueda.'
  },
  en: {
    nav_home:'Home', nav_props:'Properties', nav_about:'About', nav_team:'Team', nav_reviews:'Reviews', nav_contact:'Contact', nav_consult:'Contact', nav_gallery:'Gallery',
    hero_l1:'Villa General Belgrano', hero_l2:'in every layer of time',
    hero_cta1:'Start exploring', hero_cta2:'Contact', scroll:'Scroll',
    hero_hint:'Move your cursor over the landscape',
    hero_para_l:'Explore every layer of history and nature that made this place a unique destination. Properties, landscapes and secrets waiting to be discovered.',
    hero_para_r:'Discover the Calamuchita Hills, trace your path and find the property hidden in every corner of the valley.',
    man1:'Design.', man2:'Nature.', man3:'Your next home.',
    man_lead:'We don\'t just sell properties — we guide decisions. We know every road, neighbourhood and corner of the hills, and put that knowledge at the service of your investment or new home.',
    gal_title:'The valley, in detail', gal_sub:'A journey through the landscapes surrounding every property.', gal_hint:'Press and hold an image to expand it',
    show_kicker:'Featured listing', show_title:'Our <em>pick</em>', show_cta:'View property',
    ph_name:'Your name', ph_email:'Your email', ph_msg:'Tell us about your dream property...',
    stat1:'Years in the region', stat2:'Closed deals', stat3:'Personalized service', stat4:'Valley towns',
    about_eyebrow:'About us', about_title:'A local agency, <b>for the local area</b>',
    about_p1:'Mirande Aybar was born to guide those looking for a place in the Calamuchita Hills. We know every corner of Villa General Belgrano and the region, and we put that knowledge at every client\'s service.',
    about_p2:'We work with transparency, closeness and commitment — whether you want to buy your first home, invest in land, or sell your property at its best value. Our team guides you through every step.',
    about_badge_b:'Villa General Belgrano', about_badge_s:'Heart of the Calamuchita Valley',
    about_s1t:'From the <b>area</b>', about_s1p:'We were born and work in Villa General Belgrano. We know every neighbourhood, every road and every corner of the Calamuchita Hills.',
    about_s2t:'For the <b>area</b>', about_s2p:'We guide every client with closeness, transparency and commitment: buying your first home, investing in land or selling at its best value.',
    about_s3t:'With <b>results</b>', about_s3p:'Over 15 years in the region and 200 closed deals back us, with 100% personalized service from start to finish.',
    about_v1:'Years of experience', about_v2:'Closed deals', about_v3:'Personalized service',
    props_eyebrow:'Our portfolio', props_title:'Featured <b>properties</b>',
    props_sub:'Explore our selection of properties in the hills. Filter, search and find yours.',
    search_ph:'Search by name, location...',
    sort_featured:'Featured first', sort_asc:'Price: low to high', sort_desc:'Price: high to low', sort_recent:'Most recent',
    filter_all:'All', filter_house:'Houses', filter_land:'Land', filter_apt:'Apartments', filter_commercial:'Commercial',
    loc_all:'All locations', bed_any:'Bedrooms: any', price_min:'Min', price_max:'Max',
    results_one:'property', results_many:'properties',
    team_eyebrow:'Who we are', team_title:'Our <b>team</b>',
    team_sub:'Meet the people who will guide you. Closeness, experience and commitment to every client.',
    role_agent:'Real Estate Advisor',
    bio_seba:'Specialist in properties in Villa General Belgrano and surroundings. Close, personalized service.',
    bio_mario:'Guides buyers and investors at every stage. Deep knowledge of the local market.',
    testi_eyebrow:'Reviews', testi_title:'What <b>our clients say</b>', testi_sub:'The trust of those who already found their place with us.',
    faq_eyebrow:'FAQ', faq_title:'Got <b>questions</b>?', faq_sub:'We answer the most common ones. If you have another, write to us.',
    cta_title:'Looking for a property or want to <b>sell yours</b>?',
    cta_sub:'Message us on WhatsApp or email and we\'ll arrange a no-obligation consultation.',
    cta_wa:'Message on WhatsApp', cta_mail:'Send an email',
    contact_eyebrow:'Let\'s talk', contact_title:'We\'re here to <b>help</b>',
    contact_sub:'Leave your enquiry and we\'ll get back to you shortly. You can also visit us at our office.',
    contact_addr:'Address',
    form_title:'Send us your enquiry', form_sub:'Fill in your details and choose how to send it.',
    form_name:'Full name <span class="req">*</span>', form_phone:'Phone',
    form_email:'Email <span class="req">*</span>', form_msg:'Message <span class="req">*</span>',
    visit_toggle:'I want to schedule a visit', visit_date:'Preferred day', visit_time:'Preferred time',
    form_send_wa:'Send via WhatsApp', form_send_mail:'Send via Email',
    form_note:'WhatsApp or your email will open with the message ready.',
    form_saved:'Thanks! We received your enquiry.',
    err_name:'Please enter your name.', err_email:'Please enter a valid email.', err_msg:'Please write your message.',
    foot_about:'Real estate in Villa General Belgrano. We help you find or sell your property in the Calamuchita Hills.',
    foot_nav:'Navigation', foot_contact:'Contact', foot_addr:'Villa General Belgrano, Córdoba',
    foot_rights:'All rights reserved.', foot_made:'Villa General Belgrano · Calamuchita Hills',
    modal_consult:'Enquire about this property', modal_share:'Share',
    op_venta:'For sale', op_alquiler:'For rent', op_temporario:'Short-term rental',
    badge_featured:'Featured', badge_new:'New',
    spec_beds:'bd', spec_baths:'ba', spec_area:'m²', spec_land:'m² lot',
    empty:'No properties match your search.'
  }
};
let LANG = localStorage.getItem('ma_lang') || 'es';
const t = (k) => (I18N[LANG] && I18N[LANG][k] !== undefined) ? I18N[LANG][k] : k;

function applyLang(lang){
  LANG = lang; localStorage.setItem('ma_lang', lang);
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k = el.getAttribute('data-i18n');
    if (I18N[lang][k] !== undefined) el.innerHTML = I18N[lang][k];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{
    const k = el.getAttribute('data-i18n-ph');
    if (I18N[lang][k] !== undefined) el.placeholder = I18N[lang][k];
  });
  document.querySelectorAll('.lang button').forEach(b=>b.classList.toggle('active', b.dataset.lang===lang));
  renderProps(); renderTesti(); renderFaq(); renderShowcase();
}
document.querySelectorAll('.lang button').forEach(b=>{
  b.addEventListener('click', ()=>applyLang(b.dataset.lang));
});

/* ============================================================
   2) NAVBAR + MENÚ MÓVIL
   ============================================================ */
const header = document.getElementById('header');
window.addEventListener('scroll', ()=> header.classList.toggle('scrolled', window.scrollY > 60), {passive:true});
const mobileMenu = document.getElementById('mobileMenu');
document.getElementById('burger').addEventListener('click', ()=>mobileMenu.classList.add('open'));
document.getElementById('mobileClose').addEventListener('click', ()=>mobileMenu.classList.remove('open'));
mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>mobileMenu.classList.remove('open')));

/* ============================================================
   3) ANIMACIONES AL HACER SCROLL
   ============================================================ */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('show'); io.unobserve(e.target);} });
}, {threshold:0.12, rootMargin:'0px 0px -40px 0px'});
function observeReveals(){ document.querySelectorAll('.reveal:not(.show)').forEach(el=>io.observe(el)); }

/* ============================================================
   4) HERO 3D — Sierras low-poly con Three.js
   ============================================================ */
(function hero3D(){
  const canvas = document.getElementById('hero-canvas');
  if (!window.THREE || !canvas) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x1d282e, 0.055);
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 3.2, 12);

  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene.add(new THREE.HemisphereLight(0xf4efe8, 0x1d282e, 0.9));
  const key = new THREE.DirectionalLight(0xc3a488, 1.1);
  key.position.set(-6, 8, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xA68364, 0.6);
  rim.position.set(8, 4, -4); scene.add(rim);

  const layers = [];
  function makeRange(zPos, height, colorHex, seg){
    const geo = new THREE.PlaneGeometry(60, 16, seg, 12);
    const pos = geo.attributes.position;
    for (let i=0;i<pos.count;i++){
      const x = pos.getX(i), y = pos.getY(i);
      let z = Math.sin(x*0.4)*Math.cos(x*0.18)*height
            + Math.sin(x*1.3+zPos)*height*0.28
            + (Math.random()-0.5)*height*0.25;
      z *= (y+8)/16;
      pos.setZ(i, Math.max(z, -1));
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({color:colorHex, flatShading:true, roughness:0.95, metalness:0.05});
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI/2.35;
    mesh.position.set(0, -2.2, zPos);
    scene.add(mesh);
    return mesh;
  }
  layers.push(makeRange(-2, 4.2, 0x33454e, 40));
  layers.push(makeRange(2,  3.2, 0x3c525c, 46));
  layers.push(makeRange(6,  2.4, 0xA68364, 52));

  const starGeo = new THREE.BufferGeometry();
  const starCount = 220, arr = new Float32Array(starCount*3);
  for(let i=0;i<starCount;i++){
    arr[i*3]=(Math.random()-0.5)*50;
    arr[i*3+1]=Math.random()*18+3;
    arr[i*3+2]=(Math.random()-0.5)*30-6;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(arr,3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({color:0xc3a488, size:0.06, transparent:true, opacity:0.7}));
  scene.add(stars);

  let mx=0, my=0, tx=0, ty=0, scrollY=0;
  window.addEventListener('mousemove', e=>{
    tx=(e.clientX/window.innerWidth-0.5); ty=(e.clientY/window.innerHeight-0.5);
  }, {passive:true});
  window.addEventListener('scroll', ()=>{ scrollY = window.scrollY; }, {passive:true});

  let raf;
  const clock = new THREE.Clock();
  function animate(){
    raf = requestAnimationFrame(animate);
    const el = clock.getElapsedTime();
    mx += (tx-mx)*0.05; my += (ty-my)*0.05;
    camera.position.x = mx*2.2;
    camera.position.y = 3.2 - my*1.2 - Math.min(scrollY,800)*0.004;
    camera.lookAt(0, 0.4, 0);
    stars.rotation.y = el*0.02;
    layers.forEach((l,i)=> l.position.y = -2.2 + Math.sin(el*0.4 + i)*0.06 );
    renderer.render(scene, camera);
  }
  if (!reduce) animate();
  else renderer.render(scene, camera);

  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  new IntersectionObserver((es)=>{
    es.forEach(e=>{
      if(e.isIntersecting && !reduce){ if(!raf) animate(); }
      else { cancelAnimationFrame(raf); raf=null; }
    });
  }, {threshold:0.01}).observe(document.getElementById('inicio'));
})();

/* ============================================================
   5) PROPIEDADES — Supabase o datos de ejemplo
   ============================================================ */
const F = 'assets/fotos/';
const DEMO = [
  { id:1, titulo:'Casa serrana con vista', titulo_en:'Hillside home with a view', tipo:'casa', operacion:'venta',
    precio:145000, moneda:'USD', localidad:'Villa General Belgrano', dormitorios:3, banos:2, superficie:180, lote:600,
    destacada:true, nuevo:false,
    descripcion:'Amplia casa de estilo serrano con living comedor, cocina integrada, galería con parrillo y hermoso jardín con árboles. Excelente ubicación a minutos del centro.',
    descripcion_en:'Spacious hillside-style home with living-dining room, open kitchen, gallery with grill and a beautiful tree-filled garden. Great location, minutes from downtown.',
    imagenes:[F+'champaqui.jpg', F+'los-reartes.jpg', F+'pozo-verde.jpg'] },
  { id:2, titulo:'Lote en barrio residencial', titulo_en:'Lot in residential neighborhood', tipo:'terreno', operacion:'venta',
    precio:38000, moneda:'USD', localidad:'La Cumbrecita', dormitorios:0, banos:0, superficie:0, lote:800,
    destacada:false, nuevo:true,
    descripcion:'Terreno en zona tranquila y arbolada, ideal para construir tu casa de fin de semana. Con todos los servicios disponibles.',
    descripcion_en:'Lot in a quiet, tree-lined area, ideal to build your weekend home. All utilities available.',
    imagenes:[F+'los-reartes.jpg', F+'cerro-virgen.jpg'] },
  { id:3, titulo:'Departamento céntrico', titulo_en:'Downtown apartment', tipo:'departamento', operacion:'alquiler',
    precio:320000, moneda:'ARS', localidad:'Villa General Belgrano', dormitorios:2, banos:1, superficie:65, lote:0,
    destacada:false, nuevo:false,
    descripcion:'Departamento luminoso a metros de la Avenida principal. Ideal para vivienda permanente o inversión de renta.',
    descripcion_en:'Bright apartment steps from the main avenue. Ideal as a permanent home or rental investment.',
    imagenes:[F+'lago-embalse.jpg', F+'los-molinos.jpg'] },
  { id:4, titulo:'Cabaña para renta temporaria', titulo_en:'Cabin for short-term rental', tipo:'casa', operacion:'temporario',
    precio:55000, moneda:'ARS', localidad:'Los Reartes', dormitorios:2, banos:1, superficie:70, lote:400,
    destacada:true, nuevo:false,
    descripcion:'Encantadora cabaña totalmente equipada, con parque propio y quincho. Excelente historial de ocupación turística.',
    descripcion_en:'Charming fully-equipped cabin with its own park and BBQ area. Excellent tourism occupancy history.',
    imagenes:[F+'pozo-verde.jpg', F+'rumipal.jpg', F+'champaqui.jpg'] },
  { id:5, titulo:'Local comercial sobre avenida', titulo_en:'Commercial unit on main avenue', tipo:'local', operacion:'venta',
    precio:98000, moneda:'USD', localidad:'Villa General Belgrano', dormitorios:0, banos:1, superficie:90, lote:0,
    destacada:false, nuevo:false,
    descripcion:'Local a la calle en zona de alto tránsito comercial y turístico. Gran oportunidad de inversión.',
    descripcion_en:'Street-front unit in a high-traffic commercial and tourist area. Great investment opportunity.',
    imagenes:[F+'los-molinos.jpg', F+'lago-embalse.jpg'] },
  { id:6, titulo:'Terreno con vista al valle', titulo_en:'Lot with valley views', tipo:'terreno', operacion:'venta',
    precio:52000, moneda:'USD', localidad:'Villa General Belgrano', dormitorios:0, banos:0, superficie:0, lote:1000,
    destacada:false, nuevo:true,
    descripcion:'Excelente lote en altura con vista panorámica al valle y las sierras. Entorno natural privilegiado.',
    descripcion_en:'Excellent elevated lot with panoramic views of the valley and hills. Privileged natural setting.',
    imagenes:[F+'rumipal.jpg', F+'cerro-virgen.jpg'] }
];

let PROPS = [];
let currentFilter = 'all';

// Normaliza imágenes: acepta array (imagenes) o texto separado por comas/saltos (imagen)
function imgsOf(p){
  if (Array.isArray(p.imagenes) && p.imagenes.length) return p.imagenes;
  if (typeof p.imagenes === 'string' && p.imagenes.trim())
    return p.imagenes.split(/[\n,]+/).map(s=>s.trim()).filter(Boolean);
  if (p.imagen) return [p.imagen];
  return [F+'champaqui.jpg'];
}

async function loadProps(){
  if (SB){
    try{
      const { data, error } = await SB.from('propiedades')
        .select('*').eq('publicada', true).order('created_at', {ascending:false});
      if (error) throw error;
      if (data && data.length){ PROPS = data; buildLocOptions(); renderProps(); renderShowcase(); return; }
    }catch(err){ console.warn('Supabase no disponible, usando demo:', err.message); }
  }
  PROPS = DEMO; buildLocOptions(); renderProps(); renderShowcase();
}

function buildLocOptions(){
  const sel = document.getElementById('locFilter');
  const locs = [...new Set(PROPS.map(p=>p.localidad).filter(Boolean))].sort();
  const cur = sel.value;
  sel.innerHTML = `<option value="all" data-i18n="loc_all">${t('loc_all')}</option>` +
    locs.map(l=>`<option value="${l}">${l}</option>`).join('');
  if ([...sel.options].some(o=>o.value===cur)) sel.value = cur;
}

function fmtPrice(p){
  if(!p.precio) return LANG==='es'?'Consultar':'Ask';
  const n = new Intl.NumberFormat(LANG==='es'?'es-AR':'en-US').format(p.precio);
  return `${p.moneda||'USD'} ${n}`;
}
function propTitle(p){ return (LANG==='en' && p.titulo_en) ? p.titulo_en : p.titulo; }
function propDesc(p){ return (LANG==='en' && p.descripcion_en) ? p.descripcion_en : (p.descripcion||''); }

const ICON = {
  bed:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 17v-5a2 2 0 012-2h16a2 2 0 012 2v5"/><path d="M2 17h20M6 10V8a2 2 0 012-2h3v4"/></svg>',
  bath:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12V6a2 2 0 012-2 2 2 0 012 2"/><path d="M2 12h20v2a4 4 0 01-4 4H6a4 4 0 01-4-4z"/><path d="M6 18v2M18 18v2"/></svg>',
  area:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-5.2-7-11a7 7 0 0114 0c0 5.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>'
};

function specsHtml(p){
  const s=[];
  if(p.dormitorios) s.push(`<div class="spec">${ICON.bed}${p.dormitorios} ${t('spec_beds')}</div>`);
  if(p.banos)       s.push(`<div class="spec">${ICON.bath}${p.banos} ${t('spec_baths')}</div>`);
  if(p.superficie)  s.push(`<div class="spec">${ICON.area}${p.superficie} ${t('spec_area')}</div>`);
  if(!p.superficie && p.lote) s.push(`<div class="spec">${ICON.area}${p.lote} ${t('spec_land')}</div>`);
  return s.join('');
}

function shareText(p){
  const url = window.location.href.split('#')[0] + '#propiedades';
  return (LANG==='es'
    ? `¡Mirá esta propiedad de Mirande Aybar! ${propTitle(p)} — ${fmtPrice(p)} en ${p.localidad||''}. ${url}`
    : `Check out this Mirande Aybar property! ${propTitle(p)} — ${fmtPrice(p)} in ${p.localidad||''}. ${url}`);
}

// Aplica todos los filtros + orden
function getFiltered(){
  const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  const loc = document.getElementById('locFilter').value;
  const minBed = parseInt(document.getElementById('bedFilter').value,10) || 0;
  const pMin = parseFloat(document.getElementById('priceMin').value) || 0;
  const pMax = parseFloat(document.getElementById('priceMax').value) || Infinity;
  const sort = document.getElementById('sortSelect').value;

  let list = PROPS.filter(p=>{
    if (currentFilter!=='all' && p.tipo!==currentFilter) return false;
    if (loc!=='all' && p.localidad!==loc) return false;
    if (minBed && (p.dormitorios||0) < minBed) return false;
    const price = p.precio || 0;
    if (price < pMin || price > pMax) return false;
    if (q){
      const hay = `${p.titulo} ${p.titulo_en||''} ${p.localidad||''} ${p.descripcion||''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  list.sort((a,b)=>{
    if (sort==='price-asc')  return (a.precio||0)-(b.precio||0);
    if (sort==='price-desc') return (b.precio||0)-(a.precio||0);
    if (sort==='recent')     return (b.id||0)-(a.id||0);
    // featured: destacadas, luego nuevas, luego por id
    return (b.destacada?2:0)+(b.nuevo?1:0) - ((a.destacada?2:0)+(a.nuevo?1:0)) || (b.id||0)-(a.id||0);
  });
  return list;
}

function renderProps(){
  const grid = document.getElementById('propGrid');
  if(!grid) return;
  const list = getFiltered();
  const countEl = document.getElementById('resultsCount');
  if (countEl) countEl.textContent = `${list.length} ${list.length===1?t('results_one'):t('results_many')}`;

  if(!list.length){ grid.innerHTML = `<div class="empty">${t('empty')}</div>`; return; }
  grid.innerHTML = list.map(p=>{
    const imgs = imgsOf(p);
    const badges = [];
    if (p.destacada) badges.push(`<span class="badge badge-featured">${t('badge_featured')}</span>`);
    if (p.nuevo)     badges.push(`<span class="badge badge-new">${t('badge_new')}</span>`);
    return `
    <article class="card reveal" data-id="${p.id}">
      <div class="card-img">
        <img src="${imgs[0]}" alt="${propTitle(p)}" loading="lazy">
        ${badges.length?`<div class="card-badges">${badges.join('')}</div>`:''}
        <button class="card-share" data-share="${p.id}" aria-label="Compartir">${ICON.share}</button>
        ${imgs.length>1?`<span class="card-count">${ICON.cam}${imgs.length}</span>`:''}
        <span class="card-op" style="left:14px;right:auto;bottom:14px;top:auto">${p.localidad||''}</span>
      </div>
      <div class="card-body">
        <div class="card-price">${fmtPrice(p)}</div>
        <h3>${propTitle(p)}</h3>
        <div class="loc">${ICON.pin}<span>${t('op_'+p.operacion)||p.operacion}</span></div>
        <div class="card-specs">${specsHtml(p)}</div>
      </div>
    </article>`;
  }).join('');

  grid.querySelectorAll('.card').forEach(c=>{
    c.addEventListener('click', ()=>openModal(c.dataset.id));
  });
  grid.querySelectorAll('.card-share').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const p = PROPS.find(x=>String(x.id)===String(btn.dataset.share));
      if (p) window.open(waShare(shareText(p)), '_blank');
    });
  });
  observeReveals();
}

/* Showcase 3D de la portada: rota entre varias propiedades destacadas */
let showList = [], showIdx = 0, showTimer = null;
const SHOW_MS = 5000;

function showcaseList(){
  const feats = PROPS.filter(x=>x.destacada);
  return feats.length ? feats : PROPS.slice(0, 5);
}
function startShowTimer(){
  if (showTimer) clearInterval(showTimer);
  if (showList.length > 1)
    showTimer = setInterval(()=>{ showIdx = (showIdx+1) % showList.length; paintShowcase(); }, SHOW_MS);
}
function paintShowcase(){
  const el = document.getElementById('showcaseScreen');
  if(!el || !showList.length) return;
  const p = showList[showIdx % showList.length];
  const img = imgsOf(p)[0];
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const dots = showList.length>1
    ? `<div class="show-dots">${showList.map((_,i)=>`<button data-i="${i}" class="${i===showIdx?'active':''}" aria-label="Propiedad ${i+1}"></button>`).join('')}</div>` : '';
  el.style.opacity = '0';
  setTimeout(()=>{
    el.innerHTML = `
      <div class="show-prop" data-id="${p.id}">
        <img src="${img}" alt="${propTitle(p)}">
        <div class="show-overlay">
          <div class="show-top">
            <span class="badge badge-featured">${t('badge_featured')}</span>
            <span class="show-op">${(t('op_'+p.operacion)||p.operacion)} · ${p.localidad||''}</span>
          </div>
          <div class="show-bottom">
            <div class="show-price">${fmtPrice(p)}</div>
            <h3>${propTitle(p)}</h3>
            <div class="show-specs">${specsHtml(p)}</div>
            <span class="show-cta">${t('show_cta')} ${arrow}</span>
          </div>
        </div>
        ${dots}
      </div>`;
    const node = el.querySelector('.show-prop');
    if(node) node.addEventListener('click', ()=>openModal(p.id));
    el.querySelectorAll('.show-dots button').forEach(b=>{
      b.addEventListener('click', ev=>{
        ev.stopPropagation();
        showIdx = parseInt(b.dataset.i,10);
        paintShowcase(); startShowTimer();
      });
    });
    el.style.opacity = '1';
  }, 220);
}
function renderShowcase(){
  const el = document.getElementById('showcaseScreen');
  if(!el || !PROPS.length) return;
  showList = showcaseList();
  if (showIdx >= showList.length) showIdx = 0;
  el.style.transition = 'opacity .38s ease';
  paintShowcase();
  startShowTimer();
  el.onmouseenter = ()=>{ if(showTimer){ clearInterval(showTimer); showTimer=null; } };
  el.onmouseleave = ()=> startShowTimer();
}

/* Chips por tipo */
document.getElementById('filters').addEventListener('click', e=>{
  const btn = e.target.closest('button'); if(!btn) return;
  document.querySelectorAll('#filters button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = btn.dataset.filter;
  renderProps();
});
// Buscador, orden y filtros avanzados
['searchInput','sortSelect','locFilter','bedFilter','priceMin','priceMax'].forEach(id=>{
  const el = document.getElementById(id);
  el.addEventListener(el.tagName==='SELECT'?'change':'input', renderProps);
});

/* ============================================================
   6) MODAL con carrusel
   ============================================================ */
const modal = document.getElementById('propModal');
let carImgs = [], carIdx = 0;

function renderCarousel(){
  const track = document.getElementById('m-track');
  const dots = document.getElementById('m-dots');
  track.style.transform = `translateX(-${carIdx*100}%)`;
  dots.querySelectorAll('button').forEach((d,i)=>d.classList.toggle('active', i===carIdx));
  const multi = carImgs.length>1;
  document.getElementById('m-prev').style.display = multi?'flex':'none';
  document.getElementById('m-next').style.display = multi?'flex':'none';
  dots.style.display = multi?'flex':'none';
}
function carGo(dir){ carIdx = (carIdx + dir + carImgs.length) % carImgs.length; renderCarousel(); }
document.getElementById('m-prev').addEventListener('click', ()=>carGo(-1));
document.getElementById('m-next').addEventListener('click', ()=>carGo(1));

function openModal(id){
  const p = PROPS.find(x=>String(x.id)===String(id)); if(!p) return;
  carImgs = imgsOf(p); carIdx = 0;
  document.getElementById('m-track').innerHTML = carImgs.map(src=>`<img src="${src}" alt="${propTitle(p)}">`).join('');
  document.getElementById('m-dots').innerHTML = carImgs.map((_,i)=>`<button aria-label="Foto ${i+1}"></button>`).join('');
  document.getElementById('m-dots').querySelectorAll('button').forEach((d,i)=>d.addEventListener('click',()=>{carIdx=i;renderCarousel();}));
  renderCarousel();

  document.getElementById('m-op').textContent = t('op_'+p.operacion) || p.operacion;
  document.getElementById('m-title').textContent = propTitle(p);
  document.getElementById('m-loc').textContent = p.localidad||'';
  document.getElementById('m-price').textContent = fmtPrice(p);
  document.getElementById('m-specs').innerHTML = specsHtml(p) || '';
  document.getElementById('m-desc').textContent = propDesc(p);
  const msg = (LANG==='es'
    ? `Hola Mirande Aybar, me interesa la propiedad "${propTitle(p)}" (${p.localidad||''}). ¿Me dan más información?`
    : `Hi Mirande Aybar, I'm interested in the property "${propTitle(p)}" (${p.localidad||''}). Could you send me more info?`);
  document.getElementById('m-wa').href = waLink(msg);
  document.getElementById('m-share').onclick = ()=> window.open(waShare(shareText(p)), '_blank');

  modal.classList.add('open');
  document.body.style.overflow='hidden';
}
function closeModal(){ modal.classList.remove('open'); document.body.style.overflow=''; }
modal.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click', closeModal));
document.addEventListener('keydown', e=>{
  if(!modal.classList.contains('open')) return;
  if(e.key==='Escape') closeModal();
  if(e.key==='ArrowLeft' && carImgs.length>1) carGo(-1);
  if(e.key==='ArrowRight' && carImgs.length>1) carGo(1);
});

/* ============================================================
   7) TESTIMONIOS (placeholders editables)
   ============================================================ */
const TESTI = [
  { ini:'LR', stars:5,
    es:{name:'Laura R.', loc:'Compró una casa en VGB', text:'Nos acompañaron en todo el proceso con mucha paciencia. Encontramos la casa ideal para la familia. ¡Gracias por la dedicación!'},
    en:{name:'Laura R.', loc:'Bought a home in VGB', text:'They guided us through the whole process very patiently. We found the ideal home for our family. Thank you for the dedication!'} },
  { ini:'MG', stars:5,
    es:{name:'Martín G.', loc:'Invirtió en un terreno', text:'Muy profesionales y transparentes. Conocen la zona como nadie y me asesoraron muy bien para invertir. Recomendados totalmente.'},
    en:{name:'Martín G.', loc:'Invested in land', text:'Very professional and transparent. They know the area like no one and advised me really well to invest. Totally recommended.'} },
  { ini:'CP', stars:5,
    es:{name:'Carolina P.', loc:'Vendió su propiedad', text:'Vendí mi propiedad en tiempo récord y al valor que esperaba. Atención cálida y siempre disponibles para responder mis dudas.'},
    en:{name:'Carolina P.', loc:'Sold her property', text:'I sold my property in record time and at the value I expected. Warm service and always available to answer my questions.'} }
];
function stars(n){ let s=''; for(let i=0;i<n;i++) s+='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.8 5.4 21l1.4-7L1.6 9.3l7-.8z"/></svg>'; return s; }
function renderTesti(){
  const el = document.getElementById('testiGrid'); if(!el) return;
  el.innerHTML = TESTI.map(x=>{
    const d = x[LANG] || x.es;
    return `<div class="testi reveal">
      <div class="stars">${stars(x.stars)}</div>
      <p>“${d.text}”</p>
      <div class="who"><div class="avatar">${x.ini}</div><div><b>${d.name}</b><span>${d.loc}</span></div></div>
    </div>`;
  }).join('');
  observeReveals();
}

/* ============================================================
   8) FAQ (placeholders editables)
   ============================================================ */
const FAQ = [
  { es:{q:'¿Cobran por asesoramiento o tasación?', a:'La primera consulta y el asesoramiento inicial no tienen costo. Coordinamos una visita o llamada para entender qué buscás y orientarte sin compromiso.'},
    en:{q:'Do you charge for advice or valuation?', a:'The first consultation and initial advice are free. We arrange a visit or call to understand what you\'re looking for and guide you with no obligation.'} },
  { es:{q:'¿Trabajan con propiedades fuera de Villa General Belgrano?', a:'Sí. Operamos en toda la región del Valle de Calamuchita: Los Reartes, La Cumbrecita, Villa Berna y localidades cercanas.'},
    en:{q:'Do you work with properties outside Villa General Belgrano?', a:'Yes. We operate across the Calamuchita Valley region: Los Reartes, La Cumbrecita, Villa Berna and nearby towns.'} },
  { es:{q:'Quiero vender mi propiedad, ¿cómo empezamos?', a:'Escribinos por WhatsApp o el formulario. Coordinamos una visita, hacemos la tasación y definimos juntos la mejor estrategia de venta.'},
    en:{q:'I want to sell my property, how do we start?', a:'Message us on WhatsApp or the form. We arrange a visit, do the valuation and define together the best selling strategy.'} },
  { es:{q:'¿Puedo agendar una visita a una propiedad?', a:'¡Claro! Al enviar tu consulta podés marcar "Quiero agendar una visita" y elegir día y horario. Coordinamos y te confirmamos.'},
    en:{q:'Can I schedule a property visit?', a:'Of course! When sending your enquiry you can check "I want to schedule a visit" and pick a day and time. We\'ll coordinate and confirm.'} }
];
function renderFaq(){
  const el = document.getElementById('faqList'); if(!el) return;
  el.innerHTML = FAQ.map(x=>{
    const d = x[LANG] || x.es;
    return `<details class="faq-item reveal"><summary>${d.q}<span class="plus"></span></summary><div class="faq-a">${d.a}</div></details>`;
  }).join('');
  observeReveals();
}

/* ============================================================
   9) FORMULARIO → WhatsApp / Email (+ agenda + Supabase)
   ============================================================ */
const form = document.getElementById('contactForm');
let sendMode = 'wa';
form.querySelectorAll('button[data-send]').forEach(b=>{
  b.addEventListener('click', ()=> sendMode = b.dataset.send);
});
// Mostrar/ocultar campos de agenda
const visitCheck = document.getElementById('visitCheck');
const visitFields = document.getElementById('visitFields');
visitCheck.addEventListener('change', ()=> visitFields.classList.toggle('show', visitCheck.checked));

function setInvalid(fieldId, yes){ document.getElementById(fieldId).classList.toggle('invalid', yes); }

async function saveConsulta(payload){
  if (!SB) return;
  try { await SB.from('consultas').insert(payload); }
  catch(err){ console.warn('No se pudo guardar la consulta:', err.message); }
}

form.addEventListener('submit', e=>{
  e.preventDefault();
  const nombre = form.nombre.value.trim();
  const telefono = form.telefono.value.trim();
  const email = form.email.value.trim();
  const mensaje = form.mensaje.value.trim();
  const agendar = form.agendar.checked;
  const fecha = form.fecha.value;
  const hora = form.hora.value;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  setInvalid('f-name', !nombre);
  setInvalid('f-email', !emailOk);
  setInvalid('f-msg', !mensaje);
  if(!nombre){ form.nombre.focus(); return; }
  if(!emailOk){ form.email.focus(); return; }
  if(!mensaje){ form.mensaje.focus(); return; }

  const visitaTxt = agendar && (fecha||hora)
    ? (LANG==='es' ? `\n\nAgendar visita: ${fecha||'(día a coordinar)'} ${hora||''}`.trimEnd()
                   : `\n\nSchedule visit: ${fecha||'(day TBD)'} ${hora||''}`.trimEnd())
    : '';

  // Guardar en base de datos (no bloquea el envío)
  saveConsulta({ nombre, email, telefono, mensaje, agendar, fecha: fecha||null, hora: hora||null, idioma: LANG });

  if(sendMode==='wa'){
    const txt = (LANG==='es'
      ? `Hola Mirande Aybar!\n\nNombre: ${nombre}\nEmail: ${email}${telefono?`\nTeléfono: ${telefono}`:''}\n\nMensaje: ${mensaje}`
      : `Hello Mirande Aybar!\n\nName: ${nombre}\nEmail: ${email}${telefono?`\nPhone: ${telefono}`:''}\n\nMessage: ${mensaje}`) + visitaTxt;
    window.open(waLink(txt), '_blank');
  } else {
    const subj = LANG==='es' ? `Consulta web de ${nombre}` : `Web enquiry from ${nombre}`;
    const body = (LANG==='es'
      ? `Nombre: ${nombre}\nEmail: ${email}${telefono?`\nTeléfono: ${telefono}`:''}\n\nMensaje:\n${mensaje}`
      : `Name: ${nombre}\nEmail: ${email}${telefono?`\nPhone: ${telefono}`:''}\n\nMessage:\n${mensaje}`) + visitaTxt;
    window.location.href = mailLink(subj, body);
  }
});
['f-name','f-email','f-msg'].forEach(id=>{
  const f=document.getElementById(id); const inp=f.querySelector('input,textarea');
  inp.addEventListener('input', ()=>f.classList.remove('invalid'));
});

/* ============================================================
   10) INICIO
   ============================================================ */
applyLang(LANG);
loadProps();
renderTesti();
renderFaq();
observeReveals();
requestAnimationFrame(()=>document.querySelectorAll('.hero .reveal').forEach(el=>el.classList.add('show')));
