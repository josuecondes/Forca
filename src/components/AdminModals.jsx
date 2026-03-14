import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { logRegistro } from '../utils/registro'
import { Plus, X, Loader2, Move, Lock, Ban } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'

function cn(...c) { return twMerge(clsx(c)) }

const HORAS = []
for (let h = 9; h <= 20; h++) {
    HORAS.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 20) HORAS.push(`${String(h).padStart(2, '0')}:30`)
}

// ─── MODAL SESIÓN ──────────────────────────────────────────────────────────────
export const ModalSesion = ({ horaDia, onClose, onSaved, clientes }) => {
    const { user } = useAuth()
    const [form, setForm] = useState({
        cliente_id: '', hora_inicio: horaDia?.hora || '10:00', tipo: 'regular', notas: ''
    })
    const [loading, setLoading] = useState(false)

    const getHoraFin = (hi) => {
        const [h, m] = hi.split(':').map(Number)
        return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }

    const handleSave = async () => {
        if (!form.cliente_id) return
        setLoading(true)
        try {
            const { data, error } = await supabase.from('sesiones').insert({
                cliente_id: form.cliente_id,
                owner_id: user?.id,
                fecha: horaDia.fecha,
                hora_inicio: form.hora_inicio,
                hora_fin: getHoraFin(form.hora_inicio),
                tipo: form.tipo,
                notas: form.notas,
                estado: 'programada',
                pago_estado: 'pendiente'
            }).select().single()
            if (error) throw error
            await logRegistro({
                accion: 'crear_sesion', entidad: 'sesion', entidad_id: data.id,
                modulo_origen: 'diario', cliente_id: form.cliente_id,
                valor_nuevo: form, autor_id: user?.id
            })
            onSaved()
            onClose()
        } catch (e) { alert(e.message) }
        finally { setLoading(false) }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="bg-[#111318] border border-white/10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.9)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-black text-white">Nueva sesión — {horaDia?.hora}</h3>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-4 h-4 text-white/50" /></button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-white/40 font-bold mb-1 block">Cliente *</label>
                        <select value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none cursor-pointer">
                            <option value="" className="bg-[#111318]">Seleccionar...</option>
                            {clientes.map(c => <option key={c.id} value={c.id} className="bg-[#111318]">{c.nombre || c.email}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-white/40 font-bold mb-1 block">Hora inicio</label>
                            <select value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none cursor-pointer">
                                {HORAS.map(h => <option key={h} value={h} className="bg-[#111318]">{h}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-white/40 font-bold mb-1 block">Tipo</label>
                            <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none cursor-pointer">
                                <option value="regular" className="bg-[#111318]">Regular</option>
                                <option value="extra" className="bg-[#111318]">Extra</option>
                                <option value="puntual" className="bg-[#111318]">Puntual</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 mt-5">
                    <button onClick={handleSave} disabled={loading || !form.cliente_id}
                        className="flex-1 py-3.5 bg-[#22c55e]/20 text-[#22c55e] rounded-2xl font-black text-sm border border-[#22c55e]/30 hover:bg-[#22c55e]/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Crear
                    </button>
                    <button onClick={onClose} className="px-5 py-3.5 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors rounded-2xl font-bold text-sm">Cancelar</button>
                </div>
            </div>
        </div>
    )
}

// ─── MODAL MOVER SESIÓN ────────────────────────────────────────────────────────
export const ModalMoverSesion = ({ sesion, onClose, onSaved }) => {
    const { user } = useAuth()
    // Normalize fecha: could be a Date object or a string like 'yyyy-MM-dd'
    const normalizeFecha = (f) => {
        if (!f) return ''
        if (f instanceof Date) {
            const y = f.getFullYear()
            const m = String(f.getMonth() + 1).padStart(2, '0')
            const d = String(f.getDate()).padStart(2, '0')
            return `${y}-${m}-${d}`
        }
        return f
    }
    const [fecha, setFecha] = useState(normalizeFecha(sesion.fecha))
    const [hora, setHora] = useState(sesion.hora_inicio)
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        const [h] = hora.split(':').map(Number)
        const horaFin = `${String(h + 1).padStart(2, '0')}:${hora.split(':')[1]}`
        try {
            await supabase.from(sesion.isBlock ? 'bloqueos' : 'sesiones').update({
                fecha, hora_inicio: hora, hora_fin: horaFin, updated_at: new Date().toISOString()
            }).eq('id', sesion.id)
            await logRegistro({
                accion: 'mover_sesion', entidad: sesion.isBlock ? 'bloqueo' : 'sesion', entidad_id: sesion.id,
                modulo_origen: 'diario', cliente_id: sesion.cliente_id,
                valor_anterior: { fecha: sesion.fecha, hora_inicio: sesion.hora_inicio },
                valor_nuevo: { fecha, hora_inicio: hora }, autor_id: user?.id
            })
            onSaved()
            onClose()
        } catch (e) { alert(e.message) }
        finally { setLoading(false) }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="bg-[#111318] border border-white/10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.9)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-black text-white">Mover {sesion.isBlock ? 'bloqueo' : 'sesión'}</h3>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-4 h-4 text-white/50" /></button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-white/40 font-bold mb-1 block">Nueva fecha</label>
                        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none cursor-pointer" />
                    </div>
                    <div>
                        <label className="text-xs text-white/40 font-bold mb-1 block">Nueva hora</label>
                        <select value={hora} onChange={e => setHora(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none cursor-pointer">
                            {HORAS.map(h => <option key={h} value={h} className="bg-[#111318]">{h}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 mt-5">
                    <button onClick={handleSave} disabled={loading}
                        className="flex-1 py-3.5 bg-[#a78bfa]/20 text-[#a78bfa] rounded-2xl font-black text-sm border border-[#a78bfa]/30 hover:bg-[#a78bfa]/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Move className="w-4 h-4" />} Mover
                    </button>
                    <button onClick={onClose} className="px-5 py-3.5 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors rounded-2xl font-bold text-sm">Cancelar</button>
                </div>
            </div>
        </div>
    )
}

// ─── MODAL BLOQUEO ─────────────────────────────────────────────────────────────
export const ModalBloqueo = ({ fecha, horaDefault, horaFinDefault, tipoDefault, editId, onClose, onSaved }) => {
    const { user } = useAuth()
    const [tipo, setTipo] = useState(tipoDefault || 'franja')
    const [horaInicio, setHoraInicio] = useState(horaDefault || '09:00')
    const [horaFin, setHoraFin] = useState(horaFinDefault || '20:00')
    const [loading, setLoading] = useState(false)
    const isEdit = !!editId

    const handleSave = async () => {
        setLoading(true)
        try {
            if (isEdit) {
                // Modo edición: UPDATE
                const { error } = await supabase.from('bloqueos').update({
                    tipo,
                    hora_inicio: tipo === 'dia_completo' ? null : horaInicio,
                    hora_fin: tipo === 'dia_completo' ? null : horaFin,
                }).eq('id', editId)
                if (error) throw error
                await logRegistro({ accion: 'editar_bloqueo', entidad: 'bloqueo', entidad_id: editId, modulo_origen: 'calendario_admin', valor_nuevo: { fecha, tipo, horaInicio, horaFin }, autor_id: user?.id })
            } else {
                // Modo creación: INSERT
                const { data, error } = await supabase.from('bloqueos').insert({
                    owner_id: user?.id,
                    fecha,
                    tipo,
                    hora_inicio: tipo === 'dia_completo' ? null : horaInicio,
                    hora_fin: tipo === 'dia_completo' ? null : horaFin,
                }).select().single()
                if (error) throw error
                await logRegistro({ accion: 'crear_bloqueo', entidad: 'bloqueo', entidad_id: data.id, modulo_origen: 'diario', valor_nuevo: { fecha, tipo, horaInicio, horaFin }, autor_id: user?.id })
            }
            onSaved()
            onClose()
        } catch (e) { alert(e.message) }
        finally { setLoading(false) }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="bg-[#111318] border border-white/10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.9)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-black text-white">{isEdit ? 'Editar bloqueo' : 'Nuevo bloqueo'}</h3>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-4 h-4 text-white/50" /></button>
                </div>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        {[['dia_completo', 'Día completo'], ['franja', 'Franja'], ['huecos_libres', 'Huecos libres']].map(([v, l]) => (
                            <button key={v} onClick={() => setTipo(v)}
                                className={cn('flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all',
                                    tipo === v ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10')}>
                                {l}
                            </button>
                        ))}
                    </div>
                    {tipo !== 'dia_completo' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-white/40 font-bold mb-1 block">Hora inicio</label>
                                <select value={horaInicio} onChange={e => setHoraInicio(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none cursor-pointer">
                                    {HORAS.map(h => <option key={h} value={h} className="bg-[#111318]">{h}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-white/40 font-bold mb-1 block">Hora fin</label>
                                <select value={horaFin} onChange={e => setHoraFin(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none cursor-pointer">
                                    {HORAS.map(h => <option key={h} value={h} className="bg-[#111318]">{h}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                    <p className="text-white/30 text-xs">Fecha: {fecha}</p>
                </div>
                <div className="flex gap-3 mt-5">
                    <button onClick={handleSave} disabled={loading}
                        className="flex-1 py-3.5 bg-red-500/15 text-red-400 rounded-2xl font-black text-sm border border-red-500/30 hover:bg-red-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} {isEdit ? 'Guardar cambios' : 'Bloquear'}
                    </button>
                    <button onClick={onClose} className="px-5 py-3.5 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors rounded-2xl font-bold text-sm">Cancelar</button>
                </div>
            </div>
        </div>
    )
}

// ─── MODAL CANCELAR CONFIRMACIÓN ─────────────────────────────────────────────
export const ModalCancelConfirm = ({ sesion, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
            <div className="bg-[#111318] border border-white/10 w-full max-w-xs rounded-3xl p-8 text-center" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.9)' }}>
                <Ban className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-black text-white mb-2">¿Cancelar sesión?</h3>
                <p className="text-white/40 text-sm mb-6">La sesión quedará marcada como cancelada.</p>
                <div className="flex gap-3">
                    <button onClick={() => onConfirm(sesion)} className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-2xl font-bold text-sm border border-red-500/30 hover:bg-red-500/30 transition-colors">Confirmar</button>
                    <button onClick={onCancel} className="flex-1 py-3 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors rounded-2xl font-bold text-sm">Volver</button>
                </div>
            </div>
        </div>
    )
}

// ─── MODAL ELIMINAR CONFIRMACIÓN ─────────────────────────────────────────────
export const ModalDeleteConfirm = ({ sesion, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
            <div className="bg-[#111318] border border-white/10 w-full max-w-xs rounded-3xl p-8 text-center" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.9)' }}>
                <X className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-black text-white mb-2">¿Eliminar {sesion.isBlock ? 'bloqueo' : 'sesión'}?</h3>
                <p className="text-white/40 text-sm mb-6">Esta acción no puede deshacerse.</p>
                <div className="flex gap-3">
                    <button onClick={() => onConfirm(sesion)} className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-2xl font-bold text-sm border border-red-500/30 hover:bg-red-500/30 transition-colors">Eliminar</button>
                    <button onClick={onCancel} className="flex-1 py-3 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors rounded-2xl font-bold text-sm">Cancelar</button>
                </div>
            </div>
        </div>
    )
}
