-- Fase 2 de seguridad: RLS por dueño (auth.uid()) + RPCs de moderación y
-- activación de plan. Ejecutar en el SQL Editor de Supabase (una sola vez).
-- Requiere que Fase 1 (migración a Supabase Auth) ya esté en producción:
-- usuarios.id ahora es auth.uid()::text para cuentas nuevas.
--
-- Qué hace, en orden:
--   1. Reescribe las políticas RLS de "using (true)" a "auth.uid() = dueño"
--      en cada tabla, manteniendo públicas solo las lecturas que el
--      producto realmente necesita (catálogo, reseñas, etc.).
--   2. Triggers de campos protegidos en `usuarios` y `anuncios`: RLS es por
--      fila, no por columna, así que sin esto el propio dueño podría seguir
--      escribiéndose plan/verificado/tipo o des-retirar su publicación.
--   3. Tabla `moderador_sesiones` + token en verificar_moderador(): los
--      moderadores no usan Supabase Auth, así que no tienen auth.uid() —
--      se les da un token de sesión propio para las funciones de abajo.
--   4. RPCs security definer para cada acción de moderador (suspender,
--      reactivar, verificar cuenta; resolver reporte/apelación; retirar,
--      reactivar publicación) y para activar un plan (self-service).
--
-- Fuera de alcance a propósito: la LECTURA de reportes/apelaciones sigue
-- siendo pública (using(true)) — los moderadores no tienen auth.uid(), así
-- que RLS no puede distinguir "es moderador" de "es cualquiera" en un
-- SELECT. Cerrarlo requeriría RPCs de lectura también verificadas por
-- token; se deja para una fase futura si se decide abordarlo.

-- ═══════════════════════ 1. RLS por dueño, tabla por tabla ═══════════════════

-- ── usuarios ─────────────────────────────────────────────────────────────────
-- SELECT se queda pública a propósito (nombre/avatar/calificación de
-- vendedores se muestran en catálogo/reseñas sin necesitar sesión).
drop policy if exists "insercion publica demo" on usuarios;
drop policy if exists "actualizacion publica demo" on usuarios;
drop policy if exists "borrado publico demo" on usuarios;

create policy "insercion propia" on usuarios
  for insert with check (auth.uid()::text = id);
create policy "actualizacion propia" on usuarios
  for update using (auth.uid()::text = id) with check (auth.uid()::text = id);
create policy "borrado propio" on usuarios
  for delete using (auth.uid()::text = id);

-- ── anuncios ─────────────────────────────────────────────────────────────────
-- SELECT se queda pública (catálogo/mapa deben verse sin sesión).
drop policy if exists "insercion publica demo" on anuncios;
drop policy if exists "actualizacion publica demo" on anuncios;
drop policy if exists "borrado publico demo" on anuncios;

create policy "insercion propia" on anuncios
  for insert with check (auth.uid()::text = vendedor_id);
create policy "actualizacion propia" on anuncios
  for update using (auth.uid()::text = vendedor_id) with check (auth.uid()::text = vendedor_id);
create policy "borrado propio" on anuncios
  for delete using (auth.uid()::text = vendedor_id);

-- ── mensajes ─────────────────────────────────────────────────────────────────
-- El fix de privacidad más importante de esta migración: hoy cualquiera con
-- la anon key puede leer TODOS los chats de TODOS los usuarios.
drop policy if exists "lectura publica demo" on mensajes;
drop policy if exists "insercion publica demo" on mensajes;
drop policy if exists "borrado publico demo" on mensajes;

create policy "lectura propia" on mensajes
  for select using (auth.uid()::text = autor_id or auth.uid()::text = destinatario_id);
create policy "insercion propia" on mensajes
  for insert with check (auth.uid()::text = autor_id);
-- No existía política de UPDATE (bug preexistente: marcar como leído nunca
-- pudo funcionar de verdad). Esta la habilita, restringida al destinatario.
create policy "marcar leido propio" on mensajes
  for update using (auth.uid()::text = destinatario_id) with check (auth.uid()::text = destinatario_id);
create policy "borrado propio" on mensajes
  for delete using (auth.uid()::text = autor_id);

-- ── resenas ──────────────────────────────────────────────────────────────────
-- SELECT se queda pública (prueba social).
drop policy if exists "insercion publica demo" on resenas;
drop policy if exists "borrado publico demo" on resenas;

create policy "insercion propia" on resenas
  for insert with check (auth.uid()::text = autor_id);
create policy "borrado propio" on resenas
  for delete using (auth.uid()::text = autor_id);

-- ── reportes ─────────────────────────────────────────────────────────────────
-- SELECT se queda pública (el panel de moderador necesita ver todos — ver
-- nota de "fuera de alcance" arriba). UPDATE se elimina por completo: de
-- ahora en adelante solo se resuelve un reporte a través de
-- moderador_resolver_reporte() (más abajo).
drop policy if exists "insercion publica demo" on reportes;
drop policy if exists "actualizacion publica demo" on reportes;
drop policy if exists "borrado publico demo" on reportes;

create policy "insercion propia" on reportes
  for insert with check (auth.uid()::text = autor_id);
create policy "borrado propio" on reportes
  for delete using (auth.uid()::text = autor_id);

-- ── apelaciones ──────────────────────────────────────────────────────────────
-- Mismo caso que reportes: UPDATE solo vía moderador_resolver_apelacion().
drop policy if exists "insercion publica demo" on apelaciones;
drop policy if exists "actualizacion publica demo" on apelaciones;

create policy "insercion propia" on apelaciones
  for insert with check (auth.uid()::text = vendedor_id);

-- ── transacciones ────────────────────────────────────────────────────────────
drop policy if exists "lectura publica demo" on transacciones;
drop policy if exists "insercion publica demo" on transacciones;

create policy "lectura propia" on transacciones
  for select using (auth.uid()::text = comprador_id or auth.uid()::text = vendedor_id);
create policy "insercion propia" on transacciones
  for insert with check (auth.uid()::text = vendedor_id);

-- ── busquedas_guardadas ──────────────────────────────────────────────────────
-- SELECT se queda pública: notificarBusquedasCoincidentes (useAppStore.ts)
-- necesita leer las búsquedas de OTROS usuarios para avisarles cuando un
-- anuncio nuevo hace match con su alerta.
drop policy if exists "insercion publica demo" on busquedas_guardadas;
drop policy if exists "borrado publico demo" on busquedas_guardadas;

create policy "insercion propia" on busquedas_guardadas
  for insert with check (auth.uid()::text = usuario_id);
create policy "borrado propio" on busquedas_guardadas
  for delete using (auth.uid()::text = usuario_id);

-- ── solicitudes_compra ───────────────────────────────────────────────────────
-- SELECT se queda pública: es un tablón "Busco X" que otros vendedores
-- deben poder ver.
drop policy if exists "insercion publica demo" on solicitudes_compra;
drop policy if exists "actualizacion publica demo" on solicitudes_compra;
drop policy if exists "borrado publico demo" on solicitudes_compra;

create policy "insercion propia" on solicitudes_compra
  for insert with check (auth.uid()::text = comprador_id);
create policy "actualizacion propia" on solicitudes_compra
  for update using (auth.uid()::text = comprador_id) with check (auth.uid()::text = comprador_id);
create policy "borrado propio" on solicitudes_compra
  for delete using (auth.uid()::text = comprador_id);

-- ── notificaciones ───────────────────────────────────────────────────────────
-- INSERT se queda pública: una notificación se crea desde la sesión de OTRO
-- usuario (quien da like, quien publica algo que hace match), no desde la
-- del destinatario.
drop policy if exists "lectura publica demo" on notificaciones;
drop policy if exists "actualizacion publica demo" on notificaciones;

create policy "lectura propia" on notificaciones
  for select using (auth.uid()::text = usuario_id);
create policy "marcar leida propia" on notificaciones
  for update using (auth.uid()::text = usuario_id) with check (auth.uid()::text = usuario_id);

-- ═══════════════════ 2. Triggers de campos protegidos ═══════════════════════
-- RLS es por fila, no por columna: aunque ya solo el dueño pueda hacer
-- update de su propia fila, sin esto podría seguir escribiéndose
-- plan/verificado/tipo, o des-retirar su propia publicación moderada. Los
-- RPCs de abajo activan `app.bypass_proteccion` antes de tocar estos campos;
-- cualquier otro update (el del propio dueño editando su perfil normal, por
-- ejemplo) los deja intactos.

create or replace function usuarios_proteger_campos()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('app.bypass_proteccion', true), '') <> 'on' then
    new.estado_cuenta := old.estado_cuenta;
    new.estado_cuenta_motivo := old.estado_cuenta_motivo;
    new.data := jsonb_set(new.data, '{plan}', coalesce(old.data->'plan', 'null'::jsonb));
    new.data := jsonb_set(new.data, '{verificado}', coalesce(old.data->'verificado', 'null'::jsonb));
    new.data := jsonb_set(new.data, '{tipo}', coalesce(old.data->'tipo', 'null'::jsonb));
  end if;
  return new;
end;
$$;

drop trigger if exists usuarios_proteger_campos_trigger on usuarios;
create trigger usuarios_proteger_campos_trigger
  before update on usuarios
  for each row execute function usuarios_proteger_campos();

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
  end if;
  return new;
end;
$$;

drop trigger if exists anuncios_proteger_campos_trigger on anuncios;
create trigger anuncios_proteger_campos_trigger
  before update on anuncios
  for each row execute function anuncios_proteger_campos();

-- ═══════════ 3. Sesión de moderador (token) y verificar_moderador() ══════════
-- Los moderadores no usan Supabase Auth — siguen con su propio login por
-- RPC. Se les da un token de sesión propio para poder llamar las funciones
-- de la sección 4 sin volver a mandar la contraseña en cada acción.

create table if not exists moderador_sesiones (
  token uuid primary key default gen_random_uuid(),
  moderador_id text not null references moderadores (id) on delete cascade,
  rol text not null,
  creado_en timestamptz not null default now(),
  expira_en timestamptz not null default now() + interval '12 hours'
);

alter table moderador_sesiones enable row level security;
-- Sin "create policy" a propósito, igual que `moderadores`: bloquea todo
-- acceso directo desde el cliente. Solo se llega a esta tabla a través de
-- las funciones security definer de abajo.

drop function if exists verificar_moderador(text, text);
create function verificar_moderador(p_correo text, p_password text)
returns table (id text, nombre text, rol text, token uuid)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id text;
  v_nombre text;
  v_rol text;
  v_token uuid;
begin
  select m.id, m.nombre, m.rol into v_id, v_nombre, v_rol
  from moderadores m
  where lower(m.correo) = lower(p_correo)
    and m.password_hash = extensions.crypt(p_password, m.password_hash);

  if v_id is null then
    return;
  end if;

  insert into moderador_sesiones (moderador_id, rol)
  values (v_id, v_rol)
  returning moderador_sesiones.token into v_token;

  return query select v_id, v_nombre, v_rol, v_token;
end;
$$;

grant execute on function verificar_moderador(text, text) to anon, authenticated;

-- Helper interno (no se llama desde el cliente): valida un token y devuelve
-- el moderador_id/rol dueño, o lanza una excepción si es inválido/expiró.
-- La reutilizan todas las funciones de la sección 4.
create or replace function _moderador_desde_token(p_token uuid, out moderador_id text, out rol text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  select s.moderador_id, s.rol into moderador_id, rol
  from moderador_sesiones s
  where s.token = p_token and s.expira_en > now();

  if moderador_id is null then
    raise exception 'Sesión de moderador inválida o expirada';
  end if;
end;
$$;

-- ═══════════════════ 4. RPCs de moderación y de plan ═════════════════════════

create or replace function moderador_suspender_usuario(p_token uuid, p_usuario_id text, p_motivo text)
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

  update usuarios
  set estado_cuenta = 'suspendido',
      estado_cuenta_motivo = p_motivo,
      data = jsonb_set(jsonb_set(data, '{estadoCuenta}', '"suspendido"'), '{estadoCuentaMotivo}', to_jsonb(p_motivo))
  where id = p_usuario_id;

  -- Cascada: desactiva de una vez los anuncios activos de ese vendedor
  -- (antes era un loop duplicado en el cliente).
  update anuncios
  set data = jsonb_set(data, '{activo}', 'false')
  where vendedor_id = p_usuario_id
    and coalesce((data->>'activo')::boolean, true) = true;

  return true;
end;
$$;

grant execute on function moderador_suspender_usuario(uuid, text, text) to anon, authenticated;

create or replace function moderador_reactivar_usuario(p_token uuid, p_usuario_id text)
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

  update usuarios
  set estado_cuenta = 'activo',
      estado_cuenta_motivo = null,
      data = jsonb_set(data, '{estadoCuenta}', '"activo"') - 'estadoCuentaMotivo'
  where id = p_usuario_id;

  return true;
end;
$$;

grant execute on function moderador_reactivar_usuario(uuid, text) to anon, authenticated;

create or replace function moderador_verificar_usuario(p_token uuid, p_usuario_id text)
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

  update usuarios
  set data = jsonb_set(jsonb_set(data, '{verificado}', 'true'), '{verificacionSolicitada}', 'false')
  where id = p_usuario_id;

  return true;
end;
$$;

grant execute on function moderador_verificar_usuario(uuid, text) to anon, authenticated;

-- Rechazar una solicitud de verificación sin verificar la cuenta: solo
-- limpia la bandera de "pendiente" (no toca `verificado`, así que no
-- necesita tocar campos protegidos, pero sigue siendo la fila de OTRO
-- usuario — RLS igual la bloquearía sin este RPC).
create or replace function moderador_rechazar_verificacion(p_token uuid, p_usuario_id text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_moderador_id text;
begin
  select moderador_id into v_moderador_id from _moderador_desde_token(p_token);

  update usuarios
  set data = jsonb_set(data, '{verificacionSolicitada}', 'false')
  where id = p_usuario_id;

  return true;
end;
$$;

grant execute on function moderador_rechazar_verificacion(uuid, text) to anon, authenticated;

create or replace function moderador_resolver_reporte(
  p_token uuid,
  p_reporte_id text,
  p_estado text,
  p_resolucion_detalle text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_moderador_id text;
  v_moderador_nombre text;
begin
  select moderador_id into v_moderador_id from _moderador_desde_token(p_token);

  if p_estado not in ('resuelto', 'descartado') then
    raise exception 'Estado de reporte inválido: %', p_estado;
  end if;

  select nombre into v_moderador_nombre from moderadores where id = v_moderador_id;

  update reportes
  set estado = p_estado,
      moderador_id = v_moderador_id,
      moderador_nombre = v_moderador_nombre,
      resolucion_detalle = p_resolucion_detalle
  where id = p_reporte_id;

  return true;
end;
$$;

grant execute on function moderador_resolver_reporte(uuid, text, text, text) to anon, authenticated;

create or replace function moderador_resolver_apelacion(
  p_token uuid,
  p_apelacion_id text,
  p_estado text,
  p_resolucion_detalle text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_moderador_id text;
  v_moderador_nombre text;
begin
  select moderador_id into v_moderador_id from _moderador_desde_token(p_token);

  if p_estado not in ('aceptada', 'rechazada') then
    raise exception 'Estado de apelación inválido: %', p_estado;
  end if;

  select nombre into v_moderador_nombre from moderadores where id = v_moderador_id;

  update apelaciones
  set estado = p_estado,
      moderador_id = v_moderador_id,
      moderador_nombre = v_moderador_nombre,
      resolucion_detalle = p_resolucion_detalle,
      resuelto_en = now()
  where id = p_apelacion_id;

  return true;
end;
$$;

grant execute on function moderador_resolver_apelacion(uuid, text, text, text) to anon, authenticated;

create or replace function moderador_retirar_anuncio(
  p_token uuid,
  p_anuncio_id text,
  p_motivo text,
  p_reporte_id text
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
  set retirado_por_moderacion = true,
      retirado_motivo = p_motivo,
      retirado_reporte_id = p_reporte_id,
      data = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(data, '{activo}', 'false'),
            '{retiradoPorModeracion}', 'true'
          ),
          '{retiradoMotivo}', to_jsonb(p_motivo)
        ),
        '{retiradoReporteId}', to_jsonb(p_reporte_id)
      )
  where id = p_anuncio_id;

  return true;
end;
$$;

grant execute on function moderador_retirar_anuncio(uuid, text, text, text) to anon, authenticated;

create or replace function moderador_reactivar_anuncio(p_token uuid, p_anuncio_id text)
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
  set retirado_por_moderacion = false,
      retirado_motivo = null,
      retirado_reporte_id = null,
      data = jsonb_set(
        jsonb_set(
          (data - 'retiradoMotivo' - 'retiradoReporteId'),
          '{activo}', 'true'
        ),
        '{retiradoPorModeracion}', 'false'
      )
  where id = p_anuncio_id;

  return true;
end;
$$;

grant execute on function moderador_reactivar_anuncio(uuid, text) to anon, authenticated;

-- ── activar_plan: self-service, sin pasarela real todavía ────────────────────
-- Reemplaza la única barrera actual de "Premium solo para empresa", que hoy
-- es puramente de UI (PlanesClient.tsx). No cobra nada — solo asegura que
-- nadie pueda ponerse premium sin cumplir la regla de negocio.
create or replace function activar_plan(p_plan text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_tipo text;
begin
  if p_plan not in ('gratuito', 'basico', 'premium') then
    raise exception 'Plan inválido: %', p_plan;
  end if;

  select data->>'tipo' into v_tipo from usuarios where id = auth.uid()::text;

  if v_tipo is null then
    raise exception 'Usuario no encontrado';
  end if;

  if p_plan = 'premium' and v_tipo <> 'empresa' then
    raise exception 'El plan Premium solo está disponible para cuentas Empresa';
  end if;

  perform set_config('app.bypass_proteccion', 'on', true);

  update usuarios
  set data = jsonb_set(data, '{plan}', to_jsonb(p_plan))
  where id = auth.uid()::text;

  return true;
end;
$$;

grant execute on function activar_plan(text) to authenticated;
