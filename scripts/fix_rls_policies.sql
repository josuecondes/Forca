-- ============================================================
-- SCRIPT DE CORRECCION DE PERMISOS RLS (Row Level Security)
-- Este script configura la seguridad de Supabase correctamente.
-- ============================================================

-- 1. HABILITAR RLS (Row Level Security)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas    ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PARA LA TABLA [usuarios]
-- Los usuarios pueden leer su propio perfil.
CREATE POLICY "Usuarios pueden leer su propio perfil" 
ON public.usuarios FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil (opcional, p.ej. nombre).
CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
ON public.usuarios FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Los administradores pueden leer y gestionar todos los usuarios.
CREATE POLICY "Admins gestionan todos los usuarios" 
ON public.usuarios FOR ALL 
TO authenticated 
USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin' );


-- 3. POLÍTICAS PARA LA TABLA [citas]
-- Los usuarios pueden leer todas las citas marcadas como 'confirmada' (solo para ver disponibilidad del calendario).
-- Si queremos máxima privacidad, que solo vean fecha/hora de otros, pero por ahora esto es suficiente.
CREATE POLICY "Usuarios ven citas confirmadas (calendario)" 
ON public.citas FOR SELECT 
TO authenticated 
USING (estado = 'confirmada');

-- Los usuarios pueden leer sus propias citas completas (incl. notas si las hubiera).
CREATE POLICY "Usuarios ven sus propias citas" 
ON public.citas FOR SELECT 
TO authenticated 
USING (usuario_id = auth.uid());

-- Los usuarios pueden INSERTAR sus propias citas.
CREATE POLICY "Usuarios crean sus propias citas" 
ON public.citas FOR INSERT 
TO authenticated 
WITH CHECK (usuario_id = auth.uid());

-- Los usuarios pueden MODIFICAR/ELIMINAR sus propias citas (si están en el futuro).
CREATE POLICY "Usuarios modifican sus propias citas" 
ON public.citas FOR UPDATE 
TO authenticated 
USING (usuario_id = auth.uid());

CREATE POLICY "Usuarios eliminan sus propias citas" 
ON public.citas FOR DELETE 
TO authenticated 
USING (usuario_id = auth.uid());

-- Los administradores tienen control total sobre las citas.
CREATE POLICY "Admins gestionan todas las citas" 
ON public.citas FOR ALL 
TO authenticated 
USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin' );

-- ============================================================
-- SECCIÓN DE TRABAJO PARA ADMIN (DATO POR DEFECTO)
-- Ejecuta esto solo si necesitas forzar que alguien sea admin manualmente:
-- UPDATE public.usuarios SET rol = 'admin' WHERE email = 'admin@correo.com';
-- ============================================================
