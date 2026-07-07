-- Migración: consolida el esquema de Supabase en un solo set de tablas
-- bien relacionadas. Ejecutar en el SQL Editor de Supabase (una sola vez).
--
-- Reemplaza a tabla_mensajes.sql / tabla_resenas.sql / tabla_reportes.sql /
-- tabla_moderadores.sql (se conservan esos archivos solo como historial).
--
-- Qué hace, en orden:
--   1. Elimina las tablas del esquema "de producción" (schema.sql) que
--      nunca se usaron — estaban vacías y sin código que las tocara. Solo
--      existían para forzar los nombres _mvp/chat_ del resto de tablas.
--   2. Renombra las tablas MVP a nombres limpios, ya sin colisión.
--   3. Promueve columnas clave (correo, vendedor_id) de JSONB a columnas
--      reales, y agrega llaves foráneas entre todas las tablas en uso.
--   4. Crea la tabla `transacciones` (antes solo vivía en localStorage).

-- ══════════════ 1. Retirar el esquema de producción no usado ══════════════
drop table if exists hato_eventos cascade;
drop table if exists hato_animales cascade;
drop table if exists suscripciones cascade;
drop table if exists notificaciones cascade;
drop table if exists mensajes cascade;
drop table if exists conversaciones cascade;
drop table if exists resenas cascade;
drop table if exists favoritos cascade;
drop table if exists reportes cascade;
drop table if exists animal_historial_veterinario cascade;
drop table if exists animal_desparasitaciones cascade;
drop table if exists animal_vacunas cascade;
drop table if exists animal_documentos cascade;
drop table if exists animal_videos cascade;
drop table if exists animal_fotos cascade;
drop table if exists animales cascade;
drop table if exists perfiles cascade;

-- ══════════════ 2. Renombrar tablas MVP a nombres limpios ══════════════════
alter table if exists chat_mensajes rename to mensajes;
alter table if exists resenas_mvp rename to resenas;
alter table if exists reportes_mvp rename to reportes;
alter table if exists moderadores_mvp rename to moderadores;

alter index if exists chat_mensajes_conversacion_idx rename to mensajes_conversacion_idx;
alter index if exists resenas_mvp_objetivo_idx rename to resenas_objetivo_idx;
alter index if exists reportes_mvp_estado_idx rename to reportes_estado_idx;

-- La función verificar_moderador() consulta la tabla por nombre en su
-- cuerpo (moderadores_mvp) — hay que recrearla apuntando al nuevo nombre,
-- si no, se queda rota tras el rename.
create or replace function verificar_moderador(p_correo text, p_password text)
returns table (id text, nombre text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
    select m.id, m.nombre
    from moderadores m
    where lower(m.correo) = lower(p_correo)
      and m.password_hash = extensions.crypt(p_password, m.password_hash);
end;
$$;

grant execute on function verificar_moderador(text, text) to anon, authenticated;

-- ══════════════ 3. Promover columnas clave + llaves foráneas ═══════════════

-- usuarios.correo: columna real única (antes solo vivía dentro de `data`)
alter table usuarios add column if not exists correo text;
update usuarios set correo = data->>'correo' where correo is null;
alter table usuarios alter column correo set not null;
alter table usuarios add constraint usuarios_correo_key unique (correo);

-- anuncios.vendedor_id: columna real con FK a usuarios
alter table anuncios add column if not exists vendedor_id text;
update anuncios set vendedor_id = data->>'vendedorId' where vendedor_id is null;
alter table anuncios alter column vendedor_id set not null;
alter table anuncios
  add constraint anuncios_vendedor_id_fkey
  foreign key (vendedor_id) references usuarios (id) on delete cascade;

-- mensajes: ya tenía columnas reales, solo faltan las FKs
alter table mensajes
  add constraint mensajes_autor_id_fkey
  foreign key (autor_id) references usuarios (id) on delete cascade;
alter table mensajes
  add constraint mensajes_destinatario_id_fkey
  foreign key (destinatario_id) references usuarios (id) on delete cascade;
alter table mensajes
  add constraint mensajes_animal_id_fkey
  foreign key (animal_id) references anuncios (id) on delete set null;

-- resenas: ya tenía columnas reales, solo faltan las FKs
alter table resenas
  add constraint resenas_autor_id_fkey
  foreign key (autor_id) references usuarios (id) on delete cascade;
alter table resenas
  add constraint resenas_objetivo_id_fkey
  foreign key (objetivo_id) references usuarios (id) on delete cascade;

-- reportes: solo autor_id tiene FK (objetivo_id es polimórfico según `tipo`)
alter table reportes
  add constraint reportes_autor_id_fkey
  foreign key (autor_id) references usuarios (id) on delete cascade;

-- ══════════════ 4. Nueva tabla: transacciones (ventas reales) ══════════════
-- NOTA: en la práctica esta tabla ya existía (creada por otro entorno que
-- trabaja sobre la misma base de datos, con el patrón JSONB viejo), así
-- que este CREATE TABLE nunca llegó a ejecutarse. Ver
-- supabase/migracion_transacciones_patch.sql para el ajuste real que sí
-- se aplicó (agrega columnas sin romper lo que ya había).
create table if not exists transacciones (
  id text primary key,
  animal_id text not null references anuncios (id) on delete cascade,
  comprador_id text not null references usuarios (id) on delete cascade,
  vendedor_id text not null references usuarios (id) on delete cascade,
  precio numeric not null check (precio > 0),
  fecha timestamptz not null default now()
);

create index if not exists transacciones_vendedor_idx on transacciones (vendedor_id, fecha);
create index if not exists transacciones_comprador_idx on transacciones (comprador_id, fecha);

alter table transacciones enable row level security;

create policy "lectura publica demo" on transacciones
  for select using (true);

create policy "insercion publica demo" on transacciones
  for insert with check (true);
