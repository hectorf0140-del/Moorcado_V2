-- Nuevas funciones exclusivas para cuentas empresa: directorio de
-- veterinarios (Rumi Pro), búsquedas guardadas con alerta, y solicitudes de
-- compra ("Busco X"). Ejecutar en el SQL Editor de Supabase (una sola vez).
--
-- Nota: el hato de Rumi y si la cuenta tiene Rumi Pro activo NO necesitan
-- tabla nueva — se guardan como campos más dentro del JSONB `data` de
-- `usuarios` (mismo patrón que `favoritos`), así que no hay nada que migrar
-- ahí.

-- ══════════════ 1. Directorio de veterinarios ═══════════════════════════════
create table if not exists veterinarios (
  id text primary key,
  nombre text not null,
  especialidad text not null,
  departamento text not null,
  telefono text not null,
  correo text,
  verificado boolean not null default true,
  creado_en timestamptz not null default now()
);

alter table veterinarios enable row level security;

do $$ begin
  create policy "lectura publica" on veterinarios for select using (true);
exception when duplicate_object then null; end $$;

insert into veterinarios (id, nombre, especialidad, departamento, telefono, correo) values
  ('vet-1', 'Dr. Manuel Castellanos', 'Reproducción bovina', 'Olancho', '+504 9911-2233', 'mcastellanos@vet.hn'),
  ('vet-2', 'Dra. Karla Ponce', 'Medicina interna y vacunación', 'Francisco Morazán', '+504 9922-3344', 'kponce@vet.hn'),
  ('vet-3', 'Dr. Elder Maradiaga', 'Nutrición y producción lechera', 'Comayagua', '+504 9933-4455', null),
  ('vet-4', 'Dra. Fátima Lagos', 'Salud del hato y desparasitación', 'Choluteca', '+504 9944-5566', 'flagos@vet.hn'),
  ('vet-5', 'Dr. Rony Zelaya', 'Cirugía y emergencias', 'Cortés', '+504 9955-6677', null),
  ('vet-6', 'Dra. Ingrid Bueso', 'Genética y mejoramiento genético', 'Yoro', '+504 9966-7788', 'ibueso@vet.hn'),
  ('vet-7', 'Dr. Selvin Amaya', 'Medicina preventiva', 'El Paraíso', '+504 9977-8899', null)
on conflict (id) do nothing;

-- ══════════════ 2. Búsquedas guardadas con alerta ═══════════════════════════
create table if not exists busquedas_guardadas (
  id text primary key,
  usuario_id text not null references usuarios (id) on delete cascade,
  nombre text not null,
  filtros jsonb not null,
  creado_en timestamptz not null default now()
);

create index if not exists busquedas_guardadas_usuario_idx on busquedas_guardadas (usuario_id);

alter table busquedas_guardadas enable row level security;

do $$ begin
  create policy "lectura publica demo" on busquedas_guardadas for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "insercion publica demo" on busquedas_guardadas for insert with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "borrado publico demo" on busquedas_guardadas for delete using (true);
exception when duplicate_object then null; end $$;

-- ══════════════ 3. Solicitudes de compra ("Busco X") ════════════════════════
create table if not exists solicitudes_compra (
  id text primary key,
  comprador_id text not null references usuarios (id) on delete cascade,
  raza text not null,
  cantidad integer not null,
  precio_max numeric not null,
  departamento text not null,
  descripcion text,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);

create index if not exists solicitudes_compra_activa_idx on solicitudes_compra (activa, creado_en desc);

alter table solicitudes_compra enable row level security;

do $$ begin
  create policy "lectura publica demo" on solicitudes_compra for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "insercion publica demo" on solicitudes_compra for insert with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "actualizacion publica demo" on solicitudes_compra for update using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "borrado publico demo" on solicitudes_compra for delete using (true);
exception when duplicate_object then null; end $$;
