/* ============================================================
   Datos del sitio. Editá sólo lo que está entre comillas.

   La clave de abajo es la "anon" / publishable: es PÚBLICA por
   diseño y va escrita en el HTML. Cualquiera puede verla, y está
   bien. Lo que la protege es el Row Level Security de Supabase,
   que ya tenés activo: permite leer y nada más.

   NUNCA pongas acá la clave "service_role".
   ============================================================ */
window.CONFIG = {
  whatsapp: '5493512729721',
  email: 'mirandeaybar@gmail.com',

  supabaseUrl: 'https://emionflujpdzxpejlgye.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtaW9uZmx1anBkenhwZWpsZ3llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNzAxNjgsImV4cCI6MjA5OTY0NjE2OH0.ZnsyNAzXNItYcEBcn9B63KD4NXJAhE433EZpLnsoJEY',

  /* cuántas propiedades se ven antes de tocar "Ver más" */
  porTanda: 8,

  /* Ubicacion de la oficina, para el mapa del pie de pagina. Es el punto
     de "Paseo Los Troncos" en Google Maps (Av. Julio A. Roca 95).
     PARA CAMBIARLA: Google Maps -> clic derecho sobre el lugar -> la
     primera opcion copia algo como "-31.97, -64.55". Pegar esos dos
     numeros aca abajo. */
  oficina: {
    lat: -31.9792235,
    lng: -64.5595411,
    direccion: 'Paseo Los Troncos, Av. J. A. Roca 95',
    localidad: 'Villa General Belgrano, Córdoba'
  }
};
