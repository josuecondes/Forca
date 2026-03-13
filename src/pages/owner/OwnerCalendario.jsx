import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
    format, addMonths, subMonths, addDays, subDays,
    startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, isSameMonth, isSameDay, addWeeks, subWeeks
} from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { logRegistro } from '../../utils/registro'
import {
    ChevronLeft, ChevronRight, X, Move, Ban, Edit2, Check,
    User2, DollarSign, MoreVertical, Lock, Unlock, Loader2,
    Plus, Copy, Trash2
} from 'lucide-react'

function cn(...c) { return c.filter(Boolean).join(' ') }

const HORAS = []
for (let h = 9; h <= 20; h++) {
    HORAS.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 20) HORAS.push(`${String(h).padStart(2, '0')}:30`)
}

const addHoraMinutos = (hora, mins) => {
    const [h, m] = hora.split(':').map(Number)
    const total = h * 60 + m + mins
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// ─── PANEL POP-UP CONTEXTUAL ──────────────────────────────────────────────────
const PanelContextual = ({ type, data, clienteNombre, position, onClose, onAction }) => {
    const [showMore, setShowMore] = useState(false)

    const style = {
        position: 'fixed',
        top: Math.min(position.y, window.innerHeight - 320),
        left: Math.min(Math.max(position.x - 140, 8), window.innerWidth - 290),
        width: 280,
        zIndex: 300,
    }

    if (type === 'sesion') return (
        <div style={style} className="bg-[#111318] border border-white/15 rounded-3xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/8">
                <div className="w-9 h-9 bg-[#22c55e]/15 rounded-full flex items-center justify-center text-[#22c55e] font-black text-sm shrink-0">
                    {clienteNombre?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-sm truncate">{clienteNombre}</p>
                    <p className="text-white/35 text-xs">{data.hora_inicio} – {data.hora_fin}</p>
                </div>
                <button onClick={onClose} className="p-1.5 bg-white/5 rounded-full hover:bg-white/10"><X className="w-3.5 h-3.5 text-white/40" /></button>
            </div>

            {/* Estado pago */}
            <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl mb-3',
                data.pago_estado === 'pagado' ? 'bg-[#22c55e]/10' : 'bg-amber-400/10')}>
                <DollarSign className="w-3.5 h-3.5" style={{ color: data.pago_estado === 'pagado' ? '#22c55e' : '#f59e0b' }} />
                <span className="text-sm font-bold" style={{ color: data.pago_estado === 'pagado' ? '#22c55e' : '#f59e0b' }}>
                    {data.pago_estado === 'pagado' ? 'Pagada' : 'Pendiente de pago'}
                </span>
            </div>

            {/* Acciones principales */}
            <div className="grid grid-cols-2 gap-2 mb-2">
                <PanelBtn icon={<Move className="w-4 h-4" />} label="Mover" onClick={() => onAction('mover')} color="#a78bfa" />
                <PanelBtn icon={<Check className="w-4 h-4" />} label={data.estado === 'realizada' ? 'Desmarcar' : 'Realizada'}
                    onClick={() => onAction('realizada')} color="#22c55e" active={data.estado === 'realizada'} />
                <PanelBtn icon={<Edit2 className="w-4 h-4" />} label="Editar" onClick={() => onAction('editar')} color="#60a5fa" />
                <PanelBtn icon={<Ban className="w-4 h-4" />} label="Cancelar" onClick={() => onAction('cancelar')} color="#ef4444" />
            </div>
            <button onClick={() => onAction('ver_cliente')}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/5 text-white/60 rounded-2xl text-xs font-bold hover:bg-white/10 transition-colors mb-2">
                <User2 className="w-3.5 h-3.5" /> Ver ficha cliente
            </button>

            {/* Más opciones */}
            <button onClick={() => setShowMore(!showMore)}
                className="w-full flex items-center justify-between px-3 py-2 text-white/30 text-xs font-bold hover:text-white/50 transition-colors">
                <span>Más opciones</span>
                <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {showMore && (
                <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
                    <button onClick={() => onAction('duplicar')} className="w-full flex items-center gap-2 px-3 py-2 text-white/50 text-xs hover:bg-white/5 rounded-xl transition-colors"><Copy className="w-3.5 h-3.5" /> Duplicar sesión</button>
                    <button onClick={() => onAction('pago_toggle')} className="w-full flex items-center gap-2 px-3 py-2 text-white/50 text-xs hover:bg-white/5 rounded-xl transition-colors"><DollarSign className="w-3.5 h-3.5" /> {data.pago_estado === 'pagado' ? 'Marcar pendiente' : 'Marcar pagada'}</button>
                    <button onClick={() => onAction('eliminar')} className="w-full flex items-center gap-2 px-3 py-2 text-red-400/70 text-xs hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 className="w-3.5 h-3.5" /> Eliminar sesión</button>
                </div>
            )}
        </div>
    )

    if (type === 'hueco') return (
        <div style={style} className="bg-[#111318] border border-white/15 rounded-3xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
                <p className="text-white font-black text-sm">{data.fecha} · {data.hora}</p>
                <button onClick={onClose} className="p-1.5 bg-white/5 rounded-full hover:bg-white/10"><X className="w-3.5 h-3.5 text-white/40" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <PanelBtn icon={<Plus className="w-4 h-4" />} label="Nueva sesión" onClick={() => onAction('nueva_sesion')} color="#22c55e" />
                <PanelBtn icon={<Plus className="w-4 h-4" />} label="Sesión extra" onClick={() => onAction('sesion_extra')} color="#60a5fa" />
                <PanelBtn icon={<Lock className="w-4 h-4" />} label="Bloquear" onClick={() => onAction('bloquear')} color="#ef4444" />
                <PanelBtn icon={<Lock className="w-4 h-4" />} label="Bloquear franja" onClick={() => onAction('bloquear_franja')} color="#f97316" />
            </div>
        </div>
    )

    if (type === 'bloqueo') return (
        <div style={style} className="bg-[#111318] border border-white/15 rounded-3xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-red-400" />
                    <p className="text-white font-black text-sm">Bloqueo</p>
                </div>
                <button onClick={onClose} className="p-1.5 bg-white/5 rounded-full hover:bg-white/10"><X className="w-3.5 h-3.5 text-white/40" /></button>
            </div>
            <p className="text-white/40 text-xs mb-4">{data.tipo === 'dia_completo' ? 'Día completo' : `${data.hora_inicio} – ${data.hora_fin}`}</p>
            <div className="grid grid-cols-2 gap-2">
                <PanelBtn icon={<Edit2 className="w-4 h-4" />} label="Editar" onClick={() => onAction('editar_bloqueo')} color="#a78bfa" />
                <PanelBtn icon={<Unlock className="w-4 h-4" />} label="Desbloquear" onClick={() => onAction('desbloquear')} color="#22c55e" />
            </div>
        </div>
    )

    return null
}

const PanelBtn = ({ icon, label, onClick, color, active }) => (
    <button onClick={onClick}
        className={cn('flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all text-xs font-bold',
            active
                ? 'border-opacity-50 text-white'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
        )}
        style={active ? { backgroundColor: `${color}25`, borderColor: `${color}50`, color } : {}}>
        <span style={{ color: active ? color : undefined }}>{icon}</span>
        {label}
    </button>
)

// ─── MODALES (reutilizamos los del Diario) ─────────────────────────────────────
const ModalCrearSesionCal = ({ payload, clientes, onClose, onSaved }) => {
    const { user } = useAuth()
    const [form, setForm] = useState({
        cliente_id: '', hora_inicio: payload.hora || '10:00', tipo: payload.tipo || 'regular'
    })
    const [loading, setLoading] = useState(false)
    const getHoraFin = (hi) => { const [h, m] = hi.split(':').map(Number); return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}` }

    const handleSave = async () => {
        if (!form.cliente_id) return
        setLoading(true)
        try {
            const { data, error } = await supabase.from('sesiones').insert({
                cliente_id: form.cliente_id, owner_id: user?.id,
                fecha: payload.fecha, hora_inicio: form.hora_inicio,
                hora_fin: getHoraFin(form.hora_inicio),
                tipo: form.tipo, estado: 'programada', pago_estado: 'pendiente'
            }).select().single()
            if (error) throw error
            await logRegistro({ accion: 'crear_sesion', entidad: 'sesion', entidad_id: data.id, modulo_origen: 'calendario', cliente_id: form.cliente_id, valor_nuevo: form, autor_id: user?.id })
            onSaved(); onClose()
        } catch (e) { alert(e.message) } finally { setLoading(false) }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[400] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="bg-[#111318] border border-white/10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.9)' }}>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-base font-black text-white">{payload.tipo === 'extra' ? 'Sesión extra' : 'Nueva sesión'}</h3>
                        <p className="text-white/40 text-xs">{payload.fecha} · {payload.hora}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><X className="w-4 h-4 text-white/50" /></button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-white/40 font-bold mb-1 block">Cliente *</label>
                        <select value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none">
                            <option value="" className="bg-[#111318]">Seleccionar...</option>
                            {clientes.map(c => <option key={c.id} value={c.id} className="bg-[#111318]">{c.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-white/40 font-bold mb-1 block">Hora</label>
                        <select value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none">
                            {HORAS.map(h => <option key={h} value={h} className="bg-[#111318]">{h}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 mt-5">
                    <button onClick={handleSave} disabled={loading || !form.cliente_id}
                        className="flex-1 py-3.5 bg-[#22c55e]/20 text-[#22c55e] rounded-2xl font-black text-sm border border-[#22c55e]/30 disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                    </button>
                    <button onClick={onClose} className="px-5 py-3.5 bg-white/5 text-white/50 rounded-2xl font-bold text-sm">Cancelar</button>
                </div>
            </div>
        </div>
    )
}

const ModalMoverCal = ({ sesion, clientes, onClose, onSaved }) => {
    const { user } = useAuth()
    const [fecha, setFecha] = useState(sesion.fecha)
    const [hora, setHora] = useState(sesion.hora_inicio)
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        const horaFin = addHoraMinutos(hora, 60)
        try {
            await supabase.from('sesiones').update({ fecha, hora_inicio: hora, hora_fin: horaFin, updated_at: new Date().toISOString() }).eq('id', sesion.id)
            await logRegistro({ accion: 'mover_sesion', entidad: 'sesion', entidad_id: sesion.id, modulo_origen: 'calendario', cliente_id: sesion.cliente_id, valor_anterior: { fecha: sesion.fecha, hora_inicio: sesion.hora_inicio }, valor_nuevo: { fecha, hora_inicio: hora }, autor_id: user?.id })
            onSaved(); onClose()
        } catch (e) { alert(e.message) } finally { setLoading(false) }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[400] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="bg-[#111318] border border-white/10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.9)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-black text-white">Mover sesión</h3>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><X className="w-4 h-4 text-white/50" /></button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-white/40 font-bold mb-1 block">Nueva fecha</label>
                        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none" />
                    </div>
                    <div>
                        <label className="text-xs text-white/40 font-bold mb-1 block">Nueva hora</label>
                        <select value={hora} onChange={e => setHora(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none">
                            {HORAS.map(h => <option key={h} value={h} className="bg-[#111318]">{h}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 mt-5">
                    <button onClick={handleSave} disabled={loading} className="flex-1 py-3.5 bg-[#a78bfa]/20 text-[#a78bfa] rounded-2xl font-black text-sm border border-[#a78bfa]/30 disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Move className="w-4 h-4" />} Mover
                    </button>
                    <button onClick={onClose} className="px-5 py-3.5 bg-white/5 text-white/50 rounded-2xl font-bold text-sm">Cancelar</button>
                </div>
            </div>
        </div>
    )
}

const ModalBloqueoCal = ({ payload, onClose, onSaved }) => {
    const { user } = useAuth()
    const [tipo, setTipo] = useState(payload.tipo || 'franja')
    const [horaInicio, setHoraInicio] = useState(payload.hora || '09:00')
    const [horaFin, setHoraFin] = useState('20:00')
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase.from('bloqueos').insert({
                owner_id: user?.id, fecha: payload.fecha, tipo,
                hora_inicio: tipo === 'dia_completo' ? null : horaInicio,
                hora_fin: tipo === 'dia_completo' ? null : horaFin,
            }).select().single()
            if (error) throw error
            await logRegistro({ accion: 'crear_bloqueo', entidad: 'bloqueo', entidad_id: data.id, modulo_origen: 'calendario', valor_nuevo: { fecha: payload.fecha, tipo }, autor_id: user?.id })
            onSaved(); onClose()
        } catch (e) { alert(e.message) } finally { setLoading(false) }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[400] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="bg-[#111318] border border-white/10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.9)' }}>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-base font-black text-white">Nuevo bloqueo</h3>
                        <p className="text-white/40 text-xs">{payload.fecha}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><X className="w-4 h-4 text-white/50" /></button>
                </div>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        {[['dia_completo', 'Día completo'], ['franja', 'Franja'], ['huecos_libres', 'Huecos libres']].map(([v, l]) => (
                            <button key={v} onClick={() => setTipo(v)} className={cn('flex-1 py-2 rounded-xl text-xs font-bold border transition-all',
                                tipo === v ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/5 text-white/40 border-white/10')}>
                                {l}
                            </button>
                        ))}
                    </div>
                    {tipo !== 'dia_completo' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-white/40 font-bold mb-1 block">Inicio</label>
                                <select value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none">
                                    {HORAS.map(h => <option key={h} value={h} className="bg-[#111318]">{h}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-white/40 font-bold mb-1 block">Fin</label>
                                <select value={horaFin} onChange={e => setHoraFin(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none">
                                    {HORAS.map(h => <option key={h} value={h} className="bg-[#111318]">{h}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-3 mt-5">
                    <button onClick={handleSave} disabled={loading} className="flex-1 py-3.5 bg-red-500/15 text-red-400 rounded-2xl font-black text-sm border border-red-500/30 disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Bloquear
                    </button>
                    <button onClick={onClose} className="px-5 py-3.5 bg-white/5 text-white/50 rounded-2xl font-bold text-sm">Cancelar</button>
                </div>
            </div>
        </div>
    )
}

// ─── CALENDARIO OWNER PRINCIPAL ────────────────────────────────────────────────
const OwnerCalendario = ({ onNavigate }) => {
    const { user } = useAuth()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [vista, setVista] = useState('semanal') // mensual | semanal | diaria
    const [sesiones, setSesiones] = useState([])
    const [bloqueos, setBloqueos] = useState([])
    const [clientes, setClientes] = useState([])
    const [loading, setLoading] = useState(true)
    const [panel, setPanel] = useState(null) // { type, data, position, clienteNombre }
    const [modal, setModal] = useState(null) // { type, payload }
    const [confirmAction, setConfirmAction] = useState(null)

    // Drag state
    const dragSesion = useRef(null)
    const dragTarget = useRef(null)
    const dragOverlay = useRef(null)

    const fetchData = useCallback(async () => {
        setLoading(true)
        const [{ data: ses }, { data: bloq }] = await Promise.all([
            supabase.from('sesiones').select('*, clientes:usuarios!sesiones_cliente_id_fkey(nombre)').order('hora_inicio'),
            supabase.from('bloqueos').select('*')
        ])
        setSesiones(ses || [])
        setBloqueos(bloq || [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchData() }, [currentDate])
    useEffect(() => {
        supabase.from('usuarios').select('id, nombre').eq('rol', 'cliente').order('nombre')
            .then(({ data }) => setClientes(data || []))
    }, [])

    const getSesionEnFechaHora = (fecha, hora) => {
        const fechaStr = format(fecha, 'yyyy-MM-dd')
        return sesiones.find(s => {
            if (s.fecha !== fechaStr) return false
            return s.hora_inicio <= hora && s.hora_fin > hora
        })
    }

    const getBloqueoEnFechaHora = (fecha, hora) => {
        const fechaStr = format(fecha, 'yyyy-MM-dd')
        return bloqueos.find(b => {
            if (b.fecha !== fechaStr) return false
            if (b.tipo === 'dia_completo') return true
            return b.hora_inicio <= hora && b.hora_fin > hora
        })
    }

    const isPast = (fecha, hora) => {
        const [h, m] = hora.split(':').map(Number)
        const d = new Date(fecha)
        d.setHours(h, m, 0, 0)
        return d < new Date()
    }

    // ── Acciones panel ────────────────────────────────────────────────────────
    const handlePanelAction = async (action, sesion) => {
        setPanel(null)
        switch (action) {
            case 'mover': setModal({ type: 'mover', payload: sesion }); break
            case 'editar': setModal({ type: 'editar', payload: sesion }); break
            case 'realizada': {
                const nuevo = sesion.estado === 'realizada' ? 'programada' : 'realizada'
                await supabase.from('sesiones').update({ estado: nuevo, updated_at: new Date().toISOString() }).eq('id', sesion.id)
                await logRegistro({ accion: 'marcar_realizada', entidad: 'sesion', entidad_id: sesion.id, modulo_origen: 'calendario', cliente_id: sesion.cliente_id, valor_anterior: { estado: sesion.estado }, valor_nuevo: { estado: nuevo }, autor_id: user?.id })
                fetchData(); break
            }
            case 'cancelar': setConfirmAction({ type: 'cancelar', data: sesion }); break
            case 'eliminar': setConfirmAction({ type: 'eliminar', data: sesion }); break
            case 'duplicar': {
                const { data: dup } = await supabase.from('sesiones').insert({ ...sesion, id: undefined, created_at: undefined, updated_at: undefined, estado: 'programada' }).select().single()
                if (dup) await logRegistro({ accion: 'duplicar_sesion', entidad: 'sesion', entidad_id: dup.id, modulo_origen: 'calendario', cliente_id: sesion.cliente_id, autor_id: user?.id })
                fetchData(); break
            }
            case 'pago_toggle': {
                const nuevoPago = sesion.pago_estado === 'pagado' ? 'pendiente' : 'pagado'
                await supabase.from('sesiones').update({ pago_estado: nuevoPago, pago_fecha: nuevoPago === 'pagado' ? format(new Date(), 'yyyy-MM-dd') : null }).eq('id', sesion.id)
                await logRegistro({ accion: nuevoPago === 'pagado' ? 'marcar_pagada' : 'marcar_pendiente', entidad: 'sesion', entidad_id: sesion.id, modulo_origen: 'calendario', cliente_id: sesion.cliente_id, autor_id: user?.id })
                fetchData(); break
            }
            case 'ver_cliente': onNavigate && onNavigate('clientes', { clienteId: sesion.cliente_id }); break
        }
    }

    const handleHuecoAction = (action, payload) => {
        setPanel(null)
        if (action === 'nueva_sesion') setModal({ type: 'crear_sesion', payload: { ...payload, tipo: 'regular' } })
        if (action === 'sesion_extra') setModal({ type: 'crear_sesion', payload: { ...payload, tipo: 'extra' } })
        if (action === 'bloquear') setModal({ type: 'bloqueo', payload: { ...payload, tipo: 'huecos_libres' } })
        if (action === 'bloquear_franja') setModal({ type: 'bloqueo', payload: { ...payload, tipo: 'franja' } })
    }

    const handleBloqueoAction = async (action, bloqueo) => {
        setPanel(null)
        if (action === 'desbloquear') {
            setConfirmAction({ type: 'desbloquear', data: bloqueo })
        }
        if (action === 'editar_bloqueo') setModal({ type: 'bloqueo', payload: { fecha: bloqueo.fecha, tipo: bloqueo.tipo, hora: bloqueo.hora_inicio } })
    }

    const handleConfirmAction = async () => {
        if (!confirmAction) return
        const { type, data } = confirmAction
        if (type === 'cancelar') {
            await supabase.from('sesiones').update({ estado: 'cancelada', updated_at: new Date().toISOString() }).eq('id', data.id)
            await logRegistro({ accion: 'cancelar_sesion', entidad: 'sesion', entidad_id: data.id, modulo_origen: 'calendario', cliente_id: data.cliente_id, autor_id: user?.id })
        }
        if (type === 'eliminar') {
            await supabase.from('sesiones').delete().eq('id', data.id)
            await logRegistro({ accion: 'eliminar_sesion', entidad: 'sesion', entidad_id: data.id, modulo_origen: 'calendario', cliente_id: data.cliente_id, autor_id: user?.id })
        }
        if (type === 'desbloquear') {
            await supabase.from('bloqueos').delete().eq('id', data.id)
            await logRegistro({ accion: 'eliminar_bloqueo', entidad: 'bloqueo', entidad_id: data.id, modulo_origen: 'calendario', autor_id: user?.id })
        }
        setConfirmAction(null)
        fetchData()
    }

    // ── Nav temporal ──────────────────────────────────────────────────────────
    const nav = (dir) => {
        if (vista === 'mensual') setCurrentDate(d => dir > 0 ? addMonths(d, 1) : subMonths(d, 1))
        else if (vista === 'semanal') setCurrentDate(d => dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1))
        else setCurrentDate(d => dir > 0 ? addDays(d, 1) : subDays(d, 1))
    }

    const getLabel = () => {
        if (vista === 'mensual') return format(currentDate, 'MMMM yyyy', { locale: es }).toUpperCase()
        if (vista === 'semanal') {
            const s = startOfWeek(currentDate, { weekStartsOn: 1 })
            return `${format(s, 'd MMM', { locale: es })} – ${format(addDays(s, 6), 'd MMM yyyy', { locale: es })}`.toUpperCase()
        }
        return format(currentDate, "EEEE d 'de' MMMM", { locale: es }).toUpperCase()
    }

    // ── Cell click handler ────────────────────────────────────────────────────
    const handleCellClick = (e, fecha, hora, sesion, bloqueo) => {
        e.stopPropagation()
        const rect = e.currentTarget.getBoundingClientRect()
        const position = { x: rect.left + rect.width / 2, y: rect.bottom + 8 }

        if (sesion && sesion.hora_inicio === hora) {
            setPanel({
                type: 'sesion', data: sesion,
                clienteNombre: sesion.clientes?.nombre,
                position
            })
        } else if (bloqueo) {
            setPanel({ type: 'bloqueo', data: bloqueo, position })
        } else if (!isPast(fecha, hora)) {
            setPanel({
                type: 'hueco',
                data: { fecha: format(fecha, 'yyyy-MM-dd'), hora },
                position
            })
        }
    }

    // ── VISTA SEMANAL ─────────────────────────────────────────────────────────
    const renderSemanal = () => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 })
        const days = Array.from({ length: 6 }, (_, i) => addDays(start, i))
        const CELL_H = 36 // px por media hora

        return (
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header días */}
                <div className="flex border-b border-white/10 shrink-0">
                    <div className="w-14 shrink-0" />
                    {days.map((day, i) => (
                        <div key={i} className={cn('flex-1 py-2 text-center border-l border-white/8 first:border-l-0', isSameDay(day, new Date()) && 'bg-white/3')}>
                            <p className="text-[9px] font-black uppercase text-white/40">{format(day, 'EEE', { locale: es })}</p>
                            <p className={cn('text-xs font-black mx-auto w-6 h-6 flex items-center justify-center rounded-full',
                                isSameDay(day, new Date()) ? 'bg-white text-[#0a0c0b]' : 'text-white')}>
                                {format(day, 'd')}
                            </p>
                        </div>
                    ))}
                </div>
                {/* Grid */}
                <div className="flex-1 overflow-y-auto">
                    {HORAS.map((hora, hi) => (
                        <div key={hora} className="flex border-b border-white/6" style={{ height: CELL_H }}>
                            <div className="w-14 shrink-0 flex items-start pt-1 justify-center">
                                <span className="text-[10px] text-white/30 font-bold sticky left-0">{hora}</span>
                            </div>
                            {days.map((day, di) => {
                                const sesion = getSesionEnFechaHora(day, hora)
                                const bloqueo = getBloqueoEnFechaHora(day, hora)
                                const isStart = sesion?.hora_inicio === hora
                                const past = isPast(day, hora)
                                const duracionSlots = sesion ? Math.round((
                                    sesion.hora_fin.split(':').reduce((a, v, i) => a + parseInt(v) * (i === 0 ? 60 : 1), 0) -
                                    sesion.hora_inicio.split(':').reduce((a, v, i) => a + parseInt(v) * (i === 0 ? 60 : 1), 0)
                                ) / 30) : 0

                                return (
                                    <div key={di}
                                        className={cn(
                                            'flex-1 border-l border-white/6 first:border-l-0 relative cursor-pointer',
                                            past && !sesion && !bloqueo ? 'bg-white/2' : '',
                                            !sesion && !bloqueo && !past ? 'hover:bg-white/4 transition-colors' : ''
                                        )}
                                        onClick={e => handleCellClick(e, day, hora, sesion, bloqueo)}>
                                        {/* Bloqueo visual */}
                                        {bloqueo && !sesion && (
                                            <div className="absolute inset-0 bg-red-500/8 border-r border-red-500/15 flex items-center justify-center">
                                                <Lock className="w-2.5 h-2.5 text-red-400/40" />
                                            </div>
                                        )}
                                        {/* Sesión visual — solo en su hora de inicio */}
                                        {isStart && (
                                            <div
                                                className={cn(
                                                    'absolute left-0.5 right-0.5 rounded-lg z-10 flex flex-col justify-center overflow-hidden px-1.5 cursor-pointer transition-all',
                                                    sesion.estado === 'realizada' ? 'bg-[#15803d] border border-[#22c55e]/40' :
                                                        sesion.estado === 'cancelada' ? 'bg-white/5 border border-white/10 opacity-50' :
                                                            'bg-[#14532d] border border-[#22c55e]/30 hover:border-[#22c55e]/60'
                                                )}
                                                style={{
                                                    top: 2,
                                                    height: CELL_H * duracionSlots - 4,
                                                    boxShadow: sesion.estado !== 'cancelada' ? '0 0 8px rgba(34,197,94,0.2)' : 'none'
                                                }}
                                                onClick={e => handleCellClick(e, day, hora, sesion, null)}>
                                                <p className="text-[9px] font-black text-white truncate leading-tight">{sesion.clientes?.nombre || 'Cliente'}</p>
                                                {duracionSlots > 1 && <p className="text-[8px] text-white/50 leading-tight">{sesion.hora_inicio}</p>}
                                                {sesion.estado === 'realizada' && <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full absolute top-1 right-1" />}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // ── VISTA MENSUAL ─────────────────────────────────────────────────────────
    const renderMensual = () => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
        const days = eachDayOfInterval({ start, end }).filter(d => d.getDay() !== 0)

        return (
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-6 border-b border-white/10">
                    {['L', 'M', 'X', 'J', 'V', 'S'].map(d => (
                        <div key={d} className="py-2 text-center text-[10px] font-black text-white/40 uppercase border-r border-white/6 last:border-r-0">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-6">
                    {days.map((day, i) => {
                        const fechaStr = format(day, 'yyyy-MM-dd')
                        const daySesiones = sesiones.filter(s => s.fecha === fechaStr && s.estado !== 'cancelada')
                        const dayBloqueos = bloqueos.filter(b => b.fecha === fechaStr)
                        const isToday = isSameDay(day, new Date())
                        return (
                            <div key={i}
                                className={cn('min-h-[72px] p-1.5 border-r border-b border-white/6 last:border-r-0 cursor-pointer hover:bg-white/3 transition-colors',
                                    !isSameMonth(day, currentDate) ? 'opacity-30' : '',
                                    dayBloqueos.some(b => b.tipo === 'dia_completo') ? 'bg-red-500/5' : ''
                                )}
                                onClick={() => { setCurrentDate(day); setVista('diaria') }}>
                                <span className={cn('text-xs font-black w-5 h-5 flex items-center justify-center rounded-full mb-1',
                                    isToday ? 'bg-white text-[#0a0c0b]' : 'text-white/70')}>
                                    {format(day, 'd')}
                                </span>
                                {dayBloqueos.some(b => b.tipo === 'dia_completo') && <div className="w-full h-1 bg-red-500/30 rounded mb-0.5" />}
                                {daySesiones.slice(0, 3).map(s => (
                                    <div key={s.id} className={cn('text-[8px] font-black rounded px-1 py-0.5 mb-0.5 truncate',
                                        s.estado === 'realizada' ? 'bg-[#22c55e] text-white' : 'bg-[#14532d] text-[#22c55e]/90')}>
                                        {s.hora_inicio} {s.clientes?.nombre?.split(' ')[0]}
                                    </div>
                                ))}
                                {daySesiones.length > 3 && <p className="text-[8px] text-white/30">+{daySesiones.length - 3}</p>}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // ── VISTA DIARIA ──────────────────────────────────────────────────────────
    const renderDiaria = () => {
        const fechaStr = format(currentDate, 'yyyy-MM-dd')
        const CELL_H = 48

        return (
            <div className="flex-1 overflow-y-auto">
                {HORAS.map(hora => {
                    const sesion = getSesionEnFechaHora(currentDate, hora)
                    const bloqueo = getBloqueoEnFechaHora(currentDate, hora)
                    const isStart = sesion?.hora_inicio === hora
                    const past = isPast(currentDate, hora)
                    const duracionSlots = sesion ? Math.round((
                        sesion.hora_fin.split(':').reduce((a, v, i) => a + parseInt(v) * (i === 0 ? 60 : 1), 0) -
                        sesion.hora_inicio.split(':').reduce((a, v, i) => a + parseInt(v) * (i === 0 ? 60 : 1), 0)
                    ) / 30) : 0

                    return (
                        <div key={hora} className="flex border-b border-white/6" style={{ height: CELL_H }}>
                            <div className="w-14 shrink-0 flex items-start pt-1.5 justify-center">
                                <span className="text-[11px] text-white/30 font-bold">{hora}</span>
                            </div>
                            <div className={cn('flex-1 relative cursor-pointer transition-colors', !sesion && !bloqueo && !past ? 'hover:bg-white/4' : past ? 'bg-white/2' : '')}
                                onClick={e => handleCellClick(e, currentDate, hora, sesion, bloqueo)}>
                                {bloqueo && !sesion && <div className="absolute inset-0 bg-red-500/8 flex items-center gap-2 px-3"><Lock className="w-3 h-3 text-red-400/50" /><span className="text-red-400/50 text-xs font-bold">Bloqueado</span></div>}
                                {isStart && (
                                    <div
                                        className={cn('absolute left-1 right-1 rounded-2xl z-10 flex items-center gap-3 px-3 cursor-pointer transition-all',
                                            sesion.estado === 'realizada' ? 'bg-[#15803d] border border-[#22c55e]/40' :
                                                sesion.estado === 'cancelada' ? 'bg-white/5 border border-white/10 opacity-50' :
                                                    'bg-[#14532d] border border-[#22c55e]/30 hover:border-[#22c55e]/60'
                                        )}
                                        style={{ top: 3, height: CELL_H * duracionSlots - 6, boxShadow: '0 0 12px rgba(34,197,94,0.2)' }}
                                        onClick={e => handleCellClick(e, currentDate, hora, sesion, null)}>
                                        <div className="w-8 h-8 bg-[#22c55e]/20 rounded-full flex items-center justify-center text-[#22c55e] font-black text-xs shrink-0">
                                            {sesion.clientes?.nombre?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-black text-sm truncate">{sesion.clientes?.nombre}</p>
                                            <p className="text-white/40 text-xs">{sesion.hora_inicio} – {sesion.hora_fin}</p>
                                        </div>
                                        {sesion.estado === 'realizada' && <Check className="w-4 h-4 text-[#22c55e] shrink-0" />}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full" onClick={() => setPanel(null)}>
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-white/8 shrink-0 flex items-center gap-3">
                {/* Vista selector */}
                <div className="flex bg-white/5 rounded-xl overflow-hidden">
                    {[['mensual', 'Mes'], ['semanal', 'Sem'], ['diaria', 'Día']].map(([v, l]) => (
                        <button key={v} onClick={() => setVista(v)}
                            className={cn('px-3 py-1.5 text-xs font-bold transition-all',
                                vista === v ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60')}>
                            {l}
                        </button>
                    ))}
                </div>
                {/* Nav temporal */}
                <button onClick={() => nav(-1)} className="p-1.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-white/60" />
                </button>
                <span className="text-white font-black text-xs flex-1 text-center">{getLabel()}</span>
                <button onClick={() => nav(1)} className="p-1.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <ChevronRight className="w-4 h-4 text-white/60" />
                </button>
                {/* Hoy */}
                <button onClick={() => setCurrentDate(new Date())} className="text-xs text-white/40 hover:text-white/70 font-bold px-2 py-1.5 bg-white/5 rounded-xl transition-colors">Hoy</button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center"><Loader2 className="w-7 h-7 text-[#22c55e] animate-spin" /></div>
            ) : (
                <>
                    {vista === 'semanal' && renderSemanal()}
                    {vista === 'mensual' && renderMensual()}
                    {vista === 'diaria' && renderDiaria()}
                </>
            )}

            {/* Panel contextual */}
            {panel && (
                <PanelContextual
                    type={panel.type}
                    data={panel.data}
                    clienteNombre={panel.clienteNombre}
                    position={panel.position}
                    onClose={() => setPanel(null)}
                    onAction={(action) => {
                        if (panel.type === 'sesion') handlePanelAction(action, panel.data)
                        else if (panel.type === 'hueco') handleHuecoAction(action, panel.data)
                        else if (panel.type === 'bloqueo') handleBloqueoAction(action, panel.data)
                    }}
                />
            )}

            {/* Modales */}
            {modal?.type === 'crear_sesion' && <ModalCrearSesionCal payload={modal.payload} clientes={clientes} onClose={() => setModal(null)} onSaved={fetchData} />}
            {modal?.type === 'mover' && <ModalMoverCal sesion={modal.payload} clientes={clientes} onClose={() => setModal(null)} onSaved={fetchData} />}
            {modal?.type === 'bloqueo' && <ModalBloqueoCal payload={modal.payload} onClose={() => setModal(null)} onSaved={fetchData} />}

            {/* Confirmaciones */}
            {confirmAction && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[400] flex items-center justify-center p-6">
                    <div className="bg-[#111318] border border-white/10 w-full max-w-xs rounded-3xl p-8 text-center">
                        <h3 className="text-lg font-black text-white mb-2">
                            {confirmAction.type === 'cancelar' ? '¿Cancelar sesión?' :
                                confirmAction.type === 'eliminar' ? '¿Eliminar sesión?' : '¿Desbloquear?'}
                        </h3>
                        <p className="text-white/40 text-sm mb-6">
                            {confirmAction.type === 'cancelar' ? 'La sesión quedará marcada como cancelada.' :
                                confirmAction.type === 'eliminar' ? 'Esta acción no se puede deshacer.' : 'Se eliminará el bloqueo.'}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={handleConfirmAction} className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-2xl font-bold text-sm border border-red-500/30 hover:bg-red-500/30">Confirmar</button>
                            <button onClick={() => setConfirmAction(null)} className="flex-1 py-3 bg-white/5 text-white/50 rounded-2xl font-bold text-sm">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default OwnerCalendario
