-- ==============================================================================
-- Tabla de Notificaciones (Para el Panel de Admin)
-- ==============================================================================

-- 1. Crear Tabla
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mensaje TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'creacion', 'modificacion', 'anulacion'
    leida BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar Políticas Anteriores (si se re-ejecuta el script)
DROP POLICY IF EXISTS "Cualquiera puede insertar notificaciones" ON public.notificaciones;
DROP POLICY IF EXISTS "Admins pueden leer notificaciones" ON public.notificaciones;
DROP POLICY IF EXISTS "Admins pueden actualizar notificaciones" ON public.notificaciones;
DROP POLICY IF EXISTS "Admins pueden eliminar notificaciones" ON public.notificaciones;

-- 4. Crear Políticas

-- Los clientes (usuarios autenticados) pueden crear notificaciones
CREATE POLICY "Cualquiera puede insertar notificaciones"
ON public.notificaciones FOR INSERT
TO authenticated
WITH CHECK (true);

-- Sólo los admins pueden ver las notificaciones
CREATE POLICY "Admins pueden leer notificaciones"
ON public.notificaciones FOR SELECT
TO authenticated
USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin' );

-- Sólo los admins pueden actualizar las notificaciones (ej. marcar como leídas)
CREATE POLICY "Admins pueden actualizar notificaciones"
ON public.notificaciones FOR UPDATE
TO authenticated
USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin' );

-- Sólo los admins pueden eliminar notificaciones
CREATE POLICY "Admins pueden eliminar notificaciones"
ON public.notificaciones FOR DELETE
TO authenticated
USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin' );
