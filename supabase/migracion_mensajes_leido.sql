-- Parche NO destructivo para `mensajes`.
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
--
-- Agrega la columna `leido` para poder mostrar un contador de mensajes
-- no leídos en el header (igual que ya existe `leida` en `notificaciones`).
-- Los mensajes existentes quedan marcados como leídos por defecto para
-- no generar contadores falsos con el historial ya visto.

alter table mensajes add column if not exists leido boolean not null default true;
alter table mensajes alter column leido set default false;

create index if not exists mensajes_destinatario_leido_idx
  on mensajes (destinatario_id, leido);
