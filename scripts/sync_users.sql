-- ========================================================================================
-- SCRIPT DE SINCRONIZACIÓN DE USUARIOS HUÉRFANOS
-- Ejecuta esto para crear el perfil de los usuarios que ya existían en Supabase (ej. tu Google)
-- pero que perdieron su fila en public.usuarios al borrar las tablas antiguas.
-- ========================================================================================

INSERT INTO public.usuarios (id, nombre, email, rol)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', 'Usuario Sincronizado'),
    email,
    'cliente'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.usuarios);
