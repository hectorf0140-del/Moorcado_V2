-- Complementa migracion_rls_dueno.sql. Ejecutar en el SQL Editor de
-- Supabase (una sola vez).
--
-- Bug encontrado al agregar estados de carga en PublicacionesTab.tsx: el
-- botón "Desactivar/Reactivar publicación" del panel de moderación hacía
-- un `update` directo a `anuncios` — desde la Fase 2 (RLS por dueño), eso
-- ya no puede funcionar para un moderador, porque no es el dueño del
-- anuncio (auth.uid() no le pertenece). El fallo era silencioso: el estado
-- local se actualizaba optimista igual, aunque el remoto nunca se guardara.
--
-- Este RPC es independiente de moderador_retirar_anuncio/reactivar_anuncio
-- (esos son parte del flujo de reporte -> apelación, y sí tocan
-- retirado_por_moderacion). Este solo alterna `activo`, para el caso
-- genérico de pausar/reactivar una publicación desde el panel.

create or replace function moderador_alternar_activo_anuncio(
  p_token uuid,
  p_anuncio_id text,
  p_activo boolean
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_moderador_id text;
begin
  select moderador_id into v_moderador_id from _moderador_desde_token(p_token);

  update anuncios
  set data = jsonb_set(data, '{activo}', to_jsonb(p_activo))
  where id = p_anuncio_id;

  return true;
end;
$$;

grant execute on function moderador_alternar_activo_anuncio(uuid, text, boolean) to anon, authenticated;
