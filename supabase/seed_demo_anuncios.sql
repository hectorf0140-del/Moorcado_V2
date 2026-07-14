-- Siembra 12 anuncios de demo en una tabla `anuncios` vacía.
-- Ejecutar una sola vez en el SQL Editor de Supabase.
--
-- Contexto: la tabla `anuncios` de este proyecto quedó en 0 filas (se
-- confirmó consultando el endpoint REST público — Content-Range: */0),
-- por eso el catálogo y el inicio no mostraban ningún animal en ningún
-- dispositivo/navegador. `vendedor_id` usa la cuenta empresa existente
-- (axelgeronimo0@gmail.com) para satisfacer la FK anuncios_vendedor_id_fkey.
-- No hace nada si la tabla ya tiene datos, para no duplicar si se corre
-- más de una vez.

insert into anuncios (id, vendedor_id, creado_en, data)
select * from (values
  ('demo-anuncio-01', 'db35c2d7-44a6-47aa-921c-4eaa7edb1879', now() - interval '1 day', '{
    "id": "demo-anuncio-01", "titulo": "Toro Brahman reproductor – Copán",
    "nombre": "Toro Brahman reproductor", "raza": "Brahman", "edadMeses": 30,
    "pesoKg": 620, "sexo": "macho", "precio": 85000, "tipo": "carne",
    "proposito": "cárnico", "descripcion": "Toro Brahman de buena genética, listo para monta. Buen temperamento y sanidad al día.",
    "departamento": "Copán", "municipio": "Santa Rosa de Copán", "distanciaKm": 0,
    "lat": 14.7667, "lng": -88.7833, "vendedorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879",
    "vendorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879", "destacado": true, "registroSag": true,
    "verificado": false, "estadoSalud": "excelente", "vacunas": ["Fiebre aftosa", "Brucelosis"],
    "desparasitaciones": [], "historialVeterinario": [], "fotos": 0, "imagenes": [],
    "colorPrimario": "#D9B98C", "colorSecundario": "#8C5A2B", "publicadoHace": "hace 1 día",
    "vistas": 34, "activo": true, "creadoEn": "2026-07-13T12:00:00.000Z",
    "ubicacion": {"departamento": "Copán", "municipio": "Santa Rosa de Copán"}, "vacunasObj": []
  }'::jsonb),
  ('demo-anuncio-02', 'db35c2d7-44a6-47aa-921c-4eaa7edb1879', now() - interval '2 days', '{
    "id": "demo-anuncio-02", "titulo": "Vaca Holstein lechera – Olancho",
    "nombre": "Vaca Holstein lechera", "raza": "Holstein", "edadMeses": 42,
    "pesoKg": 540, "sexo": "hembra", "precio": 62000, "tipo": "leche",
    "proposito": "lechero", "descripcion": "Vaca Holstein en producción, promedio 18 litros diarios, dócil y sana.",
    "departamento": "Olancho", "municipio": "Juticalpa", "distanciaKm": 0,
    "lat": 14.6675, "lng": -86.2205, "vendedorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879",
    "vendorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879", "destacado": true, "registroSag": false,
    "verificado": false, "estadoSalud": "excelente", "vacunas": ["Fiebre aftosa"],
    "desparasitaciones": [], "historialVeterinario": [], "fotos": 0, "imagenes": [],
    "colorPrimario": "#C9CDD3", "colorSecundario": "#4A4E57", "publicadoHace": "hace 2 días",
    "vistas": 51, "activo": true, "creadoEn": "2026-07-12T12:00:00.000Z",
    "ubicacion": {"departamento": "Olancho", "municipio": "Juticalpa"}, "vacunasObj": []
  }'::jsonb),
  ('demo-anuncio-03', 'db35c2d7-44a6-47aa-921c-4eaa7edb1879', now() - interval '3 days', '{
    "id": "demo-anuncio-03", "titulo": "Novillas Pardo Suizo – Comayagua",
    "nombre": "Novillas Pardo Suizo", "raza": "Pardo Suizo", "edadMeses": 20,
    "pesoKg": 380, "sexo": "hembra", "precio": 45000, "tipo": "doble",
    "proposito": "doble propósito", "descripcion": "Lote de novillas Pardo Suizo, buena conformación, ideales para doble propósito.",
    "departamento": "Comayagua", "municipio": "Comayagua", "distanciaKm": 0,
    "lat": 14.4522, "lng": -87.6459, "vendedorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879",
    "vendorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879", "destacado": false, "registroSag": false,
    "verificado": false, "estadoSalud": "bueno", "vacunas": [], "desparasitaciones": [],
    "historialVeterinario": [], "fotos": 0, "imagenes": [],
    "colorPrimario": "#B08968", "colorSecundario": "#6B4226", "publicadoHace": "hace 3 días",
    "vistas": 12, "activo": true, "creadoEn": "2026-07-11T12:00:00.000Z",
    "ubicacion": {"departamento": "Comayagua", "municipio": "Comayagua"}, "vacunasObj": []
  }'::jsonb),
  ('demo-anuncio-04', 'db35c2d7-44a6-47aa-921c-4eaa7edb1879', now() - interval '4 days', '{
    "id": "demo-anuncio-04", "titulo": "Toro Angus – Yoro",
    "nombre": "Toro Angus", "raza": "Angus", "edadMeses": 28,
    "pesoKg": 590, "sexo": "macho", "precio": 78000, "tipo": "carne",
    "proposito": "cárnico", "descripcion": "Toro Angus de engorde, excelente ganancia de peso, apto para venta o reproducción.",
    "departamento": "Yoro", "municipio": "Yoro", "distanciaKm": 0,
    "lat": 15.1333, "lng": -87.1333, "vendedorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879",
    "vendorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879", "destacado": true, "registroSag": true,
    "verificado": false, "estadoSalud": "excelente", "vacunas": ["Fiebre aftosa", "Carbón bacteridiano"],
    "desparasitaciones": [], "historialVeterinario": [], "fotos": 0, "imagenes": [],
    "colorPrimario": "#3B3B3B", "colorSecundario": "#1C1C1C", "publicadoHace": "hace 4 días",
    "vistas": 67, "activo": true, "creadoEn": "2026-07-10T12:00:00.000Z",
    "ubicacion": {"departamento": "Yoro", "municipio": "Yoro"}, "vacunasObj": []
  }'::jsonb),
  ('demo-anuncio-05', 'db35c2d7-44a6-47aa-921c-4eaa7edb1879', now() - interval '5 days', '{
    "id": "demo-anuncio-05", "titulo": "Vaca Jersey lechera – Francisco Morazán",
    "nombre": "Vaca Jersey lechera", "raza": "Jersey", "edadMeses": 36,
    "pesoKg": 410, "sexo": "hembra", "precio": 48000, "tipo": "leche",
    "proposito": "lechero", "descripcion": "Vaca Jersey de alta calidad de leche, mansa, ideal para producción familiar o comercial.",
    "departamento": "Francisco Morazán", "municipio": "Tegucigalpa", "distanciaKm": 0,
    "lat": 14.0723, "lng": -87.1921, "vendedorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879",
    "vendorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879", "destacado": false, "registroSag": false,
    "verificado": false, "estadoSalud": "bueno", "vacunas": ["Fiebre aftosa"],
    "desparasitaciones": [], "historialVeterinario": [], "fotos": 0, "imagenes": [],
    "colorPrimario": "#D2A679", "colorSecundario": "#7A4E2D", "publicadoHace": "hace 5 días",
    "vistas": 29, "activo": true, "creadoEn": "2026-07-09T12:00:00.000Z",
    "ubicacion": {"departamento": "Francisco Morazán", "municipio": "Tegucigalpa"}, "vacunasObj": []
  }'::jsonb),
  ('demo-anuncio-06', 'db35c2d7-44a6-47aa-921c-4eaa7edb1879', now() - interval '6 days', '{
    "id": "demo-anuncio-06", "titulo": "Lote Brangus de engorde – Choluteca",
    "nombre": "Lote Brangus de engorde", "raza": "Brangus", "edadMeses": 24,
    "pesoKg": 480, "sexo": "macho", "precio": 58000, "tipo": "carne",
    "proposito": "cárnico", "descripcion": "Novillos Brangus listos para engorde final, buena conversión alimenticia.",
    "departamento": "Choluteca", "municipio": "Choluteca", "distanciaKm": 0,
    "lat": 13.3011, "lng": -87.1897, "vendedorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879",
    "vendorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879", "destacado": false, "registroSag": false,
    "verificado": false, "estadoSalud": "bueno", "vacunas": [], "desparasitaciones": [],
    "historialVeterinario": [], "fotos": 0, "imagenes": [],
    "colorPrimario": "#8B5E3C", "colorSecundario": "#3E2A1D", "publicadoHace": "hace 6 días",
    "vistas": 18, "activo": true, "creadoEn": "2026-07-08T12:00:00.000Z",
    "ubicacion": {"departamento": "Choluteca", "municipio": "Choluteca"}, "vacunasObj": []
  }'::jsonb),
  ('demo-anuncio-07', 'db35c2d7-44a6-47aa-921c-4eaa7edb1879', now() - interval '7 days', '{
    "id": "demo-anuncio-07", "titulo": "Vaquilla Indubrasil – Atlántida",
    "nombre": "Vaquilla Indubrasil", "raza": "Indubrasil", "edadMeses": 18,
    "pesoKg": 320, "sexo": "hembra", "precio": 38000, "tipo": "doble",
    "proposito": "doble propósito", "descripcion": "Vaquilla joven, buena estructura, apta para reemplazo o venta.",
    "departamento": "Atlántida", "municipio": "La Ceiba", "distanciaKm": 0,
    "lat": 15.7597, "lng": -86.7822, "vendedorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879",
    "vendorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879", "destacado": false, "registroSag": false,
    "verificado": false, "estadoSalud": "bueno", "vacunas": [], "desparasitaciones": [],
    "historialVeterinario": [], "fotos": 0, "imagenes": [],
    "colorPrimario": "#C7B08B", "colorSecundario": "#7C5A3A", "publicadoHace": "hace 1 semana",
    "vistas": 9, "activo": true, "creadoEn": "2026-07-07T12:00:00.000Z",
    "ubicacion": {"departamento": "Atlántida", "municipio": "La Ceiba"}, "vacunasObj": []
  }'::jsonb),
  ('demo-anuncio-08', 'db35c2d7-44a6-47aa-921c-4eaa7edb1879', now() - interval '8 days', '{
    "id": "demo-anuncio-08", "titulo": "Toro Gyr reproductor – Cortés",
    "nombre": "Toro Gyr reproductor", "raza": "Gyr", "edadMeses": 34,
    "pesoKg": 560, "sexo": "macho", "precio": 95000, "tipo": "reproductor",
    "proposito": "doble propósito", "descripcion": "Toro Gyr con excelente pedigrí, ideal para mejorar hato lechero.",
    "departamento": "Cortés", "municipio": "San Pedro Sula", "distanciaKm": 0,
    "lat": 15.5049, "lng": -88.025, "vendedorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879",
    "vendorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879", "destacado": true, "registroSag": true,
    "verificado": false, "estadoSalud": "excelente", "vacunas": ["Fiebre aftosa", "Brucelosis"],
    "desparasitaciones": [], "historialVeterinario": [], "fotos": 0, "imagenes": [],
    "colorPrimario": "#E5C9A6", "colorSecundario": "#9C6B3E", "publicadoHace": "hace 8 días",
    "vistas": 44, "activo": true, "creadoEn": "2026-07-06T12:00:00.000Z",
    "ubicacion": {"departamento": "Cortés", "municipio": "San Pedro Sula"}, "vacunasObj": []
  }'::jsonb),
  ('demo-anuncio-09', 'db35c2d7-44a6-47aa-921c-4eaa7edb1879', now() - interval '9 days', '{
    "id": "demo-anuncio-09", "titulo": "Vaca Criolla – Santa Bárbara",
    "nombre": "Vaca Criolla", "raza": "Criollo", "edadMeses": 48,
    "pesoKg": 400, "sexo": "hembra", "precio": 32000, "tipo": "leche",
    "proposito": "lechero", "descripcion": "Vaca criolla resistente, buena productora, adaptada a la zona.",
    "departamento": "Santa Bárbara", "municipio": "Santa Bárbara", "distanciaKm": 0,
    "lat": 14.9167, "lng": -88.2333, "vendedorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879",
    "vendorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879", "destacado": false, "registroSag": false,
    "verificado": false, "estadoSalud": "regular", "vacunas": [], "desparasitaciones": [],
    "historialVeterinario": [], "fotos": 0, "imagenes": [],
    "colorPrimario": "#A9A9A9", "colorSecundario": "#5C5C5C", "publicadoHace": "hace 9 días",
    "vistas": 6, "activo": true, "creadoEn": "2026-07-05T12:00:00.000Z",
    "ubicacion": {"departamento": "Santa Bárbara", "municipio": "Santa Bárbara"}, "vacunasObj": []
  }'::jsonb),
  ('demo-anuncio-10', 'db35c2d7-44a6-47aa-921c-4eaa7edb1879', now() - interval '10 days', '{
    "id": "demo-anuncio-10", "titulo": "Novillo Simmental – El Paraíso",
    "nombre": "Novillo Simmental", "raza": "Simmental", "edadMeses": 22,
    "pesoKg": 460, "sexo": "macho", "precio": 54000, "tipo": "carne",
    "proposito": "cárnico", "descripcion": "Novillo Simmental de rápido crecimiento, sano y bien alimentado.",
    "departamento": "El Paraíso", "municipio": "Danlí", "distanciaKm": 0,
    "lat": 13.9422, "lng": -86.8442, "vendedorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879",
    "vendorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879", "destacado": false, "registroSag": false,
    "verificado": false, "estadoSalud": "bueno", "vacunas": [], "desparasitaciones": [],
    "historialVeterinario": [], "fotos": 0, "imagenes": [],
    "colorPrimario": "#D9B98C", "colorSecundario": "#A9642A", "publicadoHace": "hace 10 días",
    "vistas": 15, "activo": true, "creadoEn": "2026-07-04T12:00:00.000Z",
    "ubicacion": {"departamento": "El Paraíso", "municipio": "Danlí"}, "vacunasObj": []
  }'::jsonb),
  ('demo-anuncio-11', 'db35c2d7-44a6-47aa-921c-4eaa7edb1879', now() - interval '11 days', '{
    "id": "demo-anuncio-11", "titulo": "Vaquillona Brahman – Colón",
    "nombre": "Vaquillona Brahman", "raza": "Brahman", "edadMeses": 26,
    "pesoKg": 390, "sexo": "hembra", "precio": 47000, "tipo": "doble",
    "proposito": "doble propósito", "descripcion": "Vaquillona Brahman lista para servicio, buena genética.",
    "departamento": "Colón", "municipio": "Trujillo", "distanciaKm": 0,
    "lat": 15.9198, "lng": -85.9497, "vendedorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879",
    "vendorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879", "destacado": false, "registroSag": true,
    "verificado": false, "estadoSalud": "excelente", "vacunas": ["Fiebre aftosa"],
    "desparasitaciones": [], "historialVeterinario": [], "fotos": 0, "imagenes": [],
    "colorPrimario": "#C9A66B", "colorSecundario": "#7A5230", "publicadoHace": "hace 11 días",
    "vistas": 21, "activo": true, "creadoEn": "2026-07-03T12:00:00.000Z",
    "ubicacion": {"departamento": "Colón", "municipio": "Trujillo"}, "vacunasObj": []
  }'::jsonb),
  ('demo-anuncio-12', 'db35c2d7-44a6-47aa-921c-4eaa7edb1879', now() - interval '12 days', '{
    "id": "demo-anuncio-12", "titulo": "Toro Pardo Suizo reproductor – La Paz",
    "nombre": "Toro Pardo Suizo reproductor", "raza": "Pardo Suizo", "edadMeses": 32,
    "pesoKg": 610, "sexo": "macho", "precio": 88000, "tipo": "reproductor",
    "proposito": "doble propósito", "descripcion": "Toro Pardo Suizo con muy buena descendencia comprobada, dócil.",
    "departamento": "La Paz", "municipio": "La Paz", "distanciaKm": 0,
    "lat": 14.3167, "lng": -87.6833, "vendedorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879",
    "vendorId": "db35c2d7-44a6-47aa-921c-4eaa7edb1879", "destacado": false, "registroSag": true,
    "verificado": false, "estadoSalud": "excelente", "vacunas": ["Fiebre aftosa", "Brucelosis"],
    "desparasitaciones": [], "historialVeterinario": [], "fotos": 0, "imagenes": [],
    "colorPrimario": "#B9895A", "colorSecundario": "#5E3A1E", "publicadoHace": "hace 12 días",
    "vistas": 13, "activo": true, "creadoEn": "2026-07-02T12:00:00.000Z",
    "ubicacion": {"departamento": "La Paz", "municipio": "La Paz"}, "vacunasObj": []
  }'::jsonb)
) as v(id, vendedor_id, creado_en, data)
where not exists (select 1 from anuncios);
