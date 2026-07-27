-- Complementa migracion_rls_dueno.sql. Ejecutar en el SQL Editor de Supabase
-- (una sola vez), y DESPUÉS correr a mano el paso final marcado abajo.
--
-- Filtro de IA para publicaciones nuevas: hoy cualquiera publica y queda
-- visible de inmediato en el catálogo, sin ningún control de contenido.
-- A partir de esta migración, todo anuncio nuevo nace con `activo = false`
-- y `estado_moderacion = 'en_revision'`; solo pasa a estar visible cuando:
--   (a) la IA lo revisa (ver src/app/api/moderar-publicacion/route.ts) y
--       llama a ia_moderar_anuncio() con el secreto de servidor, o
--   (b) un moderador humano lo aprueba a mano desde el panel
--       (moderador_moderar_anuncio(), para cuando la IA rechazó mal o no
--       está configurada).
-- Si ninguna de las dos pasa (IA caída, sin API key, etc.) el anuncio se
-- queda "en revisión" — nunca se auto-aprueba por error/timeout, para no
-- dejar pasar justo lo que se quiere filtrar.

-- ═══════════════ 1. Columnas nuevas en anuncios ══════════════════════════════

alter table anuncios
  add column if not exists estado_moderacion text not null default 'en_revision'
    check (estado_moderacion in ('en_revision', 'aprobado', 'rechazado')),
  add column if not exists moderacion_motivo text;

-- Las publicaciones que ya existían antes de este filtro nunca pasaron por
-- ningún control — no tiene sentido mandarlas todas a la cola de revisión
-- de un día para otro. Se dan por aprobadas (el filtro de IA solo aplica
-- a publicaciones nuevas, creadas después de correr esta migración).
update anuncios set estado_moderacion = 'aprobado' where estado_moderacion = 'en_revision';
update anuncios set data = jsonb_set(data, '{estadoModeracion}', '"aprobado"'::jsonb)
  where estado_moderacion = 'aprobado';

-- ═══════════ 2. Proteger estos campos de un update directo del dueño ════════
-- Mismo patrón que retirado_por_moderacion/retirado_motivo en
-- migracion_rls_dueno.sql: sin esto, el propio dueño podría "auto-aprobarse"
-- con cualquier update normal de su anuncio (editar precio, marcar vendido,
-- etc.), ya que RLS es por fila, no por columna.

create or replace function anuncios_proteger_campos()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('app.bypass_proteccion', true), '') <> 'on' then
    new.retirado_por_moderacion := old.retirado_por_moderacion;
    new.retirado_motivo := old.retirado_motivo;
    new.retirado_reporte_id := old.retirado_reporte_id;
    new.data := jsonb_set(new.data, '{retiradoPorModeracion}', to_jsonb(old.retirado_por_moderacion));
    new.data := jsonb_set(new.data, '{retiradoMotivo}', coalesce(to_jsonb(old.retirado_motivo), 'null'::jsonb));
    new.data := jsonb_set(new.data, '{retiradoReporteId}', coalesce(to_jsonb(old.retirado_reporte_id), 'null'::jsonb));
    -- El dueño no puede "reactivar" con su propio update de vendido/edición
    -- una publicación que un moderador retiró.
    if old.retirado_por_moderacion then
      new.data := jsonb_set(new.data, '{activo}', 'false'::jsonb);
    end if;

    new.estado_moderacion := old.estado_moderacion;
    new.moderacion_motivo := old.moderacion_motivo;
    new.data := jsonb_set(new.data, '{estadoModeracion}', to_jsonb(old.estado_moderacion));
    new.data := jsonb_set(new.data, '{moderacionMotivo}', coalesce(to_jsonb(old.moderacion_motivo), 'null'::jsonb));
  end if;
  return new;
end;
$$;

-- El trigger ya existe (creado en migracion_rls_dueno.sql) — no hace falta
-- volver a crearlo, `create or replace function` ya actualiza su cuerpo.

-- Nuevo: en INSERT (fila nueva) nadie puede llegar con un estado de
-- moderación ya decidido — ni siquiera con `app.bypass_proteccion` activo,
-- porque ningún flujo legítimo aprueba/rechaza en el mismo insert que crea
-- el anuncio (la IA y el moderador siempre actúan sobre una fila que ya
-- existe, vía update). Esto cierra el hueco de que el trigger de arriba
-- solo corre en UPDATE: un insert directo con
-- `estado_moderacion: "aprobado"` en el payload, en cambio, sí pasaría por
-- este trigger y se fuerza de vuelta a "en_revision".
create or replace function anuncios_forzar_moderacion_insert()
returns trigger
language plpgsql
as $$
begin
  new.estado_moderacion := 'en_revision';
  new.moderacion_motivo := null;
  new.data := jsonb_set(new.data, '{estadoModeracion}', '"en_revision"'::jsonb);
  new.data := new.data - 'moderacionMotivo';
  return new;
end;
$$;

drop trigger if exists anuncios_forzar_moderacion_insert_trigger on anuncios;
create trigger anuncios_forzar_moderacion_insert_trigger
  before insert on anuncios
  for each row execute function anuncios_forzar_moderacion_insert();

-- ═══════════════ 3. RPC para la IA (endpoint del servidor) ══════════════════
-- No usa token de moderador (la IA no inicia sesión) — se protege con un
-- secreto propio, guardado solo como GUC de la base de datos y como
-- variable de entorno del servidor (IA_MODERACION_SECRET), igual de privado
-- que OPENAI_API_KEY. Si el secreto no calza, no hace nada y devuelve
-- false (el anuncio se queda en revisión para que lo vea un moderador).

create or replace function ia_moderar_anuncio(
  p_anuncio_id text,
  p_secreto text,
  p_aprobado boolean,
  p_motivo text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secreto_actual text;
begin
  v_secreto_actual := current_setting('app.ia_moderacion_secreto', true);

  if v_secreto_actual is null or v_secreto_actual = '' or p_secreto is null or p_secreto <> v_secreto_actual then
    return false;
  end if;

  perform set_config('app.bypass_proteccion', 'on', true);

  -- El primer visto bueno también activa la publicación (activo vive solo
  -- en el JSONB, igual que siempre); un rechazo la deja como nace (false).
  update anuncios
  set estado_moderacion = case when p_aprobado then 'aprobado' else 'rechazado' end,
      moderacion_motivo = p_motivo,
      data = jsonb_set(
        jsonb_set(
          jsonb_set(data, '{estadoModeracion}', to_jsonb(case when p_aprobado then 'aprobado' else 'rechazado' end)),
          '{moderacionMotivo}', coalesce(to_jsonb(p_motivo), 'null'::jsonb)
        ),
        '{activo}', to_jsonb(p_aprobado)
      )
  where id = p_anuncio_id
    and estado_moderacion = 'en_revision'; -- solo la transición inicial

  return found;
end;
$$;

revoke all on function ia_moderar_anuncio(text, text, boolean, text) from public;
grant execute on function ia_moderar_anuncio(text, text, boolean, text) to anon, authenticated;

-- ═══════════════ 4. RPC para que un moderador apruebe/rechace a mano ════════
-- A diferencia de ia_moderar_anuncio, esta sí puede correr sobre cualquier
-- estado actual (por ejemplo, revertir un rechazo de la IA que fue un
-- falso positivo).

create or replace function moderador_moderar_anuncio(
  p_token uuid,
  p_anuncio_id text,
  p_aprobado boolean,
  p_motivo text
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

  perform set_config('app.bypass_proteccion', 'on', true);

  update anuncios
  set estado_moderacion = case when p_aprobado then 'aprobado' else 'rechazado' end,
      moderacion_motivo = p_motivo,
      data = jsonb_set(
        jsonb_set(
          jsonb_set(data, '{estadoModeracion}', to_jsonb(case when p_aprobado then 'aprobado' else 'rechazado' end)),
          '{moderacionMotivo}', coalesce(to_jsonb(p_motivo), 'null'::jsonb)
        ),
        '{activo}', to_jsonb(p_aprobado)
      )
  where id = p_anuncio_id;

  return true;
end;
$$;

grant execute on function moderador_moderar_anuncio(uuid, text, boolean, text) to anon, authenticated;

-- ═══════════════ 5. Nuevo tipo de notificación ══════════════════════════════

alter table notificaciones drop constraint if exists notificaciones_tipo_check;
alter table notificaciones add constraint notificaciones_tipo_check
  check (tipo in (
    'mensaje', 'animal_similar', 'favorito', 'vacuna', 'promocion', 'renovacion',
    'reporte_resuelto', 'publicacion_retirada', 'apelacion_aceptada',
    'apelacion_rechazada', 'cuenta_suspendida', 'publicacion_rechazada'
  ));

-- ═══════════════ 6. PASO MANUAL — correr aparte, con tu propio valor ════════
-- Esto NO lo puede hacer una migración normal por rol/permisos; corre esta
-- línea suelta en el SQL Editor de Supabase. El valor de abajo es el mismo
-- que ya quedó puesto en .env.local (IA_MODERACION_SECRET) — si prefieres
-- generar uno propio, cámbialo en los dos lugares a la vez. En Render,
-- agrega la misma variable IA_MODERACION_SECRET junto a OPENAI_API_KEY:
--
--   alter database postgres set app.ia_moderacion_secreto = 'ae0d59873c72624b266da94452a84a122fb3f4dcb18a422de791837a8fe93ebf';
--
-- Sin este paso, ia_moderar_anuncio() siempre devuelve false y todo anuncio
-- nuevo se queda "en revisión" hasta que un moderador lo apruebe a mano —
-- degrada con seguridad, no se rompe nada mientras tanto.
