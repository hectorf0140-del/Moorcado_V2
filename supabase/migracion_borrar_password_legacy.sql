-- Borra el campo "password" (texto plano) que quedó en usuarios.data desde
-- antes de la migración a Supabase Auth. Ese campo ya no lo escribe ningún
-- código actual (el registro/login usan supabase.auth.signUp/signInWithPassword,
-- que Supabase hashea del lado del servidor) — es un resto de cuentas legacy.
--
-- El SELECT de `usuarios` es público ("lectura publica demo": perfiles
-- visibles para cualquiera), así que este campo era legible por cualquiera
-- con la anon key. Ejecutar una sola vez en el SQL Editor de Supabase.

update usuarios
set data = data - 'password'
where data ? 'password';
