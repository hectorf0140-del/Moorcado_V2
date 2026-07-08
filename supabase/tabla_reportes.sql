-- ⚠️ REEMPLAZADO por supabase/migracion_esquema.sql (renombra esta tabla
-- a `reportes` y le agrega llaves foráneas). Se conserva solo como
-- historial de cómo se creó originalmente — no lo vuelvas a correr.
--
-- Tabla operativa de reportes para la demo de Moorcado.
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
--
-- Se llama "reportes_mvp" (no "reportes") porque ya existe una tabla
-- "reportes" del esquema de producción (schema.sql). Igual patrón que
-- chat_mensajes/resenas_mvp: lectura e inserción abiertas para el MVP,
-- la actualización de estado (resolver/descartar) queda reservada al
-- panel de administración en la práctica (no hay Auth real todavía).

create table if not exists reportes_mvp (
  id text primary key,
  tipo text not null check (tipo in ('publicacion', 'chat', 'usuario')),
  objetivo_id text not null,
  autor_id text not null,
  motivo text not null,
  detalle text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'resuelto', 'descartado')),
  creado_en timestamptz not null default now()
);

create index if not exists reportes_mvp_estado_idx
  on reportes_mvp (estado, creado_en);

alter table reportes_mvp enable row level security;

create policy "lectura publica demo" on reportes_mvp
  for select using (true);

create policy "insercion publica demo" on reportes_mvp
  for insert with check (true);

create policy "actualizacion publica demo" on reportes_mvp
  for update using (true);
