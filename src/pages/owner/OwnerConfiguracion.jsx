import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { logRegistro } from '../../utils/registro'
import { Save, Loader2, Clock, Shield, Move, ToggleLeft, ToggleRight } from 'lucide-react'

const T = {
    page: '#eaecf1',
    card: 'linear-gradient(145deg,#f6f8fc 0%,#eef1f6 100%)',
    cardBorder: '1.5px solid rgba(0,0,0,0.09)',
    cardShadow: '0 3px 16px rgba(0,0,0,0.08)',
    inp: { background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '12px', padding: '12px 14px', color: '#0d1117', fontSize: '14px', outline: 'none', width: '100%' },
    blue: '#2563eb', blueBg: 'rgba(37,99,235,0.09)', blueBorder: 'rgba(37,99,235,0.28)',
    green: '#16a34a', greenBg: 'rgba(22,163,74,0.09)', greenBorder: 'rgba(22,163,74,0.28)',
    red: '#dc2626', amber: '#d97706', purple: '#7c3aed', purpleBg: 'rgba(124,58,237,0.09)',
    p1: '#0d1117', p2: '#5a6278', p3: '#8890a4',
}
const lbl = { fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: T.p3, display: 'block', marginBottom: '6px' }

const OwnerConfiguracion = () => {
    const { user } = useAuth()
    const [config, setConfig] = useState(null)
    const [form, setForm] = useState({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingBlock, setEditingBlock] = useState(null)

    useEffect(() => {
        const load = async () => {
            let { data } = await supabase.from('configuracion').select('*').limit(1).maybeSingle()
            if (!data && user) {
                const { data: nd } = await supabase.from('configuracion').insert({ owner_id: user.id }).select().single()
                data = nd
            }
            if (data) { setConfig(data); setForm(data) }
            setLoading(false)
        }
        load()
    }, [user])

    const handleSave = async bloque => {
        setSaving(true)
        try {
            const camposBloque = {
                horario: ['hora_inicio', 'hora_fin', 'dias_laborables', 'duracion_sesion_minutos'],
                reglas: ['ventana_cancelacion_horas', 'ventana_modificacion_horas', 'sesion_extra_permitida'],
                movimiento: ['periodo_movimiento_dias'],
            }
            const update = {}
            ;(camposBloque[bloque] || []).forEach(k => update[k] = form[k])
            update.updated_at = new Date().toISOString()
            const { error } = await supabase.from('configuracion').update(update).eq('id', config.id)
            if (error) throw error
            await logRegistro({ accion: 'cambiar_configuracion', entidad: 'configuracion', entidad_id: config.id, modulo_origen: 'configuracion', valor_anterior: config, valor_nuevo: update, autor_id: user?.id })
            setConfig(p => ({ ...p, ...update }))
            setEditingBlock(null)
        } catch (e) { alert(e.message) }
        finally { setSaving(false) }
    }

    const handleCancel = () => { setForm(config); setEditingBlock(null) }

    const DIAS_OPTS = [
        { key: 'lun', label: 'L' }, { key: 'mar', label: 'M' }, { key: 'mie', label: 'X' },
        { key: 'jue', label: 'J' }, { key: 'vie', label: 'V' }, { key: 'sab', label: 'S' }
    ]
    const toggleDia = d => setForm(f => ({
        ...f,
        dias_laborables: f.dias_laborables?.includes(d)
            ? f.dias_laborables.filter(x => x !== d)
            : [...(f.dias_laborables || []), d]
    }))

    if (loading) return (
        <div className="flex items-center justify-center py-24" style={{ background: T.page }}>
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: T.blue }} />
        </div>
    )
    if (!config) return (
        <div className="p-6 text-center" style={{ background: T.page }}>
            <p className="text-sm" style={{ color: T.p3 }}>No se encontró configuración.</p>
        </div>
    )

    return (
        <div className="p-4 space-y-4" style={{ background: T.page, minHeight: '100%' }}>
            <div className="mb-4">
                <h2 className="text-xl font-black tracking-tight" style={{ color: T.p1 }}>Configuración</h2>
                <p className="text-xs mt-0.5 font-medium" style={{ color: T.p3 }}>Ajustes del sistema</p>
            </div>

            {/* Bloque Horario */}
            <ConfigBloque title="Horario de trabajo" subtitle="Franja horaria y días laborables"
                icon={<Clock className="w-5 h-5" />} color={T.blue}
                isEditing={editingBlock === 'horario'}
                onEdit={() => setEditingBlock('horario')} onSave={() => handleSave('horario')} onCancel={handleCancel} saving={saving}>
                {editingBlock === 'horario' ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label style={lbl}>Hora inicio</label>
                                <select value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} style={T.inp}>
                                    {Array.from({ length: 13 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`).map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={lbl}>Hora fin</label>
                                <select value={form.hora_fin} onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} style={T.inp}>
                                    {Array.from({ length: 15 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`).map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style={lbl}>Días laborables</label>
                            <div className="flex gap-2">
                                {DIAS_OPTS.map(d => (
                                    <button key={d.key} onClick={() => toggleDia(d.key)}
                                        className="flex-1 h-12 rounded-xl font-black text-sm transition-all active:scale-95"
                                        style={form.dias_laborables?.includes(d.key) ? {
                                            background: 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)',
                                            color: '#fff',
                                            border: '1px solid rgba(37,99,235,0.4)',
                                            boxShadow: '0 2px 10px rgba(37,99,235,0.25)'
                                        } : { background: '#e9ecf3', color: T.p2, border: '1px solid rgba(0,0,0,0.12)' }}>
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={lbl}>Duración sesión (min)</label>
                            <select value={form.duracion_sesion_minutos} onChange={e => setForm(f => ({ ...f, duracion_sesion_minutos: parseInt(e.target.value) }))} style={T.inp}>
                                {[30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} minutos</option>)}
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <InfoRow label="Horario" value={`${config.hora_inicio} – ${config.hora_fin}`} />
                        <InfoRow label="Días" value={(config.dias_laborables || []).join(', ').toUpperCase()} />
                        <InfoRow label="Duración sesión" value={`${config.duracion_sesion_minutos} min`} />
                    </div>
                )}
            </ConfigBloque>

            {/* Bloque Reglas */}
            <ConfigBloque title="Reglas de cancelación" subtitle="Ventanas de tiempo para clientes"
                icon={<Shield className="w-5 h-5" />} color={T.amber}
                isEditing={editingBlock === 'reglas'}
                onEdit={() => setEditingBlock('reglas')} onSave={() => handleSave('reglas')} onCancel={handleCancel} saving={saving}>
                {editingBlock === 'reglas' ? (
                    <div className="space-y-4">
                        <div>
                            <label style={lbl}>Ventana cancelación (horas previas)</label>
                            <select value={form.ventana_cancelacion_horas} onChange={e => setForm(f => ({ ...f, ventana_cancelacion_horas: parseInt(e.target.value) }))} style={T.inp}>
                                {[2, 4, 6, 12, 24, 48, 72].map(h => <option key={h} value={h}>{h} horas antes</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Ventana modificación (horas previas)</label>
                            <select value={form.ventana_modificacion_horas} onChange={e => setForm(f => ({ ...f, ventana_modificacion_horas: parseInt(e.target.value) }))} style={T.inp}>
                                {[2, 4, 6, 12, 24, 48, 72].map(h => <option key={h} value={h}>{h} horas antes</option>)}
                            </select>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.09)' }}>
                            <div>
                                <p className="font-bold text-sm" style={{ color: T.p1 }}>Sesión extra permitida</p>
                                <p className="text-xs mt-0.5" style={{ color: T.p3 }}>El cliente puede solicitar sesiones extra</p>
                            </div>
                            <button onClick={() => setForm(f => ({ ...f, sesion_extra_permitida: !f.sesion_extra_permitida }))} className="transition-all">
                                {form.sesion_extra_permitida
                                    ? <ToggleRight className="w-9 h-9" style={{ color: T.blue }} />
                                    : <ToggleLeft className="w-9 h-9" style={{ color: T.p3 }} />}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <InfoRow label="Cancelación" value={`${config.ventana_cancelacion_horas}h antes`} />
                        <InfoRow label="Modificación" value={`${config.ventana_modificacion_horas}h antes`} />
                        <InfoRow label="Sesión extra" value={config.sesion_extra_permitida ? 'Permitida' : 'No permitida'} valueColor={config.sesion_extra_permitida ? T.blue : T.p2} />
                    </div>
                )}
            </ConfigBloque>

            {/* Bloque Movimiento */}
            <ConfigBloque title="Reglas de movimiento" subtitle="Ventana de cambio de sesiones"
                icon={<Move className="w-5 h-5" />} color={T.purple}
                isEditing={editingBlock === 'movimiento'}
                onEdit={() => setEditingBlock('movimiento')} onSave={() => handleSave('movimiento')} onCancel={handleCancel} saving={saving}>
                {editingBlock === 'movimiento' ? (
                    <div>
                        <label style={lbl}>Periodo de movimiento (días)</label>
                        <select value={form.periodo_movimiento_dias} onChange={e => setForm(f => ({ ...f, periodo_movimiento_dias: parseInt(e.target.value) }))} style={T.inp}>
                            {[1, 3, 7, 14, 30].map(d => <option key={d} value={d}>Dentro de {d} días</option>)}
                        </select>
                    </div>
                ) : (
                    <InfoRow label="Ventana movimiento" value={`Dentro de ${config.periodo_movimiento_dias} días`} />
                )}
            </ConfigBloque>
        </div>
    )
}

const ConfigBloque = ({ title, subtitle, icon, color, isEditing, onEdit, onSave, onCancel, saving, children }) => (
    <div className="rounded-2xl overflow-hidden" style={{
        background: 'linear-gradient(145deg,#f6f8fc 0%,#eef1f6 100%)',
        border: `1.5px solid rgba(0,0,0,0.08)`,
        boxShadow: `0 3px 16px rgba(0,0,0,0.07), 0 0 0 1px ${color}10`
    }}>
        {/* Block header */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}12`, border: `1.5px solid ${color}25`, color }}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm tracking-tight" style={{ color: '#0d1117' }}>{title}</h3>
                {subtitle && <p className="text-[10px] mt-0.5 font-medium" style={{ color: '#8890a4' }}>{subtitle}</p>}
            </div>
            {!isEditing && (
                <button onClick={onEdit}
                    className="px-4 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95"
                    style={{ background: '#e9ecf3', color: '#5a6278', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    Editar
                </button>
            )}
        </div>

        <div className="p-5">
            {children}
            {isEditing && (
                <div className="flex gap-3 mt-5 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                    <button onClick={onSave} disabled={saving}
                        className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)', color: '#fff', border: '1px solid rgba(37,99,235,0.4)', boxShadow: '0 4px 14px rgba(37,99,235,0.28)' }}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar cambios
                    </button>
                    <button onClick={onCancel}
                        className="px-5 py-3.5 rounded-xl text-sm font-bold transition-all"
                        style={{ background: '#e9ecf3', color: '#5a6278', border: '1px solid rgba(0,0,0,0.1)' }}>
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    </div>
)

const InfoRow = ({ label, value, valueColor }) => (
    <div className="flex justify-between items-center py-1">
        <span className="text-sm font-medium" style={{ color: '#8890a4' }}>{label}</span>
        <span className="text-sm font-black tracking-tight" style={{ color: valueColor || '#0d1117' }}>{value}</span>
    </div>
)

export default OwnerConfiguracion
