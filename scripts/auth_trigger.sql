-- ========================================================================================
-- SCRIPT DE AUTOMATIZACIÓN DE PERFILES (TRIGGER)
-- Asegura que cualquier cuenta creada (Email o Google OAuth) tenga su entrada en public.usuarios
-- ========================================================================================

-- 1. Crear la función que inserta el perfil automáticamente
-- Usar SECURITY DEFINER ejecuta la función con los privilegios del creador (postgres), saltando RLS.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.usuarios (id, nombre, email, rol)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Usuario'),
    new.email,
    'cliente'
  );
  RETURN new;
END;
$$;

-- 2. Vincular la función a la creación de usuarios en Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
