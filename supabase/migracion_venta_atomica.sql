-- Venta atómica de un animal. Ejecutar en el SQL Editor de Supabase (una
-- sola vez). Requiere migracion_rls_dueno.sql ya aplicada.
--
-- Problema que resuelve: hoy "marcar como vendido" es dos operaciones
-- independientes desde el cliente (crear transacción + actualizar el
-- anuncio), sin ninguna que impida vender el mismo animal dos veces si el
-- vendedor hace doble clic o tiene dos pestañas abiertas. Esta función hace
-- ambas cosas en una sola transacción de base de datos, y el `update`
-- incluye `and vendido = false` en el where — si dos llamadas llegan casi
-- al mismo tiempo, Postgres serializa el acceso a la fila: la primera gana,
-- la segunda ve 0 filas afectadas y falla con un mensaje claro en vez de
-- crear una segunda transacción para un animal ya vendido.

create or replace function marcar_anuncio_vendido(
  p_anuncio_id text,
  p_comprador_id text,
  p_precio numeric
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_transaccion_id text;
  v_actualizado int;
begin
  if p_precio <= 0 then
    raise exception 'El precio debe ser mayor a cero';
  end if;

  update anuncios
  set data = jsonb_set(jsonb_set(jsonb_set(data, '{vendido}', 'true'), '{enNegociacion}', 'false'), '{activo}', 'false')
  where id = p_anuncio_id
    and vendedor_id = auth.uid()::text
    and not retirado_por_moderacion
    and coalesce((data->>'vendido')::boolean, false) = false;

  get diagnostics v_actualizado = row_count;

  if v_actualizado = 0 then
    raise exception 'Esta publicación ya fue vendida, fue retirada, o no te pertenece.';
  end if;

  v_transaccion_id := 't-' || extract(epoch from clock_timestamp())::bigint || '-' || substr(md5(random()::text), 1, 6);

  insert into transacciones (id, animal_id, comprador_id, vendedor_id, precio, fecha, data)
  values (
    v_transaccion_id,
    p_anuncio_id,
    p_comprador_id,
    auth.uid()::text,
    p_precio,
    now(),
    jsonb_build_object(
      'id', v_transaccion_id,
      'animalId', p_anuncio_id,
      'compradorId', p_comprador_id,
      'vendedorId', auth.uid()::text,
      'precio', p_precio,
      'fecha', now()
    )
  );

  return v_transaccion_id;
end;
$$;

grant execute on function marcar_anuncio_vendido(text, text, numeric) to authenticated;
