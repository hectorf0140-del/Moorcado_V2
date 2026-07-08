-- Parche NO destructivo: roles de moderación, reportes con seguimiento,
-- retiro de publicaciones por reporte, suspensión de cuentas, apelaciones
-- y notificaciones reales. Ejecutar en el SQL Editor de Supabase (una sola
-- vez). Sigue el mismo patrón que migracion_transacciones_patch.sql: solo
-- agrega columnas/tablas nuevas, nada se renombra ni se borra.

-- ══════════════ 1. Rol en `moderadores` (super_admin / moderador) ══════════
-- Las cuentas ya creadas quedan como 'super_admin' para no perder acceso
-- a nada de lo que ya podían hacer; las cuentas nuevas por defecto quedan
-- como 'moderador' (el rol más restringido), salvo que se especifique otra
-- cosa al crearlas.
alter table moderadores add column if not exists rol text;
update moderadores set rol = 'super_admin' where rol is null;
alter table moderadores alter column rol set not null;
alter table moderadores alter column rol set default 'moderador';
alter table moderadores
  add constraint moderadores_rol_check check (rol in ('super_admin', 'moderador'));

-- verificar_moderador() debe devolver también el rol. El tipo de retorno
-- cambia, así que hay que borrar y recrear la función (no hay `or replace`
-- posible cuando cambia el `returns table`); no afecta datos existentes.
drop function if exists verificar_moderador(text, text);
create function verificar_moderador(p_correo text, p_password text)
returns table (id text, nombre text, rol text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
    select m.id, m.nombre, m.rol
    from moderadores m
    where lower(m.correo) = lower(p_correo)
      and m.password_hash = extensions.crypt(p_password, m.password_hash);
end;
$$;

grant execute on function verificar_moderador(text, text) to anon, authenticated;

-- ══════════════ 2. Seguimiento y resolución de `reportes` ══════════════════
-- `numero` es un ticket incremental de verdad (bigserial: único y ordenado
-- por diseño). El `id` de texto existente (rep-<timestamp>) no se toca.
alter table reportes add column if not exists numero bigserial;
alter table reportes add column if not exists moderador_id text;
alter table reportes add column if not exists moderador_nombre text;
alter table reportes add column if not exists resolucion_detalle text;

alter table reportes
  add constraint reportes_moderador_id_fkey
  foreign key (moderador_id) references moderadores (id) on delete set null;

-- ══════════════ 3. Retiro de `anuncios` por moderación ═════════════════════
-- Distingue "el vendedor lo pausó" de "un moderador lo bajó por un reporte",
-- para poder habilitar apelaciones solo en el segundo caso.
alter table anuncios add column if not exists retirado_por_moderacion boolean not null default false;
alter table anuncios add column if not exists retirado_motivo text;
alter table anuncios add column if not exists retirado_reporte_id text;

alter table anuncios
  add constraint anuncios_retirado_reporte_id_fkey
  foreign key (retirado_reporte_id) references reportes (id) on delete set null;

-- ══════════════ 4. Suspensión de cuentas en `usuarios` ═════════════════════
alter table usuarios add column if not exists estado_cuenta text not null default 'activo';
alter table usuarios add column if not exists estado_cuenta_motivo text;
alter table usuarios
  add constraint usuarios_estado_cuenta_check check (estado_cuenta in ('activo', 'suspendido'));

-- ══════════════ 5. Nueva tabla: apelaciones ═════════════════════════════════
create table if not exists apelaciones (
  id text primary key,
  anuncio_id text not null references anuncios (id) on delete cascade,
  reporte_id text references reportes (id) on delete set null,
  vendedor_id text not null references usuarios (id) on delete cascade,
  motivo text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptada', 'rechazada')),
  moderador_id text references moderadores (id) on delete set null,
  moderador_nombre text,
  resolucion_detalle text,
  creado_en timestamptz not null default now(),
  resuelto_en timestamptz
);

create index if not exists apelaciones_estado_idx on apelaciones (estado, creado_en);
create index if not exists apelaciones_anuncio_idx on apelaciones (anuncio_id);

alter table apelaciones enable row level security;

create policy "lectura publica demo" on apelaciones
  for select using (true);

create policy "insercion publica demo" on apelaciones
  for insert with check (true);

create policy "actualizacion publica demo" on apelaciones
  for update using (true);

-- ══════════════ 6. Nueva tabla: notificaciones ══════════════════════════════
-- Esta app no usa Supabase Auth (autenticación propia con ids de texto),
-- así que RLS queda abierta igual que el resto de tablas del proyecto, no
-- basada en auth.uid().
create table if not exists notificaciones (
  id text primary key,
  usuario_id text not null references usuarios (id) on delete cascade,
  tipo text not null check (tipo in (
    'mensaje', 'animal_similar', 'favorito', 'vacuna', 'promocion', 'renovacion',
    'reporte_resuelto', 'publicacion_retirada', 'apelacion_aceptada',
    'apelacion_rechazada', 'cuenta_suspendida'
  )),
  titulo text not null,
  descripcion text,
  referencia_id text,
  leida boolean not null default false,
  creado_en timestamptz not null default now()
);

create index if not exists notificaciones_usuario_idx on notificaciones (usuario_id, creado_en desc);

alter table notificaciones enable row level security;

create policy "lectura publica demo" on notificaciones
  for select using (true);

create policy "insercion publica demo" on notificaciones
  for insert with check (true);

create policy "actualizacion publica demo" on notificaciones
  for update using (true);
