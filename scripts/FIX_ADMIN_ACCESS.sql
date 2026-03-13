-- ==============================================================================
-- FIX ADMIN ACCESS - EVIDENTIA
-- Ejecuta este script en el SQL Editor de Supabase para dar permisos de Admin
-- ==============================================================================

-- 1. Asegurar que el usuario admin@gmail.com tiene el rol 'admin'
UPDATE public.usuarios 
SET rol = 'admin' 
WHERE email = 'admin@gmail.com';

-- 2. (Opcional) Si quieres que otros correos también sean admin, añádelos aquí:
-- UPDATE public.usuarios SET rol = 'admin' WHERE email = 'otro@correo.com';

-- 3. Verificar que se ha aplicado
SELECT email, rol FROM public.usuarios WHERE email = 'admin@gmail.com';
