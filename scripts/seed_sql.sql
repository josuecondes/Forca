-- ============================================================
-- SCRIPT DE SEEDING COMPLETO PARA EVIDENTIA
-- Inserta usuarios en auth.users + public.usuarios + citas
-- Ejecuta en Supabase → SQL Editor
-- ============================================================

-- 0. Desactivar RLS temporalmente
ALTER TABLE IF EXISTS public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.citas    DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 1. INSERTAR EN auth.users (tabla interna de Supabase Auth)
-- ============================================================
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
)
VALUES
  ('22220001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'ana.garcia@test.com',       crypt('Evidentia123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('22220002-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'carlos.rodriguez@test.com', crypt('Evidentia123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('22220003-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'lucia.fernandez@test.com',  crypt('Evidentia123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('22220004-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'marcos.lopez@test.com',     crypt('Evidentia123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('22220005-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'elena.martinez@test.com',   crypt('Evidentia123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('22220006-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'david.sanchez@test.com',    crypt('Evidentia123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('22220007-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'sofia.perez@test.com',      crypt('Evidentia123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('22220008-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'javier.ruiz@test.com',      crypt('Evidentia123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('22220009-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'paula.castro@test.com',     crypt('Evidentia123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('22220010-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'diego.gomez@test.com',      crypt('Evidentia123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO UPDATE SET email_confirmed_at = NOW();

-- ============================================================
-- 2. INSERTAR IDENTIDADES (necesario para que puedan hacer login)
-- ============================================================
INSERT INTO auth.identities (
    id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id
)
VALUES
  (gen_random_uuid(), '22220001-0000-0000-0000-000000000001', '{"sub":"22220001-0000-0000-0000-000000000001","email":"ana.garcia@test.com"}',       'email', NOW(), NOW(), NOW(), 'ana.garcia@test.com'),
  (gen_random_uuid(), '22220002-0000-0000-0000-000000000002', '{"sub":"22220002-0000-0000-0000-000000000002","email":"carlos.rodriguez@test.com"}', 'email', NOW(), NOW(), NOW(), 'carlos.rodriguez@test.com'),
  (gen_random_uuid(), '22220003-0000-0000-0000-000000000003', '{"sub":"22220003-0000-0000-0000-000000000003","email":"lucia.fernandez@test.com"}',  'email', NOW(), NOW(), NOW(), 'lucia.fernandez@test.com'),
  (gen_random_uuid(), '22220004-0000-0000-0000-000000000004', '{"sub":"22220004-0000-0000-0000-000000000004","email":"marcos.lopez@test.com"}',     'email', NOW(), NOW(), NOW(), 'marcos.lopez@test.com'),
  (gen_random_uuid(), '22220005-0000-0000-0000-000000000005', '{"sub":"22220005-0000-0000-0000-000000000005","email":"elena.martinez@test.com"}',   'email', NOW(), NOW(), NOW(), 'elena.martinez@test.com'),
  (gen_random_uuid(), '22220006-0000-0000-0000-000000000006', '{"sub":"22220006-0000-0000-0000-000000000006","email":"david.sanchez@test.com"}',    'email', NOW(), NOW(), NOW(), 'david.sanchez@test.com'),
  (gen_random_uuid(), '22220007-0000-0000-0000-000000000007', '{"sub":"22220007-0000-0000-0000-000000000007","email":"sofia.perez@test.com"}',      'email', NOW(), NOW(), NOW(), 'sofia.perez@test.com'),
  (gen_random_uuid(), '22220008-0000-0000-0000-000000000008', '{"sub":"22220008-0000-0000-0000-000000000008","email":"javier.ruiz@test.com"}',      'email', NOW(), NOW(), NOW(), 'javier.ruiz@test.com'),
  (gen_random_uuid(), '22220009-0000-0000-0000-000000000009', '{"sub":"22220009-0000-0000-0000-000000000009","email":"paula.castro@test.com"}',     'email', NOW(), NOW(), NOW(), 'paula.castro@test.com'),
  (gen_random_uuid(), '22220010-0000-0000-0000-000000000010', '{"sub":"22220010-0000-0000-0000-000000000010","email":"diego.gomez@test.com"}',      'email', NOW(), NOW(), NOW(), 'diego.gomez@test.com')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. INSERTAR PERFILES EN public.usuarios
-- ============================================================
INSERT INTO public.usuarios (id, nombre, email, rol)
VALUES
  ('22220001-0000-0000-0000-000000000001', 'Ana García',       'ana.garcia@test.com',       'cliente'),
  ('22220002-0000-0000-0000-000000000002', 'Carlos Rodríguez', 'carlos.rodriguez@test.com', 'cliente'),
  ('22220003-0000-0000-0000-000000000003', 'Lucía Fernández',  'lucia.fernandez@test.com',  'cliente'),
  ('22220004-0000-0000-0000-000000000004', 'Marcos López',     'marcos.lopez@test.com',     'cliente'),
  ('22220005-0000-0000-0000-000000000005', 'Elena Martínez',   'elena.martinez@test.com',   'cliente'),
  ('22220006-0000-0000-0000-000000000006', 'David Sánchez',    'david.sanchez@test.com',    'cliente'),
  ('22220007-0000-0000-0000-000000000007', 'Sofía Pérez',      'sofia.perez@test.com',      'cliente'),
  ('22220008-0000-0000-0000-000000000008', 'Javier Ruiz',      'javier.ruiz@test.com',      'cliente'),
  ('22220009-0000-0000-0000-000000000009', 'Paula Castro',     'paula.castro@test.com',     'cliente'),
  ('22220010-0000-0000-0000-000000000010', 'Diego Gómez',      'diego.gomez@test.com',      'cliente')
ON CONFLICT (id) DO UPDATE
  SET nombre = EXCLUDED.nombre, email = EXCLUDED.email, rol = EXCLUDED.rol;

-- ============================================================
-- 4. INSERTAR CITAS (distribuidas en los próximos 7 días)
-- ============================================================
INSERT INTO public.citas (usuario_id, fecha, hora_inicio, hora_fin, estado, notas)
VALUES
  ('22220001-0000-0000-0000-000000000001', CURRENT_DATE + 1, '09:00', '10:00', 'confirmada', 'Cita de Ana García'),
  ('22220001-0000-0000-0000-000000000001', CURRENT_DATE + 4, '11:00', '12:00', 'confirmada', 'Cita de Ana García'),
  ('22220002-0000-0000-0000-000000000002', CURRENT_DATE + 1, '10:00', '11:00', 'confirmada', 'Cita de Carlos Rodríguez'),
  ('22220002-0000-0000-0000-000000000002', CURRENT_DATE + 5, '15:00', '16:00', 'confirmada', 'Cita de Carlos Rodríguez'),
  ('22220003-0000-0000-0000-000000000003', CURRENT_DATE + 2, '09:00', '10:00', 'confirmada', 'Cita de Lucía Fernández'),
  ('22220004-0000-0000-0000-000000000004', CURRENT_DATE + 2, '12:00', '13:00', 'confirmada', 'Cita de Marcos López'),
  ('22220004-0000-0000-0000-000000000004', CURRENT_DATE + 6, '10:00', '11:00', 'confirmada', 'Cita de Marcos López'),
  ('22220005-0000-0000-0000-000000000005', CURRENT_DATE + 3, '11:00', '12:00', 'confirmada', 'Cita de Elena Martínez'),
  ('22220006-0000-0000-0000-000000000006', CURRENT_DATE + 3, '14:00', '15:00', 'confirmada', 'Cita de David Sánchez'),
  ('22220007-0000-0000-0000-000000000007', CURRENT_DATE + 4, '09:00', '10:00', 'confirmada', 'Cita de Sofía Pérez'),
  ('22220007-0000-0000-0000-000000000007', CURRENT_DATE + 7, '16:00', '17:00', 'confirmada', 'Cita de Sofía Pérez'),
  ('22220008-0000-0000-0000-000000000008', CURRENT_DATE + 5, '09:00', '10:00', 'confirmada', 'Cita de Javier Ruiz'),
  ('22220009-0000-0000-0000-000000000009', CURRENT_DATE + 6, '13:00', '14:00', 'confirmada', 'Cita de Paula Castro'),
  ('22220010-0000-0000-0000-000000000010', CURRENT_DATE + 7, '11:00', '12:00', 'confirmada', 'Cita de Diego Gómez'),
  ('22220010-0000-0000-0000-000000000010', CURRENT_DATE + 2, '16:00', '17:00', 'confirmada', 'Cita de Diego Gómez');

-- ============================================================
-- 5. VERIFICAR RESULTADO
-- ============================================================
SELECT u.nombre, c.fecha, c.hora_inicio, c.estado
FROM public.citas c
JOIN public.usuarios u ON c.usuario_id = u.id
ORDER BY c.fecha, c.hora_inicio;
