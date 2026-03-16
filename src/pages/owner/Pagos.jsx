import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { logRegistro } from '../../utils/registro'
import { Plus, Loader2, Check, X, DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

const T = {
    page: '#eaecf1',
    card: 'linear-gradient(145deg,#f6f8fc 0%,#eef1f6 100%)',
    cardBorder: '1px solid rgba(0,0,0,0.09)',
    cardShadow: '0 2px 14px rgba(0,0,0,0.07)',
    inp: { background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '14px', padding: '12px 16px', color: '#0d1117', fontSize: '14px', outline: 'none', width: '100%' },
    blue: '#2563eb', blueBg: 'rgba(37,99,235,0.09)', blueBorder: 'rgba(37,99,235,0.28)',
    green: '#16a34a', greenBg: 'rgba(22,163,74,0.09)', greenBorder: 'rgba(22,163,74,0.28)',
    red: '#dc2626', amber: '#d97706', purple: '#7c3aed',
    p1: '#0d1117', p2: '#5a6278', p3: '#8890a4',
}

const lbl = { fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: T.p3, display: 'block', marginBottom: '6px' }

// ── Modal Registrar Pago ──────────────────────────────────────────────────────
const ModalRegistrarPago = ({ onClose, onSaved }) => {
    const { user } = useAuth()
    const [clientes, setClientes] = useState([])
    const [sesiones, setSesiones] = useState([])
    const [form, setForm] = useState({ cliente_id: '', sesion_id: '', importe: '', fecha_pago: format(new Date(), 'yyyy-MM-dd'), metodo: 'efectivo', notas: '' })
    const [loading, setLoading] = useState(false)
    const [loadingSes, setLoadingSes] = useState(false)

    useEffect(() => {
        supabase.from('usuarios').select('id,nombre').eq('rol', 'cliente').order('nombre').then(({ data }) => setClientes(data || []))
    }, [])
    useEffect(() => {
        if (!form.cliente_id) { setSesiones([]); return }
        setLoadingSes(true)
        supabase.from('sesiones').select('*').eq('cliente_id', form.cliente_id).eq('estado', 'realizada').eq('pago_estado', 'pendiente').order('fecha', { ascending: false })
            .then(({ data }) => { setSesiones(data || []); setLoadingSes(false) })
    }, [form.cliente_id])

    const handleSubmit = async () => {
        if (!form.cliente_id || !form.importe) return
        setLoading(true)
        try {
            const { data: pago, error } = await supabase.from('pagos').insert({
                cliente_id: form.cliente_id, owner_id: user?.id,
                sesion_id: form.sesion_id || null,
                importe: parseFloat(form.importe), fecha_pago: form.fecha_pago,
                metodo: form.metodo, notas: form.notas
            }).select().single()
            if (error) throw error
            if (form.sesion_id) await supabase.from('sesiones').update({ pago_estado: 'pagado', pago_fecha: form.fecha_pago }).eq('id', form.sesion_id)
            await logRegistro({ accion: 'registrar_pago', entidad: 'pago', entidad_id: pago.id, modulo_origen: 'pagos', cliente_id: form.cliente_id, valor_nuevo: { importe: form.importe, fecha: form.fecha_pago }, impacto_economico: parseFloat(form.importe), autor_id: user?.id })
            onSaved(); onClose()
        } catch (e) { alert(e.message) }
        finally { setLoading(false) }
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6"
            style={{ background: 'rgba(13,17,32,0.6)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6" style={{
                background: 'linear-gradient(160deg,#f6f8fc 0%,#eef1f6 100%)',
                border: '1.5px solid rgba(0,0,0,0.1)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.22)'
            }}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-base font-black tracking-tight" style={{ color: T.p1 }}>Registrar pago</h3>
                        <p className="text-xs mt-0.5" style={{ color: T.p3 }}>Nuevo registro económico</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl transition-colors"
                        style={{ background: '#e9ecf3', border: '1px solid rgba(0,0,0,0.1)' }}>
                        <X className="w-4 h-4" style={{ color: T.p2 }} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label style={lbl}>Cliente *</label>
                        <select value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value, sesion_id: '' }))} style={T.inp}>
                            <option value="">Seleccionar cliente...</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>
                    {form.cliente_id && (
                        <div>
                            <label style={lbl}>Sesión (opcional)</label>
                            <select value={form.sesion_id} onChange={e => setForm(f => ({ ...f, sesion_id: e.target.value }))} style={T.inp}>
                                <option value="">Sin vincular sesión</option>
                                {loadingSes ? <option disabled>Cargando...</option> :
                                    sesiones.map(s => <option key={s.id} value={s.id}>{s.fecha} {s.hora_inicio}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label style={lbl}>Importe (€) *</label>
                            <input type="number" min="0" step="0.01" value={form.importe} onChange={e => setForm(f => ({ ...f, importe: e.target.value }))} style={T.inp} placeholder="0.00" />
                        </div>
                        <div>
                            <label style={lbl}>Fecha</label>
                            <input type="date" value={form.fecha_pago} onChange={e => setForm(f => ({ ...f, fecha_pago: e.target.value }))} style={T.inp} />
                        </div>
                    </div>
                    <div>
                        <label style={lbl}>Método</label>
                        <select value={form.metodo} onChange={e => setForm(f => ({ ...f, metodo: e.target.value }))} style={T.inp}>
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="bizum">Bizum</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={handleSubmit} disabled={loading || !form.cliente_id || !form.importe}
                        className="flex-1 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40 active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)', color: '#fff', border: '1px solid rgba(37,99,235,0.4)', boxShadow: '0 4px 18px rgba(37,99,235,0.3)' }}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Registrar
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

const StatCard = ({ label, value, color, icon: Icon }) => (
    <div className="rounded-2xl p-4 text-center" style={{
        background: 'linear-gradient(145deg,#f6f8fc 0%,#eef1f6 100%)',
        border: `1.5px solid rgba(0,0,0,0.08)`,
        boxShadow: '0 2px 14px rgba(0,0,0,0.07)'
    }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${color}14`, border: `1.5px solid ${color}28` }}>
            <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <p className="text-xl font-black tracking-tight" style={{ color }}>{value}</p>
        <p className="text-[9px] font-black uppercase tracking-wider mt-0.5" style={{ color: T.p3 }}>{label}</p>
    </div>
)

const Pagos = () => {
    const { user } = useAuth()
    const [pagos, setPagos] = useState([])
    const [sesiones, setSesiones] = useState([])
    const [clientes, setClientes] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [tabActiva, setTabActiva] = useState('global')
    const [clienteSeleccionado, setClienteSeleccionado] = useState('')

    const fetchData = async () => {
        setLoading(true)
        const [{ data: pgs }, { data: ses }, { data: clis }] = await Promise.all([
            supabase.from('pagos').select('*,clientes:usuarios!pagos_cliente_id_fkey(nombre)').order('fecha_pago', { ascending: false }),
            supabase.from('sesiones').select('*,clientes:usuarios!sesiones_cliente_id_fkey(nombre)').order('fecha', { ascending: false }),
            supabase.from('usuarios').select('id,nombre').eq('rol', 'cliente').order('nombre')
        ])
        setPagos(pgs || []); setSesiones(ses || []); setClientes(clis || [])
        setLoading(false)
    }
    useEffect(() => { fetchData() }, [])

    const mes = new Date().getMonth(); const anio = new Date().getFullYear()
    const pagosMes = pagos.filter(p => { const d = new Date(p.fecha_pago); return d.getMonth() === mes && d.getFullYear() === anio })
    const totalMes = pagosMes.reduce((a, p) => a + parseFloat(p.importe || 0), 0)
    const totalPendiente = sesiones.filter(s => s.estado === 'realizada' && s.pago_estado === 'pendiente').reduce((a, s) => a + (parseFloat(s.importe) || 0), 0)

    const handleTogglePago = async sesion => {
        const np = sesion.pago_estado === 'pendiente' ? 'pagado' : 'pendiente'
        await supabase.from('sesiones').update({ pago_estado: np, pago_fecha: np === 'pagado' ? format(new Date(), 'yyyy-MM-dd') : null }).eq('id', sesion.id)
        await logRegistro({ accion: np === 'pagado' ? 'marcar_pagada' : 'marcar_pendiente', entidad: 'sesion', entidad_id: sesion.id, modulo_origen: 'pagos', cliente_id: sesion.cliente_id, valor_anterior: { pago_estado: sesion.pago_estado }, valor_nuevo: { pago_estado: np }, autor_id: user?.id })
        fetchData()
    }

    const sesFiltradas = clienteSeleccionado ? sesiones.filter(s => s.cliente_id === clienteSeleccionado) : sesiones

    const clientesResumen = clientes.map(c => {
        const sesCli = sesiones.filter(s => s.cliente_id === c.id)
        const realizadas = sesCli.filter(s => s.estado === 'realizada')
        const pagadas = realizadas.filter(s => s.pago_estado === 'pagado')
        const pendientes = realizadas.filter(s => s.pago_estado === 'pendiente')
        const pagosCli = pagos.filter(p => p.cliente_id === c.id)
        return { ...c, realizadas: realizadas.length, pagadas: pagadas.length, pendientes: pendientes.length, totalPagado: pagosCli.reduce((a, p) => a + parseFloat(p.importe || 0), 0), totalPend: pendientes.reduce((a, s) => a + (parseFloat(s.importe) || 0), 0) }
    }).filter(c => c.realizadas > 0)

    const TABS = [['global', 'Global'], ['por_cliente', 'Clientes'], ['sesiones', 'Sesiones']]

    return (
        <div className="p-4" style={{ background: T.page, minHeight: '100%' }}>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-xl font-black tracking-tight" style={{ color: T.p1 }}>Pagos</h2>
                    <p className="text-xs mt-0.5 font-medium" style={{ color: T.p3 }}>Control económico</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-base transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)', color: '#fff', border: '1px solid rgba(37,99,235,0.4)', boxShadow: '0 4px 16px rgba(37,99,235,0.28)' }}>
                    <Plus className="w-5 h-5" /> Registrar
                </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
                <StatCard label="Este mes" value={`${totalMes.toFixed(0)}€`} color={T.green} icon={TrendingUp} />
                <StatCard label="Pendiente" value={`${totalPendiente.toFixed(0)}€`} color={T.amber} icon={Clock} />
                <StatCard label="Registros" value={pagos.length} color={T.purple} icon={DollarSign} />
            </div>

            <div className="flex gap-1 p-1 rounded-2xl mb-5" style={{ background: '#dde1ea', border: '1px solid rgba(0,0,0,0.08)' }}>
                {TABS.map(([id, label]) => (
                    <button key={id} onClick={() => setTabActiva(id)}
                        className="flex-1 py-3 rounded-xl text-sm font-black transition-all"
                        style={tabActiva === id ? {
                            background: 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)',
                            color: '#fff',
                            boxShadow: '0 2px 12px rgba(37,99,235,0.3)'
                        } : { background: 'transparent', color: T.p2 }}>
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin" style={{ color: T.blue }} /></div>
            ) : tabActiva === 'global' ? (
                <div className="space-y-2">
                    {pagos.length > 0 ? pagos.map(p => (
                        <div key={p.id} className="flex items-center gap-3 px-4 py-4 rounded-2xl" style={{ background: T.card, border: T.cardBorder, boxShadow: T.cardShadow }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.greenBg, border: `1.5px solid ${T.greenBorder}` }}>
                                <DollarSign className="w-5 h-5" style={{ color: T.green }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-sm tracking-tight" style={{ color: T.p1 }}>{p.clientes?.nombre}</p>
                                <p className="text-xs font-medium mt-0.5" style={{ color: T.p3 }}>{p.fecha_pago} · <span className="capitalize">{p.metodo}</span></p>
                            </div>
                            <p className="font-black text-lg" style={{ color: T.green }}>{parseFloat(p.importe).toFixed(2)}€</p>
                        </div>
                    )) : (
                        <div className="text-center py-16 rounded-2xl" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
                            <DollarSign className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(0,0,0,0.15)' }} />
                            <p style={{ color: T.p3 }}>Sin pagos registrados</p>
                        </div>
                    )}
                </div>
            ) : tabActiva === 'por_cliente' ? (
                <div className="space-y-3">
                    {clientesResumen.map(c => (
                        <div key={c.id} className="rounded-2xl p-4" style={{ background: T.card, border: T.cardBorder, boxShadow: T.cardShadow }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0" style={{ background: T.blueBg, border: `1.5px solid ${T.blueBorder}`, color: T.blue }}>
                                    {c.nombre?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-black text-sm" style={{ color: T.p1 }}>{c.nombre}</p>
                                    <p className="text-xs font-medium" style={{ color: T.p3 }}>{c.realizadas} sesiones realizadas</p>
                                </div>
                            </div>
                            <div className="h-px mb-4" style={{ background: 'rgba(0,0,0,0.07)' }} />
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <p className="font-black text-base" style={{ color: T.green }}>{c.totalPagado.toFixed(0)}€</p>
                                    <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: T.p3 }}>Cobrado</p>
                                </div>
                                <div>
                                    <p className="font-black text-base" style={{ color: T.amber }}>{c.totalPend.toFixed(0)}€</p>
                                    <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: T.p3 }}>Pendiente</p>
                                </div>
                                <div>
                                    <p className="font-black text-base" style={{ color: T.p2 }}>{c.pagadas}/{c.realizadas}</p>
                                    <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: T.p3 }}>Pagadas</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {clientesResumen.length === 0 && (
                        <div className="text-center py-16">
                            <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(0,0,0,0.15)' }} />
                            <p style={{ color: T.p3 }}>Sin datos económicos</p>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <select value={clienteSeleccionado} onChange={e => setClienteSeleccionado(e.target.value)} className="w-full rounded-2xl mb-4" style={T.inp}>
                        <option value="">Todos los clientes</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                    <div className="space-y-2">
                        {sesFiltradas.filter(s => s.estado === 'realizada').map(s => (
                            <div key={s.id} className="flex items-center gap-3 px-4 py-4 rounded-2xl" style={{ background: T.card, border: T.cardBorder, boxShadow: T.cardShadow }}>
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: s.pago_estado === 'pagado' ? T.green : T.amber, boxShadow: `0 0 8px ${s.pago_estado === 'pagado' ? 'rgba(22,163,74,0.4)' : 'rgba(217,119,6,0.4)'}` }} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm" style={{ color: T.p1 }}>{s.clientes?.nombre}</p>
                                    <p className="text-xs font-medium mt-0.5" style={{ color: T.p3 }}>{s.fecha} · {s.hora_inicio}</p>
                                </div>
                                <button onClick={() => handleTogglePago(s)}
                                    className="px-4 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95"
                                    style={s.pago_estado === 'pagado' ? {
                                        background: T.greenBg, color: T.green, border: `1px solid ${T.greenBorder}`
                                    } : { background: 'rgba(217,119,6,0.1)', color: T.amber, border: '1px solid rgba(217,119,6,0.25)' }}>
                                    {s.pago_estado === 'pagado' ? '✓ Pagada' : 'Pendiente'}
                                </button>
                            </div>
                        ))}
                        {sesFiltradas.filter(s => s.estado === 'realizada').length === 0 && (
                            <p className="text-center py-10 font-medium" style={{ color: T.p3 }}>Sin sesiones realizadas</p>
                        )}
                    </div>
                </div>
            )}

            {showModal && <ModalRegistrarPago onClose={() => setShowModal(false)} onSaved={fetchData} />}
        </div>
    )
}

export default Pagos
