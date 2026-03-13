-- ========================================================================================
-- OWNER BACKEND SCHEMA — EVIDENTIA
-- Ejecutar DESPUÉS del reset_total.sql existente (no borra tablas existentes)
-- Añade las nuevas tablas para el sistema owner completo
-- ========================================================================================

-- ── Extensión necesaria (ya existe si se corrió reset_total.sql)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. CONFIGURACIÓN GLOBAL (singleton del owner)
CREATE TABLE IF NOT EXISTS public.configuracion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    hora_inicio TEXT NOT NULL DEFAULT '09:00',
    hora_fin TEXT NOT NULL DEFAULT '20:00',
    dias_laborables TEXT[] NOT NULL DEFAULT ARRAY['lun','mar','mie','jue','vie','sab'],
    ventana_cancelacion_horas INTEGER NOT NULL DEFAULT 24,
    ventana_modificacion_horas INTEGER NOT NULL DEFAULT 24,
    periodo_movimiento_dias INTEGER NOT NULL DEFAULT 7,
    sesion_extra_permitida BOOLEAN NOT NULL DEFAULT true,
    duracion_sesion_minutos INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 2. ESTRUCTURA BASE DEL CLIENTE
CREATE TABLE IF NOT EXISTS public.clientes_estructura (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    sesiones_semanales INTEGER NOT NULL DEFAULT 1,
    distribucion_semanal TEXT[] NOT NULL DEFAULT ARRAY['lun'],
    hora_habitual TEXT NOT NULL DEFAULT '10:00',
    precio_por_sesion NUMERIC(10,2) NOT NULL DEFAULT 0,
    fecha_inicio DATE,
    estado TEXT NOT NULL DEFAULT 'activo', -- activo, archivado
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 3. SESIONES (instancias concretas de trabajo)
CREATE TABLE IF NOT EXISTS public.sesiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'regular', -- regular, extra, puntual
    estado TEXT NOT NULL DEFAULT 'programada', -- programada, realizada, cancelada
    pago_estado TEXT NOT NULL DEFAULT 'pendiente', -- pendiente, pagado
    pago_fecha DATE,
    importe NUMERIC(10,2),
    notas TEXT,
    es_excepcion BOOLEAN NOT NULL DEFAULT false, -- fue modificada manualmente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 4. BLOQUEOS
CREATE TABLE IF NOT EXISTS public.bloqueos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'franja', -- dia_completo, franja, huecos_libres
    hora_inicio TEXT, -- NULL si es dia_completo
    hora_fin TEXT,    -- NULL si es dia_completo
    motivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 5. PAGOS
CREATE TABLE IF NOT EXISTS public.pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    sesion_id UUID REFERENCES public.sesiones(id) ON DELETE SET NULL,
    importe NUMERIC(10,2) NOT NULL DEFAULT 0,
    fecha_pago DATE NOT NULL,
    metodo TEXT DEFAULT 'efectivo', -- efectivo, transferencia, otro
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- ── 6. REGISTRO (log de trazabilidad)
CREATE TABLE IF NOT EXISTS public.registro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    accion TEXT NOT NULL,           -- ej: 'crear_sesion', 'cancelar_sesion', etc.
    entidad TEXT NOT NULL,          -- ej: 'sesion', 'bloqueo', 'cliente', 'pago', 'configuracion'
    entidad_id UUID,                -- ID del objeto afectado
    valor_anterior JSONB,
    valor_nuevo JSONB,
    autor_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    modulo_origen TEXT NOT NULL,    -- calendario, diario, clientes, pagos, configuracion, acciones_rapidas
    impacto_economico NUMERIC(10,2),
    es_reversion BOOLEAN NOT NULL DEFAULT false,
    reversion_de UUID REFERENCES public.registro(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);


-- ========================================================================================
-- POLÍTICAS RLS
-- ========================================================================================

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_estructura ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registro ENABLE ROW LEVEL SECURITY;

-- Admins tienen acceso total a todas las tablas nuevas
CREATE POLICY "Admin full access configuracion" ON public.configuracion FOR ALL TO authenticated
    USING ((SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin full access clientes_estructura" ON public.clientes_estructura FOR ALL TO authenticated
    USING ((SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin full access sesiones" ON public.sesiones FOR ALL TO authenticated
    USING ((SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin full access bloqueos" ON public.bloqueos FOR ALL TO authenticated
    USING ((SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin full access pagos" ON public.pagos FOR ALL TO authenticated
    USING ((SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin full access registro" ON public.registro FOR ALL TO authenticated
    USING ((SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'admin');

-- Clientes pueden ver sus propias sesiones
CREATE POLICY "Clientes ven sus sesiones" ON public.sesiones FOR SELECT TO authenticated
    USING (cliente_id = auth.uid());

-- Clientes pueden ver su estructura base
CREATE POLICY "Clientes ven su estructura" ON public.clientes_estructura FOR SELECT TO authenticated
    USING (usuario_id = auth.uid());


-- ========================================================================================
-- ÍNDICES para performance
-- ========================================================================================

CREATE INDEX IF NOT EXISTS idx_sesiones_fecha ON public.sesiones(fecha);
CREATE INDEX IF NOT EXISTS idx_sesiones_cliente ON public.sesiones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_estado ON public.sesiones(estado);
CREATE INDEX IF NOT EXISTS idx_bloqueos_fecha ON public.bloqueos(fecha);
CREATE INDEX IF NOT EXISTS idx_registro_created ON public.registro(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registro_cliente ON public.registro(cliente_id);
CREATE INDEX IF NOT EXISTS idx_registro_modulo ON public.registro(modulo_origen);
CREATE INDEX IF NOT EXISTS idx_pagos_cliente ON public.pagos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON public.pagos(fecha_pago);


-- ========================================================================================
-- CONFIGURACIÓN INICIAL DEL OWNER (se inserta la primera vez)
-- Reemplaza admin@gmail.com si el owner tiene otro email
-- ========================================================================================

INSERT INTO public.configuracion (owner_id, hora_inicio, hora_fin)
SELECT id, '09:00', '20:00'
FROM public.usuarios
WHERE rol = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ¡Listo! Las tablas del Owner Backend están creadas.
