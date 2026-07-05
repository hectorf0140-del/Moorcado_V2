# Implementation Plan: Moorcado Marketplace

## Overview

Implementación incremental del marketplace de ganado vacuno sobre el proyecto Next.js 16 existente (App Router, TypeScript). Cada tarea construye sobre la anterior; el hilo conductor es: infraestructura → datos → UI pública → autenticación → dashboard → chatbot → analítica → favoritos → pulido final.

## Tasks

- [x] 1. Configurar infraestructura base y dependencias
  - Instalar Zustand (`npm install zustand`) y fast-check (`npm install --save-dev fast-check`)
  - Instalar Jest y ts-jest (`npm install --save-dev jest ts-jest @types/jest jest-environment-jsdom`)
  - Crear `jest.config.ts` con `testEnvironment: "jsdom"`, transform para TypeScript y moduleNameMapper para alias `@/`
  - Añadir script `"test": "jest --passWithNoTests"` en `package.json`
  - Añadir `images.remotePatterns` en `next.config.ts` para `loremflickr.com` (protocolo `https`, hostname `loremflickr.com`, pathname `/**`)
  - _Requirements: 16.4_


- [ ] 2. Definir tipos TypeScript consolidados e implementar módulos de lógica pura
  - [ ] 2.1 Extender `/src/lib/types.ts` con los nuevos tipos requeridos
    - Añadir `ValoracionResult`, `Anuncio` (extend `Animal`), `Transaccion`, `Testimonial`, `FiltrosState`
    - Mantener compatibilidad con los tipos existentes (`Animal`, `Usuario`, `Mensaje`, `Conversacion`, `NotificacionItem`, `AnimalHato`)
    - Añadir campo `password` a `Usuario` (string) para autenticación client-side
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [~] 2.2 Crear `/src/lib/storage.ts` — singleton localStorage
    - Implementar `leer<T>(key, defaultValue)` y `escribir<T>(key, value)` con guard `typeof window === "undefined"` y bloque `try/catch`
    - Exportar las 12 funciones tipadas: `getUsuarios/setUsuarios`, `getSesion/setSesion`, `getAnuncios/setAnuncios`, `getMensajes/setMensajes`, `getFavoritos/setFavoritos`, `getTransacciones/setTransacciones`
    - Si una clave no existe, inicializar con datos semilla importados de `src/data/*.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 2.3 Escribir property test para storage (Property 1)
    - **Property 1: Round-trip de escritura/lectura en Storage**
    - **Validates: Requirements 1.3, 1.6**

  - [~] 2.4 Crear `/src/lib/valoracion.ts` — módulo puro de valoración
    - Implementar `calcularValoracion({ raza, pesoKg, edadMeses }): ValoracionResult` con tabla `PRECIO_POR_KG`, `getAgeFactor()`, redondeo a 100 Lempiras, rango ±8%, lógica de confianza
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 2.5 Escribir property test para valoración (Property 3)
    - **Property 3: Fórmula de valoración es determinista y exacta**
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.6**

  - [~] 2.6 Crear `/src/lib/mooe.ts` — motor de reglas del chatbot
    - Implementar `responder(input: string): string` con matching case-insensitive para los topics: precio, transporte, visita, vacunas, saludos, razas, publicar, comprar, y default
    - _Requirements: 11.3, 11.4_

  - [ ]* 2.7 Escribir unit test y property test para mooe (Property 13)
    - **Property 13: `responder()` es determinista**
    - **Validates: Requirements 11.3**

  - [~] 2.8 Crear `/src/store/useAppStore.ts` — Zustand store sin persist middleware
    - Implementar `AppState` con sesión, anuncios, favoritos, mensajes, hydrated, y todas las acciones: `login`, `logout`, `agregarAnuncio`, `toggleFavorito`, `enviarMensaje`, `hydrate`
    - `hydrate()` lee las seis claves de `storage.ts` y llena el store; se llama en `useEffect` del layout
    - _Requirements: 1.6, 4.7, 12.1_


- [ ] 3. Crear datos semilla en `/src/data/`
  - [~] 3.1 Crear `/src/data/animales.ts` — 12 registros `Anuncio`
    - Expandir los 8 animales existentes de `mock-data.ts` a 12 registros completos con los nuevos campos: `titulo`, `proposito`, `descripcion`, `activo`, `creadoEn`, `vendorId`, `imagenes: []`, `ubicacion` (objeto con `departamento`, `municipio`, `lat`, `lng`), `vacunasObj`
    - Usar `fotos` del seed existente como referencia para el número de imágenes
    - _Requirements: 2.1_

  - [~] 3.2 Crear `/src/data/usuarios.ts` — 5 registros `Usuario`
    - Mover los 5 usuarios de `mock-data.ts` añadiendo campo `password: "demo1234"` a cada uno y campo `creadoEn`
    - _Requirements: 2.2_

  - [~] 3.3 Crear `/src/data/testimoniales.ts` — 4 registros `Testimonial`
    - Crear 4 testimonios con `id`, `cita`, `autor`, `rol`, `avatarColor`
    - _Requirements: 2.3_

  - [~] 3.4 Crear `/src/data/transacciones.ts` — 6 registros `Transaccion`
    - Crear 6 transacciones históricas con `id`, `animalId`, `compradorId`, `vendedorId`, `precio`, `fecha` ISO
    - _Requirements: 2.4_

  - [~] 3.5 Actualizar importaciones en componentes existentes que usan `@/lib/mock-data`
    - Reemplazar importaciones de `animales`, `usuarios`, `getAnimal`, `getUsuario` en los archivos existentes que las usen para apuntar a `@/data/animales` / `@/data/usuarios` o al nuevo store según corresponda
    - Mantener `mock-data.ts` exportando `conversaciones`, `notificaciones`, `hato` para los componentes que aún los necesitan
    - _Requirements: 3.5_


- [ ] 4. Marketplace — grid + filtros funcionales (`/marketplace`)
  - [~] 4.1 Crear componente `FilterSidebar` en `/src/components/FilterSidebar.tsx`
    - Recibir `filtros: FiltrosState`, `onChange`, `onLimpiar`, `resultadosCount`, `open?`, `onClose?`
    - Controles: búsqueda de texto, multi-select de razas, slider de precio (0–999999), slider de peso (0–9999), select de propósito, select de departamento, select de sexo, toggles SAG/Verificado
    - En desktop: renderizar como sidebar fijo; en mobile: renderizar como bottom-drawer (`fixed inset-x-0 bottom-0`)
    - _Requirements: 6.2, 6.8_

  - [~] 4.2 Crear función pura `aplicarFiltros(anuncios, filtros): Anuncio[]` en `/src/lib/filtros.ts`
    - Filtrar por: query (substring case-insensitive en `titulo`, `raza`, `descripcion`), razas, precioMin/Max, pesoMin/Max, proposito, departamento, sexo, soloSag, soloVerificados
    - Aplicar ordenamiento: reciente, precio asc/desc, peso asc
    - _Requirements: 6.2, 6.4_

  - [ ]* 4.3 Escribir property test para filtros (Property 2)
    - **Property 2: Filtros del marketplace son correctos y completos**
    - **Validates: Requirements 6.2, 6.6**

  - [~] 4.4 Refactorizar `/src/app/catalogo/page.tsx` → crear `/src/app/marketplace/page.tsx`
    - Server Component shell que renderiza `<CatalogoClient>` pasando anuncios activos
    - Actualizar `Header.tsx` para que el enlace "Catálogo" apunte a `/marketplace`
    - _Requirements: 6.1_

  - [~] 4.5 Reescribir `/src/components/CatalogoClient.tsx` para usar `FiltrosState`, `FilterSidebar` y `aplicarFiltros`
    - Leer anuncios desde `useAppStore` (con hidratación)
    - Mostrar grid responsivo: 1 col (< 640px), 2 cols (640–1023px), 3 cols (≥ 1024px)
    - Mostrar conteo "{n} animales encontrados" y mensaje vacío "No encontramos animales con esos filtros."
    - Botón "Filtros" en mobile abre `FilterSidebar` como bottom-drawer
    - _Requirements: 6.1, 6.3, 6.5, 6.6, 6.7, 6.8_

  - [~] 4.6 Actualizar `AnimalCard` para leer favoritos del store y conectar `toggleFavorito`
    - Leer `favoritos` de `useAppStore` para estado del icono de corazón
    - Si usuario no está autenticado, redirigir a `/login` al hacer click en corazón
    - _Requirements: 12.2, 12.3, 12.4_

  - [ ]* 4.7 Escribir property tests para favoritos (Properties 10 y 11)
    - **Property 10: Toggle de favoritos es idempotente**
    - **Property 11: Estado del ícono de favorito refleja localStorage**
    - **Validates: Requirements 7.7, 12.2, 12.3**


- [ ] 5. Página de detalle (`/animal/[id]`)
  - [~] 5.1 Actualizar `AnimalGallery` para recibir URLs de imágenes reales
    - Aceptar prop `imagenes?: string[]`; si está vacío, generar URLs loremflickr con `lock=N` derivado del id del animal
    - Permitir click en miniaturas para cambiar imagen principal
    - _Requirements: 7.2, 7.3_

  - [~] 5.2 Crear `/src/components/ValoracionCard.tsx`
    - Recibir `resultado: ValoracionResult` y renderizar: heading "Análisis IA Moorcado", precio estimado, rango `[rangoMin – rangoMax]`, badge de confianza (verde para Alta, amarillo para Media)
    - _Requirements: 7.5, 8.7_

  - [~] 5.3 Crear `/src/components/VendorCard.tsx`
    - Renderizar: avatar con color, nombre, calificación, número de ventas, botón "Contactar vendedor" (abre ChatPanel inline), botón WhatsApp (`https://wa.me/{phone}`), botón Llamar (`tel:{phone}`)
    - Sticky en desktop (`lg:sticky lg:top-20`)
    - _Requirements: 7.4_

  - [~] 5.4 Crear `/src/components/ChatPanel.tsx`
    - Recibir `animalId: string`, `vendedorId: string`
    - Si usuario autenticado: mostrar historial de `mensajes[animalId]` del store, input + submit; mensajes del usuario a la derecha (verde), del vendedor a la izquierda (blanco); auto-scroll al fondo al enviar
    - Si no autenticado: mostrar "Inicia sesión para contactar al vendedor" con link a `/login`
    - Al enviar, llamar `enviarMensaje(animalId, msg)` del store
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 5.5 Escribir property test para chat (Property 9)
    - **Property 9: Mensajes del chat persisten y se recuperan**
    - **Validates: Requirements 10.1, 10.2**

  - [~] 5.6 Actualizar `/src/app/animal/[id]/page.tsx`
    - Cambiar fuente de datos de `mock-data.ts` a `src/data/animales.ts`
    - Integrar `<ValoracionCard>` con resultado de `calcularValoracion(animal)`
    - Integrar `<VendorCard>` en el sidebar sticky derecho
    - Integrar `<ChatPanel>` debajo de la galería
    - Añadir botón de favorito funcional conectado al store
    - Sección "Animales similares": hasta 3 anuncios de la misma raza con `activo=true`
    - Nota: `params` es `Promise<{ id: string }>` en Next.js 16 App Router — usar `await params`
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 5.7 Escribir property test para animales similares (Property 12)
    - **Property 12: Animales similares — cantidad y raza correctas**
    - **Validates: Requirements 7.6**


- [ ] 6. Landing page completa (`/`)
  - [~] 6.1 Crear `/src/components/StatsCounter.tsx`
    - Recibir `valor: number`, `label: string`, `prefijo?: string`, `sufijo?: string`
    - Animar contador de 0 a `valor` con `IntersectionObserver` al entrar en viewport
    - _Requirements: 5.3_

  - [~] 6.2 Reescribir `/src/app/page.tsx` — Landing completa (Server Component)
    - Secciones en orden: Hero, Stats, Cómo funciona, Diferenciadores, Planes, Testimonios, Footer-preview
    - Hero: headline, subtitle, CTA "Publicar Animal" → `/publicar`, CTA "Explorar Mercado" → `/marketplace`, gradiente `from-[#1F4D2C]` a transparent
    - Stats: 3 contadores con `<StatsCounter>` — animación con IntersectionObserver
    - Cómo funciona: 3 pasos numerados, cada uno con icono lucide-react y descripción ≤ 2 oraciones
    - Planes: 3 tiers (Gratis, Básico, Premium) con lista de features y CTA
    - Testimonios: mapear los 4 registros de `testimoniales.ts`
    - Últimas publicaciones: 4 `AnimalCard` de los anuncios más recientes
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 7. Autenticación con localStorage y rutas protegidas
  - [~] 7.1 Crear `/src/app/registro/page.tsx` (Client Component)
    - Formulario controlado: nombre, correo, tipo (select), contraseña (min 8 chars), confirmar contraseña
    - Validación inline antes de submit: email duplicado → "Este correo ya está registrado", contraseña corta → "La contraseña debe tener al menos 8 caracteres"
    - En éxito: crear `Usuario`, `setUsuarios`, `setSesion`, llamar `login` del store, `router.push("/dashboard")`
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 7.2 Escribir property test para registro (Property 4)
    - **Property 4: Validación de contraseña en registro**
    - **Validates: Requirements 4.3**

  - [~] 7.3 Crear `/src/app/login/page.tsx` (Client Component) — reemplazar el existente
    - Formulario: correo + contraseña; buscar en `getUsuarios()` por correo y comparar contraseña
    - Error unificado: "Correo o contraseña incorrectos" para email no encontrado y para contraseña incorrecta
    - En éxito: `setSesion`, `login` del store, `router.push("/dashboard")`
    - _Requirements: 4.4, 4.5, 4.6_

  - [~] 7.4 Crear `/src/app/recuperar/page.tsx` (Client Component) — reemplazar el existente
    - Campo email; en submit mostrar "Te hemos enviado un correo" sin lógica real
    - _Requirements: 4.9_

  - [~] 7.5 Crear hook `/src/hooks/useAuthGuard.ts`
    - `useEffect` que lee `getSesion()`; si es null redirige a `/login` con `router.replace`
    - Retornar `{ sesion, loading }` para que las páginas protejan el render
    - _Requirements: 4.8, 9.1_

  - [ ]* 7.6 Escribir property test para rutas protegidas (Property 5)
    - **Property 5: Protección de rutas autenticadas**
    - **Validates: Requirements 4.8, 9.1**

  - [~] 7.7 Actualizar `Header.tsx` para reflejar estado de sesión desde el store
    - Si autenticado: mostrar iniciales del usuario en avatar y enlace a `/dashboard`
    - Si no autenticado: mostrar "Iniciar sesión" / "Registrarse"
    - Botón "Cerrar sesión" llama `logout` del store y `router.push("/")`
    - _Requirements: 4.7_


- [ ] 8. Dashboard — Mis Anuncios + Publicar nuevo lote
  - [~] 8.1 Crear `/src/components/PublicarForm.tsx` (Client Component)
    - Campos: título del lote, raza (select de `RAZAS_GANADO`), propósito (select), sexo, precio, peso kg, edad (meses), departamento, municipio, descripción, vacunas (campo dinámico agregar/quitar), toggle SAG
    - Sugerencia de precio: calcular `calcularValoracion` en tiempo real al cambiar raza/peso/edad y mostrar el estimado
    - En submit: crear `Anuncio` con `id` generado (`crypto.randomUUID()`), `vendorId` = sesión actual, `activo: true`, `creadoEn: new Date().toISOString()`; llamar `agregarAnuncio` del store; si `onSuccess` está definido llamarlo, si no `router.push("/marketplace")`
    - _Requirements: 9.7, 9.8_

  - [~] 8.2 Crear `/src/components/DashboardTabs.tsx` (Client Component)
    - Recibir `usuarioId: string`
    - 4 tabs: "Mis Anuncios", "Mis Compras", "Analítica", "Publicar"
    - Tab "Mis Anuncios": filtrar `anuncios` del store donde `vendorId === usuarioId`, mostrar grid de `AnimalCard`
    - Tab "Mis Compras": filtrar `transacciones` del store donde `compradorId === usuarioId`, mostrar lista
    - Tab "Analítica": placeholder de charts (se completa en tarea 10)
    - Tab "Publicar": renderizar `<PublicarForm>` con `onSuccess` que lleva a tab "Mis Anuncios"
    - _Requirements: 9.2, 9.3, 9.4, 9.6, 9.7_

  - [ ]* 8.3 Escribir property tests para Mis Anuncios y Mis Compras (Properties 6 y 7)
    - **Property 6: Mis Anuncios muestra solo los del usuario actual**
    - **Property 7: Mis Compras muestra solo las del usuario actual**
    - **Validates: Requirements 9.3, 9.4**

  - [ ]* 8.4 Escribir property test para Publicar anuncio (Property 8)
    - **Property 8: Publicar anuncio — round-trip de persistencia**
    - **Validates: Requirements 9.7**

  - [~] 8.5 Crear `/src/app/dashboard/page.tsx` (Client Component) — reemplazar estructura existente
    - Llamar `useAuthGuard` para redirigir si no autenticado (mostrar spinner mientras `loading`)
    - Renderizar `<DashboardTabs usuarioId={sesion.usuarioId} />`
    - _Requirements: 9.1, 9.2_

  - [~] 8.6 Crear `/src/app/publicar/page.tsx` (Client Component) — reemplazar el existente
    - Llamar `useAuthGuard`; renderizar `<PublicarForm>`
    - _Requirements: 9.1_

- [~] 9. Checkpoint — Verificar compilación y flujos básicos
  - Asegurar que `npm run build` completa sin errores TypeScript
  - Verificar flujo: registro → marketplace → filtrar → detalle → publicar → ver en Mis Anuncios
  - La persistencia debe sobrevivir al refrescar en todas las rutas cubiertas hasta aquí


- [ ] 10. Chatbot flotante Mooe
  - [~] 10.1 Crear `/src/components/MooeWidget.tsx` (Client Component)
    - FAB fijo `fixed bottom-6 right-6 z-50` con emoji 🐄 (NO usar ícono de lucide-react)
    - Al hacer click, abrir panel de chat `fixed bottom-24 right-6 w-80 rounded-2xl bg-white shadow-xl`
    - Mensaje de bienvenida al abrir: "¡Hola! Soy Mooe 🐄, tu asistente ganadero. ¿En qué te puedo ayudar?"
    - Input + botón submit; al enviar: mostrar mensaje del usuario, esperar 500ms (simulated typing), mostrar respuesta de `responder(input)`
    - _Requirements: 11.1, 11.2, 11.5, 11.6_

  - [~] 10.2 Integrar `<MooeWidget>` en `/src/app/layout.tsx`
    - Añadir `<MooeWidget />` antes del cierre de `<body>`, después de `<MobileNav />`
    - Nota: `layout.tsx` es Server Component — `<MooeWidget>` lleva `"use client"` propio
    - Añadir `hydrate()` del store en un Client Component wrapper en el layout (`HydrationProvider`)
    - _Requirements: 11.1_

- [ ] 11. Dashboard — tab Mis Compras + tab Analítica con Recharts
  - [~] 11.1 Completar tab "Mis Compras" en `DashboardTabs`
    - Mostrar lista de transacciones: nombre del animal (lookup en anuncios del store), precio formateado, fecha, nombre del vendedor
    - Si no hay compras: mostrar "No tienes compras registradas."
    - _Requirements: 9.4_

  - [~] 11.2 Actualizar `DashboardCharts.tsx` y conectar al tab "Analítica"
    - `VisualizacionesChart`: `AreaChart` de Recharts con datos mensuales de vistas de los anuncios del usuario
    - `VentasChart`: `BarChart` de Recharts con ventas por mes (de transacciones del usuario como vendedor)
    - Pasar datos reales calculados desde el store en lugar de datos mock fijos
    - _Requirements: 9.5_

- [ ] 12. Valoración IA en detalle + sugerencia de precio en Publicar
  - [~] 12.1 Verificar integración de `ValoracionCard` en `/animal/[id]/page.tsx` (completada en tarea 5.6)
    - Confirmar que `calcularValoracion` recibe los campos correctos del `Anuncio` actual
    - _Requirements: 8.7_

  - [~] 12.2 Verificar sugerencia de precio en `PublicarForm` (completada en tarea 8.1)
    - Confirmar que el estimado se actualiza en tiempo real al cambiar raza, peso o edad
    - _Requirements: 9.8_


- [~] 13. Favoritos — toggle en cards y detalle
  - Confirmar que `AnimalCard` (tarea 4.6) y detalle (tarea 5.6) tienen el toggle funcional
  - Añadir sección "Mis Favoritos" opcional en dashboard si hay anuncios guardados
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [~] 14. Lotes similares en `/animal/[id]`
  - Confirmar que la sección "Animales similares" (tarea 5.6) muestra 0–3 anuncios con misma `raza` y `activo=true`, distintos del actual
  - _Requirements: 7.6_

- [~] 15. Animaciones de stats en landing (Intersection Observer)
  - Confirmar que `StatsCounter` (tarea 6.1) usa `IntersectionObserver` correctamente
  - Verificar que las animaciones arrancan desde 0 al entrar en viewport y no al cargar la página
  - _Requirements: 5.3_

- [~] 16. Página `/arquitectura`
  - Crear `/src/app/arquitectura/page.tsx` (Server Component)
  - Diagrama visual en HTML + Tailwind que muestre tres capas: Browser/Client Layer (Next.js App Router, React), Data Layer (localStorage / Storage module, seed data), Logic Layer (Valoracion, Mooe, Auth)
  - Incluir flechas/líneas etiquetadas mostrando flujo de datos entre capas
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [~] 17. README.md completo
  - Reescribir `/README.md` con secciones: Problem Statement, Value Proposition, Business Model, Architecture Diagram (Mermaid), Tech Stack, Installation Instructions (`npm install` + `npm run dev`, sin env vars requeridas), Future Vision
  - El diagrama Mermaid debe ser válido y representar frontend, datos y capas de componentes
  - _Requirements: 15.1, 15.2, 15.3_

- [~] 18. Checkpoint final — build limpio sin errores TypeScript
  - Ejecutar `npm run build` y resolver cualquier error TypeScript remanente
  - Eliminar todos los `any` sin comentario explicativo
  - Verificar que ningún botón está muerto en el flujo completo: registro → explorar → filtrar → detalle → chat → publicar → ver en marketplace → dashboard → analytics → Mooe responde
  - Confirmar que la persistencia sobrevive al refrescar en todas las rutas
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_


## Notes

- Las tareas marcadas con `*` son opcionales y pueden saltarse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los property tests usan **fast-check** con mínimo 100 iteraciones por defecto
- El chatbot Mooe usa emoji 🐄 directamente — NO buscar ícono de vaca en lucide-react
- Todas las URLs de imágenes usan `https://loremflickr.com/800/600/cow,cattle?lock={N}` donde `N` se deriva del id del animal
- Todo acceso a localStorage lleva guard `typeof window !== "undefined"` y bloque `try/catch`
- `params` en rutas dinámicas de Next.js 16 es `Promise<{ id: string }>` — siempre usar `await params`
- `useRouter` y `usePathname` se importan de `next/navigation`, no de `next/router`
- La hidratación del store Zustand se hace en un `HydrationProvider` Client Component montado en `layout.tsx`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.6"] },
    { "id": 3, "tasks": ["2.3", "2.5", "2.7", "2.8"] },
    { "id": 4, "tasks": ["3.1", "3.2", "3.3", "3.4"] },
    { "id": 5, "tasks": ["3.5"] },
    { "id": 6, "tasks": ["4.1", "4.2", "5.2", "5.3", "6.1"] },
    { "id": 7, "tasks": ["4.3", "4.4", "5.1", "7.1", "7.3", "7.4", "7.5", "8.1"] },
    { "id": 8, "tasks": ["4.5", "4.6", "5.4", "7.2", "7.6", "8.2"] },
    { "id": 9, "tasks": ["4.7", "5.5", "5.6", "5.7", "7.7", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 10, "tasks": ["6.2", "10.1"] },
    { "id": 11, "tasks": ["10.2"] },
    { "id": 12, "tasks": ["11.1", "11.2", "12.1", "12.2"] }
  ]
}
```
