# Requirements Document

## Introduction

Moorcado is a fully functional digital marketplace for buying and selling cattle (ganado vacuno) in Honduras and Central America. The platform targets cattle ranchers, agricultural enterprises, veterinarians, and buyers across all Honduran departments. It runs entirely in the browser with no real backend — all data is seeded in TypeScript files and persisted via localStorage. The product must be presentable as a real investor-ready university integrative project built on an existing Next.js 16 App Router + TypeScript codebase.

## Glossary

- **Marketplace**: The public listing page (`/marketplace`) where any visitor can browse and filter animals.
- **Animal / Anuncio**: A cattle listing record. Fields include breed, price in Lempiras, weight, age, sex, purpose, vaccines, location, images, and a vendor reference.
- **Lote**: A named lot grouping one or more animals under a single listing.
- **Usuario**: A registered user account stored in localStorage under `"moorcado_usuarios"`.
- **Sesión**: The active session token `{usuarioId}` stored under `"moorcado_sesion"`.
- **Anuncio**: A published animal listing stored under `"moorcado_anuncios"`.
- **Mensaje**: A chat message tied to an animal, stored under `"moorcado_mensajes"` keyed by `animalId`.
- **Transaccion**: A completed purchase record stored under `"moorcado_transacciones"`.
- **Favorito**: A saved animal ID stored in the array under `"moorcado_favoritos"`.
- **Storage**: The singleton module at `/src/lib/storage.ts` that handles all localStorage reads and writes.
- **Valoracion**: The AI-style price estimation module at `/src/lib/valoracion.ts`.
- **Mooe**: The floating chatbot assistant, rules engine at `/src/lib/mooe.ts`.
- **Dashboard**: The authenticated area at `/dashboard` with tabs for My Listings, My Purchases, Analytics, and Publish.
- **Raza**: Cattle breed (Holstein, Brahman, Angus, Simmental, Nelore, Gyr, Pardo Suizo).
- **Propósito**: Intended use of the animal — `"lechero"`, `"cárnico"`, or `"doble propósito"`.
- **SAG**: Secretaría de Agricultura y Ganadería (Honduras), the official livestock registry authority.
- **ImagenAnimal**: A reusable React component that renders a cattle photo from loremflickr with an SVG placeholder fallback.
- **Playfair_Display**: The serif display font used for headings, loaded via `next/font/google`.
- **Inter**: The sans-serif body font, loaded via `next/font/google`.

---

## Requirements

### Requirement 1: Persistent Data Layer

**User Story:** As a developer, I want all application state to be read from and written to localStorage through a single module, so that data survives page refreshes without a real backend.

#### Acceptance Criteria

1. THE Storage SHALL export typed read and write functions for each of the six localStorage keys: `"moorcado_usuarios"`, `"moorcado_sesion"`, `"moorcado_anuncios"`, `"moorcado_mensajes"`, `"moorcado_favoritos"`, and `"moorcado_transacciones"`.
2. IF a localStorage key does not yet exist, THEN THE Storage SHALL initialize it with the corresponding seed data from `src/lib/mock-data.ts`.
3. WHEN a write operation is performed, THE Storage SHALL serialize the value as JSON and overwrite the existing entry for that key.
4. IF localStorage is unavailable (e.g., server-side render), THEN THE Storage SHALL return the seed data defaults without throwing.
5. IF a localStorage entry contains malformed or unparseable JSON, THEN THE Storage SHALL discard it, re-seed from defaults, and return the default value without throwing.
6. THE Storage SHALL guarantee round-trip integrity: for any value written via a Storage write function, a subsequent read of the same key SHALL return a value that is deeply equal — all properties and nested properties match in type and value — to the written value.

---

### Requirement 2: Seed Data

**User Story:** As a developer, I want rich, realistic seed data seeded on first load, so that the marketplace looks populated and investor-ready without a real database.

#### Acceptance Criteria

1. THE Seed_Data SHALL define exactly 12 `Anuncio` records in `/src/data/animales.ts`, each containing: `id`, lot name, breed (one of Holstein, Brahman, Angus, Simmental, Nelore, Gyr, Pardo Suizo), price in Lempiras (range L 25,000–90,000), weight in kg (range 350–800), age in years, sex, purpose (`"lechero"` | `"cárnico"` | `"doble propósito"`), at least one vaccine record with name and date, a description, location (one of Olancho, Choluteca, Yoro, Comayagua, Catacamas, Danlí), 3–4 image references, and a `vendorId`.
2. THE Seed_Data SHALL define exactly 5 `Usuario` vendor records in `/src/data/usuarios.ts`.
3. THE Seed_Data SHALL define exactly 4 `Testimonial` records in `/src/data/testimoniales.ts`.
4. THE Seed_Data SHALL define exactly 6 historical `Transaccion` records in `/src/data/transacciones.ts`.
5. WHEN the application loads for the first time, THE Storage SHALL populate localStorage with all seed data records.

---

### Requirement 3: Type Definitions

**User Story:** As a developer, I want all shared data shapes defined in one place with TypeScript types, so that compile-time errors catch data mismatches before runtime.

#### Acceptance Criteria

1. THE Type_System SHALL define a `Usuario` interface with at minimum these required fields: `id` (string), `nombre` (string), `correo` (string), `tipo` (`"comprador"` | `"vendedor"` | `"empresa"` | `"veterinario"`), `creadoEn` (string ISO date); and optional fields: `departamento?`, `telefono?`, `avatarUrl?`, `avatarColor?`, `iniciales?`, `verificado?` (boolean), `calificacion?` (number), `plan?`.
2. THE Type_System SHALL define an `Anuncio` interface with at minimum these required fields: `id` (string), `titulo` (string), `raza` (string), `precio` (number, > 0), `pesoKg` (number, > 0), `edadMeses` (number, ≥ 0), `sexo` (string), `proposito` (`"lechero"` | `"cárnico"` | `"doble propósito"`), `vacunas` (array of `{nombre: string, fecha: string}`), `descripcion` (string), `ubicacion` (object with `departamento`, `municipio`, `lat?`, `lng?`), `imagenes` (string[]), `vendorId` (string), `creadoEn` (string ISO date), `activo` (boolean).
3. THE Type_System SHALL define a `Mensaje` interface with fields: `id` (string), `conversacionId` (string), `autorId` (string), `contenido` (string), `tipo` (string), `creadoEn` (string ISO date).
4. THE Type_System SHALL define a `Transaccion` interface with fields: `id` (string), `animalId` (string), `compradorId` (string), `vendedorId` (string), `precio` (number, > 0), `fecha` (string ISO date).
5. THE Type_System SHALL export all types from a single file (`/src/lib/types.ts`); no other file SHALL re-declare these interfaces to enforce single-source-of-truth.
6. IF a component references a data field that does not exist in the type definition, THEN THE TypeScript_Compiler SHALL emit a compile-time error. The use of `any`, `as unknown`, or `@ts-ignore` without an accompanying written explanation comment SHALL constitute a violation of this criterion.

---

### Requirement 4: Authentication

**User Story:** As a visitor, I want to register and log in with my email and password, so that I can access protected features like publishing listings and viewing my dashboard.

#### Acceptance Criteria

1. WHEN a visitor submits the registration form at `/registro` with a unique email, name, password (minimum 8 characters), and user type, THE Auth_System SHALL create a `Usuario` record, persist it to `"moorcado_usuarios"`, write `{usuarioId}` to `"moorcado_sesion"`, and redirect to `/dashboard`.
2. IF a visitor submits the registration form with an email that already exists in `"moorcado_usuarios"`, THEN THE Auth_System SHALL display the error message "Este correo ya está registrado" without creating a duplicate record.
3. IF a visitor submits the registration form with a password shorter than 8 characters, THEN THE Auth_System SHALL display a validation error before submission and SHALL NOT create a record.
4. WHEN a user submits the login form at `/login` with a matching email and password, THE Auth_System SHALL write `{usuarioId}` to `"moorcado_sesion"` and redirect to `/dashboard`.
5. IF a login attempt uses an email that does not exist in `"moorcado_usuarios"`, THEN THE Auth_System SHALL display the error message "Correo o contraseña incorrectos" without redirecting.
6. IF a login attempt uses a correct email but incorrect password, THEN THE Auth_System SHALL display the error message "Correo o contraseña incorrectos" without redirecting.
7. WHEN a logged-in user clicks "Cerrar sesión", THE Auth_System SHALL remove the `"moorcado_sesion"` key from localStorage and redirect to `/`.
8. WHILE a user is not logged in, THE Auth_System SHALL redirect any request to `/dashboard`, `/dashboard/*`, or `/publicar` to `/login`.
9. THE Auth_System SHALL provide a `/recuperar` page with an email field that, upon submission, displays a confirmation message (e.g., "Te hemos enviado un correo") without performing real email delivery.

---

### Requirement 5: Landing Page

**User Story:** As a potential investor or first-time visitor, I want to see a compelling landing page that communicates Moorcado's value proposition, so that I understand what the platform does and feel motivated to sign up.

#### Acceptance Criteria

1. THE Landing_Page SHALL render at `/` and include these sections in order, each with at least one non-empty content block: Hero, Stats, How It Works, Differentiators, Pricing Plans, Testimonials, and Footer.
2. THE Hero_Section SHALL display a headline, a subtitle, a "Publicar Animal" CTA button that navigates to `/publicar`, and an "Explorar Mercado" button that navigates to `/marketplace`.
3. THE Stats_Section SHALL display at least three counters showing platform statistics; each counter SHALL begin animating from zero when the section scrolls into the viewport.
4. THE How_It_Works_Section SHALL show exactly three numbered steps explaining the buying/selling flow, each with an icon and a description of no more than two sentences.
5. THE Plans_Section SHALL display at least three pricing tiers (Gratis, Básico, Premium), each with a feature list and a CTA button labeled appropriately for that tier.
6. THE Testimonials_Section SHALL display exactly the 4 records from `/src/data/testimoniales.ts`, each showing a quote, author name, and role.
7. THE Footer SHALL include navigation links to `/marketplace`, `/dashboard`, `/login`, and `/registro`, and SHALL display the copyright notice "© 2026 Moorcado".

---

### Requirement 6: Marketplace

**User Story:** As a buyer, I want to browse all available cattle listings with powerful filters and a text search, so that I can quickly find animals that match my criteria.

#### Acceptance Criteria

1. THE Marketplace_Page SHALL render at `/marketplace` and display all `Anuncio` records where `activo = true` as a responsive grid: 1 column on mobile (< 640 px), 2 columns on tablet (640–1023 px), 3 columns on desktop (≥ 1024 px).
2. THE Marketplace_Page SHALL provide functional filter controls for: breed (raza, multi-select), price range in Lempiras (dual-handle slider, 0–999,999,999), weight in kg (dual-handle slider, 0–9,999.9), purpose (propósito, single-select), department (departamento, single-select), and free-text keyword search performing case-insensitive substring matching against `titulo`, `raza`, and `descripcion` fields.
3. WHEN any filter value changes, THE Marketplace_Page SHALL update the displayed results and the result count within 300 ms, without a page reload.
4. THE Marketplace_Page SHALL include a sort selector with options: "Más reciente" (default), "Precio: menor a mayor", "Precio: mayor a menor", "Peso: menor a mayor".
5. WHEN no listings match the active filters, THE Marketplace_Page SHALL display the message "No encontramos animales con esos filtros."
6. THE Marketplace_Page SHALL display the count of filtered results as "{n} animales encontrados".
7. WHEN a user clicks any listing card, THE Marketplace_Page SHALL navigate to the detail page at `/animal/[id]`.
8. THE Marketplace_Page SHALL render a persistent sidebar with filter controls on viewports ≥ 1024 px. WHEN a user taps the "Filtros" button on viewports < 1024 px, THE Marketplace_Page SHALL open a bottom-sheet drawer containing the same filter controls.

---

### Requirement 7: Animal Detail Page

**User Story:** As a buyer, I want to see a comprehensive detail page for each animal, so that I can evaluate the listing before contacting the seller.

#### Acceptance Criteria

1. THE Detail_Page SHALL render at `/animal/[id]` and display the full tech sheet for the matching `Anuncio`: gallery, lot name, breed, price, weight, age, sex, purpose, health status, vaccines, deworming records, veterinary history, genealogy, and SAG registration status.
2. THE ImagenAnimal_Component SHALL render a `<img>` tag pointing to `https://loremflickr.com/800/600/cow,cattle?lock={N}` where `N` is a stable integer derived from the animal id, and SHALL fall back to an inline SVG placeholder if the image fails to load.
3. THE Gallery_Component SHALL allow the user to click thumbnail images to display the selected image as the main view.
4. THE Detail_Page SHALL display a sticky vendor card in the right-hand sidebar containing: vendor name, rating, number of sales, a "Contactar vendedor" button that opens the inline chat, a WhatsApp deep-link button, and a call button.
5. THE Detail_Page SHALL display an AI valuation card computed by the Valoracion module showing: estimated price, market range (±8%), and confidence level.
6. THE Detail_Page SHALL display a "Animales similares" section showing up to 3 other listings with the same breed.
7. WHEN a user clicks the heart icon on the detail page, THE Detail_Page SHALL toggle the animal id in `"moorcado_favoritos"` in localStorage and update the icon state without a page reload.

---

### Requirement 8: AI Valuation Module

**User Story:** As a buyer or seller, I want to see an algorithmically estimated fair market price for each animal, so that I can make informed purchase or listing decisions.

#### Acceptance Criteria

1. THE Valoracion_Module SHALL export a `calcularValoracion(animal: Anuncio): ValoracionResult` function where `ValoracionResult` has fields: `estimado` (number), `rangoMin` (number), `rangoMax` (number), `confianza` (`"Alta"` | `"Media"`).
2. THE Valoracion_Module SHALL use the following price-per-kg rates in Lempiras: Holstein 55, Brahman 60, Angus 75, Simmental 70, Gyr 56, Pardo Suizo 62. IF the breed is not in this list, the module SHALL use a default rate of 60 and set `confianza` to `"Media"`.
3. THE Valoracion_Module SHALL apply an age factor based on `edadMeses`: edadMeses < 24 → 1.10, 24 ≤ edadMeses ≤ 60 → 1.00, edadMeses > 60 → 0.85.
4. THE Valoracion_Module SHALL compute `estimado = Math.round((pesoKg * pricePerKg * ageFactor) / 100) * 100` (half-up rounding to nearest 100 Lempiras).
5. THE Valoracion_Module SHALL compute `rangoMin = Math.round((estimado * 0.92) / 100) * 100` and `rangoMax = Math.round((estimado * 1.08) / 100) * 100` using the same half-up rounding.
6. THE Valoracion_Module SHALL set `confianza` to `"Alta"` when `pesoKg` is in range 350–800 kg (inclusive) and the breed is one of the known breeds listed in criterion 2; `"Media"` otherwise.
7. THE Detail_Page SHALL display the `ValoracionResult` in a card with a visible heading (e.g., "Análisis IA Moorcado"), showing `estimado`, the range `[rangoMin – rangoMax]`, and a `confianza` badge.

---

### Requirement 9: Dashboard

**User Story:** As a registered seller, I want a personal dashboard with tabs for my listings, my purchases, analytics, and a publish form, so that I can manage my marketplace activity in one place.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL render at `/dashboard` and be accessible only to authenticated users; unauthenticated visitors SHALL be redirected to `/login`.
2. THE Dashboard_Page SHALL display four tabs: "Mis Anuncios", "Mis Compras", "Analítica", and "Publicar".
3. WHEN the "Mis Anuncios" tab is active, THE Dashboard_Page SHALL display all `Anuncio` records from `"moorcado_anuncios"` where `vendorId` equals the current session's `usuarioId`.
4. WHEN the "Mis Compras" tab is active, THE Dashboard_Page SHALL display all `Transaccion` records from `"moorcado_transacciones"` where `compradorId` equals the current session's `usuarioId`.
5. WHEN the "Analítica" tab is active, THE Dashboard_Page SHALL render at least two Recharts charts: a bar or area chart of monthly views, and a bar chart of monthly sales.
6. WHEN the "Publicar" tab is active, THE Dashboard_Page SHALL display a publish form equivalent to the `/publicar` page functionality.
7. WHEN a user submits the publish form, THE Dashboard_Page SHALL create a new `Anuncio` record, append it to `"moorcado_anuncios"` in localStorage, and immediately show the new listing in the "Mis Anuncios" tab and in the Marketplace.
8. WHEN the "Publicar" tab form includes a price field, THE Dashboard_Page SHALL display a price suggestion computed by the Valoracion module based on the entered breed, weight, and age.

---

### Requirement 10: Mock Chat

**User Story:** As a buyer, I want to send messages to a seller about a specific animal directly from the detail page, so that I can ask questions without leaving the platform.

#### Acceptance Criteria

1. THE Chat_Component SHALL render an inline chat panel on the Animal Detail page, pre-populated with messages from `"moorcado_mensajes"` keyed by the current `animalId`.
2. WHEN a user types a message and submits the chat form, THE Chat_Component SHALL append a new `Mensaje` record to `"moorcado_mensajes"[animalId]` with the current `usuarioId` as `autorId` and the current timestamp.
3. WHEN a new message is submitted, THE Chat_Component SHALL scroll the message list to the bottom and clear the input field.
4. THE Chat_Component SHALL display messages with visual distinction between the current user's messages (right-aligned, green bubble) and the seller's messages (left-aligned, white bubble).
5. WHILE a user is not authenticated, THE Chat_Component SHALL display a "Inicia sesión para contactar al vendedor" prompt instead of the chat input.

---

### Requirement 11: Mooe Chatbot

**User Story:** As any user, I want a floating AI-style chatbot named Mooe, so that I can get quick answers about cattle, the platform, and listings without searching manually.

#### Acceptance Criteria

1. THE Mooe_Component SHALL render a floating action button with the 🐄 emoji fixed to the bottom-right corner of every page.
2. WHEN the Mooe button is clicked, THE Mooe_Component SHALL open a chat overlay panel without navigating away from the current page.
3. THE Mooe_Engine SHALL be implemented in `/src/lib/mooe.ts` as a pure function `responder(input: string): string` with a rules-based engine matching keywords to predefined responses.
4. THE Mooe_Engine SHALL respond to at least the following topics: greetings, breed questions (razas), price questions (precios), how to publish (cómo publicar), how to buy (cómo comprar), platform support, and unknown inputs.
5. WHEN the user submits a message to Mooe, THE Mooe_Component SHALL call `responder` and display the returned string as a bot reply within 500 ms (simulated typing delay).
6. THE Mooe_Component SHALL display a welcome message "¡Hola! Soy Mooe 🐄, tu asistente ganadero. ¿En qué te puedo ayudar?" when the chat panel first opens.

---

### Requirement 12: Favorites

**User Story:** As a buyer, I want to save listings as favorites, so that I can easily find them again later.

#### Acceptance Criteria

1. THE Favorites_System SHALL persist saved animal IDs as a `string[]` in localStorage under `"moorcado_favoritos"`.
2. WHEN a logged-in user clicks the heart icon on any listing card or detail page, THE Favorites_System SHALL toggle the animal's `id` in the `"moorcado_favoritos"` array.
3. WHEN the heart icon state is rendered, THE Favorites_System SHALL read `"moorcado_favoritos"` and set the icon to filled/red if the animal `id` is present.
4. IF a user is not logged in and clicks a heart icon, THEN THE Favorites_System SHALL redirect the user to `/login`.

---

### Requirement 13: Visual Design System

**User Story:** As a stakeholder, I want the platform to look polished and modern-rural, so that it presents as a credible investor-ready product.

#### Acceptance Criteria

1. THE Design_System SHALL use the following color palette exclusively: primary forest green `#1F4D2C`, sage green `#7FA05E`, earth brown `#8B5E3C`, cream background `#F7F3EA`, amber accent `#D9A441`.
2. THE Design_System SHALL load "Playfair Display" via `next/font/google` for all headings and "Inter" for all body text.
3. THE Design_System SHALL apply `rounded-2xl` to all listing cards, with a soft box-shadow and a hover elevation transition (`hover:-translate-y-0.5 hover:shadow-md`).
4. THE Design_System SHALL be mobile-first responsive with no dark mode.
5. THE ImagenAnimal_Component SHALL use `https://loremflickr.com/800/600/cow,cattle?lock={N}` as the image source, where `N` is a stable per-animal integer, and SHALL render an inline SVG cow silhouette placeholder while the image is loading or on error.
6. THE Landing_Page gradient overlays on hero images SHALL use a linear-gradient from `#1F4D2C` to transparent.

---

### Requirement 14: Architecture Page

**User Story:** As an evaluator, I want to view a visual architecture diagram of the system, so that I can understand the technical design without reading code.

#### Acceptance Criteria

1. THE Architecture_Page SHALL render at `/arquitectura` and be accessible to all visitors without authentication.
2. THE Architecture_Page SHALL display a visual architecture diagram built entirely with HTML `<div>` elements and Tailwind CSS classes — no external images or diagram libraries.
3. THE Architecture_Page SHALL depict at minimum the following layers: Browser / Client Layer (Next.js App Router, React components), Data Layer (localStorage via Storage module, seed data files), and Logic Layer (Valoracion module, Mooe engine, Auth module).
4. THE Architecture_Page SHALL include labeled arrows or lines connecting the layers to show data flow.

---

### Requirement 15: README and Documentation

**User Story:** As a reviewer or investor, I want a comprehensive README, so that I can understand the project's purpose, architecture, and how to run it.

#### Acceptance Criteria

1. THE README SHALL be located at `/README.md` and include the following sections, each containing at least one non-empty paragraph or diagram block: Problem Statement, Value Proposition, Business Model, Architecture Diagram (Mermaid syntax), Tech Stack, Installation Instructions, and Future Vision.
2. THE Installation_Instructions SHALL specify the exact commands `npm install` and `npm run dev` and explicitly note that no environment variables are required for the mock-data prototype configuration.
3. THE Architecture_Diagram SHALL be valid Mermaid syntax depicting at minimum the frontend, data, and component layers of the system, and SHALL render without errors in standard Mermaid renderers.
4. WHEN `npm install && npm run build` is executed, THE Build_System SHALL complete with zero TypeScript errors and zero Next.js build errors.

---

### Requirement 16: Build Quality

**User Story:** As a developer, I want the project to build and run without errors, so that it can be demonstrated live without any setup issues.

#### Acceptance Criteria

1. WHEN `npm run build` is executed, THE Build_System SHALL complete with zero TypeScript type errors.
2. WHEN `npm run dev` is executed and a browser navigates to each defined route (`/`, `/marketplace`, `/animal/[id]`, `/login`, `/registro`, `/recuperar`, `/dashboard`, `/publicar`, `/arquitectura`), THE Application SHALL render each page without any `console.error` entries originating from application code.
3. THE Application SHALL NOT use `any`, `as unknown`, or `@ts-ignore` without an accompanying comment that provides a written explanation of why a properly typed alternative is not feasible.
4. THE Application SHALL configure the Next.js `images.remotePatterns` config to allow images from `loremflickr.com` so that `<Image>` components do not throw at build time.
5. WHERE the application writes state to localStorage, WHEN the browser is refreshed on any page, THE Application SHALL restore all persisted state from localStorage and reflect it in the UI before the first user interaction after page load.
