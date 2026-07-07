-- ⚠️ REEMPLAZADO por supabase/migracion_esquema.sql (renombra esta tabla
-- a `resenas` y le agrega llaves foráneas). Se conserva solo como
-- historial de cómo se creó originalmente — no lo vuelvas a correr.
--
-- Tabla operativa de reseñas para la demo de Moorcado.
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
--
-- Se llama "resenas_mvp" (no "resenas") porque ya existe una tabla
-- "resenas" del esquema de producción (schema.sql) con Supabase Auth
-- real (uuid + auth.uid()) que esta app todavía no usa. Igual patrón
-- que chat_mensajes vs. mensajes.
--
-- Cada FILA es una reseña individual (no un blob), agrupadas por
-- `objetivo_id` (el usuario reseñado). Ver src/lib/resenasDb.ts.

create table if not exists resenas_mvp (
  id text primary key,
  objetivo_id text not null,
  autor_id text not null,
  calificacion int not null check (calificacion between 1 and 5),
  texto text not null,
  creado_en timestamptz not null default now()
);

create index if not exists resenas_mvp_objetivo_idx
  on resenas_mvp (objetivo_id, creado_en);

alter table resenas_mvp enable row level security;

create policy "lectura publica demo" on resenas_mvp
  for select using (true);

create policy "insercion publica demo" on resenas_mvp
  for insert with check (true);
