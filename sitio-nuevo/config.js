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
  porTanda: 8
};
