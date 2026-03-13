-- ==============================================================================
-- 1. CREACIÓN DE TABLAS (SCHEMA)
-- Asegura que las tablas existan con la estructura que espera la aplicación
-- ==============================================================================

-- Habilitar extensión para UUIDs (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Usuarios (Extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    rol TEXT NOT NULL DEFAULT 'cliente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Citas (Reservas)
CREATE TABLE IF NOT EXISTS public.citas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'confirmada',
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 2. POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- ==============================================================================

-- Habilitar RLS en ambas tablas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas    ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores si existieran (para evitar duplicados al re-ejecutar)
DROP POLICY IF EXISTS "Usuarios pueden leer su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admins gestionan todos los usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios ven citas confirmadas (calendario)" ON public.citas;
DROP POLICY IF EXISTS "Usuarios ven sus propias citas" ON public.citas;
DROP POLICY IF EXISTS "Usuarios crean sus propias citas" ON public.citas;
DROP POLICY IF EXISTS "Usuarios modifican sus propias citas" ON public.citas;
DROP POLICY IF EXISTS "Usuarios eliminan sus propias citas" ON public.citas;
DROP POLICY IF EXISTS "Admins gestionan todas las citas" ON public.citas;

-- ------------------------------------------------------------------------------
-- Políticas para [usuarios]
-- ------------------------------------------------------------------------------
CREATE POLICY "Usuarios pueden leer su propio perfil" 
ON public.usuarios FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
ON public.usuarios FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Admins gestionan todos los usuarios" 
ON public.usuarios FOR ALL 
TO authenticated 
USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin' );

-- ------------------------------------------------------------------------------
-- Políticas para [citas]
-- ------------------------------------------------------------------------------
CREATE POLICY "Usuarios ven citas confirmadas (calendario)" 
ON public.citas FOR SELECT 
TO authenticated 
USING (estado = 'confirmada');

CREATE POLICY "Usuarios ven sus propias citas" 
ON public.citas FOR SELECT 
TO authenticated 
USING (usuario_id = auth.uid());

CREATE POLICY "Usuarios crean sus propias citas" 
ON public.citas FOR INSERT 
TO authenticated 
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Usuarios modifican sus propias citas" 
ON public.citas FOR UPDATE 
TO authenticated 
USING (usuario_id = auth.uid());

CREATE POLICY "Usuarios eliminan sus propias citas" 
ON public.citas FOR DELETE 
TO authenticated 
USING (usuario_id = auth.uid());

CREATE POLICY "Admins gestionan todas las citas" 
ON public.citas FOR ALL 
TO authenticated 
USING ( (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin' );
