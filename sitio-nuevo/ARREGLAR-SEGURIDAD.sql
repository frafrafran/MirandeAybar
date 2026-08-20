-- ============================================================
--  URGENTE — Mirande Aybar
--  Hoy cualquiera que abra tu sitio puede borrar tus propiedades.
--
--  Comprobado el 04/08/2026 contra tu proyecto, usando solamente
--  la clave "anon" que está escrita en config.js:
--
--    GET    /rest/v1/propiedades          -> 200  (leer)
--    POST   /rest/v1/propiedades          -> 400  (insertar: PERMITIDO,
--                                                  el 400 es por columna
--                                                  inexistente, no por permiso)
--    PATCH  /rest/v1/propiedades?id=eq.0  -> 204  (modificar: PERMITIDO)
--    DELETE /rest/v1/propiedades?id=eq.0  -> 204  (borrar: PERMITIDO)
--
--  Los PATCH y DELETE se probaron con id=eq.0, que no existe en tu
--  tabla, así que no se tocó ninguna fila. El 204 significa que el
--  permiso está concedido, no que se haya borrado algo.
--
--  Esa clave es pública por diseño: va escrita en el HTML y cualquiera
--  la ve con clic derecho -> Ver código fuente. Lo que NO es normal es
--  que además permita escribir.
--
--  CÓMO APLICARLO
--    Supabase -> SQL Editor -> New query -> pegar todo -> Run
--    Tarda un segundo y no borra ni modifica ningún dato.
-- ============================================================

-- 1. Encender Row Level Security.
--    A partir de acá, todo queda prohibido salvo lo que se permita abajo.
alter table public.propiedades enable row level security;

-- 2. Borrar políticas viejas si las hubiera, para no acumular.
drop policy if exists "lectura publica"        on public.propiedades;
drop policy if exists "lectura de publicadas"  on public.propiedades;

-- 3. Lo único que se permite al público: LEER las publicadas.
create policy "lectura de publicadas"
  on public.propiedades
  for select
  to anon
  using (publicada = true);

-- 4. No se crea ninguna política de insert, update ni delete.
--    Al no existir, quedan prohibidas para la clave anon.
--    Vos seguís cargando y editando desde el panel de Supabase
--    (Table Editor), que usa tu sesión de administrador y no esta clave.


-- ============================================================
--  COMPROBAR QUE QUEDÓ BIEN
--  Pegá esto en una terminal, reemplazando TU_CLAVE_ANON.
--  Las tres primeras tienen que dar 401 o 403.
--  La cuarta tiene que seguir dando 200.
-- ============================================================
--
-- URL=https://emionflujpdzxpejlgye.supabase.co
-- K=TU_CLAVE_ANON
--
-- curl -s -o /dev/null -w "INSERT %{http_code}\n" -X POST "$URL/rest/v1/propiedades" \
--   -H "apikey: $K" -H "Authorization: Bearer $K" -H "Content-Type: application/json" \
--   -d '{"titulo":"prueba"}'
--
-- curl -s -o /dev/null -w "DELETE %{http_code}\n" -X DELETE "$URL/rest/v1/propiedades?id=eq.0" \
--   -H "apikey: $K" -H "Authorization: Bearer $K"
--
-- curl -s -o /dev/null -w "UPDATE %{http_code}\n" -X PATCH "$URL/rest/v1/propiedades?id=eq.0" \
--   -H "apikey: $K" -H "Authorization: Bearer $K" -H "Content-Type: application/json" \
--   -d '{"titulo":"x"}'
--
-- curl -s -o /dev/null -w "SELECT %{http_code}\n" "$URL/rest/v1/propiedades?select=id&limit=1" \
--   -H "apikey: $K" -H "Authorization: Bearer $K"


-- ============================================================
--  LIMPIEZA DE DATOS (opcional, pero conviene)
--  Tus 2 filas actuales tienen inconsistencias que rompen los
--  filtros del sitio: "Cabaña\n" trae un salto de línea al final,
--  y conviven "Venta" y "venta".
-- ============================================================

-- update public.propiedades set
--   tipo      = initcap(btrim(tipo)),
--   operacion = lower(btrim(operacion)),
--   localidad = btrim(localidad),
--   moneda    = upper(btrim(moneda));

-- Y para que no vuelva a pasar al cargar a mano:
-- alter table public.propiedades
--   add constraint operacion_valida check (operacion in ('venta','alquiler','temporario')),
--   add constraint moneda_valida    check (moneda in ('USD','ARS'));
