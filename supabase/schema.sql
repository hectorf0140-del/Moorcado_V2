-- Esquema de base de datos para Moorcado (Supabase / PostgreSQL + PostGIS)
-- Ejecutar en el SQL Editor de tu proyecto Supabase.

create extension if not exists postgis;

-- ============ PERFILES (extiende auth.users) ============
create type tipo_usuario as enum ('comprador', 'vendedor', 'empresa', 'veterinario', 'admin');
create type plan_id as enum ('gratuito', 'basico', 'premium');

create table perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  identidad text,
  telefono text,
  tipo tipo_usuario not null default 'comprador',
  plan plan_id not null default 'gratuito',
  departamento text,
  verificado boolean not null default false,
  registro_sag text,
  documento_identidad_url text,
  calificacion numeric(2, 1) not null default 0,
  created_at timestamptz not null default now()
);

-- ============ ANIMALES ============
create type sexo_animal as enum ('macho', 'hembra');
create type tipo_ganado as enum ('leche', 'carne', 'doble', 'reproductor');
create type estado_salud as enum ('excelente', 'bueno', 'regular');

create table animales (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid not null references perfiles (id) on delete cascade,
  nombre text not null,
  raza text not null,
  edad_meses int not null,
  peso_kg numeric(6, 1) not null,
  sexo sexo_animal not null,
  tipo tipo_ganado not null,
  produccion_litros_dia numeric(5, 1),
  precio numeric(10, 2) not null,
  departamento text not null,
  municipio text not null,
  ubicacion geography(Point, 4326), -- lng/lat exacto (PostGIS)
  registro_sag boolean not null default false,
  estado_salud estado_salud not null default 'bueno',
  padre text,
  madre text,
  registro_genealogico text,
  destacado boolean not null default false,
  aprobado boolean not null default false, -- moderación por admin
  vendido boolean not null default false,
  vistas int not null default 0,
  created_at timestamptz not null default now()
);

create index animales_ubicacion_idx on animales using gist (ubicacion);
create index animales_departamento_idx on animales (departamento);
create index animales_tipo_idx on animales (tipo);

create table animal_fotos (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animales (id) on delete cascade,
  url text not null,
  orden int not null default 0
);

create table animal_videos (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animales (id) on delete cascade,
  url text not null
);

create table animal_documentos (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animales (id) on delete cascade,
  url text not null,
  nombre text
);

create table animal_vacunas (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animales (id) on delete cascade,
  nombre text not null,
  fecha date
);

create table animal_desparasitaciones (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animales (id) on delete cascade,
  producto text not null,
  fecha date not null
);

create table animal_historial_veterinario (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animales (id) on delete cascade,
  fecha date not null,
  descripcion text not null,
  veterinario_id uuid references perfiles (id)
);

-- ============ FAVORITOS Y RESEÑAS ============
create table favoritos (
  usuario_id uuid not null references perfiles (id) on delete cascade,
  animal_id uuid not null references animales (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (usuario_id, animal_id)
);

create table resenas (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references perfiles (id) on delete cascade,
  usuario_id uuid not null references perfiles (id) on delete cascade,
  estrellas int not null check (estrellas between 1 and 5),
  texto text,
  created_at timestamptz not null default now()
);

-- ============ MENSAJERÍA ============
create table conversaciones (
  id uuid primary key default gen_random_uuid(),
  comprador_id uuid not null references perfiles (id) on delete cascade,
  vendedor_id uuid not null references perfiles (id) on delete cascade,
  animal_id uuid references animales (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (comprador_id, vendedor_id, animal_id)
);

create table mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references conversaciones (id) on delete cascade,
  autor_id uuid not null references perfiles (id) on delete cascade,
  tipo text not null default 'texto', -- texto | imagen | ubicacion | documento
  contenido text not null,
  created_at timestamptz not null default now()
);

-- ============ NOTIFICACIONES ============
create table notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles (id) on delete cascade,
  tipo text not null, -- mensaje | animal_similar | favorito | vacuna | promocion | renovacion
  titulo text not null,
  descripcion text,
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ RUMI: GESTIÓN DEL HATO (premium) ============
create type estado_hato as enum ('sana', 'en_tratamiento', 'prenada', 'seca');

create table hato_animales (
  id uuid primary key default gen_random_uuid(),
  propietario_id uuid not null references perfiles (id) on delete cascade,
  nombre text not null,
  raza text,
  edad_meses int,
  produccion_litros_dia numeric(5, 1),
  estado estado_hato not null default 'sana',
  valor_estimado numeric(10, 2),
  proxima_revision date,
  ultima_vacuna date,
  created_at timestamptz not null default now()
);

create table hato_eventos (
  id uuid primary key default gen_random_uuid(),
  hato_animal_id uuid not null references hato_animales (id) on delete cascade,
  tipo text not null, -- vacuna | desparasitacion | parto | monta | revision
  descripcion text,
  fecha date not null
);

-- ============ PLANES Y PAGOS ============
create table suscripciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles (id) on delete cascade,
  plan plan_id not null,
  activa boolean not null default true,
  inicia_en timestamptz not null default now(),
  vence_en timestamptz,
  monto numeric(10, 2)
);

-- ============ MODERACIÓN ============
create table reportes (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid references perfiles (id) on delete set null,
  animal_id uuid references animales (id) on delete cascade,
  usuario_reportado_id uuid references perfiles (id) on delete cascade,
  motivo text not null,
  detalle text,
  estado text not null default 'pendiente', -- pendiente | resuelto | descartado
  created_at timestamptz not null default now()
);

-- ============ ROW LEVEL SECURITY (ejemplo base) ============
alter table perfiles enable row level security;
alter table animales enable row level security;
alter table favoritos enable row level security;
alter table mensajes enable row level security;
alter table notificaciones enable row level security;
alter table hato_animales enable row level security;

create policy "Perfiles públicos de lectura" on perfiles for select using (true);
create policy "Un usuario edita solo su perfil" on perfiles for update using (auth.uid() = id);

create policy "Animales aprobados son públicos" on animales for select using (aprobado = true);
create policy "El vendedor gestiona sus animales" on animales for all using (auth.uid() = vendedor_id);

create policy "El usuario gestiona sus favoritos" on favoritos for all using (auth.uid() = usuario_id);

create policy "Solo participantes ven sus mensajes" on mensajes for select using (
  auth.uid() in (
    select comprador_id from conversaciones where id = conversacion_id
    union
    select vendedor_id from conversaciones where id = conversacion_id
  )
);

create policy "El usuario ve solo sus notificaciones" on notificaciones for select using (auth.uid() = usuario_id);
create policy "El propietario gestiona su hato" on hato_animales for all using (auth.uid() = propietario_id);
