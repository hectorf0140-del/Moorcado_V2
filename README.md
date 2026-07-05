# Moorcado

Prototipo funcional de Moorcado, el mercado digital de compra y venta de ganado en Honduras. Construido con Next.js 16 (App Router), TypeScript, Tailwind CSS v4 y datos simulados (sin backend real todavía).

## Ejecutar en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Qué incluye este prototipo

Todas las pantallas del spec están implementadas con datos de prueba (`src/lib/mock-data.ts`):

- Inicio, Catálogo con filtros, Página de animal, Publicar animal
- Registro / Inicio de sesión (UI, sin autenticación real)
- Mensajería tipo chat, Notificaciones
- Perfil, Dashboard de Vendedor y de Comprador (con gráficos)
- Planes (Gratuito / Básico / Premium), Módulo Premium "Rumi"
- Mapa interactivo de Honduras con filtro por distancia
- Panel de Administración

## Conectar una base de datos real

Este prototipo usa datos simulados en memoria. El esquema de base de datos recomendado (PostgreSQL vía Supabase, con PostGIS para geolocalización) está listo en [`supabase/schema.sql`](supabase/schema.sql). Para conectarlo:

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ejecuta `supabase/schema.sql` en el SQL Editor del proyecto.
3. Instala el cliente: `npm install @supabase/supabase-js`.
4. Agrega tus credenciales a `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
5. Reemplaza las funciones de `src/lib/mock-data.ts` por consultas reales a Supabase.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (tema de colores Moorcado en `src/app/globals.css`)
- Fuentes Poppins (títulos) e Inter (texto), vía `next/font/google`
- lucide-react (íconos), recharts (gráficos de los dashboards)
