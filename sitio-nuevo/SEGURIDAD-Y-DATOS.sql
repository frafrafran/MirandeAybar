-- ============================================================
--  Mirande Aybar — RLS y limpieza de datos
--
--  NADA DE ESTE ARCHIVO HACE FALTA APLICARLO HOY. La base ya está
--  bien configurada. Queda como referencia.
--
--  POR QUÉ EXISTE: una revisión anterior concluyó que la clave "anon"
--  permitía escribir. Esa conclusión ERA INCORRECTA, y el motivo vale
--  la pena recordarlo porque es una trampa fácil de repetir:
--
--    - El INSERT de prueba mandaba una columna inexistente. PostgREST
--      valida el esquema ANTES que las políticas RLS, así que devolvió
--      400 (columna mala) y se leyó como "el permiso está concedido".
--    - El DELETE y el PATCH usaban id=eq.0, que no existe. Borrar cero
--      filas devuelve 204. Un 204 ahí significa "no coincidió nada",
--      no "tenés permiso".
--
--  La prueba bien hecha, con columnas válidas, devuelve:
--      401 — new row violates row-level security policy
--  Es decir: RLS estaba funcionando todo el tiempo.
--
--  MORALEJA: para probar permisos hay que mandar una petición que
--  sería válida si el permiso existiera. Si falla por otra cosa
--  (esquema, id inexistente), la prueba no midió lo que creías.
--
--  La clave "anon" de config.js es pública por diseño: va escrita en
--  el HTML y cualquiera la ve con "Ver código fuente". Eso es normal y
--  seguro MIENTRAS RLS esté encendido, que es el caso.
-- ============================================================

-- ============================================================
--  PARTE 1 — Las políticas que ya están puestas (referencia)
--  Sirven si algún día hay que rehacer la tabla desde cero.
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
