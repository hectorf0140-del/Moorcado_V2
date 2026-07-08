-- ⚠️ REEMPLAZADO por supabase/migracion_esquema.sql (renombra esta tabla
-- a `moderadores` y recrea la función verificar_moderador() apuntando al
-- nuevo nombre). Se conserva solo como historial — no lo vuelvas a correr.
--
-- Módulo de administración: tabla de moderadores + verificación segura.
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
--
-- A diferencia de usuarios/anuncios/etc., esta tabla NO tiene políticas
-- de lectura/escritura para el cliente (RLS habilitado sin policies =
-- nadie puede leer ni escribir directo, ni siquiera con la anon key).
-- El único acceso es a través de la función verificar_moderador(), que
-- corre con privilegios elevados (security definer) y solo devuelve
-- id/nombre cuando el correo y la contraseña coinciden. Así el panel
-- de administración deja de ser "cualquiera que entre a /admin" y pasa
-- a requerir credenciales reales que la app nunca puede leer.

create extension if not exists pgcrypto;

create table if not exists moderadores_mvp (
  id text primary key,
  correo text not null unique,
  password_hash text not null,
  nombre text not null,
  creado_en timestamptz not null default now()
);

alter table moderadores_mvp enable row level security;
-- Sin "create policy" a propósito: bloquea todo acceso directo (select/
-- insert/update/delete) desde el cliente, incluida la anon key.

create or replace function verificar_moderador(p_correo text, p_password text)
returns table (id text, nombre text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
    select m.id, m.nombre
    from moderadores_mvp m
    where lower(m.correo) = lower(p_correo)
      and m.password_hash = extensions.crypt(p_password, m.password_hash);
end;
$$;

grant execute on function verificar_moderador(text, text) to anon, authenticated;

-- ─── Para crear un moderador ────────────────────────────────────────────────
-- Ejecuta esto una vez por cada persona autorizada (cambia el correo,
-- la contraseña y el nombre). Nunca vuelvas a poder leer la contraseña
-- en texto plano después de esto — solo queda el hash.
--
-- insert into moderadores_mvp (id, correo, password_hash, nombre)
-- values (
--   'mod-1',
--   'admin@moorcado.hn',
--   extensions.crypt('TU_CONTRASENA_SEGURA', extensions.gen_salt('bf')),
--   'Nombre del Moderador'
-- );
