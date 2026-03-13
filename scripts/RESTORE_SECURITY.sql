-- ========================================================================================
-- RESTAURACIÓN DE SEGURIDAD (RESTORE RLS)
-- Este script vuelve a activar la seguridad ahora que ya tienes acceso.
-- ========================================================================================

-- 1. RE-ACTIVAR RLS (La puerta se vuelve a cerrar)
ALTER TABLE IF EXISTS public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.citas    ENABLE ROW LEVEL SECURITY;

-- 2. ASEGURAR QUE LAS POLÍTICAS ESTÉN ACTIVAS
-- (Re-ejecutamos las políticas del Reset Total para estar 100% seguros)

DROP POLICY IF EXISTS "Usuarios leen su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios actualizan su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios insertan su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admins gestionan usuarios" ON public.usuarios;

DROP POLICY IF EXISTS "Usuarios ven citas confirmadas" ON public.citas;
DROP POLICY IF EXISTS "Usuarios ven sus citas" ON public.citas;
DROP POLICY IF EXISTS "Usuarios crean sus citas" ON public.citas;
DROP POLICY IF EXISTS "Usuarios actualizan sus citas" ON public.citas;
DROP POLICY IF EXISTS "Usuarios borran sus citas" ON public.citas;
DROP POLICY IF EXISTS "Admins gestionan citas" ON public.citas;

-- **Políticas Usuarios**
CREATE POLICY "Usuarios leen su propio perfil" ON public.usuarios FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Usuarios actualizan su propio perfil" ON public.usuarios FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Usuarios insertan su propio perfil" ON public.usuarios FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins gestionan usuarios" ON public.usuarios FOR ALL TO authenticated USING ((SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin');

-- **Políticas Citas**
CREATE POLICY "Usuarios ven citas confirmadas" ON public.citas FOR SELECT TO authenticated USING (estado = 'confirmada');
CREATE POLICY "Usuarios ven sus citas" ON public.citas FOR SELECT TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "Usuarios crean sus citas" ON public.citas FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Usuarios actualizan sus citas" ON public.citas FOR UPDATE TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "Usuarios borran sus citas" ON public.citas FOR DELETE TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "Admins gestionan citas" ON public.citas FOR ALL TO authenticated USING ((SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin');

-- ¡LISTO! La seguridad ha vuelto y tú ya estás dentro.
