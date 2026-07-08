-- Agrega políticas de DELETE (faltaban) para poder limpiar datos de prueba
-- desde el cliente anon, igual que ya se permite insert/update/select.
-- Ejecutar una sola vez en el SQL Editor de Supabase.

create policy "borrado publico demo" on usuarios for delete using (true);
create policy "borrado publico demo" on anuncios for delete using (true);
create policy "borrado publico demo" on mensajes for delete using (true);
create policy "borrado publico demo" on resenas for delete using (true);
create policy "borrado publico demo" on reportes for delete using (true);
