-- Ejecutar en el SQL Editor de Supabase (una sola vez).
--
-- Rumi ahora agenda citas veterinarias reales por animal del hato (fecha,
-- tipo de visita, veterinario asignado, estado) — antes "próxima revisión"
-- era un campo fijo que nunca se actualizaba. Las citas viven dentro del
-- JSONB `data` de `usuarios` (mismo patrón que el resto de Rumi, ver
-- migracion_empresa_features.sql), así que no hace falta tabla ni columna
-- nueva. Lo único que toca la base de datos es permitir el nuevo tipo de
-- notificación para el recordatorio de cita próxima.

alter table notificaciones drop constraint if exists notificaciones_tipo_check;
alter table notificaciones add constraint notificaciones_tipo_check
  check (tipo in (
    'mensaje', 'animal_similar', 'favorito', 'vacuna', 'promocion', 'renovacion',
    'reporte_resuelto', 'publicacion_retirada', 'apelacion_aceptada',
    'apelacion_rechazada', 'cuenta_suspendida', 'publicacion_rechazada',
    'cita_veterinaria'
  ));
