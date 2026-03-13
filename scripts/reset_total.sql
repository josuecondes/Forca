-- ========================================================================================
-- RESET TOTAL MASTER - EVIDENTIA BASE DE DATOS
-- Este script destruye la base de datos antigua y la reconstruye perfecta, 
-- solucionando cualquier problema de desincronización y activando la auto-sanación.
-- ========================================================================================

-- 1. LIMPIEZA TOTAL (Para empezar de cero de forma limpia)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

ALTER TABLE IF EXISTS public.citas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.usuarios DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public.citas CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;


-- 2. CREACIÓN DE TABLAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    rol TEXT NOT NULL DEFAULT 'cliente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.citas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'confirmada',
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 3. POLÍTICAS RLS (Seguridad Robusta)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

-- **Políticas Usuarios**
CREATE POLICY "Usuarios leen su propio perfil" ON public.usuarios FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Usuarios actualizan su propio perfil" ON public.usuarios FOR UPDATE TO authenticated USING (auth.uid() = id);
-- **(NUEVA)** Permite a la propia Aplicación auto-crear el perfil si se detecta que no existe:
CREATE POLICY "Usuarios insertan su propio perfil" ON public.usuarios FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins gestionan usuarios" ON public.usuarios FOR ALL TO authenticated USING ((SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin');

-- **Políticas Citas**
CREATE POLICY "Usuarios ven citas confirmadas" ON public.citas FOR SELECT TO authenticated USING (estado = 'confirmada');
CREATE POLICY "Usuarios ven sus citas" ON public.citas FOR SELECT TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "Usuarios crean sus citas" ON public.citas FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Usuarios actualizan sus citas" ON public.citas FOR UPDATE TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "Usuarios borran sus citas" ON public.citas FOR DELETE TO authenticated USING (usuario_id = auth.uid());

CREATE POLICY "Admins gestionan citas" ON public.citas FOR ALL TO authenticated USING ((SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin');


-- 4. TRIGGER CREADOR AUTOMÁTICO DE PERFILES (Para usuarios Nuevos)
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 5. AUTO-SANACIÓN MASIVA INSTANTÁNEA (Para rescate de usuarios antiguos de Auth)
INSERT INTO public.usuarios (id, nombre, email, rol)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', 'Usuario Sincronizado'), email, 'cliente'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.usuarios)
ON CONFLICT (id) DO NOTHING;

-- ¡FIN DEL SCRIPT! Tu base de datos ahora está de 10.
