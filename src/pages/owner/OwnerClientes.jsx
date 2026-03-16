import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { logRegistro } from '../../utils/registro'
import {
    Search, Plus, Archive, Trash2, MoreVertical, X,
    ChevronLeft, Edit2, Check, Loader2,
    User2, Calendar, DollarSign, Clock, Eye, EyeOff
} from 'lucide-react'

const DIAS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab']
const DIAS_LABEL = { lun: 'Lunes', mar: 'Martes', mie: 'Miércoles', jue: 'Jueves', vie: 'Viernes', sab: 'Sábado' }
const HORAS = []; for (let h = 9; h <= 20; h++) HORAS.push(`${String(h).padStart(2, '0')}:00`)

function cn(...c) { return c.filter(Boolean).join(' ') }

const T = {
    page: '#eaecf1',
    card: 'linear-gradient(145deg,#f6f8fc 0%,#eef1f6 100%)',
    cardBorder: '1.5px solid rgba(0,0,0,0.09)',
    cardShadow: '0 2px 14px rgba(0,0,0,0.07)',
    inp: { background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '14px', padding: '13px 16px', color: '#0d1117', fontSize: '14px', outline: 'none', width: '100%' },
    blue: '#2563eb', blueBg: 'rgba(37,99,235,0.09)', blueBorder: 'rgba(37,99,235,0.28)',
    green: '#16a34a', greenBg: 'rgba(22,163,74,0.09)', greenBorder: 'rgba(22,163,74,0.28)',
    red: '#dc2626', redBg: 'rgba(220,38,38,0.09)',
    amber: '#d97706', amberBg: 'rgba(217,119,6,0.09)',
    p1: '#0d1117', p2: '#5a6278', p3: '#8890a4',
}
const lbl = { fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: T.p3, display: 'block', marginBottom: '6px' }

// Primary button style
const btnPrimary = {
    background: 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)',
    color: '#fff',
    border: '1px solid rgba(37,99,235,0.4)',
    boxShadow: '0 4px 14px rgba(37,99,235,0.28)'
}

// ── Modal Crear Cliente ────────────────────────────────────────────────────────
const ModalCrearCliente = ({ onClose, onCreated }) => {
    const { user } = useAuth()
    const [form, setForm] = useState({ nombre: '', email: '', password: '', sesiones_semanales: 1, distribucion_semanal: ['lun'], hora_habitual: '10:00', precio_por_sesion: 0, fecha_inicio: '' })
    const [showPwd, setShowPwd] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const toggleDia = d => setForm(f => ({
        ...f,
        distribucion_semanal: f.distribucion_semanal.includes(d)
            ? f.distribucion_semanal.filter(x => x !== d)
            : [...f.distribucion_semanal, d]
    }))

    const handleSubmit = async () => {
        if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
        if (!form.email.trim()) { setError('El email es obligatorio'); return }
        if (!form.password || form.password.length < 6) { setError('Contraseña: mínimo 6 caracteres'); return }
        if (form.distribucion_semanal.length === 0) { setError('Selecciona al menos un día'); return }
        setLoading(true); setError('')
        try {
            const { data: authData, error: authErr } = await supabase.auth.signUp({
                email: form.email.trim(), password: form.password,
                options: { data: { full_name: form.nombre.trim(), sesiones_semanales: form.sesiones_semanales, distribucion_semanal: form.distribucion_semanal, hora_habitual: form.hora_habitual, precio_por_sesion: parseFloat(form.precio_por_sesion) || 0, fecha_inicio: form.fecha_inicio || '' } }
            })
            if (authErr) throw authErr
            const uid = authData.user?.id
            if (!uid) throw new Error('No se pudo obtener el ID del nuevo usuario')
            let intentos = 0
            while (intentos < 10) {
                await new Promise(r => setTimeout(r, 300))
                const { data: est } = await supabase.from('clientes_estructura').select('usuario_id').eq('usuario_id', uid).maybeSingle()
                if (est) break
                intentos++
            }
            await logRegistro({ accion: 'crear_cliente', entidad: 'cliente', entidad_id: uid, modulo_origen: 'clientes', cliente_id: uid, valor_nuevo: { nombre: form.nombre, email: form.email }, autor_id: user?.id })
            onCreated({ id: uid, nombre: form.nombre.trim(), email: form.email.trim() })
            onClose()
        } catch (e) { setError(e.message) }
        finally { setLoading(false) }
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6"
            style={{ background: 'rgba(13,17,32,0.6)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90dvh] overflow-y-auto" style={{
                background: 'linear-gradient(160deg,#f6f8fc 0%,#eef1f6 100%)',
                border: '1.5px solid rgba(0,0,0,0.1)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.22)'
            }}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-black tracking-tight" style={{ color: T.p1 }}>Nuevo Cliente</h3>
                        <p className="text-xs mt-0.5 font-medium" style={{ color: T.p3 }}>Crear acceso y estructura</p>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-xl transition-all" style={{ background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.1)' }}>
                        <X className="w-4 h-4" style={{ color: T.p2 }} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 px-4 py-3 rounded-xl text-sm font-bold" style={{ background: T.redBg, border: '1px solid rgba(220,38,38,0.2)', color: T.red }}>
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label style={lbl}>Nombre *</label>
                        <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} style={T.inp} placeholder="Nombre completo" />
                    </div>
                    <div>
                        <label style={lbl}>Email *</label>
                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={T.inp} placeholder="email@ejemplo.com" />
                    </div>
                    <div>
                        <label style={lbl}>Contraseña *</label>
                        <div className="relative">
                            <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={{ ...T.inp, paddingRight: '48px' }} placeholder="Mínimo 6 caracteres" />
                            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: T.p3 }}>
                                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label style={lbl}>Sesiones/semana</label>
                            <input type="number" min="1" max="7" value={form.sesiones_semanales} onChange={e => setForm(f => ({ ...f, sesiones_semanales: parseInt(e.target.value) || 1 }))} style={T.inp} />
                        </div>
                        <div>
                            <label style={lbl}>Precio/sesión (€)</label>
                            <input type="number" min="0" step="0.01" value={form.precio_por_sesion} onChange={e => setForm(f => ({ ...f, precio_por_sesion: e.target.value }))} style={T.inp} />
                        </div>
                    </div>
                    <div>
                        <label style={lbl}>Días habituales</label>
                        <div className="flex gap-2">
                            {DIAS.map(d => (
                                <button key={d} onClick={() => toggleDia(d)}
                                    className="flex-1 h-11 rounded-xl text-xs font-black uppercase transition-all active:scale-95"
                                    style={form.distribucion_semanal.includes(d) ? {
                                        background: 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)',
                                        color: '#fff', border: '1px solid rgba(37,99,235,0.4)', boxShadow: '0 2px 10px rgba(37,99,235,0.22)'
                                    } : { background: '#e9ecf3', color: T.p2, border: '1px solid rgba(0,0,0,0.1)' }}>
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label style={lbl}>Hora habitual</label>
                            <select value={form.hora_habitual} onChange={e => setForm(f => ({ ...f, hora_habitual: e.target.value }))} style={T.inp}>
                                {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Fecha inicio</label>
                            <input type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} style={T.inp} />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={handleSubmit} disabled={loading}
                        className="flex-1 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40 active:scale-95"
                        style={btnPrimary}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Crear cliente
                    </button>
                    <button onClick={onClose} className="px-6 py-4 rounded-2xl font-black text-sm"
                        style={{ background: '#e9ecf3', color: T.p2, border: '1px solid rgba(0,0,0,0.1)' }}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Modal Confirmación ─────────────────────────────────────────────────────────
const ConfirmModal = ({ title, message, confirmLabel, confirmColor, onConfirm, onClose, danger }) => (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6" style={{ background: 'rgba(13,17,32,0.6)', backdropFilter: 'blur(8px)' }}>
        <div className="w-full max-w-xs rounded-3xl p-8 text-center" style={{
            background: 'linear-gradient(160deg,#f6f8fc 0%,#eef1f6 100%)',
            border: '1.5px solid rgba(0,0,0,0.1)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.22)'
        }}>
            {danger && (
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: T.redBg, border: '1px solid rgba(220,38,38,0.2)' }}>
                    <Trash2 className="w-6 h-6" style={{ color: T.red }} />
                </div>
            )}
            <h3 className="text-base font-black tracking-tight mb-2" style={{ color: T.p1 }}>{title}</h3>
            <p className="text-sm mb-6 font-medium" style={{ color: T.p3 }}>{message}</p>
            <div className="flex gap-3">
                <button onClick={onConfirm}
                    className="flex-1 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95"
                    style={{ background: `${confirmColor}12`, color: confirmColor, border: `1px solid ${confirmColor}28` }}>
                    {confirmLabel}
                </button>
                <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
                    style={{ background: '#e9ecf3', color: T.p2, border: '1px solid rgba(0,0,0,0.1)' }}>
                    Cancelar
                </button>
            </div>
        </div>
    </div>
)

// ── Ficha Cliente ──────────────────────────────────────────────────────────────
const FichaCliente = ({ clienteId, onBack }) => {
    const { user } = useAuth()
    const [cliente, setCliente] = useState(null)
    const [estructura, setEstructura] = useState(null)
    const [sesiones, setSesiones] = useState([])
    const [loading, setLoading] = useState(true)
    const [editMode, setEditMode] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [saveLoading, setSaveLoading] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [confirmArchive, setConfirmArchive] = useState(false)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            const [{ data: cli }, { data: est }, { data: ses }] = await Promise.all([
                supabase.from('usuarios').select('*').eq('id', clienteId).single(),
                supabase.from('clientes_estructura').select('*').eq('usuario_id', clienteId).single(),
                supabase.from('sesiones').select('*').eq('cliente_id', clienteId).order('fecha', { ascending: false }).limit(20)
            ])
            setCliente(cli); setEstructura(est); setSesiones(ses || [])
            if (est) setEditForm({ sesiones_semanales: est.sesiones_semanales, distribucion_semanal: [...(est.distribucion_semanal || [])], hora_habitual: est.hora_habitual, precio_por_sesion: est.precio_por_sesion, notas: est.notas || '' })
            setLoading(false)
        }
        load()
    }, [clienteId])

    const handleSave = async () => {
        setSaveLoading(true)
        try {
            const { error } = await supabase.from('clientes_estructura').update({ ...editForm, updated_at: new Date().toISOString() }).eq('usuario_id', clienteId)
            if (error) throw error
            await logRegistro({ accion: 'editar_estructura_cliente', entidad: 'cliente', entidad_id: clienteId, modulo_origen: 'clientes', cliente_id: clienteId, valor_anterior: estructura, valor_nuevo: editForm, autor_id: user?.id })
            setEstructura(p => ({ ...p, ...editForm })); setEditMode(false)
        } catch (e) { alert(e.message) }
        finally { setSaveLoading(false) }
    }
    const handleArchive = async () => {
        await supabase.from('clientes_estructura').update({ estado: 'archivado' }).eq('usuario_id', clienteId)
        await logRegistro({ accion: 'archivar_cliente', entidad: 'cliente', entidad_id: clienteId, modulo_origen: 'clientes', cliente_id: clienteId, valor_anterior: { estado: 'activo' }, valor_nuevo: { estado: 'archivado' }, autor_id: user?.id })
        setConfirmArchive(false); onBack()
    }
    const handleDelete = async () => {
        await supabase.from('usuarios').delete().eq('id', clienteId)
        await logRegistro({ accion: 'eliminar_cliente', entidad: 'cliente', entidad_id: clienteId, modulo_origen: 'clientes', cliente_id: clienteId, autor_id: user?.id })
        setConfirmDelete(false); onBack()
    }
    const toggleDia = d => setEditForm(f => ({
        ...f,
        distribucion_semanal: f.distribucion_semanal?.includes(d) ? f.distribucion_semanal.filter(x => x !== d) : [...(f.distribucion_semanal || []), d]
    }))

    const realizadas = sesiones.filter(s => s.estado === 'realizada').length
    const pendientesPago = sesiones.filter(s => s.pago_estado === 'pendiente' && s.estado === 'realizada').length
    const totalPendiente = sesiones.filter(s => s.pago_estado === 'pendiente' && s.estado === 'realizada').reduce((acc, s) => acc + (parseFloat(s.importe) || parseFloat(estructura?.precio_por_sesion) || 0), 0)

    if (loading) return (
        <div className="flex items-center justify-center py-20" style={{ background: T.page }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: T.blue }} />
        </div>
    )

    return (
        <div className="pb-10 min-h-full" style={{ background: T.page }}>
            {/* Hero header */}
            <div className="px-4 pt-4 pb-5" style={{ background: 'linear-gradient(180deg,#f6f8fc 0%,#eaecf1 100%)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                <div className="flex items-center justify-between mb-5">
                    <button onClick={onBack}
                        className="p-3 rounded-2xl transition-all active:scale-95"
                        style={{ background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <ChevronLeft className="w-5 h-5" style={{ color: T.p2 }} />
                    </button>
                    <div className="flex items-center gap-2">
                        {!editMode ? (
                            <>
                                <button onClick={() => setEditMode(true)}
                                    className="px-5 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95"
                                    style={btnPrimary}>
                                    Editar
                                </button>
                                <button onClick={() => setConfirmArchive(true)}
                                    className="px-5 py-2.5 rounded-xl font-black text-sm transition-all"
                                    style={{ background: '#e9ecf3', color: T.p2, border: '1px solid rgba(0,0,0,0.1)' }}>
                                    Archivar
                                </button>
                                <div className="relative">
                                    <button onClick={() => setMenuOpen(!menuOpen)}
                                        className="p-2.5 rounded-xl" style={{ background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.1)' }}>
                                        <MoreVertical className="w-4 h-4" style={{ color: T.p2 }} />
                                    </button>
                                    {menuOpen && (
                                        <div className="absolute right-0 top-full mt-1 w-52 z-50 rounded-2xl overflow-hidden" style={{ background: '#f6f8fc', border: '1.5px solid rgba(0,0,0,0.1)', boxShadow: '0 16px 48px rgba(0,0,0,0.16)' }}>
                                            <button onClick={() => { setConfirmDelete(true); setMenuOpen(false) }}
                                                className="w-full flex items-center gap-3 px-4 py-4 text-sm font-bold transition-colors hover:bg-red-50"
                                                style={{ color: T.red }}>
                                                <Trash2 className="w-4 h-4" /> Eliminar cliente
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <button onClick={handleSave} disabled={saveLoading}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all disabled:opacity-40 active:scale-95"
                                    style={btnPrimary}>
                                    {saveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Guardar
                                </button>
                                <button onClick={() => setEditMode(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm"
                                    style={{ background: '#e9ecf3', color: T.p2, border: '1px solid rgba(0,0,0,0.1)' }}>
                                    Cancelar
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0" style={{
                        background: 'linear-gradient(145deg,#2563eb 0%,#1d4ed8 100%)',
                        color: '#fff',
                        boxShadow: '0 8px 24px rgba(37,99,235,0.3)'
                    }}>
                        {cliente?.nombre?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight" style={{ color: T.p1 }}>{cliente?.nombre}</h2>
                        <p className="text-sm mt-0.5 font-medium" style={{ color: T.p3 }}>{cliente?.email}</p>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 px-4 py-4">
                {[{ label: 'Realizadas', value: realizadas, color: T.blue }, { label: 'Pend. pago', value: pendientesPago, color: T.amber }, { label: 'Total pend.', value: `${totalPendiente.toFixed(0)}€`, color: T.red }].map(m => (
                    <div key={m.label} className="rounded-2xl p-3 text-center" style={{ background: T.card, border: T.cardBorder, boxShadow: T.cardShadow }}>
                        <p className="text-xl font-black tracking-tight" style={{ color: m.color }}>{m.value}</p>
                        <p className="text-[9px] font-black uppercase tracking-wider mt-0.5" style={{ color: T.p3 }}>{m.label}</p>
                    </div>
                ))}
            </div>

            {/* Structure */}
            <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={{ background: T.card, border: T.cardBorder, boxShadow: T.cardShadow }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                    <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: T.p3 }}>Estructura base</h3>
                </div>
                <div className="p-5">
                    {!editMode ? (
                        <div className="space-y-3">
                            <Row icon={<Calendar className="w-4 h-4" />} label="Ses/semana" value={estructura?.sesiones_semanales} />
                            <Row icon={<Clock className="w-4 h-4" />} label="Días" value={(estructura?.distribucion_semanal || []).map(d => DIAS_LABEL[d] || d).join(', ')} />
                            <Row icon={<Clock className="w-4 h-4" />} label="Hora habitual" value={estructura?.hora_habitual} />
                            <Row icon={<DollarSign className="w-4 h-4" />} label="Precio/sesión" value={`${estructura?.precio_por_sesion}€`} />
                            {estructura?.notas && <Row icon={<Edit2 className="w-4 h-4" />} label="Notas" value={estructura.notas} />}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label style={lbl}>Sesiones/semana</label>
                                    <input type="number" min="1" max="7" value={editForm.sesiones_semanales} onChange={e => setEditForm(f => ({ ...f, sesiones_semanales: parseInt(e.target.value) || 1 }))} style={T.inp} />
                                </div>
                                <div>
                                    <label style={lbl}>Precio/sesión (€)</label>
                                    <input type="number" min="0" step="0.01" value={editForm.precio_por_sesion} onChange={e => setEditForm(f => ({ ...f, precio_por_sesion: e.target.value }))} style={T.inp} />
                                </div>
                            </div>
                            <div>
                                <label style={lbl}>Días habituales</label>
                                <div className="flex gap-2">
                                    {DIAS.map(d => (
                                        <button key={d} onClick={() => toggleDia(d)}
                                            className="flex-1 h-11 rounded-xl text-xs font-black uppercase transition-all active:scale-95"
                                            style={editForm.distribucion_semanal?.includes(d) ? {
                                                background: 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)',
                                                color: '#fff', border: '1px solid rgba(37,99,235,0.4)', boxShadow: '0 2px 10px rgba(37,99,235,0.22)'
                                            } : { background: '#e9ecf3', color: T.p2, border: '1px solid rgba(0,0,0,0.1)' }}>
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={lbl}>Hora habitual</label>
                                <select value={editForm.hora_habitual} onChange={e => setEditForm(f => ({ ...f, hora_habitual: e.target.value }))} style={T.inp}>
                                    {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={lbl}>Notas</label>
                                <textarea value={editForm.notas} onChange={e => setEditForm(f => ({ ...f, notas: e.target.value }))} rows={2} style={{ ...T.inp, resize: 'none' }} />
                            </div>
                            <p className="text-xs font-medium" style={{ color: T.amber }}>⚠️ Solo afecta a sesiones futuras.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Session history */}
            <div className="px-4">
                <h3 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: T.p3 }}>Historial de sesiones</h3>
                {sesiones.length > 0 ? (
                    <div className="space-y-2">
                        {sesiones.map(s => (
                            <div key={s.id} className="flex items-center gap-3 px-4 py-4 rounded-2xl" style={{ background: T.card, border: T.cardBorder, boxShadow: T.cardShadow }}>
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.estado === 'realizada' ? T.green : s.estado === 'cancelada' ? T.red : T.blue, boxShadow: `0 0 7px ${s.estado === 'realizada' ? 'rgba(22,163,74,0.4)' : s.estado === 'cancelada' ? 'rgba(220,38,38,0.4)' : 'rgba(37,99,235,0.4)'}` }} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm" style={{ color: T.p1 }}>{s.fecha}</p>
                                    <p className="text-xs font-medium mt-0.5" style={{ color: T.p3 }}>{s.hora_inicio} – {s.hora_fin}</p>
                                </div>
                                <span className="text-xs font-black px-3 py-1.5 rounded-full"
                                    style={s.pago_estado === 'pagado' ? { background: T.greenBg, color: T.green, border: '1px solid rgba(22,163,74,0.22)' } : { background: T.amberBg, color: T.amber, border: '1px solid rgba(217,119,6,0.22)' }}>
                                    {s.pago_estado === 'pagado' ? '✓ Pagado' : 'Pendiente'}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-center py-10 font-medium" style={{ color: T.p3 }}>Sin sesiones registradas aún.</p>
                )}
            </div>

            {confirmArchive && <ConfirmModal title="¿Archivar cliente?" message="El historial, pagos y sesiones se conservarán." confirmLabel="Archivar" confirmColor={T.amber} onConfirm={handleArchive} onClose={() => setConfirmArchive(false)} />}
            {confirmDelete && <ConfirmModal title="¿Eliminar cliente?" message="Esta acción es irreversible. Se borrarán todos los datos." confirmLabel="Eliminar permanentemente" confirmColor={T.red} onConfirm={handleDelete} onClose={() => setConfirmDelete(false)} danger />}
            {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />}
        </div>
    )
}

const Row = ({ icon, label, value }) => (
    <div className="flex items-center gap-3 py-1">
        <span style={{ color: T.p3 }}>{icon}</span>
        <span className="text-sm w-28 shrink-0 font-medium" style={{ color: T.p3 }}>{label}</span>
        <span className="text-sm font-black flex-1" style={{ color: T.p1 }}>{value}</span>
    </div>
)

// ── MAIN ───────────────────────────────────────────────────────────────────────
const OwnerClientes = ({ onNavigate, initialClienteId = null }) => {
    const { user } = useAuth()
    const [clientes, setClientes] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [loading, setLoading] = useState(true)
    const [showCrear, setShowCrear] = useState(false)
    const [fichaId, setFichaId] = useState(initialClienteId)
    const [menuClienteId, setMenuClienteId] = useState(null)

    const fetchClientes = async () => {
        setLoading(true)
        const { data } = await supabase.from('usuarios').select('*,clientes_estructura(estado,sesiones_semanales,precio_por_sesion)').eq('rol', 'cliente').order('nombre')
        setClientes(data || []); setLoading(false)
    }
    useEffect(() => { fetchClientes() }, [])

    const filtrados = clientes.filter(c =>
        c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.email?.toLowerCase().includes(busqueda.toLowerCase())
    )

    const handleArchivar = async clienteId => {
        await supabase.from('clientes_estructura').update({ estado: 'archivado' }).eq('usuario_id', clienteId)
        await logRegistro({ accion: 'archivar_cliente', entidad: 'cliente', entidad_id: clienteId, modulo_origen: 'clientes', cliente_id: clienteId, autor_id: user?.id })
        setMenuClienteId(null); fetchClientes()
    }

    if (fichaId) return <FichaCliente clienteId={fichaId} onBack={() => { setFichaId(null); fetchClientes() }} />

    return (
        <div className="p-4" style={{ background: T.page, minHeight: '100%' }}>
            {/* Search + add */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: T.p3 }} />
                    <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar cliente..."
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm outline-none"
                        style={{ background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.1)', color: T.p1 }} />
                </div>
                <button onClick={() => setShowCrear(true)}
                    className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-black text-base shrink-0 transition-all active:scale-95"
                    style={btnPrimary}>
                    <Plus className="w-5 h-5" /> Nuevo
                </button>
            </div>

            <p className="text-xs mb-4 font-bold" style={{ color: T.p3 }}>{filtrados.length} cliente{filtrados.length !== 1 ? 's' : ''}</p>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin" style={{ color: T.blue }} /></div>
            ) : filtrados.length > 0 ? (
                <div className="space-y-2.5">
                    {filtrados.map(c => {
                        const est = c.clientes_estructura?.[0]
                        const archivado = est?.estado === 'archivado'
                        return (
                            <div key={c.id}
                                className={cn('flex items-center gap-4 rounded-2xl p-4 relative transition-all', !archivado && 'cursor-pointer active:scale-[0.99]')}
                                style={{ background: T.card, border: T.cardBorder, boxShadow: T.cardShadow, opacity: archivado ? 0.55 : 1 }}
                                onClick={() => !archivado && setFichaId(c.id)}>
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 text-white" style={{
                                    background: archivado ? '#adb5c7' : 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)',
                                    boxShadow: archivado ? 'none' : '0 4px 14px rgba(37,99,235,0.28)'
                                }}>
                                    {c.nombre?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm tracking-tight truncate" style={{ color: T.p1 }}>{c.nombre}</p>
                                    <p className="text-xs mt-0.5 truncate font-medium" style={{ color: T.p3 }}>
                                        {est ? `${est.sesiones_semanales} ses/sem · ${est.precio_por_sesion}€` : 'Sin estructura'}
                                    </p>
                                </div>
                                {archivado && (<span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: '#dde1ea', color: T.p3 }}>Archivado</span>)}
                                <div className="relative">
                                    <button onClick={e => { e.stopPropagation(); setMenuClienteId(menuClienteId === c.id ? null : c.id) }}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-black/8"
                                        style={{ color: T.p3 }}>
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                    {menuClienteId === c.id && (
                                        <div className="absolute right-0 top-full mt-1 w-44 z-50 rounded-2xl overflow-hidden" style={{ background: '#f6f8fc', border: '1.5px solid rgba(0,0,0,0.1)', boxShadow: '0 16px 48px rgba(0,0,0,0.16)' }}>
                                            <button onClick={e => { e.stopPropagation(); setFichaId(c.id); setMenuClienteId(null) }}
                                                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold transition-colors hover:bg-black/5"
                                                style={{ color: T.p1 }}>
                                                <User2 className="w-4 h-4" style={{ color: T.blue }} /> Ver ficha
                                            </button>
                                            {!archivado && (
                                                <button onClick={e => { e.stopPropagation(); handleArchivar(c.id) }}
                                                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold transition-colors hover:bg-amber-50"
                                                    style={{ color: T.amber, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                                                    <Archive className="w-4 h-4" /> Archivar
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.09)' }}>
                        <User2 className="w-8 h-8" style={{ color: T.p3 }} />
                    </div>
                    <p className="font-medium" style={{ color: T.p3 }}>{busqueda ? 'Sin resultados para esa búsqueda' : 'No hay clientes aún'}</p>
                </div>
            )}

            {showCrear && <ModalCrearCliente onClose={() => setShowCrear(false)} onCreated={() => fetchClientes()} />}
            {menuClienteId && <div className="fixed inset-0 z-40" onClick={() => setMenuClienteId(null)} />}
        </div>
    )
}

export { ModalCrearCliente }
export default OwnerClientes
