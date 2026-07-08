-- Parche NO destructivo: completa lo que quedó pendiente de
-- migracion_roles_moderacion.sql. Ejecutar en el SQL Editor de Supabase
-- (una sola vez).
--
-- Diagnóstico (vía errores reales de la API REST contra esta base de
-- datos): de ese archivo, solo la parte 1 (rol en `moderadores` y la
-- función `verificar_moderador`) llegó a aplicarse. Las partes 2 a 6
-- nunca se ejecutaron, así que hasta ahora estaban silenciosamente
-- rotas en producción:
--   • Los reportes no tenían número de ticket (`reportes.numero`).
--   • No se podía distinguir una publicación pausada por su dueño de una
--     retirada por moderación (`anuncios.retirado_por_moderacion`).
--   • Suspender una cuenta no tenía dónde guardarse (`usuarios.estado_cuenta`)
--     — esto además causaba un 400 al registrar o actualizar cualquier
--     usuario, porque el código sí intenta guardar esa columna.
--   • La tabla `apelaciones` no existía.
--   • La tabla `notificaciones` no existía — el sistema de notificaciones
--     (favoritos, apelaciones, etc.) no funcionaba en absoluto.
--
-- Este script agrega exactamente esas partes 2-6, usando `if not exists`
-- y bloques con manejo de duplicados para que sea seguro de correr aunque
-- alguna pieza ya se haya creado a mano.

-- ══════════════ 2. Seguimiento y resolución de `reportes` ══════════════════
alter table reportes add column if not exists numero bigserial;
alter table reportes add column if not exists moderador_id text;
alter table reportes add column if not exists moderador_nombre text;
alter table reportes add column if not exists resolucion_detalle text;

do $$
begin
  alter table reportes
    add constraint reportes_moderador_id_fkey
    foreign key (moderador_id) references moderadores (id) on delete set null;
exception
  when duplicate_object then null;
end $$;

-- ══════════════ 3. Retiro de `anuncios` por moderación ═════════════════════
alter table anuncios add column if not exists retirado_por_moderacion boolean not null default false;
alter table anuncios add column if not exists retirado_motivo text;
alter table anuncios add column if not exists retirado_reporte_id text;

do $$
begin
  alter table anuncios
    add constraint anuncios_retirado_reporte_id_fkey
    foreign key (retirado_reporte_id) references reportes (id) on delete set null;
exception
  when duplicate_object then null;
end $$;

-- ══════════════ 4. Suspensión de cuentas en `usuarios` ═════════════════════
alter table usuarios add column if not exists estado_cuenta text not null default 'activo';
alter table usuarios add column if not exists estado_cuenta_motivo text;

do $$
begin
  alter table usuarios
    add constraint usuarios_estado_cuenta_check check (estado_cuenta in ('activo', 'suspendido'));
exception
  when duplicate_object then null;
end $$;

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

do $$ begin
  create policy "lectura publica demo" on apelaciones for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "insercion publica demo" on apelaciones for insert with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "actualizacion publica demo" on apelaciones for update using (true);
exception when duplicate_object then null; end $$;

-- ══════════════ 6. Nueva tabla: notificaciones ══════════════════════════════
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

do $$ begin
  create policy "lectura publica demo" on notificaciones for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "insercion publica demo" on notificaciones for insert with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "actualizacion publica demo" on notificaciones for update using (true);
exception when duplicate_object then null; end $$;
