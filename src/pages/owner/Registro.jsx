import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { FilterX, ChevronDown, Loader2, RotateCcw, ActivitySquare } from 'lucide-react'
import { logRegistro } from '../../utils/registro'

function cn(...c) { return c.filter(Boolean).join(' ') }

const T = {
    page: '#eaecf1',
    card: 'linear-gradient(145deg,#f6f8fc 0%,#eef1f6 100%)',
    cardBorder: '1.5px solid rgba(0,0,0,0.08)',
    cardShadow: '0 2px 12px rgba(0,0,0,0.07)',
    inp: { background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.11)', borderRadius: '12px', padding: '10px 14px', color: '#0d1117', fontSize: '13px', outline: 'none', width: '100%' },
    blue: '#2563eb', blueBg: 'rgba(37,99,235,0.09)', blueBorder: 'rgba(37,99,235,0.25)',
    green: '#16a34a', greenBg: 'rgba(22,163,74,0.09)',
    red: '#dc2626', redBg: 'rgba(220,38,38,0.09)',
    amber: '#d97706', amberBg: 'rgba(217,119,6,0.09)',
    purple: '#7c3aed',
    p1: '#0d1117', p2: '#5a6278', p3: '#8890a4',
}

const ACCIONES = ['crear_cliente','archivar_cliente','eliminar_cliente','editar_estructura_cliente','crear_sesion','mover_sesion','cancelar_sesion','editar_sesion','eliminar_sesion','marcar_realizada','duplicar_sesion','crear_bloqueo','eliminar_bloqueo','editar_bloqueo','registrar_pago','marcar_pagada','marcar_pendiente','cambiar_configuracion','revertir_accion']
const MODULOS = ['calendario','diario','clientes','pagos','configuracion','acciones_rapidas']
const ACCION_LABELS = { crear_cliente:'Crear cliente',archivar_cliente:'Archivar cliente',eliminar_cliente:'Eliminar cliente',editar_estructura_cliente:'Editar estructura',crear_sesion:'Crear sesión',mover_sesion:'Mover sesión',cancelar_sesion:'Cancelar sesión',editar_sesion:'Editar sesión',eliminar_sesion:'Eliminar sesión',marcar_realizada:'Marcar realizada',duplicar_sesion:'Duplicar sesión',crear_bloqueo:'Bloquear',eliminar_bloqueo:'Desbloquear',editar_bloqueo:'Editar bloqueo',registrar_pago:'Registrar pago',marcar_pagada:'Marcar pagada',marcar_pendiente:'Marcar pendiente',cambiar_configuracion:'Cambiar configuración',revertir_accion:'Revertir acción' }
const ACCION_COLOR = { crear_cliente:T.green,marcar_realizada:T.green,registrar_pago:T.green,marcar_pagada:T.green,crear_sesion:T.blue,cancelar_sesion:T.red,eliminar_sesion:T.red,eliminar_cliente:T.red,mover_sesion:T.purple,editar_sesion:T.purple,editar_estructura_cliente:T.purple,revertir_accion:T.amber,archivar_cliente:T.amber }

const Registro = () => {
    const { user } = useAuth()
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [clientes, setClientes] = useState([])
    const [expanded, setExpanded] = useState(null)
    const [reverting, setReverting] = useState(null)
    const [filtros, setFiltros] = useState({ cliente_id: '', accion: '', modulo: '', fecha_desde: '', fecha_hasta: '' })

    const fetchLogs = async () => {
        setLoading(true)
        let q = supabase.from('registro').select('*,usuarios!registro_cliente_id_fkey(nombre),autor:usuarios!registro_autor_id_fkey(nombre)').order('created_at', { ascending: false }).limit(100)
        if (filtros.cliente_id) q = q.eq('cliente_id', filtros.cliente_id)
        if (filtros.accion) q = q.eq('accion', filtros.accion)
        if (filtros.modulo) q = q.eq('modulo_origen', filtros.modulo)
        if (filtros.fecha_desde) q = q.gte('created_at', filtros.fecha_desde)
        if (filtros.fecha_hasta) q = q.lte('created_at', filtros.fecha_hasta + 'T23:59:59')
        const { data } = await q
        setLogs(data || [])
        setLoading(false)
    }
    useEffect(() => { supabase.from('usuarios').select('id,nombre').eq('rol', 'cliente').order('nombre').then(({ data }) => setClientes(data || [])) }, [])
    useEffect(() => { fetchLogs() }, [filtros])

    const limpiarFiltros = () => setFiltros({ cliente_id: '', accion: '', modulo: '', fecha_desde: '', fecha_hasta: '' })
    const hayFiltros = Object.values(filtros).some(Boolean)

    const handleRevertir = async log => {
        setReverting(log.id)
        await logRegistro({ accion: 'revertir_accion', entidad: log.entidad, entidad_id: log.entidad_id, modulo_origen: 'registro', cliente_id: log.cliente_id, valor_anterior: log.valor_nuevo, valor_nuevo: log.valor_anterior, autor_id: user?.id, es_reversion: true, reversion_de: log.id })
        setReverting(null); fetchLogs()
    }
    const reversibles = ['mover_sesion','cancelar_sesion','editar_sesion','editar_estructura_cliente','cambiar_configuracion']

    return (
        <div className="p-4" style={{ background: T.page, minHeight: '100%' }}>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-xl font-black tracking-tight" style={{ color: T.p1 }}>Registro</h2>
                    <p className="text-xs mt-0.5 font-medium" style={{ color: T.p3 }}>Trazabilidad de acciones</p>
                </div>
                {hayFiltros && (
                    <button onClick={limpiarFiltros}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95"
                        style={{ background: '#e9ecf3', color: T.p2, border: '1px solid rgba(0,0,0,0.1)' }}>
                        <FilterX className="w-4 h-4" /> Limpiar
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="rounded-2xl p-4 mb-5 space-y-3" style={{ background: T.card, border: T.cardBorder, boxShadow: T.cardShadow }}>
                <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: T.p3 }}>Filtros</p>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block mb-1 text-[10px] font-black uppercase tracking-wider" style={{ color: T.p3 }}>Cliente</label>
                        <select value={filtros.cliente_id} onChange={e => setFiltros(f => ({ ...f, cliente_id: e.target.value }))} style={T.inp}>
                            <option value="">Todos</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 text-[10px] font-black uppercase tracking-wider" style={{ color: T.p3 }}>Acción</label>
                        <select value={filtros.accion} onChange={e => setFiltros(f => ({ ...f, accion: e.target.value }))} style={T.inp}>
                            <option value="">Todas</option>
                            {ACCIONES.map(a => <option key={a} value={a}>{ACCION_LABELS[a] || a}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block mb-1 text-[10px] font-black uppercase tracking-wider" style={{ color: T.p3 }}>Módulo</label>
                        <select value={filtros.modulo} onChange={e => setFiltros(f => ({ ...f, modulo: e.target.value }))} style={T.inp}>
                            <option value="">Todos</option>
                            {MODULOS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 text-[10px] font-black uppercase tracking-wider" style={{ color: T.p3 }}>Desde</label>
                        <input type="date" value={filtros.fecha_desde} onChange={e => setFiltros(f => ({ ...f, fecha_desde: e.target.value }))} style={T.inp} />
                    </div>
                    <div>
                        <label className="block mb-1 text-[10px] font-black uppercase tracking-wider" style={{ color: T.p3 }}>Hasta</label>
                        <input type="date" value={filtros.fecha_hasta} onChange={e => setFiltros(f => ({ ...f, fecha_hasta: e.target.value }))} style={T.inp} />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin" style={{ color: T.blue }} /></div>
            ) : logs.length > 0 ? (
                <div className="space-y-2">
                    {logs.map(log => {
                        const isExp = expanded === log.id
                        const canRevert = reversibles.includes(log.accion) && !log.es_reversion
                        const color = ACCION_COLOR[log.accion] || T.purple
                        const fecha = new Date(log.created_at)
                        return (
                            <div key={log.id} className="rounded-2xl overflow-hidden transition-all" style={{
                                background: T.card,
                                border: isExp ? `1.5px solid ${color}30` : T.cardBorder,
                                boxShadow: isExp ? `0 4px 20px ${color}15, 0 2px 8px rgba(0,0,0,0.08)` : T.cardShadow
                            }}>
                                {/* Left color bar */}
                                <div className="flex">
                                    <div className="w-1 shrink-0" style={{ background: color }} />
                                    <button className="flex-1 flex items-center gap-3 px-4 py-4 text-left" onClick={() => setExpanded(isExp ? null : log.id)}>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-sm tracking-tight" style={{ color: T.p1 }}>{ACCION_LABELS[log.accion] || log.accion}</p>
                                            <p className="text-xs truncate mt-0.5 font-medium" style={{ color: T.p3 }}>
                                                {log.usuarios?.nombre || 'Sistema'} · <span className="capitalize">{log.modulo_origen}</span>
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0 mr-2">
                                            <p className="text-xs font-bold" style={{ color: T.p2 }}>{fecha.toLocaleDateString('es', { day: '2-digit', month: 'short' })}</p>
                                            <p className="text-[10px]" style={{ color: T.p3 }}>{fecha.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform', isExp && 'rotate-180')} style={{ color: T.p3 }} />
                                    </button>
                                </div>
                                {isExp && (
                                    <div className="px-4 pb-4 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                            {log.valor_anterior && (
                                                <div className="rounded-xl p-3" style={{ background: T.redBg, border: '1px solid rgba(220,38,38,0.18)' }}>
                                                    <p className="font-black mb-1.5" style={{ color: T.red }}>ANTERIOR</p>
                                                    <pre className="text-[10px] whitespace-pre-wrap break-all" style={{ color: T.red }}>
                                                        {JSON.stringify(JSON.parse(log.valor_anterior), null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                            {log.valor_nuevo && (
                                                <div className="rounded-xl p-3" style={{ background: T.greenBg, border: '1px solid rgba(22,163,74,0.18)' }}>
                                                    <p className="font-black mb-1.5" style={{ color: T.green }}>NUEVO</p>
                                                    <pre className="text-[10px] whitespace-pre-wrap break-all" style={{ color: T.green }}>
                                                        {JSON.stringify(JSON.parse(log.valor_nuevo), null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                        {log.es_reversion && <p className="text-xs mb-2 font-medium" style={{ color: T.amber }}>↩ Esta es una reversión</p>}
                                        {canRevert && (
                                            <button onClick={() => handleRevertir(log)} disabled={reverting === log.id}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-40"
                                                style={{ background: T.amberBg, color: T.amber, border: '1px solid rgba(217,119,6,0.25)' }}>
                                                {reverting === log.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                                Revertir acción
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-20">
                    <ActivitySquare className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(0,0,0,0.15)' }} />
                    <p className="font-medium" style={{ color: T.p3 }}>No hay registros{hayFiltros ? ' para los filtros aplicados' : ' aún'}</p>
                </div>
            )}
        </div>
    )
}

export default Registro
