-- ============================================================
--  Coordenadas de las propiedades — YA APLICADO
--
--  Queda como registro de lo que se cargo, y por si alguna vez hay que
--  rehacer la base desde cero. No hace falta volver a ejecutarlo.
--
--  De donde salen: la columna GEOLOCALIZACION del Excel. Cada celda es un
--  enlace a Google Maps con hasta tres fuentes de coordenadas:
--    - el texto en grados/minutos/segundos
--    - !3d<lat>!4d<lng> en la URL, que es la chincheta
--    - @<lat>,<lng>, que es el centro del mapa y puede estar corrido
--  Se uso el texto en grados cuando existia (18 filas) y la chincheta en el
--  resto (12). En 20 de las 21 con ambos, coincidian dentro de 2 metros.
--
--  La excepcion: CAMPO 350HA tenia el enlace apuntando 2.519 m del texto,
--  a las mismas coordenadas que otras dos filas. Ese enlace estaba copiado
--  de otra propiedad, asi que mandó el texto.
--
--  Las columnas se crearon con la migracion agrega_lat_lng_a_propiedades,
--  que ademas exige que lat y lng vengan juntas y dentro del valle.
-- ============================================================

update public.propiedades as p
set lat = v.lat, lng = v.lng
from (values
  (5, -32.102639, -64.758028),
  (6, -32.108917, -64.789750),
  (7, -31.906413, -64.523318),
  (8, -32.107889, -64.768472),
  (9, -32.068750, -64.762472),
  (10, -32.166484, -64.777868),
  (11, -32.166484, -64.777868),
  (12, -31.901821, -64.573152),
  (13, -31.900972, -64.567639),
  (14, -32.020972, -64.561278),
  (15, -31.964448, -64.574166),
  (16, -31.908500, -64.582361),
  (17, -31.919861, -64.575000),
  (18, -31.906583, -64.775917),
  (19, -31.904889, -64.771306),
  (20, -31.735855, -64.437577),
  (21, -31.735855, -64.437577),
  (22, -31.756444, -64.448611),
  (23, -32.108917, -64.789750),
  (24, -32.147826, -64.739090),
  (25, -32.147826, -64.739090),
  (26, -32.147826, -64.739090),
  (27, -31.972444, -64.544807),
  (28, -31.875111, -64.524056),
  (29, -31.962500, -64.574417),
  (30, -31.961250, -64.575056),
  (31, -31.964806, -64.570944),
  (32, -31.908444, -64.665889),
  (33, -32.127877, -64.753726),
  (34, -31.907889, -64.541861),
  (1, -32.107889, -64.768472)
) as v(id, lat, lng)
where p.id = v.id;