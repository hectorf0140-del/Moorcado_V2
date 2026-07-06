-- Tabla operativa de mensajes (chat) para la demo de Moorcado.
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
--
-- Se llama "chat_mensajes" (no "mensajes") porque ya existe una tabla
-- "mensajes" del esquema de producción (schema.sql) con Supabase Auth
-- real (auth.uid()) que esta app todavía no usa. Esta tabla es la
-- versión simple del MVP, igual que usuarios/anuncios.
--
-- A diferencia de usuarios/anuncios, aquí cada FILA es un mensaje
-- individual (no un blob por conversación), para poder ir agregando
-- mensajes sin reescribir todo el historial. `conversacion_id` agrupa
-- los mensajes entre dos usuarios (ver src/lib/mensajesDb.ts).

create table if not exists chat_mensajes (
  id text primary key,
  conversacion_id text not null,
  autor_id text not null,
  destinatario_id text not null,
  animal_id text,
  texto text not null,
  creado_en timestamptz not null default now()
);

create index if not exists chat_mensajes_conversacion_idx
  on chat_mensajes (conversacion_id, creado_en);

alter table chat_mensajes enable row level security;

create policy "lectura publica demo" on chat_mensajes
  for select using (true);

create policy "insercion publica demo" on chat_mensajes
  for insert with check (true);
