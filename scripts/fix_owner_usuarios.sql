-- ========================================================================================
-- FIX OWNER USUARIOS - REMOVE AUTH FOREIGN KEY
-- Este script soluciona el error al intentar crear un cliente manualmente desde el Owner Backend.
-- Elimina la restricción que obligaba a que el usuario existiera primero en Supabase Auth,
-- y permite generar IDs únicos automáticamente.
-- ========================================================================================

-- Eliminar la restricción de validación contra auth.users
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_id_fkey;

-- Establecer que el ID se auto-genere si no se provee
ALTER TABLE public.usuarios ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Confirmación temporal rápida en caso de faltar configuracion para el admin
INSERT INTO public.configuracion (owner_id, hora_inicio, hora_fin)
SELECT id, '09:00', '20:00'
FROM public.usuarios
WHERE rol = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;
