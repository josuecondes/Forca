import { supabase } from '../lib/supabase'

/**
 * Escribe una entrada en la tabla `registro` (log de trazabilidad).
 * @param {Object} params
 * @param {string} params.accion - ej: 'crear_sesion', 'cancelar_sesion'
 * @param {string} params.entidad - ej: 'sesion', 'bloqueo', 'cliente'
 * @param {string} params.modulo_origen - 'calendario' | 'diario' | 'clientes' | 'pagos' | 'configuracion' | 'acciones_rapidas'
 * @param {string|null} [params.cliente_id]
 * @param {string|null} [params.entidad_id]
 * @param {any} [params.valor_anterior]
 * @param {any} [params.valor_nuevo]
 * @param {string|null} [params.autor_id]
 * @param {number|null} [params.impacto_economico]
 * @param {boolean} [params.es_reversion]
 * @param {string|null} [params.reversion_de]
 */
export const logRegistro = async ({
    accion,
    entidad,
    modulo_origen,
    cliente_id = null,
    entidad_id = null,
    valor_anterior = null,
    valor_nuevo = null,
    autor_id = null,
    impacto_economico = null,
    es_reversion = false,
    reversion_de = null,
}) => {
    try {
        const { error } = await supabase.from('registro').insert({
            accion,
            entidad,
            modulo_origen,
            cliente_id,
            entidad_id,
            valor_anterior: valor_anterior ? JSON.stringify(valor_anterior) : null,
            valor_nuevo: valor_nuevo ? JSON.stringify(valor_nuevo) : null,
            autor_id,
            impacto_economico,
            es_reversion,
            reversion_de,
        })
        if (error) console.warn('Error al registrar acción:', error.message)
    } catch (e) {
        console.warn('logRegistro falló silenciosamente:', e.message)
    }
}
