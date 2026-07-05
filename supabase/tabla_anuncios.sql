-- Tabla operativa de anuncios para la demo de Moorcado.
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
--
-- Guarda cada anuncio completo como JSONB para que la app lo lea y
-- escriba directamente. El esquema relacional completo de producción
-- vive en schema.sql; esta tabla es la capa simple que usa el MVP.

create table if not exists anuncios (
  id text primary key,
  data jsonb not null,
  creado_en timestamptz not null default now()
);

alter table anuncios enable row level security;

-- Políticas abiertas para la demo (el MVP no usa Supabase Auth todavía;
-- en producción se restringirían con auth.uid() como en schema.sql).
create policy "lectura publica" on anuncios
  for select using (true);

create policy "insercion publica demo" on anuncios
  for insert with check (true);

create policy "actualizacion publica demo" on anuncios
  for update using (true);
