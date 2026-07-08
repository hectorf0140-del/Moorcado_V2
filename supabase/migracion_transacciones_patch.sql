-- Parche NO destructivo para `transacciones`.
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
--
-- Se detectó que la tabla `transacciones` ya existía con el patrón JSONB
-- viejo ({id, data, creado_en}), creada por otro entorno/sesión que
-- trabaja sobre esta misma base de datos en paralelo. Este script NO
-- borra nada — solo AGREGA columnas reales (para las relaciones/reportes
-- de este proyecto) y las llena a partir de lo que ya había en `data`.
-- La columna `data` se conserva intacta para no romper el otro lado.

alter table transacciones add column if not exists animal_id text;
alter table transacciones add column if not exists comprador_id text;
alter table transacciones add column if not exists vendedor_id text;
alter table transacciones add column if not exists precio numeric;
alter table transacciones add column if not exists fecha timestamptz;

update transacciones set
  animal_id = coalesce(animal_id, data->>'animalId'),
  comprador_id = coalesce(comprador_id, data->>'compradorId'),
  vendedor_id = coalesce(vendedor_id, data->>'vendedorId'),
  precio = coalesce(precio, (data->>'precio')::numeric),
  fecha = coalesce(fecha, (data->>'fecha')::timestamptz)
where data is not null;

-- FKs nullable (on delete set null): no obligan a que las columnas nuevas
-- estén pobladas si algo sigue insertando solo {id, data}, pero si están
-- pobladas, deben apuntar a un registro real.
alter table transacciones
  add constraint transacciones_animal_id_fkey
  foreign key (animal_id) references anuncios (id) on delete set null;
alter table transacciones
  add constraint transacciones_comprador_id_fkey
  foreign key (comprador_id) references usuarios (id) on delete set null;
alter table transacciones
  add constraint transacciones_vendedor_id_fkey
  foreign key (vendedor_id) references usuarios (id) on delete set null;

create index if not exists transacciones_vendedor_idx on transacciones (vendedor_id, fecha);
create index if not exists transacciones_comprador_idx on transacciones (comprador_id, fecha);
