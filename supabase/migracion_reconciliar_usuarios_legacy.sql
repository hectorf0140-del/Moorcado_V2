-- Reconciliación de cuentas creadas antes de la migración a Supabase Auth real
-- (Fase 1). Esas filas de `usuarios` quedaron con un id generado en el
-- cliente (ej. 'u-1783571229716') en vez de un auth.uid() real, porque en su
-- momento no existía Supabase Auth todavía. Nunca se migraron.
--
-- Efecto visible de esto: activar_plan() (y cualquier otro RPC que haga
-- `where id = auth.uid()::text`) no encuentra la fila del usuario aunque su
-- sesión sea válida, y falla con "Usuario no encontrado" (visto en pantalla
-- como un 400). Pasa con casi todas las cuentas existentes hoy: de 13 filas
-- en `usuarios`, 12 tienen un id de este tipo.
--
-- Qué hace este script, por cada fila vieja:
--   1. Si el correo coincide con una cuenta real de auth.users: migra el id
--      viejo al id real en `usuarios` y en toda tabla que lo referencia
--      (incluyendo los campos duplicados dentro del jsonb `data`), para no
--      perder anuncios/mensajes/reseñas/etc. ya vinculados.
--   2. Si el correo NO tiene ninguna cuenta real detrás (datos de prueba de
--      esta sesión que nunca pasaron por un registro real): se borra la fila
--      y lo que quedó colgado de ella, porque nadie podrá autenticarse nunca
--      como ese id.
--
-- Ejecutar una sola vez en el SQL Editor de Supabase.

do $$
declare
  r record;
begin
  for r in
    select u.id as id_viejo, a.id::text as id_nuevo
    from usuarios u
    join auth.users a on a.email = u.correo
    where u.id <> a.id::text
  loop
    raise notice 'Reconciliando usuario % -> %', r.id_viejo, r.id_nuevo;

    update usuarios
    set id = r.id_nuevo,
        data = jsonb_set(data, '{id}', to_jsonb(r.id_nuevo))
    where id = r.id_viejo;

    update anuncios
    set vendedor_id = r.id_nuevo,
        data = jsonb_set(jsonb_set(data, '{vendedorId}', to_jsonb(r.id_nuevo)), '{vendorId}', to_jsonb(r.id_nuevo))
    where vendedor_id = r.id_viejo;

    update mensajes set autor_id = r.id_nuevo where autor_id = r.id_viejo;
    update mensajes set destinatario_id = r.id_nuevo where destinatario_id = r.id_viejo;
    update resenas set autor_id = r.id_nuevo where autor_id = r.id_viejo;
    update reportes set autor_id = r.id_nuevo where autor_id = r.id_viejo;
    update apelaciones set vendedor_id = r.id_nuevo where vendedor_id = r.id_viejo;
    update transacciones set comprador_id = r.id_nuevo where comprador_id = r.id_viejo;
    update transacciones set vendedor_id = r.id_nuevo where vendedor_id = r.id_viejo;
    update busquedas_guardadas set usuario_id = r.id_nuevo where usuario_id = r.id_viejo;
    update solicitudes_compra set comprador_id = r.id_nuevo where comprador_id = r.id_viejo;
    update notificaciones set usuario_id = r.id_nuevo where usuario_id = r.id_viejo;
  end loop;
end $$;

-- Lo que quedó sin ninguna cuenta real detrás: nunca podrá usarse, se limpia.
delete from anuncios where vendedor_id in (
  select id from usuarios u where not exists (select 1 from auth.users a where a.id::text = u.id)
);
delete from mensajes where autor_id in (
  select id from usuarios u where not exists (select 1 from auth.users a where a.id::text = u.id)
) or destinatario_id in (
  select id from usuarios u where not exists (select 1 from auth.users a where a.id::text = u.id)
);
delete from resenas where autor_id in (
  select id from usuarios u where not exists (select 1 from auth.users a where a.id::text = u.id)
);
delete from reportes where autor_id in (
  select id from usuarios u where not exists (select 1 from auth.users a where a.id::text = u.id)
);
delete from apelaciones where vendedor_id in (
  select id from usuarios u where not exists (select 1 from auth.users a where a.id::text = u.id)
);
delete from transacciones where comprador_id in (
  select id from usuarios u where not exists (select 1 from auth.users a where a.id::text = u.id)
) or vendedor_id in (
  select id from usuarios u where not exists (select 1 from auth.users a where a.id::text = u.id)
);
delete from busquedas_guardadas where usuario_id in (
  select id from usuarios u where not exists (select 1 from auth.users a where a.id::text = u.id)
);
delete from solicitudes_compra where comprador_id in (
  select id from usuarios u where not exists (select 1 from auth.users a where a.id::text = u.id)
);
delete from notificaciones where usuario_id in (
  select id from usuarios u where not exists (select 1 from auth.users a where a.id::text = u.id)
);
delete from usuarios u where not exists (
  select 1 from auth.users a where a.id::text = u.id
);
