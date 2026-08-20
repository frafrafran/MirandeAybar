# Revisar antes de importar
30 propiedades convertidas desde `PROPIEDADES MIRANDEAYBAR 2026.xlsx`
al esquema real de tu tabla `propiedades`.

## Cómo importarlas

> Una versión anterior de este documento decía que había que aplicar un parche
> de seguridad urgente. **Era una conclusión equivocada**, hecha con pruebas mal
> armadas; RLS ya estaba funcionando. El detalle está en `SEGURIDAD-Y-DATOS.sql`.
> No hay nada que aplicar antes de importar.

Cualquiera de las dos:

- **CSV** → Supabase → Table Editor → tabla `propiedades` → *Insert* → *Import data from CSV* → subís `propiedades-import.csv`
- **SQL** → Supabase → SQL Editor → New query → pegás `propiedades-import.sql` → *Run*

Las 30 entran con **`publicada = false`**: no se ven en el sitio hasta que vos
las revises, les cargues la foto y las actives. Así podés importar tranquilo.

## Lo que dejé afuera a propósito

| Columna del Excel | Por qué no va |
|---|---|
| `CLIENTE` | Son 18 nombres reales de propietarios. La tabla es de **lectura pública**: subir eso es publicar quién es dueño de qué. |
| `CARTELERIA` | Control interno tuyo. |
| `META ADS` | Control interno tuyo. |
| `DOCUMENTAL` | Va dentro de la descripción, en positivo ("Documentación: Escritura"), no como columna filtrable. |
| `GEOLOCALIZACION` | Coordenadas exactas de propiedades a la venta. Si las querés publicar, decime y agrego las columnas `lat`/`lng`. |
| `FRENTE` / `FONDO` | Tu tabla no tiene esas columnas. Están mencionadas en la descripción. |

## Decisiones que tomé y conviene que mires

Son **8 de 30**. En todas tomé el valor mínimo y aclaré el rango en la descripción.

| Cód. | Propiedad | Qué decidí |
|---|---|---|
| `MA5` | 11 Macrolotes en Villa Yacanto | precio «18mil a 35mil USD c/u» → se toma el mínimo 18000<br>terreno «3000 a 6000» → se toma el mínimo 3000 |
| `MA16` | 5 Lotes 700m2 Ingreso Villa Los Aromos | precio «30mil a 50mil USD c/u» → se toma el mínimo 30000 |
| `MA19` | 6 Lotes Loteo Cacique Yam en Villa Yacanto | precio «15/22mil USD c/u» → se toma el mínimo 15000<br>terreno «1000/1400» → se toma el mínimo 1000 |
| `MA20` | 7 Chacras / 35 Lotes Barrio de Montaña Campos del Libertador en El Durazno | precio «30/45/90mil USD c/u» → se toma el mínimo 30000<br>terreno «1000/2000m2/1HA» → se toma el mínimo 1000 |
| `MA23` | Housing Pueblo Puro (7 Unidades) en Villa General Belgrano | precio «233/341mil USD c/u» → se toma el mínimo 233000<br>terreno «110 a 160M2» → se toma el mínimo 110 |
| `MA25` | 5 Macrolotes Barrio Tierras del Sauce en Villa General Belgrano | precio «85/125mil USD c/u» → se toma el mínimo 85000 |
| `MA27` | Complejo 5 Cabañas en Villa General Belgrano | cubierto «65/85» → se toma el mínimo 65 |
| `MA30` | 2 Lotes Esquina en Villa Ciudad Parque | «560» venía en M2 CUB pero es un lote: se pone 0 |

## Dos cosas del Excel que quizá quieras corregir

- **MA23**: dice `HOUSIGN` en vez de `HOUSING`. Lo dejé tal cual para no inventar.
- **MA29**: el terreno dice `2700MZ`. Si son metros cuadrados es `2700M2`; si son manzanas, el número cambia muchísimo.

## El inglés está a medias

`titulo_en` está bien traducido. En `descripcion_en` traduje los servicios
(que son formulaicos: agua, luz, gas, escritura) pero **el texto libre de
`OBSERVACIONES` quedó en español**. Preferí dejarlo visible antes que
inventar una traducción automática y que salga cualquier cosa.

Si vas a usar el sitio en inglés, decime y hago las 30 a mano.

## Las 30 propiedades

| Título | Tipo | Localidad | USD | Terreno | Cub. | D/B |
|---|---|---|---:|---:|---:|:-:|
| 3 Lotes en Villa Yacanto | Lote | Villa Yacanto | 15.000 | 500 | — | 0/0 |
| 2 Lotes en Villa Yacanto | Lote | Villa Yacanto | 18.000 | 1.200 | — | 0/0 |
| 2 Lotes en Villa Ciudad Parque | Lote | Villa Ciudad Parque | 15.000 | 900 | — | 0/0 |
| 2 Cabañas Maderhaus en Villa Yacanto | Cabaña | Villa Yacanto | 80.000 | 500 | 40 | 1/0 |
| 11 Macrolotes en Villa Yacanto | Macrolote | Villa Yacanto | 18.000 | 3.000 | — | 0/0 |
| Casa 2 Dormitorios a Estrenar en El Durazno | Casa de campo | El Durazno | 150.000 | 400 | 100 | 2/0 |
| Complejo (8) Cabañas Lofts Aldea India en El Durazno | Complejo de cabañas | El Durazno | 640.000 | 1.600 | 33 | 0/0 |
| Complejo (3) Cabañas Los Arcos en Los Reartes | Complejo de cabañas | Los Reartes | 80.000 | 390 | 32 | 1/0 |
| Casa 3 Dormitorios en Los Reartes | Casa | Los Reartes | 85.000 | 1.020 | 250 | 3/2 |
| 6 Lotes Villa La Gloria en Villa General Belgrano | Lote | Villa General Belgrano | 25.000 | 1.000 | — | 0/0 |
| Salon de Fiestas La Irene en Villa General Belgrano | Salón de fiestas | Villa General Belgrano | 500.000 | 25.000 | 600 | 0/3 |
| 1 Lote Frente Barrio Altos del Corral en Los Reartes | Lote | Los Reartes | 65.000 | 2.000 | — | 0/0 |
| Casa 2 Dormitorios en Los Reartes | Casa | Los Reartes | 100.000 | 1.500 | 90 | 2/0 |
| Casa 1 Dormitorio con Pileta en La Cumbrecita | Casa | La Cumbrecita | 220.000 | 5.000 | 80 | 1/0 |
| 2 Lotes 3200m2 C/u Ingreso Cumbrecita en La Cumbrecita | Lote | La Cumbrecita | 130.000 | 3.200 | — | 0/0 |
| 5 Lotes 700m2 Ingreso Villa Los Aromos | Lote | Villa Los Aromos | 30.000 | 700 | — | 0/0 |
| Local Comercial 200m2 y Deposito 100m2 en Villa Los Aromos | Local comercial | Villa Los Aromos | 300.000 | 10.000 | 200 | 0/0 |
| Campo 350ha en Villa Los Aromos | Campo | Villa Los Aromos | 3.500.000 | 3.500.000 | — | 0/0 |
| 6 Lotes Loteo Cacique Yam en Villa Yacanto | Lote | Villa Yacanto | 15.000 | 1.000 | — | 0/0 |
| 7 Chacras / 35 Lotes Barrio de Montaña Campos del Libertador en El Durazno | Lote | El Durazno | 30.000 | 1.000 | — | 0/0 |
| Casa 2 Dormitorios a Estrenar en El Durazno (2) | Casa | El Durazno | 170.000 | 2.000 | 140 | 2/0 |
| 1 Chacra Barrio Montaña Campos del Libertador en El Durazno | Chacra | El Durazno | 63.000 | 10.000 | — | 0/0 |
| Housing Pueblo Puro (7 Unidades) en Villa General Belgrano | Housing | Villa General Belgrano | 233.000 | 110 | — | 2/0 |
| 4 Lotes 525m2 con Loft en Torre 4 Pisos en Villa Ciudad Parque | Lote | Villa Ciudad Parque | 13.500 | 525 | — | 0/0 |
| 5 Macrolotes Barrio Tierras del Sauce en Villa General Belgrano | Macrolote | Villa General Belgrano | 85.000 | 10.000 | — | 0/0 |
| Casa 4 Dormitorios a Estrenar en Villa General Belgrano | Casa | Villa General Belgrano | 650.000 | 25.000 | 250 | 0/3 |
| Complejo 5 Cabañas en Villa General Belgrano | Complejo de cabañas | Villa General Belgrano | 460.000 | 10.000 | 65 | 0/0 |
| 1 Lote 2900m2 Barrio Loma del Tigre en Villa Berna | Lote | Villa Berna | 30.000 | 2.900 | — | 0/0 |
| 1 Lote 2700mz Barrio El Sereno en Villa Yacanto | Lote | Villa Yacanto | 35.000 | 2.700 | — | 0/0 |
| 2 Lotes Esquina en Villa Ciudad Parque | Lote | Villa Ciudad Parque | 13.500 | 1.120 | — | 0/0 |

## Si actualizás el Excel

Volvé a correr el conversor y se regeneran los dos archivos:

```bash
python generar-import.py "RUTA/AL/EXCEL.xlsx"
```
