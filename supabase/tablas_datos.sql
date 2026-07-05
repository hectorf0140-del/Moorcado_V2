-- Migración: mensajes, favoritos y transacciones a Supabase
-- + mejoras de integridad e índices. Ejecutar una sola vez.

-- ─── MENSAJES (hilos de chat por usuario+animal) ─────────────────
create table if not exists mensajes (
  id text primary key,
  usuario_id text not null,
  animal_id text not null,
  data jsonb not null,
  creado_en timestamptz not null default now()
);
create index if not exists mensajes_usuario_idx on mensajes (usuario_id, animal_id);

alter table mensajes enable row level security;
create policy "lectura publica demo" on mensajes for select using (true);
create policy "insercion publica demo" on mensajes for insert with check (true);
create policy "actualizacion publica demo" on mensajes for update using (true);

-- ─── FAVORITOS (por usuario) ─────────────────────────────────────
create table if not exists favoritos (
  usuario_id text not null,
  animal_id text not null,
  creado_en timestamptz not null default now(),
  primary key (usuario_id, animal_id)
);

alter table favoritos enable row level security;
create policy "lectura publica demo" on favoritos for select using (true);
create policy "insercion publica demo" on favoritos for insert with check (true);
create policy "borrado publico demo" on favoritos for delete using (true);

-- ─── TRANSACCIONES ───────────────────────────────────────────────
create table if not exists transacciones (
  id text primary key,
  data jsonb not null,
  creado_en timestamptz not null default now()
);

alter table transacciones enable row level security;
create policy "lectura publica demo" on transacciones for select using (true);
create policy "insercion publica demo" on transacciones for insert with check (true);

-- ─── MEJORAS DE INTEGRIDAD E ÍNDICES ─────────────────────────────
-- Correo único (evita cuentas duplicadas aunque dos se registren a la vez)
create unique index if not exists usuarios_correo_unico
  on usuarios ((lower(data->>'correo')));

-- Índices para el catálogo (filtros por raza/departamento y orden por fecha)
create index if not exists anuncios_creado_idx on anuncios (creado_en desc);
create index if not exists anuncios_raza_idx on anuncios ((data->>'raza'));
create index if not exists anuncios_depto_idx on anuncios ((data->>'departamento'));

-- Validaciones mínimas del JSON de anuncios
alter table anuncios drop constraint if exists anuncios_data_valida;
alter table anuncios add constraint anuncios_data_valida
  check (data ? 'raza' and data ? 'precio' and (data->>'precio')::numeric >= 0);
