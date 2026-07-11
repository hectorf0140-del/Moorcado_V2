-- Bucket de Storage para fotos de anuncios. Reemplaza el guardado anterior
-- de fotos como base64 dentro del JSONB de `anuncios`, que llenaba el
-- localStorage del navegador y hacía lentas/inestables las cargas del
-- catálogo. Ejecutar en el SQL Editor de Supabase (una sola vez).

insert into storage.buckets (id, name, public)
values ('fotos-anuncios', 'fotos-anuncios', true)
on conflict (id) do nothing;

-- Esta app no usa Supabase Auth (la sesión es propia, manejada en el
-- cliente) — mismo modelo de "confianza en el cliente" que el resto de las
-- tablas del proyecto (busquedas_guardadas, solicitudes_compra), políticas
-- públicas en vez de basadas en auth.uid().
do $$ begin
  create policy "lectura publica fotos anuncios"
    on storage.objects for select
    using (bucket_id = 'fotos-anuncios');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "subida publica fotos anuncios"
    on storage.objects for insert
    with check (bucket_id = 'fotos-anuncios');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "borrado publico fotos anuncios"
    on storage.objects for delete
    using (bucket_id = 'fotos-anuncios');
exception when duplicate_object then null; end $$;
