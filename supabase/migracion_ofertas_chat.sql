-- Ofertas de negociación dentro del chat existente.
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
--
-- No se crea una tabla nueva: una oferta es un mensaje más
-- (tipo = 'oferta') dentro de la misma conversación, así aparece
-- ordenada cronológicamente junto al resto del chat sin duplicar la
-- lógica de hilos/bandeja que ya existe en mensajesDb.ts.
--
-- oferta_estado solo aplica a mensajes tipo 'oferta':
--   pendiente  -> recién enviada, esperando respuesta del destinatario
--   aceptada   -> el destinatario la aceptó
--   rechazada  -> el destinatario la rechazó
--   superada   -> llegó una oferta más nueva en la misma conversación
-- (no hay cobro real todavía — esto solo negocia y calcula la comisión
-- que se mostraría; el pago se sigue coordinando fuera de la plataforma,
-- igual que hoy).

alter table mensajes add column if not exists tipo text not null default 'texto';
alter table mensajes add column if not exists oferta_monto numeric;
alter table mensajes add column if not exists oferta_estado text;

alter table mensajes drop constraint if exists mensajes_tipo_check;
alter table mensajes add constraint mensajes_tipo_check
  check (tipo in ('texto', 'oferta'));

alter table mensajes drop constraint if exists mensajes_oferta_estado_check;
alter table mensajes add constraint mensajes_oferta_estado_check
  check (oferta_estado is null or oferta_estado in ('pendiente', 'aceptada', 'rechazada', 'superada'));

alter table mensajes drop constraint if exists mensajes_oferta_monto_check;
alter table mensajes add constraint mensajes_oferta_monto_check
  check (tipo <> 'oferta' or (oferta_monto is not null and oferta_monto > 0));

-- La política de UPDATE existente ("marcar leido propio") solo permite al
-- destinatario actualizar una fila. Para poder marcar como "superada" tu
-- propia oferta anterior cuando mandás una nueva, el autor también necesita
-- poder actualizar sus propios mensajes (mismo criterio de fila que ya
-- existe para el destinatario, solo que del otro lado de la conversación).
drop policy if exists "actualizar oferta propia" on mensajes;
create policy "actualizar oferta propia" on mensajes
  for update using (auth.uid()::text = autor_id) with check (auth.uid()::text = autor_id);
