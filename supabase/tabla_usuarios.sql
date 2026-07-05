-- Tabla operativa de usuarios para la demo de Moorcado.
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
--
-- Igual que `anuncios`: cada usuario se guarda como JSONB. El esquema
-- de producción (Supabase Auth + tabla perfiles) vive en schema.sql.

create table if not exists usuarios (
  id text primary key,
  data jsonb not null,
  creado_en timestamptz not null default now()
);

alter table usuarios enable row level security;

create policy "lectura publica demo" on usuarios
  for select using (true);

create policy "insercion publica demo" on usuarios
  for insert with check (true);

create policy "actualizacion publica demo" on usuarios
  for update using (true);
